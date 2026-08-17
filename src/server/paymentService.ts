/**
 * OptiCraft Eyewear - Backend Checkout & Payment Service Layer (Phase 5 Abstraction)
 */

import { db } from './db.js';
import { Address, CartItem, Order, PaymentRecord, ProductConfiguration } from '../types.js';

export interface CheckoutCustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface CheckoutSession {
  id: string;
  userId?: string;
  guestSessionId?: string;
  customerInfo: CheckoutCustomerInfo;
  deliveryAddress: Address;
  items: CartItem[];
  subtotalAmount: number;
  discountAmount: number;
  deliveryFee: 0; // Strictly FREE DELIVERY
  totalAmount: number;
  prescriptionConsent: boolean;
  termsConsent: boolean;
  isReadyForPayment: boolean;
  createdAt: string;
  expiresAt: number; // Timestamp
}

// In-Memory Checkout Session Store
export const checkoutSessions = new Map<string, CheckoutSession>();

export interface CheckoutValidationResult {
  valid: boolean;
  error?: string;
  priceChanged?: boolean;
  stockWarnings?: string[];
  subtotalAmount?: number;
  deliveryFee?: number;
  totalAmount?: number;
}

/**
 * Validate Cart & Configuration State before Checkout
 */
export function validateCartForCheckout(items: CartItem[]): CheckoutValidationResult {
  if (!items || items.length === 0) {
    return { valid: false, error: 'Your cart is empty. Please add eyewear to continue checkout.' };
  }

  let calculatedSubtotal = 0;
  const stockWarnings: string[] = [];
  let priceChanged = false;

  for (const item of items) {
    const product = db.products.get(item.configuration.productId);
    if (!product || !product.active) {
      return {
        valid: false,
        error: `Product "${item.configuration.productName}" is no longer available.`,
      };
    }

    if (item.quantity > product.stock) {
      stockWarnings.push(
        `Requested quantity for ${product.name} (${item.quantity}) exceeds available stock (${product.stock}).`
      );
    }

    // Revalidate lens type, material, coating prices
    const lensType = db.lensTypes.get(item.configuration.lensTypeId);
    if (!lensType || !lensType.active) {
      return {
        valid: false,
        error: `Selected lens option is no longer valid for ${product.name}.`,
      };
    }

    // Check if powered lens requires prescription
    if (lensType.requiresPrescription) {
      const rx = item.configuration.prescription;
      const hasManualRx = rx && rx.odRight && rx.osLeft && typeof rx.odRight.sph === 'number' && typeof rx.osLeft.sph === 'number';
      const hasUploadedRx = rx && (rx.uploadedFilePath || rx.title);
      
      if (!hasManualRx && !hasUploadedRx) {
        return {
          valid: false,
          error: `Powered lens configuration for "${product.name}" requires valid prescription details before proceeding to checkout.`,
        };
      }
    }

    let itemUnitPrice = product.price + lensType.basePrice;

    if (item.configuration.materialId) {
      const mat = db.lensMaterials.get(item.configuration.materialId);
      if (mat && mat.active) {
        itemUnitPrice += mat.additionalPrice;
      }
    }

    if (item.configuration.coatingIds && item.configuration.coatingIds.length > 0) {
      item.configuration.coatingIds.forEach((cId) => {
        const coat = db.coatings.get(cId);
        if (coat && coat.active) {
          itemUnitPrice += coat.additionalPrice;
        }
      });
    }

    if (itemUnitPrice !== item.configuration.calculatedTotalPrice) {
      priceChanged = true;
      item.configuration.calculatedTotalPrice = itemUnitPrice;
    }

    calculatedSubtotal += itemUnitPrice * item.quantity;
  }

  if (stockWarnings.length > 0) {
    return {
      valid: false,
      error: stockWarnings.join(' '),
      stockWarnings,
    };
  }

  return {
    valid: true,
    priceChanged,
    subtotalAmount: calculatedSubtotal,
    deliveryFee: 0,
    totalAmount: calculatedSubtotal,
  };
}

