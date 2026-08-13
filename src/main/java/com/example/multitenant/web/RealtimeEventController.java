package com.example.multitenant.web;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.service.RealtimeEventPublisherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/realtime")
@Tag(name = "Real-Time Event Stream", description = "Server-Sent Events (SSE) live event streaming")
public class RealtimeEventController {

    private final RealtimeEventPublisherService realtimeEventPublisherService;

    public RealtimeEventController(RealtimeEventPublisherService realtimeEventPublisherService) {
        this.realtimeEventPublisherService = realtimeEventPublisherService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to tenant live event stream via SSE")
    public SseEmitter subscribeToStream() {
        return realtimeEventPublisherService.subscribe();
    }

    @PostMapping("/broadcast-test")
    @Operation(summary = "Publish a test event to all active tenant SSE listeners")
    public ResponseEntity<Map<String, String>> broadcastTestEvent(@RequestParam(defaultValue = "system.alert") String eventType,
                                                                 @RequestParam(defaultValue = "Test real-time message") String message) {
        String tenantId = TenantContext.getTenantId();
        realtimeEventPublisherService.publishEvent(tenantId, eventType, Map.of("message", message, "triggeredBy", "manual_test"));
        return ResponseEntity.ok(Map.of("message", "Real-time event published", "tenantId", tenantId, "eventType", eventType));
    }
}
