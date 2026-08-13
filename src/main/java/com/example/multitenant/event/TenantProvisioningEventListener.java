package com.example.multitenant.event;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.Product;
import com.example.multitenant.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class TenantProvisioningEventListener {

    private static final Logger log = LoggerFactory.getLogger(TenantProvisioningEventListener.class);
    private final ProductRepository productRepository;

    public TenantProvisioningEventListener(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @EventListener
    @Async
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void onTenantOnboarded(TenantOnboardedEvent event) {
        log.info("Provisioning default catalog for new tenant: {} ({})", event.getTenantName(), event.getTenantId());

        try {
            TenantContext.setTenantId(event.getTenantId());

            Product starterServer = new Product(
                    UUID.randomUUID().toString(),
                    "Starter Compute Node",
                    "Default cloud instance provisioned during onboarding",
                    new BigDecimal("49.99"),
                    10
            );
            starterServer.setTenantId(event.getTenantId());
            productRepository.save(starterServer);

            Product storageVault = new Product(
                    UUID.randomUUID().toString(),
                    "Cloud Storage Vault",
                    "1TB Object storage volume",
                    new BigDecimal("19.99"),
                    50
            );
            storageVault.setTenantId(event.getTenantId());
            productRepository.save(storageVault);

            log.info("Successfully provisioned 2 default products for tenant: {}", event.getTenantId());
        } catch (Exception e) {
            log.error("Failed to provision catalog for tenant {}: {}", event.getTenantId(), e.getMessage());
        } finally {
            TenantContext.clear();
        }
    }
}
