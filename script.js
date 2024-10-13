let map;
let markers = [];
let infoWindow;
let polyline;
let seaLines = [];
let landLines = [];
let animationInterval;
let selectedNodes = [];
let nodes;

const defaultMarkerIcon = {
  url: "assets/icons/marker.png",
};

const selectedMarkerIcon = {
  url: "assets/icons/marker_inv.png",
};

async function initMap() {
  const worldCenter = { lat: 0, lng: 0 };

  const bounds = {
    north: 85,
    south: -85,
    west: -179.999,
    east: 179.999,
  };

  const mapStyle = [
    {
      featureType: "all",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#000000" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#222222" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ visibility: "off" }],
    },
  ];

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 2,
    center: worldCenter,
    mapTypeId: "roadmap",
    restriction: {
      latLngBounds: bounds,
      strictBounds: true,
    },
    styles: mapStyle,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    rotateControl: false,
    scaleControl: false,
  });

  google.maps.event.addListener(map, "idle", function () {
    let currentCenter = map.getCenter();
    let currentLng = currentCenter.lng();

    if (currentLng < -180) {
      currentLng = -180;
    } else if (currentLng > 180) {
      currentLng = 180;
    }

    map.setCenter({ lat: currentCenter.lat(), lng: currentLng });
  });

  infoWindow = new google.maps.InfoWindow();

  showLoading(); // Show loading when starting to fetch data

  nodes = await fetchNodes();

  hideLoading();

  nodes.forEach((node) => {
    const marker = new google.maps.Marker({
      position: { lat: node.latitude, lng: node.longitude },
      map: map,
      title: node.terminal_name,
      icon: defaultMarkerIcon,
    });

    marker.addListener("click", () => {
      const countryCode = node.country_code.toLowerCase();

      infoWindow.setContent(`
                <div class="infowindow-content">
                    <span class="flag-icon flag-icon-${countryCode}" style="font-size: 24px;"></span>
                    <h3 class="infowindow-title">${node.terminal_name}</h3>
                    <p>${node.country} (${node.country_code})</p>
                    <button onclick="selectNode('${node.terminal_name}')">Select</button>
                </div>
            `);
      infoWindow.open(map, marker);
    });

    markers.push({ marker, node });
  });
}

function selectNode(portName) {
  const selectedMarkerObj = markers.find(
    (m) => m.node.terminal_name === portName
  );

  if (selectedNodes.length < 2) {
    selectedNodes.push(selectedMarkerObj.node);
    selectedMarkerObj.marker.setIcon(selectedMarkerIcon);
    google.maps.event.clearListeners(selectedMarkerObj.marker, "click");
  } else {
    const previousDestination = selectedNodes[1];
    const previousMarkerObj = markers.find(
      (m) => m.node.terminal_name === previousDestination.name
    );
    if (previousMarkerObj) {
      previousMarkerObj.marker.setIcon(defaultMarkerIcon);
      google.maps.event.addListener(previousMarkerObj.marker, "click", () => {
        infoWindow.setContent(`
                    <div class="infowindow-content">
                        <h3 class="infowindow-title">${previousMarkerObj.node.terminal_name}</h3>
                        <p>${previousMarkerObj.node.country} (${previousMarkerObj.node.country_code})</p>
                        <button onclick="selectNode('${previousMarkerObj.node.terminal_name}')">Select</button>
                    </div>
                `);
        infoWindow.open(map, previousMarkerObj.marker);
      });
    }

    selectedNodes[1] = selectedMarkerObj.node;
    selectedMarkerObj.marker.setIcon(selectedMarkerIcon);
    google.maps.event.clearListeners(selectedMarkerObj.marker, "click");
  }

  infoWindow.close();
  updateJourneyDisplay();

  // If two locations are selected, adjust the bounds to show both nodes
  if (selectedNodes.length === 2) {
    adjustBoundsToShowNodes();
    drawPolyline();
  }
}

function adjustBoundsToShowNodes() {
  const bounds = new google.maps.LatLngBounds();

  const startLatLng = {
    lat: selectedNodes[0].latitude,
    lng: selectedNodes[0].longitude,
  };
  const endLatLng = {
    lat: selectedNodes[1].latitude,
    lng: selectedNodes[1].longitude,
  };

  // Extend the bounds to include both the start and destination nodes
  bounds.extend(startLatLng);
  bounds.extend(endLatLng);

  // Adjust the map to fit these bounds
  map.fitBounds(bounds);
}

