import { z } from 'zod';

/**
 * Input validation schemas using Zod
 * All user input must be validated against these schemas
 */

// Bill validation
export const billNumberSchema = z.string()
  .min(1)
  .max(50)
  .regex(/^(H\.R\.|S\.) \d+$/, 'Invalid bill number format');

export const billSchema = z.object({
  number: billNumberSchema,
  title: z.string().min(1).max(500),
  sponsor: z.string().min(1).max(255),
  congress: z.number().int().min(1).max(200),
  introducedDate: z.string().datetime(),
});

// Section validation
export const sectionSchema = z.object({
  billId: z.string().uuid(),
  sectionNumber: z.string().min(1).max(50),
  title: z.string().min(1).max(500),
  simplifiedSummary: z.string().min(1),
  ideologyScore: z.number().int().min(-5).max(5),
  politicalLean: z.number().int().min(-5).max(5),
});

// Author validation
export const authorSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(12).max(255),
  party: z.enum(['democratic', 'republican', 'independent']),
  title: z.string().min(1).max(255),
});

// Login validation
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Partisan perspective validation
export const perspectiveSchema = z.object({
  billId: z.string().uuid(),
  perspective: z.string().min(10).max(5000),
  keyPoints: z.array(z.string().max(500)).max(10),
  concerns: z.array(z.string().max(500)).max(10).optional(),
  supports: z.array(z.string().max(500)).max(10).optional(),
});

/**
 * Sanitize HTML content to prevent XSS
 * Use DOMPurify on the client side, this is for server-side basic sanitization
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { success: false, error: 'Validation failed' };
  }
}
