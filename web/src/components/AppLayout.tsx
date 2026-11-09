import { CheckIcon, LinkIcon, LogOutIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useMatch } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/features/auth/useAuth";
import { useMe } from "@/features/auth/useMe";
import { cn } from "@/lib/utils";

const links = [
  { to: "/app", label: "Schedule", end: true },
  { to: "/app/services", label: "Services" },
  { to: "/app/staff", label: "Staff" },
];

/**
 * The frame around every owner page: the shop, the tabs, the booking link and the
 * account menu. On a phone the tabs get their own row under the shop name.
 */
export function AppLayout() {
  const { data: account } = useMe(); // RequireAuth already made sure this exists
  // the schedule needs the width for its columns; settings pages read better narrower,
  // but stay on the frame's left edge
  const wide = useMatch({ path: "/app", end: true });

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 px-4 md:h-14 md:flex-nowrap md:px-8">
          <div className="flex h-14 min-w-0 flex-1 items-center gap-2.5 md:flex-none">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-accent-foreground ring-1 ring-accent-border ring-inset"
            >
              {initials(account?.tenant.name ?? "")}
            </span>
            <span className="truncate text-[15px] font-semibold">
              {account?.tenant.name}
            </span>
          </div>

          <nav
            aria-label="Main"
            className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-2 md:order-none md:mx-0 md:h-full md:w-auto md:px-0"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "flex h-11 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:h-full",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:ml-auto">
            {account && <CopyLinkButton slug={account.tenant.slug} />}
            {account && <AccountMenu email={account.user.email} />}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-4 py-5 md:px-8 md:py-6">
        <div className={cn(!wide && "max-w-[880px]")}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/** "Kedai Gunting Ali" → "KG" */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

function CopyLinkButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      // the clipboard API only works on https or localhost, not http://192.168.x.x
      await navigator.clipboard.writeText(`${location.origin}/book/${slug}`);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <Button
      variant="outline"
      className="h-9 px-3"
      aria-label="Copy booking link"
      onClick={copy}
    >
      {state === "copied" ? <CheckIcon /> : <LinkIcon />}
      {/* just the icon on a phone, so the row fits */}
      <span className="hidden sm:inline" aria-live="polite">
        {state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Couldn't copy"
            : "Copy booking link"}
      </span>
    </Button>
  );
}

/** The owner's initials in a circle; opens to their email and Log out */
function AccountMenu({ email }: { email: string }) {
  const logout = useLogout();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Account"
        className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase outline-none hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_6%)] focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {email.slice(0, 2)}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-56 rounded-xl border bg-popover p-1 text-popover-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <DropdownMenu.Label className="truncate px-2.5 py-2 text-[13px] text-muted-foreground">
            {email}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            disabled={logout.isPending}
            onSelect={(e) => {
              e.preventDefault(); // keep the menu open so the spinner shows
              logout.mutate();
            }}
            className="flex h-9 cursor-default items-center gap-2 rounded-lg px-2.5 text-sm outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground"
          >
            {logout.isPending ? <Spinner /> : <LogOutIcon />}
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