function drawPolyline() {
  if (polyline) polyline.setMap(null);
  if (animationInterval) clearInterval(animationInterval);

  const startLatLng = {
    lat: selectedNodes[0].latitude,
    lng: selectedNodes[0].longitude,
  };
  const endLatLng = {
    lat: selectedNodes[1].latitude,
    lng: selectedNodes[1].longitude,
  };

  polyline = new google.maps.Polyline({
    path: [startLatLng, endLatLng],
    geodesic: true,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2,
    icons: [
      {
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 4,
          strokeColor: "#000000",
          fillOpacity: 1,
        },
        offset: "0%",
      },
    ],
    map: map,
  });

  animateArrow();
  zoomToSegment(polyline);
}

function animateArrow() {
  let count = 0;
  animationInterval = setInterval(() => {
    count = (count + 1) % 200;
    const icons = polyline.get("icons");
    icons[0].offset = count / 2 + "%";
    polyline.set("icons", icons);
  }, 20);
}

function updateJourneyDisplay(pathData = null) {
  const journeyDiv = document.getElementById("journey");
  let journeyContent = `
    <h2>Journey:</h2>
    <ul>
        ${
          selectedNodes.length >= 1
            ? `
            <li>
                <span style="font-size: 20px; font-weight: bold;">Start:</span><br>
                <span style="font-size: 18px; font-family:CaviarReg; white-space: nowrap;">${selectedNodes[0].terminal_name}</span><br>
                <span style="font-size: 16px; color: gray;">${selectedNodes[0].country}</span>
            </li>
        `
            : ""
        }
    </ul>
    `;

  // If two locations are selected but no path has been selected yet
  if (selectedNodes.length === 2 && !pathData) {
    journeyContent += `
        <ul>
            <li style="margin-top: 20px;">
                <span style="font-size: 20px; font-weight: bold;">Destination:</span><br>
                <span style="font-size: 18px; font-family:CaviarReg; white-space: nowrap;">${selectedNodes[1].terminal_name}</span><br>
                <span style="font-size: 16px; color: gray;">${selectedNodes[1].country}</span>
            </li>
        </ul>
        <div class="button-container">
            <button onclick="calculateJourney()">Calculate Journey</button>
            <button onclick="clearSelection()">Clear Selection</button>
        </div>
        `;
  }

  // If a path is selected, display the legs between start and destination, hide calculate journey
  if (pathData) {
    journeyContent += `<ul>`;
    pathData.path.forEach((leg, index) => {
      const legId = `journey-leg-${index}`;
      journeyContent += `
                <li onclick="toggleLegData('${legId}')" style="cursor: pointer; margin: 10px 0; padding: 10px; border-radius: 5px; transition: background-color 0.3s;">
                    <span style="font-size: 16px; font-family: CaviarReg;"><strong>${leg.sourceName}</strong> to <strong>${leg.destName}</strong></span>
                    <div id="${legId}" class="cost-data" style="display: none; margin-left: 15px; font-size: 14px; font-family: CaviarReg;">
                        Mode: ${leg.mode}<br>
                        Vehicle: ${leg.vehicle}<br>
                        Environmental Cost: ${leg.costData.env}<br>
                        Monetary Cost: ${leg.costData.monetary}<br>
                        Time Cost: ${leg.costData.time}
                    </div>
                </li>
            `;
    });
    journeyContent += `</ul>`;

    // Add the destination at the end if it's selected
    journeyContent += `
        <ul>
            <li style="margin-top: 20px;">
                <span style="font-size: 20px; font-weight: bold;">Destination:</span><br>
                <span style="font-size: 18px; font-family:CaviarReg; white-space: nowrap;">${selectedNodes[1].terminal_name}</span><br>
                <span style="font-size: 16px; color: gray;">${selectedNodes[1].country}</span>
            </li>
        </ul>
        `;

    // Clear Selection button at the bottom
    journeyContent += `
        <div class="button-container">
            <button onclick="clearSelection()">Clear Selection</button>
        </div>
        `;
  }

  journeyDiv.innerHTML = journeyContent;

  // Add hover effect for the leg elements
  const legItems = journeyDiv.querySelectorAll("li[onclick]");
  legItems.forEach((item) => {
    item.addEventListener("mouseover", () => {
      item.style.backgroundColor = "#f0f0f0"; // Light grey background on hover
      item.style.color = "black";
    });
    item.addEventListener("mouseout", () => {
      item.style.backgroundColor = ""; // Reset background color when not hovered
      item.style.color = "white";
    });
  });
}

function toggleLegData(legId) {
  const costDataDiv = document.getElementById(legId);
  costDataDiv.style.display =
    costDataDiv.style.display === "none" ? "block" : "none";
}

