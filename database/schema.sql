-- Hearth & Heal application schema
-- PostgreSQL-compatible schema used by the app runtime and Render deployments.
-- Keep compatibility with the current auth code while supporting the full signup profile.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    identifier TEXT UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    date_of_birth DATE,
    country VARCHAR(100) DEFAULT 'Kenya',
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    bio TEXT,
    avatar_path TEXT,
    preferences TEXT
);

CREATE TABLE IF NOT EXISTS verifications (
    ref TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    identifier TEXT NOT NULL,
    expires_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS otps (
    ref TEXT PRIMARY KEY,
    otp_hash TEXT NOT NULL,
    identifier TEXT NOT NULL,
    expires_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
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
);

CREATE TABLE IF NOT EXISTS password_resets (
    ref TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL,
    identifier TEXT NOT NULL,
    expires_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users (verified);
CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications (identifier);
CREATE INDEX IF NOT EXISTS idx_otps_identifier ON otps (identifier);
CREATE INDEX IF NOT EXISTS idx_password_resets_identifier ON password_resets (identifier);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices (customer_id);
