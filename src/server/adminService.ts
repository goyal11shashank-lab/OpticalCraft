/**
 * OptiCraft Eyewear - Admin Operations & Business Logic Service (Phase 7)
 */

import { db } from './db.js';
import {
  AdminUser,
  AdminDashboardMetrics,
  Order,
  OrderStatus,
  OrderNote,
  ShipmentRecord,
  InventoryRecord,
  InventoryTransaction,
  AuditLogRecord,
  CancellationRecord,
  ReturnRecord,
  Product,
  LensType,
  LensMaterial,
  Coating,
} from '../types.js';

// =======================================================
// 1. DASHBOARD METRICS ENGINE
// =======================================================

export function getDashboardMetrics(): AdminDashboardMetrics {
  const allOrders = Array.from(db.orders.values());
  const allInventory = Array.from(db.inventory.values());
  const todayStr = new Date().toISOString().split('T')[0];

  const todayOrders = allOrders.filter((o) => o.createdAt.startsWith(todayStr));

  let totalSalesINR = 0;
  let pendingPaymentsCount = 0;
  let pendingPrescriptionCount = 0;

  allOrders.forEach((o) => {
    if (o.payment.status === 'Captured') {
      totalSalesINR += o.totalAmount;
    } else if (o.payment.status === 'Pending') {
      pendingPaymentsCount++;
    }

    if (o.prescriptionVerificationStatus === 'Pending Verification') {
      pendingPrescriptionCount++;
    }
  });

  let lowStockItemsCount = 0;
  let outOfStockItemsCount = 0;

  allInventory.forEach((inv) => {
    if (inv.availableCount <= 0) {
      outOfStockItemsCount++;
    } else if (inv.availableCount <= inv.lowStockThreshold) {
      lowStockItemsCount++;
    }
  });

  return {
    today: {
      newOrders: todayOrders.length,
      paidOrders: todayOrders.filter((o) => o.payment.status === 'Captured').length,
      pendingPrescriptionCount: todayOrders.filter((o) => o.prescriptionVerificationStatus === 'Pending Verification').length,
      ordersProcessing: todayOrders.filter((o) => o.status === 'Processing' || o.status === 'Manufacturing').length,
      ordersReadyToShip: todayOrders.filter((o) => o.status === 'Ready to Dispatch').length,
      ordersShipped: todayOrders.filter((o) => o.status === 'Shipped').length,
      ordersDelivered: todayOrders.filter((o) => o.status === 'Delivered').length,
    },
    businessSummary: {
      totalOrders: allOrders.length,
      totalSalesINR,
      pendingPaymentsCount,
      pendingPrescriptionCount,
      lowStockItemsCount,
      outOfStockItemsCount,
    },
  };
}

// =======================================================
// 2. AUDIT LOG ENGINE
// =======================================================

export function logAuditAction(
  adminUser: AdminUser,
  action: string,
  entity: AuditLogRecord['entity'],
  entityId: string,
  metadata?: Record<string, any>
): AuditLogRecord {
  const log: AuditLogRecord = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    adminId: adminUser.id,
    adminName: adminUser.name,
    adminRole: adminUser.role,
    action,
    entity,
    entityId,
    metadata,
    timestamp: new Date().toISOString(),
  };

  db.auditLogs.set(log.id, log);
  return log;
}

