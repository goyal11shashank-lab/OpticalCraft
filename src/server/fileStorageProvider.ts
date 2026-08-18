/**
 * OptiCraft Eyewear - Private File Storage Provider (Phase 9A)
 * 
 * Provides storage abstraction for sensitive prescription files and documents.
 * Enforces file size limits (max 10MB), mime type validation, and secure private path generation.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrescriptionFileMetadata } from '../types.js';

export interface FileUploadInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  customerId?: string;
  prescriptionId?: string;
  orderId?: string;
}

export class LocalFileStorageProvider {
  private storageDir: string;
  private maxFileSizeBytes = 10 * 1024 * 1024; // 10MB Strict Limit
  private allowedMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]);

  constructor(customDir?: string) {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    this.storageDir = customDir || (isProd ? path.join('/tmp', 'private_uploads', 'prescriptions') : path.join(process.cwd(), 'data', 'private_uploads', 'prescriptions'));
    if (!isProd) {
      this.ensureStorageDir();
    }
  }

  private ensureStorageDir() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch (err) {
      console.warn('[STORAGE] Could not ensure directory:', err);
    }
  }

  public async upload(input: FileUploadInput): Promise<{
    storageKey: string;
    url: string;
    metadata: PrescriptionFileMetadata;
  }> {
    // 1. File Size Validation
    if (input.buffer.length > this.maxFileSizeBytes) {
      throw new Error(`File size (${(input.buffer.length / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of 10MB.`);
    }

    // 2. Mime Type Validation
    const normalizedMime = input.mimeType.toLowerCase();
    if (!this.allowedMimeTypes.has(normalizedMime)) {
      throw new Error(`Invalid file type (${input.mimeType}). Only PDF, JPG, PNG, and WebP prescription documents are allowed.`);
    }

    // 3. Generate Non-predictable Storage Key
    const fileExt = path.extname(input.filename) || (normalizedMime === 'application/pdf' ? '.pdf' : '.jpg');
    const randomHash = crypto.randomBytes(16).toString('hex');
    const storageKey = `rx_sec_${Date.now()}_${randomHash}${fileExt}`;
    const destinationPath = path.join(this.storageDir, storageKey);

    // 4. Write File Safely
    await fs.promises.writeFile(destinationPath, input.buffer);

    const metadata: PrescriptionFileMetadata = {
      id: `rxmeta-${Date.now()}-${randomHash.substring(0, 8)}`,
      prescriptionId: input.prescriptionId,
      customerId: input.customerId,
      orderId: input.orderId,
      storageKey,
      filename: input.filename,
      mimeType: normalizedMime,
      size: input.buffer.length,
      createdAt: new Date().toISOString(),
    };

    return {
      storageKey,
      url: `/api/prescriptions/files/${storageKey}`,
      metadata,
    };
  }

  public async download(storageKey: string): Promise<{
    buffer: Buffer;
    mimeType: string;
    filename: string;
  }> {
    // Prevent path traversal attacks
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.storageDir, safeKey);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Prescription file with storage key '${storageKey}' was not found.`);
    }

    const buffer = await fs.promises.readFile(filePath);
    const ext = path.extname(safeKey).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    if (ext === '.webp') mimeType = 'image/webp';

    return {
      buffer,
      mimeType,
      filename: safeKey,
    };
  }

  public async delete(storageKey: string): Promise<boolean> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.storageDir, safeKey);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  public getPrivateUrl(storageKey: string): string {
    return `/api/prescriptions/files/${storageKey}`;
  }
}

export const fileStorage = new LocalFileStorageProvider();
