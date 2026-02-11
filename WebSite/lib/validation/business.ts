import { z } from 'zod';

/**
 * Username validation schema.
 * 3-30 chars, lowercase alphanumeric, hyphens, underscores.
 */
export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores')
  .toLowerCase()
  .trim();
export type UsernameInput = z.infer<typeof UsernameSchema>;

/**
 * Set username schema.
 */
export const SetUsernameSchema = z.object({
  username: UsernameSchema,
});
export type SetUsernameInput = z.infer<typeof SetUsernameSchema>;

/**
 * Create business schema.
 */
export const CreateBusinessSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  primaryUrl: z.string().min(1, 'URL is required').trim(),
  subUrls: z.array(z.string().min(1)).max(20).default([]),
  competitorUrls: z.array(z.string().min(1)).max(10).default([]),
  category: z.string().min(1, 'Category is required').max(100).trim(),
  description: z.string().max(500).trim().optional(),
});
export type CreateBusinessInput = z.infer<typeof CreateBusinessSchema>;

/**
 * Update business schema - all fields optional.
 */
export const UpdateBusinessSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  primaryUrl: z.string().min(1).trim().optional(),
  subUrls: z.array(z.string().min(1)).max(20).optional(),
  competitorUrls: z.array(z.string().min(1)).max(10).optional(),
  category: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
});
export type UpdateBusinessInput = z.infer<typeof UpdateBusinessSchema>;

/**
 * Change password schema.
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
