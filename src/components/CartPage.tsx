/**
 * OptiCraft Eyewear - Dedicated Full Cart Page Component (Phase 4)
 * Supports complete customized eyewear configuration management
 */

import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  Trash2,
  Edit3,
  Eye,
  Truck,
  ShieldCheck,
  ArrowRight,
  Glasses,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface CartPageProps {
  onProceedToCheckout?: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onProceedToCheckout }) => {
  const {
    cart,
    removeFromCart,
    updateCartItemQuantity,
    openConfiguratorForEdit,
    setViewingPrescription,
    cartSubtotal,
    cartError,
    setCartError,
    cartValidationWarnings,
    validateCurrentCart,
    setSelectedCategory,
    setActiveTab,
    products,
  } = useApp();

  // Validate cart on page view to catch stock/price changes
  useEffect(() => {
    validateCurrentCart();
  }, []);

  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleShopCategory = (cat: string) => {
    setSelectedCategory(cat);
    setActiveTab('catalog');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-amber-600" /> Your Shopping Cart
              {totalItemCount > 0 && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-3 py-1 rounded-full">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Review and manage your custom prescription spectacles before checkout.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('catalog')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 rounded-xl border border-amber-200 self-start sm:self-auto transition-colors"
          >
            ← Continue Shopping Frames
          </button>
        </div>

        {/* Global Delivery Assurance Banner */}
        <div className="bg-emerald-900 text-emerald-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-emerald-300 flex items-center justify-center shrink-0 font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm">FREE Express Home Delivery</span>
              <p className="text-emerald-200">Zero shipping fees or hidden costs across all Indian pincodes.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-300 font-semibold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> 14-Day Prescription Guarantee Included
          </div>
        </div>

        {/* Error / Warning Banners */}
        {cartError && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{cartError}</div>
            <button
              onClick={() => setCartError(null)}
              className="font-bold text-amber-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {cartValidationWarnings.length > 0 && (
          <div className="p-4 bg-slate-900 text-amber-400 border border-amber-500/30 rounded-2xl space-y-1 text-xs">
            <div className="font-extrabold flex items-center gap-2 text-amber-300">
              <AlertCircle className="w-4 h-4" /> Inventory & Price Updates
            </div>
            <ul className="list-disc list-inside text-slate-300 space-y-0.5 pl-2">
              {cartValidationWarnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Cart Main Content */}
        {cart.length === 0 ? (
          /* Empty Cart View */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-16 text-center space-y-6 shadow-xs max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
              <Glasses className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Your cart is empty</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
                Find a frame that's right for you. Choose from our handcrafted prescription eyeglasses, anti-glare screen frames, and powered sunglasses.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => handleShopCategory('Eyeglasses')}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-md transition-all"
              >
                <Glasses className="w-4 h-4" /> Shop Eyeglasses
              </button>
              <button
                onClick={() => handleShopCategory('Sunglasses')}
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-md transition-all"
              >
                <Glasses className="w-4 h-4" /> Shop Sunglasses
              </button>
            </div>
          </div>
        ) : (
          /* Cart Items & Summary Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const cfg = item.configuration;
                const product = products.find((p) => p.id === cfg.productId);
                const maxStock = product ? product.stock : 10;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    {/* Top Row: Image & Frame Header */}
                    <div className="flex gap-4 sm:gap-5">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 rounded-2xl p-2 border border-slate-100 shrink-0 flex items-center justify-center">
                        <img
                          src={cfg.frameImage}
                          alt={cfg.productName}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">
                              OptiCraft Eyewear
                            </div>
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                              {cfg.productName}
                            </h3>
                          </div>
                          <div className="text-right">
                            <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                              ₹{(cfg.calculatedTotalPrice * item.quantity).toLocaleString('en-IN')}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-[10px] text-slate-500 font-medium font-mono">
                                (₹{cfg.calculatedTotalPrice.toLocaleString('en-IN')} each)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Frame Specs Pills */}
                        <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-600 pt-1">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-semibold">
                            SKU: {cfg.frameSku}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                            Color: {cfg.frameColor}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                            Size: {cfg.frameSize}
                          </span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200/60 font-bold rounded-md">
                            Frame Price: ₹{cfg.framePrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Section: Complete Lens & Coating Configuration Details */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                      <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Complete Lens Configuration Snapshot
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                        <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-500 font-medium">Lens Type:</span>
                          <span className="font-bold text-slate-900">{cfg.lensTypeName}</span>
                        </div>

                        <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-500 font-medium">Material:</span>
                          <span className="font-bold text-slate-900">{cfg.materialName || 'Standard'}</span>
                        </div>
                      </div>

                      {cfg.coatingNames && cfg.coatingNames.length > 0 && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-slate-500 font-medium block text-[11px]">Coatings Included:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {cfg.coatingNames.map((cName, cIdx) => (
                              <span
                                key={cIdx}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold text-[10px] rounded-md border border-emerald-200"
                              >
                                ✓ {cName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prescription Status & View Modal Trigger */}
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">Prescription Status:</span>
                          {cfg.requiresPrescription ? (
                            cfg.prescription ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Prescription Attached
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-[11px] rounded-full">
                                Upload Slip Pending
                              </span>
                            )
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-full">
                              Zero Power / Not Required
                            </span>
                          )}
                        </div>

                        {cfg.prescription && (
                          <button
                            onClick={() => setViewingPrescription(cfg.prescription!)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Prescription Details
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions Row: Quantity, Edit, Remove */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500">Quantity:</span>
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-2xs">
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1.5 text-slate-700 hover:bg-slate-200 font-black text-sm"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="px-4 font-extrabold text-slate-900 text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= maxStock}
                            className={`px-3 py-1.5 font-black text-sm ${
                              item.quantity >= maxStock
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-700 hover:bg-slate-200'
                            }`}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        {item.quantity >= maxStock && (
                          <span className="text-[10px] text-amber-700 font-bold">Max stock reached</span>
                        )}
                      </div>

                      {/* Edit & Delete Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openConfiguratorForEdit(item)}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 hover:text-amber-900 font-extrabold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Edit Configuration
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="px-3.5 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-extrabold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Breakdown Sidebar */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
              <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100 uppercase tracking-wider text-xs">
                PRICE DETAILS
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    ₹{cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Standard Optical Casing</span>
                  <span className="font-bold text-emerald-700 font-mono">FREE (Includes Microfiber cloth)</span>
                </div>

                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" /> Delivery
                  </span>
                  <span className="uppercase text-xs font-black">FREE</span>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">TOTAL AMOUNT</span>
                    <span className="text-[10px] text-slate-500 font-medium">Inclusive of all Indian Taxes & GST</span>
                  </div>
                  <span className="text-2xl font-black text-slate-900 font-mono text-amber-600">
                    ₹{cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onProceedToCheckout?.()}
                  disabled={cart.length === 0}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4 text-slate-950" /> Proceed to Secure Checkout
                </button>
                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-900 font-semibold text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Secure 256-Bit Encrypted Payment with Razorpay</span>
                </div>
              </div>

              {/* Security Badges */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Genuine Prescription Materials & Handcrafted Frames</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Server-validated Authoritative Prices (Tamper-proof)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
