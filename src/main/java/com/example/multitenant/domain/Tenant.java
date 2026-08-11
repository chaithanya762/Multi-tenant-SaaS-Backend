package com.example.multitenant.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String status;

    @Column(name = "plan_id")
    private String planId;

    @Column(name = "suspended_at")
    private Instant suspendedAt;

    @Column(name = "suspension_reason")
    private String suspensionReason;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Tenant() {}

    public Tenant(String id, String name, String status) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.planId = "plan-free";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onPreUpdate() { this.updatedAt = Instant.now(); }

    public boolean isActive() { return "ACTIVE".equals(status) && deletedAt == null; }
    public boolean isSuspended() { return "SUSPENDED".equals(status); }
    public boolean isDeleted() { return deletedAt != null; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPlanId() { return planId; }
    public void setPlanId(String planId) { this.planId = planId; }
    public Instant getSuspendedAt() { return suspendedAt; }
    public void setSuspendedAt(Instant suspendedAt) { this.suspendedAt = suspendedAt; }
    public String getSuspensionReason() { return suspensionReason; }
    public void setSuspensionReason(String suspensionReason) { this.suspensionReason = suspensionReason; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
