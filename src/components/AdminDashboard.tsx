/**
 * OptiCraft Eyewear - Operations Platform & Admin Management Dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Package,
  SlidersHorizontal,
  FileCheck,
  AlertTriangle,
  Plus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Truck,
  Search,
  Filter,
  Eye,
  FileText,
  Clock,
  ShieldAlert,
  UserCheck,
  LogOut,
  ChevronRight,
  Send,
  Layers,
  History,
  Info,
  Check,
} from 'lucide-react';
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
  Product,
  LensType,
  LensMaterial,
  Coating,
} from '../types';

export const AdminDashboard: React.FC = () => {
  // Admin Token & Session State
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('opticraft_admin_token'));
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loginEmail, setLoginEmail] = useState('admin@opticraft.in');
  const [loginPassword, setLoginPassword] = useState('Admin123!');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'prescriptions' | 'products' | 'catalog' | 'inventory' | 'tracking' | 'audit'>('dashboard');

  // Real-Time Data States
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rxQueue, setRxQueue] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Search
  const [orderQuery, setOrderQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [rxStatusFilter, setRxStatusFilter] = useState('ALL');

  // Modals & Drawers
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderNotes, setSelectedOrderNotes] = useState<OrderNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isNoteSubmitting, setIsNoteSubmitting] = useState(false);

  // Status Change State
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('Confirmed');
  const [statusNote, setStatusNote] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  // Shipment Modal State
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [courierName, setCourierName] = useState('Bluedart Express');
  const [awbNumber, setAwbNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  // Prescription Review Modal
  const [selectedRxItem, setSelectedRxItem] = useState<any | null>(null);
  const [rxAction, setRxAction] = useState<'verify' | 'clarification' | 'reject'>('verify');
  const [rxNote, setRxNote] = useState('');

  // Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Inventory Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<InventoryRecord | null>(null);
  const [qtyChange, setQtyChange] = useState<number>(10);
  const [adjType, setAdjType] = useState<'Addition' | 'Adjustment' | 'Return'>('Addition');
  const [adjReason, setAdjReason] = useState('Stock Refill from Warehouse');
  const [selectedLedger, setSelectedLedger] = useState<InventoryTransaction[]>([]);

  // Public Order Tracking Search
  const [trackNumber, setTrackNumber] = useState('OPT-2026-');
  const [trackPhoneEmail, setTrackPhoneEmail] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);

  // Helper Header Config
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  });

  // Verify token on mount or change
  useEffect(() => {
    if (adminToken) {
      fetch('/api/admin/me', { headers: getAuthHeaders() })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAdminUser(data.adminUser);
            loadDashboardData();
          } else {
            handleLogout();
          }
        })
        .catch(() => handleLogout());
    }
  }, [adminToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('opticraft_admin_token', data.token);
        setAdminToken(data.token);
        setAdminUser(data.adminUser);
      } else {
        setLoginError(data.error || 'Authentication failed.');
      }
    } catch {
      setLoginError('Server error connecting to authentication endpoint.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('opticraft_admin_token');
    setAdminToken(null);
    setAdminUser(null);
  };

  const loadDashboardData = async () => {
    if (!adminToken) return;
    setIsLoading(true);

    try {
      const [mRes, oRes, rxRes, pRes, iRes, aRes] = await Promise.all([
        fetch('/api/admin/dashboard', { headers: getAuthHeaders() }),
        fetch('/api/admin/orders', { headers: getAuthHeaders() }),
        fetch('/api/admin/prescriptions/queue', { headers: getAuthHeaders() }),
        fetch('/api/products'),
        fetch('/api/admin/inventory', { headers: getAuthHeaders() }),
        fetch('/api/admin/audit-logs', { headers: getAuthHeaders() }),
      ]);

      const [mData, oData, rxData, pData, iData, aData] = await Promise.all([
        mRes.json(),
        oRes.json(),
        rxRes.json(),
        pRes.json(),
        iRes.json(),
        aRes.json(),
      ]);

      if (mData.success) setMetrics(mData.metrics);
      if (oData.success) setOrders(oData.orders);
      if (rxData.success) setRxQueue(rxData.queue);
      if (pData.success) setProductsList(pData.products);
      if (iData.success) setInventoryList(iData.inventory);
      if (aData.success) setAuditLogs(aData.auditLogs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Order Details
  const handleOpenOrderDetails = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.order);
        setSelectedOrderNotes(data.order.notes || []);
        setTargetStatus(data.order.status);
        setStatusError(null);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    }
  };

  // Submit Order Status Change
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setStatusError(null);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: targetStatus, note: statusNote }),
      });
      const data = await res.json();

      if (data.success) {
        setSelectedOrder(data.order);
        setStatusNote('');
        loadDashboardData();
      } else {
        setStatusError(data.error || 'Status transition rejected.');
      }
    } catch {
      setStatusError('Network error updating order status.');
    }
  };

  // Submit Internal Order Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newNoteText.trim()) return;
    setIsNoteSubmitting(true);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ note: newNoteText }),
      });
      const data = await res.json();

      if (data.success) {
        setSelectedOrderNotes((prev) => [...prev, data.note]);
        setNewNoteText('');
      }
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setIsNoteSubmitting(false);
    }
  };

  // Create Manual Shipment
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/shipment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courierName,
          awbNumber: awbNumber || `AWB-${Math.floor(10000000 + Math.random() * 90000000)}`,
          trackingUrl,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setIsShipmentModalOpen(false);
        handleOpenOrderDetails(selectedOrder.id);
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error creating shipment:', err);
    }
  };

  // Submit Prescription Review
  const handleSubmitRxReview = async () => {
    if (!selectedRxItem) return;

    try {
      const res = await fetch(`/api/admin/orders/${selectedRxItem.orderId}/prescription/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: rxAction,
          verificationNote: rxNote,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSelectedRxItem(null);
        setRxNote('');
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error reviewing rx:', err);
    }
  };

  // Submit Inventory Adjustment
  const handleAdjustInventory = async () => {
    if (!adjustingProduct) return;

    try {
      const res = await fetch(`/api/admin/inventory/${adjustingProduct.productId}/adjust`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          quantityChange: qtyChange,
          type: adjType,
          reason: adjReason,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setAdjustingProduct(null);
        loadDashboardData();
      } else {
        alert(data.error || 'Inventory adjustment failed.');
      }
    } catch (err) {
      console.error('Error adjusting stock:', err);
    }
  };

  // View Inventory Ledger
  const handleViewLedger = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/inventory/${productId}/ledger`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setSelectedLedger(data.ledger);
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
    }
  };

  // Track Order Public Query
  const handleTrackQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackNumber) return;

    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(trackNumber.trim())}?emailOrPhone=${encodeURIComponent(trackPhoneEmail.trim())}`);
      const data = await res.json();
      if (data.success) {
        setTrackingResult(data.tracking);
      } else {
        setTrackingResult({ error: data.error || 'Order not found.' });
      }
    } catch {
      setTrackingResult({ error: 'Failed to fetch tracking updates.' });
    }
  };

  // Save/Create Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const isNew = !editingProduct.id;
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${editingProduct.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(editingProduct),
      });
      const data = await res.json();

      if (data.success) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        loadDashboardData();
      } else {
        alert(data.error || 'Failed to save product.');
      }
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  // =======================================================
  // LOGIN SCREEN (If not authenticated as admin)
  // =======================================================
  if (!adminUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Lock className="w-8 h-8" />
            </div>
            <span className="text-amber-400 font-bold text-xs uppercase tracking-widest px-3 py-1 bg-amber-400/10 rounded-full border border-amber-400/20 inline-block">
              RESTRICTED ACCESS
            </span>
            <h1 className="text-2xl font-black text-white">OptiCraft Business Portal</h1>
            <p className="text-xs text-slate-400">Sign in with authorized staff credentials to manage orders & operations.</p>
          </div>

          {/* Seed Credentials Quick Filler */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Quick Fill Demo Roles:</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('superadmin@opticraft.in');
                  setLoginPassword('SuperAdmin123!');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-left truncate"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('admin@opticraft.in');
                  setLoginPassword('Admin123!');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-left truncate"
              >
                🏬 Store Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('ops@opticraft.in');
                  setLoginPassword('Ops123!');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-left truncate"
              >
                📦 Operations
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('catalog@opticraft.in');
                  setLoginPassword('Catalog123!');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 text-left truncate"
              >
                🏷️ Catalog Mgr
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Staff Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Staff Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isLoggingIn ? 'Authenticating...' : 'Authenticate Staff Access'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =======================================================
  // AUTHENTICATED DASHBOARD VIEW
  // =======================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shrink-0">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-extrabold text-[11px] uppercase tracking-widest px-3 py-0.5 bg-amber-400/10 rounded-full border border-amber-400/20">
                OPTICRAFT OPERATIONS PLATFORM
              </span>
              <span className="bg-slate-800 text-slate-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                ROLE: {adminUser.role}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Welcome back, {adminUser.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} /> Sync Data
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Overview & KPI Dashboard
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Order Fulfillment ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'prescriptions'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Rx Queue ({metrics?.businessSummary.pendingPrescriptionCount || 0})
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Inventory & Stock Ledger
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" /> Frame Catalog ({productsList.length})
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-4 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tracking'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" /> Live Tracking Search
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" /> Audit Logs
        </button>
      </div>

      {/* ======================================================= */}
      {/* TAB 1: OVERVIEW & KPI DASHBOARD */}
      {/* ======================================================= */}
      {activeTab === 'dashboard' && metrics && (
        <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Today's Sales Revenue</span>
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                ₹{metrics.businessSummary.totalSalesINR.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Verified Razorpay Captured Total</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Customer Orders</span>
                <ShoppingBag className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{metrics.businessSummary.totalOrders}</div>
              <p className="text-[11px] text-emerald-600 font-bold">{metrics.today.newOrders} Orders Placed Today</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Rx Queue</span>
                <FileCheck className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{metrics.businessSummary.pendingPrescriptionCount}</div>
              <p className="text-[11px] text-amber-600 font-bold">Awaiting Staff Optician Review</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Low Stock Alerts</span>
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {metrics.businessSummary.lowStockItemsCount + metrics.businessSummary.outOfStockItemsCount}
              </div>
              <p className="text-[11px] text-rose-600 font-bold">
                {metrics.businessSummary.outOfStockItemsCount} Out of Stock
              </p>
            </div>
          </div>

          {/* Today's Operational Breakdown */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-amber-400 uppercase tracking-wider">
              Today's Fulfillment Pipeline Status
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-center">
                <span className="text-xs text-slate-400 font-bold block">New Placed</span>
                <span className="text-xl font-black text-white">{metrics.today.newOrders}</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-center">
                <span className="text-xs text-slate-400 font-bold block">Paid / Captured</span>
                <span className="text-xl font-black text-emerald-400">{metrics.today.paidOrders}</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-center">
                <span className="text-xs text-slate-400 font-bold block">In Lab Mfg</span>
                <span className="text-xl font-black text-amber-400">{metrics.today.ordersProcessing}</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-center">
                <span className="text-xs text-slate-400 font-bold block">Ready to Ship</span>
                <span className="text-xl font-black text-cyan-400">{metrics.today.ordersReadyToShip}</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-center">
                <span className="text-xs text-slate-400 font-bold block">Dispatched</span>
                <span className="text-xl font-black text-blue-400">{metrics.today.ordersShipped}</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-center">
                <span className="text-xs text-slate-400 font-bold block">Delivered</span>
                <span className="text-xl font-black text-emerald-400">{metrics.today.ordersDelivered}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* TAB 2: ORDER FULFILLMENT & WORKFLOW */}
      {/* ======================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Order Search & Filters */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search Order #, Customer, Phone..."
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Order Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Prescription Verification">Prescription Verification</option>
                <option value="Processing">Processing</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Ready to Dispatch">Ready to Dispatch</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Order # & Date</th>
                    <th className="px-6 py-4">Customer Info</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4">Prescription Status</th>
                    <th className="px-6 py-4">Workflow Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders
                    .filter((o) => {
                      if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) return false;
                      if (orderQuery) {
                        const q = orderQuery.toLowerCase();
                        return (
                          o.orderNumber.toLowerCase().includes(q) ||
                          o.customerName.toLowerCase().includes(q) ||
                          o.customerPhone.includes(q)
                        );
                      }
                      return true;
                    })
                    .map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-slate-900 block">{o.orderNumber}</span>
                          <span className="text-[11px] text-slate-600">
                            {new Date(o.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 block">{o.customerName}</span>
                          <span className="text-[11px] text-slate-600 block">{o.customerEmail}</span>
                          <span className="text-[11px] text-slate-600">{o.customerPhone}</span>
                        </td>
                        <td className="px-6 py-4 font-black text-slate-900">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              o.payment.status === 'Captured'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.payment.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {o.payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              o.prescriptionVerificationStatus === 'Verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.prescriptionVerificationStatus === 'Pending Verification'
                                ? 'bg-amber-100 text-amber-800'
                                : o.prescriptionVerificationStatus === 'Clarification Required'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {o.prescriptionVerificationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenOrderDetails(o.id)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" /> Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* TAB 3: PRESCRIPTION QUEUE */}
      {/* ======================================================= */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 text-amber-900 text-xs font-medium">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              OptiCraft Optician Queue: Review lens power parameters carefully. Orders cannot move to Manufacturing until status is 'Verified'.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rxQueue.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-black text-slate-900 text-sm block">{item.orderNumber}</span>
                    <span className="text-xs text-slate-500">{item.customerName}</span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      item.prescriptionStatus === 'Verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.prescriptionStatus}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block">FRAME & LENS:</span>
                    <span className="font-extrabold text-slate-800">{item.productName}</span> ({item.lensTypeName})
                  </div>

                  {item.prescription && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1">
                      <p>OD (Right): SPH {item.prescription.odRight?.sph} | CYL {item.prescription.odRight?.cyl} | AXIS {item.prescription.odRight?.axis}°</p>
                      <p>OS (Left) : SPH {item.prescription.osLeft?.sph} | CYL {item.prescription.osLeft?.cyl} | AXIS {item.prescription.osLeft?.axis}°</p>
                      <p className="font-extrabold text-slate-900">PD (Pupillary Distance): {item.prescription.pd} mm</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedRxItem(item);
                    setRxAction('verify');
                    setRxNote('');
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <UserCheck className="w-4 h-4" /> Review Prescription
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* TAB 4: INVENTORY & LEDGER */}
      {/* ======================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Product ID & SKU</th>
                    <th className="px-6 py-4">Total Stock</th>
                    <th className="px-6 py-4">Reserved (Orders)</th>
                    <th className="px-6 py-4">Available Stock</th>
                    <th className="px-6 py-4">Stock Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {inventoryList.map((inv) => (
                    <tr key={inv.productId} className="hover:bg-slate-50/80 transition-all">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {inv.sku}
                        <span className="text-[11px] text-slate-600 block">{inv.productId}</span>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-800">{inv.stockCount}</td>
                      <td className="px-6 py-4 text-amber-600 font-extrabold">{inv.reservedCount || 0}</td>
                      <td className="px-6 py-4 text-emerald-600 font-black text-sm">{inv.availableCount}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            inv.status === 'In Stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'Low Stock'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setAdjustingProduct(inv);
                            setQtyChange(10);
                            setAdjType('Addition');
                            setAdjReason('Stock Refill');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs transition-all shadow-xs"
                        >
                          Adjust Stock
                        </button>
                        <button
                          onClick={() => handleViewLedger(inv.productId)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                        >
                          Ledger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* TAB 5: FRAME CATALOG & PRODUCTS */}
      {/* ======================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-900">Optical Frames & Sunglasses Catalog</h2>
            <button
              onClick={() => {
                setEditingProduct({});
                setIsProductModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Add New Optical Frame
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsList.map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="h-40 bg-slate-50 rounded-2xl p-2 flex items-center justify-center overflow-hidden">
                  <img src={p.images[0]} alt={p.name} className="max-h-full object-contain" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">{p.category}</span>
                  <h3 className="font-black text-slate-900 text-sm truncate">{p.name}</h3>
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                    <span>₹{p.price.toLocaleString('en-IN')}</span>
                    <span className="text-slate-500">Stock: {p.stock}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingProduct(p);
                      setIsProductModalOpen(true);
                    }}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-400" /> Edit Frame
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* TAB 6: PUBLIC LIVE TRACKING TOOL */}
      {/* ======================================================= */}
      {activeTab === 'tracking' && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-black text-slate-900">Live Customer Shipment Tracking</h2>
            <p className="text-xs text-slate-500">Look up any order status timeline directly from database state.</p>
          </div>

          <form onSubmit={handleTrackQuery} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Order Number</label>
              <input
                type="text"
                placeholder="e.g. OPT-2026-98765"
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl transition-all shadow-md text-xs"
            >
              Fetch Live Tracking Updates
            </button>
          </form>

          {trackingResult && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              {trackingResult.error ? (
                <div className="p-4 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{trackingResult.error}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block">ORDER NUMBER</span>
                      <span className="font-black text-slate-900 text-sm">{trackingResult.orderNumber}</span>
                    </div>
                    <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black rounded-full">
                      {trackingResult.status}
                    </span>
                  </div>

                  {/* Timeline Steps */}
                  <div className="space-y-3 pl-2 border-l-2 border-amber-500/30">
                    {trackingResult.timelineSteps?.map((step: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            step.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {step.completed ? '✓' : i + 1}
                        </div>
                        <span className={step.completed ? 'font-black text-slate-900' : 'text-slate-400 font-medium'}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================= */}
      {/* TAB 7: AUDIT LOGS */}
      {/* ======================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-black text-slate-900 text-base">Security Audit Log Trail</h2>
            <span className="text-xs font-bold text-slate-500">{auditLogs.length} Records Logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">{log.adminName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({log.adminRole})</span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-amber-600">{log.action}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {log.entity}: {log.entityId}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: ORDER DETAILS & STATUS MANAGEMENT */}
      {/* ======================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-3xl w-full rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 border border-slate-200 shadow-2xl my-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-amber-600 font-bold text-xs uppercase tracking-wider">ORDER DETAILS</span>
                <h2 className="text-xl font-black text-slate-900">{selectedOrder.orderNumber}</h2>
                <span className="text-xs text-slate-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Workflow Transition Control */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
              <h3 className="font-extrabold text-sm text-amber-400 uppercase tracking-wider">
                Workflow Status Transition Engine
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Current Status</label>
                  <span className="px-3 py-1.5 bg-slate-800 text-white font-black rounded-xl inline-block border border-slate-700">
                    {selectedOrder.status}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Transition To</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Prescription Verification">Prescription Verification</option>
                    <option value="Processing">Processing</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Ready to Dispatch">Ready to Dispatch</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 text-xs">Status Change Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lens edging completed in Bangalore lab..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {statusError && (
                <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{statusError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleUpdateStatus}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md"
                >
                  Apply Status Transition
                </button>

                <button
                  onClick={() => setIsShipmentModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-700"
                >
                  <Truck className="w-4 h-4 text-cyan-400" /> Dispatch Courier Shipment
                </button>
              </div>
            </div>

            {/* Customer & Items Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Customer Delivery</span>
                <p className="font-extrabold text-slate-900">{selectedOrder.customerName}</p>
                <p className="text-slate-600">{selectedOrder.customerEmail} | {selectedOrder.customerPhone}</p>
                <p className="text-slate-600 pt-1 font-medium">{selectedOrder.deliveryAddress.houseFlat}, {selectedOrder.deliveryAddress.streetLocality}, {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} - {selectedOrder.deliveryAddress.pinCode}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Razorpay Payment</span>
                <p className="font-extrabold text-slate-900">Amount Paid: ₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</p>
                <p className="text-slate-600 font-mono">Order ID: {selectedOrder.payment.razorpayOrderId || 'N/A'}</p>
                <p className="text-slate-600 font-mono">Payment ID: {selectedOrder.payment.razorpayPaymentId || 'N/A'}</p>
                <p className="text-emerald-600 font-bold pt-1">Method: {selectedOrder.payment.paymentMethod} ({selectedOrder.payment.status})</p>
              </div>
            </div>

            {/* Internal Notes Section */}
            <div className="space-y-3 pt-2">
              <h4 className="font-extrabold text-sm text-slate-900">Internal Operations Notes</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedOrderNotes.map((n) => (
                  <div key={n.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center text-slate-500 font-bold text-[10px] pb-1">
                      <span>{n.authorName} ({n.authorRole})</span>
                      <span>{new Date(n.createdAt).toLocaleTimeString('en-IN')}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{n.note}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add operational note for staff..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={isNoteSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition-all shadow-xs"
                >
                  Add Note
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: MANUAL SHIPMENT CREATION */}
      {/* ======================================================= */}
      {isShipmentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Manual Shipment Dispatch Entry</h3>
              <button onClick={() => setIsShipmentModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Logistics Courier Name</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                >
                  <option value="Bluedart Express">Bluedart Express</option>
                  <option value="Delhivery Courier">Delhivery Courier</option>
                  <option value="DTDC India">DTDC India</option>
                  <option value="FedEx Express">FedEx Express</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Airway Bill (AWB Number)</label>
                <input
                  type="text"
                  placeholder="e.g. AWB-987654321"
                  value={awbNumber}
                  onChange={(e) => setAwbNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block mb-1">Courier Tracking URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://track.courier.in/awb"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md"
              >
                Confirm Dispatch & Mark Shipped
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: PRESCRIPTION REVIEW */}
      {/* ======================================================= */}
      {selectedRxItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Optician Prescription Review</h3>
              <button onClick={() => setSelectedRxItem(null)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Decision Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRxAction('verify')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      rxAction === 'verify'
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ✓ Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxAction('clarification')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      rxAction === 'clarification'
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ? Clarify
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxAction('reject')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      rxAction === 'reject'
                        ? 'bg-rose-500 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Optician Review Notes</label>
                <textarea
                  rows={3}
                  placeholder="Provide details or notes for customer notification..."
                  value={rxNote}
                  onChange={(e) => setRxNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <button
                onClick={handleSubmitRxReview}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl transition-all shadow-md"
              >
                Submit Optician Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: INVENTORY ADJUSTMENT */}
      {/* ======================================================= */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Adjust Physical Inventory</h3>
                <span className="text-xs text-slate-500 font-mono">SKU: {adjustingProduct.sku}</span>
              </div>
              <button onClick={() => setAdjustingProduct(null)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Transaction Type</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="Addition">Stock Addition (+ Positive)</option>
                  <option value="Adjustment">Stock Adjustment (Damaged / Missing)</option>
                  <option value="Return">Customer Return (+ Positive)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Quantity Change (Units)</label>
                <input
                  type="number"
                  value={qtyChange}
                  onChange={(e) => setQtyChange(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Mandatory Reason / Note</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <button
                onClick={handleAdjustInventory}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl transition-all shadow-md"
              >
                Log Transaction & Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
