import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/features/auth/useAuth";
import { useMe } from "@/features/auth/useMe";

// Placeholder owner home. The day timeline replaces this later.
export function DashboardPage() {
  const { data: account } = useMe(); // RequireAuth already made sure this exists
  const logout = useLogout();

  if (!account) return null;
  const { user, tenant } = account;

  return (
    <div className="min-h-svh bg-muted">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3">
        <span className="font-semibold">{tenant.name}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {logout.isPending && <Spinner />}
          Log out
        </Button>
      </header>
      <main className="mx-auto max-w-2xl space-y-1 p-4">
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user.email}. Your booking link is /book/{tenant.slug}
          {" · "}
          {tenant.timezone}
        </p>
      </main>
    </div>
  );
}
