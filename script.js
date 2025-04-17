// Golf Scoreboard JavaScript

// Initialize scores data
let scores = [];

// Initialize closest to pin winners
let closestToPin = {
    4: '',
    6: '',
    9: '',
    13: ''
};

// Initialize skins tracking
let skinsWinners = {};

// Set the skins pot total
const SKINS_POT_TOTAL = 360;

// Load saved data from local storage if available
function loadSavedData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            scores = parsedData.scores || [];
            closestToPin = parsedData.closestToPin || {
                4: '',
                6: '',
                9: '',
                13: ''
            };
            skinsWinners = parsedData.skinsWinners || {};
            console.log('Loaded saved scores:', scores);
            console.log('Loaded closest to pin winners:', closestToPin);
            console.log('Loaded skins winners:', skinsWinners);
        } catch (e) {
            console.error('Error loading saved data:', e);
            // Start with empty scores
            scores = [];
            closestToPin = {
                4: '',
                6: '',
                9: '',
                13: ''
            };
            skinsWinners = {};
        }
    } else {
        // Start with empty data
        scores = [];
        closestToPin = {
            4: '',
            6: '',
            9: '',
            13: ''
        };
        skinsWinners = {};
    }
}

// Save current scores to local storage
function saveData() {
    try {
        const dataToSave = {
            scores: scores,
            closestToPin: closestToPin,
            skinsWinners: skinsWinners
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('Data saved successfully');
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

// Populate team selection dropdown
function populateTeamSelect() {
    const teamSelect = document.getElementById('team-select');

    // Clear existing options
    teamSelect.innerHTML = '<option value="">Select a Team</option>';

    // Add team options
    PAIRINGS.forEach(pairing => {
        const option = document.createElement('option');
        option.value = pairing.team;
        option.textContent = `${pairing.team} (${pairing.handicaps[0]}/${pairing.handicaps[1]})`;
        teamSelect.appendChild(option);
    });
}

// Populate closest to pin player selects
function populateClosestToPinSelects() {
    // Get all players from the pairings
    const players = [];
    PAIRINGS.forEach(pairing => {
        players.push(pairing.player1);
        players.push(pairing.player2);
    });

    // Sort players alphabetically
    players.sort();

    // Add an empty option first
    const emptyOption = '<option value="">-- Select Player --</option>';

    // Populate each hole's select dropdown
    const ctpHoles = [4, 6, 9, 13];
    ctpHoles.forEach(hole => {
        const select = document.getElementById(`ctp-hole-${hole}`);
        if (select) {
            // Clear existing options
            select.innerHTML = emptyOption;

            // Add all players as options
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player;
                option.textContent = player;
                select.appendChild(option);
            });

            // Set the currently selected player if there is one
            if (closestToPin[hole]) {
                select.value = closestToPin[hole];
            }
        }
    });
}

// Handle closest to pin selection
function handleClosestToPinChange(hole, player) {
    closestToPin[hole] = player;
    saveData();
    updateClosestToPinDisplay();
}

// Update the closest to pin display in the HTML
function updateClosestToPinDisplay() {
    // For each CTP hole, update the display
    Object.keys(closestToPin).forEach(hole => {
        const displayElement = document.querySelector(`#ctp-display-hole-${hole}`);
        if (displayElement) {
            displayElement.textContent = closestToPin[hole] || '---';
        }
    });
}

// Calculate skins winners
function calculateSkinsWinners() {
    skinsWinners = {};

    // Skip if no scores
    if (scores.length === 0) return;

    // Check each hole (0-17 for the 18 holes)
    for (let holeIndex = 0; holeIndex < 18; holeIndex++) {
        let lowestScore = Infinity;
        let lowestTeams = [];
        let par = PAR_VALUES[holeIndex];

        // Find lowest score for this hole
        scores.forEach(team => {
            const holeScore = team.holes[holeIndex];

            // Skip if no score for this hole
            if (!holeScore) return;

            // If score is lower than current lowest, reset the array and add this team
            if (holeScore < lowestScore) {
                lowestScore = holeScore;
                lowestTeams = [team.team];
            }
            // If score is tied with current lowest, add this team to the array
            else if (holeScore === lowestScore) {
                lowestTeams.push(team.team);
            }
        });

        // If only one team has the lowest score AND it's a birdie or better, they win the skin
        if (lowestTeams.length === 1 && lowestScore < par) {
            const winningTeam = lowestTeams[0];

            // Initialize if this is the team's first skin
            if (!skinsWinners[winningTeam]) {
                skinsWinners[winningTeam] = [];
            }

            // Add the hole number (1-18, not 0-17) to the team's skins list
            skinsWinners[winningTeam].push(holeIndex + 1);
        }
    }

    // Save the updated skins data
    saveData();
    console.log('Skins calculated:', skinsWinners);
}

// Populate score form based on selected team
function populateScoreForm() {
    const teamSelect = document.getElementById('team-select');
    const selectedTeam = teamSelect.value;
    const removeButton = document.getElementById('remove-score-btn');

    // Clear existing values
    for (let i = 1; i <= 18; i++) {
        document.getElementById(`hole${i}`).value = '';
    }

    // Find if this team already has a score
    const existingScore = scores.find(score => score.team === selectedTeam);

    // Enable/disable remove button based on if team has scores
    removeButton.disabled = !existingScore;

    // If team has existing score, populate form with those values
    if (existingScore) {
        for (let i = 1; i <= 18; i++) {
            document.getElementById(`hole${i}`).value = existingScore.holes[i - 1] || '';
        }
    }
}

// Handle score form submission
function handleScoreSubmit(e) {
    e.preventDefault();

    const teamSelect = document.getElementById('team-select');
    const selectedTeam = teamSelect.value;

    if (!selectedTeam) {
        alert('Please select a team');
        return;
    }

    // Collect hole scores
    const holes = [];
    for (let i = 1; i <= 18; i++) {
        const holeScore = parseInt(document.getElementById(`hole${i}`).value) || 0;
        holes.push(holeScore);
    }

    // Calculate totals
    const total = holes.reduce((sum, score) => sum + score, 0);
    const toPar = total - TOTAL_PAR;

    // Format toPar with + sign for over par
    const toParFormatted = toPar > 0 ? `+${toPar}` : toPar;

    // Create or update team score
    const existingScoreIndex = scores.findIndex(score => score.team === selectedTeam);

    if (existingScoreIndex !== -1) {
        // Update existing score
        scores[existingScoreIndex] = {
            team: selectedTeam,
            score: total,
            toPar: toParFormatted,
            holes: holes
        };
    } else {
        // Add new score
        scores.push({
            team: selectedTeam,
            score: total,
            toPar: toParFormatted,
            holes: holes
        });
    }

    // Recalculate skins winners
    calculateSkinsWinners();

    // Save and refresh display
    saveData();
    renderScoreboard();

    // Reset form and disable remove button
    teamSelect.value = '';
    for (let i = 1; i <= 18; i++) {
        document.getElementById(`hole${i}`).value = '';
    }
    document.getElementById('remove-score-btn').disabled = true;
}

// Handle removing a score
function handleRemoveScore() {
    const teamSelect = document.getElementById('team-select');
    const selectedTeam = teamSelect.value;

    if (!selectedTeam) {
        alert('Please select a team to remove');
        return;
    }

    // Confirm before removing
    const confirmRemove = confirm(`Are you sure you want to remove the score for ${selectedTeam}?`);
    if (!confirmRemove) {
        return;
    }

    // Find and remove the score
    const scoreIndex = scores.findIndex(score => score.team === selectedTeam);

    if (scoreIndex !== -1) {
        scores.splice(scoreIndex, 1);

        // Recalculate skins after removing a score
        calculateSkinsWinners();

        saveData();
        renderScoreboard();

        // Reset form and disable remove button
        teamSelect.value = '';
        for (let i = 1; i <= 18; i++) {
            document.getElementById(`hole${i}`).value = '';
        }
        document.getElementById('remove-score-btn').disabled = true;

        console.log('Score removed successfully!');
    } else {
        alert('No score found for this team');
    }
}

// Calculate the payout per skin
function calculateSkinPayout() {
    // Count total number of skins won
    let totalSkinsWon = 0;
    Object.values(skinsWinners).forEach(skins => {
        totalSkinsWon += skins.length;
    });

    // If no skins, return 0
    if (totalSkinsWon === 0) {
        return 0;
    }

    // Calculate payout per skin
    return SKINS_POT_TOTAL / totalSkinsWon;
}

// Add Skins Summary to the page
function renderSkinsSummary() {
    // Use the existing skins table body
    const skinsTableBody = document.getElementById('skins-table-body');

    if (skinsTableBody) {
        // Clear the existing table content
        skinsTableBody.innerHTML = '';

        // Sort teams by number of skins won (descending)
        const sortedTeams = Object.keys(skinsWinners).sort((a, b) => {
            return skinsWinners[b].length - skinsWinners[a].length;
        });

        if (sortedTeams.length === 0) {
            // No skins won yet
            const row = document.createElement('tr');
            row.className = 'bg-gray-800';

            const cell = document.createElement('td');
            cell.colSpan = 4; // Updated to span 4 columns (added payout column)
            cell.className = 'px-2 py-4 text-center';
            cell.textContent = 'No skins won yet';

            row.appendChild(cell);
            skinsTableBody.appendChild(row);
        } else {
            // Calculate payout per skin
            const payoutPerSkin = calculateSkinPayout();

            // Add a row for each team with skins
            sortedTeams.forEach(team => {
                const row = document.createElement('tr');
                row.className = 'bg-gray-800';

                // Team name
                const teamCell = document.createElement('td');
                teamCell.className = 'px-2 py-2';
                teamCell.textContent = team;
                row.appendChild(teamCell);

                // Number of skins
                const countCell = document.createElement('td');
                countCell.className = 'px-2 py-2';
                countCell.textContent = skinsWinners[team].length;
                row.appendChild(countCell);

                // Holes where skins were won
                const holesCell = document.createElement('td');
                holesCell.className = 'px-2 py-2';
                holesCell.textContent = skinsWinners[team].join(', ');
                row.appendChild(holesCell);

                // Payout amount
                const payoutCell = document.createElement('td');
                payoutCell.className = 'px-2 py-2';
                const totalPayout = payoutPerSkin * skinsWinners[team].length;
                payoutCell.textContent = `$${totalPayout.toFixed(2)}`;
                row.appendChild(payoutCell);

                skinsTableBody.appendChild(row);
            });
        }
    }
}

// Render the scoreboard with current data
function renderScoreboard() {
    const scoreboardBody = document.getElementById('scoreboard-body');
    scoreboardBody.innerHTML = '';

    // Find tied scores to determine where tiebreakers apply
    const tiedScoreGroups = {};
    scores.forEach(score => {
        if (!tiedScoreGroups[score.score]) {
            tiedScoreGroups[score.score] = [];
        }
        tiedScoreGroups[score.score].push(score);
    });

    // Process tiebreakers and mark winning and tied holes
    const tieWinningHoles = {};
    const tieEqualHoles = {};

    // Only process tiebreakers for teams with identical total scores
    for (const [totalScore, tiedTeams] of Object.entries(tiedScoreGroups)) {
        // Skip if there's only one team with this score (no tie to break)
        if (tiedTeams.length <= 1) continue;

        // There's a tie to break
        tieWinningHoles[totalScore] = {};
        tieEqualHoles[totalScore] = {};

        // For each tied team, initialize their tiebreaker info
        tiedTeams.forEach(team => {
            tieWinningHoles[totalScore][team.team] = [];
            tieEqualHoles[totalScore][team.team] = [];
        });

        // Find the holes that break the tie in order of handicap difficulty
        const sortedHandicaps = [...HANDICAP_VALUES].sort((a, b) => a - b);

        // Keep track of teams still tied after each hole
        let remainingTiedTeams = [...tiedTeams];

        for (const handicap of sortedHandicaps) {
            const holeIndex = HANDICAP_VALUES.indexOf(handicap);

            // If only one team remains, we're done breaking ties
            if (remainingTiedTeams.length <= 1) break;

            // Get scores for this hole from teams still tied
            const holeScores = remainingTiedTeams.map(team => ({
                team: team.team,
                score: team.holes[holeIndex] || 0
            }));

            // Group teams by their score on this hole
            const holeScoreGroups = {};
            holeScores.forEach(h => {
                if (!holeScoreGroups[h.score]) {
                    holeScoreGroups[h.score] = [];
                }
                holeScoreGroups[h.score].push(h.team);
            });

            // Find the lowest score for this hole
            const scores = Object.keys(holeScoreGroups).map(Number).filter(s => s > 0);

            if (scores.length > 0) {
                // There's a difference in scores that can break ties
                const lowestScore = Math.min(...scores);

                // Mark winning holes for teams with lowest score
                if (holeScoreGroups[lowestScore]) {
                    holeScoreGroups[lowestScore].forEach(team => {
                        tieWinningHoles[totalScore][team].push(holeIndex);
                    });
                }

                // Mark tied holes for teams with same score but not the lowest
                scores.filter(score => score !== lowestScore).forEach(score => {
                    if (holeScoreGroups[score]) {
                        holeScoreGroups[score].forEach(team => {
                            tieEqualHoles[totalScore][team].push(holeIndex);
                        });
                    }
                });

                // Update remaining tied teams to only include those with the lowest score
                remainingTiedTeams = remainingTiedTeams.filter(team =>
                    holeScoreGroups[lowestScore] && holeScoreGroups[lowestScore].includes(team.team)
                );
            } else {
                // All teams have no score for this hole yet
                remainingTiedTeams.forEach(team => {
                    tieEqualHoles[totalScore][team.team].push(holeIndex);
                });
            }
        }
    }

    // Sort scores from lowest to highest
    const sortedScores = [...scores].sort((a, b) => {
        if (a.score !== b.score) {
            return a.score - b.score;
        }

        // Apply tiebreaker logic if scores are the same
        return breakTie(a, b);
    });

    // Render each team score
    sortedScores.forEach((score, index) => {
        const row = document.createElement('tr');
        row.className = 'bg-gray-800';

        // Place (rank)
        const placeCell = document.createElement('td');
        placeCell.className = 'px-2 py-2';
        placeCell.textContent = index + 1;
        row.appendChild(placeCell);

        // Team name
        const teamCell = document.createElement('td');
        teamCell.className = 'px-2 py-2';
        teamCell.textContent = score.team;
        row.appendChild(teamCell);

        // Total score
        const totalCell = document.createElement('td');
        totalCell.className = 'px-2 py-2 font-bold';
        totalCell.textContent = score.score;
        row.appendChild(totalCell);

        // To par
        const toParCell = document.createElement('td');
        toParCell.className = 'px-2 py-2';
        toParCell.textContent = score.toPar;
        row.appendChild(toParCell);

        // Individual hole scores
        let frontNineTotal = 0;
        let backNineTotal = 0;

        for (let i = 0; i < 18; i++) {
            const holeScore = score.holes[i];
            const par = PAR_VALUES[i];

            const cell = document.createElement('td');
            cell.className = 'px-2 py-2';
            cell.textContent = holeScore || '-';

            // Check if this is a tie-winning or tie-equal hole for this team
            const isTieWinningHole = tieWinningHoles[score.score] &&
                tieWinningHoles[score.score][score.team] &&
                tieWinningHoles[score.score][score.team].includes(i);

            const isTieEqualHole = tieEqualHoles[score.score] &&
                tieEqualHoles[score.score][score.team] &&
                tieEqualHoles[score.score][score.team].includes(i);

            // Check if this is a skin-winning hole for this team
            const isSkinsWinner = skinsWinners[score.team] &&
                skinsWinners[score.team].includes(i + 1);

            // Color coding based on score relative to par and tie status
            if (holeScore) {
                // First check for skins winner (should be applied regardless of other styles)
                if (isSkinsWinner) {
                    cell.classList.add('skins-winner');
                }

                // Then add appropriate styling class based on score or tiebreaker status
                if (isTieWinningHole) {
                    cell.classList.add('tie-win');
                } else if (isTieEqualHole) {
                    cell.classList.add('tie-equal');
                } else if (holeScore < par - 1) {
                    cell.classList.add('eagle');
                } else if (holeScore === par - 1) {
                    cell.classList.add('birdie');
                } else if (holeScore === par) {
                    cell.classList.add('par');
                } else if (holeScore === par + 1) {
                    cell.classList.add('bogey');
                } else if (holeScore > par + 1) {
                    cell.classList.add('double-bogey');
                }
            }

            row.appendChild(cell);

            // Track front/back nine totals
            if (i < 9) {
                frontNineTotal += holeScore || 0;
            } else {
                backNineTotal += holeScore || 0;
            }

            // Add front nine total after 9th hole
            if (i === 8) {
                const outCell = document.createElement('td');
                outCell.className = 'px-2 py-2 font-bold';
                outCell.textContent = frontNineTotal || '-';
                row.appendChild(outCell);
            }
        }

        // Back nine total
        const inCell = document.createElement('td');
        inCell.className = 'px-2 py-2 font-bold';
        inCell.textContent = backNineTotal || '-';
        row.appendChild(inCell);

        scoreboardBody.appendChild(row);
    });

    // Render the skins summary table
    renderSkinsSummary();
}

// Break ties according to the rules
function breakTie(scoreA, scoreB) {
    // Clone the handicap values to create a sorted list of hardest to easiest holes
    const sortedHandicaps = [...HANDICAP_VALUES].sort((a, b) => a - b);

    // Check scores on each hole, starting with the hardest handicap
    for (const handicap of sortedHandicaps) {
        // Find the hole index with this handicap
        const holeIndex = HANDICAP_VALUES.indexOf(handicap);

        // Get the scores for this hole (using 0 if no score is recorded)
        const scoreAOnHole = scoreA.holes[holeIndex] || 0;
        const scoreBOnHole = scoreB.holes[holeIndex] || 0;

        // Skip this hole if both teams have no score yet
        if (scoreAOnHole === 0 && scoreBOnHole === 0) {
            continue;
        }

        // If a team hasn't played this hole yet but the other has, the one who has played gets the worse position
        if (scoreAOnHole === 0 && scoreBOnHole > 0) {
            return 1; // A comes after B
        }

        if (scoreAOnHole > 0 && scoreBOnHole === 0) {
            return -1; // A comes before B
        }

        // If both have scores and they're different, return the comparison
        if (scoreAOnHole !== scoreBOnHole) {
            return scoreAOnHole - scoreBOnHole; // Lower score wins
        }
    }

    // If still tied after checking all holes, return 0 (completely tied)
    return 0;
}

// Document ready function
document.addEventListener('DOMContentLoaded', function () {
    // Initial setup
    populateTeamSelect();
    loadSavedData();
    calculateSkinsWinners(); // Calculate initial skins
    renderScoreboard();
    populateClosestToPinSelects();
    updateClosestToPinDisplay();

    // Set up form submission handler
    document.getElementById('score-form').addEventListener('submit', handleScoreSubmit);

    // Add team selection event handler
    document.getElementById('team-select').addEventListener('change', populateScoreForm);

    // Add remove score button handler
    document.getElementById('remove-score-btn').addEventListener('click', handleRemoveScore);

    // Initially disable remove button
    document.getElementById('remove-score-btn').disabled = true;

    // Add closest to pin change handlers
    document.getElementById('ctp-hole-4').addEventListener('change', function () {
        handleClosestToPinChange(4, this.value);
    });
    document.getElementById('ctp-hole-6').addEventListener('change', function () {
        handleClosestToPinChange(6, this.value);
    });
    document.getElementById('ctp-hole-9').addEventListener('change', function () {
        handleClosestToPinChange(9, this.value);
    });
    document.getElementById('ctp-hole-13').addEventListener('change', function () {
        handleClosestToPinChange(13, this.value);
    });
});

// Constants
const STORAGE_KEY = 'golf_outing_scores';
const PAR_VALUES = [4, 4, 4, 3, 4, 3, 4, 4, 3, 4, 4, 5, 3, 4, 4, 4, 5, 4];
const HANDICAP_VALUES = [10, 8, 2, 18, 12, 16, 6, 4, 14, 11, 5, 1, 7, 13, 17, 15, 9, 3];
const TOTAL_PAR = 70;

// Team pairings
const PAIRINGS = [{
        team: "Butters & Ben",
        player1: "Butters",
        player2: "Ben",
        handicaps: [6, 31]
    },
    {
        team: "Chris & Waldroff",
        player1: "Chris",
        player2: "Waldroff",
        handicaps: [1, 32]
    },
    {
        team: "Couch & Ray",
        player1: "Couch",
        player2: "Ray",
        handicaps: [14, 25]
    },
    {
        team: "Curry & Brandon",
        player1: "Curry",
        player2: "Brandon",
        handicaps: [9, 29]
    },
    {
        team: "Dan & Jason",
        player1: "Dan",
        player2: "Jason",
        handicaps: [3, 36]
    },
    {
        team: "Foxx & Jack",
        player1: "Foxx",
        player2: "Jack",
        handicaps: [5, 33]
    },
    {
        team: "Guy & Colton",
        player1: "Guy",
        player2: "Colton",
        handicaps: [16, 21]
    },
    {
        team: "Han & Jim",
        player1: "Han",
        player2: "Jim",
        handicaps: [8, 24]
    },
    {
        team: "Jarrett & Trey",
        player1: "Jarrett",
        player2: "Trey",
        handicaps: [2, 35]
    },
    {
        team: "Joe M & Tony",
        player1: "Joe M",
        player2: "Tony",
        handicaps: [17, 22]
    },
    {
        team: "Lane & Houck",
        player1: "Lane",
        player2: "Houck",
        handicaps: [15, 23]
    },
    {
        team: "Meister & Jesse",
        player1: "Meister",
        player2: "Jesse",
        handicaps: [12, 19]
    },
    {
        team: "Merkle & Josh",
        player1: "Merkle",
        player2: "Josh",
        handicaps: [11, 30]
    },
    {
        team: "Minges & Creel",
        player1: "Minges",
        player2: "Creel",
        handicaps: [18, 20]
    },
    {
        team: "Nolan & Miniard",
        player1: "Nolan",
        player2: "Miniard",
        handicaps: [13, 26]
    },
    {
        team: "Randy & Warman",
        player1: "Randy",
        player2: "Warman",
        handicaps: [10, 27]
    },
    {
        team: "Seth & Jeff",
        player1: "Seth",
        player2: "Jeff",
        handicaps: [4, 34]
    },
    {
        team: "Squeek & Noonan",
        player1: "Squeek",
        player2: "Noonan",
        handicaps: [7, 28]
    }
];