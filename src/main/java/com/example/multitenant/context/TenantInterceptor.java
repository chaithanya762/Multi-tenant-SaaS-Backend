package com.example.multitenant.context;

import com.example.multitenant.web.exception.MissingTenantHeaderException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

/**
 * Spring Web Interceptor that intercepts incoming HTTP requests,
 * extracts tenant identification (e.g. from X-Tenant-ID header),
 * and binds it to the TenantContext. Clears the context upon request completion.
 */
@Component
public class TenantInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TenantInterceptor.class);
    public static final String TENANT_HEADER = "X-Tenant-ID";

    /**
     * Path prefixes that REQUIRE a valid X-Tenant-ID header.
     * Tenant management endpoints (/api/v1/tenants) are excluded because
     * they operate outside any tenant scope.
     */
    private static final Set<String> TENANT_REQUIRED_PREFIXES = Set.of(
            "/api/v1/products",
            "/api/v1/orders"
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String tenantId = request.getHeader(TENANT_HEADER);

        if (tenantId != null && !tenantId.isBlank()) {
            TenantContext.setTenantId(tenantId.trim());
        } else {
            log.trace("No tenant ID header found in request: {}", request.getRequestURI());

            // Enforce tenant header for domain-specific endpoints
            String path = request.getRequestURI();
            boolean requiresTenant = TENANT_REQUIRED_PREFIXES.stream().anyMatch(path::startsWith);
            if (requiresTenant) {
                throw new MissingTenantHeaderException(path);
            }
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // CRITICAL SECURITY STEP: Wipes ThreadLocal context to prevent context leakage across pooled web server threads
        TenantContext.clear();
    }
}
