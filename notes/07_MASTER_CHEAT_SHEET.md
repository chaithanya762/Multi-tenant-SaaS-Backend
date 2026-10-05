# 🎯 07 - Master Cheat Sheet & Interview Talking Points

Keep this cheat sheet handy whenever you need to run, test, or talk about this project.

---

## ⚡ 1. Daily Development Commands

### Running Backend Locally
```powershell
# Option A: Run using helper script (auto-detects Postgres or falls back to in-memory H2)
.\run-backend.ps1

# Option B: Run via Maven Wrapper
.\mvnw.cmd spring-boot:run

# Option C: Run with local H2 in-memory profile (no database required)
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

### Running Frontend Locally
```powershell
cd frontend
npm install
npm run dev
# Opens at: http://localhost:3000
```

### Running Full Stack with Docker
```powershell
# Spins up PostgreSQL, Redis, Spring Boot Backend, and React Frontend in containers
docker-compose up --build
```

### Running Unit & Integration Tests
```powershell
# Run the full test suite
.\mvnw.cmd test

# Run a single specific test
.\mvnw.cmd test -Dtest=TenantIsolationIntegrationTest#testDuplicateTenantReturns409
```

### Pushing Code to GitHub & Triggering Render
```powershell
git add .
git commit -m "feat: your feature description"
git push origin main
```

---

## 🌐 2. Essential URLs

| Service | Local URL | Production (Render) URL |
|---|---|---|
| **Frontend Web App** | `http://localhost:3000` | Render Static Site URL |
| **Backend REST API** | `http://localhost:8080/api/v1` | `https://multitenant-backend-4lh0.onrender.com/api/v1` |
| **Interactive Swagger UI** | `http://localhost:8080/swagger-ui.html` | `https://multitenant-backend-4lh0.onrender.com/swagger-ui.html` |
| **OpenAPI Spec (JSON)** | `http://localhost:8080/api-docs` | `https://multitenant-backend-4lh0.onrender.com/api-docs` |
| **Health Check Endpoint** | `http://localhost:8080/actuator/health` | `https://multitenant-backend-4lh0.onrender.com/actuator/health` |

---

### The 30-Second Elevator Pitch
> *"I built an enterprise multi-tenant SaaS backend and management console designed for shared-schema multi-tenancy. Rather than relying on simple SQL WHERE clauses in application code—which is error-prone and vulnerable to developer oversight—I leveraged PostgreSQL's native Row-Level Security (RLS) policies. I integrated this with Spring Boot 3 using an AOP session aspect that intercepts repository queries and sets the transaction-scoped tenant context in PostgreSQL dynamically. The system includes JWT authentication with refresh token rotation, RBAC role separation, Flyway versioned migrations, distributed caching with Redis, audit logging, and usage metering."*

### Key Technical Talking Points

1. **Why Shared-Schema Multi-Tenancy with RLS?**
   - *"Database-per-tenant is expensive to scale, and separate schemas require complex DDL migrations. A shared schema with PostgreSQL Row-Level Security provides hardware efficiency while guaranteeing kernel-level data isolation."*

2. **How is Security Handled?**
   - *"Passwords are hashed using BCrypt (strength 12). Authentication uses JJWT with HMAC-SHA512. Short-lived 15-minute access tokens prevent replay attacks, while refresh tokens allow session continuity without compromising credential security."*

3. **How Did You Solve Cloud Deployment Challenges?**
   - *"On cloud environments like Render's free tier (512MB RAM), default G1GC settings trigger Linux cgroup OOM kills (Exit Code 137). I tuned the container with SerialGC, explicit heap/metaspace boundaries, and added Flyway auto-repair strategies to handle migration schema drift and legacy table collisions."*

---

## 📚 4. Summary Index of Notes

You can browse all the deep-dive guides inside the [`notes/`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/notes) directory:

1. [`01_THE_BIG_PICTURE.md`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/notes/01_THE_BIG_PICTURE.md) — What is SaaS and Multi-Tenancy (Apartment building analogy).
2. [`02_ARCHITECTURE_AND_TECH_STACK.md`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/notes/02_ARCHITECTURE_AND_TECH_STACK.md) — Directory structure and tech stack breakdown.
3. [`03_DATABASE_AND_RLS_EXPLAINED.md`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/notes/03_DATABASE_AND_RLS_EXPLAINED.md) — PostgreSQL Row-Level Security & Flyway migrations.
4. [`04_SECURITY_AUTH_AND_ROLES.md`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/notes/04_SECURITY_AUTH_AND_ROLES.md) — BCrypt, JWT tokens, RBAC roles (`SYS_ADMIN`, `TENANT_ADMIN`, `TENANT_USER`).
5. [`05_HOW_A_REQUEST_TRAVELS.md`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/notes/05_HOW_A_REQUEST_TRAVELS.md) — Step-by-step trace from React button click to PostgreSQL.
6. [`06_DEPLOYMENT_AND_RENDER_FIXES.md`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/notes/06_DEPLOYMENT_AND_RENDER_FIXES.md) — Cloud deployment, OOM fixes, Flyway conflict resolution.
7. [`07_MASTER_CHEAT_SHEET.md`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/notes/07_MASTER_CHEAT_SHEET.md) — Commands, URLs, and interview talking points.
