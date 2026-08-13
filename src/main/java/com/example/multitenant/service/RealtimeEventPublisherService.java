package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class RealtimeEventPublisherService {

    private static final Logger log = LoggerFactory.getLogger(RealtimeEventPublisherService.class);
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    // Map of tenantId -> List of active SseEmitters
    private final Map<String, List<SseEmitter>> tenantEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe() {
        String tenantId = TenantContext.getTenantId();
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        tenantEmitters.computeIfAbsent(tenantId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        log.info("Client subscribed to SSE stream for tenant [{}]", tenantId);

        emitter.onCompletion(() -> removeEmitter(tenantId, emitter));
        emitter.onTimeout(() -> removeEmitter(tenantId, emitter));
        emitter.onError(e -> removeEmitter(tenantId, emitter));

        // Send initial connection ACK
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("message", "Connected to real-time event stream", "tenantId", tenantId, "timestamp", System.currentTimeMillis())));
        } catch (IOException e) {
            removeEmitter(tenantId, emitter);
        }

        return emitter;
    }

    public void publishEvent(String tenantId, String eventType, Object payload) {
        List<SseEmitter> emitters = tenantEmitters.get(tenantId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        log.debug("Publishing SSE event [{}] to {} active clients for tenant [{}]", eventType, emitters.size(), tenantId);

        List<SseEmitter> deadEmitters = new ArrayList<>();
        Map<String, Object> eventData = Map.of(
                "eventType", eventType,
                "tenantId", tenantId,
                "payload", payload,
                "timestamp", System.currentTimeMillis()
        );

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventType).data(eventData));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        emitters.removeAll(deadEmitters);
    }

    private void removeEmitter(String tenantId, SseEmitter emitter) {
        List<SseEmitter> list = tenantEmitters.get(tenantId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                tenantEmitters.remove(tenantId);
            }
        }
    }

    // Ping all active connections every 25 seconds to keep connections alive through proxies/load balancers
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        tenantEmitters.forEach((tenantId, list) -> {
            List<SseEmitter> deadEmitters = new ArrayList<>();
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().name("ping").data("heartbeat"));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            }
            list.removeAll(deadEmitters);
        });
    }
}
