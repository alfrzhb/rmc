import { Hono, type Context } from "hono";
import {
  clientContactCreateSchema,
  clientContactUpdateSchema,
  clientCreateSchema,
  clientListQuerySchema,
  clientUpdateSchema
} from "@ratama/validation";
import type { AppEnv } from "../env";
import { writeAuditLog } from "../lib/audit";
import { getDatabase } from "../lib/database";

type ClientRow = {
  id: string;
  name: string;
  client_type: string | null;
  industry: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ClientContactRow = {
  id: string;
  client_id: string;
  name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_primary: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ClientContactResponse = Omit<ClientContactRow, "is_primary"> & {
  is_primary: boolean;
};

export const clientsRoute = new Hono<AppEnv>();

clientsRoute.get("/", async (c) => {
  const query = clientListQuerySchema.safeParse({
    search: c.req.query("search"),
    status: c.req.query("status"),
    industry: c.req.query("industry"),
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize")
  });

  if (!query.success) {
    return validationError(c, query.error.flatten());
  }

  const filters = ["deleted_at IS NULL"];
  const bindings: Array<number | string> = [];

  if (query.data.search) {
    filters.push("(name LIKE ? OR email LIKE ? OR phone LIKE ?)");
    const search = `%${query.data.search}%`;
    bindings.push(search, search, search);
  }

  if (query.data.status) {
    filters.push("status = ?");
    bindings.push(query.data.status);
  }

  if (query.data.industry) {
    filters.push("industry = ?");
    bindings.push(query.data.industry);
  }

  const where = filters.join(" AND ");
  const total = await getDatabase(c.env)
    .prepare(`SELECT COUNT(*) AS total FROM clients WHERE ${where}`)
    .bind(...bindings)
    .first<{ total: number }>();

  const offset = (query.data.page - 1) * query.data.pageSize;
  const rows = await getDatabase(c.env)
    .prepare(
      `SELECT id, name, client_type, industry, address, email, phone, notes, status, created_at, updated_at, deleted_at
       FROM clients
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(...bindings, query.data.pageSize, offset)
    .all<ClientRow>();

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

clientsRoute.get("/:id", async (c) => {
  const client = await findClient(c, c.req.param("id"));

  if (!client) {
    return clientNotFound(c);
  }

  const contacts = await listContacts(c, client.id);

  return c.json({
    success: true,
    data: {
      ...client,
      contacts
    }
  });
});

clientsRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const input = clientCreateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await getDatabase(c.env)
    .prepare(
      `INSERT INTO clients (
        id,
        name,
        client_type,
        industry,
        address,
        email,
        phone,
        notes,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.data.name,
      input.data.client_type ?? null,
      input.data.industry ?? null,
      input.data.address ?? null,
      input.data.email ?? null,
      input.data.phone ?? null,
      input.data.notes ?? null,
      input.data.status,
      now,
      now
    )
    .run();

  const created = await findClient(c, id);

  await writeAuditLog(c, {
    entityType: "CLIENT",
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

clientsRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findClient(c, id);

  if (!existing) {
    return clientNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = clientUpdateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  await getDatabase(c.env)
    .prepare(
      `UPDATE clients
       SET name = ?,
           client_type = ?,
           industry = ?,
           address = ?,
           email = ?,
           phone = ?,
           notes = ?,
           status = ?,
           updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(
      input.data.name ?? existing.name,
      input.data.client_type ?? existing.client_type,
      input.data.industry ?? existing.industry,
      input.data.address ?? existing.address,
      input.data.email ?? existing.email,
      input.data.phone ?? existing.phone,
      input.data.notes ?? existing.notes,
      input.data.status ?? existing.status,
      new Date().toISOString(),
      id
    )
    .run();

  const updated = await findClient(c, id);

  await writeAuditLog(c, {
    entityType: "CLIENT",
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

clientsRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findClient(c, id);

  if (!existing) {
    return clientNotFound(c);
  }

  const now = new Date().toISOString();
  const db = getDatabase(c.env);

  await db
    .prepare("UPDATE clients SET deleted_at = ?, updated_at = ? WHERE id = ?")
    .bind(now, now, id)
    .run();

  await db
    .prepare("UPDATE client_contacts SET deleted_at = ?, updated_at = ? WHERE client_id = ?")
    .bind(now, now, id)
    .run();

  await writeAuditLog(c, {
    entityType: "CLIENT",
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

clientsRoute.get("/:clientId/contacts", async (c) => {
  const client = await findClient(c, c.req.param("clientId"));

  if (!client) {
    return clientNotFound(c);
  }

  return c.json({
    success: true,
    data: await listContacts(c, client.id)
  });
});

clientsRoute.post("/:clientId/contacts", async (c) => {
  const client = await findClient(c, c.req.param("clientId"));

  if (!client) {
    return clientNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = clientContactCreateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = getDatabase(c.env);

  if (input.data.is_primary) {
    await clearPrimaryContact(db, client.id);
  }

  await db
    .prepare(
      `INSERT INTO client_contacts (
        id,
        client_id,
        name,
        position,
        email,
        phone,
        whatsapp,
        is_primary,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      client.id,
      input.data.name,
      input.data.position ?? null,
      input.data.email ?? null,
      input.data.phone ?? null,
      input.data.whatsapp ?? null,
      input.data.is_primary ? 1 : 0,
      input.data.notes ?? null,
      now,
      now
    )
    .run();

  const created = await findContact(c, client.id, id);

  await writeAuditLog(c, {
    entityType: "CLIENT_CONTACT",
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

clientsRoute.get("/:clientId/contacts/:contactId", async (c) => {
  const contact = await findContact(c, c.req.param("clientId"), c.req.param("contactId"));

  if (!contact) {
    return contactNotFound(c);
  }

  return c.json({
    success: true,
    data: contact
  });
});

clientsRoute.put("/:clientId/contacts/:contactId", async (c) => {
  const client = await findClient(c, c.req.param("clientId"));

  if (!client) {
    return clientNotFound(c);
  }

  const contactId = c.req.param("contactId");
  const existing = await findContact(c, client.id, contactId);

  if (!existing) {
    return contactNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = clientContactUpdateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const db = getDatabase(c.env);

  if (input.data.is_primary) {
    await clearPrimaryContact(db, client.id, contactId);
  }

  await db
    .prepare(
      `UPDATE client_contacts
       SET name = ?,
           position = ?,
           email = ?,
           phone = ?,
           whatsapp = ?,
           is_primary = ?,
           notes = ?,
           updated_at = ?
       WHERE id = ? AND client_id = ? AND deleted_at IS NULL`
    )
    .bind(
      input.data.name ?? existing.name,
      input.data.position ?? existing.position,
      input.data.email ?? existing.email,
      input.data.phone ?? existing.phone,
      input.data.whatsapp ?? existing.whatsapp,
      input.data.is_primary === undefined
        ? booleanToInteger(existing.is_primary)
        : input.data.is_primary
          ? 1
          : 0,
      input.data.notes ?? existing.notes,
      new Date().toISOString(),
      contactId,
      client.id
    )
    .run();

  const updated = await findContact(c, client.id, contactId);

  await writeAuditLog(c, {
    entityType: "CLIENT_CONTACT",
    entityId: contactId,
    action: "UPDATE",
    oldValue: existing,
    newValue: updated
  });

  return c.json({
    success: true,
    data: updated
  });
});

clientsRoute.delete("/:clientId/contacts/:contactId", async (c) => {
  const contact = await findContact(c, c.req.param("clientId"), c.req.param("contactId"));

  if (!contact) {
    return contactNotFound(c);
  }

  const now = new Date().toISOString();

  await getDatabase(c.env)
    .prepare(
      "UPDATE client_contacts SET deleted_at = ?, updated_at = ? WHERE id = ? AND client_id = ?"
    )
    .bind(now, now, contact.id, contact.client_id)
    .run();

  await writeAuditLog(c, {
    entityType: "CLIENT_CONTACT",
    entityId: contact.id,
    action: "DELETE",
    oldValue: contact,
    newValue: {
      id: contact.id,
      deleted_at: now
    }
  });

  return c.json({
    success: true,
    data: {
      id: contact.id
    }
  });
});

async function findClient(c: Context<AppEnv>, id: string) {
  return getDatabase(c.env)
    .prepare(
      `SELECT id, name, client_type, industry, address, email, phone, notes, status, created_at, updated_at, deleted_at
       FROM clients
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(id)
    .first<ClientRow>();
}

async function listContacts(c: Context<AppEnv>, clientId: string) {
  const rows = await getDatabase(c.env)
    .prepare(
      `SELECT id, client_id, name, position, email, phone, whatsapp, is_primary, notes, created_at, updated_at, deleted_at
       FROM client_contacts
       WHERE client_id = ? AND deleted_at IS NULL
       ORDER BY is_primary DESC, name ASC`
    )
    .bind(clientId)
    .all<ClientContactRow>();

  return rows.results.map(toContactResponse);
}

async function findContact(c: Context<AppEnv>, clientId: string, contactId: string) {
  const row = await getDatabase(c.env)
    .prepare(
      `SELECT id, client_id, name, position, email, phone, whatsapp, is_primary, notes, created_at, updated_at, deleted_at
       FROM client_contacts
       WHERE id = ? AND client_id = ? AND deleted_at IS NULL`
    )
    .bind(contactId, clientId)
    .first<ClientContactRow>();

  return row ? toContactResponse(row) : null;
}

async function clearPrimaryContact(db: D1Database, clientId: string, exceptContactId?: string) {
  if (exceptContactId) {
    await db
      .prepare(
        `UPDATE client_contacts
         SET is_primary = 0, updated_at = ?
         WHERE client_id = ? AND id != ? AND deleted_at IS NULL`
      )
      .bind(new Date().toISOString(), clientId, exceptContactId)
      .run();
    return;
  }

  await db
    .prepare(
      `UPDATE client_contacts
       SET is_primary = 0, updated_at = ?
       WHERE client_id = ? AND deleted_at IS NULL`
    )
    .bind(new Date().toISOString(), clientId)
    .run();
}

function toContactResponse(row: ClientContactRow): ClientContactResponse {
  return {
    ...row,
    is_primary: row.is_primary === 1
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

function clientNotFound(c: Context<AppEnv>) {
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

function contactNotFound(c: Context<AppEnv>) {
  return c.json(
    {
      success: false,
      error: {
        code: "CLIENT_CONTACT_NOT_FOUND",
        message: "Client contact not found."
      }
    },
    404
  );
}
