import { useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { bookableDates } from "@/lib/time";
import { DateStrip } from "./DateStrip";
import { ServicePicker } from "./ServicePicker";
import { usePublicBusiness, type PublicBusiness } from "./usePublicBusiness";

/** The customer's page at /book/:slug. No login. */
export function BookingPage() {
  const { slug = "" } = useParams();
  const { data, error, isPending, refetch } = usePublicBusiness(slug);

  if (isPending)
    return (
      <Shell>
        <Spinner className="m-auto size-6 text-muted-foreground" />
      </Shell>
    );

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Shell>
        <div className="m-auto flex flex-col items-center gap-3 px-6 text-center">
          <p className="text-[17px] font-bold">
            {notFound
              ? "This booking link doesn't exist"
              : "Something went wrong"}
          </p>
          <p className="text-sm text-muted-foreground">
            {notFound
              ? "Check the link with the business you're booking."
              : error.message}
          </p>
          {!notFound && (
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          )}
        </div>
      </Shell>
    );
  }

  return <BookingSteps data={data} />;
}

function BookingSteps({ data }: { data: PublicBusiness }) {
  const { business, services } = data;
  // Choices live in the URL (?service=2&date=2026-11-03): a refresh keeps them,
  // and the shop can share a link straight to one service
  const [params, setParams] = useSearchParams();
  const dates = bookableDates(business.timezone);

  const serviceParam = params.get("service");
  const serviceId =
    services.find((s) => s.id === serviceParam)?.id ??
    (services.length === 1 ? services[0]!.id : null); // only one choice: pick it
  const dateParam = params.get("date");
  const date = dateParam && dates.includes(dateParam) ? dateParam : dates[0]!;

  const choose = (key: "service" | "date", value: string) =>
    setParams(
      (current) => {
        current.set(key, value);
        return current;
      },
      { replace: true }, // choosing isn't navigating: Back should leave the page
    );

  return (
    <Shell>
      <header className="flex items-center gap-3 border-b bg-card px-5 pt-5 pb-4">
        <div
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground"
        >
          {initials(business.name)}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-[17px] font-bold">{business.name}</h1>
          <p className="text-[13px] text-muted-foreground">
            Book an appointment
          </p>
        </div>
      </header>

      <main className="flex flex-col gap-[18px] px-5 pt-4 pb-6">
        <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          Choose a time
        </p>
        {services.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            This business isn't taking online bookings yet.
          </p>
        ) : (
          <>
            <ServicePicker
              services={services}
              selectedId={serviceId}
              onSelect={(id) => choose("service", id)}
            />
            <DateStrip
              dates={dates}
              selected={date}
              onSelect={(d) => choose("date", d)}
            />
          </>
        )}
      </main>
    </Shell>
  );
}

/** Phone-width column; on a bigger screen it stays phone-shaped in the middle */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh justify-center bg-background">
      <div className="flex w-full max-w-md flex-col bg-background sm:border-x">
        {children}
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
