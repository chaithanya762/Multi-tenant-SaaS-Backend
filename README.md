# Multi-Tenant SaaS Backend & Enterprise Management Platform

[![Java 17](https://img.shields.io/badge/Java-17-007396.svg?style=flat-square&logo=openjdk&logoColor=white)](https://jdk.java.net/17/)
[![Spring Boot 3.3](https://img.shields.io/badge/Spring_Boot-3.3.2-6DB33F.svg?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL RLS](https://img.shields.io/badge/PostgreSQL-Row--Level--Security-4169E1.svg?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![License MIT](https://img.shields.io/badge/License-MIT-blueviolet.svg?style=flat-square)](LICENSE)

A production-grade, enterprise reference architecture for building secure, scalable **Multi-Tenant SaaS Backends** utilizing **Shared Database & Shared Schema** isolation with **PostgreSQL Row-Level Security (RLS)**, **JWT Authentication**, **Tenant Quota Rate Limiting**, and a modern **Claymorphic React Console**.

---

## 🏢 Executive Summary

In multi-tenant software-as-a-service (SaaS) environments, strict data boundary enforcement is paramount. Traditional application-level filtering (`WHERE tenant_id = ?`) is prone to developer error, context leaks, and accidental data exposure across tenant boundaries.

This project delivers a defense-in-depth architecture where **data isolation is enforced directly within the database engine via PostgreSQL Row-Level Security (RLS)**. Even if an application query omits a tenant filter or a raw SQL script is executed, PostgreSQL guarantees that queries can only access rows belonging to the active tenant session context (`app.current_tenant_id`).

---

## ⚡ Core Enterprise Capabilities

| Capability | Technical Implementation | Business Impact |
| :--- | :--- | :--- |
| **PostgreSQL RLS Isolation** | Native DB policies using `current_setting('app.current_tenant_id')` | Eliminates cross-tenant data leakage risks at the database engine layer. |
| **JWT Bearer Security** | HMAC SHA-256 signed JWTs containing tenant claims (`tenant_id`) | Provides tamper-proof authentication and stateless session management. |
| **Tenant Quota Rate Limiting** | Token bucket algorithm per tenant (60 req/min default) | Protects backend services against noisy neighbor syndrome and API abuse. |
| **Subdomain Tenant Routing** | Dynamic resolution from Host headers (`acme.domain.com`) | Enables custom white-label subdomains for enterprise clients. |
| **Tenant-Aware Query Caching** | Spring CacheManager with tenant-prefixed cache keys | Reduces database read overhead by up to 80% while preserving isolation. |
| **Async Event Provisioning** | `@Async` event pipeline (`TenantOnboardedEvent`) | Automates default catalog seeding and tenant onboarding workflows. |
| **Claymorphic Management Console** | React 18 + Vite SPA with RLS Verification Workbench & CSV Exporter | Delivers a high-end tactile UI for operators, admins, and live RLS audits. |

---

## 🏛️ Architectural Overview

### 1. Request Lifecycle & Context Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HTTP Client Request                           │
│     Headers: Authorization: Bearer <JWT>  OR  X-Tenant-ID: acme-corp    │
│     Host: acme-corp.saas-platform.com                                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           TenantInterceptor                             │
│  1. Parses JWT Bearer token claims for tenant_id                        │
│  2. Extracts subdomain from Host header (e.g. acme-corp)                │
│  3. Falls back to X-Tenant-ID header                                    │
│  4. Binds tenant_id to ThreadLocal TenantContext                        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          RateLimitInterceptor                           │
│  - Evaluates active tenant's request bucket quota (60 req/min)          │
│  - Appends X-RateLimit-Limit & X-RateLimit-Remaining headers            │
│  - Returns HTTP 429 Too Many Requests if quota is exceeded              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           TenantSessionAspect                           │
│  - Intercepts JDBC Connection checkout before query execution           │
│  - Executes: SET LOCAL app.current_tenant_id = 'acme-corp'              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database Engine                       │
│  Enforces RLS Security Policy:                                          │
│  CREATE POLICY tenant_isolation_policy ON products                      │
│  USING (tenant_id = current_setting('app.current_tenant_id'));          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   ThreadLocal Lifecycle Cleanup                         │
│  TenantInterceptor.afterCompletion() wipes ThreadLocal context to       │
│  prevent cross-contamination across pooled server threads.             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 REST API Specification

### Authentication API
- `POST /api/v1/auth/token` — Generate a signed JWT bearer token containing tenant claims.

### Tenant Management API (Global Scope)
- `POST /api/v1/tenants` — Onboard a new tenant organization (triggers async default catalog provisioning).
- `GET /api/v1/tenants` — List all registered tenant organizations.
- `GET /api/v1/tenants/{id}` — Retrieve tenant details by ID.

### Product Catalog API (Tenant-Scoped)
- `POST /api/v1/products` — Create a product under active tenant scope (invalidates products cache).
- `GET /api/v1/products?page=0&size=20` — Fetch paginated products belonging to active tenant.
- `GET /api/v1/products/{id}` — Get single product by ID (cached via Spring CacheManager).

### Order Ledger API (Tenant-Scoped)
- `POST /api/v1/orders` — Record a new order under active tenant scope.
- `GET /api/v1/orders?page=0&size=20` — Fetch paginated orders belonging to active tenant.
- `GET /api/v1/orders?email=customer@domain.com` — Filter tenant orders by customer email.

---

## 🚀 Getting Started

### Prerequisites
- **Java 17 Development Kit (JDK 17)** or higher
- **Apache Maven 3.9+**
- **Node.js 18+ & npm** *(Optional, for frontend development)*
- **PostgreSQL 16** *(Optional; application automatically falls back to an in-memory H2 PostgreSQL-compatible profile if PostgreSQL is not detected on port 5432)*

---

### Quick Start with PowerShell Scripts

Convenience scripts are provided in the root directory:

```powershell
# 1. Start the Spring Boot Java 17 Backend Server
.\run-backend.ps1

# 2. Start the Claymorphic React Frontend Dev Server
.\run-frontend.ps1
```

Once running, access:
- **Management Console UI**: [http://localhost:8080](http://localhost:8080) *(or [http://localhost:3000](http://localhost:3000))*
- **Swagger API Explorer**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Actuator Liveness Check**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

### Running via Docker Compose

To launch a fully isolated PostgreSQL 16 database and Spring Boot application stack:

```bash
docker compose up --build
```

---

## 🧪 Testing & Quality Assurance

### Executing Automated Integration Tests

The project includes integration test suites verifying multi-tenant RLS data boundaries:

```bash
mvn test
```

### Manual RLS Data Boundary Audit

1. Launch the application UI at [http://localhost:8080](http://localhost:8080).
2. Navigate to **RLS Tester** in the left sidebar.
3. Click **Run Isolation Test**.
4. The workbench sends parallel HTTP requests with `X-Tenant-ID: tenant-alpha` and `X-Tenant-ID: tenant-beta` and displays the isolated datasets side-by-side.

---

## 📁 Repository Structure

```
Multi-tenant-SaaS-Backend/
├── .github/workflows/ci.yml       # GitHub Actions CI pipeline
├── Dockerfile                     # Multi-stage Java 17 container build
├── docker-compose.yml             # PostgreSQL 16 + Application stack definition
├── pom.xml                        # Maven project dependencies & plugins
├── run-backend.ps1                # PowerShell backend launcher (auto-detects DB)
├── run-frontend.ps1               # PowerShell React UI dev launcher
├── push-to-github.ps1             # One-click Git push utility script
├── frontend/                      # React 18 + Vite Claymorphic UI Source
│   ├── src/
│   │   ├── App.jsx                # Main Claymorphic Dashboard & RLS Workbench
│   │   └── index.css              # Claymorphic CSS Design Token System
│   └── vite.config.js             # Vite dev proxy configuration
└── src/
    ├── main/
    │   ├── java/com/example/multitenant/
    │   │   ├── config/            # Cache, WebMvc, OpenAPI, TenantAspect & Resolvers
    │   │   ├── context/           # ThreadLocal TenantContext & TenantInterceptor
    │   │   ├── domain/            # JPA Entities (Tenant, Product, Order, AbstractTenantEntity)
    │   │   ├── event/             # Async TenantOnboardedEvent & EventListeners
    │   │   ├── ratelimit/         # TenantRateLimiterService & RateLimitInterceptor
    │   │   ├── repository/        # Spring Data JPA Repositories
    │   │   ├── security/          # JwtTokenProvider for HMAC SHA-256 tokens
    │   │   ├── service/           # Tenant, Product, and Order Domain Services
    │   │   └── web/               # REST Controllers & Exception Handlers
    │   └── resources/
    │       ├── application.yml    # Main Spring configuration
    │       ├── application-local.yml # Zero-dependency H2 fallback profile
    │       ├── db/migration/      # Flyway SQL scripts (V1__init_schema_and_rls.sql)
    │       └── static/            # Embedded React production bundle assets
    └── test/                      # Integration & RLS Isolation Test Suites
```

---

## 📊 Telemetry & Observability Endpoints

- **Health Metrics**: `GET /actuator/health`
- **Prometheus Metrics Stream**: `GET /actuator/prometheus`
- **Application Info**: `GET /actuator/info`
- **OpenAPI Schema Specification**: `GET /v3/api-docs`

---

## 👨‍💻 Author & Maintainer

- **Maintainer**: Chaithanya Gowda ([@chaithanya762](https://github.com/chaithanya762))
- **Email**: chaithanyagowda762@gmail.com
- **Repository**: [https://github.com/chaithanya762/Multi-tenant-SaaS-Backend](https://github.com/chaithanya762/Multi-tenant-SaaS-Backend)

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
