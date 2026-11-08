-- Row-Level Security by hand (roadmap Day 32)
--
-- A self-contained lab: its own schema, two shops, five services and two throwaway roles.
-- Nothing here touches the real tables, and step 9 removes everything again.
--
-- Best typed one step at a time in psql, so you see each result:
--   docker compose exec postgres psql -U app -d booking
-- Or run it all at once (errors are part of the lesson, so psql carries on past them):
--   docker compose exec -T postgres psql -U app -d booking < docs/learning/rls-by-hand.sql
--
-- See ADR-0003 for how the API will use this from Phase 5 on.

-- 1. Two shops' services in one shared table ----------------------------------------------

CREATE SCHEMA rls_lab;
SET search_path = rls_lab;

CREATE TABLE services (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id BIGINT NOT NULL,          -- 1 = Kedai Ali, 2 = Salon Mei
  name      TEXT   NOT NULL
);
INSERT INTO services (tenant_id, name) VALUES
  (1, 'Haircut'), (1, 'Beard trim'),
  (2, 'Hair colour'), (2, 'Blow dry'), (2, 'Manicure');

SELECT * FROM services;                                  -- all 5 rows, both shops

-- 2. Turn RLS on... and nothing changes -----------------------------------------------------

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
SELECT count(*) FROM services;                           -- still 5. Why?
SELECT current_user, rolsuper FROM pg_roles WHERE rolname = current_user;
-- `app` is a superuser (the Docker image makes POSTGRES_USER one), and superusers skip RLS.
-- This is the trap ADR-0003 warns about: the API connects as `app` today.

-- 3. An ordinary role, like the API's future `tempah_app` -----------------------------------

CREATE ROLE lab_app NOLOGIN;                             -- not a superuser, not the owner
GRANT USAGE ON SCHEMA rls_lab TO lab_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON services TO lab_app;

SET ROLE lab_app;                                        -- "become" it, like sudo -u
SELECT count(*) FROM services;                           -- 0: RLS on + no policy = deny everything
RESET ROLE;                                              -- back to app

-- 4. The policy: a row is visible when its tenant_id matches app.tenant_id ------------------

CREATE POLICY tenant_isolation ON services
  USING      (tenant_id = current_setting('app.tenant_id')::bigint)  -- which rows you can see/change
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::bigint); -- which rows you may write

SET ROLE lab_app;
SELECT * FROM services;                                  -- ERROR: unrecognized configuration parameter
-- Nobody said which tenant, so it fails instead of showing everything ("fails closed").

-- 5. Done when: rows appear and disappear as the setting changes ----------------------------

SET app.tenant_id = '1';
SELECT * FROM services;                                  -- Haircut, Beard trim
SET app.tenant_id = '2';
SELECT * FROM services;                                  -- Hair colour, Blow dry, Manicure

EXPLAIN SELECT * FROM services;
-- Filter: (tenant_id = (current_setting('app.tenant_id'))::bigint)
-- RLS is just a WHERE clause that Postgres adds to every query for you.

-- 6. Try to cheat, as Salon Mei (tenant 2) --------------------------------------------------

SELECT * FROM services WHERE tenant_id = 1;              -- 0 rows: your WHERE is ANDed with the policy
UPDATE services SET name = 'Free!' WHERE tenant_id = 1;  -- UPDATE 0: can't change what you can't see
DELETE FROM services WHERE tenant_id = 1;                -- DELETE 0
INSERT INTO services (tenant_id, name) VALUES (1, 'Sneaky');
-- ERROR: new row violates row-level security policy (that's the WITH CHECK)
UPDATE services SET tenant_id = 1 WHERE name = 'Manicure';
-- ERROR again: you can't hand a row over to another shop either

-- 7. Why the API will use set_config(..., true) inside a transaction ------------------------

RESET app.tenant_id;
SELECT * FROM services;                                  -- ERROR: invalid input syntax for type bigint: ""
-- Once a setting has been used in a session, "unset" means '' rather than missing.
-- '' can't become a bigint, so this fails closed too.

BEGIN;
SELECT set_config('app.tenant_id', '1', true);           -- true = only until this transaction ends
SELECT count(*) FROM services;                           -- 2
COMMIT;
SELECT count(*) FROM services;                           -- ERROR again: the setting didn't outlive the transaction
-- A pooled connection is reused by the next request. If the setting stayed behind, the next
-- request could run as the previous shop. Transaction-local means it can't.

RESET ROLE;

-- 8. The table owner skips RLS too, until you FORCE it --------------------------------------

CREATE ROLE lab_owner NOLOGIN;
GRANT USAGE ON SCHEMA rls_lab TO lab_owner;
ALTER TABLE services OWNER TO lab_owner;

SET ROLE lab_owner;
SELECT count(*) FROM services;                           -- 5, with no app.tenant_id at all
RESET ROLE;

ALTER TABLE services FORCE ROW LEVEL SECURITY;
SET ROLE lab_owner;
SELECT count(*) FROM services;                           -- ERROR: now the owner is held to the policy too
RESET ROLE;
-- Superusers still skip it even with FORCE. Hence ADR-0003's plan: migrations run as an owner role,
-- and the API runs as a separate plain role (Day 33).

-- 9. Clean up --------------------------------------------------------------------------------

RESET search_path;
RESET app.tenant_id;
DROP SCHEMA rls_lab CASCADE;
DROP ROLE lab_app;
DROP ROLE lab_owner;
