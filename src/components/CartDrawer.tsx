/**
 * OptiCraft Eyewear - Slide-over Cart Drawer Component
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Trash2,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowRight,
  Glasses,
  Edit3,
  Eye,
  CheckCircle2,
  AlertCircle,
  Lock,
  Bookmark,
  Heart,
} from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartItemQuantity,
    openConfiguratorForEdit,
    setViewingPrescription,
    cartSubtotal,
    cartError,
    setCartError,
    setActiveTab,
    savedForLater,
    saveForLater,
    moveCartItemToWishlistApi,
  } = useApp();

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleSaveForLater = async (itemId: string) => {
    setActionLoadingId(itemId);
    await saveForLater(itemId);
    setActionLoadingId(null);
  };

  const handleMoveToWishlist = async (itemId: string) => {
    setActionLoadingId(itemId);
    await moveCartItemToWishlistApi(itemId);
    setActionLoadingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl">
        {/* Cart Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-white">Your Shopping Cart</h3>
            <span className="bg-amber-400 text-slate-950 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Banner */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>FREE Home Delivery Included Across India!</span>
        </div>

        {/* Cart Error Toast inside Drawer */}
        {cartError && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{cartError}</span>
            </div>
            <button
              onClick={() => setCartError(null)}
              className="text-amber-800 font-bold hover:underline"
            >
              ×
            </button>
          </div>
        )}

        {/* Cart Items List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Glasses className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Your cart is empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Select your favorite frame and customize your prescription lenses to get started.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const cfg = item.configuration;
              return (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 relative group"
                >
                  <div className="flex gap-3">
                    <img
                      src={cfg.frameImage}
                      alt={cfg.productName}
                      className="w-16 h-16 object-contain bg-white p-2 rounded-xl border border-slate-100 shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-slate-900 text-xs line-clamp-1">{cfg.productName}</div>
                      <div className="text-[11px] text-amber-700 font-semibold">{cfg.lensTypeName}</div>
                      {cfg.materialName && (
                        <div className="text-[10px] text-slate-500">{cfg.materialName}</div>
                      )}
                      {cfg.coatingNames.length > 0 && (
                        <div className="text-[10px] text-slate-500 line-clamp-1">
                          Coatings: {cfg.coatingNames.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar for Item: Edit & View Rx */}
                  <div className="flex flex-wrap items-center justify-between gap-1 pt-1 text-[10px]">
                    {cfg.prescription ? (
                      <button
                        onClick={() => setViewingPrescription(cfg.prescription!)}
                        className="text-amber-800 font-extrabold hover:underline flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60"
                      >
                        <Eye className="w-3 h-3 text-amber-600" /> View Rx
                      </button>
                    ) : (
                      <span className="text-slate-400 font-medium">Zero Power</span>
                    )}

                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        openConfiguratorForEdit(item);
                      }}
                      className="text-slate-700 font-bold hover:text-amber-900 flex items-center gap-1 hover:underline"
                    >
                      <Edit3 className="w-3 h-3 text-amber-600" /> Edit Customisation
                    </button>
                  </div>

                  {/* Quantity & Item Subtotal */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 font-bold text-slate-900 text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-slate-900 text-sm">
                        ₹{(cfg.calculatedTotalPrice * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Secondary Actions: Save for Later, Wishlist, Remove */}
                  <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200/80 text-[10px]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveForLater(item.id)}
                        disabled={actionLoadingId === item.id}
                        className="text-amber-800 hover:text-amber-900 font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                        title="Save this item for later"
                      >
                        <Bookmark className="w-3 h-3 text-amber-600" /> Save for later
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => handleMoveToWishlist(item.id)}
                        disabled={actionLoadingId === item.id}
                        className="text-rose-700 hover:text-rose-800 font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                        title="Move to wishlist"
                      >
                        <Heart className="w-3 h-3 text-rose-500" /> Wishlist
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-600 font-bold flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Saved For Later Prompt inside Drawer */}
          {savedForLater && savedForLater.length > 0 && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between text-xs mt-2">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-amber-900 font-medium">
                  <strong>{savedForLater.length}</strong> {savedForLater.length === 1 ? 'item' : 'items'} saved for later
                </span>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setActiveTab('cart');
                }}
                className="text-[11px] font-black text-amber-800 hover:underline bg-white px-2.5 py-1 rounded-lg border border-amber-200"
              >
                View in Cart →
              </button>
            </div>
          )}
        </div>

        {/* Footer Checkout Action */}
        {cart.length > 0 && (
          <div className="p-5 bg-slate-900 text-white border-t border-slate-800 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span className="font-bold text-white">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Shipping & Delivery</span>
                <span className="font-bold">FREE DELIVERY</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                <span>Total Payable</span>
                <span className="text-amber-400 font-mono">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setActiveTab('cart');
                }}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl transition-all text-center"
              >
                View Full Cart
              </button>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout?.();
                }}
                disabled={cart.length === 0}
                className="py-3 px-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" /> Checkout
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center font-medium flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Free Delivery & Secure Payment
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
