import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DOCUMENT_KINDS, DOCUMENT_LINKED_TYPES, DOCUMENT_PROVIDERS } from "@ratama/shared";
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["document-links"] })
  });

  const deleteDocumentLink = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/document-links/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["document-links"] })
  });

  return (
    <ModulePage
      description="External document URLs connected to clients, projects, finance, and activity records."
      title="Document Links"
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="New Document Link">
          <form
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              createDocumentLink.mutate({
                linked_type: form.get("linked_type"),
                linked_id: form.get("linked_id"),
                document_kind: form.get("document_kind"),
                title: form.get("title"),
                url: form.get("url"),
                provider: emptyToUndefined(form.get("provider")),
                notes: emptyToUndefined(form.get("notes"))
              });
              event.currentTarget.reset();
            }}
          >
            <ErrorMessage message={createDocumentLink.error?.message} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Linked Type">
                <select className={inputClass} defaultValue="PROJECT" name="linked_type">
                  {DOCUMENT_LINKED_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Linked ID">
                <input className={inputClass} name="linked_id" required />
              </Field>
            </div>
            <Field label="Document Kind">
              <select className={inputClass} defaultValue="PROJECT_DOCUMENT" name="document_kind">
                {DOCUMENT_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input className={inputClass} name="title" required />
            </Field>
            <Field label="URL">
              <input className={inputClass} name="url" required type="url" />
            </Field>
            <Field label="Provider">
              <select className={inputClass} defaultValue="GOOGLE_DRIVE" name="provider">
                {DOCUMENT_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <textarea className={textareaClass} name="notes" />
            </Field>
            <SubmitButton isLoading={createDocumentLink.isPending}>Create Link</SubmitButton>
          </form>
        </Panel>

        <Panel title="Document Link List">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Kind</th>
                  <th className="px-4 py-3">Linked</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">URL</th>
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
                      <DeleteButton
                        disabled={deleteDocumentLink.isPending}
                        onClick={() => deleteDocumentLink.mutate(documentLink.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!documentLinks.data?.length ? <EmptyState label="No document links yet" /> : null}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}
