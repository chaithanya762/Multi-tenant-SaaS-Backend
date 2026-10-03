# 🚀 05 - Life of a Request: From React Button Click to PostgreSQL

Let's trace exactly what happens under the hood when a user performs an action in your app.

**Scenario**: A user from `tenant-alpha` clicks **"Add Product"** on the Products page, enters name *"Mechanical Keyboard"*, price *$129.99*, and clicks **Save**.

---

## Step 1: React Frontend ([`CreateProductModal.jsx`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/frontend/src/components/modals/CreateProductModal.jsx))
1. The user fills out the form.
2. The `handleSubmit` event fires.
3. React calls [`apiClient.post('/api/v1/products', { name: "Mechanical Keyboard", price: 129.99, stockQuantity: 50 })`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/frontend/src/api/apiClient.js).
4. **`apiClient.js`** automatically grabs the stored JWT token and attaches it to the HTTP header:
   ```http
   POST /api/v1/products HTTP/1.1
   Host: multitenant-backend-4lh0.onrender.com
   Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
   Content-Type: application/json
   
   {"name":"Mechanical Keyboard","price":129.99,"stockQuantity":50}
   ```

---

## Step 2: Spring Security ([`JwtAuthenticationFilter.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/security/JwtAuthenticationFilter.java))
1. The request hits the embedded Tomcat server on port 8080 (or 10000 on Render).
2. Before reaching any controller, it enters the **Spring Security Filter Chain**.
3. `JwtAuthenticationFilter` inspects the `Authorization` header.
4. It parses the JWT token using `jwtTokenProvider.validateToken(token)`:
   - Is the signature valid? **Yes.**
   - Is it expired? **No.**
5. It extracts `username = "john"`, `tenantId = "tenant-alpha"`, `role = "ROLE_TENANT_ADMIN"`.
6. It puts the authenticated user into Spring's `SecurityContextHolder`.

---

## Step 3: Tenant Interceptor & MDC Logging
1. [`TenantInterceptor.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/context/TenantInterceptor.java) extracts `tenantId = "tenant-alpha"` from the token.
2. It sets `TenantContext.setTenantId("tenant-alpha")` in a Java `ThreadLocal`.
3. [`MDCTenantFilter.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/config/MDCTenantFilter.java) adds `[tenant=tenant-alpha]` to the logging context.
   Now, every single log message produced during this request will automatically print:
   ```text
   20:45:10.123 [main] INFO ... [tenant=tenant-alpha] [req=a7b05141] - Creating product: Mechanical Keyboard
   ```

---

## Step 4: REST Controller ([`ProductController.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/web/ProductController.java))
1. Spring routes the HTTP request to:
   ```java
   @PostMapping
   public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody CreateProductRequest request)
   ```
2. The `@Valid` annotation checks validation rules:
   - Is `name` blank? **No.**
   - Is `price` negative? **No.**
   (If invalid, `GlobalExceptionHandler` immediately returns `422 Unprocessable Entity`).
3. The controller delegates to `ProductService.createProduct(request)`.

---

## Step 5: Business Logic & Quota Enforcement ([`ProductService.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/service/ProductService.java))
1. `ProductService` checks the tenant's subscription plan:
   - Tenant Alpha is on the `STARTER` plan (limit: 100 products).
   - Tenant Alpha currently has 42 products.
   - 43 <= 100? **Allowed!** (If they exceeded the quota, a `QuotaExceededException` is thrown, returning `429 Too Many Requests`).
2. Creates the `Product` entity and sets its `tenantId = "tenant-alpha"`.
3. Calls `productRepository.save(product)`.

---

## Step 6: AOP Session Interception ([`TenantSessionAspect.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/config/TenantSessionAspect.java))
1. Right before `productRepository.save(...)` sends SQL to PostgreSQL, Spring AOP intercepts the method.
2. It runs:
   ```sql
   SELECT set_config('app.current_tenant_id', 'tenant-alpha', true);
   ```
3. PostgreSQL sets the transaction-scoped session variable to `'tenant-alpha'`.

---

## Step 7: PostgreSQL RLS Execution
1. Hibernate generates and executes the SQL:
   ```sql
   INSERT INTO products (id, tenant_id, name, price, stock_quantity, created_at)
   VALUES ('prod-99', 'tenant-alpha', 'Mechanical Keyboard', 129.99, 50, NOW());
   ```
2. PostgreSQL checks the table's Row-Level Security policy:
   - Does `tenant_id` match `current_setting('app.current_tenant_id')`?
   - `'tenant-alpha' == 'tenant-alpha'` -> **PASS!**
3. Row is successfully written to disk.

---

## Step 8: Audit Logging & Metering (Async)
1. [`AuditService.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/service/AuditService.java) logs the action: `PRODUCT_CREATED`, ID `prod-99`, user `john`.
2. [`MeteringService.java`](file:///C:/Users/admin/Downloads/Multi-tenant-SaaS-Backend/src/main/java/com/example/multitenant/service/MeteringService.java) asynchronously logs a usage event (`product_added`) into `usage_events` with `@JdbcTypeCode(SqlTypes.JSON)`.

---

## Step 9: HTTP Response to React
1. The Controller returns `ResponseEntity.status(HttpStatus.CREATED).body(productResponse)` (`HTTP 201 Created`).
2. Spring clears the `ThreadLocal` in `TenantContext` to prevent memory leaks.
3. React receives the JSON, updates its UI state, closes the modal, and shows a green toast notification:
   *"Product 'Mechanical Keyboard' created successfully!"*

---

Next, open [`06_DEPLOYMENT_AND_RENDER_FIXES.md`](06_DEPLOYMENT_AND_RENDER_FIXES.md) to understand why your deployment was failing and how it was fixed.
