import { useQueries } from "@tanstack/react-query";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  PlusIcon,
} from "lucide-react";
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {relativeDay(date, today)}
          </p>
          <h1 className="text-xl font-semibold">{describeDate(date).long}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous day"
            onClick={() => goTo(addDays(date, -1))}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            disabled={date === today}
            onClick={() => goTo(today)}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next day"
            onClick={() => goTo(addDays(date, 1))}
          >
            <ChevronRightIcon />
          </Button>
          <CopyLinkButton slug={tenant.slug} />
          <Button disabled={!setupDone} onClick={startNewBooking}>
            <PlusIcon />
            New booking
          </Button>
        </div>
      </div>

      {!setupDone && (
        <SetupChecklist
          serviceCount={services.data?.length}
          staffCount={staff.data?.length}
        />
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Bookings" value={summary.count} />
        <Stat
          label="Booked time"
          value={formatDuration(summary.bookedMinutes)}
        />
        <Stat
          label="Booked online"
          value={`${summary.online} of ${summary.count}`}
        />
        <Stat label="Cancelled" value={summary.cancelled} />
      </div>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-bold">Schedule</h2>
        {bookings.isError || staff.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {(bookings.error ?? staff.error)?.message}
            </AlertDescription>
          </Alert>
        ) : bookings.isPending || staff.isPending ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : staff.data.length === 0 && bookings.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Add your staff to see their day here.
          </p>
        ) : (
          <>
            {summary.count === 0 && (
              <p className="mb-3 text-sm text-muted-foreground">
                No bookings on this day yet.
              </p>
            )}
            <DayTimeline
              timezone={timezone}
              now={
                date === today
                  ? minutesIntoDay(now.toISOString(), timezone)
                  : undefined
              }
              timeline={buildTimeline({
                weekday: weekdayOf(date),
                timezone,
                staff: staff.data,
                hours,
                bookings: bookings.data,
              })}
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

/** "Today", "Tomorrow", "Yesterday", or the weekday */
function relativeDay(date: string, today: string) {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  if (date === addDays(today, -1)) return "Yesterday";
  return describeDate(date).weekday;
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

function CopyLinkButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      // the clipboard API only works on https or localhost, not http://192.168.x.x
      await navigator.clipboard.writeText(`${location.origin}/book/${slug}`);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <Button variant="outline" aria-label="Copy booking link" onClick={copy}>
      {state === "copied" ? <CheckIcon /> : <LinkIcon />}
      {/* just the icon on a phone, so the row fits */}
      <span className="hidden sm:inline">
        {state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Couldn't copy"
            : "Booking link"}
      </span>
    </Button>
  );
}
