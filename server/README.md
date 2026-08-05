# Chatbot AI Server

This is the backend server for the Chatbot AI application, built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (version 14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` and update values as needed
   - Example defaults:
     - `MONGODB_URI=mongodb://localhost:27017/chatbot_ai`
     - `PORT=8080`
     - `JWT_SECRET=replace_with_a_long_random_string`
     - `JWT_EXPIRES_IN=1d`

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on port 8080 (or the port specified in your `.env` file).

## Testing MongoDB Connection

To test the MongoDB connection:
```bash
node test-db.js
```

## API Endpoints

### Health Check
- `GET /health` - Returns server health status

### Auth API
- `POST /api/auth/register` — Register a new user with email and password
- `POST /api/auth/login` — Login and receive a JWT token
- `GET /api/auth/me` — Get current user from token (requires `Authorization: Bearer <token>`)
### Projects API (requires Bearer token)
- `GET /api/projects` — List user's projects
- `POST /api/projects` — Create project `{ name, description?, model?, provider? }`
- `GET /api/projects/:projectId` — Get a project
- `PUT /api/projects/:projectId` — Update a project
- `DELETE /api/projects/:projectId` — Delete a project

### Prompts API
- `GET /api/projects/:projectId/prompts` — List prompts for a project
- `POST /api/projects/:projectId/prompts` — Create prompt `{ title, content }`
- `PUT /api/projects/:projectId/prompts/:promptId` — Update prompt
- `DELETE /api/projects/:projectId/prompts/:promptId` — Delete prompt

### Chat API
- `POST /api/projects/:projectId/chat` — Send `{ message }` and receive `{ reply }`
  - Backed by Groq if `GROQ_API_KEY` is set. Defaults to `GROQ_MODEL=llama-3.1-8b-instant`.
  - To change model, set `GROQ_MODEL` in `.env`.
- `POST /api/projects/:projectId/chat/stream` — Same payload, streamed as SSE
  (`data: {"delta":"..."}` frames, then `data: [DONE]`).
- `GET /api/projects/:projectId/chat/history` — Durable history from MongoDB
  (Redis serves the hot window; Mongo is the system of record).
- `DELETE /api/projects/:projectId/chat/clear` — Delete the thread everywhere.

### Admin API (Bearer token + `ADMIN_EMAILS` membership)
- `GET /api/cache/stats` — Redis stats and cache TTL config
- `DELETE /api/cache/all`, `DELETE /api/cache/pattern/:pattern` — destructive flushes
- `GET /api/metrics` — JSON snapshot (`?format=prometheus` for text exposition)
- `POST /api/metrics/log-level` — `{ "level": "debug" }` to change verbosity live
- `POST /api/metrics/reset` — zero the counters

`DELETE /api/cache/user` and `POST /api/cache/warm` remain available to any
authenticated user because they only touch that user's keys.

## Observability

Every request gets a correlation ID (`X-Request-Id`, reused if the caller sends
a well-formed one) that is attached to every log line and returned in error
bodies, so a user report maps to exact log lines.

- Logs are single-line JSON in production (`LOG_FORMAT=pretty` for a readable
  dev format). Credentials are redacted and long strings truncated.
- `/api/metrics` reports request counts, latency percentiles, error counts by
  type, and token/cost totals per model.
- Model spend is estimated from `MODEL_PRICING_JSON` (falls back to published
  Groq list prices); unknown models are reported under `llm.unpricedModels`
  rather than silently costed at zero.
- Set `ERROR_WEBHOOK_URL` to forward unhandled errors to Slack or a relay.

## Testing

```bash
npm test            # node:test, no external services required
npm run test:watch
npm run test:coverage
```

Tests stub Redis/MongoDB at the module boundary, so the suite runs offline.
`NODE_ENV=test` also stops `app.js` from opening connections or binding a port,
which lets the admin-route tests exercise the real middleware stack.

#### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

#### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

Response contains `token`.

#### Me (Protected)
```bash
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <paste_token_here>"
```

## Database Schema

### User Model
```javascript
{
  email: String (unique, required),
  passwordHash: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables

- `PORT` - Server port (default: 8080)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for signing JWTs
- `JWT_EXPIRES_IN` - Token TTL (e.g., `7d`)
- `ADMIN_EMAILS` - Comma-separated admins for `/api/cache` and `/api/metrics`.
  **Unset means nobody is an admin** — those endpoints return 403 for everyone.
- `LOG_LEVEL` - `debug` | `info` | `warn` | `error` | `silent` (default `info`)
- `LOG_FORMAT` - `json` (default in production) or `pretty`
- `ERROR_WEBHOOK_URL` - Optional POST target for unhandled errors
- `MODEL_PRICING_JSON` - Override token pricing, e.g.
  `{"llama-3.1-8b-instant":{"prompt":0.05,"completion":0.08}}`

## Project Structure

```
server/
├── config/
│   └── db.js          # Database connection configuration
├── controllers/
│   └── authController.js
├── middleware/
│   └── auth.js
├── models/
│   └── User.js        # User model schema
├── routes/
│   └── authRoutes.js
├── index.js           # Main server file
├── .env.example       # Example environment variables
├── package.json
└── README.md
```

## MongoDB Setup

### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The default connection string `mongodb://localhost:27017/chatbot-ai` should work

### MongoDB Atlas (Cloud)
1. Create a MongoDB Atlas account
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env` file with your Atlas connection string

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running (if using local installation)
- Check your connection string in `.env`
- Verify network connectivity (if using MongoDB Atlas)
- Check firewall settings

### Common Errors
- `MongoServerError: Authentication failed` - Check username/password in connection string
- `MongoNetworkError` - Check network connectivity and MongoDB service status