<p align="center">
  <img src="https://img.shields.io/badge/Spring_Boot-3.3.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 17" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<h1 align="center">🏢 Multi-Tenant SaaS Platform</h1>

<p align="center">
  <strong>A production-grade, multi-tenant SaaS backend with PostgreSQL Row-Level Security, JWT authentication, and a modern React admin console.</strong>
</p>

<p align="center">
  <a href="https://multitenant-backend-4lh0.onrender.com/swagger-ui.html">Live API Docs</a> ·
  <a href="https://multitenant-backend-4lh0.onrender.com/actuator/health">Health Check</a> ·
  <a href="#-getting-started">Getting Started</a> ·
  <a href="#-api-reference">API Reference</a>
</p>

---

## 📖 Overview

This platform demonstrates a **shared-schema, multi-tenant architecture** where all tenants coexist in a single PostgreSQL database, but are hermetically isolated at the database kernel level using **Row-Level Security (RLS) policies**. Every query is automatically scoped to the authenticated tenant — no application-level `WHERE` clauses needed, no data leakage possible.

The system ships with a complete **React admin console** featuring dual-theme support, real-time dashboards, order management, team access controls, developer API key generation, webhook event dispatch, immutable audit logging, and a live RLS isolation inspector.

---

## ✨ Key Features

### 🔐 Security & Isolation
- **PostgreSQL Row-Level Security (RLS)** — Kernel-level tenant data isolation enforced directly by the database engine
- **JWT Authentication** — Stateless access tokens (15 min) with long-lived refresh tokens (30 days)
- **BCrypt Password Hashing** — Industry-standard salted password storage
- **Tenant-Aware Session Injection** — AOP-driven `set_config('app.current_tenant_id', ?)` on every database transaction
- **Cross-Tenant Leak Prevention** — JWT tenant claims are validated against request headers to prevent privilege escalation

### 📊 Admin Console (React)
- **Real-Time Dashboard** — Revenue metrics, order volume, active users, and tenant health at a glance
- **Product Catalog** — Full CRUD with stock tracking and tenant-scoped inventory
- **Order Management** — Create, track, and manage orders with status lifecycle (Pending → Completed → Cancelled)
- **Team Management** — Invite members, assign roles (`ADMIN` / `TENANT_USER`), activate/deactivate accounts
- **Dual Theme** — Polished Dark Mode and Light Mode with `localStorage` persistence
- **RLS Inspector** — Live, in-app tool that proves zero cross-tenant data leakage

### 🛠 Developer Platform
- **Programmatic API Keys** — Generate `ak_live_*` secret tokens for headless integrations
- **Webhook Endpoints** — Register HTTP callback URLs and receive real-time event notifications
- **Immutable Audit Log** — Tamper-evident trail of every administrative action with actor, resource, and timestamp

### 📦 Operations & Observability
- **Flyway Schema Migrations** — 8 versioned migrations for fully reproducible database state
- **Spring Boot Actuator** — `/actuator/health`, liveness/readiness probes, and Prometheus metrics
- **Micrometer + Prometheus** — Production-grade metrics exporter for Grafana dashboards
- **GitHub Actions CI** — Automated build & test on every push with PostgreSQL service container
- **Docker Compose** — One-command local stack: PostgreSQL 16 + Redis 7 + Spring Boot + React
- **Render Deployment** — IaC-defined `render.yaml` with managed PostgreSQL and zero-downtime deploys

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        React Admin Console                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Dashboard │ │Products  │ │Orders    │ │Users     │ │API Keys│ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
└───────┼────────────┼────────────┼────────────┼────────────┼──────┘
        │            │            │            │            │
        ▼            ▼            ▼            ▼            ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Spring Boot REST API                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  TenantInterceptor → JWT Validation → X-Tenant-ID Header  │  │
