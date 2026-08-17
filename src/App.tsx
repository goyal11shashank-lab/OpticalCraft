/**
 * OptiCraft Eyewear - Main Application Entry Point
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Homepage } from './components/Homepage';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailPage } from './components/ProductDetailPage';
import { LensConfiguratorModal } from './components/LensConfiguratorModal';
import { CartDrawer } from './components/CartDrawer';
import { CartPage } from './components/CartPage';
import { PrescriptionModal } from './components/PrescriptionModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { UserAccountModal } from './components/UserAccountModal';
import { AdminDashboard } from './components/AdminDashboard';
import { LegalPages, LegalTab } from './components/LegalPages';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, selectedProduct } = useApp();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Smooth scroll to top whenever the active tab or product view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, selectedProduct]);

  const isLegalTab = activeTab.startsWith('legal');
  const legalSubTab: LegalTab = isLegalTab ? (activeTab.replace('legal-', '') as LegalTab) : 'privacy';

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-between selection:bg-amber-200 selection:text-slate-900">
      <div>
        <Header />

        <main>
          {activeTab === 'home' && <Homepage />}
          {activeTab === 'catalog' && <ProductGrid />}
          {activeTab === 'product-detail' && <ProductDetailPage />}
          {activeTab === 'cart' && <CartPage onProceedToCheckout={() => setIsCheckoutOpen(true)} />}
          {activeTab === 'account' && <UserAccountModal />}
          {activeTab === 'admin' && <AdminDashboard />}
          {isLegalTab && <LegalPages initialTab={legalSubTab} onBackToShop={() => setActiveTab('catalog')} />}
        </main>
      </div>

      <Footer />

      {/* Global Modals & Overlay Components */}
      <LensConfiguratorModal />
      <PrescriptionModal />
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <OrderSuccessModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
