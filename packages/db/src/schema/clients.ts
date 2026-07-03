import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";
import { CLIENT_STATUSES } from "@ratama/shared";

export const clients = sqliteTable(
  "clients",
  {
    id: text("id").primaryKey(),
    clientName: text("name").notNull(),
    clientType: text("client_type"),
    industry: text("industry"),
    address: text("address"),
    email: text("email"),
    phone: text("phone"),
    notes: text("notes"),
    status: text("status", { enum: CLIENT_STATUSES }).notNull().default("PROSPECT"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at")
  },
  (table) => ({
    nameIdx: index("idx_clients_name").on(table.clientName),
    statusIdx: index("idx_clients_status").on(table.status),
    industryIdx: index("idx_clients_industry").on(table.industry),
    statusCheck: check(
      "clients_status_check",
      sql`${table.status} IN ('ACTIVE', 'INACTIVE', 'PROSPECT', 'BLACKLISTED')`
    )
  })
);

export const clientContacts = sqliteTable(
  "client_contacts",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    contactName: text("name").notNull(),
    position: text("position"),
    email: text("email"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    isPrimary: integer("is_primary").notNull().default(0),
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at")
  },
  (table) => ({
    clientIdIdx: index("idx_client_contacts_client_id").on(table.clientId),
    nameIdx: index("idx_client_contacts_name").on(table.contactName),
    onePrimaryIdx: uniqueIndex("idx_client_contacts_one_primary")
      .on(table.clientId)
      .where(sql`${table.isPrimary} = 1 AND ${table.deletedAt} IS NULL`),
    isPrimaryCheck: check(
      "client_contacts_is_primary_check",
      sql`${table.isPrimary} IN (0, 1)`
    )
  })
);
