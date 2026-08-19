package com.example.multitenant.web;

import com.example.multitenant.domain.ApiKey;
import com.example.multitenant.service.ApiKeyService;
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

@RestController
@RequestMapping("/api/v1/api-keys")
@Tag(name = "API Keys", description = "Machine-to-machine authentication keys")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    public ApiKeyController(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @PostMapping
    @Operation(summary = "Create a new API key (raw key shown ONCE only)")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<Map<String, Object>> createApiKey(@Valid @RequestBody CreateApiKeyRequest request) {
        ApiKeyService.ApiKeyCreationResult result = apiKeyService.createApiKey(request.getName(), request.getScopes());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", result.apiKey().getId(),
            "name", result.apiKey().getName(),
            "key_prefix", result.apiKey().getKeyPrefix(),
            "raw_key", result.rawKey(),
            "message", "Save this key securely — it will never be shown again."
        ));
    }

    @GetMapping
    @Operation(summary = "List all active API keys for the tenant")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<List<ApiKey>> listApiKeys() {
        return ResponseEntity.ok(apiKeyService.listApiKeys());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Revoke an API key")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<Map<String, String>> revokeApiKey(@PathVariable String id) {
        apiKeyService.revokeApiKey(id);
        return ResponseEntity.ok(Map.of("message", "API key revoked"));
    }

    @Data
    public static class CreateApiKeyRequest {
        @NotBlank private String name;
        private String scopes = "read";
    }
}
