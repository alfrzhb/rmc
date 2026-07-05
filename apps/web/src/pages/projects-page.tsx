import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ACTIVITY_TYPES, PROJECT_MEMBER_ROLES, PROJECT_STATUSES } from "@ratama/shared";
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
  start_date?: string | null;
  deadline: string | null;
  next_action?: string | null;
  blocker_notes?: string | null;
};

type ProjectMemberRow = {
  id: string;
  user_id: string;
  user_name?: string;
  role_in_project: string;
  assigned_at: string;
  is_active: boolean;
};

type ProjectActivityRow = {
  id: string;
  activity_type: string;
  activity_date: string;
  notes: string;
  next_action: string | null;
  progress_snapshot: number | null;
  user_name?: string;
};

type ProjectDetail = ProjectRow & {
  members: ProjectMemberRow[];
  activities: ProjectActivityRow[];
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
    onSuccess: () => invalidateMany(queryClient, ["projects", "dashboard-summary"])
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateMany(queryClient, ["projects", "dashboard-summary"])
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
              const formElement = event.currentTarget;
              createProject.mutate(projectPayload(new FormData(event.currentTarget)), {
                onSuccess: () => formElement.reset()
              });
            }}
          >
            <ErrorMessage message={createProject.error?.message} />
            <ProjectFields clients={clients.data} users={users.data} />
            <SubmitButton isLoading={createProject.isPending}>
              Create Project
            </SubmitButton>
          </form>
        </Panel>

        <Panel title="Project List">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">PIC</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="w-20 px-4 py-3" />
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
                    <td className="px-4 py-3">
                      {project.contract_value.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <DetailLink to={`/projects/${project.id}`} />
                    </td>
                    <td className="px-4 py-3">
                      <DeleteButton
                        confirmLabel={`Delete project ${project.name}?`}
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

export function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = id ?? "";
  const queryClient = useQueryClient();
  const clients = useClients();
  const users = useUsers();
  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => apiFetch<ProjectDetail>(`/projects/${projectId}`),
    enabled: Boolean(projectId)
  });

  const updateProject = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<ProjectDetail>(`/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      invalidateMany(queryClient, ["projects", "dashboard-summary"]);
    }
  });

  const createMember = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<ProjectMemberRow>(`/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] })
  });

  const deleteMember = useMutation({
    mutationFn: (memberId: string) =>
      apiFetch<{ id: string }>(`/projects/${projectId}/members/${memberId}`, {
        method: "DELETE"
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] })
  });

  const createActivity = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<ProjectActivityRow>(`/projects/${projectId}/activities`, {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      invalidateMany(queryClient, ["projects", "dashboard-summary"]);
    }
  });

  const deleteActivity = useMutation({
    mutationFn: (activityId: string) =>
      apiFetch<{ id: string }>(`/projects/${projectId}/activities/${activityId}`, {
        method: "DELETE"
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] })
  });

  const current = project.data;

  return (
    <ModulePage
      actions={
        <Button asChild type="button" variant="outline">
          <Link to="/projects">Back</Link>
        </Button>
      }
      description="Project detail, team members, activity timeline, and progress."
      title={current?.name ?? "Project Detail"}
    >
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Panel title="Edit Project">
          <form
            key={current?.id}
            className="grid gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              updateProject.mutate(projectPayload(new FormData(event.currentTarget)));
            }}
          >
            <ErrorMessage
              message={project.error?.message ?? updateProject.error?.message}
            />
            <ProjectFields clients={clients.data} project={current} users={users.data} />
            <SubmitButton isLoading={updateProject.isPending}>Save Project</SubmitButton>
          </form>
        </Panel>

        <div className="grid gap-6">
          <Panel title="Members">
            <form
              className="grid gap-4 border-b p-4 md:grid-cols-[1fr_12rem_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const formElement = event.currentTarget;
                createMember.mutate(
                  {
                    user_id: form.get("user_id"),
                    role_in_project: form.get("role_in_project"),
                    assigned_at: todayString(),
                    is_active: true
                  },
                  { onSuccess: () => formElement.reset() }
                );
              }}
            >
              <Field label="User">
                <select className={inputClass} name="user_id" required>
                  <option value="">Select user</option>
                  {(users.data ?? []).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Role">
                <select
                  className={inputClass}
                  defaultValue="CONSULTANT"
                  name="role_in_project"
                >
                  {PROJECT_MEMBER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end">
                <SubmitButton isLoading={createMember.isPending}>Add</SubmitButton>
              </div>
            </form>
            <ErrorMessage
              message={createMember.error?.message ?? deleteMember.error?.message}
            />
            <SimpleRows
              emptyLabel="No members yet"
              rows={(current?.members ?? []).map((member) => ({
                id: member.id,
                title: member.user_name ?? member.user_id,
                meta: `${member.role_in_project} · ${member.is_active ? "Active" : "Inactive"}`,
                confirm: "Delete this project member?"
              }))}
              onDelete={(id) => deleteMember.mutate(id)}
            />
          </Panel>

          <Panel title="Activities">
            <form
              className="grid gap-4 border-b p-4 lg:grid-cols-[11rem_10rem_1fr_8rem_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const formElement = event.currentTarget;
                createActivity.mutate(
                  {
                    activity_type: form.get("activity_type"),
                    activity_date: form.get("activity_date"),
                    notes: form.get("notes"),
                    next_action: emptyToUndefined(form.get("next_action")),
                    progress_snapshot: numberValue(form.get("progress_snapshot"))
                  },
                  { onSuccess: () => formElement.reset() }
                );
              }}
            >
              <Field label="Type">
                <select
                  className={inputClass}
                  defaultValue="MEETING"
                  name="activity_type"
                >
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
              <Field label="Progress">
                <input
                  className={inputClass}
                  max="100"
                  min="0"
                  name="progress_snapshot"
                  type="number"
                />
              </Field>
              <div className="flex items-end">
                <SubmitButton isLoading={createActivity.isPending}>Add</SubmitButton>
              </div>
            </form>
            <ErrorMessage
              message={createActivity.error?.message ?? deleteActivity.error?.message}
            />
            <SimpleRows
              emptyLabel="No activities yet"
              rows={(current?.activities ?? []).map((activity) => ({
                id: activity.id,
                title: activity.notes,
                meta: `${activity.activity_date} · ${activity.activity_type} · ${
                  activity.progress_snapshot ?? "-"
                }%`,
                confirm: "Delete this project activity?"
              }))}
              onDelete={(id) => deleteActivity.mutate(id)}
            />
          </Panel>
        </div>
      </div>
    </ModulePage>
  );
}

