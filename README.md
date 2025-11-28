# 🤖 Chatbot AI Platform

A production-ready, full-stack multi-project AI chatbot platform that enables users to create custom AI assistants with project-specific prompts and context. Built with modern web technologies and enterprise-grade architecture featuring secure authentication, intelligent caching, and scalable LLM integration.

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-Cloud-DC382D?logo=redis)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)

---

## 🎯 Overview

Chatbot AI is a sophisticated platform that allows users to:
- **Create multiple AI projects** with custom configurations
- **Define project-specific prompts** to guide AI behavior
- **Chat with intelligent assistants** powered by Groq LLM
- **Manage conversations** with persistent chat history
- **Experience fast responses** through Redis-powered caching

### Key Features

✅ **Multi-Project Architecture** – Organize AI assistants by project with isolated contexts  
✅ **Secure Authentication** – JWT-based auth with protected routes and middleware  
✅ **Intelligent Caching** – Redis-backed API caching, prompt caching, and session storage  
✅ **Rate Limiting** – Per-user chat limits to control costs and prevent abuse  
✅ **LLM Integration** – Groq SDK with model fallback and error handling  
✅ **Prompt Management** – Create, update, and organize prompts per project  
✅ **Chat History** – Redis-stored conversation context (last 10 messages)  
✅ **Health Monitoring** – Startup checks and health endpoints for MongoDB/Redis  
✅ **Responsive UI** – Modern, clean interface with Tailwind CSS and animations  
✅ **Production Ready** – CORS hardening, validation, structured error handling  

---

## 🏗️ Tech Stack

### Frontend
- **React 18** – Modern UI with hooks and Context API
- **React Router v7** – Client-side routing with protected routes
- **Tailwind CSS** – Utility-first styling with custom components
- **Framer Motion & GSAP** – Smooth animations and transitions
- **Axios** – HTTP client with interceptors for auth

### Backend
- **Node.js & Express 5** – RESTful API server
- **MongoDB + Mongoose** – Document database with schema validation
- **Redis Cloud** – Distributed caching and session storage
- **JWT (jsonwebtoken)** – Stateless authentication
- **Groq SDK** – LLM chat completions with model normalization
- **express-validator** – Request validation middleware
- **express-rate-limit** – Rate limiting per user/endpoint
- **bcryptjs** – Password hashing
- **Morgan** – HTTP request logging

### Architecture Patterns
- **Layered Caching** – Request cache, data cache, session cache
- **Middleware Pipeline** – Auth, validation, rate limiting, caching
- **Environment-Based Config** – `.env` for secrets and settings
- **Error Handling** – Centralized error middleware with dev/prod modes
- **RESTful Design** – Resource-based endpoints with proper HTTP methods

---

## 📁 Project Structure

```
Chatbot AI/
├── client/                    # React frontend
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # Button, Card, Input, Container
│   │   │   ├── layout/       # Page wrapper
│   │   │   ├── project/      # Project-specific components
│   │   │   ├── Features.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global auth state
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   └── ProjectChat.jsx
│   │   ├── routes/
│   │   │   └── Routes.jsx         # Route configuration
│   │   ├── services/
│   │   │   ├── auth.js            # Auth API calls
│   │   │   └── projects.js        # Project API calls
│   │   ├── config/
│   │   │   └── api.js             # Axios instance
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
│
├── server/                    # Node.js backend
│   ├── config/
│   │   ├── db.js             # MongoDB connection
│   │   └── redis.js          # Redis client setup
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   ├── apiCache.js       # Redis caching middleware
│   │   └── redisAuth.js      # Rate limiting
│   ├── models/
│   │   ├── User.js           # User schema
│   │   ├── Project.js        # Project schema
│   │   └── Prompt.js         # Prompt schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── promptRoutes.js
│   │   ├── chatRoutes.js
│   │   └── cacheRoutes.js
│   ├── services/
│   │   └── redisCache.js     # Cache utilities
│   ├── index.js              # Server entry point
│   └── package.json
│
├── feature roadmap.md         # Future enhancements
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local or Atlas)
- **Redis** (local or Redis Cloud)
- **Groq API Key** (for LLM chat)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Avishkar2004/ChatBot-AI.git
cd ChatBot-AI
```

