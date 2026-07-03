import { z } from "zod";
import { USER_ROLES, USER_STATUSES } from "@ratama/shared";

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);

export const createUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(1),
  role: userRoleSchema,
  status: userStatusSchema.default("ACTIVE")
});