function clearSelection() {
  selectedNodes = [];
  markers.forEach((m) => {
    m.marker.setIcon(defaultMarkerIcon);
    google.maps.event.clearListeners(m.marker, "click");
    m.marker.addListener("click", () => {
      const countryCode = m.node.country_code.toLowerCase();
      infoWindow.setContent(`
                <div class="infowindow-content">
                    <span class="flag-icon flag-icon-${countryCode}" style="font-size: 24px;"></span>
                    <h3 class="infowindow-title">${m.node.terminal_name}</h3>
                    <p>${m.node.terminal_name} (${m.node.country_code})</p>
                    <button onclick="selectNode('${m.node.terminal_name}')">Select</button>
                </div>
            `);
      infoWindow.open(map, m.marker);
    });
  });

  // Clear the polyline if it exists
  if (polyline) {
    polyline.setMap(null); // Remove polyline from the map
    polyline = null; // Reset polyline to null
  }

  if (seaLines.length != 0) {
    seaLines.forEach((line) => {
      line.setMap(null);
    });
    seaLines = [];
  }
  if (landLines.length != 0) {
    landLines.forEach((line) => {
      line.setMap(null);
    });
    landLines = [];
  }

  if (animationInterval) clearInterval(animationInterval); // Clear any running animation

  updateJourneyDisplay(); // Update the journey modal to reflect the cleared selection
}

async function calculateJourney() {
  const start = selectedNodes[0].terminal_name;
  const destination = selectedNodes[1].terminal_name;

  showLoading(); // Show loading overlay when calculating journey

  try {
    await fetchNodes();
    const pathData = await getPath(start, destination);
    console.log("Path data:", pathData);
    if (pathData && pathData.length > 0) {
      updatePathDisplay(pathData);
    } else {
      alert("No path found between the selected ports.");
    }
  } catch (error) {
    console.error("Error calculating journey:", error);
    alert("There was an error calculating the journey.");
  } finally {
    hideLoading(); // Hide loading once calculation is done
  }
}

function updatePathDisplay(pathData) {
  let modalDiv = document.querySelector(".modal");
  if (!modalDiv) {
    modalDiv = document.createElement("div");
    modalDiv.classList.add("modal");
    document.body.appendChild(modalDiv);
  }

  let modalContent = `
        <div class="modal-content">
            <h2>Select a Journey Path</h2>
            <div class="paths-container">`;

  pathData.forEach((pathObj, pathIndex) => {
    let totalEnvCost = pathObj.costData.env;
    let totalMonetaryCost = pathObj.costData.fin;
    let totalTimeCost = pathObj.costData.time;

    // Icons based on the properties
    let icons = "";
    if (pathObj.isCost === true) {
      icons += `
            <div class="icon-container">
                <img src="assets/icons/cost.png" alt="Cost Effective" class="icon" data-tooltip="This is the most cost-efficient route">
            </div>`;
    }
    if (pathObj.isGreen === true) {
      icons += `
            <div class="icon-container">
                <img src="assets/icons/sustainability.png" alt="Sustainable" class="icon" data-tooltip="This route is environmentally sustainable">
            </div>`;
    }
    if (pathObj.isFast === true) {
      icons += `
            <div class="icon-container">
                <img src="assets/icons/time.png" alt="Fast" class="icon" data-tooltip="This is the fastest route">
            </div>`;
    }

    modalContent += `
            <div class="path-option">
                <h3>${pathObj.name}</h3>
                <div class="path-icons">
                    ${icons}
                </div>
                <div class="vertical-timeline">`;

    // Loop through each leg of the journey
    pathObj.path.forEach((leg, legIndex) => {
      console.log("leg: " + JSON.stringify(leg));

      const legId = `leg-${pathIndex}-${legIndex}`; // Unique ID for each leg

      modalContent += `
                    <div class="timeline-leg">
                        <div class="timeline-dot"></div>
                        <button class="show-leg-data" onclick="toggleLegData('${legId}')">
                            <strong>${leg.sourceName}</strong>
                            
                            <div id="${legId}" class="cost-data" style="display: none;">
                                <span>Mode: ${leg.mode}</span><br>
                                <span>Vehicle: ${leg.vehicle}</span><br>
                                <span>Environmental Cost: ${leg.costData.env}</span><br>
                                <span>Financial Cost: ${leg.costData.fin}</span><br>
                                <span>Time Cost: ${leg.costData.time}</span>
                            </div>
                        </button>
                    </div>`;
    });
    modalContent += `
                    <div class="timeline-leg">
                        <div class="timeline-dot"></div>
                        <div class="destination-container">
                            <strong>${pathObj.endNode}</strong><br>
                        </div>
                    </div>`;

    // Display the cumulative costs at the bottom of each path
    modalContent += `
                </div>
                <div class="cumulative-costs">
                    <strong>Cumulative Costs:</strong><br>
                    <small>Environmental Cost: ${totalEnvCost}</small><br>
                    <small>Monetary Cost: ${totalMonetaryCost}</small><br>
                    <small>Duration: ${totalTimeCost}</small>
                </div>
                <button class="select-path" data-path='${JSON.stringify(
                  pathObj
                )}' onclick="selectPath(this)">Select Path</button>
            </div>`;
  });

  modalContent += `
            </div>
            <button class="close-modal" onclick="closeModal()">&#10005;</button>
        </div>
    `;

  modalDiv.innerHTML = modalContent;

  // Display the modal and trigger the animation
  setTimeout(() => {
    modalDiv.classList.add("show");
  }, 10);
}

