-- Up Migration

-- Row-Level Security on services, the first table to get it (ADR-0003). Once this runs, the API's
-- role only sees and writes services whose tenant_id matches app.tenant_id, which the API sets
-- per request with set_config(..., true). The other tables follow in the next migration.
--
-- current_setting without missing_ok: no tenant set means an error, not every tenant's rows.

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON services
    USING (tenant_id = current_setting('app.tenant_id')::bigint)
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::bigint);

-- Down Migration

DROP POLICY tenant_isolation ON services;

ALTER TABLE services DISABLE ROW LEVEL SECURITY;
