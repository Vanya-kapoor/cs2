# FAQ RAG System - Product Documentation

**Version**: 1.0.0  
**Status**: Production-Grade  
**Stack**: TypeScript, React, Express, MongoDB, Google Gemini, Better Auth

---

## Executive Summary

The FAQ RAG (Retrieval-Augmented Generation) system is an intelligent knowledge management platform that combines community-driven FAQ creation with AI-powered chatbot responses. It enables users to submit queries, community members to provide replies, and administrators to curate a knowledge base that powers an intelligent RAG chatbot.

**Key Innovation**: A complete lifecycle from user questions → community replies → admin-approved FAQs → vector-indexed knowledge base → AI-augmented responses.

---

## Product Vision & Goals

### Primary Goals
1. **Crowdsource Knowledge**: Enable non-technical users to submit questions
2. **Community Contribution**: Allow authenticated users to reply and help peers
3. **Quality Curation**: Admin approval workflow ensures FAQ quality
4. **Intelligent Retrieval**: Vector search + LLM produces contextual answers
5. **Engagement Gamification**: Badge system rewards contributors and drives participation

### Target Users
- **Students/End Users**: Submit questions, read FAQs, chat with bot
- **Contributors**: Reply to queries, earn badges, build reputation
- **Administrators**: Moderate replies, manage FAQs, oversee system health

---

## Implemented Features

### 1. Authentication & Authorization System
**Status**: Complete

- **Email/Password Authentication**: Secure registration and login via Better Auth
- **Google OAuth Integration**: Single-click OAuth login
- **Session Management**: Secure session-based authentication
- **Email Verification**: Admin actions restricted to verified users
- **Password Reset**: Secure email-based password recovery
- **Role-Based Access Control**:
  - **Student**: Can ask queries, reply to queries, view FAQs, use chatbot
  - **Admin**: Can approve replies, manage FAQs, view all queries, manage system

#### Auth Routes
```
POST   /api/auth/sign-up/email                 -> Register with email
POST   /api/auth/sign-in/email                 -> Login
POST   /api/auth/sign-in/social                -> Google OAuth
POST   /api/auth/sign-out                      -> Logout
GET    /api/auth/get-session                   -> Get current session
GET    /api/auth/me                            -> Get authenticated user
POST   /api/auth/request-password-reset        -> Send reset email
POST   /api/auth/reset-password                -> Reset password
POST   /api/auth/send-verification-email       -> Send verification email
GET    /api/auth/verify-email                  -> Verify email
GET    /api/auth/callback/google               -> OAuth callback
```

---

### 2. Query Management System
**Status**: Complete

**Purpose**: Allow users to submit questions that require answers.

#### Features
- **Public Query Submission**: No authentication required to ask a question
- **Query Tracking**: Title, optional description, status (pending/resolved)
- **Status Management**: Tracks lifecycle from "pending" to "resolved"
- **Anonymous Support**: Unauthenticated users can submit (createdBy = null)
- **Authenticated Submission**: Logged-in users are tracked

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
POST   /api/queries                 -> Create query (public)
GET    /api/queries                 -> List queries (admin, with status filter)
GET    /api/queries/:id             -> Get single query (admin)
DELETE /api/queries/:id             -> Delete query (admin)
```

---

### 3. Reply & Approval Workflow
**Status**: Complete

**Purpose**: Collect community responses to queries and curate them into FAQs.

#### Features
- **Authenticated Replies**: Only logged-in users can reply
- **Approval System**: Admins review and approve high-quality replies
- **Automatic FAQ Creation**: When a reply is approved:
  - A FAQ entry is auto-generated
  - Vector embedding is created
  - Reply is marked as approved
  - Query status becomes "resolved"
- **Gamification Integration**: User earns badges upon approval

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
POST   /api/queries/:queryId/replies              -> Add reply (authenticated)
GET    /api/queries/:queryId/replies              -> List replies (admin)
POST   /api/replies/:id/approve                   -> Approve reply -> auto-create FAQ + award badges
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
Admin approves best reply
  +- Reply marked as approved
  +- Query status -> "resolved"
  +- FAQ created with embedding
  +- Badges awarded to contributor
```

---

### 4. FAQ Knowledge Base
**Status**: Complete

**Purpose**: Maintain a curated, searchable knowledge base.