function toggleLegData(legId) {
  const costDataDiv = document.getElementById(legId);
  if (costDataDiv.style.display === "none") {
    costDataDiv.style.display = "block"; // Show cost data
  } else {
    costDataDiv.style.display = "none"; // Hide cost data
  }
}

function closeModal() {
  const modal = document.querySelector(".modal");
  if (modal) {
    modal.classList.remove("show"); // Remove the show class for the slide-down animation

    // Remove the modal after the animation completes
    setTimeout(() => {
      modal.remove(); // Remove the modal from the DOM
    }, 500); // Wait for the animation duration (0.5s) before removing
  }
}

function selectPath(button) {
  const selectedPathObj = JSON.parse(button.getAttribute("data-path"));
  closeModal(); // Close the journey selection modal
  updateJourneyDisplay(selectedPathObj); // Update the journey modal with the selected path and legs
  plotPath(selectedPathObj); // Plot the selected path on the map
}

function filterDropdown() {
  const input = document.getElementById("searchBar").value.toLowerCase();
  const dropdown = document.getElementById("dropdown");
  dropdown.innerHTML = "";

  const filteredPorts = nodes.filter((port) => {
    return (
      port.terminal_name.toLowerCase().includes(input) ||
      port.country.toLowerCase().includes(input) ||
      port.country_code.toLowerCase().includes(input)
    );
  });

  if (filteredPorts.length > 0) {
    dropdown.style.display = "block";
    filteredPorts.forEach((port) => {
      const li = document.createElement("li");
      li.textContent = `${port.terminal_name} (${port.country} - ${port.country_code})`;
      li.addEventListener("click", () => {
        zoomToPort(port);
        dropdown.style.display = "none";
      });
      dropdown.appendChild(li);
    });
  } else {
    dropdown.style.display = "none";
  }
}

function zoomToPort(port) {
  map.setZoom(8);
  map.setCenter({ lat: port.latitude, lng: port.longitude });
}

function zoomToSegment(polyline) {
  const bounds = new google.maps.LatLngBounds();

  // Loop through the polyline path and extend the bounds
  polyline.getPath().forEach(function (latLng) {
    bounds.extend(latLng);
  });

  // Adjust the map to fit the polyline within the bounds
  map.fitBounds(bounds);
}

async function plotPath(selectedPath) {
  if (!selectedPath || !selectedPath.path || selectedPath.path.length === 0) {
    console.error("Invalid path data.");
    return;
  }

  // Clear previous polyline and animation
  if (polyline) polyline.setMap(null);
  if (animationInterval) clearInterval(animationInterval);

  console.log(selectedPath.path);

  // Create a LatLngBounds object to fit the entire path
  const bounds = new google.maps.LatLngBounds();

  // Loop through each leg in the selectedPath and call the appropriate function based on the mode
  for (const leg of selectedPath.path) {
    const legStart = { lat: leg.sourceLat, lng: leg.sourceLon };
    const legEnd = { lat: leg.destLat, lng: leg.destLon };

    // Extend the bounds to include this leg
    bounds.extend(legStart);
    bounds.extend(legEnd);

    if (leg.mode === "Road" || leg.mode === "Rail") {
      await plotLand(leg); // Call plotLand for land segments
    } else if (leg.mode === "Sea") {
      await plotSea(leg); // Call plotSea for sea segments
    } else if (leg.mode === "air") {
      // Optional: plotAir(leg);
      await plotAir(leg); // For now, plot air segments as sea segments
    } else {
      console.error("Unknown mode:", leg.mode);
    }
  }

  // Zoom the map to fit the entire path
  map.fitBounds(bounds);
}

