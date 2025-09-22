# Architecture Overview

## System

- Client: React + Vite + Tailwind
- Server: Node.js + Express
- Database: MongoDB via Mongoose
- Auth: Email/password with JWT; token-based auth for API
- LLM: Groq chat completions; system prompt composed from project prompts

## Domain Model

- User: { email, passwordHash }
- Project: { userId, name, description, model, provider }
- Prompt: { userId, projectId, title, content }

A User owns many Projects. A Project owns many Prompts.

## API

- Auth: /api/auth/* (register, login, me)
- Projects: /api/projects (CRUD)
- Prompts: /api/projects/:projectId/prompts (CRUD)
- Chat: /api/projects/:projectId/chat → calls Groq with system + user message

## Request Flow

1) Client stores JWT in localStorage after login
2) For protected routes, client sends Authorization: Bearer <token>
3) Server middleware validates JWT and attaches req.user
4) Routes enforce ownership (userId) on Projects/Prompts
5) Chat route fetches prompts, builds system message, calls Groq, returns reply

## Frontend Structure

- App routes: Home, Login, Signup, Dashboard, Projects, ProjectDetail, ProjectChat
- Components: Navbar, Footer, reusable UI (Button, Input, Card, Container)
- State: AuthContext for auth/user info
- Styling: Tailwind dark theme with brand palette

## Security

- Passwords hashed with bcrypt
- JWT signed with secret and expiry
- Protected routes require valid token
- Project/prompt access filtered by userId