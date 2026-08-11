package com.example.multitenant.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "usage_events")
public class UsageEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String metric;

    @Column(nullable = false)
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private Instant recordedAt = Instant.now();

    public UsageEvent() {}

    public UsageEvent(String tenantId, String metric, BigDecimal quantity, String metadata) {
        this.tenantId = tenantId;
        this.metric = metric;
        this.quantity = quantity;
        this.metadata = metadata;
        this.recordedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getMetric() { return metric; }
    public BigDecimal getQuantity() { return quantity; }
    public String getMetadata() { return metadata; }
    public Instant getRecordedAt() { return recordedAt; }
}
