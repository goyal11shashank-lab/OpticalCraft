/**
 * OptiCraft Eyewear - Order Success & Tracking Modal
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Truck, ShieldCheck, FileText, ArrowRight, Glasses, X } from 'lucide-react';

export const OrderSuccessModal: React.FC = () => {
  const { activeConfirmedOrder, setActiveConfirmedOrder, setActiveTab } = useApp();

  if (!activeConfirmedOrder) return null;

  const ord = activeConfirmedOrder;

  const trackingSteps = [
    { title: 'Payment Confirmed', desc: 'Captured via Razorpay', active: true },
    {
      title: 'Prescription Verification',
      desc: ord.prescriptionVerificationStatus === 'Not Required' ? 'Plain Lenses' : 'Optician Verifying Rx',
      active: true,
    },
    { title: 'Optical Manufacturing', desc: 'Custom Lens Edging', active: false },
    { title: 'Dispatched Free Delivery', desc: 'Fast Courier Dispatch', active: false },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white text-center space-y-2 relative">
          <button
            onClick={() => setActiveConfirmedOrder(null)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <span className="text-amber-400 font-bold text-xs uppercase tracking-widest px-3 py-1 bg-amber-400/10 rounded-full border border-amber-400/20">
            ORDER CONFIRMED
          </span>
          <h2 className="text-2xl font-black text-white">Order #{ord.orderNumber}</h2>
          <p className="text-xs text-slate-300">
            Thank you, {ord.customerName}! Your order has been placed successfully with FREE HOME DELIVERY.
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Order Status Pipeline */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Order Status Pipeline</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {trackingSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-center space-y-1 ${
                    step.active
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-slate-500">Step {idx + 1}</div>
                  <div className="font-extrabold text-xs">{step.title}</div>
                  <div className="text-[10px] text-slate-500">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchased Spectacles Breakdown */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Ordered Items</h4>
            <div className="space-y-2">
              {ord.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.configuration.frameImage}
                      alt=""
                      className="w-12 h-12 object-contain bg-slate-50 p-1 rounded-xl"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{item.configuration.productName}</div>
                      <div className="text-[11px] text-amber-700 font-semibold">
                        {item.configuration.lensTypeName} ({item.configuration.materialName || 'Standard'})
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-slate-900 text-sm">
                      ₹{item.totalPrice.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400">Qty: {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 uppercase text-[10px]">Free Home Delivery Address</div>
              <div className="font-bold text-slate-800">{ord.deliveryAddress.name}</div>
              <div className="text-slate-600">
                {ord.deliveryAddress.houseFlat}, {ord.deliveryAddress.streetLocality}, {ord.deliveryAddress.city},{' '}
                {ord.deliveryAddress.state} - {ord.deliveryAddress.pinCode}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 uppercase text-[10px]">Payment Summary</div>
              <div className="font-bold text-slate-800">
                Method: {ord.payment.paymentMethod} (Captured)
              </div>
              <div className="text-emerald-700 font-bold">Delivery Fee: FREE DELIVERY</div>
              <div className="text-amber-700 font-extrabold text-sm pt-1">
                Total Paid: ₹{ord.totalAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border-t border-slate-800 text-center">
          <button
            onClick={() => {
              setActiveConfirmedOrder(null);
              setActiveTab('account');
            }}
            className="w-full py-3 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md hover:bg-amber-300 transition-all"
          >
            Go to My Orders & Prescriptions →
          </button>
        </div>
      </div>
    </div>
  );
};
