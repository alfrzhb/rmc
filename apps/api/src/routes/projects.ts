import { Hono, type Context } from "hono";
import {
  projectActivityCreateSchema,
  projectActivityUpdateSchema,
  projectCreateSchema,
  projectListQuerySchema,
  projectMemberCreateSchema,
  projectMemberUpdateSchema,
  projectUpdateSchema
} from "@ratama/validation";
import type { AppEnv } from "../env";
import { writeAuditLog } from "../lib/audit";
import { getDatabase } from "../lib/database";

type ProjectRow = {
  id: string;
  client_id: string;
  client_name?: string;
  opportunity_id: string | null;
  opportunity_name?: string | null;
  name: string;
  service_type: string | null;
  contract_value: number;
  pic_user_id: string;
  pic_user_name?: string;
  status: string;
  progress_percentage: number;
  start_date: string | null;
  deadline: string | null;
  completed_at: string | null;
  closed_at: string | null;
  next_action: string | null;
  next_follow_up_date: string | null;
  blocker_notes: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ProjectMemberRow = {
  id: string;
  project_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  role_in_project: string;
  assigned_at: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ProjectMemberResponse = Omit<ProjectMemberRow, "is_active"> & {
  is_active: boolean;
};

type ProjectActivityRow = {
  id: string;
  project_id: string;
  user_id: string;
  user_name?: string;
  activity_type: string;
  activity_date: string;
  notes: string;
  next_action: string | null;
  next_follow_up_date: string | null;
  progress_snapshot: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const projectsRoute = new Hono<AppEnv>();

projectsRoute.get("/", async (c) => {
  const query = projectListQuerySchema.safeParse({
    search: c.req.query("search"),
    client_id: c.req.query("client_id"),
    pic_user_id: c.req.query("pic_user_id"),
    status: c.req.query("status"),
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize")
  });

  if (!query.success) {
    return validationError(c, query.error.flatten());
  }

  const filters = ["p.deleted_at IS NULL"];
  const bindings: Array<number | string> = [];

  if (query.data.search) {
    filters.push("(p.name LIKE ? OR c.name LIKE ? OR p.service_type LIKE ?)");
    const search = `%${query.data.search}%`;
    bindings.push(search, search, search);
  }

  if (query.data.client_id) {
    filters.push("p.client_id = ?");
    bindings.push(query.data.client_id);
  }

  if (query.data.pic_user_id) {
    filters.push("p.pic_user_id = ?");
    bindings.push(query.data.pic_user_id);
  }

  if (query.data.status) {
    filters.push("p.status = ?");
    bindings.push(query.data.status);
  }

  const where = filters.join(" AND ");
  const total = await getDatabase(c.env)
    .prepare(
      `SELECT COUNT(*) AS total
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE ${where}`
    )
    .bind(...bindings)
    .first<{ total: number }>();

  const offset = (query.data.page - 1) * query.data.pageSize;
  const rows = await getDatabase(c.env)
    .prepare(
      `SELECT
         p.id,
         p.client_id,
         c.name AS client_name,
         p.opportunity_id,
         o.name AS opportunity_name,
         p.name,
         p.service_type,
         p.contract_value,
         p.pic_user_id,
         u.name AS pic_user_name,
         p.status,
         p.progress_percentage,
         p.start_date,
         p.deadline,
         p.completed_at,
         p.closed_at,
         p.next_action,
         p.next_follow_up_date,
         p.blocker_notes,
         p.cancelled_at,
         p.cancel_reason,
         p.created_at,
         p.updated_at,
         p.deleted_at
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       LEFT JOIN opportunities o ON o.id = p.opportunity_id
       LEFT JOIN users u ON u.id = p.pic_user_id
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(...bindings, query.data.pageSize, offset)
    .all<ProjectRow>();

  return c.json({
    success: true,
    data: rows.results,
    meta: {
      page: query.data.page,
      pageSize: query.data.pageSize,
      total: total?.total ?? 0
    }
  });
});

projectsRoute.get("/:id", async (c) => {
  const project = await findProject(c, c.req.param("id"));

  if (!project) {
    return projectNotFound(c);
  }

  return c.json({
    success: true,
    data: {
      ...project,
      members: await listMembers(c, project.id),
      activities: await listActivities(c, project.id)
    }
  });
});

projectsRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const input = projectCreateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const linked = await validateClientOpportunityAndPic(
    c,
    input.data.client_id,
    input.data.pic_user_id,
    input.data.opportunity_id
  );

  if (linked) {
    return linked;
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  try {
    await getDatabase(c.env)
      .prepare(
        `INSERT INTO projects (
          id,
          client_id,
          opportunity_id,
          name,
          service_type,
          contract_value,
          pic_user_id,
          status,
          progress_percentage,
          start_date,
          deadline,
          completed_at,
          closed_at,
          next_action,
          next_follow_up_date,
          blocker_notes,
          cancelled_at,
          cancel_reason,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        input.data.client_id,
        input.data.opportunity_id ?? null,
        input.data.name,
        input.data.service_type ?? null,
        input.data.contract_value,
        input.data.pic_user_id,
        input.data.status,
        input.data.progress_percentage,
        input.data.start_date ?? null,
        input.data.deadline ?? null,
        input.data.completed_at ?? null,
        input.data.closed_at ?? null,
        input.data.next_action ?? null,
        input.data.next_follow_up_date ?? null,
        input.data.blocker_notes ?? null,
        input.data.cancelled_at ?? null,
        input.data.cancel_reason ?? null,
        now,
        now
      )
      .run();
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: "PROJECT_OPPORTUNITY_EXISTS",
          message: "A project already exists for this opportunity."
        }
      },
      409
    );
  }

  const created = await findProject(c, id);

  await writeAuditLog(c, {
    entityType: "PROJECT",
    entityId: id,
    action: "CREATE",
    newValue: created
  });

  return c.json(
    {
      success: true,
      data: created
    },
    201
  );
});

projectsRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findProject(c, id);

  if (!existing) {
    return projectNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = projectUpdateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const nextClientId = input.data.client_id ?? existing.client_id;
  const nextPicUserId = input.data.pic_user_id ?? existing.pic_user_id;
  const nextOpportunityId =
    input.data.opportunity_id === undefined
      ? existing.opportunity_id ?? undefined
      : input.data.opportunity_id;

  const linked = await validateClientOpportunityAndPic(
    c,
    nextClientId,
    nextPicUserId,
    nextOpportunityId
  );

  if (linked) {
    return linked;
  }

  try {
    await getDatabase(c.env)
      .prepare(
        `UPDATE projects
         SET client_id = ?,
             opportunity_id = ?,
             name = ?,
             service_type = ?,
             contract_value = ?,
             pic_user_id = ?,
             status = ?,
             progress_percentage = ?,
             start_date = ?,
             deadline = ?,
             completed_at = ?,
             closed_at = ?,
             next_action = ?,
             next_follow_up_date = ?,
             blocker_notes = ?,
             cancelled_at = ?,
             cancel_reason = ?,
             updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`
      )
      .bind(
        nextClientId,
        nextOpportunityId ?? null,
        input.data.name ?? existing.name,
        input.data.service_type ?? existing.service_type,
        input.data.contract_value ?? existing.contract_value,
        nextPicUserId,
        input.data.status ?? existing.status,
        input.data.progress_percentage ?? existing.progress_percentage,
        input.data.start_date ?? existing.start_date,
        input.data.deadline ?? existing.deadline,
        input.data.completed_at ?? existing.completed_at,
        input.data.closed_at ?? existing.closed_at,
        input.data.next_action ?? existing.next_action,
        input.data.next_follow_up_date ?? existing.next_follow_up_date,
        input.data.blocker_notes ?? existing.blocker_notes,
        input.data.cancelled_at ?? existing.cancelled_at,
        input.data.cancel_reason ?? existing.cancel_reason,
        new Date().toISOString(),
        id
      )
      .run();
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: "PROJECT_OPPORTUNITY_EXISTS",
          message: "A project already exists for this opportunity."
        }
      },
      409
    );
  }

  const updated = await findProject(c, id);

  await writeAuditLog(c, {
    entityType: "PROJECT",
    entityId: id,
    action:
      existing.status !== updated?.status ||
      existing.progress_percentage !== updated?.progress_percentage
        ? "TRANSITION"
        : "UPDATE",
    oldValue: existing,
    newValue: updated
  });

  return c.json({
    success: true,
    data: updated
  });
});

projectsRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findProject(c, id);

  if (!existing) {
    return projectNotFound(c);
  }

  const now = new Date().toISOString();
  const db = getDatabase(c.env);

  await db
    .prepare("UPDATE projects SET deleted_at = ?, updated_at = ? WHERE id = ?")
    .bind(now, now, id)
    .run();

  await db
    .prepare("UPDATE project_members SET deleted_at = ?, updated_at = ? WHERE project_id = ?")
    .bind(now, now, id)
    .run();

  await db
    .prepare(
      "UPDATE project_activities SET deleted_at = ?, updated_at = ? WHERE project_id = ?"
    )
    .bind(now, now, id)
    .run();

  await writeAuditLog(c, {
    entityType: "PROJECT",
    entityId: id,
    action: "DELETE",
    oldValue: existing,
    newValue: {
      id,
      deleted_at: now
    }
  });

  return c.json({
    success: true,
    data: {
      id
    }
  });
});

projectsRoute.get("/:projectId/members", async (c) => {
  const project = await findProject(c, c.req.param("projectId"));

  if (!project) {
    return projectNotFound(c);
  }

  return c.json({
    success: true,
    data: await listMembers(c, project.id)
  });
});

projectsRoute.post("/:projectId/members", async (c) => {
  const project = await findProject(c, c.req.param("projectId"));

  if (!project) {
    return projectNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = projectMemberCreateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const userError = await validateActiveUser(c, input.data.user_id);

  if (userError) {
    return userError;
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  try {
    await getDatabase(c.env)
      .prepare(
        `INSERT INTO project_members (
          id,
          project_id,
          user_id,
          role_in_project,
          assigned_at,
          is_active,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        project.id,
        input.data.user_id,
        input.data.role_in_project,
        input.data.assigned_at ?? now,
        input.data.is_active ? 1 : 0,
        now,
        now
      )
      .run();
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: "PROJECT_MEMBER_EXISTS",
          message: "This user is already an active project member."
        }
      },
      409
    );
  }

  const created = await findMember(c, project.id, id);

  await writeAuditLog(c, {
    entityType: "PROJECT_MEMBER",
    entityId: id,
    action: "CREATE",
    newValue: created
  });

  return c.json(
    {
      success: true,
      data: created
    },
    201
  );
});

projectsRoute.get("/:projectId/members/:memberId", async (c) => {
  const member = await findMember(c, c.req.param("projectId"), c.req.param("memberId"));

  if (!member) {
    return memberNotFound(c);
  }

  return c.json({
    success: true,
    data: member
  });
});

projectsRoute.put("/:projectId/members/:memberId", async (c) => {
  const project = await findProject(c, c.req.param("projectId"));

  if (!project) {
    return projectNotFound(c);
  }

  const memberId = c.req.param("memberId");
  const existing = await findMember(c, project.id, memberId);

  if (!existing) {
    return memberNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = projectMemberUpdateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const nextUserId = input.data.user_id ?? existing.user_id;
  const userError = await validateActiveUser(c, nextUserId);

  if (userError) {
    return userError;
  }

  try {
    await getDatabase(c.env)
      .prepare(
        `UPDATE project_members
         SET user_id = ?,
             role_in_project = ?,
             assigned_at = ?,
             is_active = ?,
             updated_at = ?
         WHERE id = ? AND project_id = ? AND deleted_at IS NULL`
      )
      .bind(
        nextUserId,
        input.data.role_in_project ?? existing.role_in_project,
        input.data.assigned_at ?? existing.assigned_at,
        input.data.is_active === undefined
          ? booleanToInteger(existing.is_active)
          : input.data.is_active
            ? 1
            : 0,
        new Date().toISOString(),
        memberId,
        project.id
      )
      .run();
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: "PROJECT_MEMBER_EXISTS",
          message: "This user is already an active project member."
        }
      },
      409
    );
  }

  const updated = await findMember(c, project.id, memberId);

  await writeAuditLog(c, {
    entityType: "PROJECT_MEMBER",
    entityId: memberId,
    action: existing.is_active !== updated?.is_active ? "TRANSITION" : "UPDATE",
    oldValue: existing,
    newValue: updated
  });

  return c.json({
    success: true,
    data: updated
  });
});

projectsRoute.delete("/:projectId/members/:memberId", async (c) => {
  const member = await findMember(c, c.req.param("projectId"), c.req.param("memberId"));

  if (!member) {
    return memberNotFound(c);
  }

  const now = new Date().toISOString();

  await getDatabase(c.env)
    .prepare(
      `UPDATE project_members
       SET is_active = 0, deleted_at = ?, updated_at = ?
       WHERE id = ? AND project_id = ?`
    )
    .bind(now, now, member.id, member.project_id)
    .run();

  await writeAuditLog(c, {
    entityType: "PROJECT_MEMBER",
    entityId: member.id,
    action: "DELETE",
    oldValue: member,
    newValue: {
      id: member.id,
      is_active: false,
      deleted_at: now
    }
  });

  return c.json({
    success: true,
    data: {
      id: member.id
    }
  });
});

projectsRoute.get("/:projectId/activities", async (c) => {
  const project = await findProject(c, c.req.param("projectId"));

  if (!project) {
    return projectNotFound(c);
  }

  return c.json({
    success: true,
    data: await listActivities(c, project.id)
  });
});

projectsRoute.post("/:projectId/activities", async (c) => {
  const project = await findProject(c, c.req.param("projectId"));

  if (!project) {
    return projectNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = projectActivityCreateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = getDatabase(c.env);

  await db
    .prepare(
      `INSERT INTO project_activities (
        id,
        project_id,
        user_id,
        activity_type,
        activity_date,
        notes,
        next_action,
        next_follow_up_date,
        progress_snapshot,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      project.id,
      c.get("currentUser").id,
      input.data.activity_type,
      input.data.activity_date,
      input.data.notes,
      input.data.next_action ?? null,
      input.data.next_follow_up_date ?? null,
      input.data.progress_snapshot ?? null,
      now,
      now
    )
    .run();

  if (input.data.progress_snapshot !== undefined) {
    await updateProjectProgress(db, project.id, input.data.progress_snapshot);
  }

  const created = await findActivity(c, project.id, id);

  await writeAuditLog(c, {
    entityType: "PROJECT_ACTIVITY",
    entityId: id,
    action: input.data.progress_snapshot !== undefined ? "TRANSITION" : "CREATE",
    newValue: created
  });

  return c.json(
    {
      success: true,
      data: created
    },
    201
  );
});

projectsRoute.get("/:projectId/activities/:activityId", async (c) => {
  const activity = await findActivity(
    c,
    c.req.param("projectId"),
    c.req.param("activityId")
  );

  if (!activity) {
    return activityNotFound(c);
  }

  return c.json({
    success: true,
    data: activity
  });
});

projectsRoute.put("/:projectId/activities/:activityId", async (c) => {
  const project = await findProject(c, c.req.param("projectId"));

  if (!project) {
    return projectNotFound(c);
  }

  const activityId = c.req.param("activityId");
  const existing = await findActivity(c, project.id, activityId);

  if (!existing) {
    return activityNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = projectActivityUpdateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const db = getDatabase(c.env);

  await db
    .prepare(
      `UPDATE project_activities
       SET activity_type = ?,
           activity_date = ?,
           notes = ?,
           next_action = ?,
           next_follow_up_date = ?,
           progress_snapshot = ?,
           updated_at = ?
       WHERE id = ? AND project_id = ? AND deleted_at IS NULL`
    )
    .bind(
      input.data.activity_type ?? existing.activity_type,
      input.data.activity_date ?? existing.activity_date,
      input.data.notes ?? existing.notes,
      input.data.next_action ?? existing.next_action,
      input.data.next_follow_up_date ?? existing.next_follow_up_date,
      input.data.progress_snapshot ?? existing.progress_snapshot,
      new Date().toISOString(),
      activityId,
      project.id
    )
    .run();

  if (input.data.progress_snapshot !== undefined) {
    await updateProjectProgress(db, project.id, input.data.progress_snapshot);
  }

  const updated = await findActivity(c, project.id, activityId);

  await writeAuditLog(c, {
    entityType: "PROJECT_ACTIVITY",
    entityId: activityId,
    action:
      input.data.progress_snapshot !== undefined &&
      existing.progress_snapshot !== updated?.progress_snapshot
        ? "TRANSITION"
        : "UPDATE",
    oldValue: existing,
    newValue: updated
  });

  return c.json({
    success: true,
    data: updated
  });
});

projectsRoute.delete("/:projectId/activities/:activityId", async (c) => {
  const activity = await findActivity(
    c,
    c.req.param("projectId"),
    c.req.param("activityId")
  );

  if (!activity) {
    return activityNotFound(c);
  }

  const now = new Date().toISOString();

  await getDatabase(c.env)
    .prepare(
      "UPDATE project_activities SET deleted_at = ?, updated_at = ? WHERE id = ? AND project_id = ?"
    )
    .bind(now, now, activity.id, activity.project_id)
    .run();

  await writeAuditLog(c, {
    entityType: "PROJECT_ACTIVITY",
    entityId: activity.id,
    action: "DELETE",
    oldValue: activity,
    newValue: {
      id: activity.id,
      deleted_at: now
    }
  });

  return c.json({
    success: true,
    data: {
      id: activity.id
    }
  });
});

async function findProject(c: Context<AppEnv>, id: string) {
  return getDatabase(c.env)
    .prepare(
      `SELECT
         p.id,
         p.client_id,
         c.name AS client_name,
         p.opportunity_id,
         o.name AS opportunity_name,
         p.name,
         p.service_type,
         p.contract_value,
         p.pic_user_id,
         u.name AS pic_user_name,
         p.status,
         p.progress_percentage,
         p.start_date,
         p.deadline,
         p.completed_at,
         p.closed_at,
         p.next_action,
         p.next_follow_up_date,
         p.blocker_notes,
         p.cancelled_at,
         p.cancel_reason,
         p.created_at,
         p.updated_at,
         p.deleted_at
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       LEFT JOIN opportunities o ON o.id = p.opportunity_id
       LEFT JOIN users u ON u.id = p.pic_user_id
       WHERE p.id = ? AND p.deleted_at IS NULL`
    )
    .bind(id)
    .first<ProjectRow>();
}

async function listMembers(c: Context<AppEnv>, projectId: string) {
  const rows = await getDatabase(c.env)
    .prepare(
      `SELECT
         m.id,
         m.project_id,
         m.user_id,
         u.name AS user_name,
         u.email AS user_email,
         m.role_in_project,
         m.assigned_at,
         m.is_active,
         m.created_at,
         m.updated_at,
         m.deleted_at
       FROM project_members m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.project_id = ? AND m.deleted_at IS NULL
       ORDER BY m.is_active DESC, m.assigned_at DESC`
    )
    .bind(projectId)
    .all<ProjectMemberRow>();

  return rows.results.map(toMemberResponse);
}

async function findMember(c: Context<AppEnv>, projectId: string, memberId: string) {
  const row = await getDatabase(c.env)
    .prepare(
      `SELECT
         m.id,
         m.project_id,
         m.user_id,
         u.name AS user_name,
         u.email AS user_email,
         m.role_in_project,
         m.assigned_at,
         m.is_active,
         m.created_at,
         m.updated_at,
         m.deleted_at
       FROM project_members m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.id = ? AND m.project_id = ? AND m.deleted_at IS NULL`
    )
    .bind(memberId, projectId)
    .first<ProjectMemberRow>();

  return row ? toMemberResponse(row) : null;
}

async function listActivities(c: Context<AppEnv>, projectId: string) {
  const rows = await getDatabase(c.env)
    .prepare(
      `SELECT
         a.id,
         a.project_id,
         a.user_id,
         u.name AS user_name,
         a.activity_type,
         a.activity_date,
         a.notes,
         a.next_action,
         a.next_follow_up_date,
         a.progress_snapshot,
         a.created_at,
         a.updated_at,
         a.deleted_at
       FROM project_activities a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.project_id = ? AND a.deleted_at IS NULL
       ORDER BY a.activity_date DESC, a.created_at DESC`
    )
    .bind(projectId)
    .all<ProjectActivityRow>();

  return rows.results;
}

async function findActivity(c: Context<AppEnv>, projectId: string, activityId: string) {
  return getDatabase(c.env)
    .prepare(
      `SELECT
         a.id,
         a.project_id,
         a.user_id,
         u.name AS user_name,
         a.activity_type,
         a.activity_date,
         a.notes,
         a.next_action,
         a.next_follow_up_date,
         a.progress_snapshot,
         a.created_at,
         a.updated_at,
         a.deleted_at
       FROM project_activities a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.id = ? AND a.project_id = ? AND a.deleted_at IS NULL`
    )
    .bind(activityId, projectId)
    .first<ProjectActivityRow>();
}

async function validateClientOpportunityAndPic(
  c: Context<AppEnv>,
  clientId: string,
  picUserId: string,
  opportunityId?: string
) {
  const client = await getDatabase(c.env)
    .prepare("SELECT id FROM clients WHERE id = ? AND deleted_at IS NULL")
    .bind(clientId)
    .first<{ id: string }>();

  if (!client) {
    return c.json(
      {
        success: false,
        error: {
          code: "CLIENT_NOT_FOUND",
          message: "Client not found."
        }
      },
      404
    );
  }

  const picUserError = await validateActiveUser(c, picUserId);

  if (picUserError) {
    return picUserError;
  }

  if (!opportunityId) {
    return null;
  }

  const opportunity = await getDatabase(c.env)
    .prepare(
      "SELECT id, client_id FROM opportunities WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(opportunityId)
    .first<{ id: string; client_id: string }>();

  if (!opportunity) {
    return c.json(
      {
        success: false,
        error: {
          code: "OPPORTUNITY_NOT_FOUND",
          message: "Opportunity not found."
        }
      },
      404
    );
  }

  if (opportunity.client_id !== clientId) {
    return c.json(
      {
        success: false,
        error: {
          code: "OPPORTUNITY_CLIENT_MISMATCH",
          message: "Opportunity does not belong to the selected client."
        }
      },
      400
    );
  }

  return null;
}

async function validateActiveUser(c: Context<AppEnv>, userId: string) {
  const user = await getDatabase(c.env)
    .prepare(
      "SELECT id FROM users WHERE id = ? AND status = 'ACTIVE' AND deleted_at IS NULL"
    )
    .bind(userId)
    .first<{ id: string }>();

  if (!user) {
    return c.json(
      {
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found or inactive."
        }
      },
      404
    );
  }

  return null;
}

async function updateProjectProgress(db: D1Database, projectId: string, progress: number) {
  await db
    .prepare("UPDATE projects SET progress_percentage = ?, updated_at = ? WHERE id = ?")
    .bind(progress, new Date().toISOString(), projectId)
    .run();
}

function toMemberResponse(row: ProjectMemberRow): ProjectMemberResponse {
  return {
    ...row,
    is_active: row.is_active === 1
  };
}

function booleanToInteger(value: boolean) {
  return value ? 1 : 0;
}

function validationError(c: Context<AppEnv>, details: unknown) {
  return c.json(
    {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details
      }
    },
    400
  );
}

function projectNotFound(c: Context<AppEnv>) {
  return c.json(
    {
      success: false,
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found."
      }
    },
    404
  );
}

function memberNotFound(c: Context<AppEnv>) {
  return c.json(
    {
      success: false,
      error: {
        code: "PROJECT_MEMBER_NOT_FOUND",
        message: "Project member not found."
      }
    },
    404
  );
}

function activityNotFound(c: Context<AppEnv>) {
  return c.json(
    {
      success: false,
      error: {
        code: "PROJECT_ACTIVITY_NOT_FOUND",
        message: "Project activity not found."
      }
    },
    404
  );
}
