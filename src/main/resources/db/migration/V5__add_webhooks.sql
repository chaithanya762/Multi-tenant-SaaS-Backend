-- ============================================================
-- V5: Outbound Webhook System
-- ============================================================

CREATE TABLE webhook_endpoints (
    id              VARCHAR(64) PRIMARY KEY,
    tenant_id       VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    secret          VARCHAR(255) NOT NULL,
    events          TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_endpoints_tenant_id ON webhook_endpoints(tenant_id);

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints FORCE ROW LEVEL SECURITY;

CREATE POLICY webhook_endpoint_tenant_policy ON webhook_endpoints
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) = 'sys_admin'
    )
    WITH CHECK (
        tenant_id = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) = 'sys_admin'
    );

CREATE TABLE webhook_deliveries (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       VARCHAR(64) NOT NULL,
    endpoint_id     VARCHAR(64) NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event_type      VARCHAR(128) NOT NULL,
    payload         JSONB NOT NULL,
    response_status INT,
    response_body   TEXT,
    delivered_at    TIMESTAMP WITH TIME ZONE,
    attempts        INT NOT NULL DEFAULT 0,
    next_retry_at   TIMESTAMP WITH TIME ZONE,
    status          VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_tenant_id    ON webhook_deliveries(tenant_id);
CREATE INDEX idx_webhook_deliveries_endpoint_id  ON webhook_deliveries(endpoint_id);
CREATE INDEX idx_webhook_deliveries_status       ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry   ON webhook_deliveries(next_retry_at) WHERE status = 'PENDING';
