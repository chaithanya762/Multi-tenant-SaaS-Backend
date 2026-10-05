package com.example.multitenant.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(1)
public class SecurityHeadersFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        response.setHeader("X-Content-Type-Options", "nosniff");//Prevents browsers from guessing a file’s MIME type
        response.setHeader("X-Frame-Options", "DENY");//Stops the app from being embedded in a frame, helping prevent clickjacking
        response.setHeader("X-XSS-Protection", "1; mode=block");//Enables older browser XSS filtering behavior
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");//Reduces leakage of sensitive URL information in referrers
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");//Reduces leakage of sensitive URL information in referrers
        response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");//Tells browsers to enforce HTTPS for one year and all subdomains
        chain.doFilter(req, res);
    }

    @Override public void init(FilterConfig filterConfig) {}
    @Override public void destroy() {}
}
