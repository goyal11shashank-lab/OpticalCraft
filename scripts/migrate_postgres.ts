/**
 * OptiCraft Eyewear - Production PostgreSQL Database Migration Script
 * 
 * Executed to apply relational schema constraints and migrate initial data
 * when a production PostgreSQL instance is provisioned.
 * 
 * Usage:
 *   DATABASE_URL="postgres://user:pass@host:5432/dbname" npx tsx scripts/migrate_postgres.ts
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { db } from '../src/server/db.js';

async function runPostgresMigration() {
  const dbUrl = process.env.DATABASE_URL;

  const maskUrl = (url?: string) => url ? url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') : '(none)';

  console.log('=======================================================');
  console.log('OPTICRAFT EYEWEAR - POSTGRESQL MIGRATION RUNNER');
  console.log('=======================================================\n');

  if (!dbUrl || dbUrl.includes('localhost:5432') || dbUrl.includes('opticraft_user')) {
    console.log('ℹ️ DATABASE_URL is not set or uses placeholder credentials.');
    console.log('   The application is currently running on durable file-backed persistence.');
    console.log('   When your PostgreSQL database is provisioned, set DATABASE_URL and re-run this script.\n');
    console.log('Current DATABASE_URL:', maskUrl(dbUrl));
    return;
  }

  console.log(`Connecting to PostgreSQL database (${maskUrl(dbUrl)})...`);
  const pool = new pg.Pool({ connectionString: dbUrl, ssl: false });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully.');

    // 1. Apply Schema
    const schemaPath = path.join(process.cwd(), 'src', 'server', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      console.log('Executing relational schema creation (schema.sql)...');
      await client.query(sql);
      console.log('✅ PostgreSQL Schema & Constraints applied successfully.');
    } else {
      console.error('❌ schema.sql file not found at:', schemaPath);
    }

    // 2. Export / Migrate existing records from store into PostgreSQL
    console.log('Migrating product catalog items into PostgreSQL...');
    
    for (const p of db.products.values()) {
      await client.query(
        `INSERT INTO products (id, sku, name, brand, category, description, price, original_price, discount_percentage, stock, active, is_featured, images, frame_details, allowed_lens_type_ids)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock, price = EXCLUDED.price;`,
        [
          p.id, p.sku, p.name, p.brand, p.category, p.description || '',
          p.price, p.originalPrice, p.discountPercentage || 0, p.stock,
          p.active, p.isFeatured || false,
          JSON.stringify(p.images || []),
          JSON.stringify(p.frame || {}),
          JSON.stringify(p.allowedLensTypeIds || [])
        ]
      );
    }
    console.log(`✅ Migrated ${db.products.size} product catalog items.`);

    client.release();
    await pool.end();

    console.log('\n=======================================================');
    console.log('POSTGRESQL MIGRATION COMPLETE & READY');
    console.log('=======================================================');
  } catch (err: any) {
    console.error('❌ PostgreSQL Migration failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

runPostgresMigration();
