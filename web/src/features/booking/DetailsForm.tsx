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
import { BottomBar, barInCard, bigButton } from "./BottomBar";

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
  bookLabel: string; // "Book 2:00 PM"
  defaultValues?: Details; // kept from an earlier try
  onBook: (details: Details) => Promise<void>;
};

/** Name and phone, then Book. The booking summary sits beside it (desktop) or above (phone). */
export function DetailsForm({ bookLabel, defaultValues, onBook }: Props) {
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
      <div className="flex flex-col gap-5 px-[18px] pt-[22px] pb-6 md:p-6">
        <h2 className="text-base font-semibold">Your details</h2>
        <FieldGroup className="gap-5">
          <Field data-invalid={!!errors.customerName}>
            <FieldLabel htmlFor="customerName">Your name</FieldLabel>
            <Input
              id="customerName"
              autoComplete="name"
              className={input}
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
              className={input}
              aria-invalid={!!errors.customerPhone}
              aria-describedby="phone-hint"
              {...register("customerPhone")}
            />
            {errors.customerPhone ? (
              <FieldError errors={[errors.customerPhone]} />
            ) : (
              <p id="phone-hint" className="text-[13px] text-muted-foreground">
                The shop uses this if they need to reach you.
              </p>
            )}
          </Field>
        </FieldGroup>

        {errors.root?.server && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.server.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <BottomBar className={barInCard}>
        <Button type="submit" className={bigButton} disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {bookLabel}
        </Button>
      </BottomBar>
    </form>
  );
}

/** 46px tall, 16px text so iOS doesn't zoom in on focus */
const input = "h-[46px] rounded-lg bg-card px-3.5 text-base md:text-[15px]";
