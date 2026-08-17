/**
 * OptiCraft Eyewear - Shiprocket Pincode Serviceability & Delivery Checker Widget
 * Displays live delivery estimates, courier partners (Blue Dart, Delhivery, DTDC),
 * COD availability, and free shipping guarantee on Product Details Page.
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShiprocketServiceabilityResult } from '../types';
import {
  Truck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';

interface ShiprocketPincodeCheckerProps {
  productId?: string;
  defaultPincode?: string;
  compact?: boolean;
}

export const ShiprocketPincodeChecker: React.FC<ShiprocketPincodeCheckerProps> = ({
  productId,
  defaultPincode = '',
  compact = false,
}) => {
  const { checkPincodeServiceabilityApi, userAddresses, currentUser } = useApp();

  const [pincodeInput, setPincodeInput] = useState<string>(() => {
    if (defaultPincode) return defaultPincode;
    if (userAddresses.length > 0) {
      const defaultAddr = userAddresses.find((a) => a.isDefault) || userAddresses[0];
      return defaultAddr.pinCode || '';
    }
    return '560038'; // Default demo Indiranagar, Bengaluru
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ShiprocketServiceabilityResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAllCouriers, setShowAllCouriers] = useState<boolean>(false);

  // Auto-run check on initial mount or default pincode
  useEffect(() => {
    if (pincodeInput.length === 6 && /^\d{6}$/.test(pincodeInput)) {
      handleCheckPincode(pincodeInput);
    }
  }, []);

  const handleCheckPincode = async (pinToCheck?: string) => {
    const pin = (pinToCheck || pincodeInput).replace(/\D/g, '').slice(0, 6);
    if (pin.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code.');
      setResult(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await checkPincodeServiceabilityApi(pin);
      if (data.success && data.serviceable) {
        setResult(data);
        setErrorMessage(null);
      } else {
        setResult(null);
        setErrorMessage(data.error || 'Delivery currently unavailable to this PIN code.');
      }
    } catch (err: any) {
      setResult(null);
      setErrorMessage(err.message || 'Serviceability check failed. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheckPincode();
    }
  };

  const handleUseSavedAddress = (pin: string) => {
    setPincodeInput(pin);
    handleCheckPincode(pin);
  };

  return (
    <div
      id="shiprocket-pincode-serviceability-card"
      className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3.5 transition-all"
    >
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              Delivery & Pincode Serviceability
              <span className="text-[9px] font-black uppercase bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded tracking-normal">
                Shiprocket
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Check delivery timeline & available couriers for your area
            </p>
          </div>
        </div>

        {result && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Serviceable
          </span>
        )}
      </div>

      {/* Input Form */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="shiprocket-pincode-input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincodeInput}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPincodeInput(val);
              if (errorMessage) setErrorMessage(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter 6-digit Indian PIN (e.g. 560038)"
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <button
          id="shiprocket-check-btn"
          type="button"
          onClick={() => handleCheckPincode()}
          disabled={isLoading || pincodeInput.length !== 6}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-amber-400 font-extrabold text-xs rounded-2xl transition-all flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Checking...</span>
            </>
          ) : (
            <span>Check</span>
          )}
        </button>
      </div>

      {/* Quick suggestions if user has saved addresses */}
      {userAddresses.length > 0 && !result && (
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 pt-1">
          <span>Saved PINs:</span>
          {userAddresses.slice(0, 3).map((addr) => (
            <button
              key={addr.id}
              type="button"
              onClick={() => handleUseSavedAddress(addr.pinCode)}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md transition-colors"
            >
              {addr.city} ({addr.pinCode})
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <div className="font-semibold">{errorMessage}</div>
        </div>
      )}

      {/* Serviceability Result Card */}
      {result && result.serviceable && (
        <div className="space-y-3 pt-1 animate-in fade-in duration-200">
          {/* Location & Estimated Delivery Highlight */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-emerald-800">
                  Delivering to: <strong className="font-extrabold text-slate-900">{result.city}, {result.state}</strong> ({result.pincode})
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>Delivery by <span className="text-emerald-700 underline decoration-emerald-300">{result.formattedEta}</span></span>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full ml-1">
                    {result.deliveryDaysMin === result.deliveryDaysMax ? `${result.deliveryDaysMin} Days` : `${result.deliveryDaysMin}-${result.deliveryDaysMax} Days`}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-black text-emerald-800 uppercase bg-white px-2 py-1 rounded-lg border border-emerald-200 shrink-0">
                100% FREE
              </span>
            </div>

            {/* Courier highlight */}
            {result.recommendedCourier && (
              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-slate-700">
                <div className="flex items-center gap-1.5 font-bold">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Express Courier: <strong>{result.recommendedCourier.name}</strong></span>
                </div>
                <span className="text-[10px] font-extrabold text-slate-600 bg-white/80 px-1.5 py-0.5 rounded">
                  ★ {result.recommendedCourier.rating} Rating
                </span>
              </div>
            )}
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-slate-700 font-semibold">Free Delivery (₹0)</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-slate-700 font-semibold">COD Available</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 col-span-2 sm:col-span-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-700 font-semibold">Optical Safe Transit</span>
            </div>
          </div>

          {/* Available Courier Partners Breakdown Toggle */}
          {result.couriers.length > 1 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAllCouriers(!showAllCouriers)}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <span>{showAllCouriers ? 'Hide' : 'View'} all {result.couriers.length} Shiprocket courier options</span>
                {showAllCouriers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAllCouriers && (
                <div className="mt-2 space-y-1.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 animate-in fade-in duration-150">
                  {result.couriers.map((courier) => (
                    <div
                      key={courier.id}
                      className="p-2 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-bold text-slate-900">{courier.name}</span>
                        {courier.isRecommended && (
                          <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                            FASTEST
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-slate-500">
                        <span>{courier.mode} Express</span>
                        <strong className="text-emerald-700 font-black">₹0 (Free)</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
