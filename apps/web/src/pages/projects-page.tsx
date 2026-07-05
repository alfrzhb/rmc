import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PROJECT_STATUSES } from "@ratama/shared";
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

type ProjectRow = {
  id: string;
  client_id: string;
  client_name?: string;
  name: string;
  service_type: string | null;
  contract_value: number;
  pic_user_id: string;
  pic_user_name?: string;
  status: string;
  progress_percentage: number;
  deadline: string | null;
};

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const clients = useClients();
  const users = useUsers();
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch<ProjectRow[]>("/projects?pageSize=100")
  });

  const createProject = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<ProjectRow>("/projects", {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });

  return (
    <ModulePage
      description="Project execution, progress, blockers, and activity timeline."
      title="Projects"
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="New Project">
          <form
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              createProject.mutate({
                client_id: form.get("client_id"),
                name: form.get("name"),
                service_type: emptyToUndefined(form.get("service_type")),
                contract_value: numberValue(form.get("contract_value")) ?? 0,
                pic_user_id: form.get("pic_user_id"),
                status: form.get("status"),
                progress_percentage: numberValue(form.get("progress_percentage")) ?? 0,
                start_date: emptyToUndefined(form.get("start_date")),
                deadline: emptyToUndefined(form.get("deadline")),
                next_action: emptyToUndefined(form.get("next_action")),
                blocker_notes: emptyToUndefined(form.get("blocker_notes"))
              });
              event.currentTarget.reset();
            }}
          >
            <ErrorMessage message={createProject.error?.message} />
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
            <Field label="Project Name">
              <input className={inputClass} name="name" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Service">
                <input className={inputClass} name="service_type" />
              </Field>
              <Field label="Contract Value">
                <input className={inputClass} min="0" name="contract_value" required type="number" />
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
                <select className={inputClass} defaultValue="NOT_STARTED" name="status">
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Progress">
                <input
                  className={inputClass}
                  defaultValue="0"
                  max="100"
                  min="0"
                  name="progress_percentage"
                  type="number"
                />
              </Field>
              <Field label="Deadline">
                <input className={inputClass} name="deadline" type="date" />
              </Field>
            </div>
            <Field label="Next Action">
              <textarea className={textareaClass} name="next_action" />
            </Field>
            <SubmitButton isLoading={createProject.isPending}>Create Project</SubmitButton>
          </form>
        </Panel>

        <Panel title="Project List">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">PIC</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {(projects.data ?? []).map((project) => (
                  <tr key={project.id}>
                    <td className="px-4 py-3 font-medium">{project.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {project.client_name ?? project.client_id}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {project.pic_user_name ?? project.pic_user_id}
                    </td>
                    <td className="px-4 py-3">{project.status}</td>
                    <td className="px-4 py-3">{project.progress_percentage}%</td>
                    <td className="px-4 py-3">{project.contract_value.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">
                      <DeleteButton
                        disabled={deleteProject.isPending}
                        onClick={() => deleteProject.mutate(project.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!projects.data?.length ? <EmptyState label="No projects yet" /> : null}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}
