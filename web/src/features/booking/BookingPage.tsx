import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { bookableDates, describeDate, formatTime } from "@/lib/time";
import { BottomBar, bigButton } from "./BottomBar";
import { BusinessHeader } from "./BusinessHeader";
import { ConfirmedScreen } from "./ConfirmedScreen";
import { DateStrip } from "./DateStrip";
import { DetailsForm, type Details } from "./DetailsForm";
import { ServicePicker } from "./ServicePicker";
import { SlotGrid } from "./SlotGrid";
import { TakenScreen } from "./TakenScreen";
import { useAvailability } from "./useAvailability";
import { useCreateBooking, type Booking } from "./useCreateBooking";
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

  return <BookingFlow slug={slug} data={data} />;
}

type Outcome =
  { kind: "booked"; booking: Booking } | { kind: "taken"; wanted: string };

/**
 * Choose a time → your details → booked (or "just taken" → pick again → booked).
 * Service, date, time and step live in the URL, so Back on the phone goes back a step
 * and a refresh keeps the choices. Name, phone and the outcome live in memory.
 */
function BookingFlow({ slug, data }: { slug: string; data: PublicBusiness }) {
  const { business, services } = data;
  const tz = business.timezone;
  const [params, setParams] = useSearchParams();
  const dates = bookableDates(tz);

  const serviceParam = params.get("service");
  const service =
    services.find((s) => s.id === serviceParam) ??
    (services.length === 1 ? services[0] : undefined); // only one choice: pick it
  const dateParam = params.get("date");
  const date = dateParam && dates.includes(dateParam) ? dateParam : dates[0]!;
  const start = params.get("start");
  const step = params.get("step") === "details" && start ? "details" : "choose";

  const availability = useAvailability(slug, service?.id ?? null, date);
  const create = useCreateBooking(slug);
  const [details, setDetails] = useState<Details>();
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  // Each new screen starts at the top, like a new page would. The braces matter: newer
  // browsers make scrollTo return a Promise, and React would try to call it as a cleanup.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step, outcome]);

  /** change URL choices; `push` makes a history entry, so the phone's Back button undoes it */
  const update = (changes: Record<string, string | null>, push = false) =>
    setParams(
      (current) => {
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) current.delete(key);
          else current.set(key, value);
        }
        return current;
      },
      { replace: !push },
    );

  /** Books with the details given; a 409 switches to the "just taken" screen */
  async function book(at: string, who: Details) {
    setDetails(who);
    try {
      const booking = await create.mutateAsync({
        serviceId: service!.id,
        start: at,
        ...who,
      });
      setOutcome({ kind: "booked", booking });
      update({ start: null, step: null });
    } catch (err) {
      if (err instanceof ApiError && err.code === "SLOT_TAKEN") {
        setOutcome({ kind: "taken", wanted: at });
        return;
      }
      throw err; // the form shows anything else
    }
  }

  const header = <BusinessHeader name={business.name} />;
  const summary = (at: string) =>
    `${service?.name} · ${describeDate(date).short}, ${formatTime(at, tz)}`;

  if (outcome?.kind === "booked")
    return (
      <Shell>
        {header}
        <ConfirmedScreen
          booking={outcome.booking}
          businessName={business.name}
          timeZone={tz}
          price={
            services.find((s) => s.id === outcome.booking.service.id)?.price
          }
          onBookAnother={() => setOutcome(null)}
        />
      </Shell>
    );

  if (outcome?.kind === "taken" && service && details)
    return (
      <Shell>
        {header}
        <TakenScreen
          key={outcome.wanted}
          wanted={outcome.wanted}
          slots={availability.isFetching ? undefined : availability.data?.slots}
          timeZone={tz}
          serviceName={service.name}
          onBook={(at) => book(at, details)}
          onSeeAll={() => {
            setOutcome(null);
            update({ start: null, step: null });
          }}
        />
      </Shell>
    );

  if (step === "details" && service && start)
    return (
      <Shell>
        {header}
        <DetailsForm
          summary={summary(start)}
          bookLabel={`Book ${formatTime(start, tz)}`}
          defaultValues={details}
          onChange={() => update({ step: null })}
          onBook={(who) => book(start, who)}
        />
      </Shell>
    );

  const chosen = availability.data?.slots.some((s) => s.start === start)
    ? start
    : null; // a time that's no longer free (or from an old link) isn't a choice

  return (
    <Shell>
      {header}
      <main className="flex flex-col gap-[18px] px-5 pt-4 pb-6">
        <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          Step 1 of 2 · Choose a time
        </p>
        {services.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            This business isn't taking online bookings yet.
          </p>
        ) : (
          <>
            <ServicePicker
              services={services}
              selectedId={service?.id ?? null}
              onSelect={(id) => update({ service: id, start: null })}
            />
            <DateStrip
              dates={dates}
              selected={date}
              onSelect={(d) => update({ date: d, start: null })}
            />
            {service ? (
              <SlotGrid
                slots={availability.data?.slots}
                isPending={availability.isPending}
                error={availability.error}
                date={date}
                timeZone={tz}
                selected={chosen}
                onSelect={(at) => update({ start: at })}
              />
            ) : (
              <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                Choose a service to see the times.
              </p>
            )}
          </>
        )}
      </main>

      {services.length > 0 && (
        <BottomBar
          summary={chosen ? summary(chosen) : "Pick a time to continue"}
        >
          <Button
            className={bigButton}
            disabled={!chosen}
            onClick={() => update({ step: "details" }, true)}
          >
            Continue
          </Button>
        </BottomBar>
      )}
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
