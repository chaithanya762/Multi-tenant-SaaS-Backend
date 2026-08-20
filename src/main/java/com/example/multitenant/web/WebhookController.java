package com.example.multitenant.web;

import com.example.multitenant.domain.WebhookEndpoint;
import com.example.multitenant.repository.WebhookEndpointRepository;
import com.example.multitenant.context.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/webhooks")
@Tag(name = "Webhooks", description = "Configure outbound webhook endpoints for your tenant")
public class WebhookController {

    private final WebhookEndpointRepository webhookEndpointRepository;

    public WebhookController(WebhookEndpointRepository webhookEndpointRepository) {
        this.webhookEndpointRepository = webhookEndpointRepository;
    }

    @PostMapping
    @Operation(summary = "Register a webhook endpoint")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<WebhookEndpoint> createWebhook(@Valid @RequestBody CreateWebhookRequest request) {
        WebhookEndpoint endpoint = new WebhookEndpoint(
            UUID.randomUUID().toString(),
            request.getUrl(),
            request.getSecret(),
            request.getEvents()
        );
        endpoint.setTenantId(TenantContext.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(webhookEndpointRepository.save(endpoint));
    }

    @GetMapping
    @Operation(summary = "List webhook endpoints for the tenant")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<List<WebhookEndpoint>> listWebhooks() {
        return ResponseEntity.ok(
            webhookEndpointRepository.findByTenantIdAndActiveTrue(TenantContext.getTenantId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate a webhook endpoint")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<Map<String, String>> deleteWebhook(@PathVariable String id) {
        String tenantId = TenantContext.getTenantId();
        WebhookEndpoint ep = webhookEndpointRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Webhook not found: " + id));
        ep.setActive(false);
        webhookEndpointRepository.save(ep);
        return ResponseEntity.ok(Map.of("message", "Webhook endpoint deactivated"));
    }

    @Data
    public static class CreateWebhookRequest {
        @NotBlank private String url;
        @NotBlank private String secret;
        @NotBlank private String events; // comma-separated: "order.created,product.updated"
    }
}
