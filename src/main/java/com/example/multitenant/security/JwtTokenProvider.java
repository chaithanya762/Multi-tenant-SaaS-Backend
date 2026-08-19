package com.example.multitenant.security;

import jakarta.annotation.PostConstruct;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${jwt.secret}")
    private String secretKeyString;

    @Value("${jwt.expiration-ms:900000}")
    private long expirationMs;

    @PostConstruct
    void validateSecretKey() {
        if (secretKeyString == null || secretKeyString.isBlank()) {
            throw new IllegalStateException("FATAL: jwt.secret is not configured. Set the JWT_SECRET environment variable (minimum 64 characters).");
        }
        if (secretKeyString.length() < 64) {
            throw new IllegalStateException("FATAL: jwt.secret must be at least 64 characters for HMAC-SHA512. Current length: " + secretKeyString.length());
        }
        log.info("JWT secret key validated successfully ({} characters)", secretKeyString.length());
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secretKeyString.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username, String tenantId, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(username)
                .claim("tenant_id", tenantId)
                .claim("role", role != null ? role : "ROLE_TENANT_USER")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getKey())
                .compact();
    }

    public Claims validateAndExtractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getTenantIdFromToken(String token) {
        return validateAndExtractClaims(token).get("tenant_id", String.class);
    }

    public String getUsernameFromToken(String token) {
        return validateAndExtractClaims(token).getSubject();
    }

    public String getRoleFromToken(String token) {
        return validateAndExtractClaims(token).get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            validateAndExtractClaims(token);
            return true;
        } catch (Exception e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }
}
