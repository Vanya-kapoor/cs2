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
│   │   └── validate.middleware.ts # Zod schema validation for body/query/params
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
│   │   └── auth.controller.ts    # Mounts better-auth handler + /me endpoint
│   │
│   ├── query/                    # User-submitted questions (pre-FAQ stage)
│   │   ├── query.interface.ts    # IQuery — title, description?, createdBy?, status
│   │   ├── query.model.ts        # Mongoose Query model
│   │   ├── query.dto.ts          # CreateQueryDto, UpdateQueryStatusDto
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
│   │   ├── faq.interface.ts      # IFaq — question, answer, embedding, createdBy,
│   │   │                         #   approvedBy, sourceQueryId?, approvedReplyId?
│   │   ├── faq.model.ts          # Mongoose Faq model
│   │   ├── faq.dto.ts            # CreateFaqDto (q+a), UpdateFaqDto
│   │   ├── faq.repository.ts     # FaqRepository + vectorSearch (Atlas $vectorSearch)
│   │   ├── embedding.service.ts  # Google Gemini embedding creation
│   │   ├── faq.service.ts        # createFaq (admin direct), updateFaq, deleteFaq
│   │   └── faq.controller.ts     # Public GET; admin POST / PATCH / DELETE
│   │
│   ├── chat/
│   │   ├── chat.interface.ts     # ChatMessage, RagResult, ChatbotResult + DTOs
│   │   ├── rag.service.ts        # Vector search → LLM → answer (stateless)
│   │   ├── chatbot.service.ts    # Multi-turn sessions with in-memory history
│   │   └── chat.controller.ts    # /ask (stateless RAG) + /chatbot (multi-turn)
│   │
│   ├── badge/                    # Gamification system — badges, stats, leaderboards
│   │   ├── badge.interface.ts    # IBadge, BadgeCategory enum
│   │   ├── badge.model.ts        # Mongoose Badge model
│   │   ├── badge.repository.ts   # findByCategory, findByName
│   │   ├── badge.service.ts      # awardBadges, getUserBadges, getLeaderboard, getUserStats
│   │   ├── badge.controller.ts   # GET all badges, user badges, leaderboard, stats
│   │   ├── badge.routes.ts       # Badge routes
│   │
│   └── user/
│       ├── user.model.ts         # Mirrors better-auth "user" collection (with badges array)
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

## Data Flow

```
Unauthenticated user
  └─ POST /api/queries          → Query { status: "pending" }

Authenticated user
  └─ POST /api/queries/:id/replies  → Reply { isApproved: false }

Admin (email must be verified)
  ├─ GET  /api/queries/:id/replies  → review replies
  └─ POST /api/replies/:id/approve
        → Reply.isApproved = true
        → Query.status     = "resolved"
        → FAQ created with embedding (sourceQueryId + approvedReplyId set)
        → Badge evaluation: Award badges based on user contribution metrics

Admin (direct, email must be verified)
  └─ POST /api/faqs             → FAQ created with embedding
                                   (sourceQueryId = null, approvedReplyId = null)

Email Verification Flow
  └─ POST /api/auth/send-verification-email  → mailer sends verification email
        → user clicks link → emailVerified = true
        → admin routes now accessible
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

| Variable             | Description                                                      |
|----------------------|------------------------------------------------------------------|
| `NODE_ENV`           | Environment (`development` \| `production`)                     |
| `PORT`               | Port the server listens on (e.g. `5000`)                        |
| `MONGO_URI`          | MongoDB Atlas connection string                                  |
| `GOOGLE_API_KEY`     | Google AI API key (for Gemini embeddings)                        |
| `BETTER_AUTH_SECRET` | Random secret ≥ 32 chars (`openssl rand -base64 32`)            |
| `BETTER_AUTH_URL`    | Your API base URL (e.g. `http://localhost:5000`)                 |
| `CORS_ORIGIN`        | Frontend origin (e.g. `http://localhost:3000`)                   |
| `SYSTEM_ADMIN_ID`    | Your System Admin ID (e.g. `6a17e7df3g57393t644d0d`)            |
| `GOOGLE_CLIENT_ID`   | Google OAuth client ID (from Google Cloud Console)              |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (from Google Cloud Console)        |
| `SMTP_HOST`          | SMTP relay host (e.g. `smtp-relay.brevo.com`)                   |
| `SMTP_PORT`          | SMTP port (e.g. `587`)                                          |
| `SMTP_USER`          | SMTP login username                                              |
| `SMTP_PASS`          | SMTP password or App Password (if 2FA is enabled)               |
| `EMAIL_FROM`         | Sender email address (e.g. `you@gmail.com`)                     |
| `EMAIL_FROM_NAME`    | Sender display name (e.g. `FAQ System`)                         |

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

