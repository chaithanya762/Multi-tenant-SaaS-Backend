package com.example.multitenant.web.dto;

import com.example.multitenant.domain.WebhookEndpoint;
import java.time.Instant;

public class WebhookResponse {

    private String id;
    private String url;
    private String secretMasked;
    private String events;
    private boolean active;
    private Instant createdAt;

    public WebhookResponse() {}

    public WebhookResponse(String id, String url, String secretMasked, String events, boolean active, Instant createdAt) {
        this.id = id;
        this.url = url;
        this.secretMasked = secretMasked;
        this.events = events;
        this.active = active;
        this.createdAt = createdAt;
    }

    public static WebhookResponse fromEntity(WebhookEndpoint endpoint) {
        if (endpoint == null) return null;
        String rawSecret = endpoint.getSecret();
        String masked = (rawSecret != null && rawSecret.length() > 6)
                ? rawSecret.substring(0, 4) + "..." + rawSecret.substring(rawSecret.length() - 2)
                : "****";
        return new WebhookResponse(
                endpoint.getId(),
                endpoint.getUrl(),
                masked,
                endpoint.getEvents(),
                endpoint.isActive(),
                endpoint.getCreatedAt()
        );
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getSecretMasked() { return secretMasked; }
    public void setSecretMasked(String secretMasked) { this.secretMasked = secretMasked; }

    public String getEvents() { return events; }
    public void setEvents(String events) { this.events = events; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
