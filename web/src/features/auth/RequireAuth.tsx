import { Navigate, Outlet, useLocation, type Location } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { useMe } from "./useMe";

/** Wrap owner routes in this: logged-out visitors go to /login, then come back here */
export function RequireAuth() {
  const { data: account, isPending, error } = useMe();
  const location = useLocation();

  if (isPending) return <FullScreenSpinner />;
  if (error) throw error; // the router's error page; something other than 401 went wrong
  if (!account)
    return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/**
 * Wrap /login and /register in this: logged-in owners skip straight to the app.
 * It also does the redirect after a successful login, because that's when `account` appears.
 */
export function GuestOnly() {
  const { data: account, isPending } = useMe();
  const location = useLocation();

  if (isPending) return <FullScreenSpinner />;
  if (account) {
    const from = (location.state as { from?: Location } | null)?.from;
    return <Navigate to={from ?? "/app"} replace />;
  }
  return <Outlet />;
}

function FullScreenSpinner() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  );
}
