package com.example.multitenant.context;

import com.example.multitenant.repository.TenantRepository;
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

@Component
public class TenantInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TenantInterceptor.class);
    public static final String TENANT_HEADER = "X-Tenant-ID";
    public static final String AUTHORIZATION_HEADER = "Authorization";

    private final JwtTokenProvider jwtTokenProvider;
    private final TenantRepository tenantRepository;

    @Autowired
    public TenantInterceptor(JwtTokenProvider jwtTokenProvider, TenantRepository tenantRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.tenantRepository = tenantRepository;
    }

    private static final Set<String> TENANT_REQUIRED_PREFIXES = Set.of(
            "/api/v1/products",
            "/api/v1/orders",
            "/api/v1/api-keys",
            "/api/v1/webhooks",
            "/api/v1/audit-log",
            "/api/v1/billing",
            "/api/v1/users"
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String tenantId = resolveTenantId(request);

        if (tenantId != null && !tenantId.isBlank()) {
            TenantContext.setTenantId(tenantId.trim());
            org.slf4j.MDC.put("tenantId", tenantId.trim());

            // Check if tenant is suspended or deleted
            tenantRepository.findById(tenantId.trim()).ifPresent(tenant -> {
                if (tenant.isSuspended()) {
                    throw new IllegalStateException("Tenant '" + tenantId + "' is suspended: " + tenant.getSuspensionReason());
                }
                if (tenant.isDeleted()) {
                    throw new IllegalStateException("Tenant '" + tenantId + "' no longer exists");
                }
            });
        } else {
            String path = request.getRequestURI();
            boolean requiresTenant = TENANT_REQUIRED_PREFIXES.stream().anyMatch(path::startsWith);
            if (requiresTenant) {
                throw new MissingTenantHeaderException(path);
            }
        }

        return true;
    }

    private String resolveTenantId(HttpServletRequest request) {
        String authHeader = request.getHeader(AUTHORIZATION_HEADER);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                String tenantFromJwt = jwtTokenProvider.getTenantIdFromToken(token);
                if (tenantFromJwt != null && !tenantFromJwt.isBlank()) {
                    String tenantFromHeader = request.getHeader(TENANT_HEADER);
                    if (tenantFromHeader != null && !tenantFromHeader.isBlank() && !tenantFromHeader.equals(tenantFromJwt)) {
                        throw new org.springframework.security.access.AccessDeniedException("Tenant ID in header does not match Tenant ID in JWT");
                    }
                    return tenantFromJwt;
                }
            } catch (Exception e) {
                if (e instanceof org.springframework.security.access.AccessDeniedException) {
                    throw e;
                }
                log.warn("Invalid JWT token: {}", e.getMessage());
            }
        }
        
        String tenantFromHeader = request.getHeader(TENANT_HEADER);
        if (tenantFromHeader != null && !tenantFromHeader.isBlank()) {
            return tenantFromHeader;
        }

        String host = request.getHeader("Host");
        if (host != null && host.contains(".")) {
            String[] parts = host.split("\\.");
            if (parts.length >= 2 && !parts[0].equalsIgnoreCase("www")
                    && !parts[0].equalsIgnoreCase("localhost")
                    && !parts[0].matches("\\d+")) {
                return parts[0];
            }
        }
        return null;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        TenantContext.clear();
        org.slf4j.MDC.remove("tenantId");
    }
}
