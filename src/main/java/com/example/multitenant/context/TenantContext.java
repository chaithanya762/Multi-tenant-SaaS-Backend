package com.example.multitenant.context;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Thread-Local context holder to store the active tenant ID for the current request context.
 */
public class TenantContext {

    private static final Logger log = LoggerFactory.getLogger(TenantContext.class);
    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
        // Utility class
    }

    public static void setTenantId(String tenantId) {
        log.debug("Setting current tenant to: {}", tenantId);
        CURRENT_TENANT.set(tenantId);
    }

    public static String getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        log.debug("Clearing tenant context for thread: {}", Thread.currentThread().getName());
        CURRENT_TENANT.remove();
    }
}
