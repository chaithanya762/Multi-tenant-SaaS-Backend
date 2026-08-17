package com.example.multitenant.ratelimit;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.service.MeteringService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

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
        }

        return true;
    }
}
