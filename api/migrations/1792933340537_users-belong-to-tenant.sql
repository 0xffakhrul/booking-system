-- Up Migration

ALTER TABLE users
    ADD COLUMN tenant_id BIGINT NOT NULL REFERENCES tenants(id),
    ADD COLUMN role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner')),
    DROP COLUMN username;

CREATE INDEX users_tenant_id_idx ON users (tenant_id);

-- Down Migration

ALTER TABLE users
    ADD COLUMN username CITEXT UNIQUE,
    DROP COLUMN role,
    DROP COLUMN tenant_id;