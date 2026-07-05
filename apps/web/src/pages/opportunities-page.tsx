import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ACTIVITY_TYPES, OPPORTUNITY_STATUSES } from "@ratama/shared";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { emptyToUndefined, numberValue, todayString } from "@/lib/form";
import { invalidateMany } from "@/lib/mutations";
import { useClients, useUsers } from "@/lib/queries";
import {
  DeleteButton,
  DetailLink,
  EmptyState,
  ErrorMessage,
  Field,
  inputClass,
  ModulePage,
  Panel,
  SubmitButton,
  textareaClass
} from "@/components/module-ui";

type OpportunityRow = {
  id: string;
  client_id: string;
  client_name?: string;
  name: string;
  service_type: string | null;
  estimated_value: number | null;
  initial_offer_amount?: number | null;
  revised_offer_amount?: number | null;
  deal_amount: number | null;
  payment_scheme?: string | null;
  pic_user_id: string;
  pic_user_name?: string;
  status: string;
  source?: string | null;
  next_follow_up_date: string | null;
  notes?: string | null;
};

type OpportunityLogRow = {
  id: string;
  activity_type: string;
  activity_date: string;
  notes: string;
  next_action: string | null;
  next_follow_up_date: string | null;
  user_name?: string;
};

type OpportunityDetail = OpportunityRow & {
  logs: OpportunityLogRow[];
};

