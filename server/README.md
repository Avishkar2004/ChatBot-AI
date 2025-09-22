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
     - `JWT_EXPIRES_IN=7d`

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

### Chat API (stub)
- `POST /api/projects/:projectId/chat` — Send `{ message }` and receive `{ reply }`
  - Backed by Groq if `GROQ_API_KEY` is set. Defaults to `GROQ_MODEL=llama-3.1-8b-instant`.
  - To change model, set `GROQ_MODEL` in `.env`.

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

