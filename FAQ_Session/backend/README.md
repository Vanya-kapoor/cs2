# FAQ RAG Backend — Production TypeScript

A production-grade TypeScript backend for a FAQ system with a RAG (Retrieval-Augmented Generation) chatbot, gamified contribution badges, real-time notifications, and role-based admin moderation. Built with Express, MongoDB, better-auth, Socket.IO, Ollama, and Google Gemini.

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
│   │   └── index.ts              # BadRequestError, UnauthorizedError, ForbiddenError,
│   │                              # NotFoundError, ConflictError, ValidationError,
│   │                              # InternalServerError, DatabaseError, AuthenticationError,
│   │                              # AuthorizationError, ServiceError, TooManyRequestsError
│   ├── middleware/
│   │   ├── auth.middleware.ts    # requireAuth / attachUser / requireRole (better-auth session)
│   │   ├── error.middleware.ts   # Central error handler — maps AppError → JSON
│   │   ├── notFound.middleware.ts
│   │   ├── rateLimit.middleware.ts # ✅ globalLimiter, authLimiter, chatLimiter, queryLimiter
│   │   └── validate.middleware.ts # ✅ Zod schema validation middleware (body)
│   ├── socket/
│   │   └── socket.ts             # ✅ Socket.IO server — auth'd via better-auth session, per-user room map
│   ├── types/
│   │   ├── api.types.ts          # PaginatedResult, ApiSuccessResponse, ApiErrorResponse
│   │   ├── env.types.ts
│   │   └── express.d.ts          # req.user augmentation (AuthUser)
│   └── utils/
│       ├── asyncHandler.ts       # Wraps async handlers — no try/catch needed in routes
│       ├── logger.ts             # Winston logger (file transport in production)
│       ├── pagination.ts         # parsePagination / buildPaginatedResult
│       └── response.ts           # sendSuccess / sendCreated / sendPaginated
│
├── config/
│   ├── auth.ts                   # better-auth instance — email/password, Google OAuth, admin plugin
│   ├── db.ts                     # Mongoose connection with graceful error handling
│   ├── env.ts                    # Zod-validated env (fails fast on missing vars)
│   ├── genai.ts                  # Google Gemini embeddings client singleton
│   ├── emailTemplates.ts         # HTML email templates (verification, password reset)
│   └── mailer.ts                 # Nodemailer transporter setup + sendMail utility
│
├── modules/                      # Feature modules (each is self-contained)
│   ├── auth/
│   │   ├── auth.controller.ts    # Mounts better-auth handler + /me endpoint
│   │   └── auth.schema.ts        # ✅ Zod: signUpSchema, signInSchema, resetPasswordSchema, forgotPasswordSchema
│   │
│   ├── admin/                    # ✅ now a standalone module
│   │   ├── admin.controller.ts   # GET /users, PATCH /users/:id/role
│   │   ├── admin.dto.ts          # UpdateUserRoleDto
│   │   └── admin.service.ts      # Role updates also revoke the target's active sessions
│   │
│   ├── query/                    # User-submitted questions (pre-FAQ stage)
│   │   ├── query.interface.ts    # IQuery — title, description?, createdBy?, status
│   │   ├── query.model.ts        # Mongoose Query model
│   │   ├── query.dto.ts          # CreateQueryDto, UpdateQueryStatusDto (Zod)
│   │   ├── query.repository.ts   # findPaginated (status filter), countByStatus, markResolved,
│   │   │                          # countByUserId, countResolvedByUserId
│   │   ├── query.service.ts      # createQuery (triggers query badges), getQueries, deleteQuery
│   │   └── query.controller.ts   # Public POST + public GET list; admin GET by id / DELETE
│   │
│   ├── reply/                    # Replies to queries
│   │   ├── reply.interface.ts    # IReply — queryId, userId, content, isApproved
│   │   ├── reply.model.ts        # Mongoose Reply model
│   │   ├── reply.dto.ts          # CreateReplyDto
│   │   ├── reply.repository.ts   # findByQueryId, findPendingByQueryId, markApproved,
│   │   │                          # deleteManyByQueryId, deleteById, countApprovedByUserId
│   │   ├── reply.service.ts      # addReply (notifies query author), approveReply (badges +
│   │   │                          # notifications, does NOT auto-create FAQ), deleteReply
│   │   └── reply.controller.ts   # POST …/replies (auth); GET …/replies (public);
│   │                              # POST /replies/:id/approve (admin); DELETE /replies/:id (owner/admin)
│   │
│   ├── faq/                      # Approved knowledge base entries
│   │   ├── faq.interface.ts      # IFaq now tracks sourceQueryId + approvedReplyId
│   │   ├── faq.model.ts
│   │   ├── faq.dto.ts            # CreateFaqDto, UpdateFaqDto
│   │   ├── faq.repository.ts     # findPaginated, findBySourceQueryId, vectorSearch (Atlas $vectorSearch)
│   │   ├── embedding.service.ts  # Google Gemini embedding creation
│   │   ├── faq.service.ts        # createFaq (admin-direct), promoteQueryToFaq (✅ new explicit
│   │   │                          # promotion flow), updateFaq (re-embeds), deleteFaq
│   │   └── faq.controller.ts
│   │
│   ├── chat/
│   │   ├── chat.interface.ts     # ChatMessage, ChatSession, RagResult, ChatbotResult + Zod DTOs
│   │   ├── rag.service.ts        # Embeds question (Gemini) → vector search → Ollama (llama3.2) answer
│   │   ├── chatbot.service.ts    # In-memory multi-turn sessions (Map<sessionId, history>), max 10 messages
│   │   └── chat.controller.ts
│   │
│   ├── badge/                    # Gamification
│   │   ├── badge.interface.ts    # BadgeCategory: contribution | query | resolution | leaderboard
│   │   ├── badge.model.ts
│   │   ├── badge.repository.ts   # findByCategory, findByName
│   │   ├── badge.service.ts      # evaluateContributionBadges / evaluateQueryBadges /
│   │   │                          # evaluateResolutionBadges → awards + fires a notification
│   │   ├── badge.controller.ts
│   │   └── badge.routes.ts       # All public reads
│   │
│   ├── notification/              # ✅ entirely new module
│   │   ├── notification.model.ts # REPLY | APPROVAL | FAQ | BADGE | SYSTEM, isRead, link
│   │   ├── notification.service.ts # CRUD + emits a real-time event via Socket.IO on create
│   │   ├── notification.controller.ts
│   │   └── notification.routes.ts # All routes require auth — user only ever sees their own
│   │
│   └── user/
│       ├── user.model.ts         # Shares the "user" collection with better-auth; adds `badges[]`
│       ├── user.interface.ts
│       └── user.repository.ts    # findByEmail, addBadgeToUser
│
├── scripts/
│   ├── ingestPdf.ts               # PDF → FAQ ingestion: regex-based extraction first,
│   │                                falls back to Ollama-driven chunk extraction if that fails
│   └── seed-badges.ts             # ✅ new — upserts the 11 default badges (contribution/query/resolution)
│
├── app.ts                # Express app factory (trust proxy, CORS, rate limiting, route mounting, /health)
├── server.ts              # HTTP server + Socket.IO init + graceful shutdown + process handlers
└── index.ts                # Entry point — loads dotenv, calls startServer()
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

