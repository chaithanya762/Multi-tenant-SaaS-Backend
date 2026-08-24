package com.example.multitenant.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

@Entity
@Table(name = "webhook_deliveries")
@SQLRestriction("deleted_at IS NULL")
public class WebhookDelivery extends AbstractTenantEntity {

    @Id
    private String id;

    @Column(name = "webhook_id", nullable = false)
    private String webhookId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String payload;

    @Column(name = "response_status")
    private Integer responseStatus;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "attempt_count")
    private int attemptCount = 1;

    @Column(name = "duration_ms")
    private long durationMs;

    @Column(nullable = false)
    private String status; // SUCCESS, FAILED

    public WebhookDelivery() {}

    public WebhookDelivery(String id, String webhookId, String eventType, String payload, Integer responseStatus, String responseBody, int attemptCount, long durationMs, String status) {
        this.id = id != null ? id : UUID.randomUUID().toString();
        this.webhookId = webhookId;
        this.eventType = eventType;
        this.payload = payload;
        this.responseStatus = responseStatus;
        this.responseBody = responseBody;
        this.attemptCount = attemptCount;
        this.durationMs = durationMs;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getWebhookId() { return webhookId; }
    public void setWebhookId(String webhookId) { this.webhookId = webhookId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public Integer getResponseStatus() { return responseStatus; }
    public void setResponseStatus(Integer responseStatus) { this.responseStatus = responseStatus; }
    public String getResponseBody() { return responseBody; }
    public void setResponseBody(String responseBody) { this.responseBody = responseBody; }
    public int getAttemptCount() { return attemptCount; }
    public void setAttemptCount(int attemptCount) { this.attemptCount = attemptCount; }
    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
