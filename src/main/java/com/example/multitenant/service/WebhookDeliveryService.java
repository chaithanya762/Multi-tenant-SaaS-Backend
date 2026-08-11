package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.WebhookEndpoint;
import com.example.multitenant.repository.WebhookEndpointRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;

@Service
public class WebhookDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(WebhookDeliveryService.class);

    private final WebhookEndpointRepository endpointRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public WebhookDeliveryService(WebhookEndpointRepository endpointRepository,
                                   ObjectMapper objectMapper) {
        this.endpointRepository = endpointRepository;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void fireEvent(String tenantId, String eventType, Object payload) {
        List<WebhookEndpoint> endpoints = endpointRepository.findByTenantIdAndActiveTrue(tenantId);
        for (WebhookEndpoint endpoint : endpoints) {
            if (!endpoint.getEventList().contains(eventType)) continue;
            try {
                String body = objectMapper.writeValueAsString(payload);
                String signature = computeSignature(endpoint.getSecret(), body);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("X-Webhook-Event", eventType);
                headers.set("X-Webhook-Signature-256", "sha256=" + signature);
                headers.set("X-Webhook-Tenant", tenantId);

                HttpEntity<String> entity = new HttpEntity<>(body, headers);
                restTemplate.postForEntity(endpoint.getUrl(), entity, String.class);
                log.info("Webhook delivered: event='{}' to url='{}' for tenant='{}'",
                    eventType, endpoint.getUrl(), tenantId);
            } catch (Exception e) {
                log.warn("Webhook delivery failed to '{}': {}", endpoint.getUrl(), e.getMessage());
            }
        }
    }

    private String computeSignature(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC signature", e);
        }
    }
}
