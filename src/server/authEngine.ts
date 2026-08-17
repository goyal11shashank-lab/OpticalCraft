/**
 * OptiCraft Eyewear - Customer Authentication & Security Engine
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db.js';
import { User } from '../types.js';
import { logger } from './logger.js';
import { sendAuthkeyWhatsAppOtp } from './whatsappAuthkeyService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'opticraft_eyewear_jwt_secret_key_2026';
const JWT_EXPIRES_IN = '7d';

// In-Memory Password Reset Tokens Map: token -> { userId: string, expiresAt: number }
interface ResetTokenRecord {
  userId: string;
  expiresAt: number;
}
export const passwordResetTokens = new Map<string, ResetTokenRecord>();

// OTP Verifications Store (Signup & Password Reset)
interface OtpSessionRecord {
  key: string;
  identifier: string;
  purpose: 'signup' | 'reset';
  otpHash: string;
  expiresAt: number;
  attempts: number;
  formData?: SignupInput;
  userId?: string;
}
export const otpSessions = new Map<string, OtpSessionRecord>();

export function hashPassword(plainText: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainText, salt);
}

export function comparePassword(plainText: string, hash: string): boolean {
  if (!hash) return false;
  return bcrypt.compareSync(plainText, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: 'customer' | 'admin' } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (err) {
    return null;
  }
}

export interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
  debugOtp?: string;
  debugResetToken?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Customer Sign Up
 */
