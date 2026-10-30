import { z } from "zod";

// Same rules as api/src/modules/auth/auth.schemas.ts, so most mistakes are caught before a request.
// The API still validates everything; these are for instant feedback.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email")
  .email("Enter a valid email");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(80, "At most 80 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9-]{3,40}$/,
      "3–40 characters: lowercase letters, numbers and hyphens",
    ),
  email,
  password: z
    .string()
    .min(12, "At least 12 characters")
    .max(128, "At most 128 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/** "Kedai Gunting Ali!" → "kedai-gunting-ali" */
export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
