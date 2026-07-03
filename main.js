// ==========================
// Landing Page
// ==========================
if (window.location.pathname.includes("index.html")) {

    const enterBtn = document.querySelector("button");

    enterBtn.addEventListener("click", () => {
        window.location.href = "login.html";
    });

}

// ==========================
// Login Page
// ==========================
if (window.location.pathname.includes("login.html")) {

    const API_URL = "http://localhost:5000";

    const formTitle = document.getElementById("formTitle");
    const formSubtitle = document.getElementById("formSubtitle");
    const usernameInput = document.getElementById("usernameInput");
    const passwordInput = document.getElementById("passwordInput");
    const submitBtn = document.getElementById("submitBtn");
    const errorMsg = document.getElementById("errorMsg");
    const toggleText = document.getElementById("toggleText");
    const toggleLink = document.getElementById("toggleLink");

    let mode = "login"; // or "register"

    toggleLink.addEventListener("click", (e) => {

        e.preventDefault();
        errorMsg.textContent = "";

        if (mode === "login") {
            mode = "register";
            formTitle.textContent = "CREATE ACCOUNT";
            formSubtitle.textContent = "Register to get started";
            submitBtn.textContent = "Register";
            toggleText.textContent = "Already have an account?";
            toggleLink.textContent = "Login";
        } else {
            mode = "login";
            formTitle.textContent = "WELCOME";
            formSubtitle.textContent = "Login to continue";
            submitBtn.textContent = "Login";
            toggleText.textContent = "Don't have an account?";
            toggleLink.textContent = "Register";
        }

    });

    submitBtn.addEventListener("click", async () => {

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        errorMsg.textContent = "";

        if (!username || !password) {
            errorMsg.textContent = "Please fill in all fields.";
            return;
        }

        const endpoint = mode === "login" ? "/api/login" : "/api/register";

        submitBtn.disabled = true;
        submitBtn.textContent = mode === "login" ? "Logging in..." : "Registering...";

        try {

            const response = await fetch(API_URL + endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                errorMsg.textContent = data.error || "Something went wrong.";
                submitBtn.disabled = false;
                submitBtn.textContent = mode === "login" ? "Login" : "Register";
                return;
            }

            // Save session info in browser
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);
            localStorage.setItem("coins", data.coins);

            // Go to dashboard
            window.location.href = "dashboard.html";

        } catch (err) {
            errorMsg.textContent = "Could not connect to server. Is the backend running?";
            submitBtn.disabled = false;
            submitBtn.textContent = mode === "login" ? "Login" : "Register";
        }

    });

}

