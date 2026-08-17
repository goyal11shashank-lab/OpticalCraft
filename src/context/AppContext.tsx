/**
 * OptiCraft Eyewear - Global Application State Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  LensType,
  LensMaterial,
  Coating,
  CartItem,
  SavedForLaterItem,
  User,
  Address,
  Prescription,
  Order,
  ProductConfiguration,
  ShiprocketServiceabilityResult,
  ShiprocketOrderTracking,
} from '../types';

export type ActiveTabType = 'home' | 'catalog' | 'product-detail' | 'account' | 'admin' | 'cart';

interface AppContextType {
  // Catalog Data
  products: Product[];
  lensTypes: LensType[];
  materials: LensMaterial[];
  coatings: Coating[];
  loadingProducts: boolean;
  refreshCatalog: () => void;

  // Search & Filters
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  genderFilter: string;
  setGenderFilter: (g: string) => void;
  shapeFilter: string;
  setShapeFilter: (s: string) => void;
  sortOption: string;
  setSortOption: (sort: string) => void;

  // Selected Product & Customizer
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  isConfiguratorOpen: boolean;
  openConfigurator: (p: Product) => void;
  openConfiguratorForEdit: (cartItem: CartItem) => void;
  closeConfigurator: () => void;
  editingCartItem: CartItem | null;
  setEditingCartItem: (item: CartItem | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (config: ProductConfiguration, quantity?: number) => Promise<boolean>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateCartItemQuantity: (cartItemId: string, qty: number) => Promise<void>;
  updateCartItemConfiguration: (cartItemId: string, newConfig: ProductConfiguration) => Promise<boolean>;
  clearCart: () => Promise<void>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartSubtotal: number;
  cartError: string | null;
  setCartError: (err: string | null) => void;
  cartValidationWarnings: string[];
  validateCurrentCart: () => Promise<void>;
  guestSessionId: string;

  // Saved for Later & Wishlist Transfer
  savedForLater: SavedForLaterItem[];
  fetchSavedForLater: () => Promise<void>;
  saveForLater: (cartItemId: string) => Promise<boolean>;
  moveSavedToCart: (savedItemId: string) => Promise<boolean>;
  removeSavedForLater: (savedItemId: string) => Promise<void>;
  moveCartItemToWishlistApi: (cartItemId: string) => Promise<boolean>;
  moveSavedItemToWishlistApi: (savedItemId: string) => Promise<boolean>;

  // Prescription Modal
  viewingPrescription: Prescription | null;
  setViewingPrescription: (rx: Prescription | null) => void;

  // Wishlist
  wishlist: string[]; // Product IDs
  toggleWishlist: (productId: string) => void;

  // User & Auth
  currentUser: User | null;
  authToken: string | null;
  signUpApi: (input: any) => Promise<{ success: boolean; user?: User; token?: string; error?: string; fieldErrors?: Record<string, string> }>;
  sendOtpApi: (input: any) => Promise<{ success: boolean; message?: string; debugOtp?: string; error?: string; fieldErrors?: Record<string, string> }>;
  verifyOtpApi: (mobile: string, otp: string, formData?: any) => Promise<{ success: boolean; user?: User; token?: string; error?: string }>;
  loginApi: (identifier: string, password: string) => Promise<{ success: boolean; user?: User; token?: string; error?: string }>;
  logoutUser: () => void;
  forgotPasswordApi: (identifier: string) => Promise<{ success: boolean; message?: string; debugOtp?: string; debugResetToken?: string; error?: string }>;
  resetPasswordApi: (token: string, newPassword: string, confirmPassword?: string, identifier?: string, otp?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateProfileApi: (input: { firstName?: string; lastName?: string; email?: string; mobile?: string }) => Promise<{ success: boolean; user?: User; error?: string }>;

  userAddresses: Address[];
  fetchAddressesApi: () => Promise<void>;
  addAddressApi: (addr: Partial<Address>) => Promise<{ success: boolean; address?: Address; error?: string }>;
  updateAddressApi: (id: string, addr: Partial<Address>) => Promise<{ success: boolean; address?: Address; error?: string }>;
  setDefaultAddressApi: (id: string) => Promise<{ success: boolean; address?: Address; error?: string }>;
  deleteAddressApi: (id: string) => Promise<{ success: boolean; error?: string }>;

  savedPrescriptions: Prescription[];
  fetchPrescriptionsApi: () => Promise<void>;
  addPrescriptionApi: (rxData: any) => Promise<{ success: boolean; prescription?: Prescription; error?: string }>;
  deletePrescriptionApi: (id: string) => Promise<{ success: boolean; error?: string }>;
  uploadPrescriptionFileApi: (filename: string) => Promise<{ success: boolean; uploadedFilePath?: string; error?: string }>;

  // Orders & Checkout
  orders: Order[];
  fetchOrdersApi: () => Promise<void>;
  createCheckoutSessionApi: (data: any) => Promise<{ success: boolean; session?: any; error?: string }>;
  executeOrderApi: (checkoutSessionId: string, paymentMethod: string) => Promise<{ success: boolean; order?: Order; error?: string }>;
  createRazorpayOrderApi: (checkoutSessionId: string) => Promise<{
    success: boolean;
    razorpayOrderId?: string;
    keyId?: string;
    amountInINR?: number;
    amountInPaise?: number;
    currency?: string;
    checkoutSessionId?: string;
    customerInfo?: any;
    error?: string;
  }>;
  verifyRazorpayPaymentApi: (params: {
    checkoutSessionId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    paymentMethod?: string;
  }) => Promise<{ success: boolean; order?: Order; error?: string }>;
  createOrder: (orderData: Partial<Order>) => Promise<Order>;

  // Modals & Navigation
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;

  // Active Order Modal
  activeConfirmedOrder: Order | null;
  setActiveConfirmedOrder: (order: Order | null) => void;

  // Shiprocket Logistics & Live Tracking
  activeTrackingOrder: ShiprocketOrderTracking | null;
  setActiveTrackingOrder: (tracking: ShiprocketOrderTracking | null) => void;
  checkPincodeServiceabilityApi: (pincode: string) => Promise<ShiprocketServiceabilityResult>;
  fetchOrderTrackingApi: (orderNumberOrAwb: string) => Promise<{
    success: boolean;
    tracking?: any;
    shiprocket?: ShiprocketOrderTracking;
    error?: string;
  }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getOrCreateGuestSessionId = (): string => {
  if (typeof window === 'undefined') return 'guest-session-ssr';
  let sid = localStorage.getItem('opticraft_guest_session_id');
  if (!sid) {
    sid = `guest-sid-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem('opticraft_guest_session_id', sid);
  }
  return sid;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [lensTypes, setLensTypes] = useState<LensType[]>([]);
  const [materials, setMaterials] = useState<LensMaterial[]>([]);
  const [coatings, setCoatings] = useState<Coating[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // Session & User Auth State
  const [guestSessionId] = useState<string>(getOrCreateGuestSessionId);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('opticraft_auth_token');
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [shapeFilter, setShapeFilter] = useState<string>('All');
  const [sortOption, setSortOption] = useState<string>('recommended');

  // Active view & Modals
  const [activeTab, setActiveTab] = useState<ActiveTabType>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState<boolean>(false);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [activeConfirmedOrder, setActiveConfirmedOrder] = useState<Order | null>(null);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<ShiprocketOrderTracking | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<SavedForLaterItem[]>([]);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartValidationWarnings, setCartValidationWarnings] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [savedPrescriptions, setSavedPrescriptions] = useState<Prescription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Helper for authenticated requests
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Session-ID': guestSessionId,
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  // Restore User Session on mount if token exists
  useEffect(() => {
    const restoreSession = async () => {
      if (!authToken) {
        setCurrentUser(null);
        setIsAdmin(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (data.user.role === 'admin') setIsAdmin(true);
        } else {
          // Token invalid
          localStorage.removeItem('opticraft_auth_token');
          setAuthToken(null);
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error verifying token:', err);
        setCurrentUser(null);
        setIsAdmin(false);
      }
    };
    restoreSession();
  }, [authToken]);

  // Fetch Addresses for Current User
  const fetchAddressesApi = async () => {
    if (!currentUser) {
      setUserAddresses([]);
      return;
    }
    try {
      const res = await fetch(`/api/addresses?userId=${currentUser.id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setUserAddresses(data.addresses);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  // Fetch Prescriptions for Current User
  const fetchPrescriptionsApi = async () => {
    if (!currentUser) {
      setSavedPrescriptions([]);
      return;
    }
    try {
      const res = await fetch(`/api/prescriptions?userId=${currentUser.id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setSavedPrescriptions(data.prescriptions);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    }
  };

  // Fetch Orders for Current User
  const fetchOrdersApi = async () => {
    if (!currentUser) {
      setOrders([]);
      return;
    }
    try {
      const res = await fetch(`/api/orders?userId=${currentUser.id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // Fetch Wishlist for Current User
  const fetchWishlistApi = async () => {
    if (!currentUser) {
      setWishlist([]);
      return;
    }
    try {
      const res = await fetch(`/api/wishlist/${currentUser.id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.productIds)) {
        setWishlist(data.productIds);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  };

  useEffect(() => {
    fetchAddressesApi();
    fetchPrescriptionsApi();
    fetchOrdersApi();
    fetchWishlistApi();
  }, [currentUser]);

  // Fetch Cart from Backend
  const fetchCartFromBackend = async () => {
    try {
      const url = currentUser
        ? `/api/cart?userId=${currentUser.id}`
        : `/api/cart?sessionId=${guestSessionId}`;

      const res = await fetch(url, {
        headers: { 'X-Session-ID': guestSessionId },
      });
      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart.items || []);
      }
    } catch (err) {
      console.error('Error fetching cart from backend:', err);
    }
  };

  const fetchSavedForLater = async () => {
    try {
      const url = currentUser
        ? `/api/saved-for-later?userId=${currentUser.id}`
        : `/api/saved-for-later?sessionId=${guestSessionId}`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setSavedForLater(data.items);
      }
    } catch (err) {
      console.error('Error fetching saved for later from backend:', err);
    }
  };

  // Fetch Catalog & Sync Cart on mount or user change
  const refreshCatalog = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }

      const lensRes = await fetch('/api/lens-options');
      const lensData = await lensRes.json();
      if (lensData.success) {
        setLensTypes(lensData.lensTypes);
        setMaterials(lensData.materials);
        setCoatings(lensData.coatings);
      }
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  useEffect(() => {
    fetchCartFromBackend();
    fetchSavedForLater();
  }, [currentUser, guestSessionId]);

  // Configurator launcher
  const openConfigurator = (p: Product) => {
    setSelectedProduct(p);
    setEditingCartItem(null);
    setIsConfiguratorOpen(true);
  };

  const openConfiguratorForEdit = (cartItem: CartItem) => {
    const prod = products.find((p) => p.id === cartItem.configuration.productId);
    if (prod) {
      setSelectedProduct(prod);
      setEditingCartItem(cartItem);
      setIsConfiguratorOpen(true);
    }
  };

  const closeConfigurator = () => {
    setIsConfiguratorOpen(false);
    setEditingCartItem(null);
  };

  // Cart API Operations
  const addToCart = async (config: ProductConfiguration, quantity: number = 1): Promise<boolean> => {
    setCartError(null);
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': guestSessionId,
        },
        body: JSON.stringify({
          sessionId: guestSessionId,
          userId: currentUser?.id,
          configuration: config,
          quantity,
        }),
      });

      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart.items || []);
        setIsCartOpen(true);
        return true;
      } else {
        setCartError(data.error || 'Failed to add item to cart.');
        return false;
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setCartError('Network error adding item to cart.');
      return false;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    setCartError(null);
    try {
      const url = currentUser
        ? `/api/cart/items/${cartItemId}?userId=${currentUser.id}`
        : `/api/cart/items/${cartItemId}?sessionId=${guestSessionId}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'X-Session-ID': guestSessionId },
      });
      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart.items || []);
      }
    } catch (err) {
      console.error('Error removing cart item:', err);
    }
  };

  const updateCartItemQuantity = async (cartItemId: string, qty: number) => {
    setCartError(null);
    if (qty <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const res = await fetch(`/api/cart/items/${cartItemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': guestSessionId,
        },
        body: JSON.stringify({
          sessionId: guestSessionId,
          userId: currentUser?.id,
          quantity: qty,
        }),
      });
      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart.items || []);
      } else {
        setCartError(data.error || 'Could not update item quantity.');
      }
    } catch (err) {
      console.error('Error updating cart item quantity:', err);
    }
  };

  const updateCartItemConfiguration = async (
    cartItemId: string,
    newConfig: ProductConfiguration
  ): Promise<boolean> => {
    setCartError(null);
    try {
      const res = await fetch(`/api/cart/items/${cartItemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': guestSessionId,
        },
        body: JSON.stringify({
          sessionId: guestSessionId,
          userId: currentUser?.id,
          configuration: newConfig,
        }),
      });

      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart.items || []);
        setEditingCartItem(null);
        setIsConfiguratorOpen(false);
        return true;
      } else {
        setCartError(data.error || 'Failed to update item configuration.');
        return false;
      }
    } catch (err) {
      console.error('Error editing cart item:', err);
      setCartError('Failed to update cart item.');
      return false;
    }
  };

  const clearCart = async () => {
    try {
      const url = currentUser
        ? `/api/cart?userId=${currentUser.id}`
        : `/api/cart?sessionId=${guestSessionId}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'X-Session-ID': guestSessionId },
      });
      const data = await res.json();
      if (data.success) {
        setCart([]);
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const validateCurrentCart = async () => {
    try {
      const res = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': guestSessionId,
        },
        body: JSON.stringify({
          sessionId: guestSessionId,
          userId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.cart) {
          setCart(data.cart.items || []);
        }
        if (data.priceChanged) {
          setCartError('The price for a configuration in your cart has changed. Please review your updated totals.');
        }
        if (data.stockWarnings && data.stockWarnings.length > 0) {
          setCartValidationWarnings(data.stockWarnings);
        }
      }
    } catch (err) {
      console.error('Error validating cart:', err);
    }
  };

  // Saved For Later & Item Transfer Operations
  const saveForLater = async (cartItemId: string): Promise<boolean> => {
    setCartError(null);
    try {
      const res = await fetch(`/api/cart/items/${cartItemId}/save-for-later`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId: guestSessionId,
          userId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.cart) setCart(data.cart.items || []);
        if (data.savedItems) setSavedForLater(data.savedItems);
        return true;
      } else {
        setCartError(data.error || 'Failed to save item for later.');
        return false;
      }
    } catch (err) {
      console.error('Error saving item for later:', err);
      setCartError('Network error saving item for later.');
      return false;
    }
  };

  const moveSavedToCart = async (savedItemId: string): Promise<boolean> => {
    setCartError(null);
    try {
      const res = await fetch(`/api/saved-for-later/${savedItemId}/move-to-cart`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId: guestSessionId,
          userId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.cart) setCart(data.cart.items || []);
        if (data.savedItems) setSavedForLater(data.savedItems);
        return true;
      } else {
        setCartError(data.error || 'Unable to move item to cart.');
        return false;
      }
    } catch (err) {
      console.error('Error moving saved item to cart:', err);
      setCartError('Network error moving item to cart.');
      return false;
    }
  };

  const removeSavedForLater = async (savedItemId: string) => {
    try {
      const url = currentUser
        ? `/api/saved-for-later/${savedItemId}?userId=${currentUser.id}`
        : `/api/saved-for-later/${savedItemId}?sessionId=${guestSessionId}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.savedItems) {
        setSavedForLater(data.savedItems);
      }
    } catch (err) {
      console.error('Error removing saved item:', err);
    }
  };

  const moveCartItemToWishlistApi = async (cartItemId: string): Promise<boolean> => {
    setCartError(null);
    try {
      const res = await fetch(`/api/cart/items/${cartItemId}/move-to-wishlist`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId: guestSessionId,
          userId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.cart) setCart(data.cart.items || []);
        if (data.wishlist) setWishlist(data.wishlist);
        return true;
      } else {
        setCartError(data.error || 'Failed to move item to wishlist.');
        return false;
      }
    } catch (err) {
      console.error('Error moving cart item to wishlist:', err);
      setCartError('Network error moving item to wishlist.');
      return false;
    }
  };

  const moveSavedItemToWishlistApi = async (savedItemId: string): Promise<boolean> => {
    setCartError(null);
    try {
      const res = await fetch(`/api/saved-for-later/${savedItemId}/move-to-wishlist`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId: guestSessionId,
          userId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.savedItems) setSavedForLater(data.savedItems);
        if (data.wishlist) setWishlist(data.wishlist);
        return true;
      } else {
        setCartError(data.error || 'Failed to move saved item to wishlist.');
        return false;
      }
    } catch (err) {
      console.error('Error moving saved item to wishlist:', err);
      return false;
    }
  };

  // User Auth APIs
  const sendOtpApi = async (input: any) => {
    try {
      const res = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: 'Network error sending verification code.' };
    }
  };

  const verifyOtpApi = async (mobile: string, otp: string, formData?: any) => {
    try {
      const res = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp, formData }),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem('opticraft_auth_token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        if (data.user.role === 'admin') setIsAdmin(true);
        fetchCartFromBackend();
      }
      return data;
    } catch (err: any) {
      return { success: false, error: 'Network error verifying code.' };
    }
  };

  const signUpApi = async (input: any) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem('opticraft_auth_token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        if (data.user.role === 'admin') setIsAdmin(true);
        fetchCartFromBackend();
      }
      return data;
    } catch (err: any) {
      return { success: false, error: 'Network error during sign up.' };
    }
  };

  const loginApi = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem('opticraft_auth_token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        if (data.user.role === 'admin') setIsAdmin(true);

        // Merge cart
        fetch('/api/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestSessionId, userId: data.user.id }),
        }).then(() => fetchCartFromBackend());
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Network error during login.' };
    }
  };

  const forgotPasswordApi = async (identifier: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error requesting password reset.' };
    }
  };

  const resetPasswordApi = async (
    token: string,
    newPassword: string,
    confirmPassword?: string,
    identifier?: string,
    otp?: string
  ) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword, identifier, otp }),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem('opticraft_auth_token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Network error resetting password.' };
    }
  };

  const updateProfileApi = async (input: { firstName?: string; lastName?: string; email?: string; mobile?: string }) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...input, userId: currentUser?.id }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Network error updating profile.' };
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('opticraft_auth_token');
    setAuthToken(null);
    setCurrentUser(null);
    setIsAdmin(false);
    setUserAddresses([]);
    setSavedPrescriptions([]);
    setOrders([]);
    setWishlist([]);
    setCart([]);
  };

  const cartSubtotal = cart.reduce(
    (total, item) => total + item.configuration.calculatedTotalPrice * item.quantity,
    0
  );

  // Wishlist toggle
  const toggleWishlist = (productId: string) => {
    const isCurrentlyWishlisted = wishlist.includes(productId);
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

    if (currentUser) {
      if (isCurrentlyWishlisted) {
        fetch(`/api/wishlist/${currentUser.id}/${productId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }).catch((err) => console.error('Error removing from wishlist:', err));
      } else {
        fetch(`/api/wishlist/${currentUser.id}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ productId }),
        }).catch((err) => console.error('Error adding to wishlist:', err));
      }
    }
  };

  // Saved Addresses API handlers
  const addAddressApi = async (addr: Partial<Address>) => {
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...addr, userId: currentUser?.id }),
      });
      const data = await res.json();
      if (data.success && data.address) {
        await fetchAddressesApi();
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Network error saving address.' };
    }
  };

  const updateAddressApi = async (id: string, addr: Partial<Address>) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(addr),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAddressesApi();
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Network error updating address.' };
    }
  };

  const setDefaultAddressApi = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}/default`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAddressesApi();
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Network error setting default address.' };
    }
  };

  const deleteAddressApi = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAddressesApi();
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Network error deleting address.' };
    }
  };

  // Saved Prescriptions API handlers
  const addPrescriptionApi = async (rxData: any) => {
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...rxData, userId: currentUser?.id }),
      });
      const data = await res.json();
      if (data.success && data.prescription) {
        await fetchPrescriptionsApi();
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Network error saving prescription.' };
    }
  };

  const deletePrescriptionApi = async (id: string) => {
    try {
      const res = await fetch(`/api/prescriptions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPrescriptionsApi();
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Network error deleting prescription.' };
    }
  };

  const uploadPrescriptionFileApi = async (filename: string) => {
    try {
      const res = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ filename }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error uploading prescription file.' };
    }
  };

  // Checkout Session & Order Execution
  const createCheckoutSessionApi = async (data: any) => {
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          userId: currentUser?.id,
          guestSessionId,
        }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error creating checkout session.' };
    }
  };

  const executeOrderApi = async (checkoutSessionId: string, paymentMethod: string) => {
    try {
      const res = await fetch('/api/checkout/execute', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ checkoutSessionId, paymentMethod }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        await fetchOrdersApi();
        await fetchCartFromBackend();
        setActiveConfirmedOrder(data.order);
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Network error processing payment.' };
    }
  };

  const createRazorpayOrderApi = async (checkoutSessionId: string) => {
    try {
      const res = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ checkoutSessionId }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error initiating Razorpay order.' };
    }
  };

  const verifyRazorpayPaymentApi = async (params: {
    checkoutSessionId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    paymentMethod?: string;
  }) => {
    try {
      const res = await fetch('/api/payments/razorpay/verify', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success && data.order) {
        await fetchOrdersApi();
        await fetchCartFromBackend();
        setActiveConfirmedOrder(data.order);
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Network error verifying Razorpay payment signature.' };
    }
  };

  // Shiprocket Pincode Serviceability Check API
  const checkPincodeServiceabilityApi = async (
    pincode: string
  ): Promise<ShiprocketServiceabilityResult> => {
    try {
      const cleanPin = pincode.replace(/\D/g, '').slice(0, 6);
      const res = await fetch(`/api/shipping/serviceability/${cleanPin}`);
      if (!res.ok) {
        throw new Error(`Serviceability request failed with status ${res.status}`);
      }
      const data: ShiprocketServiceabilityResult = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        serviceable: false,
        pincode,
        city: '',
        state: '',
        pickupPincode: '560038',
        deliveryDaysMin: 0,
        deliveryDaysMax: 0,
        estimatedDeliveryDate: '',
        formattedEta: '',
        couriers: [],
        recommendedCourier: null,
        codAvailable: false,
        prepaidAvailable: false,
        freeShippingApplied: true,
        guaranteedPromise: '',
        source: 'shiprocket_smart_fallback',
        error: err.message || 'Unable to check delivery serviceability.',
      };
    }
  };

  // Shiprocket & Logistics Live Tracking API
  const fetchOrderTrackingApi = async (
    orderNumberOrAwb: string
  ): Promise<{
    success: boolean;
    tracking?: any;
    shiprocket?: ShiprocketOrderTracking;
    error?: string;
  }> => {
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(orderNumberOrAwb.trim())}`);
      if (!res.ok) {
        return { success: false, error: 'Tracking details not found for this order.' };
      }
      const data = await res.json();
      if (data.shiprocket) {
        setActiveTrackingOrder(data.shiprocket);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch tracking data.' };
    }
  };

  // Fallback direct createOrder helper
  const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
    const sessionRes = await createCheckoutSessionApi({
      customerInfo: {
        name: orderData.customerName || currentUser?.name || 'Customer',
        email: orderData.customerEmail || currentUser?.email || 'customer@opticraft.in',
        phone: orderData.customerPhone || currentUser?.phone || '+91 9876543210',
      },
      deliveryAddress: orderData.deliveryAddress || userAddresses[0],
      prescriptionConsent: true,
      termsConsent: true,
    });

    if (sessionRes.success && sessionRes.session) {
      const execRes = await executeOrderApi(
        sessionRes.session.id,
        orderData.payment?.paymentMethod || 'UPI'
      );
      if (execRes.success && execRes.order) {
        return execRes.order;
      }
    }

    throw new Error(sessionRes.error || 'Failed to place order.');
  };

  return (
    <AppContext.Provider
      value={{
        products,
        lensTypes,
        materials,
        coatings,
        loadingProducts,
        refreshCatalog,

        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        genderFilter,
        setGenderFilter,
        shapeFilter,
        setShapeFilter,
        sortOption,
        setSortOption,

        selectedProduct,
        setSelectedProduct,
        isConfiguratorOpen,
        openConfigurator,
        openConfiguratorForEdit,
        closeConfigurator,
        editingCartItem,
        setEditingCartItem,

        cart,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        updateCartItemConfiguration,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartSubtotal,
        cartError,
        setCartError,
        cartValidationWarnings,
        validateCurrentCart,
        guestSessionId,

        savedForLater,
        fetchSavedForLater,
        saveForLater,
        moveSavedToCart,
        removeSavedForLater,
        moveCartItemToWishlistApi,
        moveSavedItemToWishlistApi,

        viewingPrescription,
        setViewingPrescription,

        wishlist,
        toggleWishlist,

        currentUser,
        authToken,
        signUpApi,
        sendOtpApi,
        verifyOtpApi,
        loginApi,
        logoutUser,
        forgotPasswordApi,
        resetPasswordApi,
        updateProfileApi,

        userAddresses,
        fetchAddressesApi,
        addAddressApi,
        updateAddressApi,
        setDefaultAddressApi,
        deleteAddressApi,

        savedPrescriptions,
        fetchPrescriptionsApi,
        addPrescriptionApi,
        deletePrescriptionApi,
        uploadPrescriptionFileApi,

        orders,
        fetchOrdersApi,
        createCheckoutSessionApi,
        executeOrderApi,
        createRazorpayOrderApi,
        verifyRazorpayPaymentApi,
        createOrder,

        activeTab,
        setActiveTab,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isAdmin,
        setIsAdmin,

        activeConfirmedOrder,
        setActiveConfirmedOrder,

        activeTrackingOrder,
        setActiveTrackingOrder,
        checkPincodeServiceabilityApi,
        fetchOrderTrackingApi,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
