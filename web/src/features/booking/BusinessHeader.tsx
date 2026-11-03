export function BusinessHeader({ name }: { name: string }) {
  return (
    <header className="flex items-center gap-3 border-b bg-card px-5 pt-5 pb-4">
      <div
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground"
      >
        {initials(name)}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="truncate text-[17px] font-bold">{name}</h1>
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
