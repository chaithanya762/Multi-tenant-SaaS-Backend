package com.example.multitenant.ratelimit;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class TenantRateLimiterService {

    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private final Map<String, TenantQuota> tenantQuotas = new ConcurrentHashMap<>();

    public RateLimitResult tryConsume(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return new RateLimitResult(true, MAX_REQUESTS_PER_MINUTE);
        }

        long nowMinute = System.currentTimeMillis() / 60000;
        TenantQuota quota = tenantQuotas.compute(tenantId, (id, currentQuota) -> {
            if (currentQuota == null || currentQuota.minuteTimestamp != nowMinute) {
                return new TenantQuota(nowMinute, new AtomicInteger(1));
            } else {
                currentQuota.counter.incrementAndGet();
                return currentQuota;
            }
        });

        int currentCount = quota.counter.get();
        boolean allowed = currentCount <= MAX_REQUESTS_PER_MINUTE;
        int remaining = Math.max(0, MAX_REQUESTS_PER_MINUTE - currentCount);

        return new RateLimitResult(allowed, remaining);
    }

    private static class TenantQuota {
        final long minuteTimestamp;
        final AtomicInteger counter;

        TenantQuota(long minuteTimestamp, AtomicInteger counter) {
            this.minuteTimestamp = minuteTimestamp;
            this.counter = counter;
        }
    }

    public static class RateLimitResult {
        private final boolean allowed;
        private final int remaining;

        public RateLimitResult(boolean allowed, int remaining) {
            this.allowed = allowed;
            this.remaining = remaining;
        }

        public boolean isAllowed() {
            return allowed;
        }

        public int getRemaining() {
            return remaining;
        }
    }
}
