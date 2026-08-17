/**
 * OptiCraft Eyewear - Legal, Compliance, Policy & Contact Components
 * Covers Privacy Policy, Terms & Conditions, Shipping Policy, Cancellation & Refund Policy, Contact Us
 */

import React, { useState } from 'react';
import { ShieldCheck, FileText, Truck, RotateCcw, Mail, MapPin, Phone, Clock, Award, CheckCircle } from 'lucide-react';
import { BUSINESS_CONFIG } from '../config/business';

export type LegalTab = 'privacy' | 'terms' | 'shipping' | 'returns' | 'contact';

interface LegalPagesProps {
  initialTab?: LegalTab;
  onBackToShop?: () => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ initialTab = 'privacy', onBackToShop }) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">OptiCraft Trust & Governance</h1>
            <p className="text-sm text-slate-500 mt-1">Official Legal Terms, Shipping Standards & Customer Support</p>
          </div>
          {onBackToShop && (
            <button
              onClick={onBackToShop}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Return to Shop
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'privacy' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'terms' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>

          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'shipping' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Shipping & Delivery</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'returns' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Cancellation & Refunds</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'contact' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Contact & Support</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm leading-relaxed text-slate-700">
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Privacy Policy</h2>
                <p className="text-xs text-slate-400 mt-1">Last Updated: February 2026</p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">1. Data Collection & Usage</h3>
                <p className="text-sm">
                  {BUSINESS_CONFIG.legalName} ("OptiCraft Eyewear") respects your privacy. We collect personal information
                  (name, phone number, shipping address, email address) solely for processing orders, custom prescription lens assembly,
                  and logistics fulfillment.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">2. Optical & Prescription Data Protection</h3>
                <p className="text-sm">
                  Prescription details (spherical, cylindrical power, axis, pupillary distance, and optical prescription uploads)
                  are treated as sensitive health information. This data is strictly accessed by licensed OptiCraft opticians and laboratory technicians
                  to surface-cut and fit your lenses. We never sell or share optical data with third-party advertisers.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">3. Payment Security</h3>
                <p className="text-sm">
                  All digital payment transactions are securely processed via Razorpay using 256-bit SSL encryption.
                  OptiCraft Eyewear does not store full credit/debit card numbers, UPI PINs, or net banking passwords on our servers.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">4. Your Rights</h3>
                <p className="text-sm">
                  You have the right to inspect, edit, or delete your registered account details and address book at any time
                  from your customer dashboard or by contacting support at {BUSINESS_CONFIG.email}.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Terms of Service</h2>
                <p className="text-xs text-slate-400 mt-1">Effective Date: January 1, 2026</p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">1. Accuracy of Optical Prescriptions</h3>
                <p className="text-sm">
                  Customers are responsible for providing valid, accurate, and unexpired optical prescription measurements.
                  OptiCraft Eyewear manufactures lenses strictly to the parameters provided or verified by our opticians.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">2. Order Acceptance & Custom Assembly</h3>
                <p className="text-sm">
                  Custom-cut prescription eyewear enters manufacturing immediately following optician prescription verification.
                  Once lens edging and robotic mounting begin, modifications to lens power parameters may incur material cost adjustments.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">3. Pricing & GST</h3>
                <p className="text-sm">
                  All prices displayed on OptiCraft Eyewear are inclusive of applicable Goods and Services Tax (GSTIN: {BUSINESS_CONFIG.gstin}).
                </p>
              </section>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Shipping & Delivery Policy</h2>
                <p className="text-xs text-slate-400 mt-1">Pan-India Express Logistics</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                  <Truck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-900 text-sm">Free Express Delivery</p>
                  <p className="text-xs text-slate-500 mt-1">On All Orders Across India</p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                  <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-900 text-sm">3 to 5 Business Days</p>
                  <p className="text-xs text-slate-500 mt-1">Turnaround Time</p>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-center">
                  <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-900 text-sm">Insured Transit</p>
                  <p className="text-xs text-slate-500 mt-1">Damage-Free Guarantee</p>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">1. Manufacturing & Processing Timeline</h3>
                <p className="text-sm">
                  Zero-power and frame-only orders ship within 24 hours. Custom prescription lenses (Single Vision, Progressive, Bifocal)
                  undergo robotic edging, anti-reflective coating curing, and dual optician quality audit, taking 1-2 business days before courier dispatch.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">2. Courier Partners</h3>
                <p className="text-sm">
                  We ship via premier national express couriers ({BUSINESS_CONFIG.shipping.couriers.join(', ')}). You will receive an AWB tracking link via SMS and Email as soon as your parcel is dispatched.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Cancellation, Exchange & Return Policy</h2>
                <p className="text-xs text-slate-400 mt-1">14-Day Hassle-Free Exchange Policy</p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">1. Order Cancellation</h3>
                <p className="text-sm">
                  Orders can be cancelled penalty-free from your Account Dashboard anytime before the order reaches "Manufacturing / Lab In-Progress" state.
                  Upon cancellation, a 100% refund is credited back to the original payment source within 3–5 business days.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">2. 14-Day Frame Exchange & Optical Warranty</h3>
                <p className="text-sm">
                  If the frame fit or style is not to your preference, or if you experience optical distortion due to a power manufacturing variance,
                  we offer a complimentary replacement within 14 days of delivery.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Contact OptiCraft Customer Support</h2>
                <p className="text-xs text-slate-400 mt-1">We're here to assist with frame sizing, lens choices & order updates</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Corporate Headquarters</p>
                      <p className="text-xs text-slate-600 mt-1">{BUSINESS_CONFIG.address.street}</p>
                      <p className="text-xs text-slate-600">{BUSINESS_CONFIG.address.city}, {BUSINESS_CONFIG.address.state} - {BUSINESS_CONFIG.address.pinCode}</p>
                      <p className="text-xs text-slate-500 mt-1">GSTIN: {BUSINESS_CONFIG.gstin}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <Phone className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Toll-Free Support Line</p>
                      <p className="text-xs text-slate-600 mt-0.5">{BUSINESS_CONFIG.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Email Care Team</p>
                      <p className="text-xs text-slate-600 mt-0.5">{BUSINESS_CONFIG.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/60 p-6 rounded-xl border border-indigo-100 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                      <span>OptiCraft Precision Assurance</span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-2">
                      Have a complex prescription or prism requirement? Contact our Master Optician helpdesk for direct assistance before placing your order.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-indigo-100 text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">Support Working Hours:</p>
                    <p>{BUSINESS_CONFIG.supportHours}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
