require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Note: If using Neon, SSL may be required depending on config.
});

module.exports = pool;
