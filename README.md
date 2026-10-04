<p align="center">
  <img src="https://img.shields.io/badge/Spring_Boot-3.3.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 17" />
  <img src="https://img.shields.io/badge/PostgreSQL_16-Row--Level_Security-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL RLS" />
  <img src="https://img.shields.io/badge/Redis_7-Distributed_Cache_&_RateLimit-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Webhooks-Exponential_Backoff_&_DLQ-8A2BE2?style=for-the-badge" alt="Webhook DLQ" />
  <img src="https://img.shields.io/badge/Docker-Render_Cloud_Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<h1 align="center">🏢 Multi-Tenant SaaS Cloud Platform</h1>

<p align="center">
  <strong>An enterprise-grade, multi-tenant cloud backend engineered with PostgreSQL Row-Level Security (RLS), distributed Redis caching, token-bucket rate limiting, an asynchronous resilient webhook engine (Exponential Backoff & Dead Letter Queue), and a modern React console.</strong>
</p>

<p align="center">
  <a href="https://multitenant-backend-4lh0.onrender.com/swagger-ui.html">Live Swagger API Docs</a> ·
  <a href="https://multitenant-backend-4lh0.onrender.com/actuator/health">Health Check</a> ·
  <a href="#-system-architecture">System Architecture</a> ·
  <a href="#-architectural-decisions--trade-offs">Architecture Trade-Offs</a> ·
  <a href="#-api-reference">API Reference</a>
</p>

---

## 📖 Summary

This platform implements a **shared-schema, multi-tenant architecture** where all enterprise tenants coexist in a single PostgreSQL database, isolated at the operating system/database kernel level via **PostgreSQL Row-Level Security (RLS)**. Every query is automatically scoped to the authenticated tenant at the database connection level — eliminating application-level leakage risks and vulnerability to forgotten `WHERE tenant_id = ?` clauses.

The platform includes:
1. **Kernel-Enforced Multi-Tenancy**: Zero cross-tenant data leaks via dynamic session configuration (`set_config('app.current_tenant_id', ...)`).
2. **Resilient Asynchronous Webhook Engine**: Non-blocking event dispatch with exponential backoff retries ($30\text{s} \times 2^{\text{attempt}-1}$), **Dead Letter Queue (DLQ)** quarantine, and manual replay APIs.
3. **Distributed Caching & Invalidation**: Redis-backed cache manager with JSON serialization, 10-minute TTL, tenant-scoped keys, and automated write eviction with graceful in-memory fallback.
4. **Token-Bucket Rate Limiter**: Distributed throttling per subscription tier with millisecond precision and automatic in-memory circuit fallback.
5. **Modern React Admin Console**: Live dashboard, product inventory, order processing, team access controls, webhook telemetry, and DLQ management.

---

## 🏗️ System Architecture

### 1. Inbound Request Flow & Tenant Isolation (RLS)

```mermaid
sequenceDiagram
    autonumber
    actor Client as React Client / API Consumer
    participant GW as Spring Security Filter Chain
    participant Interceptor as TenantInterceptor
    participant Service as Business Service
    participant Aspect as TenantSessionAspect (AOP)
    participant DB as PostgreSQL (RLS Kernel)

    Client->>GW: HTTP Request + Bearer JWT
    GW->>GW: Validate HMAC-SHA512 Signature & Extract Claims
    GW->>Interceptor: Pass Authenticated Request
    Interceptor->>Interceptor: Store tenantId in TenantContext (ThreadLocal)
    Interceptor->>Service: Dispatch Controller & Service Logic
    Service->>Aspect: Intercept JPA Repository Call
    Aspect->>DB: Execute SELECT set_config('app.current_tenant_id', :tenantId, true)
    Service->>DB: Execute Business Query (SELECT / INSERT / UPDATE)
    Note over DB: PostgreSQL RLS automatically enforces:<br/>WHERE tenant_id = current_setting('app.current_tenant_id')
    DB-->>Client: Filtered Tenant-Isolated Response
```

---

### 2. Resilient Asynchronous Webhook Engine (Exponential Backoff & DLQ)

