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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { setServerErrors } from "@/lib/form-errors";
import { useCreateStaff, useUpdateStaff, type Staff } from "./useStaff";

const staffFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(80, "At most 80 characters"),
});
type StaffFormInput = z.infer<typeof staffFormSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Staff; // leave out to add a new one
};

export function StaffFormDialog({ open, onOpenChange, member }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {member ? "Edit staff member" : "Add staff"}
          </DialogTitle>
          <DialogDescription>
            Customers can pick who they book with.
          </DialogDescription>
        </DialogHeader>
        <StaffForm member={member} onSaved={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function StaffForm({
  member,
  onSaved,
}: {
  member?: Staff;
  onSaved: () => void;
}) {
  const create = useCreateStaff();
  const update = useUpdateStaff();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormInput>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: { name: member?.name ?? "" },
  });

  const onSubmit = handleSubmit(async (input) => {
    try {
      if (member) await update.mutateAsync({ id: member.id, ...input });
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
            placeholder="Aina"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

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
            {member ? "Save" : "Add staff"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}
