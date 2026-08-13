package com.example.multitenant.web;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.service.MeteringService;
import com.example.multitenant.web.dto.BillingUsageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<BillingUsageResponse> getCurrentUsage() {
        String tenantId = TenantContext.getTenantId();
        BillingUsageResponse response = new BillingUsageResponse(
                tenantId,
                "last_30_days",
                meteringService.getApiCallsThisMonth(tenantId),
                meteringService.getOrdersThisMonth(tenantId),
                "Pro",
                150.00
        );
        return ResponseEntity.ok(response);
    }
}

