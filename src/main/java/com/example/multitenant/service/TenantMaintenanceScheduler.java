package com.example.multitenant.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class TenantMaintenanceScheduler {

    private static final Logger log = LoggerFactory.getLogger(TenantMaintenanceScheduler.class);
    private final JdbcTemplate jdbcTemplate;

    public TenantMaintenanceScheduler(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // Run at 2 AM daily: hard-delete soft-deleted products older than 30 days
    @Scheduled(cron = "0 0 2 * * *")
    @org.springframework.transaction.annotation.Transactional
    public void purgeOldSoftDeletedRecords() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
        int products = jdbcTemplate.update(
            "DELETE FROM products WHERE deleted_at IS NOT NULL AND deleted_at < ?", cutoff);
        int orders = jdbcTemplate.update(
            "DELETE FROM orders WHERE deleted_at IS NOT NULL AND deleted_at < ?", cutoff);
        log.info("Purged {} soft-deleted products and {} soft-deleted orders older than 30 days", products, orders);
    }

    // Run every hour: clean up expired refresh tokens
    @Scheduled(cron = "0 0 * * * *")
    @org.springframework.transaction.annotation.Transactional
    public void purgeExpiredRefreshTokens() {
        int deleted = jdbcTemplate.update(
            "DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE");
        if (deleted > 0) log.info("Purged {} expired/revoked refresh tokens", deleted);
    }
}
