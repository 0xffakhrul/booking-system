import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { setServerErrors } from "@/lib/form-errors";
import { ringgitToSen, senToRinggit } from "@/lib/money";
import {
  useCreateService,
  useUpdateService,
  type Service,
} from "./useServices";

// Inputs are text, so the owner can type "28.50"; the schema turns them into the API's numbers.
// Same limits as api/src/modules/services/services.schemas.ts.
const serviceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(80, "At most 80 characters"),
  durationMin: z
    .string()
    .trim()
    .regex(/^\d+$/, "Whole minutes, e.g. 45")
    .transform(Number)
    .refine((n) => n >= 5 && n <= 480, "Between 5 and 480 minutes")
    .refine((n) => n % 5 === 0, "Use steps of 5 minutes"),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,5}(\.\d{1,2})?$/, "A price in RM, e.g. 28 or 28.50")
    .transform(ringgitToSen)
    .refine((sen) => sen <= 1_000_000, "At most RM 10,000"),
});

type FormInput = z.input<typeof serviceFormSchema>;
type FormOutput = z.output<typeof serviceFormSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service; // leave out to add a new one
};

export function ServiceFormDialog({ open, onOpenChange, service }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? "Edit service" : "Add service"}</DialogTitle>
          <DialogDescription>
            Customers see the name, length and price when they book.
          </DialogDescription>
        </DialogHeader>
        {/* rendered inside the dialog, so the form starts fresh each time it opens */}
        <ServiceForm service={service} onSaved={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ServiceForm({
  service,
  onSaved,
}: {
  service?: Service;
  onSaved: () => void;
}) {
  const create = useCreateService();
  const update = useUpdateService();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: service
      ? {
          name: service.name,
          durationMin: String(service.durationMin),
          price: senToRinggit(service.price),
        }
      : { name: "", durationMin: "30", price: "" },
  });

  const onSubmit = handleSubmit(async (input) => {
    try {
      if (service) await update.mutateAsync({ id: service.id, ...input });
      else await create.mutateAsync(input);
      onSaved();
    } catch (err) {
      setServerErrors(err, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            placeholder="Haircut & wash"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.durationMin}>
            <FieldLabel htmlFor="durationMin">Length (minutes)</FieldLabel>
            <Input
              id="durationMin"
              inputMode="numeric"
              aria-invalid={!!errors.durationMin}
              {...register("durationMin")}
            />
            <FieldDescription>Steps of 5</FieldDescription>
            <FieldError errors={[errors.durationMin]} />
          </Field>

          <Field data-invalid={!!errors.price}>
            <FieldLabel htmlFor="price">Price (RM)</FieldLabel>
            <Input
              id="price"
              inputMode="decimal"
              placeholder="28.00"
              aria-invalid={!!errors.price}
              {...register("price")}
            />
            <FieldError errors={[errors.price]} />
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
            {service ? "Save" : "Add service"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}
