-- V15: Add retry tracking, exponential backoff, and DLQ fields to webhook_deliveries

ALTER TABLE webhook_deliveries 
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry 
ON webhook_deliveries(status, next_retry_at);