export function getAuditLogs(entity?: string, limit = 50): AuditLogRecord[] {
  let logs = Array.from(db.auditLogs.values());
  if (entity) {
    logs = logs.filter((l) => l.entity === entity);
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
}

// =======================================================
// 3. NOTIFICATION SERVICE ABSTRACTION
// =======================================================

export type NotificationEvent =
  | 'Order Confirmed'
  | 'Prescription Requires Clarification'
  | 'Prescription Verified'
  | 'Order Processing'
  | 'Ready to Dispatch'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Payment Failed';

export interface NotificationPayload {
  event: NotificationEvent;
  orderId: string;
  orderNumber: string;
  recipientEmail: string;
  recipientPhone: string;
  message: string;
  timestamp: string;
}

const notificationLog: NotificationPayload[] = [];

export function triggerNotification(event: NotificationEvent, order: Order, customMessage?: string): NotificationPayload {
  const payload: NotificationPayload = {
    event,
    orderId: order.id,
    orderNumber: order.orderNumber,
    recipientEmail: order.customerEmail,
    recipientPhone: order.customerPhone,
    message: customMessage || `Update for Order #${order.orderNumber}: Status is now '${order.status}'.`,
    timestamp: new Date().toISOString(),
  };

  notificationLog.push(payload);
  console.log(`[NOTIFICATION SERVICE] Event '${event}' triggered for Order #${order.orderNumber} -> ${order.customerEmail}`);
  return payload;
}

export function getNotificationLogs(): NotificationPayload[] {
  return [...notificationLog];
}

// =======================================================
// 4. ORDER MANAGEMENT & WORKFLOW TRANSITION ENGINE
// =======================================================

export function searchAndFilterOrders(params: {
  query?: string;
  status?: string;
  paymentStatus?: string;
  prescriptionStatus?: string;
  limit?: number;
}): Order[] {
  let orders = Array.from(db.orders.values());

  if (params.query) {
    const q = params.query.trim().toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.payment.razorpayOrderId && o.payment.razorpayOrderId.toLowerCase().includes(q)) ||
        (o.payment.razorpayPaymentId && o.payment.razorpayPaymentId.toLowerCase().includes(q))
    );
  }

  if (params.status && params.status !== 'ALL') {
    orders = orders.filter((o) => o.status === params.status);
  }

  if (params.paymentStatus && params.paymentStatus !== 'ALL') {
    orders = orders.filter((o) => o.payment.status === params.paymentStatus);
  }

  if (params.prescriptionStatus && params.prescriptionStatus !== 'ALL') {
    orders = orders.filter((o) => o.prescriptionVerificationStatus === params.prescriptionStatus);
  }

  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return params.limit ? orders.slice(0, params.limit) : orders;
}

export function getOrderById(orderId: string): Order | null {
  const order = db.orders.get(orderId);
  if (!order) return null;

  // Attach internal notes and shipment if available
  const notes = db.orderNotes.get(orderId) || [];
  const shipment = db.shipments.get(orderId);

  return {
    ...order,
    notes,
    shipment,
  };
}

/**
 * Validates Order Status Workflow Transitions
 */
export function validateStatusTransition(
  order: Order,
  targetStatus: OrderStatus
): { valid: boolean; error?: string } {
  const currentStatus = order.status;

  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  // Rule 1: Payment Verification Check
  // Unpaid orders cannot enter fulfillment states
  const fulfillmentStates: OrderStatus[] = [
    'Processing',
    'Manufacturing',
    'Ready to Dispatch',
    'Shipped',
    'Delivered',
  ];

  if (fulfillmentStates.includes(targetStatus) && order.payment.status !== 'Captured') {
    return {
      valid: false,
      error: `Cannot transition unpaid order to '${targetStatus}'. Payment status must be 'Captured'.`,
    };
  }

  // Rule 2: Prescription Verification Check
  // Prescription required orders cannot enter Manufacturing, Ready to Dispatch, Shipped, or Delivered until Verified
  const postRxManufacturingStates: OrderStatus[] = [
    'Manufacturing',
    'Ready to Dispatch',
    'Shipped',
    'Delivered',
  ];

  const requiresPrescriptionVerification = order.items.some((item) => item.configuration.requiresPrescription);

  if (
    requiresPrescriptionVerification &&
    postRxManufacturingStates.includes(targetStatus) &&
    order.prescriptionVerificationStatus !== 'Verified'
  ) {
    return {
      valid: false,
      error: `Cannot transition order to '${targetStatus}' because prescription verification is still '${order.prescriptionVerificationStatus}'. Must be 'Verified'.`,
    };
  }

  // Rule 3: Valid State Transition Flow Rules
  const allowedNextStates: Record<OrderStatus, OrderStatus[]> = {
    'Payment Pending': ['Confirmed', 'Cancelled'],
    Confirmed: ['Prescription Verification', 'Processing', 'Cancelled'],
    'Prescription Verification': ['Processing', 'Cancelled'],
    Processing: ['Manufacturing', 'Ready to Dispatch', 'Cancelled'],
    Manufacturing: ['Ready to Dispatch', 'Cancelled'],
    'Ready to Dispatch': ['Shipped', 'Cancelled'],
    Shipped: ['Delivered', 'Returned', 'Cancelled'],
    Delivered: ['Returned'],
    Cancelled: [],
    Returned: [],
  };

  const allowed = allowedNextStates[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      error: `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed next states: ${allowed.join(', ') || 'None'}.`,
    };
  }

  return { valid: true };
}

