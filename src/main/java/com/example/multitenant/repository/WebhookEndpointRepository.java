package com.example.multitenant.repository;

import com.example.multitenant.domain.WebhookEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebhookEndpointRepository extends JpaRepository<WebhookEndpoint, String> {
    List<WebhookEndpoint> findByTenantIdAndActiveTrue(String tenantId);
}
