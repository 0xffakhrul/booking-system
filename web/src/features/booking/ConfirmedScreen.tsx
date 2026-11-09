import { CalendarPlusIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import { dateOf, describeDate, formatTimeRange } from "@/lib/time";
import { cn } from "@/lib/utils";
import { SummaryRows } from "./BookingLayout";
import { BottomBar, barInCard, bigButton } from "./BottomBar";
import { calendarHref } from "./calendar";
import type { Booking } from "./useCreateBooking";

type Props = {
  booking: Booking;
  businessName: string;
  timeZone: string;
  price: number | undefined; // sen; the booking itself doesn't carry the price
  onBookAnother: () => void;
};

export function ConfirmedScreen({
  booking,
  businessName,
  timeZone,
  price,
  onBookAnother,
}: Props) {
  const day = describeDate(dateOf(booking.start, timeZone));
  const when = formatTimeRange(booking.start, booking.end, timeZone);

  return (
    <>
      <main className="flex flex-col gap-6 px-[18px] pt-8 pb-6 md:px-0 md:pt-0">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-success-tint">
            <CheckIcon
              aria-hidden
              className="size-7 text-success"
              strokeWidth={2.5}
            />
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            You're booked in
          </h2>
          <p className="max-w-[32ch] text-sm text-muted-foreground">
            See you on {day.long.split(" ")[0]}. Keep your booking ref in case
            you need to call the shop.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-dashed border-input px-4 py-3.5">
            <span className="text-[13px] text-muted-foreground">
              Booking ref
            </span>
            <span className="font-mono text-[15px] font-medium tracking-[0.08em]">
              {booking.ref}
            </span>
          </div>
          <SummaryRows
            className="px-4 py-3.5"
            rows={[
              {
                label: "Service",
                value: `${booking.service.name} · ${booking.service.durationMin} min`,
              },
              { label: "When", value: `${day.short}, ${when}` },
              { label: "With", value: booking.staff.name },
              {
                label: "Price",
                value:
                  price === undefined
                    ? "Pay at the shop"
                    : `${formatPrice(price, { short: true })} · pay at the shop`,
              },
            ]}
          />
        </div>
      </main>

      <BottomBar className={cn(barInCard, "md:px-0")}>
        <Button asChild className={bigButton}>
          <a
            href={calendarHref({
              uid: `${booking.ref}@tempah`,
              title: `${booking.service.name}, ${businessName}`,
              description: `Booking ref ${booking.ref}; with ${booking.staff.name}`,
              start: booking.start,
              end: booking.end,
            })}
            download={`booking-${booking.ref}.ics`}
          >
            <CalendarPlusIcon aria-hidden />
            Add to calendar
          </a>
        </Button>
        <Button
          variant="outline"
          className={cn(
            bigButton,
            "bg-card shadow-[inset_0_0_0_1px_var(--input)]",
          )}
          onClick={onBookAnother}
        >
          Book another
        </Button>
      </BottomBar>
    </>
  );
}
