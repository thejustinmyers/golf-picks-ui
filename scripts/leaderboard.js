document.addEventListener("DOMContentLoaded", () => {
    const tournamentDropdown = document.getElementById("tournament-dropdown");
    const golfpicksTable = document.getElementById("golfpicks-table");
    const espnTable = document.getElementById("espn-table");
    const golfPicksLeaderboardH1 = document.getElementById("golfpicks-leaderboard-h1");
    const podiumH1 = document.getElementById("podium-h1");
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

    function renderPodium(playersData) {
        const podiumContainer = document.getElementById("podium");
        podiumContainer.innerHTML = "";

        // Filter out "TBD" or non-numeric scores for height calculation
        const numericPlayers = playersData.filter(p => !isNaN(parseFloat(p.score)));

        // Sort by score (lower is better)
        const sorted = [...numericPlayers].sort((a, b) => parseFloat(a.score) - parseFloat(b.score));

        // Get score range
        const scores = numericPlayers.map(p => parseFloat(p.score));
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const scoreRange = maxScore - minScore || 1;

        // Assign emojis
        const emojiMap = {};
        if (sorted[0]) emojiMap[sorted[0].player] = "🥇";
        if (sorted[1]) emojiMap[sorted[1].player] = "🥈";
        if (sorted[2]) emojiMap[sorted[2].player] = "🥉";
        if (sorted[sorted.length - 1]) emojiMap[sorted[sorted.length - 1].player] = "💩";

        const barHTML = sorted.map(player => {
            const rawScore = player.score;
            const isNumeric = !isNaN(parseFloat(rawScore));
            const score = isNumeric ? parseFloat(rawScore) : null;
            const height = isNumeric ? 100 + ((maxScore - score) / scoreRange) * 100 : 60;

            const emoji = emojiMap[player.player] || "";

            return `
            <div class="bar-wrapper">
                <div class="emoji">${emoji}</div>
                <div class="bar" style="height: ${height}px;">
                    <span class="score">${rawScore}</span>
                </div>
                <div class="name">${player.player}</div>
            </div>
        `;
        }).join("");

        podiumContainer.innerHTML = `<div class="bar-chart">${barHTML}</div>`;
    }


    function renderGolfPicksTable(data) {
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
                podiumH1.style.display = "inline-block";
                golfPicksLeaderboardH1.style.display = "inline-block";
                espnLeaderboardH1.style.display = "inline-block";
                renderPodium(data.golfPicksScoreData);
                renderGolfPicksTable(data);
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
