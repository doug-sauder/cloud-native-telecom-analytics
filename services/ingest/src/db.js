// Database module for Postgres connection and event insertion
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

// Initialize Postgres connection pool from environment variables
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'telecom',
  password: process.env.PGPASSWORD || 'telecom',
  database: process.env.PGDATABASE || 'telecom',
  connectionTimeoutMillis: 5000,
});

// Test database connectivity
async function initialize() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

async function ping() {
  await pool.query('SELECT 1');
}

// Insert PM event into analytics.pm_events table
// Auto-generates event_id as UUID if not provided
// Returns { event_id, inserted } where inserted=false means duplicate
async function insertEvent({
  event_id,
  schema_version = 1,
  source = 'ingest',
  event_time,
  entity_type = 'cell',
  entity_id,
  metrics,
}) {
  const id = event_id || randomUUID();

  const q = `
    INSERT INTO analytics.pm_events
      (event_id, schema_version, source, event_time, entity_type, entity_id, metrics)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id
  `;

  const params = [id, schema_version, source, event_time, entity_type, entity_id, metrics];
  const result = await pool.query(q, params);

  return {
    event_id: id,
    inserted: result.rowCount === 1,
  };
}

export {
  pool,
  initialize,
  ping,
  insertEvent,
};

export default {
  pool,
  initialize,
  ping,
  insertEvent,
};
