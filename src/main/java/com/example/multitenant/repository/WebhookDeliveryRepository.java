package com.example.multitenant.repository;

import com.example.multitenant.domain.WebhookDelivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebhookDeliveryRepository extends JpaRepository<WebhookDelivery, String> {
    List<WebhookDelivery> findByTenantIdAndWebhookIdOrderByCreatedAtDesc(String tenantId, String webhookId);
    Page<WebhookDelivery> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);
}
