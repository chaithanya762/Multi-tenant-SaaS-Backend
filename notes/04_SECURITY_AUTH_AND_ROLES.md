# 🔐 04 - Security, Authentication & Role-Based Access Control (RBAC)

Security is often the hardest part of a backend. In this chapter, we explain how your backend knows who is making a request and what they are allowed to do.

---

## 1. Authentication vs Authorization

- **Authentication (AuthN)**: *"Who are you?"* (e.g. Logging in with username and password).
- **Authorization (AuthZ)**: *"Are you allowed to do this?"* (e.g. Can an employee delete the entire company? No!).

---

## 2. Password Security: BCrypt Hashing

In your database, passwords are NEVER stored in plain text.
If a hacker steals your database, they will NOT see `password123`.

Instead, [`SecurityConfig.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/config/SecurityConfig.java) uses **BCrypt with a cost factor of 12**:
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}
```
When a user signs up with `password123`, the database stores:
`$2a$12$e8Yk2uR.4v7MhGk/p2Q5ue0s4NfWq.7e8v9...`

BCrypt includes a "salt" and runs 4,096 cryptographic hashing rounds. It is mathematically impossible to reverse-engineer the original password.

---

## 3. How JWT (JSON Web Token) Works

When a user logs in via `POST /api/v1/auth/login`:
1. The backend verifies username and password.
2. The backend generates a **JWT access token**.
3. The frontend receives the token and stores it in memory/storage.
4. For every subsequent request, the frontend sends the token in the HTTP Header:
   ```http
   Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsInRlbmFudElkIjoidGVuYW50LWFscGhhIiwicm9sZSI6IlJPTEVfVEVOQU5UX0FETUlOIn0...
   ```

### What is Inside a JWT?
A JWT is three Base64-encoded strings separated by dots (`.`):
1. **Header**: The signing algorithm (HS512).
2. **Payload**: User claims (e.g., `userId: "usr-1"`, `tenantId: "tenant-alpha"`, `role: "ROLE_TENANT_ADMIN"`, `exp: 1775231234`).
3. **Signature**: Cryptographic signature generated using your secret key (`JWT_SECRET`).

**Why this is great**:
The backend doesn't have to query the database to verify who you are! It just verifies the signature using `JWT_SECRET`. If anyone tampers with the `tenantId` in the token, the cryptographic signature becomes invalid and Spring Security rejects the request with HTTP 401 Unauthorized!

### Access Tokens vs Refresh Tokens
- **Access Token**: Expires in **15 minutes** (`JWT_EXPIRY_MS: 900000`). If stolen, the attacker only has 15 minutes of access.
- **Refresh Token**: Stored in the database, expires in **30 days** (`JWT_REFRESH_EXPIRY_MS: 2592000000`). When the 15-minute token expires, the frontend calls `POST /api/v1/auth/refresh` to get a fresh access token without forcing the user to log in again.

---

## 4. User Roles & RBAC (Role-Based Access Control)

Your application has 3 distinct roles:

```text
               ┌───────────────────────────────┐
               │         ROLE_SYS_ADMIN        │  (Super Admin / Platform Owner)
               └───────────────┬───────────────┘
                               │ Can manage all tenants, view metrics, change plans
                               ▼
               ┌───────────────────────────────┐
               │       ROLE_TENANT_ADMIN       │  (Company Boss / Workspace Owner)
               └───────────────┬───────────────┘
                               │ Can invite team members, generate API keys, set branding
                               ▼
               ┌───────────────────────────────┐
               │        ROLE_TENANT_USER       │  (Company Employee)
               └───────────────────────────────┘
                                 Can view & create products and orders for their company
```

### How Spring Security Enforces This:

In [`SecurityConfig.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/config/SecurityConfig.java):

```java
.authorizeHttpRequests(auth -> auth
    // 1. PUBLIC: Anyone can see health and docs
    .requestMatchers("/actuator/health", "/swagger-ui/**", "/api-docs/**").permitAll()
    .requestMatchers("/api/v1/auth/**").permitAll()
    
    // 2. SYSTEM ADMIN ONLY: Only Platform Owner can create/delete tenants
    .requestMatchers(HttpMethod.POST, "/api/v1/tenants").hasRole("SYS_ADMIN")
    .requestMatchers(HttpMethod.DELETE, "/api/v1/tenants/**").hasRole("SYS_ADMIN")
    .requestMatchers("/api/v1/admin/**").hasRole("SYS_ADMIN")
    
    // 3. AUTHENTICATED: All other endpoints require a valid login token
    .anyRequest().authenticated()
)
```

And inside Controllers using method annotations:
```java
@PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
@PostMapping("/api/v1/api-keys")
public ApiKey createApiKey(...) { ... }
```
If a `ROLE_TENANT_USER` tries to call `POST /api/v1/api-keys`, Spring Security blocks them immediately with **HTTP 403 Forbidden**.

---

Next, open [`05_HOW_A_REQUEST_TRAVELS.md`](05_HOW_A_REQUEST_TRAVELS.md) to follow a request from a button click in React all the way to PostgreSQL.
