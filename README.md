# FAQ RAG System - Product Documentation

**Version**: 1.1.0
**Status**: Production-Grade
**Stack**: TypeScript, React, Express, MongoDB, Google Gemini (embeddings), Ollama (LLM), Better Auth, Socket.IO

---

## Executive Summary

The FAQ RAG (Retrieval-Augmented Generation) system is an intelligent knowledge management platform that combines community-driven FAQ creation with an AI-powered chatbot. It enables users to submit queries, community members to provide replies, administrators to curate a knowledge base, and every participant to get real-time updates as their contributions move through the pipeline.

**Key Innovation**: A complete lifecycle from user questions → community replies → admin-approved answers → an explicit, deliberate promotion step into the vector-indexed FAQ knowledge base → AI-augmented chatbot responses, with real-time notifications pushed to users at every stage.

> **Architecture note**: reply approval and FAQ creation used to be a single automatic step. They are now two distinct admin actions — approving a reply only resolves the query and notifies the contributor; turning that resolved query into a searchable FAQ entry is a deliberate follow-up call (`POST /api/faqs/promote/:queryId`). This gives admins a review checkpoint before anything is added to the knowledge base the chatbot draws from.

---

## Product Vision & Goals

### Primary Goals
1. **Crowdsource Knowledge**: Enable non-technical users to submit questions
2. **Community Contribution**: Allow authenticated users to reply and help peers
3. **Quality Curation**: A two-step admin workflow — approve, then explicitly promote — keeps the FAQ index clean
4. **Intelligent Retrieval**: Vector search + LLM produces contextual answers
5. **Engagement Gamification**: Badge system rewards contributors and drives participation
6. **Real-Time Feedback Loops**: Users are notified instantly (via Socket.IO) when they get a reply, an approval, or a new badge — no polling required

### Target Users
- **Students/End Users**: Submit questions, read FAQs, chat with bot
- **Contributors**: Reply to queries, earn badges, build reputation
- **Administrators**: Moderate replies, promote answers into FAQs, manage user roles, oversee system health

---

## Implemented Features

### 1. Authentication & Authorization System
**Status**: Complete

- **Email/Password Authentication**: Secure registration and login via Better Auth
- **Google OAuth Integration**: Single-click OAuth login
- **Session Management**: Secure session-based authentication
- **Email Verification**: Admin actions are blocked until the admin's own email is verified
- **Password Reset**: Secure email-based password recovery
- **Role-Based Access Control**:
  - **Student**: Can ask queries, reply to queries, view FAQs, use chatbot
  - **Admin**: Can approve replies, promote answers to FAQs, manage FAQs directly, manage user roles, view all queries
- **Machine-Readable Role Errors**: Failed admin-role checks return one of two `403` error codes instead of a generic message, so the frontend can react intelligently:
  - `STALE_ROLE_SESSION` — the user's cached session still reflects an old role (e.g. they were just promoted/demoted); the frontend should re-sync the session rather than retry.
  - `EMAIL_VERIFICATION_REQUIRED` — the user's role is `admin` but their email isn't verified yet; admin actions stay blocked until they verify.

#### Auth Routes
```
POST   /api/auth/sign-up/email                 -> Register with email (validated)
POST   /api/auth/sign-in/email                  -> Login (validated)
POST   /api/auth/sign-in/social                 -> Google OAuth
POST   /api/auth/sign-out                       -> Logout
GET    /api/auth/get-session                    -> Get current session
GET    /api/auth/me                              -> Get authenticated user
POST   /api/auth/request-password-reset         -> Send reset email (validated)
POST   /api/auth/reset-password                  -> Reset password (validated)
POST   /api/auth/send-verification-email         -> Send verification email
GET    /api/auth/verify-email                    -> Verify email
GET    /api/auth/callback/google                 -> OAuth callback
```

All custom auth endpoints (sign-up, sign-in, password reset/forgot) validate the request body with Zod before it ever reaches Better Auth; everything else falls through to Better Auth's own handler. The whole `/api/auth/*` prefix also sits behind `authLimiter` (see Rate Limiting below) for brute-force protection.

