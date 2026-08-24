-- Add missing moderation and data columns to bots table
ALTER TABLE bots ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS block_reason VARCHAR(1000);
ALTER TABLE bots ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS custom_fields_data JSONB;

-- Add missing moderation columns to broadcast_campaigns table
ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS block_reason VARCHAR(1000);
ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP;

-- Add missing metadata columns to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add missing counters to account_templates table
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS installs_count INT DEFAULT 0;
