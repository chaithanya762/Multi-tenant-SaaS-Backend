# 🚢 06 - Deployment, Docker & All Render Fixes Explained

When you run an app on your personal laptop, you have 16 GB of RAM, super-fast SSD, no network latency, and you control everything.

When you deploy to the cloud (like Render's free tier), everything is constrained:
- **Only 512 MB of RAM** (instead of 16 GB).
- **Throttled CPU** (0.1 vCPU shared).
- **Auto-generated passwords** with special characters.
- **Strict health checks** with timeouts.

Here is a simple explanation of every single error that happened when deploying, and how we fixed each one.

---

## Error #1: Out Of Memory (OOM / Exit Code 137)
- **What happened**: The app started booting, and suddenly died with `Exit Code 137`.
- **The Cause**: Render Free Tier kills any app that uses more than 512 MB of RAM. The original Dockerfile had `-XX:+UseG1GC` and `-XX:MaxRAMPercentage=75.0`. G1GC creates multiple background threads and memory structures that pushed total RAM usage to 550MB+.
- **The Fix**:
  In [`Dockerfile`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/Dockerfile):
  Switched to **`-XX:+UseSerialGC`** (uses a single GC thread, saving ~80MB) and set explicit limits:
  `-Xms256m -Xmx320m -XX:MaxMetaspaceSize=128m`. Total memory stays safely around ~420MB.

---

## Error #2: Database URL Rejection (`postgres://` vs `jdbc:postgresql://`)
- **What happened**: Spring Boot crashed on startup claiming:
  `Driver org.postgresql.Driver claims to not accept jdbcUrl, postgres://...`
- **The Cause**: Render provides PostgreSQL URLs in the standard format `postgres://user:pass@host:5432/db`. But Java JDBC strictly requires `jdbc:postgresql://...`.
- **Why the existing processor failed**: [`DatabaseUrlEnvironmentPostProcessor.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/config/DatabaseUrlEnvironmentPostProcessor.java) was using Java's `new URI(...)` to parse it. Render's auto-generated passwords contained symbols like `@` or `#`, which broke Java's URI parser with a `URISyntaxException`.
- **The Fix**:
  Replaced `new URI(...)` with direct string extraction that safely prepends `jdbc:postgresql://` regardless of special characters in passwords.

---

## Error #3: Healthcheck Timeout on Boot
- **What happened**: Render kept saying: `No open ports detected, continuing to scan...` and aborted the deployment.
- **The Cause**: Render checks `GET /` by default. On a free 0.1 CPU core, Spring Boot taking 60–90 seconds to run 14 database migrations made Render think the app had hung.
- **The Fix**:
  In [`render.yaml`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/render.yaml), added `healthCheckPath: /actuator/health` and increased the Dockerfile start grace period to 120s.

---

## Error #4: Flyway V12 `column "webhook_id" does not exist`
- **What happened**:
  `Migration V12__add_webhook_deliveries.sql failed: ERROR: column "webhook_id" does not exist`
- **The Cause**:
  In `V5`, an old unused table named `webhook_deliveries` was created with a column called `endpoint_id`.
  When `V12` tried to add an index on `webhook_id`, PostgreSQL said: *"This table already exists, but it has no column named webhook_id!"*
- **The Fix**:
  In `V12__add_webhook_deliveries.sql`, added `DROP TABLE IF EXISTS webhook_deliveries CASCADE;` to destroy the obsolete V5 skeleton and create the complete schema matching `WebhookDelivery.java`.
  Added [`FlywayConfig.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/config/FlywayConfig.java) with `flyway.repair()` to automatically clean failed history entries on startup.

---

## Error #5: Integration Test 400 vs 409 Conflict
- **What happened**:
  `TenantIsolationIntegrationTest.testDuplicateTenantReturns409:195 Status expected:<409> but was:<400>`
- **The Cause**:
  When creating a tenant that already exists, `TenantService` threw `IllegalArgumentException`, which `GlobalExceptionHandler` converted to `400 Bad Request`. But REST API standards and the test expected `409 Conflict`.
- **The Fix**:
  Created [`TenantAlreadyExistsException.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/web/exception/TenantAlreadyExistsException.java) and mapped it to `HttpStatus.CONFLICT` (409) in `GlobalExceptionHandler.java`.

---

## Error #6: PostgreSQL `jsonb` Column Type Mismatch
- **What happened**:
  `ERROR: column "metadata" is of type jsonb but expression is of type character varying`
- **The Cause**:
  In Hibernate 6 (Spring Boot 3+), mapping a `String` property to a PostgreSQL `jsonb` column sends it as plain `VARCHAR`. PostgreSQL rejects inserting `VARCHAR` into `JSONB` without an explicit type hint.
- **The Fix**:
  Added `@JdbcTypeCode(SqlTypes.JSON)` to `UsageEvent.metadata`, `AuditLog.oldValue`, and `AuditLog.newValue`.

---

Next, open [`07_MASTER_CHEAT_SHEET.md`](07_MASTER_CHEAT_SHEET.md) for daily development commands, testing tips, and interview talking points.
