document.addEventListener("DOMContentLoaded", () => {
    const tournamentDropdown = document.getElementById("tournament-dropdown");
    const golfpicksTable = document.getElementById("golfpicks-table");
    const espnTable = document.getElementById("espn-table");
    const draftTable = document.getElementById("draft-table");

    function loadTournaments() {
        fetch("http://0.0.0.0:8000/tournaments")
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
        fetch(`http://0.0.0.0:8000/scores/${tournament}`)
            .then(response => response.json())
            .then(data => {
                golfpicksTable.innerHTML = `
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(data).map(([player, score]) => `
                            <tr>
                                <td>${player}</td>
                                <td>${score}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                `;
            })
            .catch(error => {
                console.error("Error fetching GolfPicks leaderboard:", error);
                golfpicksTable.innerHTML = '<tr><td colspan="2">Failed to load GolfPicks leaderboard</td></tr>';
            });
    }

    function loadESPNLeaderboard(tournament) {
        fetch(`http://0.0.0.0:8000/leaderboard/${tournament}`)
            .then(response => response.json())
            .then(data => {
                espnTable.innerHTML = "<tr><th>Position</th><th>Player</th></tr>";
                Object.values(data).map(player => {
                    const row = document.createElement("tr");
                    row.innerHTML = `<td>${player.POS}</td><td>${player.PLAYER}</td>`;
                    espnTable.appendChild(row);
                });
            })
            .catch(error => console.error("Error fetching ESPN leaderboard:", error));
        console.log("here")
    }


    function loadDraftResults(tournament) {
        fetch(`http://0.0.0.0:8000/draft/${tournament}`)
            .then(response => response.json())
            .then(data => {
                draftTable.innerHTML = ""; // Clear previous results
    
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
        const selectedTournament = tournamentDropdown.value;
        if (selectedTournament) {
            loadGolfPicksLeaderboard(selectedTournament);
            loadESPNLeaderboard(selectedTournament);
            loadDraftResults(selectedTournament);
        }
    });

    loadTournaments();
});
