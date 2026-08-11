package com.example.multitenant.web;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.service.MeteringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/billing")
@Tag(name = "Billing & Usage", description = "Tenant usage metrics and billing information")
public class BillingController {

    private final MeteringService meteringService;

    public BillingController(MeteringService meteringService) {
        this.meteringService = meteringService;
    }

    @GetMapping("/usage")
    @Operation(summary = "Get usage stats for the current period (last 30 days)")
    public ResponseEntity<Map<String, Object>> getCurrentUsage() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(Map.of(
            "tenant_id", tenantId,
            "period", "last_30_days",
            "api_calls", meteringService.getApiCallsThisMonth(tenantId),
            "orders_created", meteringService.getOrdersThisMonth(tenantId)
        ));
    }
}
