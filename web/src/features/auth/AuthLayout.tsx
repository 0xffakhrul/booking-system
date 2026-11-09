import type { ReactNode } from "react";

/**
 * Login and register: the form on a white half, the product preview on a pale blue half
 * (from lg up). On a phone the form is the whole page.
 */
export function AuthLayout({
  preview,
  children,
}: {
  preview: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-svh bg-card lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-8">
        <TempahMark />
        {/* top-aligned on a phone, so the fields sit well above the keyboard */}
        <main className="mx-auto flex w-full max-w-[380px] flex-1 flex-col pt-10 pb-10 lg:mx-0 lg:ml-[8%] lg:justify-center lg:pt-10">
          {children}
        </main>
      </div>
      <aside
        aria-label="What Tempah looks like"
        className="hidden border-l border-accent-border bg-accent lg:flex"
      >
        {preview}
      </aside>
    </div>
  );
}

/** The product's own mark: a blue tile with a T, beside the name */
function TempahMark() {
  return (
    <div className="flex items-center gap-2.5 text-base font-semibold">
      <span
        aria-hidden
        className="flex size-7 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground"
      >
        T
      </span>
      Tempah
    </div>
  );
}

/** Heading and one line of help, above the form */
export function AuthHeading({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-2">
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em]">
        {title}
      </h1>
      <p className="text-[15px] text-pretty text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

/** 44px fields on a phone (thumb targets), 40px from lg up: roomier than the app's 36px */
export const authInput = "h-11 bg-card px-3 text-base md:text-[15px] lg:h-10";

/** The full-width blue submit button */
export const authButton =
  "h-11 w-full text-[15px] font-semibold shadow-[0_1px_2px_rgba(13,58,158,0.25)]";
