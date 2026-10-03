
## 1. What is a SaaS‑Multi‑tenant Application?

- **SaaS (Software‑as‑a‑Service)**: A cloud‑hosted application that customers use over the internet, typically paying a subscription.
- **Multi‑tenant**: A single running instance of the application serves *many* different customers (called *tenants*). All tenants share the same code base and database, but their data is isolated from each other.

**Why?**
- Cost efficiency – one deployment, shared resources.
- Easier maintenance – bug fixes and new features roll out to all tenants at once.
- Scalability – you can add new tenants without provisioning new servers.

---

## 2. High‑Level Architecture of This Repository

```
Multi-tenant-SaaS-Backend/
├─ src/main/java/                         # Java source code (Spring Boot)
│   └─ com/example/multitenant/          # Root package
│       ├─ config/                        # Spring configuration (security, DB, Flyway, …)
│       ├─ context/                       # TenantContext (ThreadLocal holder)
│       ├─ controller/                    # REST controllers (HTTP entry points)
│       ├─ service/                       # Business logic
│       ├─ repository/                    # Spring Data JPA repositories (DB access)
│       ├─ domain/                        # JPA Entities (tables)
│       └─ security/                      # JWT handling, filters, roles
├─ src/main/resources/                    # Static resources, YAML config, Flyway migrations
│   ├─ static/                            # Compiled React front‑end (served by Spring Boot)
│   ├─ application.yml                    # Main Spring configuration (DB URL, JWT secret …)
│   └─ db/migration/                      # Flyway migration scripts (V1…V14)
├─ Dockerfile                              # Docker image definition
├─ render.yaml                             # Render.com deployment descriptor
└─ notes/                                 # **Our documentation folder** (generated during this session)
```

All the code you will see later lives under `src/main/java/com/example/multitenant/`.

---

## 3. Core Concepts & Terminology

| Term | Meaning in this project |
|------|--------------------------|
| **Tenant** | A logical customer. Represented by the `tenants` table and the `Tenant` entity. Each request carries a `tenant_id` (extracted from the JWT). |
| **Row‑Level Security (RLS)** | PostgreSQL feature that adds a *WHERE clause* automatically to every query, based on `app.current_tenant_id`. This ensures a tenant can only see its own rows. |
| **JWT (JSON Web Token)** | A signed token the client stores (usually in localStorage) and sends in the `Authorization: Bearer …` header. Contains claims: `username`, `tenantId`, `role`, `exp`. |
| **Spring Interceptor** | Runs **before** a controller method. Our `TenantInterceptor` reads the JWT, validates it, and puts the tenant ID into `TenantContext`. |
| **AOP Aspect (`TenantSessionAspect`)** | Runs **right before** any JPA repository method. It executes `SELECT set_config('app.current_tenant_id', :tenantId, true)` so PostgreSQL RLS sees the correct tenant. |
| **Flyway** | Database migration tool. All schema changes live in `src/main/resources/db/migration/`. Flyway runs automatically on startup. |
| **Rate Limiting** | Prevents a tenant from flooding the API. Implemented via Redis (`TenantRateLimiterService`) with an in‑memory fallback. |
| **Audit & Metering** | Async services that write `audit_log` and `usage_events` tables for compliance and usage‑based billing. |
| **Docker / Render** | The app is containerised. Render.com hosts the container, runs the DB, and injects the connection URL as `POSTGRES_URL`. |

---

## 4. The Data Model (PostgreSQL tables)

Below is a *simplified* diagram of the most important tables (all have RLS policies). The actual column definitions can be found in the Flyway migration scripts.

