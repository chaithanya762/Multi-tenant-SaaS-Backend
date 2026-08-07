package com.example.multitenant.web.exception;

public class MissingTenantHeaderException extends RuntimeException {

    public MissingTenantHeaderException(String path) {
        super("Missing required header 'X-Tenant-ID' for request: " + path);
    }
}
