import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  GlobeIcon,
  WalletIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/money";
import {
  BOOKING_WINDOW_DAYS,
  bookableDates,
  describeDate,
  formatTime,
  formatTimeRange,
} from "@/lib/time";
import { cn } from "@/lib/utils";
import { Note, Page, Panel, ShopHeader, SummaryRows } from "./BookingLayout";
import { BottomBar, bigButton, greyWhenDisabled } from "./BottomBar";
import { ConfirmedScreen } from "./ConfirmedScreen";
import { DateStrip } from "./DateStrip";
import { DetailsForm, type Details } from "./DetailsForm";
import { MonthCalendar } from "./MonthCalendar";
import { ServicePicker } from "./ServicePicker";
import { SlotGrid } from "./SlotGrid";
import { StaffPicker } from "./StaffPicker";
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
      <Page>
        <Spinner className="m-auto size-6 text-muted-foreground" />
      </Page>
    );

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Page>
        <div className="m-auto flex max-w-sm flex-col items-center gap-2 px-6 text-center">
          <h1 className="text-lg font-semibold">
            {notFound
              ? "This booking link doesn't exist"
              : "Something went wrong"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {notFound
              ? "Check the link with the business you're booking."
              : error.message}
          </p>
          {!notFound && (
            <Button
              variant="outline"
              className="mt-2 h-10"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          )}
        </div>
      </Page>
    );
  }

  return <BookingFlow slug={slug} data={data} />;
}

type Outcome =
  { kind: "booked"; booking: Booking } | { kind: "taken"; wanted: string };

// The choose step's grid. Phone: one column in DOM order (shop, service, staff, date, times).
// Tablet: shop and services on the left, the rest stacked on the right.
// Desktop: three panes, the month calendar in the middle.
const chooseGrid = cn(
  "md:grid md:min-h-[580px] md:max-w-[1100px]",
  "md:grid-cols-[300px_minmax(0,1fr)] md:grid-rows-[auto_auto_1fr]",
  "md:[grid-template-areas:'info_date'_'info_staff'_'info_times']",
  "lg:grid-cols-[320px_minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr]",
  "lg:[grid-template-areas:'info_date_staff'_'info_date_times']",
);

/**
 * Choose a time → your details → booked (or "just taken" → pick again → booked).
 * Service, staff, date, time and step live in the URL, so Back on the phone goes back a
 * step and a refresh keeps the choices. Name, phone and the outcome live in memory.
 */
