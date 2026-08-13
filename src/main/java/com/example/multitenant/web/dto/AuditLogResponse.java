package com.example.multitenant.web.dto;

import com.example.multitenant.domain.AuditLog;
import java.time.Instant;

public class AuditLogResponse {

    private Long id;
    private String tenantId;
    private String userId;
    private String username;
    private String action;
    private String resourceType;
    private String resourceId;
    private String status;
    private Instant occurredAt;

    public AuditLogResponse() {}

    public AuditLogResponse(Long id, String tenantId, String userId, String username, String action, String resourceType, String resourceId, String status, Instant occurredAt) {
        this.id = id;
        this.tenantId = tenantId;
        this.userId = userId;
        this.username = username;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.status = status;
        this.occurredAt = occurredAt;
    }

    public static AuditLogResponse fromEntity(AuditLog log) {
        if (log == null) return null;
        return new AuditLogResponse(
                log.getId(),
                log.getTenantId(),
                log.getUserId(),
                log.getUsername(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getStatus(),
                log.getOccurredAt()
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }
}
