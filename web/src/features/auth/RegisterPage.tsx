import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { registerSchema, slugify, type RegisterInput } from "./auth.schemas";
import { AuthHeading, AuthLayout, authButton, authInput } from "./AuthLayout";
import { ProductPreview } from "./ProductPreview";
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
  const businessName = useWatch({ control, name: "businessName" });

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
    <AuthLayout
      preview={<ProductPreview shopName={businessName} slug={slug} />}
    >
      <AuthHeading title="Create your shop">
        A booking link for your customers and one schedule for your staff. You
        can add services, staff and hours next.
      </AuthHeading>
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="gap-5">
          <Field data-invalid={!!errors.businessName}>
            <FieldLabel htmlFor="businessName">Business name</FieldLabel>
            <Input
              id="businessName"
              autoComplete="organization"
              className={authInput}
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
            {/* the fixed part of the address sits inside the field, so the owner sees the whole link */}
            <div
              className={cn(
                "flex h-11 items-center overflow-hidden rounded-lg border border-input bg-card lg:h-10 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                errors.slug &&
                  "border-destructive ring-3 ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/20",
              )}
            >
              <span className="shrink-0 pl-3 text-base text-muted-foreground select-none md:text-[15px]">
                {location.host}/book/
              </span>
              <input
                id="slug"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="your-shop"
                className="h-full min-w-0 flex-1 bg-transparent pr-3 text-base outline-none placeholder:text-muted-foreground md:text-[15px]"
                aria-invalid={!!errors.slug}
                aria-describedby="slug-hint"
                {...register("slug")}
              />
            </div>
            {errors.slug ? (
              <FieldError errors={[errors.slug]} />
            ) : (
              <FieldDescription id="slug-hint">
                Lowercase letters, numbers and hyphens.
              </FieldDescription>
            )}
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className={authInput}
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
              className={authInput}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password ? (
              <FieldError errors={[errors.password]} />
            ) : (
              <FieldDescription>At least 12 characters.</FieldDescription>
            )}
          </Field>

          {errors.root?.server && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.server.message}</AlertDescription>
            </Alert>
          )}

          <Field className="gap-4 pt-1">
            <Button
              type="submit"
              className={authButton}
              disabled={isSubmitting}
            >
              {isSubmitting && <Spinner />}
              Create shop
            </Button>
            <FieldDescription className="text-sm">
              Already have a shop? <Link to="/login">Log in</Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}
