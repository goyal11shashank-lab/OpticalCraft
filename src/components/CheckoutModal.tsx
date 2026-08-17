/**
 * OptiCraft Eyewear - Checkout & Indian Payment Gateway Modal
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Address } from '../types';
import { lookupIndianPincode, isValidIndianPincodeFormat, IndianPincodeResult } from '../utils/indianPincode';
import { RazorpayModal, RazorpayModalData } from './RazorpayModal';
import {
  X,
  CreditCard,
  QrCode,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const {
    cart,
    cartSubtotal,
    userAddresses,
    addAddressApi,
    createCheckoutSessionApi,
    createRazorpayOrderApi,
    verifyRazorpayPaymentApi,
    currentUser,
  } = useApp();

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    userAddresses[0]?.id || 'new'
  );

  // Address inputs if adding new
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    houseFlat: '',
    streetLocality: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560038',
  });

  // Indian Pincode Auto-fetch State
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeMessage, setPincodeMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [pincodeDetails, setPincodeDetails] = useState<IndianPincodeResult | null>(null);

  // Auto-fetch Indian PIN Code details
  const handlePincodeChange = async (rawPin: string) => {
    const pin = rawPin.replace(/\D/g, '').slice(0, 6);
    setNewAddress((prev) => ({ ...prev, pinCode: pin }));
    setPincodeDetails(null);

    if (pin.length < 6) {
      setPincodeMessage(null);
      return;
    }

    if (!isValidIndianPincodeFormat(pin)) {
      setPincodeMessage({
        type: 'error',
        text: 'Invalid Indian PIN code (Must be 6 digits starting between 1-8).',
      });
      return;
    }

    setIsPincodeLoading(true);
    setPincodeMessage({ type: 'info', text: 'Fetching Indian Postal details...' });

    try {
      const result = await lookupIndianPincode(pin);
      if (result) {
        setNewAddress((prev) => ({
          ...prev,
          city: result.city,
          state: result.state,
        }));
        setPincodeDetails(result);
        setPincodeMessage({
          type: 'success',
          text: `Auto-fetched: ${result.city}, ${result.state}`,
        });
      } else {
        setPincodeMessage({
          type: 'error',
          text: 'Could not auto-fetch city. You can enter it manually below.',
        });
      }
    } catch (e) {
      setPincodeMessage({
        type: 'error',
        text: 'Error auto-fetching pincode. You can enter city manually.',
      });
    } finally {
      setIsPincodeLoading(false);
    }
  };

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Credit Card' | 'Debit Card'>('UPI');
  const [upiVpa, setUpiVpa] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);

  // Razorpay Gateway Modal State
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState<boolean>(false);
  const [razorpayModalData, setRazorpayModalData] = useState<RazorpayModalData | null>(null);

  if (!isOpen) return null;

  const currentSelectedAddress =
    userAddresses.find((a) => a.id === selectedAddressId) || (newAddress as Address);

  const handlePlaceOrder = async () => {
    try {
      setIsProcessingPayment(true);
      setErrorMessage(null);
      setPaymentStatusMessage('Validating delivery address & preparing order...');

      // Validate Address
      let finalAddress = currentSelectedAddress;
      if (selectedAddressId === 'new') {
        if (!newAddress.houseFlat || !newAddress.streetLocality || !newAddress.pinCode) {
          setErrorMessage('Please fill in house/flat, street locality, and PIN code.');
          setIsProcessingPayment(false);
          return;
        }
        const addrRes = await addAddressApi(newAddress);
        if (addrRes.success && addrRes.address) {
          finalAddress = addrRes.address;
        }
      }

      // Step 1: Create Checkout Session
      setPaymentStatusMessage('Creating secure checkout session...');
      const sessionRes = await createCheckoutSessionApi({
        customerInfo: {
          name: finalAddress.name || currentUser?.name || 'Customer',
          email: currentUser?.email || 'customer@opticraft.in',
          phone: finalAddress.phone || currentUser?.phone || '9876543210',
        },
        deliveryAddress: finalAddress,
        prescriptionConsent: true,
        termsConsent: true,
      });

      if (!sessionRes.success || !sessionRes.session) {
        setErrorMessage(sessionRes.error || 'Failed to create checkout session.');
        setIsProcessingPayment(false);
        return;
      }

      const checkoutSessionId = sessionRes.session.id;

      // Step 2: Create Razorpay Order
      setPaymentStatusMessage('Generating Razorpay payment order...');
      const rzpOrderRes = await createRazorpayOrderApi(checkoutSessionId);

      if (!rzpOrderRes.success || !rzpOrderRes.razorpayOrderId) {
        setErrorMessage(rzpOrderRes.error || 'Failed to generate Razorpay payment order.');
        setIsProcessingPayment(false);
        return;
      }

      const { razorpayOrderId, keyId, amountInPaise, currency } = rzpOrderRes;

      // Step 3: Redirect to / Open Razorpay Payment Modal
      setPaymentStatusMessage('Redirecting to Razorpay Payment Modal...');
      
      setRazorpayModalData({
        checkoutSessionId,
        razorpayOrderId,
        keyId,
        amountInINR: sessionRes.session.totalAmount,
        amountInPaise,
        currency: currency || 'INR',
        customerName: finalAddress.name || currentUser?.name || 'Customer',
        customerEmail: currentUser?.email || 'customer@opticraft.in',
        customerPhone: finalAddress.phone || currentUser?.phone || '9876543210',
      });
      setIsRazorpayModalOpen(true);
      setIsProcessingPayment(false);

      // Attempt native Razorpay popup if SDK initialized and valid
      if (typeof window !== 'undefined' && (window as any).Razorpay && keyId && !keyId.startsWith('rzp_test_opticraft_demo')) {
        try {
          const options = {
            key: keyId,
            amount: amountInPaise,
            currency: currency || 'INR',
            name: 'OptiCraft Eyewear',
            description: 'Custom Optical Frames & Precision Lenses',
            order_id: razorpayOrderId,
            prefill: {
              name: finalAddress.name || currentUser?.name || 'Customer',
              email: currentUser?.email || 'customer@opticraft.in',
              contact: finalAddress.phone || currentUser?.phone || '9876543210',
            },
            theme: { color: '#0c2340' },
            handler: async (response: any) => {
              await handleRazorpaySuccess({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentMethod: 'Razorpay Standard',
              });
            },
            modal: {
              ondismiss: () => {
                handleRazorpayFailure('Payment Cancelled. Your items remain safe in your cart.');
              },
            },
          };
          const rzpInstance = new (window as any).Razorpay(options);
          rzpInstance.open();
        } catch (e) {
          // Fall back to interactive RazorpayModal overlay
        }
      }
    } catch (err: any) {
      setIsProcessingPayment(false);
      setErrorMessage(err.message || 'Payment processing failed. Your cart remains intact.');
    }
  };

  const handleRazorpaySuccess = async (response: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    paymentMethod: string;
  }) => {
    if (!razorpayModalData) return;

    setPaymentStatusMessage('Verifying cryptographic signature server-side...');
    const verifyRes = await verifyRazorpayPaymentApi({
      checkoutSessionId: razorpayModalData.checkoutSessionId,
      razorpayOrderId: response.razorpayOrderId,
      razorpayPaymentId: response.razorpayPaymentId,
      razorpaySignature: response.razorpaySignature,
      paymentMethod: response.paymentMethod,
    });

    if (verifyRes.success) {
      setIsRazorpayModalOpen(false);
      setRazorpayModalData(null);
      onClose();
    } else {
      setIsRazorpayModalOpen(false);
      setErrorMessage(
        verifyRes.error || 'Payment signature verification failed. Your items remain safe in your cart.'
      );
    }
  };

  const handleRazorpayFailure = (errorMsg: string) => {
    setIsRazorpayModalOpen(false);
    setErrorMessage(errorMsg || 'Payment not completed. Your items remain safe in cart.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-bold flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">OptiCraft Secure Checkout</h3>
              <p className="text-xs text-amber-400 font-medium">Free Delivery Across All PIN Codes in India</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Section 1: Saved Addresses / New Address */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" /> 1. Select Indian Delivery Address
            </h4>

            <div className="space-y-2">
              {userAddresses.map((addr) => (
                <label
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-start justify-between transition-all ${
                    selectedAddressId === addr.id
                      ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-900">
                      {addr.name} ({addr.phone})
                    </div>
                    <div className="text-slate-600">
                      {addr.houseFlat}, {addr.streetLocality}, {addr.landmark ? `${addr.landmark}, ` : ''}
                      {addr.city}, {addr.state} - <strong className="text-slate-900">{addr.pinCode}</strong>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === addr.id}
                    onChange={() => {}}
                    className="accent-amber-600 mt-1"
                  />
                </label>
              ))}

              <button
                type="button"
                onClick={() => setSelectedAddressId('new')}
                className={`w-full p-3 rounded-2xl border text-xs font-bold transition-all ${
                  selectedAddressId === 'new'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-dashed border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                + Add New Delivery Address
              </button>
            </div>

            {/* New Address Fields */}
            {selectedAddressId === 'new' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                    <span className="text-sm">🇮🇳</span> Delivering to India Only
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Auto City & State by PIN Code
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Full Name</label>
                    <input
                      type="text"
                      value={newAddress.name}
                      onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      placeholder="Recipient Name"
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Mobile Number (10 digits)</label>
                    <input
                      type="text"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="9876543210"
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* PIN Code Field */}
                  <div className="sm:col-span-2 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        6-Digit Indian PIN Code <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">Auto-fetches City & State</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={newAddress.pinCode || ''}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        placeholder="Enter 6-digit PIN (e.g., 560038, 110001, 400001)"
                        className="w-full p-2.5 bg-white border border-amber-300 font-mono font-bold text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-amber-500 outline-none pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isPincodeLoading ? (
                          <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                        ) : newAddress.city && newAddress.pinCode?.length === 6 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : null}
                      </div>
                    </div>

                    {/* Status Feedback */}
                    {pincodeMessage && (
                      <div
                        className={`text-[11px] font-semibold flex items-center gap-1.5 pt-0.5 ${
                          pincodeMessage.type === 'success'
                            ? 'text-emerald-700'
                            : pincodeMessage.type === 'info'
                            ? 'text-amber-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {pincodeMessage.type === 'success' && <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        {pincodeMessage.text}
                      </div>
                    )}

                    {/* Suggested Locality Tags */}
                    {pincodeDetails && pincodeDetails.localities && pincodeDetails.localities.length > 0 && (
                      <div className="pt-1 space-y-1">
                        <div className="text-[10px] font-bold text-slate-600 uppercase">Suggested Areas / Localities:</div>
                        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                          {pincodeDetails.localities.map((loc, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const current = newAddress.streetLocality || '';
                                if (!current.includes(loc)) {
                                  setNewAddress((prev) => ({
                                    ...prev,
                                    streetLocality: current ? `${loc}, ${current}` : loc,
                                  }));
                                }
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-amber-100 active:bg-amber-200 border border-amber-300 text-slate-800 text-[10px] font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              + {loc}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Flat / House No. / Building</label>
                    <input
                      type="text"
                      value={newAddress.houseFlat}
                      onChange={(e) => setNewAddress({ ...newAddress, houseFlat: e.target.value })}
                      placeholder="Flat 101, Sunshine Apartments"
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Street / Locality</label>
                    <input
                      type="text"
                      value={newAddress.streetLocality}
                      onChange={(e) => setNewAddress({ ...newAddress, streetLocality: e.target.value })}
                      placeholder="100 Feet Road, Indiranagar"
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center justify-between">
                      <span>City (Auto-fetched)</span>
                      {newAddress.city && <span className="text-[9px] text-emerald-600 font-bold">✓ Verified</span>}
                    </label>
                    <input
                      type="text"
                      value={newAddress.city || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="City (e.g. Bengaluru)"
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center justify-between">
                      <span>State (Auto-fetched)</span>
                      {newAddress.state && <span className="text-[9px] text-emerald-600 font-bold">✓ Verified</span>}
                    </label>
                    <input
                      type="text"
                      value={newAddress.state || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder="State (e.g. Karnataka)"
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Indian Payment Method */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" /> 2. Select Payment Method (Razorpay Gateway)
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5 text-amber-400" /> UPI (GPay/PhonePe)
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Credit Card')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'Credit Card'
                    ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-400" /> Credit Card
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Debit Card')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'Debit Card'
                    ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building className="w-5 h-5 text-amber-400" /> RuPay / Debit
              </button>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <label className="font-bold text-slate-800">Virtual Payment Address (UPI ID / VPA)</label>
                <input
                  type="text"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="mobilenumber@upi"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                />
                <p className="text-[11px] text-slate-500">
                  Instant UPI collect request will be sent to your GPay, PhonePe, or Paytm app.
                </p>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Spectacles Subtotal ({cart.length} item)</span>
              <span className="font-bold text-white">₹{cartSubtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold">
              <span>Home Delivery Charge</span>
              <span>FREE DELIVERY (₹0)</span>
            </div>
            <hr className="border-slate-800" />
            <div className="flex justify-between text-sm font-black text-amber-400 pt-1">
              <span>Total Payable</span>
              <span>₹{cartSubtotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessingPayment}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessingPayment ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                {paymentStatusMessage || 'Redirecting to Razorpay...'}
              </span>
            ) : (
              <span>Pay & Confirm Order ₹{cartSubtotal.toLocaleString('en-IN')} (Razorpay) →</span>
            )}
          </button>
        </div>
      </div>

      {/* Embedded Razorpay Payment Gateway Modal */}
      <RazorpayModal
        isOpen={isRazorpayModalOpen}
        data={razorpayModalData}
        onClose={() => setIsRazorpayModalOpen(false)}
        onSuccess={handleRazorpaySuccess}
        onFailure={handleRazorpayFailure}
      />
    </div>
  );
};
