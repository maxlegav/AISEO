import { NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { ErrorType } from '@/lib/error-handler';

/**
 * Format Zod errors into a user-friendly structure.
 * Maps field paths to their first error message.
 */
export function formatZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    // Handle root-level errors (empty path) with a special key
    const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
    // Only keep first error per field
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return errors;
}

/**
 * Handle Zod validation error and return API response.
 * Use with safeParse() pattern in API routes.
 *
 * @example
 * const result = LoginSchema.safeParse(req.body);
 * if (!result.success) {
 *   return handleZodError(result.error, res);
 * }
 * const validatedData = result.data;
 */
export function handleZodError(
  error: ZodError,
  res: NextApiResponse,
  customMessage?: string
) {
  const fieldErrors = formatZodErrors(error);

  return res.status(400).json({
    success: false,
    error: ErrorType.VALIDATION,
    message: customMessage || 'Validation failed',
    details: fieldErrors,
  });
}

/**
 * Type guard to check if error is ZodError.
 * Useful in catch blocks to handle validation errors differently.
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}