---

### 2. Query Management System
**Status**: Complete

**Purpose**: Allow users to submit questions that require answers.

#### Features
- **Public Query Submission**: No authentication required to ask a question
- **Public Browsing**: The query list itself is now a public, paginated endpoint (with an optional `status` filter) — anyone can browse open and resolved questions, not just admins
- **Anonymous Support**: Unauthenticated submissions are stored with `createdBy = null`
- **Authenticated Submission**: Logged-in users are tracked, and a query-count badge evaluation runs in the background
- **Submission Rate Limiting**: `POST /api/queries` is capped at 5 requests / 15 minutes per user-or-IP to deter spam

#### Data Model
```typescript
Query {
  title: string
  description?: string
  createdBy?: ObjectId        // null for anonymous
  status: "pending" | "resolved"
  createdAt / updatedAt
}
```

#### Routes
```
POST   /api/queries                 -> Create query (public; attributed if logged in)
GET    /api/queries                 -> List queries (public, optional ?status=pending|resolved)
GET    /api/queries/:id             -> Get single query (admin)
DELETE /api/queries/:id             -> Delete query (admin)
```

---

### 3. Reply & Approval Workflow
**Status**: Complete

**Purpose**: Collect community responses to queries, let admins approve the best one, and — as a deliberate, separate action — promote it into the FAQ knowledge base.

#### Features
- **Authenticated Replies**: Only logged-in users can reply
- **Replies Close When Resolved**: Once a query's status flips to `resolved`, further replies are rejected — there's exactly one approved answer per query at a time
- **Reply Notifications**: The query author is notified in real time the moment someone replies
- **Approval ≠ FAQ Creation**: Approving a reply does three things — marks it approved, marks the query `resolved`, and evaluates contribution/resolution badges for the replier and query author. **It does not create a FAQ.** Turning the resolved query into a searchable FAQ is a separate, explicit `promote` call (see the FAQ section below).
- **Reply Deletion**: A reply can be removed by its owner or any admin
- **Gamification Integration**: Approval triggers contribution badges for the replier and resolution badges for the original asker

#### Data Model
```typescript
Reply {
  queryId: ObjectId
  userId: ObjectId
  content: string
  isApproved: boolean
  createdAt / updatedAt
}
```

#### Routes
```
POST   /api/queries/:queryId/replies   -> Add reply to an open query (authenticated)
GET    /api/queries/:queryId/replies   -> List replies for a query (public)
POST   /api/replies/:id/approve        -> Approve reply -> resolves query + badges + notifications (admin)
DELETE /api/replies/:id                -> Delete a reply (owner or admin)
```

#### Workflow Diagram
```
User submits query
  |
  v
Community members reply
  |
  v
Admin reviews replies
  |
  v
Admin approves the best reply
  +- Reply marked as approved
  +- Query status -> "resolved"
  +- Contribution + resolution badges evaluated
  +- Replier and query author notified in real time
  |
  v
(separate, explicit step)
Admin calls POST /api/faqs/promote/:queryId
  +- FAQ created from the resolved query + approved reply
  +- Embedding generated and stored
  +- Linked back via sourceQueryId / approvedReplyId
```

---

### 4. FAQ Knowledge Base
**Status**: Complete

**Purpose**: Maintain a curated, searchable knowledge base that the chatbot draws on.

#### Features
- **Two Deliberate Entry Paths**:
  - **Promoted** from a resolved query's approved reply via `POST /api/faqs/promote/:queryId` (sets `sourceQueryId` + `approvedReplyId`) — guarded so it only succeeds if the query exists, is resolved, has exactly one approved reply, and doesn't already have a linked FAQ
  - **Direct admin entry** via `POST /api/faqs` with a hand-typed question/answer (`sourceQueryId = null`)
- **Vector Embeddings**: Every FAQ's question + answer text is embedded with Google's `gemini-embedding-001` model and stored alongside the document
- **Paginated Listing**: Standard offset/limit pagination on `GET /api/faqs`
- **Edit & Update**: Admins can modify the question/answer; changing the answer re-generates the embedding
- **Non-Destructive Deletion**: Deleting a FAQ leaves the source query/reply untouched — the query stays `resolved` with its approved reply intact, so an admin can re-promote it later if needed
- **Relationship Tracking**: Maintains links to the originating query and reply where applicable