Built using Better Auth with:

- Email/password authentication
- Google OAuth authentication
- Session-based authentication
- Role-based authorization (Student/Admin)
- Email verification
- Password reset via email
- Admin verification enforcement

#### Auth Routes

| Method | Path                              | Description |
|--------|-----------------------------------|-------------|
| POST | `/api/auth/sign-up/email` | Register with email |
| POST | `/api/auth/sign-in/email` | Login with email |
| POST |` /api/auth/sign-in/social` | Google OAuth login |
| POST | `/api/auth/sign-out` | Logout |
| GET | `/api/auth/get-session` | Get current session |
| GET | `/api/auth/me` | Get current authenticated user |
| POST | `/api/auth/request-password-reset` | Send password reset email |
| POST |` /api/auth/reset-password` | Reset password |
| POST | `/api/auth/send-verification-email` | Send verification email |
| GET | `/api/auth/verify-email` | Verify email |
| GET |` /api/auth/callback/google` | Google OAuth callback |


### Queries

| Method | Path                | Auth          | Description                               |
|--------|---------------------|---------------|-------------------------------------------|
| POST   | `/api/queries`      | **Public**    | Raise a query (unauthenticated allowed)   |
| GET    | `/api/queries`      | Admin         | List all queries (filter by `?status=`)   |
| GET    | `/api/queries/:id`  | Admin         | Get a single query                        |
| DELETE | `/api/queries/:id`  | Admin         | Delete a query                            |

### Replies

| Method | Path                              | Auth          | Description                                    |
|--------|-----------------------------------|---------------|------------------------------------------------|
| POST   | `/api/queries/:queryId/replies`   | Authenticated | Reply to an open query                         |
| GET    | `/api/queries/:queryId/replies`   | Admin         | List all replies for a query                   |
| POST   | `/api/replies/:id/approve`        | Admin         | Approve reply → auto-creates FAQ with embedding → awards badges |

### FAQs

| Method | Path            | Auth       | Description                                        |
|--------|-----------------|------------|----------------------------------------------------|
| GET    | `/api/faqs`     | Public     | Paginated FAQ list                                 |
| GET    | `/api/faqs/:id` | Public     | Get a single FAQ                                   |
| POST   | `/api/faqs`     | Admin      | Directly create a FAQ (question + answer required) |
| PATCH  | `/api/faqs/:id` | Admin      | Update question / answer (re-generates embedding)  |
| DELETE | `/api/faqs/:id` | Admin      | Delete a FAQ                                       |

### Badges & Gamification

| Method | Path                         | Auth   | Description                                    |
|--------|------------------------------|--------|------------------------------------------------|
| GET    | `/api/badges`                | Public | List all available badges with criteria        |
| GET    | `/api/badges/leaderboard`    | Public | Top 10 contributors ranked by approved replies |
| GET    | `/api/badges/users/:userId`  | Public | Get user's earned badges with earned dates     |
| GET    | `/api/badges/stats/:userId`  | Public | Get user statistics (replies, queries, stats)  |

### Chat

| Method | Path                      | Auth   | Description                              |
|--------|---------------------------|--------|------------------------------------------|
| POST   | `/api/chat/ask`           | Public | Stateless RAG query                      |
| POST   | `/api/chat/chatbot`       | Public | Multi-turn chatbot (pass `sessionId`)    |
| POST   | `/api/chat/chatbot/clear` | Public | Clear a chatbot session                  |

---

## Badge System

The badge system is a gamification layer that rewards users for contributions and engagement. Users earn badges automatically based on predefined criteria related to their activity.

### Badge Categories

Badges are organized into four categories:

| Category | Purpose | Examples |
|----------|---------|----------|
| **Contribution** | Awarded for creating helpful replies | "Helpful Contributor" (5 approved replies), "Expert Helper" (20 approved replies) |
| **Query** | Awarded for asking questions | "Question Asker" (5 queries), "Curious Mind" (20 queries) |
| **Resolution** | Awarded for solving problems | "Problem Solver" (5 resolved queries), "Community Champion" (20 resolved queries) |
| **Leaderboard** | Achievement-based badges | "Top Contributor", "Rising Star" |

### Badge Earning Logic

Badges are automatically awarded when users meet the criteria:

