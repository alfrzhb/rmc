import { ACTIVITY_TYPES, OPPORTUNITY_STATUSES } from "@ratama/shared";
import { z } from "zod";

const optionalText = z.string().trim().max(500).optional();
const optionalLongText = z.string().trim().max(2000).optional();
const optionalMoney = z.number().int().nonnegative().optional();

const opportunityBaseSchema = z.object({
  client_id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(200),
  service_type: optionalText,
  estimated_value: optionalMoney,
  initial_offer_amount: optionalMoney,
  revised_offer_amount: optionalMoney,
  deal_amount: optionalMoney,
  deal_date: z.string().trim().min(1).optional(),
  payment_scheme: optionalText,
  pic_user_id: z.string().trim().min(1),
  status: z.enum(OPPORTUNITY_STATUSES).default("NEW"),
  source: optionalText,
  proposal_sent_date: z.string().trim().min(1).optional(),
  next_follow_up_date: z.string().trim().min(1).optional(),
  notes: optionalLongText,
  lost_reason: optionalLongText,
  on_hold_reason: optionalLongText
});

export const opportunityCreateSchema = opportunityBaseSchema.refine(
  (value) => value.status !== "WON" || value.deal_amount !== undefined,
  "Won opportunities require deal_amount."
);

export const opportunityUpdateSchema = opportunityBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const opportunityListQuerySchema = z.object({
  search: z.string().trim().optional(),
  client_id: z.string().trim().optional(),
  pic_user_id: z.string().trim().optional(),
  status: z.enum(OPPORTUNITY_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const opportunityLogCreateSchema = z.object({
  activity_type: z.enum(ACTIVITY_TYPES),
  activity_date: z.string().trim().min(1),
  notes: z.string().trim().min(1).max(2000),
  next_action: optionalLongText,
  next_follow_up_date: z.string().trim().min(1).optional()
});

export const opportunityLogUpdateSchema = opportunityLogCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;
export type OpportunityLogCreateInput = z.infer<typeof opportunityLogCreateSchema>;
export type OpportunityLogUpdateInput = z.infer<typeof opportunityLogUpdateSchema>;
