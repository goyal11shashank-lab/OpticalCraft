# OptiCraft Eyewear - Production Launch & Deployment Documentation

## Overview
This document outlines the security, configuration, monitoring, and launch architecture for deploying OptiCraft Eyewear to Cloud Run and production environments.

---

## 1. Environment Variable & Secret Configuration
The following environment variables MUST be configured in your production key vault / Cloud Secret Manager:

| Variable Name | Exposure | Description | Example / Standard |
|---|---|---|---|
| `NODE_ENV` | Server | Environment mode | `production` |
| `PORT` | Server | Application binding port | `3000` |
| `APP_URL` | Server | Canonical production URL | `https://opticraft.in` |
| `JWT_SECRET` | Server Secret | Min 32-char cryptographically secure key | `[SECRET_PROD_JWT_KEY]` |
| `ADMIN_PIN` | Server Secret | Master admin staff verification PIN | `[SECRET_PROD_ADMIN_PIN]` |
| `RAZORPAY_KEY_ID` | Server/Client | Razorpay Gateway Key ID | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Server Secret | Razorpay Gateway Secret | `[SECRET_RAZORPAY_KEY]` |
| `RAZORPAY_WEBHOOK_SECRET` | Server Secret | HMAC SHA256 Webhook Verification Secret | `[SECRET_WEBHOOK_HMAC]` |
| `GEMINI_API_KEY` | Server Secret | AI studio / virtual try-on key | `[SECRET_GEMINI_KEY]` |

> **CRITICAL SECURITY NOTE:**
> - Debug reset tokens are automatically suppressed in API responses when `NODE_ENV=production`.
> - Never commit `.env` files to source control. `.gitignore` is pre-configured to reject all `.env*` files.

---

## 2. API Security, IDOR & Rate Limiting

### Security Headers
The server automatically applies the following security headers via Express middleware:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Rate Limiting
- **Authentication Routes (`/api/auth/*`, `/api/admin/login`):** 20 requests per 15 minutes per IP.
- **Payment & Checkout (`/api/payments/*`, `/api/checkout/*`):** 30 requests per 5 minutes per IP.
- **Razorpay Webhooks (`/api/razorpay/webhook`):** 120 requests per minute per IP with strict HMAC signature verification.

### IDOR & Object-Level Authorization
- `GET /api/orders/:id`: Strict user ownership check (`order.userId === req.user.id` or `role === 'admin'`).
- `GET /api/prescriptions/:id`: Restricted to record owner or admin.
- `GET /api/addresses/:id`: Restricted to owner or admin.
- Prescription Uploads (`/api/prescriptions/upload`): Validated for MIME type (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), maximum size (5MB), and rejection of script/executable extensions.

---

## 3. SEO & Indexing Infrastructure
- **Dynamic Robots.txt:** Served at `/robots.txt`. Grants indexing for `/`, `/catalog`, `/product/*`, `/eyeglasses`, `/sunglasses`, `/legal/` and blocks administrative/private routes.
- **Dynamic Sitemap:** Served at `/sitemap.xml`. Automatically includes all active catalog products and static legal/collection pages.

---

## 4. Error Handling & Monitoring
- Centralized logger (`src/server/logger.ts`) formats structured JSON logs.
- Sensitive fields (`password`, `passwordHash`, `token`, `razorpay_signature`, `cvv`) are automatically redacted from logs.
- Error monitoring service (`src/server/errorMonitoring.ts`) captures exceptions.
- Global Express error handler hides internal stack traces and database error details when `NODE_ENV=production`.
