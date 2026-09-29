# FixMemory AI

> **Persistent Incident Resolution Agent Powered by Hindsight Biomimetic Memory**

FixMemory AI is an intelligent incident triage, root cause analysis, and remediation system designed for Site Reliability Engineering (SRE) and DevOps teams.

Instead of treating past production outages as ephemeral Slack messages or forgotten postmortem documents, FixMemory AI builds a continuous, evolving organizational brain. It leverages **Hindsight** for persistent biomimetic memory and **MongoDB Atlas** for operational telemetry—ensuring that engineering teams never repeat the same outage or dangerous anti-pattern twice.

---

## 1. Problem Statement

Modern cloud-native systems face compounding operational friction during production disruptions:

1. **Tribal Knowledge Evaporation**: When an on-call engineer fixes a complex outage at 3 AM, the root cause, subtle diagnostic steps, and ineffective actions are rarely documented in an easily retrievable format.
2. **Incident Déjà Vu**: Teams repeatedly fight identical failure modes months later, wasting critical MTTR (Mean Time to Resolution) hours repeating failed remediation attempts that a teammate previously discovered were dead ends.
3. **Flaws of Traditional Vector RAG**: Standard RAG performs flat cosine similarity across unstructured documents. It lacks understanding of temporal incident sequence, operational causality, and negative constraints (*what NOT to do*).
4. **War-Room Stress & Blind Action**: Under high-severity pressure, responders often guess remedies (e.g., rebooting a database cluster or executing `FLUSHALL`), compounding outages into catastrophic cascading failures.

---

## 2. The Solution: FixMemory AI

FixMemory AI bridges real-time incident triage with persistent organizational memory:

- **Hindsight Recall**: When a new incident is triggered, FixMemory automatically recalls analogous historical incident trajectories, identifying validated root causes and proven solutions in seconds.
- **Negative Knowledge Guard**: Explicitly preserves past *failed approaches*. If a previous responder discovered that increasing connection pools caused an OOM crash, FixMemory immediately warns the on-call engineer: *“DO NOT repeat this action.”*
- **Hindsight Retain**: When an incident is resolved, its root cause, resolution summary, and recorded failed attempts are permanently retained into Hindsight bank `fixmemory-main`.
- **Human-in-the-Loop SOP Execution**: Connects matched Standard Operating Procedure (SOP) runbooks with clear command safety ratings (`SAFE_READONLY`, `CAUTION_MUTATING`, `DANGEROUS_DESTRUCTIVE`). Dangerous commands are **never automatically executed**.
- **Ask FixMemory**: Natural language interface allowing responders to query historical postmortems and past failed approaches.
- **Closed-Loop SRE Feedback**: Responders indicate whether a recommendation *Worked*, *Partially Worked*, or *Failed*, automatically training the memory engine with new negative knowledge if a solution failed.

---

## 3. Architecture & Core Distinctions

```
                       ┌────────────────────────────────────────────────────────┐
                       │                     FixMemory AI                       │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                ┌──────────────────────────────────┴──────────────────────────────────┐
                ▼                                                                     ▼
   ┌─────────────────────────┐                                           ┌─────────────────────────┐
   │      MongoDB Atlas      │                                           │    Hindsight Engine     │
   │  (Application Database) │                                           │   (Biomimetic Memory)   │
   ├─────────────────────────┤                                           ├─────────────────────────┤
   │ • Incidents & Timelines │                                           │ • Hindsight RECALL      │
   │ • Microservices Catalog │                                           │   (Past experiences,    │
   │ • SRE On-Call Responders│                                           │    RCA & anti-patterns) │
   │ • SOP Runbooks & Steps  │                                           │ • Hindsight RETAIN      │
   │ • MemoryLog Audit Trail │                                           │   (Store new incident   │
   │ • System Settings       │                                           │    lessons permanently) │
   └─────────────────────────┘                                           └─────────────────────────┘
```

### Key Architectural Concepts:
- **Hindsight Recall**: Semantically retrieves previous incident experiences, past root causes, and documented anti-patterns from memory bank `fixmemory-main`.
- **Hindsight Retain**: Encodes and stores newly resolved incident postmortems, verified fixes, and failed approaches into Hindsight.
- **MongoDB Atlas**: Serves as the high-availability operational application database storing live incident lifecycles, service health states, and audit trails.

---

## 4. Technology Stack

- **Frontend**:
  - React 18, Vite 6, Tailwind CSS 3
  - Lucide React (Icons), React Router v6, Axios
