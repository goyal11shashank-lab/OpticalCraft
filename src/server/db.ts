/**
 * OptiCraft Eyewear - Production Data Persistence & Relational DAL Layer
 * 
 * Production PostgreSQL database connectivity for Netlify Functions, Cloud Run, and Node environments.
 * Ensures PostgreSQL is the persistent single source of truth in production without unrequested schema alterations.
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { getConnectionString } from '@netlify/database';
import {
  User,
  Address,
  Product,
  LensType,
  LensMaterial,
  Coating,
  Prescription,
  Cart,
  SavedForLaterItem,
  Order,
  InventoryRecord,
  AdminUser,
  OrderNote,
  ShipmentRecord,
  InventoryTransaction,
  AuditLogRecord,
  CancellationRecord,
  ReturnRecord,
  PaymentRecord,
  NotificationRecord,
  PrescriptionFileMetadata,
  OrderStatus,
} from '../types.js';

export type DatabaseProviderSource = 'NETLIFY_DATABASE' | 'NETLIFY_DB_URL' | 'DATABASE_URL' | 'NONE';

export interface ResolvedDatabaseConnection {
  connectionString?: string;
  source: DatabaseProviderSource;
  providerName: string;
}

/**
 * Resolves PostgreSQL connection configuration following production priority:
 * 1. Official @netlify/database getConnectionString() helper (primary for Netlify managed DB)
 * 2. NETLIFY_DB_URL environment variable provided by Netlify platform
 * 3. DATABASE_URL environment variable for non-production local development ONLY
 */
export function resolvePostgresConnectionString(): ResolvedDatabaseConnection {
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;

  // 1. Official @netlify/database getConnectionString() helper
  try {
    const netlifyUrl = getConnectionString();
    if (netlifyUrl && typeof netlifyUrl === 'string' && netlifyUrl.trim()) {
      return {
        connectionString: netlifyUrl.trim(),
        source: 'NETLIFY_DATABASE',
        providerName: 'netlify',
      };
    }
  } catch {
    // getConnectionString() throws if NETLIFY_DB_URL / runtime context is not set
  }

  // 2. Direct NETLIFY_DB_URL environment variable if set by Netlify
  if (process.env.NETLIFY_DB_URL && process.env.NETLIFY_DB_URL.trim()) {
    return {
      connectionString: process.env.NETLIFY_DB_URL.trim(),
      source: 'NETLIFY_DB_URL',
      providerName: 'netlify',
    };
  }

  // 3. DATABASE_URL ONLY for local development (strictly forbidden in production)
  if (!isProd && process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    return {
      connectionString: process.env.DATABASE_URL.trim(),
      source: 'DATABASE_URL',
      providerName: 'local_development_postgres',
    };
  }

  return {
    connectionString: undefined,
    source: 'NONE',
    providerName: 'none',
  };
}

