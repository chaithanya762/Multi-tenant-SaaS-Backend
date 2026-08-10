package com.example.multitenant.web;

import com.example.multitenant.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Tenant JWT Token Generation Endpoint")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/token")
    @Operation(summary = "Generate JWT Auth Token for Tenant User", description = "Generates a signed JWT containing tenant_id claim for authenticated operations")
    public ResponseEntity<TokenResponse> generateToken(@Valid @RequestBody TokenRequest request) {
        String token = jwtTokenProvider.generateToken(
                request.getUsername(),
                request.getTenantId(),
                request.getRole() != null ? request.getRole() : "ROLE_TENANT_USER"
        );

        TokenResponse response = new TokenResponse();
        response.setToken(token);
        response.setTenantId(request.getTenantId());
        response.setUsername(request.getUsername());
        response.setExpiresInSeconds(86400);

        return ResponseEntity.ok(response);
    }

    @Data
    public static class TokenRequest {
        @NotBlank(message = "Tenant ID is required")
        private String tenantId;

        @NotBlank(message = "Username is required")
        private String username;

        private String role;
    }

    @Data
    public static class TokenResponse {
        private String token;
        private String tenantId;
        private String username;
        private long expiresInSeconds;
    }
}
