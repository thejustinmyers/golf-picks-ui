document.addEventListener("DOMContentLoaded", () => {

    // Get all the contenteditable cells in the draft table
    const draftCells = document.querySelectorAll('#draft-table td[contenteditable="true"]');

    draftCells.forEach(cell => {
        cell.addEventListener('input', function () {
            // Allow only letters and spaces
            this.textContent = this.textContent.replace(/[^a-zA-Z\s]/g, '');
        });
    });

    // Fetch the player names and odds from the API based on tournament input
    document.getElementById("fetch-odds-button").addEventListener("click", () => {
        const tournamentName = document.getElementById("tournament-selection").value;

        if (!tournamentName) {
            alert("Please enter a tournament name.");
            return;
        }

        // Fetch odds from the API based on the tournament name
        fetch(`http://0.0.0.0:8000/odds/${tournamentName}`)
            .then(response => response.json())
            .then(data => {
                // Assuming the response is like: {"Scottie Scheffler": "+500", "Rory McIlroy": "+1000", "Xander Schauffele": "+1100"}
                const nameListTable = document.getElementById('odds-table');

                // Clear any previous data
                nameListTable.innerHTML = '';

                // Create the table header
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');

                const headerName = document.createElement('th');
                headerName.textContent = "Player";

                const headerOdds = document.createElement('th');
                headerOdds.textContent = "Odds";

                headerRow.appendChild(headerName);
                headerRow.appendChild(headerOdds);
                thead.appendChild(headerRow);

                // Append the header to the table
                nameListTable.appendChild(thead);

                // Populate the name list table with players and their odds
                const tbody = document.createElement('tbody');
                Object.entries(data).forEach(([name, odds]) => {
                    const row = document.createElement('tr');

                    const nameCell = document.createElement('td');
                    nameCell.textContent = name;

                    const oddsCell = document.createElement('td');
                    oddsCell.textContent = odds;

                    row.appendChild(nameCell);
                    row.appendChild(oddsCell);

                    tbody.appendChild(row);
                });

                // Append the table body
                nameListTable.appendChild(tbody);

            })
            .catch(error => {
                console.error("Error fetching the player odds:", error);
                alert("Failed to fetch player odds. Please try again later.");
            });
    });

    const saveCsvButton = document.getElementById("save-csv-button");

    saveCsvButton.addEventListener("click", function () {
        const table = document.getElementById("draft-table");
        const rows = Array.from(table.querySelectorAll('tr'));

        const csvData = [];

        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            const rowData = cells.map(cell => {
                return `"${cell.textContent.replace(/"/g, '""')}"`;
            });
            csvData.push(rowData.join(','));
        });

        const csvString = csvData.join('\n');

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'draft_table.csv';
        link.click();
    });

    const shuffleDraftOrderButton = document.getElementById("shuffle-draft-order-button");
    shuffleDraftOrderButton.addEventListener("click", function () {
        const originalNames = [
            'Justin', 'Hen', 'Poz', 'Connor', 'Kev', 'Fran', 'Vitale', 'Reed', 'Guar'
        ];

        // Shuffle the array using Fisher-Yates (Durstenfeld) algorithm
        const shuffledNames = originalNames.slice(); // Copy the array to avoid modifying the original
        for (let i = shuffledNames.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]]; // Swap elements
        }

        // Get all the table header cells
        const headers = document.querySelectorAll('th');

        // Assign the shuffled names back to the headers
        shuffledNames.forEach((name, index) => {
            headers[index].textContent = name;
        });
    });

});
