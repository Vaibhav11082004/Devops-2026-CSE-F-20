# SentinelAI Core Engine Backend API

Autonomous SecOps & Cyber Threat Command Platform REST API built with Node.js, Express, TypeScript, SQLite, and JWT authentication.

---

## 🚀 Features

- **JWT Authentication**: Secure user registration, credential login, password hashing with `bcryptjs`, and session token validation.
- **SQLite Persistence**: Automatic table creation and pre-seeded dataset for demo users, security incidents, and AI sentinel agents.
- **Threat Interception & Telemetry**: Endpoints for real-time security posture stats, active incident ledger, and containment actions.
- **Configurable Settings**: Dynamic persistence of autonomous mitigation policies, notification preferences, and webhook destinations.
- **Zero-Config TypeScript Setup**: Modern ES Modules with fast build scripts and type definitions.

---

## 📁 Project Structure

```
sentinel-ai-backend/
├── src/
│   ├── db/
│   │   └── database.ts            # SQLite connection, schema migrations & auto-seeding
│   ├── middleware/
│   │   ├── auth.ts                # JWT authentication middleware
│   │   └── errorHandler.ts        # Centralized error handler
│   ├── routes/
│   │   ├── authRoutes.ts          # /api/v1/auth (register, login, me, logout)
│   │   ├── securityRoutes.ts      # /api/v1/security (stats, incidents, agents, scan)
│   │   └── settingsRoutes.ts      # /api/v1/settings (GET / PUT defense configurations)
│   └── server.ts                  # Express application entry point & CORS configuration
├── .env.example                   # Template environment variables
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies and scripts
└── tsconfig.json                  # TypeScript compiler settings
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher; v24 tested)
- npm or pnpm

### 2. Installation
```powershell
# Clone the repository
git clone <your-repo-url>
cd sentinel-ai-backend

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
PORT=5000
JWT_SECRET=sentinel_super_secret_jwt_key_2026_defense_grid
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

### 4. Running the Server

#### Development Mode (with hot-reload):
```powershell
npm run dev
```

#### Production Build & Start:
```powershell
npm run build
npm start
```
The server will start at `http://localhost:5000/api/v1`.

---

## 🔑 Pre-Seeded Demo Credentials

On first run, the SQLite database automatically creates and seeds two accounts:

| Email | Passcode | Role |
|---|---|---|
| `alex.rivera@sentinel.ai` | `password123` | SecOps Director |
| `operator@sentinel.ai` | `sentinel-secure-pass` | Senior SOC Specialist |

---

## 📡 API Reference

### Health Check
- `GET /api/v1/health` - Check API online status

### Authentication
- `POST /api/v1/auth/register` - Register a new operator node
- `POST /api/v1/auth/login` - Authenticate with email and password
- `GET /api/v1/auth/me` - Get current authenticated user profile *(Requires Bearer token)*
- `POST /api/v1/auth/logout` - Terminate operator session

### Security Operations
- `GET /api/v1/security/stats` - Retrieve KPI telemetry stats *(Requires Bearer token)*
- `GET /api/v1/security/incidents` - List incidents (supports `?severity=critical&status=active`) *(Requires Bearer token)*
- `POST /api/v1/security/incidents/:id/resolve` - Mitigate/isolate a threat vector *(Requires Bearer token)*
- `GET /api/v1/security/agents` - List active AI Sentinel neural models *(Requires Bearer token)*
- `POST /api/v1/security/scan` - Trigger a perimeter audit scan *(Requires Bearer token)*

### Settings
- `GET /api/v1/settings` - Retrieve current defense settings *(Requires Bearer token)*
- `PUT /api/v1/settings` - Update defense mode and notification webhooks *(Requires Bearer token)*

---

## 📄 License
MIT
