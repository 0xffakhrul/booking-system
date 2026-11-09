import { useQueries } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useMe } from "@/features/auth/useMe";
import { useServices } from "@/features/services/useServices";
import { useStaff } from "@/features/staff/useStaff";
import { workingHoursQuery } from "@/features/staff/useWorkingHours";
import {
  addDays,
  describeDate,
  isCalendarDate,
  minutesIntoDay,
  minutesToTime,
  todayIn,
  weekdayOf,
} from "@/lib/time";
import { BookingDialog } from "./BookingDialog";
import { DayTimeline } from "./DayTimeline";
import { NewBookingDialog, type NewBookingPrefill } from "./NewBookingDialog";
import { SetupChecklist } from "./SetupChecklist";
import { StatusStrip } from "./StatusStrip";
import { buildTimeline, formatDuration, summarizeDay } from "./timeline";
import { useBookings } from "./useBookings";

/** The owner's home: one day of bookings, one column per staff member */
export function DashboardPage() {
  const { data: account } = useMe();
  const tenant = account!.tenant; // RequireAuth only renders this page when logged in
  const timezone = tenant.timezone;

  // the day lives in the URL (?date=2026-11-06), so a refresh or the Back button keeps it
  const [params, setParams] = useSearchParams();
  const now = useNow();
  const today = todayIn(timezone, now);
  const asked = params.get("date");
  const date = asked && isCalendarDate(asked) ? asked : today;
  const goTo = (d: string) => setParams(d === today ? {} : { date: d });

  const services = useServices();
  const staff = useStaff();
  const bookings = useBookings(date);
  // every staff member's week, fetched side by side and cached for the hours editor too
  const hours = useQueries({
    queries: (staff.data ?? []).map((s) => workingHoursQuery(s.id)),
    combine: (results) =>
      Object.fromEntries(
        (staff.data ?? []).map((s, i) => [s.id, results[i]?.data]),
      ),
  });

  // the open booking is looked up by id, so it shows fresh data after a refetch
  const [openId, setOpenId] = useState<string | null>(null);
  const openBooking = bookings.data?.find((b) => b.id === openId) ?? null;

  const [newBooking, setNewBooking] = useState<NewBookingPrefill | null>(null);

  const setupDone = !!services.data?.length && !!staff.data?.length;
  // The button starts at the next quarter hour today, or at 10:00 on other days
  const startNewBooking = () => {
    const next =
      Math.ceil(minutesIntoDay(now.toISOString(), timezone) / 15) * 15;
    setNewBooking({
      date,
      time: date === today && next < 24 * 60 ? minutesToTime(next) : "10:00",
    });
  };
  const summary = summarizeDay(bookings.data ?? []);
  const isToday = date === today;
  const nowMinutes = minutesIntoDay(now.toISOString(), timezone);
  const timeline =
    staff.data && bookings.data
      ? buildTimeline({
          weekday: weekdayOf(date),
          timezone,
          staff: staff.data,
          hours,
          bookings: bookings.data,
        })
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <h1 className="w-full text-2xl leading-tight font-semibold tracking-[-0.02em] sm:w-auto">
          {describeDate(date).long}
          {relativeDay(date, today) && (
            <span className="ml-2 text-base font-normal tracking-normal text-muted-foreground">
              {relativeDay(date, today)}
            </span>
          )}
        </h1>
        <div className="flex items-center gap-1.5 md:mb-0.5">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            aria-label="Previous day"
            onClick={() => goTo(addDays(date, -1))}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            className="h-9 px-3"
            disabled={isToday}
            onClick={() => goTo(today)}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            aria-label="Next day"
            onClick={() => goTo(addDays(date, 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        {bookings.data && (
          <p className="order-last w-full text-[13px] text-muted-foreground lg:order-none lg:mb-2 lg:w-auto">
            {summary.count === 0 ? (
              "No bookings"
            ) : (
              <>
                <Total value={summary.count} label="bookings" />
                {" · "}
                <Total
                  value={formatDuration(summary.bookedMinutes)}
                  label="booked"
                />
                {" · "}
                <Total value={summary.online} label="online" />
              </>
            )}
            {summary.cancelled > 0 && (
              <>
                {" · "}
                <Total value={summary.cancelled} label="cancelled" />
              </>
            )}
          </p>
        )}
        <Button
          className="h-9 px-3.5 font-semibold shadow-[0_1px_2px_rgba(13,58,158,0.25)] ml-auto md:mb-0.5"
          disabled={!setupDone}
          onClick={startNewBooking}
        >
          <PlusIcon />
          New booking
        </Button>
      </div>

      {!setupDone && (
        <SetupChecklist
          serviceCount={services.data?.length}
          staffCount={staff.data?.length}
        />
      )}

      {isToday && timeline && timeline.columns.length > 0 && (
        <StatusStrip timeline={timeline} now={nowMinutes} />
      )}

      <section
        aria-label="Schedule"
        className="rounded-xl border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] md:px-5"
      >
        {bookings.isError || staff.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {(bookings.error ?? staff.error)?.message}
            </AlertDescription>
          </Alert>
        ) : !timeline ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : timeline.columns.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Add your staff to see their day here.
          </p>
        ) : (
          <>
            {summary.count === 0 && (
              <p className="mb-3 text-sm text-muted-foreground">
                Pick an empty slot to add one.
              </p>
            )}
            <DayTimeline
              timezone={timezone}
              now={isToday ? nowMinutes : undefined}
              timeline={timeline}
              onSelect={(b) => setOpenId(b.id)}
              onPickSlot={(staffId, minutes) =>
                setNewBooking({ date, time: minutesToTime(minutes), staffId })
              }
            />
          </>
        )}
      </section>

      <NewBookingDialog
        prefill={newBooking}
        onClose={() => setNewBooking(null)}
        timezone={timezone}
        services={services.data ?? []}
        staff={staff.data ?? []}
        onCreated={(createdOn) => {
          setNewBooking(null);
          if (createdOn !== date) goTo(createdOn); // show the day it went on
        }}
      />

      <BookingDialog
        booking={openBooking}
        onClose={() => setOpenId(null)}
        timezone={timezone}
        staff={staff.data ?? []}
        onMoved={(movedTo) => {
          setOpenId(null);
          if (movedTo !== date) goTo(movedTo); // follow it to its new day
        }}
      />
    </div>
  );
}

/** "8 bookings", with the number in the text colour */
function Total({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-semibold text-foreground">{value}</span> {label}
    </span>
  );
}

/** "Tomorrow" or "Yesterday" beside the date; other days need nothing extra */
function relativeDay(date: string, today: string) {
  // today needs no label: the Today button beside it is already pressed
  if (date === addDays(today, 1)) return "Tomorrow";
  if (date === addDays(today, -1)) return "Yesterday";
  return null;
}

/** The current time, updated every minute, for the "now" line and for "today" itself */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
