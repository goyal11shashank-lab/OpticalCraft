/**
 * OptiCraft Eyewear - Product Detail Page Component
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SizeGuideModal } from './SizeGuideModal';
import { ShiprocketPincodeChecker } from './ShiprocketPincodeChecker';
import {
  Heart,
  SlidersHorizontal,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Ruler,
  Info,
  Sparkles,
  Maximize2,
  X,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { selectedProduct, setSelectedProduct, setActiveTab, wishlist, toggleWishlist, openConfigurator } = useApp();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      document.title = `${selectedProduct.name} - OptiCraft Eyewear India`;
    }
  }, [selectedProduct]);

  if (!selectedProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">No frame selected.</p>
        <button
          onClick={() => setActiveTab('catalog')}
          className="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(selectedProduct.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => setActiveTab('catalog')}
        className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </button>

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Gallery Column */}
        <div className="space-y-4">
          <div className="relative bg-slate-50 rounded-3xl border border-slate-200/80 p-8 aspect-[4/3] flex items-center justify-center overflow-hidden group">
            <span className="absolute top-4 left-4 bg-slate-900 text-amber-400 font-bold text-xs px-3 py-1 rounded-full shadow-xs">
              {selectedProduct.discountPercentage}% OFF
            </span>

            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="w-10 h-10 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all shadow-xs"
                title="Zoom Image"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => toggleWishlist(selectedProduct.id)}
                className="w-10 h-10 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-rose-500 transition-all shadow-xs"
                title="Wishlist Frame"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            <img
              src={selectedProduct.images[selectedImageIndex] || selectedProduct.images[0]}
              alt={selectedProduct.name}
              className="w-full h-full object-contain cursor-zoom-in group-hover:scale-105 transition-transform duration-300"
              onClick={() => setIsLightboxOpen(true)}
            />
          </div>

          {/* Thumbnail Strip */}
          {selectedProduct.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {selectedProduct.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl bg-slate-50 border-2 overflow-hidden shrink-0 transition-all ${
                    selectedImageIndex === idx ? 'border-amber-500 scale-95' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Frame Dimension Spec Card */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Ruler className="w-4 h-4 text-amber-600" /> Precise Frame Dimensions
              </h4>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
              >
                Size Guide
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-white p-3 rounded-2xl border border-slate-100">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Frame Width</div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedProduct.frame.frameWidthMm} mm</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Bridge Width</div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedProduct.frame.bridgeWidthMm} mm</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Temple Length</div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedProduct.frame.templeLengthMm} mm</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Details Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{selectedProduct.brand}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-400 font-medium">SKU: {selectedProduct.sku}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                In Stock ({selectedProduct.stock} left)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{selectedProduct.name}</h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{selectedProduct.description}</p>
          </div>

          {/* Price Box */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 flex items-baseline gap-4">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase">Frame Base Price</div>
              <div className="text-3xl font-black text-slate-900">₹{selectedProduct.price.toLocaleString('en-IN')}</div>
            </div>
            <div className="text-sm text-slate-400 line-through">₹{selectedProduct.originalPrice.toLocaleString('en-IN')}</div>
            <div className="ml-auto text-right">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Includes Free Standard Lens
              </span>
            </div>
          </div>

          {/* Frame Specifications Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Frame Specifications</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex justify-between">
                <span className="text-slate-500">Shape</span>
                <span className="font-bold text-slate-900">{selectedProduct.frame.shape}</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex justify-between">
                <span className="text-slate-500">Size</span>
                <span className="font-bold text-slate-900">{selectedProduct.frame.size}</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex justify-between">
                <span className="text-slate-500">Color</span>
                <span className="font-bold text-slate-900">{selectedProduct.frame.color}</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex justify-between">
                <span className="text-slate-500">Material</span>
                <span className="font-bold text-slate-900">{selectedProduct.frame.material}</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex justify-between">
                <span className="text-slate-500">Rim Type</span>
                <span className="font-bold text-slate-900">{selectedProduct.frame.rimType}</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex justify-between">
                <span className="text-slate-500">Ideal For</span>
                <span className="font-bold text-slate-900">{selectedProduct.frame.gender}</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => openConfigurator(selectedProduct)}
              className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-5 h-5 text-amber-400" />
              Select Lens & Customise Glasses →
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Configure power (single vision / progressive), screen safe blue cut & coatings in step 2.
            </p>
          </div>

          {/* Shiprocket Live Pincode Serviceability & Courier Checker */}
          <ShiprocketPincodeChecker productId={selectedProduct.id} />

          {/* Delivery & Warranty Guarantees */}
          <div className="border-t border-slate-200 pt-6 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Truck className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Free Delivery</strong> across all Indian PIN codes (3-5 business days).</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>14-Day Prescription Guarantee</strong> with zero replacement charges.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedProduct.images[selectedImageIndex] || selectedProduct.images[0]}
            alt={selectedProduct.name}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
          />
        </div>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </div>
  );
};
