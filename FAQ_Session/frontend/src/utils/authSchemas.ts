import { z } from 'zod';

const emailField = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

const passwordField = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password is too long');

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(80, 'Name is too long')
      .trim(),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