export function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  adminUser: AdminUser,
  noteText?: string
): { success: boolean; order?: Order; error?: string } {
  const order = db.orders.get(orderId);
  if (!order) {
    return { success: false, error: 'Order not found.' };
  }

  const transitionCheck = validateStatusTransition(order, newStatus);
  if (!transitionCheck.valid) {
    return { success: false, error: transitionCheck.error };
  }

  const prevStatus = order.status;
  order.status = newStatus;
  order.updatedAt = new Date().toISOString();

  // Update status history
  if (!order.statusHistory) {
    order.statusHistory = [
      {
        status: prevStatus,
        updatedBy: 'System Initial',
        timestamp: order.createdAt,
      },
    ];
  }

  order.statusHistory.push({
    status: newStatus,
    updatedBy: `${adminUser.name} (${adminUser.role})`,
    timestamp: new Date().toISOString(),
    note: noteText,
  });

  db.orders.set(orderId, order);

  // If status is Cancelled, release inventory
  if (newStatus === 'Cancelled') {
    releaseOrderInventory(order, adminUser, 'Order Cancelled by Operations');
  }

  // Add internal note if provided
  if (noteText) {
    addOrderNote(orderId, `Status changed from '${prevStatus}' to '${newStatus}'. Note: ${noteText}`, adminUser);
  }

  // Log Audit Action
  logAuditAction(adminUser, 'ORDER_STATUS_CHANGE', 'Order', orderId, {
    orderNumber: order.orderNumber,
    fromStatus: prevStatus,
    toStatus: newStatus,
  });

  // Trigger Notification Abstraction
  const notificationMap: Partial<Record<OrderStatus, NotificationEvent>> = {
    Processing: 'Order Processing',
    'Ready to Dispatch': 'Ready to Dispatch',
    Shipped: 'Shipped',
    Delivered: 'Delivered',
  };

  if (notificationMap[newStatus]) {
    triggerNotification(notificationMap[newStatus]!, order);
  }

  return { success: true, order: getOrderById(orderId)! };
}

// =======================================================
// 5. INTERNAL ORDER NOTES
// =======================================================

export function addOrderNote(orderId: string, noteText: string, adminUser: AdminUser): OrderNote {
  const note: OrderNote = {
    id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId,
    authorName: adminUser.name,
    authorRole: adminUser.role,
    note: noteText,
    createdAt: new Date().toISOString(),
  };

  const existing = db.orderNotes.get(orderId) || [];
  existing.push(note);
  db.orderNotes.set(orderId, existing);

  logAuditAction(adminUser, 'ADD_ORDER_NOTE', 'Order', orderId, { noteId: note.id });

  return note;
}

export function getOrderNotes(orderId: string): OrderNote[] {
  return db.orderNotes.get(orderId) || [];
}

// =======================================================
// 6. PRESCRIPTION QUEUE & REVIEW
// =======================================================

