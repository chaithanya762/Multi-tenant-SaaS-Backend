package com.example.multitenant.repository;

import com.example.multitenant.domain.WebhookDelivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface WebhookDeliveryRepository extends JpaRepository<WebhookDelivery, String> {
    List<WebhookDelivery> findByTenantIdAndWebhookIdOrderByCreatedAtDesc(String tenantId, String webhookId);
    Page<WebhookDelivery> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);
    
    // Polling query used by background retry scheduler across all tenants (bypasses Hibernate @TenantId filter; secured via PostgreSQL RLS)
    @Query(value = "SELECT * FROM webhook_deliveries WHERE status = :status AND next_retry_at <= :nextRetryAt AND deleted_at IS NULL ORDER BY next_retry_at ASC", nativeQuery = true)
    List<WebhookDelivery> findPendingRetriesNative(@Param("status") String status, @Param("nextRetryAt") Instant nextRetryAt, Pageable pageable);

    // Queries used by DLQ (Dead Letter Queue) controller
    Page<WebhookDelivery> findByTenantIdAndStatusOrderByCreatedAtDesc(String tenantId, String status, Pageable pageable);
    List<WebhookDelivery> findByTenantIdAndStatusOrderByCreatedAtDesc(String tenantId, String status);
}
