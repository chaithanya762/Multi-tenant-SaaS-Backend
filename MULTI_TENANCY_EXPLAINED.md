# 📘 Multi-Tenant SaaS Architecture & Tenant Isolation — Beginner to Deep-Dive Guide

This document is a comprehensive, beginner-friendly, and deep-dive guide explaining how **Multi-Tenant SaaS Backends** work, how we built this application, and how **PostgreSQL Row-Level Security (RLS)** guarantees absolute data privacy.

---

## 📑 Table of Contents
1. [What is Multi-Tenancy? (The Apartment Building Analogy)](#1-what-is-multi-tenancy-the-apartment-building-analogy)
2. [Tenant Isolation Strategies Compared](#2-tenant-isolation-strategies-compared)
3. [The Golden Risk: Data Leakage](#3-the-golden-risk-data-leakage)
4. [Our 4-Guard Defense Architecture](#4-our-4-guard-defense-architecture)
5. [Codebase File-by-File Deep Dive](#5-codebase-file-by-file-deep-dive)
6. [Complete HTTP Request Lifecycle](#6-complete-http-request-lifecycle)
7. [How to Test & Verify Data Isolation](#7-how-to-test--verify-data-isolation)

---

## 1. What is Multi-Tenancy? (The Apartment Building Analogy)

Imagine you own a real estate business building homes for different families:

### 🏠 Single-Tenant Architecture (Private Houses)
- You build a **separate private house** for every single client.
- **Pros**: 100% physically separated.
- **Cons**: Extremely expensive! If you have 1,000 customers, you must deploy, maintain, and pay for 1,000 separate servers and databases.

### 🏢 Multi-Tenant Architecture (An Apartment Building)
- You build **one single apartment building**.
- All 1,000 customers live under **one roof**, sharing the same foundation, plumbing, and elevators.
- **Pros**: Super cheap to operate, instant scaling, and single-click software updates for everyone.
- **Cons**: Every tenant MUST have their own **unbreakable lock** on their door. Tenant A must NEVER be able to open Tenant B's door.

> **Definition**: A **Multi-Tenant SaaS Backend** is a single software application and database serving multiple customer organizations (tenants), while ensuring each tenant's data remains 100% private and isolated.

---

## 2. Tenant Isolation Strategies Compared

| Strategy | How it Works | Cost | Security Level | Best Used For |
| :--- | :--- | :--- | :--- | :--- |
| **1. Shared DB & Shared Schema** *(Our Choice)* | All tenants share 1 DB & 1 schema. Tables have a `tenant_id` column protected by **PostgreSQL Row-Level Security (RLS)**. | 🟢 Lowest | 🟢 Maximum *(with RLS)* | Startups, SaaS platforms, High-density apps |
| **2. Shared DB & Separate Schemas** | 1 DB, but duplicate schema templates (`tenant_a`, `tenant_b`) per customer. | 🟡 Medium | 🟡 High | Mid-market B2B SaaS |
| **3. Separate Database per Tenant** | Distinct physical DB server for each customer. | 🔴 Highest | 🟢 Maximum | FinTech, Healthcare (HIPAA/GDPR compliance) |

---

## 3. The Golden Risk: Data Leakage

In traditional web applications without RLS, developers rely on writing custom queries like:
```sql
SELECT * FROM products WHERE tenant_id = 'tenant-a';
```

### The Fatal Flaw:
If a developer forgets to add `WHERE tenant_id = 'tenant-a'` in just **ONE** repository query or endpoint:
```sql
SELECT * FROM products; -- BAD! Returns EVERY customer's data!
```
Customer B will instantly see Customer A's sensitive financial data.

---

## 4. Our 4-Guard Defense Architecture

To prevent human error and guarantee data privacy, we built **4 Security Guards** working together:

```
[ Incoming Client Request ]
           │
           ▼
┌──────────────────────────────────────┐
│ Guard 1: TenantInterceptor           │ ➔ Reads HTTP Header: X-Tenant-ID
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Guard 2: TenantContext (ThreadLocal) │ ➔ Binds tenant_id to active thread memory
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Guard 3: TenantSessionAspect (AOP)   │ ➔ Executes: SET LOCAL app.current_tenant_id = 'tenant_id'
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Guard 4: PostgreSQL Engine (RLS)     │ ➔ Enforces policy: WHERE tenant_id = current_setting(...)
└──────────────────────────────────────┘
```

---

## 5. Codebase File-by-File Deep Dive

### 🛡️ Guard 1: HTTP Header Inspector
#### [`TenantInterceptor.java`](file:///C:/Users/Student/.gemini/antigravity/scratch/multitenant-saas-backend/src/main/java/com/example/multitenant/context/TenantInterceptor.java)
- **Role**: Inspects incoming HTTP requests.
- **Method `preHandle()`**: Extracts `X-Tenant-ID` header (e.g., `acme-corp`) and stores it in `TenantContext`.
- **Method `afterCompletion()`**: Runs inside a `finally` block when the request finishes. Clears `TenantContext` to prevent memory leaks across recycled web server threads.

---

### 🛡️ Guard 2: Thread Memory Container
#### [`TenantContext.java`](file:///C:/Users/Student/.gemini/antigravity/scratch/multitenant-saas-backend/src/main/java/com/example/multitenant/context/TenantContext.java)
- **Role**: Holds `ThreadLocal<String> CURRENT_TENANT`.
- **Why ThreadLocal?**: Web servers assign one dedicated thread per HTTP request. `ThreadLocal` isolates memory so Thread #1 handling Tenant Alpha never mixes data with Thread #2 handling Tenant Beta.

---

### 🛡️ Guard 3: Spring AOP Session Aspect & JPA Entity
#### [`TenantSessionAspect.java`](file:///C:/Users/Student/.gemini/antigravity/scratch/multitenant-saas-backend/src/main/java/com/example/multitenant/config/TenantSessionAspect.java)
- **Role**: Intercepts Spring `@Service` and `@Repository` calls.
- **Action**: Runs a native SQL query on the JDBC connection before any query executes:
  ```sql
  SET LOCAL app.current_tenant_id = 'acme-corp';
  ```
- `SET LOCAL` ensures the variable is strictly scoped to the active database transaction.

#### [`AbstractTenantEntity.java`](file:///C:/Users/Student/.gemini/antigravity/scratch/multitenant-saas-backend/src/main/java/com/example/multitenant/domain/AbstractTenantEntity.java)
- **Role**: Base mapped superclass for all domain entities.
- Uses Hibernate 6 `@TenantId` and `@PrePersist` hooks to automatically attach `tenant_id` to new entities when calling `repository.save()`.

---

### 🛡️ Guard 4: Database-Level Row-Level Security
#### [`V1__init_schema_and_rls.sql`](file:///C:/Users/Student/.gemini/antigravity/scratch/multitenant-saas-backend/src/main/resources/db/migration/V1__init_schema_and_rls.sql)
- **Role**: Database migration script.
- Enforces RLS directly inside the PostgreSQL kernel:
  ```sql
  ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  ALTER TABLE products FORCE ROW LEVEL SECURITY;

  CREATE POLICY product_tenant_isolation_policy ON products
      FOR ALL
      USING (
          tenant_id = current_setting('app.current_tenant_id', true)
          OR current_setting('app.current_tenant_id', true) = 'sys_admin'
      );
  ```
- **Why RLS is Unbreakable**: Even if someone writes `SELECT * FROM products;`, PostgreSQL automatically injects `WHERE tenant_id = app.current_tenant_id` at the database kernel level!

---

## 6. Complete HTTP Request Lifecycle

Trace what happens when a client sends `GET /api/v1/products` with `X-Tenant-ID: tenant-alpha`:

```
1. Client sends request ➔ Tomcat assigns Worker Thread-1.
2. TenantInterceptor.preHandle() ➔ Reads "tenant-alpha" ➔ Calls TenantContext.setTenantId("tenant-alpha").
3. ProductController.getAllProducts() ➔ Calls ProductService.getAllProducts().
4. TenantSessionAspect intercepts ➔ Executes "SET LOCAL app.current_tenant_id = 'tenant-alpha'".
5. ProductRepository.findAll() ➔ Executes "SELECT * FROM products".
6. PostgreSQL RLS engine checks current_setting('app.current_tenant_id') -> "tenant-alpha".
7. PostgreSQL filters on disk ➔ Returns ONLY rows matching tenant_id = 'tenant-alpha'.
8. Controller returns JSON response.
9. TenantInterceptor.afterCompletion() ➔ Calls TenantContext.clear() ➔ Thread-1 wiped clean.
```

---

## 7. How to Test & Verify Data Isolation

### Automated Integration Test
Execute the Spring Boot MockMvc test suite:
```bash
cd C:\Users\Student\.gemini\antigravity\scratch\multitenant-saas-backend
mvn test
```

### Test Output Verification ([`TenantIsolationIntegrationTest.java`](file:///C:/Users/Student/.gemini/antigravity/scratch/multitenant-saas-backend/src/test/java/com/example/multitenant/TenantIsolationIntegrationTest.java)):
- Step 1: Product created for `tenant-alpha`.
- Step 2: Querying as `tenant-alpha` returns **1 product**.
- Step 3: Querying as `tenant-beta` returns **0 products** (Data isolation verified!).

---

## 🐙 GitHub Repository
The complete project is pushed and available at:
**[https://github.com/chaithanya762/Multi-tenant-SaaS-Backend](https://github.com/chaithanya762/Multi-tenant-SaaS-Backend)**