export function signUpUser(input: SignupInput): AuthResult {
  const { firstName, lastName, email, mobile, password, confirmPassword } = input;
  const fieldErrors: Record<string, string> = {};

  if (!firstName || !firstName.trim()) {
    fieldErrors.firstName = 'First name is required.';
  }
  if (!lastName || !lastName.trim()) {
    fieldErrors.lastName = 'Last name is required.';
  }

  const cleanEmail = email ? email.trim().toLowerCase() : '';
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    fieldErrors.email = 'Please enter a valid email address.';
  }

  // Indian mobile validation: 10 digits starting with 6, 7, 8, or 9
  const cleanMobile = mobile ? mobile.trim().replace(/^(\+91|91|0)/, '') : '';
  if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
    fieldErrors.mobile = 'Please enter a valid 10-digit Indian mobile number.';
  }

  if (!password || password.length < 6) {
    fieldErrors.password = 'Password must be at least 6 characters long.';
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    fieldErrors.confirmPassword = 'Passwords do not match.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Please fix the errors in the form.', fieldErrors };
  }

  // Check existing users
  const existingUsers = Array.from(db.users.values());
  const emailExists = existingUsers.some((u) => u.email.toLowerCase() === cleanEmail);
  if (emailExists) {
    return {
      success: false,
      error: 'An account with this email address already exists. Please log in.',
      fieldErrors: { email: 'Email is already registered.' },
    };
  }

  const formattedPhone = `+91 ${cleanMobile}`;
  const phoneExists = existingUsers.some(
    (u) => u.phone.replace(/\D/g, '').endsWith(cleanMobile)
  );
  if (phoneExists) {
    return {
      success: false,
      error: 'An account with this mobile number already exists.',
      fieldErrors: { mobile: 'Mobile number is already registered.' },
    };
  }

  const newUser: User = {
    id: `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    name: `${firstName.trim()} ${lastName.trim()}`,
    email: cleanEmail,
    phone: formattedPhone,
    passwordHash: hashPassword(password),
    role: 'customer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.set(newUser.id, newUser);
  const token = generateToken(newUser);

  // Return clean user object without passwordHash
  const userSafe = { ...newUser };
  delete userSafe.passwordHash;

  return {
    success: true,
    token,
    user: userSafe,
  };
}

/**
 * Send WhatsApp OTP for Customer Signup via Authkey.io
 */
export async function sendSignupOtp(input: SignupInput): Promise<AuthResult> {
  const { firstName, lastName, email, mobile, password, confirmPassword } = input;
  const fieldErrors: Record<string, string> = {};

  if (!firstName || !firstName.trim()) {
    fieldErrors.firstName = 'First name is required.';
  }
  if (!lastName || !lastName.trim()) {
    fieldErrors.lastName = 'Last name is required.';
  }

  const cleanEmail = email ? email.trim().toLowerCase() : '';
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    fieldErrors.email = 'Please enter a valid email address.';
  }

  const cleanMobile = mobile ? mobile.trim().replace(/^(\+91|91|0)/, '') : '';
  if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
    fieldErrors.mobile = 'Please enter a valid 10-digit Indian mobile number.';
  }

  if (!password || password.length < 6) {
    fieldErrors.password = 'Password must be at least 6 characters long.';
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    fieldErrors.confirmPassword = 'Passwords do not match.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Please fix the errors in the form.', fieldErrors };
  }

  // Check if email or mobile already registered
  const existingUsers = Array.from(db.users.values());
  if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return {
      success: false,
      error: 'An account with this email address already exists. Please log in.',
      fieldErrors: { email: 'Email is already registered.' },
    };
  }

  if (existingUsers.some((u) => u.phone.replace(/\D/g, '').endsWith(cleanMobile))) {
    return {
      success: false,
      error: 'An account with this mobile number already exists.',
      fieldErrors: { mobile: 'Mobile number is already registered.' },
    };
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  // Store in OTP session with 2 minutes validity (120 seconds)
  const sessionKey = `signup:${cleanMobile}`;
  otpSessions.set(sessionKey, {
    key: sessionKey,
    identifier: cleanMobile,
    purpose: 'signup',
    otpHash,
    expiresAt: Date.now() + 2 * 60 * 1000,
    attempts: 0,
    formData: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password,
    },
  });

  // Send real WhatsApp message via Authkey.io
  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  const whatsappResult = await sendAuthkeyWhatsAppOtp({
    mobile: cleanMobile,
    otp,
    name: fullName,
    purpose: 'signup',
  });

  if (!whatsappResult.success && whatsappResult.error) {
    logger.warn(`[AUTH OTP] Authkey WhatsApp delivery issue: ${whatsappResult.error}`);
  }

  logger.info(`[AUTH OTP] Dispatched WhatsApp OTP for signup to +91 ${cleanMobile}`);

  return {
    success: true,
    message: `WhatsApp verification code sent to +91 ${cleanMobile}.`,
  };
}

/**
 * Verify Signup OTP & Create Account
 */
export function verifySignupOtp(mobile: string, otp: string, inputOverride?: Partial<SignupInput>): AuthResult {
  if (!mobile || !otp) {
    return { success: false, error: 'Mobile number and OTP code are required.' };
  }

  const cleanMobile = mobile.trim().replace(/^(\+91|91|0)/, '');
  const sessionKey = `signup:${cleanMobile}`;
  const record = otpSessions.get(sessionKey);

  if (!record || record.purpose !== 'signup') {
    return { success: false, error: 'Verification session expired or not found. Please request a new OTP.' };
  }

  if (Date.now() > record.expiresAt) {
    otpSessions.delete(sessionKey);
    return { success: false, error: 'OTP code has expired. Please request a new OTP.' };
  }

  if (record.attempts >= 3) {
    otpSessions.delete(sessionKey);
    return { success: false, error: 'Maximum attempts exceeded. Please request a new OTP.' };
  }

  const submittedHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
  if (submittedHash !== record.otpHash) {
    record.attempts += 1;
    return { success: false, error: `Invalid OTP code. (${3 - record.attempts} attempts remaining)` };
  }

  // OTP is valid!
  otpSessions.delete(sessionKey);

  const form = { ...record.formData, ...inputOverride } as SignupInput;
  if (!form || !form.email || !form.password) {
    return { success: false, error: 'Incomplete registration details. Please restart signup.' };
  }

  const formattedPhone = `+91 ${cleanMobile}`;
  const newUser: User = {
    id: `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    name: `${form.firstName} ${form.lastName}`,
    email: form.email.toLowerCase(),
    phone: formattedPhone,
    passwordHash: hashPassword(form.password),
    role: 'customer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.set(newUser.id, newUser);
  const token = generateToken(newUser);

  const userSafe = { ...newUser };
  delete userSafe.passwordHash;

  return {
    success: true,
    token,
    user: userSafe,
    message: 'Welcome to OptiCraft Eyewear! Your account has been verified.',
  };
}

