# FAQ RAG Frontend — React + TypeScript + Vite

A React 19 frontend built with Vite for the FAQ RAG system, featuring authentication modals, query submission, FAQ browsing, an AI-powered chatbot, and a gamification leaderboard.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 6.0 | Type safety |
| Vite | 8 | Build tool & dev server |
| React Router | v7 | Client-side routing |
| Axios | 1.x | HTTP client |
| TanStack Query | v5 | Server state management |
| Zod | 4.x | Schema validation |
| react-hook-form | 7.x | Form state management |
| @hookform/resolvers | 5.x | Zod + react-hook-form bridge |
| Tailwind CSS | 4.3 | Utility-first styling |
| Framer Motion | 12 | Animations |
| Lucide React | latest | Icons |

---

## Quick Start

### 1. Install dependencies

```bash
cd FAQ_Session/frontend
npm install
```

### 2. Configure environment

Create a `.env.local` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> **Note:** Vite uses `VITE_` prefix for environment variables. Replace `REACT_APP_` with `VITE_`.

### 3. Start the development server

```bash
npm run dev
```

App runs at http://localhost:3000

The backend must be running at the URL set in `VITE_API_BASE_URL` for API calls to work.

---

## Building for Production

```bash
npm run build
```

Outputs optimized build to `dist/`

Preview the production build locally:

```bash
npm run preview
```

---

## Zod Validation Setup

### Why Zod + react-hook-form?

- **Zod** defines the shape and rules of form data as a TypeScript-first schema.
- **react-hook-form** manages form state, touched/dirty state, and submission with zero re-renders.
- **@hookform/resolvers** is the glue — it runs your Zod schema as the form validator.

Together they give you: inline per-field errors, no manual `if (!email)` checks, type-safe form data, and validation that matches the backend rules exactly.

### Installation

```bash
npm install zod react-hook-form @hookform/resolvers
```

> **Note:** This project uses Zod v4. The `required_error` option was removed in v4. Use `.min(1, 'message')` instead.

### Schema file — `src/utils/authSchemas.ts`

All auth-related Zod schemas live here and are shared across components:

```ts
import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(80).trim(),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
```

### Using a schema in a component

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, SignInFormData } from '../utils/authSchemas';

function SignInForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    await signIn(data.email, data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <input type="email" {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}

      <input type="password" {...register('password')} />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit" disabled={isSubmitting}>Sign In</button>
    </form>
  );
}
```

### Validation rules

| Form | Field | Rules |
|---|---|---|
| Sign In | email | Required, valid email format |
| Sign In | password | Required |
| Sign Up | name | Required, min 2 chars, max 80 chars |
| Sign Up | email | Required, valid email format |
| Sign Up | password | Required, min 6 chars, max 128 chars |
| Sign Up | confirmPassword | Must match password |
| Forgot Password | email | Required, valid email format |
| Reset Password | password | Required, min 6 chars, max 128 chars |
| Reset Password | confirmPassword | Must match password |
| Ask Question | title | Required, min 5 chars, max 200 chars |
| Ask Question | description | Required, min 10 chars |

### Zod v4 breaking change

If you see this TypeScript error:

```
'required_error' does not exist in type '{ error?: string ... }'
```

You are on Zod v4 and used the old v3 `required_error` option. Fix it:

```ts
// Zod v3 — broken in v4
z.string({ required_error: 'Email is required' })

// Zod v4 — correct
z.string().min(1, 'Email is required')
```

---

## Project Structure

```
src/
├── components/
│   ├── LoginModal.tsx        # Sign in / Sign up / Forgot password (Zod validated)
│   └── ...
├── context/
│   ├── AuthContext.tsx       # Auth state: signIn, signUp, signOut
│   └── AppContext.tsx        # Questions, queries, app-level state
├── pages/
│   ├── AskQuestion.tsx       # Query submission form (client-side validated)
│   ├── ResetPasswordPage.tsx # Password reset form (Zod validated)
│   └── ...
├── utils/
│   ├── api.ts                # Axios client + all API service methods
│   └── authSchemas.ts        # Zod schemas for all auth forms
└── types/
    └── index.ts              # Shared TypeScript types
```

---

## Available Scripts

```bash
npm run dev      # Dev server at http://localhost:3000 (with HMR)
npm run build    # Production build to /dist
npm run preview  # Preview production build locally
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| VITE_API_BASE_URL | http://localhost:5000/api | Backend API base URL |

> **Important:** Use `VITE_` prefix for all environment variables in `.env.local`. Access them in code as `import.meta.env.VITE_API_BASE_URL`.

---

## Vite Migration Notes

This project was migrated from Create React App to Vite for faster builds and better dev experience:

- **Faster dev server**: Vite uses native ES modules with HMR (Hot Module Replacement)
- **Smaller builds**: Optimized production bundles
- **Better DX**: Instant server startup and faster HMR
- **Updated build commands**: `npm run dev` instead of `npm start`
- **Environment variables**: Use `VITE_` prefix and access via `import.meta.env`
