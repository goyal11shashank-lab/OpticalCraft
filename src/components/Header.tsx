/**
 * OptiCraft Eyewear - Main Header & Navigation Bar
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Glasses,
  Search,
  ShoppingBag,
  Heart,
  User,
  ShieldCheck,
  Truck,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Lock,
  Menu,
  X,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    cart,
    wishlist,
    setIsCartOpen,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    currentUser,
    isAdmin,
    setIsAdmin,
    setIsAuthModalOpen,
  } = useApp();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const categories = [
    { id: 'All', label: 'All Frames' },
    { id: 'Eyeglasses', label: 'Eyeglasses' },
    { id: 'Sunglasses', label: 'Sunglasses' },
    { id: 'Progressive', label: 'Progressive' },
    { id: 'Blue Cut / Screen Safe', label: 'Blue Cut / Screen Safe' },
    { id: 'Powered Sunglasses', label: 'Powered Sun' },
  ];

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    if (activeTab !== 'catalog') {
      setActiveTab('catalog');
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-xs">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-slate-100 text-xs py-2 px-4 flex flex-wrap justify-between items-center tracking-wide font-medium">
        <div className="flex items-center gap-4 mx-auto md:mx-0">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Truck className="w-3.5 h-3.5" /> FREE HOME DELIVERY ON ALL INDIAN ORDERS
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 14-DAY PRESCRIPTION ACCURACY GUARANTEE
          </span>
        </div>
        
        <div className="flex items-center gap-3 mx-auto md:mx-0 mt-1 md:mt-0">
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
              isAdmin
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {isAdmin ? '👑 Admin View Active' : 'Switch to Admin'}
          </button>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">INR (₹)</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <button
          onClick={() => {
            setActiveTab('home');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Glasses className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1">
              OptiCraft <span className="text-amber-600 font-medium text-xs uppercase px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded">India</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
              Precision Eyewear & Lenses
            </div>
          </div>
        </button>

        {/* Global Search Bar (Desktop) */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search frames by shape, SKU, color or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Search Dropdown Preview */}
          {isSearchFocused && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50">
              <div className="text-xs font-semibold text-slate-400 uppercase px-2 mb-2">Search Results</div>
              <button
                onClick={() => {
                  setActiveTab('catalog');
                  setIsSearchFocused(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
              >
                <span>View all results for "{searchQuery}"</span>
                <span className="text-xs text-amber-600 font-semibold">Browse Catalog →</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Admin Dashboard Quick Link */}
          {isAdmin && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}

          {/* Account Profile button */}
          <button
            onClick={() => {
              setActiveTab('account');
              setIsMobileMenuOpen(false);
            }}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              activeTab === 'account'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">{currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}</span>
          </button>

          {/* Wishlist Button */}
          <button
            onClick={() => {
              setActiveTab('account');
              setIsMobileMenuOpen(false);
            }}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 relative transition-all"
            title="View Wishlist"
          >
            <Heart className="w-4 h-4 text-slate-600" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all relative"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Cart</span>
            {totalCartCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded-full text-[11px]">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Expansion */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-slate-100 pt-2 bg-slate-50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search frames by shape, SKU, color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setActiveTab('catalog');
                  setIsMobileSearchOpen(false);
                }
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      )}

      {/* Desktop Category Navigation Bar */}
      <nav className="bg-slate-50 border-t border-slate-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id && activeTab === 'catalog';
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-amber-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Navigation Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 text-white border-t border-slate-800 p-4 space-y-4 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider px-2">Browse Eyewear Categories</div>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`p-3 rounded-2xl text-xs font-bold text-left transition-all ${
                  selectedCategory === cat.id && activeTab === 'catalog'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('account');
                setIsMobileMenuOpen(false);
              }}
              className="text-slate-300 hover:text-white flex items-center gap-2"
            >
              <User className="w-4 h-4 text-amber-400" /> Account & Prescriptions
            </button>
            <button
              onClick={() => {
                setActiveTab('account');
                setIsMobileMenuOpen(false);
              }}
              className="text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <Heart className="w-4 h-4 text-rose-400" /> Wishlist ({wishlist.length})
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