2. **Set up the server**
```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials (see below)
```

3. **Set up the client**
```bash
cd ../client
npm install

# Create .env file (optional)
echo "REACT_APP_API_URL=http://localhost:8080" > .env
```

### Environment Variables

#### Server `.env`
```env
# Server
PORT=8080
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/chatbot-ai
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot-ai

# Redis Cloud
REDIS_HOST=your-redis-host.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-redis-password
REDIS_USERNAME=default

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Groq LLM
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-8b-instant

# CORS
CLIENT_ORIGINS=http://localhost:3000,https://your-production-domain.com
```

#### Client `.env` (optional)
```env
REACT_APP_API_URL=http://localhost:8080
```

### Running the Application

#### Development Mode

**Terminal 1 – Start the server:**
```bash
cd server
npm run dev
```
Server runs on `http://localhost:8080`

**Terminal 2 – Start the client:**
```bash
cd client
npm start
```
Client runs on `http://localhost:3000`

#### Production Mode

**Build the client:**
```bash
cd client
npm run build
```

**Start the server:**
```bash
cd server
npm start
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login and get JWT | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### Projects
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects` | List user's projects | ✅ |
| POST | `/api/projects` | Create new project | ✅ |
| GET | `/api/projects/:id` | Get project details | ✅ |
| PUT | `/api/projects/:id` | Update project | ✅ |
| DELETE | `/api/projects/:id` | Delete project | ✅ |

