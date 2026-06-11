# FAQ RAG Backend — Production TypeScript

A production-grade TypeScript backend for a FAQ system with RAG (Retrieval-Augmented Generation) chatbot, built with Express, MongoDB, better-auth, and Ollama/Google Gemini.

---

## Architecture

```
src/
├── core/                         # Framework-level infrastructure (no business logic)
│   ├── base/
│   │   ├── BaseController.ts     # Abstract controller — owns Router, registers routes
│   │   ├── BaseService.ts        # Abstract service — injects logger
│   │   └── BaseRepository.ts     # Generic CRUD over any Mongoose model
│   ├── constants/
│   │   ├── httpStatus.ts         # Typed HTTP status codes
│   │   ├── messages.ts           # All user-facing strings in one place
│   │   └── roles.ts              # Role enum (student | admin)
│   ├── errors/
│   │   ├── AppError.ts           # Base error (statusCode, isOperational, details)
│   │   └── index.ts              # BadRequestError, NotFoundError, ForbiddenError, etc.
│   ├── middleware/
│   │   ├── auth.middleware.ts    # requireAuth / requireRole (better-auth session)
│   │   ├── error.middleware.ts   # Central error handler — maps AppError → JSON
│   │   ├── notFound.middleware.ts
│   │   └── validate.middleware.ts # ✅ Zod schema validation middleware (body/query/params)
│   ├── types/
│   │   ├── api.types.ts          # PaginatedResult, ApiSuccessResponse, etc.
│   │   ├── env.types.ts
│   │   └── express.d.ts          # req.user augmentation
│   └── utils/
│       ├── asyncHandler.ts       # Wraps async handlers — no try/catch needed in routes
│       ├── logger.ts             # Winston logger
│       ├── pagination.ts         # parsePagination / buildPaginatedResult
│       └── response.ts           # sendSuccess / sendCreated / sendPaginated
│
├── config/
│   ├── auth.ts                   # better-auth instance with email/password + admin plugin
│   ├── db.ts                     # Mongoose connection with graceful error handling
│   ├── env.ts                    # Zod-validated env (fails fast on missing vars)
│   ├── genai.ts                  # Google GenAI + Embeddings client singletons
│   ├── emailTemplates.ts         # HTML email templates (verification, password reset, etc.)
│   └── mailer.ts                 # Nodemailer transporter setup + sendMail utility
│
├── modules/                      # Feature modules (each is self-contained)
│   ├── auth/
│   │   ├── auth.controller.ts    # Mounts better-auth handler + /me endpoint
│   │   └── auth.schema.ts        # ✅ Zod schemas: signUpSchema, signInSchema, resetPasswordSchema, forgotPasswordSchema
│   │
│   ├── query/                    # User-submitted questions (pre-FAQ stage)
│   │   ├── query.interface.ts    # IQuery — title, description?, createdBy?, status
│   │   ├── query.model.ts        # Mongoose Query model
│   │   ├── query.dto.ts          # ✅ CreateQueryDto, UpdateQueryStatusDto (Zod)
│   │   ├── query.repository.ts   # findPaginated (with status filter), markResolved
│   │   ├── query.service.ts      # createQuery, getQueries, deleteQuery
│   │   └── query.controller.ts   # Public POST /api/queries; admin GET/DELETE
│   │
│   ├── reply/                    # Authenticated user replies to queries
│   │   ├── reply.interface.ts    # IReply — queryId, userId, content, isApproved
│   │   ├── reply.model.ts        # Mongoose Reply model
│   │   ├── reply.dto.ts          # CreateReplyDto
│   │   ├── reply.repository.ts   # findByQueryId, markApproved, deleteManyByQueryId
│   │   ├── reply.service.ts      # addReply, approveReply (→ creates FAQ + embedding)
│   │   └── reply.controller.ts   # POST …/replies (auth); POST …/approve (admin)
│   │
│   ├── faq/                      # Approved knowledge base entries
│   │   ├── faq.interface.ts
│   │   ├── faq.model.ts
│   │   ├── faq.dto.ts
│   │   ├── faq.repository.ts     # FaqRepository + vectorSearch (Atlas $vectorSearch)
│   │   ├── embedding.service.ts  # Google Gemini embedding creation
│   │   ├── faq.service.ts
│   │   └── faq.controller.ts
│   │
│   ├── chat/
│   │   ├── chat.interface.ts
│   │   ├── rag.service.ts
│   │   ├── chatbot.service.ts
│   │   └── chat.controller.ts
│   │
│   ├── badge/
│   │   ├── badge.interface.ts
│   │   ├── badge.model.ts
│   │   ├── badge.repository.ts
│   │   ├── badge.service.ts
│   │   ├── badge.controller.ts
│   │   └── badge.routes.ts
│   │
│   └── user/
│       ├── user.model.ts
│       ├── user.interface.ts
│       └── user.repository.ts
│
├── scripts/
│   └── ingestPdf.ts              # One-off PDF → FAQ ingestion (LLM + embeddings)
│
├── app.ts                        # Express app factory (middleware + route mounting)
├── server.ts                     # HTTP server + graceful shutdown + process handlers
└── index.ts                      # Entry point — loads dotenv, calls startServer()
```