```mermaid
flowchart TD
    A[Tenant Event: order.created / product.updated] -->|Non-blocking Async Dispatch| B[WebhookDispatcherService]
    B -->|Initial Attempt + HMAC-SHA256 Signature| C{Destination Endpoint}
    
    C -->|HTTP 2xx Success| D[Status: SUCCESS<br>next_retry_at = null]
    C -->|HTTP 4xx / 5xx / Timeout| E[Calculate Exponential Backoff Delay<br>delay = 30s * 2^attempt-1]
    
    E -->|Attempt < 3| F[Status: PENDING_RETRY<br>Schedule next_retry_at]
    E -->|Attempt >= 3| G[Status: DEAD_LETTER / DLQ<br>Quarantine Payload for Review]
    
    H[WebhookRetryScheduler<br>Runs every 10s as sys_admin] -->|Query due retries across all tenants| I{Pending Deliveries?}
    I -->|Yes| J[Contextualize to delivery.tenantId]
    J --> B
    
    K[Admin / Tenant UI] -->|POST /deliveries/deliveryId/redeliver| L[Manual Replay Action]
    L --> B
```

---

### 3. Distributed Redis Caching & Cache Eviction

```mermaid
flowchart LR
    A[Read Request: getTenantById / getProductById] --> B{Cache Hit in Redis?}
    B -->|Yes| C[Return Cached JSON Payload<br>Zero Database Load]
    B -->|No| D[Query PostgreSQL with RLS]
    D --> E[Store in Redis with 10m TTL]
    E --> F[Return Response]

    G[Write Request: updateTenantPlan / updateProduct] --> H[Update PostgreSQL]
    H --> I[Execute @CacheEvict<br>Invalidate tenant-scoped key]
```

---

## ⚖️ Architectural Decisions & Trade-Offs

| Decision Area | Chosen Approach | Alternative Evaluated | Why This Approach Wins |
|---|---|---|---|
| **Multi-Tenant Isolation** | **Shared Schema + PostgreSQL Row-Level Security (RLS)** | Database-per-tenant or Schema-per-tenant | Running separate databases or schemas for thousands of tenants creates massive connection pool exhaustion, schema migration nightmares, and unscalable hosting costs. RLS enforces kernel-level security within a single schema with zero cross-tenant leak vulnerability. |
| **Webhook Delivery & Retries** | **Database-Backed Asynchronous Queue + Background Scheduler** | Spring `@Retryable` in-memory | In-memory retries block web threads with thread sleep, fail if the application restarts, and cannot schedule retries over long horizons (hours/days). Persisting retry state (`PENDING_RETRY`, `DEAD_LETTER`) ensures zero data loss across deployments. |
| **Quarantine & Failure Handling** | **Dead Letter Queue (DLQ) with Manual Replay** | Silent drop or infinite retries | Dropping messages creates silent business data loss. Infinite retries cause "Thundering Herd" DDoS on recovering client servers. Quarantining permanently failed webhooks to a DLQ with a one-click manual retry endpoint provides full observability and recovery. |
| **Distributed Caching** | **Redis with JSON Serialization & In-Memory Circuit Fallback** | Pure in-memory cache (`ConcurrentHashMap`) | In multi-instance deployments, in-memory caches cause cache drift and inconsistent reads. Redis synchronizes cache state across cluster pods, while our automatic fallback prevents outages if Redis temporarily drops. |
| **Rate Limiting** | **Distributed Redis Token-Bucket** | In-memory Guava RateLimiter | In-memory limiters fail in clustered environments (a tenant could bypass limits by round-robining pods). Redis enforces global limits per tenant subscription tier. |

---

## 🛠️ Tech Stack & Key Libraries

- **Backend Framework**: Spring Boot 3.3.2 (Java 17)
- **Data Persistence**: Spring Data JPA / Hibernate 6, PostgreSQL 16
- **Database Migrations**: Flyway (15 versioned migrations)
- **Caching & Throttling**: Spring Data Redis, Jedis / Lettuce, Token-Bucket
- **Security**: Spring Security 6, JJWT (HMAC-SHA512), BCrypt
- **Observability**: Spring Boot Actuator, Micrometer, Prometheus
- **API Documentation**: Springdoc OpenAPI / Swagger UI
- **Frontend**: React 19, Vite 8, Lucide React, Recharts
- **Containerization**: Docker multi-stage build, SerialGC JVM tuning (Render 512MB RAM optimized)

