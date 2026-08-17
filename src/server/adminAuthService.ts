/**
 * OptiCraft Eyewear - Admin Authentication & RBAC Engine
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { AdminUser, AdminRole } from '../types.js';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'opticraft_admin_secure_jwt_secret_987654321';

export interface AdminAuthenticatedRequest extends Request {
  adminUser?: AdminUser;
}

/**
 * Role Permission Hierarchy matrix
 */
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: [
    'dashboard:view',
    'orders:view', 'orders:manage', 'orders:status', 'orders:notes',
    'prescriptions:view', 'prescriptions:verify',
    'products:view', 'products:manage',
    'catalog:view', 'catalog:manage',
    'inventory:view', 'inventory:manage',
    'shipments:view', 'shipments:manage',
    'audit:view',
    'users:manage',
  ],
  ADMIN: [
    'dashboard:view',
    'orders:view', 'orders:manage', 'orders:status', 'orders:notes',
    'prescriptions:view', 'prescriptions:verify',
    'products:view', 'products:manage',
    'catalog:view', 'catalog:manage',
    'inventory:view', 'inventory:manage',
    'shipments:view', 'shipments:manage',
    'audit:view',
  ],
  OPERATIONS: [
    'dashboard:view',
    'orders:view', 'orders:manage', 'orders:status', 'orders:notes',
    'prescriptions:view', 'prescriptions:verify',
    'inventory:view',
    'shipments:view', 'shipments:manage',
  ],
  CATALOG_MANAGER: [
    'dashboard:view',
    'products:view', 'products:manage',
    'catalog:view', 'catalog:manage',
    'inventory:view', 'inventory:manage',
  ],
};

export function loginAdminStaff(email: string, password: string): { success: boolean; token?: string; adminUser?: AdminUser; error?: string } {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  // Find staff user by email
  let matchedStaff: (AdminUser & { passwordHash: string }) | undefined;
  for (const staff of db.adminUsers.values()) {
    if (staff.email.toLowerCase() === email.trim().toLowerCase()) {
      matchedStaff = staff;
      break;
    }
  }

  if (!matchedStaff) {
    return { success: false, error: 'Invalid admin credentials or role authorization.' };
  }

  const isPasswordValid = bcrypt.compareSync(password, matchedStaff.passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: 'Invalid admin credentials or role authorization.' };
  }

  const payload = {
    id: matchedStaff.id,
    name: matchedStaff.name,
    email: matchedStaff.email,
    role: matchedStaff.role,
    isStaffAdmin: true,
  };

  const token = jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '12h' });

  const { passwordHash, ...cleanAdminUser } = matchedStaff;

  return {
    success: true,
    token,
    adminUser: cleanAdminUser,
  };
}

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as any;
    if (!decoded || !decoded.isStaffAdmin || !decoded.id) {
      return null;
    }

    const staff = db.adminUsers.get(decoded.id);
    if (!staff) return null;

    const { passwordHash, ...cleanAdminUser } = staff;
    return cleanAdminUser;
  } catch {
    return null;
  }
}

/**
 * Middleware enforcing Admin Authentication & optional Role Authorization
 */
export function requireAdminRole(allowedRoles?: AdminRole[]) {
  return (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const adminHeader = req.headers['x-admin-token'] as string;
    const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) || adminHeader;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication token required.' });
    }

    const adminUser = verifyAdminToken(token);
    if (!adminUser) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired admin session token.' });
    }

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(adminUser.role) && adminUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: `Forbidden: Admin role '${adminUser.role}' is not authorized for this operation.`,
        });
      }
    }

    req.adminUser = adminUser;
    next();
  };
}
