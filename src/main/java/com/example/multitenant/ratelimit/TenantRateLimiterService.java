package com.example.multitenant.ratelimit;

import com.example.multitenant.repository.SubscriptionPlanRepository;
import com.example.multitenant.repository.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class TenantRateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(TenantRateLimiterService.class);
    private static final int DEFAULT_REQUESTS_PER_MINUTE = 60;
    
    private final StringRedisTemplate redisTemplate;
    private final TenantRepository tenantRepository;
    private final SubscriptionPlanRepository planRepository;
    private final Map<String, TenantQuota> tenantQuotas = new ConcurrentHashMap<>();

    public TenantRateLimiterService(StringRedisTemplate redisTemplate,
                                    TenantRepository tenantRepository,
                                    SubscriptionPlanRepository planRepository) {
        this.redisTemplate = redisTemplate;
        this.tenantRepository = tenantRepository;
        this.planRepository = planRepository;
    }

    public RateLimitResult tryConsume(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return new RateLimitResult(true, DEFAULT_REQUESTS_PER_MINUTE, DEFAULT_REQUESTS_PER_MINUTE);
        }

        int maxRequests = getLimitForTenant(tenantId);
        long nowMinute = System.currentTimeMillis() / 60000;
        String key = "rate_limit:" + tenantId + ":" + nowMinute;

        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                redisTemplate.expire(key, 2, TimeUnit.MINUTES);
            }
            int currentCount = count != null ? count.intValue() : 1;
            boolean allowed = currentCount <= maxRequests;
            int remaining = Math.max(0, maxRequests - currentCount);
            return new RateLimitResult(allowed, remaining, maxRequests);
        } catch (Exception e) {
            log.warn("Redis unavailable, falling back to in-memory rate limiting: {}", e.getMessage());
            return fallbackConsume(tenantId, nowMinute, maxRequests);
        }
    }

    private int getLimitForTenant(String tenantId) {
        return tenantRepository.findById(tenantId)
                .map(tenant -> planRepository.findById(tenant.getPlanId())
                        .map(plan -> plan.getRequestsPerMinute())
                        .orElse(DEFAULT_REQUESTS_PER_MINUTE))
                .orElse(DEFAULT_REQUESTS_PER_MINUTE);
    }

    private RateLimitResult fallbackConsume(String tenantId, long nowMinute, int maxRequests) {
        TenantQuota quota = tenantQuotas.compute(tenantId, (id, currentQuota) -> {
            if (currentQuota == null || currentQuota.minuteTimestamp != nowMinute) {
                return new TenantQuota(nowMinute, new AtomicInteger(1));
            } else {
                currentQuota.counter.incrementAndGet();
                return currentQuota;
            }
        });

        int currentCount = quota.counter.get();
        boolean allowed = currentCount <= maxRequests;
        int remaining = Math.max(0, maxRequests - currentCount);

        return new RateLimitResult(allowed, remaining, maxRequests);
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
        private final int limit;

        public RateLimitResult(boolean allowed, int remaining, int limit) {
            this.allowed = allowed;
            this.remaining = remaining;
            this.limit = limit;
        }

        public boolean isAllowed() { return allowed; }
        public int getRemaining() { return remaining; }
        public int getLimit() { return limit; }
    }
}
