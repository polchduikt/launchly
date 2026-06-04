--liquibase formatted sql

--changeset launchly:006
ALTER TABLE bots ADD COLUMN order_sequence BIGINT NOT NULL DEFAULT 1000;