export function getPrescriptionQueue(statusFilter?: string): Array<{
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  lensTypeName: string;
  prescriptionStatus: string;
  prescription?: any;
  createdAt: string;
}> {
  const orders = Array.from(db.orders.values());
  const queue: any[] = [];

  orders.forEach((o) => {
    o.items.forEach((item) => {
      if (item.configuration.requiresPrescription || item.configuration.prescription) {
        const rxStatus = o.prescriptionVerificationStatus;
        if (!statusFilter || statusFilter === 'ALL' || rxStatus === statusFilter) {
          queue.push({
            orderId: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            productName: item.configuration.productName,
            lensTypeName: item.configuration.lensTypeName,
            prescriptionStatus: rxStatus,
            prescription: item.configuration.prescription,
            createdAt: o.createdAt,
          });
        }
      }
    });
  });

  return queue.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function reviewPrescription(
  orderId: string,
  action: 'verify' | 'clarification' | 'reject',
  verificationNote: string,
  adminUser: AdminUser
): { success: boolean; order?: Order; error?: string } {
  const order = db.orders.get(orderId);
  if (!order) {
    return { success: false, error: 'Order not found.' };
  }

  let newRxStatus: Order['prescriptionVerificationStatus'];

  if (action === 'verify') {
    newRxStatus = 'Verified';
  } else if (action === 'clarification') {
    newRxStatus = 'Clarification Required';
  } else {
    newRxStatus = 'Rejected';
  }

  order.prescriptionVerificationStatus = newRxStatus;
  order.updatedAt = new Date().toISOString();

  // Update prescription object inside order items
  order.items.forEach((item) => {
    if (item.configuration.prescription) {
      item.configuration.prescription.verificationStatus =
        action === 'verify' ? 'Verified' : 'Rejected / Requires Clarification';
      item.configuration.prescription.verificationNote = verificationNote;
    }
  });

  db.orders.set(orderId, order);

  // Add internal note
  addOrderNote(
    orderId,
    `Prescription status updated to '${newRxStatus}'. Review Note: ${verificationNote || 'N/A'}`,
    adminUser
  );

  // Log audit
  logAuditAction(adminUser, 'PRESCRIPTION_REVIEW', 'Prescription', orderId, {
    action,
    newRxStatus,
    verificationNote,
  });

  // Notification
  if (action === 'verify') {
    triggerNotification('Prescription Verified', order);
  } else if (action === 'clarification') {
    triggerNotification('Prescription Requires Clarification', order, verificationNote);
  }

  return { success: true, order: getOrderById(orderId)! };
}

// =======================================================
// 7. PRODUCT MANAGEMENT ENGINE
// =======================================================

export function createProduct(
  productInput: Partial<Product>,
  adminUser: AdminUser
): { success: boolean; product?: Product; error?: string } {
  if (!productInput.name || !productInput.price || !productInput.category) {
    return { success: false, error: 'Product name, price, and category are required.' };
  }

  const productId = productInput.id || `prod-${Date.now()}`;
  const sku = productInput.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`;

  const newProduct: Product = {
    id: productId,
    sku,
    name: productInput.name,
    brand: productInput.brand || 'OptiCraft Signature',
    category: productInput.category,
    description: productInput.description || 'Premium handcrafted optical frame.',
    price: Number(productInput.price),
    originalPrice: Number(productInput.originalPrice || productInput.price),
    discountPercentage: Number(
      productInput.originalPrice
        ? Math.round(((productInput.originalPrice - productInput.price) / productInput.originalPrice) * 100)
        : 0
    ),
    stock: Number(productInput.stock || 25),
    active: productInput.active !== undefined ? Boolean(productInput.active) : true,
    isFeatured: Boolean(productInput.isFeatured),
    images: productInput.images && productInput.images.length > 0 ? productInput.images : ['/frames/default.png'],
    frame: productInput.frame || {
      shape: 'Square',
      size: 'Medium',
      color: 'Classic Black',
      material: 'Acetate',
      rimType: 'Full Rim',
      gender: 'Unisex',
      frameWidthMm: 138,
      bridgeWidthMm: 18,
      templeLengthMm: 145,
    },
    allowedLensTypeIds: productInput.allowedLensTypeIds || ['lt-plain', 'lt-single-vision', 'lt-progressive'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.products.set(productId, newProduct);

  // Initialize Inventory record
  db.inventory.set(productId, {
    productId,
    sku,
    stockCount: newProduct.stock,
    reservedCount: 0,
    availableCount: newProduct.stock,
    lowStockThreshold: 5,
    status: newProduct.stock > 10 ? 'In Stock' : newProduct.stock > 0 ? 'Low Stock' : 'Out of Stock',
    lastUpdated: new Date().toISOString(),
  });

  // Initialize Inventory Ledger
  db.inventoryLedger.set(productId, [
    {
      id: `tx-${Date.now()}`,
      productId,
      sku,
      quantityChange: newProduct.stock,
      type: 'Addition',
      reason: 'New Product Created',
      performedBy: `${adminUser.name} (${adminUser.role})`,
      timestamp: new Date().toISOString(),
    },
  ]);

  logAuditAction(adminUser, 'CREATE_PRODUCT', 'Product', productId, { name: newProduct.name, sku });

  return { success: true, product: newProduct };
}

export function updateProduct(
  productId: string,
  updates: Partial<Product>,
  adminUser: AdminUser
): { success: boolean; product?: Product; error?: string } {
  const existing = db.products.get(productId);
  if (!existing) {
    return { success: false, error: 'Product not found.' };
  }

  const updatedProduct: Product = {
    ...existing,
    ...updates,
    id: productId, // Immutable ID
    updatedAt: new Date().toISOString(),
  };

  // Recalculate price discounts if price updated
  if (updates.price || updates.originalPrice) {
    const p = Number(updatedProduct.price);
    const op = Number(updatedProduct.originalPrice || p);
    updatedProduct.discountPercentage = op > p ? Math.round(((op - p) / op) * 100) : 0;
  }

  db.products.set(productId, updatedProduct);

  logAuditAction(adminUser, 'UPDATE_PRODUCT', 'Product', productId, { updates });

  return { success: true, product: updatedProduct };
}

export function toggleProductActive(productId: string, active: boolean, adminUser: AdminUser) {
  return updateProduct(productId, { active }, adminUser);
}

// =======================================================
// 8. LENS CATALOG & COMPATIBILITY MANAGEMENT
// =======================================================

export function manageLensType(
  lensTypeInput: Partial<LensType>,
  adminUser: AdminUser
): { success: boolean; lensType?: LensType; error?: string } {
  if (!lensTypeInput.name) {
    return { success: false, error: 'Lens type name is required.' };
  }

  const id = lensTypeInput.id || `lt-${Date.now()}`;
  const existing = db.lensTypes.get(id);

  const lensType: LensType = {
    id,
    name: lensTypeInput.name,
    description: lensTypeInput.description || existing?.description || '',
    basePrice: Number(lensTypeInput.basePrice ?? existing?.basePrice ?? 0),
    requiresPrescription: Boolean(lensTypeInput.requiresPrescription ?? existing?.requiresPrescription ?? false),
    applicableCategories: lensTypeInput.applicableCategories || existing?.applicableCategories || ['Eyeglasses'],
    active: lensTypeInput.active !== undefined ? Boolean(lensTypeInput.active) : true,
  };

  db.lensTypes.set(id, lensType);

  logAuditAction(adminUser, existing ? 'UPDATE_LENS_TYPE' : 'CREATE_LENS_TYPE', 'Catalog', id, { name: lensType.name });

  return { success: true, lensType };
}

export function manageLensMaterial(
  materialInput: Partial<LensMaterial>,
  adminUser: AdminUser
): { success: boolean; material?: LensMaterial; error?: string } {
  if (!materialInput.name) {
    return { success: false, error: 'Lens material name is required.' };
  }

  const id = materialInput.id || `mat-${Date.now()}`;
  const existing = db.lensMaterials.get(id);

  const material: LensMaterial = {
    id,
    name: materialInput.name,
    description: materialInput.description || existing?.description || '',
    additionalPrice: Number(materialInput.additionalPrice ?? existing?.additionalPrice ?? 0),
    indexRating: materialInput.indexRating || existing?.indexRating || '1.50',
    compatibilityLensTypeIds: materialInput.compatibilityLensTypeIds || existing?.compatibilityLensTypeIds || ['lt-plain', 'lt-single-vision'],
    active: materialInput.active !== undefined ? Boolean(materialInput.active) : true,
  };

  db.lensMaterials.set(id, material);

  logAuditAction(adminUser, existing ? 'UPDATE_MATERIAL' : 'CREATE_MATERIAL', 'Catalog', id, { name: material.name });

  return { success: true, material };
}

export function manageLensCoating(
  coatingInput: Partial<Coating>,
  adminUser: AdminUser
): { success: boolean; coating?: Coating; error?: string } {
  if (!coatingInput.name) {
    return { success: false, error: 'Coating name is required.' };
  }

  const id = coatingInput.id || `coat-${Date.now()}`;
  const existing = db.coatings.get(id);

  const coating: Coating = {
    id,
    name: coatingInput.name,
    description: coatingInput.description || existing?.description || '',
    additionalPrice: Number(coatingInput.additionalPrice ?? existing?.additionalPrice ?? 0),
    isBlueCut: Boolean(coatingInput.isBlueCut ?? existing?.isBlueCut ?? false),
    compatibilityMaterialIds: coatingInput.compatibilityMaterialIds || existing?.compatibilityMaterialIds || ['mat-cr39', 'mat-polycarbonate'],
    active: coatingInput.active !== undefined ? Boolean(coatingInput.active) : true,
  };

  db.coatings.set(id, coating);

  logAuditAction(adminUser, existing ? 'UPDATE_COATING' : 'CREATE_COATING', 'Catalog', id, { name: coating.name });

  return { success: true, coating };
}

export function updateFrameLensCompatibility(
  productId: string,
  allowedLensTypeIds: string[],
  adminUser: AdminUser
) {
  const p = db.products.get(productId);
  if (!p) return { success: false, error: 'Product not found.' };

  p.allowedLensTypeIds = allowedLensTypeIds;
  p.updatedAt = new Date().toISOString();
  db.products.set(productId, p);

  logAuditAction(adminUser, 'UPDATE_FRAME_LENS_COMPATIBILITY', 'Catalog', productId, { allowedLensTypeIds });
  return { success: true, product: p };
}

// =======================================================
// 9. INVENTORY ENGINE & LEDGER
// =======================================================

export function adjustInventory(
  productId: string,
  quantityChange: number,
  type: InventoryTransaction['type'],
  reason: string,
  adminUser: AdminUser
): { success: boolean; inventory?: InventoryRecord; error?: string } {
  const inv = db.inventory.get(productId);
  const prod = db.products.get(productId);

  if (!inv) {
    return { success: false, error: 'Inventory record not found.' };
  }

  if (type === 'Sale' || type === 'Adjustment' || type === 'Reservation') {
    if (inv.availableCount + quantityChange < 0) {
      return {
        success: false,
        error: `Insufficient available inventory. Current available: ${inv.availableCount}, requested reduction: ${Math.abs(quantityChange)}. Overselling prevented.`,
      };
    }
  }

  inv.stockCount = Math.max(0, inv.stockCount + quantityChange);
  inv.availableCount = Math.max(0, inv.stockCount - inv.reservedCount);
  inv.status = inv.availableCount > 10 ? 'In Stock' : inv.availableCount > 0 ? 'Low Stock' : 'Out of Stock';
  inv.lastUpdated = new Date().toISOString();

  db.inventory.set(productId, inv);

  if (prod) {
    prod.stock = inv.stockCount;
    db.products.set(productId, prod);
  }

  // Record Ledger transaction
  const ledgerTx: InventoryTransaction = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId,
    sku: inv.sku,
    quantityChange,
    type,
    reason,
    performedBy: `${adminUser.name} (${adminUser.role})`,
    timestamp: new Date().toISOString(),
  };

  const existingLedger = db.inventoryLedger.get(productId) || [];
  existingLedger.push(ledgerTx);
  db.inventoryLedger.set(productId, existingLedger);

  logAuditAction(adminUser, 'INVENTORY_ADJUSTMENT', 'Inventory', productId, {
    quantityChange,
    type,
    reason,
    newAvailable: inv.availableCount,
  });

  return { success: true, inventory: inv };
}

export function reserveOrderInventory(order: Order, adminUser?: AdminUser) {
  order.items.forEach((item) => {
    const pid = item.configuration.productId;
    const inv = db.inventory.get(pid);
    if (inv) {
      inv.reservedCount += item.quantity;
      inv.availableCount = Math.max(0, inv.stockCount - inv.reservedCount);
      inv.status = inv.availableCount > 10 ? 'In Stock' : inv.availableCount > 0 ? 'Low Stock' : 'Out of Stock';
      inv.lastUpdated = new Date().toISOString();
      db.inventory.set(pid, inv);

      const ledger = db.inventoryLedger.get(pid) || [];
      ledger.push({
        id: `tx-res-${Date.now()}`,
        productId: pid,
        sku: inv.sku,
        quantityChange: -item.quantity,
        type: 'Reservation',
        reason: `Reserved for Paid Order #${order.orderNumber}`,
        performedBy: adminUser ? `${adminUser.name} (${adminUser.role})` : 'Automated Payment System',
        timestamp: new Date().toISOString(),
      });
      db.inventoryLedger.set(pid, ledger);
    }
  });
}

