
---

## 1. What is "SaaS"?

**SaaS** stands for **Software as a Service**.
- In the old days (1990s), you bought a CD-ROM with Microsoft Office or QuickBooks, installed it on your computer, and ran it locally.
- Today, you go to a website (like Slack, Shopify, Netflix, or Salesforce), log in, and use the software in your browser. That is SaaS.

---

## 2. What is "Multi-Tenancy"? (The Apartment Analogy)

Imagine you want to build a software product and sell it to 1,000 different companies (Company A, Company B, Company C).

### Option 1: Single-Tenant (The Suburb of Mansions 🏡)
- For Company A: You buy a server and a database.
- For Company B: You buy another server and another database.
- For Company C: You buy yet another server and database.
* **The Problem**: Huge cloud bills! Maintaining 1,000 separate servers is a nightmare.

### Option 2: Multi-Tenant (The Modern Apartment Building 🏢) — *WHAT YOU BUILT!*
- You have **ONE backend server** and **ONE shared database**.
- All 1,000 companies live in the same building.
- BUT: Company A has the key to Apartment 101. Company B has the key to Apartment 102.
- **Rule #1 of Multi-Tenancy**: Company A must NEVER be able to see, modify, or steal Company B's data. If Company A sees Company B's customer orders, your company gets sued into bankruptcy!

---

## 3. What Does this Project Actually Do?

This project is an **Enterprise Multi-Tenant SaaS Platform**. It is a full-stack platform providing:

1. **Tenant Onboarding & Isolation**:
   - Multiple businesses (tenants) can sign up (e.g. `tenant-alpha`, `tenant-beta`).
   - Every product, order, user, and API key belongs to a specific `tenant_id`.

2. **Bulletproof Database Isolation (PostgreSQL RLS)**:
   - Instead of just checking `WHERE tenant_id = 'xxx'` in Java code (which a developer could forget to write!), the **database itself enforces isolation** using PostgreSQL Row-Level Security (RLS).
   - Even if a developer makes a coding mistake in Java, PostgreSQL will physically refuse to return another tenant's rows!

3. **User Management & Security**:
   - Authentication using **JWT (JSON Web Tokens)** and **BCrypt** password hashing.
   - **Role-Based Access Control (RBAC)**:
     - `SYS_ADMIN` (You / The Platform Owner): Can create, suspend, or delete tenants, and view system metrics.
     - `TENANT_ADMIN` (The boss of Company A): Can invite users, configure webhooks, generate API keys, and manage their store.
     - `TENANT_USER` (An employee of Company A): Can only view and create products/orders for their company.

4. **E-Commerce / Business Features**:
   - Product Catalog (`/api/v1/products`) with stock and prices.
   - Order Management (`/api/v1/orders` and line items).
   - Audit Logging (`/api/v1/audit-log`): Records who did what, when, and from what IP address.
   - Webhook System (`/api/v1/webhooks`): Sends HTTP notifications to external URLs when events happen (like order created).
   - API Keys (`/api/v1/api-keys`): Allows tenants to interact with the backend via automated scripts.
   - Subscription Plans & Metering: Free, Starter, Professional, Enterprise tiers with usage limits.

5. **A Modern Frontend Dashboard**:
   - Built with **React 19 + Vite** featuring Dark/Light themes, interactive charts, modals, and an "RLS Tester" that lets you test cross-tenant attacks in real time.

---

## 4. Why This Architecture is a Big Deal

Most junior developers build multi-tenant apps by simply writing:
```sql
SELECT * FROM products WHERE tenant_id = 'tenant-alpha';
```
If someone forgets `WHERE tenant_id = ...`, all products from every customer leak onto the internet.

Your project uses **PostgreSQL Row-Level Security (RLS)** combined with **Spring AOP session interception**. Every time a query runs, the database session is tagged with `SET LOCAL app.current_tenant_id = 'tenant-alpha'`. The database kernel enforces isolation automatically.

Next, open [`02_ARCHITECTURE_AND_TECH_STACK.md`](02_ARCHITECTURE_AND_TECH_STACK.md) to see all the moving parts.
