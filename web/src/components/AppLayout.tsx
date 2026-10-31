import { NavLink, Outlet } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/features/auth/useAuth";
import { useMe } from "@/features/auth/useMe";
import { cn } from "@/lib/utils";

const links = [
  { to: "/app", label: "Home", end: true },
  { to: "/app/services", label: "Services" },
  { to: "/app/staff", label: "Staff" },
];

/** The frame around every owner page: business name, tabs, log out */
export function AppLayout() {
  const { data: account } = useMe(); // RequireAuth already made sure this exists
  const logout = useLogout();

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-3">
          <span className="truncate font-semibold">{account?.tenant.name}</span>
          <Button
            variant="ghost"
            size="sm"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            {logout.isPending && <Spinner />}
            Log out
          </Button>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
