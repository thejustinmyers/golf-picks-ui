document.addEventListener("DOMContentLoaded", function() {
    const tournamentDropdown = document.getElementById("tournament");
    const fetchOddsButton = document.getElementById("fetchOdds");
    const playersTableBody = document.getElementById("playersTable").querySelector("tbody");
    const playersTableHeader = document.getElementById("playersTable").querySelector("thead");
    const createDraftButton = document.getElementById("createDraft");
    const randomizeOrderButton = document.getElementById("randomizeOrder");
    const beginDraftButton = document.getElementById("beginDraft");
    const draftTable = document.getElementById("draftTable");
    const draftSetup = document.getElementById("draftSetup");

    let playersData = {}; // Stores player names & odds
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
    fetchOddsButton.addEventListener("click", function() {
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
    createDraftButton.addEventListener("click", function() {
        const rounds = parseInt(document.getElementById("rounds").value);
        const players = parseInt(document.getElementById("players").value);
        if (isNaN(rounds) || isNaN(players) || rounds < 1 || players < 2) {
            alert("Please enter valid numbers for rounds and players.");
            return;
        }

        draftTable.innerHTML = "";
        draftCells = [];

        let headerRow = draftTable.insertRow();
        for (let i = 1; i <= players; i++) {
            let th = document.createElement("th");
            th.setAttribute("contenteditable", "true"); // Allow editing player names
            th.textContent = `Player ${i}`;
            headerRow.appendChild(th);
        }

        for (let r = 0; r < rounds; r++) {
            let row = draftTable.insertRow();
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
    randomizeOrderButton.addEventListener("click", function() {
        let headers = Array.from(draftTable.rows[0].cells);
        headers.sort(() => Math.random() - 0.5);
        headers.forEach(cell => draftTable.rows[0].appendChild(cell));
    });

    // Begin Draft
    beginDraftButton.addEventListener("click", function() {
        draftSetup.style.display = "none";
    });
});