#### Data Model
```typescript
FAQ {
  question: string
  answer: string
  embedding: number[]             // gemini-embedding-001 vector
  createdBy: ObjectId             // admin who created/promoted it
  approvedBy: ObjectId            // admin who approved/last updated it
  sourceQueryId?: ObjectId | null // null for direct admin adds
  approvedReplyId?: ObjectId | null
  createdAt / updatedAt
}
```

#### Routes
```
GET    /api/faqs                       -> List all FAQs (paginated, public)
GET    /api/faqs/:id                   -> Get single FAQ (public)
POST   /api/faqs                       -> Create FAQ directly (admin)
POST   /api/faqs/promote/:queryId      -> Promote a resolved query's approved reply into a FAQ (admin)
PATCH  /api/faqs/:id                   -> Update FAQ (admin, re-embeds if the answer changes)
DELETE /api/faqs/:id                   -> Delete FAQ (admin; source query/reply untouched)
```

---

### 5. Vector Search & RAG Engine
**Status**: Complete

**Purpose**: Retrieve relevant FAQs and generate AI-powered answers.

#### Features
- **Split AI Stack**: Embeddings and answer generation are deliberately handled by two different engines — Google Gemini (`gemini-embedding-001`) creates the semantic vectors, while a locally-hosted Ollama model (`llama3.2`) generates the actual conversational answer. No FAQ text or question is sent to Gemini for generation; only the embedding step touches the Gemini API.
- **Semantic Search**: MongoDB Atlas `$vectorSearch` over the FAQ `embedding` field, retrieving the top 5 candidates from a 20-candidate pool
- **Similarity Threshold Gate**: Results below a `0.82` cosine-similarity score are discarded; if nothing clears the bar, the system returns a canned "could not find relevant information" message **without ever invoking the LLM** — saving inference cost and latency on questions the knowledge base genuinely can't answer
- **Stateless RAG Query**: `/api/chat/ask` — single question → answer + the FAQ sources that backed it
- **Multi-Turn Chatbot**: `/api/chat/chatbot` — maintains an in-memory, per-`sessionId` conversation history (capped at the last 10 messages) so the LLM can resolve follow-ups and pronouns ("what about *that*?")
- **Session Clearing**: `/api/chat/chatbot/clear` drops a session's history on demand

#### Data Model
```typescript
ChatMessage {
  role: "user" | "assistant"
  content: string
}

RagResult {
  answer: string
  sources: Array<{
    _id: string
    question: string
    answer: string
    score: number          // vector-search similarity score for this source
  }>
}

ChatbotResult extends RagResult {
  sessionId: string
}
```

#### Routes
```
POST   /api/chat/ask                   -> Stateless RAG query (public, rate-limited)
POST   /api/chat/chatbot               -> Multi-turn conversation (public, rate-limited; pass sessionId to continue)
POST   /api/chat/chatbot/clear         -> Clear an in-memory chatbot session (public, rate-limited)
```

#### Flow
```
User question
  |
  v
Embed question (Google Gemini: gemini-embedding-001)
  |
  v
MongoDB Atlas $vectorSearch over FAQ embeddings (top 5 of 20 candidates)
  |
  v
Filter to sources scoring >= 0.82 similarity
  |
  +-- none clear the threshold --> return canned "no relevant info" answer (no LLM call)
  |
  v
Pass FAQ context + question (+ recent history, for chatbot) to Ollama (llama3.2)
  |
  v
LLM generates contextual answer
  |
  v
Return answer + source FAQs (+ sessionId for chatbot)
```

---

### 6. Gamification: Badge System
**Status**: Complete

**Purpose**: Incentivize contributions and build community engagement.

