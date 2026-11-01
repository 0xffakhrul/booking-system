import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PublicService } from "./usePublicBusiness";

type Props = {
  services: PublicService[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ServicePicker({ services, selectedId, onSelect }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <h2 id="service-heading" className="text-[15px] font-semibold">
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
                "flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-2.5 text-left transition-colors",
                selected
                  ? "border-2 border-primary bg-accent px-[13px] py-[9px]" // 1px more border, 1px less padding: no jump
                  : "hover:border-primary/40",
              )}
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">
                  {service.name}
                </span>
                <span className="text-[13px] text-muted-foreground">
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
