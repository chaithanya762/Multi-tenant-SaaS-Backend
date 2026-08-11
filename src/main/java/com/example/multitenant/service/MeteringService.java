package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.UsageEvent;
import com.example.multitenant.repository.UsageEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class MeteringService {

    private static final Logger log = LoggerFactory.getLogger(MeteringService.class);
    private final UsageEventRepository usageEventRepository;

    public MeteringService(UsageEventRepository usageEventRepository) {
        this.usageEventRepository = usageEventRepository;
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordEvent(String metric, int quantity) {
        try {
            String tenantId = TenantContext.getTenantId();
            if (tenantId == null || tenantId.isBlank()) return;
            UsageEvent event = new UsageEvent(tenantId, metric, BigDecimal.valueOf(quantity), null);
            usageEventRepository.save(event);
        } catch (Exception e) {
            log.warn("Failed to record usage event '{}': {}", metric, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public long getApiCallsThisMonth(String tenantId) {
        Instant start = Instant.now().truncatedTo(ChronoUnit.DAYS).minus(30, ChronoUnit.DAYS);
        return usageEventRepository.sumByTenantAndMetricBetween(tenantId, "api_call", start, Instant.now());
    }

    @Transactional(readOnly = true)
    public long getOrdersThisMonth(String tenantId) {
        Instant start = Instant.now().truncatedTo(ChronoUnit.DAYS).minus(30, ChronoUnit.DAYS);
        return usageEventRepository.sumByTenantAndMetricBetween(tenantId, "order_created", start, Instant.now());
    }
}
