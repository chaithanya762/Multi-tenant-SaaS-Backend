package com.example.multitenant.config;

import com.example.multitenant.context.TenantInterceptor;
import com.example.multitenant.ratelimit.RateLimitInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final TenantInterceptor tenantInterceptor;
    private final RateLimitInterceptor rateLimitInterceptor;

    public WebMvcConfig(TenantInterceptor tenantInterceptor, RateLimitInterceptor rateLimitInterceptor) {
        this.tenantInterceptor = tenantInterceptor;
        this.rateLimitInterceptor = rateLimitInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 1. Resolve Tenant Context (from JWT, Subdomain, or X-Tenant-ID)
        registry.addInterceptor(tenantInterceptor)
                .addPathPatterns("/api/**");

        // 2. Enforce Tenant Rate Limiting Quota
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/api/**");
    }
}
