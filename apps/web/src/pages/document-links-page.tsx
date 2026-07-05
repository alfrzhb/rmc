import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DOCUMENT_KINDS, DOCUMENT_PROVIDERS } from "@ratama/shared";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { emptyToUndefined } from "@/lib/form";
import { invalidateMany } from "@/lib/mutations";
import {
  useClients,
  useInvoices,
  useOpportunities,
  usePayables,
  usePayments,
  useProjects
} from "@/lib/queries";
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

type DocumentLinkRow = {
  id: string;
  linked_type: string;
  linked_id: string;
  document_kind: string;
  title: string;
  url: string;
  provider: string | null;
  notes: string | null;
};

const LINKED_TYPES = [
  "CLIENT",
  "OPPORTUNITY",
  "PROJECT",
  "INVOICE",
  "PAYMENT",
  "PAYABLE"
] as const;

type LinkedType = (typeof LINKED_TYPES)[number];

export function DocumentLinksPage() {
  const queryClient = useQueryClient();
  const documentLinks = useQuery({
    queryKey: ["document-links"],
    queryFn: () => apiFetch<DocumentLinkRow[]>("/document-links")
  });

  const createDocumentLink = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<DocumentLinkRow>("/document-links", {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () => invalidateMany(queryClient, ["document-links"])
  });

  const deleteDocumentLink = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/document-links/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateMany(queryClient, ["document-links"])
  });

  return (
    <ModulePage
      description="External document URLs connected to clients, projects, finance, and activity records."
      title="Document Links"
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="New Document Link">
          <DocumentLinkForm
            error={createDocumentLink.error?.message}
            isLoading={createDocumentLink.isPending}
            submitLabel="Create Link"
            onSubmit={(body, form) => {
              createDocumentLink.mutate(body, { onSuccess: () => form.reset() });
            }}
          />
        </Panel>

        <Panel title="Document Link List">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Kind</th>
                  <th className="px-4 py-3">Linked</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">URL</th>
                  <th className="w-20 px-4 py-3" />
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {(documentLinks.data ?? []).map((documentLink) => (
                  <tr key={documentLink.id}>
                    <td className="px-4 py-3 font-medium">{documentLink.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {documentLink.document_kind}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {documentLink.linked_type}:{documentLink.linked_id}
                    </td>
                    <td className="px-4 py-3">{documentLink.provider ?? "-"}</td>
                    <td className="max-w-64 truncate px-4 py-3 text-muted-foreground">
                      <a href={documentLink.url} rel="noreferrer" target="_blank">
                        {documentLink.url}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <DetailLink to={`/document-links/${documentLink.id}`} />
                    </td>
                    <td className="px-4 py-3">
                      <DeleteButton
                        confirmLabel={`Delete document link ${documentLink.title}?`}
                        disabled={deleteDocumentLink.isPending}
                        onClick={() => deleteDocumentLink.mutate(documentLink.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!documentLinks.data?.length ? (
              <EmptyState label="No document links yet" />
            ) : null}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}

export function DocumentLinkDetailPage() {
  const { id } = useParams();
  const documentLinkId = id ?? "";
  const queryClient = useQueryClient();
  const documentLink = useQuery({
    queryKey: ["document-link", documentLinkId],
    queryFn: () => apiFetch<DocumentLinkRow>(`/document-links/${documentLinkId}`),
    enabled: Boolean(documentLinkId)
  });

  const updateDocumentLink = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<DocumentLinkRow>(`/document-links/${documentLinkId}`, {
        method: "PUT",
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["document-link", documentLinkId] });
      invalidateMany(queryClient, ["document-links"]);
    }
  });

  return (
    <ModulePage
      actions={
        <Button asChild type="button" variant="outline">
          <Link to="/document-links">Back</Link>
        </Button>
      }
      description="Document link metadata and linked business record."
      title={documentLink.data?.title ?? "Document Link Detail"}
    >
      <Panel title="Edit Document Link">
        <DocumentLinkForm
          key={documentLink.data?.id}
          current={documentLink.data}
          error={documentLink.error?.message ?? updateDocumentLink.error?.message}
          isLoading={updateDocumentLink.isPending}
          submitLabel="Save Link"
          onSubmit={(body) => updateDocumentLink.mutate(body)}
        />
      </Panel>
    </ModulePage>
  );
}

function DocumentLinkForm({
  current,
  error,
  isLoading,
  submitLabel,
  onSubmit
}: {
  current?: DocumentLinkRow;
  error?: string;
  isLoading: boolean;
  submitLabel: string;
  onSubmit: (body: Record<string, unknown>, form: HTMLFormElement) => void;
}) {
  const [linkedType, setLinkedType] = useState<LinkedType>(
    isLinkedType(current?.linked_type) ? current.linked_type : "PROJECT"
  );
  const entityOptions = useEntityOptions(linkedType, current);

  useEffect(() => {
    if (isLinkedType(current?.linked_type)) {
      setLinkedType(current.linked_type);
    }
  }, [current?.linked_type]);

  return (
    <form
      className="grid gap-4 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit(
          {
            linked_type: form.get("linked_type"),
            linked_id: form.get("linked_id"),
            document_kind: form.get("document_kind"),
            title: form.get("title"),
            url: form.get("url"),
            provider: emptyToUndefined(form.get("provider")),
            notes: emptyToUndefined(form.get("notes"))
          },
          event.currentTarget
        );
      }}
    >
      <ErrorMessage message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Linked Type">
          <select
            className={inputClass}
            name="linked_type"
            value={linkedType}
            onChange={(event) => setLinkedType(event.target.value as LinkedType)}
          >
            {LINKED_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Linked Record">
          <select
            className={inputClass}
            defaultValue={current?.linked_id ?? ""}
            name="linked_id"
            required
          >
            <option value="">Select record</option>
            {entityOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Document Kind">
        <select
          className={inputClass}
          defaultValue={current?.document_kind ?? "PROJECT_DOCUMENT"}
          name="document_kind"
        >
          {DOCUMENT_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Title">
        <input
          className={inputClass}
          defaultValue={current?.title ?? ""}
          name="title"
          required
        />
      </Field>
      <Field label="URL">
        <input
          className={inputClass}
          defaultValue={current?.url ?? ""}
          name="url"
          required
          type="url"
        />
      </Field>
      <Field label="Provider">
        <select
          className={inputClass}
          defaultValue={current?.provider ?? "GOOGLE_DRIVE"}
          name="provider"
        >
          {DOCUMENT_PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes">
        <textarea
          className={textareaClass}
          defaultValue={current?.notes ?? ""}
          name="notes"
        />
      </Field>
      <SubmitButton isLoading={isLoading}>{submitLabel}</SubmitButton>
    </form>
  );
}

function useEntityOptions(linkedType: LinkedType, current?: DocumentLinkRow) {
  const clients = useClients();
  const opportunities = useOpportunities();
  const projects = useProjects();
  const invoices = useInvoices();
  const payments = usePayments();
  const payables = usePayables();

  return useMemo(() => {
    const optionsByType: Record<LinkedType, Array<{ id: string; label: string }>> = {
      CLIENT: (clients.data ?? []).map((client) => ({
        id: client.id,
        label: client.name
      })),
      OPPORTUNITY: (opportunities.data ?? []).map((opportunity) => ({
        id: opportunity.id,
        label: opportunity.name
      })),
      PROJECT: (projects.data ?? []).map((project) => ({
        id: project.id,
        label: project.name
      })),
      INVOICE: (invoices.data ?? []).map((invoice) => ({
        id: invoice.id,
        label: invoice.invoice_number
      })),
      PAYMENT: (payments.data ?? []).map((payment) => ({
        id: payment.id,
        label: `${payment.invoice_number ?? payment.invoice_id} - ${payment.amount.toLocaleString("id-ID")}`
      })),
      PAYABLE: (payables.data ?? []).map((payable) => ({
        id: payable.id,
        label: payable.vendor_name
      }))
    };

    const options = optionsByType[linkedType];
    if (
      current?.linked_type === linkedType &&
      !options.some((option) => option.id === current.linked_id)
    ) {
      return [{ id: current.linked_id, label: current.linked_id }, ...options];
    }

    return options;
  }, [
    clients.data,
    current,
    invoices.data,
    linkedType,
    opportunities.data,
    payables.data,
    payments.data,
    projects.data
  ]);
}

function isLinkedType(value?: string): value is LinkedType {
  return LINKED_TYPES.includes(value as LinkedType);
}