### Prompts
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects/:projectId/prompts` | List prompts | ✅ |
| POST | `/api/projects/:projectId/prompts` | Create prompt | ✅ |
| PUT | `/api/projects/:projectId/prompts/:promptId` | Update prompt | ✅ |
| DELETE | `/api/projects/:projectId/prompts/:promptId` | Delete prompt | ✅ |

### Chat
| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| POST | `/api/projects/:projectId/chat` | Send message | ✅ | 10 req/min |

### System
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | ❌ |
| GET | `/api/cache/stats` | Cache statistics | ❌ |
| POST | `/api/cache/invalidate` | Clear cache | ❌ |

---

## 🔐 Authentication Flow

1. User registers via `/api/auth/register`
2. User logs in via `/api/auth/login` → receives JWT token
3. Client stores token in `AuthContext` and `localStorage`
4. All protected requests include `Authorization: Bearer <token>` header
5. Server middleware verifies token and attaches `req.user`
6. Protected routes render only if user is authenticated

---

## 💬 Chat Flow

1. User navigates to `ProjectChat` page
2. User types message and submits
3. Client sends `POST /api/projects/:projectId/chat` with message
4. Server:
   - Validates user owns project
   - Fetches cached prompts (or queries DB)
   - Retrieves last 10 messages from Redis session
   - Constructs system prompt from project prompts
   - Calls Groq API with context
   - Stores user message + assistant reply in Redis
   - Returns reply to client
5. Client displays assistant response
6. Chat history persists in Redis for session continuity

---

## ⚡ Caching Strategy

### Three-Layer Caching

1. **Request Cache** (`apiCache` middleware)
   - Caches entire API responses by URL + query params
   - TTL: configurable per route (e.g., 30s for `/health`)
   - Reduces redundant DB queries

2. **Data Cache** (`redisCache.cachePrompts`)
   - Caches frequently accessed data (prompts)
   - Invalidated on CRUD operations
   - Speeds up chat requests

3. **Session Cache** (`redisCache.getCachedChatSession`)
   - Stores chat history per `sessionId`
   - Keeps last 10 messages for context
   - Expires after inactivity

### Cache Invalidation
- Manual: `POST /api/cache/invalidate`
- Automatic: On prompt create/update/delete
- Stats: `GET /api/cache/stats`

---

## 🛡️ Security Features

- **Password Hashing** – bcryptjs with salt rounds
- **JWT Tokens** – Signed with secret, expiration enforced
- **Protected Routes** – Middleware checks on server + client
- **Input Validation** – express-validator on all inputs
- **CORS Hardening** – Whitelist origins, credentials enabled
- **Rate Limiting** – 10 chat requests per minute per user
- **Error Sanitization** – Hide stack traces in production
- **Environment Secrets** – All keys in `.env`, not committed

---

## 🎨 UI/UX Highlights

- **Responsive Design** – Mobile-first with Tailwind breakpoints
- **Smooth Animations** – Framer Motion page transitions, GSAP effects
- **Component Library** – Reusable Button, Card, Input, Container
- **Protected Routes** – Redirect to login if unauthenticated
- **Loading States** – Skeleton loaders and spinners
- **Error Handling** – User-friendly error messages
- **Dark Mode Ready** – Tailwind classes prepared for theme toggle

---

## 📊 Database Schema

### User
```javascript
{
  email: String (unique, required),
  passwordHash: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

### Project
```javascript
{
  userId: ObjectId (ref: User, required),
  name: String (required),
  description: String,
  model: String (default: "llama-3.1-8b-instant"),
  provider: String (default: "groq"),
  createdAt: Date,
  updatedAt: Date
}
```

### Prompt
```javascript
{
  projectId: ObjectId (ref: Project, required),
  title: String (required),
  content: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing

### Manual API Testing

**Register:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Create Project:**
```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"My AI Assistant","description":"A helpful bot"}'
```

**Chat:**
```bash
curl -X POST http://localhost:8080/api/projects/PROJECT_ID/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"Hello, how are you?"}'
```

---

## 🚧 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check Atlas dashboard
- Verify `MONGODB_URI` in `.env`
- Check network/firewall for Atlas IP whitelist

### Redis Connection Issues
- Verify Redis Cloud credentials in `.env`
- Test connection: `redis-cli -h HOST -p PORT -a PASSWORD ping`
- Check Redis Cloud dashboard for connection limits

### CORS Errors
- Add your client URL to `CLIENT_ORIGINS` in server `.env`
- Restart server after changing `.env`

### Groq API Errors
- Verify `GROQ_API_KEY` is valid
- Check model name in `GROQ_MODEL` (use `llama-3.1-8b-instant`)
- Review Groq API rate limits and quotas

### Rate Limit Hit
- Wait 60 seconds or adjust limits in `middleware/redisAuth.js`
- Clear Redis: `redis-cli FLUSHDB` (dev only)

---

## 🎯 Roadmap

See [`feature roadmap.md`](./feature%20roadmap.md) for detailed future enhancements:

- ✨ Real-time streaming with WebSockets
- 🔐 RBAC + OAuth (Google/GitHub)
- 📝 Prompt versioning and audit logs
- 📄 RAG: Document upload + embeddings
- 💳 Stripe billing + usage metering
- 📊 Observability: Pino logs, Prometheus metrics
- 🛠️ Admin dashboard
- 📚 OpenAPI spec + SDK generation
- 🧪 Testing + CI/CD

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m "feat: add amazing feature"`
4. Push to branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Avishkar Kakde**
- GitHub: [@Avishkar2004](https://github.com/Avishkar2004)
- Email: avishkarkakde2004@gmail.com

---

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for fast LLM inference
- [Redis Cloud](https://redis.com/cloud/) for managed caching
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for cloud database
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [React](https://react.dev/) and [Express](https://expressjs.com/) communities

---

## 📸 Screenshots

### Home Page
![Home Page](./screenshots/HomePage.png)

### Dashboard
![Dashboard](./screenshots/Dashboard.png)

### Projects
![Projects List](./screenshots/projects.png)

### Chat Interface
![Chat Interface](./screenshots/chat.png)

---

**⭐ give it a star if you like it!**
