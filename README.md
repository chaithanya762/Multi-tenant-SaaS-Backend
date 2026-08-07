# Multi-Tenant SaaS Backend — Shared Schema & Row-Level Security (RLS)

A production-ready reference architecture for building a **Multi-Tenant SaaS Backend** using **Java 21**, **Spring Boot 3.3**, **Spring Data JPA**, and **PostgreSQL Row-Level Security (RLS)**.

---

## 🏛️ Architecture Overview

This project implements a **Shared Database & Shared Schema** isolation strategy.

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Client Request                      │
│                (Header: X-Tenant-ID: tenant-a)              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    TenantInterceptor                        │
│         - Extracts X-Tenant-ID header                       │
│         - Stores tenant_id in ThreadLocal TenantContext     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   TenantSessionAspect                       │
│  Executes: SET LOCAL app.current_tenant_id = 'tenant-a'    │
│  on JDBC Connection checkout before executing SQL query     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL RLS Engine                       │
│  Enforces DB-Level Policy:                                  │
│  USING (tenant_id = current_setting('app.current_tenant_id'))│
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

1. **PostgreSQL Row-Level Security (RLS)**: Enforces tenant isolation natively inside PostgreSQL engine. Even direct SQL queries cannot bypass isolation if `app.current_tenant_id` is set.
2. **ThreadLocal Context Lifecycle**: `TenantContext` safely binds the active tenant ID per request and automatically wipes context in `afterCompletion` to prevent thread pool cross-contamination.
3. **Hibernate `@TenantId` Integration**: Uses Hibernate 6's `@TenantId` and `@PrePersist` hooks to automatically attach active tenant ID to new entities.
4. **Automated Schema Migrations**: Managed via Flyway (`V1__init_schema_and_rls.sql`).
5. **Integration Testing Suite**: Full Spring Boot MockMvc test suite verifying data isolation across tenants.

---

## 💻 REST API Endpoints

### 1. Onboard a New Tenant
```http
POST /api/v1/tenants
Content-Type: application/json

{
  "id": "acme-corp",
  "name": "Acme Corporation"
}
```

### 2. Create Product (Tenant Scoped)
```http
POST /api/v1/products
X-Tenant-ID: acme-corp
Content-Type: application/json

{
  "name": "Enterprise Cloud Server",
  "description": "High performance compute instance",
  "price": 299.99,
  "stockQuantity": 15
}
```

### 3. List Products (Tenant Scoped)
```http
GET /api/v1/products
X-Tenant-ID: acme-corp
```

---

## 🧪 Running Tests

Execute automated unit and integration tests using Maven wrapper:

```bash
./mvnw test
```

---

## 🛠️ Running Locally with Docker / PostgreSQL

1. Start a PostgreSQL database:
```bash
docker run --name multitenant-postgres \
  -e POSTGRES_DB=multitenant_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:16-alpine
```

2. Run the application:
```bash
./mvnw spring-boot:run
```
