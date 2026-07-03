import { z } from "zod";
import { USER_ROLES, USER_STATUSES } from "@ratama/shared";

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);

export const createUserSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  name: z.string().trim().min(1).max(200),
  role: userRoleSchema,
  status: userStatusSchema.default("ACTIVE")
});

export const updateUserSchema = createUserSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
