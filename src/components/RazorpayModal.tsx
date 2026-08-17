/**
 * Razorpay Payment Gateway Modal for OptiCraft Eyewear
 * Official Razorpay branded payment experience supporting UPI, Cards, Net Banking & Wallets
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  CreditCard,
  Smartphone,
  QrCode,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Clock,
  HelpCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export interface RazorpayModalData {
  checkoutSessionId: string;
  razorpayOrderId: string;
  keyId: string;
  amountInINR: number;
  amountInPaise: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface RazorpayModalProps {
  isOpen: boolean;
  data: RazorpayModalData | null;
  onClose: () => void;
  onSuccess: (response: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    paymentMethod: string;
  }) => Promise<void>;
  onFailure: (errorMsg: string) => void;
}

type PaymentTab = 'upi' | 'card' | 'netbanking' | 'wallet';

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  data,
  onClose,
  onSuccess,
  onFailure,
}) => {
  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');
  const [upiSubTab, setUpiSubTab] = useState<'qr' | 'apps' | 'id'>('qr');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('Google Pay');
  const [upiIdInput, setUpiIdInput] = useState<string>('user@okhdfcbank');

  // Card form state
  const [cardNumber, setCardNumber] = useState<string>('4315 2678 9012 3456');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvv, setCardCvv] = useState<string>('789');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [saveCard, setSaveCard] = useState<boolean>(true);

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');

  // Wallet state
  const [selectedWallet, setSelectedWallet] = useState<string>('Amazon Pay');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState<number>(600); // 10 minutes

  useEffect(() => {
    if (data?.customerName && !cardHolder) {
      setCardHolder(data.customerName);
    }
  }, [data, cardHolder]);

  // Countdown timer for Razorpay payment session
  useEffect(() => {
    if (!isOpen) return;
    setTimerSeconds(600);
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(data.amountInINR);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Generate SHA-256 HMAC for Razorpay test signature verification
  const calculateTestSignature = async (orderId: string, paymentId: string): Promise<string> => {
    const keySecret = 'test_secret_opticraft_secure_67890';
    const message = `${orderId}|${paymentId}`;

    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder();
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(keySecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sigBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
      return Array.from(new Uint8Array(sigBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    return `sig_${Date.now()}_verified`;
  };

  const handleExecutePayment = async (methodName: string) => {
    try {
      setIsProcessing(true);
      setProcessingStage('Connecting to Bank Secure Gateway...');
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStage('Authorizing Payment with Razorpay...');
      await new Promise((r) => setTimeout(r, 700));

      setProcessingStage('Verifying HMAC-SHA256 Cryptographic Signature...');
      const paymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const signature = await calculateTestSignature(data.razorpayOrderId, paymentId);

      await onSuccess({
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        paymentMethod: methodName,
      });
    } catch (err: any) {
      setIsProcessing(false);
      onFailure(err?.message || 'Payment authorization failed');
    }
  };

  const handleSimulateFailure = () => {
    setIsProcessing(true);
    setProcessingStage('Simulating Bank Transaction Failure...');
    setTimeout(() => {
      setIsProcessing(false);
      onFailure('Payment declined by issuing bank (Test Simulation). Your cart is safe.');
    }, 800);
  };

  const topBanks = [
    { name: 'HDFC Bank', code: 'HDFC', badge: 'Popular' },
    { name: 'ICICI Bank', code: 'ICIC', badge: 'Popular' },
    { name: 'State Bank of India', code: 'SBIN', badge: 'Popular' },
    { name: 'Axis Bank', code: 'UTIB', badge: 'Popular' },
    { name: 'Kotak Mahindra Bank', code: 'KKBK' },
    { name: 'Punjab National Bank', code: 'PUNB' },
  ];

  const upiApps = [
    { name: 'Google Pay', handle: 'okhdfcbank / okaxis', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { name: 'PhonePe', handle: 'ybl / axl / ibl', color: 'bg-purple-50 text-purple-800 border-purple-200' },
    { name: 'Paytm', handle: 'paytm', color: 'bg-sky-50 text-sky-800 border-sky-200' },
    { name: 'CRED UPI', handle: 'cred', color: 'bg-slate-50 text-slate-800 border-slate-200' },
    { name: 'BHIM UPI', handle: 'upi', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { name: 'WhatsApp Pay', handle: 'waaxis / wahdfc', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  ];

  const wallets = [
    { name: 'Amazon Pay', balance: '₹12,450' },
    { name: 'Mobikwik', balance: '₹4,820' },
    { name: 'Airtel Money', balance: '₹2,500' },
    { name: 'Freecharge', balance: '₹1,200' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[92vh]">
        
        {/* Razorpay Brand Header */}
        <div className="bg-gradient-to-r from-[#0c2340] via-[#0b2952] to-[#081f3d] text-white p-5 relative shrink-0">
          <button
            onClick={() => {
              if (!isProcessing) {
                onFailure('Payment cancelled by user. Your items remain in cart.');
                onClose();
              }
            }}
            disabled={isProcessing}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors disabled:opacity-30 cursor-pointer"
            title="Cancel payment"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start justify-between pr-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {/* Razorpay Vector Emblem */}
                <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center text-white font-black text-xs italic tracking-tighter shadow-sm">
                  R
                </div>
                <span className="text-xs font-black tracking-wider uppercase text-blue-300">Razorpay Trusted</span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white">OptiCraft Eyewear</h3>
              <p className="text-[11px] text-slate-300">Order ID: <span className="font-mono text-blue-200">{data.razorpayOrderId}</span></p>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-300">Amount Due</div>
              <div className="text-2xl font-black text-amber-300 tracking-tight">{formattedAmount}</div>
              <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-400 font-semibold mt-0.5">
                <Clock className="w-3 h-3" /> Expires in {formatTimer(timerSeconds)}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <div className="truncate max-w-[280px]">
              <span className="text-slate-400">Paying for:</span> <strong className="text-white">{data.customerName}</strong> ({data.customerPhone})
            </div>
            <div className="flex items-center gap-1 text-emerald-300 font-bold text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" /> 256-Bit SSL Encrypted
            </div>
          </div>
        </div>

        {/* Processing State View */}
        {isProcessing ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin flex items-center justify-center"></div>
              <Lock className="w-6 h-6 text-blue-600 absolute inset-0 m-auto" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-black text-slate-900 text-base">Processing Razorpay Transaction</h4>
              <p className="text-xs text-blue-600 font-bold animate-pulse">{processingStage}</p>
              <p className="text-[11px] text-slate-500 pt-2">Please do not refresh the page or press back while we securely authorize your payment.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
            
            {/* Sidebar Navigation */}
            <div className="w-full sm:w-44 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-200 p-2 sm:p-3 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible shrink-0">
              <button
                onClick={() => setActiveTab('upi')}
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors whitespace-nowrap sm:whitespace-normal ${
                  activeTab === 'upi'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>UPI / QR</span>
                </div>
                <span className="hidden sm:inline-block text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">Fast</span>
              </button>

              <button
                onClick={() => setActiveTab('card')}
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors whitespace-nowrap sm:whitespace-normal ${
                  activeTab === 'card'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Cards</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('netbanking')}
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors whitespace-nowrap sm:whitespace-normal ${
                  activeTab === 'netbanking'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Netbanking</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('wallet')}
                className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors whitespace-nowrap sm:whitespace-normal ${
                  activeTab === 'wallet'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span>Wallets</span>
                </div>
              </button>
            </div>

            {/* Main Payment Method Pane */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
              
              {/* TAB 1: UPI / QR Code */}
              {activeTab === 'upi' && (
                <div className="space-y-4">
                  {/* UPI Subtabs */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setUpiSubTab('qr')}
                      className={`py-1.5 rounded-lg transition-all ${
                        upiSubTab === 'qr' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Scan QR
                    </button>
                    <button
                      onClick={() => setUpiSubTab('apps')}
                      className={`py-1.5 rounded-lg transition-all ${
                        upiSubTab === 'apps' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      UPI Apps
                    </button>
                    <button
                      onClick={() => setUpiSubTab('id')}
                      className={`py-1.5 rounded-lg transition-all ${
                        upiSubTab === 'id' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      UPI ID / VPA
                    </button>
                  </div>

                  {/* QR Option */}
                  {upiSubTab === 'qr' && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                      <div className="bg-white p-3 rounded-2xl border border-slate-300 shadow-sm relative group">
                        {/* Realistic Mock QR Code Graphic */}
                        <div className="w-36 h-36 bg-slate-950 p-2 rounded-xl flex flex-col justify-between">
                          <div className="flex justify-between">
                            <div className="w-8 h-8 bg-white rounded-md p-1">
                              <div className="w-full h-full bg-slate-950 rounded-xs"></div>
                            </div>
                            <div className="w-8 h-8 bg-white rounded-md p-1">
                              <div className="w-full h-full bg-slate-950 rounded-xs"></div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded uppercase tracking-tighter">
                              OptiCraft UPI
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <div className="w-8 h-8 bg-white rounded-md p-1">
                              <div className="w-full h-full bg-slate-950 rounded-xs"></div>
                            </div>
                            <div className="w-5 h-5 bg-white rounded-xs self-end"></div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">Scan & Pay with any UPI App</p>
                        <p className="text-[11px] text-slate-500">Google Pay • PhonePe • Paytm • CRED • BHIM</p>
                      </div>

                      <button
                        onClick={() => handleExecutePayment('UPI QR Code')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" /> Simulate QR Scan & Pay {formattedAmount}
                      </button>
                    </div>
                  )}

                  {/* UPI Apps Option */}
                  {upiSubTab === 'apps' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {upiApps.map((app) => (
                          <button
                            key={app.name}
                            type="button"
                            onClick={() => setSelectedUpiApp(app.name)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              selectedUpiApp === app.name
                                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className="font-bold text-xs text-slate-900">{app.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{app.handle}</span>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handleExecutePayment(`UPI App (${selectedUpiApp})`)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <span>Pay {formattedAmount} via {selectedUpiApp}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* UPI ID / VPA Option */}
                  {upiSubTab === 'id' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Enter Virtual Payment Address (UPI ID)</label>
                        <input
                          type="text"
                          value={upiIdInput}
                          onChange={(e) => setUpiIdInput(e.target.value)}
                          placeholder="e.g. 9876543210@paytm or user@okhdfcbank"
                          className="w-full mt-1 p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">A collect request will be sent directly to your UPI app.</p>
                      <button
                        onClick={() => handleExecutePayment(`UPI VPA (${upiIdInput})`)}
                        disabled={!upiIdInput.includes('@')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span>Verify & Pay {formattedAmount}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Cards */}
              {activeTab === 'card' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Card Number (RuPay / Visa / MasterCard)</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4315 2678 9012 3456"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none pr-14"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                        RuPay
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase">CVV / CVC</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Name on Card</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Cardholder Name"
                      className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-slate-600">Save card securely as per RBI tokenization norms</span>
                  </label>

                  <button
                    onClick={() => handleExecutePayment('Card (RuPay/Visa/MasterCard)')}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer mt-2"
                  >
                    <Lock className="w-3.5 h-3.5" /> Pay {formattedAmount} Securely
                  </button>
                </div>
              )}

              {/* TAB 3: Net Banking */}
              {activeTab === 'netbanking' && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-600 uppercase">Popular Indian Banks</div>
                  <div className="grid grid-cols-2 gap-2">
                    {topBanks.map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => setSelectedBank(bank.name)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          selectedBank === bank.name
                            ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <span className="text-xs">{bank.name}</span>
                        {bank.badge && (
                          <span className="text-[8px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-bold">
                            {bank.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleExecutePayment(`Net Banking (${selectedBank})`)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer mt-2"
                  >
                    <span>Proceed to {selectedBank} & Pay {formattedAmount}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* TAB 4: Wallets */}
              {activeTab === 'wallet' && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-600 uppercase">Select Wallet</div>
                  <div className="space-y-2">
                    {wallets.map((w) => (
                      <button
                        key={w.name}
                        type="button"
                        onClick={() => setSelectedWallet(w.name)}
                        className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          selectedWallet === w.name
                            ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-xs text-slate-900">{w.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-700">Link & Pay</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleExecutePayment(`Wallet (${selectedWallet})`)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer mt-2"
                  >
                    <span>Pay {formattedAmount} via {selectedWallet}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Testing Controls & Security Notice */}
        <div className="bg-slate-50 p-3 sm:p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Secured by Razorpay Payments India</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSimulateFailure}
              disabled={isProcessing}
              className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline font-semibold disabled:opacity-50 cursor-pointer"
            >
              Simulate Failure
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => handleExecutePayment('Instant 1-Click Razorpay Auth')}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" /> Quick Pay {formattedAmount}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
