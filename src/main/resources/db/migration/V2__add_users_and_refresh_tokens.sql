-- ============================================================
-- V2: Users, Roles & Refresh Tokens
-- ============================================================

-- Subscription Plans (no RLS — global reference table)
CREATE TABLE subscription_plans (
    id                      VARCHAR(64) PRIMARY KEY,
    name                    VARCHAR(64) NOT NULL UNIQUE,
    max_products            INT NOT NULL DEFAULT 10,
    max_orders_per_month    INT NOT NULL DEFAULT 100,
    max_users               INT NOT NULL DEFAULT 2,
    requests_per_minute     INT NOT NULL DEFAULT 60,
    features                TEXT NOT NULL DEFAULT '',
    monthly_price_usd       NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, max_products, max_orders_per_month, max_users, requests_per_minute, features, monthly_price_usd)
VALUES
    ('plan-free',         'FREE',         10,   100,  2,   30,  'rls_tester',                                                           0.00),
    ('plan-starter',      'STARTER',      100,  1000, 5,   60,  'rls_tester,csv_export,api_keys',                                       29.00),
    ('plan-professional', 'PROFESSIONAL', 1000, 10000,20,  200, 'rls_tester,csv_export,api_keys,webhooks,audit_log',                    99.00),
    ('plan-enterprise',   'ENTERPRISE',   -1,   -1,   -1,  500, 'rls_tester,csv_export,api_keys,webhooks,audit_log,full_text_search',   299.00);

-- Add plan and suspension to tenants
ALTER TABLE tenants ADD COLUMN plan_id VARCHAR(64) REFERENCES subscription_plans(id) DEFAULT 'plan-free';
ALTER TABLE tenants ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN suspension_reason TEXT;
ALTER TABLE tenants ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Default all existing tenants to free plan
UPDATE tenants SET plan_id = 'plan-free' WHERE plan_id IS NULL;

-- Users table
CREATE TABLE users (
    id              VARCHAR(64) PRIMARY KEY,
    tenant_id       VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    username        VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(64) NOT NULL DEFAULT 'ROLE_TENANT_USER',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, username),
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

CREATE POLICY user_tenant_isolation_policy ON users
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) = 'sys_admin'
    )
    WITH CHECK (
        tenant_id = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) = 'sys_admin'
    );

-- Refresh Tokens table (no RLS — server-side only)
CREATE TABLE refresh_tokens (
    id              BIGSERIAL PRIMARY KEY,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    user_id         VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id       VARCHAR(64) NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Soft-delete columns for products and orders
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders   ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies to hide soft-deleted rows
DROP POLICY IF EXISTS product_tenant_isolation_policy ON products;
CREATE POLICY product_tenant_isolation_policy ON products
    FOR ALL
    USING (
        deleted_at IS NULL
        AND (
            tenant_id = current_setting('app.current_tenant_id', true)
            OR current_setting('app.current_tenant_id', true) = 'sys_admin'
        )
    )
    WITH CHECK (
        tenant_id = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) = 'sys_admin'
    );

DROP POLICY IF EXISTS order_tenant_isolation_policy ON orders;
CREATE POLICY order_tenant_isolation_policy ON orders
    FOR ALL
    USING (
        deleted_at IS NULL
        AND (
            tenant_id = current_setting('app.current_tenant_id', true)
            OR current_setting('app.current_tenant_id', true) = 'sys_admin'
        )
    )
    WITH CHECK (
        tenant_id = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) = 'sys_admin'
    );
