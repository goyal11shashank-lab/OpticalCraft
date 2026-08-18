/**
 * OptiCraft Eyewear - Express REST API Routes for Phases 1-5
 */

import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { fileStorage } from '../fileStorageProvider.js';
import { buildAndValidateConfiguration } from '../configurationEngine.js';
import {
  getOrCreateCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  clearCart,
  mergeCarts,
  validateCart,
  getSavedForLater,
  saveCartItemForLater,
  moveSavedItemToCart,
  deleteSavedItem,
  moveCartItemToWishlist,
  moveSavedItemToWishlist,
} from '../cartEngine.js';
import {
  signUpUser,
  sendSignupOtp,
  verifySignupOtp,
  loginUser,
  requestPasswordReset,
  requestPasswordResetOtp,
  resetPassword,
  verifyResetPasswordOtp,
  updateProfile,
  verifyToken,
} from '../authEngine.js';
import {
  createCheckoutSession,
  executeOrderFromSession,
  validateCartForCheckout,
  validateDeliveryAddress,
  checkoutSessions,
} from '../paymentService.js';
import {
  createRazorpayOrder,
  verifyRazorpayPaymentSignature,
  processRazorpayWebhookEvent,
  finalizeVerifiedOrder,
  getRazorpayConfig,
} from '../razorpayService.js';
import {
  checkShiprocketServiceability,
  getShiprocketOrderTracking,
} from '../shiprocketService.js';
import {
  loginAdminStaff,
  requireAdminRole,
  AdminAuthenticatedRequest,
} from '../adminAuthService.js';
import {
  getDashboardMetrics,
  searchAndFilterOrders,
  getOrderById,
  updateOrderStatus,
  addOrderNote,
  getOrderNotes,
  getPrescriptionQueue,
  reviewPrescription,
  createProduct,
  updateProduct,
  toggleProductActive,
  manageLensType,
  manageLensMaterial,
  manageLensCoating,
  updateFrameLensCompatibility,
  adjustInventory,
  getInventoryLedger,
  createManualShipment,
  getCustomerOrderTracking,
  requestOrderCancellation,
  reviewCancellation,
  requestOrderReturn,
  reviewReturn,
  getAuditLogs,
  reserveOrderInventory,
} from '../adminService.js';
import { Prescription, Order, Address, LensType, LensMaterial, Coating, Product } from '../../types.js';
import { lookupIndianPincode, isValidIndianPincodeFormat } from '../../utils/indianPincode.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'customer' | 'admin';
  };
}

const router = Router();

// Middleware: Verify JWT Bearer or X-Auth-Token Header
function authenticateToken(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const customHeader = req.headers['x-auth-token'] as string;
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) || customHeader;

  if (token) {
    const verified = verifyToken(token);
    if (verified) {
      req.user = verified;
    }
  }
  next();
}

router.use(authenticateToken);

// ==========================================
// 1. Health & System Verification
// ==========================================
router.get('/health', async (_req: Request, res: Response) => {
  const health = await db.checkDatabaseLiveConnection();
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;

  if (health.healthy && (!isProd || health.postgresConnected)) {
    res.status(200).json({
      status: 'ok',
      database: health.postgresConnected ? 'connected' : 'development_fallback',
      provider: isProd ? 'netlify' : health.provider || 'netlify',
      environment: isProd ? 'production' : 'development',
      service: 'OptiCraft Eyewear API',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      provider: isProd ? 'netlify' : health.provider || 'none',
      environment: isProd ? 'production' : 'development',
      service: 'OptiCraft Eyewear API',
      timestamp: new Date().toISOString(),
      error: health.error || 'PostgreSQL database connection failed. Production requires active Netlify Database connection.',
    });
  }
});

// Protected table inspection diagnostic endpoint (Admin or Development only)
router.get('/database/tables', async (req: AuthenticatedRequest, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
  
  // Require Admin role in production to safeguard schema diagnostics
  if (isProd && (!req.user || req.user.role !== 'admin')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin authentication required to inspect database tables in production.',
    });
  }

  try {
    const health = await db.checkDatabaseLiveConnection();
    res.status(200).json({
      success: true,
      postgresConnected: health.postgresConnected,
      provider: health.provider,
      databaseName: health.databaseName,
      databaseSchema: health.databaseSchema,
      tableCount: health.tableCount || 0,
      tables: health.tables || [],
      tableCounts: health.tableCounts || {},
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to inspect tables',
    });
  }
});


