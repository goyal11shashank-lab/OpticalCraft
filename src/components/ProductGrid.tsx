/**
 * OptiCraft Eyewear - Product Catalog Grid with Multi-Filter, Quick View & Size Guide
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { QuickViewModal } from './QuickViewModal';
import { SizeGuideModal } from './SizeGuideModal';
import { Product } from '../types';
import { SlidersHorizontal, Search, RefreshCw, X, ChevronDown, Filter, Ruler, Sparkles, Eye, Check } from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const {
    products,
    loadingProducts,
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
  } = useApp();

  // Additional Filter States
  const [brandFilter, setBrandFilter] = useState<string>('All');
  const [rimFilter, setRimFilter] = useState<string>('All');
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('All');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Modal States
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Sync URL search parameters on load/change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('category');
    const shapeParam = params.get('shape');
    const genderParam = params.get('gender');
    const sortParam = params.get('sort');

    if (catParam) setSelectedCategory(catParam);
    if (shapeParam) setShapeFilter(shapeParam);
    if (genderParam) setGenderFilter(genderParam);
    if (sortParam) setSortOption(sortParam);
  }, []);

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
    if (shapeFilter && shapeFilter !== 'All') params.set('shape', shapeFilter);
    if (genderFilter && genderFilter !== 'All') params.set('gender', genderFilter);
    if (sortOption && sortOption !== 'recommended') params.set('sort', sortOption);

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedCategory, shapeFilter, genderFilter, sortOption]);

  // Distinct Brands & Rims for Filter Menus
  const brands = ['All', ...Array.from(new Set(products.map((p) => p.brand)))];
  const shapes = ['All', 'Square', 'Round', 'Rectangle', 'Cat Eye', 'Aviator', 'Wayfarer'];
  const genders = ['All', 'Men', 'Women', 'Unisex'];
  const rimTypes = ['All', 'Full Rim', 'Half Rim', 'Rimless'];

  // Filter Logic
  let filtered = products.filter((p) => p.active);

  if (selectedCategory && selectedCategory !== 'All') {
    filtered = filtered.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
  }

  if (genderFilter && genderFilter !== 'All') {
    filtered = filtered.filter(
      (p) => p.frame.gender.toLowerCase() === genderFilter.toLowerCase() || p.frame.gender === 'Unisex'
    );
  }

  if (shapeFilter && shapeFilter !== 'All') {
    filtered = filtered.filter((p) => p.frame.shape.toLowerCase() === shapeFilter.toLowerCase());
  }

  if (brandFilter && brandFilter !== 'All') {
    filtered = filtered.filter((p) => p.brand.toLowerCase() === brandFilter.toLowerCase());
  }

  if (rimFilter && rimFilter !== 'All') {
    filtered = filtered.filter((p) => p.frame.rimType.toLowerCase() === rimFilter.toLowerCase());
  }

  if (priceRangeFilter === 'under-2000') {
    filtered = filtered.filter((p) => p.price < 2000);
  } else if (priceRangeFilter === '2000-4000') {
    filtered = filtered.filter((p) => p.price >= 2000 && p.price <= 4000);
  } else if (priceRangeFilter === 'above-4000') {
    filtered = filtered.filter((p) => p.price > 4000);
  }

  if (inStockOnly) {
    filtered = filtered.filter((p) => p.stock > 0);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.frame.color.toLowerCase().includes(q) ||
        p.frame.material.toLowerCase().includes(q) ||
        p.frame.shape.toLowerCase().includes(q)
    );
  }

  // Sort Logic
  if (sortOption === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortOption === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortOption === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortOption === 'popular') {
    filtered.sort((a, b) => b.discountPercentage - a.discountPercentage);
  }

  const resetFilters = () => {
    setSelectedCategory('All');
    setGenderFilter('All');
    setShapeFilter('All');
    setBrandFilter('All');
    setRimFilter('All');
    setPriceRangeFilter('All');
    setInStockOnly(false);
    setSearchQuery('');
    setSortOption('recommended');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 relative z-10 max-w-xl">
          <span className="text-amber-400 font-bold text-xs uppercase tracking-widest px-3 py-1 bg-amber-400/10 rounded-full border border-amber-400/20">
            OptiCraft Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {selectedCategory === 'All' ? 'Complete Spectacles & Frames' : selectedCategory}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Select any frame to unlock our dynamic lens configuration engine — single vision, progressive, screen safe blue cut, or prescription sunglasses.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setIsSizeGuideOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Ruler className="w-4 h-4" /> Size Guide
          </button>
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xs"
          >
            <Filter className="w-4 h-4" /> Filters ({filtered.length})
          </button>
          <div className="hidden md:block text-right">
            <div className="text-2xl font-black text-amber-400">{filtered.length}</div>
            <div className="text-xs text-slate-400 font-medium">Frames Available</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs h-fit sticky top-24">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" /> Filter Frames
            </h3>
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-amber-600 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gender</label>
            <div className="grid grid-cols-2 gap-1.5">
              {genders.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenderFilter(g)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                    genderFilter === g
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Frame Shape Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Frame Shape</label>
            <div className="flex flex-wrap gap-1.5">
              {shapes.map((s) => (
                <button
                  key={s}
                  onClick={() => setShapeFilter(s)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all border ${
                    shapeFilter === s
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Brand</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800"
            >
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Rim Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rim Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {rimTypes.map((r) => (
                <button
                  key={r}
                  onClick={() => setRimFilter(r)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border ${
                    rimFilter === r ? 'bg-slate-900 text-amber-400 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Price Range</label>
            <div className="space-y-1 text-xs">
              {[
                { id: 'All', label: 'All Prices' },
                { id: 'under-2000', label: 'Under ₹2,000' },
                { id: '2000-4000', label: '₹2,000 - ₹4,000' },
                { id: 'above-4000', label: 'Above ₹4,000' },
              ].map((pr) => (
                <button
                  key={pr.id}
                  onClick={() => setPriceRangeFilter(pr.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg font-semibold flex items-center justify-between ${
                    priceRangeFilter === pr.id ? 'bg-amber-100 text-amber-950 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{pr.label}</span>
                  {priceRangeFilter === pr.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Availability Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              In Stock Frames Only
            </label>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Top Sort & Search Bar Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search in filtered results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sort By:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="recommended">Recommended</option>
                <option value="popular">Most Popular / Highest Discount</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
              </select>
            </div>
          </div>

          {/* Active Filter Badges */}
          {(selectedCategory !== 'All' ||
            genderFilter !== 'All' ||
            shapeFilter !== 'All' ||
            brandFilter !== 'All' ||
            rimFilter !== 'All' ||
            priceRangeFilter !== 'All' ||
            inStockOnly ||
            searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Active Filters:</span>
              {selectedCategory !== 'All' && (
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold flex items-center gap-1">
                  Cat: {selectedCategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('All')} />
                </span>
              )}
              {genderFilter !== 'All' && (
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold flex items-center gap-1">
                  Gender: {genderFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setGenderFilter('All')} />
                </span>
              )}
              {shapeFilter !== 'All' && (
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold flex items-center gap-1">
                  Shape: {shapeFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setShapeFilter('All')} />
                </span>
              )}
              {brandFilter !== 'All' && (
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold flex items-center gap-1">
                  Brand: {brandFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setBrandFilter('All')} />
                </span>
              )}
              {rimFilter !== 'All' && (
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold flex items-center gap-1">
                  Rim: {rimFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setRimFilter('All')} />
                </span>
              )}
              {priceRangeFilter !== 'All' && (
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold flex items-center gap-1">
                  Price: {priceRangeFilter === 'under-2000' ? '< ₹2k' : priceRangeFilter === '2000-4000' ? '₹2k-₹4k' : '> ₹4k'}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRangeFilter('All')} />
                </span>
              )}
              {inStockOnly && (
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold flex items-center gap-1">
                  In Stock Only
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setInStockOnly(false)} />
                </span>
              )}
              {searchQuery && (
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-semibold flex items-center gap-1">
                  Search: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </span>
              )}
              <button onClick={resetFilters} className="text-amber-600 hover:underline font-bold text-xs ml-2">
                Clear All
              </button>
            </div>
          )}

          {/* Grid Loading or Product Cards */}
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-slate-100 rounded-3xl h-80 animate-pulse"></div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
                👓
              </div>
              <h3 className="text-lg font-bold text-slate-900">No frames match your filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try resetting your filters or search keywords to view our full collection of eyeglasses & sunglasses.
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-sm hover:bg-slate-800 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Filter */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xs h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-slate-900 text-sm">Filter Eyewear</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Category Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Category</label>
              <div className="space-y-1">
                {['All', 'Eyeglasses', 'Sunglasses', 'Progressive', 'Blue Cut / Screen Safe', 'Powered Sunglasses'].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                        selectedCategory === cat ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Mobile Gender */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Gender</label>
              <div className="grid grid-cols-2 gap-1.5">
                {genders.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold ${
                      genderFilter === g ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Frame Shape */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Frame Shape</label>
              <div className="flex flex-wrap gap-1.5">
                {shapes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setShapeFilter(s)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold ${
                      shapeFilter === s ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Rim Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Rim Type</label>
              <div className="grid grid-cols-2 gap-1.5">
                {rimTypes.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRimFilter(r)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold ${
                      rimFilter === r ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Brand */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Brand</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-sm"
            >
              Apply Filters ({filtered.length})
            </button>
          </div>
        </div>
      )}

      {/* Global Modals triggered from Catalog Grid */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
      />

      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </div>
  );
};
