package com.example.multitenant.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MDCTenantFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String requestId = request.getHeader("X-Request-ID");
            if (requestId == null || requestId.isBlank()) {
                requestId = java.util.UUID.randomUUID().toString().substring(0, 8);
            }
            org.slf4j.MDC.put("requestId", requestId);
            response.setHeader("X-Request-ID", requestId);
            
            MDC.put("method", request.getMethod());
            MDC.put("path", request.getRequestURI());
            filterChain.doFilter(request, response);
        } finally {
            org.slf4j.MDC.remove("requestId");
            MDC.clear();
        }
    }
}