/**
 * Send Password Reset OTP via Authkey.io
 */
export async function requestPasswordResetOtp(identifier: string): Promise<AuthResult> {
  const genericMessage = 'If an account exists for these details, a verification code has been sent.';
  if (!identifier || !identifier.trim()) {
    return { success: true, message: genericMessage };
  }

  const cleanId = identifier.trim().toLowerCase();
  const digitsOnly = cleanId.replace(/\D/g, '');

  const user = Array.from(db.users.values()).find((u) => {
    if (u.email.toLowerCase() === cleanId) return true;
    if (digitsOnly.length >= 10 && u.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-10))) return true;
    return false;
  });

  if (!user) {
    return { success: true, message: genericMessage };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const sessionKey = `reset:${user.id}`;

  otpSessions.set(sessionKey, {
    key: sessionKey,
    identifier: user.email,
    purpose: 'reset',
    otpHash,
    expiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes
    attempts: 0,
    userId: user.id,
  });

  // Also maintain token for backwards compatibility
  const resetToken = `rst-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  passwordResetTokens.set(resetToken, {
    userId: user.id,
    expiresAt: Date.now() + 60 * 60 * 1000,
  });

  // Send WhatsApp message to user's registered phone
  if (user.phone) {
    const cleanUserPhone = user.phone.replace(/\D/g, '').replace(/^91/, '').slice(-10);
    if (/^[6-9]\d{9}$/.test(cleanUserPhone)) {
      await sendAuthkeyWhatsAppOtp({
        mobile: cleanUserPhone,
        otp,
        name: user.name,
        purpose: 'reset',
      });
    }
  }

  logger.info(`[AUTH OTP] Dispatched Password Reset OTP for ${user.email} / ${user.phone}`);

  return {
    success: true,
    message: `Verification code sent to your registered contact (${user.email.slice(0, 3)}***@${user.email.split('@')[1]}).`,
    debugResetToken: resetToken,
  };
}

/**
 * Verify Password Reset OTP and update password
 */
export function verifyResetPasswordOtp(
  identifier: string,
  otp: string,
  newPassword: string,
  confirmPassword?: string
): AuthResult {
  if (!identifier || !otp || !newPassword) {
    return { success: false, error: 'Email/Mobile, OTP code, and new password are required.' };
  }

  const cleanId = identifier.trim().toLowerCase();
  const digitsOnly = cleanId.replace(/\D/g, '');

  const user = Array.from(db.users.values()).find((u) => {
    if (u.email.toLowerCase() === cleanId) return true;
    if (digitsOnly.length >= 10 && u.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-10))) return true;
    return false;
  });

  if (!user) {
    return { success: false, error: 'No account found matching these details.' };
  }

  const sessionKey = `reset:${user.id}`;
  const record = otpSessions.get(sessionKey);

  if (!record || record.purpose !== 'reset') {
    return { success: false, error: 'Password reset session expired. Please request a new OTP code.' };
  }

  if (Date.now() > record.expiresAt) {
    otpSessions.delete(sessionKey);
    return { success: false, error: 'OTP code has expired. Please request a new code.' };
  }

  if (record.attempts >= 3) {
    otpSessions.delete(sessionKey);
    return { success: false, error: 'Maximum attempts exceeded. Please request a new code.' };
  }

  const submittedHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
  if (submittedHash !== record.otpHash) {
    record.attempts += 1;
    return { success: false, error: `Invalid verification code. (${3 - record.attempts} attempts remaining)` };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  // Update user password
  user.passwordHash = hashPassword(newPassword);
  user.updatedAt = new Date().toISOString();
  db.users.set(user.id, user);

  otpSessions.delete(sessionKey);

  const token = generateToken(user);
  const userSafe = { ...user };
  delete userSafe.passwordHash;

  return {
    success: true,
    token,
    user: userSafe,
    message: 'Your password has been successfully reset. You are now logged in.',
  };
}

/**
 * Customer Login (Email or Mobile)
 */
export function loginUser(identifier: string, password: string): AuthResult {
  if (!identifier || !identifier.trim() || !password) {
    return { success: false, error: 'Email/Mobile and Password are required.' };
  }

  const cleanId = identifier.trim().toLowerCase();
  const digitsOnly = cleanId.replace(/\D/g, '');

  const user = Array.from(db.users.values()).find((u) => {
    if (u.email.toLowerCase() === cleanId) return true;
    if (digitsOnly.length >= 10 && u.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-10))) return true;
    return false;
  });

  if (!user || !user.passwordHash || !comparePassword(password, user.passwordHash)) {
    return { success: false, error: 'Invalid login credentials. Please check your email/mobile and password.' };
  }

  const token = generateToken(user);
  const userSafe = { ...user };
  delete userSafe.passwordHash;

  return {
    success: true,
    token,
    user: userSafe,
  };
}

/**
 * Forgot Password - Generates reset token without revealing user existence
 */
export function requestPasswordReset(identifier: string): { success: boolean; message: string; debugResetToken?: string } {
  const genericMessage = 'If an account exists for these details, password reset instructions have been sent.';
  if (!identifier || !identifier.trim()) {
    return { success: true, message: genericMessage };
  }

  const cleanId = identifier.trim().toLowerCase();
  const digitsOnly = cleanId.replace(/\D/g, '');

  const user = Array.from(db.users.values()).find((u) => {
    if (u.email.toLowerCase() === cleanId) return true;
    if (digitsOnly.length >= 10 && u.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-10))) return true;
    return false;
  });

  if (!user) {
    return { success: true, message: genericMessage };
  }

  // Create expiring reset token (1 hour)
  const resetToken = `rst-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  passwordResetTokens.set(resetToken, {
    userId: user.id,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return {
    success: true,
    message: genericMessage,
    ...(process.env.NODE_ENV !== 'production' ? { debugResetToken: resetToken } : {}),
  };
}

/**
 * Reset Password using Token
 */
export function resetPassword(resetToken: string, newPassword: string, confirmPassword?: string): AuthResult {
  if (!resetToken) {
    return { success: false, error: 'Reset token is required.' };
  }

  const record = passwordResetTokens.get(resetToken);
  if (!record) {
    return { success: false, error: 'Invalid or expired password reset token.' };
  }

  if (Date.now() > record.expiresAt) {
    passwordResetTokens.delete(resetToken);
    return { success: false, error: 'Password reset token has expired. Please request a new one.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  const user = db.users.get(record.userId);
  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  user.passwordHash = hashPassword(newPassword);
  user.updatedAt = new Date().toISOString();
  db.users.set(user.id, user);

  // Clear token after single use
  passwordResetTokens.delete(resetToken);

  const token = generateToken(user);
  const userSafe = { ...user };
  delete userSafe.passwordHash;

  return {
    success: true,
    token,
    user: userSafe,
  };
}

/**
 * Update Profile
 */
export function updateProfile(
  userId: string,
  input: { firstName?: string; lastName?: string; email?: string; mobile?: string }
): AuthResult {
  const user = db.users.get(userId);
  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  if (input.firstName || input.lastName) {
    const currentParts = user.name.split(' ');
    const first = input.firstName?.trim() || currentParts[0] || '';
    const last = input.lastName?.trim() || currentParts.slice(1).join(' ') || '';
    user.name = `${first} ${last}`.trim();
  }

  if (input.email && input.email.trim() !== user.email) {
    const cleanEmail = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'Invalid email address.' };
    }
    const emailExists = Array.from(db.users.values()).some((u) => u.id !== userId && u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return { success: false, error: 'Email address is already in use by another account.' };
    }
    user.email = cleanEmail;
  }

  if (input.mobile) {
    const cleanMobile = input.mobile.trim().replace(/^(\+91|91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return { success: false, error: 'Invalid 10-digit Indian mobile number.' };
    }
    user.phone = `+91 ${cleanMobile}`;
  }

  user.updatedAt = new Date().toISOString();
  db.users.set(user.id, user);

  const userSafe = { ...user };
  delete userSafe.passwordHash;

  return { success: true, user: userSafe };
}
