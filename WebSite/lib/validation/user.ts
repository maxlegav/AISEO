import { z } from 'zod';
import { EmailSchema, PasswordSchema } from './common';

/**
 * Login schema - password just needs to be present.
 * Don't enforce password rules on login (user may have old password format).
 */
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Signup schema - full password validation + confirmation match.
 * Password must meet security requirements (uppercase, lowercase, digit).
 */
export const SignupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SignupInput = z.infer<typeof SignupSchema>;

/**
 * Update profile schema for PATCH requests.
 * All fields are optional - empty object {} is valid for PATCH semantics
 * (allows updating only the fields provided).
 */
export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  company: z.string().max(200).trim().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
