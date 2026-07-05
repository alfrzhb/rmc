import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import type { UserRole, UserStatus } from "@ratama/shared";
import { Button } from "@/components/ui/button";
import {
  DeleteButton,
  EmptyState,
  ErrorMessage,
  Field,
  inputClass,
  ModulePage,
  Panel,
  SubmitButton
} from "@/components/module-ui";
import { apiFetch } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { emptyToUndefined } from "@/lib/form";
import { invalidateMany } from "@/lib/mutations";
import { useUsers, type UserOption } from "@/lib/queries";

const MANAGED_ROLES = ["OWNER", "ADMIN", "STAFF"] as const satisfies readonly UserRole[];
const MANAGED_STATUSES = ["ACTIVE", "INACTIVE"] as const satisfies readonly UserStatus[];

type UserFormInput = {
  email: string;
  name: string;
  role: (typeof MANAGED_ROLES)[number];
  status: (typeof MANAGED_STATUSES)[number];
};

export function SettingsPage() {
  const currentUser = useCurrentUser();
  const canManageUsers =
    currentUser.data?.role === "OWNER" || currentUser.data?.role === "ADMIN";

  return (
    <ModulePage
      description="Users, roles, and application access for Ratama operations."
      title="Settings"
    >
      {currentUser.isLoading ? (
        <Panel>
          <div className="p-4 text-sm text-muted-foreground">Loading access...</div>
        </Panel>
      ) : canManageUsers ? (
        <UsersManagement currentUserId={currentUser.data?.id} />
      ) : (
        <Panel>
          <div className="flex items-start gap-3 p-4 text-sm">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Users Management is restricted.</p>
              <p className="mt-1 text-muted-foreground">
                Only OWNER and ADMIN users can manage application users.
              </p>
            </div>
          </div>
        </Panel>
      )}
    </ModulePage>
  );
}

function UsersManagement({ currentUserId }: { currentUserId?: string }) {
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const users = useUsers();

  const editingUser = useMemo(
    () => users.data?.find((user) => user.id === editingUserId) ?? null,
    [editingUserId, users.data]
  );

  const createUser = useMutation({
    mutationFn: (body: UserFormInput) =>
      apiFetch<UserOption>("/users", {
        method: "POST",
        body: JSON.stringify(body)
      }),
    onSuccess: () => invalidateMany(queryClient, ["users"])
  });

  const updateUser = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UserFormInput }) =>
      apiFetch<UserOption>(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(body)
      }),
    onSuccess: () => invalidateMany(queryClient, ["users", "current-user"])
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/users/${id}`, {
        method: "DELETE"
      }),
    onSuccess: (_, id) => {
      if (editingUserId === id) {
        setEditingUserId(null);
      }
      invalidateMany(queryClient, ["users", "current-user"]);
    }
  });

  const deactivateUser = useMutation({
    mutationFn: (user: UserOption) =>
      apiFetch<UserOption>(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          role: normalizeManagedRole(user.role),
          status: "INACTIVE"
        })
      }),
    onSuccess: () => invalidateMany(queryClient, ["users", "current-user"])
  });

  const formError =
    createUser.error?.message ??
    updateUser.error?.message ??
    deleteUser.error?.message ??
    deactivateUser.error?.message ??
    users.error?.message;

  return (
    <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
      <Panel title={editingUser ? "Edit User" : "New User"}>
        <form
          key={editingUser?.id ?? "new-user"}
          className="grid gap-4 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const formElement = event.currentTarget;
            const body = formToUserInput(form);

            if (editingUser) {
              updateUser.mutate(
                { id: editingUser.id, body },
                { onSuccess: () => setEditingUserId(null) }
              );
              return;
            }

            createUser.mutate(body, { onSuccess: () => formElement.reset() });
          }}
        >
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Login menggunakan Cloudflare Access. User tetap harus didaftarkan di
            aplikasi agar bisa masuk sesuai role.
          </div>
          <ErrorMessage message={formError} />
          <Field label="Email">
            <input
              className={inputClass}
              defaultValue={editingUser?.email ?? ""}
              name="email"
              required
              type="email"
            />
          </Field>
          <Field label="Name">
            <input
              className={inputClass}
              defaultValue={editingUser?.name ?? ""}
              name="name"
              placeholder="Nama asli atau placeholder"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <select
                className={inputClass}
                defaultValue={normalizeManagedRole(editingUser?.role)}
                name="role"
              >
                {MANAGED_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                defaultValue={normalizeManagedStatus(editingUser?.status)}
                name="status"
              >
                {MANAGED_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SubmitButton isLoading={createUser.isPending || updateUser.isPending}>
              {editingUser ? "Save User" : "Create User"}
            </SubmitButton>
            {editingUser ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUserId(null)}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Panel>

      <Panel title="Users Management">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="w-52 px-4 py-3" />
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {(users.data ?? []).map((user) => {
                const isSelf = user.id === currentUserId;

                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">{user.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(user.last_login_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => setEditingUserId(user.id)}
                        >
                          Edit
                        </Button>
                        {user.status !== "INACTIVE" ? (
                          <Button
                            disabled={deactivateUser.isPending || isSelf}
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (window.confirm(`Deactivate user ${user.email}?`)) {
                                deactivateUser.mutate(user);
                              }
                            }}
                          >
                            Deactivate
                          </Button>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DeleteButton
                        confirmLabel={`Delete user ${user.email}?`}
                        disabled={deleteUser.isPending || isSelf}
                        onClick={() => deleteUser.mutate(user.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!users.data?.length ? <EmptyState label="No users yet" /> : null}
        </div>
      </Panel>
    </div>
  );
}

function formToUserInput(form: FormData): UserFormInput {
  return {
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    name: emptyToUndefined(form.get("name")) ?? "Pending Name",
    role: normalizeManagedRole(String(form.get("role") ?? "")),
    status: normalizeManagedStatus(String(form.get("status") ?? ""))
  };
}

function normalizeManagedRole(role?: string): UserFormInput["role"] {
  return MANAGED_ROLES.includes(role as UserFormInput["role"])
    ? (role as UserFormInput["role"])
    : "STAFF";
}

function normalizeManagedStatus(status?: string): UserFormInput["status"] {
  return MANAGED_STATUSES.includes(status as UserFormInput["status"])
    ? (status as UserFormInput["status"])
    : "ACTIVE";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString();
}
