package com.example.multitenant.web.dto;

import com.example.multitenant.domain.ApiKey;
import java.time.Instant;

public class ApiKeyResponse {

    private String id;
    private String name;
    private String keyPrefix;
    private String scopes;
    private boolean active;
    private Instant lastUsedAt;
    private Instant expiresAt;
    private Instant createdAt;

    public ApiKeyResponse() {}

    public ApiKeyResponse(String id, String name, String keyPrefix, String scopes, boolean active, Instant lastUsedAt, Instant expiresAt, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.keyPrefix = keyPrefix;
        this.scopes = scopes;
        this.active = active;
        this.lastUsedAt = lastUsedAt;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    public static ApiKeyResponse fromEntity(ApiKey apiKey) {
        if (apiKey == null) return null;
        return new ApiKeyResponse(
                apiKey.getId(),
                apiKey.getName(),
                apiKey.getKeyPrefix(),
                apiKey.getScopes(),
                apiKey.isActive(),
                apiKey.getLastUsedAt(),
                apiKey.getExpiresAt(),
                apiKey.getCreatedAt()
        );
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getKeyPrefix() { return keyPrefix; }
    public void setKeyPrefix(String keyPrefix) { this.keyPrefix = keyPrefix; }

    public String getScopes() { return scopes; }
    public void setScopes(String scopes) { this.scopes = scopes; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(Instant lastUsedAt) { this.lastUsedAt = lastUsedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
