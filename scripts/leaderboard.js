document.addEventListener("DOMContentLoaded", () => {
    const tournamentDropdown = document.getElementById("tournament-dropdown");
    const golfpicksTable = document.getElementById("golfpicks-table");
    const espnTable = document.getElementById("espn-table");
    const golfPicksDataH1 = document.getElementById("golfpicks-data-h1");
    const espnLeaderboardH1 = document.getElementById("espn-leaderboard-h1");
    const golfPicksLeaderboardTable = document.getElementById("leaderboard-table");
    const golfPicksLeaderboardH1 = document.getElementById("leaderboard-h1");

    function loadTournaments() {
        fetch("http://127.0.0.1:8000/tournaments")
            .then(response => response.json())
            .then(tournaments => {
                tournamentDropdown.innerHTML = '<option value="">Select a tournament</option>';
                tournaments.forEach(tournament => {
                    const option = document.createElement("option");
                    option.value = tournament;
                    option.textContent = tournament.replace(/-/g, ' ');
                    tournamentDropdown.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Error fetching tournaments:", error);
                tournamentDropdown.innerHTML = '<option value="">Failed to load tournaments</option>';
            });
    }

    function renderGolfPicksLeaderboard(data) {
        const players = data.golfPicksScoreData;

        golfPicksLeaderboardTable.innerHTML = "";

        if (!players || players.length === 0) {
            const row = document.createElement("tr");
            row.innerHTML = "<td colspan='2'>No draft found.</td>";
            golfPicksLeaderboardTable.appendChild(row);
            return;
        }

        // Sort by numeric score (ascending)
        const sortedPlayers = [...players].sort((a, b) => parseFloat(a.score) - parseFloat(b.score));

        // Table headers
        const headerRow = document.createElement("tr");
        ["Player", "Score"].forEach(text => {
            const th = document.createElement("th");
            th.textContent = text;
            headerRow.appendChild(th);
        });
        golfPicksLeaderboardTable.appendChild(headerRow);

        // Table rows
        sortedPlayers.forEach((player, index) => {
            const row = document.createElement("tr");
            let emoji = "";

            if (index === 0) emoji = " 🥇";
            else if (index === 1) emoji = " 🥈";
            else if (index === 2) emoji = " 🥉";
            else if (index === sortedPlayers.length - 1) emoji = " 💩";

            const nameTd = document.createElement("td");
            nameTd.textContent = `${player.player}${emoji}`;

            const scoreTd = document.createElement("td");
            scoreTd.textContent = player.score;

            row.appendChild(nameTd);
            row.appendChild(scoreTd);
            golfPicksLeaderboardTable.appendChild(row);
        });
    }


    function renderGolfPicksDataTable(data) {
        const players = data.golfPicksScoreData;

        // Safety check
        if (!players || players.length === 0 || !players[0].picks) return;

        const numPicks = players[0].picks.length;

        // Clear existing table
        golfpicksTable.innerHTML = "";

        // Header row 1: Player names
        const headerRow1 = document.createElement("tr");
        players.forEach(player => {
            const th = document.createElement("th");
            th.colSpan = 2; // Only Player and Position columns now
            th.classList.add("player-name-header");
            th.textContent = player.player;
            headerRow1.appendChild(th);
        });
        golfpicksTable.appendChild(headerRow1);

        // Header row 2: Labels
        const headerRow2 = document.createElement("tr");
        players.forEach(() => {
            ["Player", "Pos."].forEach(label => {
                const th = document.createElement("th");
                th.textContent = label;
                if (label === "Pos.") {
                    th.classList.add("position-header");
                } else {
                    th.classList.add("player-label-header");
                }
                headerRow2.appendChild(th);
            });
        });
        golfpicksTable.appendChild(headerRow2);

        // Data rows based on number of picks
        for (let i = 0; i < numPicks; i++) {
            const row = document.createElement("tr");

            players.forEach(player => {
                const pick = player.picks[i];
                const golferTd = document.createElement("td");
                const positionTd = document.createElement("td");

                golferTd.classList.add("golfer-cell");
                golferTd.textContent = pick?.golfer || "";
                positionTd.classList.add("position-cell");
                positionTd.textContent = pick?.position || "";

                row.appendChild(golferTd);
                row.appendChild(positionTd);
            });

            golfpicksTable.appendChild(row);
        }
    }


    function renderESPNLeaderboard(data) {
        const leaderboard = data.leaderboard;
        const placeholder = document.getElementById("espn-placeholder");
        placeholder.style.display = "none";

        if (!leaderboard || Object.keys(leaderboard).length === 0) {
            espnTable.style.display = "none";

            placeholder.innerHTML = `
            <img 
                src="../images/pagenotfound.png" 
                alt="Tournament not started" 
                style="display: block; margin: 10px auto; max-width: 300px; width: 100%;">
        `;

            // Show the placeholder image
            placeholder.style.display = "block";
            return;
        }

        espnTable.style.display = "table";
        espnTable.innerHTML = "<tr><th>Position</th><th>Player</th><th>Score</th><th>Status</th></tr>";
        placeholder.style.display = "none";

        Object.entries(leaderboard).forEach(([playerName, player]) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${player.position}</td>
                <td>
                    <img class="headshot" src="${player.headshot}" alt="${playerName}"> 
                    <img class="flag" src="${player.flag}" alt="Flag"> 
                    ${playerName}
                </td>
                <td>${player.score}</td>
                <td>${player.status}</td>
            `;
            espnTable.appendChild(row);
        });
    }

    function fetchBackendData(tournament) {
        fetch(`http://127.0.0.1:8000/scores/${tournament}`)
            .then(response => response.json())
            .then(data => {
                golfPicksLeaderboardH1.style.display = "inline-block";
                golfPicksDataH1.style.display = "inline-block";
                espnLeaderboardH1.style.display = "inline-block";

                renderGolfPicksLeaderboard(data);
                renderGolfPicksDataTable(data);
                renderESPNLeaderboard(data);
            })
            .catch(error => {
                console.error("Error fetching leaderboard data:", error);
                golfPicksLeaderboardTable.innerHTML = "<tr><td colspan='9'>Failed to load golf picks leaderboard.</td></tr>";
                golfpicksTable.innerHTML = "<tr><td colspan='9'>Failed to load golf picks data.</td></tr>";
                espnTable.innerHTML = "<tr><td colspan='4'>Failed to load ESPN leaderboard data.</td></tr>";
            });
    }


    tournamentDropdown.addEventListener("change", () => {
        const selectedTournament = tournamentDropdown.value;
        if (selectedTournament) {
            fetchBackendData(selectedTournament);
        }
    });

    loadTournaments();
});