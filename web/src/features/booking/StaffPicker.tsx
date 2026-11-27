import { cn } from "@/lib/utils";
import { focusRing } from "./BookingLayout";

type Props = {
  staff: { id: string; name: string }[];
  selectedId: string | null; // null is "Anyone"
  onSelect: (id: string | null) => void;
};

/** "Anyone" or one named person (PRD C5), as a segmented control that wraps when crowded */
export function StaffPicker({ staff, selectedId, onSelect }: Props) {
  const options = [{ id: null, name: "Anyone" }, ...staff];
  return (
    <section className="flex flex-col gap-2">
      <h2 id="staff-heading" className="text-sm font-semibold">
        With
      </h2>
      <div
        role="radiogroup"
        aria-labelledby="staff-heading"
        className="flex flex-wrap gap-0.5 rounded-lg bg-muted p-[3px]"
      >
        {options.map((person) => {
          const selected = person.id === selectedId;
          return (
            <button
              key={person.id ?? "anyone"}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(person.id)}
              className={cn(
                // grows from its own width, so short names share a row and long ones wrap to the next
                "h-11 max-w-full min-w-16 flex-[1_0_auto] truncate rounded-[4px] px-3 text-[13px] transition-[background-color,box-shadow] duration-150",
                focusRing,
                selected
                  ? "bg-card font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]"
                  : "font-medium text-foreground/75 hover:text-foreground",
              )}
            >
              {person.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
