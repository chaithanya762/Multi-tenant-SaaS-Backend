package com.example.multitenant.domain;

import com.example.multitenant.context.TenantContext;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import org.hibernate.annotations.TenantId;

import java.time.Instant;

@MappedSuperclass
public abstract class AbstractTenantEntity {

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private String tenantId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
    public boolean isDeleted() { return deletedAt != null; }

    @PrePersist
    public void onPrePersist() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.tenantId == null || this.tenantId.isBlank()) {
            String currentTenant = TenantContext.getTenantId();
            if (currentTenant != null && !currentTenant.isBlank()) {
                this.tenantId = currentTenant;
            }
        }
    }

    @PreUpdate
    public void onPreUpdate() { this.updatedAt = Instant.now(); }
}