function BookingFlow({ slug, data }: { slug: string; data: PublicBusiness }) {
  const { business, services, staff } = data;
  const tz = business.timezone;
  const [params, setParams] = useSearchParams();
  const dates = bookableDates(tz);

  const serviceParam = params.get("service");
  const service =
    services.find((s) => s.id === serviceParam) ??
    (services.length === 1 ? services[0] : undefined); // only one choice: pick it
  // with one person there's nothing to choose, so it's always "anyone"
  const canPickStaff = staff.length > 1;
  const person = canPickStaff
    ? staff.find((s) => s.id === params.get("staff"))
    : undefined;
  const dateParam = params.get("date");
  const date = dateParam && dates.includes(dateParam) ? dateParam : dates[0]!;
  const nextDate = dates[dates.indexOf(date) + 1] ?? null;
  const start = params.get("start");
  const step = params.get("step") === "details" && start ? "details" : "choose";

  const availability = useAvailability(
    slug,
    service?.id ?? null,
    date,
    person?.id ?? null,
  );
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
        ...(person && { staffId: person.id }),
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

  const header = <ShopHeader name={business.name} />;
  const when = (at: string) =>
    `${describeDate(date).short}, ${formatTime(at, tz)}`;

  if (outcome?.kind === "booked")
    return (
      <Page creditInBar>
        <Panel plain className="md:max-w-[440px] md:gap-6">
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
        </Panel>
      </Page>
    );

  if (outcome?.kind === "taken" && service && details)
    return (
      <Page creditInBar>
        <Panel plain className="md:max-w-[440px] md:gap-6">
          {header}
          <TakenScreen
            key={outcome.wanted}
            wanted={outcome.wanted}
            slots={
              availability.isFetching ? undefined : availability.data?.slots
            }
            timeZone={tz}
            serviceName={service.name}
            customerName={details.customerName}
            onBook={(at) => book(at, details)}
            onSeeAll={() => {
              setOutcome(null);
              update({ start: null, step: null });
            }}
          />
        </Panel>
      </Page>
    );

  if (step === "details" && service && start) {
    const slot = availability.data?.slots.find((s) => s.start === start);
    const end =
      slot?.end ??
      new Date(Date.parse(start) + service.durationMin * 60_000).toISOString();
    return (
      <Page creditInBar>
        <Panel className="md:grid md:max-w-[880px] md:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col gap-[22px] md:gap-6 md:border-r md:p-6">
            {header}
            <div className="flex flex-col gap-3 px-[18px] md:px-0">
              <Button
                variant="ghost"
                className="h-11 self-start px-2 -ml-2 text-sm font-medium text-foreground/80"
                onClick={() => update({ step: null })}
              >
                <ChevronLeftIcon aria-hidden />
                Change time
              </Button>
              <SummaryRows
                className="rounded-xl border bg-card px-4 py-3.5 md:rounded-none md:border-0 md:bg-transparent md:p-0"
                rows={[
                  {
                    label: "Service",
                    value: `${service.name} · ${service.durationMin} min`,
                  },
                  {
                    label: "When",
                    value: `${describeDate(date).short}, ${formatTimeRange(start, end, tz)}`,
                  },
                  { label: "With", value: person?.name ?? "Anyone available" },
                  {
                    label: "Price",
                    value: `${formatPrice(service.price, { short: true })} · pay at the shop`,
                  },
                ]}
              />
            </div>
          </div>
          <DetailsForm
            bookLabel={`Book ${formatTime(start, tz)}`}
            defaultValues={details}
            onBook={(who) => book(start, who)}
          />
        </Panel>
      </Page>
    );
  }

  if (services.length === 0)
    return (
      <Page>
        <Panel className="md:max-w-[440px] md:gap-6 md:p-6">
          {header}
          <div className="px-[18px] pt-[22px] md:p-0">
            <Note>This business isn't taking online bookings yet.</Note>
          </div>
        </Panel>
      </Page>
    );

  const chosen = availability.data?.slots.some((s) => s.start === start)
    ? start
    : null; // a time that's no longer free (or from an old link) isn't a choice
  const goToDetails = () => update({ step: "details" }, true);

  return (
    <Page creditInBar>
      <Panel className={chooseGrid}>
        <div className="flex flex-col gap-[22px] [grid-area:info] md:gap-6 md:border-r md:p-6">
          {header}
          <div className="px-[18px] md:px-0">
            <ServicePicker
              services={services}
              selectedId={service?.id ?? null}
              onSelect={(id) => update({ service: id, start: null })}
            />
          </div>
          <Facts timeZone={tz} />
        </div>

        {canPickStaff && (
          <div className="px-[18px] pt-[22px] [grid-area:staff] md:px-6 md:pt-5 lg:pt-6">
            <StaffPicker
              staff={staff}
              selectedId={person?.id ?? null}
              onSelect={(id) => update({ staff: id, start: null })}
            />
          </div>
        )}

        <div className="px-[18px] pt-[22px] [grid-area:date] md:px-6 md:pt-6 lg:border-r lg:pb-6">
          <DateStrip
            className="lg:hidden"
            dates={dates}
            selected={date}
            onSelect={(d) => update({ date: d, start: null })}
          />
          <MonthCalendar
            className="hidden lg:flex"
            dates={dates}
            selected={date}
            onSelect={(d) => update({ date: d, start: null })}
          />
        </div>

        <div
          className={cn(
            "flex flex-col px-[18px] pt-[22px] pb-6 [grid-area:times] md:min-h-0 md:px-6 md:pt-5",
            !canPickStaff && "lg:pt-6",
          )}
        >
          {service ? (
            <SlotGrid
              slots={availability.data?.slots}
              isPending={availability.isPending}
              error={availability.error}
              onRetry={() => availability.refetch()}
              date={date}
              nextDate={nextDate}
              onSelectDate={(d) => update({ date: d, start: null })}
              timeZone={tz}
              selected={chosen}
              onSelect={(at) => update({ start: at })}
              onContinue={goToDetails}
            />
          ) : (
            <Note>Choose a service to see the free times.</Note>
          )}
        </div>

        <BottomBar
          className="md:hidden"
          summary={
            chosen && service
              ? `${service.name} · ${when(chosen)}`
              : "Pick a time to continue"
          }
          aside={
            chosen && service
              ? formatPrice(service.price, { short: true })
              : undefined
          }
        >
          <Button
            className={cn(bigButton, greyWhenDisabled)}
            disabled={!chosen}
            onClick={goToDetails}
          >
            Continue
          </Button>
        </BottomBar>
      </Panel>
    </Page>
  );
}

/** The small print beside the services, from tablet up */
function Facts({ timeZone }: { timeZone: string }) {
  const city = timeZone.split("/").pop()!.replace(/_/g, " "); // "Kuala Lumpur"
  return (
    <ul className="hidden flex-col gap-2 text-sm text-foreground/80 md:flex [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
      <li className="flex items-center gap-2">
        <CalendarDaysIcon aria-hidden />
        Book up to {BOOKING_WINDOW_DAYS} days ahead
      </li>
      <li className="flex items-center gap-2">
        <GlobeIcon aria-hidden />
        Times shown in {city} time
      </li>
      <li className="flex items-center gap-2">
        <WalletIcon aria-hidden />
        Pay at the shop
      </li>
    </ul>
  );
}
