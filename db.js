const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');

// Connection pooling for Postgres
let pool;
let sqlite;

const isProduction = !!process.env.DATABASE_URL;

if (isProduction) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    console.log("Using PostgreSQL Database");
} else {
    sqlite = new Database(path.join(__dirname, 'hearth.db'));
    console.log("Using SQLite Database");
}

// Helper to normalize placeholders for Postgres if needed
function formatQuery(text) {
    if (!isProduction || typeof text !== 'string') return text;
    let index = 1;
    return text.replace(/\?/g, () => `$${index++}`);
}

// Helper to run queries across either DB
async function query(text, params = []) {
    const formatted = formatQuery(text);
    try {
        if (isProduction) {
            return (await pool.query(formatted, params)).rows;
        } else {
            return sqlite.prepare(text).all(params);
        }
    } catch (err) {
        console.error("DB Query Error:", { formatted, params, error: err.message });
        throw err;
    }
}

async function run(text, params = []) {
    const formatted = formatQuery(text);
    try {
        if (isProduction) {
            await pool.query(formatted, params);
        } else {
            sqlite.prepare(text).run(params);
        }
    } catch (err) {
        console.error("DB Run Error:", { formatted, params, error: err.message });
        throw err;
    }
}

// Initial Schema Setup
const initDb = async () => {
    const schemas = [
        `CREATE TABLE IF NOT EXISTS users (
            identifier TEXT PRIMARY KEY,
            password_hash TEXT,
            verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS verifications (
            ref TEXT PRIMARY KEY,
            code_hash TEXT,
            identifier TEXT,
            expires_at BIGINT
        )`,
        `CREATE TABLE IF NOT EXISTS otps (
            ref TEXT PRIMARY KEY,
            otp_hash TEXT,
            identifier TEXT,
            expires_at BIGINT
        )`,
        `CREATE TABLE IF NOT EXISTS invoices (
            reference_number TEXT PRIMARY KEY,
            id TEXT,
            customer_id TEXT,
            amount DECIMAL,
            currency TEXT,
            description TEXT,
            status TEXT,
            checkout_request_id TEXT,
            created_at TEXT,
            expires_at TEXT,
            paid_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS password_resets (
            ref TEXT PRIMARY KEY,
            token_hash TEXT,
            identifier TEXT,
            expires_at BIGINT
        )`
    ];

    for (const schema of schemas) {
        try {
            await run(schema);
        } catch (err) {
            console.warn("Table initialization hint:", err.message);
        }
    }

    // Migration: Add checkout_request_id if missing
    try {
        if (isProduction) {
            await run(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS checkout_request_id TEXT`);
        } else {
            const columns = await query(`PRAGMA table_info(invoices)`);
            const hasColumn = columns.some(c => c.name === 'checkout_request_id');
            if (!hasColumn) {
                await run(`ALTER TABLE invoices ADD COLUMN checkout_request_id TEXT`);
            }
        }
    } catch (e) {
        console.warn("Migration warning:", e.message);
    }

    // Migration: Add user profile columns if missing
    try {
        if (isProduction) {
            await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`);
            await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`);
            await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
            await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP`);
            await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_path TEXT`);
            await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences TEXT`);
        } else {
            const userColumns = await query(`PRAGMA table_info(users)`);
            const colNames = userColumns.map(c => c.name);
            if (!colNames.includes('name')) await run(`ALTER TABLE users ADD COLUMN name TEXT`);
            if (!colNames.includes('phone')) await run(`ALTER TABLE users ADD COLUMN phone TEXT`);
            if (!colNames.includes('bio')) await run(`ALTER TABLE users ADD COLUMN bio TEXT`);
            if (!colNames.includes('updated_at')) await run(`ALTER TABLE users ADD COLUMN updated_at TIMESTAMP`);
            if (!colNames.includes('avatar_path')) await run(`ALTER TABLE users ADD COLUMN avatar_path TEXT`);
            if (!colNames.includes('preferences')) await run(`ALTER TABLE users ADD COLUMN preferences TEXT`);
        }
    } catch (e) {
        console.warn("User profile migration warning:", e.message);
    }
};

module.exports = {
    query,
    run,
    initDb
};
