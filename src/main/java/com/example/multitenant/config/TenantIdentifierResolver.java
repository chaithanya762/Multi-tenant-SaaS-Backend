package com.example.multitenant.config;

import com.example.multitenant.context.TenantContext;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

/**
 * Spring component that implements Hibernate 6's CurrentTenantIdentifierResolver interface.
 * Resolves the tenant identifier dynamically from TenantContext (ThreadLocal) for @TenantId entities.
 */
@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenantId = TenantContext.getTenantId();
        return (tenantId != null && !tenantId.isBlank()) ? tenantId : "SYSTEM";
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
