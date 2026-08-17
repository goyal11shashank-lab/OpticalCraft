/**
 * OptiCraft Eyewear - Live Shiprocket Order Tracking Modal Component
 * Displays real-time order status lifecycle (Confirmed, In Transit, Delivered),
 * AWB tracking number, courier partner details, and live timestamped activity feed.
 */

import React, { useState } from 'react';
import { ShiprocketOrderTracking, Order } from '../types';
import {
  X,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Package,
  ShieldCheck,
  Plane,
  Home,
  FileCheck,
  Sparkles,
} from 'lucide-react';

interface ShiprocketOrderTrackingModalProps {
  tracking: ShiprocketOrderTracking | null;
  order?: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShiprocketOrderTrackingModal: React.FC<ShiprocketOrderTrackingModalProps> = ({
  tracking,
  order,
  isOpen,
  onClose,
}) => {
  const [copiedAwb, setCopiedAwb] = useState<boolean>(false);

  if (!isOpen || !tracking) return null;

  const handleCopyAwb = () => {
    if (tracking.awbNumber) {
      navigator.clipboard.writeText(tracking.awbNumber);
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2000);
    }
  };

  // Determine active step in 5-stage pipeline
  const getStepIndex = (status: string): number => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver')) return 4;
    if (s.includes('out') || s.includes('reaching')) return 3;
    if (s.includes('transit') || s.includes('ship') || s.includes('dispatched')) return 2;
    if (s.includes('process') || s.includes('manufactur') || s.includes('packed') || s.includes('qc') || s.includes('prescription')) return 1;
    return 0; // Confirmed
  };

  const currentStep = getStepIndex(tracking.trackingStatus || tracking.orderStatus);

  const steps = [
    { title: 'Confirmed', desc: 'Order Placed & Verified', icon: CheckCircle2 },
    { title: 'Prescription & QC', desc: 'Edging & Precision Lab', icon: FileCheck },
    { title: 'In Transit', desc: 'Air Cargo Express', icon: Plane },
    { title: 'Out for Delivery', desc: 'Local Hub Associate', icon: Truck },
    { title: 'Delivered', desc: 'Zero-Damage Delivery', icon: Home },
  ];

  return (
    <div
      id="shiprocket-tracking-modal"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto relative animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              Shiprocket Live Tracking
            </span>
            <span className="text-xs text-slate-400 font-mono">Order #{tracking.orderNumber}</span>
          </div>

          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>{tracking.currentStatusText}</span>
          </h3>

          <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Current Location: <strong>{tracking.currentLocation}</strong></span>
          </p>
        </div>

        {/* Courier & AWB Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-600" />
            <div>
              <span className="text-slate-500 text-[11px] block">Courier Partner</span>
              <strong className="text-slate-900 font-bold">{tracking.courierName}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <span className="text-slate-500 text-[11px] block">AWB / Tracking Number</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                <span>{tracking.awbNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyAwb}
                  title="Copy AWB Number"
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                >
                  {copiedAwb ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {tracking.estimatedDeliveryDate && (
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              <span className="text-amber-800 text-[10px] uppercase font-bold block">Estimated Delivery</span>
              <strong className="text-slate-900 font-extrabold text-xs">{tracking.estimatedDeliveryDate}</strong>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Visual Step Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Shipment Progress Pipeline
            </h4>

            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {/* Step Bubbles */}
              <div className="grid grid-cols-5 gap-1 relative z-10 text-center">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  const Icon = step.icon;

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 font-black scale-110 shadow-md'
                            : isDone
                            ? 'bg-slate-900 text-amber-400'
                            : 'bg-white border-2 border-slate-200 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-2 leading-tight ${
                          isCurrent ? 'text-amber-600' : isDone ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="text-[9px] text-slate-400 hidden sm:block mt-0.5">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Route Overview */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Origin Facility</span>
              <p className="font-semibold text-slate-800">{tracking.originHub}</p>
            </div>
            <div className="space-y-0.5 sm:border-l sm:border-slate-200 sm:pl-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Destination Delivery Address</span>
              <p className="font-semibold text-slate-800">
                {tracking.destinationCity}, {tracking.destinationState} ({tracking.destinationPincode})
              </p>
            </div>
          </div>

          {/* Real-time Activity Log */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Live Courier Activity Updates ({tracking.activities.length})
            </h4>

            <div className="space-y-3">
              {tracking.activities.map((act, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-2xl border transition-all ${
                    index === 0
                      ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            index === 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <h5 className="text-xs font-bold text-slate-900">{act.status}</h5>
                        {act.srStatusLabel && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                            {act.srStatusLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 pl-4">{act.activity}</p>
                      <p className="text-[10px] font-semibold text-slate-500 pl-4 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{act.location}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-800 block">{act.date}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{act.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Insured Optical Logistics by Shiprocket</span>
          </div>

          <div className="flex items-center gap-2">
            {tracking.trackingUrl && (
              <a
                href={tracking.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <span>Shiprocket Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