// ==========================
// Dashboard Page
// ==========================
if (window.location.pathname.includes("dashboard.html")) {

    const API_URL = "http://localhost:5000";
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
    }

    const usernameEl = document.getElementById("username");
    const coinText = document.getElementById("coins");

    let coins = 0;

    async function loadUserData() {

        try {

            const res = await fetch(API_URL + "/api/me", {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!res.ok) {
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return;
            }

            const data = await res.json();

            usernameEl.textContent = data.username;
            coins = data.coins;
            coinText.textContent = coins;

        } catch (err) {
            alert("Could not connect to server. Is the backend running?");
        }

    }

    loadUserData();

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("coins");
        window.location.href = "login.html";
    });

    // Leaderboard
    async function loadLeaderboard() {

        try {

            const res = await fetch(API_URL + "/api/leaderboard", {
                headers: { "Authorization": "Bearer " + token }
            });

            const players = await res.json();

            const leaderboardBody = document.getElementById("leaderboardBody");
            leaderboardBody.innerHTML = "";

            const myUsername = localStorage.getItem("username");

            players.forEach((player, index) => {

                const row = document.createElement("tr");

                if (player.username === myUsername) {
                    row.classList.add("you");
                }

                let rankClass = "";
                if (index === 0) rankClass = "rank-1";
                else if (index === 1) rankClass = "rank-2";
                else if (index === 2) rankClass = "rank-3";

                row.innerHTML = `
                    <td class="${rankClass}">${index + 1}</td>
                    <td>${player.username}${player.username === myUsername ? " (You)" : ""}</td>
                    <td>${player.coins}</td>
                `;

                leaderboardBody.appendChild(row);

            });

        } catch (err) {
            console.error("Failed to load leaderboard:", err);
        }

    }

    loadLeaderboard();

    // Helper: send a coin change to the server, update UI on success
    async function updateCoins(amount) {

        try {

            const res = await fetch(API_URL + "/api/coins/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ amount })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Something went wrong.");
                return false;
            }

            coins = data.coins;
            coinText.textContent = coins;

            coinText.classList.add("bump");
            setTimeout(() => coinText.classList.remove("bump"), 200);

            loadLeaderboard();

            return true;

        } catch (err) {
            alert("Could not connect to server.");
            return false;
        }

    }

    // Daily Reward
    const rewardBtn = document.getElementById("dailyReward");

    rewardBtn.addEventListener("click", async () => {

        rewardBtn.disabled = true;

        const success = await updateCoins(500);

        if (success) {
            alert("🎉 You received 500 coins!");
        }

        rewardBtn.disabled = false;

    });

    // Coin Flip
    const flipBtn = document.getElementById("coinflip");

    flipBtn.addEventListener("click", async () => {

        if (coins < 100) {
            alert("Not enough coins!");
            return;
        }

        flipBtn.disabled = true;

        const result = Math.random() < 0.5 ? "Heads" : "Tails";
        const change = result === "Heads" ? 100 : -100;

        const success = await updateCoins(change);

        if (success) {
            if (result === "Heads") {
                alert("🪙 Heads! You won 100 coins!");
            } else {
                alert("😢 Tails! You lost 100 coins.");
            }
        }

        flipBtn.disabled = false;

    });

}
// ==========================
// Crash Game
// ==========================
// ==========================
// Crash Game
// ==========================
// ==========================
// Crash Game
// ==========================
if (window.location.pathname.includes("crash.html")) {

    let coins = Number(localStorage.getItem("coins")) || 10000;

    const coinText = document.getElementById("coins");
    const multiplierText = document.getElementById("multiplier");
    const status = document.getElementById("status");
    const countdown = document.getElementById("countdown");

    const betBtn = document.getElementById("betBtn");
    const cashoutBtn = document.getElementById("cashoutBtn");
    const betInput = document.getElementById("betAmount");
    const graphCanvas = document.getElementById("graphCanvas");
    const ctx = graphCanvas.getContext("2d");
    let graphPoints = [];

    function resizeCanvas() {
        graphCanvas.width = graphCanvas.clientWidth;
        graphCanvas.height = graphCanvas.clientHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function drawGraph() {

        resizeCanvas();
        ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

        if (graphPoints.length < 2) return;

        const w = graphCanvas.width;
        const h = graphCanvas.height;

        const maxMultiplier = Math.max(...graphPoints, 2);
        const maxTime = graphPoints.length;

        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#00ff88";
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 12;

        graphPoints.forEach((point, i) => {
            const x = (i / (maxTime - 1)) * w;
            const y = h - (point / maxMultiplier) * h * 0.9 - 5;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Fill under the curve
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 255, 136, 0.1)";
        ctx.shadowBlur = 0;
        ctx.fill();

    }

    coinText.textContent = coins;

    let multiplier = 1.00;
    let gameRunning = false;
    let playerBet = 0;
    let cashedOut = false;
    let hasBet = false;
    let crashPoint = 1.00;
    let roundInterval = null;
    const tickSound = new Audio("sounds/tick.wav");
    const whooshSound = new Audio("sounds/whoosh.wav");
    const explosionSound = new Audio("sounds/explosion.wav");
    const cashoutSound = new Audio("sounds/cashout.wav");

    whooshSound.loop = true;
    whooshSound.volume = 0.4;
    tickSound.volume = 0.5;
    explosionSound.volume = 0.6;
    cashoutSound.volume = 0.6;
    let recentResults = [];
    const recentMultipliersEl = document.getElementById("recentMultipliers");
    const historyBody = document.getElementById("historyBody");

    function addRecentResult(point) {

        recentResults.unshift(point);
        if (recentResults.length > 10) recentResults.pop();

        recentMultipliersEl.innerHTML = "";

        recentResults.forEach((m) => {

            const chip = document.createElement("span");
            chip.classList.add("recent-chip");

            if (m < 2) {
                chip.classList.add("low");
            } else if (m < 5) {
                chip.classList.add("mid");
            } else {
                chip.classList.add("high");
            }

            chip.textContent = m.toFixed(2) + "x";
            recentMultipliersEl.appendChild(chip);

        });

    }

    function addHistoryRow(bet, multiplierAtEnd, won, payout) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${bet}</td>
            <td>${multiplierAtEnd.toFixed(2)}x</td>
            <td class="${won ? 'result-win' : 'result-loss'}">${won ? 'WIN' : 'LOSS'}</td>
            <td>${won ? '+' + payout : '-' + bet}</td>
        `;

        historyBody.prepend(row);

    }

    // Disable cash out until a bet is placed
    cashoutBtn.disabled = true;

    // ----- Pick a random crash point -----
    function generateCrashPoint() {
        // Weighted so low multipliers are more common than huge ones
        // Roughly: often crashes early, occasionally goes big
        const r = Math.random();
        const point = 1 / (1 - r) * 0.9;
        return Math.max(1.00, Math.min(point, 50)); // cap at 50x
    }
multiplier += 0.01 + multiplier * 0.01; // accelerates over time
            multiplierText.textContent = multiplier.toFixed(2) + "x";
    // ----- Countdown before each round -----
    function startRound() {

        multiplier = 1.00;
        cashedOut = false;
        hasBet = false;
        gameRunning = false;
        playerBet = 0;

        multiplierText.textContent = "1.00x";
        multiplierText.className = "glow-green";

        const rocket = document.getElementById("rocket");
        rocket.className = "idle";
        rocket.style.transform = "translateY(0px)";
        rocket.style.opacity = "1";
        graphPoints = [1.00];
        drawGraph();

        betBtn.disabled = false;
        cashoutBtn.disabled = true;

        let seconds = 5;
        countdown.textContent = "Next round in " + seconds + "s";

        const timer = setInterval(() => {

            seconds--;
            countdown.textContent = "Next round in " + seconds + "s";
            tickSound.currentTime = 0;
            tickSound.play();

            if (seconds <= 0) {
                clearInterval(timer);
                countdown.textContent = "";
                status.textContent = "Place your bet!";
            }

        }, 1000);

    }

    // ----- Place Bet -----
    betBtn.addEventListener("click", () => {

        const betAmount = Number(betInput.value);

        if (!betAmount || betAmount <= 0) {
            alert("Enter a valid bet amount.");
            return;
        }

        if (betAmount > coins) {
            alert("Not enough coins!");
            return;
        }

        // Deduct bet immediately
        playerBet = betAmount;
        coins -= betAmount;
        coinText.textContent = coins;
        localStorage.setItem("coins", coins);

        hasBet = true;
        gameRunning = true;
        cashedOut = false;

        betBtn.disabled = true;
        cashoutBtn.disabled = false;

        crashPoint = generateCrashPoint();
    
        status.textContent = "Round in progress...";

        whooshSound.currentTime = 0;
        whooshSound.play();

        // ----- Multiplier climb loop -----
        roundInterval = setInterval(() => {

            multiplier += 0.01 + multiplier * 0.01; // accelerates over time
            multiplierText.textContent = multiplier.toFixed(2) + "x";
            graphPoints.push(multiplier);
            drawGraph();

            // Neon color tiers based on multiplier value
            if (multiplier < 2) {
                multiplierText.className = "glow-green";
            } else if (multiplier < 5) {
                multiplierText.className = "glow-yellow";
            } else if (multiplier < 10) {
                multiplierText.className = "glow-orange";
            } else {
                multiplierText.className = "glow-red";
            }

            // Rocket flies upward and shakes as multiplier climbs
            const rocket = document.getElementById("rocket");
            rocket.className = "flying";
            const liftPx = Math.min(multiplier * 8, 120); // caps how high it flies
            rocket.style.transform = "translateY(-" + liftPx + "px)";

            if (multiplier >= crashPoint) {

                clearInterval(roundInterval);
                gameRunning = false;

                multiplierText.className = "glow-red";

                const rocketEl = document.getElementById("rocket");
                const boxEl = document.querySelector(".multiplier-box");
                const explosionEl = document.getElementById("explosionEmoji");

                 whooshSound.pause();
                whooshSound.currentTime = 0;

                explosionSound.currentTime = 0;
                explosionSound.play();

                rocketEl.className = "exploding";
                boxEl.classList.add("shake", "flash");

                explosionEl.className = "show";

                // Clean up animation classes after they finish
                setTimeout(() => {
                    rocketEl.className = "";
                    rocketEl.style.opacity = "0";
                    boxEl.classList.remove("shake", "flash");
                    explosionEl.className = "";
                }, 600);

                status.textContent = "💥 Crashed at " + crashPoint.toFixed(2) + "x!";
                cashoutBtn.disabled = true;

                if (!cashedOut && hasBet) {
                    status.textContent += " You lost your bet.";
                    addHistoryRow(playerBet, crashPoint, false, 0);
                }

                addRecentResult(crashPoint);

                setTimeout(startRound, 3000);

            }

        }, 100);

    });

    // ----- Cash Out -----
    cashoutBtn.addEventListener("click", () => {

        if (!gameRunning || cashedOut || !hasBet) return;

        cashedOut = true;
        gameRunning = false;

        clearInterval(roundInterval);

        whooshSound.pause();
        whooshSound.currentTime = 0;

        cashoutSound.currentTime = 0;
        cashoutSound.play();

        const winnings = Math.floor(playerBet * multiplier);
        coins += winnings;

        coinText.textContent = coins;
        localStorage.setItem("coins", coins);

        multiplierText.className = "glow-green";
        document.getElementById("rocket").className = "idle";
        status.textContent = "✅ Cashed out at " + multiplier.toFixed(2) + "x! Won " + winnings + " coins.";

        addHistoryRow(playerBet, multiplier, true, winnings);
        addRecentResult(multiplier);
        cashoutBtn.disabled = true;

        setTimeout(startRound, 3000);

    });

    // Start the first round when the page loads
    startRound();

}

