document.addEventListener("DOMContentLoaded", async () => {
    const draftTable = document.getElementById("draft-table");
    const draftCells = draftTable.querySelectorAll('td[contenteditable="true"]');
    const tournamentSelect = document.getElementById("tournament-selection");

    function formatTournamentName(tournamentId) {
        return tournamentId
            .replace(/-/g, " ")
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    async function loadTournaments() {
        try {
            const response = await fetch("http://0.0.0.0:8000/tournaments");
            if (!response.ok) {
                throw new Error("Failed to fetch tournaments");
            }
            const tournaments = await response.json();
            tournamentSelect.innerHTML = "";
            tournaments.forEach(tournamentId => {
                const option = document.createElement("option");
                option.value = tournamentId;
                option.textContent = formatTournamentName(tournamentId);
                tournamentSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading tournaments:", error);
        }
    }

    await loadTournaments();

    // Only allow letters and spaces in contenteditable cells
    draftCells.forEach(cell => {
        cell.addEventListener("input", function () {
            this.textContent = this.textContent.replace(/[^a-zA-Z\s]/g, "");
        });
    });

    // Fetch odds and populate table
    document.getElementById("fetch-odds-button").addEventListener("click", () => {
        const tournamentName = tournamentSelect.value;

        if (!tournamentName) {
            alert("Please select a tournament.");
            return;
        }

        fetch(`http://0.0.0.0:8000/odds/${tournamentName}`)
            .then(response => response.json())
            .then(data => {
                const oddsTable = document.getElementById("odds-table");
                oddsTable.innerHTML = ""; // Clear previous data

                const thead = document.createElement("thead");
                const headerRow = document.createElement("tr");

                headerRow.innerHTML = "<th>Player</th><th>Odds</th>";
                thead.appendChild(headerRow);
                oddsTable.appendChild(thead);

                const tbody = document.createElement("tbody");
                Object.entries(data).forEach(([name, odds]) => {
                    const row = document.createElement("tr");

                    const nameCell = document.createElement("td");
                    nameCell.textContent = name;
                    nameCell.style.cursor = "pointer"; // Indicate it's clickable
                    nameCell.addEventListener("click", () => addToDraftTable(name));

                    const oddsCell = document.createElement("td");
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
            .find(cell => cell.textContent.trim() === "");

        if (emptyCell) {
            emptyCell.textContent = playerName;

            // Grey out the player in the odds table
            const oddsTable = document.getElementById("odds-table");
            const rows = oddsTable.querySelectorAll("tbody tr");

            rows.forEach(row => {
                const nameCell = row.querySelector("td:first-child");
                if (nameCell && nameCell.textContent === playerName) {
                    row.style.opacity = "0.5"; // Grey out effect
                    row.style.pointerEvents = "none"; // Disable clicking
                }
            });
        } else {
            alert("No empty slots available in the draft table.");
        }
    }

    // Save draft table as CSV
    document.getElementById("save-csv-button").addEventListener("click", async () => {
        const rows = Array.from(draftTable.querySelectorAll("tr"));
        const csvData = rows.map(row =>
            Array.from(row.querySelectorAll("th, td"))
                .map(cell => `"${cell.textContent.replace(/"/g, '""')}"`)
                .join(",")
        );
        const csvString = csvData.join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "draft_table.csv";
        link.click();

        const tournamentName = tournamentSelect.value;
        if (!tournamentName) {
            alert("Please select a tournament.");
            return;
        }

        const headers = Array.from(draftTable.querySelectorAll("thead th"))
            .map(th => th.textContent.trim());
        const draftData = {};
        headers.forEach(header => draftData[header] = []);

        draftTable.querySelectorAll("tbody tr").forEach(row => {
            Array.from(row.querySelectorAll("td")).forEach((cell, index) => {
                if (cell.textContent.trim()) {
                    draftData[headers[index]].push(cell.textContent.trim());
                }
            });
        });

        try {
            const response = await fetch(`http://0.0.0.0:8000/draft/${tournamentName}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(draftData)
            });
            if (!response.ok) {
                throw new Error("Failed to save draft to API");
            }
            alert("Draft saved successfully!");
        } catch (error) {
            console.error("Error saving draft to API:", error);
            alert("Failed to save draft. Please try again.");
        }
    });

    // Shuffle draft order (headers only)
    document.getElementById("shuffle-draft-order-button").addEventListener("click", () => {
        const headerCells = Array.from(draftTable.querySelectorAll("thead th"));
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
