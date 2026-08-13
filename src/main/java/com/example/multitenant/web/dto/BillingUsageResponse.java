package com.example.multitenant.web.dto;

public class BillingUsageResponse {

    private String tenantId;
    private String period;
    private long apiCalls;
    private long ordersCreated;
    private String plan;
    private double currentCycleCost;

    public BillingUsageResponse() {}

    public BillingUsageResponse(String tenantId, String period, long apiCalls, long ordersCreated, String plan, double currentCycleCost) {
        this.tenantId = tenantId;
        this.period = period;
        this.apiCalls = apiCalls;
        this.ordersCreated = ordersCreated;
        this.plan = plan;
        this.currentCycleCost = currentCycleCost;
    }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public long getApiCalls() { return apiCalls; }
    public void setApiCalls(long apiCalls) { this.apiCalls = apiCalls; }

    public long getOrdersCreated() { return ordersCreated; }
    public void setOrdersCreated(long ordersCreated) { this.ordersCreated = ordersCreated; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public double getCurrentCycleCost() { return currentCycleCost; }
    public void setCurrentCycleCost(double currentCycleCost) { this.currentCycleCost = currentCycleCost; }
}