#### Features
- **Dual Entry Paths**:
  - Auto-created from approved replies (sourceQueryId + approvedReplyId set)
  - Directly created by admins (sourceQueryId = null)
- **Vector Embeddings**: Google Gemini creates semantic embeddings for every FAQ
- **Full-Text Search**: Pagination and filtering support
- **Edit & Update**: Admins can modify Q&A (re-generates embedding)
- **Deletion**: Complete FAQ removal with audit trail
- **Relationship Tracking**: Maintains links to originating query and reply

#### Data Model
```typescript
FAQ {
  question: string
  answer: string
  embedding: number[]             // 1000+ dimensional Google Gemini embedding
  createdBy: ObjectId             // admin who created/sourced
  approvedBy: ObjectId            // admin who approved
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
PATCH  /api/faqs/:id                   -> Update FAQ (admin, re-embeds)
DELETE /api/faqs/:id                   -> Delete FAQ (admin)
```

---

### 5. Vector Search & RAG Engine
**Status**: Complete

**Purpose**: Retrieve relevant FAQs and generate AI-powered answers.

#### Features
- **Semantic Search**: MongoDB Atlas Vector Search on embeddings
- **Stateless RAG Query**: `/api/chat/ask` - Single question -> Answer
- **Multi-Turn Chatbot**: `/api/chat/chatbot` - Maintains conversation history
- **Context Window**: Supplies top-K relevant FAQs to LLM
- **Hybrid Retrieval**: Combines semantic similarity with keyword match
- **Response Caching**: Session-based history for coherent conversations

#### Data Model
```typescript
ChatMessage {
  role: "user" | "assistant"
  content: string
}

RagResult {
  question: string
  context: FAQ[]              // Top-K retrieved FAQs
  answer: string              // LLM-generated response
  confidence: number          // 0-1 similarity score
}
```

#### Routes
```
POST   /api/chat/ask                   -> Stateless RAG query (public)
POST   /api/chat/chatbot               -> Multi-turn conversation (public, pass sessionId)
POST   /api/chat/chatbot/clear         -> Clear session history (public)
```

#### Flow
```
User question
  |
  v
Vector search FAQ embeddings
  |
  v
Retrieve top-K similar FAQs
  |
  v
Pass context + question to Google Gemini
  |
  v
LLM generates contextual answer
  |
  v
Return answer + source FAQs
```

---

### 6. Gamification: Badge System
**Status**: Complete

**Purpose**: Incentivize contributions and build community engagement.

#### Features
- **Automatic Badge Awarding**: Triggered by user actions (replies, queries)
- **4 Badge Categories**:
  - **Contribution**: Based on approved reply count
  - **Query**: Based on questions asked
  - **Resolution**: Based on resolved queries
  - **Leaderboard**: Top contributor achievements
- **Progressive Milestones**: Multiple levels (5, 10, 20, etc.)
- **User Stats**: Approval rate, query count, resolution metrics
- **Leaderboard**: Top 10 contributors by approved replies

#### Badge Categories & Examples

| Category | Trigger | Example Badges |
|----------|---------|----------------|
| **Contribution** | Reply approved | "Helpful Contributor" (5), "Expert Helper" (20), "Knowledge Champion" (50) |
| **Query** | Query created | "Question Asker" (5), "Curious Mind" (20), "Question Master" (50) |
| **Resolution** | Query resolved | "Problem Solver" (5), "Community Champion" (20), "Resolution Expert" (50) |
| **Leaderboard** | Ranking achievement | "Top Contributor", "Rising Star" |

#### Data Model
```typescript
Badge {
  name: string                    // e.g., "Helpful Contributor"
  description: string             // e.g., "Earned 5 approved replies"
  icon: string                    // Emoji or icon URL
  category: BadgeCategory         // contribution | query | resolution | leaderboard
  criteria: number                // Threshold (e.g., 5)
  createdAt / updatedAt
}

User {
  ...
  badges: IUserBadge[]           // Array of earned badges with dates
}

IUserBadge {
  badgeId: ObjectId
  earnedAt: Date
}
```

#### Badge Evaluation Flow
1. **After Reply Approved** -> `evaluateContributionBadges(userId)`
2. **After Query Created** -> `evaluateQueryBadges(userId)`
3. **After Query Resolved** -> `evaluateResolutionBadges(userId)`

