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
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/audit-log")
@Tag(name = "Audit Log", description = "Immutable audit trail of all actions within the tenant")
public class AuditLogController {

    private final AuditService auditService;
    private final com.example.multitenant.service.ExportService exportService;

    public AuditLogController(AuditService auditService, com.example.multitenant.service.ExportService exportService) {
        this.auditService = auditService;
        this.exportService = exportService;
    }

    @GetMapping(value = "/export", produces = "text/csv")
    @Operation(summary = "Export tenant audit log as CSV")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<byte[]> exportAuditLogsCsv() {
        byte[] csvData = exportService.exportAuditLogsCsv();
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=audit-logs.csv")
                .header("Content-Type", "text/csv")
                .body(csvData);
    }

    @GetMapping
    @Operation(summary = "Get paginated audit log for the current tenant")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<Page<AuditLog>> getAuditLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(auditService.getAuditLogs(TenantContext.getTenantId(), pageable));
    }
}