async function plotLand(leg) {
  const startLong = leg.sourceLon;
  const startLat = leg.sourceLat;
  const endLong = leg.destLon;
  const endLat = leg.destLat;

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: true, // Hide default markers, you can customize them
    suppressInfoWindows: true, // Disable labels or info windows
    polylineOptions: {
      strokeColor: "#FF0000", // Red for land routes
      strokeOpacity: 1.0,
      strokeWeight: 2,
    },
  });

  directionsRenderer.setMap(map); // Set the renderer to your map

  const request = {
    origin: { lat: startLat, lng: startLong },
    destination: { lat: endLat, lng: endLong },
    travelMode: google.maps.TravelMode.DRIVING, // Use 'DRIVING' for road-based routes
  };

  directionsService.route(request, (result, status) => {
    if (status === "OK") {
      directionsRenderer.setDirections(result);
      landLines.push(directionsRenderer);
    } else {
      plotLandStraight(leg);
      console.error("Directions request failed due to " + status);
    }
  });

  // Add a click event to zoom into this leg when clicked
  directionsRenderer.addListener("click", () => {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: startLat, lng: startLong });
    bounds.extend({ lat: endLat, lng: endLong });
    map.fitBounds(bounds);
  });
}

async function plotSea(leg) {
  const startLong = leg.sourceLon;
  const startLat = leg.sourceLat;
  const endLong = leg.destLon;
  const endLat = leg.destLat;

  const segmentPath = [
    { lat: startLat, lng: startLong },
    { lat: endLat, lng: endLong },
  ];

  const segmentPolyline = new google.maps.Polyline({
    path: segmentPath,
    strokeColor: "blue",
    strokeOpacity: 1.0,
    strokeWeight: 2,
  });

  // Add the segment polyline to the map
  segmentPolyline.setMap(map);
  seaLines.push(segmentPolyline);

  // Add click listener to zoom in on the segment and show details
  segmentPolyline.addListener("click", () => {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: startLat, lng: startLong });
    bounds.extend({ lat: endLat, lng: endLong });
    map.fitBounds(bounds);
    showLegDetails(leg); // Optional: function to display details of the clicked leg
  });
}

async function plotLandStraight(leg) {
  const startLong = leg.sourceLon;
  const startLat = leg.sourceLat;
  const endLong = leg.destLon;
  const endLat = leg.destLat;

  const segmentPath = [
    { lat: startLat, lng: startLong },
    { lat: endLat, lng: endLong },
  ];

  const segmentPolyline = new google.maps.Polyline({
    path: segmentPath,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2,
  });

  // Add the segment polyline to the map
  segmentPolyline.setMap(map);
  seaLines.push(segmentPolyline);

  // Add click listener to zoom in on the segment and show details
  segmentPolyline.addListener("click", () => {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: startLat, lng: startLong });
    bounds.extend({ lat: endLat, lng: endLong });
    map.fitBounds(bounds);
    showLegDetails(leg); // Optional: function to display details of the clicked leg
  });
}

async function plotAir(leg) {
  const startLong = leg.sourceLon;
  const startLat = leg.sourceLat;
  const endLong = leg.destLon;
  const endLat = leg.destLat;

  const segmentPath = [
    { lat: startLat, lng: startLong },
    { lat: endLat, lng: endLong },
  ];

  const segmentPolyline = new google.maps.Polyline({
    path: segmentPath,
    strokeColor: "yellow",
    strokeOpacity: 1.0,
    strokeWeight: 2,
  });

  // Add the segment polyline to the map
  segmentPolyline.setMap(map);
  seaLines.push(segmentPolyline);

  // Add click listener to zoom in on the segment and show details
  segmentPolyline.addListener("click", () => {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: startLat, lng: startLong });
    bounds.extend({ lat: endLat, lng: endLong });
    map.fitBounds(bounds);
    showLegDetails(leg); // Optional: function to display details of the clicked leg
  });
}

// function showLegDetails(leg) {
//     // Create a modal or sidebar, or display in an info window
//     const legDetails = `
//         <div>
//             <strong>Origin: ${leg.name}</strong><br>
//             <small>to</small><br>
//             <strong>Destination: ${leg.destName}</strong><br>
//             Mode: ${leg.mode}<br>
//             Vehicle: ${leg.vehicle}<br>
//             Environmental Cost: ${leg.costData.env}<br>
//             Monetary Cost: ${leg.costData.monetary}<br>
//             Time Cost: ${leg.costData.time}
//         </div>
//     `;

//     // Example: Using an InfoWindow to show details
//     const infoWindow = new google.maps.InfoWindow({
//         content: legDetails,
//         position: { lat: leg.endLat, lng: leg.endLng }
//     });

//     infoWindow.open(map);
// }

function showLoading() {
  document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}
