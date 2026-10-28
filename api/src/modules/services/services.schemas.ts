import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  durationMin: z
    .number()
    .int()
    .min(5)
    .max(480)
    .refine((n) => n % 5 === 0, "must be a multiple of 5"),
  /** in sen: 2800 = RM 28.00 */
  price: z.number().int().min(0).max(1_000_000),
});

export const updateServiceSchema = createServiceSchema
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, "nothing to update");

export const listServicesQuery = z.object({
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
