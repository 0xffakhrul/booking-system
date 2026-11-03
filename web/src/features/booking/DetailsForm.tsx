import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { setServerErrors } from "@/lib/form-errors";
import { BottomBar, bigButton } from "./BottomBar";

// Field names match the API's, so a 400 from the server lands next to the right input.
// The phone check is loose on purpose: the server turns "012-345 6789" into +60123456789.
const detailsSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(80, "At most 80 characters"),
  customerPhone: z
    .string()
    .trim()
    .refine(
      (v) => /^\+?\d{9,15}$/.test(v.replace(/[\s\-().]/g, "")),
      "Enter a phone number like 012-345 6789",
    ),
});
export type Details = z.infer<typeof detailsSchema>;

type Props = {
  summary: string; // "Haircut & wash · Tue 3 Nov, 2:00 PM"
  bookLabel: string; // "Book 2:00 PM"
  defaultValues?: Details; // kept from an earlier try
  onChange: () => void;
  onBook: (details: Details) => Promise<void>;
};

export function DetailsForm({
  summary,
  bookLabel,
  defaultValues,
  onChange,
  onBook,
}: Props) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Details>({
    resolver: zodResolver(detailsSchema),
    defaultValues: defaultValues ?? { customerName: "", customerPhone: "" },
  });

  const onSubmit = handleSubmit(async (details) => {
    try {
      await onBook(details); // a 409 is handled by the page: it shows the "just taken" screen
    } catch (err) {
      setServerErrors(err, setError, {
        TOO_SOON: { message: "That time is too soon now. Pick a later one." },
        OUTSIDE_BOOKING_WINDOW: {
          message: "That date can't be booked any more. Pick another.",
        },
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
      <main className="flex flex-col gap-[18px] px-5 pt-4 pb-6">
        <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          Step 2 of 2 · Your details
        </p>

        <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-3">
          <p className="text-sm font-semibold">{summary}</p>
          <Button
            type="button"
            variant="link"
            className="h-auto shrink-0 p-0"
            onClick={onChange}
          >
            Change
          </Button>
        </div>

        <FieldGroup>
          <Field data-invalid={!!errors.customerName}>
            <FieldLabel htmlFor="customerName">Your name</FieldLabel>
            <Input
              id="customerName"
              autoComplete="name"
              className="h-12 bg-card text-base"
              aria-invalid={!!errors.customerName}
              {...register("customerName")}
            />
            <FieldError errors={[errors.customerName]} />
          </Field>
          <Field data-invalid={!!errors.customerPhone}>
            <FieldLabel htmlFor="customerPhone">Phone number</FieldLabel>
            <Input
              id="customerPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="012-345 6789"
              className="h-12 bg-card text-base"
              aria-invalid={!!errors.customerPhone}
              {...register("customerPhone")}
            />
            <FieldError errors={[errors.customerPhone]} />
          </Field>
        </FieldGroup>

        {errors.root?.server && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.server.message}</AlertDescription>
          </Alert>
        )}
      </main>

      <BottomBar summary="The shop will see your name and phone number.">
        <Button type="submit" className={bigButton} disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {bookLabel}
        </Button>
      </BottomBar>
    </form>
  );
}
