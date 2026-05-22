# BIM Chat — Project Context

## Architecture
Microservices project for BIM document management with AI-powered chat.

### Services
- **Frontend** — React + TypeScript + Tailwind, port 5173
- **Chat Service** — Node.js + Express + TypeScript, port 3001
- **Ingestion Service** — Python + FastAPI, port 3002
- **API Gateway** — Node.js (not yet implemented)

### Database
- Supabase (PostgreSQL + pgvector)
- Auth: Supabase Auth (JWT HS256)
- Storage: Supabase Storage

## Database Schema

```sql
users (id, email, created_at)
chats (id, user_id, title, created_at)
messages (id, chat_id, role, content, created_at)
documents (id, title, file_url, uploaded_by, category, summary, created_at)
chunks (id, document_id, content, embedding vector(3072), chunk_index)
```

## Chat Service Endpoints (port 3001)
All endpoints require `Authorization: Bearer <token>` header.

- `GET /chats` — get all chats for authenticated user
- `POST /chats` — create new chat (title defaults to "Chat nou")
- `PATCH /chats/:id` — update chat title
- `DELETE /chats/:id` — delete chat
- `GET /chats/:chatId/messages` — get all messages in a chat
- `POST /chats/:chatId/messages` — send message, returns SSE stream

### SSE Streaming Format
```
data: {"text": "token"}\n\n
data: {"done": true}\n\n
```

## Ingestion Service Endpoints (port 3002)
All endpoints require `Authorization: Bearer <token>` header.

- `POST /ingestion/upload` — upload document (multipart/form-data: file, title)

## Frontend Structure
```
src/
├── context/
│   └── AuthContext.tsx    — provides JWT token via useAuth() hook
├── hooks/
├── pages/
│   ├── LoginPage.tsx      — Google OAuth + email/password
│   ├── ChatPage.tsx       — main chat interface (empty)
│   └── DocumentsPage.tsx  — document upload (empty)
├── components/
└── lib/
    └── supabaseClient.ts
```

## Auth
- `useAuth()` hook returns JWT token string or null
- Token goes in every request: `Authorization: Bearer ${token}`
- Supabase handles login/logout

## Tech Stack
- Frontend: React 19, TypeScript, Tailwind CSS, React Router
- Chat Service: Node.js, Express, TypeScript, @supabase/supabase-js, @google/genai
- Ingestion Service: Python 3.13, FastAPI, pymupdf, pytesseract, google-genai
- Embeddings: gemini-embedding-001 (3072 dimensions)
- LLM: gemini-3.1-flash-lite

## Code Conventions
- Feature-based folder structure
- TypeScript strict mode
- No inline styles — Tailwind only
- Async/await everywhere, no callbacks
- Error handling in every endpoint

## What's Done
- [x] Auth (Google OAuth + email/password)
- [x] Chat CRUD endpoints
- [x] Messages CRUD endpoints
- [x] RAG pipeline (embed → vector search → LLM)
- [x] SSE streaming
- [x] Ingestion Service (OCR + chunking + embedding)

## What's Left
- [ ] ChatPage UI
- [ ] DocumentsPage UI
- [ ] API Gateway