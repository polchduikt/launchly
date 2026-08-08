CREATE TABLE IF NOT EXISTS account_templates (
    id BIGSERIAL PRIMARY KEY,
    share_code VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    is_protected BOOLEAN NOT NULL DEFAULT FALSE,
    guide_url VARCHAR(1000),
    video_url VARCHAR(1000),
    creator_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    schema_json TEXT NOT NULL,
    selected_flow_ids_json TEXT,
    selected_tag_ids_json TEXT,
    selected_field_ids_json TEXT,
    flow_count INT DEFAULT 0,
    tag_count INT DEFAULT 0,
    field_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS is_protected BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS guide_url VARCHAR(1000);
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS video_url VARCHAR(1000);
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS selected_flow_ids_json TEXT;
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS selected_tag_ids_json TEXT;
ALTER TABLE account_templates ADD COLUMN IF NOT EXISTS selected_field_ids_json TEXT;