---

## Zod Validation

All incoming request bodies are validated using [Zod](https://zod.dev) before any business logic runs. Invalid requests are rejected at the middleware layer with a structured `400` response — better-auth and service code never see malformed data.

### How it works

**Middleware** — `src/core/middleware/validate.middleware.ts`

```ts
export const validate = (schema: ZodSchema) =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data; // sanitized & typed
    next();
  };
```

**Usage in a controller**

```ts
this.router.post('/sign-up/email', validate(signUpSchema), this.betterAuthHandler);
```

### Auth schemas — `src/modules/auth/auth.schema.ts`

| Schema | Route | Fields |
|--------|-------|--------|
| `signUpSchema` | `POST /api/auth/sign-up/email` | `name` (min 2), `email` (valid), `password` (min 6) |
| `signInSchema` | `POST /api/auth/sign-in/email` | `email` (valid), `password` (required) |
| `resetPasswordSchema` | `POST /api/auth/reset-password` | `newPassword` (min 6), `token` (required) |
| `forgotPasswordSchema` | `POST /api/auth/request-password-reset` | `email` (valid), `redirectTo` (URL, optional) |

### Query schemas — `src/modules/query/query.dto.ts`

| Schema | Route | Fields |
|--------|-------|--------|
| `CreateQueryDto` | `POST /api/queries` | `title` (min 5), `description` (optional) |

### Validation error response format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Please enter a valid email address"],
    "password": ["Password must be at least 6 characters"]
  }
}
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Port the server listens on (e.g. `5000`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `GOOGLE_API_KEY` | Google AI API key (for Gemini embeddings) |
| `BETTER_AUTH_SECRET` | Random secret ≥ 32 chars (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Your API base URL (e.g. `http://localhost:5000`) |
| `CORS_ORIGIN` | Frontend origin (e.g. `http://localhost:3000`) |
| `SYSTEM_ADMIN_ID` | Your System Admin ID |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `SMTP_HOST` | SMTP relay host (e.g. `smtp-relay.brevo.com`) |
| `SMTP_PORT` | SMTP port (e.g. `587`) |
| `SMTP_USER` | SMTP login username |
| `SMTP_PASS` | SMTP password or App Password |
| `EMAIL_FROM` | Sender email address |
| `EMAIL_FROM_NAME` | Sender display name |

### 3. Start Ollama (for LLM inference)

```bash
ollama serve
ollama pull llama3.2
```

### 4. Ingest FAQ PDF

Place your `Faq.pdf` in `./data/`, then:

```bash
npm run ingest
```

### 5. Start the server

```bash
# Development (watch mode)
npm run dev

# Production
npm run build && npm start
```

---

## API Reference

### Authentication & Authorization

Built using Better Auth with email/password, Google OAuth, session management, RBAC, email verification, and password reset. All auth endpoints have Zod validation on request bodies.

#### Auth Routes

| Method | Path | Validation | Description |
|--------|------|------------|-------------|
| POST | `/api/auth/sign-up/email` | ✅ `signUpSchema` | Register with email |
| POST | `/api/auth/sign-in/email` | ✅ `signInSchema` | Login with email |
| POST | `/api/auth/sign-in/social` | — | Google OAuth login |
| POST | `/api/auth/sign-out` | — | Logout |
| GET | `/api/auth/get-session` | — | Get current session |
| GET | `/api/auth/me` | — | Get authenticated user |
| POST | `/api/auth/request-password-reset` | ✅ `forgotPasswordSchema` | Send password reset email |
| POST | `/api/auth/reset-password` | ✅ `resetPasswordSchema` | Reset password |
| POST | `/api/auth/send-verification-email` | — | Send verification email |
| GET | `/api/auth/verify-email` | — | Verify email |
| GET | `/api/auth/callback/google` | — | Google OAuth callback |

### Queries

| Method | Path | Auth | Validation | Description |
|--------|------|------|------------|-------------|
| POST | `/api/queries` | Public | ✅ `CreateQueryDto` | Raise a query |
| GET | `/api/queries` | Admin | — | List all queries |
| GET | `/api/queries/:id` | Admin | — | Get a single query |
| DELETE | `/api/queries/:id` | Admin | — | Delete a query |

### Replies

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/queries/:queryId/replies` | Authenticated | Reply to a query |
| GET | `/api/queries/:queryId/replies` | Admin | List replies |
| POST | `/api/replies/:id/approve` | Admin | Approve reply → auto-create FAQ + award badges |

### FAQs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/faqs` | Public | Paginated FAQ list |
| GET | `/api/faqs/:id` | Public | Get single FAQ |
| POST | `/api/faqs` | Admin | Create FAQ directly |
| PATCH | `/api/faqs/:id` | Admin | Update FAQ (re-generates embedding) |
| DELETE | `/api/faqs/:id` | Admin | Delete FAQ |

### Badges & Gamification

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/badges` | Public | All available badges |
| GET | `/api/badges/leaderboard` | Public | Top 10 contributors |
| GET | `/api/badges/users/:userId` | Public | User's earned badges |
| GET | `/api/badges/stats/:userId` | Public | User statistics |

### Chat

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/chat/ask` | Public | Stateless RAG query |
| POST | `/api/chat/chatbot` | Public | Multi-turn chatbot (pass `sessionId`) |
| POST | `/api/chat/chatbot/clear` | Public | Clear chatbot session |

---

## Data Flow

```
Unauthenticated user
  └─ POST /api/queries          → validated by CreateQueryDto → Query { status: "pending" }

Authenticated user
  └─ POST /api/queries/:id/replies  → Reply { isApproved: false }

Admin (email must be verified)
  ├─ GET  /api/queries/:id/replies  → review replies
  └─ POST /api/replies/:id/approve
        → Reply.isApproved = true
        → Query.status     = "resolved"
        → FAQ created with embedding
        → Badge evaluation triggered
```

---

## Error Handling Strategy

- All async route handlers wrapped with `asyncHandler` — no try/catch in routes.
- Custom `AppError` hierarchy (`NotFoundError`, `ForbiddenError`, `ValidationError`, etc.).
- Single `errorMiddleware` maps all errors to consistent JSON responses.
- Zod validation errors return `400` with per-field `errors` object before hitting any service code.

---

## SOLID Principles Applied

- **S** — Controllers handle HTTP, services handle logic, repositories handle data.
- **O** — `BaseRepository`, `BaseService`, `BaseController` are open for extension, closed for modification.
- **L** — All concrete repositories/services can substitute for their base types.
- **I** — Interfaces (`IFaq`, `IQuery`, `IReply`, `IBadge`) are small and focused.
- **D** — Services depend on repositories via constructor injection.