export function releaseOrderInventory(order: Order, adminUser: AdminUser, reason = 'Order Cancelled') {
  order.items.forEach((item) => {
    const pid = item.configuration.productId;
    const inv = db.inventory.get(pid);
    if (inv) {
      inv.reservedCount = Math.max(0, inv.reservedCount - item.quantity);
      inv.availableCount = Math.max(0, inv.stockCount - inv.reservedCount);
      inv.status = inv.availableCount > 10 ? 'In Stock' : inv.availableCount > 0 ? 'Low Stock' : 'Out of Stock';
      inv.lastUpdated = new Date().toISOString();
      db.inventory.set(pid, inv);

      const ledger = db.inventoryLedger.get(pid) || [];
      ledger.push({
        id: `tx-rel-${Date.now()}`,
        productId: pid,
        sku: inv.sku,
        quantityChange: item.quantity,
        type: 'Release',
        reason,
        performedBy: `${adminUser.name} (${adminUser.role})`,
        timestamp: new Date().toISOString(),
      });
      db.inventoryLedger.set(pid, ledger);
    }
  });
}

export function getInventoryLedger(productId: string): InventoryTransaction[] {
  return db.inventoryLedger.get(productId) || [];
}

// =======================================================
// 10. LOGISTICS ABSTRACTION & MANUAL SHIPMENT SYSTEM
// =======================================================