```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│ tenants             │   │ subscription_plans  │   │ products            │
│ ────────────────── │   │ ────────────────── │   │ ────────────────── │
│ id PK               │   │ id PK               │   │ id PK               │
│ name                │   │ name                │   │ tenant_id FK → tenants.id │
│ created_at …       │   │ monthly_price_usd   │   │ name                │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
        ▲                               ▲                         ▲
        │                               │                         │
        │                               │                         │
        ▼                               ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│ users               │   │ webhook_endpoints  │   │ usage_events        │
│ ────────────────── │   │ ────────────────── │   │ ────────────────── │
│ id PK               │   │ id PK               │   │ id PK               │
│ tenant_id FK → tenants.id ││ tenant_id FK → tenants.id ││ tenant_id FK → tenants.id │
│ email               │   │ url                 │   │ metric               │
│ role                │   │ event_type          │   │ quantity             │
│ …                   │   │ …                   │   │ metadata (jsonb)    │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

### Where the Table Definitions Live
- `V1__create_tenants.sql` – creates `tenants`.
- `V3__create_subscription_plans.sql` – creates `subscription_plans`.
- `V4__create_users.sql` – creates `users`.
- `V6__create_products.sql` – creates `products`.
- `V9__add_usage_events.sql` – creates `usage_events` (contains JSONB `metadata`).
- `V10__add_audit_log.sql` – creates `audit_log` (also JSONB).
- `V12__add_webhook_deliveries.sql` – creates `webhook_deliveries` (drop‑if‑exists added to avoid migration conflict).

You can view any migration file with a click, e.g. **[V12__add_webhook_deliveries.sql](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/resources/db/migration/V12__add_webhook_deliveries.sql)**.

---

## 5. Request Flow – From Front‑End to Database

Below is the *exact* path a request takes when a user creates a new product from the React UI.

1. **React component** – `CreateProductModal.jsx` calls `apiClient.post('/api/v1/products', payload)`.
2. **Browser** – Sends HTTP request with `Authorization: Bearer <jwt>` header.
3. **Spring Security Filter Chain** – `JwtAuthenticationFilter` validates the JWT, extracts claims, and creates a `UsernamePasswordAuthenticationToken` that holds the tenant ID.
4. **`TenantInterceptor`** (registered in `WebMvcConfig`) runs **before** the controller. It reads the tenant ID from the authentication object and stores it in `TenantContext` (`ThreadLocal`).
5. **`ProductController#createProduct`** (file: **[ProductController.java](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/web/ProductController.java)**) receives the DTO, maps it to a `Product` entity, and calls `productService.createProduct(dto)`.
6. **`ProductService#createProduct`** (file: **[ProductService.java](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/service/ProductService.java)**) performs:
   - **Quota check** (`tenantPlanService.checkProductQuota(tenantId)`).
   - **Set `tenantId`** on the `Product` entity (`product.setTenantId(tenantId)`).
   - **`productRepository.save(product)`**.
7. **`TenantSessionAspect`** (file: **[TenantSessionAspect.java](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/config/TenantSessionAspect.java)**) intercepts the repository call and runs `SELECT set_config('app.current_tenant_id', :tenantId, true)` on the same DB connection.
8. **PostgreSQL RLS** sees the session variable `app.current_tenant_id` and automatically adds `WHERE tenant_id = '<tenant-id>'` to the generated `INSERT` / `SELECT` statements, guaranteeing isolation.
9. **Response** – The newly persisted `Product` entity is converted back to a DTO (`ProductResponse`) and returned to the front‑end.

### Key Files to Study
- **JwtAuthenticationFilter.java** – token verification.
- **SecurityConfig.java** – role‑based endpoint protection.
- **TenantInterceptor.java** – where tenant ID is captured.
- **TenantSessionAspect.java** – the magic that makes RLS work.
- **RlsPolicy.sql** (generated by Flyway) – actual PostgreSQL policy definitions.

---

## 6. Security Model (Authentication & Authorization)

| Layer | What it does | Relevant code |
|-------|--------------|----------------|
| **Authentication** | Verifies JWT signature, expiration, and extracts claims. | `JwtAuthenticationFilter.java` (filter) and `JwtUtil.java` (utility). |
| **Authorization** | Grants or denies access based on roles (`SYS_ADMIN`, `TENANT_ADMIN`, `USER`). | `SecurityConfig.java` – `http.authorizeHttpRequests(...).hasRole(...)`. |
| **Tenant Isolation** | Guarantees a tenant cannot see another tenant's rows. | `TenantInterceptor` + `TenantSessionAspect` + PostgreSQL RLS policies (`V2__add_rls.sql`). |
| **Rate Limiting** | Limits requests per minute per tenant. | `TenantRateLimiterService.java` (Redis or in‑memory). |

### JWT Structure (example payload)
```json
{
  "sub": "john.doe@example.com",
  "tenantId": "tenant-alpha",
  "role": "TENANT_ADMIN",
  "exp": 1700000000
}
```
- `sub` → username (email).
- `tenantId` → the logical tenant.
- `role` → one of `SYS_ADMIN`, `TENANT_ADMIN`, `USER`.
- `exp` → expiry epoch seconds.

