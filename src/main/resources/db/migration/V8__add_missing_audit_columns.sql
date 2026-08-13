-- ============================================================
-- V8: Add missing audit/soft-delete columns for entity validation
-- ============================================================

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE webhook_endpoints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
