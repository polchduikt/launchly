-- Add tokens_used to ai_usage table
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS tokens_used BIGINT DEFAULT 0;

-- Create crm_labels table
CREATE TABLE IF NOT EXISTS crm_labels (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_labels_user_id ON crm_labels(user_id);
