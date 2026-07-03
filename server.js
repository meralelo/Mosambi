require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const authenticateToken = require("./middleware");

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

// ==========================
// Register
// ==========================
app.post("/api/register", (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    if (password.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters." });
    }

    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);

    if (existing) {
        return res.status(400).json({ error: "Username already taken." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.prepare(
        "INSERT INTO users (username, password) VALUES (?, ?)"
    ).run(username, hashedPassword);

    const token = jwt.sign(
        { id: result.lastInsertRowid, username: username },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({
        token,
        username,
        coins: 10000
    });

});

// ==========================
// Login
// ==========================
app.post("/api/login", (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

    if (!user) {
        return res.status(400).json({ error: "Invalid username or password." });
    }

    const passwordMatches = bcrypt.compareSync(password, user.password);

    if (!passwordMatches) {
        return res.status(400).json({ error: "Invalid username or password." });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({
        token,
        username: user.username,
        coins: user.coins
    });

});
// ==========================
// Get current user info (coins, username)
// ==========================
app.get("/api/me", authenticateToken, (req, res) => {

    const user = db.prepare("SELECT username, coins FROM users WHERE id = ?").get(req.user.id);

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    res.json(user);

});
// ==========================
// Leaderboard (top 10 by coins)
// ==========================
app.get("/api/leaderboard", authenticateToken, (req, res) => {

    const topUsers = db.prepare(
        "SELECT username, coins FROM users ORDER BY coins DESC LIMIT 10"
    ).all();

    res.json(topUsers);

});

// ==========================
// Update coins (add or subtract)
// ==========================
app.post("/api/coins/update", authenticateToken, (req, res) => {

    const { amount } = req.body; // can be positive (win) or negative (loss/bet)

    if (typeof amount !== "number") {
        return res.status(400).json({ error: "Amount must be a number." });
    }

    const user = db.prepare("SELECT coins FROM users WHERE id = ?").get(req.user.id);

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    const newBalance = user.coins + amount;

    if (newBalance < 0) {
        return res.status(400).json({ error: "Insufficient coins." });
    }

    db.prepare("UPDATE users SET coins = ? WHERE id = ?").run(newBalance, req.user.id);

    res.json({ coins: newBalance });

});
// ==========================
// Start server
// ==========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ MOSAMBI backend running on http://localhost:${PORT}`);
});