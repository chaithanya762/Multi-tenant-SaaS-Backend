package com.example.multitenant.ratelimit;

import com.example.multitenant.context.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final TenantRateLimiterService rateLimiterService;

    public RateLimitInterceptor(TenantRateLimiterService rateLimiterService) {
        this.rateLimiterService = rateLimiterService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String tenantId = TenantContext.getTenantId();

        if (tenantId != null && !tenantId.isBlank()) {
            TenantRateLimiterService.RateLimitResult result = rateLimiterService.tryConsume(tenantId);
            response.setHeader("X-RateLimit-Limit", "60");
            response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));

            if (!result.isAllowed()) {
                response.setStatus(429); // 429 Too Many Requests
                response.setContentType("application/json");
                response.getWriter().write("""
                        {
                          "status": 429,
                          "error": "Too Many Requests",
                          "message": "Tenant API quota exceeded (60 requests/minute). Please try again in a minute.",
                          "tenantId": "%s"
                        }
                        """.formatted(tenantId));
                return false;
            }
        }

        return true;
    }
}
