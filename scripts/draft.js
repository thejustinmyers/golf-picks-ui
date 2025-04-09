document.addEventListener("DOMContentLoaded", function () {
    const tournamentDropdown = document.getElementById("tournament");
    const fetchOddsButton = document.getElementById("fetchOdds");
    const playersTableBody = document.querySelector("#playersTable tbody");
    const playersTableHeader = document.querySelector("#playersTable thead");
    const createDraftButton = document.getElementById("createDraft");
    const randomizeOrderButton = document.getElementById("randomizeOrder");
    const beginDraftButton = document.getElementById("beginDraft");
    const draftTable = document.getElementById("draftTable");
    const saveDraft = document.getElementById("saveDraft");

    let draftCells = [];
    playersTableBody.style.pointerEvents = "none";

    // Fetch available tournaments and populate dropdown
    async function fetchTournaments() {
        try {
            const response = await fetch("https://m7486etxhi.execute-api.us-east-1.amazonaws.com/tournaments");
            if (!response.ok) throw new Error("Failed to fetch tournaments");
            const data = await response.json();

            const fragment = document.createDocumentFragment();
            data.forEach(tournament => {
                const option = document.createElement("option");
                option.value = tournament;
                option.textContent = tournament.replace(/-/g, " ").toUpperCase();
                fragment.appendChild(option);
            });
            tournamentDropdown.appendChild(fragment);
        } catch (error) {
            console.error("Error fetching tournaments:", error);
            alert("Failed to load tournaments.");
        }
    }
    fetchTournaments();

    // Fetch player odds and populate table
    fetchOddsButton.addEventListener("click", async function () {
        const tournament = tournamentDropdown.value;
        if (!tournament) return alert("Please select a tournament.");

        try {
            const response = await fetch(`https://m7486etxhi.execute-api.us-east-1.amazonaws.com/odds/${tournament}`);
            if (!response.ok) throw new Error("Failed to fetch odds");

            const data = await response.json();

            // Clear existing table headers and body
            playersTableHeader.innerHTML = "<tr><th>Player</th><th>Odds</th></tr>";
            playersTableBody.innerHTML = "";

            if (Object.keys(data).length === 0) {
                const row = document.createElement("tr");
                row.innerHTML = "<td colspan='2'>DraftKings odds not found, the tournament may have been played already.</td>";
                playersTableBody.appendChild(row);
                return;
            }

            const fragment = document.createDocumentFragment();
            Object.entries(data).forEach(([player, odds]) => {
                const row = document.createElement("tr");
                row.innerHTML = `<td>${player}</td><td>${odds}</td>`;
                row.addEventListener("click", () => pickPlayer(row, player));
                fragment.appendChild(row);
            });

            playersTableBody.appendChild(fragment);
        } catch (error) {
            console.error("Error fetching odds:", error);
            alert("Failed to load player odds.");
        }
    });


    // Create Draft Table
    createDraftButton.addEventListener("click", function () {
        const rounds = parseInt(document.getElementById("rounds").value, 10);
        const players = parseInt(document.getElementById("players").value, 10);
        if (isNaN(rounds) || isNaN(players) || rounds < 1 || players < 2) {
            return alert("Please enter valid numbers for rounds and players.");
        }

        draftTable.innerHTML = "";
        draftCells = [];

        const thead = draftTable.createTHead();
        const headerRow = thead.insertRow();

        for (let i = 1; i <= players; i++) {
            const th = document.createElement("th");
            th.setAttribute("contenteditable", "true");
            th.textContent = `Player ${i}`;
            headerRow.appendChild(th);
        }

        const tbody = draftTable.createTBody();
        for (let r = 0; r < rounds; r++) {
            const row = tbody.insertRow();
            for (let p = 0; p < players; p++) {
                const cell = row.insertCell();
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
        
        let rows = draftTable.querySelectorAll("tbody tr");
        let numPlayers = draftTable.rows[0].cells.length;
        
        for (let r = 0; r < rows.length; r++) {
            let cells = rows[r].cells;
            let order = r % 2 === 0 ? [...Array(numPlayers).keys()] : [...Array(numPlayers).keys()].reverse();
            
            for (let i of order) {
                if (!cells[i].textContent.trim()) {
                    cells[i].textContent = player;
    
                    // Move the selected player to the bottom of the odds table
                    playersTableBody.appendChild(row);
    
                    return;
                }
            }
        }
    }

    // Randomize Order via Fisher-Yates shuffle
    randomizeOrderButton.addEventListener("click", function () {
        const headerRow = draftTable.rows[0];
        const headers = Array.from(headerRow.cells);

        for (let i = headers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [headers[i], headers[j]] = [headers[j], headers[i]];
        }

        headers.forEach(cell => headerRow.appendChild(cell));
    });

    // Begin Draft
    beginDraftButton.addEventListener("click", function () {
        document.getElementById("draftSetup").style.display = "none";
        saveDraft.style.display = "inline-block";
        playersTableBody.style.pointerEvents = "auto";
    });

    // Save draft table as CSV and send to API
    saveDraft.addEventListener("click", async () => {
        const tournamentName = tournamentDropdown.value;
        if (!tournamentName) return alert("Please select a tournament.");

        const rows = Array.from(draftTable.querySelectorAll("tr"));
        const csvString = rows.map(row =>
            Array.from(row.querySelectorAll("th, td"))
                .map(cell => `"${cell.textContent.replace(/"/g, '""')}"`)
                .join(",")
        ).join("\n");

        // Save CSV locally
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "draft_table.csv";
        link.click();

        // Prepare JSON data for API
        const headerRow = draftTable.querySelector("thead tr");
        const headers = headerRow ? Array.from(headerRow.querySelectorAll("th")).map(th => th.textContent.trim()) : [];
        if (headers.length === 0) return alert("Error: No headers found in the table.");

        const draftData = {};
        headers.forEach(header => (draftData[header] = []));

        draftTable.querySelectorAll("tbody tr").forEach(row => {
            const cells = Array.from(row.querySelectorAll("td"));
            cells.forEach((cell, index) => {
                if (headers[index]) draftData[headers[index]].push(cell.textContent.trim());
            });
        });

        // Send draft data to API
        try {
            const response = await fetch(`http://0.0.0.0:8000/draft/${tournamentName}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(draftData),
            });

            if (!response.ok) throw new Error("Failed to save draft to API");
            alert("Draft saved successfully!");
        } catch (error) {
            console.error("Error saving draft:", error);
            alert("Failed to save draft. Please try again.");
        }
    });
});
