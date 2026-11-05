import { describe, expect, it } from "vitest";
import type { Booking } from "./useBookings";
import { buildTimeline, formatDuration, summarizeDay } from "./timeline";

const KL = "Asia/Kuala_Lumpur"; // UTC+8, so 10:00 AM local is 02:00Z
const ali = { id: "1", name: "Ali" };
const farid = { id: "2", name: "Farid" };

let nextId = 1;
function booking(
  staff: { id: string; name: string },
  startUtc: string,
  minutes: number,
  extra: Partial<Booking> = {},
): Booking {
  const start = `2026-11-05T${startUtc}:00Z`;
  return {
    id: String(nextId++),
    ref: "ABCD2345",
    service: { id: "7", name: "Haircut", durationMin: minutes },
    staff,
    customerName: "Amir",
    customerPhone: "+60123456789",
    start,
    end: new Date(Date.parse(start) + minutes * 60_000).toISOString(),
    status: "confirmed",
    source: "online",
    ...extra,
  };
}

// Thursday 5 Nov 2026 is weekday 4. Ali has a lunch break, Farid starts late.
const hours = {
  "1": [
    { weekday: 4, start: "10:00", end: "13:00" },
    { weekday: 4, start: "14:00", end: "18:00" },
    { weekday: 5, start: "08:00", end: "20:00" }, // Friday: must be ignored
  ],
  "2": [{ weekday: 4, start: "11:30", end: "17:00" }],
};

describe("buildTimeline", () => {
  it("places bookings by local start time and length", () => {
    const t = buildTimeline({
      weekday: 4,
      timezone: KL,
      staff: [ali, farid],
      hours,
      bookings: [booking(ali, "06:15", 45)], // 2:15 PM local
    });
    expect(t.columns[0]!.bookings).toMatchObject([{ start: 855, end: 900 }]);
    expect(t.columns[1]!.bookings).toEqual([]);
  });

  it("sizes the window to that weekday's hours, rounded to whole hours", () => {
    const t = buildTimeline({
      weekday: 4,
      timezone: KL,
      staff: [ali, farid],
      hours,
      bookings: [],
    });
    expect({ start: t.start, end: t.end }).toEqual({ start: 600, end: 1080 }); // 10 AM – 6 PM
    expect(t.hours).toEqual([600, 660, 720, 780, 840, 900, 960, 1020, 1080]);
  });

  it("stretches the window for a booking outside working hours", () => {
    const t = buildTimeline({
      weekday: 4,
      timezone: KL,
      staff: [ali],
      hours,
      bookings: [booking(ali, "10:30", 30)], // 6:30–7:00 PM local, a late walk-in
    });
    expect(t.end).toBe(19 * 60);
  });

  it("shades breaks and the time around someone's hours", () => {
    const t = buildTimeline({
      weekday: 4,
      timezone: KL,
      staff: [ali, farid],
      hours,
      bookings: [],
    });
    expect(t.columns[0]!.off).toEqual([{ start: 780, end: 840 }]); // Ali's 1–2 PM break
    expect(t.columns[1]!.off).toEqual([
      { start: 600, end: 690 }, // Farid starts at 11:30
      { start: 1020, end: 1080 }, // and leaves at 5
    ]);
  });

  it("shades a whole column for someone who doesn't work that day", () => {
    const t = buildTimeline({
      weekday: 4,
      timezone: KL,
      staff: [ali, { id: "3", name: "Siti" }],
      hours: { ...hours, "3": [] },
      bookings: [],
    });
    expect(t.columns[1]!.off).toEqual([{ start: 600, end: 1080 }]);
  });

  it("doesn't shade anything while hours are still loading", () => {
    const t = buildTimeline({
      weekday: 4,
      timezone: KL,
      staff: [ali],
      hours: {},
      bookings: [],
    });
    expect(t.columns[0]!.off).toEqual([]);
    expect({ start: t.start, end: t.end }).toEqual({ start: 540, end: 1080 }); // default 9–6
  });

  it("leaves cancelled bookings off the grid", () => {
    const t = buildTimeline({
      weekday: 4,
      timezone: KL,
      staff: [ali],
      hours,
      bookings: [
        booking(ali, "02:00", 30, { status: "cancelled" }),
        booking(ali, "02:00", 30), // rebooked into the freed slot
      ],
    });
    expect(t.columns[0]!.bookings).toHaveLength(1);
    expect(t.columns[0]!.bookings[0]!.booking.status).toBe("confirmed");
  });

  it("keeps a column for a removed staff member who still has bookings", () => {
    const zul = { id: "9", name: "Zul" };
    const t = buildTimeline({
      weekday: 4,
      timezone: KL,
      staff: [ali],
      hours,
      bookings: [booking(zul, "03:00", 30)],
    });
    expect(t.columns.map((c) => [c.staff.name, c.removed])).toEqual([
      ["Ali", false],
      ["Zul", true],
    ]);
    expect(t.columns[1]!.off).toEqual([]); // their hours aren't loaded, so no shading
  });
});

describe("summarizeDay", () => {
  it("counts live bookings, booked time and online share", () => {
    expect(
      summarizeDay([
        booking(ali, "02:00", 45),
        booking(ali, "03:00", 30, { source: "manual" }),
        booking(farid, "04:00", 60),
        booking(farid, "05:00", 45, { status: "cancelled" }),
      ]),
    ).toEqual({ count: 3, bookedMinutes: 135, online: 2, cancelled: 1 });
  });
});

describe("formatDuration", () => {
  it("reads like the mockup", () => {
    expect(formatDuration(255)).toBe("4h 15m");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(0)).toBe("0m");
  });
});