#### Features
- **Automatic Badge Awarding**: Triggered by reply approval, query creation, and query resolution
- **3 Evaluated Categories + 1 Reserved Category**:
  - **Contribution**: Based on approved-reply count
  - **Query**: Based on queries raised
  - **Resolution**: Based on the user's own queries getting resolved
  - **Leaderboard**: Defined as a badge category in the schema for future use, but not currently auto-awarded — the leaderboard endpoint itself computes rankings live via aggregation rather than handing out a "leaderboard" badge
- **Progressive Milestones**: Each category has its own threshold ladder (see table below)
- **User Stats**: Approved-reply count, total/resolved query counts, and approval rate
- **Leaderboard**: Top 10 contributors by approved-reply count, computed on the fly from the `replies` collection

#### Badge Catalog (seeded via `seed-badges.ts` — 11 badges total)

| Category | Criteria | Badge |
|----------|----------|-------|
| Contribution | 1 approved reply | "First Approved Answer" 🏆 |
| Contribution | 5 approved replies | "Rising Contributor" 🌟 |
| Contribution | 10 approved replies | "FAQ Contributor" 💡 |
| Contribution | 25 approved replies | "Community Helper" 🤝 |
| Contribution | 50 approved replies | "Knowledge Champion" 👑 |
| Query | 1 query raised | "Curious Mind" 🤔 |
| Query | 5 queries raised | "Active Learner" 📚 |
| Query | 20 queries raised | "Knowledge Seeker" 🔍 |
| Resolution | 1 query resolved | "First Query Resolved" ✅ |
| Resolution | 10 queries resolved | "Problem Solver" 🛠️ |
| Resolution | 25 queries resolved | "Community Impact" 💥 |

#### Data Model
```typescript
Badge {
  name: string
  description: string
  icon: string                    // emoji
  category: "contribution" | "query" | "resolution" | "leaderboard"
  criteria: number                // threshold (e.g., 5)
  createdAt / updatedAt
}

User {
  ...
  badges: IUserBadge[]           // array of earned badges with dates
}

IUserBadge {
  badgeId: ObjectId
  earnedAt: Date
}
```

#### Badge Evaluation Flow
1. **After Reply Approved** -> `evaluateContributionBadges(replierId)` and `evaluateResolutionBadges(queryAuthorId)`
2. **After Query Created** -> `evaluateQueryBadges(userId)`

Each evaluation compares the user's current count against every badge in that category and awards any newly-qualifying ones — each new badge also fires a real-time `BADGE` notification to the recipient.

#### Routes
```
GET    /api/badges                      -> List all badges (public)
GET    /api/badges/leaderboard          -> Top 10 contributors, computed live (public)
GET    /api/badges/users/:userId        -> User's earned badges (public)
GET    /api/badges/stats/:userId        -> User statistics (public)
```

#### Leaderboard Example Response
```json
{
  "status": "success",
  "data": [
    {
      "_id": "...",
      "name": "Alice",
      "email": "alice@example.com",
      "image": "...",
      "approvedCount": 42
    },
    {
      "_id": "...",
      "name": "Bob",
      "email": "bob@example.com",
      "image": "...",
      "approvedCount": 38
    }
  ]
}
```

---

### 7. Admin Panel & User Management
**Status**: Complete (backend and frontend)

**Purpose**: Give administrators full control over moderation, FAQ curation, and the user base itself, backed by a dedicated `AdminDashboard` in the frontend.

#### Capabilities
- **Query & Reply Moderation**: View queries, review and approve replies
- **Explicit FAQ Promotion**: A "Promote to FAQ" action on resolved queries calls `POST /api/faqs/promote/:queryId` directly from the dashboard
- **FAQ Curation**: Create, edit, delete FAQs directly
- **User Role Management**: List all users and toggle a user's role between `student` and `admin`. Promoting/demoting a user immediately **revokes that user's active sessions**, so the role change takes effect on their very next request rather than waiting for their session cache to expire
- **Self-Protection**: An admin cannot change their own role — the API rejects the request outright
- **Email Verification Gate**: All admin-only routes require a verified email on top of the `admin` role

#### Routes
```
GET    /api/admin/users               -> List all users (admin)
PATCH  /api/admin/users/:id/role      -> Change a user's role; revokes their sessions (admin)
```

---