// Embedded fallback schema in case file-based asset is not bundled in serverless output
const EMBEDDED_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(64) UNIQUE,
  password_hash TEXT,
  role VARCHAR(32) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(64) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  house_flat VARCHAR(255) NOT NULL,
  street_locality VARCHAR(255) NOT NULL,
  landmark VARCHAR(255),
  city VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL,
  pin_code VARCHAR(32) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(128) PRIMARY KEY,
  sku VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(128) NOT NULL,
  category VARCHAR(128) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10, 2) NOT NULL CHECK (original_price >= 0),
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  stock INT NOT NULL CHECK (stock >= 0),
  active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  frame_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  allowed_lens_type_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lens_types (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
  requires_prescription BOOLEAN DEFAULT FALSE,
  applicable_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS lens_materials (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  additional_price NUMERIC(10, 2) NOT NULL CHECK (additional_price >= 0),
  index_rating VARCHAR(32) NOT NULL,
  compatibility_lens_type_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS coatings (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  additional_price NUMERIC(10, 2) NOT NULL CHECK (additional_price >= 0),
  is_blue_cut BOOLEAN DEFAULT FALSE,
  compatibility_material_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255),
  od_right JSONB NOT NULL,
  os_left JSONB NOT NULL,
  pd NUMERIC(4, 1) NOT NULL CHECK (pd >= 45 AND pd <= 75),
  uploaded_file_path TEXT,
  uploaded_file_type VARCHAR(32),
  verification_status VARCHAR(64) NOT NULL DEFAULT 'Pending Verification',
  verification_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescription_file_metadata (
  id VARCHAR(128) PRIMARY KEY,
  prescription_id VARCHAR(128) REFERENCES prescriptions(id) ON DELETE SET NULL,
  customer_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
  order_id VARCHAR(128),
  storage_key VARCHAR(255) UNIQUE NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  size INT NOT NULL CHECK (size >= 0 AND size <= 10485760),
  uploaded_by VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_for_later (
  id VARCHAR(128) PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(128) PRIMARY KEY,
  order_number VARCHAR(128) UNIQUE NOT NULL,
  user_id VARCHAR(128),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(64) NOT NULL,
  delivery_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal_amount NUMERIC(10, 2) NOT NULL CHECK (subtotal_amount >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee = 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(64) NOT NULL DEFAULT 'Payment Pending',
  prescription_verification_status VARCHAR(64) NOT NULL DEFAULT 'Not Required',
  payment JSONB NOT NULL,
  notes JSONB DEFAULT '[]'::jsonb,
  shipment JSONB,
  status_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(128) PRIMARY KEY,
  order_id VARCHAR(128) REFERENCES orders(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(128) UNIQUE,
  razorpay_payment_id VARCHAR(128) UNIQUE,
  razorpay_signature TEXT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(16) NOT NULL DEFAULT 'INR',
  payment_method VARCHAR(64) NOT NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  product_id VARCHAR(128) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(128) UNIQUE NOT NULL,
  stock_count INT NOT NULL CHECK (stock_count >= 0),
  reserved_count INT NOT NULL DEFAULT 0 CHECK (reserved_count >= 0),
  available_count INT NOT NULL CHECK (available_count >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  status VARCHAR(32) NOT NULL DEFAULT 'In Stock',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id VARCHAR(128) PRIMARY KEY,
  product_id VARCHAR(128) REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(128) NOT NULL,
  quantity_change INT NOT NULL,
  type VARCHAR(32) NOT NULL,
  reason TEXT NOT NULL,
  performed_by VARCHAR(255) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipments (
  id VARCHAR(128) PRIMARY KEY,
  order_id VARCHAR(128) UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  courier_name VARCHAR(128) NOT NULL,
  awb_number VARCHAR(128) UNIQUE NOT NULL,
  tracking_url TEXT,
  status VARCHAR(64) NOT NULL DEFAULT 'Created',
  shipped_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_notes (
  id VARCHAR(128) PRIMARY KEY,
  order_id VARCHAR(128) REFERENCES orders(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(128) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(128) PRIMARY KEY,
  admin_id VARCHAR(128) NOT NULL,
  admin_name VARCHAR(255) NOT NULL,
  admin_role VARCHAR(128) NOT NULL,
  action VARCHAR(255) NOT NULL,
  entity VARCHAR(128) NOT NULL,
  entity_id VARCHAR(128) NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlists (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(128) REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS cancellations (
  id VARCHAR(128) PRIMARY KEY,
  order_id VARCHAR(128) REFERENCES orders(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'Requested',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS return_requests (
  id VARCHAR(128) PRIMARY KEY,
  order_id VARCHAR(128) REFERENCES orders(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'Requested',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_records (
  id VARCHAR(128) PRIMARY KEY,
  type VARCHAR(128) NOT NULL,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(64),
  payload JSONB NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

// Synchronous/Debounced Persistent Map Wrapper with Postgres Hook
class PersistentMap<K, V> {
  private map: Map<K, V> = new Map();
  private onMutate?: (key: K, value?: V, action?: 'set' | 'delete' | 'clear') => void;
  private isMutationAllowed?: () => boolean;

  constructor(
    onMutate?: (key: K, value?: V, action?: 'set' | 'delete' | 'clear') => void,
    isMutationAllowed?: () => boolean
  ) {
    this.onMutate = onMutate;
    this.isMutationAllowed = isMutationAllowed;
  }

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  set(key: K, value: V): this {
    if (this.isMutationAllowed && !this.isMutationAllowed()) {
      throw new Error('[DATA PERSISTENCE] PRODUCTION DATABASE FAILURE: Data mutation blocked because PostgreSQL database is unavailable.');
    }
    this.map.set(key, value);
    if (this.onMutate) this.onMutate(key, value, 'set');
    return this;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    if (this.isMutationAllowed && !this.isMutationAllowed()) {
      throw new Error('[DATA PERSISTENCE] PRODUCTION DATABASE FAILURE: Data mutation blocked because PostgreSQL database is unavailable.');
    }
    const deleted = this.map.delete(key);
    if (deleted && this.onMutate) this.onMutate(key, undefined, 'delete');
    return deleted;
  }

  clear(): void {
    if (this.isMutationAllowed && !this.isMutationAllowed()) {
      throw new Error('[DATA PERSISTENCE] PRODUCTION DATABASE FAILURE: Data mutation blocked because PostgreSQL database is unavailable.');
    }
    this.map.clear();
    if (this.onMutate) this.onMutate('' as any, undefined, 'clear');
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }

  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  get size(): number {
    return this.map.size;
  }

  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void {
    this.map.forEach(callbackfn);
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.map[Symbol.iterator]();
  }

  // Internal populator without mutation triggers
  public internalSet(key: K, value: V): void {
    this.map.set(key, value);
  }
}

// Module-level connection pool singleton for serverless connection reuse
let globalPostgresPool: pg.Pool | null = null;

export class DatabaseStore {
  private dbFilePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private pool: pg.Pool | null = null;
  private locks: Map<string, Promise<any>> = new Map();
  private initializationPromise: Promise<boolean> | null = null;

  public isPostgresConnected: boolean = false;
  public postgresError: string | null = null;

  // Persistent Collections
  public users: PersistentMap<string, User>;
  public addresses: PersistentMap<string, Address>;
  public products: PersistentMap<string, Product>;
  public lensTypes: PersistentMap<string, LensType>;
  public lensMaterials: PersistentMap<string, LensMaterial>;
  public coatings: PersistentMap<string, Coating>;
  public prescriptions: PersistentMap<string, Prescription>;
  public carts: PersistentMap<string, Cart>;
  public savedForLater: PersistentMap<string, SavedForLaterItem[]>;
  public orders: PersistentMap<string, Order>;
  public wishlists: PersistentMap<string, Set<string>>;
  public inventory: PersistentMap<string, InventoryRecord>;
  public adminUsers: PersistentMap<string, AdminUser & { passwordHash: string }>;
  public orderNotes: PersistentMap<string, OrderNote[]>;
  public shipments: PersistentMap<string, ShipmentRecord>;
  public inventoryLedger: PersistentMap<string, InventoryTransaction[]>;
  public auditLogs: PersistentMap<string, AuditLogRecord>;
  public cancellations: PersistentMap<string, CancellationRecord>;
  public returnRequests: PersistentMap<string, ReturnRecord>;
  public payments: PersistentMap<string, PaymentRecord>;
  public notifications: PersistentMap<string, NotificationRecord>;
  public prescriptionFiles: PersistentMap<string, PrescriptionFileMetadata>;

  constructor(customFilePath?: string) {
    this.dbFilePath = customFilePath || process.env.DB_FILE_PATH || path.join(process.cwd(), 'data', 'opticraft_db.json');
    const isMutationAllowed = () => this.isDatabaseAvailable();

    const makeMutateHook = (tableName: string, entityKeyField: string) => {
      return (key: string, value?: any, action?: 'set' | 'delete' | 'clear') => {
        this.scheduleSaveToDisk();
        if (this.isPostgresConnected && this.pool) {
          this.persistEntityToPostgres(tableName, entityKeyField, key, value, action).catch((err) => {
            console.error(`[POSTGRES ASYNC SYNC ERROR - ${tableName}]:`, err.message || err);
          });
        }
      };
    };

    this.users = new PersistentMap(makeMutateHook('users', 'id'), isMutationAllowed);
    this.addresses = new PersistentMap(makeMutateHook('addresses', 'id'), isMutationAllowed);
    this.products = new PersistentMap(makeMutateHook('products', 'id'), isMutationAllowed);
    this.lensTypes = new PersistentMap(makeMutateHook('lens_types', 'id'), isMutationAllowed);
    this.lensMaterials = new PersistentMap(makeMutateHook('lens_materials', 'id'), isMutationAllowed);
    this.coatings = new PersistentMap(makeMutateHook('coatings', 'id'), isMutationAllowed);
    this.prescriptions = new PersistentMap(makeMutateHook('prescriptions', 'id'), isMutationAllowed);
    this.carts = new PersistentMap(makeMutateHook('carts', 'id'), isMutationAllowed);
    this.savedForLater = new PersistentMap(makeMutateHook('saved_for_later', 'id'), isMutationAllowed);
    this.orders = new PersistentMap(makeMutateHook('orders', 'id'), isMutationAllowed);
    this.wishlists = new PersistentMap(makeMutateHook('wishlists', 'id'), isMutationAllowed);
    this.inventory = new PersistentMap(makeMutateHook('inventory', 'product_id'), isMutationAllowed);
    this.adminUsers = new PersistentMap(makeMutateHook('admin_users', 'id'), isMutationAllowed);
    this.orderNotes = new PersistentMap(makeMutateHook('order_notes', 'order_id'), isMutationAllowed);
    this.shipments = new PersistentMap(makeMutateHook('shipments', 'id'), isMutationAllowed);
    this.inventoryLedger = new PersistentMap(makeMutateHook('inventory_transactions', 'product_id'), isMutationAllowed);
    this.auditLogs = new PersistentMap(makeMutateHook('audit_logs', 'id'), isMutationAllowed);
    this.cancellations = new PersistentMap(makeMutateHook('cancellations', 'id'), isMutationAllowed);
    this.returnRequests = new PersistentMap(makeMutateHook('return_requests', 'id'), isMutationAllowed);
    this.payments = new PersistentMap(makeMutateHook('payments', 'id'), isMutationAllowed);
    this.notifications = new PersistentMap(makeMutateHook('notification_records', 'id'), isMutationAllowed);
    this.prescriptionFiles = new PersistentMap(makeMutateHook('prescription_file_metadata', 'id'), isMutationAllowed);

    // Initial development store preload ONLY in development mode
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    if (!isProd) {
      this.initializeStore();
    }
  }

  public maskDbUrl(url?: string): string {
    if (!url) return '(none)';
    return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  }

  public isDatabaseAvailable(): boolean {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    if (isProd) {
      return this.isPostgresConnected;
    }
    return true; // Development mode allows fallback
  }

  public async ensureInitialized(): Promise<boolean> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    this.initializationPromise = this.initializePostgresIfConfigured();
    return this.initializationPromise;
  }

  public async checkDatabaseLiveConnection(): Promise<{
    healthy: boolean;
    isProduction: boolean;
    mode: 'POSTGRESQL' | 'DEVELOPMENT_FILE_FALLBACK' | 'PRODUCTION_DB_UNAVAILABLE';
    postgresConnected: boolean;
    provider?: string;
    source?: DatabaseProviderSource;
    databaseName?: string;
    databaseUser?: string;
    databaseSchema?: string;
    tables?: string[];
    tableCount?: number;
    tableCounts?: Record<string, number>;
    maskedUrl?: string;
    error?: string;
  }> {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    const { connectionString, source, providerName } = resolvePostgresConnectionString();
    const maskedUrl = this.maskDbUrl(connectionString);

    if (!this.pool || !this.isPostgresConnected) {
      // Attempt connection initialization
      await this.ensureInitialized();
    }

    if (this.pool && this.isPostgresConnected) {
      try {
        const client = await this.pool.connect();
        try {
          const res = await client.query('SELECT current_database(), current_user, current_schema()');
          const row = res.rows[0] || {};

          // Query actual live tables present in PostgreSQL public schema
          const tableRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
          `);
          const tables: string[] = tableRes.rows.map((r: any) => r.table_name);

          // If tables are missing, apply idempotent schema
          if (tables.length === 0) {
            await client.query(EMBEDDED_SCHEMA_SQL);
            
            const recheckRes = await client.query(`
              SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
              ORDER BY table_name;
            `);
            tables.push(...recheckRes.rows.map((r: any) => r.table_name));
          }

          // Gather row counts for key tables
          const tableCounts: Record<string, number> = {};
          for (const tbl of tables) {
            try {
              const countRes = await client.query(`SELECT COUNT(*) FROM "${tbl}"`);
              tableCounts[tbl] = parseInt(countRes.rows[0].count, 10);
            } catch {
              tableCounts[tbl] = 0;
            }
          }

          return {
            healthy: true,
            isProduction: isProd,
            mode: 'POSTGRESQL',
            postgresConnected: true,
            provider: providerName,
            source,
            databaseName: row.current_database,
            databaseUser: row.current_user,
            databaseSchema: row.current_schema,
            tables,
            tableCount: tables.length,
            tableCounts,
            maskedUrl,
          };
        } finally {
          client.release();
        }
      } catch (err: any) {
        this.isPostgresConnected = false;
        this.postgresError = err.message || 'Failed to ping PostgreSQL';
      }
    }

    if (isProd) {
      return {
        healthy: false,
        isProduction: true,
        mode: 'PRODUCTION_DB_UNAVAILABLE',
        postgresConnected: false,
        provider: providerName,
        source,
        maskedUrl,
        error: this.postgresError || 'Production Netlify Database is not configured or PostgreSQL connection failed.',
      };
    } else {
      return {
        healthy: true,
        isProduction: false,
        mode: 'DEVELOPMENT_FILE_FALLBACK',
        postgresConnected: false,
        provider: providerName,
        source,
        maskedUrl,
        error: this.postgresError || undefined,
      };
    }
  }

  public getHealthStatus() {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    const { connectionString, source, providerName } = resolvePostgresConnectionString();
    const maskedUrl = this.maskDbUrl(connectionString);

    if (isProd) {
      if (this.isPostgresConnected) {
        return {
          healthy: true,
          isProduction: true,
          mode: 'POSTGRESQL' as const,
          postgresConnected: true,
          provider: providerName,
          source,
          maskedUrl,
        };
      } else {
        return {
          healthy: false,
          isProduction: true,
          mode: 'PRODUCTION_DB_UNAVAILABLE' as const,
          postgresConnected: false,
          provider: providerName,
          source,
          maskedUrl,
          error: this.postgresError || 'Production Netlify Database is not configured.',
        };
      }
    } else {
      return {
        healthy: true,
        isProduction: false,
        mode: (this.isPostgresConnected ? 'POSTGRESQL' : 'DEVELOPMENT_FILE_FALLBACK') as 'POSTGRESQL' | 'DEVELOPMENT_FILE_FALLBACK',
        postgresConnected: this.isPostgresConnected,
        provider: providerName,
        source,
        maskedUrl,
        error: this.postgresError || undefined,
      };
    }
  }

  public scheduleSaveToDisk() {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    if (isProd) {
      // Production mode MUST NEVER persist data to development JSON file store
      return;
    }
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveToDiskSync();
    }, 50);
  }

  public saveToDiskSync() {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    if (isProd) return;
    try {
      this.ensureDataDir();
      const exportData = this.exportDatabaseState();
      fs.writeFileSync(this.dbFilePath, JSON.stringify(exportData, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB PERSISTENCE] Failed to write database to disk:', err);
    }
  }

  private initializeStore() {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    if (isProd) return;

    if (fs.existsSync(this.dbFilePath)) {
      try {
        this.loadFromDisk();
      } catch (err) {
        console.error('[DB PERSISTENCE] Error loading database file, re-seeding:', err);
        this.seedInitialData();
        this.saveToDiskSync();
      }
    } else {
      this.seedInitialData();
      this.saveToDiskSync();
    }
  }

  private ensureDataDir() {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    if (isProd) return;

    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      // Ignored for environments without write permission
    }
  }

  public loadFromDisk() {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    if (isProd) return;

    if (!fs.existsSync(this.dbFilePath)) return;
    const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
    const data = JSON.parse(raw);
    this.importDatabaseState(data);
  }

  public exportDatabaseState() {
    return {
      users: Array.from(this.users.entries()),
      addresses: Array.from(this.addresses.entries()),
      products: Array.from(this.products.entries()),
      lensTypes: Array.from(this.lensTypes.entries()),
      lensMaterials: Array.from(this.lensMaterials.entries()),
      coatings: Array.from(this.coatings.entries()),
      prescriptions: Array.from(this.prescriptions.entries()),
      carts: Array.from(this.carts.entries()),
      savedForLater: Array.from(this.savedForLater.entries()),
      orders: Array.from(this.orders.entries()),
      wishlists: Array.from(this.wishlists.entries()).map(([k, set]) => [k, Array.from(set)]),
      inventory: Array.from(this.inventory.entries()),
      adminUsers: Array.from(this.adminUsers.entries()),
      orderNotes: Array.from(this.orderNotes.entries()),
      shipments: Array.from(this.shipments.entries()),
      inventoryLedger: Array.from(this.inventoryLedger.entries()),
      auditLogs: Array.from(this.auditLogs.entries()),
      cancellations: Array.from(this.cancellations.entries()),
      returnRequests: Array.from(this.returnRequests.entries()),
      payments: Array.from(this.payments.entries()),
      notifications: Array.from(this.notifications.entries()),
      prescriptionFiles: Array.from(this.prescriptionFiles.entries()),
    };
  }

  public importDatabaseState(data: any) {
    if (data.users) data.users.forEach(([k, v]: any) => this.users.internalSet(k, v));
    if (data.addresses) data.addresses.forEach(([k, v]: any) => this.addresses.internalSet(k, v));
    if (data.products) data.products.forEach(([k, v]: any) => this.products.internalSet(k, v));
    if (data.lensTypes) data.lensTypes.forEach(([k, v]: any) => this.lensTypes.internalSet(k, v));
    if (data.lensMaterials) data.lensMaterials.forEach(([k, v]: any) => this.lensMaterials.internalSet(k, v));
    if (data.coatings) data.coatings.forEach(([k, v]: any) => this.coatings.internalSet(k, v));
    if (data.prescriptions) data.prescriptions.forEach(([k, v]: any) => this.prescriptions.internalSet(k, v));
    if (data.carts) data.carts.forEach(([k, v]: any) => this.carts.internalSet(k, v));
    if (data.savedForLater) data.savedForLater.forEach(([k, v]: any) => this.savedForLater.internalSet(k, v));
    if (data.orders) data.orders.forEach(([k, v]: any) => this.orders.internalSet(k, v));
    if (data.wishlists) {
      data.wishlists.forEach(([k, arr]: any) => this.wishlists.internalSet(k, new Set(arr)));
    }
    if (data.inventory) data.inventory.forEach(([k, v]: any) => this.inventory.internalSet(k, v));
    if (data.adminUsers) data.adminUsers.forEach(([k, v]: any) => this.adminUsers.internalSet(k, v));
    if (data.orderNotes) data.orderNotes.forEach(([k, v]: any) => this.orderNotes.internalSet(k, v));
    if (data.shipments) data.shipments.forEach(([k, v]: any) => this.shipments.internalSet(k, v));
    if (data.inventoryLedger) data.inventoryLedger.forEach(([k, v]: any) => this.inventoryLedger.internalSet(k, v));
    if (data.auditLogs) data.auditLogs.forEach(([k, v]: any) => this.auditLogs.internalSet(k, v));
    if (data.cancellations) data.cancellations.forEach(([k, v]: any) => this.cancellations.internalSet(k, v));
    if (data.returnRequests) data.returnRequests.forEach(([k, v]: any) => this.returnRequests.internalSet(k, v));
    if (data.payments) data.payments.forEach(([k, v]: any) => this.payments.internalSet(k, v));
    if (data.notifications) data.notifications.forEach(([k, v]: any) => this.notifications.internalSet(k, v));
    if (data.prescriptionFiles) data.prescriptionFiles.forEach(([k, v]: any) => this.prescriptionFiles.internalSet(k, v));
  }

  public async initializePostgresIfConfigured(): Promise<boolean> {
    const { connectionString: dbUrl, source, providerName } = resolvePostgresConnectionString();
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;

    if (!dbUrl) {
      if (isProd) {
        this.isPostgresConnected = false;
        this.postgresError = 'Production Netlify Database is not configured (NETLIFY_DB_URL not found).';
        console.error('[DATA PERSISTENCE] PRODUCTION DATABASE FAILURE: Production Netlify Database is not configured.');
        return false;
      } else {
        this.isPostgresConnected = false;
        this.postgresError = null;
        console.log('[DATA PERSISTENCE] DEVELOPMENT FALLBACK: No database connection configured. Using development file-backed store.');
        return false;
      }
    }

    try {
      if (!globalPostgresPool) {
        const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
        const isSslDisabled = dbUrl.includes('sslmode=disable');
        const requiresSsl = !isLocal && !isSslDisabled;

        globalPostgresPool = new pg.Pool({
          connectionString: dbUrl,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
          ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
        });

        globalPostgresPool.on('error', (err) => {
          console.warn('[POSTGRES POOL WARNING]', err.message || err);
        });
      }

      this.pool = globalPostgresPool;

      const client = await this.pool.connect();
      try {
        // Run schema definition safely (CREATE TABLE IF NOT EXISTS)
        let sql = EMBEDDED_SCHEMA_SQL;
        try {
          const schemaPath = path.join(process.cwd(), 'src', 'server', 'db', 'schema.sql');
          if (fs.existsSync(schemaPath)) {
            sql = fs.readFileSync(schemaPath, 'utf-8');
          }
        } catch {
          // Fallback to embedded schema
        }
        await client.query(sql);

        // Check if database has products already
        const countRes = await client.query('SELECT COUNT(*) FROM products');
        const prodCount = parseInt(countRes.rows[0].count, 10);

        if (prodCount > 0) {
          // Hydrate in-memory cache from PostgreSQL rows
          await this.loadDataFromPostgres(client);
          console.log(`[DATA PERSISTENCE] Loaded data from PostgreSQL (${prodCount} products found, source: ${source}).`);
        } else {
          console.log(`[DATA PERSISTENCE] PostgreSQL tables initialized and ready (0 products present, source: ${source}).`);
        }
      } finally {
        client.release();
      }

      this.isPostgresConnected = true;
      this.postgresError = null;
      console.log(`[DATA PERSISTENCE] Netlify Database connected successfully via ${providerName} (${this.maskDbUrl(dbUrl)}).`);
      return true;
    } catch (err: any) {
      this.isPostgresConnected = false;
      this.postgresError = err.message || String(err);

      if (isProd) {
        console.error(`[DATA PERSISTENCE] PRODUCTION DATABASE FAILURE: ${providerName} connection failed (${err.message || err}).`);
      } else {
        console.log(`[DATA PERSISTENCE] DEVELOPMENT FALLBACK: Database connection failed (${err.message || err}). Using development file-backed store.`);
      }
      return false;
    }
  }

  // Load existing records from PostgreSQL into memory collections
  private async loadDataFromPostgres(client: pg.PoolClient) {
    try {
      // Products
      const prodRes = await client.query('SELECT * FROM products');
      prodRes.rows.forEach((r: any) => {
        const prod: Product = {
          id: r.id,
          sku: r.sku,
          name: r.name,
          brand: r.brand,
          category: r.category,
          description: r.description || '',
          price: parseFloat(r.price),
          originalPrice: parseFloat(r.original_price),
          discountPercentage: parseFloat(r.discount_percentage || 0),
          stock: parseInt(r.stock, 10),
          active: Boolean(r.active),
          isFeatured: Boolean(r.is_featured),
          images: r.images || [],
          frame: r.frame_details || {},
          allowedLensTypeIds: r.allowed_lens_type_ids || [],
          createdAt: r.created_at?.toISOString?.() || r.created_at,
          updatedAt: r.updated_at?.toISOString?.() || r.updated_at,
        };
        this.products.internalSet(prod.id, prod);
      });

      // Lens Types
      const ltRes = await client.query('SELECT * FROM lens_types');
      ltRes.rows.forEach((r: any) => {
        const lt: LensType = {
          id: r.id,
          name: r.name,
          description: r.description || '',
          basePrice: parseFloat(r.base_price),
          requiresPrescription: Boolean(r.requires_prescription),
          applicableCategories: r.applicable_categories || [],
          active: Boolean(r.active),
        };
        this.lensTypes.internalSet(lt.id, lt);
      });

      // Lens Materials
      const lmRes = await client.query('SELECT * FROM lens_materials');
      lmRes.rows.forEach((r: any) => {
        const lm: LensMaterial = {
          id: r.id,
          name: r.name,
          description: r.description || '',
          additionalPrice: parseFloat(r.additional_price),
          indexRating: r.index_rating,
          compatibilityLensTypeIds: r.compatibility_lens_type_ids || [],
          active: Boolean(r.active),
        };
        this.lensMaterials.internalSet(lm.id, lm);
      });

      // Coatings
      const coatRes = await client.query('SELECT * FROM coatings');
      coatRes.rows.forEach((r: any) => {
        const coat: Coating = {
          id: r.id,
          name: r.name,
          description: r.description || '',
          additionalPrice: parseFloat(r.additional_price),
          isBlueCut: Boolean(r.is_blue_cut),
          compatibilityMaterialIds: r.compatibility_material_ids || [],
          active: Boolean(r.active),
        };
        this.coatings.internalSet(coat.id, coat);
      });

      // Users
      const userRes = await client.query('SELECT * FROM users');
      userRes.rows.forEach((r: any) => {
        const u: User = {
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          passwordHash: r.password_hash,
          role: r.role,
          createdAt: r.created_at?.toISOString?.() || r.created_at,
          updatedAt: r.updated_at?.toISOString?.() || r.updated_at,
        };
        this.users.internalSet(u.id, u);
      });

      // Admin Users
      const adminRes = await client.query('SELECT * FROM admin_users');
      adminRes.rows.forEach((r: any) => {
        this.adminUsers.internalSet(r.id, {
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          passwordHash: r.password_hash,
          createdAt: r.created_at?.toISOString?.() || r.created_at,
          updatedAt: r.updated_at?.toISOString?.() || r.updated_at,
        });
      });

      // Addresses
      const addrRes = await client.query('SELECT * FROM addresses');
      addrRes.rows.forEach((r: any) => {
        const addr: Address = {
          id: r.id,
          userId: r.user_id,
          name: r.name,
          phone: r.phone,
          houseFlat: r.house_flat,
          streetLocality: r.street_locality,
          landmark: r.landmark,
          city: r.city,
          state: r.state,
          pinCode: r.pin_code,
          isDefault: Boolean(r.is_default),
        };
        this.addresses.internalSet(addr.id, addr);
      });

      // Prescriptions
      const rxRes = await client.query('SELECT * FROM prescriptions');
      rxRes.rows.forEach((r: any) => {
        const rx: Prescription = {
          id: r.id,
          userId: r.user_id,
          title: r.title,
          odRight: r.od_right,
          osLeft: r.os_left,
          pd: parseFloat(r.pd),
          uploadedFilePath: r.uploaded_file_path,
          uploadedFileType: r.uploaded_file_type,
          verificationStatus: r.verification_status,
          verificationNote: r.verification_note,
          createdAt: r.created_at?.toISOString?.() || r.created_at,
          updatedAt: r.updated_at?.toISOString?.() || r.updated_at,
        };
        this.prescriptions.internalSet(rx.id, rx);
      });

      // Inventory
      const invRes = await client.query('SELECT * FROM inventory');
      invRes.rows.forEach((r: any) => {
        const inv: InventoryRecord = {
          productId: r.product_id,
          sku: r.sku,
          stockCount: parseInt(r.stock_count, 10),
          reservedCount: parseInt(r.reserved_count || 0, 10),
          availableCount: parseInt(r.available_count, 10),
          lowStockThreshold: parseInt(r.low_stock_threshold || 5, 10),
          status: r.status,
          lastUpdated: r.last_updated?.toISOString?.() || r.last_updated,
        };
        this.inventory.internalSet(inv.productId, inv);
      });

      // Orders
      const orderRes = await client.query('SELECT * FROM orders');
      orderRes.rows.forEach((r: any) => {
        const ord: Order = {
          id: r.id,
          orderNumber: r.order_number,
          userId: r.user_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          customerPhone: r.customer_phone,
          deliveryAddress: r.delivery_address,
          items: r.items,
          subtotalAmount: parseFloat(r.subtotal_amount),
          discountAmount: parseFloat(r.discount_amount || 0),
          deliveryFee: 0,
          totalAmount: parseFloat(r.total_amount),
          status: r.status,
          prescriptionVerificationStatus: r.prescription_verification_status,
          payment: r.payment,
          notes: r.notes || [],
          shipment: r.shipment,
          statusHistory: r.status_history || [],
          createdAt: r.created_at?.toISOString?.() || r.created_at,
          updatedAt: r.updated_at?.toISOString?.() || r.updated_at,
        };
        this.orders.internalSet(ord.id, ord);
      });

      // Carts
      const cartRes = await client.query('SELECT * FROM carts');
      cartRes.rows.forEach((r: any) => {
        this.carts.internalSet(r.id, {
          id: r.id,
          userId: r.user_id,
          items: r.items || [],
          updatedAt: r.updated_at?.toISOString?.() || r.updated_at,
        });
      });

      // Saved for Later
      const savedRes = await client.query('SELECT * FROM saved_for_later');
      savedRes.rows.forEach((r: any) => {
        this.savedForLater.internalSet(r.id, r.items || []);
      });

      // Wishlists
      const wishRes = await client.query('SELECT user_id, product_id FROM wishlists');
      wishRes.rows.forEach((r: any) => {
        let set = this.wishlists.get(r.user_id);
        if (!set) {
          set = new Set();
          this.wishlists.internalSet(r.user_id, set);
        }
        set.add(r.product_id);
      });
    } catch (err) {
      console.error('[DATA PERSISTENCE] Warning loading records from PostgreSQL:', err);
    }
  }

  // Persist fresh initial seed data to PostgreSQL
  private async persistInitialDataToPostgres(client: pg.PoolClient) {
    try {
      // Seed Lens Types
      for (const lt of this.lensTypes.values()) {
        await client.query(
          `INSERT INTO lens_types (id, name, description, base_price, requires_prescription, applicable_categories, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
          [lt.id, lt.name, lt.description, lt.basePrice, lt.requiresPrescription, JSON.stringify(lt.applicableCategories), lt.active]
        );
      }

      // Seed Materials
      for (const lm of this.lensMaterials.values()) {
        await client.query(
          `INSERT INTO lens_materials (id, name, description, additional_price, index_rating, compatibility_lens_type_ids, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
          [lm.id, lm.name, lm.description, lm.additionalPrice, lm.indexRating, JSON.stringify(lm.compatibilityLensTypeIds), lm.active]
        );
      }

      // Seed Coatings
      for (const coat of this.coatings.values()) {
        await client.query(
          `INSERT INTO coatings (id, name, description, additional_price, is_blue_cut, compatibility_material_ids, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
          [coat.id, coat.name, coat.description, coat.additionalPrice, coat.isBlueCut, JSON.stringify(coat.compatibilityMaterialIds), coat.active]
        );
      }

      // Seed Products & Inventory
      for (const p of this.products.values()) {
        await client.query(
          `INSERT INTO products (id, sku, name, brand, category, description, price, original_price, discount_percentage, stock, active, is_featured, images, frame_details, allowed_lens_type_ids)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) ON CONFLICT (id) DO NOTHING`,
          [
            p.id,
            p.sku,
            p.name,
            p.brand,
            p.category,
            p.description,
            p.price,
            p.originalPrice,
            p.discountPercentage,
            p.stock,
            p.active,
            p.isFeatured,
            JSON.stringify(p.images),
            JSON.stringify(p.frame),
            JSON.stringify(p.allowedLensTypeIds),
          ]
        );

        const inv = this.inventory.get(p.id);
        if (inv) {
          await client.query(
            `INSERT INTO inventory (product_id, sku, stock_count, reserved_count, available_count, low_stock_threshold, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (product_id) DO NOTHING`,
            [inv.productId, inv.sku, inv.stockCount, inv.reservedCount, inv.availableCount, inv.lowStockThreshold, inv.status]
          );
        }
      }

      // Seed Admin Users
      for (const adm of this.adminUsers.values()) {
        await client.query(
          `INSERT INTO admin_users (id, name, email, role, password_hash)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
          [adm.id, adm.name, adm.email, adm.role, adm.passwordHash]
        );
      }

      // Seed Users
      for (const u of this.users.values()) {
        await client.query(
          `INSERT INTO users (id, name, email, phone, password_hash, role)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          [u.id, u.name, u.email, u.phone, u.passwordHash, u.role]
        );
      }
    } catch (err) {
      console.error('[DATA PERSISTENCE] Error persisting initial seeds to PostgreSQL:', err);
    }
  }

  // Persist live entity modifications to PostgreSQL
  private async persistEntityToPostgres(
    tableName: string,
    keyField: string,
    key: string,
    value: any,
    action?: 'set' | 'delete' | 'clear'
  ) {
    if (!this.pool || !this.isPostgresConnected) return;

    if (action === 'delete') {
      await this.pool.query(`DELETE FROM ${tableName} WHERE ${keyField} = $1`, [key]);
      return;
    }

    if (action === 'clear') {
      await this.pool.query(`DELETE FROM ${tableName}`);
      return;
    }

    // Handle table-specific upsert operations
    try {
      if (tableName === 'products' && value) {
        await this.pool.query(
          `INSERT INTO products (id, sku, name, brand, category, description, price, original_price, discount_percentage, stock, active, is_featured, images, frame_details, allowed_lens_type_ids, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             sku = EXCLUDED.sku, name = EXCLUDED.name, brand = EXCLUDED.brand, category = EXCLUDED.category,
             description = EXCLUDED.description, price = EXCLUDED.price, original_price = EXCLUDED.original_price,
             discount_percentage = EXCLUDED.discount_percentage, stock = EXCLUDED.stock, active = EXCLUDED.active,
             is_featured = EXCLUDED.is_featured, images = EXCLUDED.images, frame_details = EXCLUDED.frame_details,
             allowed_lens_type_ids = EXCLUDED.allowed_lens_type_ids, updated_at = CURRENT_TIMESTAMP`,
          [
            value.id,
            value.sku,
            value.name,
            value.brand,
            value.category,
            value.description,
            value.price,
            value.originalPrice,
            value.discountPercentage,
            value.stock,
            value.active,
            value.isFeatured,
            JSON.stringify(value.images || []),
            JSON.stringify(value.frame || {}),
            JSON.stringify(value.allowedLensTypeIds || []),
          ]
        );
      } else if (tableName === 'inventory' && value) {
        await this.pool.query(
          `INSERT INTO inventory (product_id, sku, stock_count, reserved_count, available_count, low_stock_threshold, status, last_updated)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
           ON CONFLICT (product_id) DO UPDATE SET
             sku = EXCLUDED.sku, stock_count = EXCLUDED.stock_count, reserved_count = EXCLUDED.reserved_count,
             available_count = EXCLUDED.available_count, low_stock_threshold = EXCLUDED.low_stock_threshold,
             status = EXCLUDED.status, last_updated = CURRENT_TIMESTAMP`,
          [value.productId, value.sku, value.stockCount, value.reservedCount || 0, value.availableCount, value.lowStockThreshold || 5, value.status]
        );
      } else if (tableName === 'orders' && value) {
        await this.pool.query(
          `INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, delivery_address, items, subtotal_amount, discount_amount, delivery_fee, total_amount, status, prescription_verification_status, payment, notes, shipment, status_history, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status, prescription_verification_status = EXCLUDED.prescription_verification_status,
             payment = EXCLUDED.payment, notes = EXCLUDED.notes, shipment = EXCLUDED.shipment,
             status_history = EXCLUDED.status_history, updated_at = CURRENT_TIMESTAMP`,
          [
            value.id,
            value.orderNumber,
            value.userId || null,
            value.customerName,
            value.customerEmail,
            value.customerPhone,
            JSON.stringify(value.deliveryAddress),
            JSON.stringify(value.items),
            value.subtotalAmount,
            value.discountAmount || 0,
            value.deliveryFee || 0,
            value.totalAmount,
            value.status,
            value.prescriptionVerificationStatus || 'Not Required',
            JSON.stringify(value.payment),
            JSON.stringify(value.notes || []),
            value.shipment ? JSON.stringify(value.shipment) : null,
            JSON.stringify(value.statusHistory || []),
          ]
        );
      } else if (tableName === 'carts' && value) {
        await this.pool.query(
          `INSERT INTO carts (id, user_id, items, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             user_id = EXCLUDED.user_id, items = EXCLUDED.items, updated_at = CURRENT_TIMESTAMP`,
          [value.id, value.userId || null, JSON.stringify(value.items || [])]
        );
      } else if (tableName === 'saved_for_later') {
        await this.pool.query(
          `INSERT INTO saved_for_later (id, items, updated_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             items = EXCLUDED.items, updated_at = CURRENT_TIMESTAMP`,
          [key, JSON.stringify(value || [])]
        );
      } else if (tableName === 'users' && value) {
        await this.pool.query(
          `INSERT INTO users (id, name, email, phone, password_hash, role, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
             password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP`,
          [value.id, value.name, value.email, value.phone || null, value.passwordHash || null, value.role]
        );
      } else if (tableName === 'admin_users' && value) {
        await this.pool.query(
          `INSERT INTO admin_users (id, name, email, role, password_hash, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role,
             password_hash = EXCLUDED.password_hash, updated_at = CURRENT_TIMESTAMP`,
          [value.id, value.name, value.email, value.role, value.passwordHash]
        );
      } else if (tableName === 'addresses' && value) {
        await this.pool.query(
          `INSERT INTO addresses (id, user_id, name, phone, house_flat, street_locality, landmark, city, state, pin_code, is_default, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name, phone = EXCLUDED.phone, house_flat = EXCLUDED.house_flat,
             street_locality = EXCLUDED.street_locality, landmark = EXCLUDED.landmark,
             city = EXCLUDED.city, state = EXCLUDED.state, pin_code = EXCLUDED.pin_code,
             is_default = EXCLUDED.is_default, updated_at = CURRENT_TIMESTAMP`,
          [
            value.id,
            value.userId || null,
            value.name,
            value.phone,
            value.houseFlat,
            value.streetLocality,
            value.landmark || null,
            value.city,
            value.state,
            value.pinCode,
            value.isDefault || false,
          ]
        );
      } else if (tableName === 'prescriptions' && value) {
        await this.pool.query(
          `INSERT INTO prescriptions (id, user_id, title, od_right, os_left, pd, uploaded_file_path, uploaded_file_type, verification_status, verification_note, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title, od_right = EXCLUDED.od_right, os_left = EXCLUDED.os_left,
             pd = EXCLUDED.pd, uploaded_file_path = EXCLUDED.uploaded_file_path,
             uploaded_file_type = EXCLUDED.uploaded_file_type, verification_status = EXCLUDED.verification_status,
             verification_note = EXCLUDED.verification_note, updated_at = CURRENT_TIMESTAMP`,
          [
            value.id,
            value.userId || null,
            value.title || null,
            JSON.stringify(value.odRight),
            JSON.stringify(value.osLeft),
            value.pd,
            value.uploadedFilePath || null,
            value.uploadedFileType || null,
            value.verificationStatus || 'Pending Verification',
            value.verificationNote || null,
          ]
        );
      }
    } catch (err: any) {
      console.error(`[POSTGRES PERSISTENCE ERROR - ${tableName}]`, err.message || err);
    }
  }

  public async queryPostgres(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool || !this.isPostgresConnected) {
      throw new Error('[DATA PERSISTENCE] PRODUCTION DATABASE FAILURE: PostgreSQL database pool is not connected.');
    }
    return this.pool.query(sql, params);
  }

  public async reconnectPostgres(dbUrl?: string): Promise<boolean> {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    if (dbUrl !== undefined) {
      if (isProd) {
        process.env.NETLIFY_DB_URL = dbUrl;
      } else {
        process.env.DATABASE_URL = dbUrl;
      }
    }
    if (globalPostgresPool) {
      try {
        await globalPostgresPool.end();
      } catch {}
      globalPostgresPool = null;
    }
    this.pool = null;
    this.initializationPromise = null;
    return this.initializePostgresIfConfigured();
  }

  // =======================================================
  // TRANSACTION SAFETY & ATOMIC OPERATIONS
  // =======================================================

  public async acquireLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }
    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this.locks.delete(key);
      }
    })();
    this.locks.set(key, promise);
    return promise;
  }

  public async checkAndDeductInventoryAtomic(
    items: { productId: string; quantity: number }[],
    referenceId: string,
    performer: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isDatabaseAvailable()) {
      return {
        success: false,
        error: 'PRODUCTION DATABASE FAILURE: Inventory mutation blocked because PostgreSQL database is unavailable.',
      };
    }

    return this.acquireLock('inventory_deduct', async () => {
      // 1. Check stock availability for all items
      for (const item of items) {
        const inv = this.inventory.get(item.productId);
        if (!inv) {
          return { success: false, error: `Product inventory record not found for ID ${item.productId}` };
        }
        if (inv.availableCount < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for SKU ${inv.sku}. Available: ${inv.availableCount}, Requested: ${item.quantity}`,
          };
        }
      }

      // 2. Perform atomic updates
      for (const item of items) {
        const inv = this.inventory.get(item.productId)!;
        const prod = this.products.get(item.productId)!;

        inv.availableCount -= item.quantity;
        inv.stockCount -= item.quantity;
        if (inv.availableCount <= 0) {
          inv.status = 'Out of Stock';
        } else if (inv.availableCount <= inv.lowStockThreshold) {
          inv.status = 'Low Stock';
        } else {
          inv.status = 'In Stock';
        }
        inv.lastUpdated = new Date().toISOString();

        if (prod) {
          prod.stock = inv.availableCount;
          this.products.set(prod.id, prod);
        }
        this.inventory.set(item.productId, inv);

        // Record inventory ledger transaction
        const ledger = this.inventoryLedger.get(item.productId) || [];
        ledger.push({
          id: `tx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          productId: item.productId,
          sku: inv.sku,
          quantityChange: -item.quantity,
          type: 'Sale',
          reason: `Order Sale Fulfillment #${referenceId}`,
          performedBy: performer,
          timestamp: new Date().toISOString(),
        });
        this.inventoryLedger.set(item.productId, ledger);
      }

      this.scheduleSaveToDisk();
      return { success: true };
    });
  }

  public async processPaymentIdempotent(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    processorFn: () => Promise<Order>
  ): Promise<{ order: Order; isDuplicate: boolean }> {
    if (!this.isDatabaseAvailable()) {
      throw new Error('PRODUCTION DATABASE FAILURE: Payment processing blocked because PostgreSQL database is unavailable.');
    }

    const lockKey = `payment_${razorpayOrderId}_${razorpayPaymentId}`;
    return this.acquireLock(lockKey, async () => {
      // 1. Check if order with this Razorpay payment or order ID already exists
      const existingOrder = Array.from(this.orders.values()).find(
        (o) =>
          o.payment.razorpayPaymentId === razorpayPaymentId ||
          o.payment.razorpayOrderId === razorpayOrderId
      );

      if (existingOrder && existingOrder.payment.status === 'Captured') {
        return { order: existingOrder, isDuplicate: true };
      }

      // 2. Process non-duplicate payment
      const order = await processorFn();
      this.orders.set(order.id, order);

      // Record payment record
      const paymentRec: PaymentRecord = {
        id: `pay-${Date.now()}`,
        razorpayOrderId,
        razorpayPaymentId,
        amount: order.totalAmount,
        currency: 'INR',
        paymentMethod: 'UPI',
        status: 'Captured',
        createdAt: new Date().toISOString(),
      };
      this.payments.set(paymentRec.id, paymentRec);

      this.scheduleSaveToDisk();
      return { order, isDuplicate: false };
    });
  }

  public validateOrderTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ): { valid: boolean; reason?: string } {
    if (currentStatus === newStatus) return { valid: true };

    const validTransitions: Record<string, string[]> = {
      'Payment Pending': ['Confirmed', 'Cancelled'],
      Confirmed: ['Prescription Verification', 'Processing', 'Cancelled'],
      'Prescription Verification': ['Processing', 'Cancelled'],
      Processing: ['Manufacturing', 'Ready to Dispatch', 'Cancelled'],
      Manufacturing: ['Ready to Dispatch', 'Cancelled'],
      'Ready to Dispatch': ['Shipped', 'Cancelled'],
      Shipped: ['Delivered', 'Cancelled'],
      Delivered: ['Returned'],
      Cancelled: [],
      Returned: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return {
        valid: false,
        reason: `Cannot transition order status from '${currentStatus}' directly to '${newStatus}'.`,
      };
    }
    return { valid: true };
  }

  // =======================================================
  // INITIAL SEED DATA
  // =======================================================

  private seedInitialData() {
    // 1. Seed Lens Types
    const sampleLensTypes: LensType[] = [
      {
        id: 'lt-plain',
        name: 'Plain / Zero Power Lens',
        description: 'High-clarity optical glass with zero refractive power for fashion & style.',
        basePrice: 0,
        requiresPrescription: false,
        applicableCategories: ['Eyeglasses', 'Sunglasses', 'Blue Cut / Screen Safe'],
        active: true,
      },
      {
        id: 'lt-single-vision',
        name: 'Single Vision Powered',
        description: 'Corrects distance or near vision with uniform focal prescription across the lens.',
        basePrice: 499,
        requiresPrescription: true,
        applicableCategories: ['Eyeglasses', 'Blue Cut / Screen Safe', 'Powered Sunglasses'],
        active: true,
      },
      {
        id: 'lt-progressive',
        name: 'Progressive / Bifocal',
        description: 'Seamless multi-focal lens for smooth distance, intermediate, and reading clarity.',
        basePrice: 1299,
        requiresPrescription: true,
        applicableCategories: ['Eyeglasses', 'Progressive'],
        active: true,
      },
      {
        id: 'lt-plain-sunglass',
        name: 'Tinted Plain Sunglasses',
        description: '100% UV-protected polarized tinted lenses without power.',
        basePrice: 200,
        requiresPrescription: false,
        applicableCategories: ['Sunglasses'],
        active: true,
      },
      {
        id: 'lt-powered-sunglass',
        name: 'Powered Prescription Sunglasses',
        description: 'Custom tinted optical lenses made precisely to your eye prescription.',
        basePrice: 899,
        requiresPrescription: true,
        applicableCategories: ['Sunglasses', 'Powered Sunglasses'],
        active: true,
      },
    ];
    sampleLensTypes.forEach((lt) => this.lensTypes.internalSet(lt.id, lt));

    // 2. Seed Lens Materials
    const sampleMaterials: LensMaterial[] = [
      {
        id: 'mat-cr39',
        name: 'CR-39 Standard Organic',
        description: 'Classic lightweight optical resin with excellent optical clarity.',
        additionalPrice: 0,
        indexRating: '1.50',
        compatibilityLensTypeIds: ['lt-plain', 'lt-single-vision', 'lt-plain-sunglass'],
        active: true,
      },
      {
        id: 'mat-polycarbonate',
        name: 'Polycarbonate Shatterproof',
        description: '10x more impact-resistant, ideal for active lifestyles, full rims, and rimless frames.',
        additionalPrice: 350,
        indexRating: '1.59',
        compatibilityLensTypeIds: ['lt-plain', 'lt-single-vision', 'lt-progressive', 'lt-powered-sunglass', 'lt-plain-sunglass'],
        active: true,
      },
      {
        id: 'mat-high-index-167',
        name: '1.67 High-Index Ultra Thin',
        description: '33% thinner and lighter than standard lenses, perfect for higher powers (+/- 3.00D or more).',
        additionalPrice: 850,
        indexRating: '1.67',
        compatibilityLensTypeIds: ['lt-single-vision', 'lt-progressive', 'lt-powered-sunglass'],
        active: true,
      },
      {
        id: 'mat-high-index-174',
        name: '1.74 Featherweight High-Index',
        description: 'Ultra-sleek profile designed for high prescriptions to prevent glass edge projection.',
        additionalPrice: 1499,
        indexRating: '1.74',
        compatibilityLensTypeIds: ['lt-single-vision', 'lt-progressive'],
        active: true,
      },
    ];
    sampleMaterials.forEach((m) => this.lensMaterials.internalSet(m.id, m));

    // 3. Seed Coatings
    const sampleCoatings: Coating[] = [
      {
        id: 'coat-hard',
        name: 'Hard Scratch-Resistant Coat',
        description: 'Protective clear shell to safeguard lenses against everyday scratches.',
        additionalPrice: 0,
        compatibilityMaterialIds: ['mat-cr39', 'mat-polycarbonate', 'mat-high-index-167', 'mat-high-index-174'],
        active: true,
      },
      {
        id: 'coat-arc',
        name: 'Anti-Reflection (ARC)',
        description: 'Eliminates glare from headlights, screen lights, and indoor illumination.',
        additionalPrice: 299,
        compatibilityMaterialIds: ['mat-cr39', 'mat-polycarbonate', 'mat-high-index-167', 'mat-high-index-174'],
        active: true,
      },
      {
        id: 'coat-bluecut',
        name: 'Blue Cut / Screen Safe',
        description: 'Filters selected portions of harmful high-energy blue-violet light from digital screens.',
        additionalPrice: 499,
        isBlueCut: true,
        compatibilityMaterialIds: ['mat-cr39', 'mat-polycarbonate', 'mat-high-index-167', 'mat-high-index-174'],
        active: true,
      },
      {
        id: 'coat-superhydrophobic',
        name: 'Superhydrophobic Water Repellent',
        description: 'Repels dust, water droplets, fingerprint smudges, and oil for easy cleaning.',
        additionalPrice: 399,
        compatibilityMaterialIds: ['mat-polycarbonate', 'mat-high-index-167', 'mat-high-index-174'],
        active: true,
      },
      {
        id: 'coat-uv400',
        name: 'UV400 Solar Defense',
        description: 'Blocks 100% of UVA and UVB solar rays.',
        additionalPrice: 250,
        compatibilityMaterialIds: ['mat-cr39', 'mat-polycarbonate', 'mat-high-index-167', 'mat-high-index-174'],
        active: true,
      },
    ];
    sampleCoatings.forEach((c) => this.coatings.internalSet(c.id, c));

    // 4. Seed Products
    const sampleProducts: Product[] = [
      {
        id: 'prod-fern-classic-black',
        sku: 'OPT-FCB-001',
        name: 'Fern Classic Rectangle Spectacles',
        brand: 'OptiCraft Signature',
        category: 'Eyeglasses',
        description: 'Precision handcrafted lightweight acetate frame with subtle metallic hinges.',
        price: 1499,
        originalPrice: 2499,
        discountPercentage: 40,
        stock: 25,
        active: true,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800',
        ],
        frame: {
          shape: 'Rectangle',
          size: 'Medium',
          color: 'Matte Obsidian Black',
          material: 'Acetate',
          rimType: 'Full Rim',
          gender: 'Unisex',
          frameWidthMm: 138,
          bridgeWidthMm: 18,
          templeLengthMm: 145,
        },
        allowedLensTypeIds: ['lt-plain', 'lt-single-vision', 'lt-progressive'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-titan-gold-round',
        sku: 'OPT-TGR-002',
        name: 'Titanium Gold Round Eyeglasses',
        brand: 'OptiCraft Titanium Series',
        category: 'Eyeglasses',
        description: 'Ultralight Japanese pure titanium round frames engineered for zero pressure.',
        price: 3499,
        originalPrice: 4999,
        discountPercentage: 30,
        stock: 12,
        active: true,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800',
        ],
        frame: {
          shape: 'Round',
          size: 'Medium',
          color: 'Brushed Champagne Gold',
          material: 'Titanium',
          rimType: 'Full Rim',
          gender: 'Unisex',
          frameWidthMm: 134,
          bridgeWidthMm: 20,
          templeLengthMm: 142,
        },
        allowedLensTypeIds: ['lt-plain', 'lt-single-vision', 'lt-progressive'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-screen-shield-pro',
        sku: 'OPT-SSP-003',
        name: 'ScreenShield Pro Blue Cut Eyeglasses',
        brand: 'OptiCraft Tech Shield',
        category: 'Blue Cut / Screen Safe',
        description: 'Engineered specifically for digital professionals spending 8+ hours in front of screens.',
        price: 1999,
        originalPrice: 2999,
        discountPercentage: 33,
        stock: 30,
        active: true,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=800',
        ],
        frame: {
          shape: 'Square',
          size: 'Wide',
          color: 'Transparent Gunmetal Grey',
          material: 'TR90 Flexible',
          rimType: 'Full Rim',
          gender: 'Unisex',
          frameWidthMm: 142,
          bridgeWidthMm: 17,
          templeLengthMm: 148,
        },
        allowedLensTypeIds: ['lt-plain', 'lt-single-vision'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-aviator-polarised-sunglasses',
        sku: 'OPT-APS-004',
        name: 'Heritage Gold Aviator Sunglasses',
        brand: 'OptiCraft Sunwear',
        category: 'Sunglasses',
        description: 'Timeless military pilot aviator silhouette with polarized anti-glare G15 green lenses.',
        price: 2799,
        originalPrice: 3999,
        discountPercentage: 30,
        stock: 18,
        active: true,
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800',
        ],
        frame: {
          shape: 'Aviator',
          size: 'Wide',
          color: 'Polished Gold',
          material: 'Stainless Steel',
          rimType: 'Full Rim',
          gender: 'Unisex',
          frameWidthMm: 144,
          bridgeWidthMm: 14,
          templeLengthMm: 140,
        },
        allowedLensTypeIds: ['lt-plain-sunglass', 'lt-powered-sunglass'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-vista-progressive-tortoise',
        sku: 'OPT-VPT-005',
        name: 'Vista Soft Tortoise Progressive Frame',
        brand: 'OptiCraft Executive',
        category: 'Progressive',
        description: 'Deep vertical frame geometry specifically tailored for optimal multi-focal progressive reading corridors.',
        price: 2499,
        originalPrice: 3499,
        discountPercentage: 28,
        stock: 15,
        active: true,
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=800',
        ],
        frame: {
          shape: 'Wayfarer',
          size: 'Medium',
          color: 'Warm Amber Tortoiseshell',
          material: 'Acetate',
          rimType: 'Full Rim',
          gender: 'Unisex',
          frameWidthMm: 139,
          bridgeWidthMm: 19,
          templeLengthMm: 145,
        },
        allowedLensTypeIds: ['lt-progressive', 'lt-single-vision'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-horizon-wayfarer-sun',
        sku: 'OPT-HWS-006',
        name: 'Horizon Matte Black Polarised Sunwear',
        brand: 'OptiCraft Sunwear',
        category: 'Powered Sunglasses',
        description: 'Sporty Wayfarer frame with flexible TR90 temples and full UV400 prescription-ready channels.',
        price: 2199,
        originalPrice: 2999,
        discountPercentage: 26,
        stock: 22,
        active: true,
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800',
        ],
        frame: {
          shape: 'Wayfarer',
          size: 'Medium',
          color: 'Velvet Matte Black',
          material: 'TR90 Flexible',
          rimType: 'Full Rim',
          gender: 'Unisex',
          frameWidthMm: 140,
          bridgeWidthMm: 18,
          templeLengthMm: 145,
        },
        allowedLensTypeIds: ['lt-plain-sunglass', 'lt-powered-sunglass'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    sampleProducts.forEach((p) => {
      this.products.internalSet(p.id, p);
      const inv: InventoryRecord = {
        productId: p.id,
        sku: p.sku,
        stockCount: p.stock,
        reservedCount: 0,
        availableCount: p.stock,
        lowStockThreshold: 5,
        status: p.stock > 5 ? 'In Stock' : p.stock > 0 ? 'Low Stock' : 'Out of Stock',
        lastUpdated: new Date().toISOString(),
      };
      this.inventory.internalSet(p.id, inv);
      this.inventoryLedger.internalSet(p.id, [
        {
          id: `tx-init-${p.id}`,
          productId: p.id,
          sku: p.sku,
          quantityChange: p.stock,
          type: 'Addition',
          reason: 'Initial Warehouse Inventory Seeding',
          performedBy: 'System Automation',
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    // 5. Seed Default Accounts
    const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);
    const superAdminHash = bcrypt.hashSync('SuperAdmin123!', 10);
    const adminHash = bcrypt.hashSync('AdminPass@123', 10);
    const opsHash = bcrypt.hashSync('OpsPass@123', 10);
    const catalogHash = bcrypt.hashSync('CatalogPass@123', 10);

    const customerUser: User = {
      id: 'usr-customer-1',
      name: 'Aarav Sharma',
      email: 'aarav@example.in',
      phone: '+919988776655',
      passwordHash: defaultPasswordHash,
      role: 'customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.internalSet(customerUser.id, customerUser);

    const staffAccounts: (AdminUser & { passwordHash: string })[] = [
      {
        id: 'adm-super-1',
        name: 'Super Admin (System)',
        email: 'superadmin@opticraft.in',
        role: 'SUPER_ADMIN',
        passwordHash: superAdminHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'adm-general-1',
        name: 'Priya Verma (Store Admin)',
        email: 'admin@opticraft.in',
        role: 'ADMIN',
        passwordHash: adminHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'adm-ops-1',
        name: 'Vikram Singh (Operations)',
        email: 'ops@opticraft.in',
        role: 'OPERATIONS',
        passwordHash: opsHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'adm-catalog-1',
        name: 'Neha Kapoor (Catalog Manager)',
        email: 'catalog@opticraft.in',
        role: 'CATALOG_MANAGER',
        passwordHash: catalogHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    staffAccounts.forEach((staff) => this.adminUsers.internalSet(staff.id, staff));

    // 6. Seed Address & Prescription
    const customerAddress: Address = {
      id: 'addr-1',
      userId: customerUser.id,
      name: 'Aarav Sharma',
      phone: '+91 9988776655',
      houseFlat: 'Flat 402, Green Valley Apartments',
      streetLocality: '100 Feet Road, Indiranagar',
      landmark: 'Near Indiranagar Metro Station',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560038',
      isDefault: true,
    };
    this.addresses.internalSet(customerAddress.id, customerAddress);

    const samplePrescription: Prescription = {
      id: 'rx-1',
      userId: customerUser.id,
      title: 'My Daily Glasses Rx',
      odRight: { sph: -1.5, cyl: -0.5, axis: 90 },
      osLeft: { sph: -1.25, cyl: -0.25, axis: 85 },
      pd: 63,
      verificationStatus: 'Verified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.prescriptions.internalSet(samplePrescription.id, samplePrescription);
  }
}

export const db = new DatabaseStore();
