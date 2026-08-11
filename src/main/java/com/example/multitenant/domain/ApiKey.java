package com.example.multitenant.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "api_keys")
public class ApiKey extends AbstractTenantEntity {

    @Id
    private String id;

    @Column(name = "created_by")
    private String createdBy;

    @Column(nullable = false)
    private String name;

    @Column(name = "key_prefix", nullable = false)
    private String keyPrefix;

    @Column(name = "key_hash", nullable = false, unique = true)
    private String keyHash;

    @Column(nullable = false)
    private String scopes = "read";

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public ApiKey() {}

    public ApiKey(String id, String name, String keyPrefix, String keyHash, String scopes) {
        this.id = id;
        this.name = name;
        this.keyPrefix = keyPrefix;
        this.keyHash = keyHash;
        this.scopes = scopes;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getKeyPrefix() { return keyPrefix; }
    public String getKeyHash() { return keyHash; }
    public String getScopes() { return scopes; }
    public void setScopes(String scopes) { this.scopes = scopes; }
    public Instant getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(Instant lastUsedAt) { this.lastUsedAt = lastUsedAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isExpired() { return expiresAt != null && Instant.now().isAfter(expiresAt); }
}
