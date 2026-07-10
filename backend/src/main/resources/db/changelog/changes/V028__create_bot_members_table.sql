--liquibase formatted sql

--changeset launchly:028
CREATE TABLE bot_members (
    id BIGSERIAL PRIMARY KEY,
    bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    inbox_seat BOOLEAN NOT NULL DEFAULT FALSE,
    billing_permission BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bot_member UNIQUE (bot_id, user_id)
);

CREATE TABLE bot_invitations (
    id BIGSERIAL PRIMARY KEY,
    bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    inbox_seat BOOLEAN NOT NULL DEFAULT FALSE,
    billing_permission BOOLEAN NOT NULL DEFAULT FALSE,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bot_invitation UNIQUE (bot_id, email)
);

CREATE INDEX idx_bot_members_bot_id ON bot_members(bot_id);
CREATE INDEX idx_bot_members_user_id ON bot_members(user_id);
CREATE INDEX idx_bot_invitations_bot_id ON bot_invitations(bot_id);
CREATE INDEX idx_bot_invitations_email ON bot_invitations(email);
