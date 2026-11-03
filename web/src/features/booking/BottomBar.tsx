import type { ReactNode } from "react";

/** The white bar pinned to the bottom of the screen: a one-line summary over the main button */
export function BottomBar({
  summary,
  children,
}: {
  summary: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 mt-auto flex flex-col gap-2.5 border-t bg-card px-5 pt-3.5 pb-[max(22px,env(safe-area-inset-bottom))]">
      <p className="min-h-5 truncate text-sm text-muted-foreground">
        {summary}
      </p>
      {children}
    </div>
  );
}

/** The mockup's big button: 52px tall, rounded 14px */
export const bigButton = "h-[52px] w-full rounded-[14px] text-base font-bold";
