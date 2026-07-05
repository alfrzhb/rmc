import { z } from "zod";
import { paginationQuerySchema } from "./common";

export const auditLogListQuerySchema = paginationQuerySchema.extend({
  actor_user_id: z.string().min(1).optional(),
  entity_type: z.string().min(1).optional(),
  entity_id: z.string().min(1).optional(),
  action: z.string().min(1).optional()
});

export type AuditLogListQueryInput = z.infer<typeof auditLogListQuerySchema>;
