import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { RemoveDialog } from "@/components/RemoveDialog";
import { DatePicker } from "@/components/DatePicker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Staff } from "@/features/staff/useStaff";
import { setServerErrors } from "@/lib/form-errors";
import {
  dateOf,
  describeDate,
  formatTimeRange,
  isCalendarDate,
  timeOfDay,
  todayIn,
  toInstant,
} from "@/lib/time";
import { useCancelBooking, useMoveBooking, type Booking } from "./useBookings";

type Props = {
  /** the booking to show, or null when the dialog is closed */
  booking: Booking | null;
  onClose: () => void;
  timezone: string;
  /** active staff, the people it can be moved to */
  staff: Staff[];
  /** after a move, with the booking's new date so the dashboard can follow it */
  onMoved: (date: string) => void;
};

/** Tap a booking on the timeline: its details, and Move or Cancel */
export function BookingDialog({
  booking,
  onClose,
  timezone,
  staff,
  onMoved,
}: Props) {
  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* keyed, so opening another booking starts fresh on its details */}
        {booking && (
          <BookingPanel
            key={booking.id}
            booking={booking}
            timezone={timezone}
            staff={staff}
            onClose={onClose}
            onMoved={onMoved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BookingPanel({
  booking: b,
  timezone,
  staff,
  onClose,
  onMoved,
}: Omit<Props, "booking"> & { booking: Booking }) {
  const [moving, setMoving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancel = useCancelBooking();

  const date = describeDate(dateOf(b.start, timezone)).long;
  const time = formatTimeRange(b.start, b.end, timezone);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{b.customerName}</DialogTitle>
        <DialogDescription>
          {date} · {time}
        </DialogDescription>
      </DialogHeader>

      {moving ? (
        <MoveForm
          booking={b}
          timezone={timezone}
          staff={staff}
          onBack={() => setMoving(false)}
          onMoved={onMoved}
        />
      ) : (
        <>
          <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Service</dt>
            <dd>
              {b.service.name} ({b.service.durationMin} min)
            </dd>
            <dt className="text-muted-foreground">With</dt>
            <dd>{b.staff.name}</dd>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>
              <a href={`tel:${b.customerPhone}`} className="underline">
                {b.customerPhone}
              </a>
            </dd>
            <dt className="text-muted-foreground">Ref</dt>
            <dd className="font-mono">{b.ref}</dd>
            <dt className="text-muted-foreground">Booked</dt>
            <dd>{b.source === "online" ? "Online" : "By you"}</dd>
          </dl>

          <DialogFooter>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmCancel(true)}
            >
              Cancel booking
            </Button>
            <Button onClick={() => setMoving(true)}>Move</Button>
          </DialogFooter>
        </>
      )}

      <RemoveDialog
        open={confirmCancel}
        onOpenChange={(open) => {
          setConfirmCancel(open);
          if (!open) cancel.reset(); // don't show an old error next time
        }}
        title="Cancel this booking?"
        description={`${b.customerName}'s ${b.service.name} on ${date}, ${time}. The time opens up for other customers. Let them know, since they won't get a message.`}
        confirmLabel="Cancel booking"
        cancelLabel="Keep it"
        pending={cancel.isPending}
        error={cancel.error?.message}
        onConfirm={() =>
          cancel.mutate(b.id, {
            onSuccess: () => {
              setConfirmCancel(false);
              onClose();
            },
          })
        }
      />
    </>
  );
}

const moveSchema = z.object({
  date: z.string().refine(isCalendarDate, "Pick a date"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a time"),
  staffId: z.string().min(1, "Pick who it's with"),
});
type MoveInput = z.infer<typeof moveSchema>;

function MoveForm({
  booking: b,
  timezone,
  staff,
  onBack,
  onMoved,
}: {
  booking: Booking;
  timezone: string;
  staff: Staff[];
  onBack: () => void;
  onMoved: (date: string) => void;
}) {
  const move = useMoveBooking();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MoveInput>({
    resolver: zodResolver(moveSchema),
    defaultValues: {
      date: dateOf(b.start, timezone),
      time: timeOfDay(b.start, timezone),
      // someone who's been removed can't take it, so start on the first active person
      staffId: staff.some((s) => s.id === b.staff.id)
        ? b.staff.id
        : (staff[0]?.id ?? ""),
    },
  });
  const staffId = useWatch({ control, name: "staffId" });
  const who = staff.find((s) => s.id === staffId)?.name ?? "them";

  const onSubmit = handleSubmit(async ({ date, time, staffId }) => {
    try {
      await move.mutateAsync({
        id: b.id,
        start: toInstant(date, time, timezone),
        staffId,
      });
      onMoved(date);
    } catch (err) {
      // SLOT_TAKEN and OUTSIDE_WORKING_HOURS come back with a message naming the person
      setServerErrors(err, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.date}>
            <FieldLabel htmlFor="move-date">Date</FieldLabel>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePicker
                  id="move-date"
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
            <FieldLabel htmlFor="move-time">Start</FieldLabel>
            <Input
              id="move-time"
              type="time"
              step={300}
              aria-invalid={!!errors.time}
              {...register("time")}
            />
            <FieldError errors={[errors.time]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.staffId}>
          <FieldLabel htmlFor="move-staff">With</FieldLabel>
          <select
            id="move-staff"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            {...register("staffId")}
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <FieldDescription>
            Still{" "}
            {Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60_000)}{" "}
            minutes. It has to fit {who}&apos;s working hours.
          </FieldDescription>
          <FieldError errors={[errors.staffId]} />
        </Field>

        {errors.root?.server && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.server.message}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            Move booking
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}
