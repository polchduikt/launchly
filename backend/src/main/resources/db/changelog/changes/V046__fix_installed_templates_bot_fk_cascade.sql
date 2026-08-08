--liquibase formatted sql
--changeset launchly:046-fix-installed-templates-bot-fk-cascade

ALTER TABLE installed_templates DROP CONSTRAINT IF EXISTS fkfbrhu9qbkuw2ssm7of9t051n;
ALTER TABLE installed_templates DROP CONSTRAINT IF EXISTS fk_installed_templates_bot;

ALTER TABLE installed_templates
    ADD CONSTRAINT fk_installed_templates_bot
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE;
