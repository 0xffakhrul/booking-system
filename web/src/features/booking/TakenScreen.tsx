import { CircleAlertIcon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { dateOf, describeDate, describeGap, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { focusRing, Note } from "./BookingLayout";
import { BottomBar, barInCard, bigButton } from "./BottomBar";
import type { Slot } from "./useAvailability";

type Props = {
  wanted: string; // the start that someone else just booked
  slots: Slot[] | undefined; // fresh availability for the same service and day
  timeZone: string;
  serviceName: string;
  customerName: string;
  onBook: (start: string) => Promise<void>;
  onSeeAll: () => void;
};

/** Up to 3 open times on the same day: later ones first, then the closest earlier ones */
function nearest(slots: Slot[], wanted: string) {
  const later = slots.filter((s) => s.start > wanted);
  const earlier = slots.filter((s) => s.start < wanted).reverse();
  return [...later, ...earlier].slice(0, 3);
}

/** The PRD's "slot just taken" screen (C4): name and phone are kept, just pick again */
export function TakenScreen({
  wanted,
  slots,
  timeZone,
  serviceName,
  customerName,
  onBook,
  onSeeAll,
}: Props) {
  const options = slots ? nearest(slots, wanted) : [];
  const [picked, setPicked] = useState<string | null>(null);
  const choice = picked ?? options[0]?.start ?? null;
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const day = describeDate(dateOf(wanted, timeZone)).short;

  const book = async () => {
    if (!choice) return;
    setBooking(true);
    setError(null);
    try {
      await onBook(choice); // another 409 brings this screen back for the new time
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBooking(false);
    }
  };

  return (
    <>
      <main className="flex flex-col gap-6 px-[18px] pt-[22px] pb-6 md:px-0 md:pt-0">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive-border bg-destructive-tint p-4"
        >
          <CircleAlertIcon
            aria-hidden
            className="mt-px size-5 shrink-0 text-destructive"
          />
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-semibold text-destructive">
              {formatTime(wanted, timeZone)} was just booked
            </p>
            <p className="text-sm leading-snug text-foreground/80">
              Someone got it a moment before you. Your name and phone are saved,
              so just pick another time.
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <h2 id="nearest-heading" className="text-sm font-semibold">
            Nearest free times · {day}
          </h2>
          {slots === undefined ? (
            <Spinner className="mx-auto my-4 size-5 text-muted-foreground" />
          ) : options.length === 0 ? (
            <Note>Nothing else is free on {day}.</Note>
          ) : (
            <div
              role="radiogroup"
              aria-labelledby="nearest-heading"
              className="flex flex-col gap-2"
            >
              {options.map((slot) => {
                const selected = slot.start === choice;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPicked(slot.start)}
                    className={cn(
                      "flex min-h-14 items-center justify-between rounded-lg bg-card px-4 transition-[background-color,box-shadow] duration-150",
                      focusRing,
                      selected
                        ? "bg-accent shadow-[inset_0_0_0_2px_var(--primary)]"
                        : "shadow-[inset_0_0_0_1px_var(--border)] hover:shadow-[inset_0_0_0_1px_var(--input)]",
                    )}
                  >
                    <span className="text-base font-semibold">
                      {formatTime(slot.start, timeZone)}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {describeGap(wanted, slot.start)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <Button
            variant="link"
            className="h-11 self-start px-0 text-sm font-medium underline decoration-accent-border underline-offset-4 hover:decoration-primary"
            onClick={onSeeAll}
          >
            See all times and dates
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </section>
      </main>

      {choice && (
        <BottomBar
          summary={`${serviceName} · ${day}, ${formatTime(choice, timeZone)}`}
          aside={customerName}
          className={cn(barInCard, "md:px-0")}
        >
          <Button className={bigButton} disabled={booking} onClick={book}>
            {booking && <Spinner />}
            Book {formatTime(choice, timeZone)}
          </Button>
        </BottomBar>
      )}
    </>
  );
}
