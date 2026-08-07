package com.example.multitenant.domain;

import com.example.multitenant.context.TenantContext;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import org.hibernate.annotations.TenantId;

import java.time.Instant;

/**
 * Base abstract mapped superclass for all tenant-partitioned entities.
 * Enforces automatic population of tenantId and timestamp fields.
 */
@MappedSuperclass
public abstract class AbstractTenantEntity {

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private String tenantId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    @PrePersist
    public void onPrePersist() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();

        // Automatically populate tenant_id from ThreadLocal context if not manually set
        if (this.tenantId == null || this.tenantId.isBlank()) {
            String currentTenant = TenantContext.getTenantId();
            if (currentTenant != null && !currentTenant.isBlank()) {
                this.tenantId = currentTenant;
            }
        }
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = Instant.now();
    }
}
