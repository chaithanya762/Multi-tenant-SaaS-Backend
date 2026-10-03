package com.example.multitenant;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.Tenant;
import com.example.multitenant.domain.WebhookDelivery;
import com.example.multitenant.domain.WebhookEndpoint;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.repository.WebhookDeliveryRepository;
import com.example.multitenant.repository.WebhookEndpointRepository;
import com.example.multitenant.security.JwtTokenProvider;
import com.example.multitenant.service.WebhookDispatcherService;
import com.example.multitenant.service.WebhookRetryScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class WebhookRetryIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private WebhookEndpointRepository endpointRepository;

    @Autowired
    private WebhookDeliveryRepository deliveryRepository;

    @Autowired
    private WebhookDispatcherService webhookDispatcherService;

    @Autowired
    private WebhookRetryScheduler webhookRetryScheduler;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String alphaToken;

    @BeforeEach
    void setUp() {
        deliveryRepository.deleteAll();
        endpointRepository.deleteAll();
        tenantRepository.deleteAll();

        tenantRepository.save(new Tenant("tenant-alpha", "Alpha Corp", "ACTIVE"));
        TenantContext.clear();

        alphaToken = jwtTokenProvider.generateToken("alpha-admin", "tenant-alpha", "ROLE_TENANT_ADMIN");
    }

    @Test
    @DisplayName("Verify webhook delivery failure triggers PENDING_RETRY with exponential backoff")
    void testWebhookFailureTriggersPendingRetry() {
        TenantContext.setTenantId("tenant-alpha");

        // Create endpoint pointing to unreachable local port
        WebhookEndpoint endpoint = new WebhookEndpoint(
                UUID.randomUUID().toString(),
                "http://127.0.0.1:59999/unreachable/webhook",
                "secret-123",
                "order.created"
        );
        endpoint.setTenantId("tenant-alpha");
        endpoint = endpointRepository.save(endpoint);

        // Deliver webhook - should fail and transition to PENDING_RETRY
        WebhookDelivery delivery = webhookDispatcherService.deliverWebhook(endpoint, "order.created", "{\"orderId\":\"123\"}");

        assertThat(delivery).isNotNull();
        assertThat(delivery.getStatus()).isEqualTo(WebhookDelivery.STATUS_PENDING_RETRY);
        assertThat(delivery.getAttemptCount()).isEqualTo(1);
        assertThat(delivery.getNextRetryAt()).isNotNull();
        assertThat(delivery.getNextRetryAt()).isAfter(Instant.now());
        assertThat(delivery.getIdempotencyKey()).isEqualTo(delivery.getId());

        TenantContext.clear();
    }

    @Test
    @DisplayName("Verify max retry attempts transitions delivery to DEAD_LETTER (DLQ)")
    void testMaxRetriesTransitionsToDeadLetter() {
        TenantContext.setTenantId("tenant-alpha");

        WebhookEndpoint endpoint = new WebhookEndpoint(
                UUID.randomUUID().toString(),
                "http://127.0.0.1:59999/unreachable/webhook",
                "secret-123",
                "order.created"
        );
        endpoint.setTenantId("tenant-alpha");
        endpoint = endpointRepository.save(endpoint);

        // Attempt 1: PENDING_RETRY
        WebhookDelivery delivery = webhookDispatcherService.deliverWebhook(endpoint, "order.created", "{\"orderId\":\"123\"}");
        assertThat(delivery.getStatus()).isEqualTo(WebhookDelivery.STATUS_PENDING_RETRY);
        assertThat(delivery.getAttemptCount()).isEqualTo(1);

        // Simulate Attempt 2: PENDING_RETRY
        delivery = webhookDispatcherService.retryDelivery(delivery);
        assertThat(delivery.getStatus()).isEqualTo(WebhookDelivery.STATUS_PENDING_RETRY);
        assertThat(delivery.getAttemptCount()).isEqualTo(2);

        // Simulate Attempt 3 (Max): Transitions to DEAD_LETTER
        delivery = webhookDispatcherService.retryDelivery(delivery);
        assertThat(delivery.getStatus()).isEqualTo(WebhookDelivery.STATUS_DEAD_LETTER);
        assertThat(delivery.getAttemptCount()).isEqualTo(3);
        assertThat(delivery.getNextRetryAt()).isNull();

        TenantContext.clear();
    }

    @Test
    @DisplayName("Verify Dead Letter Queue API and manual redelivery endpoint")
    void testDeadLetterApiAndRedelivery() throws Exception {
        TenantContext.setTenantId("tenant-alpha");

        WebhookEndpoint endpoint = new WebhookEndpoint(
                UUID.randomUUID().toString(),
                "http://127.0.0.1:59999/unreachable/webhook",
                "secret-123",
                "order.created"
        );
        endpoint.setTenantId("tenant-alpha");
        endpoint = endpointRepository.save(endpoint);

        // Create a DEAD_LETTER delivery directly
        WebhookDelivery dlqDelivery = new WebhookDelivery(
                UUID.randomUUID().toString(),
                endpoint.getId(),
                "order.created",
                "{\"orderId\":\"dlq-test\"}",
                500,
                "Internal Server Error",
                3,
                50L,
                WebhookDelivery.STATUS_DEAD_LETTER,
                null,
                UUID.randomUUID().toString()
        );
        dlqDelivery.setTenantId("tenant-alpha");
        deliveryRepository.save(dlqDelivery);
        TenantContext.clear();

        // 1. Query /api/v1/webhooks/dead-letter
        mockMvc.perform(get("/api/v1/webhooks/dead-letter")
                        .header("Authorization", "Bearer " + alphaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("DEAD_LETTER"))
                .andExpect(jsonPath("$[0].attemptCount").value(3));

        // 2. Trigger manual redelivery POST /api/v1/webhooks/deliveries/{id}/redeliver
        mockMvc.perform(post("/api/v1/webhooks/deliveries/" + dlqDelivery.getId() + "/redeliver")
                        .header("Authorization", "Bearer " + alphaToken))
                .andExpect(status().isOk());

        TenantContext.clear();
    }

    @Test
    @DisplayName("Verify WebhookRetryScheduler picks up expired PENDING_RETRY records")
    void testWebhookRetrySchedulerProcessing() {
        TenantContext.setTenantId("tenant-alpha");

        WebhookEndpoint endpoint = new WebhookEndpoint(
                UUID.randomUUID().toString(),
                "http://127.0.0.1:59999/unreachable/webhook",
                "secret-123",
                "order.created"
        );
        endpoint.setTenantId("tenant-alpha");
        endpoint = endpointRepository.save(endpoint);

        // Create a delivery with nextRetryAt in the past (already due for retry)
        WebhookDelivery dueDelivery = new WebhookDelivery(
                UUID.randomUUID().toString(),
                endpoint.getId(),
                "order.created",
                "{\"orderId\":\"scheduler-test\"}",
                null,
                "Connection failed",
                1,
                20L,
                WebhookDelivery.STATUS_PENDING_RETRY,
                Instant.now().minusSeconds(10), // expired 10s ago
                UUID.randomUUID().toString()
        );
        dueDelivery.setTenantId("tenant-alpha");
        deliveryRepository.save(dueDelivery);
        TenantContext.clear();

        // Run scheduler
        webhookRetryScheduler.processPendingRetries();

        // Verify that attempt count was incremented
        TenantContext.setTenantId("tenant-alpha");
        WebhookDelivery updated = deliveryRepository.findById(dueDelivery.getId()).orElseThrow();
        assertThat(updated.getAttemptCount()).isEqualTo(2);
        TenantContext.clear();
    }
}
