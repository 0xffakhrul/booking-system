import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, PlusIcon, XIcon } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
import { PageHeader, pageAction } from "@/components/PageHeader";
import { TimeInput } from "@/components/TimeInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useMe } from "@/features/auth/useMe";
import { setServerErrors } from "@/lib/form-errors";
import { normalizeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useStaff } from "./useStaff";
import {
  useSaveWorkingHours,
  useWorkingHours,
  type Range,
} from "./useWorkingHours";
import { WEEK, addMinutes, weekSchema, type WeekForm } from "./working-hours";

export function WorkingHoursPage() {
  const { staffId = "" } = useParams();
  const { data: account } = useMe();
  const staff = useStaff();
  const hours = useWorkingHours(staffId);
  const member = staff.data?.find((s) => s.id === staffId);

  return (
    <>
      <Button
        variant="ghost"
        className="mb-2 -ml-2 h-9 px-2 text-foreground/80"
        asChild
      >
        <Link to="/app/staff">
          <ArrowLeftIcon />
          Staff
        </Link>
      </Button>
      <PageHeader
        title={member ? `${member.name}'s hours` : "Working hours"}
        description={`When customers can book them. Times are ${city(account?.tenant.timezone)} time, 24-hour.`}
      />

      {hours.isPending ? (
        // placeholder day rows: a switch and name, then a pair of time fields
        <div
          aria-hidden
          className="divide-y rounded-xl border bg-card px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] md:px-5"
        >
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3 sm:w-40">
                <span className="h-5 w-8 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
                <span className="h-3.5 w-20 animate-pulse rounded bg-muted motion-reduce:animate-none" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-9 w-24 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
                <span className="h-9 w-24 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      ) : hours.error ? (
        <Alert variant="destructive">
          <AlertDescription>{hours.error.message}</AlertDescription>
        </Alert>
      ) : (
        // keyed by staff member, so the form starts over if you switch between people
        <WeekEditor key={staffId} staffId={staffId} saved={hours.data} />
      )}
    </>
  );
}

function WeekEditor({ staffId, saved }: { staffId: string; saved: Range[] }) {
  const save = useSaveWorkingHours(staffId);
  const {
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful },
  } = useForm<WeekForm>({
    resolver: zodResolver(weekSchema),
    defaultValues: { hours: saved },
  });
  // one flat list, like the API; each day below shows the ranges with its weekday
  const { fields, append, remove } = useFieldArray({ control, name: "hours" });

  const onSubmit = handleSubmit(async ({ hours }) => {
    try {
      const week = await save.mutateAsync(hours);
      // the saved (sorted) week becomes the new starting point, so isDirty goes back to false
      reset({ hours: week }, { keepIsSubmitSuccessful: true });
    } catch (err) {
      setServerErrors(err, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="divide-y rounded-xl border bg-card px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] md:px-5">
        {WEEK.map((day) => {
          const ranges = fields
            .map((field, index) => ({ field, index }))
            .filter(({ field }) => field.weekday === day.weekday);
          const open = ranges.length > 0;

          const addRange = () => {
            const last = ranges.at(-1);
            const start = last ? getValues(`hours.${last.index}.end`) : "09:00";
            append({
              weekday: day.weekday,
              start,
              end: last ? addMinutes(start, 60) : "18:00",
            });
          };

          return (
            <div
              key={day.weekday}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start"
            >
              <div className="flex shrink-0 items-center gap-3 sm:w-40 sm:pt-1">
                <Switch
                  id={`day-${day.weekday}`}
                  checked={open}
                  onCheckedChange={(on) =>
                    on ? addRange() : remove(ranges.map((r) => r.index))
                  }
                />
                <Label
                  htmlFor={`day-${day.weekday}`}
                  className="text-sm font-semibold"
                >
                  {day.label}
                </Label>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {!open && (
                  <p className="text-sm text-muted-foreground sm:pt-1">
                    Closed
                  </p>
                )}
                {ranges.map(({ field, index }, i) => {
                  const error = errors.hours?.[index];
                  return (
                    <div key={field.id}>
                      <div className="flex items-center gap-2">
                        <TimeInput
                          className="w-24"
                          aria-label={`${day.label} start ${i + 1}`}
                          aria-invalid={!!error?.start}
                          {...register(`hours.${index}.start`, {
                            setValueAs: normalizeTime,
                          })}
                        />
                        <span className="shrink-0 text-muted-foreground">
                          –
                        </span>
                        <TimeInput
                          className="w-24"
                          aria-label={`${day.label} end ${i + 1}`}
                          aria-invalid={!!error?.end}
                          {...register(`hours.${index}.end`, {
                            setValueAs: normalizeTime,
                          })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 shrink-0"
                          aria-label={`Remove ${day.label} hours ${i + 1}`}
                          onClick={() => remove(index)}
                        >
                          <XIcon />
                        </Button>
                      </div>
                      <FieldError errors={[error?.start, error?.end]} />
                    </div>
                  );
                })}
                {open && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="-ml-2 h-9 self-start px-2 text-foreground/80"
                    onClick={addRange}
                  >
                    <PlusIcon />
                    Add hours
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {errors.root?.server && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{errors.root.server.message}</AlertDescription>
        </Alert>
      )}

      <div className="sticky bottom-0 mt-4 flex items-center justify-end gap-3 border-t bg-background pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <span className="mr-auto text-sm text-muted-foreground">
          {isDirty ? "Unsaved changes" : isSubmitSuccessful ? "Saved" : ""}
        </span>
        {isDirty && (
          <Button type="button" variant="ghost" onClick={() => reset()}>
            Discard
          </Button>
        )}
        <Button
          type="submit"
          // nothing to save yet: grey, not pale blue, like Continue on the booking page
          className={cn(
            pageAction,
            "disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none",
          )}
          disabled={!isDirty || isSubmitting}
        >
          {isSubmitting && <Spinner />}
          Save hours
        </Button>
      </div>
    </form>
  );
}

/** "Asia/Kuala_Lumpur" → "Kuala Lumpur" */
function city(timeZone = "") {
  return timeZone.split("/").pop()!.replace(/_/g, " ");
}