The secret key lives in `application.yml` (`jwt.secret`). In production you would store it in a secret manager, not in source control.

---

## 7. Database Migrations (Flyway)

Flyway runs on every application start (`FlywayConfig.java`). It reads migrations from `classpath:db/migration`. Each file is prefixed with `V<number>__description.sql`.

### How to Add a New Table
1. Create a new file `V15__add_my_new_table.sql` in the `db/migration/` folder.
2. Write plain SQL – Flyway will execute it in order.
3. If you need a **new RLS policy**, add a `GRANT SELECT, INSERT, UPDATE, DELETE ON my_new_table TO app_user;` and then `CREATE POLICY tenant_isolation ON my_new_table USING (tenant_id = current_setting('app.current_tenant_id')) WITH CHECK (tenant_id = current_setting('app.current_tenant_id'));`.
4. Commit & push. When the next pod starts, Flyway automatically runs the new migration.

> **Tip**: During local development you can run `./mvnw spring-boot:run -DskipTests` and Flyway will apply migrations to your local Postgres container.

---

## 8. Docker & Render Deployment

### Dockerfile (excerpt)
```Dockerfile
FROM eclipse-temurin:21-jdk-alpine as builder
WORKDIR /app
COPY . .
RUN ./mvnw -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
# JVM options tuned for Render's 512 MiB limit
ENV JAVA_OPTS="-XX:+UseSerialGC -Xms256m -Xmx320m -XX:MaxMetaspaceSize=128m"
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
```
- **SerialGC** is lightweight and fits the memory quota.
- Heap is limited to 320 MiB; extra memory is reserved for the OS and the JVM metaspace.

### render.yaml (excerpt)
```yaml
services:
  - type: web
    name: multitenant-saas
    env: docker
    plan: free
    healthCheckPath: /actuator/health
    startCommand: java $JAVA_OPTS -jar app.jar
    envVars:
      - key: DATABASE_URL
        fromService: postgres
    startGracePeriodSeconds: 90   # gives Flyway extra time on cold start
```
- Health‑check points to Spring Actuator (`/actuator/health`).
- `startGracePeriodSeconds` prevents Render from killing the container while Flyway applies many migrations.

---

## 9. Testing Strategy

| Type | Purpose | Example file |
|------|---------|--------------|
| **Unit** | Test isolated business logic (services, utilities). | `TenantServiceTest.java` |
| **Integration** | Spin up an embedded Postgres (via Testcontainers) and verify end‑to‑end flows, including RLS enforcement. | `TenantIsolationIntegrationTest.java` |
| **Contract** | Verify the JSON structure of API responses, useful for front‑end developers. | `ProductControllerContractTest.java` |

### Running Tests
```powershell
# From the project root
./mvnw test
```
- Maven Surefire runs unit tests.
- Fails fast if any migration cannot be applied.

---

## 10. Future Implementation Roadmap (Ideas & Why They Matter)

### 10.1 Tenant‑Specific Feature Flags
- **Goal**: Turn features on/off per tenant without redeploying.
- **Design**: New table `tenant_features (tenant_id, feature_name, enabled)` with RLS. Service layer checks `featureService.isEnabled(tenantId, "advancedAnalytics")` before executing optional code paths.
- **Benefit**: Gradual roll‑out, A/B testing, premium add‑ons.

### 10.2 Switch to RSA‑signed JWTs
- **Current**: HMAC (`HS512`) with a shared secret.
- **Proposed**: RSA‑256 (asymmetric). Private key stays on the auth service; public key is published (JWKS endpoint) and used by the backend.
- **Why**: Allows key rotation without breaking existing tokens and supports third‑party identity providers.

### 10.3 Event‑Driven Webhook Dispatch
- **Current**: Synchronous HTTP POST inside service method (fire‑and‑forget).
- **Proposed**: Publish a `WebhookEvent` to a message queue (RabbitMQ or Google Pub/Sub). A dedicated worker reads the queue, retries on failure, and records delivery status in `webhook_deliveries`.
- **Benefit**: Guarantees delivery, decouples API latency from webhook processing, enables scaling independently.