### 8. Real-Time Notifications
**Status**: Complete *(new since v1.0.0)*

**Purpose**: Keep users informed the instant something relevant happens to them, without polling.

#### Features
- **Push, Not Poll**: A Socket.IO server runs alongside the HTTP server. Each socket handshake is authenticated using the same Better Auth session cookie as the REST API — unauthenticated sockets are rejected before they connect
- **Multi-Device Aware**: Connections are tracked in a `userId → Set<socketId>` map, so a user logged in across several tabs or devices gets every notification pushed to all of them
- **5 Notification Types**: `REPLY` (someone replied to your query), `APPROVAL` (your reply was approved, or your query was resolved), `FAQ`, `BADGE` (you earned a new badge), and `SYSTEM`
- **Persisted + Live**: Every notification is written to MongoDB *and* emitted live over the `new_notification` socket event, so the frontend's notification bell updates instantly while still having a durable history to fetch on page load
- **User-Scoped**: All notification routes require authentication, and every query is implicitly scoped to the current user — nobody can read or modify another user's notifications

#### Data Model
```typescript
Notification {
  userId: string
  title: string
  message: string
  type: "REPLY" | "APPROVAL" | "FAQ" | "BADGE" | "SYSTEM"
  isRead: boolean
  link?: string
  createdAt / updatedAt
}
```

#### Routes
```
GET    /api/notifications               -> Latest 100 notifications for the current user (authenticated)
PATCH  /api/notifications/:id/read      -> Mark one as read (authenticated)
PATCH  /api/notifications/read-all      -> Mark all as read (authenticated)
DELETE /api/notifications/:id           -> Delete one notification (authenticated)
DELETE /api/notifications/all           -> Delete all notifications (authenticated)
```

Notifications are never created directly by a client request — only the reply and badge services create them internally as a side effect of an approval, a new reply, or a newly-earned badge.

---

### 9. Rate Limiting & Abuse Protection
**Status**: Complete *(new since v1.0.0)*

**Purpose**: Protect both the API and the LLM/embedding bill from abuse.

#### Features
- **Four Independent Limiters**, all surfacing through the same `429 TooManyRequestsError` shape as every other error in the app:

| Limiter | Applies to | Default | Notes |
|---|---|---|---|
| `globalLimiter` | Every route | 100 req / 15 min | Disabled in development |
| `authLimiter` | `/api/auth/*` | 15 req / 15 min | Brute-force protection on sign-in/sign-up; disabled in development |
| `chatLimiter` | `/api/chat/*` | 5 req / 1 min | Protects LLM/embedding costs — **stays active in development too** |
| `queryLimiter` | `POST /api/queries` only | 5 req / 15 min | GET requests on the same path are exempt; disabled in development |

- **Smart Key Generation**: Authenticated requests are bucketed by `user:<id>`; anonymous requests by `ip:<address>` — so logged-in users sharing a network (e.g. university Wi-Fi) don't exhaust each other's quota
- **Proxy-Aware**: `trust proxy` is enabled so `req.ip` reflects the real client IP behind a reverse proxy (Nginx, Render, Railway, Cloudflare) instead of the proxy's own address
- **Fully Configurable**: Every limiter's window and max-request count is overridable via environment variables, all with safe defaults

---

### 10. Email System
**Status**: Complete

#### Features
- **Verification Emails**: Custom HTML templates for email verification
- **Password Reset**: Secure token-based password recovery
- **SMTP Integration**: Nodemailer with Brevo relay support
- **Template System**: Customizable HTML email templates

#### Configuration
```
SMTP_HOST = smtp-relay.brevo.com
SMTP_PORT = 587
SMTP_USER = [credentials]
SMTP_PASS = [credentials]
EMAIL_FROM = sender@example.com
EMAIL_FROM_NAME = FAQ System
```

---

### 11. PDF Ingestion Script
**Status**: Complete

**Purpose**: Bulk import FAQ content from PDF documents.

