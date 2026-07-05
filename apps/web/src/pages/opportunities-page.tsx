import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OPPORTUNITY_STATUSES } from "@ratama/shared";
import { apiFetch } from "@/lib/api";
import { emptyToUndefined, numberValue } from "@/lib/form";
import { useClients, useUsers } from "@/lib/queries";
import {
  DeleteButton,
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
  deal_amount: number | null;
  pic_user_id: string;
  pic_user_name?: string;
  status: string;
  next_follow_up_date: string | null;
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["opportunities"] })
  });

  const deleteOpportunity = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/opportunities/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["opportunities"] })
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
              createOpportunity.mutate({
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
              });
              event.currentTarget.reset();
            }}
          >
            <ErrorMessage message={createOpportunity.error?.message} />
            <Field label="Client">
              <select className={inputClass} name="client_id" required>
                <option value="">Select client</option>
                {(clients.data ?? []).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Opportunity Name">
              <input className={inputClass} name="name" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Service">
                <input className={inputClass} name="service_type" />
              </Field>
              <Field label="Source">
                <input className={inputClass} name="source" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="PIC">
                <select className={inputClass} name="pic_user_id" required>
                  <option value="">Select PIC</option>
                  {(users.data ?? []).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClass} defaultValue="NEW" name="status">
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
                <input className={inputClass} min="0" name="estimated_value" type="number" />
              </Field>
              <Field label="Deal Amount">
                <input className={inputClass} min="0" name="deal_amount" type="number" />
              </Field>
            </div>
            <Field label="Next Follow Up">
              <input className={inputClass} name="next_follow_up_date" type="date" />
            </Field>
            <Field label="Notes">
              <textarea className={textareaClass} name="notes" />
            </Field>
            <SubmitButton isLoading={createOpportunity.isPending}>Create Opportunity</SubmitButton>
          </form>
        </Panel>

        <Panel title="Opportunity List">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">PIC</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Value</th>
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
                      {(opportunity.deal_amount ?? opportunity.estimated_value ?? 0).toLocaleString(
                        "id-ID"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <DeleteButton
                        disabled={deleteOpportunity.isPending}
                        onClick={() => deleteOpportunity.mutate(opportunity.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!opportunities.data?.length ? <EmptyState label="No opportunities yet" /> : null}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}
