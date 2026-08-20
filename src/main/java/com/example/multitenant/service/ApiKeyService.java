package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.ApiKey;
import com.example.multitenant.repository.ApiKeyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class ApiKeyService {

    private static final Logger log = LoggerFactory.getLogger(ApiKeyService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ApiKeyRepository apiKeyRepository;

    public ApiKeyService(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    @Transactional
    public ApiKeyCreationResult createApiKey(String name, String scopes) {
        byte[] rawBytes = new byte[32];
        SECURE_RANDOM.nextBytes(rawBytes);
        String rawKey = "sk_live_" + Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);
        String prefix = rawKey.substring(0, Math.min(rawKey.length(), 16));
        String keyHash = hashKey(rawKey);

        ApiKey apiKey = new ApiKey(UUID.randomUUID().toString(), name, prefix, keyHash, scopes);
        apiKeyRepository.save(apiKey);
        log.info("Created API key '{}' for tenant '{}'", name, TenantContext.getTenantId());
        return new ApiKeyCreationResult(apiKey, rawKey); // raw key shown ONCE only
    }

    @Transactional(readOnly = true)
    public List<ApiKey> listApiKeys() {
        return apiKeyRepository.findByTenantIdAndActiveTrue(TenantContext.getTenantId());
    }

    @Transactional
    public void revokeApiKey(String id) {
        String tenantId = TenantContext.getTenantId();
        ApiKey key = apiKeyRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("API key not found: " + id));
        key.setActive(false);
        apiKeyRepository.save(key);
        log.info("Revoked API key '{}' in tenant '{}'", key.getName(), tenantId);
    }

    public ApiKey validateApiKey(String rawKey) {
        String hash = hashKey(rawKey);
        return apiKeyRepository.findByKeyHashAndActiveTrue(hash)
            .filter(k -> !k.isExpired())
            .orElseThrow(() -> new IllegalArgumentException("Invalid API key"));
    }

    private String hashKey(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash API key", e);
        }
    }

    public record ApiKeyCreationResult(ApiKey apiKey, String rawKey) {}
}
