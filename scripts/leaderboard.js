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

    function renderGolfPicksTable(data) {
        const players = data.golfPicksScoreData;

        // Sort by score if numeric
        const sorted = [...players].sort((a, b) => {
            const aScore = parseFloat(a.score);
            const bScore = parseFloat(b.score);
            if (isNaN(aScore)) return 1;
            if (isNaN(bScore)) return -1;
            return aScore - bScore;
        });

        // Assign emojis based on position
        const emojiMap = {};
        sorted.forEach((player, index) => {
            let emoji = '';
            if (index === 0) emoji = ' 🥇';
            else if (index === 1) emoji = ' 🥈';
            else if (index === 2) emoji = ' 🥉';
            else if (index === sorted.length - 1) emoji = ' 💩';
            emojiMap[player.player] = emoji;
        });

        // Clear and create table structure
        golfpicksTable.innerHTML = "";

        // Header row 1: Player names with emoji
        const headerRow1 = document.createElement("tr");
        players.forEach(player => {
            const th = document.createElement("th");
            th.colSpan = 3;
            th.classList.add("player-name-header");
            th.textContent = player.player + (emojiMap[player.player] || '');
            headerRow1.appendChild(th);
        });
        golfpicksTable.appendChild(headerRow1);

        // Header row 2: Labels
        const headerRow2 = document.createElement("tr");
        players.forEach(() => {
            ["Player", "Position", "Score"].forEach(label => {
                const th = document.createElement("th");
                th.textContent = label;
                headerRow2.appendChild(th);
            });
        });
        golfpicksTable.appendChild(headerRow2);

        // Data rows (6 picks)
        for (let i = 0; i < 6; i++) {
            const row = document.createElement("tr");

            players.forEach(player => {
                const pick = player.picks[i];
                const golferTd = document.createElement("td");
                const positionTd = document.createElement("td");

                golferTd.classList.add("golfer-cell");
                golferTd.textContent = pick.golfer;
                positionTd.textContent = pick.position;

                row.appendChild(golferTd);
                row.appendChild(positionTd);

                if (i === 0) {
                    const scoreTd = document.createElement("td");
                    scoreTd.setAttribute("rowspan", "6");
                    scoreTd.textContent = player.score;
                    row.appendChild(scoreTd);
                }
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

    function loadLeaderboardData(tournament) {
        fetch(`http://127.0.0.1:8000/scores/${tournament}`)
            .then(response => response.json())
            .then(data => {
                golfPicksLeaderboardH1.style.display = "inline-block";
                espnLeaderboardH1.style.display = "inline-block";
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
            loadLeaderboardData(selectedTournament);
        }
    });

    loadTournaments();
});