Each evaluation compares user metrics against all available badges and awards qualifying ones.

#### Routes
```
GET    /api/badges                      -> List all badges (public)
GET    /api/badges/leaderboard          -> Top 10 contributors (public)
GET    /api/badges/users/:userId        -> User's earned badges (public)
GET    /api/badges/stats/:userId        -> User statistics (public)
```

#### Leaderboard Example Response
```json
{
  "status": "success",
  "data": [
    {
      "userId": "...",
      "name": "Alice",
      "email": "alice@example.com",
      "image": "...",
      "approvedCount": 42
    },
    {
      "userId": "...",
      "name": "Bob",
      "email": "bob@example.com",
      "image": "...",
      "approvedCount": 38
    }
  ]
}
```

---

### 7. Admin Panel Features
**Status**: Backend Complete, Frontend Partial

#### Capabilities
- **Query Management**: View pending queries, filter by status, delete
- **Reply Moderation**: Review replies, approve/reject with auto-FAQ creation
- **FAQ Curation**: Create, edit, delete FAQs directly
- **User Management**: View user profiles, stats, earned badges
- **System Health**: Monitor queries, replies, FAQs, user engagement
- **Email Verification**: Enforce verified emails for admin actions

---

### 8. Email System
**Status**: Complete

#### Features
- **Verification Emails**: Custom HTML templates for email verification
- **Password Reset**: Secure token-based password recovery
- **Admin Notification**: Alert admins of pending approvals
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

### 9. PDF Ingestion Script
**Status**: Complete

**Purpose**: Bulk import FAQ content from PDF documents.

#### Features
- **PDF Parsing**: Extracts text from PDF files
- **Automatic Chunking**: Splits content into Q&A pairs via LLM
- **Embedding Generation**: Creates vector embeddings for each FAQ
- **Database Insertion**: Bulk loads into MongoDB
- **Admin Attribution**: All entries marked as created by system admin

#### Usage
```bash
# Place PDF in ./data/ directory
npm run ingest
```

---

### 10. Error Handling & Validation
**Status**: Complete

#### Features
- **Request Validation**: Zod schemas for body/query/params
- **Custom Error Hierarchy**: AppError, BadRequestError, ForbiddenError, etc.
- **Async Handler Wrapper**: Eliminates try/catch boilerplate in routes
- **Central Error Middleware**: Consistent JSON error responses
- **Operational vs Unexpected**: Logs and responds appropriately

#### Error Response Format
```json
{
  "status": "error",
  "message": "Validation failed",
  "statusCode": 400,
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  }
}
```

---

## System Architecture

### Backend Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: Better Auth (session-based)
- **Email**: Nodemailer + Brevo
- **Vector Search**: MongoDB Atlas Vector Search
- **LLM Integration**: Google Gemini + Embeddings
- **Logging**: Winston logger
- **Validation**: Zod schemas

### Frontend Stack
- **Framework**: React 19
- **Router**: React Router v7
- **HTTP Client**: Axios + TanStack Query
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Build**: Create React App

### Database Schema

#### Collections
1. **queries**: User-submitted questions
2. **replies**: Community responses to queries
3. **faqs**: Curated knowledge base entries
4. **badges**: Badge definitions and user awards
5. **users**: User profiles (mirrors Better Auth)

#### Relationships
```
Query (1) ---> (many) Reply
  |
  +---> FAQ (via approved reply)

User (1) ---> (many) Reply
User (1) ---> (many) Query
User (1) ---> (many) Badge awards

FAQ contains embedding vector -> MongoDB Vector Search
```

---

## Data Flow Diagram

```
+-------------------------------------------+
|         FRONTEND (React)                  |
+-------------------------------------------+
| Dashboard    Query List    FAQ Browser    |
| Chat Interface  Leaderboard  User Profile |
+------------------+------------------------+
                   | HTTP/REST API
                   v
+-------------------------------------------+
|    BACKEND (Express + TypeScript)         |
+-------------------------------------------+
| Authentication        Query->Reply->FAQ   |
|  - Better Auth       - Query Controller   |
|  - Email Verification - Reply Controller  |
|  - Google OAuth      - FAQ Controller     |
|                      - Badge Evaluation   |
| Chat & RAG                                |
|  - Vector Search     Email System         |
|  - LLM Integration   - Verification       |
|  - Response Gen.     - Password Reset     |
|  - Session Mgmt.     - Notifications      |
+--+--------+--------+--------+-------------+
   |        |        |        |
   v        v        v        v
[MongoDB] [Google] [Nodemailer] [Services]
[Atlas]   [Gemini] [+ Brevo]
 
Collections:
- Queries
- Replies
- FAQs
- Users
- Badges
```