#### Features
- **Two-Pass Extraction**: First attempts a direct regex-based pass (matching numbered `X.Y Question? Answer` patterns) and seeds those FAQs immediately if any are found. Only if that comes back empty does it fall back to chunking the PDF and asking the local Ollama model to extract `{question, answer}` pairs per chunk
- **Embedding Generation**: Creates a Gemini vector embedding for each ingested FAQ
- **Database Insertion**: Bulk loads into MongoDB
- **Admin Attribution**: All entries are attributed to `SYSTEM_ADMIN_ID` (an optional env var)

#### Usage
```bash
# Place PDF in ./data/ directory
npm run ingest
```

---

### 12. Error Handling & Validation
**Status**: Complete

#### Features
- **Request Validation**: Zod schemas for request bodies, checked at the middleware layer before any service code runs
- **Custom Error Hierarchy**: `AppError` base class plus `BadRequestError`, `UnauthorizedError`/`AuthenticationError`, `ForbiddenError`/`AuthorizationError`, `NotFoundError`, `ConflictError`, `ValidationError`, `TooManyRequestsError`, `InternalServerError`/`DatabaseError`, `ServiceError`
- **Async Handler Wrapper**: Eliminates try/catch boilerplate in routes
- **Central Error Middleware**: Maps every `AppError` to a consistent JSON response
- **Operational vs Unexpected**: Operational errors are logged at `warn`; unexpected ones at `error`, with stack traces only in development

#### Response Formats
Zod validation failures are caught by the validation middleware and return a `400` directly, before hitting any service or `AppError`:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Please enter a valid email address"]
  }
}
```

All other application errors flow through the central error middleware:
```json
{
  "status": "error",
  "message": "Human-readable error",
  "statusCode": 400,
  "details": { "code": "STALE_ROLE_SESSION" }
}
```

---

## System Architecture

### Backend Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: Better Auth (session-based)
- **Real-Time**: Socket.IO, authenticated via the Better Auth session cookie
- **Email**: Nodemailer + Brevo
- **Vector Search**: MongoDB Atlas Vector Search (`$vectorSearch`)
- **Embeddings**: Google Gemini (`gemini-embedding-001`, via LangChain)
- **LLM (answer generation)**: Ollama, `llama3.2`, run locally and accessed via LangChain's `ChatOllama`
- **Logging**: Winston logger
- **Validation**: Zod schemas

### Frontend Stack
- **Framework**: React 19
- **Router**: React Router (declarative mode)
- **HTTP Client**: Axios, with app state managed through dedicated React Context providers (`AuthContext`, `AppContext`, `SocketContext`, `ToastContext`) rather than a server-state library
- **Real-Time**: `socket.io-client`, wired up in `SocketContext` and consumed by the `NotificationPanel`
- **Styling**: Tailwind CSS v4 (CSS-first configuration via `@theme`, no `tailwind.config.js`)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Build**: Vite

### Database Schema

#### Collections
1. **queries**: User-submitted questions
2. **replies**: Community responses to queries
3. **faqs**: Curated knowledge base entries
4. **badges**: Badge definitions
5. **notifications**: Per-user notification history
6. **users**: User profiles (shares the `user` collection with Better Auth; adds `badges[]`)

#### Relationships
```
Query (1) ---> (many) Reply
  |
  +---> FAQ (only once explicitly promoted by an admin)

User (1) ---> (many) Reply
User (1) ---> (many) Query
User (1) ---> (many) Badge awards
User (1) ---> (many) Notification

FAQ contains embedding vector -> MongoDB Vector Search
```

---

## Data Flow Diagram

```
+--------------------------------------------------------+
|         FRONTEND (React 19 + Vite)                      |
+--------------------------------------------------------+
| Dashboard   Query List   FAQ Browser   Admin Dashboard  |
| Chat Interface   Leaderboard   Profile   Notification Bell |
+------------------+---------------------------------------+
                   | HTTP/REST API           ^ Socket.IO push
                   v                          |
