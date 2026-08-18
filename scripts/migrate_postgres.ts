/**
 * OptiCraft Eyewear - Production PostgreSQL Database Migration Script
 * 
 * Executed to apply relational schema constraints and verify table structures
 * using the Netlify Database connection (or local PostgreSQL).
 * 
 * Usage:
 *   npm run db:migrate
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { runMigration } from '../src/server/db/migrate.js';

runMigration().catch((err) => {
  console.error(err);
  process.exit(1);
});
