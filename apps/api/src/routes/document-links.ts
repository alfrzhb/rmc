import { Hono, type Context } from "hono";
import {
  documentLinkCreateSchema,
  documentLinkListQuerySchema,
  documentLinkUpdateSchema
} from "@ratama/validation";
import type { DocumentKind, DocumentLinkedType, DocumentProvider } from "@ratama/shared";
import type { AppEnv, Bindings } from "../env";
import { writeAuditLog } from "../lib/audit";
import { getDatabase } from "../lib/database";
import { normalizeDocumentUrl } from "../lib/storage";

type DocumentLinkRow = {
  id: string;
  linked_type: DocumentLinkedType;
  linked_id: string;
  document_kind: DocumentKind;
  title: string;
  url: string;
  provider: DocumentProvider | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const linkedEntityTables = {
  CLIENT: "clients",
  OPPORTUNITY: "opportunities",
  OPPORTUNITY_LOG: "opportunity_logs",
  PROJECT: "projects",
  PROJECT_ACTIVITY: "project_activities",
  INVOICE: "invoices",
  PAYMENT: "payments",
  PAYABLE: "payables"
} as const;

export const documentLinksRoute = new Hono<AppEnv>();

documentLinksRoute.get("/", async (c) => {
  const query = documentLinkListQuerySchema.safeParse({
    linked_type: c.req.query("linked_type"),
    linked_id: c.req.query("linked_id")
  });

  if (!query.success) {
    return validationError(c, query.error.flatten());
  }

  if (query.data.linked_type && query.data.linked_id) {
    const canLink = await canAccessLinkedEntity(
      c.env,
      query.data.linked_type,
      query.data.linked_id
    );

    if (!canLink.exists) {
      return linkedEntityNotFound(c);
    }

    if (!canLink.allowed) {
      return forbidden(c);
    }
  }

  const db = getDatabase(c.env);
  const filters = ["deleted_at IS NULL"];
  const bindings: string[] = [];

  if (query.data.linked_type) {
    filters.push("linked_type = ?");
    bindings.push(query.data.linked_type);
  }

  if (query.data.linked_id) {
    filters.push("linked_id = ?");
    bindings.push(query.data.linked_id);
  }

  const rows = await db
    .prepare(
      `SELECT * FROM document_links WHERE ${filters.join(
        " AND "
      )} ORDER BY created_at DESC`
    )
    .bind(...bindings)
    .all<DocumentLinkRow>();

  return c.json({
    success: true,
    data: rows.results
  });
});

documentLinksRoute.get("/:id", async (c) => {
  const documentLink = await findDocumentLink(c.env, c.req.param("id"));

  if (!documentLink) {
    return notFound(c);
  }

  const accessError = await ensureCanAccessDocumentLink(c, documentLink);

  if (accessError) {
    return accessError;
  }

  return c.json({
    success: true,
    data: documentLink
  });
});

documentLinksRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const input = documentLinkCreateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const canLink = await canAccessLinkedEntity(
    c.env,
    input.data.linked_type,
    input.data.linked_id
  );

  if (!canLink.exists) {
    return c.json(
      {
        success: false,
        error: {
          code: "LINKED_ENTITY_NOT_FOUND",
          message: "Linked entity does not exist."
        }
      },
      404
    );
  }

  if (!canLink.allowed) {
    return c.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have access to this linked entity."
        }
      },
      403
    );
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const createdBy = await resolveCreatedBy(c);
  const db = getDatabase(c.env);

  await db
    .prepare(
      `INSERT INTO document_links (
        id,
        linked_type,
        linked_id,
        document_kind,
        title,
        url,
        provider,
        notes,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.data.linked_type,
      input.data.linked_id,
      input.data.document_kind,
      input.data.title,
      normalizeDocumentUrl(input.data.url),
      input.data.provider ?? null,
      input.data.notes ?? null,
      createdBy,
      now,
      now
    )
    .run();

  const created = await findDocumentLink(c.env, id);

  await writeAuditLog(c, {
    entityType: "DOCUMENT_LINK",
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

documentLinksRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findDocumentLink(c.env, id);

  if (!existing) {
    return notFound(c);
  }

  const accessError = await ensureCanAccessDocumentLink(c, existing);

  if (accessError) {
    return accessError;
  }

  const body = await c.req.json().catch(() => null);
  const input = documentLinkUpdateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const nextLinkedType = input.data.linked_type ?? existing.linked_type;
  const nextLinkedId = input.data.linked_id ?? existing.linked_id;

  if (input.data.linked_type || input.data.linked_id) {
    const canLink = await canAccessLinkedEntity(c.env, nextLinkedType, nextLinkedId);

    if (!canLink.exists) {
      return linkedEntityNotFound(c);
    }

    if (!canLink.allowed) {
      return forbidden(c);
    }
  }

  await getDatabase(c.env)
    .prepare(
      `UPDATE document_links
       SET linked_type = ?,
           linked_id = ?,
           document_kind = ?,
           title = ?,
           url = ?,
           provider = ?,
           notes = ?,
           updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(
      nextLinkedType,
      nextLinkedId,
      input.data.document_kind ?? existing.document_kind,
      input.data.title ?? existing.title,
      input.data.url ? normalizeDocumentUrl(input.data.url) : existing.url,
      input.data.provider ?? existing.provider,
      input.data.notes ?? existing.notes,
      new Date().toISOString(),
      id
    )
    .run();

  const updated = await findDocumentLink(c.env, id);

  await writeAuditLog(c, {
    entityType: "DOCUMENT_LINK",
    entityId: id,
    action: "UPDATE",
    oldValue: existing,
    newValue: updated
  });

  return c.json({
    success: true,
    data: updated
  });
});

documentLinksRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findDocumentLink(c.env, id);

  if (!existing) {
    return notFound(c);
  }

  const accessError = await ensureCanAccessDocumentLink(c, existing);

  if (accessError) {
    return accessError;
  }

  const now = new Date().toISOString();

  await getDatabase(c.env)
    .prepare("UPDATE document_links SET deleted_at = ?, updated_at = ? WHERE id = ?")
    .bind(now, now, id)
    .run();

  await writeAuditLog(c, {
    entityType: "DOCUMENT_LINK",
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

async function findDocumentLink(env: Bindings, id: string) {
  return getDatabase(env)
    .prepare("SELECT * FROM document_links WHERE id = ? AND deleted_at IS NULL")
    .bind(id)
    .first<DocumentLinkRow>();
}

async function canAccessLinkedEntity(
  env: Bindings,
  linkedType: keyof typeof linkedEntityTables,
  linkedId: string
) {
  const tableName = linkedEntityTables[linkedType];
  const row = await getDatabase(env)
    .prepare(`SELECT id FROM ${tableName} WHERE id = ? AND deleted_at IS NULL`)
    .bind(linkedId)
    .first<{ id: string }>();

  return {
    exists: Boolean(row),
    allowed: Boolean(row)
  };
}

type AppContext = Context<AppEnv>;

async function resolveCreatedBy(c: AppContext) {
  return c.get("currentUser").id;
}

async function ensureCanAccessDocumentLink(c: AppContext, documentLink: DocumentLinkRow) {
  const canLink = await canAccessLinkedEntity(
    c.env,
    documentLink.linked_type,
    documentLink.linked_id
  );

  if (!canLink.exists) {
    return linkedEntityNotFound(c);
  }

  if (!canLink.allowed) {
    return forbidden(c);
  }

  return null;
}

function validationError(c: AppContext, details: unknown) {
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

function notFound(c: AppContext) {
  return c.json(
    {
      success: false,
      error: {
        code: "DOCUMENT_LINK_NOT_FOUND",
        message: "Document link not found."
      }
    },
    404
  );
}

function linkedEntityNotFound(c: AppContext) {
  return c.json(
    {
      success: false,
      error: {
        code: "LINKED_ENTITY_NOT_FOUND",
        message: "Linked entity does not exist."
      }
    },
    404
  );
}

function forbidden(c: AppContext) {
  return c.json(
    {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You do not have access to this linked entity."
      }
    },
    403
  );
}
