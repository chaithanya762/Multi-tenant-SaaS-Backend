package com.example.multitenant.ratelimit;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.service.MeteringService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final int AUTH_RATE_LIMIT_PER_MINUTE = 20;
    private final java.util.concurrent.ConcurrentHashMap<String, java.util.concurrent.atomic.AtomicInteger> authRateLimits = new java.util.concurrent.ConcurrentHashMap<>();

    private final TenantRateLimiterService rateLimiterService;
    private final MeteringService meteringService;

    public RateLimitInterceptor(TenantRateLimiterService rateLimiterService,
                                 MeteringService meteringService) {
        this.rateLimiterService = rateLimiterService;
        this.meteringService = meteringService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String tenantId = TenantContext.getTenantId();

        if (tenantId != null && !tenantId.isBlank()) {
            TenantRateLimiterService.RateLimitResult result = rateLimiterService.tryConsume(tenantId);
            response.setHeader("X-RateLimit-Limit", String.valueOf(result.getLimit()));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));

            if (!result.isAllowed()) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Tenant API quota exceeded.\",\"tenantId\":\"" + tenantId + "\"}");
                return false;
            }

            // Record API call for metering (async, non-blocking)
            meteringService.recordEvent("api_call", 1);
        } else {
            String path = request.getRequestURI();
            if (path.startsWith("/api/v1/auth/")) {
                String clientIp = request.getHeader("X-Forwarded-For");
                if (clientIp == null || clientIp.isBlank()) {
                    clientIp = request.getRemoteAddr();
                } else {
                    clientIp = clientIp.split(",")[0].trim();
                }
                String minuteKey = clientIp + ":" + (System.currentTimeMillis() / 60000);
                java.util.concurrent.atomic.AtomicInteger counter = authRateLimits.computeIfAbsent(minuteKey, k -> new java.util.concurrent.atomic.AtomicInteger(0));
                if (counter.incrementAndGet() > AUTH_RATE_LIMIT_PER_MINUTE) {
                    response.setStatus(429);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Too many authentication attempts. Please try again later.\"}");
                    return false;
                }
                // Cleanup old entries periodically
                if (authRateLimits.size() > 10000) {
                    long currentMinute = System.currentTimeMillis() / 60000;
                    authRateLimits.entrySet().removeIf(e -> {
                        try { return Long.parseLong(e.getKey().split(":")[e.getKey().split(":").length - 1]) < currentMinute - 2; } catch (Exception ex) { return true; }
                    });
                }
            }
        }

        return true;
    }
}