1. **When replying to queries**: After an admin approves a user's reply, the system checks if the user qualifies for contribution badges.
   - Example: If a user has 5 approved replies, they earn the "5 Approved Replies" badge.

2. **When submitting queries**: Badge evaluation triggers based on query count.
   - Example: If a user has submitted 10 queries, they qualify for query badges.

3. **When queries are resolved**: Resolution badges are awarded based on resolved query count.
   - Example: If a user resolved 15 queries, they qualify for resolution badges.

### Leaderboard

The backend provides a leaderboard endpoint that dynamically ranks the top 10 contributors by approved replies:

- **Endpoint**: `GET /api/badges/leaderboard`
- **Returns**: Array of top 10 users ranked by `approvedCount` (descending)
- **Data**: User info (name, email, image) + `approvedCount`
- **Computation**: Runs MongoDB aggregation pipeline on approved replies in real-time

**Note**: The frontend leaderboard UI component is not yet implemented. To display the leaderboard on the frontend, create a new page component that calls this endpoint.

### Badge Data Model

```ts
Badge {
  name:        string           // e.g., "Helpful Contributor"
  description: string           // e.g., "Earned 5 approved replies"
  icon:        string           // Icon emoji or URL
  category:    BadgeCategory    // one of: contribution, query, resolution, leaderboard
  criteria:    number           // Threshold (e.g., 5 for "5 approved replies")
  createdAt / updatedAt
}

User {
  ...
  badges: IUserBadge[]           // Array of earned badges
}

IUserBadge {
  badgeId:     ObjectId          // Reference to Badge
  earnedAt:    Date              // When the badge was earned
}
```

### Badge Endpoints

#### Get all badges
```
GET /api/badges
Response: { status: "success", data: Badge[] }
```

#### Get leaderboard (top 10 contributors)
```
GET /api/badges/leaderboard
Response: { status: "success", data: [{ userId, name, email, image, approvedCount }, ...] }
```

#### Get user's badges
```
GET /api/badges/users/:userId
Response: { status: "success", data: [{ badgeId, earnedAt }, ...] }
```

#### Get user statistics
```
GET /api/badges/stats/:userId
Response: { status: "success", data: { approvedReplies, totalQueries, resolvedQueries, totalReplies, approvalRate } }
```

### Badge Evaluation Flow

Badge evaluation happens automatically in these scenarios:

1. **After a reply is approved** → `evaluateContributionBadges()` is called
2. **After a query is created** → `evaluateQueryBadges()` is called
3. **After a query is resolved** → `evaluateResolutionBadges()` is called

Each evaluation compares the user's current metric against all available badges in that category and awards any that the user qualifies for but hasn't earned yet.

---

## FAQ Schema

```ts
FAQ {
  question:        string
  answer:          string
  embedding:       number[]
  createdBy:       ObjectId        // admin who created the entry
  approvedBy:      ObjectId        // admin who approved (same as createdBy for direct adds)
  sourceQueryId?:  ObjectId | null // linked Query  — null when admin adds directly
  approvedReplyId?: ObjectId | null // linked Reply — null when admin adds directly
  createdAt / updatedAt
}

Query {
  title:       string
  description?: string
  createdBy?:  ObjectId | null     // null for unauthenticated submitters
  status:      "pending" | "resolved"
  createdAt / updatedAt
}

Reply {
  queryId:    ObjectId
  userId:     ObjectId
  content:    string
  isApproved: boolean
  createdAt / updatedAt
}

User {
  name:           string
  email:          string
  role:           Role
  emailVerified:  boolean
  image?:         string
  badges:         IUserBadge[]        // Array of earned badge references with earned dates
  createdAt / updatedAt
}
```

---

## SOLID Principles Applied

- **S** — Each class has one responsibility: controllers handle HTTP, services handle logic, repositories handle data access.
- **O** — `BaseRepository`, `BaseService`, `BaseController` are open for extension, closed for modification.
- **L** — All concrete repositories/services can be substituted for their base types.
- **I** — Interfaces (`IFaq`, `IQuery`, `IReply`, `IBadge`, `RagResult`) are small and focused.
- **D** — Services depend on repositories via constructor injection, not concrete instantiation inside methods.

## Error Handling Strategy

- All async route handlers are wrapped with `asyncHandler` — no `try/catch` in routes.
- Custom `AppError` hierarchy (`NotFoundError`, `ForbiddenError`, `ValidationError`, etc.) carries `statusCode` + `details`.
- A single `errorMiddleware` maps all errors to consistent JSON responses.
- Unexpected errors are logged at `error` level; operational errors at `warn`.
