import { Hono, type Context } from "hono";
import { auditLogListQuerySchema } from "@ratama/validation";
import type { AppEnv } from "../env";
import { getDatabase } from "../lib/database";

type AuditLogRow = {
  id: string;
  actor_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export const auditLogsRoute = new Hono<AppEnv>();

auditLogsRoute.get("/", async (c) => {
  const query = auditLogListQuerySchema.safeParse({
    actor_user_id: c.req.query("actor_user_id"),
    entity_type: c.req.query("entity_type"),
    entity_id: c.req.query("entity_id"),
    action: c.req.query("action"),
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize")
  });

  if (!query.success) {
    return validationError(c, query.error.flatten());
  }

  const filters: string[] = [];
  const bindings: Array<number | string> = [];

  for (const key of ["actor_user_id", "entity_type", "entity_id", "action"] as const) {
    if (query.data[key]) {
      filters.push(`al.${key} = ?`);
      bindings.push(query.data[key]);
    }
  }

  const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
  const db = getDatabase(c.env);
  const total = await db
    .prepare(`SELECT COUNT(*) AS total FROM audit_logs al ${where}`)
    .bind(...bindings)
    .first<{ total: number }>();

  const offset = (query.data.page - 1) * query.data.pageSize;
  const rows = await db
    .prepare(
      `SELECT
         al.id,
         al.actor_user_id,
         u.name AS actor_name,
         u.email AS actor_email,
         al.entity_type,
         al.entity_id,
         al.action,
         al.old_value,
         al.new_value,
         al.ip_address,
         al.user_agent,
         al.created_at
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(...bindings, query.data.pageSize, offset)
    .all<AuditLogRow>();

  return c.json({
    success: true,
    data: rows.results.map(toAuditLogResponse),
    meta: {
      page: query.data.page,
      pageSize: query.data.pageSize,
      total: total?.total ?? 0
    }
  });
});

function toAuditLogResponse(row: AuditLogRow) {
  return {
    ...row,
    old_value: parseAuditValue(row.old_value),
    new_value: parseAuditValue(row.new_value)
  };
}

function parseAuditValue(value: string | null) {
  if (!value) {
    return null;
  }

  return JSON.parse(value) as unknown;
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
