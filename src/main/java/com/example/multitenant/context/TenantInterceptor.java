package com.example.multitenant.context;

import com.example.multitenant.security.JwtTokenProvider;
import com.example.multitenant.web.exception.MissingTenantHeaderException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

/**
 * Spring Web Interceptor that extracts tenant identification from:
 * 1. Bearer JWT Token in Authorization header (Primary)
 * 2. Host header subdomain (e.g. acme.localhost -> acme)
 * 3. X-Tenant-ID header (Fallback)
 */
@Component
public class TenantInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TenantInterceptor.class);
    public static final String TENANT_HEADER = "X-Tenant-ID";
    public static final String AUTHORIZATION_HEADER = "Authorization";

    private final JwtTokenProvider jwtTokenProvider;

    @Autowired
    public TenantInterceptor(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    private static final Set<String> TENANT_REQUIRED_PREFIXES = Set.of(
            "/api/v1/products",
            "/api/v1/orders"
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String tenantId = resolveTenantId(request);

        if (tenantId != null && !tenantId.isBlank()) {
            TenantContext.setTenantId(tenantId.trim());
        } else {
            log.trace("No tenant ID resolved for request: {}", request.getRequestURI());

            String path = request.getRequestURI();
            boolean requiresTenant = TENANT_REQUIRED_PREFIXES.stream().anyMatch(path::startsWith);
            if (requiresTenant) {
                throw new MissingTenantHeaderException(path);
            }
        }

        return true;
    }

    private String resolveTenantId(HttpServletRequest request) {
        // 1. Try JWT Authorization Header
        String authHeader = request.getHeader(AUTHORIZATION_HEADER);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                String tenantFromJwt = jwtTokenProvider.getTenantIdFromToken(token);
                if (tenantFromJwt != null && !tenantFromJwt.isBlank()) {
                    return tenantFromJwt;
                }
            } catch (Exception e) {
                log.warn("Invalid JWT token provided in request: {}", e.getMessage());
            }
        }

        // 2. Try Subdomain Resolution from Host Header (e.g. acme.localhost or acme.saas.com)
        String host = request.getHeader("Host");
        if (host != null && host.contains(".")) {
            String[] parts = host.split("\\.");
            if (parts.length >= 2 && !parts[0].equalsIgnoreCase("www") && !parts[0].equalsIgnoreCase("localhost") && !parts[0].matches("\\d+")) {
                return parts[0];
            }
        }

        // 3. Fallback to X-Tenant-ID Header
        return request.getHeader(TENANT_HEADER);
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        TenantContext.clear();
    }
}
