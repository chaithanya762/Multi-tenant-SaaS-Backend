package com.example.multitenant.repository;

import com.example.multitenant.domain.UsageEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface UsageEventRepository extends JpaRepository<UsageEvent, Long> {

    @Query("SELECT COALESCE(SUM(u.quantity), 0) FROM UsageEvent u WHERE u.tenantId = :tenantId AND u.metric = :metric AND u.recordedAt >= :from AND u.recordedAt <= :to")
    long sumByTenantAndMetricBetween(
        @Param("tenantId") String tenantId,
        @Param("metric") String metric,
        @Param("from") Instant from,
        @Param("to") Instant to
    );
}