export interface LogisticsProvider {
  name: string;
  createShipment(order: Order): Promise<{ success: boolean; awbNumber: string; trackingUrl: string }>;
  trackShipment(awbNumber: string): Promise<{ status: string; currentLocation?: string }>;
}

export const MockLogisticsProvider: LogisticsProvider = {
  name: 'OptiCraft Express Logistics',
  async createShipment(order) {
    const awb = `OPT-AWB-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const trackingUrl = `https://track.opticraft.in/awb/${awb}`;
    return { success: true, awbNumber: awb, trackingUrl };
  },
  async trackShipment(awb) {
    return { status: 'In Transit', currentLocation: 'Indiranagar Sorting Facility' };
  },
};

export function createManualShipment(
  orderId: string,
  courierName: string,
  awbNumber: string,
  trackingUrl: string | undefined,
  adminUser: AdminUser
): { success: boolean; shipment?: ShipmentRecord; error?: string } {
  const order = db.orders.get(orderId);
  if (!order) {
    return { success: false, error: 'Order not found.' };
  }

  const shipment: ShipmentRecord = {
    id: `ship-${Date.now()}`,
    orderId,
    courierName: courierName || 'Bluedart Express',
    awbNumber: awbNumber || `AWB-${Math.floor(10000000 + Math.random() * 90000000)}`,
    trackingUrl: trackingUrl || `https://track.courier.in/${awbNumber}`,
    status: 'Created',
    shippedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.shipments.set(orderId, shipment);
  order.shipment = shipment;

  // Auto-update order status to Shipped if currently Processing / Manufacturing / Ready to Dispatch
  if (
    ['Processing', 'Manufacturing', 'Ready to Dispatch', 'Confirmed', 'Prescription Verification'].includes(
      order.status
    )
  ) {
    order.status = 'Shipped';
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'Shipped',
      updatedBy: `${adminUser.name} (${adminUser.role})`,
      timestamp: new Date().toISOString(),
      note: `Shipment created via ${shipment.courierName} (AWB: ${shipment.awbNumber})`,
    });
  }

  db.orders.set(orderId, order);

  logAuditAction(adminUser, 'CREATE_SHIPMENT', 'Shipment', shipment.id, {
    orderId,
    awbNumber: shipment.awbNumber,
    courierName: shipment.courierName,
  });

  triggerNotification('Shipped', order, `Your frame has been dispatched via ${shipment.courierName}. AWB: ${shipment.awbNumber}`);

  return { success: true, shipment };
}

