## Chatbot AI – Brief Architecture & Design

### Overview
Full‑stack chatbot platform with user auth, multi‑project (agent) management, stored prompts, and chat powered by Groq LLM.

### Components
- Client (`client/`): React + Vite + Tailwind UI
  - Auth pages (Login/Signup), Dashboard, Projects, Project Detail, Project Chat
  - Stores JWT in `localStorage`; calls API with `Authorization: Bearer <token>`
- Server (`server/`): Node.js + Express + MongoDB (Mongoose)
  - Auth (register/login/me), Projects CRUD, Prompts CRUD, Chat endpoint to Groq
  - JWT auth middleware attaches `req.user`
- Database: MongoDB (Atlas or local)
- LLM: Groq Chat Completions (model configurable, defaults to `llama-3.1-8b-instant`)

### Data Model (simplified)
- User: `{ email, passwordHash }`
- Project: `{ userId, name, description, model, provider }`
- Prompt: `{ userId, projectId, title, content }`

Relations: A User owns many Projects; a Project owns many Prompts.

### Request Flow
1) Client obtains JWT on login; stores in `localStorage`.
2) For protected endpoints, client sends `Authorization: Bearer <token>`.
3) Server verifies JWT, sets `req.user`.
4) Routes enforce ownership by `userId` when accessing Projects/Prompts.
5) Chat endpoint assembles system message from project + prompts, calls Groq, returns reply.

### API (high‑level)
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:projectId`
- `GET/POST /api/projects/:projectId/prompts`, `PUT/DELETE /api/projects/:projectId/prompts/:promptId`
- `POST /api/projects/:projectId/chat` → `{ reply }`

### Security
- Passwords hashed with bcrypt
- JWT signed with `JWT_SECRET`, expiry `JWT_EXPIRES_IN`
- Route‑level ownership checks (`userId`)

### Deployment & Config
- Client: Vercel (public URL)
- Server: Vercel/Node host (public API URL)
- CORS: allowlist of client origins via `CLIENT_ORIGINS` env

Env (server/.env):
- `MONGODB_URI` – Mongo Atlas/local connection string
- `PORT` – API port (dev)
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `GROQ_API_KEY`, `GROQ_MODEL`