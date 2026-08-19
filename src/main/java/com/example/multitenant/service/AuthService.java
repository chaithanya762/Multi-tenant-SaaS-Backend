package com.example.multitenant.service;

import com.example.multitenant.domain.RefreshToken;
import com.example.multitenant.domain.User;
import com.example.multitenant.repository.RefreshTokenRepository;
import com.example.multitenant.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Value("${jwt.refresh-expiration-ms:2592000000}")
    private long refreshExpirationMs;

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final com.example.multitenant.repository.UserRepository userRepository;

    public AuthService(JwtTokenProvider jwtTokenProvider,
                       UserService userService,
                       RefreshTokenRepository refreshTokenRepository,
                       com.example.multitenant.repository.UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userService = userService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public LoginResult login(String tenantId, String username, String password) {
        User user = userService.authenticate(tenantId, username, password);
        String accessToken = jwtTokenProvider.generateToken(user.getUsername(), user.getTenantId(), user.getRole());
        String rawRefreshToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawRefreshToken);
        Instant expiresAt = Instant.now().plusMillis(refreshExpirationMs);
        RefreshToken refreshToken = new RefreshToken(tokenHash, user.getId(), user.getTenantId(), expiresAt);
        refreshTokenRepository.save(refreshToken);
        log.info("User '{}' logged in for tenant '{}'", username, tenantId);
        return new LoginResult(accessToken, rawRefreshToken, user);
    }

    @Transactional
    public String refreshAccessToken(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired refresh token"));
        if (!stored.isValid()) {
            throw new IllegalArgumentException("Refresh token is expired or revoked");
        }
        User user = userRepository.findByIdAndTenantId(stored.getUserId(), stored.getTenantId())
            .orElseThrow(() -> new IllegalArgumentException("User not found for refresh token"));
        if (!user.isActive()) {
            throw new IllegalStateException("User account is deactivated");
        }
        return jwtTokenProvider.generateToken(user.getUsername(), user.getTenantId(), user.getRole());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        refreshTokenRepository.revokeByTokenHash(tokenHash);
    }

    private String hashToken(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }

    public record LoginResult(String accessToken, String refreshToken, User user) {}
}
