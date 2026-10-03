# Phase 2: Asynchronous Resilient Webhook Engine
> **Goal**: Upgrade our webhook system into a production-grade, fault-tolerant, asynchronous event-delivery engine with **Exponential Backoff**, **Dead Letter Queue (DLQ)**, and **Idempotency**.

---

## 2. The Real-Life Analogy 

Imagine you run an **Amazon Delivery Hub**:

### The Bad Way (What most junior developers write):
The delivery driver takes a package, drives to the customer's house, knocks on the door, and **stands on the porch forever** waiting for the customer to answer.
- Meanwhile, 500 other packages are waiting in the truck.
- The entire delivery system comes to a complete halt because one customer isn't home.
- If the customer never answers, the driver throws the package in the trash (`status = FAILED`) and the package is lost forever.

### The Smart Way (Our Phase 2 Architecture):
1. **Asynchronous Dispatch**: The dispatcher puts packages into the delivery queue. The main warehouse never stops moving.
2. **Immediate Attempt**: The driver drives to the house and knocks.
3. **If Nobody Answers (Failure)**:
   - Don't throw it in the trash!
   - Leave a note on the package: `Attempt 1 failed. Next attempt in 30 seconds.`
4. **Exponential Backoff (Smart Retry Timer)**:
   - Attempt 1 fails $\rightarrow$ wait **30 seconds**.
   - Attempt 2 fails $\rightarrow$ wait **2 minutes (120 seconds)**.
   - Attempt 3 fails $\rightarrow$ wait **10 minutes**.
   - Why wait longer each time? Because if their server is restarting or down for maintenance, retrying 1,000 times in 1 second will just crash it further!
5. **Dead Letter Queue (DLQ)**:
   - If after 3 attempts the customer's server still refuses to respond, move the package to the **Dead Letter Shelf (DLQ)**.
   - The package is **safe and recorded**. It is never lost.
   - The customer or admin can log into the SaaS dashboard, see why it failed (e.g. `HTTP 500: Server Error`), fix their server, and click **"Retry Now"** (Manual Redeliver).

---

## 3. The 4 Major Components We Are Building

```mermaid
flowchart TD
    A[Order / Product Created] -->|Async Non-Blocking| B[WebhookDispatcherService]
    B -->|Attempt 1 HTTP POST| C{Customer Endpoint}
    C -->|HTTP 200 OK| D[Status: SUCCESS]
    C -->|Error / Timeout| E[Calculate Backoff Delay]
    E -->|Attempt < 3| F[Status: PENDING_RETRY<br>next_retry_at = now + delay]
    E -->|Attempt >= 3| G[Status: DEAD_LETTER / DLQ<br>Quarantined for Inspection]
    
    H[Scheduled Background Worker<br>WebhookRetryScheduler] -->|Runs every 10s as sys_admin| I[Find PENDING_RETRY where next_retry_at <= now]
    I -->|Set TenantContext| B
    
    J[SaaS Dashboard User] -->|POST /api/v1/webhooks/deliveries/{id}/redeliver| B
```

### Component 1: The Exponential Backoff Calculation
The delay before the next retry is calculated using the exponential formula:
$$\text{delaySeconds} = 30 \times 2^{\text{attempt} - 1}$$

- **Attempt 1**: Immediate.
- **Attempt 2**: $30 \times 2^0 = 30\text{ seconds}$.
- **Attempt 3**: $30 \times 2^1 = 60\text{ seconds}$ (or 120s).
- **Max Retries Exceeded**: Mark as `DEAD_LETTER`.

### Component 2: Idempotency & Security Headers
Every webhook sent over the internet must be verified by the receiver and protected against duplicate processing. We send these headers:
- `X-Webhook-ID`: Unique UUID for this delivery. The receiver stores this ID so if they receive it twice, they don't process it twice (Idempotency).
- `X-Webhook-Attempt`: Attempt number (`1`, `2`, `3`).
- `X-Webhook-Timestamp`: Current epoch timestamp in milliseconds.
- `X-Hub-Signature-256`: Cryptographic HMAC-SHA256 signature generated using the tenant's secret key. The receiver verifies that the payload was not tampered with in transit.

