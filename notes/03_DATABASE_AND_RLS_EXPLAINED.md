# 🗄️ 03 - Database & PostgreSQL Row-Level Security (RLS) Explained

> **This is the core superpower of your entire project.** If an interviewer asks you, *"How does your multi-tenant backend prevent data leaks?"*, this is the exact concept you explain.

---

## 1. What is Row-Level Security (RLS)?

Imagine a spreadsheet where all companies' products are stored:

| id | tenant_id | product_name | price |
|---|---|---|---|
| p1 | `tenant-alpha` | Apple iPhone 15 | $999 |
| p2 | `tenant-alpha` | MacBook Pro | $1999 |
| p3 | `tenant-beta` | Tesla Model 3 | $35000 |
| p4 | `tenant-beta` | Cyberquad | $1900 |

In a normal database, if a developer writes:
```sql
SELECT * FROM products;
```
The database dumps **all 4 rows**, exposing Tenant Beta's products to Tenant Alpha.

### Enter PostgreSQL Row-Level Security (RLS)
PostgreSQL allows you to attach a **security rule** directly to the table:
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

### What happens now?
When a connection connects to PostgreSQL, Java sets a session variable:
```sql
SELECT set_config('app.current_tenant_id', 'tenant-alpha', true);
```
Now, if Java executes `SELECT * FROM products;`, PostgreSQL evaluates the policy:
- Does row `p1` match `tenant-alpha`? **YES** -> Return row.
- Does row `p2` match `tenant-alpha`? **YES** -> Return row.
- Does row `p3` match `tenant-alpha`? **NO** -> Invisible! Discarded!
- Does row `p4` match `tenant-alpha`? **NO** -> Invisible! Discarded!

**Tenant Alpha can ONLY ever see rows where `tenant_id = 'tenant-alpha'`.** Even if a developer forgets to filter by tenant in their SQL, the database refuses to leak the data!

---

## 2. How Does Java Tell PostgreSQL Who the Current Tenant Is?

Look inside [`TenantSessionAspect.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/config/TenantSessionAspect.java):

```java
@Aspect
@Component
public class TenantSessionAspect {
    @Before("execution(* com.example.multitenant.repository..*(..))")
    public void setTenantSession(JoinPoint joinPoint) {
        String tenantId = TenantContext.getTenantId();
        // Sets the PostgreSQL session variable before ANY repository query runs:
        entityManager.createNativeQuery("SELECT set_config('app.current_tenant_id', :tenantId, true)")
                     .setParameter("tenantId", tenantId)
                     .getSingleResult();
    }
}
```

1. An incoming request has a JWT token belonging to `tenant-alpha`.
2. Java stores `tenant-alpha` in `TenantContext` (`ThreadLocal`).
3. Right before Java runs any database query, `TenantSessionAspect` intercepts the call and runs `set_config('app.current_tenant_id', 'tenant-alpha', true)`.
4. PostgreSQL applies the RLS rules for that transaction.
5. After the request finishes, the `ThreadLocal` is wiped clean.

---

## 3. What is Flyway and Why Do We Have Migrations V1 to V14?

When you change a database schema (add a table or column), you can't just manually log into production and type SQL commands. That causes chaos and mistakes.

**Flyway** is a version control system for your database:
- It looks inside `src/main/resources/db/migration/`.
- Every file has a version number: `V1__...`, `V2__...`, `V3__...`.
- Flyway creates a tracking table in PostgreSQL called `flyway_schema_history`.
- When your application starts, Flyway checks: *"Did I run V1? Yes. Did I run V2? Yes. Did I run V12? No, let me run V12 now!"*

### Breakdown of Your Migrations:

| Migration | What it does |
|---|---|
| `V1` | Core tables (`tenants`, `products`, `orders`) + initial RLS policies |
| `V2` | Users table (`users`), subscription plans, and refresh tokens |
| `V3` | Immutable audit log table (`audit_log`) |
| `V4` | API keys table (`api_keys`) for programmatic access |
| `V5` | Outbound webhook endpoints (`webhook_endpoints`) |
| `V6` | Usage metering events (`usage_events`) for billing |
| `V7` | PostgreSQL full-text search indexes on products |
| `V8` & `V9` | Audit tracking columns (`created_by`, `updated_by`) |
| `V10` & `V11` | Order line items (`order_items`) and soft-delete (`deleted_at`) |
| `V12` | Webhook delivery history log table (`webhook_deliveries`) |
| `V13` | Custom branding per tenant (logo, colors, domain, support email) |
| `V14` | User team invitations (`user_invitations`) and 2FA TOTP secrets |

---

## 4. Why Did V12 Fail on Render Earlier?

Earlier, your Render deployment failed with:
`ERROR: column "webhook_id" does not exist on table webhook_deliveries`

**Why?**
- Back in `V5`, someone had created an early experiment table called `webhook_deliveries` with a column named `endpoint_id`.
- Later, in `V12`, a new table was defined with `webhook_id`.
- When Flyway ran on Render, PostgreSQL said: *"Hey, webhook_deliveries already exists from V5!"*
- Then when V12 tried to create an index on `webhook_id`, PostgreSQL failed because the old V5 table only had `endpoint_id`.

**The Fix We Made**:
In `V12__add_webhook_deliveries.sql`, we added `DROP TABLE IF EXISTS webhook_deliveries CASCADE;` and created `FlywayConfig.java` with `flyway.repair()`. It wiped the obsolete V5 table and cleanly built the complete V12 table.

---

Next, open [`04_SECURITY_AUTH_AND_ROLES.md`](04_SECURITY_AUTH_AND_ROLES.md) to understand authentication and roles.