---

## Security Features

**Authentication**
- Session-based via Better Auth
- Email verification for admin access
- Password hashing + reset via email

**Authorization**
- Role-based access control (Student/Admin)
- Route-level middleware protection
- Admin-only query approval

**Data Validation**
- Zod schema validation on all inputs
- Sanitized error messages
- No sensitive data in responses

**Error Handling**
- Operational errors logged as warnings
- Unexpected errors logged as errors
- No stack traces in production responses

**CORS & Headers**
- Configurable CORS origin
- Secure session cookies
- Express security middleware

---

## Analytics & Monitoring

### Available Metrics
- **User Activity**: Queries submitted, replies, approvals
- **Content Metrics**: FAQ count, coverage, vector search efficiency
- **Engagement**: Badge awards, leaderboard position, session duration
- **System Health**: Error rates, API response times, database query times

### Endpoints for Analytics
```
GET /api/badges/leaderboard              -> Top contributors
GET /api/badges/stats/:userId            -> User contribution metrics
GET /api/queries                          -> Query analytics (admin)
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
EMAIL_FROM=...
SYSTEM_ADMIN_ID=...
```

### Production Optimizations
- TypeScript compilation to minified JS
- Graceful shutdown handling
- Process error handlers
- Database connection pooling
- Structured logging (Winston)
- Error monitoring hooks

---

## Design Principles

### SOLID Architecture
- **S**ingle Responsibility: Controllers/Services/Repositories have one job
- **O**pen/Closed: Base classes extensible without modification
- **L**iskov Substitution: Concrete classes substitute for abstract types
- **I**nterface Segregation: Small, focused interfaces
- **D**ependency Inversion: Services depend on abstractions, not concretions

### Clean Code Practices
- **Layered Architecture**: Core -> Config -> Modules -> App
- **Async/Await**: No callback hell, consistent async patterns
- **Error Boundaries**: Centralized error handling with rich context
- **Type Safety**: Full TypeScript coverage, no `any` types
- **Composition Over Inheritance**: Flexible service composition

### API Design
- **RESTful Conventions**: Proper HTTP methods and status codes
- **Consistent Response Format**: All responses follow `{ status, data, message }`
- **Pagination**: Standard offset/limit pattern for list endpoints
- **Versioning Ready**: API structure supports future v2, v3, etc.

---

## Future Roadmap

### Phase 2 - Enhanced Features
- Advanced filtering & sorting on FAQs
- Search analytics (popular queries)
- FAQ categorization & tagging
- Multi-language support
- Real-time notifications (WebSocket)

### Phase 3 - Premium Features
- Custom LLM fine-tuning
- Rate limiting & quotas
- Admin API keys & webhooks
- Analytics dashboard
- Integration marketplace

### Phase 4 - Scale & Optimize
- Caching layer (Redis)
- CDN for static assets
- Read replicas for analytics
- Async job processing (Bull)
- Microservices extraction

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
  "details": { /* optional detailed info */ }
}
```

---

## Key Technologies & Versions

| Technology | Version | Purpose |
|-----------|---------|---------|
| TypeScript | 5.8 | Type-safe backend & frontend |
| Express | 4.21 | HTTP server framework |
| MongoDB | 9.6 | NoSQL database |
| Better Auth | 1.2 | Authentication framework |
| Google Gemini | 0.24 | LLM & embeddings |
| React | 19 | Frontend framework |
| Tailwind CSS | 3.4 | Utility-first styling |
| Zod | 3.24 | Schema validation |
| Winston | 3.17 | Structured logging |

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
2. **Content Quality**: Approved reply rate, FAQ accuracy
3. **System Performance**: API response time < 200ms, uptime > 99%
4. **Community Growth**: User count growth, badge award frequency
5. **Business Value**: Reduced support tickets, user satisfaction

---

**Created**: June 2026  
**Last Updated**: June 9, 2026  
**Repository**: https://github.com/Vanya-kapoor/cs2  
**License**: MIT  
