document.addEventListener("DOMContentLoaded", () => {
    const tournamentDropdown = document.getElementById("tournament-dropdown");
    const golfpicksTable = document.getElementById("golfpicks-table");
    const espnTable = document.getElementById("espn-table");
    const draftTable = document.getElementById("draft-table");
    const golfPicksLeaderboardH1 = document.getElementById("golfpicks-leaderboard-h1");
    const draftResultsH1 = document.getElementById("draft-results-h1");
    const espnLeaderboardH1 = document.getElementById("espn-leaderboard-h1");

    function loadTournaments() {
        fetch("https://m7486etxhi.execute-api.us-east-1.amazonaws.com/tournaments")
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

    function loadGolfPicksLeaderboard(tournament) {
        fetch(`https://m7486etxhi.execute-api.us-east-1.amazonaws.com/scores/${tournament}`)
            .then(response => response.json())
            .then(data => {

                golfpicksTable.innerHTML = "<tr><th>Player</th><th>Score</th></tr>";

                if (Object.keys(data).length === 0) {
                    const row = document.createElement("tr");
                    row.innerHTML = "<td colspan='4'>No draft found.</td>";
                    golfpicksTable.appendChild(row);
                    return;
                }

                const sortedEntries = Object.entries(data).sort((a, b) => a[1] - b[1]);

                golfpicksTable.innerHTML = `
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedEntries.map(([player, score], index) => {
                        let emoji = '';
                        if (index === 0) emoji = ' 🥇';
                        else if (index === 1) emoji = ' 🥈';
                        else if (index === 2) emoji = ' 🥉';
                        else if (index === sortedEntries.length - 1) emoji = ' 💩';

                        return `
                                <tr>
                                    <td>${player}${emoji}</td>
                                    <td>${score}</td>
                                </tr>
                            `;
                    }).join('')}
                    </tbody>
                `;
            })
            .catch(error => {
                console.error("Error fetching GolfPicks leaderboard:", error);
                golfpicksTable.innerHTML = '<tr><td colspan="2">Failed to load GolfPicks leaderboard</td></tr>';
            });
    }

    function loadESPNLeaderboard(tournament) {
        fetch(`https://m7486etxhi.execute-api.us-east-1.amazonaws.com/leaderboard/${tournament}`)
            .then(response => response.json())
            .then(data => {
                espnTable.innerHTML = "<tr><th>Position</th><th>Player</th><th>Score</th><th>Status</th></tr>";

                if (Object.keys(data).length === 0) {
                    const row = document.createElement("tr");
                    row.innerHTML = "<td colspan='4'>The tournament has not started yet.</td>";
                    espnTable.appendChild(row);
                    return;
                }

                Object.entries(data).forEach(([playerName, player]) => {
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
            })
            .catch(error => console.error("Error fetching ESPN leaderboard:", error));
    }


    function loadDraftResults(tournament) {
        fetch(`https://m7486etxhi.execute-api.us-east-1.amazonaws.com/draft/${tournament}`)
            .then(response => response.json())
            .then(data => {
                draftTable.innerHTML = "<tr><th>Player</th></tr>";

                if (Object.keys(data).length === 0) {
                    const row = document.createElement("tr");
                    row.innerHTML = "<td colspan='4'>No draft found.</td>";
                    draftTable.appendChild(row);
                    return;
                }

                // Create table header with player names
                let tableHTML = `
                    <thead>
                        <tr>
                            ${Object.keys(data).map(user => `<th>${user}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                `;

                // Get the number of draft picks per player (safe to assume all have same)
                const numPicks = data[Object.keys(data)[0]].length;

                // Populate the table rows with draft picks
                for (let i = 0; i < numPicks; i++) {
                    tableHTML += `<tr>`;
                    Object.keys(data).forEach(user => {
                        tableHTML += `<td>${data[user][i]}</td>`;
                    });
                    tableHTML += `</tr>`;
                }

                tableHTML += `</tbody>`;
                draftTable.innerHTML = tableHTML;
            })
            .catch(error => {
                console.error("Error fetching draft results:", error);
                draftTable.innerHTML = '<tr><td colspan="100%">Failed to load draft results</td></tr>';
            });
    }



    tournamentDropdown.addEventListener("change", () => {
        golfPicksLeaderboardH1.style.display = "inline-block";
        draftResultsH1.style.display = "inline-block";
        espnLeaderboardH1.style.display = "inline-block";
        const selectedTournament = tournamentDropdown.value;
        if (selectedTournament) {
            loadGolfPicksLeaderboard(selectedTournament);
            loadESPNLeaderboard(selectedTournament);
            loadDraftResults(selectedTournament);
        }
    });

    loadTournaments();
});
