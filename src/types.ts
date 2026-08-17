/**
 * OptiCraft Eyewear - Core Data Types & Schema Definitions
 */

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  houseFlat: string;
  streetLocality: string;
  landmark?: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
}

export interface FrameDetail {
  shape: 'Rectangle' | 'Square' | 'Round' | 'Cat Eye' | 'Wayfarer' | 'Aviator' | 'Oval' | 'Geometric';
  size: 'Narrow' | 'Medium' | 'Wide' | 'Extra Wide';
  color: string;
  material: 'Acetate' | 'Stainless Steel' | 'Titanium' | 'TR90 Flexible' | 'Mixed Alloy' | 'Wood Finish';
  rimType: 'Full Rim' | 'Half Rim' | 'Rimless';
  gender: 'Men' | 'Women' | 'Unisex' | 'Kids';
  frameWidthMm: number;
  bridgeWidthMm: number;
  templeLengthMm: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: 'Eyeglasses' | 'Sunglasses' | 'Progressive' | 'Blue Cut / Screen Safe' | 'Powered Sunglasses';
  description: string;
  price: number; // Base Frame price in INR (₹)
  originalPrice: number;
  discountPercentage: number;
  stock: number;
  active: boolean;
  isFeatured?: boolean;
  images: string[];
  frame: FrameDetail;
  allowedLensTypeIds: string[]; // Dynamic compatibility mapping
  createdAt: string;
  updatedAt: string;
}

export interface LensType {
  id: string;
  name: string; // e.g. Plain, Single Vision, Progressive, Plain Sunglass, Powered Sunglass
  description: string;
  basePrice: number;
  requiresPrescription: boolean;
  applicableCategories: string[];
  active: boolean;
}

export interface LensMaterial {
  id: string;
  name: string; // e.g. CR-39 Standard, Polycarbonate Impact-Resistant, 1.67 High Index, 1.74 Ultra Thin
  description: string;
  additionalPrice: number;
  indexRating: string; // e.g. "1.50", "1.59", "1.67", "1.74"
  compatibilityLensTypeIds: string[]; // Dynamic compatibility
  active: boolean;
}

export interface Coating {
  id: string;
  name: string; // Hard Coat, Anti-Reflection, Blue Cut / Screen Safe, Superhydrophobic, Anti-Glare, UV Protection
  description: string;
  additionalPrice: number;
  isBlueCut?: boolean;
  compatibilityMaterialIds: string[]; // Compatible with materials
  active: boolean;
}

export interface EyePrescriptionValues {
  sph: number; // -20.00 to +20.00 in 0.25 steps
  cyl?: number; // -10.00 to +10.00
  axis?: number; // 0 to 180 degrees
  add?: number; // 0.75 to 4.00 for Progressive
}

export interface Prescription {
  id: string;
  userId?: string;
  title?: string; // e.g., "My Prescription", "Father's Prescription"
  odRight: EyePrescriptionValues; // Right Eye
  osLeft: EyePrescriptionValues; // Left Eye
  pd: number; // Pupillary Distance in mm (45-75)
  uploadedFilePath?: string;
  uploadedFileType?: string; // 'jpg' | 'png' | 'pdf'
  verificationStatus: 'Pending Verification' | 'Verified' | 'Rejected / Requires Clarification';
  verificationNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionFileMetadata {
  id: string;
  prescriptionId?: string;
  customerId?: string;
  orderId?: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  type: string;
  recipientEmail?: string;
  recipientPhone?: string;
  payload: Record<string, any>;
  sentAt: string;
}

export interface ProductConfiguration {
  productId: string;
  productName: string;
  frameSku: string;
  framePrice: number;
  frameColor: string;
  frameSize: string;
  frameImage: string;
  
  lensTypeId: string;
  lensTypeName: string;
  lensTypeBasePrice: number;
  requiresPrescription: boolean;

  materialId?: string;
  materialName?: string;
  materialPrice?: number;

  coatingIds: string[];
  coatingNames: string[];
  coatingsTotalPrice: number;

  prescription?: Prescription;
  prescriptionMode?: 'manual' | 'upload' | 'both' | 'none';

