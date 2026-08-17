/**
 * OptiCraft Eyewear - Homepage Experience Component
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import {
  Glasses,
  SlidersHorizontal,
  Truck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MonitorCheck,
  CheckCircle2,
  Award,
  Zap,
} from 'lucide-react';

export const Homepage: React.FC = () => {
  const { products, setSelectedCategory, setActiveTab, openConfigurator } = useApp();

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);

  const handleShopClick = (category: string) => {
    setSelectedCategory(category);
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-slate-950 text-white pt-12 pb-20 overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/30 opacity-90"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> India’s Premier Online Eyewear Experience
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Eyewear Designed <span className="text-amber-400">for You</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Choose your frame. Customize your lenses. Add your prescription. Get your glasses delivered.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => handleShopClick('Eyeglasses')}
                className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                Shop Eyeglasses <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleShopClick('Sunglasses')}
                className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
              >
                Shop Sunglasses
              </button>
            </div>

            {/* Quick Guarantees Row */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-center lg:text-left text-xs">
              <div>
                <div className="font-extrabold text-white text-sm">FREE</div>
                <div className="text-slate-400 text-[11px]">Home Delivery India</div>
              </div>
              <div>
                <div className="font-extrabold text-amber-400 text-sm">100%</div>
                <div className="text-slate-400 text-[11px]">Prescription Accuracy</div>
              </div>
              <div>
                <div className="font-extrabold text-white text-sm">14-Day</div>
                <div className="text-slate-400 text-[11px]">Hassle-Free Returns</div>
              </div>
            </div>
          </div>

          {/* Hero Image Showcase */}
          <div className="relative">
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
              <span className="absolute top-4 right-4 bg-amber-400 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Featured Spec
              </span>
              <img
                src="https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=800"
                alt="OptiCraft Eyewear"
                className="w-full h-72 sm:h-80 object-contain group-hover:scale-105 transition-transform duration-500"
              />
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm">Fern Classic Square Frame</div>
                  <div className="text-xs text-amber-400 font-semibold">From ₹1,499 (Frame + Standard Lens)</div>
                </div>
                <button
                  onClick={() => openConfigurator(products[0])}
                  className="px-3.5 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
                >
                  Customise →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Collections</span>
          <h2 className="text-2xl font-extrabold text-slate-900">Browse Eyewear Categories</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => handleShopClick('Eyeglasses')}
            className="p-6 bg-slate-50 hover:bg-amber-50 rounded-3xl border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer text-center space-y-3 group"
          >
            <div className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-xs group-hover:bg-slate-900 group-hover:text-amber-400 transition-colors">
              <Glasses className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Eyeglasses</h3>
            <p className="text-[11px] text-slate-500">Single Vision & Reading</p>
          </div>

          <div
            onClick={() => handleShopClick('Sunglasses')}
            className="p-6 bg-slate-50 hover:bg-amber-50 rounded-3xl border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer text-center space-y-3 group"
          >
            <div className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-xs group-hover:bg-slate-900 group-hover:text-amber-400 transition-colors">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Sunglasses</h3>
            <p className="text-[11px] text-slate-500">100% UV Protection</p>
          </div>

          <div
            onClick={() => handleShopClick('Progressive')}
            className="p-6 bg-slate-50 hover:bg-amber-50 rounded-3xl border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer text-center space-y-3 group"
          >
            <div className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-xs group-hover:bg-slate-900 group-hover:text-amber-400 transition-colors">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Progressive</h3>
            <p className="text-[11px] text-slate-500">No-Line Multi-focal Lenses</p>
          </div>

          <div
            onClick={() => handleShopClick('Blue Cut / Screen Safe')}
            className="p-6 bg-slate-50 hover:bg-amber-50 rounded-3xl border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer text-center space-y-3 group"
          >
            <div className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-xs group-hover:bg-slate-900 group-hover:text-amber-400 transition-colors">
              <MonitorCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Blue Cut / Screen Safe</h3>
            <p className="text-[11px] text-slate-500">Digital Screen Protection</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Simple 4-Step Process</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How Buying Glasses Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center">1</span>
              <h3 className="font-bold text-white text-base">Choose Frame</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse our curated selection of square, round, aviator, and cat-eye frames in acetate, titanium, or TR90.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center">2</span>
              <h3 className="font-bold text-white text-base">Select Lens</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pick Single Vision, Progressive, or Screen Safe Blue Cut with custom CR-39, Polycarbonate, or High Index materials.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center">3</span>
              <h3 className="font-bold text-white text-base">Add Prescription</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your SPH, CYL, Axis, and PD values manually or upload your optician slip photo/PDF.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center">4</span>
              <h3 className="font-bold text-white text-base">Free Delivery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pay securely via UPI or Card and get your precision-edged spectacles delivered to your home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Trending Frames</span>
            <h2 className="text-2xl font-extrabold text-slate-900">Featured Spectacles</h2>
          </div>
          <button
            onClick={() => handleShopClick('All')}
            className="text-xs font-bold text-slate-900 hover:text-amber-600 transition-colors flex items-center gap-1"
          >
            View All Catalog →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
};
