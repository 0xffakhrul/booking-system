-- Up Migration

-- Row-Level Security on the rest of the tenant tables, with the same policy services got
-- (ADR-0003). After this, the API's role can only see and write the current business's staff,
-- working hours and bookings, whatever its queries say.
--
-- Not here, on purpose: tenants, users and sessions are read before the tenant is known
-- (by slug, by email, by session token). See the ADR's table of global tables.
--
-- Constraints still see every row: the exclusion constraint and foreign keys aren't filtered
-- by RLS, which is what you want for "no double-booking" and "same-tenant references".

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON staff
    USING (tenant_id = current_setting('app.tenant_id')::bigint)
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::bigint);

ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON working_hours
    USING (tenant_id = current_setting('app.tenant_id')::bigint)
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::bigint);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON bookings
    USING (tenant_id = current_setting('app.tenant_id')::bigint)
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::bigint);

-- Down Migration

DROP POLICY tenant_isolation ON bookings;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

DROP POLICY tenant_isolation ON working_hours;
ALTER TABLE working_hours DISABLE ROW LEVEL SECURITY;

DROP POLICY tenant_isolation ON staff;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
