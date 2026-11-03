import { CircleAlertIcon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { dateOf, describeDate, describeGap, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { BottomBar, bigButton } from "./BottomBar";
import type { Slot } from "./useAvailability";

type Props = {
  wanted: string; // the start that someone else just booked
  slots: Slot[] | undefined; // fresh availability for the same service and day
  timeZone: string;
  serviceName: string;
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
      <main className="flex flex-col gap-5 p-5">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[14px] border border-[#fecdca] bg-[#fef3f2] p-4"
        >
          <CircleAlertIcon className="mt-px size-[22px] shrink-0 text-[#b42318]" />
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-bold text-[#912018]">
              {formatTime(wanted, timeZone)} was just booked
            </p>
            <p className="text-sm leading-snug text-muted-foreground">
              Someone grabbed it a moment before you. Your name and phone are
              saved, so just pick another time.
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-2.5">
          <h2 id="nearest-heading" className="text-[15px] font-semibold">
            Nearest open times · {day}
          </h2>
          {slots === undefined ? (
            <Spinner className="mx-auto my-4 size-5 text-muted-foreground" />
          ) : options.length === 0 ? (
            <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              Nothing else is free on {day}.
            </p>
          ) : (
            <div
              role="radiogroup"
              aria-labelledby="nearest-heading"
              className="flex flex-col gap-2.5"
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
                      "flex min-h-14 items-center justify-between rounded-lg border bg-card px-4 py-2.5 transition-colors",
                      selected
                        ? "border-2 border-primary bg-accent px-[15px] py-[9px]"
                        : "hover:border-primary/40",
                    )}
                  >
                    <span className="text-base font-bold">
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
            className="h-auto self-start p-0 py-2.5 font-semibold"
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
