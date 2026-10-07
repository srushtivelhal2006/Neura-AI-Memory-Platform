const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.database.url,
  min: env.database.poolMin,
  max: env.database.poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

pool.on('connect', () => {
  if (env.isDev) {
    console.log('📦 New PostgreSQL connection established');
  }
});

async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (env.isDev && duration > 100) {
      console.log(`🐢 Slow query (${duration}ms):`, text.substring(0, 80));
    }
    return result;
  } catch (err) {
    console.error('PostgreSQL query error:', err.message);
    console.error('Query:', text.substring(0, 200));
    throw err;
  }
}

async function getClient() {
  const client = await pool.connect();
  return client;
}

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() as now');
    console.log('✅ PostgreSQL connected at', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    return false;
  }
}

async function close() {
  await pool.end();
  console.log('PostgreSQL pool closed');
}

module.exports = { pool, query, getClient, testConnection, close };
