-- Add template tracking columns to bots table
ALTER TABLE bots ADD COLUMN IF NOT EXISTS template_name VARCHAR(500);
ALTER TABLE bots ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT FALSE;

-- Add rich metadata columns to account_templates table
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS source_bot_name VARCHAR(500);
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS source_bot_description TEXT;
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS broadcasts_data_json TEXT;
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS tags_data_json TEXT;
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS custom_fields_data_json TEXT;

-- Make source_bot_id nullable in account_templates so templates are self-contained
ALTER TABLE account_templates ALTER COLUMN source_bot_id DROP NOT NULL;
