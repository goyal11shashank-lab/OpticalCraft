/**
 * OptiCraft Eyewear - Phase 9A Acceptance & Readiness Test Suite
 * Tests Data Persistence, Database Schemas, Process Restart Safety,
 * Inventory Race Condition Safety, Payment Idempotency, and File Storage Security.
 */

import path from 'path';
import fs from 'fs';
import { DatabaseStore } from '../src/server/db.js';
import { LocalFileStorageProvider } from '../src/server/fileStorageProvider.js';
import { User, Address, Order, Prescription, InventoryRecord, AuditLogRecord, ShipmentRecord } from '../src/types.js';

async function runPhase9aTests() {
  console.log('=======================================================');
  console.log('OPTICRAFT EYEWEAR - PHASE 9A QA & PERSISTENCE TEST SUITE');
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

  const testDbFile = path.join(process.cwd(), 'data', 'test_phase9a_db.json');
  if (fs.existsSync(testDbFile)) {
    fs.unlinkSync(testDbFile);
  }

  // Instantiate clean test database store
  const db = new DatabaseStore(testDbFile);

  // --- 1. Database Connection & Basic Persistence ---
  console.log('--- 1. Database Connection & Record Persistence ---');
  assert(db !== null && db.users !== undefined, 'Database instance initialized successfully');

  // Test User Persistence
  const testUser: User = {
    id: 'usr-p9a-001',
    name: 'Karan Malhotra',
    email: 'karan.m@opticraft.in',
    phone: '+919876500099',
    role: 'customer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.users.set(testUser.id, testUser);
  assert(db.users.get('usr-p9a-001')?.email === 'karan.m@opticraft.in', 'User record persisted in store');

  // Test Product Persistence
  const p = db.products.get('prod-fern-classic-black');
  assert(p !== undefined && p.sku === 'OPT-FCB-001', 'Product catalog record retrieved from persistent DAL');

  // Test Address Persistence
  const testAddr: Address = {
    id: 'addr-p9a-101',
    userId: testUser.id,
    name: 'Karan Malhotra',
    phone: '+919876500099',
    houseFlat: 'Apt 12B',
    streetLocality: 'MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560001',
  };
  db.addresses.set(testAddr.id, testAddr);
  assert(db.addresses.get('addr-p9a-101')?.city === 'Bengaluru', 'Address record persisted in store');

  // Test Prescription Persistence
  const testRx: Prescription = {
    id: 'rx-p9a-201',
    userId: testUser.id,
    title: 'Karan Specs Rx',
    odRight: { sph: -2.0, cyl: -0.5, axis: 180 },
    osLeft: { sph: -1.75, cyl: -0.25, axis: 175 },
    pd: 64,
    verificationStatus: 'Verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.prescriptions.set(testRx.id, testRx);
  assert(db.prescriptions.get('rx-p9a-201')?.pd === 64, 'Prescription record persisted in store');

  // Test Order & Payment Persistence
  const testOrder: Order = {
    id: 'ord-p9a-301',
    orderNumber: 'ORD-2026-P9A',
    userId: testUser.id,
    customerName: 'Karan Malhotra',
    customerEmail: 'karan.m@opticraft.in',
    customerPhone: '+919876500099',
    deliveryAddress: testAddr,
    items: [],
    subtotalAmount: 1499,
    discountAmount: 0,
    deliveryFee: 0,
    totalAmount: 1499,
    status: 'Confirmed',
    prescriptionVerificationStatus: 'Verified',
    payment: {
      id: 'pay-p9a-301',
      razorpayOrderId: 'order_p9a_rzp_123',
      razorpayPaymentId: 'pay_p9a_rzp_456',
      amount: 1499,
      currency: 'INR',
      paymentMethod: 'UPI',
      status: 'Captured',
      createdAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.orders.set(testOrder.id, testOrder);
  assert(db.orders.get('ord-p9a-301')?.orderNumber === 'ORD-2026-P9A', 'Order record persisted in store');
  assert(db.orders.get('ord-p9a-301')?.payment.status === 'Captured', 'Payment record persisted in store');

  // Test Inventory & Shipment Persistence
  const inv = db.inventory.get('prod-fern-classic-black');
  assert(inv !== undefined && inv.stockCount > 0, 'Inventory record retrieved from store');

  const testShipment: ShipmentRecord = {
    id: 'ship-p9a-401',
    orderId: testOrder.id,
    courierName: 'BlueDart Express',
    awbNumber: 'AWB9988776655',
    status: 'In Transit',
    shippedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.shipments.set(testOrder.id, testShipment);
  assert(db.shipments.get(testOrder.id)?.awbNumber === 'AWB9988776655', 'Shipment record persisted in store');

  // Test Audit Log Persistence
  const testAudit: AuditLogRecord = {
    id: 'log-p9a-501',
    adminId: 'adm-super-1',
    adminName: 'Super Admin',
    adminRole: 'SUPER_ADMIN',
    action: 'TEST_PERSISTENCE',
    entity: 'Order',
    entityId: testOrder.id,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.set(testAudit.id, testAudit);
  assert(db.auditLogs.get('log-p9a-501')?.action === 'TEST_PERSISTENCE', 'Audit log record persisted in store');

  // --- 2. RESTART TEST (CRITICAL) ---
  console.log('\n--- 2. SERVER RESTART PERSISTENCE TEST (CRITICAL) ---');
  // Explicitly sync database to disk
  db.saveToDiskSync();
  assert(fs.existsSync(testDbFile), 'Database state saved to physical disk file');

  // Simulate server shutdown and cold reboot by instantiating fresh DatabaseStore from test file
  const restartedDb = new DatabaseStore(testDbFile);

  assert(restartedDb.users.get('usr-p9a-001')?.email === 'karan.m@opticraft.in', 'Restart Test: User data survived restart');
  assert(restartedDb.addresses.get('addr-p9a-101')?.city === 'Bengaluru', 'Restart Test: Address data survived restart');
  assert(restartedDb.prescriptions.get('rx-p9a-201')?.pd === 64, 'Restart Test: Prescription data survived restart');
  assert(restartedDb.orders.get('ord-p9a-301')?.orderNumber === 'ORD-2026-P9A', 'Restart Test: Order data survived restart');
  assert(restartedDb.shipments.get(testOrder.id)?.awbNumber === 'AWB9988776655', 'Restart Test: Shipment data survived restart');
  assert(restartedDb.auditLogs.get('log-p9a-501')?.action === 'TEST_PERSISTENCE', 'Restart Test: Audit logs survived restart');

  // --- 3. Inventory Transaction Safety & Concurrency ---
  console.log('\n--- 3. Inventory Transaction Safety & Concurrency ---');
  const testProdId = 'prod-titan-gold-round';
  const initialStock = db.inventory.get(testProdId)!.availableCount;

  // Perform atomic deduction
  const deductResult = await db.checkAndDeductInventoryAtomic(
    [{ productId: testProdId, quantity: 1 }],
    'ORD-CONCUR-001',
    'System QA'
  );
  assert(deductResult.success, 'Atomic inventory deduction succeeded');
  assert(db.inventory.get(testProdId)!.availableCount === initialStock - 1, 'Stock quantity correctly decremented');

  // Test Race Condition Protection (concurrent purchases exceeding remaining stock)
  db.inventory.get(testProdId)!.availableCount = 1; // set to exactly 1 remaining
  const p1 = db.checkAndDeductInventoryAtomic([{ productId: testProdId, quantity: 1 }], 'RACE-1', 'User A');
  const p2 = db.checkAndDeductInventoryAtomic([{ productId: testProdId, quantity: 1 }], 'RACE-2', 'User B');

  const [res1, res2] = await Promise.all([p1, p2]);
  const raceSuccesses = [res1, res2].filter((r) => r.success).length;
  assert(raceSuccesses === 1, 'Concurrent inventory lock allowed exactly 1 buyer for final stock');

  // --- 4. Payment Idempotency ---
  console.log('\n--- 4. Payment Idempotency ---');
  const mockRzpOrderId = 'order_idemp_1001';
  const mockRzpPaymentId = 'pay_idemp_2002';

  let creationCount = 0;
  const processor = async () => {
    creationCount++;
    return {
      id: `ord-idemp-${Date.now()}`,
      orderNumber: 'ORD-IDEMP-001',
      customerName: 'Test Customer',
      customerEmail: 'test@opticraft.in',
      customerPhone: '+919900011122',
      deliveryAddress: testAddr,
      items: [],
      subtotalAmount: 1999,
      discountAmount: 0,
      deliveryFee: 0 as const,
      totalAmount: 1999,
      status: 'Confirmed' as const,
      prescriptionVerificationStatus: 'Not Required' as const,
      payment: {
        id: 'pay-idemp-1',
        razorpayOrderId: mockRzpOrderId,
        razorpayPaymentId: mockRzpPaymentId,
        amount: 1999,
        currency: 'INR' as const,
        paymentMethod: 'UPI' as const,
        status: 'Captured' as const,
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const call1 = await db.processPaymentIdempotent(mockRzpOrderId, mockRzpPaymentId, processor);
  const call2 = await db.processPaymentIdempotent(mockRzpOrderId, mockRzpPaymentId, processor);

  assert(!call1.isDuplicate, 'First payment processing created order');
  assert(call2.isDuplicate, 'Duplicate payment callback recognized as duplicate');
  assert(creationCount === 1, 'Duplicate payment webhook executed processor function EXACTLY ONCE');

  // --- 5. Security & Private Prescription Access ---
  console.log('\n--- 5. Security & Private Prescription Access ---');
  const testStorageDir = path.join(process.cwd(), 'data', 'test_private_uploads');
  const storageProvider = new LocalFileStorageProvider(testStorageDir);

  // Upload valid file
  const validBuffer = Buffer.from('PDF-1.5 %OptiCraft Prescribed Prescription Optical Slip Bytes%');
  const uploadRes = await storageProvider.upload({
    buffer: validBuffer,
    filename: 'dr_sharma_rx.pdf',
    mimeType: 'application/pdf',
    customerId: 'usr-customer-1',
  });
  assert(uploadRes.storageKey.startsWith('rx_sec_'), 'FileStorageProvider generated private non-predictable storage key');

  // Retrieval
  const downloadRes = await storageProvider.download(uploadRes.storageKey);
  assert(downloadRes.mimeType === 'application/pdf', 'Retrieved private prescription document has valid mime type');

  // Test Invalid File Type Rejection
  let invalidTypeFailed = false;
  try {
    await storageProvider.upload({
      buffer: Buffer.from('Malicious Executable Content'),
      filename: 'malicious.exe',
      mimeType: 'application/x-msdownload',
      customerId: 'usr-customer-1',
    });
  } catch (err: any) {
    invalidTypeFailed = true;
  }
  assert(invalidTypeFailed, 'FileStorageProvider rejected invalid executable mime type');

  // Test Oversized File Rejection (>10MB)
  let oversizedFailed = false;
  try {
    const hugeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    await storageProvider.upload({
      buffer: hugeBuffer,
      filename: 'huge_scan.pdf',
      mimeType: 'application/pdf',
      customerId: 'usr-customer-1',
    });
  } catch (err: any) {
    oversizedFailed = true;
  }
  assert(oversizedFailed, 'FileStorageProvider strictly rejected file exceeding 10MB limit');

  // Cleanup test files
  if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
  if (fs.existsSync(testStorageDir)) fs.rmSync(testStorageDir, { recursive: true, force: true });

  console.log('\n=======================================================');
  console.log(`PHASE 9A TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase9aTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
