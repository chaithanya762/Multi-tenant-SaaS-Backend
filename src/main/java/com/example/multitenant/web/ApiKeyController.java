package com.example.multitenant.web;

import com.example.multitenant.service.ApiKeyService;
import com.example.multitenant.web.dto.ApiKeyCreationResponse;
import com.example.multitenant.web.dto.ApiKeyResponse;
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
@RequestMapping("/api/v1/api-keys")
@Tag(name = "API Keys", description = "Machine-to-machine authentication keys")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    public ApiKeyController(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @PostMapping
    @Operation(summary = "Create a new API key (raw key shown ONCE only)")
    public ResponseEntity<ApiKeyCreationResponse> createApiKey(@Valid @RequestBody CreateApiKeyRequest request) {
        ApiKeyService.ApiKeyCreationResult result = apiKeyService.createApiKey(request.getName(), request.getScopes());
        ApiKeyCreationResponse response = new ApiKeyCreationResponse(
                result.apiKey().getId(),
                result.apiKey().getName(),
                result.apiKey().getKeyPrefix(),
                result.rawKey(),
                "Save this key securely — it will never be shown again."
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List all active API keys for the tenant")
    public ResponseEntity<List<ApiKeyResponse>> listApiKeys() {
        List<ApiKeyResponse> keys = apiKeyService.listApiKeys().stream()
                .map(ApiKeyResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(keys);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Revoke an API key")
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