function ProjectFields({
  clients,
  project,
  users
}: {
  clients?: Array<{ id: string; name: string }>;
  project?: ProjectRow;
  users?: Array<{ id: string; name: string }>;
}) {
  return (
    <>
      <Field label="Client">
        <select
          className={inputClass}
          defaultValue={project?.client_id ?? ""}
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
      <Field label="Project Name">
        <input
          className={inputClass}
          defaultValue={project?.name ?? ""}
          name="name"
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service">
          <input
            className={inputClass}
            defaultValue={project?.service_type ?? ""}
            name="service_type"
          />
        </Field>
        <Field label="Contract Value">
          <input
            className={inputClass}
            defaultValue={project?.contract_value ?? ""}
            min="0"
            name="contract_value"
            required
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="PIC">
          <select
            className={inputClass}
            defaultValue={project?.pic_user_id ?? ""}
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
            defaultValue={project?.status ?? "NOT_STARTED"}
            name="status"
          >
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
            defaultValue={project?.progress_percentage ?? 0}
            max="100"
            min="0"
            name="progress_percentage"
            type="number"
          />
        </Field>
        <Field label="Deadline">
          <input
            className={inputClass}
            defaultValue={project?.deadline ?? ""}
            name="deadline"
            type="date"
          />
        </Field>
      </div>
      <Field label="Next Action">
        <textarea
          className={textareaClass}
          defaultValue={project?.next_action ?? ""}
          name="next_action"
        />
      </Field>
    </>
  );
}

function SimpleRows({
  emptyLabel,
  rows,
  onDelete
}: {
  emptyLabel: string;
  rows: Array<{ id: string; title: string; meta: string; confirm: string }>;
  onDelete: (id: string) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState label={emptyLabel} />;
  }

  return (
    <div className="divide-y">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{row.title}</p>
            <p className="truncate text-muted-foreground">{row.meta}</p>
          </div>
          <DeleteButton confirmLabel={row.confirm} onClick={() => onDelete(row.id)} />
        </div>
      ))}
    </div>
  );
}

function projectPayload(form: FormData) {
  return {
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
  };
}