export function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const clients = useClients();
  const users = useUsers();
  const opportunities = useQuery({
    queryKey: ["opportunities"],
    queryFn: () => apiFetch<OpportunityRow[]>("/opportunities?pageSize=100")
  });

  const createOpportunity = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<OpportunityRow>("/opportunities", {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () => invalidateMany(queryClient, ["opportunities", "dashboard-summary"])
  });

  const deleteOpportunity = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/opportunities/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateMany(queryClient, ["opportunities", "dashboard-summary"])
  });

  return (
    <ModulePage
      description="Penawaran pipeline from lead to negotiation and deal."
      title="Opportunities"
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="New Opportunity">
          <form
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const formElement = event.currentTarget;
              createOpportunity.mutate(opportunityPayload(form), {
                onSuccess: () => formElement.reset()
              });
            }}
          >
            <ErrorMessage message={createOpportunity.error?.message} />
            <OpportunityFields clients={clients.data} users={users.data} />
            <SubmitButton isLoading={createOpportunity.isPending}>
              Create Opportunity
            </SubmitButton>
          </form>
        </Panel>

        <Panel title="Opportunity List">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">PIC</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="w-20 px-4 py-3" />
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {(opportunities.data ?? []).map((opportunity) => (
                  <tr key={opportunity.id}>
                    <td className="px-4 py-3 font-medium">{opportunity.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {opportunity.client_name ?? opportunity.client_id}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {opportunity.pic_user_name ?? opportunity.pic_user_id}
                    </td>
                    <td className="px-4 py-3">{opportunity.status}</td>
                    <td className="px-4 py-3">
                      {(
                        opportunity.deal_amount ??
                        opportunity.estimated_value ??
                        0
                      ).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <DetailLink to={`/opportunities/${opportunity.id}`} />
                    </td>
                    <td className="px-4 py-3">
                      <DeleteButton
                        confirmLabel={`Delete opportunity ${opportunity.name}?`}
                        disabled={deleteOpportunity.isPending}
                        onClick={() => deleteOpportunity.mutate(opportunity.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!opportunities.data?.length ? (
              <EmptyState label="No opportunities yet" />
            ) : null}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}

export function OpportunityDetailPage() {
  const { id } = useParams();
  const opportunityId = id ?? "";
  const queryClient = useQueryClient();
  const clients = useClients();
  const users = useUsers();
  const opportunity = useQuery({
    queryKey: ["opportunity", opportunityId],
    queryFn: () => apiFetch<OpportunityDetail>(`/opportunities/${opportunityId}`),
    enabled: Boolean(opportunityId)
  });

  const updateOpportunity = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<OpportunityDetail>(`/opportunities/${opportunityId}`, {
        method: "PUT",
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["opportunity", opportunityId] });
      invalidateMany(queryClient, ["opportunities", "dashboard-summary"]);
    }
  });

  const createLog = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<OpportunityLogRow>(`/opportunities/${opportunityId}/logs`, {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["opportunity", opportunityId] })
  });

  const deleteLog = useMutation({
    mutationFn: (logId: string) =>
      apiFetch<{ id: string }>(`/opportunities/${opportunityId}/logs/${logId}`, {
        method: "DELETE"
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["opportunity", opportunityId] })
  });

  const current = opportunity.data;

  return (
    <ModulePage
      actions={
        <Button asChild type="button" variant="outline">
          <Link to="/opportunities">Back</Link>
        </Button>
      }
      description="Opportunity detail, status transition, and follow-up logs."
      title={current?.name ?? "Opportunity Detail"}
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="Edit Opportunity">
          <form
            key={current?.id}
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              updateOpportunity.mutate(
                opportunityPayload(new FormData(event.currentTarget))
              );
            }}
          >
            <ErrorMessage
              message={opportunity.error?.message ?? updateOpportunity.error?.message}
            />
            <OpportunityFields
              clients={clients.data}
              opportunity={current}
              users={users.data}
            />
            <SubmitButton isLoading={updateOpportunity.isPending}>
              Save Opportunity
            </SubmitButton>
          </form>
        </Panel>

        <Panel title="Activity Logs">
          <form
            className="grid gap-4 border-b p-4 lg:grid-cols-[11rem_10rem_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const formElement = event.currentTarget;
              createLog.mutate(
                {
                  activity_type: form.get("activity_type"),
                  activity_date: form.get("activity_date"),
                  notes: form.get("notes"),
                  next_action: emptyToUndefined(form.get("next_action")),
                  next_follow_up_date: emptyToUndefined(form.get("next_follow_up_date"))
                },
                { onSuccess: () => formElement.reset() }
              );
            }}
          >
            <Field label="Type">
              <select className={inputClass} defaultValue="CALL" name="activity_type">
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                className={inputClass}
                defaultValue={todayString()}
                name="activity_date"
                required
                type="date"
              />
            </Field>
            <Field label="Notes">
              <input className={inputClass} name="notes" required />
            </Field>
            <div className="flex items-end">
              <SubmitButton isLoading={createLog.isPending}>Add</SubmitButton>
            </div>
          </form>
          <ErrorMessage message={createLog.error?.message ?? deleteLog.error?.message} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Next Action</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {(current?.logs ?? []).map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3">{log.activity_date}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.activity_type}
                    </td>
                    <td className="px-4 py-3 font-medium">{log.notes}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.next_action ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <DeleteButton
                        confirmLabel="Delete this opportunity log?"
                        disabled={deleteLog.isPending}
                        onClick={() => deleteLog.mutate(log.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!current?.logs.length ? <EmptyState label="No logs yet" /> : null}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}

function OpportunityFields({
  clients,
  opportunity,
  users
}: {
  clients?: Array<{ id: string; name: string }>;
  opportunity?: OpportunityRow;
  users?: Array<{ id: string; name: string }>;
}) {
  return (
    <>
      <Field label="Client">
        <select
          className={inputClass}
          defaultValue={opportunity?.client_id ?? ""}
          name="client_id"
          required
        >
          <option value="">Select client</option>
          {(clients ?? []).map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Opportunity Name">
        <input
          className={inputClass}
          defaultValue={opportunity?.name ?? ""}
          name="name"
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service">
          <input
            className={inputClass}
            defaultValue={opportunity?.service_type ?? ""}
            name="service_type"
          />
        </Field>
        <Field label="Source">
          <input
            className={inputClass}
            defaultValue={opportunity?.source ?? ""}
            name="source"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="PIC">
          <select
            className={inputClass}
            defaultValue={opportunity?.pic_user_id ?? ""}
            name="pic_user_id"
            required
          >
            <option value="">Select PIC</option>
            {(users ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            defaultValue={opportunity?.status ?? "NEW"}
            name="status"
          >
            {OPPORTUNITY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Estimated Value">
          <input
            className={inputClass}
            defaultValue={opportunity?.estimated_value ?? ""}
            min="0"
            name="estimated_value"
            type="number"
          />
        </Field>
        <Field label="Deal Amount">
          <input
            className={inputClass}
            defaultValue={opportunity?.deal_amount ?? ""}
            min="0"
            name="deal_amount"
            type="number"
          />
        </Field>
      </div>
      <Field label="Next Follow Up">
        <input
          className={inputClass}
          defaultValue={opportunity?.next_follow_up_date ?? ""}
          name="next_follow_up_date"
          type="date"
        />
      </Field>
      <Field label="Notes">
        <textarea
          className={textareaClass}
          defaultValue={opportunity?.notes ?? ""}
          name="notes"
        />
      </Field>
    </>
  );
}

function opportunityPayload(form: FormData) {
  return {
    client_id: form.get("client_id"),
    name: form.get("name"),
    service_type: emptyToUndefined(form.get("service_type")),
    estimated_value: numberValue(form.get("estimated_value")),
    initial_offer_amount: numberValue(form.get("initial_offer_amount")),
    revised_offer_amount: numberValue(form.get("revised_offer_amount")),
    deal_amount: numberValue(form.get("deal_amount")),
    payment_scheme: emptyToUndefined(form.get("payment_scheme")),
    pic_user_id: form.get("pic_user_id"),
    status: form.get("status"),
    source: emptyToUndefined(form.get("source")),
    next_follow_up_date: emptyToUndefined(form.get("next_follow_up_date")),
    notes: emptyToUndefined(form.get("notes"))
  };
}
