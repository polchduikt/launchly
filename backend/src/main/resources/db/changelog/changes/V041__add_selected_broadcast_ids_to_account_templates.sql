ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS selected_broadcast_ids_json TEXT;
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS broadcast_count INT DEFAULT 0;
