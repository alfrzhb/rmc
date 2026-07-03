import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";
import { ACTIVITY_TYPES, PROJECT_MEMBER_ROLES, PROJECT_STATUSES } from "@ratama/shared";
import { clients } from "./clients";
import { opportunities } from "./opportunities";
import { users } from "./users";

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    opportunityId: text("opportunity_id")
      .unique()
      .references(() => opportunities.id, { onDelete: "restrict" }),
    projectName: text("name").notNull(),
    serviceType: text("service_type"),
    contractValue: integer("contract_value").notNull(),
    picUserId: text("pic_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: text("status", { enum: PROJECT_STATUSES }).notNull().default("NOT_STARTED"),
    progressPercentage: integer("progress_percentage").notNull().default(0),
    startDate: text("start_date"),
    deadline: text("deadline"),
    completedAt: text("completed_at"),
    closedAt: text("closed_at"),
    nextAction: text("next_action"),
    nextFollowUpDate: text("next_follow_up_date"),
    blockerNotes: text("blocker_notes"),
    cancelledAt: text("cancelled_at"),
    cancelReason: text("cancel_reason"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at")
  },
  (table) => ({
    clientIdIdx: index("idx_projects_client_id").on(table.clientId),
    picUserIdIdx: index("idx_projects_pic_user_id").on(table.picUserId),
    statusIdx: index("idx_projects_status").on(table.status),
    deadlineIdx: index("idx_projects_deadline").on(table.deadline),
    nextFollowUpDateIdx: index("idx_projects_next_follow_up_date").on(
      table.nextFollowUpDate
    ),
    opportunityIdIdx: index("idx_projects_opportunity_id").on(table.opportunityId),
    statusCheck: check(
      "projects_status_check",
      sql`${table.status} IN ('NOT_STARTED', 'KICKOFF', 'IN_PROGRESS', 'WAITING_CLIENT', 'INTERNAL_REVIEW', 'REVISION', 'COMPLETED', 'CLOSED', 'CANCELLED')`
    ),
    contractValueCheck: check(
      "projects_contract_value_check",
      sql`${table.contractValue} >= 0`
    ),
    progressPercentageCheck: check(
      "projects_progress_percentage_check",
      sql`${table.progressPercentage} >= 0 AND ${table.progressPercentage} <= 100`
    )
  })
);

export const projectMembers = sqliteTable(
  "project_members",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    roleInProject: text("role_in_project", { enum: PROJECT_MEMBER_ROLES }).notNull(),
    assignedAt: text("assigned_at").notNull(),
    isActive: integer("is_active").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at")
  },
  (table) => ({
    projectIdIdx: index("idx_project_members_project_id").on(table.projectId),
    userIdIdx: index("idx_project_members_user_id").on(table.userId),
    isActiveIdx: index("idx_project_members_is_active").on(table.isActive),
    uniqueActiveIdx: uniqueIndex("idx_project_members_unique_active")
      .on(table.projectId, table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
    roleInProjectCheck: check(
      "project_members_role_in_project_check",
      sql`${table.roleInProject} IN ('PIC', 'CONSULTANT', 'FINANCE_SUPPORT', 'ADMIN_SUPPORT', 'REVIEWER', 'OTHER')`
    ),
    isActiveCheck: check("project_members_is_active_check", sql`${table.isActive} IN (0, 1)`)
  })
);

export const projectActivities = sqliteTable(
  "project_activities",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    activityType: text("activity_type", { enum: ACTIVITY_TYPES }).notNull(),
    activityDate: text("activity_date").notNull(),
    notes: text("notes").notNull(),
    nextAction: text("next_action"),
    nextFollowUpDate: text("next_follow_up_date"),
    progressSnapshot: integer("progress_snapshot"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at")
  },
  (table) => ({
    projectIdIdx: index("idx_project_activities_project_id").on(table.projectId),
    userIdIdx: index("idx_project_activities_user_id").on(table.userId),
    activityDateIdx: index("idx_project_activities_activity_date").on(table.activityDate),
    nextFollowUpDateIdx: index("idx_project_activities_next_follow_up_date").on(
      table.nextFollowUpDate
    ),
    activityTypeCheck: check(
      "project_activities_activity_type_check",
      sql`${table.activityType} IN ('MEETING', 'CALL', 'WHATSAPP_FOLLOW_UP', 'EMAIL_SENT', 'DOCUMENT_RECEIVED', 'DOCUMENT_REVIEWED', 'REPORT_DRAFTED', 'REPORT_SUBMITTED', 'REVISION_REQUESTED', 'CLIENT_APPROVAL', 'INTERNAL_DISCUSSION', 'PROPOSAL_SENT', 'PROPOSAL_REVISED', 'NEGOTIATION_NOTE', 'CLIENT_FEEDBACK', 'OTHER')`
    ),
    progressSnapshotCheck: check(
      "project_activities_progress_snapshot_check",
      sql`${table.progressSnapshot} IS NULL OR (${table.progressSnapshot} >= 0 AND ${table.progressSnapshot} <= 100)`
    )
  })
);
