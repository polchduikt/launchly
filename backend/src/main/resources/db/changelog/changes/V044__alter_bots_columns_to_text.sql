--liquibase formatted sql

--changeset launchly:044
ALTER TABLE bots ALTER COLUMN avatar TYPE TEXT;
ALTER TABLE bots ALTER COLUMN description TYPE TEXT;
ALTER TABLE bots ALTER COLUMN name TYPE VARCHAR(500);
