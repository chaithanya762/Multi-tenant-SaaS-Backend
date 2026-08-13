package com.example.multitenant.repository;

import com.example.multitenant.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByTenantIdOrderByOccurredAtDesc(String tenantId, Pageable pageable);
    Page<AuditLog> findByTenantIdAndResourceTypeOrderByOccurredAtDesc(String tenantId, String resourceType, Pageable pageable);
    Page<AuditLog> findByTenantIdAndUserIdOrderByOccurredAtDesc(String tenantId, String userId, Pageable pageable);
}
