import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';

function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRESQL_ADDON_URI) return process.env.POSTGRESQL_ADDON_URI;

  const { POSTGRESQL_ADDON_HOST, POSTGRESQL_ADDON_PORT, POSTGRESQL_ADDON_DB, POSTGRESQL_ADDON_USER, POSTGRESQL_ADDON_PASSWORD } = process.env;
  if (POSTGRESQL_ADDON_HOST) {
    return `postgresql://${POSTGRESQL_ADDON_USER}:${POSTGRESQL_ADDON_PASSWORD}@${POSTGRESQL_ADDON_HOST}:${POSTGRESQL_ADDON_PORT}/${POSTGRESQL_ADDON_DB}`;
  }

  throw new Error('No database connection configured');
}

export const pool = new pg.Pool({
  connectionString: getConnectionString(),
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DB_POOL_MAX) || (isProduction ? 10 : 5),
});

export async function runMigrations() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'init.sql'), 'utf8');
  await pool.query(sql);
}

export async function closePool() {
  await pool.end();
}
