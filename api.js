endpoint = 'http://127.0.0.1:8080'

/**
 * Fetches a list of transport nodes and transport options that mark out a path
 * between the given start point and end point.
 *
 * Right now, this is a stub that only returns the path between shanghai and nhava sheva.
 *
 * @param {string} startPoint - The starting point of the path.
 * @param {string} endPoint - The ending point of the path.
 * @returns {Promise<Object>} A promise that resolves to an object containing
 *                            the transport nodes and transport options.
 */

async function fetchNodes() {
  try {
    const response = await fetch(`${endpoint}/nodes`); // Replace with your API
    const data = await response.json(); // Assuming the response is in JSON format
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function getPath(startPoint, endPoint) {
  try {
    const response = await fetch(
      `${endpoint}/path/${startPoint}/${endPoint}/financial`
    );
    console.log(response);
    // TODO: change final URL to reflect actual value function

    const data = await response.json(); // Assuming the response is in JSON format
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function getPathStub(startPoint, endPoint) {
  if (startPoint === endPoint) {
    return Promise.reject(new Error("Start and end points must be different"));
  }

  // const nodes = await fetchNodes();
  // if (nodes) {
  //   startingNode = nodes.filter(node => node)
  // }
  if (
    startPoint === "Yokohama Container Terminal" &&
    endPoint === "Santos Port Rail Terminal"
  ) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          paths: [
            {
              id: 1,
              name: "Path 1",

              path: [
                {
                  id: 1,
                  name: "Yokohama Container Terminal",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "Busan Port",
                  destID: "2",
                  costData: {
                    env: 10,
                    monetary: 10,
                    time: 10,
                  },
                },
                {
                  id: 2,
                  name: "Busan Port",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "Singapore Tuas Port",
                  destID: "3",
                  costData: {
                    env: 10,
                    monetary: 10,
                    time: 10,
                  },
                },
                {
                  id: 3,
                  name: "Singapore Tuas Port",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "Brasil Terminal Portuário Santos",
                  destID: "4",
                  costData: {
                    env: 10,
                    monetary: 10,
                    time: 10,
                  },
                },
                {
                  id: 4,
                  name: "Santos Port Rail Terminal",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "",
                  destID: "0",
                  costData: {
                    env: 0,
                    monetary: 0,
                    time: 0,
                  },
                },
              ],
            },
            {
              id: 2,
              name: "Path 2",
              path: [
                {
                  id: 1,
                  name: "Yokohama Container Terminal",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "Busan Port",
                  destID: "2",
                  costData: {
                    env: 10,
                    monetary: 10,
                    time: 10,
                  },
                },
                {
                  id: 2,
                  name: "Busan Port",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "Tuas Port",
                  destID: "3",
                  costData: {
                    env: 10,
                    monetary: 10,
                    time: 10,
                  },
                },
                {
                  id: 3,
                  name: "Tuas Port",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "Brasil Terminal Portuário",
                  destID: "4",
                  costData: {
                    env: 10,
                    monetary: 10,
                    time: 10,
                  },
                },
                {
                  id: 4,
                  name: "Brasil Terminal Portuário",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "",
                  destID: "0",
                  costData: {
                    env: 0,
                    monetary: 0,
                    time: 0,
                  },
                },
              ],
            },
            {
              id: 3,
              name: "Path 3",
              path: [
                {
                  id: 1,
                  name: "Yokohama Container Terminal",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "Busan Port",
                  destID: "2",
                  costData: {
                    env: 10,
                    monetary: 10,
                    time: 10,
                  },
                },
                {
                  id: 2,
                  name: "Busan Port",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "Tuas Port",
                  destID: "3",
                  costData: {
                    env: 10,
                    monetary: 10,
                    time: 10,
                  },
                },
                {
                  id: 3,
                  name: "Tuas Port",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "Brasil Terminal Portuário",
                  destID: "4",
                  costData: {
                    env: 10,
                    monetary: 10,
                    time: 10,
                  },
                },
                {
                  id: 4,
                  name: "Brasil Terminal Portuário",
                  mode: "sea",
                  vehicle: "container ship",
                  destName: "",
                  destID: "0",
                  costData: {
                    env: 0,
                    monetary: 0,
                    time: 0,
                  },
                },
              ],
            },
          ],
        });
      }, 1000);
    });
  } else {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, 1000);
    });
  }
}
