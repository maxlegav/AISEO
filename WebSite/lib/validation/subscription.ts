import { z } from 'zod';
import { EmailSchema } from './common';

/**
 * Checkout schema for creating Stripe sessions.
 * priceId is the Stripe price ID for the product.
 * mode determines if it's a subscription or one-time payment.
 */
export const CheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  mode: z.enum(['subscription', 'payment'], {
    errorMap: () => ({ message: 'Mode must be either "subscription" or "payment"' }),
  }),
});
export type CheckoutInput = z.infer<typeof CheckoutSchema>;

/**
 * Forgot password schema - just email.
 * Always returns success to prevent email enumeration.
 */
export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * Reset password schema - token + new password.
 * Password must meet security requirements:
 * - At least 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 */
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(100, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/**
 * Delete account schema - password + confirmation.
 * Requires user to type "DELETE" to confirm.
 */
export const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Type DELETE to confirm account deletion' }),
  }),
});
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;

/**
 * Language preference schema.
 * Supports English and French.
 */
export const LanguagePreferenceSchema = z.object({
  language: z.enum(['en', 'fr'], {
    errorMap: () => ({ message: 'Language must be "en" or "fr"' }),
  }),
});
export type LanguagePreferenceInput = z.infer<typeof LanguagePreferenceSchema>;
