# 🛡️ SentinelAI — Autonomous SecOps Command & Telemetry Grid

> **Enterprise-grade Autonomous Cyber Defense Platform** combining real-time heuristic threat detection, distributed agent telemetry, automated incident containment, and full-stack cloud-native observability.

---

## 🌟 Key Capabilities

- **Command Center UI**: Built with React 19, TypeScript, and Tailwind CSS. Features dynamic KPI stat cards, interactive threat ledgers, and zero-trust authentication guards.
- **Resilient Backend Engine**: Node.js & Express RESTful API with strict TypeScript typing, JWT authentication, and `bcryptjs` credential hashing.
- **Real-Time Telemetry Stream**: Socket.IO WebSockets providing instantaneous perimeter alert broadcasts and live neural agent heartbeats.
- **Hybrid Storage Architecture**: Production NoSQL persistence with **MongoDB & Mongoose**, paired with an embedded zero-configuration **SQLite3** local engine.
- **Observability & Metrics**: Native **Prometheus** integration exposing Counter, Gauge, and Histogram metrics, accompanied by pre-provisioned **Grafana** dashboards.
- **Cloud-Native Containerization**: Multi-stage, minimal-footprint **Dockerfiles** for frontend (Nginx Alpine) and backend (Node Alpine) orchestrated via **Docker Compose**.
- **Container Orchestration**: Declarative **Kubernetes (K8s)** manifests featuring health probes (liveness/readiness), resource limits, ConfigMaps, Secrets, and Services.
- **Continuous Integration (CI)**: Automated **Jenkins Pipeline** (`Jenkinsfile`) and **GitHub Actions** (`.github/workflows/ci.yml`) enforcing automated tests and builds.

---

## 🏗️ System Architecture

```
                                 ┌──────────────────────────────────────────────┐
                                 │              Client Browsers                 │
                                 └──────────────┬───────────────────────────────┘
                                                │
                                                ▼  Port 80 / 5173
                                 ┌──────────────────────────────────────────────┐
                                 │        Frontend (React 19 + Nginx)           │
                                 └──────────────┬───────────────────────────────┘
                                                │  HTTP / WebSocket Reverse Proxy
                                                ▼  Port 5000
                                 ┌──────────────────────────────────────────────┐
                                 │       Backend (Node Express + Socket.IO)     │
                                 └───────┬──────────────┬──────────────┬────────┘
                                         │              │              │
                    ┌────────────────────┘              │              └────────────────────┐
                    ▼                                   ▼                                   ▼
┌───────────────────────────────────────┐ ┌───────────────────────────┐ ┌──────────────────────────────────────┐
│       Prometheus (Port 9090)          │ │   MongoDB / SQLite Store  │ │         Grafana (Port 3000)          │
│ Scrapes /metrics (Counters, Latency)  │ │ Users, Incidents, Agents  │ │ Real-Time Telemetry Dashboard Visuals│
└───────────────────────────────────────┘ └───────────────────────────┘ └──────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
├── .github/workflows/ci.yml       # GitHub Actions automated build & test pipeline
├── backend/
│   ├── Dockerfile                 # Multi-stage production container for API server
│   ├── src/
│   │   ├── db/                    # MongoDB Mongoose models & SQLite engine
│   │   ├── middleware/            # JWT auth guard & centralized error handling
│   │   ├── monitoring/            # Prometheus metrics (Counters, Gauges, Histograms)
│   │   ├── routes/                # REST API controllers (Auth, Security, Settings)
│   │   ├── socket.ts              # Socket.IO WebSocket telemetry broadcaster
│   │   ├── tests/                 # Automated API integration test suite
│   │   └── server.ts              # Express server entry point
│   ├── package.json               # Backend dependencies & test scripts
│   └── tsconfig.json              # TypeScript configuration
├── k8s/                           # Production Kubernetes manifests
│   ├── namespace.yaml             # sentinel-system namespace
│   ├── configmap.yaml             # Cluster ConfigMap & Secret definitions
│   ├── mongodb-deployment.yaml    # MongoDB Deployment & Service
│   ├── backend-deployment.yaml    # Backend Deployment with probes & Service
│   └── frontend-deployment.yaml   # Frontend Deployment & NodePort Service
├── monitoring/
│   ├── prometheus/prometheus.yml  # Prometheus target scrape configuration
│   └── grafana/provisioning/      # Pre-provisioned Prometheus datasource & Dashboard JSON
├── src/                           # React frontend application
│   ├── components/                # Layouts (Navbar, Sidebar) & UI components
│   ├── context/                   # AuthContext with session persistence
│   ├── pages/                     # Login, Register, Threat Dashboard, Incidents, Settings
│   └── services/                  # Live API client & WebSocket listener
├── Dockerfile                     # Multi-stage Nginx container for frontend
├── docker-compose.yml             # Full 5-service stack orchestration
├── Jenkinsfile                    # Declarative multi-stage Jenkins pipeline
├── nginx.conf                     # Production Nginx reverse-proxy configuration
└── tailwind.config.js             # Cybersecurity theme styling & glow utilities
```

