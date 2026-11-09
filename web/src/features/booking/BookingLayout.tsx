import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The booking page has three sizes, all from one tree:
//   phone (< md):  one column, the shop header across the top, a sticky bar at the thumb
//   tablet (md):   one card, the shop and services on the left, everything else on the right
//   desktop (lg):  one card with three panes, like Cal.com: shop, calendar, times

/** Visible keyboard focus for the page's own buttons (shadcn's carry their own) */
export const focusRing =
  "outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

/**
 * The background, plus the small "Bookings by Tempah" credit: the shop's page leads.
 * Screens with a BottomBar carry the credit inside it on a phone, so pass `creditInBar`.
 */
export function Page({
  creditInBar = false,
  children,
}: {
  creditInBar?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background md:items-center md:px-6 md:pt-12 md:pb-6">
      {children}
      <p
        className={cn(
          "px-5 py-5 text-center text-xs text-muted-foreground",
          creditInBar && "hidden md:block",
        )}
      >
        Bookings by{" "}
        <span className="font-semibold text-foreground">Tempah</span>
      </p>
    </div>
  );
}

/**
 * The booker. A plain column on a phone; from md up a bordered card, unless `plain`
 * (the short screens, where the ticket or alert inside is the only card).
 */
export function Panel({
  plain = false,
  className,
  children,
}: {
  plain?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col md:w-full md:flex-none",
        !plain &&
          "md:overflow-hidden md:rounded-xl md:border md:bg-card md:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The shop's name, with its initials standing in for a logo (businesses don't have one) */
export function ShopHeader({ name }: { name: string }) {
  return (
    <header className="flex items-center gap-3 border-b bg-card px-[18px] pt-5 pb-4 md:border-0 md:bg-transparent md:p-0">
      <div
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-[15px] font-semibold text-accent-foreground ring-1 ring-accent-border ring-inset"
      >
        {initials(name)}
      </div>
      <div className="flex min-w-0 flex-col">
        <h1 className="text-[17px] leading-snug font-semibold tracking-[-0.01em] text-balance">
          {name}
        </h1>
        <p className="text-[13px] text-muted-foreground">Book an appointment</p>
      </div>
    </header>
  );
}

/** "Kedai Gunting Ali" → "KG" */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

/** Label and value rows: the booking so far, or the booked ticket */
export function SummaryRows({
  rows,
  className,
}: {
  rows: { label: string; value: ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={cn("flex flex-col gap-2.5 text-sm", className)}>
      {rows.map(({ label, value }) => (
        // the last row (the price) sits under a hairline, like a receipt total
        <div
          key={label}
          className="flex justify-between gap-4 last:border-t last:pt-2.5"
        >
          <dt className="shrink-0 text-muted-foreground">{label}</dt>
          <dd className="text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A note in place of content that isn't there: no services, no times, a failed load */
export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-input p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