router.get('/phase1/verify', (_req: Request, res: Response) => {
  try {
    const products = Array.from(db.products.values());
    const lensTypes = Array.from(db.lensTypes.values());
    const materials = Array.from(db.lensMaterials.values());
    const coatings = Array.from(db.coatings.values());
    const prescriptions = Array.from(db.prescriptions.values());
    const users = Array.from(db.users.values());
    const addresses = Array.from(db.addresses.values());
    const orders = Array.from(db.orders.values());
    const inventory = Array.from(db.inventory.values());

    const testConfigResult = buildAndValidateConfiguration({
      productId: 'prod-fern-classic-black',
      lensTypeId: 'lt-single-vision',
      materialId: 'mat-polycarbonate',
      coatingIds: ['coat-bluecut', 'coat-arc'],
      prescription: prescriptions[0],
      prescriptionMode: 'manual',
    });

    res.json({
      success: true,
      phase: 'Phase 1 - Complete Backend Data Architecture & Compatibility Engine Verified',
      counts: {
        users: users.length,
        addresses: addresses.length,
        products: products.length,
        lensTypes: lensTypes.length,
        materials: materials.length,
        coatings: coatings.length,
        prescriptions: prescriptions.length,
        orders: orders.length,
        inventoryRecords: inventory.length,
      },
      testConfigurationResult: testConfigResult,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. Authentication & Customer Profile Routes
// ==========================================

// Send Signup WhatsApp OTP
router.post('/auth/send-signup-otp', async (req: Request, res: Response) => {
  const result = await sendSignupOtp(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Alias for send-otp
router.post('/auth/send-otp', async (req: Request, res: Response) => {
  const result = await sendSignupOtp(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Verify Signup OTP
router.post('/auth/verify-signup-otp', (req: Request, res: Response) => {
  const { mobile, otp, formData } = req.body;
  const result = verifySignupOtp(mobile, otp, formData);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.status(201).json(result);
});

// Alias for verify-otp
router.post('/auth/verify-otp', (req: Request, res: Response) => {
  const { mobile, otp, formData } = req.body;
  const result = verifySignupOtp(mobile, otp, formData);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.status(201).json(result);
});

// Sign Up (Direct fallback if ever invoked)
router.post('/auth/signup', (req: Request, res: Response) => {
  const result = signUpUser(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.status(201).json(result);
});

// Login
router.post('/auth/login', (req: Request, res: Response) => {
  const { identifier, email, mobile, password } = req.body;
  const loginId = identifier || email || mobile;
  const result = loginUser(loginId, password);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

// Current User Profile
router.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  const user = db.users.get(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  const userSafe = { ...user };
  delete userSafe.passwordHash;
  res.json({ success: true, user: userSafe });
});

// Request Password Reset OTP
router.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { identifier, email, mobile } = req.body;
  const targetId = identifier || email || mobile;
  const result = await requestPasswordResetOtp(targetId);
  res.json(result);
});

// Reset Password (supports both OTP + identifier, and legacy token)
router.post('/auth/reset-password', (req: Request, res: Response) => {
  const { token, resetToken, identifier, email, mobile, otp, newPassword, confirmPassword, password } = req.body;
  const pass = newPassword || password;
  const targetId = identifier || email || mobile;

  if (otp && targetId) {
    const result = verifyResetPasswordOtp(targetId, otp, pass, confirmPassword);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  }

  const rToken = token || resetToken;
  const result = resetPassword(rToken, pass, confirmPassword);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Update Profile
router.put('/auth/profile', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  const result = updateProfile(userId, req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// ==========================================
// 3. Indian Postal Pincode Lookup & Addresses
// ==========================================
router.get('/pincode/:pincode', async (req: Request, res: Response) => {
  const pinCode = req.params.pincode;
  if (!isValidIndianPincodeFormat(pinCode)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Indian PIN code format. Please provide a valid 6-digit PIN code (e.g. 560038).',
      country: 'India',
    });
  }

  try {
    const details = await lookupIndianPincode(pinCode);
    if (!details) {
      return res.status(404).json({
        success: false,
        error: `Could not find postal details for Indian PIN code ${pinCode}.`,
        country: 'India',
      });
    }

    res.json({
      success: true,
      data: details,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error looking up Indian PIN code.',
    });
  }
});

router.get('/addresses', (req: AuthenticatedRequest, res: Response) => {
  const targetUserId = req.user?.id || (req.query.userId as string) || 'usr-customer-1';
  const list = Array.from(db.addresses.values()).filter((a) => a.userId === targetUserId);
  res.json({ success: true, addresses: list });
});

router.post('/addresses', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId || 'usr-customer-1';
  const val = validateDeliveryAddress(req.body);
  if (!val.valid) {
    return res.status(400).json({ success: false, error: val.error });
  }

  // Handle setting as default
  if (req.body.isDefault) {
    Array.from(db.addresses.values())
      .filter((a) => a.userId === userId)
      .forEach((a) => {
        a.isDefault = false;
        db.addresses.set(a.id, a);
      });
  }

  const newAddr: Address = {
    id: `addr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    userId,
    name: req.body.name.trim(),
    phone: req.body.phone.trim(),
    houseFlat: req.body.houseFlat.trim(),
    streetLocality: req.body.streetLocality.trim(),
    landmark: req.body.landmark ? req.body.landmark.trim() : undefined,
    city: req.body.city.trim(),
    state: req.body.state.trim(),
    pinCode: req.body.pinCode.trim(),
    isDefault: !!req.body.isDefault,
  };

  db.addresses.set(newAddr.id, newAddr);
  res.status(201).json({ success: true, address: newAddr });
});

router.put('/addresses/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId || 'usr-customer-1';
  const addr = db.addresses.get(req.params.id);
  if (!addr) {
    return res.status(404).json({ success: false, error: 'Address not found' });
  }
  if (addr.userId !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized to edit this address' });
  }

  const val = validateDeliveryAddress({ ...addr, ...req.body });
  if (!val.valid) {
    return res.status(400).json({ success: false, error: val.error });
  }

  if (req.body.isDefault) {
    Array.from(db.addresses.values())
      .filter((a) => a.userId === userId)
      .forEach((a) => {
        a.isDefault = false;
        db.addresses.set(a.id, a);
      });
  }

  Object.assign(addr, req.body);
  db.addresses.set(addr.id, addr);

  res.json({ success: true, address: addr });
});

router.post('/addresses/:id/default', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || (req.query.userId as string) || 'usr-customer-1';
  const addr = db.addresses.get(req.params.id);
  if (!addr) {
    return res.status(404).json({ success: false, error: 'Address not found' });
  }
  if (addr.userId !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized to modify this address' });
  }

  Array.from(db.addresses.values())
    .filter((a) => a.userId === userId)
    .forEach((a) => {
      a.isDefault = false;
      db.addresses.set(a.id, a);
    });

  addr.isDefault = true;
  db.addresses.set(addr.id, addr);

  res.json({ success: true, address: addr });
});

router.delete('/addresses/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || (req.query.userId as string) || 'usr-customer-1';
  const addr = db.addresses.get(req.params.id);
  if (!addr) {
    return res.status(404).json({ success: false, error: 'Address not found' });
  }
  if (addr.userId !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized to delete this address' });
  }

  db.addresses.delete(req.params.id);
  res.json({ success: true, message: 'Address deleted successfully' });
});

// ==========================================
// 4. Products & Catalog Endpoints
// ==========================================
router.get('/products', (req: Request, res: Response) => {
  let list = Array.from(db.products.values()).filter((p) => p.active);

  const q = (req.query.q as string)?.toLowerCase();
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.frame.shape.toLowerCase().includes(q) ||
        p.frame.color.toLowerCase().includes(q)
    );
  }

  const category = req.query.category as string;
  if (category && category !== 'All') {
    list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  const gender = req.query.gender as string;
  if (gender && gender !== 'All') {
    list = list.filter((p) => p.frame.gender.toLowerCase() === gender.toLowerCase() || p.frame.gender === 'Unisex');
  }

  const shape = req.query.shape as string;
  if (shape && shape !== 'All') {
    list = list.filter((p) => p.frame.shape.toLowerCase() === shape.toLowerCase());
  }

  const sort = req.query.sort as string;
  if (sort === 'price-low') {
    list.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-high') {
    list.sort((a, b) => b.price - a.price);
  } else if (sort === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ success: true, count: list.length, products: list });
});

router.get('/products/:id', (req: Request, res: Response) => {
  const product = db.products.get(req.params.id);
  if (!product || !product.active) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  res.json({ success: true, product });
});

router.post('/products', (req: Request, res: Response) => {
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    sku: req.body.sku || `OPT-NEW-${Math.floor(100 + Math.random() * 900)}`,
    name: req.body.name || 'New OptiCraft Frame',
    brand: req.body.brand || 'OptiCraft Classic',
    category: req.body.category || 'Eyeglasses',
    description: req.body.description || 'Premium hand-crafted spectacle frame.',
    price: Number(req.body.price) || 1499,
    originalPrice: Number(req.body.originalPrice) || 2499,
    discountPercentage: 40,
    stock: Number(req.body.stock) || 20,
    active: true,
    isFeatured: req.body.isFeatured || false,
    images: req.body.images || ['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=800'],
    frame: req.body.frame || {
      shape: 'Square',
      size: 'Medium',
      color: 'Black',
      material: 'Acetate',
      rimType: 'Full Rim',
      gender: 'Unisex',
      frameWidthMm: 138,
      bridgeWidthMm: 18,
      templeLengthMm: 142,
    },
    allowedLensTypeIds: req.body.allowedLensTypeIds || ['lt-plain', 'lt-single-vision', 'lt-progressive'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.products.set(newProduct.id, newProduct);
  db.inventory.set(newProduct.id, {
    productId: newProduct.id,
    sku: newProduct.sku,
    stockCount: newProduct.stock,
    reservedCount: 0,
    availableCount: newProduct.stock,
    lowStockThreshold: 5,
    status: newProduct.stock > 10 ? 'In Stock' : newProduct.stock > 0 ? 'Low Stock' : 'Out of Stock',
    lastUpdated: new Date().toISOString(),
  });

  res.json({ success: true, product: newProduct });
});

// ==========================================
// 5. Lens Customization Engine & Config Options
// ==========================================
router.get('/lens-options', (_req: Request, res: Response) => {
  res.json({
    success: true,
    lensTypes: Array.from(db.lensTypes.values()).filter((x) => x.active),
    materials: Array.from(db.lensMaterials.values()).filter((x) => x.active),
    coatings: Array.from(db.coatings.values()).filter((x) => x.active),
  });
});

router.post('/configuration/validate', (req: Request, res: Response) => {
  const result = buildAndValidateConfiguration(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// ==========================================
// 6. Cart REST API Endpoints
// ==========================================
router.get('/cart', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || (req.query.sessionId as string) || 'guest-session';
  const userId = req.user?.id || (req.query.userId as string) || undefined;
  const cartKey = userId ? `cart-user-${userId}` : `cart-session-${sessionId}`;

  const cart = getOrCreateCart(cartKey, userId);
  res.json({ success: true, cart });
});

router.post('/cart/items', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || req.body.sessionId || 'guest-session';
  const userId = req.user?.id || req.body.userId || undefined;
  const cartKey = userId ? `cart-user-${userId}` : `cart-session-${sessionId}`;

  const { configuration, quantity } = req.body;
  if (!configuration) {
    return res.status(400).json({ success: false, error: 'Product configuration is required.' });
  }

  const result = addCartItem(cartKey, configuration, quantity, userId);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

router.patch('/cart/items/:id', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || req.body.sessionId || 'guest-session';
  const userId = req.user?.id || req.body.userId || undefined;
  const cartKey = userId ? `cart-user-${userId}` : `cart-session-${sessionId}`;

  const itemId = req.params.id;
  const { quantity, configuration } = req.body;

  const result = updateCartItem(cartKey, itemId, { quantity, configuration }, userId);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

router.delete('/cart/items/:id', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || (req.query.sessionId as string) || 'guest-session';
  const userId = req.user?.id || (req.query.userId as string) || undefined;
  const cartKey = userId ? `cart-user-${userId}` : `cart-session-${sessionId}`;

  const itemId = req.params.id;
  const result = deleteCartItem(cartKey, itemId, userId);
  res.json(result);
});

router.delete('/cart', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || (req.query.sessionId as string) || 'guest-session';
  const userId = req.user?.id || (req.query.userId as string) || undefined;
  const cartKey = userId ? `cart-user-${userId}` : `cart-session-${sessionId}`;

  const result = clearCart(cartKey, userId);
  res.json(result);
});

router.post('/cart/merge', (req: AuthenticatedRequest, res: Response) => {
  const { guestSessionId, userId } = req.body;
  const targetUserId = req.user?.id || userId;
  if (!guestSessionId || !targetUserId) {
    return res.status(400).json({ success: false, error: 'Both guestSessionId and userId are required.' });
  }

  const guestKey = `cart-session-${guestSessionId}`;
  const userKey = `cart-user-${targetUserId}`;

  const result = mergeCarts(guestKey, userKey, targetUserId);
  res.json(result);
});

router.post('/cart/validate', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || req.body.sessionId || 'guest-session';
  const userId = req.user?.id || req.body.userId || undefined;
  const cartKey = userId ? `cart-user-${userId}` : `cart-session-${sessionId}`;

  const result = validateCart(cartKey, userId);
  res.json(result);
});

// ==========================================
// 6B. Saved For Later & Item Transfer Endpoints
// ==========================================
router.get('/saved-for-later', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || (req.query.sessionId as string) || 'guest-session';
  const userId = req.user?.id || (req.query.userId as string) || undefined;
  const savedKey = userId ? `saved-user-${userId}` : `saved-session-${sessionId}`;

  const items = getSavedForLater(savedKey);
  res.json({ success: true, items });
});

router.post('/cart/items/:id/save-for-later', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || req.body.sessionId || 'guest-session';
  const userId = req.user?.id || req.body.userId || undefined;
  const cartKey = userId ? `cart-user-${userId}` : `cart-session-${sessionId}`;
  const savedKey = userId ? `saved-user-${userId}` : `saved-session-${sessionId}`;

  const itemId = req.params.id;
  const result = saveCartItemForLater(cartKey, savedKey, itemId, userId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.post('/cart/items/:id/move-to-wishlist', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || req.body.sessionId || 'guest-session';
  const userId = req.user?.id || req.body.userId || undefined;
  const cartKey = userId ? `cart-user-${userId}` : `cart-session-${sessionId}`;
  const wishlistKey = userId || 'usr-customer-1';

  const itemId = req.params.id;
  const result = moveCartItemToWishlist(cartKey, wishlistKey, itemId, userId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.post('/saved-for-later/:id/move-to-cart', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || req.body.sessionId || 'guest-session';
  const userId = req.user?.id || req.body.userId || undefined;
  const cartKey = userId ? `cart-user-${userId}` : `cart-session-${sessionId}`;
  const savedKey = userId ? `saved-user-${userId}` : `saved-session-${sessionId}`;

  const itemId = req.params.id;
  const result = moveSavedItemToCart(savedKey, cartKey, itemId, userId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.post('/saved-for-later/:id/move-to-wishlist', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || req.body.sessionId || 'guest-session';
  const userId = req.user?.id || req.body.userId || undefined;
  const savedKey = userId ? `saved-user-${userId}` : `saved-session-${sessionId}`;
  const wishlistKey = userId || 'usr-customer-1';

  const itemId = req.params.id;
  const result = moveSavedItemToWishlist(savedKey, wishlistKey, itemId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.delete('/saved-for-later/:id', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || (req.query.sessionId as string) || 'guest-session';
  const userId = req.user?.id || (req.query.userId as string) || undefined;
  const savedKey = userId ? `saved-user-${userId}` : `saved-session-${sessionId}`;

  const itemId = req.params.id;
  const result = deleteSavedItem(savedKey, itemId);
  res.json(result);
});

// ==========================================
// 7. Prescriptions Management Routes
// ==========================================
router.get('/prescriptions', (req: AuthenticatedRequest, res: Response) => {
  const targetUserId = req.user?.id || (req.query.userId as string) || 'usr-customer-1';
  const list = Array.from(db.prescriptions.values()).filter((rx) => rx.userId === targetUserId);
  res.json({ success: true, prescriptions: list });
});

router.post('/prescriptions', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId || 'usr-customer-1';
  const { title, odRight, osLeft, pd, uploadedFilePath, uploadedFileType } = req.body;

  if (pd && (pd < 45 || pd > 75)) {
    return res.status(400).json({ success: false, error: 'Pupillary distance (PD) must be between 45mm and 75mm.' });
  }

  const newRx: Prescription = {
    id: `rx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    userId,
    title: title || 'My Prescription',
    odRight: odRight || { sph: 0, cyl: 0, axis: 0, add: 0 },
    osLeft: osLeft || { sph: 0, cyl: 0, axis: 0, add: 0 },
    pd: Number(pd) || 63,
    uploadedFilePath,
    uploadedFileType,
    verificationStatus: 'Pending Verification',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.prescriptions.set(newRx.id, newRx);
  res.status(201).json({ success: true, prescription: newRx });
});

router.put('/prescriptions/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId || 'usr-customer-1';
  const rx = db.prescriptions.get(req.params.id);
  if (!rx) {
    return res.status(404).json({ success: false, error: 'Prescription not found' });
  }
  if (rx.userId !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized to modify this prescription' });
  }

  Object.assign(rx, req.body, { updatedAt: new Date().toISOString() });
  db.prescriptions.set(rx.id, rx);
  res.json({ success: true, prescription: rx });
});

router.delete('/prescriptions/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || (req.query.userId as string) || 'usr-customer-1';
  const rx = db.prescriptions.get(req.params.id);
  if (!rx) {
    return res.status(404).json({ success: false, error: 'Prescription not found' });
  }
  if (rx.userId !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized to delete this prescription' });
  }

  db.prescriptions.delete(req.params.id);
  res.json({ success: true, message: 'Prescription deleted successfully' });
});

router.post('/prescriptions/upload', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const fileName = req.body.filename || 'optician_prescription_slip.png';
    const mimeType = req.body.mimeType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png');
    const customerId = req.user?.id || req.body.customerId || 'usr-customer-1';
    
    let buffer: Buffer;
    if (req.body.fileBase64) {
      buffer = Buffer.from(req.body.fileBase64, 'base64');
    } else {
      buffer = Buffer.from(`OptiCraft Prescription Document Slip Data - ${fileName} - ${Date.now()}`);
    }

    if (req.body.contentLength && Number(req.body.contentLength) > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'File size exceeds maximum limit of 10MB.' });
    }

    const uploadResult = await fileStorage.upload({
      buffer,
      filename: fileName,
      mimeType,
      customerId,
    });

    db.prescriptionFiles.set(uploadResult.storageKey, uploadResult.metadata);

    res.json({
      success: true,
      storageKey: uploadResult.storageKey,
      uploadedFilePath: uploadResult.url,
      uploadedFileType: fileName.endsWith('.pdf') ? 'pdf' : 'png',
      message: 'Prescription slip uploaded successfully for optician verification',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Prescription file upload failed' });
  }
});

// Secure endpoint to access private prescription files by storageKey or ID
router.get('/prescriptions/files/:storageKey', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storageKey = req.params.storageKey;
    const meta = db.prescriptionFiles.get(storageKey);
    const currentUserId = req.user?.id || (req.query.userId as string);
    const currentUserRole = req.user?.role;

    if (meta && meta.customerId && meta.customerId !== currentUserId && currentUserRole !== 'admin' && (currentUserRole as string) !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized access to private prescription file' });
    }

    const file = await fileStorage.download(storageKey);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(file.buffer);
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message || 'Prescription file not found' });
  }
});

router.get('/prescriptions/file/:id', (req: AuthenticatedRequest, res: Response) => {
  const rx = db.prescriptions.get(req.params.id);
  if (!rx) {
    return res.status(404).json({ success: false, error: 'Prescription not found' });
  }

  // Ensure file is protected and only accessible by owner or admin
  const currentUserId = req.user?.id || (req.query.userId as string);
  const currentUserRole = req.user?.role;

  if (rx.userId && rx.userId !== currentUserId && currentUserRole !== 'admin' && (currentUserRole as string) !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, error: 'Unauthorized access to private prescription file' });
  }

  res.json({
    success: true,
    fileUri: rx.uploadedFilePath || '/placeholders/rx-slip-verified.png',
    title: rx.title,
  });
});

// ==========================================
// 8. Wishlist Endpoints
// ==========================================
router.get('/wishlist/:userId', (req: Request, res: Response) => {
  const set = db.wishlists.get(req.params.userId) || new Set();
  const productIds = Array.from(set);
  res.json({ success: true, productIds });
});

router.post('/wishlist/:userId', (req: Request, res: Response) => {
  const { productId } = req.body;
  if (!db.wishlists.has(req.params.userId)) {
    db.wishlists.set(req.params.userId, new Set());
  }
  const set = db.wishlists.get(req.params.userId)!;
  set.add(productId);
  res.json({ success: true, productIds: Array.from(set) });
});

router.delete('/wishlist/:userId/:productId', (req: Request, res: Response) => {
  const set = db.wishlists.get(req.params.userId);
  if (set) {
    set.delete(req.params.productId);
  }
  res.json({ success: true, productIds: Array.from(set || []) });
});

// ==========================================
// 9. Checkout & Order Endpoints (Phase 5 Abstraction)
// ==========================================

// Create Checkout Session (Revalidates Price, Stock, Prescription & Delivery Charge = ₹0)
router.post('/checkout/session', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId;
  const sessionId = (req.headers['x-session-id'] as string) || req.body.guestSessionId || 'guest-session';
  const cartKey = userId ? `cart-user-${userId}` : `cart-session-${sessionId}`;

  const cart = getOrCreateCart(cartKey, userId);

  const result = createCheckoutSession({
    userId,
    guestSessionId: sessionId,
    customerInfo: req.body.customerInfo,
    deliveryAddress: req.body.deliveryAddress,
    items: cart.items,
    prescriptionConsent: !!req.body.prescriptionConsent,
    termsConsent: !!req.body.termsConsent,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// Retrieve Checkout Session
router.get('/checkout/session/:id', (req: Request, res: Response) => {
  const session = checkoutSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Checkout session not found or expired' });
  }
  res.json({ success: true, session });
});

// Execute Order from Session (Payment Abstraction Layer)
router.post('/checkout/execute', (req: AuthenticatedRequest, res: Response) => {
  const { checkoutSessionId, paymentMethod } = req.body;
  if (!checkoutSessionId) {
    return res.status(400).json({ success: false, error: 'checkoutSessionId is required' });
  }

  const result = executeOrderFromSession({
    checkoutSessionId,
    paymentMethod: paymentMethod || 'UPI',
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(201).json(result);
});

// Get User Orders
router.get('/orders', (req: AuthenticatedRequest, res: Response) => {
  const targetUserId = req.user?.id || (req.query.userId as string);
  let list = Array.from(db.orders.values());
  if (targetUserId) {
    list = list.filter((o) => o.userId === targetUserId);
  }
  res.json({ success: true, orders: list });
});

router.get('/orders/:id', (req: AuthenticatedRequest, res: Response) => {
  const order = db.orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  if (order.userId && order.userId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized to view this order' });
  }
  res.json({ success: true, order });
});

// ==========================================
// 10. Phase 6 Razorpay Payment Endpoints
// ==========================================

// 10.1 Create Razorpay Order
router.post('/payments/razorpay/create-order', async (req: AuthenticatedRequest, res: Response) => {
  const { checkoutSessionId } = req.body;
  if (!checkoutSessionId) {
    return res.status(400).json({ success: false, error: 'checkoutSessionId is required to initiate Razorpay order' });
  }

  const session = checkoutSessions.get(checkoutSessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Checkout session not found or expired. Please review your cart.' });
  }

  // Re-validate cart and items server-side
  const val = validateCartForCheckout(session.items);
  if (!val.valid) {
    return res.status(400).json({ success: false, error: val.error });
  }

  // Ensure Delivery Fee is strictly FREE (₹0)
  if (session.deliveryFee !== 0) {
    return res.status(400).json({ success: false, error: 'Delivery fee mismatch. Free delivery is guaranteed.' });
  }

  try {
    const razorpayOrder = await createRazorpayOrder({
      amountInINR: session.totalAmount,
      receipt: session.id,
      notes: {
        customerName: session.customerInfo.name,
        customerEmail: session.customerInfo.email,
        checkoutSessionId: session.id,
      },
    });

    // Attach generated razorpayOrderId to the server checkout session
    (session as any).razorpayOrderId = razorpayOrder.id;

    const config = getRazorpayConfig();

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      keyId: config.keyId,
      amountInINR: session.totalAmount,
      amountInPaise: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      checkoutSessionId: session.id,
      customerInfo: session.customerInfo,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to create Razorpay payment order' });
  }
});

// 10.2 Verify Razorpay Payment Signature
router.post('/payments/razorpay/verify', (req: AuthenticatedRequest, res: Response) => {
  const { checkoutSessionId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = req.body;

  if (!checkoutSessionId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({
      success: false,
      error: 'Missing required Razorpay payment verification parameters.',
    });
  }

  const session = checkoutSessions.get(checkoutSessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Invalid or expired checkout session. Your items remain safe in your cart.',
    });
  }

  // Verify Razorpay order ID matches session
  if ((session as any).razorpayOrderId && (session as any).razorpayOrderId !== razorpayOrderId) {
    return res.status(400).json({
      success: false,
      error: 'Razorpay Order ID mismatch with active session.',
    });
  }

  // Cryptographic Signature Verification
  const isValidSignature = verifyRazorpayPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValidSignature) {
    return res.status(400).json({
      success: false,
      error: 'Cryptographic payment signature verification failed. Order was not finalized.',
    });
  }

  // Signature verified! Finalize order, deduct inventory, clear cart
  const result = finalizeVerifiedOrder({
    checkoutSessionId,
    razorpayOrderId,
    razorpayPaymentId,
    paymentMethod: paymentMethod || 'UPI',
    paymentStatus: 'Captured',
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(201).json({
    success: true,
    message: 'Payment verified and order finalized successfully.',
    order: result.order,
  });
});

// 10.3 Razorpay Webhook Endpoint
router.post('/payments/razorpay/webhook', (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  if (!signature) {
    return res.status(400).json({ success: false, error: 'Missing x-razorpay-signature header' });
  }

  const result = processRazorpayWebhookEvent(rawBody, signature);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// 10.4 Get Payment Details
router.get('/payments/:id', (req: AuthenticatedRequest, res: Response) => {
  const searchId = req.params.id;
  const order = Array.from(db.orders.values()).find(
    (o) => o.payment.id === searchId || o.payment.razorpayOrderId === searchId || o.payment.razorpayPaymentId === searchId
  );

  if (!order) {
    return res.status(404).json({ success: false, error: 'Payment record not found' });
  }

  res.json({ success: true, payment: order.payment, orderId: order.id, orderNumber: order.orderNumber });
});

// ==========================================
// 11. Admin & Operations REST Endpoints (Phase 7)
// ==========================================

// 11.1 Admin Authentication Login
router.post('/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = loginAdminStaff(email, password);

  if (!result.success) {
    return res.status(401).json(result);
  }

  res.json(result);
});

// 11.2 Current Admin Identity
router.get('/admin/me', requireAdminRole(), (req: AdminAuthenticatedRequest, res: Response) => {
  res.json({ success: true, adminUser: req.adminUser });
});

// 11.3 Real-Time Dashboard Aggregation Metrics
router.get('/admin/dashboard', requireAdminRole(), (_req: AdminAuthenticatedRequest, res: Response) => {
  const metrics = getDashboardMetrics();
  res.json({ success: true, metrics });
});

// 11.4 Order Management & Filtering
router.get('/admin/orders', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { query, status, paymentStatus, prescriptionStatus, limit } = req.query;
  const orders = searchAndFilterOrders({
    query: query as string,
    status: status as string,
    paymentStatus: paymentStatus as string,
    prescriptionStatus: prescriptionStatus as string,
    limit: limit ? Number(limit) : undefined,
  });

  res.json({ success: true, orders, count: orders.length });
});

router.get('/admin/orders/:orderId', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), (req: AdminAuthenticatedRequest, res: Response) => {
  const order = getOrderById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
  }

  res.json({ success: true, order });
});

// 11.5 Order Workflow Status Update Engine
router.patch('/admin/orders/:orderId/status', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { status, note } = req.body;
  const result = updateOrderStatus(req.params.orderId, status, req.adminUser!, note);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// 11.6 Internal Order Notes
router.post('/admin/orders/:orderId/notes', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { note } = req.body;
  if (!note || !note.trim()) {
    return res.status(400).json({ success: false, error: 'Note content is required.' });
  }

  const newNote = addOrderNote(req.params.orderId, note, req.adminUser!);
  res.status(201).json({ success: true, note: newNote });
});

router.get('/admin/orders/:orderId/notes', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), (req: AdminAuthenticatedRequest, res: Response) => {
  const notes = getOrderNotes(req.params.orderId);
  res.json({ success: true, notes });
});

// 11.7 Prescription Queue & Verification Engine
router.get('/admin/prescriptions/queue', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { status } = req.query;
  const queue = getPrescriptionQueue(status as string);
  res.json({ success: true, queue, count: queue.length });
});

router.post('/admin/orders/:orderId/prescription/review', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { action, verificationNote } = req.body;
  if (!['verify', 'clarification', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Action must be verify, clarification, or reject.' });
  }

  const result = reviewPrescription(req.params.orderId, action, verificationNote, req.adminUser!);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// 11.8 Product Management
router.post('/admin/products', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER']), (req: AdminAuthenticatedRequest, res: Response) => {
  const result = createProduct(req.body, req.adminUser!);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(201).json(result);
});

router.patch('/admin/products/:productId', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER']), (req: AdminAuthenticatedRequest, res: Response) => {
  const result = updateProduct(req.params.productId, req.body, req.adminUser!);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

router.patch('/admin/products/:productId/active', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { active } = req.body;
  const result = toggleProductActive(req.params.productId, active, req.adminUser!);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// 11.9 Lens Catalog & Compatibility Management
router.post('/admin/catalog/lens-type', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER']), (req: AdminAuthenticatedRequest, res: Response) => {
  const result = manageLensType(req.body, req.adminUser!);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

router.post('/admin/catalog/material', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER']), (req: AdminAuthenticatedRequest, res: Response) => {
  const result = manageLensMaterial(req.body, req.adminUser!);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

router.post('/admin/catalog/coating', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER']), (req: AdminAuthenticatedRequest, res: Response) => {
  const result = manageLensCoating(req.body, req.adminUser!);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

router.patch('/admin/products/:productId/compatibility', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { allowedLensTypeIds } = req.body;
  if (!Array.isArray(allowedLensTypeIds)) {
    return res.status(400).json({ success: false, error: 'allowedLensTypeIds must be an array.' });
  }

  const result = updateFrameLensCompatibility(req.params.productId, allowedLensTypeIds, req.adminUser!);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// 11.10 Inventory Engine & Ledger
router.get('/admin/inventory', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'CATALOG_MANAGER']), (_req: AdminAuthenticatedRequest, res: Response) => {
  const inventoryList = Array.from(db.inventory.values());
  res.json({ success: true, inventory: inventoryList });
});

router.post('/admin/inventory/:productId/adjust', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'CATALOG_MANAGER']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { quantityChange, type, reason } = req.body;

  if (quantityChange === undefined || !type || !reason) {
    return res.status(400).json({ success: false, error: 'quantityChange, type, and reason are required.' });
  }

  const result = adjustInventory(req.params.productId, Number(quantityChange), type, reason, req.adminUser!);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

router.get('/admin/inventory/:productId/ledger', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'CATALOG_MANAGER']), (req: AdminAuthenticatedRequest, res: Response) => {
  const ledger = getInventoryLedger(req.params.productId);
  res.json({ success: true, ledger });
});

// 11.11 Logistics & Manual Shipment Entry
router.post('/admin/orders/:orderId/shipment', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { courierName, awbNumber, trackingUrl } = req.body;
  const result = createManualShipment(req.params.orderId, courierName, awbNumber, trackingUrl, req.adminUser!);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// 11.12 Shiprocket Pincode Serviceability & Courier Rates API
router.get('/shipping/serviceability/:pincode', async (req: Request, res: Response) => {
  try {
    const { pincode } = req.params;
    const weight = req.query.weight ? parseFloat(req.query.weight as string) : 0.4;
    const result = await checkShiprocketServiceability(pincode, weight);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, serviceable: false, error: err.message || 'Serviceability check failed' });
  }
});

router.post('/shipping/check-serviceability', async (req: Request, res: Response) => {
  try {
    const { pincode, weightKg } = req.body;
    const result = await checkShiprocketServiceability(pincode, weightKg || 0.4);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, serviceable: false, error: err.message || 'Serviceability check failed' });
  }
});

// 11.13 Public Order Tracking API with Shiprocket Live Stages (Customer Accessible)
router.get('/tracking/:orderNumber', (req: Request, res: Response) => {
  const { emailOrPhone } = req.query;
  const orderNumberOrId = req.params.orderNumber.trim();

  let targetOrder: Order | undefined;
  for (const o of db.orders.values()) {
    if (
      o.id === orderNumberOrId ||
      o.orderNumber.toLowerCase() === orderNumberOrId.toLowerCase() ||
      o.shipment?.awbNumber.toLowerCase() === orderNumberOrId.toLowerCase()
    ) {
      if (
        !emailOrPhone ||
        o.customerEmail.toLowerCase() === (emailOrPhone as string).trim().toLowerCase() ||
        o.customerPhone.includes((emailOrPhone as string).trim())
      ) {
        targetOrder = o;
        break;
      }
    }
  }

  if (!targetOrder) {
    return res.status(404).json({ success: false, error: 'Order not found for tracking details.' });
  }

  const trackingData = getCustomerOrderTracking(targetOrder.orderNumber);
  const shiprocketData = getShiprocketOrderTracking(targetOrder);

  res.json({
    success: true,
    tracking: trackingData,
    shiprocket: shiprocketData,
  });
});

router.get('/shipping/track/:orderNumberOrAwb', (req: Request, res: Response) => {
  const param = req.params.orderNumberOrAwb.trim();
  let targetOrder: Order | undefined;

  for (const o of db.orders.values()) {
    if (
      o.id === param ||
      o.orderNumber.toLowerCase() === param.toLowerCase() ||
      o.shipment?.awbNumber.toLowerCase() === param.toLowerCase()
    ) {
      targetOrder = o;
      break;
    }
  }

  if (!targetOrder) {
    return res.status(404).json({ success: false, error: 'Order not found for tracking.' });
  }

  const shiprocketData = getShiprocketOrderTracking(targetOrder);
  res.json({ success: true, tracking: shiprocketData });
});

// 11.14 Cancellation Requests & Approvals
router.post('/orders/:orderId/cancel', (req: Request, res: Response) => {
  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ success: false, error: 'Cancellation reason is required.' });
  }

  const cancelRec = requestOrderCancellation(req.params.orderId, reason);
  if (!cancelRec) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
  }

  res.status(201).json({ success: true, cancellation: cancelRec });
});

router.post('/admin/cancellations/:id/review', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { action } = req.body; // 'approve' | 'reject'
  const result = reviewCancellation(req.params.id, action, req.adminUser!);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// 11.14 Return Requests & Approvals
router.post('/orders/:orderId/return', (req: Request, res: Response) => {
  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ success: false, error: 'Return reason is required.' });
  }

  const retRec = requestOrderReturn(req.params.orderId, reason);
  if (!retRec) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
  }

  res.status(201).json({ success: true, returnRequest: retRec });
});

router.post('/admin/returns/:id/review', requireAdminRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { action } = req.body; // 'approve' | 'reject' | 'receive' | 'refund'
  const result = reviewReturn(req.params.id, action, req.adminUser!);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// 11.15 Audit Log Trail
router.get('/admin/audit-logs', requireAdminRole(['SUPER_ADMIN', 'ADMIN']), (req: AdminAuthenticatedRequest, res: Response) => {
  const { entity, limit } = req.query;
  const logs = getAuditLogs(entity as string, limit ? Number(limit) : 50);
  res.json({ success: true, auditLogs: logs });
});

export default router;