export function getCustomerOrderTracking(orderNumberOrId: string, emailOrPhone?: string) {
  const query = orderNumberOrId.trim().toLowerCase();
  let order: Order | undefined;

  for (const o of db.orders.values()) {
    if (o.id === orderNumberOrId || o.orderNumber.toLowerCase() === query) {
      if (
        !emailOrPhone ||
        o.customerEmail.toLowerCase() === emailOrPhone.trim().toLowerCase() ||
        o.customerPhone.includes(emailOrPhone.trim())
      ) {
        order = o;
        break;
      }
    }
  }

  if (!order) return null;

  const shipment = db.shipments.get(order.id);

  // Define tracking timeline checkpoints based on actual DB order status
  const steps = [
    { key: 'Confirmed', label: 'Order Confirmed', completed: false, date: undefined as string | undefined },
    { key: 'Prescription Verified', label: 'Prescription Verified', completed: false, date: undefined as string | undefined },
    { key: 'Processing', label: 'Processing & Frame QC', completed: false, date: undefined as string | undefined },
    { key: 'Manufacturing', label: 'Lens Fitting & Edging', completed: false, date: undefined as string | undefined },
    { key: 'Ready to Dispatch', label: 'Packaged & Ready to Dispatch', completed: false, date: undefined as string | undefined },
    { key: 'Shipped', label: 'Dispatched / In Transit', completed: false, date: undefined as string | undefined },
    { key: 'Out for Delivery', label: 'Out for Delivery', completed: false, date: undefined as string | undefined },
    { key: 'Delivered', label: 'Delivered', completed: false, date: undefined as string | undefined },
  ];

  const statusOrderIndex: Record<OrderStatus, number> = {
    'Payment Pending': 0,
    Confirmed: 1,
    'Prescription Verification': 1,
    Processing: 3,
    Manufacturing: 4,
    'Ready to Dispatch': 5,
    Shipped: 6,
    Delivered: 8,
    Cancelled: -1,
    Returned: -1,
  };

  const currentIdx = statusOrderIndex[order.status] || 1;

  steps[0].completed = currentIdx >= 1;
  steps[0].date = order.createdAt;

  steps[1].completed = order.prescriptionVerificationStatus === 'Verified';
  steps[2].completed = currentIdx >= 3;
  steps[3].completed = currentIdx >= 4;
  steps[4].completed = currentIdx >= 5;
  steps[5].completed = currentIdx >= 6;
  steps[6].completed = currentIdx >= 7;
  steps[7].completed = currentIdx >= 8;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    prescriptionStatus: order.prescriptionVerificationStatus,
    deliveryAddress: order.deliveryAddress,
    shipment,
    timelineSteps: steps,
    updatedAt: order.updatedAt,
  };
}

