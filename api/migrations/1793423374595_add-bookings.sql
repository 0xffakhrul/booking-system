-- Up Migration

-- btree_gist is already created in the init migration; it lets one GiST index mix
-- `staff_id WITH =` (plain equality) with `during WITH &&` (range overlap)

CREATE TABLE bookings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants (id),
    ref TEXT NOT NULL, -- shown to customers instead of the id (ADR-0007)
    staff_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    during TSTZRANGE NOT NULL, -- [start, end): the end instant is not part of the booking
    status TEXT NOT NULL DEFAULT 'confirmed',
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (tenant_id, ref),
    -- 8 characters without look-alikes (no 0/O, 1/I/L)
    CHECK (ref ~ '^[A-HJKMNP-Z2-9]{8}$'),
    CHECK (length(btrim(customer_name)) BETWEEN 1 AND 80),
    -- E.164, e.g. +60123456789
    CHECK (customer_phone ~ '^\+[1-9][0-9]{6,14}$'),
    CHECK (status IN ('confirmed', 'cancelled')),
    CHECK (source IN ('online', 'manual')),
    -- a real, finite, half-open range: rejects empty, '(...]' and open-ended ranges
    CHECK (
        NOT isempty(during)
        AND lower_inc(during) AND NOT upper_inc(during)
        AND NOT lower_inf(during) AND NOT upper_inf(during)
    ),

    -- same-tenant foreign keys: a booking can't point at another business's staff or service.
    -- No ON DELETE, so staff and services with bookings can only be soft-deleted.
    FOREIGN KEY (tenant_id, staff_id) REFERENCES staff (tenant_id, id),
    FOREIGN KEY (tenant_id, service_id) REFERENCES services (tenant_id, id),

    CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
        staff_id WITH =,
        during WITH &&
    ) WHERE (status <> 'cancelled')
);

-- owner dashboard: "this business's bookings on this date"
CREATE INDEX bookings_tenant_start_idx ON bookings (tenant_id, lower(during));

-- Down Migration

DROP TABLE bookings;