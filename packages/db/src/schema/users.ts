import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { USER_ROLES, USER_STATUSES } from "@ratama/shared";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    displayName: text("name").notNull(),
    role: text("role", { enum: USER_ROLES }).notNull(),
    status: text("status", { enum: USER_STATUSES }).notNull().default("ACTIVE"),
    lastLoginAt: text("last_login_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at")
  },
  (table) => ({
    roleIdx: index("idx_users_role").on(table.role),
    statusIdx: index("idx_users_status").on(table.status),
    roleCheck: check(
      "users_role_check",
      sql`${table.role} IN ('OWNER', 'ADMIN', 'FINANCE', 'PROJECT_MANAGER', 'STAFF')`
    ),
    statusCheck: check(
      "users_status_check",
      sql`${table.status} IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')`
    )
  })
);
