import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CLIENT_STATUSES } from "@ratama/shared";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { emptyToUndefined } from "@/lib/form";
import { invalidateMany } from "@/lib/mutations";
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

type ClientContactRow = {
  id: string;
  name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_primary: boolean;
};

type ClientDetail = ClientRow & {
  address: string | null;
  notes: string | null;
  contacts: ClientContactRow[];
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
    onSuccess: () => invalidateMany(queryClient, ["clients", "dashboard-summary"])
  });

  const deleteClient = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/clients/${id}`, {
        method: "DELETE"
      }),
    onSuccess: () => invalidateMany(queryClient, ["clients", "dashboard-summary"])
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
              const formElement = event.currentTarget;
              createClient.mutate(
                {
                  name: form.get("name"),
                  client_type: emptyToUndefined(form.get("client_type")),
                  industry: emptyToUndefined(form.get("industry")),
                  address: emptyToUndefined(form.get("address")),
                  email: emptyToUndefined(form.get("email")),
                  phone: emptyToUndefined(form.get("phone")),
                  notes: emptyToUndefined(form.get("notes")),
                  status: form.get("status")
                },
                { onSuccess: () => formElement.reset() }
              );
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
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Industry</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="w-20 px-4 py-3" />
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
                    <td className="px-4 py-3 text-muted-foreground">
                      {client.email ?? "-"}
                    </td>
                    <td className="px-4 py-3">{client.status}</td>
                    <td className="px-4 py-3">
                      <DetailLink to={`/clients/${client.id}`} />
                    </td>
                    <td className="px-4 py-3">
                      <DeleteButton
                        confirmLabel={`Delete client ${client.name}?`}
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

export function ClientDetailPage() {
  const { id } = useParams();
  const clientId = id ?? "";
  const queryClient = useQueryClient();
  const client = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => apiFetch<ClientDetail>(`/clients/${clientId}`),
    enabled: Boolean(clientId)
  });

  const updateClient = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<ClientDetail>(`/clients/${clientId}`, {
        method: "PUT",
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      invalidateMany(queryClient, ["clients", "dashboard-summary"]);
    }
  });

  const createContact = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<ClientContactRow>(`/clients/${clientId}/contacts`, {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["client", clientId] })
  });

  const deleteContact = useMutation({
    mutationFn: (contactId: string) =>
      apiFetch<{ id: string }>(`/clients/${clientId}/contacts/${contactId}`, {
        method: "DELETE"
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["client", clientId] })
  });

  const current = client.data;

  return (
    <ModulePage
      actions={
        <Button asChild type="button" variant="outline">
          <Link to="/clients">Back</Link>
        </Button>
      }
      description="Client profile, editable account fields, and active contacts."
      title={current?.name ?? "Client Detail"}
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="Edit Client">
          <form
            key={current?.id}
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              updateClient.mutate({
                name: form.get("name"),
                client_type: emptyToUndefined(form.get("client_type")),
                industry: emptyToUndefined(form.get("industry")),
                address: emptyToUndefined(form.get("address")),
                email: emptyToUndefined(form.get("email")),
                phone: emptyToUndefined(form.get("phone")),
                notes: emptyToUndefined(form.get("notes")),
                status: form.get("status")
              });
            }}
          >
            <ErrorMessage
              message={client.error?.message ?? updateClient.error?.message}
            />
            <Field label="Name">
              <input
                className={inputClass}
                defaultValue={current?.name}
                name="name"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <input
                  className={inputClass}
                  defaultValue={current?.client_type ?? ""}
                  name="client_type"
                />
              </Field>
              <Field label="Industry">
                <input
                  className={inputClass}
                  defaultValue={current?.industry ?? ""}
                  name="industry"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input
                  className={inputClass}
                  defaultValue={current?.email ?? ""}
                  name="email"
                  type="email"
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  defaultValue={current?.phone ?? ""}
                  name="phone"
                />
              </Field>
            </div>
            <Field label="Status">
              <select
                className={inputClass}
                defaultValue={current?.status ?? "PROSPECT"}
                name="status"
              >
                {CLIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Address">
              <textarea
                className={textareaClass}
                defaultValue={current?.address ?? ""}
                name="address"
              />
            </Field>
            <Field label="Notes">
              <textarea
                className={textareaClass}
                defaultValue={current?.notes ?? ""}
                name="notes"
              />
            </Field>
            <SubmitButton isLoading={updateClient.isPending}>Save Client</SubmitButton>
          </form>
        </Panel>

        <Panel title="Contacts">
          <form
            className="grid gap-4 border-b p-4 lg:grid-cols-[1fr_1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const formElement = event.currentTarget;
              createContact.mutate(
                {
                  name: form.get("name"),
                  position: emptyToUndefined(form.get("position")),
                  email: emptyToUndefined(form.get("email")),
                  phone: emptyToUndefined(form.get("phone")),
                  whatsapp: emptyToUndefined(form.get("whatsapp")),
                  is_primary: form.get("is_primary") === "on"
                },
                { onSuccess: () => formElement.reset() }
              );
            }}
          >
            <Field label="Name">
              <input className={inputClass} name="name" required />
            </Field>
            <Field label="Position">
              <input className={inputClass} name="position" />
            </Field>
            <Field label="Email">
              <input className={inputClass} name="email" type="email" />
            </Field>
            <div className="flex items-end gap-3">
              <label className="flex h-10 items-center gap-2 text-sm">
                <input name="is_primary" type="checkbox" />
                Primary
              </label>
              <SubmitButton isLoading={createContact.isPending}>Add</SubmitButton>
            </div>
          </form>
          <ErrorMessage
            message={createContact.error?.message ?? deleteContact.error?.message}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {(current?.contacts ?? []).map((contact) => (
                  <tr key={contact.id}>
                    <td className="px-4 py-3 font-medium">
                      {contact.name}
                      {contact.is_primary ? " (Primary)" : ""}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {contact.position ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {contact.email ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {contact.phone ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <DeleteButton
                        confirmLabel={`Delete contact ${contact.name}?`}
                        disabled={deleteContact.isPending}
                        onClick={() => deleteContact.mutate(contact.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!current?.contacts.length ? <EmptyState label="No contacts yet" /> : null}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}
