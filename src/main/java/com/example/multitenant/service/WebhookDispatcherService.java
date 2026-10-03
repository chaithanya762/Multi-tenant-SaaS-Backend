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
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class WebhookDispatcherService {

    private static final Logger log = LoggerFactory.getLogger(WebhookDispatcherService.class);
    public static final int MAX_ATTEMPTS = 3;
    public static final long BASE_BACKOFF_SECONDS = 30; // Attempt 1: immediate, Attempt 2: 30s, Attempt 3: 120s

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

    public WebhookDelivery deliverWebhook(WebhookEndpoint endpoint, String eventType, String jsonPayload) {
        String deliveryId = UUID.randomUUID().toString();
        int attempt = 1;
        DeliveryAttemptResult result = executeHttpAttempt(endpoint, deliveryId, attempt, jsonPayload);

        WebhookDelivery delivery = new WebhookDelivery(
                deliveryId,
                endpoint.getId(),
                eventType,
                jsonPayload,
                result.statusCode,
                result.responseBody,
                attempt,
                result.durationMs,
                result.status,
                result.nextRetryAt,
                deliveryId
        );
        delivery.setTenantId(endpoint.getTenantId());
        return deliveryRepository.save(delivery);
    }

    public WebhookDelivery retryDelivery(WebhookDelivery delivery) {
        WebhookEndpoint endpoint = endpointRepository.findById(delivery.getWebhookId()).orElse(null);
        if (endpoint == null || !endpoint.isActive()) {
            delivery.setStatus(WebhookDelivery.STATUS_DEAD_LETTER);
            delivery.setResponseBody("Endpoint not found or deactivated");
            delivery.setNextRetryAt(null);
            return deliveryRepository.save(delivery);
        }

        int newAttempt = delivery.getAttemptCount() + 1;
        DeliveryAttemptResult result = executeHttpAttempt(endpoint, delivery.getIdempotencyKey(), newAttempt, delivery.getPayload());

        delivery.setAttemptCount(newAttempt);
        delivery.setResponseStatus(result.statusCode);
        delivery.setResponseBody(result.responseBody);
        delivery.setDurationMs(result.durationMs);
        delivery.setStatus(result.status);
        delivery.setNextRetryAt(result.nextRetryAt);

        log.info("Webhook retry attempt {} for delivery {} resulted in status: {}", newAttempt, delivery.getId(), result.status);
        return deliveryRepository.save(delivery);
    }

    public WebhookDelivery redeliver(String deliveryId) {
        String tenantId = TenantContext.getTenantId();
        WebhookDelivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook delivery not found: " + deliveryId));

        // If not sys_admin, verify tenant owns this delivery
        if (tenantId != null && !tenantId.isBlank() && !"sys_admin".equalsIgnoreCase(tenantId)) {
            if (!tenantId.equals(delivery.getTenantId())) {
                throw new IllegalArgumentException("Access denied to webhook delivery: " + deliveryId);
            }
        }

        log.info("Manual redelivery triggered for delivery {}", deliveryId);
        return retryDelivery(delivery);
    }

    private DeliveryAttemptResult executeHttpAttempt(WebhookEndpoint endpoint, String deliveryId, int attempt, String jsonPayload) {
        long startTime = System.currentTimeMillis();
        Integer statusCode = null;
        String responseBody = null;
        String status = WebhookDelivery.STATUS_PENDING_RETRY;
        Instant nextRetryAt = null;

        try {
            String signature = computeHmacSha256(endpoint.getSecret(), jsonPayload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint.getUrl()))
                    .header("Content-Type", "application/json")
                    .header("X-Tenant-ID", endpoint.getTenantId())
                    .header("X-Webhook-ID", deliveryId)
                    .header("X-Webhook-Attempt", String.valueOf(attempt))
                    .header("X-Webhook-Timestamp", String.valueOf(System.currentTimeMillis()))
                    .header("X-Hub-Signature-256", signature)
                    .header("User-Agent", "Multitenant-SaaS-Webhook-Dispatcher/2.0")
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
                status = WebhookDelivery.STATUS_SUCCESS;
                nextRetryAt = null;
            } else {
                status = determineFailureStatus(attempt);
                nextRetryAt = calculateNextRetryAt(attempt);
            }
        } catch (Exception e) {
            responseBody = "Delivery error: " + e.getMessage();
            log.warn("Webhook delivery error to URL '{}' (attempt {}): {}", endpoint.getUrl(), attempt, e.getMessage());
            status = determineFailureStatus(attempt);
            nextRetryAt = calculateNextRetryAt(attempt);
        }

        long durationMs = System.currentTimeMillis() - startTime;
        return new DeliveryAttemptResult(statusCode, responseBody, status, nextRetryAt, durationMs);
    }

    private String determineFailureStatus(int attempt) {
        if (attempt >= MAX_ATTEMPTS) {
            log.warn("Webhook delivery exceeded max attempts ({}). Moving to DEAD_LETTER queue (DLQ).", MAX_ATTEMPTS);
            return WebhookDelivery.STATUS_DEAD_LETTER;
        }
        return WebhookDelivery.STATUS_PENDING_RETRY;
    }

    private Instant calculateNextRetryAt(int attempt) {
        if (attempt >= MAX_ATTEMPTS) {
            return null;
        }
        // Exponential backoff: 30s * 2^(attempt - 1)
        long delaySeconds = BASE_BACKOFF_SECONDS * (long) Math.pow(2, attempt - 1);
        return Instant.now().plusSeconds(delaySeconds);
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

    private static class DeliveryAttemptResult {
        final Integer statusCode;
        final String responseBody;
        final String status;
        final Instant nextRetryAt;
        final long durationMs;

        DeliveryAttemptResult(Integer statusCode, String responseBody, String status, Instant nextRetryAt, long durationMs) {
            this.statusCode = statusCode;
            this.responseBody = responseBody;
            this.status = status;
            this.nextRetryAt = nextRetryAt;
            this.durationMs = durationMs;
        }
    }
}
