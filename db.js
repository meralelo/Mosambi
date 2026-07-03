const Database = require("better-sqlite3");

// This creates a file called mosambi.db in the backend folder
// if it doesn't exist yet, and connects to it if it does.
const db = new Database("mosambi.db");

// Create the users table if it doesn't already exist
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        coins INTEGER DEFAULT 10000,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

module.exports = db;