# FAQ RAG — Product Overview

## What is it?

FAQ RAG is a full-stack knowledge management platform that turns community-submitted questions into a searchable, AI-powered FAQ base. Users ask questions, peers answer them, admins curate the best answers into a knowledge base, and an AI chatbot surfaces answers instantly — all backed by a gamification layer that rewards contributors.

---

## Core User Journeys

### 1. Ask a Question
Any visitor (logged in or anonymous) can submit a question. Authenticated users earn badges as their question count grows. Questions enter a **pending** queue for the community to answer.

### 2. Answer a Question
Logged-in users can reply to any open question. Submitting a reply notifies the original asker in real time via WebSocket push.

### 3. Admin Moderation
Admins review replies and approve the best one. Approval resolves the question and triggers:
- Badge evaluation for the replier and asker
- Real-time notifications to both parties

Approval and FAQ promotion are **intentionally separate steps** — admins decide which resolved questions deserve to become permanent, searchable FAQ entries.

### 4. Promote to FAQ
Admins explicitly promote a resolved question into the FAQ knowledge base (`POST /api/faqs/promote/:queryId`). The approved reply is embedded using Google Gemini and stored for vector search. The source question and reply remain intact so the FAQ can be re-promoted after deletion.

### 5. AI Chatbot
Two AI endpoints are available to all users:

| Mode | Endpoint | Behavior |
|---|---|---|
| RAG (stateless) | `POST /api/chat/ask` | Embeds the question → vector-searches FAQs → answers via Ollama only if similarity ≥ 0.82 |
| Multi-turn chatbot | `POST /api/chat/chatbot` | Maintains up to 10-message session history in memory; pass `sessionId` to continue |

### 6. Earn Badges & Climb the Leaderboard
Contributions are tracked across three dimensions:

| Category | Milestones |
|---|---|
| Contribution | 1 / 5 / 10 / 25 / 50 approved replies |
| Query | 1 / 5 / 20 questions asked |
| Resolution | 1 / 10 / 25 of your own questions resolved |

Badge awards fire a real-time `BADGE` notification. The public leaderboard ranks the top 10 contributors by approved-reply count.

---

## System Architecture

```
Browser (React 19 + Vite)
        │  REST + WebSocket
        ▼
Express API (TypeScript)
    ├── better-auth        — sessions, Google OAuth, email/password, RBAC
    ├── Zod validation     — all request bodies validated before business logic
    ├── Rate limiting      — per-route limiters (global / auth / chat / query)
    ├── Socket.IO          — authenticated push notifications
    ├── MongoDB + Mongoose — persistent data store
    ├── Google Gemini      — text embeddings for FAQ vector search
    └── Ollama (llama3.2)  — local LLM for RAG and chatbot answer generation
```

---

## Key Design Decisions

**Separation of approval and FAQ promotion.** Approving a reply resolves the question. Turning it into a searchable FAQ entry is an explicit second admin action. This gives admins full control over what enters the knowledge base without blocking community resolution.

**RAG threshold guard.** The chatbot only invokes the LLM when vector search returns a FAQ with similarity ≥ 0.82. Below that threshold it returns a canned "no relevant information found" response, avoiding hallucinated answers and protecting LLM costs.

**Per-user rate limiting.** Rate limit buckets are keyed by `user:<id>` for authenticated requests and `ip:<address>` for guests, so users on shared networks (e.g. university Wi-Fi) don't share quotas.

**Push-based notifications.** Every notification (reply, approval, badge, FAQ promotion) is emitted over Socket.IO the moment it's created — no polling required on the frontend.

**Two-phase FAQ ingestion.** The PDF ingestion script first tries a fast regex pass (numbered `X.Y Question? Answer` patterns). Only if that yields nothing does it fall back to chunking the PDF and asking Ollama to extract Q&A pairs, keeping ingestion fast for well-structured PDFs.

---

## Module Summary

