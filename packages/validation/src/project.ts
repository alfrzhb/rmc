import { ACTIVITY_TYPES, PROJECT_MEMBER_ROLES, PROJECT_STATUSES } from "@ratama/shared";
import { z } from "zod";

const optionalText = z.string().trim().max(500).optional();
const optionalLongText = z.string().trim().max(2000).optional();
const progressSchema = z.number().int().min(0).max(100);

export const projectCreateSchema = z.object({
  client_id: z.string().trim().min(1),
  opportunity_id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(200),
  service_type: optionalText,
  contract_value: z.number().int().nonnegative(),
  pic_user_id: z.string().trim().min(1),
  status: z.enum(PROJECT_STATUSES).default("NOT_STARTED"),
  progress_percentage: progressSchema.default(0),
  start_date: z.string().trim().min(1).optional(),
  deadline: z.string().trim().min(1).optional(),
  completed_at: z.string().trim().min(1).optional(),
  closed_at: z.string().trim().min(1).optional(),
  next_action: optionalLongText,
  next_follow_up_date: z.string().trim().min(1).optional(),
  blocker_notes: optionalLongText,
  cancelled_at: z.string().trim().min(1).optional(),
  cancel_reason: optionalLongText
});

export const projectUpdateSchema = projectCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const projectListQuerySchema = z.object({
  search: z.string().trim().optional(),
  client_id: z.string().trim().optional(),
  pic_user_id: z.string().trim().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const projectMemberCreateSchema = z.object({
  user_id: z.string().trim().min(1),
  role_in_project: z.enum(PROJECT_MEMBER_ROLES),
  assigned_at: z.string().trim().min(1).optional(),
  is_active: z.boolean().default(true)
});

export const projectMemberUpdateSchema = projectMemberCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const projectActivityCreateSchema = z.object({
  activity_type: z.enum(ACTIVITY_TYPES),
  activity_date: z.string().trim().min(1),
  notes: z.string().trim().min(1).max(2000),
  next_action: optionalLongText,
  next_follow_up_date: z.string().trim().min(1).optional(),
  progress_snapshot: progressSchema.optional()
});

export const projectActivityUpdateSchema = projectActivityCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectMemberCreateInput = z.infer<typeof projectMemberCreateSchema>;
export type ProjectMemberUpdateInput = z.infer<typeof projectMemberUpdateSchema>;
export type ProjectActivityCreateInput = z.infer<typeof projectActivityCreateSchema>;
export type ProjectActivityUpdateInput = z.infer<typeof projectActivityUpdateSchema>;
