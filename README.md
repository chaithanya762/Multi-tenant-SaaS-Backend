# Multi-Tenant SaaS Backend — Shared Schema & Row-Level Security (RLS)

[![Java 17](https://img.shields.io/badge/Java-17-orange.svg)](https://jdk.java.net/17/)
[![Spring Boot 3.3](https://img.shields.io/badge/Spring--Boot-3.3.2-green.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL RLS](https://img.shields.io/badge/PostgreSQL-Row--Level--Security-blue.svg)](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
[![React Claymorphic](https://img.shields.io/badge/UI-Claymorphic--React-61dafb.svg)](https://react.dev)
[![License MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

A production-grade reference architecture for building a **Multi-Tenant SaaS Backend & Management Console** using **Java 17**, **Spring Boot 3.3**, **PostgreSQL Row-Level Security (RLS)**, and a **Minimalist Claymorphic React UI**.

---

## 🏛️ Architecture Overview

This project implements a **Shared Database & Shared Schema** isolation strategy backed by PostgreSQL Row-Level Security (RLS).

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Client Request                      │
│                (Header: X-Tenant-ID: tenant-alpha)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    TenantInterceptor                        │
│         - Extracts X-Tenant-ID header                       │
│         - Binds tenant_id to ThreadLocal TenantContext      │
│         - Throws 400 Bad Request if header is missing       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   TenantSessionAspect                       │
│  Executes: SET LOCAL app.current_tenant_id = 'tenant-alpha' │
│  on JDBC Connection checkout before executing SQL query     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL RLS Engine                       │
│  Enforces DB-Level Policy:                                  │
│  USING (tenant_id = current_setting('app.current_tenant_id'))│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Minimalist Claymorphic React UI               │
│  Interactive console with tenant switching, product/order   │
│  management, and live RLS data isolation verification.      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

1. **PostgreSQL Row-Level Security (RLS)**: Enforces tenant isolation natively inside PostgreSQL engine. Even direct database connections or raw SQL cannot breach tenant boundaries.
2. **ThreadLocal Security Lifecycle**: `TenantContext` safely manages tenant context per request and wipes memory in `afterCompletion` to prevent context leaks across pooled server threads.
3. **Hibernate `@TenantId` Integration**: Uses Hibernate 6's `@TenantId` and `CurrentTenantIdentifierResolver` to automatically scope JPA entity operations.
4. **Claymorphic React UI**: Modern 3D tactile UI with light/dark theme toggle, active tenant selector pill, products catalog, order ledger, and interactive RLS verification workbench.
5. **Zero-Dependency Local Dev Engine**: Automatic fallback to an in-memory H2 PostgreSQL-compatible profile (`local`) if PostgreSQL is not running locally.
6. **Structured Global Error Handling**: Centralized `@RestControllerAdvice` mapping exceptions to standard API JSON responses (400, 404, 409, 422, 500).
7. **OpenAPI 3.0 & Actuator Telemetry**: Embedded Swagger UI at `/swagger-ui.html` and Prometheus metrics stream at `/actuator/prometheus`.

---

## 💻 REST API Reference

### 1. Tenants API (Global Scope)
- `POST /api/v1/tenants` — Register a new tenant organization
- `GET /api/v1/tenants` — List all registered tenant organizations
- `GET /api/v1/tenants/{id}` — Get tenant by ID

### 2. Products API (Tenant Scoped — Requires `X-Tenant-ID` Header)
- `POST /api/v1/products` — Create product for active tenant
- `GET /api/v1/products?page=0&size=20` — Paginated product list for active tenant
- `GET /api/v1/products/{id}` — Get product by ID

### 3. Orders API (Tenant Scoped — Requires `X-Tenant-ID` Header)
- `POST /api/v1/orders` — Create order for active tenant
- `GET /api/v1/orders?page=0&size=20` — Paginated order list for active tenant
- `GET /api/v1/orders/{id}` — Get order by ID
- `GET /api/v1/orders?email=customer@domain.com` — Filter tenant orders by customer email

---

## 🚀 Quick Start Guide

### Option 1: Convenience PowerShell Scripts

```powershell
# 1. Start Spring Boot Backend (auto-detects Postgres or starts H2 mode)
.\run-backend.ps1

# 2. Start Claymorphic React UI Dev Server
.\run-frontend.ps1
```

- **Claymorphic UI**: [http://localhost:3000](http://localhost:3000) (or embedded at [http://localhost:8080](http://localhost:8080))
- **Swagger API Docs**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Actuator Health**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

### Option 2: Docker Compose (PostgreSQL + Spring Boot + Embedded React UI)

```powershell
docker compose up --build
```

---

## 👨‍💻 Author

- **GitHub**: [@chaithanya762](https://github.com/chaithanya762)
- **Email**: chaithanyagowda762@gmail.com
- **Project Repository**: [Multi-tenant-SaaS-Backend](https://github.com/chaithanya762/Multi-tenant-SaaS-Backend)
