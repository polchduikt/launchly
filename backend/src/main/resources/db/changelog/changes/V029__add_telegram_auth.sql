--liquibase formatted sql

--changeset launchly:029
ALTER TABLE users ADD COLUMN telegram_user_id BIGINT UNIQUE;
ALTER TABLE users ADD COLUMN telegram_username VARCHAR(255);

CREATE TABLE telegram_auth_sessions (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    telegram_user_id BIGINT,
    telegram_username VARCHAR(255),
    jwt_access_token TEXT,
    jwt_refresh_token TEXT,
    status VARCHAR(50) NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_telegram_auth_sessions_token ON telegram_auth_sessions(token);
