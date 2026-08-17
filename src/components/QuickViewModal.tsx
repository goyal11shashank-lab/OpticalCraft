/**
 * OptiCraft Eyewear - Quick View Modal Component
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { X, Heart, SlidersHorizontal, Eye, Ruler, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSizeGuide: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onOpenSizeGuide,
}) => {
  const { wishlist, toggleWishlist, openConfigurator, setSelectedProduct, setActiveTab } = useApp();
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  if (!isOpen || !product) return null;

  const isWishlisted = wishlist.includes(product.id);

  const handleFullDetailClick = () => {
    setSelectedProduct(product);
    setActiveTab('product-detail');
    onClose();
  };

  const handleStartCustomizer = () => {
    onClose();
    openConfigurator(product);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-y-auto max-h-[92vh] my-auto relative animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Left: Image Preview */}
          <div className="space-y-3">
            <div className="relative bg-slate-50 rounded-2xl border border-slate-200/80 p-6 aspect-[4/3] flex items-center justify-center overflow-hidden">
              <span className="absolute top-3 left-3 bg-slate-900 text-amber-400 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                {product.discountPercentage}% OFF
              </span>
              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-rose-500 shadow-xs"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

              <img
                src={product.images[activeImgIdx] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-2 justify-center">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIdx(idx)}
                    className={`w-14 h-14 rounded-xl border bg-slate-50 overflow-hidden transition-all ${
                      activeImgIdx === idx ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Quick Spec Overview */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{product.brand}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    product.stock > 10
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : product.stock > 0
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Low Stock (${product.stock})` : 'Out of Stock'}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{product.name}</h3>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-xl font-bold text-slate-900">₹{product.price.toLocaleString('en-IN')}</span>
                <span className="text-xs text-slate-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
            </div>

            {/* Specifications Summary Grid */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Shape / Rim:</span>
                <span className="font-semibold text-slate-900">{product.frame.shape} ({product.frame.rimType})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Material & Color:</span>
                <span className="font-semibold text-slate-900">{product.frame.material} • {product.frame.color}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Width / Bridge / Temple:</span>
                <span className="font-semibold text-slate-900">
                  {product.frame.frameWidthMm} / {product.frame.bridgeWidthMm} / {product.frame.templeLengthMm} mm
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleStartCustomizer}
                disabled={product.stock === 0}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {product.stock === 0 ? 'Out of Stock' : 'Choose Lens & Customise'}
              </button>

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleFullDetailClick}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all text-center"
                >
                  View Full Product Details →
                </button>
                <button
                  onClick={onOpenSizeGuide}
                  className="py-2 px-3 text-amber-600 hover:bg-amber-50 font-semibold text-xs rounded-xl flex items-center gap-1 border border-amber-200 transition-all"
                >
                  <Ruler className="w-3.5 h-3.5" /> Size Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
