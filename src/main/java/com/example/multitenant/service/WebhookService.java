package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.WebhookEndpoint;
import com.example.multitenant.repository.WebhookEndpointRepository;
import com.example.multitenant.web.dto.WebhookResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class WebhookService {

    private final WebhookEndpointRepository webhookEndpointRepository;

    public WebhookService(WebhookEndpointRepository webhookEndpointRepository) {
        this.webhookEndpointRepository = webhookEndpointRepository;
    }

    public WebhookResponse createWebhook(String url, String secret, String events) {
        WebhookEndpoint endpoint = new WebhookEndpoint(
                UUID.randomUUID().toString(),
                url,
                secret,
                events
        );
        endpoint.setTenantId(TenantContext.getTenantId());
        WebhookEndpoint saved = webhookEndpointRepository.save(endpoint);
        return WebhookResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<WebhookResponse> listWebhooks() {
        String tenantId = TenantContext.getTenantId();
        return webhookEndpointRepository.findByTenantIdAndActiveTrue(tenantId).stream()
                .map(WebhookResponse::fromEntity)
                .toList();
    }

    public void deactivateWebhook(String id) {
        webhookEndpointRepository.findById(id).ifPresent(ep -> {
            ep.setActive(false);
            webhookEndpointRepository.save(ep);
        });
    }
}
