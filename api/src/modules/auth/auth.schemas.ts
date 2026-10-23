import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);

export const registerSchema = z.object({
  email,
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "letters, numbers, underscore only"),
  password: z.string().min(12).max(128),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
