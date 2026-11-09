import { ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The auth pages' right half: the two sides of Tempah meeting. A customer's booking page
 * (phone) sits in front of the owner's schedule (card); the phone books 1:00 PM and that
 * slot on the schedule fills, once. All sample data, labelled as such; on register the phone shows the
 * shop name and link being typed.
 */
export function ProductPreview({
  shopName,
  slug,
}: {
  shopName: string;
  slug: string;
}) {
  return (
    <div className="flex w-full flex-col justify-center gap-7 px-12 py-10 xl:px-16 xl:py-16">
      <h2 className="max-w-[600px] text-[17px] font-semibold tracking-[-0.01em] text-balance">
        Customers book online, and it lands on your schedule.
      </h2>

      <div className="relative h-[440px] w-full max-w-[600px] xl:h-[500px]">
        {/* the caption follows the card on the left, beside the phone */}
        <div className="absolute top-0 left-0 flex w-[80%] flex-col gap-4">
          <ScheduleCard />
          <p className="max-w-[60%] text-[13px] text-muted-foreground">
            Sample shop and bookings. Blue bookings came in online; grey ones
            the owner added.
          </p>
        </div>
        <PhoneCard shopName={shopName} slug={slug} />
      </div>
    </div>
  );
}

/** The owner's side: today's status, the now line and a few hours of the timeline */
function ScheduleCard() {
  const hour = 46; // px per hour in the mini timeline, 10:00 to 14:00
  const at = (time: number) => (time - 10) * hour;
  const block = (start: number, minutes: number) => ({
    top: at(start) + 1,
    height: (minutes / 60) * hour - 2,
  });
  // Hafiz on the left, so the booking the phone makes is never under the phone;
  // Ali's day is all morning, so the phone only covers his empty afternoon
  const columns = [
    [
      { name: "Lim Wei Ming", at: 10.5, min: 45, online: true },
      { name: "Kumar S.", at: 13.5, min: 30, online: true },
    ],
    [
      { name: "Faiz Rahman", at: 10, min: 30, online: false },
      { name: "Daniel Tan", at: 11, min: 45, online: false },
    ],
  ];
  return (
    <div
      aria-hidden
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">Monday 9 November</span>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Sample
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Status name="Hafiz" line="Free until 13:00" />
        <Status name="Ali" line="With Daniel Tan" busy />
      </div>
      <div className="relative grid grid-cols-[2.5rem_1fr_1fr] gap-2 pt-1">
        <div className="relative text-xs text-muted-foreground">
          {[10, 11, 12, 13, 14].map((h) => (
            <span
              key={h}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: at(h) }}
            >
              {h}:00
            </span>
          ))}
        </div>
        {columns.map((col, i) => (
          <div
            key={i}
            className="relative h-[190px] bg-[repeating-linear-gradient(to_bottom,var(--border)_0_1px,transparent_1px_46px)]"
          >
            {col.map((b) => (
              <Block key={b.name} {...block(b.at, b.min)} online={b.online}>
                {b.name}
              </Block>
            ))}
            {i === 0 && <LandingSlot {...block(13, 30)} />}
          </div>
        ))}
        {/* now, 11:15: Ali is mid-booking, Hafiz is free */}
        <div
          className="pointer-events-none absolute right-0.5 left-[3rem] border-t-2 border-destructive"
          style={{ top: 4 + at(11.25) }}
        >
          <span className="absolute -top-[5px] left-0 size-2 rounded-full bg-destructive" />
        </div>
      </div>
    </div>
  );
}

/**
 * The booking the phone makes: an empty dashed slot from the first frame, which fills
 * once just after the phone's Book button is pressed. Reduced motion: already filled.
 */
function LandingSlot({ top, height }: { top: number; height: number }) {
  return (
    <div
      className="absolute inset-x-0.5 rounded-[5px] border border-dashed border-accent-border"
      style={{ top, height }}
    >
      <Block
        top={-1}
        height={height}
        online
        className="-inset-x-px motion-safe:animate-[slot-fill_0.7s_cubic-bezier(0.16,1,0.3,1)_1.1s_both]"
      >
        Aisyah · Haircut
      </Block>
    </div>
  );
}

function Status({
  name,
  line,
  busy = false,
}: {
  name: string;
  line: string;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border px-3 py-2">
      <span className="flex items-center gap-2 text-[13px] font-semibold">
        <span
          className={cn(
            "size-1.5 rounded-full",
            busy
              ? "bg-primary"
              : "bg-card ring-[1.5px] ring-primary ring-inset",
          )}
        />
        {name}
      </span>
      <span className="truncate text-xs text-muted-foreground">{line}</span>
    </div>
  );
}

function Block({
  top,
  height,
  online,
  className,
  children,
}: {
  top: number;
  height: number;
  online: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        // above the now line, so a booking in progress isn't struck through
        "absolute inset-x-0.5 z-10 flex items-center truncate rounded-[5px] px-2 text-xs font-semibold",
        online
          ? "bg-accent text-accent-foreground shadow-[inset_0_0_0_1px_var(--accent-border)]"
          : "bg-muted shadow-[inset_0_0_0_1px_var(--input)]",
        className,
      )}
      style={{ top, height }}
    >
      {children}
    </div>
  );
}

/** The customer's side: the shop's booking page on a phone, 12-hour like the real one */
function PhoneCard({ shopName, slug }: { shopName: string; slug: string }) {
  const name = shopName.trim() || "Your shop";
  return (
    <div
      aria-hidden
      className={cn(
        // in front of the schedule: a deeper, blue-tinted lift than any panel
        "absolute right-0 bottom-0 flex w-[248px] origin-bottom-right scale-[0.85] flex-col overflow-hidden rounded-[20px] border-[5px] border-card bg-card shadow-[0_2px_4px_rgba(0,0,0,0.05),0_20px_48px_rgba(13,58,158,0.18)] xl:scale-100",
      )}
    >
      <div className="truncate bg-muted px-3 py-1.5 text-center text-xs text-muted-foreground">
        {location.host}/book/{slug || "your-shop"}
      </div>
      <div className="flex items-center gap-2.5 border-b px-3 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-semibold text-accent-foreground ring-1 ring-accent-border ring-inset">
          {initials(name)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{name}</span>
          <span className="text-xs text-muted-foreground">
            Book an appointment
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-2.5 bg-background px-3 py-3">
        <div className="flex items-center justify-between rounded-md bg-accent px-2.5 py-2 shadow-[inset_0_0_0_1.5px_var(--primary)]">
          <span className="flex flex-col">
            <span className="text-xs font-semibold">Haircut</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="size-3" />
              30 min
            </span>
          </span>
          <span className="text-xs font-semibold">RM 25</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            "11:30 AM",
            "12:00 PM",
            "1:00 PM",
            "1:30 PM",
            "2:30 PM",
            "3:00 PM",
          ].map((t) => (
            <span
              key={t}
              className={cn(
                "flex h-7 items-center justify-center rounded-md text-xs font-medium",
                t === "1:00 PM"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card shadow-[inset_0_0_0_1px_var(--border)]",
              )}
            >
              {t}
            </span>
          ))}
        </div>
        {/* pressed once, just before the slot on the schedule fills */}
        <span className="flex h-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground motion-safe:animate-[book-press_0.4s_ease-out_0.6s_1]">
          Book 1:00 PM
        </span>
      </div>
    </div>
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