### Schemas in use

| Schema | Route | Fields |
|--------|-------|--------|
| `signUpSchema` | `POST /api/auth/sign-up/email` | `name` (2–80 chars), `email` (valid), `password` (6–128 chars) |
| `signInSchema` | `POST /api/auth/sign-in/email` | `email` (valid), `password` (required) |
| `resetPasswordSchema` | `POST /api/auth/reset-password` | `newPassword` (6–128 chars), `token` (required) |
| `forgotPasswordSchema` | `POST /api/auth/request-password-reset` | `email` (valid), `redirectTo` (URL, optional) |
| `CreateQueryDto` | `POST /api/queries` | `title` (min 5), `description` (optional) |
| `CreateReplyDto` | `POST /api/queries/:queryId/replies` | `content` (required) |
| `CreateFaqDto` | `POST /api/faqs` | `question` (min 5), `answer` (required) |
| `UpdateFaqDto` | `PATCH /api/faqs/:id` | `question`/`answer` (at least one required) |
| `UpdateUserRoleDto` | `PATCH /api/admin/users/:id/role` | `role` (`student` \| `admin`) |
| `AskQuestionDto` / `ChatbotDto` / `ClearSessionDto` | `/api/chat/*` | `question`, optional `sessionId` |

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
| `NODE_ENV` | `development`, `production`, or `test` |
| `PORT` | Port the server listens on (default `5000`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `GOOGLE_API_KEY` | Google AI API key (for Gemini embeddings) |
| `BETTER_AUTH_SECRET` | Random secret ≥ 32 chars (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Your API base URL (e.g. `http://localhost:5000`) |
| `CORS_ORIGIN` | Frontend origin (e.g. `http://localhost:3000`) — also used for Socket.IO CORS |
| `SYSTEM_ADMIN_ID` | User ID attributed as creator/approver for PDF-ingested FAQs (optional) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP relay for transactional email |
| `EMAIL_FROM` / `EMAIL_FROM_NAME` | Sender identity for outgoing email |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | ✅ Global limiter (default 15 min / 100 requests) |
| `AUTH_RATE_LIMIT_WINDOW_MS` / `AUTH_RATE_LIMIT_MAX` | ✅ Sign-in/sign-up limiter (default 15 min / 15) |
| `CHAT_RATE_LIMIT_WINDOW_MS` / `CHAT_RATE_LIMIT_MAX` | ✅ Chat/RAG limiter (default 1 min / 5) |
| `QUERY_RATE_LIMIT_WINDOW_MS` / `QUERY_RATE_LIMIT_MAX` | ✅ Query-creation limiter (default 15 min / 5) |

All rate-limit variables have safe defaults and are optional.

### 3. Start Ollama (for LLM inference)

```bash
ollama serve
ollama pull llama3.2
```

Gemini handles embeddings only (`GOOGLE_API_KEY`); Ollama's `llama3.2` handles the actual answer generation for both `/api/chat/ask` and `/api/chat/chatbot`.

### 4. Seed badges

```bash
npx tsx src/scripts/seed-badges.ts
```

Upserts the 11 default contribution/query/resolution badges by name, so it's safe to re-run.

### 5. Ingest FAQ PDF (optional)

Place your `Faq.pdf` in `./data/`, then:

```bash
npm run ingest
```

The script first tries a direct regex-based pass (matching numbered `X.Y Question? Answer` patterns) and seeds those FAQs immediately if it finds any. Only if that extraction comes back empty does it fall back to chunking the PDF and asking Ollama to extract `{question, answer}` pairs per chunk.

### 6. Start the server

```bash
# Development (watch mode)
npm run dev

# Production
npm run build && npm start
```

---

## API Reference

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check — returns `{ status: "ok", env }` |

### Authentication & Authorization

Built on better-auth with email/password, Google OAuth, session management, RBAC, email verification, and password reset. All auth endpoints with custom logic have Zod validation on request bodies; everything else (OAuth, session, sign-out) falls through to better-auth's own handler.

| Method | Path | Validation | Description |
|--------|------|------------|--------------|
| POST | `/api/auth/sign-up/email` | ✅ `signUpSchema` | Register with email |
| POST | `/api/auth/sign-in/email` | ✅ `signInSchema` | Login with email |
| POST | `/api/auth/sign-in/social` | — | Google OAuth login |
| POST | `/api/auth/sign-out` | — | Logout |
| GET | `/api/auth/get-session` | — | Get current session |
| GET | `/api/auth/me` | — | Get authenticated user (custom route) |
| POST | `/api/auth/request-password-reset` | ✅ `forgotPasswordSchema` | Send password reset email |
| POST | `/api/auth/reset-password` | ✅ `resetPasswordSchema` | Reset password |
| POST | `/api/auth/send-verification-email` | — | Send verification email |
| GET | `/api/auth/verify-email` | — | Verify email (redirects to `CORS_ORIGIN/email-verified`) |
| GET | `/api/auth/callback/google` | — | Google OAuth callback |

Role checks (`requireRole`) surface two machine-readable error codes on `403` so the frontend can react instead of showing a raw error:
- **`STALE_ROLE_SESSION`** — admin access required but the cached session still shows the old role (e.g. just promoted/demoted); frontend should re-sync the session.
- **`EMAIL_VERIFICATION_REQUIRED`** — user's role is `admin` but their email isn't verified yet; admin actions are blocked until they verify.

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users |
| PATCH | `/api/admin/users/:id/role` | Admin | Change a user's role; also revokes that user's active sessions so the change is instant. Admins cannot change their own role. |

### Queries

| Method | Path | Auth | Validation | Description |
|--------|------|------|------------|-------------|
| POST | `/api/queries` | Public (attaches user if logged in) | ✅ `CreateQueryDto` | Raise a query; attributed to the user if authenticated, otherwise anonymous |
| GET | `/api/queries` | Public | — | Paginated list, optional `?status=pending\|resolved` filter |
| GET | `/api/queries/:id` | Admin | — | Get a single query |
| DELETE | `/api/queries/:id` | Admin | — | Delete a query |

Creating a query as a logged-in user triggers query-count badge evaluation in the background.

### Replies

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/queries/:queryId/replies` | Authenticated | Reply to an open (non-resolved) query; notifies the query author |
| GET | `/api/queries/:queryId/replies` | Public | List replies for a query |
| POST | `/api/replies/:id/approve` | Admin | Marks the reply approved and the query resolved; evaluates contribution/resolution badges; notifies the replier and the query author. **Does not** create a FAQ — see below. |
| DELETE | `/api/replies/:id` | Owner or Admin | Delete a reply |

### FAQs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/faqs` | Public | Paginated FAQ list |
| GET | `/api/faqs/:id` | Public | Get single FAQ |
| POST | `/api/faqs` | Admin | Create FAQ directly (question + answer typed manually) |
| POST | `/api/faqs/promote/:queryId` | Admin | ✅ Promotes a **resolved** query's approved reply into a standalone FAQ entry, linking back via `sourceQueryId`/`approvedReplyId` |
| PATCH | `/api/faqs/:id` | Admin | Update FAQ (re-generates embedding if the answer changes) |
| DELETE | `/api/faqs/:id` | Admin | Delete FAQ (leaves the source query/reply untouched — it stays resolved, so admins can re-promote later) |

Reply approval and FAQ creation are now two deliberate, separate admin actions rather than one automatic step — approving a reply only resolves the query; turning that into a searchable FAQ entry is an explicit follow-up call to `promote/:queryId`.

### Badges & Gamification

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/badges` | Public | All available badges |
| GET | `/api/badges/leaderboard` | Public | Top 10 contributors by approved-reply count |
| GET | `/api/badges/users/:userId` | Public | User's earned badges |
| GET | `/api/badges/stats/:userId` | Public | Approved replies, total/resolved queries, approval rate |

Badges are organized into three evaluated categories (seeded via `seed-badges.ts`):
- **Contribution** — based on approved-reply count (1 / 5 / 10 / 25 / 50)
- **Query** — based on queries raised (1 / 5 / 20)
- **Resolution** — based on the user's own queries getting resolved (1 / 10 / 25)

Each newly earned badge fires a real-time `BADGE` notification to the recipient.

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications` | Authenticated | Latest 100 notifications for the current user |
| PATCH | `/api/notifications/read-all` | Authenticated | Mark all as read |
| PATCH | `/api/notifications/:id/read` | Authenticated | Mark one as read |
| DELETE | `/api/notifications/all` | Authenticated | Delete all notifications |
| DELETE | `/api/notifications/:id` | Authenticated | Delete one notification |

Notification types: `REPLY`, `APPROVAL`, `FAQ`, `BADGE`, `SYSTEM`. Created internally by the reply and badge services; never created directly by a client request.

### Chat

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/chat/ask` | Public | `chatLimiter` | Stateless RAG query — embeds the question, vector-searches FAQs, asks Ollama |
| POST | `/api/chat/chatbot` | Public | `chatLimiter` | Multi-turn chatbot; pass `sessionId` to continue a conversation |
| POST | `/api/chat/chatbot/clear` | Public | `chatLimiter` | Clear an in-memory chatbot session |

The RAG pipeline only passes FAQ context to the LLM when the vector-search score clears a `0.82` similarity threshold; below that it returns a canned "could not find relevant information" response without invoking the LLM at all.

---

## Real-time (Socket.IO)

`server.ts` initializes a Socket.IO server alongside the HTTP server. Each socket connection is authenticated using the same better-auth session cookie used by the REST API (`getAuth().api.getSession`) — unauthenticated sockets are rejected at the handshake. Authenticated sockets are tracked in a `userId → Set<socketId>` map so the backend can push events to every active connection for a given user (multiple tabs/devices).

Currently the only event emitted is `new_notification`, fired by `NotificationService.createNotification()` whenever a `REPLY`, `APPROVAL`, `BADGE`, `FAQ`, or `SYSTEM` notification is created — so notification delivery is push-based rather than poll-based on the frontend.

---

## Rate Limiting

`src/core/middleware/rateLimit.middleware.ts` defines four limiters, all funneling hits through the same `TooManyRequestsError` (`429`) so the response shape matches every other error in the app:

| Limiter | Applies to | Default | Notes |
|---|---|---|---|
| `globalLimiter` | Every route | 100 req / 15 min | Disabled in development |
| `authLimiter` | `/api/auth/*` | 15 req / 15 min | Brute-force protection on sign-in/sign-up; disabled in development |
| `chatLimiter` | `/api/chat/*` | 5 req / 1 min | Protects LLM/embedding costs — **stays active in development too** |
| `queryLimiter` | `POST /api/queries` only | 5 req / 15 min | GET requests on the same path are exempt; disabled in development |

The key generator buckets authenticated requests by `user:<id>` and everything else by `ip:<address>`, so logged-in users on a shared network (e.g. a university Wi-Fi) don't share a single rate-limit bucket. `app.set('trust proxy', 1)` is set so `req.ip` reflects the real client IP behind Nginx/Render/Railway/Cloudflare rather than the proxy's own address.

---

## Data Flow

```
Unauthenticated or authenticated user
  └─ POST /api/queries              → validated by CreateQueryDto → Query { status: "pending" }
                                       (badge evaluation if authenticated)

Any user (auth required to reply)
  └─ POST /api/queries/:id/replies  → Reply { isApproved: false } → notifies query author

Admin (email must be verified)
  ├─ GET  /api/queries/:id/replies  → review replies (public read, no auth required)
  ├─ POST /api/replies/:id/approve
  │     → Reply.isApproved = true
  │     → Query.status     = "resolved"
  │     → Contribution + resolution badges evaluated
  │     → Notifications sent to replier and query author
  └─ POST /api/faqs/promote/:queryId   (separate, explicit step)
        → Reuses the approved reply + resolved query
        → FAQ created with embedding, linked via sourceQueryId/approvedReplyId
```

---

## Error Handling Strategy

- All async route handlers wrapped with `asyncHandler` — no try/catch in routes.
- A single `AppError` base class carries `statusCode`, `isOperational`, and optional `details`; the full hierarchy covers `BadRequestError` (400), `UnauthorizedError`/`AuthenticationError` (401), `ForbiddenError`/`AuthorizationError` (403), `NotFoundError` (404), `ConflictError` (409), `ValidationError` (422), `TooManyRequestsError` (429), `InternalServerError`/`DatabaseError` (500), and `ServiceError` (503).
- A single `errorMiddleware` maps every error to a consistent JSON response, logging operational errors at `warn` and unexpected ones at `error` (with stack traces only in development).
- Zod validation errors return `400` with a per-field `errors` object before hitting any service code.
- Rate-limit hits are routed through `next(new TooManyRequestsError())` so they share the exact same response shape as any other error.

---

## SOLID Principles Applied

- **S** — Controllers handle HTTP, services handle business logic, repositories handle data access.
- **O** — `BaseRepository`, `BaseService`, `BaseController` are open for extension, closed for modification.
- **L** — All concrete repositories/services substitute cleanly for their base types.
- **I** — Interfaces (`IFaq`, `IQuery`, `IReply`, `IBadge`, `INotification`) are small and focused.
- **D** — Services depend on repositories (and on each other, e.g. `ReplyService` → `BadgeService`/`NotificationService`) via constructor injection rather than reaching for singletons.

---

## Scripts

| Script | Purpose |
|---|---|
| `src/scripts/seed-badges.ts` | Upserts the 11 default badges by name — safe to re-run, idempotent |
| `src/scripts/ingestPdf.ts` | Bulk-loads `./data/Faq.pdf` into the FAQ collection with embeddings: regex extraction first, Ollama-chunk extraction as a fallback |
