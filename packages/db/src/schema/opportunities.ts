import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { ACTIVITY_TYPES, OPPORTUNITY_STATUSES } from "@ratama/shared";
import { clients } from "./clients";
import { users } from "./users";

export const opportunities = sqliteTable(
  "opportunities",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    opportunityName: text("name").notNull(),
    serviceType: text("service_type"),
    estimatedValue: integer("estimated_value"),
    initialOfferAmount: integer("initial_offer_amount"),
    revisedOfferAmount: integer("revised_offer_amount"),
    dealAmount: integer("deal_amount"),
    dealDate: text("deal_date"),
    paymentScheme: text("payment_scheme"),
    picUserId: text("pic_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: text("status", { enum: OPPORTUNITY_STATUSES }).notNull().default("NEW"),
    source: text("source"),
    proposalSentDate: text("proposal_sent_date"),
    nextFollowUpDate: text("next_follow_up_date"),
    notes: text("notes"),
    lostReason: text("lost_reason"),
    onHoldReason: text("on_hold_reason"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at")
  },
  (table) => ({
    clientIdIdx: index("idx_opportunities_client_id").on(table.clientId),
    picUserIdIdx: index("idx_opportunities_pic_user_id").on(table.picUserId),
    statusIdx: index("idx_opportunities_status").on(table.status),
    nextFollowUpDateIdx: index("idx_opportunities_next_follow_up_date").on(
      table.nextFollowUpDate
    ),
    dealDateIdx: index("idx_opportunities_deal_date").on(table.dealDate),
    statusCheck: check(
      "opportunities_status_check",
      sql`${table.status} IN ('NEW', 'PROPOSAL_DRAFT', 'PROPOSAL_SENT', 'FOLLOW_UP', 'NEGOTIATION', 'WON', 'LOST', 'ON_HOLD')`
    ),
    estimatedValueCheck: check(
      "opportunities_estimated_value_check",
      sql`${table.estimatedValue} IS NULL OR ${table.estimatedValue} >= 0`
    ),
    initialOfferAmountCheck: check(
      "opportunities_initial_offer_amount_check",
      sql`${table.initialOfferAmount} IS NULL OR ${table.initialOfferAmount} >= 0`
    ),
    revisedOfferAmountCheck: check(
      "opportunities_revised_offer_amount_check",
      sql`${table.revisedOfferAmount} IS NULL OR ${table.revisedOfferAmount} >= 0`
    ),
    dealAmountCheck: check(
      "opportunities_deal_amount_check",
      sql`${table.dealAmount} IS NULL OR ${table.dealAmount} >= 0`
    ),
    wonRequiresDealAmountCheck: check(
      "opportunities_won_requires_deal_amount_check",
      sql`${table.status} != 'WON' OR ${table.dealAmount} IS NOT NULL`
    )
  })
);

export const opportunityLogs = sqliteTable(
  "opportunity_logs",
  {
    id: text("id").primaryKey(),
    opportunityId: text("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    activityType: text("activity_type", { enum: ACTIVITY_TYPES }).notNull(),
    activityDate: text("activity_date").notNull(),
    notes: text("notes").notNull(),
    nextAction: text("next_action"),
    nextFollowUpDate: text("next_follow_up_date"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at")
  },
  (table) => ({
    opportunityIdIdx: index("idx_opportunity_logs_opportunity_id").on(
      table.opportunityId
    ),
    userIdIdx: index("idx_opportunity_logs_user_id").on(table.userId),
    activityDateIdx: index("idx_opportunity_logs_activity_date").on(table.activityDate),
    nextFollowUpDateIdx: index("idx_opportunity_logs_next_follow_up_date").on(
      table.nextFollowUpDate
    ),
    activityTypeCheck: check(
      "opportunity_logs_activity_type_check",
      sql`${table.activityType} IN ('MEETING', 'CALL', 'WHATSAPP_FOLLOW_UP', 'EMAIL_SENT', 'DOCUMENT_RECEIVED', 'DOCUMENT_REVIEWED', 'REPORT_DRAFTED', 'REPORT_SUBMITTED', 'REVISION_REQUESTED', 'CLIENT_APPROVAL', 'INTERNAL_DISCUSSION', 'PROPOSAL_SENT', 'PROPOSAL_REVISED', 'NEGOTIATION_NOTE', 'CLIENT_FEEDBACK', 'OTHER')`
    )
  })
);
