-- Add branding and custom configuration fields to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url VARCHAR(512);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_color VARCHAR(32) DEFAULT '#06b6d4';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS support_email VARCHAR(255);