---

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Docker & Docker Compose
- Maven 3.9+ (or use bundled `./mvnw`)

### 1. Clone & Run with Docker Compose
```bash
git clone https://github.com/chaithanya762/Multi-tenant-SaaS-Backend.git
cd Multi-tenant-SaaS-Backend

# Start PostgreSQL 16, Redis 7, and the Backend
docker-compose up --build
```

### 2. Run Locally via Maven
```bash
# Set PostgreSQL connection
export DATABASE_URL="postgres://postgres:secret@localhost:5432/postgres"

# Build and start Spring Boot
./mvnw spring-boot:run
```

The application starts on `http://localhost:8080`.
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Actuator Health**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

## 📡 API Reference & Curl Examples

### 1. Register a Webhook Endpoint
```bash
curl -X POST "http://localhost:8080/api/v1/webhooks" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.yourdomain.com/webhooks",
    "secret": "whsec_supersecret123",
    "events": "order.created,product.updated"
  }'
```

### 2. Inspect Dead Letter Queue (DLQ)
```bash
curl -X GET "http://localhost:8080/api/v1/webhooks/dead-letter" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### 3. Manually Redeliver a Quarantined Webhook
```bash
curl -X POST "http://localhost:8080/api/v1/webhooks/deliveries/{deliveryId}/redeliver" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 🧪 Comprehensive Automated Testing

The project includes an end-to-end integration test suite using **Testcontainers** for automated real PostgreSQL validation with graceful H2 fallbacks:

```bash
# Run the entire test suite
./mvnw test

# Run isolated webhook retry & DLQ test
./mvnw test -Dtest=WebhookRetryIntegrationTest

# Run tenant isolation & RLS test
./mvnw test -Dtest=TenantIsolationIntegrationTest

# Run Redis cache & eviction test
./mvnw test -Dtest=TenantCacheIntegrationTest

# Run Cyber Security & Penetration Attack Simulation tests
./mvnw test -Dtest=AttackSimulationIntegrationTest
```

---

## 🛡️ Cyber Security & RLS Penetration Testing Console

To make multi-tenant defense verifiable and demonstrable during security audits and technical interviews, the platform includes a built-in **Cyber Security & Penetration Testing Console** that executes live attacks against the database kernel:

| Attack Vector | OWASP Classification | Simulated Threat | Active Defense Layer | Verified Outcome |
|---|---|---|---|---|
| **IDOR Cross-Tenant Read** | A01:2021 Broken Access Control | Attacker discovers victim tenant's confidential ledger UUID and queries it directly | PostgreSQL RLS Kernel (`USING (tenant_id = current_setting('app.current_tenant_id'))`) | **0 Records Leaked** (Database returns 0 rows) |
| **Tenant Header Spoofing** | A07:2021 Identification & Auth Failures | Attacker submits a valid JWT for Tenant A with forged `X-Tenant-ID: tenant-beta` | Spring Security Filter & Cryptographic Token Claim Verifier | **Rejected with HTTP 403** (Claim mismatch) |
| **Cross-Tenant Write Poisoning** | A03:2021 Injection & Integrity Failure | Attacker attempts to overwrite inventory pricing to \$0.01 on a foreign tenant row | PostgreSQL RLS `WITH CHECK` Constraint & Session Aspect | **Write Blocked** (0 rows modified) |

### Penetration Testing Endpoints:
```bash
# 1. Simulate IDOR Attack (Cross-Tenant Data Leak)
curl -X POST "http://localhost:8080/api/v1/security/simulate/idor" \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 2. Simulate Tenant Header Spoofing (Privilege Escalation)
curl -X POST "http://localhost:8080/api/v1/security/simulate/header-spoof" \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 3. Simulate Cross-Tenant Data Poisoning (Write Injection)
curl -X POST "http://localhost:8080/api/v1/security/simulate/cross-tenant-write" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
