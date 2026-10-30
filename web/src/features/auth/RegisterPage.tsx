import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { registerSchema, slugify, type RegisterInput } from "./auth.schemas";
import { useRegister } from "./useAuth";

export function RegisterPage() {
  const signup = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getFieldState,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { businessName: "", slug: "", email: "", password: "" },
  });
  const slug = useWatch({ control, name: "slug" });

  const onSubmit = handleSubmit(async (input) => {
    try {
      await signup.mutateAsync(input);
    } catch (err) {
      setServerErrors(err, setError, {
        SLUG_TAKEN: {
          field: "slug",
          message: "Another shop already has this link. Try a different one.",
        },
        EMAIL_TAKEN: {
          field: "email",
          message: "This email already has an account. Log in instead?",
        },
      });
    }
  });

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your shop</CardTitle>
          <CardDescription>
            You'll be the owner. You can add staff later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.businessName}>
                <FieldLabel htmlFor="businessName">Business name</FieldLabel>
                <Input
                  id="businessName"
                  autoComplete="organization"
                  aria-invalid={!!errors.businessName}
                  {...register("businessName", {
                    // fill in the link from the name, until the owner edits the link themselves
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      if (!getFieldState("slug").isDirty) {
                        setValue("slug", slugify(e.target.value));
                      }
                    },
                  })}
                />
                <FieldError errors={[errors.businessName]} />
              </Field>

              <Field data-invalid={!!errors.slug}>
                <FieldLabel htmlFor="slug">Booking link</FieldLabel>
                <Input
                  id="slug"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={!!errors.slug}
                  {...register("slug")}
                />
                <FieldDescription>
                  Customers book at /book/{slug || "your-shop"}
                </FieldDescription>
                <FieldError errors={[errors.slug]} />
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <FieldDescription>At least 12 characters.</FieldDescription>
                <FieldError errors={[errors.password]} />
              </Field>

              {errors.root?.server && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {errors.root.server.message}
                  </AlertDescription>
                </Alert>
              )}

              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />}
                  Create shop
                </Button>
                <FieldDescription className="text-center">
                  Already have a shop? <Link to="/login">Log in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
