import { z } from 'zod';

// MongoDB ObjectId validation (named to avoid mongoose collision)
export const ObjectIdStringSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
export type ObjectIdString = z.infer<typeof ObjectIdStringSchema>;

// Common ID param for API routes
export const IdParamSchema = z.object({
  id: ObjectIdStringSchema,
});
export type IdParam = z.infer<typeof IdParamSchema>;

// Pagination schema with coercion for query params
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type PaginationInput = z.infer<typeof PaginationSchema>;

// Email validation (reusable) - applies lowercase + trim
export const EmailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

/**
 * Password validation with security requirements.
 * Requires: 8-100 chars, at least one uppercase, one lowercase, one digit.
 * Special characters are encouraged but not required for MVP.
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit');

/**
 * ISO 8601 date string validation.
 * Use for date filters and API date fields.
 * Accepts formats like: 2026-01-29, 2026-01-29T13:30:00Z, 2026-01-29T13:30:00.000Z
 */
export const ISODateStringSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
    'Invalid date format. Use ISO 8601 (e.g., 2026-01-29 or 2026-01-29T13:30:00Z)'
  )
  .refine(
    (val) => !isNaN(Date.parse(val)),
    'Invalid date value'
  );
export type ISODateString = z.infer<typeof ISODateStringSchema>;

/** Optional ISO date string (for filters) */
export const OptionalISODateStringSchema = ISODateStringSchema.nullable().optional();
