import { z } from "zod";

export const staffSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const listStaffQuery = z.object({
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type StaffInput = z.infer<typeof staffSchema>;
