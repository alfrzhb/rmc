import { Hono, type Context } from "hono";
import {
  opportunityCreateSchema,
  opportunityListQuerySchema,
  opportunityLogCreateSchema,
  opportunityLogUpdateSchema,
  opportunityUpdateSchema
} from "@ratama/validation";
import type { AppEnv } from "../env";
import { writeAuditLog } from "../lib/audit";
import { getDatabase } from "../lib/database";

type OpportunityRow = {
  id: string;
  client_id: string;
  client_name?: string;
  name: string;
  service_type: string | null;
  estimated_value: number | null;
  initial_offer_amount: number | null;
  revised_offer_amount: number | null;
  deal_amount: number | null;
  deal_date: string | null;
  payment_scheme: string | null;
  pic_user_id: string;
  pic_user_name?: string;
  status: string;
  source: string | null;
  proposal_sent_date: string | null;
  next_follow_up_date: string | null;
  notes: string | null;
  lost_reason: string | null;
  on_hold_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type OpportunityLogRow = {
  id: string;
  opportunity_id: string;
  user_id: string;
  user_name?: string;
  activity_type: string;
  activity_date: string;
  notes: string;
  next_action: string | null;
  next_follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const opportunitiesRoute = new Hono<AppEnv>();

opportunitiesRoute.get("/", async (c) => {
  const query = opportunityListQuerySchema.safeParse({
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

  const filters = ["o.deleted_at IS NULL"];
  const bindings: Array<number | string> = [];

  if (query.data.search) {
    filters.push("(o.name LIKE ? OR c.name LIKE ? OR o.service_type LIKE ?)");
    const search = `%${query.data.search}%`;
    bindings.push(search, search, search);
  }

  if (query.data.client_id) {
    filters.push("o.client_id = ?");
    bindings.push(query.data.client_id);
  }

  if (query.data.pic_user_id) {
    filters.push("o.pic_user_id = ?");
    bindings.push(query.data.pic_user_id);
  }

  if (query.data.status) {
    filters.push("o.status = ?");
    bindings.push(query.data.status);
  }

  const where = filters.join(" AND ");
  const total = await getDatabase(c.env)
    .prepare(
      `SELECT COUNT(*) AS total
       FROM opportunities o
       LEFT JOIN clients c ON c.id = o.client_id
       WHERE ${where}`
    )
    .bind(...bindings)
    .first<{ total: number }>();

  const offset = (query.data.page - 1) * query.data.pageSize;
  const rows = await getDatabase(c.env)
    .prepare(
      `SELECT
         o.id,
         o.client_id,
         c.name AS client_name,
         o.name,
         o.service_type,
         o.estimated_value,
         o.initial_offer_amount,
         o.revised_offer_amount,
         o.deal_amount,
         o.deal_date,
         o.payment_scheme,
         o.pic_user_id,
         u.name AS pic_user_name,
         o.status,
         o.source,
         o.proposal_sent_date,
         o.next_follow_up_date,
         o.notes,
         o.lost_reason,
         o.on_hold_reason,
         o.created_at,
         o.updated_at,
         o.deleted_at
       FROM opportunities o
       LEFT JOIN clients c ON c.id = o.client_id
       LEFT JOIN users u ON u.id = o.pic_user_id
       WHERE ${where}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(...bindings, query.data.pageSize, offset)
    .all<OpportunityRow>();

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

opportunitiesRoute.get("/:id", async (c) => {
  const opportunity = await findOpportunity(c, c.req.param("id"));

  if (!opportunity) {
    return opportunityNotFound(c);
  }

  return c.json({
    success: true,
    data: {
      ...opportunity,
      logs: await listLogs(c, opportunity.id)
    }
  });
});

opportunitiesRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const input = opportunityCreateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const linked = await validateClientAndPic(c, input.data.client_id, input.data.pic_user_id);

  if (linked) {
    return linked;
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await getDatabase(c.env)
    .prepare(
      `INSERT INTO opportunities (
        id,
        client_id,
        name,
        service_type,
        estimated_value,
        initial_offer_amount,
        revised_offer_amount,
        deal_amount,
        deal_date,
        payment_scheme,
        pic_user_id,
        status,
        source,
        proposal_sent_date,
        next_follow_up_date,
        notes,
        lost_reason,
        on_hold_reason,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.data.client_id,
      input.data.name,
      input.data.service_type ?? null,
      input.data.estimated_value ?? null,
      input.data.initial_offer_amount ?? null,
      input.data.revised_offer_amount ?? null,
      input.data.deal_amount ?? null,
      input.data.deal_date ?? null,
      input.data.payment_scheme ?? null,
      input.data.pic_user_id,
      input.data.status,
      input.data.source ?? null,
      input.data.proposal_sent_date ?? null,
      input.data.next_follow_up_date ?? null,
      input.data.notes ?? null,
      input.data.lost_reason ?? null,
      input.data.on_hold_reason ?? null,
      now,
      now
    )
    .run();

  const created = await findOpportunity(c, id);

  await writeAuditLog(c, {
    entityType: "OPPORTUNITY",
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

opportunitiesRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findOpportunity(c, id);

  if (!existing) {
    return opportunityNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = opportunityUpdateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const nextClientId = input.data.client_id ?? existing.client_id;
  const nextPicUserId = input.data.pic_user_id ?? existing.pic_user_id;
  const linked = await validateClientAndPic(c, nextClientId, nextPicUserId);

  if (linked) {
    return linked;
  }

  const nextStatus = input.data.status ?? existing.status;
  const nextDealAmount = input.data.deal_amount ?? existing.deal_amount;

  if (nextStatus === "WON" && nextDealAmount === null) {
    return validationError(c, {
      formErrors: ["Won opportunities require deal_amount."],
      fieldErrors: {
        deal_amount: ["Required when status is WON."]
      }
    });
  }

  await getDatabase(c.env)
    .prepare(
      `UPDATE opportunities
       SET client_id = ?,
           name = ?,
           service_type = ?,
           estimated_value = ?,
           initial_offer_amount = ?,
           revised_offer_amount = ?,
           deal_amount = ?,
           deal_date = ?,
           payment_scheme = ?,
           pic_user_id = ?,
           status = ?,
           source = ?,
           proposal_sent_date = ?,
           next_follow_up_date = ?,
           notes = ?,
           lost_reason = ?,
           on_hold_reason = ?,
           updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(
      nextClientId,
      input.data.name ?? existing.name,
      input.data.service_type ?? existing.service_type,
      input.data.estimated_value ?? existing.estimated_value,
      input.data.initial_offer_amount ?? existing.initial_offer_amount,
      input.data.revised_offer_amount ?? existing.revised_offer_amount,
      nextDealAmount,
      input.data.deal_date ?? existing.deal_date,
      input.data.payment_scheme ?? existing.payment_scheme,
      nextPicUserId,
      nextStatus,
      input.data.source ?? existing.source,
      input.data.proposal_sent_date ?? existing.proposal_sent_date,
      input.data.next_follow_up_date ?? existing.next_follow_up_date,
      input.data.notes ?? existing.notes,
      input.data.lost_reason ?? existing.lost_reason,
      input.data.on_hold_reason ?? existing.on_hold_reason,
      new Date().toISOString(),
      id
    )
    .run();

  const updated = await findOpportunity(c, id);

  await writeAuditLog(c, {
    entityType: "OPPORTUNITY",
    entityId: id,
    action: existing.status !== updated?.status ? "TRANSITION" : "UPDATE",
    oldValue: existing,
    newValue: updated
  });

  return c.json({
    success: true,
    data: updated
  });
});

opportunitiesRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findOpportunity(c, id);

  if (!existing) {
    return opportunityNotFound(c);
  }

  const now = new Date().toISOString();
  const db = getDatabase(c.env);

  await db
    .prepare("UPDATE opportunities SET deleted_at = ?, updated_at = ? WHERE id = ?")
    .bind(now, now, id)
    .run();

  await writeAuditLog(c, {
    entityType: "OPPORTUNITY",
    entityId: id,
    action: "DELETE",
    oldValue: existing,
    newValue: {
      id,
      deleted_at: now
    }
  });

  await db
    .prepare(
      "UPDATE opportunity_logs SET deleted_at = ?, updated_at = ? WHERE opportunity_id = ?"
    )
    .bind(now, now, id)
    .run();

  return c.json({
    success: true,
    data: {
      id
    }
  });
});

opportunitiesRoute.get("/:opportunityId/logs", async (c) => {
  const opportunity = await findOpportunity(c, c.req.param("opportunityId"));

  if (!opportunity) {
    return opportunityNotFound(c);
  }

  return c.json({
    success: true,
    data: await listLogs(c, opportunity.id)
  });
});

opportunitiesRoute.post("/:opportunityId/logs", async (c) => {
  const opportunity = await findOpportunity(c, c.req.param("opportunityId"));

  if (!opportunity) {
    return opportunityNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = opportunityLogCreateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await getDatabase(c.env)
    .prepare(
      `INSERT INTO opportunity_logs (
        id,
        opportunity_id,
        user_id,
        activity_type,
        activity_date,
        notes,
        next_action,
        next_follow_up_date,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      opportunity.id,
      c.get("currentUser").id,
      input.data.activity_type,
      input.data.activity_date,
      input.data.notes,
      input.data.next_action ?? null,
      input.data.next_follow_up_date ?? null,
      now,
      now
    )
    .run();

  const created = await findLog(c, opportunity.id, id);

  await writeAuditLog(c, {
    entityType: "OPPORTUNITY_LOG",
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

opportunitiesRoute.get("/:opportunityId/logs/:logId", async (c) => {
  const log = await findLog(c, c.req.param("opportunityId"), c.req.param("logId"));

  if (!log) {
    return logNotFound(c);
  }

  return c.json({
    success: true,
    data: log
  });
});

opportunitiesRoute.put("/:opportunityId/logs/:logId", async (c) => {
  const opportunity = await findOpportunity(c, c.req.param("opportunityId"));

  if (!opportunity) {
    return opportunityNotFound(c);
  }

  const logId = c.req.param("logId");
  const existing = await findLog(c, opportunity.id, logId);

  if (!existing) {
    return logNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = opportunityLogUpdateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  await getDatabase(c.env)
    .prepare(
      `UPDATE opportunity_logs
       SET activity_type = ?,
           activity_date = ?,
           notes = ?,
           next_action = ?,
           next_follow_up_date = ?,
           updated_at = ?
       WHERE id = ? AND opportunity_id = ? AND deleted_at IS NULL`
    )
    .bind(
      input.data.activity_type ?? existing.activity_type,
      input.data.activity_date ?? existing.activity_date,
      input.data.notes ?? existing.notes,
      input.data.next_action ?? existing.next_action,
      input.data.next_follow_up_date ?? existing.next_follow_up_date,
      new Date().toISOString(),
      logId,
      opportunity.id
    )
    .run();

  const updated = await findLog(c, opportunity.id, logId);

  await writeAuditLog(c, {
    entityType: "OPPORTUNITY_LOG",
    entityId: logId,
    action: "UPDATE",
    oldValue: existing,
    newValue: updated
  });

  return c.json({
    success: true,
    data: updated
  });
});

opportunitiesRoute.delete("/:opportunityId/logs/:logId", async (c) => {
  const log = await findLog(c, c.req.param("opportunityId"), c.req.param("logId"));

  if (!log) {
    return logNotFound(c);
  }

  const now = new Date().toISOString();

  await getDatabase(c.env)
    .prepare(
      "UPDATE opportunity_logs SET deleted_at = ?, updated_at = ? WHERE id = ? AND opportunity_id = ?"
    )
    .bind(now, now, log.id, log.opportunity_id)
    .run();

  await writeAuditLog(c, {
    entityType: "OPPORTUNITY_LOG",
    entityId: log.id,
    action: "DELETE",
    oldValue: log,
    newValue: {
      id: log.id,
      deleted_at: now
    }
  });

  return c.json({
    success: true,
    data: {
      id: log.id
    }
  });
});

async function findOpportunity(c: Context<AppEnv>, id: string) {
  return getDatabase(c.env)
    .prepare(
      `SELECT
         o.id,
         o.client_id,
         c.name AS client_name,
         o.name,
         o.service_type,
         o.estimated_value,
         o.initial_offer_amount,
         o.revised_offer_amount,
         o.deal_amount,
         o.deal_date,
         o.payment_scheme,
         o.pic_user_id,
         u.name AS pic_user_name,
         o.status,
         o.source,
         o.proposal_sent_date,
         o.next_follow_up_date,
         o.notes,
         o.lost_reason,
         o.on_hold_reason,
         o.created_at,
         o.updated_at,
         o.deleted_at
       FROM opportunities o
       LEFT JOIN clients c ON c.id = o.client_id
       LEFT JOIN users u ON u.id = o.pic_user_id
       WHERE o.id = ? AND o.deleted_at IS NULL`
    )
    .bind(id)
    .first<OpportunityRow>();
}

async function listLogs(c: Context<AppEnv>, opportunityId: string) {
  const rows = await getDatabase(c.env)
    .prepare(
      `SELECT
         l.id,
         l.opportunity_id,
         l.user_id,
         u.name AS user_name,
         l.activity_type,
         l.activity_date,
         l.notes,
         l.next_action,
         l.next_follow_up_date,
         l.created_at,
         l.updated_at,
         l.deleted_at
       FROM opportunity_logs l
       LEFT JOIN users u ON u.id = l.user_id
       WHERE l.opportunity_id = ? AND l.deleted_at IS NULL
       ORDER BY l.activity_date DESC, l.created_at DESC`
    )
    .bind(opportunityId)
    .all<OpportunityLogRow>();

  return rows.results;
}

async function findLog(c: Context<AppEnv>, opportunityId: string, logId: string) {
  return getDatabase(c.env)
    .prepare(
      `SELECT
         l.id,
         l.opportunity_id,
         l.user_id,
         u.name AS user_name,
         l.activity_type,
         l.activity_date,
         l.notes,
         l.next_action,
         l.next_follow_up_date,
         l.created_at,
         l.updated_at,
         l.deleted_at
       FROM opportunity_logs l
       LEFT JOIN users u ON u.id = l.user_id
       WHERE l.id = ? AND l.opportunity_id = ? AND l.deleted_at IS NULL`
    )
    .bind(logId, opportunityId)
    .first<OpportunityLogRow>();
}

async function validateClientAndPic(c: Context<AppEnv>, clientId: string, picUserId: string) {
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

  const picUser = await getDatabase(c.env)
    .prepare(
      "SELECT id FROM users WHERE id = ? AND status = 'ACTIVE' AND deleted_at IS NULL"
    )
    .bind(picUserId)
    .first<{ id: string }>();

  if (!picUser) {
    return c.json(
      {
        success: false,
        error: {
          code: "PIC_USER_NOT_FOUND",
          message: "PIC user not found or inactive."
        }
      },
      404
    );
  }

  return null;
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

function opportunityNotFound(c: Context<AppEnv>) {
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

function logNotFound(c: Context<AppEnv>) {
  return c.json(
    {
      success: false,
      error: {
        code: "OPPORTUNITY_LOG_NOT_FOUND",
        message: "Opportunity log not found."
      }
    },
    404
  );
}