---

## 🚀 Quickstart & Deployment

### Option 1: Docker Compose (Recommended — Instant 5-Service Stack)

To launch the complete infrastructure (Frontend, Backend, MongoDB, Prometheus, and Grafana) with a single command:

```powershell
docker compose up -d --build
```

#### Access Your Services:
| Service | URL | Credentials / Notes |
|---|---|---|
| **SentinelAI Web App** | [http://localhost](http://localhost) | Use One-Click Demo Login |
| **Backend API Health** | [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health) | API Status & Diagnostics |
| **Prometheus Telemetry** | [http://localhost:9090](http://localhost:9090) | Targets: `backend:5000/metrics` |
| **Grafana Dashboard** | [http://localhost:3100](http://localhost:3100) | `admin` / `sentinel` |

---

### Option 2: Local Development Mode

#### 1. Start the Backend API
```powershell
cd backend
npm install
npm test          # Run automated integration tests
npm run dev       # Hot-reload development server (Port 5000)
```

#### 2. Start the Frontend
In a new terminal window:
```powershell
npm install
npm run dev       # Vite development server (Port 5173)
```
Open [http://localhost:5173](http://localhost:5173).

---

### Option 3: Kubernetes Deployment

Deploy the entire microservice grid into your Kubernetes cluster:

```powershell
# 1. Create dedicated namespace
kubectl apply -f k8s/namespace.yaml

# 2. Deploy configuration & secrets
kubectl apply -f k8s/configmap.yaml

# 3. Deploy databases and services
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# 4. Check cluster status
kubectl get all -n sentinel-system
```

---

## 📊 Prometheus Metrics Dictionary

The backend natively exposes production metrics at `GET /metrics`:

| Metric Name | Type | Description |
|---|---|---|
| `sentinel_http_requests_total` | **Counter** | Total HTTP requests labeled by `method`, `route`, and `status_code` |
| `sentinel_threats_blocked_total` | **Counter** | Total cyber threats neutralized labeled by `vector` and `severity` |
| `sentinel_active_incidents` | **Gauge** | Real-time count of active security incidents under investigation |
| `sentinel_active_agents` | **Gauge** | Count of online AI Sentinel neural models in the cluster |
| `sentinel_security_score` | **Gauge** | Enterprise posture compliance score (0-100) |
| `sentinel_http_request_duration_seconds` | **Histogram** | Request latency distribution in configurable observation buckets |

---

## 🔑 Demo Access Credentials

The database automatically initializes and seeds enterprise operator accounts:

| Role | Email | Password |
|---|---|---|
| **SecOps Director** | `alex.rivera@sentinel.ai` | `password123` |
| **Field Operator** | `operator@sentinel.ai` | `sentinel-secure-pass` |

*(You can also use the **One-Click Quick Demo Login** button directly from the login terminal.)*

---

## 🧪 Automated Testing & Continuous Integration

Run the integration test suite verifying health checks, Prometheus `/metrics`, JWT authentication, and protected endpoints:

```powershell
cd backend
npm test
```

Pipeline automation is managed via:
- **GitHub Actions**: `.github/workflows/ci.yml`
- **Jenkins CI/CD**: `Jenkinsfile`

---

## 📄 License
This project is licensed under the MIT License.
