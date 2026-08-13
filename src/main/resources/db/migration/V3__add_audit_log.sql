-- ============================================================
-- V3: Immutable Audit Log
-- ============================================================

CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       VARCHAR(64) NOT NULL,
    user_id         VARCHAR(64),
    username        VARCHAR(255),
    action          VARCHAR(64) NOT NULL,
    resource_type   VARCHAR(64) NOT NULL,
    resource_id     VARCHAR(255),
    old_value       JSONB,
    new_value       JSONB,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(512),
    status          VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    error_message   TEXT,
    occurred_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_tenant_id   ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user_id     ON audit_log(user_id);
CREATE INDEX idx_audit_log_resource    ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_occurred_at ON audit_log(occurred_at DESC);
CREATE INDEX idx_audit_log_action      ON audit_log(action);

-- Audit log intentionally does NOT have RLS at the row level
-- sys_admin can query cross-tenant; individual tenants filtered at service layer
