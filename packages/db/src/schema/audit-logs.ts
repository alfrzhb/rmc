import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: text("created_at").notNull()
  },
  (table) => ({
    actorUserIdIdx: index("idx_audit_logs_actor_user_id").on(table.actorUserId),
    entityIdx: index("idx_audit_logs_entity").on(table.entityType, table.entityId),
    actionIdx: index("idx_audit_logs_action").on(table.action),
    createdAtIdx: index("idx_audit_logs_created_at").on(table.createdAt)
  })
);
