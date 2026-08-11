-- ============================================================
-- V6: Usage Metering & Billing
-- ============================================================

CREATE TABLE usage_events (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   VARCHAR(64) NOT NULL,
    metric      VARCHAR(128) NOT NULL,
    quantity    NUMERIC NOT NULL DEFAULT 1,
    metadata    JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_events_tenant_id    ON usage_events(tenant_id);
CREATE INDEX idx_usage_events_metric       ON usage_events(metric);
CREATE INDEX idx_usage_events_recorded_at  ON usage_events(recorded_at DESC);

CREATE TABLE billing_summaries (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       VARCHAR(64) NOT NULL,
    period_start    TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end      TIMESTAMP WITH TIME ZONE NOT NULL,
    api_calls       BIGINT NOT NULL DEFAULT 0,
    orders_created  BIGINT NOT NULL DEFAULT 0,
    products_count  BIGINT NOT NULL DEFAULT 0,
    total_amount_usd NUMERIC(12,2),
    status          VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, period_start)
);

CREATE INDEX idx_billing_summaries_tenant_id ON billing_summaries(tenant_id);
CREATE INDEX idx_billing_summaries_period    ON billing_summaries(period_start DESC);
