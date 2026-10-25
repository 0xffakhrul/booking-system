-- Up Migration

CREATE TABLE working_hours (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0 = Sunday, like JS Date.getDay()
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (end_time > start_time),

    -- same-tenant foreign key: hours can only belong to a staff member of the same business
    FOREIGN KEY (tenant_id, staff_id) REFERENCES staff (tenant_id, id) ON DELETE CASCADE,

    -- one staff member can't have overlapping ranges on the same day (10:00-13:00 and 12:00-15:00)
    -- '[)' = start included, end excluded, so 10:00-13:00 and 13:00-15:00 are allowed
    EXCLUDE USING gist (
        staff_id WITH =,
        weekday WITH =,
        tsrange('2000-01-01'::date + start_time, '2000-01-01'::date + end_time, '[)') WITH &&
    )
);

-- Down Migration

DROP TABLE working_hours;
