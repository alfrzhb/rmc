import { Hono, type Context } from "hono";
import { dashboardSummaryQuerySchema } from "@ratama/validation";
import type { AppEnv } from "../env";
import { getDatabase } from "../lib/database";

type CountRow = {
  total: number;
};

type AmountRow = {
  total: number | null;
};

type StatusRow = {
  status: string;
  total: number;
  amount: number | null;
};

type OverdueInvoiceRow = {
  id: string;
  invoice_number: string;
  project_id: string;
  project_name: string | null;
  client_id: string;
  client_name: string | null;
  due_date: string;
  amount: number;
  status: string;
};

type OverduePayableRow = {
  id: string;
  project_id: string | null;
  project_name: string | null;
  vendor_name: string;
  due_date: string | null;
  amount: number;
  status: string;
};

export const dashboardRoute = new Hono<AppEnv>();

dashboardRoute.get("/summary", async (c) => {
  const query = dashboardSummaryQuerySchema.safeParse({
    as_of: c.req.query("as_of")
  });

  if (!query.success) {
    return validationError(c, query.error.flatten());
  }

  const asOf = query.data.as_of ?? new Date().toISOString().slice(0, 10);
  const db = getDatabase(c.env);

  const [
    activeClients,
    prospectClients,
    openOpportunities,
    wonOpportunities,
    activeProjects,
    overdueProjects,
    invoiceTotal,
    validPayments,
    overdueInvoices,
    unpaidPayables,
    overduePayables,
    opportunityStatus,
    projectStatus,
    invoiceStatus,
    payableStatus,
    overdueInvoiceRows,
    overduePayableRows
  ] = await Promise.all([
    count(db, "SELECT COUNT(*) AS total FROM clients WHERE status = 'ACTIVE' AND deleted_at IS NULL"),
    count(db, "SELECT COUNT(*) AS total FROM clients WHERE status = 'PROSPECT' AND deleted_at IS NULL"),
    count(
      db,
      "SELECT COUNT(*) AS total FROM opportunities WHERE status NOT IN ('WON', 'LOST') AND deleted_at IS NULL"
    ),
    count(db, "SELECT COUNT(*) AS total FROM opportunities WHERE status = 'WON' AND deleted_at IS NULL"),
    count(
      db,
      "SELECT COUNT(*) AS total FROM projects WHERE status NOT IN ('COMPLETED', 'CLOSED', 'CANCELLED') AND deleted_at IS NULL"
    ),
    count(
      db,
      "SELECT COUNT(*) AS total FROM projects WHERE deadline IS NOT NULL AND deadline < ? AND status NOT IN ('COMPLETED', 'CLOSED', 'CANCELLED') AND deleted_at IS NULL",
      asOf
    ),
    amount(db, "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status != 'CANCELLED' AND deleted_at IS NULL"),
    amount(db, "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'VALID' AND deleted_at IS NULL"),
    amount(
      db,
      "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE due_date < ? AND status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE') AND deleted_at IS NULL",
      asOf
    ),
    amount(
      db,
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payables WHERE status IN ('UNPAID', 'WAITING_APPROVAL', 'APPROVED', 'SCHEDULED', 'OVERDUE') AND deleted_at IS NULL"
    ),
    amount(
      db,
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payables WHERE due_date IS NOT NULL AND due_date < ? AND status IN ('UNPAID', 'WAITING_APPROVAL', 'APPROVED', 'SCHEDULED', 'OVERDUE') AND deleted_at IS NULL",
      asOf
    ),
    groupedStatus(db, "opportunities"),
    groupedStatus(db, "projects"),
    groupedStatusWithAmount(db, "invoices"),
    groupedStatusWithAmount(db, "payables"),
    db
      .prepare(
        `SELECT
           i.id,
           i.invoice_number,
           i.project_id,
           p.name AS project_name,
           i.client_id,
           c.name AS client_name,
           i.due_date,
           i.amount,
           i.status
         FROM invoices i
         LEFT JOIN projects p ON p.id = i.project_id
         LEFT JOIN clients c ON c.id = i.client_id
         WHERE i.due_date < ?
           AND i.status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')
           AND i.deleted_at IS NULL
         ORDER BY i.due_date ASC
         LIMIT 10`
      )
      .bind(asOf)
      .all<OverdueInvoiceRow>(),
    db
      .prepare(
        `SELECT
           ap.id,
           ap.project_id,
           p.name AS project_name,
           ap.vendor_name,
           ap.due_date,
           ap.amount,
           ap.status
         FROM payables ap
         LEFT JOIN projects p ON p.id = ap.project_id
         WHERE ap.due_date IS NOT NULL
           AND ap.due_date < ?
           AND ap.status IN ('UNPAID', 'WAITING_APPROVAL', 'APPROVED', 'SCHEDULED', 'OVERDUE')
           AND ap.deleted_at IS NULL
         ORDER BY ap.due_date ASC
         LIMIT 10`
      )
      .bind(asOf)
      .all<OverduePayableRow>()
  ]);

  const totalReceivable = invoiceTotal;
  const totalPaid = validPayments;
  const outstandingReceivable = Math.max(totalReceivable - totalPaid, 0);

  return c.json({
    success: true,
    data: {
      as_of: asOf,
      summary_cards: {
        active_clients: activeClients,
        prospect_clients: prospectClients,
        open_opportunities: openOpportunities,
        won_opportunities: wonOpportunities,
        active_projects: activeProjects,
        overdue_projects: overdueProjects
      },
      receivables: {
        total_invoiced: totalReceivable,
        total_paid: totalPaid,
        outstanding: outstandingReceivable,
        overdue_amount: overdueInvoices
      },
      payables: {
        unpaid_amount: unpaidPayables,
        overdue_amount: overduePayables
      },
      status_summary: {
        opportunities: opportunityStatus,
        projects: projectStatus,
        invoices: invoiceStatus,
        payables: payableStatus
      },
      overdue_items: {
        invoices: overdueInvoiceRows.results,
        payables: overduePayableRows.results
      }
    }
  });
});

async function count(db: D1Database, sql: string, ...bindings: string[]) {
  const row = await db.prepare(sql).bind(...bindings).first<CountRow>();
  return row?.total ?? 0;
}

async function amount(db: D1Database, sql: string, ...bindings: string[]) {
  const row = await db.prepare(sql).bind(...bindings).first<AmountRow>();
  return row?.total ?? 0;
}

async function groupedStatus(db: D1Database, table: string) {
  const rows = await db
    .prepare(
      `SELECT status, COUNT(*) AS total, NULL AS amount
       FROM ${table}
       WHERE deleted_at IS NULL
       GROUP BY status
       ORDER BY status ASC`
    )
    .all<StatusRow>();

  return rows.results;
}

async function groupedStatusWithAmount(db: D1Database, table: string) {
  const rows = await db
    .prepare(
      `SELECT status, COUNT(*) AS total, COALESCE(SUM(amount), 0) AS amount
       FROM ${table}
       WHERE deleted_at IS NULL
       GROUP BY status
       ORDER BY status ASC`
    )
    .all<StatusRow>();

  return rows.results;
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
