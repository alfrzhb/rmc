import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { ATTACHMENT_KINDS, ATTACHMENT_LINKED_TYPES } from "@ratama/shared";
import { users } from "./users";

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    linkedType: text("linked_type", { enum: ATTACHMENT_LINKED_TYPES }).notNull(),
    linkedId: text("linked_id").notNull(),
    attachmentKind: text("attachment_kind", { enum: ATTACHMENT_KINDS }).notNull(),
    fileName: text("file_name").notNull(),
    fileKey: text("file_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: text("created_at").notNull(),
    deletedAt: text("deleted_at")
  },
  (table) => ({
    linkedIdx: index("idx_attachments_linked").on(table.linkedType, table.linkedId),
    uploadedByIdx: index("idx_attachments_uploaded_by").on(table.uploadedBy),
    kindIdx: index("idx_attachments_kind").on(table.attachmentKind),
    createdAtIdx: index("idx_attachments_created_at").on(table.createdAt),
    linkedTypeCheck: check(
      "attachments_linked_type_check",
      sql`${table.linkedType} IN ('CLIENT', 'OPPORTUNITY', 'OPPORTUNITY_LOG', 'PROJECT', 'PROJECT_ACTIVITY', 'INVOICE', 'PAYMENT', 'PAYABLE')`
    ),
    attachmentKindCheck: check(
      "attachments_attachment_kind_check",
      sql`${table.attachmentKind} IN ('PROPOSAL', 'CONTRACT', 'SPK', 'PO', 'PROJECT_DOCUMENT', 'INVOICE_FILE', 'PAYMENT_PROOF', 'VENDOR_BILL', 'AP_PAYMENT_PROOF', 'OTHER')`
    ),
    fileSizeCheck: check("attachments_file_size_check", sql`${table.fileSize} > 0`)
  })
);
