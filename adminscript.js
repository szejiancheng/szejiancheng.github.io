endpoint = 'http://127.0.0.1:8080'


document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.toggle-button');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const formId = 'form' + button.id.slice(-1);
            const formContainer = document.getElementById(formId);
            
            if (formContainer.style.display === 'block') {
                formContainer.style.display = 'none';
            } else {
                closeAllForms();
                formContainer.style.display = 'block';
            }
        });
    });

    function closeAllForms() {
        const allForms = document.querySelectorAll('.form-container');
        allForms.forEach(form => form.style.display = 'none');
    }

    // Example GET request for nodes using the provided API
    let nodes = [];
    let edges = [];

    async function fetchNodes() {
        try {
            const response = await fetch(
                `${endpoint}/nodes`
            ); // Replace with your actual API endpoint
            const data = await response.json(); // Assuming the response is in JSON format
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    async function fetchEdges() {
        try {
            const response = await fetch(
                `${endpoint}/edges`
            );
            const data = await response.json(); // Assuming the response is in JSON format
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
        }

        // You can implement fetchEdges similarly when you have the correct API for edges
        // return [
        //     { id: 'Edge 1' },
        //     { id: 'Edge 2' },
        // ];
    }

    // Populate nodes and edges
    fetchNodes().then(data => nodes = data);
    fetchEdges().then(data => edges = data);

    // Filter dropdowns
    function filterDropdown(inputId, dropdownId, filterFn, formFields = {}) {
        const input = document.getElementById(inputId);
        const dropdown = document.getElementById(dropdownId);
        dropdown.innerHTML = '';
    
        // Check if input is empty and hide the dropdown
        if (input.value.trim() === '') {
            dropdown.style.display = 'none';
            return; // Exit the function early
        }
    
        const filteredItems = filterFn(input.value.toLowerCase());
    
        if (filteredItems.length > 0) {
            dropdown.style.display = 'block';
            filteredItems.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.terminal_name} (${item.country} - ${item.country_code})`;
                li.addEventListener('click', () => {
                    // Use selected item
                    input.value = item.terminal_name; // Set the input value
                    dropdown.style.display = 'none';
    
                    // Populate form fields based on the selected node
                    for (const key in formFields) {
                        if (formFields.hasOwnProperty(key)) {
                            const field = document.getElementById(formFields[key]);
                            if (field) {
                                field.value = item[key]; // Assuming the item has the same keys as your form
                            }
                        }
                    }
                });
                dropdown.appendChild(li);
            });
        } else {
            dropdown.style.display = 'none';
        }
    }

    // Filter for origin dropdown
    function filterOriginDropdown() {
        filterDropdown('originSearchBar', 'originDropdown', (input) => {
            return nodes.filter(node => 
                node.terminal_name.toLowerCase().includes(input) ||
                node.country.toLowerCase().includes(input) ||
                node.country_code.toLowerCase().includes(input)
            );
        });
    }

    // Filter for destination dropdown
    function filterDestinationDropdown() {
        filterDropdown('destinationSearchBar', 'destinationDropdown', (input) => {
            return nodes.filter(node => 
                node.terminal_name.toLowerCase().includes(input) ||
                node.country.toLowerCase().includes(input) ||
                node.country_code.toLowerCase().includes(input)
            );
        });
    }

    // Filter for remove node dropdown
    function filterRemoveNodeDropdown() {
        filterDropdown('removeNodeSearchBar', 'removeNodeDropdown', (input) => {
            return nodes.filter(node => 
                node.terminal_name.toLowerCase().includes(input) ||
                node.country.toLowerCase().includes(input) ||
                node.country_code.toLowerCase().includes(input)
            );
        });
    }

    // Filter for remove edge dropdown
    function filterRemoveEdgeDropdown() {
        const input = document.getElementById('removeEdgeSearchBar').value.toLowerCase();
        const dropdown = document.getElementById('removeEdgeDropdown');
        dropdown.innerHTML = '';

        const filteredEdges = edges.filter(edge => edge.terminal_origin.toLowerCase().includes(input));

        if (filteredEdges.length > 0) {
            dropdown.style.display = 'block';
            filteredEdges.forEach(edge => {
                const li = document.createElement('li');
                li.textContent = edge.terminal_origin;
                li.addEventListener('click', () => {
                    // Use selected edge
                    dropdown.style.display = 'none';
                });
                dropdown.appendChild(li);
            });
        } else {
            dropdown.style.display = 'none';
        }
    }

    // Attach filter functions to the search bars
    document.getElementById('originSearchBar').addEventListener('input', filterOriginDropdown);
    document.getElementById('destinationSearchBar').addEventListener('input', filterDestinationDropdown);
    document.getElementById('removeNodeSearchBar').addEventListener('input', filterRemoveNodeDropdown);
    document.getElementById('removeEdgeSearchBar').addEventListener('input', filterRemoveEdgeDropdown);


    //submit forms

    // Function to handle Add Node form submission
    async function submitAddNodeForm(event) {
        event.preventDefault(); // Prevent the form from refreshing the page
        
        const nodeData = {
            type: document.getElementById('type').value,
            continent: document.getElementById('continent').value,
            country: document.getElementById('country').value,
            country_code: document.getElementById('country_code').value,
            terminal_name: document.getElementById('terminal_name').value,
            latitude: document.getElementById('latitude').value,
            longitude: document.getElementById('longitude').value
        };
        
        try {
            const response = await fetch(`${endpoint}/node`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nodeData)
            });

            if (response.ok) {
                const result = await response.json();
                alert('Node added successfully!');
                // Optionally, refresh data or update the UI
            } else {
                const error = await response.text();
                alert('Error adding node: ' + error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Function to handle Add Connection form submission
    async function submitAddConnectionForm(event) {
        event.preventDefault();
        
        const connectionData = {
            terminal_origin: document.getElementById('originSearchBar').value,
            terminal_destination: document.getElementById('destinationSearchBar').value,
            duration_hours: document.getElementById('duration_hours').value,
            distance_km: document.getElementById('distance_km').value,
            fin_cost_usd_per_tonne: document.getElementById('fin_cost_usd_per_tonne').value,
            env_cost_kt_co2_per_tonne: document.getElementById('env_cost_kt_co2_per_tonne').value,
            mode: document.getElementById('mode').value,
            vehicle: document.getElementById('vehicle').value
        };

        try {
            const response = await fetch(`${endpoint}/edge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(connectionData)
            });

            if (response.ok) {
                const result = await response.json();
                alert('Connection added successfully!');
                // Optionally, refresh data or update the UI
            } else {
                const error = await response.text();
                alert('Error adding connection: ' + error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Function to handle Remove Node form submission
    async function submitRemoveNodeForm(event) {
        event.preventDefault();
        
        const nodeToRemove = document.getElementById('removeNodeSearchBar').value;

        try {
            const response = await fetch(`${endpoint}/node/${nodeToRemove}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Node removed successfully!');
                // Optionally, refresh data or update the UI
            } else {
                const error = await response.text();
                alert('Error removing node: ' + error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Function to handle Remove Edge form submission
    async function submitRemoveEdgeForm(event) {
        event.preventDefault();
        
        const edgeToRemove = document.getElementById('removeEdgeSearchBar').value;

        try {
            const response = await fetch(`${endpoint}/edge/${edgeToRemove}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Edge removed successfully!');
                // Optionally, refresh data or update the UI
            } else {
                const error = await response.text();
                alert('Error removing edge: ' + error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Attach submit handler to Add Node form
    document.getElementById('addNodeForm').addEventListener('submit', submitAddNodeForm);
    document.getElementById('addConnectionForm').addEventListener('submit', submitAddConnectionForm);
    document.getElementById('removeNodeForm').addEventListener('submit', submitRemoveNodeForm);
    document.getElementById('removeEdgeForm').addEventListener('submit', submitRemoveEdgeForm);
});
