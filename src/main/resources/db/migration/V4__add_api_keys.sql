-- ============================================================
-- V4: API Keys (Machine-to-Machine Auth)
-- ============================================================

CREATE TABLE api_keys (
    id              VARCHAR(64) PRIMARY KEY,
    tenant_id       VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by      VARCHAR(64) REFERENCES users(id),
    name            VARCHAR(255) NOT NULL,
    key_prefix      VARCHAR(16) NOT NULL,
    key_hash        VARCHAR(255) NOT NULL UNIQUE,
    scopes          TEXT NOT NULL DEFAULT 'read',
    last_used_at    TIMESTAMP WITH TIME ZONE,
    expires_at      TIMESTAMP WITH TIME ZONE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_tenant_id  ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_key_hash   ON api_keys(key_hash);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;

CREATE POLICY api_key_tenant_isolation_policy ON api_keys
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) = 'sys_admin'
    )
    WITH CHECK (
        tenant_id = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) = 'sys_admin'
    );
