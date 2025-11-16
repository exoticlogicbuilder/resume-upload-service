const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const sslEnabled = (process.env.PGSSLMODE && process.env.PGSSLMODE !== 'disable') || process.env.PGSSL === 'true';
const poolConfig = connectionString ? { connectionString } : {};

if (sslEnabled) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

module.exports = { pool };
