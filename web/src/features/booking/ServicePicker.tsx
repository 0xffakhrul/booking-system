import { ClockIcon } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { focusRing } from "./BookingLayout";
import type { PublicService } from "./usePublicBusiness";

type Props = {
  services: PublicService[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ServicePicker({ services, selectedId, onSelect }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <h2 id="service-heading" className="text-sm font-semibold">
        Service
      </h2>
      <div
        role="radiogroup"
        aria-labelledby="service-heading"
        className="flex flex-col gap-2"
      >
        {services.map((service) => {
          const selected = service.id === selectedId;
          return (
            <button
              key={service.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(service.id)}
              className={cn(
                // the border is an inset shadow, so the 2px selected one doesn't shift the text
                "flex min-h-14 w-full items-center justify-between gap-3 rounded-lg bg-card px-3.5 py-2.5 text-left transition-[background-color,box-shadow] duration-150",
                focusRing,
                selected
                  ? "bg-accent shadow-[inset_0_0_0_2px_var(--primary)]"
                  : "shadow-[inset_0_0_0_1px_var(--border)] hover:shadow-[inset_0_0_0_1px_var(--input)]",
              )}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] leading-snug font-semibold">
                  {service.name}
                </span>
                <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <ClockIcon aria-hidden className="size-3.5" />
                  {service.durationMin} min
                </span>
              </span>
              <span className="text-[15px] font-semibold whitespace-nowrap">
                {formatPrice(service.price, { short: true })}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
