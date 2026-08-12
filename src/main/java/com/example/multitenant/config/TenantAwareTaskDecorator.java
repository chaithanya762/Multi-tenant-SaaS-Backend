package com.example.multitenant.config;

import com.example.multitenant.context.TenantContext;
import org.springframework.core.task.TaskDecorator;

public class TenantAwareTaskDecorator implements TaskDecorator {
    @Override
    public Runnable decorate(Runnable runnable) {
        String tenantId = TenantContext.getTenantId();
        return () -> {
            try {
                if (tenantId != null) {
                    TenantContext.setTenantId(tenantId);
                }
                runnable.run();
            } finally {
                TenantContext.clear();
            }
        };
    }
}
