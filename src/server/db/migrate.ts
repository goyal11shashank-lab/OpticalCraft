import pg from 'pg';
import { getConnectionString } from '@netlify/database';
import fs from 'fs';
import path from 'path';

export type DatabaseProviderSource = 'NETLIFY_DATABASE' | 'NETLIFY_DB_URL' | 'DATABASE_URL' | 'NONE';

export interface ResolvedDatabaseConnection {
  connectionString?: string;
  source: DatabaseProviderSource;
  providerName: string;
}

export function resolvePostgresConnectionString(): ResolvedDatabaseConnection {
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;

  // 1. Official @netlify/database getConnectionString() helper
  try {
    const netlifyUrl = getConnectionString();
    if (netlifyUrl && typeof netlifyUrl === 'string' && netlifyUrl.trim()) {
      return {
        connectionString: netlifyUrl.trim(),
        source: 'NETLIFY_DATABASE',
        providerName: 'netlify',
      };
    }
  } catch {
    // getConnectionString() throws if NETLIFY_DB_URL is not present
  }

  // 2. Direct NETLIFY_DB_URL environment variable if injected by Netlify platform
  if (process.env.NETLIFY_DB_URL && process.env.NETLIFY_DB_URL.trim()) {
    return {
      connectionString: process.env.NETLIFY_DB_URL.trim(),
      source: 'NETLIFY_DB_URL',
      providerName: 'netlify',
    };
  }

  // 3. Optional local DATABASE_URL fallback for local development ONLY
  if (!isProd && process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    return {
      connectionString: process.env.DATABASE_URL.trim(),
      source: 'DATABASE_URL',
      providerName: 'local_development_postgres',
    };
  }

  return {
    connectionString: undefined,
    source: 'NONE',
    providerName: 'none',
  };
}

export async function runMigration(options: { dryRun?: boolean } = {}) {
  const { connectionString, source, providerName } = resolvePostgresConnectionString();
  const maskedUrl = connectionString ? connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') : '(none)';

  console.log('----------------------------------------------------');
  console.log('OptiCraft Eyewear - Safe Idempotent Schema Migration');
  console.log('----------------------------------------------------');
  console.log(`Database Provider: ${providerName}`);
  console.log(`Connection Source: ${source}`);
  console.log(`Connection URL   : ${maskedUrl}`);
  console.log('----------------------------------------------------');

  if (!connectionString) {
    console.error('ERROR: No database connection string found.');
    console.error('Make sure Netlify Database is provisioned or NETLIFY_DB_URL is set.');
    process.exit(1);
  }

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const isSslDisabled = connectionString.includes('sslmode=disable');
  const requiresSsl = !isLocal && !isSslDisabled;

  const pool = new pg.Pool({
    connectionString,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    try {
      console.log('Connected to PostgreSQL successfully.');
      const res = await client.query('SELECT current_database(), current_user, current_schema(), version()');
      const row = res.rows[0];
      console.log(`Connected Database: ${row.current_database}`);
      console.log(`Connected User    : ${row.current_user}`);
      console.log(`Connected Schema  : ${row.current_schema}`);
      console.log(`PostgreSQL Version: ${row.version}`);
      console.log('----------------------------------------------------');

      // Load SQL schema file
      const schemaPath = path.join(process.cwd(), 'src', 'server', 'db', 'schema.sql');
      let schemaSql = '';
      if (fs.existsSync(schemaPath)) {
        schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      } else {
        throw new Error(`Schema file not found at ${schemaPath}`);
      }

      if (options.dryRun) {
        console.log('Dry run requested. Skipping execution.');
      } else {
        console.log('Applying idempotent schema (CREATE TABLE IF NOT EXISTS)...');
        await client.query(schemaSql);
        console.log('Schema migration applied successfully. No existing data was dropped or truncated.');
      }

      // Query actual tables in public schema
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);

      const tables = tablesRes.rows.map((r: any) => r.table_name);
      console.log('----------------------------------------------------');
      console.log(`Found ${tables.length} tables in PostgreSQL:`);
      for (const tbl of tables) {
        const countRes = await client.query(`SELECT COUNT(*) FROM "${tbl}"`);
        const count = countRes.rows[0].count;
        console.log(`  - ${tbl.padEnd(28)} : ${count} rows`);
      }
      console.log('----------------------------------------------------');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Migration failed with error:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// If invoked directly from CLI
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigration().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