### 10.4 Soft‑Delete Cascade for Tenants
- **Problem**: Deleting a tenant should wipe all its data but we also want auditability.
- **Solution**: Add `deleted_at TIMESTAMP` column to every tenant‑owned table (already present in many). Write a scheduled job (`TenantPurgeJob`) that permanently removes rows after X days.
- **Benefit**: Legal compliance (GDPR “right to be forgotten”) while retaining short‑term audit logs.

### 10.5 Per‑User Row‑Level Security
- **Current**: Security is *tenant*‑wide.
- **Future**: Add a `created_by` column to tables and extend RLS policy:
```sql
CREATE POLICY user_is_owner ON products
USING (tenant_id = current_setting('app.current_tenant_id')
      AND created_by = current_setting('app.current_user_email'))
WITH CHECK (created_by = current_setting('app.current_user_email'));
```
- **Result**: Users can only edit/read rows they created, useful for SaaS platforms that expose self‑service data entry.

### 10.6 Observability & Metrics
- Export Prometheus metrics from Spring Boot (`micrometer`). Track:
  - Request latency per endpoint.
  - Rate‑limit rejections.
  - DB connection pool usage.
- Push metrics to Render’s built‑in monitoring or a Grafana Cloud instance.

### 10.7 CI/CD Automation
- Use GitHub Actions to:
  1. Build Docker image.
  2. Run unit & integration tests.
  3. Push image to Docker Hub.
  4. Deploy to Render via Render API (auto‑deploy on `main` push).
- Add a **semantic‑release** step to auto‑bump version numbers.

---

## 11. Quick‑Start Checklist (If you are setting this up from scratch)
1. **Clone the repo**
   ```powershell
   git clone https://github.com/chaithanya762/Multi-tenant-SaaS-Backend.git
   cd Multi-tenant-SaaS-Backend
   ```
2. **Create a local Postgres** (Docker is easiest)
   ```powershell
   docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:15
   ```
3. **Set environment variable** (render uses `DATABASE_URL` style)
   ```powershell
   $env:DATABASE_URL = "postgres://postgres:secret@localhost:5432/postgres"
   ```
4. **Run the app**
   ```powershell
   ./mvnw spring-boot:run
   ```
5. **Open the API docs** – Springdoc OpenAPI is available at `http://localhost:8080/swagger-ui.html`.
6. **Create a tenant** – POST `/api/v1/tenants` with JSON `{ "id": "tenant-alpha", "name": "Alpha Corp" }`. The response includes a JWT you can store for subsequent calls.
7. **Explore the front‑end** – In `src/main/resources/static/` you’ll find the compiled React bundle. Run `npm start` inside the `frontend/` folder (if you want hot‑reload development). The front‑end talks to the same backend using the JWT stored in localStorage.

---

## 12. Frequently Asked  Questions
| Question | Simple Answer |
|----------|---------------|
| *What is a `ThreadLocal`?* | It is a variable that each thread gets its own copy of. Here it holds the current tenant ID so every request’s DB calls see the right tenant. |
| *Why do we need both an Interceptor and an Aspect?* | Interceptor reads the JWT **once** per HTTP request and puts the tenant ID into `TenantContext`. Aspect runs **right before** any JPA query and tells PostgreSQL which tenant we are acting as. Two separate concerns. |
| *What does `@JdbcTypeCode(SqlTypes.JSON)` do?* | It tells Hibernate “when you persisting this `String` field, bind it as PostgreSQL `jsonb` instead of plain text”. Without it, the DB complained about type mismatch. |
| *Why did Flyway crash with `webhook_deliveries already exists`?* | The old migration (V5) created the table in a previous dev run. When we added V12 we tried to create it again. Adding `DROP TABLE IF EXISTS …` fixes the conflict. |
| *What does `-XX:+UseSerialGC` mean?* | It selects a simple garbage collector that uses less memory – ideal for tiny containers like Render’s free tier. |
| *What is “RLS” again?* | It’s a PostgreSQL rule that automatically adds `WHERE tenant_id = …` to every query, so you never have to manually filter rows in code. |

---

## 13. Recap & Where to Go Next
- You now understand the **big picture**, the **data model**, the **security pipeline**, and the **deployment process**.
- The **notes** folder already contains a **high‑level cheat‑sheet** (`07_MASTER_CHEAT_SHEET.md`). Use it as a quick reference.
- For deeper dives, read the source files linked throughout this guide.
- Pick one of the **future implementation ideas** above and start a feature branch – it’s a great way to solidify your knowledge!