| Module | Responsibility |
|---|---|
| `auth` | Registration, login, Google OAuth, email verification, password reset, session management |
| `admin` | User listing and role management; role changes immediately revoke the target's active sessions |
| `query` | Question submission, pagination, status filtering, admin review and deletion |
| `reply` | Replies to questions, admin approval workflow, owner/admin deletion |
| `faq` | Knowledge base CRUD, vector embedding, explicit promotion from resolved queries |
| `chat` | Stateless RAG endpoint and stateful multi-turn chatbot |
| `badge` | Gamification — 11 default badges across contribution, query, and resolution categories |
| `notification` | Persistent notifications (REPLY, APPROVAL, FAQ, BADGE, SYSTEM) with real-time delivery |
| `user` | User profiles and badge storage (shares the better-auth `user` collection) |

---

## Frontend

Built with **React 19**, **TypeScript**, and **Vite**. Key libraries:

| Concern | Library |
|---|---|
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Forms | react-hook-form + Zod v4 + @hookform/resolvers |
| HTTP | Axios |
| Styling | Tailwind CSS 4.3 |
| Animation | Framer Motion 12 |
| Icons | Lucide React |

All form validation mirrors backend Zod schemas. The `VITE_API_BASE_URL` env variable points the Axios client at the backend.

---

## API Surface (Summary)

| Domain | Notable Endpoints |
|---|---|
| Auth | `/api/auth/sign-up/email`, `/api/auth/sign-in/email`, `/api/auth/me`, password reset, Google OAuth |
| Admin | `GET /api/admin/users`, `PATCH /api/admin/users/:id/role` |
| Queries | `POST /api/queries`, `GET /api/queries` (public), admin get/delete |
| Replies | `POST /api/queries/:queryId/replies`, `POST /api/replies/:id/approve` (admin), delete |
| FAQs | `GET /api/faqs`, `POST /api/faqs` (admin direct), `POST /api/faqs/promote/:queryId` (admin), update, delete |
| Chat | `POST /api/chat/ask` (RAG), `POST /api/chat/chatbot` (multi-turn), clear session |
| Badges | `GET /api/badges`, `GET /api/badges/leaderboard`, user badges and stats |
| Notifications | CRUD on current user's notifications, mark read/all-read |

Full request/response schemas and auth requirements are documented in the backend README.

---

## Data Flow (End to End)

```
User submits question
  └─ POST /api/queries → Query { status: "pending" }
                         Badge evaluation (if authenticated)

Peer replies
  └─ POST /api/queries/:id/replies → Reply { isApproved: false }
                                      Real-time notification → question author

Admin approves reply
  └─ POST /api/replies/:id/approve
        → Reply.isApproved = true
        → Query.status = "resolved"
        → Badges evaluated for replier + asker
        → Real-time notifications to both

Admin promotes to FAQ (separate step)
  └─ POST /api/faqs/promote/:queryId
        → FAQ created with Gemini embedding
        → Linked to source query + approved reply

User asks chatbot
  └─ POST /api/chat/ask
        → Question embedded (Gemini)
        → Vector search over FAQs
        → If similarity ≥ 0.82: Ollama generates answer
        → Else: "no relevant information found"
```

---

## Environment Variables

See the backend README for the full list. Key variables:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection |
| `GOOGLE_API_KEY` | Gemini embeddings |
| `BETTER_AUTH_SECRET` | Session signing key (≥ 32 chars) |
| `CORS_ORIGIN` | Frontend origin for CORS + Socket.IO |
| `SMTP_*` | Transactional email (verification, password reset) |

All rate-limit windows and maxima are configurable via env and have safe defaults.

---

## Running Locally

```bash
# 1. Start Ollama
ollama serve && ollama pull llama3.2

# 2. Backend
cd backend
cp .env.example .env   # fill in variables
npm install
npx tsx src/scripts/seed-badges.ts   # seed the 11 default badges
npm run dev

# 3. (Optional) Ingest FAQ PDF
# Place Faq.pdf in ./data/ then:
npm run ingest

# 4. Frontend
cd frontend
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env.local
npm install
npm run dev
# → http://localhost:3000
```