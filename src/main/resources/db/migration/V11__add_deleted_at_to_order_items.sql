-- Add deleted_at column to order_items for soft delete support
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
