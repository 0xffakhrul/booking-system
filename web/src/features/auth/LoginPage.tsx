import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { loginSchema, type LoginInput } from "./auth.schemas";
import { AuthHeading, AuthLayout, authButton, authInput } from "./AuthLayout";
import { ProductPreview } from "./ProductPreview";
import { useLogin } from "./useAuth";

export function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  // on success, GuestOnly sees the new account and redirects, so there's no navigate() here
  const onSubmit = handleSubmit(async (input) => {
    try {
      await login.mutateAsync(input);
    } catch (err) {
      setServerErrors(err, setError, {
        INVALID_CREDENTIALS: { message: "Wrong email or password." },
      });
    }
  });

  return (
    <AuthLayout
      preview={
        <ProductPreview shopName="Kedai Gunting Ali" slug="kedai-gunting-ali" />
      }
    >
      <AuthHeading title="Log in">
        Your shop's schedule, bookings and booking link.
      </AuthHeading>
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="gap-5">
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
              autoComplete="current-password"
              className={authInput}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
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
              Log in
            </Button>
            <FieldDescription className="text-sm">
              New here? <Link to="/register">Create your shop</Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}
