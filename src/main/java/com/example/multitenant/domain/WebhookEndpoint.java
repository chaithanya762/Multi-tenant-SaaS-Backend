package com.example.multitenant.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Entity
@Table(name = "webhook_endpoints")
public class WebhookEndpoint extends AbstractTenantEntity {

    @Id
    private String id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(nullable = false)
    private String secret;

    @Column(nullable = false)
    private String events;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public WebhookEndpoint() {}

    public WebhookEndpoint(String id, String url, String secret, String events) {
        this.id = id;
        this.url = url;
        this.secret = secret;
        this.events = events;
    }

    public List<String> getEventList() {
        if (events == null || events.isBlank()) return List.of();
        return Arrays.asList(events.split(","));
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public String getEvents() { return events; }
    public void setEvents(String events) { this.events = events; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
