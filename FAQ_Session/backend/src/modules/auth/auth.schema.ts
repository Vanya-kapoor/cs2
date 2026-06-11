import { z } from 'zod';

/** Reusable field rules */
const emailField = z
  .string({ required_error: 'Email is required' })
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be at most 128 characters');

/** POST /api/auth/sign-up/email */
export const signUpSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must be at most 80 characters')
    .trim(),
  email: emailField,
  password: passwordField,
});

/** POST /api/auth/sign-in/email */
export const signInSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

/** POST /api/auth/reset-password */
export const resetPasswordSchema = z
  .object({
    newPassword: passwordField,
    token: z
      .string({ required_error: 'Reset token is required' })
      .min(1, 'Reset token is required'),
  });

/** POST /api/auth/request-password-reset */
export const forgotPasswordSchema = z.object({
  email: emailField,
  redirectTo: z.string().url('redirectTo must be a valid URL').optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
