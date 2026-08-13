package com.example.multitenant.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "max_products", nullable = false)
    private int maxProducts;

    @Column(name = "max_orders_per_month", nullable = false)
    private int maxOrdersPerMonth;

    @Column(name = "max_users", nullable = false)
    private int maxUsers;

    @Column(name = "requests_per_minute", nullable = false)
    private int requestsPerMinute;

    @Column(nullable = false)
    private String features = "";

    @Column(name = "monthly_price_usd", nullable = false)
    private BigDecimal monthlyPriceUsd = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public SubscriptionPlan() {}

    public SubscriptionPlan(String id, String name, int maxProducts, int maxOrdersPerMonth, int maxUsers, int requestsPerMinute, String features, BigDecimal monthlyPriceUsd) {
        this.id = id;
        this.name = name;
        this.maxProducts = maxProducts;
        this.maxOrdersPerMonth = maxOrdersPerMonth;
        this.maxUsers = maxUsers;
        this.requestsPerMinute = requestsPerMinute;
        this.features = features;
        this.monthlyPriceUsd = monthlyPriceUsd;
    }

    public List<String> getFeatureList() {
        if (features == null || features.isBlank()) return List.of();
        return Arrays.asList(features.split(","));
    }

    public boolean hasFeature(String feature) {
        return getFeatureList().contains(feature);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getMaxProducts() { return maxProducts; }
    public void setMaxProducts(int maxProducts) { this.maxProducts = maxProducts; }
    public int getMaxOrdersPerMonth() { return maxOrdersPerMonth; }
    public void setMaxOrdersPerMonth(int maxOrdersPerMonth) { this.maxOrdersPerMonth = maxOrdersPerMonth; }
    public int getMaxUsers() { return maxUsers; }
    public void setMaxUsers(int maxUsers) { this.maxUsers = maxUsers; }
    public int getRequestsPerMinute() { return requestsPerMinute; }
    public void setRequestsPerMinute(int requestsPerMinute) { this.requestsPerMinute = requestsPerMinute; }
    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }
    public BigDecimal getMonthlyPriceUsd() { return monthlyPriceUsd; }
    public void setMonthlyPriceUsd(BigDecimal monthlyPriceUsd) { this.monthlyPriceUsd = monthlyPriceUsd; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
