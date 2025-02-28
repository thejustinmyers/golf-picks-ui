document.addEventListener("DOMContentLoaded", () => {
    const draftTable = document.getElementById("draft-table");
    const draftCells = draftTable.querySelectorAll('td[contenteditable="true"]');

    // Only allow letters and spaces in contenteditable cells
    draftCells.forEach(cell => {
        cell.addEventListener('input', function () {
            this.textContent = this.textContent.replace(/[^a-zA-Z\s]/g, '');
        });
    });

    // Fetch odds and populate table
    document.getElementById("fetch-odds-button").addEventListener("click", () => {
        const tournamentName = document.getElementById("tournament-selection").value;

        if (!tournamentName) {
            alert("Please enter a tournament name.");
            return;
        }

        fetch(`http://0.0.0.0:8000/odds/${tournamentName}`)
            .then(response => response.json())
            .then(data => {
                const oddsTable = document.getElementById('odds-table');
                oddsTable.innerHTML = ''; // Clear previous data

                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');

                headerRow.innerHTML = "<th>Player</th><th>Odds</th>";
                thead.appendChild(headerRow);
                oddsTable.appendChild(thead);

                const tbody = document.createElement('tbody');
                Object.entries(data).forEach(([name, odds]) => {
                    const row = document.createElement('tr');

                    const nameCell = document.createElement('td');
                    nameCell.textContent = name;
                    nameCell.style.cursor = "pointer"; // Indicate it's clickable
                    nameCell.addEventListener("click", () => addToDraftTable(name));

                    const oddsCell = document.createElement('td');
                    oddsCell.textContent = odds;

                    row.appendChild(nameCell);
                    row.appendChild(oddsCell);
                    tbody.appendChild(row);
                });

                oddsTable.appendChild(tbody);
            })
            .catch(error => {
                console.error("Error fetching player odds:", error);
                alert("Failed to fetch player odds. Please try again later.");
            });
    });

    // Function to add player from odds table to the draft table
    function addToDraftTable(playerName) {
        const emptyCell = [...draftTable.querySelectorAll('td[contenteditable="true"]')]
            .find(cell => cell.textContent.trim() === '');

        if (emptyCell) {
            emptyCell.textContent = playerName;
        } else {
            alert("No empty slots available in the draft table.");
        }
    }

    // Save draft table as CSV
    document.getElementById("save-csv-button").addEventListener("click", () => {
        const rows = Array.from(draftTable.querySelectorAll('tr'));
        const csvData = rows.map(row => 
            Array.from(row.querySelectorAll('th, td'))
                .map(cell => `"${cell.textContent.replace(/"/g, '""')}"`)
                .join(',')
        );

        const csvString = csvData.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'draft_table.csv';
        link.click();
    });

    // Shuffle draft order (headers only)
    document.getElementById("shuffle-draft-order-button").addEventListener("click", () => {
        const headerCells = Array.from(draftTable.querySelectorAll('thead th'));
        const names = headerCells.map(th => th.textContent);

        // Shuffle names using Fisher-Yates shuffle
        for (let i = names.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [names[i], names[j]] = [names[j], names[i]];
        }

        // Update table headers
        headerCells.forEach((th, index) => {
            th.textContent = names[index];
        });
    });

});
