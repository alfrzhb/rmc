import { CLIENT_STATUSES } from "@ratama/shared";
import { z } from "zod";

const optionalText = z.string().trim().max(500).optional();

export const clientCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  client_type: optionalText,
  industry: optionalText,
  address: z.string().trim().max(2000).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  phone: optionalText,
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(CLIENT_STATUSES).default("PROSPECT")
});

export const clientUpdateSchema = clientCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided."
);

export const clientListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(CLIENT_STATUSES).optional(),
  industry: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const clientContactCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  position: optionalText,
  email: z.string().trim().email().toLowerCase().optional(),
  phone: optionalText,
  whatsapp: optionalText,
  is_primary: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional()
});

export const clientContactUpdateSchema = clientContactCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided."
);

export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;
export type ClientContactCreateInput = z.infer<typeof clientContactCreateSchema>;
export type ClientContactUpdateInput = z.infer<typeof clientContactUpdateSchema>;
