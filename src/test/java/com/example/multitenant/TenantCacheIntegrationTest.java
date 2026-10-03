package com.example.multitenant;

import com.example.multitenant.domain.Tenant;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.service.TenantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import static org.assertj.core.api.Assertions.assertThat;

class TenantCacheIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TenantService tenantService;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private CacheManager cacheManager;

    @BeforeEach
    void setUp() {
        tenantRepository.deleteAll();
        Cache cache = cacheManager.getCache("tenantCache");
        if (cache != null) {
            cache.clear();
        }
    }

    @Test
    @DisplayName("Verify tenant is cached on read and evicted on status update")
    void testTenantCachingAndEviction() {
        String tenantId = "tenant-cache-test";
        Tenant tenant = new Tenant(tenantId, "Cache Test Corp", "ACTIVE");
        tenantRepository.save(tenant);

        Cache cache = cacheManager.getCache("tenantCache");
        assertThat(cache).isNotNull();

        // 1. Initial state: not cached
        assertThat(cache.get(tenantId)).isNull();

        // 2. First read: fetches from DB and populates cache
        Tenant retrieved = tenantService.getTenantById(tenantId);
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getName()).isEqualTo("Cache Test Corp");

        // Verify cache now contains the tenant
        Cache.ValueWrapper cachedValue = cache.get(tenantId);
        assertThat(cachedValue).isNotNull();
        assertThat(((Tenant) cachedValue.get()).getName()).isEqualTo("Cache Test Corp");

        // 3. Update tenant (e.g. suspend): should evict cache
        tenantService.suspendTenant(tenantId, "Payment overdue");

        // Verify cache was evicted
        assertThat(cache.get(tenantId)).isNull();

        // 4. Next read: fetches updated record and caches new status
        Tenant updated = tenantService.getTenantById(tenantId);
        assertThat(updated.getStatus()).isEqualTo("SUSPENDED");
        assertThat(cache.get(tenantId)).isNotNull();
    }
}
