/**
 * OptiCraft Eyewear - Footer Component
 */

import React from 'react';
import {
  Glasses,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Lock,
  PhoneCall,
  Mail,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { setSelectedCategory, setActiveTab } = useApp();

  const handleNav = (cat: string) => {
    setSelectedCategory(cat);
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Free Home Delivery</h4>
              <p className="text-xs text-slate-400">Zero shipping fees across all Indian PIN codes.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Prescription Accuracy</h4>
              <p className="text-xs text-slate-400">Verified by certified opticians before dispatch.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">14-Day Free Returns</h4>
              <p className="text-xs text-slate-400">Hassle-free replacement if fit or power isn't 100% ideal.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Secure UPI & Cards</h4>
              <p className="text-xs text-slate-400">256-bit encrypted Razorpay Indian gateway integration.</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12 border-b border-slate-800">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Glasses className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">OptiCraft Eyewear</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India’s premier digital optical destination for high-precision complete spectacles. Custom lens edging, blue light filtration, and progressive optics handcrafted to your exact prescription.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold pt-2">
              <CheckCircle2 className="w-4 h-4" /> ISO 9001 Certified Optical Lab
            </div>
          </div>

          {/* Column 2: Eyewear Collections */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Popular Collections</h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => handleNav('Eyeglasses')} className="hover:text-amber-400 transition-colors">
                  Single Vision Eyeglasses
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('Blue Cut / Screen Safe')} className="hover:text-amber-400 transition-colors">
                  Blue Cut Screen Safe Lenses
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('Progressive')} className="hover:text-amber-400 transition-colors">
                  No-Line Progressive Spectacles
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('Sunglasses')} className="hover:text-amber-400 transition-colors">
                  Polarized UV Sunglasses
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('Powered Sunglasses')} className="hover:text-amber-400 transition-colors">
                  Powered Prescription Sunglasses
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Lens & Coating Tech */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Lens Technologies</h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>CR-39 Standard Organic Clarity</li>
              <li>Shatterproof Polycarbonate Lenses</li>
              <li>1.67 & 1.74 High-Index Ultra Thin</li>
              <li>Anti-Reflective Glare Shield (ARC)</li>
              <li>Superhydrophobic Dust & Rain Repellent</li>
            </ul>
          </div>

          {/* Column 4: Customer Support & Legal Policies India */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Support & Governance</h3>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <PhoneCall className="w-4 h-4 text-amber-400" /> +91 1800-123-4567 (Toll Free)
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Mail className="w-4 h-4 text-amber-400" /> support@opticraft.in
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-300 pb-2 border-b border-slate-800">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Bandra Kurla Complex, Mumbai, MH - 400051</span>
            </div>

            <ul className="space-y-2 text-xs text-slate-400 pt-1">
              <li>
                <button onClick={() => { setActiveTab('legal-privacy' as any); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-amber-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('legal-terms' as any); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-amber-400 transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('legal-shipping' as any); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-amber-400 transition-colors">
                  Shipping & Delivery Policy
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('legal-returns' as any); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-amber-400 transition-colors">
                  Cancellation & Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('legal-contact' as any); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-amber-400 transition-colors">
                  Contact & Support Center
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Payment Methods & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© 2026 OptiCraft Eyewear India Pvt Ltd. All rights reserved.</div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
              UPI (GPay / PhonePe / Paytm)
            </span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
              RuPay / Visa / MC
            </span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
              Razorpay Secured
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