+--------------------------------------------------------+
|    BACKEND (Express + TypeScript)                       |
+--------------------------------------------------------+
| Authentication          Query -> Reply -> (promote) FAQ |
|  - Better Auth          - Query Controller               |
|  - Email Verification   - Reply Controller                |
|  - Google OAuth         - FAQ Controller                  |
|  - Admin role mgmt      - Badge Evaluation                |
|                                                            |
| Chat & RAG                  Notifications (Socket.IO)     |
|  - Gemini embeddings        Email System                  |
|  - Ollama (llama3.2)        - Verification                |
|  - Session mgmt              - Password Reset              |
|                                                            |
| Rate Limiting (global / auth / chat / query)               |
+--+--------+--------+--------+--------+--------------------+
   |        |        |        |        |
   v        v        v        v        v
[MongoDB] [Google] [Ollama] [Nodemailer] [Socket.IO]
[Atlas]   [Gemini   [local   [+ Brevo]
           embed.]   LLM]

Collections:
- Queries, Replies, FAQs, Users, Badges, Notifications
```

---

## Security Features

**Authentication**
- Session-based via Better Auth, with Socket.IO connections authenticated against the same session
- Email verification required before admin actions are permitted
- Password hashing + reset via email

**Authorization**
- Role-based access control (Student/Admin)
- Route-level middleware protection
- Admins cannot change their own role; role changes revoke the target's active sessions immediately
- Machine-readable `403` error codes (`STALE_ROLE_SESSION`, `EMAIL_VERIFICATION_REQUIRED`) so the frontend can respond appropriately rather than showing a raw error

**Data Validation**
- Zod schema validation on all inputs, rejected before any service code runs
- Sanitized error messages
- No sensitive data in responses

**Error Handling**
- Operational errors logged as warnings
- Unexpected errors logged as errors
- No stack traces in production responses

**Rate Limiting**
- Four independently-tunable limiters (global, auth, chat, query-creation) bucketed by authenticated user or IP, sitting behind `trust proxy` so the real client IP is used even behind a reverse proxy

**CORS & Headers**
- Configurable CORS origin (also reused for Socket.IO's CORS policy)
- Secure session cookies
- Express security middleware

---

## Analytics & Monitoring

### Available Metrics
- **User Activity**: Queries submitted, replies, approvals
- **Content Metrics**: FAQ count, coverage, vector search efficiency
- **Engagement**: Badge awards, leaderboard position, notification volume
- **System Health**: Error rates, API response times, rate-limit hit rates

### Endpoints for Analytics
```
GET /api/badges/leaderboard              -> Top contributors (live aggregation)
GET /api/badges/stats/:userId            -> User contribution metrics
GET /api/queries                         -> Query analytics (now public)
```

---

## Deployment Ready

### Environment Requirements
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
GOOGLE_API_KEY=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=...
CORS_ORIGIN=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=...
EMAIL_FROM_NAME=...
SYSTEM_ADMIN_ID=...

# Rate limiting (all optional, have safe defaults)
RATE_LIMIT_WINDOW_MS=...
RATE_LIMIT_MAX=...
AUTH_RATE_LIMIT_WINDOW_MS=...
AUTH_RATE_LIMIT_MAX=...
CHAT_RATE_LIMIT_WINDOW_MS=...
CHAT_RATE_LIMIT_MAX=...
QUERY_RATE_LIMIT_WINDOW_MS=...
QUERY_RATE_LIMIT_MAX=...
```

> The chat/RAG pipeline also depends on a locally-reachable **Ollama** instance with the `llama3.2` model pulled (`ollama serve` + `ollama pull llama3.2`). This isn't an environment variable — it's a separate process the API server calls out to — so it needs to be running (or reachable) wherever the backend is deployed.

### Production Optimizations
- TypeScript compilation to minified JS
- Graceful shutdown handling
- Process error handlers
- Database connection pooling
- Structured logging (Winston)
- `trust proxy` enabled so rate limiting sees real client IPs behind a load balancer
- Error monitoring hooks

---

## Design Principles

### SOLID Architecture
- **S**ingle Responsibility: Controllers/Services/Repositories have one job
- **O**pen/Closed: Base classes (`BaseController`, `BaseService`, `BaseRepository`) are extensible without modification
- **L**iskov Substitution: Concrete classes substitute cleanly for their base types
- **I**nterface Segregation: Small, focused interfaces (`IFaq`, `IQuery`, `IReply`, `IBadge`, `INotification`)
- **D**ependency Inversion: Services depend on repositories (and on each other — e.g. `ReplyService` → `BadgeService`/`NotificationService`) via constructor injection rather than singletons

