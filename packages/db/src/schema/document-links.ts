import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { DOCUMENT_KINDS, DOCUMENT_LINKED_TYPES, DOCUMENT_PROVIDERS } from "@ratama/shared";

export const documentLinks = sqliteTable(
  "document_links",
  {
    id: text("id").primaryKey(),
    linkedType: text("linked_type", { enum: DOCUMENT_LINKED_TYPES }).notNull(),
    linkedId: text("linked_id").notNull(),
    documentKind: text("document_kind", { enum: DOCUMENT_KINDS }).notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    provider: text("provider", { enum: DOCUMENT_PROVIDERS }),
    notes: text("notes"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at")
  },
  (table) => ({
    linkedIdx: index("idx_document_links_linked").on(table.linkedType, table.linkedId),
    createdByIdx: index("idx_document_links_created_by").on(table.createdBy),
    kindIdx: index("idx_document_links_kind").on(table.documentKind),
    providerIdx: index("idx_document_links_provider").on(table.provider),
    createdAtIdx: index("idx_document_links_created_at").on(table.createdAt),
    linkedTypeCheck: check(
      "document_links_linked_type_check",
      sql`${table.linkedType} IN ('CLIENT', 'OPPORTUNITY', 'OPPORTUNITY_LOG', 'PROJECT', 'PROJECT_ACTIVITY', 'INVOICE', 'PAYMENT', 'PAYABLE')`
    ),
    documentKindCheck: check(
      "document_links_document_kind_check",
      sql`${table.documentKind} IN ('PROPOSAL', 'CONTRACT', 'SPK', 'PO', 'PROJECT_DOCUMENT', 'INVOICE_FILE', 'PAYMENT_PROOF', 'VENDOR_BILL', 'AP_PAYMENT_PROOF', 'OTHER')`
    ),
    providerCheck: check(
      "document_links_provider_check",
      sql`${table.provider} IS NULL OR ${table.provider} IN ('GOOGLE_DRIVE', 'ONEDRIVE', 'DROPBOX', 'EXTERNAL_URL', 'OTHER')`
    )
  })
);
