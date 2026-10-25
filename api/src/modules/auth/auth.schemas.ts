import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);

function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const registerSchema = z.object({
  businessName: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9-]{3,40}$/,
      "3–40 characters: lowercase letters, numbers and hyphens",
    ),
  timezone: z
    .string()
    .refine(isValidTimeZone, "unknown timezone")
    .default("Asia/Kuala_Lumpur"),
  email,
  password: z.string().min(12).max(128),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