│  │  ↓                                                         │  │
│  │  TenantContext.setTenantId(tenantId)                       │  │
│  │  ↓                                                         │  │
│  │  TenantSessionAspect (@Before every Repository call)       │  │
│  │  → SET app.current_tenant_id = '{tenantId}'                │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │AuthCtrl  │ │OrderCtrl │ │ProductCtrl│ │AuditCtrl │  ...      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   PostgreSQL 16 + Row-Level Security             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CREATE POLICY product_tenant_isolation_policy            │   │
│  │    ON products FOR ALL                                    │   │
│  │    USING (tenant_id = current_setting('app.current_       │   │
│  │           tenant_id', true))                              │   │
│  │    WITH CHECK (tenant_id = current_setting('app.current_  │   │
│  │           tenant_id', true));                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │tenants │ │products│ │orders  │ │users   │ │api_keys│  ...    │
│  │        │ │  (RLS) │ │  (RLS) │ │  (RLS) │ │  (RLS) │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

### How RLS Tenant Isolation Works

1. **Request arrives** → `TenantInterceptor` extracts the tenant ID from the JWT token (or `X-Tenant-ID` header for auth endpoints)
2. **Context is set** → `TenantContext.setTenantId(tenantId)` stores the tenant in a `ThreadLocal`
3. **Session is configured** → Before every `@Repository` call, an AOP aspect executes `SELECT set_config('app.current_tenant_id', ?, true)` on the PostgreSQL session
4. **RLS enforces isolation** → PostgreSQL's row-level security policies filter every `SELECT`, `INSERT`, `UPDATE`, and `DELETE` to only rows matching the active tenant
5. **Context is cleared** → `afterCompletion()` clears the `ThreadLocal` and MDC to prevent cross-request contamination

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Java 17 (Eclipse Temurin) | Language & JVM |
| **Framework** | Spring Boot 3.3.2 | REST API, DI, AOP, Security |
| **Security** | Spring Security + JJWT 0.12.6 | Authentication, JWT, BCrypt |
| **Database** | PostgreSQL 16 | Primary data store with RLS |
| **Migrations** | Flyway | Versioned schema management |
| **Caching** | Spring Cache + Redis 7 | Distributed caching & rate limiting |
| **Metrics** | Micrometer + Prometheus | Observability & monitoring |
| **API Docs** | SpringDoc OpenAPI 2.6.0 | Interactive Swagger UI |
| **Frontend** | React 18 + Vite | Admin console SPA |
| **Styling** | CSS Custom Properties | Dual-theme (Dark/Light) design system |
| **Testing** | JUnit 5 + Testcontainers | Integration tests with real PostgreSQL |
| **CI/CD** | GitHub Actions | Automated build & test pipeline |
| **Container** | Docker + Docker Compose | Multi-stage build, local dev stack |
| **Hosting** | Render | Production deployment with managed DB |

---

## 🚀 Getting Started

### Prerequisites

- **Java 17+** — [Download Eclipse Temurin](https://adoptium.net/)
- **Node.js 18+** — [Download Node.js](https://nodejs.org/)
- **Docker & Docker Compose** — [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Git** — [Download Git](https://git-scm.com/)

### Option 1: Docker Compose (Recommended)

Spin up the entire stack — PostgreSQL, Redis, Spring Boot backend, and React frontend — with a single command:

```bash
# Clone the repository
git clone https://github.com/chaithanya762/Multi-tenant-SaaS-Backend.git
cd Multi-tenant-SaaS-Backend

# Launch all services
docker-compose up --build

# Access the application
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8080
# Swagger:   http://localhost:8080/swagger-ui.html
```

### Option 2: Local Development

#### 1. Start the Database

```bash
# Start PostgreSQL and Redis only
docker-compose up postgres redis -d
```

#### 2. Run the Backend

```bash
# Build and run with Maven Wrapper
./mvnw spring-boot:run

# Backend will start on http://localhost:8080
```

#### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev

# Frontend will start on http://localhost:3000
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/multitenant_db` | PostgreSQL connection string |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` | Database password |
| `JWT_SECRET` | *(required)* | HMAC-SHA256 signing key (min 64 chars) |
| `JWT_EXPIRY_MS` | `900000` | Access token TTL (15 minutes) |
| `JWT_REFRESH_EXPIRY_MS` | `2592000000` | Refresh token TTL (30 days) |
| `REDIS_HOST` | `localhost` | Redis host for caching |
| `REDIS_PORT` | `6379` | Redis port |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Frontend → Backend API target |

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`. Tenant-scoped endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new tenant administrator |
| `POST` | `/api/v1/auth/login` | Authenticate and receive JWT tokens |
| `POST` | `/api/v1/auth/refresh` | Refresh an expired access token |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/products` | List all products for current tenant |
| `POST` | `/api/v1/products` | Create a new product |
| `GET` | `/api/v1/products/{id}` | Get product by ID |
| `PUT` | `/api/v1/products/{id}` | Update a product |
| `DELETE` | `/api/v1/products/{id}` | Delete a product |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/orders` | List all orders for current tenant |
| `POST` | `/api/v1/orders` | Create a new order |
| `GET` | `/api/v1/orders/{id}` | Get order by ID |
| `PUT` | `/api/v1/orders/{id}` | Update an order |

### Users & Team Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users` | List all users in current tenant |
| `POST` | `/api/v1/users` | Add a new team member |
| `PUT` | `/api/v1/users/{id}/deactivate` | Deactivate a user account |

### API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/api-keys` | List all API keys for current tenant |
| `POST` | `/api/v1/api-keys` | Generate a new API key |
| `DELETE` | `/api/v1/api-keys/{id}` | Revoke an API key |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/webhooks` | List all webhook endpoints |
| `POST` | `/api/v1/webhooks` | Register a new webhook endpoint |
| `DELETE` | `/api/v1/webhooks/{id}` | Remove a webhook endpoint |

### Audit Log

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/audit-log` | Retrieve immutable audit trail |

### Tenants (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/tenants` | List all registered tenants |
| `GET` | `/api/v1/tenants/{id}` | Get tenant details |
| `PUT` | `/api/v1/tenants/{id}/suspend` | Suspend a tenant |

> 📘 **Interactive documentation** is available at [`/swagger-ui.html`](https://multitenant-backend-4lh0.onrender.com/swagger-ui.html)

---

## 📂 Project Structure

```
Multi-tenant-SaaS-Backend/
│
├── src/main/java/com/example/multitenant/
│   ├── MultitenantApplication.java          # Spring Boot entry point
│   ├── config/                              # CORS, Web MVC, Security config
│   ├── context/
│   │   ├── TenantContext.java               # ThreadLocal tenant holder
│   │   └── TenantInterceptor.java           # HTTP → Tenant ID resolution
│   ├── domain/                              # JPA entities
│   │   ├── AbstractTenantEntity.java        # Base class with tenant_id
│   │   ├── Tenant.java                      # Tenant registry
│   │   ├── Product.java                     # Tenant-scoped product
│   │   ├── Order.java                       # Tenant-scoped order
│   │   ├── User.java                        # Tenant user with roles
│   │   ├── ApiKey.java                      # Programmatic API credentials
│   │   ├── WebhookEndpoint.java             # Event callback registrations
│   │   ├── AuditLog.java                    # Immutable audit records
│   │   ├── RefreshToken.java                # JWT refresh tokens
│   │   ├── SubscriptionPlan.java            # Billing plan definitions
│   │   └── UsageEvent.java                  # Metered usage events
│   ├── event/                               # Domain event publishers
│   ├── ratelimit/                           # Request rate limiting
│   ├── repository/                          # Spring Data JPA repositories
│   ├── security/
│   │   ├── JwtTokenProvider.java            # JWT creation & validation
│   │   └── JwtAuthenticationFilter.java     # Security filter chain
│   ├── service/                             # Business logic layer
│   └── web/                                 # REST controllers
│       ├── AuthController.java
│       ├── ProductController.java
│       ├── OrderController.java
│       ├── UserController.java
│       ├── ApiKeyController.java
│       ├── WebhookController.java
│       ├── AuditLogController.java
│       ├── BillingController.java
│       └── TenantController.java
│
├── src/main/resources/
│   ├── application.properties               # Spring Boot configuration
│   ├── db/migration/                        # Flyway SQL migrations (V1–V8)
│   └── static/                              # Bundled React production build
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                          # Root component & routing
│   │   ├── index.css                        # Dual-theme design tokens
│   │   ├── api/                             # Axios API client
│   │   ├── context/                         # Auth & Theme providers
│   │   ├── components/
│   │   │   ├── Layout/                      # Sidebar, Topbar, Toasts
│   │   │   ├── modals/                      # Create Order, Add User
│   │   │   └── ui/                          # ErrorBoundary, shared UI
│   │   ├── hooks/                           # Custom React hooks
│   │   └── pages/                           # Feature pages
│   │       ├── Dashboard.jsx
│   │       ├── Products.jsx
│   │       ├── Orders.jsx
│   │       ├── Users.jsx
│   │       ├── ApiKeys.jsx
│   │       ├── Webhooks.jsx
│   │       ├── AuditLog.jsx
│   │       ├── Billing.jsx
│   │       ├── RlsTester.jsx
│   │       └── AuthScreen.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .github/workflows/ci.yml                # GitHub Actions CI pipeline
├── Dockerfile                               # Multi-stage Docker build
├── docker-compose.yml                       # Full local dev stack
├── render.yaml                              # Render IaC deployment
├── pom.xml                                  # Maven dependencies
├── TESTING_GUIDE.md                         # Comprehensive testing manual
└── MULTI_TENANCY_EXPLAINED.md               # Architecture deep-dive
```

---

## 🧪 Testing

### Run Unit & Integration Tests

```bash
# Run full test suite with Maven
./mvnw clean verify

# Tests use Testcontainers to spin up a real PostgreSQL 16 instance
```

### CI Pipeline

Every push to `main` or `develop` triggers the [GitHub Actions workflow](.github/workflows/ci.yml) which:
1. Starts a PostgreSQL 16 service container
2. Builds the project with Maven
3. Runs all tests against the live database
4. Reports build status on the PR

### Manual Testing

See the comprehensive [**TESTING_GUIDE.md**](TESTING_GUIDE.md) for step-by-step instructions covering all 9 phases:
- Authentication & Onboarding
- Product & Order Management
- Team Access Control
- API Keys & Webhooks
- Audit Logging
- Cross-Tenant RLS Isolation
- Observability & Swagger

---

## 🚢 Deployment

### Render (Current Production)

The project includes a [`render.yaml`](render.yaml) Infrastructure-as-Code file that provisions:
- **Web Service** — Docker-based Spring Boot backend
- **Static Site** — React frontend built from `frontend/dist`
- **Managed PostgreSQL** — Free-tier database with automatic backups

Deployments are triggered automatically on every push to `main`.

| Service | URL |
|---------|-----|
| Backend API | [multitenant-backend-4lh0.onrender.com](https://multitenant-backend-4lh0.onrender.com) |
| Swagger Docs | [/swagger-ui.html](https://multitenant-backend-4lh0.onrender.com/swagger-ui.html) |
| Health Check | [/actuator/health](https://multitenant-backend-4lh0.onrender.com/actuator/health) |

### Docker (Self-Hosted)

```bash
docker-compose up --build -d
```

The Docker setup uses a multi-stage build with:
- **Build stage** — `eclipse-temurin:17-jdk-alpine` compiles the JAR
- **Runtime stage** — `eclipse-temurin:17-jre-alpine` runs as non-root `appuser`
- **Health checks** — 30s intervals with 90s startup grace period
- **JVM tuning** — G1GC with 75% max RAM allocation

---

## 🗄 Database Migrations

The schema is managed by **Flyway** with 8 versioned migrations:

| Version | Description |
|---------|-------------|
| `V1` | Core schema (tenants, products, orders) + RLS policies |
| `V2` | Users table with roles + JWT refresh tokens |
| `V3` | Immutable audit log table |
| `V4` | API key management |
| `V5` | Webhook endpoint registrations |
| `V6` | Usage metering and billing events |
| `V7` | Full-text search indexes |
| `V8` | Audit column additions for API keys & webhooks |

Migrations run automatically on application startup. No manual SQL execution required.

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please ensure all tests pass before submitting (`./mvnw clean verify`).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Chaithanya** — [@chaithanya762](https://github.com/chaithanya762)

---

<p align="center">
  <sub>Built with ☕ Java, ⚛️ React, and 🐘 PostgreSQL</sub>
</p>
