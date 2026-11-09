import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Popover } from "radix-ui";
import { useRef, useState } from "react";
import { describeDate, weekdayOf } from "@/lib/time";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: string; // "YYYY-MM-DD", or "" when nothing is picked
  onChange: (date: string) => void;
  onBlur?: () => void;
  today: string; // "YYYY-MM-DD" in the business's timezone, marked with a dot
  invalid?: boolean;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * A date field that always reads day/month/year ("10/11/2026"). The browser's own
 * <input type="date"> follows the computer's locale, so a US setting shows 11/10/2026.
 */
export function DatePicker({
  id,
  value,
  onChange,
  onBlur,
  today,
  invalid,
}: Props) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState((value || today).slice(0, 7)); // "2026-11"
  const selectedRef = useRef<HTMLButtonElement>(null);

  const [year, month] = shown.split("-").map(Number) as [number, number];
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = (weekdayOf(`${shown}-01`) + 6) % 7; // Monday = 0
  const step = (by: number) => {
    const d = new Date(Date.UTC(year, month - 1 + by, 1));
    setShown(d.toISOString().slice(0, 7));
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next)
          setShown((value || today).slice(0, 7)); // open on the picked month
        else onBlur?.();
      }}
    >
      <Popover.Trigger
        id={id}
        aria-invalid={invalid}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value ? dayMonthYear(value) : "dd/mm/yyyy"}
        </span>
        <CalendarIcon aria-hidden className="size-4 text-muted-foreground" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          // start keyboard users on the picked day, not on the month arrows
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            selectedRef.current?.focus();
          }}
          className="z-50 w-72 rounded-xl border bg-popover p-3 text-popover-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)]"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">
              {describeDate(`${shown}-01`).month}
            </span>
            <div className="flex gap-1">
              <MonthButton label="Previous month" onClick={() => step(-1)}>
                <ChevronLeftIcon />
              </MonthButton>
              <MonthButton label="Next month" onClick={() => step(1)}>
                <ChevronRightIcon />
              </MonthButton>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                aria-hidden
                className="pb-1 text-center text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase"
              >
                {day}
              </span>
            ))}
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <span key={`blank-${i}`} aria-hidden />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = `${shown}-${String(i + 1).padStart(2, "0")}`;
              const selected = date === value;
              return (
                <button
                  key={date}
                  ref={selected ? selectedRef : undefined}
                  type="button"
                  aria-label={describeDate(date).long}
                  aria-pressed={selected}
                  aria-current={date === today ? "date" : undefined}
                  onClick={() => {
                    onChange(date);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative flex h-9 items-center justify-center rounded-lg text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    date === today &&
                      "after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-current",
                    selected
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** "2026-11-10" → "10/11/2026" */
function dayMonthYear(date: string) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function MonthButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-lg shadow-[inset_0_0_0_1px_var(--border)] transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}
