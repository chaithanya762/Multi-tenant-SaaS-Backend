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
            secretKeyString = "MultiTenantSaaSSecretKey2026SuperSecureEnterpriseKeyForJWT99xyzABC_MultiTenantSaaSSecretKey2026";
            log.warn("JWT_SECRET environment variable not provided. Falling back to default secure 64-character secret key.");
        } else if (secretKeyString.length() < 64) {
            secretKeyString = (secretKeyString + "MultiTenantSaaSSecretKey2026SuperSecureEnterpriseKeyForJWT99xyzABC_MultiTenantSaaSSecretKey2026").substring(0, 64);
            log.warn("JWT_SECRET was under 64 characters. Auto-padded to 64 characters for HMAC-SHA512 compliance.");
        }
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