### Component 3: Multi-Tenant Row-Level Security (RLS) Aware Background Worker
This is an enterprise feature interviewers will love:
- In our PostgreSQL database, **Row-Level Security (RLS)** is turned ON.
- A regular tenant like `tenant-alpha` can **only** see its own rows.
- But our background retry worker (`WebhookRetryScheduler`) needs to check **all** tenants to see if anyone has a pending retry!
- **How we solve it safely**:
  1. The background scheduler temporarily switches its context to `sys_admin` (`TenantContext.setTenantId("sys_admin")`).
  2. In PostgreSQL, our RLS policy allows `sys_admin` to view cross-tenant deliveries.
  3. For each pending delivery found, the worker sets `TenantContext.setTenantId(delivery.getTenantId())` to execute the delivery inside that exact tenant's isolated sandbox.
  4. Finally, it clears `TenantContext.clear()` to prevent thread leaks!

### Component 4: Dead Letter Queue (DLQ) Management APIs
- `GET /api/v1/webhooks/dead-letter` $\rightarrow$ Lists all dead-lettered webhooks for the logged-in tenant.
- `POST /api/v1/webhooks/deliveries/{id}/redeliver` $\rightarrow$ Manually resets attempt count and immediately retries the delivery.

---

## 4. Database Schema Changes (`V15__add_webhook_retry_and_dlq.sql`)

```sql
-- Add retry timestamp and idempotency key
ALTER TABLE webhook_deliveries 
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);

-- Create composite index for ultra-fast polling by background worker
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry 
ON webhook_deliveries(status, next_retry_at);
```

---

## 5. Cheat Sheet: Interview Questions & Answers

### Q1: "Why not just use `@Retryable` from Spring Retry?"
> **Your Answer**: 
> *"Spring Retry works well for fast, in-memory retries (like a 100ms database lock timeout). But for external webhooks, retries need to happen over minutes or hours (30s, 2m, 10m). If we used in-memory retries, the worker thread would remain blocked sleeping, or if the server restarted, all in-flight retries would be lost forever. By persisting the retry state (`PENDING_RETRY` and `next_retry_at`) in PostgreSQL, our retry mechanism is fully durable and survives server restarts."*

### Q2: "What is a Dead Letter Queue (DLQ) and why do you need it?"
> **Your Answer**: 
> *"A Dead Letter Queue isolates messages that have repeatedly failed delivery after maximum retries. Without a DLQ, you either retry indefinitely (wasting CPU and network bandwidth hammering a dead server) or you drop the message (causing irreversible data loss). With a DLQ, the failed message is safely quarantined with its error response, allowing engineers or customers to inspect the failure, fix the underlying issue, and trigger a manual redelivery."*

### Q3: "How did you prevent duplicate deliveries when retrying (Idempotency)?"
> **Your Answer**: 
> *"Network requests can succeed on the receiver's end, but the HTTP response might get dropped due to a network timeout. When we retry, we attach an `X-Webhook-ID` idempotency key. The receiving system checks if it has already processed that UUID. If it has, it simply returns HTTP 200 without executing duplicate actions (such as charging a card or fulfilling an order twice)."*

### Q4: "How does your background worker interact with PostgreSQL Row-Level Security (RLS)?"
> **Your Answer**: 
> *"Because RLS automatically injects tenant isolation on every SQL query, a background worker without a tenant context would see 0 rows. We designed our RLS policy to recognize `sys_admin`. The scheduler polls for pending retries across all tenants using `sys_admin`, and then contextualizes each retry execution under the specific tenant's ID before saving delivery logs. This guarantees multi-tenant security while maintaining global background processing."*

---

## 6. Implementation Checklist

- [ ] **Flyway Migration**: Create `V15__add_webhook_retry_and_dlq.sql`.
- [ ] **Domain Entity**: Update `WebhookDelivery.java` with `nextRetryAt` and `idempotencyKey`.
- [ ] **Repository**: Add polling query `findByStatusAndNextRetryAtLessThanEqual` in `WebhookDeliveryRepository.java`.
- [ ] **Service**: Implement exponential backoff and retry logic in `WebhookDispatcherService.java`.
- [ ] **Scheduler**: Create `WebhookRetryScheduler.java` with `@Scheduled` cron/delay.
- [ ] **Controller**: Add DLQ endpoints (`/dead-letter` and `/{id}/redeliver`) in `WebhookController.java`.
- [ ] **Integration Test**: Write `WebhookRetryIntegrationTest.java` to test failure, retry, and DLQ transition.
