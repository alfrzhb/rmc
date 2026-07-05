import { NavLink } from "react-router-dom";
import { Bell, Menu, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { appRoutes, primaryMobileRoutes, type AppRoute } from "@/routes";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = useCurrentUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-card lg:block">
        <BrandBlock />
        <SidebarNav />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/20"
            type="button"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[min(21rem,calc(100vw-2rem))] border-r bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <BrandText />
              <Button
                aria-label="Close navigation"
                size="icon"
                type="button"
                variant="ghost"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              aria-label="Open navigation"
              className="lg:hidden"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Ratama Management Consultant</p>
              <p className="truncate text-xs text-muted-foreground">
                Project & Finance Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button aria-label="Notifications" size="icon" type="button" variant="ghost">
              <Bell className="h-5 w-5" />
            </Button>
            <AuthBadge
              isError={currentUser.isError}
              isLoading={currentUser.isLoading}
              name={currentUser.data?.name}
              role={currentUser.data?.role}
              onRetry={() => currentUser.refetch()}
            />
          </div>
        </header>

        {currentUser.isError ? <AuthWarning onRetry={() => currentUser.refetch()} /> : null}

        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t bg-card p-1 lg:hidden">
        {primaryMobileRoutes.map((route) => (
          <NavItem key={route.path} compact route={route} />
        ))}
      </nav>
    </div>
  );
}

function BrandBlock() {
  return (
    <div className="flex h-16 items-center border-b px-6">
      <BrandText />
    </div>
  );
}

function BrandText() {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold">Ratama Tracker</p>
      <p className="truncate text-xs text-muted-foreground">Project & Finance</p>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const groups = [
    { id: "main", title: "Operations" },
    { id: "finance", title: "Finance" },
    { id: "system", title: "System" }
  ] as const;

  return (
    <nav className="space-y-5 p-3">
      {groups.map((group) => {
        const routes = appRoutes.filter((route) => route.group === group.id);

        return (
          <div key={group.id}>
            <p className="px-3 pb-2 text-xs font-medium uppercase text-muted-foreground">
              {group.title}
            </p>
            <div className="space-y-1">
              {routes.map((route) => (
                <NavItem key={route.path} route={route} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function NavItem({
  compact = false,
  route,
  onNavigate
}: {
  compact?: boolean;
  route: AppRoute;
  onNavigate?: () => void;
}) {
  const Icon = route.icon;

  return (
    <NavLink
      to={route.path}
      className={({ isActive }) =>
        cn(
          compact
            ? "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[10px] text-muted-foreground"
            : "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          isActive &&
            (compact
              ? "bg-primary text-primary-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")
        )
      }
      onClick={onNavigate}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="max-w-full truncate">{route.title}</span>
    </NavLink>
  );
}

function AuthBadge({
  isError,
  isLoading,
  name,
  role,
  onRetry
}: {
  isError: boolean;
  isLoading: boolean;
  name?: string;
  role?: string;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="hidden h-10 w-40 animate-pulse rounded-md bg-muted sm:block" />
    );
  }

  if (isError) {
    return (
      <Button aria-label="Refresh identity" size="icon" type="button" variant="outline" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="hidden min-w-0 items-center gap-3 rounded-md border bg-card px-3 py-2 sm:flex">
      <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
        {name?.slice(0, 1).toUpperCase() ?? "U"}
      </div>
      <div className="min-w-0">
        <p className="max-w-40 truncate text-xs font-medium">{name}</p>
        <p className="text-[11px] text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

function AuthWarning({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border-b bg-accent px-4 py-3 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-accent-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Access identity is not connected to an active app user.</span>
        <Button size="sm" type="button" variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </Button>
      </div>
    </div>
  );
}