### Clean Code Practices
- **Layered Architecture**: Core -> Config -> Modules -> App
- **Async/Await**: No callback hell, consistent async patterns
- **Error Boundaries**: Centralized error handling with rich context
- **Type Safety**: Full TypeScript coverage, no `any` types
- **Composition Over Inheritance**: Flexible service composition

### API Design
- **RESTful Conventions**: Proper HTTP methods and status codes
- **Consistent Response Format**: Most responses follow `{ status, data, message }`; Zod validation failures use a distinct `{ success, message, errors }` shape returned directly by the validation middleware
- **Pagination**: Standard offset/limit pattern for list endpoints
- **Versioning Ready**: API structure supports future v2, v3, etc.

---

## Future Roadmap

> Real-time notifications and rate limiting — previously listed here as Phase 2/3 goals — have since shipped and moved up into Implemented Features above.

### Phase 2 - Enhanced Features
- Advanced filtering & sorting on FAQs
- Search analytics (popular queries)
- FAQ categorization & tagging
- Multi-language support
- Auto-evaluated "leaderboard" badge category (the schema already supports it)

### Phase 3 - Premium Features
- Custom LLM fine-tuning
- Admin API keys & webhooks
- Analytics dashboard
- Integration marketplace

### Phase 4 - Scale & Optimize
- Caching layer (Redis)
- CDN for static assets
- Read replicas for analytics
- Async job processing (Bull)
- Microservices extraction
- Horizontally-scaled Socket.IO (Redis adapter) for multi-instance deployments

---

## API Response Format

### Success Response
```json
{
  "status": "success",
  "data": { /* resource or array */ },
  "message": "Optional message"
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": {
    "items": [ /* array of resources */ ],
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 100,
      "hasMore": true
    }
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Human-readable error",
  "statusCode": 400,
  "details": { /* optional detailed info, e.g. an error code */ }
}
```

### Validation Error Response
Returned directly by the Zod validation middleware, before any controller or service code runs:
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

## Key Technologies & Purpose

| Technology | Purpose |
|-----------|---------|
| TypeScript | Type-safe backend & frontend |
| Express | HTTP server framework |
| MongoDB Atlas | NoSQL database + vector search |
| Better Auth | Authentication framework |
| Socket.IO | Real-time, session-authenticated push notifications |
| Google Gemini (`gemini-embedding-001`) | FAQ + query embeddings |
| Ollama (`llama3.2`) | Local LLM for RAG/chatbot answer generation |
| React 19 | Frontend framework |
| Vite | Frontend build tool |
| Tailwind CSS v4 | Utility-first styling (CSS-first `@theme` config) |
| Zod | Schema validation |
| Winston | Structured logging |

> Exact dependency version pins live in each package's `package.json`; the table above reflects the technologies currently in use rather than locked version numbers, which move independently of this document.

---

## Quality Assurance

### Code Quality
- Full TypeScript for type safety
- Zod runtime validation
- Comprehensive error handling
- Structured logging for debugging

### Testing Ready
- Async handler wrapper for consistent async behavior
- Modular architecture for unit testing
- Error boundaries for integration testing
- Database abstraction for mock testing

### Documentation
- Inline code comments for complex logic
- README files in each module
- API documentation in this file
- Architecture diagrams for visual understanding

---

## Success Metrics

1. **User Engagement**: Active contributors, query submission rate
2. **Content Quality**: Approved reply rate, FAQ promotion rate, FAQ accuracy
3. **System Performance**: API response time < 200ms, uptime > 99%
4. **Community Growth**: User count growth, badge award frequency
5. **Responsiveness**: Time-to-notification for replies/approvals/badges
6. **Business Value**: Reduced support tickets, user satisfaction

---

**Created**: June 2026
**Last Updated**: June 16, 2026
**Repository**: https://github.com/Vanya-kapoor/cs2
**License**: MIT
