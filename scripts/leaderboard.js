document.addEventListener("DOMContentLoaded", () => {
    const tournamentDropdown = document.getElementById("tournament-dropdown");
    const golfpicksTable = document.getElementById("golfpicks-table");
    const espnTable = document.getElementById("espn-table");
    const golfPicksLeaderboardH1 = document.getElementById("golfpicks-leaderboard-h1");
    const espnLeaderboardH1 = document.getElementById("espn-leaderboard-h1");

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

        // Safety check
        if (!players || players.length === 0 || !players[0].picks) return;

        const numPicks = players[0].picks.length;

        // Clear existing table
        golfpicksTable.innerHTML = "";

        // Sort players by numeric score ascending (TBD treated as Infinity)
        const sortedPlayers = [...players].sort((a, b) => {
            const aScore = isNaN(parseFloat(a.score)) ? Infinity : parseFloat(a.score);
            const bScore = isNaN(parseFloat(b.score)) ? Infinity : parseFloat(b.score);
            return aScore - bScore;
        });

        // Map player names to medals or poop emojis
        const emojiMap = {};
        if (sortedPlayers[0]) emojiMap[sortedPlayers[0].player] = "🏅"; // 1st place
        if (sortedPlayers[1]) emojiMap[sortedPlayers[1].player] = "🥈"; // 2nd place
        if (sortedPlayers[2]) emojiMap[sortedPlayers[2].player] = "🥉"; // 3rd place
        if (sortedPlayers.length > 0) emojiMap[sortedPlayers[sortedPlayers.length - 1].player] = "💩"; // last place

        // Header Row 1: Player names with emojis, colspan=2 (Player + Pos.)
        const headerRow1 = document.createElement("tr");
        players.forEach(player => {
            const th = document.createElement("th");
            th.colSpan = 2; // only Player + Pos. columns now
            th.classList.add("player-name-header");

            const emoji = emojiMap[player.player] || "";
            th.textContent = `${player.player} ${emoji}`;
            headerRow1.appendChild(th);
        });
        golfpicksTable.appendChild(headerRow1);

        // Header Row 2: "Player", "Pos." repeated per player
        const headerRow2 = document.createElement("tr");
        players.forEach(() => {
            ["Player", "Pos."].forEach(label => {
                const th = document.createElement("th");
                th.textContent = label;
                if (label === "Pos.") th.classList.add("position-header");
                if (label === "Player") th.classList.add("player-label-header");
                headerRow2.appendChild(th);
            });
        });
        golfpicksTable.appendChild(headerRow2);

        // Data rows for picks (numPicks rows)
        for (let i = 0; i < numPicks; i++) {
            const row = document.createElement("tr");

            players.forEach(player => {
                const pick = player.picks[i];

                // Player cell: golfer name
                const playerTd = document.createElement("td");
                playerTd.classList.add("golfer-cell");
                playerTd.textContent = pick?.golfer || "";
                row.appendChild(playerTd);

                // Position cell (show as-is)
                const posTd = document.createElement("td");
                posTd.classList.add("position-cell");
                posTd.textContent = pick?.position || "";
                row.appendChild(posTd);
            });

            golfpicksTable.appendChild(row);
        }

        // Extra row for scores below all picks
        const scoreRow = document.createElement("tr");

        players.forEach(player => {
            // Player cell: label "Score"
            const playerTd = document.createElement("td");
            playerTd.classList.add("score-label-cell"); // add class here
            playerTd.textContent = "Score";
            scoreRow.appendChild(playerTd);

            // Position cell: actual score or TBD
            const posTd = document.createElement("td");
            posTd.classList.add("score-value-cell"); // add class here
            const numericScore = parseFloat(player.score);
            posTd.textContent = isNaN(numericScore) ? "TBD" : player.score;
            scoreRow.appendChild(posTd);
        });

        golfpicksTable.appendChild(scoreRow);

    }



    function renderESPNLeaderboard(data) {
        const leaderboard = data.leaderboard;

        espnTable.innerHTML = "<tr><th>Position</th><th>Player</th><th>Score</th><th>Status</th></tr>";

        if (!leaderboard || Object.keys(leaderboard).length === 0) {
            const row = document.createElement("tr");
            row.innerHTML = "<td colspan='4'>The tournament has not started yet.</td>";
            espnTable.appendChild(row);
            return;
        }

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
                espnLeaderboardH1.style.display = "inline-block";
                renderGolfPicksLeaderboard(data);
                renderESPNLeaderboard(data);
            })
            .catch(error => {
                console.error("Error fetching leaderboard data:", error);
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