/**
 * Validate Indian PIN code (6-digit)
 */
export function validateIndianPinCode(pinCode: string): boolean {
  if (!pinCode) return false;
  const clean = pinCode.trim();
  return /^[1-9][0-9]{5}$/.test(clean);
}

/**
 * Validate Delivery Address
 */
export function validateDeliveryAddress(address: Partial<Address>): { valid: boolean; error?: string } {
  if (!address.name || !address.name.trim()) {
    return { valid: false, error: 'Full name for delivery address is required.' };
  }

  const phoneClean = address.phone ? address.phone.replace(/\D/g, '').slice(-10) : '';
  if (!phoneClean || !/^[6-9]\d{9}$/.test(phoneClean)) {
    return { valid: false, error: 'Valid 10-digit Indian mobile number is required for delivery updates.' };
  }

  if (!address.houseFlat || !address.houseFlat.trim()) {
    return { valid: false, error: 'House/Flat/Building details are required.' };
  }

  if (!address.streetLocality || !address.streetLocality.trim()) {
    return { valid: false, error: 'Street/Locality details are required.' };
  }

  if (!address.city || !address.city.trim()) {
    return { valid: false, error: 'City is required.' };
  }

  if (!address.state || !address.state.trim()) {
    return { valid: false, error: 'State is required.' };
  }

  if (!address.pinCode || !validateIndianPinCode(address.pinCode)) {
    return { valid: false, error: 'Please enter a valid 6-digit Indian PIN code (e.g. 560038).' };
  }

  return { valid: true };
}

/**
 * Prepare Checkout Session
 */