  calculatedTotalPrice: number;
}

export interface CartItem {
  id: string;
  configuration: ProductConfiguration;
  quantity: number;
  addedAt: string;
}

export interface SavedForLaterItem {
  id: string;
  configuration: ProductConfiguration;
  quantity: number;
  addedAt: string;
  savedAt?: string;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  updatedAt: string;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export type OrderStatus =
  | 'Payment Pending'
  | 'Confirmed'
  | 'Prescription Verification'
  | 'Processing'
  | 'Manufacturing'
  | 'Ready to Dispatch'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export type PaymentStatus = 'Pending' | 'Captured' | 'Failed' | 'Refunded';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATIONS' | 'CATALOG_MANAGER';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export interface OrderNote {
  id: string;
  orderId: string;
  authorName: string;
  authorRole: string;
  note: string;
  createdAt: string;
}

export interface ShipmentRecord {
  id: string;
  orderId: string;
  courierName: string;
  awbNumber: string;
  trackingUrl?: string;
  status: 'Created' | 'In Transit' | 'Out for Delivery' | 'Delivered';
  shippedAt: string;
  deliveredAt?: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  sku: string;
  quantityChange: number;
  type: 'Addition' | 'Reservation' | 'Release' | 'Sale' | 'Adjustment' | 'Return';
  reason: string;
  performedBy: string;
  timestamp: string;
}

export interface AuditLogRecord {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: AdminRole;
  action: string;
  entity: 'Order' | 'Product' | 'Inventory' | 'Prescription' | 'Catalog' | 'AdminUser' | 'Shipment' | 'Settings';
  entityId: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface CancellationRecord {
  id: string;
  orderId: string;
  reason: string;
  status: 'Requested' | 'Approved' | 'Rejected' | 'Cancelled';
  requestedAt: string;
  updatedAt: string;
}

export interface ReturnRecord {
  id: string;
  orderId: string;
  reason: string;
  status: 'Requested' | 'Approved' | 'Rejected' | 'Received' | 'Refund Pending' | 'Refunded';
  requestedAt: string;
  updatedAt: string;
}

export interface AdminDashboardMetrics {
  today: {
    newOrders: number;
    paidOrders: number;
    pendingPrescriptionCount: number;
    ordersProcessing: number;
    ordersReadyToShip: number;
    ordersShipped: number;
    ordersDelivered: number;
  };
  businessSummary: {
    totalOrders: number;
    totalSalesINR: number;
    pendingPaymentsCount: number;
    pendingPrescriptionCount: number;
    lowStockItemsCount: number;
    outOfStockItemsCount: number;
  };
}

export interface OrderItem {
  id: string;
  configuration: ProductConfiguration;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentRecord {
  id: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: 'INR';
  paymentMethod: 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Test Gateway';
  status: PaymentStatus;
  createdAt: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  updatedBy: string;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: Address;
  items: OrderItem[];
  subtotalAmount: number;
  discountAmount: number;
  deliveryFee: 0; // Strictly FREE DELIVERY
  totalAmount: number;
  status: OrderStatus;
  prescriptionVerificationStatus: 'Not Required' | 'Pending Verification' | 'Verified' | 'Clarification Required' | 'Rejected';
  payment: PaymentRecord;
  notes?: OrderNote[];
  shipment?: ShipmentRecord;
  statusHistory?: OrderStatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryRecord {
  productId: string;
  sku: string;
  stockCount: number;
  reservedCount: number;
  availableCount: number;
  lowStockThreshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

export interface ShiprocketCourierPartner {
  id: number;
  name: string;
  rating: number;
  deliveryDays: number;
  estimatedDeliveryDate: string;
  isCodAvailable: boolean;
  isPrepaidAvailable: boolean;
  mode: 'Air' | 'Surface';
  chargeINR: number;
  isRecommended?: boolean;
}

export interface ShiprocketServiceabilityResult {
  success: boolean;
  serviceable: boolean;
  pincode: string;
  city: string;
  state: string;
  district?: string;
  pickupPincode: string;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  estimatedDeliveryDate: string;
  formattedEta: string;
  couriers: ShiprocketCourierPartner[];
  recommendedCourier: ShiprocketCourierPartner | null;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  freeShippingApplied: boolean;
  guaranteedPromise: string;
  source: 'shiprocket_live_api' | 'shiprocket_smart_fallback';
  error?: string;
}

export interface ShiprocketTrackingActivity {
  date: string;
  time: string;
  status: string;
  activity: string;
  location: string;
  srStatusLabel?: string;
}

export interface ShiprocketOrderTracking {
  success: boolean;
  orderNumber: string;
  orderStatus: string;
  trackingStatus: 'Confirmed' | 'Processing' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  currentStatusText: string;
  courierName: string;
  awbNumber: string;
  pickupPincode: string;
  destinationPincode: string;
  destinationCity: string;
  destinationState: string;
  originHub: string;
  currentLocation: string;
  shippedDate?: string;
  estimatedDeliveryDate?: string;
  deliveredDate?: string;
  activities: ShiprocketTrackingActivity[];
  trackingUrl?: string;
  error?: string;
}
