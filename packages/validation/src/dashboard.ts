import { z } from "zod";

export const dashboardSummaryQuerySchema = z.object({
  as_of: z.string().trim().min(1).optional()
});

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>;
