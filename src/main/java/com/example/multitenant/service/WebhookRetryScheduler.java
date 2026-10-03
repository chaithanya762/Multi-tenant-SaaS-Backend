package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.WebhookDelivery;
import com.example.multitenant.repository.WebhookDeliveryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Background scheduler that periodically scans for webhooks in PENDING_RETRY state
 * whose scheduled backoff time (next_retry_at) has arrived.
 *
 * Runs with sys_admin context to query cross-tenant pending queues under PostgreSQL RLS,
 * then contextualizes each execution under the specific tenant's sandbox.
 */
@Component
public class WebhookRetryScheduler {

    private static final Logger log = LoggerFactory.getLogger(WebhookRetryScheduler.class);
    private static final int BATCH_SIZE = 50;

    private final WebhookDeliveryRepository deliveryRepository;
    private final WebhookDispatcherService webhookDispatcherService;

    public WebhookRetryScheduler(WebhookDeliveryRepository deliveryRepository,
                                WebhookDispatcherService webhookDispatcherService) {
        this.deliveryRepository = deliveryRepository;
        this.webhookDispatcherService = webhookDispatcherService;
    }

    @Scheduled(fixedDelay = 10000, initialDelay = 15000)
    public void processPendingRetries() {
        try {
            // Set sys_admin to query pending retries across all tenants under RLS
            TenantContext.setTenantId("sys_admin");

            List<WebhookDelivery> pendingDeliveries = deliveryRepository.findPendingRetriesNative(
                    WebhookDelivery.STATUS_PENDING_RETRY,
                    Instant.now(),
                    PageRequest.of(0, BATCH_SIZE)
            );

            if (!pendingDeliveries.isEmpty()) {
                log.info("WebhookRetryScheduler found {} pending webhooks to retry", pendingDeliveries.size());
            }

            for (WebhookDelivery delivery : pendingDeliveries) {
                try {
                    // Contextualize under the specific tenant's sandbox for isolated execution
                    TenantContext.setTenantId(delivery.getTenantId());
                    webhookDispatcherService.retryDelivery(delivery);
                } catch (Exception e) {
                    log.error("Failed to process retry for webhook delivery {}: {}", delivery.getId(), e.getMessage());
                } finally {
                    // Re-elevate to sys_admin for the remainder of the batch
                    TenantContext.setTenantId("sys_admin");
                }
            }
        } catch (Exception e) {
            log.error("Error in WebhookRetryScheduler execution: {}", e.getMessage(), e);
        } finally {
            TenantContext.clear();
        }
    }
}
