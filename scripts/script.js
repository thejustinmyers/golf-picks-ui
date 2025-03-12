document.addEventListener("DOMContentLoaded", function () {
    const tournamentDropdown = document.getElementById("tournament");
    const fetchOddsButton = document.getElementById("fetchOdds");
    const playersTableBody = document.getElementById("playersTable").querySelector("tbody");
    const playersTableHeader = document.getElementById("playersTable").querySelector("thead");
    const createDraftButton = document.getElementById("createDraft");
    const randomizeOrderButton = document.getElementById("randomizeOrder");
    const beginDraftButton = document.getElementById("beginDraft");
    const draftTable = document.getElementById("draftTable");
    const saveDraft = document.getElementById("saveDraft");
    const tournamentSelect = document.getElementById("tournament");

    let draftCells = []; // Stores available draft table cells

    // Fetch available tournaments
    fetch("http://0.0.0.0:8000/tournaments")
        .then(response => response.json())
        .then(data => {
            data.forEach(tournament => {
                let option = document.createElement("option");
                option.value = tournament;
                option.textContent = tournament.replace(/-/g, " ").toUpperCase();
                tournamentDropdown.appendChild(option);
            });
        });

    // Fetch player odds
    fetchOddsButton.addEventListener("click", function () {
        const tournament = tournamentDropdown.value;
        fetch(`http://0.0.0.0:8000/odds/${tournament}`)
            .then(response => response.json())
            .then(data => {
                playersTableHeader.innerHTML = "<th>Player</th><th>Odds</th>";
                playersData = data;
                playersTableBody.innerHTML = "";
                Object.entries(data).forEach(([player, odds]) => {
                    let row = document.createElement("tr");
                    row.innerHTML = `<td>${player}</td><td>${odds}</td>`;
                    row.addEventListener("click", () => pickPlayer(row, player));
                    playersTableBody.appendChild(row);
                });
            });
    });

    // Create Draft Table
    createDraftButton.addEventListener("click", function () {
        const rounds = parseInt(document.getElementById("rounds").value);
        const players = parseInt(document.getElementById("players").value);
        if (isNaN(rounds) || isNaN(players) || rounds < 1 || players < 2) {
            alert("Please enter valid numbers for rounds and players.");
            return;
        }

        draftTable.innerHTML = "";
        draftCells = [];

        let thead = draftTable.createTHead();
        let headerRow = thead.insertRow();

        for (let i = 1; i <= players; i++) {
            let th = document.createElement("th");
            th.setAttribute("contenteditable", "true");
            th.textContent = `Player ${i}`;
            headerRow.appendChild(th);
        }

        let tbody = draftTable.createTBody();
        for (let r = 0; r < rounds; r++) {
            let row = tbody.insertRow();
            for (let p = 0; p < players; p++) {
                let cell = row.insertCell();
                cell.setAttribute("contenteditable", "true");
                draftCells.push(cell);
            }
        }

        randomizeOrderButton.style.display = "inline-block";
        beginDraftButton.style.display = "inline-block";
    });


    // Pick Player Function
    function pickPlayer(row, player) {
        row.classList.add("picked");

        for (let cell of draftCells) {
            if (cell.textContent.trim() === "") {
                cell.textContent = player;
                return;
            }
        }
    }

    // Randomize Order
    randomizeOrderButton.addEventListener("click", function () {
        let headers = Array.from(draftTable.rows[0].cells);
        headers.sort(() => Math.random() - 0.5);
        headers.forEach(cell => draftTable.rows[0].appendChild(cell));
    });

    // Begin Draft
    beginDraftButton.addEventListener("click", function () {
        draftSetup.style.display = "none";
        saveDraft.style.display = "inline-block";
    });

    // Save draft table as CSV
    saveDraft.addEventListener("click", async () => {
        const rows = Array.from(draftTable.querySelectorAll("tr"));
        const csvString = rows.map(row =>
            Array.from(row.querySelectorAll("th, td"))
                .map(cell => `"${cell.textContent.replace(/"/g, '""')}"`)
                .join(",")
        ).join("\n");

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

        const headerRow = draftTable.querySelector("thead tr");
        const headers = headerRow ? Array.from(headerRow.querySelectorAll("th")).map(th => th.textContent.trim()) : [];

        if (headers.length === 0) {
            console.error("No headers found! Ensure your table has a <thead> with <th> elements.");
            alert("Error: No headers found in the table.");
            return;
        }

        const draftData = {};
        headers.forEach(header => draftData[header] = []);

        const rowsBody = draftTable.querySelectorAll("tbody tr");
        if (rowsBody.length === 0) {
            console.error("No rows found in tbody.");
            alert("Error: No player data found in the table.");
            return;
        }

        rowsBody.forEach(row => {
            const cells = Array.from(row.querySelectorAll("td"));
            cells.forEach((cell, index) => {
                if (headers[index]) {  // Ensure headers[index] exists
                    draftData[headers[index]].push(cell.textContent.trim());
                }
            });
        });

        try {
            const response = await fetch(`http://0.0.0.0:8000/draft/${tournamentName}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
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



});
