# OptiCraft Eyewear - Backup Strategy & Data Retention Policy

## 1. Objective & Scope
This document specifies the data backup procedures, disaster recovery objectives, and data retention schedules for OptiCraft Eyewear customer data, orders, prescriptions, and inventory records.

---

## 2. Recovery Time & Point Objectives
- **RPO (Recovery Point Objective):** < 1 hour. Maximum acceptable data loss duration in the event of a primary database outage.
- **RTO (Recovery Time Objective):** < 2 hours. Maximum acceptable time to restore full application operations.

---

## 3. Data Retention Policy Schedule

| Data Category | Retention Period | Rationale / Compliance Standard |
|---|---|---|
| **Paid Customer Orders** | 7 Years | Indian Companies Act & Tax Compliance (GST Audit Regulations) |
| **Optical Prescriptions** | 5 Years | Optical Care Standards & Repeat Order History |
| **Customer Accounts & Addresses** | Indefinite (or until requested deletion) | Account Management & Active Customer Loyalty |
| **Inventory Ledger Records** | 3 Years | Inventory Audit Trail & Supply Chain Variance Tracking |
| **Audit Logs (Admin Actions)** | 3 Years | Compliance, Security Audits, and Internal Oversight |
| **Payment Verification Logs** | 7 Years | Financial Reconciliation & Razorpay Dispute Resolution |
| **Temporary Upload Slips** | 90 Days | Post-verification cleanup of intermediate upload files |

---

## 4. Automated Backup Schedule
When migrating to cloud persistence (e.g., PostgreSQL / Firestore):

1. **Daily Automated Snapshots:**
   - Executed daily at 02:00 IST during low-traffic hours.
   - Retained for 30 consecutive days.

2. **Weekly Cold Storage Backups:**
   - Encrypted and archived to geo-redundant Object Storage (AES-256).
   - Retained for 12 months.

3. **Point-In-Time Recovery (PITR):**
   - Transaction log archiving enabled with 7-day continuous PITR window.

---

## 5. Account Deletion & Right-To-Be-Forgotten
- Upon user-requested account termination, non-financial PII (name, phone, saved addresses) is soft-deleted or anonymized within 30 days.
- Financial transactions (orders, tax invoices) are retained in compliance with statutory Indian GST guidelines.
