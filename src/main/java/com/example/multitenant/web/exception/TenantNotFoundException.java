package com.example.multitenant.web.exception;

public class TenantNotFoundException extends RuntimeException {

    private final String tenantId;

    public TenantNotFoundException(String tenantId) {
        super("Tenant not found with ID: " + tenantId);
        this.tenantId = tenantId;
    }

    public String getTenantId() {
        return tenantId;
    }
}
