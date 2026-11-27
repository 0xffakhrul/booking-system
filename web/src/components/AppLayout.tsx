import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  LinkIcon,
  LogOutIcon,
  ScissorsIcon,
  UsersIcon,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useMatch } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/features/auth/useAuth";
import { useMe } from "@/features/auth/useMe";
import { cn } from "@/lib/utils";

const links = [
  { to: "/app", label: "Schedule", icon: CalendarDaysIcon, end: true },
  { to: "/app/services", label: "Services", icon: ScissorsIcon },
  { to: "/app/staff", label: "Staff", icon: UsersIcon },
];

/**
 * The frame around every owner page. From md up: a sidebar with the shop, the pages,
 * the booking link and the account. On a phone: the shop and the tabs across the top.
 */
export function AppLayout() {
  const { data: account } = useMe(); // RequireAuth already made sure this exists
  const name = account?.tenant.name ?? "";
  // the schedule needs the width for its columns; settings pages read better narrower,
  // but stay on the content's left edge
  const wide = useMatch({ path: "/app", end: true });

  return (
    <div className="min-h-svh bg-background md:flex">
      <header className="border-b bg-card md:hidden">
        <div className="flex h-14 items-center gap-2.5 px-4">
          <ShopTile name={name} />
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
            {name}
          </span>
          {account && <CopyLinkButton slug={account.tenant.slug} iconOnly />}
          {account && <AccountMenu email={account.user.email} />}
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex h-11 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
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

      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-6 border-r bg-sidebar px-3 py-4 text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2.5 px-2">
          <ShopTile name={name} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">Owner</p>
          </div>
        </div>

        <nav aria-label="Main" className="flex flex-col gap-0.5">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/40 [&_svg]:size-4",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )
              }
            >
              <Icon aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          {account && <BookingLinkCard slug={account.tenant.slug} />}
          {account && <AccountMenu email={account.user.email} row />}
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pt-5 pb-10 md:px-8 md:pt-0">
        {/* *: so a page's header bar can still run the full width */}
        <div className={cn(!wide && "*:max-w-[880px]")}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/** The shop's initials on a lime tile */
function ShopTile({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
    >
      {initials(name)}
    </span>
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

/** The sidebar's card: where customers book, with Copy and Open */
function BookingLinkCard({ slug }: { slug: string }) {
  const url = `${location.origin}/book/${slug}`;
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <p className="text-xs font-semibold">Your booking page</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground" title={url}>
        {location.host}/book/{slug}
      </p>
      <div className="mt-2.5 flex gap-1.5">
        <CopyLinkButton slug={slug} className="h-7 flex-1 text-xs" />
        <Button variant="outline" size="icon-sm" asChild>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open booking page in a new tab"
          >
            <ExternalLinkIcon />
          </a>
        </Button>
      </div>
    </div>
  );
}

function CopyLinkButton({
  slug,
  iconOnly = false,
  className,
}: {
  slug: string;
  iconOnly?: boolean;
  className?: string;
}) {
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

  const label =
    state === "copied"
      ? "Copied"
      : state === "failed"
        ? "Couldn't copy"
        : "Copy link";

  return (
    <Button
      variant="outline"
      size={iconOnly ? "icon" : "default"}
      className={className}
      aria-label={iconOnly ? "Copy booking link" : undefined}
      onClick={copy}
    >
      {state === "copied" ? (
        <CheckIcon />
      ) : iconOnly ? (
        <LinkIcon />
      ) : (
        <CopyIcon />
      )}
      {iconOnly ? (
        <span className="sr-only" aria-live="polite">
          {state === "idle" ? "" : label}
        </span>
      ) : (
        <span aria-live="polite">{label}</span>
      )}
    </Button>
  );
}

/** The owner's account; opens to their email and Log out. A full row in the sidebar. */
function AccountMenu({ email, row = false }: { email: string; row?: boolean }) {
  const logout = useLogout();
  const avatar = (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold uppercase">
      {email.slice(0, 2)}
    </span>
  );
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Account"
        className={cn(
          "flex items-center outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
          row
            ? "h-11 w-full gap-2.5 rounded-md px-2 text-left hover:bg-muted/60 data-[state=open]:bg-muted/60"
            : "size-9 justify-center rounded-full",
        )}
      >
        {avatar}
        {row && (
          <>
            <span className="min-w-0 flex-1 truncate text-xs font-medium">
              {email}
            </span>
            <ChevronsUpDownIcon
              aria-hidden
              className="size-3.5 text-muted-foreground"
            />
          </>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={row ? "start" : "end"}
          side={row ? "top" : "bottom"}
          sideOffset={6}
          className="z-50 min-w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <DropdownMenu.Label className="truncate px-2 py-1.5 text-xs text-muted-foreground">
            {email}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            disabled={logout.isPending}
            onSelect={(e) => {
              e.preventDefault(); // keep the menu open so the spinner shows
              logout.mutate();
            }}
            className="flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-[13px] outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground"
          >
            {logout.isPending ? <Spinner /> : <LogOutIcon />}
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
