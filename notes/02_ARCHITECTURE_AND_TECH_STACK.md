# 🏗️ 02 - Architecture & Tech Stack: The Moving Parts

In this chapter, we map out every technology in your repository and explain what job each one does.

---

## 1. High-Level Architecture Diagram

```
       [ USER'S BROWSER ]
               │
               ▼
     [ React Frontend (Vite) ]  (Port 3000 locally / Render Static Site)
               │
               │ HTTP REST Requests (with JWT Bearer Token)
               ▼
    [ Spring Boot Backend (Java 17) ]  (Port 8080 locally / Port 10000 on Render)
       ├── Security Filter (Validates JWT Token)
       ├── Tenant Interceptor (Finds who the tenant is)
       ├── Controller (REST API Endpoints)
       ├── Service (Business Logic)
       ├── AOP Aspect (Sets PostgreSQL Session Tenant Variable)
       └── Repository (Spring Data JPA / Hibernate)
               │
               ├── (Queries via JDBC with RLS) ──────► [ PostgreSQL 16/18 ]
               └── (Rate limits & Caching) ───────────► [ Redis (Optional) ]
```

---

## 2. Directory Structure Breakdown

Here is what all those folders in your project actually do:

```text
Multi-tenant-SaaS-Backend/
├── frontend/                # Everything the user SEES and CLICKS
│   ├── src/                 # React components, pages, context, and styles
│   ├── vite.config.js       # Build configuration for Vite
│   └── package.json         # JavaScript libraries (React, Lucide icons, Recharts)
│
├── src/main/java/com/example/multitenant/   # THE BACKEND BRAIN (Java)
│   ├── config/              # Security, CORS, Swagger, Database, Flyway configuration
│   ├── context/             # ThreadLocal storage for the current tenant ID
│   ├── domain/              # Database models (Tenant, Product, Order, User, etc.)
│   ├── repository/          # Database queries (Spring Data JPA interfaces)
│   ├── service/             # Core business rules (Auth, Orders, Products, Webhooks)
│   ├── web/                 # REST API Controllers (URLs that frontend calls)
│   └── MultitenantApplication.java # The Java main() method that starts Spring Boot
│
├── src/main/resources/      # BACKEND CONFIGURATION & ASSETS
│   ├── application.yml      # Port, database URL, JWT secrets, logging configuration
│   ├── db/migration/        # Flyway SQL migration scripts (V1 through V14)
│   └── static/              # Compiled HTML/JS for serving frontend from backend
│
├── .github/workflows/       # Automated CI testing with GitHub Actions
├── Dockerfile               # Recipe for building the production container
├── docker-compose.yml       # Recipe for running Postgres, Redis, Backend, Frontend locally
├── render.yaml              # Cloud deployment instructions for Render
└── pom.xml                  # Maven dependency file (Java packages list)
```

---

## 3. The Tech Stack Explained

### 1. Java 17 + Spring Boot 3.3.2 (The Backend)
- **What is Spring Boot?** It is the most popular enterprise backend framework in the world (used by Netflix, Uber, Amazon, banks).
- **What does it do for you?**
  - Starts an embedded web server (Apache Tomcat).
  - Listens for incoming HTTP requests (`GET`, `POST`, `PUT`, `DELETE`).
  - Manages database transactions so operations don't get corrupted.
  - Injects dependencies automatically (Dependency Injection).

### 2. Maven (`pom.xml` & `./mvnw`)
- **What is Maven?** Maven is the package manager for Java (like `npm` is for JavaScript or `pip` is for Python).
- `pom.xml` lists all external Java libraries your app needs (like Spring Security, PostgreSQL Driver, JJWT, Flyway).
- `mvnw` (Maven Wrapper) is a script that downloads the exact version of Maven needed so you don't have to install it manually.

### 3. PostgreSQL (The Database)
- The database where all data permanently lives.
- Tables: `tenants`, `users`, `products`, `orders`, `order_items`, `audit_log`, `webhook_endpoints`, `webhook_deliveries`, `api_keys`, `usage_events`.
- **Special Feature**: PostgreSQL has built-in **Row-Level Security (RLS)**, which your project uses as a digital bouncer for data isolation.

### 4. React 19 + Vite (The Frontend)
- **Vite**: A super-fast modern bundler that compiles JavaScript/JSX into optimized HTML/CSS/JS.
- **React**: A component-based UI library where pages are assembled from reusable blocks (buttons, modals, tables, topbars).
- **Lucide React**: Clean modern icons (bell, shield, user, cart, etc.).
- **Recharts**: Renders the analytics graphs on the Dashboard.

### 5. Redis (Cache & Rate Limiting)
- An ultra-fast in-memory database.
- Used in your app for:
  - Rate limiting (e.g. max 60 requests/minute per tenant).
  - If Redis is down or unavailable, your code has an automatic fallback to an in-memory `ConcurrentHashMap`, so the app still works!

### 6. Docker & Render (Deployment)
- **Docker**: Packages your code, Java runtime, and dependencies into an isolated "container" image. If it runs on your machine, it runs everywhere.
- **Render**: The cloud hosting provider that hosts your backend container, your PostgreSQL database, and your frontend static site.

---

Next, open [`03_DATABASE_AND_RLS_EXPLAINED.md`](03_DATABASE_AND_RLS_EXPLAINED.md) to understand how the database protects tenant data.