// =======================================================
// 11. CANCELLATION & RETURN REQUEST ARCHITECTURE
// =======================================================

export function requestOrderCancellation(orderId: string, reason: string): CancellationRecord | null {
  const order = db.orders.get(orderId);
  if (!order) return null;

  const record: CancellationRecord = {
    id: `cancel-${Date.now()}`,
    orderId,
    reason,
    status: 'Requested',
    requestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.cancellations.set(record.id, record);
  return record;
}

export function reviewCancellation(cancellationId: string, action: 'approve' | 'reject', adminUser: AdminUser) {
  const cancelRec = db.cancellations.get(cancellationId);
  if (!cancelRec) return { success: false, error: 'Cancellation record not found.' };

  cancelRec.status = action === 'approve' ? 'Approved' : 'Rejected';
  cancelRec.updatedAt = new Date().toISOString();
  db.cancellations.set(cancellationId, cancelRec);

  if (action === 'approve') {
    updateOrderStatus(cancelRec.orderId, 'Cancelled', adminUser, `Cancellation approved: ${cancelRec.reason}`);
  }

  logAuditAction(adminUser, 'REVIEW_CANCELLATION', 'Order', cancelRec.orderId, { action, cancellationId });

  return { success: true, cancellation: cancelRec };
}

export function requestOrderReturn(orderId: string, reason: string): ReturnRecord | null {
  const order = db.orders.get(orderId);
  if (!order) return null;

  const record: ReturnRecord = {
    id: `ret-${Date.now()}`,
    orderId,
    reason,
    status: 'Requested',
    requestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.returnRequests.set(record.id, record);
  return record;
}

export function reviewReturn(returnId: string, action: 'approve' | 'reject' | 'receive' | 'refund', adminUser: AdminUser) {
  const retRec = db.returnRequests.get(returnId);
  if (!retRec) return { success: false, error: 'Return record not found.' };

  if (action === 'approve') retRec.status = 'Approved';
  if (action === 'reject') retRec.status = 'Rejected';
  if (action === 'receive') retRec.status = 'Received';
  if (action === 'refund') retRec.status = 'Refunded';

  retRec.updatedAt = new Date().toISOString();
  db.returnRequests.set(returnId, retRec);

  if (action === 'refund') {
    updateOrderStatus(retRec.orderId, 'Returned', adminUser, `Return item received and refunded: ${retRec.reason}`);
  }

  logAuditAction(adminUser, 'REVIEW_RETURN', 'Order', retRec.orderId, { action, returnId });

  return { success: true, returnRecord: retRec };
}

// =======================================================
// 12. REFUND SERVICE ABSTRACTION
// =======================================================

export async function refundPaymentAbstraction(orderId: string, amount: number, reason: string) {
  const order = db.orders.get(orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  console.log(`[REFUND ABSTRACTION] Refund initiated for Order #${order.orderNumber}. Amount: ₹${amount}, Reason: ${reason}`);

  order.payment.status = 'Refunded';
  order.updatedAt = new Date().toISOString();
  db.orders.set(orderId, order);

  return {
    success: true,
    refundId: `rfnd_${Date.now()}`,
    amount,
    currency: 'INR',
    orderId,
    status: 'Processed',
  };
}
