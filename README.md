# BIM Chat AI

AI-powered chat interface for BIM documents with retrieval-augmented generation (RAG) and semantic search.

Upload building information modeling documents and ask questions using an intelligent chat assistant backed by vector embeddings and Google's Gemini LLM.

## ✨ Features

- 📄 **Document Management** — Upload, organize, and delete BIM documents (PDF, DOCX, TXT, etc.)
- 🔍 **Semantic Search** — Vector embeddings with pgvector for intelligent document retrieval
- 💬 **Real-time Chat** — Streaming AI responses with Server-Sent Events (SSE)
- 🤖 **RAG Pipeline** — Retrieval-augmented generation combining embeddings and LLM
- 🔐 **Built-in Auth** — Supabase Auth with Google OAuth + email/password
- 📊 **OCR Support** — Automatic text extraction from scanned documents
- ⚡ **Microservices** — Scalable, modular architecture with clear service boundaries

## 🏗️ Architecture

BIM Chat is built as a microservices application with three core services:

```
Frontend (React + TypeScript + Tailwind)  ←→  Chat Service (Node.js + Express)
                                           ←→  Ingestion Service (Python + FastAPI)
                                           ↓
                                    Supabase (PG + pgvector)
```

### Services

| Service | Port | Tech | Purpose |
|---------|------|------|---------|
| **Frontend** | 5173 | React 19, TypeScript, Tailwind, Vite | Web UI for chat and document management |
| **Chat Service** | 3001 | Node.js, Express, TypeScript | Chat CRUD, message streaming, RAG orchestration |
| **Ingestion Service** | 3002 | Python 3.13, FastAPI | Document upload, OCR, chunking, embedding generation |
| **Database** | — | Supabase (PostgreSQL + pgvector) | Persistent storage + vector search |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account (free tier works)
- Google API key (for embeddings + LLM)

### 1. Clone & Setup Environment

```bash
git clone https://github.com/andrew-miroiu/bim-chat-ai.git
cd bim-chat-ai

# Create .env files for each service
# See .env.example files for required variables
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

**Required env vars:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3002
```

### 3. Chat Service Setup

```bash
cd services/chat-service
npm install
npm run dev
# Runs on http://localhost:3001
```

**Required env vars:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GOOGLE_API_KEY=your_google_key
```

### 4. Ingestion Service Setup

```bash
cd services/ingestion-service
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --port 3002
```

**Required env vars:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GOOGLE_API_KEY=your_google_key
```

## 📚 API Reference

### Authentication
All endpoints require the `Authorization: Bearer <token>` header.

Tokens are obtained via Supabase Auth (Google OAuth or email/password) on the frontend.

### Chat Service (`localhost:3001`)

**Chats**
- `GET /chats` — List user's chats
- `POST /chats` — Create new chat
- `PATCH /chats/:id` — Update chat title
- `DELETE /chats/:id` — Delete chat

**Messages**
- `GET /chats/:chatId/messages` — Get all messages in a chat
- `POST /chats/:chatId/messages` — Send message (returns SSE stream)

**Documents**
- `GET /documents` — List uploaded documents
- `DELETE /documents/:id` — Delete document

### Ingestion Service (`localhost:3002`)

**Upload**
- `POST /ingestion/upload` — Upload document
  - Form data: `file` (binary), `title` (string, optional)
  - Returns: `{ id, title, filename, created_at }`

## 💾 Database Schema

```sql
users (id, email, created_at)
chats (id, user_id, title, created_at)
messages (id, chat_id, role, content, created_at)
documents (id, title, file_url, uploaded_by, category, summary, created_at)
chunks (id, document_id, content, embedding vector(3072), chunk_index)
```

## 🔄 RAG Pipeline

1. **Upload** — User uploads document via frontend
2. **Ingest** — Ingestion service processes file (OCR, extract text)
3. **Chunk** — Split into overlapping chunks (~500 tokens)
4. **Embed** — Generate embeddings using `gemini-embedding-001` (3072 dims)
5. **Store** — Save chunks + embeddings in pgvector
6. **Retrieve** — On user message, search similar chunks (cosine distance)
7. **Generate** — Pass context + query to `gemini-3.1-flash-lite` for response
8. **Stream** — SSE stream tokens to frontend

## 📁 Project Structure

```
bim-chat-ai/
├── frontend/                 # React web application
│   ├── src/
│   │   ├── context/         # AuthContext for JWT tokens
│   │   ├── pages/           # ChatPage, DocumentsPage, LoginPage
│   │   ├── components/      # UI components (buttons, cards, inputs)
│   │   └── lib/             # Supabase client, utilities
│   └── package.json
├── services/
│   ├── chat-service/        # Node.js chat API + RAG
│   │   ├── src/
│   │   │   ├── chats/       # Chat CRUD
│   │   │   ├── messages/    # Message streaming
│   │   │   └── documents/   # Document queries
│   │   └── package.json
│   └── ingestion-service/   # Python document processing
│       ├── src/
│       │   ├── ingestion/   # OCR, chunking, embedding
│       │   └── lib/         # Supabase client
│       └── requirements.txt
├── CLAUDE.md               # Architecture & conventions
└── README.md              # This file
```

## 🛠️ Development

### Code Conventions

- **TypeScript strict mode** in frontend & chat service
- **Feature-based folder structure** (features/domain organized)
- **No inline styles** — Tailwind CSS only
- **Async/await everywhere** — no callbacks
- **Error handling in every endpoint**
- **Type-safe API calls** with full TypeScript coverage

### Development Commands

**Frontend:**
```bash
npm run dev      # Start dev server (HMR enabled)
npm run build    # Production build
npm run preview  # Serve built app
npm run lint     # ESLint
```

**Chat Service:**
```bash
npm run dev      # TypeScript watch + nodemon
npm run build    # Compile to dist/
npm start        # Run compiled version
```

**Ingestion Service:**
```bash
# Development
python -m uvicorn src.main:app --reload --port 3002

# Production
gunicorn -w 4 -k uvicorn.workers.UvicornWorker src.main:app
```

### Debugging

**Frontend:** Browser DevTools (React, network, console)

**Chat Service:** `npm run dev` prints ts-node output; set `DEBUG=*` for verbose logging

**Ingestion Service:** FastAPI docs at `http://localhost:3002/docs` (Swagger UI)

## 🔐 Security Notes

- All endpoints require valid JWT tokens
- Supabase Auth handles token generation & validation
- Service-role key only for backend services (never expose in frontend)
- Environment variables must be set — no defaults for secrets
- CORS enabled only for frontend origin

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS, React Router, Vite |
| **Chat Service** | Node.js 18+, Express, TypeScript, @supabase/supabase-js |
| **Ingestion Service** | Python 3.11+, FastAPI, pymupdf, pytesseract, google-genai |
| **Database** | PostgreSQL (Supabase) + pgvector extension |
| **Auth** | Supabase Auth (JWT HS256) |
| **AI/ML** | Google Gemini (embeddings + LLM) |
| **Storage** | Supabase Storage (PDFs, documents) |

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License — see LICENSE file for details.

## 📧 Support

For questions or issues:
- Open a GitHub issue
- Check existing discussions
- Review the CLAUDE.md architecture guide

---

**Built with ❤️ for the AEC industry**
