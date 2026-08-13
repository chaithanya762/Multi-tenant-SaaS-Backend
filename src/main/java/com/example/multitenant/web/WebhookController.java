package com.example.multitenant.web;

import com.example.multitenant.service.WebhookService;
import com.example.multitenant.web.dto.WebhookResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/webhooks")
@Tag(name = "Webhooks", description = "Configure outbound webhook endpoints for your tenant")
public class WebhookController {

    private final WebhookService webhookService;

    public WebhookController(WebhookService webhookService) {
        this.webhookService = webhookService;
    }

    @PostMapping
    @Operation(summary = "Register a webhook endpoint")
    public ResponseEntity<WebhookResponse> createWebhook(@Valid @RequestBody CreateWebhookRequest request) {
        WebhookResponse response = webhookService.createWebhook(
                request.getUrl(),
                request.getSecret(),
                request.getEvents()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List webhook endpoints for the tenant")
    public ResponseEntity<List<WebhookResponse>> listWebhooks() {
        return ResponseEntity.ok(webhookService.listWebhooks());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate a webhook endpoint")
    public ResponseEntity<Map<String, String>> deleteWebhook(@PathVariable String id) {
        webhookService.deactivateWebhook(id);
        return ResponseEntity.ok(Map.of("message", "Webhook endpoint deactivated"));
    }

    @Data
    public static class CreateWebhookRequest {
        @NotBlank private String url;
        @NotBlank private String secret;
        @NotBlank private String events;
    }
}

