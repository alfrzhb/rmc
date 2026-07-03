import { NavLink } from "react-router-dom";
import { appRoutes } from "@/routes";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-card lg:block">
        <div className="flex h-16 items-center border-b px-6">
          <div>
            <p className="text-sm font-semibold">Ratama Tracker</p>
            <p className="text-xs text-muted-foreground">Project & Finance</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {appRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{route.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 flex min-h-16 items-center border-b bg-background/95 px-4 backdrop-blur lg:px-8">
          <div>
            <p className="text-sm font-medium">Ratama Management Consultant</p>
            <p className="text-xs text-muted-foreground">Internal business tracker</p>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t bg-card p-1 lg:hidden">
        {appRoutes.slice(1, 6).map((route) => {
          const Icon = route.icon;
          return (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[10px] text-muted-foreground",
                  isActive && "bg-primary text-primary-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate">{route.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
