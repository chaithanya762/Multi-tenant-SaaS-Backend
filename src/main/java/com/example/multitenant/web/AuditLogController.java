package com.example.multitenant.web;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.AuditLog;
import com.example.multitenant.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/audit-log")
@Tag(name = "Audit Log", description = "Immutable audit trail of all actions within the tenant")
public class AuditLogController {

    private final AuditService auditService;

    public AuditLogController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @Operation(summary = "Get paginated audit log for the current tenant")
    public ResponseEntity<Page<AuditLog>> getAuditLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(auditService.getAuditLogs(TenantContext.getTenantId(), pageable));
    }
}
