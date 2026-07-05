import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CLIENT_STATUSES } from "@ratama/shared";
import { apiFetch } from "@/lib/api";
import { emptyToUndefined } from "@/lib/form";
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

type ClientRow = {
  id: string;
  name: string;
  client_type: string | null;
  industry: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  updated_at: string;
};

export function ClientsPage() {
  const queryClient = useQueryClient();
  const clients = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiFetch<ClientRow[]>("/clients?pageSize=100")
  });

  const createClient = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<ClientRow>("/clients", {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] })
  });

  const deleteClient = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/clients/${id}`, {
        method: "DELETE"
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] })
  });

  return (
    <ModulePage
      description="Client companies, contacts, and relationship history."
      title="Clients"
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="New Client">
          <form
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              createClient.mutate({
                name: form.get("name"),
                client_type: emptyToUndefined(form.get("client_type")),
                industry: emptyToUndefined(form.get("industry")),
                address: emptyToUndefined(form.get("address")),
                email: emptyToUndefined(form.get("email")),
                phone: emptyToUndefined(form.get("phone")),
                notes: emptyToUndefined(form.get("notes")),
                status: form.get("status")
              });
              event.currentTarget.reset();
            }}
          >
            <ErrorMessage message={createClient.error?.message} />
            <Field label="Name">
              <input className={inputClass} name="name" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <input className={inputClass} name="client_type" />
              </Field>
              <Field label="Industry">
                <input className={inputClass} name="industry" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input className={inputClass} name="email" type="email" />
              </Field>
              <Field label="Phone">
                <input className={inputClass} name="phone" />
              </Field>
            </div>
            <Field label="Status">
              <select className={inputClass} defaultValue="PROSPECT" name="status">
                {CLIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Address">
              <textarea className={textareaClass} name="address" />
            </Field>
            <Field label="Notes">
              <textarea className={textareaClass} name="notes" />
            </Field>
            <SubmitButton isLoading={createClient.isPending}>Create Client</SubmitButton>
          </form>
        </Panel>

        <Panel title="Client List">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Industry</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {(clients.data ?? []).map((client) => (
                  <tr key={client.id}>
                    <td className="px-4 py-3 font-medium">{client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {client.industry ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{client.email ?? "-"}</td>
                    <td className="px-4 py-3">{client.status}</td>
                    <td className="px-4 py-3">
                      <DeleteButton
                        disabled={deleteClient.isPending}
                        onClick={() => deleteClient.mutate(client.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!clients.data?.length ? <EmptyState label="No clients yet" /> : null}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}