- **Backend**:
  - Node.js (ES Modules), Express 4.21, Mongoose 9.10
  - CORS, Morgan HTTP logger, Dotenv
- **Database**:
  - MongoDB Atlas Cloud Database
- **Memory Engine**:
  - Hindsight (`vectorize-io/hindsight`) on port `8888`
  - Memory Bank: `fixmemory-main`
  - Reasoning Model: `gemini-3.5-flash-lite`

---

## 5. Project Directory Structure

```
FixMemory-AI/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Layout, TopNavbar, Sidebar
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx       # Real-time metrics & FixMemory learning telemetry
│   │   │   ├── IncidentsPage.jsx       # Incident catalog, drawer & Resolution Modal
│   │   │   ├── CreateIncidentPage.jsx  # Incident creation with fast test presets
│   │   │   ├── AgentPage.jsx           # AI Incident War-Room & Ask FixMemory
│   │   │   ├── MemoryPage.jsx          # Hindsight Memory Explorer & Audit Logs
│   │   │   ├── BeforeAfterPage.jsx     # Side-by-side interactive hackathon demo
│   │   │   ├── RunbooksPage.jsx        # SOP library with command danger guards
│   │   │   ├── ServicesPage.jsx        # Microservice catalog & health status
│   │   │   ├── EngineersPage.jsx       # SRE on-call roster
│   │   │   ├── AnalyticsPage.jsx       # Real MongoDB aggregations & MTTR analytics
│   │   │   └── SettingsPage.jsx        # Safe system connectivity verification
│   │   ├── services/
│   │   │   └── api.js                  # Centralized Axios API client
│   │   ├── App.jsx                     # Route definitions
│   │   └── main.jsx                    # React entrypoint
│   └── package.json
│
├── server/                     # Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                   # MongoDB Atlas connection & error verification
│   │   ├── controllers/
│   │   │   ├── incidentController.js   # Incident CRUD, status patch, timeline, & Hindsight Retain
│   │   │   ├── agentController.js      # Hindsight Recall, AI recommendations, & Ask API
│   │   │   ├── memoryController.js     # Memory explorer & audit logs
│   │   │   ├── analyticsController.js  # Dynamic MongoDB metric aggregations
│   │   │   ├── runbookController.js    # SOP management & keyword matching
│   │   │   ├── serviceController.js    # Microservices inventory
│   │   │   ├── engineerController.js   # Responders & on-call toggles
│   │   │   └── settingController.js    # System settings & health status
│   │   ├── models/
│   │   │   ├── Incident.js             # Incidents, timelines, failedApproaches, hindsightContext
│   │   │   ├── Service.js              # Tiered microservices
│   │   │   ├── Engineer.js             # On-call responders
│   │   │   ├── Runbook.js              # SOP action steps & dangerLevel
│   │   │   ├── MemoryLog.js            # Audit trail for RECALL and RETAIN operations
│   │   │   └── Setting.js              # Configuration key-value store
│   │   ├── routes/                     # Express REST endpoints
│   │   ├── seeds/
│   │   │   └── seedData.js             # Historical incidents with real RCA & failed approaches
│   │   ├── services/
│   │   │   └── hindsightService.js     # Hindsight API integration (Recall & Retain)
│   │   ├── app.js                      # Express middleware & route mounting
│   │   └── index.js                    # Server startup on port 5000
│   └── package.json
│
├── docker/
│   └── docker-compose.yml              # Local Hindsight container configuration
└── README.md
```

---

## 6. Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster URI
- Hindsight API running locally on port 8888

### 6.1 Backend Setup
1. Navigate to `server/`:
   ```bash
   cd server
   npm install
   ```
2. Verify `server/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/fixmemory?retryWrites=true&w=majority
   HINDSIGHT_BASE_URL=http://localhost:8888
   HINDSIGHT_API_KEY=dev-key
   HINDSIGHT_DEFAULT_BANK=fixmemory-main
   ```
3. (Optional) Seed the database with realistic historical incidents:
   ```bash
   npm run seed
   ```
4. Start the backend:
   ```bash
   npm run dev    # Starts on http://localhost:5000
   ```

### 6.2 Frontend Setup
1. Navigate to `client/`:
   ```bash
   cd client
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev    # Starts on http://localhost:5173
   ```
3. Open `http://localhost:5173` in your browser.

---

## 7. Interactive Hackathon Demo Flow (3–5 Minutes)

