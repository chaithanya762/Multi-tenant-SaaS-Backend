package com.example.multitenant.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // Default secret for development - in production set via environment variable
    private static final String SECRET_KEY_STRING = "MultiTenantSaaSSecretKey2026SuperSecureEnterpriseKeyForJWT#99";
    private static final long EXPIRATION_TIME_MS = 86400000; // 24 hours

    private final SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY_STRING.getBytes(StandardCharsets.UTF_8));

    public String generateToken(String username, String tenantId, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + EXPIRATION_TIME_MS);

        return Jwts.builder()
                .subject(username)
                .claim("tenant_id", tenantId)
                .claim("role", role != null ? role : "ROLE_TENANT_USER")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Claims validateAndExtractClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getTenantIdFromToken(String token) {
        Claims claims = validateAndExtractClaims(token);
        return claims.get("tenant_id", String.class);
    }

    public String getUsernameFromToken(String token) {
        Claims claims = validateAndExtractClaims(token);
        return claims.getSubject();
    }
}
