import { Button } from "@/components/ui/button";

type PlaceholderPageProps = {
  title: string;
  description: string;
  highlights: string[];
};

export function PlaceholderPage({ title, description, highlights }: PlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-6xl pb-20">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <Button variant="outline">New Record</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <div key={item} className="rounded-md border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">{item}</p>
            <p className="mt-3 text-2xl font-semibold">0</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-md border bg-card">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">Workspace</p>
        </div>
        <div className="grid min-h-64 place-items-center px-4 py-12 text-center">
          <div>
            <p className="text-sm font-medium">Module ready for Phase 2+</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              The route, layout, Tailwind styling, and navigation shell are prepared.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
