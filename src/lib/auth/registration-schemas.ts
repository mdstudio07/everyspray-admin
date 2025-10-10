/**
 * Registration Form Validation Schemas
 *
 * Zod schemas for registration flow
 * Following Rule 21 (Types-First Development)
 */

import { z } from 'zod';

export const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export const detailsSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters long')
    .max(50, 'Full name must be less than 50 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must be less than 20 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms of service'),
});

export type EmailFormData = z.infer<typeof emailSchema>;
export type DetailsFormData = z.infer<typeof detailsSchema>;
