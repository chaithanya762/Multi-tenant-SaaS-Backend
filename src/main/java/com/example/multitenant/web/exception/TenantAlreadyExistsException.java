package com.example.multitenant.web.exception;

public class TenantAlreadyExistsException extends RuntimeException {
    public TenantAlreadyExistsException(String id) {
        super("Tenant with ID '" + id + "' already exists");
    }
}