export function createCheckoutSession(params: {
  userId?: string;
  guestSessionId?: string;
  customerInfo: CheckoutCustomerInfo;
  deliveryAddress: Address;
  items: CartItem[];
  prescriptionConsent: boolean;
  termsConsent: boolean;
}): { success: boolean; session?: CheckoutSession; error?: string } {
  const { userId, guestSessionId, customerInfo, deliveryAddress, items, prescriptionConsent, termsConsent } = params;

  if (!termsConsent) {
    return { success: false, error: 'You must agree to the Terms & Conditions to proceed with checkout.' };
  }

  // Check if any items require prescription
  const hasPoweredLenses = items.some((item) => item.configuration.requiresPrescription);
  if (hasPoweredLenses && !prescriptionConsent) {
    return {
      success: false,
      error: 'Please confirm that the prescription details entered or uploaded are accurate.',
    };
  }

  // Validate Address
  const addrVal = validateDeliveryAddress(deliveryAddress);
  if (!addrVal.valid) {
    return { success: false, error: addrVal.error };
  }

  // Validate Cart
  const cartVal = validateCartForCheckout(items);
  if (!cartVal.valid) {
    return { success: false, error: cartVal.error };
  }

  const sessionId = `chk-session-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const subtotalAmount = cartVal.subtotalAmount || 0;

  const session: CheckoutSession = {
    id: sessionId,
    userId,
    guestSessionId,
    customerInfo,
    deliveryAddress,
    items,
    subtotalAmount,
    discountAmount: 0,
    deliveryFee: 0, // FREE DELIVERY GUARANTEE
    totalAmount: subtotalAmount,
    prescriptionConsent,
    termsConsent,
    isReadyForPayment: true,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
  };

  checkoutSessions.set(sessionId, session);

  return {
    success: true,
    session,
  };
}

/**
 * Complete Order from Checkout Session (Payment Abstraction Layer)
 */
export function executeOrderFromSession(params: {
  checkoutSessionId: string;
  paymentMethod: 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Test Gateway';
}): { success: boolean; order?: Order; error?: string } {
  const session = checkoutSessions.get(params.checkoutSessionId);
  if (!session) {
    return { success: false, error: 'Invalid or expired checkout session. Please re-open checkout.' };
  }

  if (Date.now() > session.expiresAt) {
    checkoutSessions.delete(params.checkoutSessionId);
    return { success: false, error: 'Checkout session has expired due to inactivity. Please review your order.' };
  }

  // Final Re-Validation of Stock before locking order
  for (const item of session.items) {
    const product = db.products.get(item.configuration.productId);
    if (!product || product.stock < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for frame "${item.configuration.productName}". Please adjust quantity in cart.`,
      };
    }
  }

  // Decrement product stock
  for (const item of session.items) {
    const product = db.products.get(item.configuration.productId)!;
    product.stock = Math.max(0, product.stock - item.quantity);
    db.products.set(product.id, product);

    const inv = db.inventory.get(product.id);
    if (inv) {
      inv.stockCount = product.stock;
      inv.status = product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock';
      inv.lastUpdated = new Date().toISOString();
      db.inventory.set(product.id, inv);
    }
  }

  const orderId = `ord-${Date.now()}`;
  const orderNumber = `OPT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const paymentRecord: PaymentRecord = {
    id: `pay-${Date.now()}`,
    razorpayOrderId: `order_rzp_${Math.floor(100000 + Math.random() * 900000)}`,
    razorpayPaymentId: `pay_rzp_${Math.floor(100000 + Math.random() * 900000)}`,
    amount: session.totalAmount,
    currency: 'INR',
    paymentMethod: params.paymentMethod,
    status: 'Captured',
    createdAt: new Date().toISOString(),
  };

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    userId: session.userId,
    customerName: session.customerInfo.name,
    customerEmail: session.customerInfo.email,
    customerPhone: session.customerInfo.phone,
    deliveryAddress: session.deliveryAddress,
    items: session.items.map((ci) => ({
      id: `oi-${ci.id}`,
      configuration: ci.configuration,
      quantity: ci.quantity,
      unitPrice: ci.configuration.calculatedTotalPrice,
      totalPrice: ci.configuration.calculatedTotalPrice * ci.quantity,
    })),
    subtotalAmount: session.subtotalAmount,
    discountAmount: 0,
    deliveryFee: 0, // FREE DELIVERY GUARANTEED
    totalAmount: session.totalAmount,
    status: 'Confirmed',
    prescriptionVerificationStatus: session.items.some((i) => i.configuration.requiresPrescription)
      ? 'Pending Verification'
      : 'Not Required',
    payment: paymentRecord,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.orders.set(newOrder.id, newOrder);

  // Check cart and remove the ordered items
  const removeOrderedItems = (cart: Cart) => {
    const orderedItemIds = new Set(session.items.map((i) => i.id));
    const orderedConfigSignatures = new Set(
      session.items.map(
        (i) =>
          `${i.configuration.productId}_${i.configuration.lensTypeId}_${i.configuration.materialId || ''}_${(i.configuration.coatingIds || []).sort().join('-')}`
      )
    );

    const remainingItems = cart.items.filter((item) => {
      if (orderedItemIds.has(item.id)) return false;
      const sig = `${item.configuration.productId}_${item.configuration.lensTypeId}_${item.configuration.materialId || ''}_${(item.configuration.coatingIds || []).sort().join('-')}`;
      if (orderedConfigSignatures.has(sig)) return false;
      return true;
    });

    cart.items = remainingItems;
    cart.updatedAt = new Date().toISOString();
    return cart;
  };

  if (session.userId) {
    const userCart = db.carts.get(`user-${session.userId}`);
    if (userCart) {
      db.carts.set(`user-${session.userId}`, removeOrderedItems(userCart));
    }
  }
  if (session.guestSessionId) {
    const guestCart = db.carts.get(`guest-${session.guestSessionId}`);
    if (guestCart) {
      db.carts.set(`guest-${session.guestSessionId}`, removeOrderedItems(guestCart));
    }
  }

  // Session completed, clear session
  checkoutSessions.delete(params.checkoutSessionId);

  return {
    success: true,
    order: newOrder,
  };
}
