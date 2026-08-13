package com.example.multitenant.web.dto;

import com.example.multitenant.domain.Tenant;

import java.time.Instant;

public class TenantResponse {

    private String id;
    private String name;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public TenantResponse() {}

    public static TenantResponse fromEntity(Tenant tenant) {
        TenantResponse dto = new TenantResponse();
        dto.id = tenant.getId();
        dto.name = tenant.getName();
        dto.status = tenant.getStatus();
        dto.createdAt = tenant.getCreatedAt();
        dto.updatedAt = tenant.getUpdatedAt();
        return dto;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
