import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth";

export function LoginCheckPage() {
  const currentUser = useCurrentUser();

  return (
    <section className="mx-auto max-w-4xl pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-normal text-foreground">Login Check</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Cloudflare Access identity and internal user mapping.
        </p>
      </div>

      <div className="rounded-md border bg-card p-5 shadow-sm">
        {currentUser.isLoading ? (
          <div className="space-y-3">
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
          </div>
        ) : null}

        {currentUser.isError ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium">Identity unavailable</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  The current browser session is not mapped to an active app user.
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={() => currentUser.refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {currentUser.data ? (
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Signed in as {currentUser.data.name}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Email</dt>
                  <dd className="mt-1 truncate font-medium">{currentUser.data.email}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Role</dt>
                  <dd className="mt-1 font-medium">{currentUser.data.role}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Status</dt>
                  <dd className="mt-1 font-medium">{currentUser.data.status}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">User ID</dt>
                  <dd className="mt-1 truncate font-medium">{currentUser.data.id}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
