import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  COST_CATEGORIES,
  INVOICE_STATUSES,
  PAYABLE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES
} from "@ratama/shared";
import { clients } from "./clients";
import { projects } from "./projects";
import { users } from "./users";

export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    invoiceNumber: text("invoice_number").notNull().unique(),
    invoiceDate: text("invoice_date").notNull(),
    dueDate: text("due_date").notNull(),
    terminNumber: integer("termin_number"),
    description: text("description"),
    amount: integer("amount").notNull(),
    status: text("status", { enum: INVOICE_STATUSES }).notNull().default("DRAFT"),
    sentAt: text("sent_at"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
    cancelledAt: text("cancelled_at"),
    cancelReason: text("cancel_reason")
  },
  (table) => ({
    projectIdIdx: index("idx_invoices_project_id").on(table.projectId),
    clientIdIdx: index("idx_invoices_client_id").on(table.clientId),
    statusIdx: index("idx_invoices_status").on(table.status),
    dueDateIdx: index("idx_invoices_due_date").on(table.dueDate),
    invoiceDateIdx: index("idx_invoices_invoice_date").on(table.invoiceDate),
    createdByIdx: index("idx_invoices_created_by").on(table.createdBy),
    statusCheck: check(
      "invoices_status_check",
      sql`${table.status} IN ('PLANNED', 'DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')`
    ),
    terminNumberCheck: check(
      "invoices_termin_number_check",
      sql`${table.terminNumber} IS NULL OR ${table.terminNumber} > 0`
    ),
    amountCheck: check("invoices_amount_check", sql`${table.amount} > 0`)
  })
);

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    paymentDate: text("payment_date").notNull(),
    amount: integer("amount").notNull(),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }).notNull(),
    referenceNumber: text("reference_number"),
    notes: text("notes"),
    status: text("status", { enum: PAYMENT_STATUSES }).notNull().default("VALID"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
    cancelledAt: text("cancelled_at"),
    cancelReason: text("cancel_reason")
  },
  (table) => ({
    invoiceIdIdx: index("idx_payments_invoice_id").on(table.invoiceId),
    projectIdIdx: index("idx_payments_project_id").on(table.projectId),
    clientIdIdx: index("idx_payments_client_id").on(table.clientId),
    paymentDateIdx: index("idx_payments_payment_date").on(table.paymentDate),
    statusIdx: index("idx_payments_status").on(table.status),
    createdByIdx: index("idx_payments_created_by").on(table.createdBy),
    amountCheck: check("payments_amount_check", sql`${table.amount} > 0`),
    paymentMethodCheck: check(
      "payments_payment_method_check",
      sql`${table.paymentMethod} IN ('BANK_TRANSFER', 'CASH', 'GIRO', 'OTHER')`
    ),
    statusCheck: check("payments_status_check", sql`${table.status} IN ('VALID', 'CANCELLED')`)
  })
);

export const payables = sqliteTable(
  "payables",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").references(() => projects.id, { onDelete: "restrict" }),
    vendorName: text("vendor_name").notNull(),
    costCategory: text("cost_category", { enum: COST_CATEGORIES }).notNull(),
    description: text("description"),
    billDate: text("bill_date"),
    dueDate: text("due_date"),
    amount: integer("amount").notNull(),
    status: text("status", { enum: PAYABLE_STATUSES }).notNull().default("UNPAID"),
    paidAt: text("paid_at"),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }),
    referenceNumber: text("reference_number"),
    notes: text("notes"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
    cancelledAt: text("cancelled_at"),
    cancelReason: text("cancel_reason")
  },
  (table) => ({
    projectIdIdx: index("idx_payables_project_id").on(table.projectId),
    statusIdx: index("idx_payables_status").on(table.status),
    dueDateIdx: index("idx_payables_due_date").on(table.dueDate),
    billDateIdx: index("idx_payables_bill_date").on(table.billDate),
    costCategoryIdx: index("idx_payables_cost_category").on(table.costCategory),
    createdByIdx: index("idx_payables_created_by").on(table.createdBy),
    amountCheck: check("payables_amount_check", sql`${table.amount} > 0`),
    costCategoryCheck: check(
      "payables_cost_category_check",
      sql`${table.costCategory} IN ('SUBCONTRACTOR', 'TRANSPORT', 'ACCOMMODATION', 'DOCUMENT_PRINTING', 'CERTIFICATION_COST', 'CONSULTANT_FEE', 'OPERATIONAL', 'OTHER')`
    ),
    statusCheck: check(
      "payables_status_check",
      sql`${table.status} IN ('UNPAID', 'WAITING_APPROVAL', 'APPROVED', 'SCHEDULED', 'PAID', 'OVERDUE', 'CANCELLED')`
    ),
    paymentMethodCheck: check(
      "payables_payment_method_check",
      sql`${table.paymentMethod} IS NULL OR ${table.paymentMethod} IN ('BANK_TRANSFER', 'CASH', 'GIRO', 'OTHER')`
    )
  })
);
