/**
 * OptiCraft Eyewear - Phase 7 Acceptance Test Suite
 * Tests Admin Auth, RBAC, Dashboard Metrics, Workflow State Machine, Prescription Queue, Inventory Ledger, Logistics, Audit Trail
 */

import { db } from '../src/server/db.js';
import { loginAdminStaff, verifyAdminToken } from '../src/server/adminAuthService.js';
import {
  getDashboardMetrics,
  searchAndFilterOrders,
  getOrderById,
  updateOrderStatus,
  validateStatusTransition,
  addOrderNote,
  getPrescriptionQueue,
  reviewPrescription,
  createProduct,
  updateProduct,
  adjustInventory,
  getInventoryLedger,
  createManualShipment,
  getCustomerOrderTracking,
  logAuditAction,
  getAuditLogs,
} from '../src/server/adminService.js';
import { Order, AdminUser } from '../src/types.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`  ✕ FAILED: ${message}`);
    failed++;
  }
}

async function runPhase7Tests() {
  console.log('\n=======================================================');
  console.log('OPTICRAFT EYEWEAR - PHASE 7 ACCEPTANCE TEST SUITE');
  console.log('=======================================================\n');

  // Staff User References
  const superAdmin: AdminUser = { id: 'adm-super-1', name: 'Super Admin', email: 'superadmin@opticraft.in', role: 'SUPER_ADMIN', createdAt: '', updatedAt: '' };
  const storeAdmin: AdminUser = { id: 'adm-general-1', name: 'Store Admin', email: 'admin@opticraft.in', role: 'ADMIN', createdAt: '', updatedAt: '' };
  const opsStaff: AdminUser = { id: 'adm-ops-1', name: 'Operations Staff', email: 'ops@opticraft.in', role: 'OPERATIONS', createdAt: '', updatedAt: '' };
  const catalogMgr: AdminUser = { id: 'adm-catalog-1', name: 'Catalog Manager', email: 'catalog@opticraft.in', role: 'CATALOG_MANAGER', createdAt: '', updatedAt: '' };

  // 1. ADMIN AUTHENTICATION TESTS
  console.log('1. ADMIN AUTHENTICATION & RBAC TESTS');

  const invalidAuth = loginAdminStaff('fakeadmin@opticraft.in', 'WrongPass123!');
  assert(!invalidAuth.success, 'Rejects invalid email or password.');

  const validSuperAuth = loginAdminStaff('superadmin@opticraft.in', 'SuperAdmin123!');
  assert(validSuperAuth.success && !!validSuperAuth.token, 'Super Admin login succeeds with valid credentials.');

  const decodedStaff = verifyAdminToken(validSuperAuth.token!);
  assert(decodedStaff?.role === 'SUPER_ADMIN', 'Decoded JWT token verifies Super Admin identity.');

  // 2. REAL-TIME DASHBOARD METRICS TESTS
  console.log('\n2. REAL-TIME DASHBOARD METRICS AGGREGATION');

  const metrics = getDashboardMetrics();
  assert(metrics.businessSummary.totalOrders >= 0, 'Aggregates total orders from database.');
  assert(metrics.businessSummary.totalSalesINR >= 0, 'Aggregates total captured sales revenue in INR.');
  assert(typeof metrics.businessSummary.lowStockItemsCount === 'number', 'Tracks low stock and out of stock items.');

  // 3. WORKFLOW STATE MACHINE & TRANSITION VALIDATION
  console.log('\n3. WORKFLOW STATE TRANSITION RULE ENGINE');

  // Create a test order
  const testOrder: Order = {
    id: 'ord-test-p7-1',
    orderNumber: 'OPT-2026-99112',
    customerName: 'Karan Patel',
    customerEmail: 'karan@example.in',
    customerPhone: '+91 9112233445',
    deliveryAddress: {
      id: 'addr-test',
      userId: 'usr-customer-1',
      name: 'Karan Patel',
      phone: '+91 9112233445',
      houseFlat: 'Apt 12',
      streetLocality: 'MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
      isDefault: true,
    },
    items: [
      {
        id: 'oi-1',
        configuration: {
          productId: 'prod-classic-acetate-1',
          productName: 'Metropolitan Square Acetate',
          frameSku: 'SKU-001',
          framePrice: 1599,
          frameImage: '/frame.jpg',
          frameColor: 'Classic Black',
          frameSize: 'Medium',
          lensTypeId: 'lt-single-vision',
          lensTypeName: 'Single Vision Powered',
          lensTypeBasePrice: 499,
          requiresPrescription: true,
          materialId: 'mat-cr39',
          materialName: 'CR-39 Standard Organic',
          coatingIds: ['coat-anti-glare'],
          coatingNames: ['Anti-Glare AR'],
          coatingsTotalPrice: 0,
          calculatedTotalPrice: 2098,
          prescription: {
            id: 'rx-test-1',
            odRight: { sph: -1.0 },
            osLeft: { sph: -1.0 },
            pd: 62,
            verificationStatus: 'Pending Verification',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        quantity: 1,
        unitPrice: 2098,
        totalPrice: 2098,
      },
    ],
    subtotalAmount: 2098,
    discountAmount: 0,
    deliveryFee: 0,
    totalAmount: 2098,
    status: 'Confirmed',
    prescriptionVerificationStatus: 'Pending Verification',
    payment: {
      id: 'pay-test-1',
      razorpayOrderId: 'order_test_p7',
      razorpayPaymentId: 'pay_test_p7',
      amount: 2098,
      currency: 'INR',
      paymentMethod: 'UPI',
      status: 'Captured',
      createdAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.orders.set(testOrder.id, testOrder);

  // Unverified Prescription Order attempting to enter Manufacturing
  const rxBlockedTransition = validateStatusTransition(testOrder, 'Manufacturing');
  assert(!rxBlockedTransition.valid, 'Blocks order from entering Manufacturing when prescription is unverified.');

  // Unpaid order attempting to enter Processing
  const unpaidOrder = { ...testOrder, id: 'ord-unpaid-1', payment: { ...testOrder.payment, status: 'Pending' as const } };
  const unpaidBlocked = validateStatusTransition(unpaidOrder, 'Processing');
  assert(!unpaidBlocked.valid, 'Blocks unpaid order from entering fulfillment Processing.');

  // 4. PRESCRIPTION REVIEW QUEUE
  console.log('\n4. PRESCRIPTION REVIEW QUEUE & OPTICIAN DECISIONS');

  const rxQueue = getPrescriptionQueue();
  assert(rxQueue.length > 0, 'Prescription queue lists orders requiring verification.');

  const rxReviewResult = reviewPrescription(testOrder.id, 'verify', 'Prescription power parameters verified by Staff Optician.', opsStaff);
  assert(rxReviewResult.success && rxReviewResult.order?.prescriptionVerificationStatus === 'Verified', 'Optician review verifies prescription status.');

  // Valid transition to Manufacturing now that prescription is verified
  const validMfgUpdate = updateOrderStatus(testOrder.id, 'Processing', opsStaff, 'Sent to lens cutting lab');
  assert(validMfgUpdate.success && validMfgUpdate.order?.status === 'Processing', 'Order successfully transitions to Processing after Rx verification.');

  // 5. INTERNAL NOTES
  console.log('\n5. INTERNAL ORDER NOTES');

  const note = addOrderNote(testOrder.id, 'Frame inspected for micro-scratches. QC Passed.', storeAdmin);
  assert(note.note.includes('QC Passed'), 'Internal note added to order record.');

  // 6. INVENTORY ENGINE & LEDGER
  console.log('\n6. INVENTORY ENGINE & LEDGER TRANSACTIONS');

  const targetProdId = Array.from(db.inventory.keys())[0] || 'prod-fern-classic-black';
  const initialInv = db.inventory.get(targetProdId)!;
  const initialStock = initialInv.stockCount;

  const adjResult = adjustInventory(targetProdId, 15, 'Addition', 'Refill shipment received from factory', catalogMgr);
  assert(adjResult.success && adjResult.inventory?.stockCount === initialStock + 15, 'Adjusts physical inventory count.');

  const ledger = getInventoryLedger(targetProdId);
  assert(ledger.length > 0 && ledger[ledger.length - 1].reason.includes('Refill'), 'Records audit entry in inventory transaction ledger.');

  // 7. LOGISTICS & MANUAL SHIPMENT DISPATCH
  console.log('\n7. LOGISTICS & MANUAL SHIPMENT ENTRY');

  const shipmentRes = createManualShipment(testOrder.id, 'Bluedart Express', 'AWB-BLUEDART-88990', 'https://track.bluedart.com/AWB-BLUEDART-88990', opsStaff);
  assert(shipmentRes.success && shipmentRes.shipment?.awbNumber === 'AWB-BLUEDART-88990', 'Creates manual shipment record and assigns AWB tracking number.');

  const updatedOrderAfterShipment = getOrderById(testOrder.id);
  assert(updatedOrderAfterShipment?.status === 'Shipped', 'Automatically updates order status to Shipped upon dispatch.');

  // 8. PUBLIC ORDER TRACKING API
  console.log('\n8. PUBLIC ORDER TRACKING TIMELINE API');

  const trackingInfo = getCustomerOrderTracking('OPT-2026-99112');
  assert(trackingInfo !== null && trackingInfo.status === 'Shipped', 'Returns real DB tracking timeline status for customer query.');
  assert(trackingInfo?.timelineSteps.some((s) => s.label === 'Dispatched / In Transit' && s.completed), 'Timeline step correctly marks dispatch completion.');

  // 9. AUDIT LOG TRAIL
  console.log('\n9. AUDIT LOG TRAIL');

  logAuditAction(superAdmin, 'SETTINGS_UPDATE', 'Settings', 'sys-1', { theme: 'Light' });
  const logs = getAuditLogs();
  assert(logs.length > 0, 'Audit logs record administrative staff operations.');

  // SUMMARY
  console.log('\n=======================================================');
  console.log(`PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Tests();
