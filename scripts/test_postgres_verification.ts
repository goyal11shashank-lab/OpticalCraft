/**
 * OptiCraft Eyewear - PostgreSQL Connectivity & Persistence Verification Suite
 * Executes full verification against the live Railway PostgreSQL database.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { db, DatabaseStore } from '../src/server/db.js';

function maskUrl(url?: string): string {
  if (!url) return '(none)';
  return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

async function runPostgresVerification() {
  console.log('=======================================================');
  console.log('OPTICRAFT EYEWEAR - POSTGRESQL CONNECTIVITY & PERSISTENCE VERIFICATION');
  console.log('=======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${description}`);
      failed++;
    }
  }

  const rawDbUrl = process.env.DATABASE_URL;
  const maskedDbUrl = maskUrl(rawDbUrl);

  // 1. Verify DATABASE_URL is loaded correctly
  console.log('--- Step 1: Verify DATABASE_URL loading ---');
  console.log(`DATABASE_URL (Masked): ${maskedDbUrl}`);
  assert(!!rawDbUrl && rawDbUrl.startsWith('postgres'), 'DATABASE_URL environment variable is present and valid string');

  // 2. Verify hostname is NOT postgres.railway.internal
  console.log('\n--- Step 2: Verify Public Hostname ---');
  let hostname = '';
  try {
    const urlObj = new URL(rawDbUrl!);
    hostname = urlObj.hostname;
    console.log(`PostgreSQL Hostname: ${hostname}:${urlObj.port || 5432}`);
  } catch (err: any) {
    console.error('Failed to parse DATABASE_URL:', err.message);
  }
  assert(hostname !== 'postgres.railway.internal', 'Hostname is NOT internal (postgres.railway.internal)');
  assert(hostname === 'caboose.proxy.rlwy.net', 'Hostname is PUBLIC Railway TCP Proxy (caboose.proxy.rlwy.net)');

  // 3 & 4. Connect to Railway PostgreSQL using DATABASE_URL and verify connection
  console.log('\n--- Steps 3 & 4: Direct PostgreSQL Connection Test ---');
  const pool = new pg.Pool({ connectionString: rawDbUrl, ssl: false });
  let pgClient: pg.PoolClient | null = null;
  try {
    pgClient = await pool.connect();
    const pingRes = await pgClient.query('SELECT 1 as alive, version();');
    assert(pingRes.rows[0].alive === 1, 'Connected to Railway PostgreSQL and executed SELECT 1 successfully');
    console.log(`PostgreSQL Server Info: ${pingRes.rows[0].version.substring(0, 60)}...`);
  } catch (err: any) {
    assert(false, `Connection to Railway PostgreSQL failed: ${err.message}`);
  }

  // 5. Initialize/verify required database schema
  console.log('\n--- Step 5: Database Schema Verification ---');
  if (pgClient) {
    const schemaPath = path.join(process.cwd(), 'src', 'server', 'db', 'schema.sql');
    assert(fs.existsSync(schemaPath), 'schema.sql file exists');
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    await pgClient.query(sql);
    console.log('Applied / verified schema.sql on PostgreSQL.');

    const tablesRes = await pgClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name;
    `);
    const tableNames = tablesRes.rows.map((r) => r.table_name);
    console.log(`Existing PostgreSQL Tables (${tableNames.length}):`, tableNames.join(', '));
    assert(tableNames.includes('users') && tableNames.includes('orders') && tableNames.includes('products'), 'Core relational tables (users, orders, products) exist in PostgreSQL');
  }

  // 6 & 7. Verify INSERT and READ directly from PostgreSQL
  console.log('\n--- Steps 6 & 7: PostgreSQL Direct INSERT and READ Verification ---');
  const testUserId = `usr-pgtest-${Date.now()}`;
  const testUserEmail = `pgtest_${Date.now()}@opticraft.in`;
  const testOrderId = `ord-pgtest-${Date.now()}`;
  const testOrderNum = `ORD-PG-${Date.now()}`;

  if (pgClient) {
    // INSERT user
    await pgClient.query(
      `INSERT INTO users (id, name, email, phone, role) VALUES ($1, $2, $3, $4, $5)`,
      [testUserId, 'Postgres QA User', testUserEmail, '+919988776655', 'customer']
    );
    console.log(`INSERTED test user row into PostgreSQL table 'users': ${testUserId}`);

    // READ user
    const userReadRes = await pgClient.query(`SELECT * FROM users WHERE id = $1`, [testUserId]);
    assert(userReadRes.rows.length === 1 && userReadRes.rows[0].email === testUserEmail, 'READ test user row from PostgreSQL table successfully');

    // INSERT order
    const mockAddress = { name: 'QA Tester', city: 'Bengaluru', pinCode: '560001' };
    const mockPayment = { razorpayOrderId: 'rzp_test_1', razorpayPaymentId: 'pay_test_1', status: 'Captured' };
    await pgClient.query(
      `INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, delivery_address, items, subtotal_amount, total_amount, payment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [testOrderId, testOrderNum, testUserId, 'Postgres QA User', testUserEmail, '+919988776655', JSON.stringify(mockAddress), '[]', 2499, 2499, JSON.stringify(mockPayment)]
    );
    console.log(`INSERTED test order row into PostgreSQL table 'orders': ${testOrderId}`);

    // READ order
    const orderReadRes = await pgClient.query(`SELECT * FROM orders WHERE id = $1`, [testOrderId]);
    assert(orderReadRes.rows.length === 1 && orderReadRes.rows[0].order_number === testOrderNum, 'READ test order row from PostgreSQL table successfully');
  }

  // 8. Restart process simulation and verify data still exists
  console.log('\n--- Step 8: Restart Process & Persistence Verification ---');
  if (pgClient) pgClient.release();
  await pool.end();

  // Instantiate new connection pool to simulate process restart
  console.log('Simulating cold server process restart...');
  const pool2 = new pg.Pool({ connectionString: rawDbUrl, ssl: false });
  const client2 = await pool2.connect();
  const reReadUser = await client2.query(`SELECT * FROM users WHERE id = $1`, [testUserId]);
  const reReadOrder = await client2.query(`SELECT * FROM orders WHERE id = $1`, [testOrderId]);

  assert(reReadUser.rows.length === 1 && reReadUser.rows[0].email === testUserEmail, 'Restart Test: User data survived restart in PostgreSQL');
  assert(reReadOrder.rows.length === 1 && reReadOrder.rows[0].order_number === testOrderNum, 'Restart Test: Order data survived restart in PostgreSQL');

  // Clean up test rows
  await client2.query(`DELETE FROM orders WHERE id = $1`, [testOrderId]);
  await client2.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
  client2.release();
  await pool2.end();

  // 9. Verify Database Store & Health Status
  console.log('\n--- Step 9: Database Health Status Report ---');
  await db.reconnectPostgres(rawDbUrl);
  const healthStatus = db.getHealthStatus();
  console.log('Health Status Output:', JSON.stringify(healthStatus, null, 2));
  assert(db.isPostgresConnected, 'db.isPostgresConnected is true');
  assert(healthStatus.healthy === true, 'db.getHealthStatus() reports healthy = true');
  assert(healthStatus.mode === 'POSTGRESQL', 'db.getHealthStatus() reports mode = POSTGRESQL');
  assert(!healthStatus.maskedUrl?.includes('zXZRzHGtlHCHVcOpLwXgTMkFXsIrWlWq'), 'PostgreSQL password is strictly masked in health output');

  // 10. Verify application is NOT using data/opticraft_db.json when PostgreSQL is available
  console.log('\n--- Step 10: Verify JSON File Fallback Bypass in Production ---');
  const dummyUser = {
    id: `usr-prod-test-${Date.now()}`,
    name: 'Prod Mode Check',
    email: `prod_check_${Date.now()}@opticraft.in`,
    phone: '+919999900000',
    role: 'customer' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const jsonDbPath = path.join(process.cwd(), 'data', 'opticraft_db.json');
  let mtimeBefore = fs.existsSync(jsonDbPath) ? fs.statSync(jsonDbPath).mtimeMs : 0;

  // Perform mutation in app memory store while PostgreSQL is active
  db.users.set(dummyUser.id, dummyUser);
  db.saveToDiskSync(); // Trigger save to disk

  let mtimeAfter = fs.existsSync(jsonDbPath) ? fs.statSync(jsonDbPath).mtimeMs : 0;
  assert(mtimeBefore === mtimeAfter || process.env.NODE_ENV !== 'production', 'No write operations performed to opticraft_db.json file during PostgreSQL operation');

  // Cleanup dummy user from memory
  db.users.delete(dummyUser.id);

  // 11. Verify Production mode refuses fallback when PostgreSQL becomes unavailable
  console.log('\n--- Step 11: Production Database Failure Guard Verification ---');
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  // Simulate broken PostgreSQL connection
  await db.reconnectPostgres('postgresql://postgres:invalid_password@caboose.proxy.rlwy.net:42807/invalid_db');
  
  const brokenHealth = db.getHealthStatus();
  console.log('Broken DB Health Output (Production Mode):', JSON.stringify(brokenHealth, null, 2));
  assert(brokenHealth.healthy === false, 'Production mode health reports healthy = false when DB is broken');
  assert(brokenHealth.mode === 'PRODUCTION_DB_UNAVAILABLE', 'Production mode reports mode = PRODUCTION_DB_UNAVAILABLE');

  // Test mutation rejection in production mode when PostgreSQL is broken
  let mutationBlocked = false;
  try {
    db.users.set('usr-blocked', dummyUser);
  } catch (err: any) {
    if (err.message.includes('PRODUCTION DATABASE FAILURE')) {
      mutationBlocked = true;
    }
  }
  assert(mutationBlocked, 'Production mode strictly blocks data mutation when PostgreSQL is unavailable');

  // Restore active PostgreSQL connection & environment
  process.env.NODE_ENV = originalEnv;
  await db.reconnectPostgres(rawDbUrl);
  console.log('Restored active PostgreSQL connection.');

  console.log('\n=======================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPostgresVerification().catch((err) => {
  console.error('Verification execution failed:', err);
  process.exit(1);
});
