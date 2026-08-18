# Multi-Tenant SaaS Platform — Master Testing Guide

This document provides a comprehensive, step-by-step manual to test every feature, architectural security boundary, and operational module of the Multi-Tenant SaaS Platform.

---

## 📋 System Prerequisites & URLs

| Component | Target URL |
|---|---|
| **Frontend Application (Local Dev)** | [http://localhost:3000/](http://localhost:3000/) |
| **Backend Core REST API (Live Render)** | [https://multitenant-backend-4lh0.onrender.com](https://multitenant-backend-4lh0.onrender.com) |
| **Interactive Swagger / OpenAPI Docs** | [https://multitenant-backend-4lh0.onrender.com/swagger-ui.html](https://multitenant-backend-4lh0.onrender.com/swagger-ui.html) |
| **Production Health & Actuator Probes** | [https://multitenant-backend-4lh0.onrender.com/actuator/health](https://multitenant-backend-4lh0.onrender.com/actuator/health) |

---

## Phase 1: Dual-Theme UI & Design Verification

### Test 1.1: Light Mode / Dark Mode Toggle on Login Screen
1. Open **[http://localhost:3000/](http://localhost:3000/)** in your browser.
2. In the top-right corner of the authentication page, click the **"Light Mode" / "Dark Mode"** toggle button.
3. **Verification**:
   - **Dark Mode**: Background is slate charcoal (`#0d131f`), card is deep slate (`#182238`), inputs are crisp navy with high-contrast text.
   - **Light Mode**: Background switches to clean light gray (`#f8fafc`), card turns crisp white (`#ffffff`), input boxes adapt with subtle `#e2e8f0` borders and dark text.
   - Theme selection persists across reloads via `localStorage`.

---

## Phase 2: Multi-Tenant Onboarding & JWT Authentication

### Test 2.1: Register a New Tenant Administrator
1. On the authentication card, click **"Create a new account"**.
2. Enter the following details:
   - **Tenant Identifier**: `tenant-alpha`
   - **Username**: `alpha-admin`
   - **Email Address**: `admin@alpha.com`
   - **Password**: `password123`
3. Click **"Register Administrator"**.
4. **Verification**:
   - A green toast appears: `Registration successful. Please sign in.`
   - In the database, the tenant boundary row `tenant-alpha` is automatically provisioned in the `tenants` table, and the user `alpha-admin` is securely inserted with a salted BCrypt password hash.

### Test 2.2: Sign In with JWT Authentication
1. Click **"Already have an account? Sign in"**.
2. Enter:
   - **Tenant Identifier**: `tenant-alpha`
   - **Username**: `alpha-admin`
   - **Password**: `password123`
3. Click **"Sign In"**.
4. **Verification**:
   - A green toast confirms `Welcome, alpha-admin`.
   - The user is redirected to the **Tenant Dashboard** (`/`).
   - The topbar displays the active tenant badge: `Tenant: tenant-alpha`.
   - The browser stores the signed JWT access token (15-minute validity) and refresh token (30-day validity).

---

## Phase 3: Product Catalog & Inventory Management

### Test 3.1: Create Products within Tenant Context
1. In the left navigation sidebar, click **"Products"**.
2. Click the **"+ Add Product"** button in the top right.
3. In the modal, fill in:
   - **Product Name**: `Edge AI Accelerator`
   - **Description**: `Hardware accelerated ML inference module`
   - **Price ($)**: `899.00`
   - **Stock Quantity**: `40`
4. Click **"Create"**.
5. **Verification**:
   - The product is immediately added to the data table with price `$899.00` and stock `40`.
   - The product row is tagged with `tenant_id = 'tenant-alpha'` in PostgreSQL.

---

## Phase 4: Order Lifecycle & Fulfillment

### Test 4.1: Create and Track Tenant Orders
1. In the left navigation sidebar, click **"Orders"**.
2. Click the **"+ Create Order"** button in the top right.
3. In the modal, fill in:
   - **Customer Email**: `procurement@enterprise.com`
   - **Total Amount ($)**: `1798.00`
   - **Status**: `COMPLETED`
4. Click **"Create Order"**.
5. **Verification**:
   - The order appears in the data table with reference `#{id}`, customer email, amount `$1798.00`, and badge `COMPLETED`.
   - The top stat cards update:
     - **Gross Order Volume**: `$1,798.00`
     - **Completed Orders**: `1`

---

## Phase 5: Team Access & Role Management

### Test 5.1: Add a New Team Member to Current Tenant
1. In the left navigation sidebar, click **"Users"**.
2. Click the **"+ Add Member"** button in the top right.
3. Fill in:
   - **Username**: `alpha-dev`
   - **Email Address**: `dev@alpha.com`
   - **Password**: `password123`
   - **Role**: `Team Member` (`ROLE_TENANT_USER`)
4. Click **"Add Member"**.
5. **Verification**:
   - `alpha-dev` appears in the users table with `Status: Active`.

### Test 5.2: Deactivate a Team Member
1. Click the **"Deactivate"** button next to `alpha-dev`.
2. Confirm the action in the dialog.
3. **Verification**:
   - The user status changes to a red `Inactive` badge.
   - Future login attempts for this user will return an authorization rejection (`User account is deactivated`).

---

## Phase 6: Developer Platform — API Keys & Webhooks

### Test 6.1: Generate Programmatic API Keys
1. In the left navigation sidebar, click **"API Keys"**.
2. Under **Generate New API Key**, enter:
   - **Key Name / Description**: `ERP Ingestion Pipeline`
3. Click **"Generate Secret Key"**.
4. **Verification**:
   - A secret token starting with `ak_live_...` appears in a highlighted green box.
   - The key is recorded in the **Active Credentials** table with its creation date and scopes.

### Test 6.2: Real-Time Webhook Event Triggering
1. Open a new browser tab and navigate to **[https://webhook.site](https://webhook.site/)** to copy a free unique test webhook URL.
2. In the SaaS Console, click **"Webhooks"** in the sidebar.
3. Click **"+ Add Webhook Endpoint"** and paste your webhook URL, selecting `order.created`.
4. Return to **Orders** and create a new order.
5. **Verification**: Check your `webhook.site` tab to see the incoming HTTP POST request containing the event payload and timestamp in real time.

---

## Phase 7: Audit Logging & Security Trail

### Test 7.1: Inspect Immutable Security Audit Records
1. In the left navigation sidebar, click **"Audit Log"**.
2. **Verification**:
   - The table displays tamper-evident log records for all recent administrative events:
     - `USER_LOGIN`
     - `PRODUCT_CREATED`
     - `ORDER_PLACED`
     - `USER_REGISTERED`
     - `API_KEY_GENERATED`
   - Inspect the **Timestamp**, **Actor Username** (`alpha-admin`), **Tenant ID** (`tenant-alpha`), and **Resource ID**.

---

## Phase 8: PostgreSQL Row-Level Security (RLS) Cross-Tenant Isolation Test

*This is the core architectural test proving kernel-level data separation between competing organizations.*

### Test 8.1: Run In-App RLS Inspector
1. In the left navigation sidebar, click **"RLS Inspector"**.
2. Click **"Verify RLS Isolation"**.
3. **Verification**: The database engine runs live queries with session variable `SET app.current_tenant_id = 'tenant-alpha'` and verifies that only `tenant-alpha` records are returned.

### Test 8.2: Verify Zero Data Leakage Across Tenants
1. Click **"Sign Out"** at the bottom of the left sidebar.
2. Click **"Create a new account"** and register a second, independent tenant:
   - **Tenant Identifier**: `tenant-beta`
   - **Username**: `beta-admin`
   - **Email Address**: `admin@beta.com`
   - **Password**: `password123`
3. Click **"Register Administrator"**, switch to **Sign In**, and log in as `beta-admin`.
4. Go to **"Products"** and **"Orders"**:
   - **Verification**: The tables are completely **empty** (`No records found`).
   - `tenant-beta` has zero visibility into `tenant-alpha`'s products (`Edge AI Accelerator`) or orders (`$1,798.00`), confirming full multi-tenant data isolation.

---

## Phase 9: Telemetry, Observability & Swagger Docs

### Test 9.1: Swagger / OpenAPI Interactive Documentation
1. Open **[https://multitenant-backend-4lh0.onrender.com/swagger-ui.html](https://multitenant-backend-4lh0.onrender.com/swagger-ui.html)**.
2. Expand any endpoint (e.g. `GET /api/v1/tenants`).
3. Click **"Try it out"** $\rightarrow$ **"Execute"**.
4. **Verification**: Returns `HTTP 200` with the live JSON schema response.

### Test 9.2: Actuator Health & Database Probes
1. Open **[https://multitenant-backend-4lh0.onrender.com/actuator/health](https://multitenant-backend-4lh0.onrender.com/actuator/health)**.
2. **Verification**: Returns `{"status":"UP","groups":["liveness","readiness"]}`.
