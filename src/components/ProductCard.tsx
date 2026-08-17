/**
 * OptiCraft Eyewear - Product Card Component
 */

import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, Sparkles, SlidersHorizontal, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { wishlist, toggleWishlist, openConfigurator, setSelectedProduct, setActiveTab } = useApp();
  const isWishlisted = wishlist.includes(product.id);

  const handleCardClick = () => {
    setSelectedProduct(product);
    setActiveTab('product-detail');
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    } else {
      handleCardClick();
    }
  };

  return (
    <div className="group bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Top Image Box */}
        <div className="relative bg-slate-50 p-6 aspect-[4/3] flex items-center justify-center overflow-hidden cursor-pointer" onClick={handleCardClick}>
          {/* Discount Tag */}
          <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5">
            <span className="bg-slate-900 text-amber-400 font-bold text-[11px] px-2.5 py-1 rounded-full shadow-xs">
              {product.discountPercentage}% OFF
            </span>
            {product.category === 'Blue Cut / Screen Safe' && (
              <span className="bg-sky-100 text-sky-800 font-semibold text-[10px] px-2 py-0.5 rounded-full border border-sky-200">
                Screen Safe
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 flex items-center justify-center text-slate-600 hover:text-rose-500 hover:scale-110 transition-all shadow-xs"
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Main Frame Image */}
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Quick View Hover Badge */}
          <button
            onClick={handleQuickViewClick}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 hover:bg-slate-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" /> Quick View Specs
          </button>
        </div>

        {/* Content Box */}
        <div className="p-5 space-y-3">
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{product.brand}</span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
              {product.frame.gender}
            </span>
          </div>

          {/* Product Title */}
          <h3
            onClick={handleCardClick}
            className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-amber-600 transition-colors cursor-pointer"
          >
            {product.name}
          </h3>

          {/* Frame Spec Pill Details */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
            <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-medium">
              {product.frame.shape}
            </span>
            <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-medium">
              {product.frame.material}
            </span>
            <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-medium">
              {product.frame.color}
            </span>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-bold text-slate-900">₹{product.price.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-400 line-through font-medium">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold ml-auto">
              Frame + Free Standard Lens
            </span>
          </div>
        </div>
      </div>

      {/* Action Button: Open Lens Customizer */}
      <div className="p-5 pt-0">
        <button
          onClick={() => openConfigurator(product)}
          className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all group-hover:bg-amber-500 group-hover:text-slate-950"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> Choose Lens & Customise
        </button>
      </div>
    </div>
  );
};