1. **STEP 1 — Dashboard Overview**:
   - Open the **Dashboard**. Observe real-time incident KPIs, MTTR metrics, and the **FixMemory Learning** card showing active memory retention telemetry.
2. **STEP 2 — Inspect a Historical Experience**:
   - Navigate to **Incidents**. Open `INC-1003` (PostgreSQL connection pool exhaustion).
   - Show its documented Root Cause, successful fix, and **Recorded Failed Approach** (*"Increasing max_connections to 500 caused database node OOMKilled"*).
3. **STEP 3 — Simulate a New Incident**:
   - Go to **Create Incident**. Click the **Postgres Pool** quick preset.
   - Click **Trigger Incident**. A new incident (`INC-1006`) is created with status `TRIGGERED`.
4. **STEP 4 — Enter the AI War-Room**:
   - Click **AI Agent** or **Analyze with FixMemory**.
   - Watch FixMemory query Hindsight bank `fixmemory-main`.
5. **STEP 5 — Memory-Grounded Recommendation**:
   - FixMemory surfaces:
     - **Memory Used**: `✓ Memory Used (1+ memories recalled)`.
     - **Recommended Action**: Points directly to transaction pool leak remediation.
     - **Negative Knowledge Guard**: Explicitly warns the engineer: *“DO NOT increase max_connections (led to database OOM in INC-1003).”*
     - **Matched Runbook**: Displays safe read-only SQL inspection commands with danger level warnings.
6. **STEP 6 — Ask FixMemory**:
   - Switch to the **Ask FixMemory** tab. Ask: *"What approaches failed before on database connection issues?"*
   - See FixMemory retrieve exact postmortem memories citing past incidents.
7. **STEP 7 — Resolve & Retain**:
   - In the incident drawer, click **Resolve Incident**.
   - Input Root Cause and Solution. Click **Resolve & Retain in FixMemory**.
   - Status updates to `RESOLVED`, MTTR is computed, and Hindsight stores the new experience into bank `fixmemory-main` with notification: *"Experience stored in FixMemory memory."*
8. **STEP 8 — Closed-Loop Verification**:
   - Open **Memory Explorer** (`/memory`). Observe the newly retained memory card and audit log event.
   - Open **Before vs After Memory** (`/before-after-memory`) for an impactful side-by-side demonstration of MTTR reduction from 60+ min to under 8 min.

---

## 8. REST API Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend server health check |
| `GET` | `/api/incidents` | List incidents with search, severity, and status filters |
| `POST` | `/api/incidents` | Create a new production incident |
| `GET` | `/api/incidents/:id` | Get incident details, timeline, and Hindsight context |
| `PATCH` | `/api/incidents/:id/status` | Update incident status (`TRIGGERED`, `INVESTIGATING`, `MITIGATED`, `RESOLVED`) |
| `POST` | `/api/incidents/:id/resolve` | Resolve incident and trigger **Hindsight Retain** |
| `POST` | `/api/incidents/analyze/:id` | Trigger **Hindsight Recall** and generate AI recommendation |
| `POST` | `/api/incidents/ask` | Natural language memory query via Hindsight Recall |
| `POST` | `/api/incidents/:id/feedback` | SRE feedback loop (retains negative knowledge if failed) |
| `GET` | `/api/memory/overview` | Stored Hindsight memories and MemoryLog audit records |
| `GET` | `/api/runbooks` | SOP runbooks catalog |
| `GET` | `/api/runbooks/match` | Runbook keyword matcher based on error message |
| `GET` | `/api/analytics/overview` | Dynamic MongoDB aggregation metrics & MTTR |
| `GET` | `/api/settings/health` | Connectivity check for MongoDB, Hindsight, and AI models |

---

## 9. Resilience & Error Handling

- **Hindsight Offline Resilience**: If the local Hindsight service is temporarily restarting or unreachable, incident creation, status updates, and incident resolutions **still succeed in MongoDB Atlas**.
- When Hindsight is offline:
  - Incident resolution succeeds with `retentionStatus: 'FAILED'`.
  - Recalls fall back to local database heuristics and runbook matching.
  - The UI informs the user: *"Incident resolved, but memory storage is temporarily unavailable."*
  - No database rollback occurs, guaranteeing operational stability.
- **Zero-Trust Secret Masking**: All API keys, connection strings, and passwords are fully masked in API responses and UI displays.

---

## 10. License

FixMemory AI is open-source under the MIT License.
