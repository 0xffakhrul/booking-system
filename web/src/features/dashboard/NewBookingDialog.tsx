import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { DatePicker } from "@/components/DatePicker";
import { TimeInput } from "@/components/TimeInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Service } from "@/features/services/useServices";
import type { Staff } from "@/features/staff/useStaff";
import { setServerErrors } from "@/lib/form-errors";
import { isCalendarDate, normalizeTime, todayIn, toInstant } from "@/lib/time";
import { useCreateBooking } from "./useBookings";

/** What the form starts with: the day on screen, and maybe a tapped spot's person and time */
export type NewBookingPrefill = {
  date: string;
  time: string;
  staffId?: string;
};

type Props = {
  /** null when closed */
  prefill: NewBookingPrefill | null;
  onClose: () => void;
  timezone: string;
  /** active services and staff only */
  services: Service[];
  staff: Staff[];
  /** after saving, with the booking's date so the dashboard can show it */
  onCreated: (date: string) => void;
};

/** A walk-in or a phone booking, added by the owner */
export function NewBookingDialog({ prefill, onClose, ...rest }: Props) {
  return (
    <Dialog open={!!prefill} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>
            For walk-ins and phone bookings. It can&apos;t overlap anyone&apos;s
            other bookings, online or not.
          </DialogDescription>
        </DialogHeader>
        {/* rendered inside, so the form starts fresh each time it opens */}
        {prefill && <NewBookingForm prefill={prefill} {...rest} />}
      </DialogContent>
    </Dialog>
  );
}

const schema = z.object({
  serviceId: z.string().min(1, "Pick a service"),
  staffId: z.string().min(1, "Pick who it's with"),
  date: z.string().refine(isCalendarDate, "Pick a date"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a time"),
  customerName: z
    .string()
    .trim()
    .min(1, "Enter their name")
    .max(80, "At most 80 characters"),
  // the API understands "012-345 6789" and friends; it checks the number properly
  customerPhone: z.string().trim().min(1, "Enter their phone number"),
});
type Input = z.infer<typeof schema>;

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

function NewBookingForm({
  prefill,
  timezone,
  services,
  staff,
  onCreated,
}: Omit<Props, "prefill" | "onClose"> & { prefill: NewBookingPrefill }) {
  const create = useCreateBooking();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Input>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceId: services.length === 1 ? services[0]!.id : "",
      staffId: prefill.staffId ?? (staff.length === 1 ? staff[0]!.id : ""),
      date: prefill.date,
      time: prefill.time,
      customerName: "",
      customerPhone: "",
    },
  });
  const staffId = useWatch({ control, name: "staffId" });
  const who = staff.find((s) => s.id === staffId)?.name ?? "They";

  const onSubmit = handleSubmit(async ({ date, time, ...input }) => {
    try {
      await create.mutateAsync({
        ...input,
        start: toInstant(date, time, timezone),
      });
      onCreated(date);
    } catch (err) {
      // the API's wording is written for customers ("nobody is working…"), so say it for owners
      setServerErrors(err, setError, {
        SLOT_TAKEN: {
          field: "time",
          message: `${who} already has a booking then`,
        },
        OUTSIDE_WORKING_HOURS: {
          field: "time",
          message: `${who} isn't working for the whole of that time`,
        },
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.serviceId}>
          <FieldLabel htmlFor="nb-service">Service</FieldLabel>
          <select
            id="nb-service"
            className={selectClass}
            aria-invalid={!!errors.serviceId}
            {...register("serviceId")}
          >
            <option value="" disabled>
              Pick a service
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationMin} min
              </option>
            ))}
          </select>
          <FieldError errors={[errors.serviceId]} />
        </Field>

        <Field data-invalid={!!errors.staffId}>
          <FieldLabel htmlFor="nb-staff">With</FieldLabel>
          <select
            id="nb-staff"
            className={selectClass}
            aria-invalid={!!errors.staffId}
            {...register("staffId")}
          >
            <option value="" disabled>
              Pick someone
            </option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <FieldError errors={[errors.staffId]} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.date}>
            <FieldLabel htmlFor="nb-date">Date</FieldLabel>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePicker
                  id="nb-date"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  today={todayIn(timezone)}
                  invalid={!!errors.date}
                />
              )}
            />
            <FieldError errors={[errors.date]} />
          </Field>
          <Field data-invalid={!!errors.time}>
            <FieldLabel htmlFor="nb-time">Start</FieldLabel>
            <TimeInput
              id="nb-time"
              step={300}
              aria-invalid={!!errors.time}
              {...register("time", { setValueAs: normalizeTime })}
            />
            <FieldError errors={[errors.time]} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.customerName}>
            <FieldLabel htmlFor="nb-name">Customer</FieldLabel>
            <Input
              id="nb-name"
              autoComplete="off"
              placeholder="Name"
              aria-invalid={!!errors.customerName}
              {...register("customerName")}
            />
            <FieldError errors={[errors.customerName]} />
          </Field>
          <Field data-invalid={!!errors.customerPhone}>
            <FieldLabel htmlFor="nb-phone">Phone</FieldLabel>
            <Input
              id="nb-phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="012-345 6789"
              aria-invalid={!!errors.customerPhone}
              {...register("customerPhone")}
            />
            <FieldError errors={[errors.customerPhone]} />
          </Field>
        </div>

        {errors.root?.server && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.server.message}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            Add booking
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}
