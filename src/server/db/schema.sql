-- OptiCraft Eyewear - Production PostgreSQL Database Schema (Phase 9A)
-- Includes relational models, constraints, unique keys, and foreign keys.

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
