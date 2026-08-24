package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.WebhookDelivery;
import com.example.multitenant.domain.WebhookEndpoint;
import com.example.multitenant.repository.WebhookDeliveryRepository;
import com.example.multitenant.repository.WebhookEndpointRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class WebhookDispatcherService {

    private static final Logger log = LoggerFactory.getLogger(WebhookDispatcherService.class);
    private final WebhookEndpointRepository endpointRepository;
    private final WebhookDeliveryRepository deliveryRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public WebhookDispatcherService(WebhookEndpointRepository endpointRepository,
                                  WebhookDeliveryRepository deliveryRepository,
                                  ObjectMapper objectMapper) {
        this.endpointRepository = endpointRepository;
        this.deliveryRepository = deliveryRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Async
    public void dispatchEvent(String tenantId, String eventType, Object payload) {
        try {
            TenantContext.setTenantId(tenantId);
            List<WebhookEndpoint> endpoints = endpointRepository.findByTenantIdAndActiveTrue(tenantId);
            String jsonPayload = objectMapper.writeValueAsString(Map.of(
                    "id", UUID.randomUUID().toString(),
                    "event", eventType,
                    "tenantId", tenantId,
                    "timestamp", System.currentTimeMillis(),
                    "data", payload
            ));

            for (WebhookEndpoint endpoint : endpoints) {
                if (endpoint.getEvents() != null &&
                        (endpoint.getEvents().contains(eventType) || endpoint.getEvents().contains("*"))) {
                    deliverWebhook(endpoint, eventType, jsonPayload);
                }
            }
        } catch (Exception e) {
            log.error("Failed to dispatch webhook event '{}' for tenant '{}'", eventType, tenantId, e);
        } finally {
            TenantContext.clear();
        }
    }

    public WebhookDelivery sendTestEvent(String webhookId) {
        String tenantId = TenantContext.getTenantId();
        WebhookEndpoint endpoint = endpointRepository.findByIdAndTenantId(webhookId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook endpoint not found: " + webhookId));

        String testPayload = String.format("{\"id\":\"%s\",\"event\":\"test.ping\",\"tenantId\":\"%s\",\"timestamp\":%d,\"data\":{\"message\":\"Ping test from Multitenant-SaaS Platform\"}}",
                UUID.randomUUID(), tenantId, System.currentTimeMillis());

        return deliverWebhook(endpoint, "test.ping", testPayload);
    }

    private WebhookDelivery deliverWebhook(WebhookEndpoint endpoint, String eventType, String jsonPayload) {
        long startTime = System.currentTimeMillis();
        Integer statusCode = null;
        String responseBody = null;
        String status = "FAILED";

        try {
            String signature = computeHmacSha256(endpoint.getSecret(), jsonPayload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint.getUrl()))
                    .header("Content-Type", "application/json")
                    .header("X-Tenant-ID", endpoint.getTenantId())
                    .header("X-Hub-Signature-256", signature)
                    .header("User-Agent", "Multitenant-SaaS-Webhook-Dispatcher/1.0")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            statusCode = response.statusCode();
            responseBody = response.body();
            if (responseBody != null && responseBody.length() > 2000) {
                responseBody = responseBody.substring(0, 2000) + "...[truncated]";
            }
            if (statusCode >= 200 && statusCode < 300) {
                status = "SUCCESS";
            }
        } catch (Exception e) {
            responseBody = "Delivery error: " + e.getMessage();
            log.warn("Webhook delivery error to URL '{}': {}", endpoint.getUrl(), e.getMessage());
        }

        long durationMs = System.currentTimeMillis() - startTime;

        WebhookDelivery delivery = new WebhookDelivery(
                UUID.randomUUID().toString(),
                endpoint.getId(),
                eventType,
                jsonPayload,
                statusCode,
                responseBody,
                1,
                durationMs,
                status
        );
        delivery.setTenantId(endpoint.getTenantId());
        return deliveryRepository.save(delivery);
    }

    private String computeHmacSha256(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return "sha256=" + HexFormat.of().formatHex(hmacBytes);
        } catch (Exception e) {
            return "sha256=none";
        }
    }
}
