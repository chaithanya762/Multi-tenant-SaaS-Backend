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

    @GetMapping("/plans")
    @Operation(summary = "Get all available subscription plan tiers")
    public ResponseEntity<List<Map<String, Object>>> getPlans() {
        List<Map<String, Object>> plans = List.of(
            Map.of(
                "id", "plan-free",
                "name", "Free Starter",
                "price", 0,
                "interval", "month",
                "rateLimit", 60,
                "orderQuota", 100,
                "productQuota", 50,
                "features", List.of("PostgreSQL Row-Level Isolation", "Basic Audit Logs", "Standard Support", "Up to 5 Team Members")
            ),
            Map.of(
                "id", "plan-pro",
                "name", "Professional",
                "price", 49,
                "interval", "month",
                "rateLimit", 300,
                "orderQuota", 5000,
                "productQuota", 2500,
                "features", List.of("High-throughput Rate Limits", "Real-time Webhook Dispatcher", "CSV Data Exports", "2FA Security Enforcement", "Unlimited Team Members")
            ),
            Map.of(
                "id", "plan-enterprise",
                "name", "Enterprise",
                "price", 199,
                "interval", "month",
                "rateLimit", -1,
                "orderQuota", -1,
                "productQuota", -1,
                "features", List.of("Dedicated Schema Isolation Option", "Custom Domain & White-labeling", "99.99% SLA Guarantee", "24/7 Dedicated Support", "Unlimited Everything")
            )
        );
        return ResponseEntity.ok(plans);
    }

    @PostMapping("/checkout-session")
    @Operation(summary = "Create a Stripe checkout session for plan upgrade")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@RequestBody Map<String, String> body) {
        String planId = body.get("planId");
        String tenantId = TenantContext.getTenantId();
        if (planId == null || planId.isBlank()) {
            throw new IllegalArgumentException("planId is required");
        }
        // Returns checkout URL (mock/demo or live Stripe portal)
        String checkoutUrl = String.format("https://checkout.stripe.com/c/pay/demo_session_%s_%s", tenantId, planId);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "checkoutUrl", checkoutUrl,
                "message", "Stripe checkout session created for " + planId
        ));
    }

    @PostMapping("/portal-session")
    @Operation(summary = "Create a Stripe customer portal session")
    public ResponseEntity<Map<String, String>> createPortalSession() {
        String tenantId = TenantContext.getTenantId();
        String portalUrl = String.format("https://billing.stripe.com/p/session/demo_portal_%s", tenantId);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "portalUrl", portalUrl,
                "message", "Customer portal session initialized"
        ));
    }
}
