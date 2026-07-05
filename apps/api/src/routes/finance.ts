import { Hono, type Context } from "hono";
import {
  invoiceCreateSchema,
  invoiceListQuerySchema,
  invoiceUpdateSchema,
  payableCreateSchema,
  payableListQuerySchema,
  payableUpdateSchema,
  paymentCreateSchema,
  paymentListQuerySchema,
  paymentUpdateSchema
} from "@ratama/validation";
import type { AppEnv } from "../env";
import { writeAuditLog } from "../lib/audit";
import { getDatabase } from "../lib/database";

type InvoiceRow = {
  id: string;
  project_id: string;
  project_name?: string;
  client_id: string;
  client_name?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  termin_number: number | null;
  description: string | null;
  amount: number;
  status: string;
  sent_at: string | null;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
};

type PaymentRow = {
  id: string;
  invoice_id: string;
  invoice_number?: string;
  project_id: string;
  project_name?: string;
  client_id: string;
  client_name?: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  status: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
};

type PayableRow = {
  id: string;
  project_id: string | null;
  project_name?: string | null;
  vendor_name: string;
  cost_category: string;
  description: string | null;
  bill_date: string | null;
  due_date: string | null;
  amount: number;
  status: string;
  paid_at: string | null;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
};

export const invoicesRoute = new Hono<AppEnv>();
export const paymentsRoute = new Hono<AppEnv>();
export const payablesRoute = new Hono<AppEnv>();

invoicesRoute.get("/", async (c) => {
  const query = invoiceListQuerySchema.safeParse({
    search: c.req.query("search"),
    project_id: c.req.query("project_id"),
    client_id: c.req.query("client_id"),
    status: c.req.query("status"),
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize")
  });

  if (!query.success) {
    return validationError(c, query.error.flatten());
  }

  const filters = ["i.deleted_at IS NULL"];
  const bindings: Array<number | string> = [];

  if (query.data.search) {
    filters.push("(i.invoice_number LIKE ? OR p.name LIKE ? OR c.name LIKE ?)");
    const search = `%${query.data.search}%`;
    bindings.push(search, search, search);
  }

  if (query.data.project_id) {
    filters.push("i.project_id = ?");
    bindings.push(query.data.project_id);
  }

  if (query.data.client_id) {
    filters.push("i.client_id = ?");
    bindings.push(query.data.client_id);
  }

  if (query.data.status) {
    filters.push("i.status = ?");
    bindings.push(query.data.status);
  }

  const where = filters.join(" AND ");
  const total = await getDatabase(c.env)
    .prepare(
      `SELECT COUNT(*) AS total
       FROM invoices i
       LEFT JOIN projects p ON p.id = i.project_id
       LEFT JOIN clients c ON c.id = i.client_id
       WHERE ${where}`
    )
    .bind(...bindings)
    .first<{ total: number }>();

  const offset = (query.data.page - 1) * query.data.pageSize;
  const rows = await getDatabase(c.env)
    .prepare(`${invoiceSelectSql()} WHERE ${where} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`)
    .bind(...bindings, query.data.pageSize, offset)
    .all<InvoiceRow>();

  return c.json({
    success: true,
    data: rows.results,
    meta: { page: query.data.page, pageSize: query.data.pageSize, total: total?.total ?? 0 }
  });
});

invoicesRoute.get("/:id", async (c) => {
  const invoice = await findInvoice(c, c.req.param("id"));

  if (!invoice) {
    return invoiceNotFound(c);
  }

  const payments = await listPaymentsByInvoice(c, invoice.id);

  return c.json({
    success: true,
    data: { ...invoice, payments }
  });
});

invoicesRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const input = invoiceCreateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const project = await findProjectRef(c, input.data.project_id);

  if (!project) {
    return projectNotFound(c);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  try {
    await getDatabase(c.env)
      .prepare(
        `INSERT INTO invoices (
          id, project_id, client_id, invoice_number, invoice_date, due_date,
          termin_number, description, amount, status, sent_at, created_by,
          created_at, updated_at, cancelled_at, cancel_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        project.id,
        project.client_id,
        input.data.invoice_number,
        input.data.invoice_date,
        input.data.due_date,
        input.data.termin_number ?? null,
        input.data.description ?? null,
        input.data.amount,
        input.data.status,
        input.data.sent_at ?? null,
        c.get("currentUser").id,
        now,
        now,
        input.data.cancelled_at ?? null,
        input.data.cancel_reason ?? null
      )
      .run();
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: "INVOICE_NUMBER_EXISTS",
          message: "Invoice number already exists."
        }
      },
      409
    );
  }

  const created = await findInvoice(c, id);

  await writeAuditLog(c, {
    entityType: "INVOICE",
    entityId: id,
    action: "FINANCE",
    newValue: created
  });

  return c.json({ success: true, data: created }, 201);
});

invoicesRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findInvoice(c, id);

  if (!existing) {
    return invoiceNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = invoiceUpdateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const nextProjectId = input.data.project_id ?? existing.project_id;
  const project = await findProjectRef(c, nextProjectId);

  if (!project) {
    return projectNotFound(c);
  }

  try {
    await getDatabase(c.env)
      .prepare(
        `UPDATE invoices
         SET project_id = ?, client_id = ?, invoice_number = ?, invoice_date = ?,
             due_date = ?, termin_number = ?, description = ?, amount = ?,
             status = ?, sent_at = ?, cancelled_at = ?, cancel_reason = ?, updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`
      )
      .bind(
        project.id,
        project.client_id,
        input.data.invoice_number ?? existing.invoice_number,
        input.data.invoice_date ?? existing.invoice_date,
        input.data.due_date ?? existing.due_date,
        input.data.termin_number ?? existing.termin_number,
        input.data.description ?? existing.description,
        input.data.amount ?? existing.amount,
        input.data.status ?? existing.status,
        input.data.sent_at ?? existing.sent_at,
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
          code: "INVOICE_NUMBER_EXISTS",
          message: "Invoice number already exists."
        }
      },
      409
    );
  }

  const updated = await findInvoice(c, id);

  await writeAuditLog(c, {
    entityType: "INVOICE",
    entityId: id,
    action: existing.status !== updated?.status ? "TRANSITION" : "FINANCE",
    oldValue: existing,
    newValue: updated
  });

  return c.json({ success: true, data: updated });
});

invoicesRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findInvoice(c, id);

  if (!existing) {
    return invoiceNotFound(c);
  }

  const now = new Date().toISOString();
  await getDatabase(c.env)
    .prepare("UPDATE invoices SET deleted_at = ?, updated_at = ? WHERE id = ?")
    .bind(now, now, id)
    .run();

  await writeAuditLog(c, {
    entityType: "INVOICE",
    entityId: id,
    action: "DELETE",
    oldValue: existing,
    newValue: {
      id,
      deleted_at: now
    }
  });

  return c.json({ success: true, data: { id } });
});

paymentsRoute.get("/", async (c) => {
  const query = paymentListQuerySchema.safeParse({
    invoice_id: c.req.query("invoice_id"),
    project_id: c.req.query("project_id"),
    client_id: c.req.query("client_id"),
    status: c.req.query("status"),
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize")
  });

  if (!query.success) {
    return validationError(c, query.error.flatten());
  }

  const filters = ["pay.deleted_at IS NULL"];
  const bindings: Array<number | string> = [];

  for (const key of ["invoice_id", "project_id", "client_id", "status"] as const) {
    if (query.data[key]) {
      filters.push(`pay.${key} = ?`);
      bindings.push(query.data[key]);
    }
  }

  const where = filters.join(" AND ");
  const total = await getDatabase(c.env)
    .prepare(`SELECT COUNT(*) AS total FROM payments pay WHERE ${where}`)
    .bind(...bindings)
    .first<{ total: number }>();

  const offset = (query.data.page - 1) * query.data.pageSize;
  const rows = await getDatabase(c.env)
    .prepare(`${paymentSelectSql()} WHERE ${where} ORDER BY pay.payment_date DESC, pay.created_at DESC LIMIT ? OFFSET ?`)
    .bind(...bindings, query.data.pageSize, offset)
    .all<PaymentRow>();

  return c.json({
    success: true,
    data: rows.results,
    meta: { page: query.data.page, pageSize: query.data.pageSize, total: total?.total ?? 0 }
  });
});

paymentsRoute.get("/:id", async (c) => {
  const payment = await findPayment(c, c.req.param("id"));

  if (!payment) {
    return paymentNotFound(c);
  }

  return c.json({ success: true, data: payment });
});

paymentsRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const input = paymentCreateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const invoice = await findInvoice(c, input.data.invoice_id);

  if (!invoice) {
    return invoiceNotFound(c);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await getDatabase(c.env)
    .prepare(
      `INSERT INTO payments (
        id, invoice_id, project_id, client_id, payment_date, amount,
        payment_method, reference_number, notes, status, created_by,
        created_at, updated_at, cancelled_at, cancel_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      invoice.id,
      invoice.project_id,
      invoice.client_id,
      input.data.payment_date,
      input.data.amount,
      input.data.payment_method,
      input.data.reference_number ?? null,
      input.data.notes ?? null,
      input.data.status,
      c.get("currentUser").id,
      now,
      now,
      input.data.cancelled_at ?? null,
      input.data.cancel_reason ?? null
    )
    .run();

  await syncInvoicePaymentStatus(c, invoice.id);

  const created = await findPayment(c, id);

  await writeAuditLog(c, {
    entityType: "PAYMENT",
    entityId: id,
    action: "FINANCE",
    newValue: created
  });

  return c.json({ success: true, data: created }, 201);
});

paymentsRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findPayment(c, id);

  if (!existing) {
    return paymentNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = paymentUpdateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const nextInvoice = input.data.invoice_id
    ? await findInvoice(c, input.data.invoice_id)
    : await findInvoice(c, existing.invoice_id);

  if (!nextInvoice) {
    return invoiceNotFound(c);
  }

  await getDatabase(c.env)
    .prepare(
      `UPDATE payments
       SET invoice_id = ?, project_id = ?, client_id = ?, payment_date = ?, amount = ?,
           payment_method = ?, reference_number = ?, notes = ?, status = ?,
           cancelled_at = ?, cancel_reason = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(
      nextInvoice.id,
      nextInvoice.project_id,
      nextInvoice.client_id,
      input.data.payment_date ?? existing.payment_date,
      input.data.amount ?? existing.amount,
      input.data.payment_method ?? existing.payment_method,
      input.data.reference_number ?? existing.reference_number,
      input.data.notes ?? existing.notes,
      input.data.status ?? existing.status,
      input.data.cancelled_at ?? existing.cancelled_at,
      input.data.cancel_reason ?? existing.cancel_reason,
      new Date().toISOString(),
      id
    )
    .run();

  await syncInvoicePaymentStatus(c, existing.invoice_id);
  await syncInvoicePaymentStatus(c, nextInvoice.id);

  const updated = await findPayment(c, id);

  await writeAuditLog(c, {
    entityType: "PAYMENT",
    entityId: id,
    action: existing.status !== updated?.status ? "TRANSITION" : "FINANCE",
    oldValue: existing,
    newValue: updated
  });

  return c.json({ success: true, data: updated });
});

paymentsRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findPayment(c, id);

  if (!existing) {
    return paymentNotFound(c);
  }

  const now = new Date().toISOString();
  await getDatabase(c.env)
    .prepare("UPDATE payments SET deleted_at = ?, updated_at = ? WHERE id = ?")
    .bind(now, now, id)
    .run();

  await syncInvoicePaymentStatus(c, existing.invoice_id);

  await writeAuditLog(c, {
    entityType: "PAYMENT",
    entityId: id,
    action: "DELETE",
    oldValue: existing,
    newValue: {
      id,
      deleted_at: now
    }
  });

  return c.json({ success: true, data: { id } });
});

payablesRoute.get("/", async (c) => {
  const query = payableListQuerySchema.safeParse({
    project_id: c.req.query("project_id"),
    status: c.req.query("status"),
    cost_category: c.req.query("cost_category"),
    vendor_name: c.req.query("vendor_name"),
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize")
  });

  if (!query.success) {
    return validationError(c, query.error.flatten());
  }

  const filters = ["ap.deleted_at IS NULL"];
  const bindings: Array<number | string> = [];

  if (query.data.project_id) {
    filters.push("ap.project_id = ?");
    bindings.push(query.data.project_id);
  }

  if (query.data.status) {
    filters.push("ap.status = ?");
    bindings.push(query.data.status);
  }

  if (query.data.cost_category) {
    filters.push("ap.cost_category = ?");
    bindings.push(query.data.cost_category);
  }

  if (query.data.vendor_name) {
    filters.push("ap.vendor_name LIKE ?");
    bindings.push(`%${query.data.vendor_name}%`);
  }

  const where = filters.join(" AND ");
  const total = await getDatabase(c.env)
    .prepare(`SELECT COUNT(*) AS total FROM payables ap WHERE ${where}`)
    .bind(...bindings)
    .first<{ total: number }>();

  const offset = (query.data.page - 1) * query.data.pageSize;
  const rows = await getDatabase(c.env)
    .prepare(`${payableSelectSql()} WHERE ${where} ORDER BY ap.created_at DESC LIMIT ? OFFSET ?`)
    .bind(...bindings, query.data.pageSize, offset)
    .all<PayableRow>();

  return c.json({
    success: true,
    data: rows.results,
    meta: { page: query.data.page, pageSize: query.data.pageSize, total: total?.total ?? 0 }
  });
});

payablesRoute.get("/:id", async (c) => {
  const payable = await findPayable(c, c.req.param("id"));

  if (!payable) {
    return payableNotFound(c);
  }

  return c.json({ success: true, data: payable });
});

payablesRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const input = payableCreateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  if (input.data.project_id) {
    const project = await findProjectRef(c, input.data.project_id);

    if (!project) {
      return projectNotFound(c);
    }
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await getDatabase(c.env)
    .prepare(
      `INSERT INTO payables (
        id, project_id, vendor_name, cost_category, description, bill_date, due_date,
        amount, status, paid_at, payment_method, reference_number, notes,
        created_by, created_at, updated_at, cancelled_at, cancel_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.data.project_id ?? null,
      input.data.vendor_name,
      input.data.cost_category,
      input.data.description ?? null,
      input.data.bill_date ?? null,
      input.data.due_date ?? null,
      input.data.amount,
      input.data.status,
      input.data.paid_at ?? null,
      input.data.payment_method ?? null,
      input.data.reference_number ?? null,
      input.data.notes ?? null,
      c.get("currentUser").id,
      now,
      now,
      input.data.cancelled_at ?? null,
      input.data.cancel_reason ?? null
    )
    .run();

  const created = await findPayable(c, id);

  await writeAuditLog(c, {
    entityType: "PAYABLE",
    entityId: id,
    action: "FINANCE",
    newValue: created
  });

  return c.json({ success: true, data: created }, 201);
});

payablesRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findPayable(c, id);

  if (!existing) {
    return payableNotFound(c);
  }

  const body = await c.req.json().catch(() => null);
  const input = payableUpdateSchema.safeParse(body);

  if (!input.success) {
    return validationError(c, input.error.flatten());
  }

  const nextProjectId =
    input.data.project_id === undefined ? existing.project_id : input.data.project_id;

  if (nextProjectId) {
    const project = await findProjectRef(c, nextProjectId);

    if (!project) {
      return projectNotFound(c);
    }
  }

  await getDatabase(c.env)
    .prepare(
      `UPDATE payables
       SET project_id = ?, vendor_name = ?, cost_category = ?, description = ?,
           bill_date = ?, due_date = ?, amount = ?, status = ?, paid_at = ?,
           payment_method = ?, reference_number = ?, notes = ?, cancelled_at = ?,
           cancel_reason = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(
      nextProjectId ?? null,
      input.data.vendor_name ?? existing.vendor_name,
      input.data.cost_category ?? existing.cost_category,
      input.data.description ?? existing.description,
      input.data.bill_date ?? existing.bill_date,
      input.data.due_date ?? existing.due_date,
      input.data.amount ?? existing.amount,
      input.data.status ?? existing.status,
      input.data.paid_at ?? existing.paid_at,
      input.data.payment_method ?? existing.payment_method,
      input.data.reference_number ?? existing.reference_number,
      input.data.notes ?? existing.notes,
      input.data.cancelled_at ?? existing.cancelled_at,
      input.data.cancel_reason ?? existing.cancel_reason,
      new Date().toISOString(),
      id
    )
    .run();

  const updated = await findPayable(c, id);

  await writeAuditLog(c, {
    entityType: "PAYABLE",
    entityId: id,
    action: existing.status !== updated?.status ? "TRANSITION" : "FINANCE",
    oldValue: existing,
    newValue: updated
  });

  return c.json({ success: true, data: updated });
});

payablesRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await findPayable(c, id);

  if (!existing) {
    return payableNotFound(c);
  }

  const now = new Date().toISOString();
  await getDatabase(c.env)
    .prepare("UPDATE payables SET deleted_at = ?, updated_at = ? WHERE id = ?")
    .bind(now, now, id)
    .run();

  await writeAuditLog(c, {
    entityType: "PAYABLE",
    entityId: id,
    action: "DELETE",
    oldValue: existing,
    newValue: {
      id,
      deleted_at: now
    }
  });

  return c.json({ success: true, data: { id } });
});

async function findInvoice(c: Context<AppEnv>, id: string) {
  return getDatabase(c.env)
    .prepare(`${invoiceSelectSql()} WHERE i.id = ? AND i.deleted_at IS NULL`)
    .bind(id)
    .first<InvoiceRow>();
}

async function listPaymentsByInvoice(c: Context<AppEnv>, invoiceId: string) {
  const rows = await getDatabase(c.env)
    .prepare(`${paymentSelectSql()} WHERE pay.invoice_id = ? AND pay.deleted_at IS NULL ORDER BY pay.payment_date DESC, pay.created_at DESC`)
    .bind(invoiceId)
    .all<PaymentRow>();

  return rows.results;
}

async function findPayment(c: Context<AppEnv>, id: string) {
  return getDatabase(c.env)
    .prepare(`${paymentSelectSql()} WHERE pay.id = ? AND pay.deleted_at IS NULL`)
    .bind(id)
    .first<PaymentRow>();
}

async function findPayable(c: Context<AppEnv>, id: string) {
  return getDatabase(c.env)
    .prepare(`${payableSelectSql()} WHERE ap.id = ? AND ap.deleted_at IS NULL`)
    .bind(id)
    .first<PayableRow>();
}

async function findProjectRef(c: Context<AppEnv>, projectId: string) {
  return getDatabase(c.env)
    .prepare("SELECT id, client_id FROM projects WHERE id = ? AND deleted_at IS NULL")
    .bind(projectId)
    .first<{ id: string; client_id: string }>();
}

async function syncInvoicePaymentStatus(c: Context<AppEnv>, invoiceId: string) {
  const invoice = await findInvoice(c, invoiceId);

  if (!invoice || invoice.status === "CANCELLED") {
    return;
  }

  const paid = await getDatabase(c.env)
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE invoice_id = ? AND status = 'VALID' AND deleted_at IS NULL"
    )
    .bind(invoiceId)
    .first<{ total: number }>();

  const totalPaid = paid?.total ?? 0;
  const nextStatus =
    totalPaid <= 0 ? invoice.status : totalPaid >= invoice.amount ? "PAID" : "PARTIALLY_PAID";

  if (nextStatus !== invoice.status) {
    await getDatabase(c.env)
      .prepare("UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?")
      .bind(nextStatus, new Date().toISOString(), invoiceId)
      .run();

    await writeAuditLog(c, {
      entityType: "INVOICE",
      entityId: invoiceId,
      action: "FINANCE",
      oldValue: {
        id: invoiceId,
        status: invoice.status
      },
      newValue: {
        id: invoiceId,
        status: nextStatus
      }
    });
  }
}

function invoiceSelectSql() {
  return `SELECT
    i.id, i.project_id, p.name AS project_name, i.client_id, c.name AS client_name,
    i.invoice_number, i.invoice_date, i.due_date, i.termin_number, i.description,
    i.amount, i.status, i.sent_at, i.created_by, u.name AS created_by_name,
    i.created_at, i.updated_at, i.deleted_at, i.cancelled_at, i.cancel_reason
  FROM invoices i
  LEFT JOIN projects p ON p.id = i.project_id
  LEFT JOIN clients c ON c.id = i.client_id
  LEFT JOIN users u ON u.id = i.created_by`;
}

function paymentSelectSql() {
  return `SELECT
    pay.id, pay.invoice_id, i.invoice_number, pay.project_id, p.name AS project_name,
    pay.client_id, c.name AS client_name, pay.payment_date, pay.amount,
    pay.payment_method, pay.reference_number, pay.notes, pay.status,
    pay.created_by, u.name AS created_by_name, pay.created_at, pay.updated_at,
    pay.deleted_at, pay.cancelled_at, pay.cancel_reason
  FROM payments pay
  LEFT JOIN invoices i ON i.id = pay.invoice_id
  LEFT JOIN projects p ON p.id = pay.project_id
  LEFT JOIN clients c ON c.id = pay.client_id
  LEFT JOIN users u ON u.id = pay.created_by`;
}

function payableSelectSql() {
  return `SELECT
    ap.id, ap.project_id, p.name AS project_name, ap.vendor_name, ap.cost_category,
    ap.description, ap.bill_date, ap.due_date, ap.amount, ap.status, ap.paid_at,
    ap.payment_method, ap.reference_number, ap.notes, ap.created_by,
    u.name AS created_by_name, ap.created_at, ap.updated_at, ap.deleted_at,
    ap.cancelled_at, ap.cancel_reason
  FROM payables ap
  LEFT JOIN projects p ON p.id = ap.project_id
  LEFT JOIN users u ON u.id = ap.created_by`;
}

function validationError(c: Context<AppEnv>, details: unknown) {
  return c.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Request validation failed.", details } }, 400);
}

function projectNotFound(c: Context<AppEnv>) {
  return c.json({ success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found." } }, 404);
}

function invoiceNotFound(c: Context<AppEnv>) {
  return c.json({ success: false, error: { code: "INVOICE_NOT_FOUND", message: "Invoice not found." } }, 404);
}

function paymentNotFound(c: Context<AppEnv>) {
  return c.json({ success: false, error: { code: "PAYMENT_NOT_FOUND", message: "Payment not found." } }, 404);
}

function payableNotFound(c: Context<AppEnv>) {
  return c.json({ success: false, error: { code: "PAYABLE_NOT_FOUND", message: "Payable not found." } }, 404);
}
