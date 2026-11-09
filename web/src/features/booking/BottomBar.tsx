import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The white bar pinned to the bottom of a phone screen: a one-line summary over the main
 * button, and the Tempah credit under it. Pass md classes to unpin it inside the card on
 * bigger screens (the credit then moves below the card, see Page).
 */
export function BottomBar({
  summary,
  aside,
  className,
  children,
}: {
  summary?: ReactNode;
  aside?: ReactNode; // right-hand end of the summary line, e.g. the price
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 mt-auto flex flex-col gap-2.5 border-t bg-card px-[18px] pt-3 pb-[max(14px,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {summary !== undefined && (
        <p className="flex min-h-5 justify-between gap-3 text-[13px]">
          <span className="truncate">{summary}</span>
          {aside && (
            <span className="shrink-0 text-muted-foreground">{aside}</span>
          )}
        </p>
      )}
      {children}
      <p className="text-center text-xs text-muted-foreground md:hidden">
        Bookings by{" "}
        <span className="font-semibold text-foreground">Tempah</span>
      </p>
    </div>
  );
}

/** The main button: full width, 48px tall so it's an easy thumb target */
// border-0: shadcn's transparent border would inset the fill by 1px on every side;
// transition-transform: only the press nudge animates, so a ready button is never caught mid-fade
export const bigButton =
  "h-12 w-full rounded-lg border-0 text-[15px] font-semibold shadow-[0_1px_2px_rgba(13,58,158,0.25)] transition-transform";

/** A Continue that can't be pressed yet goes grey, not pale blue */
export const greyWhenDisabled =
  "disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none";

/** Unpins the bar inside the card from md up */
export const barInCard =
  "md:static md:mt-0 md:border-0 md:bg-transparent md:px-6 md:pt-0 md:pb-6";
