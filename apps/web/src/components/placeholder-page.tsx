import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type PlaceholderPageProps = {
  title: string;
  description: string;
  highlights: string[];
  actionLabel?: string;
};

export function PlaceholderPage({
  title,
  description,
  highlights,
  actionLabel
}: PlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-7xl pb-24">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        {actionLabel ? (
          <Button type="button">
            <Plus className="h-4 w-4" />
            <span>{actionLabel}</span>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <div key={item} className="rounded-md border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-muted-foreground">{item}</p>
            <p className="mt-3 text-2xl font-semibold">0</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-md border bg-card shadow-sm">
        <div className="flex min-h-14 flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">Workspace</p>
          <div className="flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground sm:w-72">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="grid min-w-[720px] grid-cols-[1.4fr_1fr_1fr_1fr] border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
            <span>Name</span>
            <span>Status</span>
            <span>PIC</span>
            <span>Updated</span>
          </div>
          <div className="grid min-h-64 place-items-center px-4 py-12 text-center">
            <div>
              <p className="text-sm font-medium">No records yet</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                This module shell is ready for the next implementation phase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
