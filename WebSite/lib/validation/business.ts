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

const currentYear = new Date().getFullYear();

/**
 * Extended business context fields.
 * These enrich the audit request sent to the Python service
 * (see server/src/models/business.py AuditRequest). All optional.
 */
const businessContextFields = {
  targetKeywords: z.array(z.string().min(1).max(100)).max(10).default([]),
  servicesOrProducts: z.array(z.string().min(1).max(100)).max(10).default([]),
  uniqueSellingPoints: z.array(z.string().min(1).max(200)).max(5).default([]),
  targetAudience: z.string().max(200).trim().optional(),
  priceRange: z.enum(['budget', 'mid', 'premium']).optional(),
  yearFounded: z.number().int().min(1800).max(currentYear).optional(),
  certifications: z.array(z.string().min(1).max(100)).max(10).default([]),
  socialMediaUrls: z.array(z.string().min(1).max(300)).max(6).default([]),
  localityTier: z.enum(['global', 'national', 'hyper_local']).optional(),
  city: z.string().max(100).trim().optional(),
  country: z.string().max(100).trim().optional(),
  neighborhood: z.string().max(100).trim().optional(),
  street: z.string().max(200).trim().optional(),
  region: z.string().max(100).trim().optional(),
};

/**
 * Create business schema.
 */
export const CreateBusinessSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  primaryUrl: z.string().min(1, 'URL is required').trim(),
  subUrls: z.array(z.string().min(1)).max(3).default([]),
  competitorUrls: z.array(z.string().min(1)).max(3).default([]),
  category: z.string().min(1, 'Category is required').max(100).trim(),
  description: z.string().max(500).trim().optional(),
  ...businessContextFields,
});
export type CreateBusinessInput = z.infer<typeof CreateBusinessSchema>;

/**
 * Update business schema - all fields optional.
 */
export const UpdateBusinessSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  primaryUrl: z.string().min(1).trim().optional(),
  subUrls: z.array(z.string().min(1)).max(3).optional(),
  competitorUrls: z.array(z.string().min(1)).max(3).optional(),
  category: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  targetKeywords: z.array(z.string().min(1).max(100)).max(10).optional(),
  servicesOrProducts: z.array(z.string().min(1).max(100)).max(10).optional(),
  uniqueSellingPoints: z.array(z.string().min(1).max(200)).max(5).optional(),
  targetAudience: z.string().max(200).trim().optional(),
  priceRange: z.enum(['budget', 'mid', 'premium']).optional(),
  yearFounded: z.number().int().min(1800).max(currentYear).optional(),
  certifications: z.array(z.string().min(1).max(100)).max(10).optional(),
  socialMediaUrls: z.array(z.string().min(1).max(300)).max(6).optional(),
  localityTier: z.enum(['global', 'national', 'hyper_local']).optional(),
  city: z.string().max(100).trim().optional(),
  country: z.string().max(100).trim().optional(),
  neighborhood: z.string().max(100).trim().optional(),
  street: z.string().max(200).trim().optional(),
  region: z.string().max(100).trim().optional(),
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
