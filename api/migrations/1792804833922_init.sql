-- Up Migration

-- citext: case-insensitive text (emails, slugs)
-- btree_gist: lets the bookings exclusion constraint combine "=" with range overlap
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE tenants (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    slug CITEXT NOT NULL UNIQUE CHECK(slug::text ~ '^[a-z0-9-]{3,40}$'),
    timezone TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email CITEXT UNIQUE NOT NULL,
    username CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    id_hash BYTEA PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

-- Down Migration

DROP TABLE sessions;
DROP TABLE users;
DROP TABLE tenants;
DROP EXTENSION IF EXISTS btree_gist;
DROP EXTENSION IF EXISTS citext;