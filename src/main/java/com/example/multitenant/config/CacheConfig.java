package com.example.multitenant.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Distributed Cache Configuration with resilient in-memory fallback.
 * Uses RedisCacheManager when a live Redis instance is available (production / Docker Compose),
 * and automatically falls back to ConcurrentMapCacheManager during local development or unit testing.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

    public static final String TENANT_CACHE = "tenantCache";
    public static final String PRODUCTS_CACHE = "productsCache";
    public static final String PLAN_CACHE = "planCache";

    @Bean
    @Primary
    public CacheManager cacheManager(ObjectProvider<RedisConnectionFactory> connectionFactoryProvider) {
        RedisConnectionFactory connectionFactory = connectionFactoryProvider.getIfAvailable();
        if (connectionFactory != null) {
            try {
                // Test connection readiness
                connectionFactory.getConnection().close();
                log.info("Redis connection verified. Initializing distributed RedisCacheManager with 10m TTL.");

                RedisCacheConfiguration cacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(10))
                        .disableCachingNullValues()
                        .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                        .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

                return RedisCacheManager.builder(connectionFactory)
                        .cacheDefaults(cacheConfig)
                        .build();
            } catch (Exception e) {
                log.warn("Redis unavailable ({}). Falling back to in-memory ConcurrentMapCacheManager.", e.getMessage());
            }
        } else {
            log.info("No RedisConnectionFactory configured. Initializing in-memory ConcurrentMapCacheManager.");
        }

        return new ConcurrentMapCacheManager(TENANT_CACHE, PRODUCTS_CACHE, PLAN_CACHE);
    }
}
