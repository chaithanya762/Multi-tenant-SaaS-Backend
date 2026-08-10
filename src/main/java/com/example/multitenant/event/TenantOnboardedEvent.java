package com.example.multitenant.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TenantOnboardedEvent extends ApplicationEvent {

    private final String tenantId;
    private final String tenantName;

    public TenantOnboardedEvent(Object source, String tenantId, String tenantName) {
        super(source);
        this.tenantId = tenantId;
        this.tenantName = tenantName;
    }
}
