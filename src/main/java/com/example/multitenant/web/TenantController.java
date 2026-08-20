package com.example.multitenant.web;

import com.example.multitenant.domain.Tenant;
import com.example.multitenant.service.TenantService;
import com.example.multitenant.web.dto.CreateTenantRequest;
import com.example.multitenant.web.dto.TenantResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tenants")
@Tag(name = "Tenant Management", description = "Provision and manage tenant organizations")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_SYS_ADMIN')")
    @Operation(summary = "Provision a new tenant")
    public ResponseEntity<TenantResponse> createTenant(@Valid @RequestBody CreateTenantRequest request) {
        Tenant tenant = tenantService.createTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(TenantResponse.fromEntity(tenant));
    }

    @GetMapping
    @Operation(summary = "List all tenants")
    public ResponseEntity<List<TenantResponse>> getAllTenants() {
        List<TenantResponse> tenants = tenantService.getAllTenants().stream()
                .map(TenantResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(tenants);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tenant details")
    public ResponseEntity<TenantResponse> getTenantById(@PathVariable String id) {
        Tenant tenant = tenantService.getTenantById(id);
        return ResponseEntity.ok(TenantResponse.fromEntity(tenant));
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasRole('ROLE_SYS_ADMIN')")
    @Operation(summary = "Suspend a tenant")
    public ResponseEntity<TenantResponse> suspendTenant(@PathVariable String id, @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "Suspended by administrator");
        Tenant tenant = tenantService.suspendTenant(id, reason);
        return ResponseEntity.ok(TenantResponse.fromEntity(tenant));
    }

    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasRole('ROLE_SYS_ADMIN')")
    @Operation(summary = "Reactivate a suspended tenant")
    public ResponseEntity<TenantResponse> reactivateTenant(@PathVariable String id) {
        Tenant tenant = tenantService.reactivateTenant(id);
        return ResponseEntity.ok(TenantResponse.fromEntity(tenant));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SYS_ADMIN')")
    @Operation(summary = "Soft-delete a tenant")
    public ResponseEntity<Map<String, String>> deleteTenant(@PathVariable String id) {
        tenantService.softDeleteTenant(id);
        return ResponseEntity.ok(Map.of("message", "Tenant deleted"));
    }

    @PatchMapping("/{id}/plan")
    @PreAuthorize("hasRole('ROLE_SYS_ADMIN')")
    @Operation(summary = "Update tenant subscription plan")
    public ResponseEntity<TenantResponse> updatePlan(@PathVariable String id, @RequestBody Map<String, String> body) {
        String planId = body.get("planId");
        if (planId == null || planId.isBlank()) {
            throw new IllegalArgumentException("planId is required");
        }
        Tenant tenant = tenantService.updatePlan(id, planId);
        return ResponseEntity.ok(TenantResponse.fromEntity(tenant));
    }
}
