/**
 * OptiCraft Eyewear - Customer Account Dashboard & Authentication Manager
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  User as UserIcon,
  ShoppingBag,
  FileText,
  MapPin,
  Heart,
  Plus,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit,
  ArrowLeft,
  Glasses,
  LogOut,
  Lock,
  Mail,
  Phone,
  Upload,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Timer,
  RefreshCw,
  Send,
  Smartphone,
  Loader2,
  Plane,
  Copy,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { PrescriptionForm } from './PrescriptionForm';
import { ShiprocketOrderTrackingModal } from './ShiprocketOrderTrackingModal';
import { Address, Order, ShiprocketOrderTracking } from '../types';
import { lookupIndianPincode, isValidIndianPincodeFormat, IndianPincodeResult } from '../utils/indianPincode';

export const UserAccountModal: React.FC = () => {
  const {
    currentUser,
    signUpApi,
    sendOtpApi,
    verifyOtpApi,
    loginApi,
    logoutUser,
    forgotPasswordApi,
    resetPasswordApi,
    updateProfileApi,
    userAddresses,
    addAddressApi,
    setDefaultAddressApi,
    deleteAddressApi,
    savedPrescriptions,
    addPrescriptionApi,
    deletePrescriptionApi,
    uploadPrescriptionFileApi,
    orders,
    wishlist,
    products,
    openConfigurator,
    setActiveTab,
    setViewingPrescription,
    fetchOrderTrackingApi,
  } = useApp();

  // Auth Forms Mode when Logged Out
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Sign Up State & OTP Step
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');
  const [signUpForm, setSignUpForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [signupOtp, setSignupOtp] = useState('');
  const [signupOtpTimer, setSignupOtpTimer] = useState(120);
  const [signupCanResend, setSignupCanResend] = useState(false);
  const [signupDebugOtp, setSignupDebugOtp] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Forgot / Reset Password State with OTP
  const [forgotStep, setForgotStep] = useState<'identifier' | 'verify'>('identifier');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotOtpTimer, setForgotOtpTimer] = useState(120);
  const [forgotCanResend, setForgotCanResend] = useState(false);
  const [forgotDebugOtp, setForgotDebugOtp] = useState<string | null>(null);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  // Format MM:SS for 2-minute timer display
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Countdown timer for Signup OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (signupStep === 'otp' && signupOtpTimer > 0) {
      interval = setInterval(() => {
        setSignupOtpTimer((prev) => {
          if (prev <= 1) {
            setSignupCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [signupStep, signupOtpTimer]);

  // Countdown timer for Forgot Password OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (forgotStep === 'verify' && forgotOtpTimer > 0) {
      interval = setInterval(() => {
        setForgotOtpTimer((prev) => {
          if (prev <= 1) {
            setForgotCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [forgotStep, forgotOtpTimer]);

  // Logged-In Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'prescriptions' | 'addresses' | 'wishlist' | 'settings'>('orders');

  // Orders Filter & Live Tracking State
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'active' | 'in_transit' | 'delivered'>('all');
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState<boolean>(false);
  const [selectedOrderTracking, setSelectedOrderTracking] = useState<ShiprocketOrderTracking | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [loadingTrackingOrderId, setLoadingTrackingOrderId] = useState<string | null>(null);
  const [copiedAwbOrderNum, setCopiedAwbOrderNum] = useState<string | null>(null);

  const handleOpenOrderTracking = async (ord: Order) => {
    setSelectedOrderForModal(ord);
    setLoadingTrackingOrderId(ord.id);

    try {
      const res = await fetchOrderTrackingApi(ord.orderNumber);
      if (res.success && res.shiprocket) {
        setSelectedOrderTracking(res.shiprocket);
      } else {
        // Fallback tracking generation
        setSelectedOrderTracking({
          success: true,
          orderNumber: ord.orderNumber,
          orderStatus: ord.status,
          trackingStatus: ord.status === 'Delivered' ? 'Delivered' : ord.status === 'Shipped' ? 'In Transit' : 'Confirmed',
          currentStatusText: ord.status === 'Delivered' ? 'Delivered' : ord.status === 'Shipped' ? 'In Transit via Blue Dart (Shiprocket)' : 'Order Confirmed',
          courierName: ord.shipment?.courierName || 'Blue Dart Express (Shiprocket Partner)',
          awbNumber: ord.shipment?.awbNumber || `SR${ord.orderNumber.replace(/\D/g, '').padEnd(9, '849201')}`,
          pickupPincode: '560038',
          destinationPincode: ord.deliveryAddress.pinCode,
          destinationCity: ord.deliveryAddress.city,
          destinationState: ord.deliveryAddress.state,
          originHub: 'OptiCraft Indiranagar Hub, Bengaluru',
          currentLocation: `${ord.deliveryAddress.city} Regional Hub`,
          activities: [
            {
              date: new Date().toLocaleDateString('en-IN'),
              time: '10:00 AM',
              status: ord.status,
              activity: `Current status: ${ord.status}`,
              location: `${ord.deliveryAddress.city}, ${ord.deliveryAddress.state}`,
            },
          ],
        });
      }
      setIsTrackingModalOpen(true);
    } finally {
      setLoadingTrackingOrderId(null);
    }
  };

  const handleCopyAwb = (awb: string, orderNum: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwbOrderNum(orderNum);
    setTimeout(() => setCopiedAwbOrderNum(null), 2000);
  };

  // Address Form State
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrForm, setAddrForm] = useState<Partial<Address>>({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    houseFlat: '',
    streetLocality: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560038',
  });
  const [addrError, setAddrError] = useState<string | null>(null);

  // Address PIN Code Auto-fetch state in Account modal
  const [isAddrPinLoading, setIsAddrPinLoading] = useState(false);
  const [addrPinMessage, setAddrPinMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [addrPinDetails, setAddrPinDetails] = useState<IndianPincodeResult | null>(null);

  const handleAddrPinChange = async (rawPin: string) => {
    const pin = rawPin.replace(/\D/g, '').slice(0, 6);
    setAddrForm((prev) => ({ ...prev, pinCode: pin }));
    setAddrPinDetails(null);

    if (pin.length < 6) {
      setAddrPinMessage(null);
      return;
    }

    if (!isValidIndianPincodeFormat(pin)) {
      setAddrPinMessage({
        type: 'error',
        text: 'Invalid Indian PIN code (Must be 6 digits starting between 1-8).',
      });
      return;
    }

    setIsAddrPinLoading(true);
    setAddrPinMessage({ type: 'info', text: 'Fetching Indian Postal details...' });

    try {
      const result = await lookupIndianPincode(pin);
      if (result) {
        setAddrForm((prev) => ({
          ...prev,
          city: result.city,
          state: result.state,
        }));
        setAddrPinDetails(result);
        setAddrPinMessage({
          type: 'success',
          text: `Auto-fetched: ${result.city}, ${result.state}`,
        });
      } else {
        setAddrPinMessage({
          type: 'error',
          text: 'Could not auto-fetch city. You can enter it manually below.',
        });
      }
    } catch (e) {
      setAddrPinMessage({
        type: 'error',
        text: 'Error auto-fetching pincode. You can enter city manually.',
      });
    } finally {
      setIsAddrPinLoading(false);
    }
  };

  // Prescription Upload State
  const [showAddRx, setShowAddRx] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser?.name?.split(' ')[0] || '',
    lastName: currentUser?.name?.split(' ').slice(1).join(' ') || '',
    email: currentUser?.email || '',
    mobile: currentUser?.phone || '',
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingAuth(true);

    const res = await loginApi(loginIdentifier, loginPassword);
    setIsSubmittingAuth(false);
    if (!res.success) {
      setLoginError(res.error || 'Login failed. Please check your credentials.');
    }
  };

  // Step 1: Send Signup WhatsApp OTP
  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setFieldErrors({});

    // Client-side quick checks
    const errors: Record<string, string> = {};
    if (!signUpForm.firstName.trim()) errors.firstName = 'First name is required.';
    if (!signUpForm.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!signUpForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpForm.email.trim())) {
      errors.email = 'Valid email is required.';
    }
    const cleanPhone = signUpForm.mobile.trim().replace(/^(\+91|91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.mobile = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
    }
    if (signUpForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSignUpError('Please fix the errors indicated below.');
      return;
    }

    setIsSubmittingAuth(true);
    const res = await sendOtpApi(signUpForm);
    setIsSubmittingAuth(false);

    if (res.success) {
      setSignupDebugOtp(res.debugOtp || null);
      setSignupOtp('');
      setSignupOtpTimer(120);
      setSignupCanResend(false);
      setSignupStep('otp');
    } else {
      setSignUpError(res.error || 'Failed to send OTP verification code.');
      if (res.fieldErrors) {
        setFieldErrors(res.fieldErrors);
      }
    }
  };

  // Step 2: Verify Signup OTP & Create Account
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    if (!signupOtp || signupOtp.trim().length !== 6) {
      setSignUpError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsSubmittingAuth(true);
    const res = await verifyOtpApi(signUpForm.mobile, signupOtp.trim(), signUpForm);
    setIsSubmittingAuth(false);

    if (!res.success) {
      setSignUpError(res.error || 'Invalid or expired OTP code.');
    }
  };

  // Resend Signup OTP
  const handleResendSignupOtp = async () => {
    if (!signupCanResend || isSubmittingAuth) return;
    setSignUpError(null);
    setIsSubmittingAuth(true);

    const res = await sendOtpApi(signUpForm);
    setIsSubmittingAuth(false);

    if (res.success) {
      setSignupDebugOtp(res.debugOtp || null);
      setSignupOtpTimer(120);
      setSignupCanResend(false);
    } else {
      setSignUpError(res.error || 'Failed to resend OTP.');
    }
  };

  // Handle Forgot Password - Step 1 (Send OTP)
  const handleForgotRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMessage(null);

    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered Email or Mobile Number.');
      return;
    }

    setIsSubmittingAuth(true);
    const res = await forgotPasswordApi(forgotIdentifier.trim());
    setIsSubmittingAuth(false);

    if (res.success) {
      setForgotSuccessMessage(res.message || 'Verification code sent.');
      setForgotDebugOtp(res.debugOtp || null);
      if (res.debugResetToken) setResetToken(res.debugResetToken);
      setForgotOtp('');
      setForgotOtpTimer(120);
      setForgotCanResend(false);
      setForgotStep('verify');
    } else {
      setForgotError(res.error || 'Could not send verification code.');
    }
  };

  // Handle Forgot Password - Step 2 (Verify OTP & Reset Password)
  const handleForgotVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setResetError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setIsSubmittingAuth(true);
    const res = await resetPasswordApi(
      resetToken || '',
      newPassword,
      confirmNewPassword,
      forgotIdentifier.trim(),
      forgotOtp.trim()
    );
    setIsSubmittingAuth(false);

    if (!res.success) {
      setResetError(res.error || 'Failed to reset password. Please check the code.');
    }
  };

  const handleResetSubmit = handleForgotVerifyAndReset;

  // Resend Forgot Password OTP
  const handleResendForgotOtp = async () => {
    if (!forgotCanResend || isSubmittingAuth) return;
    setResetError(null);
    setIsSubmittingAuth(true);

    const res = await forgotPasswordApi(forgotIdentifier.trim());
    setIsSubmittingAuth(false);

    if (res.success) {
      setForgotDebugOtp(res.debugOtp || null);
      setForgotOtpTimer(120);
      setForgotCanResend(false);
    } else {
      setResetError(res.error || 'Failed to resend OTP.');
    }
  };

  // Handle Add Address
  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrError(null);
    const res = await addAddressApi(addrForm);
    if (res.success) {
      setShowAddAddr(false);
      setAddrForm({
        name: currentUser?.name || '',
        phone: currentUser?.phone || '',
        houseFlat: '',
        streetLocality: '',
        landmark: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560038',
      });
    } else {
      setAddrError(res.error || 'Could not save address.');
    }
  };

  // Handle File Upload Simulation
  const handleFileUpload = async () => {
    if (!uploadFileName) return;
    const res = await uploadPrescriptionFileApi(uploadFileName);
    if (res.success) {
      setUploadMessage('Prescription slip uploaded! Adding to your records...');
      await addPrescriptionApi({
        title: `Slip: ${uploadFileName}`,
        uploadedFilePath: res.uploadedFilePath,
        uploadedFileType: res.uploadedFileType,
        odRight: { sph: 0, cyl: 0, axis: 0 },
        osLeft: { sph: 0, cyl: 0, axis: 0 },
        pd: 63,
      });
      setUploadFileName('');
      setTimeout(() => setUploadMessage(null), 3000);
    }
  };

  // Handle Profile Update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    const res = await updateProfileApi(profileForm);
    if (res.success) {
      setProfileMessage('Profile details updated successfully!');
    } else {
      setProfileMessage(res.error || 'Failed to update profile.');
    }
  };

  // =========================================================================
  // LOGGED OUT VIEW: AUTH MODAL (Login / Signup / Forgot Password)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-8 bg-slate-900 text-white text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-md">
              <Glasses className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-black text-white">OptiCraft Account Access</h2>
            <p className="text-xs text-amber-400 font-medium">
              Manage Orders, Prescriptions & Indian Delivery Addresses
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-bold text-center">
            <button
              onClick={() => {
                setAuthMode('login');
                setLoginError(null);
              }}
              className={`flex-1 py-3 transition-colors ${
                authMode === 'login'
                  ? 'bg-amber-500 text-slate-950 font-extrabold'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setSignUpError(null);
              }}
              className={`flex-1 py-3 transition-colors ${
                authMode === 'signup'
                  ? 'bg-amber-500 text-slate-950 font-extrabold'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6">
            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-800 uppercase text-[10px]">Email or Mobile Number</label>
                  <div className="relative mt-1">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="aarav@example.in or 9988776655"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-800 uppercase text-[10px]">Password</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-amber-700 hover:underline text-[11px] font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl shadow-md transition-all text-sm"
                >
                  {isSubmittingAuth ? 'Logging in...' : 'Sign In to My Account →'}
                </button>
              </form>
            )}

            {/* SIGN UP FLOW */}
            {authMode === 'signup' && (
              <div>
                {signupStep === 'form' ? (
                  <form onSubmit={handleSendSignupOtp} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-800 uppercase text-[10px]">First Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Aarav"
                          value={signUpForm.firstName}
                          onChange={(e) => setSignUpForm({ ...signUpForm, firstName: e.target.value })}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        {fieldErrors.firstName && <p className="text-rose-600 text-[10px] mt-0.5">{fieldErrors.firstName}</p>}
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 uppercase text-[10px]">Last Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Sharma"
                          value={signUpForm.lastName}
                          onChange={(e) => setSignUpForm({ ...signUpForm, lastName: e.target.value })}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        {fieldErrors.lastName && <p className="text-rose-600 text-[10px] mt-0.5">{fieldErrors.lastName}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 uppercase text-[10px]">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="aarav.sharma@example.in"
                        value={signUpForm.email}
                        onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                        className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      {fieldErrors.email && <p className="text-rose-600 text-[10px] mt-0.5">{fieldErrors.email}</p>}
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 uppercase text-[10px]">10-Digit Mobile Number (+91)</label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="9988776655"
                          value={signUpForm.mobile}
                          onChange={(e) => setSignUpForm({ ...signUpForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      {fieldErrors.mobile && <p className="text-rose-600 text-[10px] mt-0.5">{fieldErrors.mobile}</p>}
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                        We will send a 6-digit WhatsApp OTP to this number for instant verification.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-800 uppercase text-[10px]">Password</label>
                        <div className="relative mt-1">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={signUpForm.password}
                            onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                            className="w-full p-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {fieldErrors.password && <p className="text-rose-600 text-[10px] mt-0.5">{fieldErrors.password}</p>}
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 uppercase text-[10px]">Confirm Password</label>
                        <div className="relative mt-1">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={signUpForm.confirmPassword}
                            onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                            className="w-full p-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {fieldErrors.confirmPassword && <p className="text-rose-600 text-[10px] mt-0.5">{fieldErrors.confirmPassword}</p>}
                      </div>
                    </div>

                    {signUpError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{signUpError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition-all text-sm mt-2 flex items-center justify-center gap-2"
                    >
                      {isSubmittingAuth ? (
                        <span>Sending WhatsApp OTP...</span>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          <span>Send WhatsApp OTP →</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* STEP 2: OTP VERIFICATION VIEW */
                  <form onSubmit={handleVerifySignupOtp} className="space-y-4 text-xs">
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center space-y-1.5">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        WhatsApp Verification Active
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Enter 6-Digit OTP Code</h3>
                      <p className="text-slate-600 text-[11px]">
                        Verification code sent to <span className="font-bold text-slate-900">+91 {signUpForm.mobile}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSignupStep('form');
                          setSignUpError(null);
                        }}
                        className="text-amber-700 hover:underline text-[11px] font-bold inline-flex items-center gap-1 mt-1"
                      >
                        <Edit className="w-3 h-3" />
                        Change mobile number or details
                      </button>
                    </div>

                    {/* OTP Input Field */}
                    <div>
                      <label className="font-bold text-slate-800 uppercase text-[10px] block mb-1 text-center">
                        6-Digit Security Code
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          autoFocus
                          placeholder="••••••"
                          value={signupOtp}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setSignupOtp(val);
                          }}
                          className="w-full py-3 px-4 bg-slate-50 border-2 border-slate-300 focus:border-amber-500 rounded-xl text-center text-2xl font-mono tracking-[0.4em] font-extrabold text-slate-900 focus:outline-none shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Resend & Timer Row */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <div className="flex items-center gap-1 text-slate-500 font-medium">
                        <Timer className="w-3.5 h-3.5" />
                        <span>
                          {signupOtpTimer > 0 ? (
                            <>Expires in <strong className="text-slate-800 font-mono">{formatTimer(signupOtpTimer)}</strong></>
                          ) : (
                            <span className="text-rose-600 font-bold">Code expired</span>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={!signupCanResend || isSubmittingAuth}
                        onClick={handleResendSignupOtp}
                        className={`font-bold inline-flex items-center gap-1 ${
                          signupCanResend && !isSubmittingAuth
                            ? 'text-amber-700 hover:underline cursor-pointer'
                            : 'text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <RefreshCw className={`w-3 h-3 ${isSubmittingAuth ? 'animate-spin' : ''}`} />
                        Resend WhatsApp OTP
                      </button>
                    </div>

                    {signUpError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{signUpError}</span>
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      <button
                        type="submit"
                        disabled={isSubmittingAuth || signupOtp.length !== 6}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-amber-400 disabled:text-slate-500 font-black rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isSubmittingAuth ? (
                          <span>Verifying Code & Creating Account...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify OTP & Create Account →</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSignupStep('form');
                          setSignUpError(null);
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                      >
                        ← Back to Edit Form
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* FORGOT PASSWORD FLOW */}
            {authMode === 'forgot' && (
              <div>
                {forgotStep === 'identifier' ? (
                  <form onSubmit={handleForgotRequestOtp} className="space-y-4 text-xs">
                    <p className="text-slate-600">
                      Enter your registered Email Address or 10-Digit Mobile Number. We will send a secure verification code to reset your password.
                    </p>

                    <div>
                      <label className="font-bold text-slate-800 uppercase text-[10px]">Email or Mobile Number</label>
                      <div className="relative mt-1">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="aarav@example.in or 9988776655"
                          value={forgotIdentifier}
                          onChange={(e) => setForgotIdentifier(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    {forgotError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{forgotError}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setForgotError(null);
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                      >
                        ← Back to Login
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingAuth}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmittingAuth ? 'Sending Code...' : 'Send Verification Code →'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* STEP 2: VERIFY OTP & RESET PASSWORD */
                  <form onSubmit={handleForgotVerifyAndReset} className="space-y-3.5 text-xs">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-xs">Reset Your Password</h4>
                      <p className="text-slate-600 text-[11px]">
                        Enter the 6-digit code sent to <strong className="text-slate-900">{forgotIdentifier}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep('identifier');
                          setResetError(null);
                        }}
                        className="text-amber-700 hover:underline text-[10px] font-bold inline-flex items-center gap-1"
                      >
                        Change Email / Mobile
                      </button>
                    </div>

                    {/* OTP Input */}
                    <div>
                      <label className="font-bold text-slate-800 uppercase text-[10px] block mb-1">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        autoFocus
                        placeholder="••••••"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl text-center font-mono tracking-[0.3em] font-extrabold text-lg text-slate-900 focus:outline-none"
                      />
                    </div>

                    {/* Timer & Resend */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Timer className="w-3.5 h-3.5" />
                        <span>
                          {forgotOtpTimer > 0 ? (
                            <>Expires in <strong className="text-slate-800 font-mono">{formatTimer(forgotOtpTimer)}</strong></>
                          ) : (
                            <span className="text-rose-600 font-bold">Expired</span>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={!forgotCanResend || isSubmittingAuth}
                        onClick={handleResendForgotOtp}
                        className={`font-bold inline-flex items-center gap-1 ${
                          forgotCanResend && !isSubmittingAuth ? 'text-amber-700 hover:underline' : 'text-slate-400'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        Resend Code
                      </button>
                    </div>

                    {/* New Passwords */}
                    <div>
                      <label className="font-bold text-slate-800 uppercase text-[10px]">New Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Min 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 uppercase text-[10px]">Confirm New Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="Re-type new password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full p-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {resetError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold text-[11px]">
                        {resetError}
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      <button
                        type="submit"
                        disabled={isSubmittingAuth}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl shadow-md transition-all text-sm"
                      >
                        {isSubmittingAuth ? 'Updating Password...' : 'Verify Code & Set New Password →'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setForgotStep('identifier');
                          setResetError(null);
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                      >
                        ← Cancel & Return to Login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* RESET PASSWORD FORM (DIRECT TOKEN FALLBACK) */}
            {authMode === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-800 uppercase text-[10px]">Reset Token / OTP</label>
                  <input
                    type="text"
                    required
                    placeholder="Token or 6-digit OTP code"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 uppercase text-[10px]">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="NewPassword123!"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 uppercase text-[10px]">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="NewPassword123!"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                {resetError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold">
                    {resetError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3 bg-slate-900 text-amber-400 font-bold rounded-xl"
                >
                  Update Password & Login →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LOGGED IN VIEW: CUSTOMER DASHBOARD
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{currentUser.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-bold text-[10px]">
                {currentUser.role === 'admin' ? '👑 Admin' : 'Customer'}
              </span>
            </div>
            <p className="text-xs text-amber-400 font-medium mt-0.5">
              {currentUser.email} • {currentUser.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            ← Back to Shop
          </button>

          <button
            onClick={logoutUser}
            className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-5 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'orders'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> My Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveSubTab('prescriptions')}
          className={`px-5 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'prescriptions'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Saved Prescriptions ({savedPrescriptions.length})
        </button>

        <button
          onClick={() => setActiveSubTab('addresses')}
          className={`px-5 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'addresses'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" /> Saved Addresses ({userAddresses.length})
        </button>

        <button
          onClick={() => setActiveSubTab('wishlist')}
          className={`px-5 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'wishlist'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Heart className="w-4 h-4" /> Wishlist ({wishlistedProducts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-5 py-3 font-bold text-xs rounded-t-2xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'settings'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserIcon className="w-4 h-4" /> Account Settings
        </button>
      </div>

      {/* Sub-Tab 1: Orders History & Live Shiprocket Tracking */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          {/* Order Status Filters */}
          {orders.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(
                  [
                    { id: 'all', label: 'All Orders', count: orders.length },
                    {
                      id: 'active',
                      label: 'Confirmed & Processing',
                      count: orders.filter((o) =>
                        ['Confirmed', 'Prescription Verification', 'Processing', 'Manufacturing', 'Ready to Dispatch'].includes(o.status)
                      ).length,
                    },
                    {
                      id: 'in_transit',
                      label: 'In Transit / Shipped',
                      count: orders.filter((o) => o.status === 'Shipped').length,
                    },
                    {
                      id: 'delivered',
                      label: 'Delivered',
                      count: orders.filter((o) => o.status === 'Delivered').length,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderStatusFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      orderStatusFilter === tab.id
                        ? 'bg-slate-900 text-amber-400 shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        orderStatusFilter === tab.id
                          ? 'bg-slate-800 text-amber-400'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>Powered by <strong>Shiprocket Logistics</strong></span>
              </div>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-900">No orders placed yet</h3>
              <p className="text-xs text-slate-500">
                Explore our eyeglasses and sunglasses catalog to configure your complete spectacles.
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                Start Shopping →
              </button>
            </div>
          ) : (
            orders
              .filter((ord) => {
                if (orderStatusFilter === 'active') {
                  return ['Confirmed', 'Prescription Verification', 'Processing', 'Manufacturing', 'Ready to Dispatch'].includes(ord.status);
                }
                if (orderStatusFilter === 'in_transit') {
                  return ord.status === 'Shipped';
                }
                if (orderStatusFilter === 'delivered') {
                  return ord.status === 'Delivered';
                }
                return true;
              })
              .map((ord) => {
                const courierName = ord.shipment?.courierName || 'Blue Dart Express (Shiprocket Partner)';
                const awbNumber = ord.shipment?.awbNumber || `SR${ord.orderNumber.replace(/\D/g, '').padEnd(9, '849201')}`;
                const isDelivered = ord.status === 'Delivered';
                const isShipped = ord.status === 'Shipped';
                const isProcessing = ['Processing', 'Manufacturing', 'Ready to Dispatch'].includes(ord.status);

                // Stage index for mini timeline (0 to 3)
                const miniStepIndex = isDelivered ? 3 : isShipped ? 2 : isProcessing ? 1 : 0;

                return (
                  <div key={ord.id} className="bg-white p-6 rounded-3xl border border-slate-200/90 space-y-4 shadow-xs hover:border-slate-300 transition-all">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-sm">Order #{ord.orderNumber}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            AWB: {awbNumber}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span>•</span>
                          <span>{ord.items.length} {ord.items.length === 1 ? 'Frame' : 'Frames'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full font-extrabold text-xs flex items-center gap-1.5 ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isShipped
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : isProcessing
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isDelivered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {isShipped && <Plane className="w-3.5 h-3.5 text-purple-600" />}
                          {isProcessing && <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                          {!isDelivered && !isShipped && !isProcessing && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                          <span>{ord.status}</span>
                        </span>

                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-extrabold text-[10px]">
                          FREE DELIVERY (₹0)
                        </span>
                      </div>
                    </div>

                    {/* Shiprocket Mini Timeline & Tracking Action Bar */}
                    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs">
                          <Truck className="w-4 h-4 text-amber-600" />
                          <div className="text-slate-700 font-semibold">
                            Courier: <strong className="text-slate-900">{courierName}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyAwb(awbNumber, ord.orderNumber)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>{copiedAwbOrderNum === ord.orderNumber ? 'AWB Copied!' : 'Copy AWB'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenOrderTracking(ord)}
                            disabled={loadingTrackingOrderId === ord.id}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {loadingTrackingOrderId === ord.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <span>Track with Shiprocket</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 4-Stage Mini Progress Bar */}
                      <div className="pt-2">
                        <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                          {[
                            { label: 'Confirmed', desc: 'Payment Verified' },
                            { label: 'Prescription QC', desc: 'Lab Edging' },
                            { label: 'In Transit', desc: 'Air Express' },
                            { label: 'Delivered', desc: 'Doorstep Handover' },
                          ].map((step, sIdx) => {
                            const isDone = sIdx <= miniStepIndex;
                            const isCur = sIdx === miniStepIndex;

                            return (
                              <div key={sIdx} className="space-y-1">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    isCur ? 'bg-amber-500' : isDone ? 'bg-slate-900' : 'bg-slate-200'
                                  }`}
                                />
                                <span
                                  className={`font-bold block ${
                                    isCur ? 'text-amber-600' : isDone ? 'text-slate-800' : 'text-slate-400'
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Ordered Spectacles Items List */}
                    <div className="space-y-2">
                      {ord.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={item.configuration.frameImage}
                              alt=""
                              className="w-12 h-12 object-contain bg-white p-1 rounded-xl border border-slate-100"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{item.configuration.productName}</div>
                              <div className="text-[11px] text-amber-700 font-semibold">
                                {item.configuration.lensTypeName} • {item.configuration.materialName || 'Standard 1.56'}
                                {item.configuration.coatingName ? ` • ${item.configuration.coatingName}` : ''}
                              </div>
                              <div className="text-[10px] text-slate-400">Qty: {item.quantity}</div>
                            </div>
                          </div>
                          <div className="font-extrabold text-slate-900 text-sm">
                            ₹{item.totalPrice.toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer / Address & Total */}
                    <div className="flex flex-wrap justify-between items-center text-xs pt-2 border-t border-slate-100 gap-2">
                      <div className="text-slate-500">
                        Delivering to:{' '}
                        <strong className="text-slate-800">
                          {ord.deliveryAddress.name}, {ord.deliveryAddress.city}, {ord.deliveryAddress.state} ({ord.deliveryAddress.pinCode})
                        </strong>
                      </div>
                      <div className="font-black text-slate-900 text-sm">
                        Total Amount: ₹{ord.totalAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Sub-Tab 2: Saved Prescriptions Manager */}
      {activeSubTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Your Saved Family Prescriptions</h3>
              <p className="text-xs text-slate-500">
                Keep prescriptions saved for fast single-click eyewear customization.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddRx(!showAddRx)}
                className="px-4 py-2 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Manual Rx
              </button>
            </div>
          </div>

          {/* Prescription Upload Simulation */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-600" /> Upload Prescription Slip (PDF / Image)
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="prescription_slip_doctor.png"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
              />
              <button
                onClick={handleFileUpload}
                disabled={!uploadFileName}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl disabled:opacity-50"
              >
                Upload & Verify Slip
              </button>
            </div>
            {uploadMessage && (
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                {uploadMessage}
              </p>
            )}
          </div>

          {showAddRx && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-md">
              <h4 className="font-bold text-slate-900 text-xs uppercase">New Prescription Details</h4>
              <PrescriptionForm
                requiresPrescription={true}
                onPrescriptionChange={(rx) => {
                  if (rx) {
                    addPrescriptionApi({
                      title: 'My Custom Prescription',
                      odRight: rx.odRight,
                      osLeft: rx.osLeft,
                      pd: rx.pd,
                    });
                    setShowAddRx(false);
                  }
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPrescriptions.map((rx) => (
              <div key={rx.id} className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-slate-900 text-sm">{rx.title || 'Family Prescription'}</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {rx.verificationStatus}
                    </span>
                    <button
                      onClick={() => deletePrescriptionApi(rx.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Prescription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <div className="font-extrabold text-amber-700 uppercase text-[10px]">Right Eye (OD)</div>
                    <div className="text-slate-800 font-semibold mt-0.5">
                      SPH: {rx.odRight.sph} | CYL: {rx.odRight.cyl || 0} | Axis: {rx.odRight.axis || 0}°
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <div className="font-extrabold text-amber-700 uppercase text-[10px]">Left Eye (OS)</div>
                    <div className="text-slate-800 font-semibold mt-0.5">
                      SPH: {rx.osLeft.sph} | CYL: {rx.osLeft.cyl || 0} | Axis: {rx.osLeft.axis || 0}°
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-1">
                  <div>
                    PD: <strong className="text-slate-900">{rx.pd} mm</strong>
                  </div>
                  {rx.uploadedFilePath && (
                    <a
                      href={`/api/prescriptions/file/${rx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Uploaded Slip
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Saved Addresses Manager */}
      {activeSubTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Saved Delivery Addresses</h3>
              <p className="text-xs text-slate-500">6-Digit Indian PIN code validated addresses</p>
            </div>
            <button
              onClick={() => setShowAddAddr(!showAddAddr)}
              className="px-4 py-2 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Address
            </button>
          </div>

          {showAddAddr && (
            <form onSubmit={handleAddAddressSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" /> Add New Indian Delivery Address
                </h4>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Auto-fetches City & State
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={addrForm.name || ''}
                    onChange={(e) => setAddrForm({ ...addrForm, name: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Mobile Number (10 digits)</label>
                  <input
                    type="text"
                    required
                    placeholder="10-Digit Mobile"
                    value={addrForm.phone || ''}
                    onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* PIN Code Field */}
                <div className="sm:col-span-2 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      6-Digit Indian PIN Code <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Auto-populates Indian City & State</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit PIN (e.g., 560038, 110001, 400001)"
                      value={addrForm.pinCode || ''}
                      onChange={(e) => handleAddrPinChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-amber-300 font-mono font-bold text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-amber-500 outline-none pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isAddrPinLoading ? (
                        <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                      ) : addrForm.city && addrForm.pinCode?.length === 6 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : null}
                    </div>
                  </div>

                  {/* Status feedback */}
                  {addrPinMessage && (
                    <div
                      className={`text-[11px] font-semibold flex items-center gap-1.5 pt-0.5 ${
                        addrPinMessage.type === 'success'
                          ? 'text-emerald-700'
                          : addrPinMessage.type === 'info'
                          ? 'text-amber-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {addrPinMessage.type === 'success' && <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      {addrPinMessage.text}
                    </div>
                  )}

                  {/* Suggested Locality Tags */}
                  {addrPinDetails && addrPinDetails.localities && addrPinDetails.localities.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">Suggested Areas / Localities:</div>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                        {addrPinDetails.localities.map((loc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const current = addrForm.streetLocality || '';
                              if (!current.includes(loc)) {
                                setAddrForm((prev) => ({
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
                    required
                    placeholder="Flat / House No. / Building"
                    value={addrForm.houseFlat || ''}
                    onChange={(e) => setAddrForm({ ...addrForm, houseFlat: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Street / Locality</label>
                  <input
                    type="text"
                    required
                    placeholder="Street / Locality"
                    value={addrForm.streetLocality || ''}
                    onChange={(e) => setAddrForm({ ...addrForm, streetLocality: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="Landmark (e.g. Near Metro Station)"
                    value={addrForm.landmark || ''}
                    onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center justify-between">
                    <span>City (Auto-fetched)</span>
                    {addrForm.city && <span className="text-[9px] text-emerald-600 font-bold">✓ Verified</span>}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={addrForm.city || ''}
                    onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center justify-between">
                    <span>State (Auto-fetched)</span>
                    {addrForm.state && <span className="text-[9px] text-emerald-600 font-bold">✓ Verified</span>}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={addrForm.state || ''}
                    onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              {addrError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
                  {addrError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddr(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl shadow-sm hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userAddresses.map((addr) => (
              <div key={addr.id} className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 text-xs shadow-xs">
                <div className="font-extrabold text-slate-900 flex justify-between items-center">
                  <span>
                    {addr.name} ({addr.phone})
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-slate-600 leading-relaxed">
                  {addr.houseFlat}, {addr.streetLocality},{' '}
                  {addr.landmark ? `${addr.landmark}, ` : ''}
                  {addr.city}, {addr.state} - <strong className="text-slate-900">{addr.pinCode}</strong>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  {!addr.isDefault && (
                    <button
                      onClick={() => setDefaultAddressApi(addr.id)}
                      className="text-amber-700 hover:underline font-bold text-[11px]"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteAddressApi(addr.id)}
                    className="text-rose-600 hover:underline font-bold text-[11px] ml-auto flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Wishlist */}
      {activeSubTab === 'wishlist' && (
        <div className="space-y-4">
          {wishlistedProducts.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Heart className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-900">Your Wishlist is Empty</h3>
              <p className="text-xs text-slate-500">Save frames you love by clicking the heart icon while browsing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistedProducts.map((p) => (
                <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3">
                  <img src={p.images[0]} alt="" className="w-full h-40 object-contain bg-slate-50 rounded-2xl p-4" />
                  <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                  <div className="text-amber-700 font-extrabold">₹{p.price.toLocaleString('en-IN')}</div>
                  <button
                    onClick={() => openConfigurator(p)}
                    className="w-full py-2 bg-slate-900 text-amber-400 text-xs font-bold rounded-xl"
                  >
                    Customise Lenses →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 5: Account Settings */}
      {activeSubTab === 'settings' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-xl space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase">Account Settings & Profile</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-800 uppercase text-[10px]">First Name</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 uppercase text-[10px]">Last Name</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 uppercase text-[10px]">Email Address</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 uppercase text-[10px]">Mobile Number</label>
              <input
                type="text"
                value={profileForm.mobile}
                onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {profileMessage && (
              <p className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold">
                {profileMessage}
              </p>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl shadow-sm"
            >
              Update Profile Details
            </button>
          </form>
        </div>
      )}

      {/* Shiprocket Live Order Tracking Modal */}
      <ShiprocketOrderTrackingModal
        isOpen={isTrackingModalOpen}
        tracking={selectedOrderTracking}
        order={selectedOrderForModal}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setSelectedOrderTracking(null);
          setSelectedOrderForModal(null);
        }}
      />
    </div>
  );
};
