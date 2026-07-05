import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ModulePage, Panel } from "@/components/module-ui";

type DashboardSummary = {
  as_of: string;
  summary_cards: Record<string, number>;
  receivables: Record<string, number>;
  payables: Record<string, number>;
  status_summary: Record<string, Array<{ status: string; total: number }>>;
  overdue_items: Record<string, unknown[]>;
};

const cardLabels: Record<string, string> = {
  active_clients: "Active Clients",
  prospect_clients: "Prospect Clients",
  open_opportunities: "Open Opportunities",
  won_opportunities: "Won Opportunities",
  active_projects: "Active Projects",
  overdue_projects: "Overdue Projects"
};

export function DashboardPage() {
  const summary = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiFetch<DashboardSummary>("/dashboard/summary")
  });

  return (
    <ModulePage
      description="Operational and finance visibility for active business flow."
      title="Owner Dashboard"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(summary.data?.summary_cards ?? cardLabels).map(([key, value]) => (
          <Panel key={key} className="p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {cardLabels[key] ?? key}
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {typeof value === "number" ? value.toLocaleString("id-ID") : 0}
            </p>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <MetricPanel title="Receivables" values={summary.data?.receivables} />
        <MetricPanel title="Payables" values={summary.data?.payables} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <StatusPanel title="Project Status" values={summary.data?.status_summary.projects} />
        <StatusPanel title="Invoice Status" values={summary.data?.status_summary.invoices} />
      </div>
    </ModulePage>
  );
}

function MetricPanel({ title, values }: { title: string; values?: Record<string, number> }) {
  return (
    <Panel title={title}>
      <div className="divide-y">
        {Object.entries(values ?? {}).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="capitalize text-muted-foreground">{key.replaceAll("_", " ")}</span>
            <span className="font-medium">{value.toLocaleString("id-ID")}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function StatusPanel({
  title,
  values
}: {
  title: string;
  values?: Array<{ status: string; total: number }>;
}) {
  return (
    <Panel title={title}>
      <div className="divide-y">
        {(values ?? []).map((item) => (
          <div key={item.status} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">{item.status}</span>
            <span className="font-medium">{item.total.toLocaleString("id-ID")}</span>
          </div>
        ))}
        {values?.length === 0 || !values ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No data</div>
        ) : null}
      </div>
    </Panel>
  );
}
