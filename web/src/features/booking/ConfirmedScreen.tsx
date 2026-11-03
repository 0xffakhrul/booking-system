import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import { dateOf, describeDate, formatTimeRange } from "@/lib/time";
import { bigButton } from "./BottomBar";
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
    <div className="flex flex-1 flex-col gap-6 px-5 pt-14 pb-6">
      <div className="flex flex-col items-center gap-3.5 text-center">
        <div className="flex size-[72px] items-center justify-center rounded-full bg-accent">
          <CheckIcon className="size-9 text-primary" strokeWidth={2.5} />
        </div>
        <h2 className="text-[26px] font-bold">You're booked in</h2>
        <p className="max-w-[290px] text-[15px] leading-normal text-muted-foreground">
          Keep your booking ref in case you need to call the shop. See you on{" "}
          {day.long.split(" ")[0]}.
        </p>
      </div>

      <div className="flex flex-col gap-3.5 rounded-2xl border bg-card p-[18px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            Booking ref
          </span>
          <span className="font-mono text-sm font-bold tracking-wider">
            {booking.ref}
          </span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex flex-col gap-1">
          <p className="text-[17px] font-bold">{booking.service.name}</p>
          <p className="text-sm text-muted-foreground">
            {booking.service.durationMin} min
            {price !== undefined &&
              ` · ${formatPrice(price, { short: true })}`}{" "}
            · pay at the shop
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5 rounded-lg bg-background p-3">
            <span className="text-xs text-muted-foreground">When</span>
            <span className="text-[15px] font-semibold">{day.short}</span>
            <span className="text-[15px] font-semibold">{when}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 rounded-lg bg-background p-3">
            <span className="text-xs text-muted-foreground">With</span>
            <span className="truncate text-[15px] font-semibold">
              {booking.staff.name}
            </span>
            <span className="truncate text-[15px] font-semibold">
              {businessName}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
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
            Add to calendar
          </a>
        </Button>
        <Button
          variant="outline"
          className={`${bigButton} bg-card font-semibold`}
          onClick={onBookAnother}
        >
          Book another
        </Button>
      </div>
    </div>
  );
}
