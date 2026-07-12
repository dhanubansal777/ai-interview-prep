<div align="center">

# 🎯 InterviewAce

### AI-powered mock interview practice — tailored questions, live scoring, and a resume that keeps up with you

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Gemini API](https://img.shields.io/badge/Google-Gemini%20API-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://render.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

</div>

---

## What is this?

InterviewAce is a full-stack mock interview platform. Upload a resume, pick a target role, and an AI interviewer asks you role-specific questions one at a time — typed or spoken out loud. Every answer is scored the moment you submit it, not just at the end, and a dashboard tracks how your performance trends across sessions. A second AI feature rewrites your resume for a specific job posting and hands you back a ready-to-send PDF.

It's a from-scratch build: custom JWT authentication (no third-party auth provider), a self-written retry layer around the Gemini API, and a headless-Chrome pipeline for turning AI-generated HTML into a real PDF.

<table>
<tr>
<td width="50%">

**Practice, not just prep**
Answer real questions live, get scored on content / structure / technical depth, and see a model answer immediately after.

</td>
<td width="50%">

**Speak or type**
Full voice mode — hear the question read aloud, answer out loud, or just type. Your call, per question.

</td>
</tr>
<tr>
<td>

**Track improvement over time**
A trend line, a skill-dimension radar, and a by-role breakdown — not just a single score.

</td>
<td>

**A resume that adapts**
Paste a job description, get back an ATS-friendly, tailored resume as a downloadable PDF — generated fresh each time.

</td>
</tr>
</table>

---

## See it in action

<table>
<tr>
<td align="center" width="50%">
<img src="docs/screenshots/landing.png" alt="Landing page" width="100%">
<sub>Landing page</sub>
</td>
<td align="center" width="50%">
<img src="docs/screenshots/dashboard.png" alt="Dashboard" width="100%">
<sub>Dashboard — resumes, tailored-resume export, start an interview</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="docs/screenshots/interview-question.png" alt="Live interview question" width="100%">
<sub>Live interview — question, hints, voice input</sub>
</td>
<td align="center">
<img src="docs/screenshots/analytics.png" alt="Analytics dashboard" width="100%">
<sub>Analytics — score trend, skill radar, by-role breakdown</sub>
</td>
</tr>
</table>

<p align="center">
<img src="docs/screenshots/tailored-resume.png" alt="Tailored resume PDF generation" width="65%">
<br><sub>Generate a job-tailored resume PDF straight from the dashboard</sub>
</p>

---

## How a mock interview actually works

```mermaid
sequenceDiagram
    actor U as User
    participant C as Client (React)
    participant S as Server (Express)
    participant G as Gemini API
    participant DB as MongoDB

    U->>C: Pick role + difficulty, click Start
    C->>S: POST /sessions/start { resumeId, role, difficulty }
    S->>DB: Load resume text (owned by this user)
    S->>G: Generate 5 tailored questions from resume + role
    G-->>S: Questions + expected topics (JSON)
    S->>DB: Create Session (status: in-progress)
    S-->>C: Session with question 1

    loop Each question
        U->>C: Type or speak an answer
        C->>S: POST /sessions/:id/answer
        S->>G: Evaluate answer vs. expected topics
        G-->>S: Scores + feedback + ideal answer (JSON)
        S->>DB: Save scores on that question
        S-->>C: Immediate per-answer feedback
    end

    S->>DB: All answered → status: completed, compute overallScore
    C->>U: Results screen with full breakdown
```

## How the auth actually works

No third-party auth provider — bcrypt, JWTs, and an explicit revocation list, wired by hand.

```mermaid
flowchart LR
    A[Register / Login] -->|bcrypt-hash or verify password| B[Sign JWT]
    B -->|httpOnly, Secure, SameSite cookie| C[Browser stores cookie]
    C -->|sent automatically on every request| D{requireAuth middleware}
    D -->|checked against| E[(BlacklistToken collection)]
    E -->|not blacklisted + valid signature| F[req.userId set → route runs]
    D -->|missing / invalid / blacklisted| G[401 Unauthorized]
    H[Logout] -->|token written to| E
```

> **Why a blacklist?** JWTs are stateless — once issued, they're valid until they expire, with no built-in way to revoke one early. Logging out writes that token into a `BlacklistToken` collection, and every request checks it there before trusting an otherwise-valid signature.

## How the AI resume export works

```mermaid
flowchart TD
    A[Uploaded resume PDF] -->|pdfreader| B[Extracted plain text]
    J[Optional job description] --> D
    B --> D[Prompt built from resume + job description]
    D -->|Zod schema enforces response shape| E[Gemini API]
    E -->|Structured JSON: { html }| F[Generated resume HTML]
    F -->|Puppeteer headless Chrome| G[Rendered PDF buffer]
    G --> H[Streamed to browser as a download]
```

---

## Architecture

```mermaid
flowchart TB
    subgraph Client["Client — React 19 + Vite"]
        direction LR
        Pages["Pages<br/>Landing · Dashboard · Interview · Analytics"]
        Hooks["Hooks<br/>useAuth · useVoice"]
        Ctx["AuthContext"]
    end

    subgraph Server["Server — Node.js + Express 5"]
        direction LR
        Routes["Routes<br/>auth · resumes · sessions"]
        Mid["requireAuth middleware"]
        Svc["Services<br/>gemini.service · pdf.service"]
    end

    Client <-->|"axios, withCredentials cookie"| Server
    Server <-->|Mongoose| Mongo[(MongoDB Atlas)]
    Svc <--> Gemini[Google Gemini API]
    Svc <--> Puppeteer[Headless Chrome<br/>via Puppeteer]

    Client -.deployed on.-> Vercel[Vercel]
    Server -.deployed on.-> Render["Render<br/>(Docker, for Puppeteer's Chrome deps)"]
```

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 19, Vite, react-router-dom v7 | Fast dev loop, modern routing |
| **Styling** | Tailwind CSS | Utility-first, no custom CSS build |
| **Charts** | Recharts | Line / radar / bar charts for analytics |
| **Voice** | Web Speech API | Native browser STT/TTS, no extra service |
| **Backend** | Node.js, Express 5 | Minimal, well-understood REST layer |
| **Database** | MongoDB + Mongoose | Nested session/question documents fit the document model |
| **Auth** | bcrypt, jsonwebtoken, cookie-parser | Full control over session security, no vendor lock-in |
| **AI** | Google Gemini API (`@google/generative-ai`) | Structured JSON output via schema-constrained prompts |
| **Schema validation** | Zod + zod-to-json-schema | Guarantees the AI's output shape before it hits the client |
| **PDF generation** | Puppeteer | Renders AI-authored HTML into a real, downloadable PDF |
| **Hosting** | Vercel (client), Render (server, Docker) | Static hosting + a container that can run headless Chrome |

---

## Project structure

```
ai-interview-prep/
├── client/                      React + Vite frontend
│   └── src/
│       ├── context/             AuthContext — shared user/loading state
│       ├── hooks/                useAuth (session logic) · useVoice (Web Speech API)
│       ├── components/          Protected (route guard) · ResumeUpload
│       ├── pages/                Landing · SignIn/Up · Dashboard · Interview · Analytics
│       └── lib/api.js            Shared axios instance (withCredentials)
│
└── server/                      Express backend
    └── src/
        ├── models/               User · BlacklistToken · Resume · Session
        ├── middleware/           requireAuth — verifies JWT cookie + blacklist
        ├── controllers/          auth.controller.js
        ├── routes/               auth · resume (+ resume-pdf) · session (+ stats)
        ├── services/             gemini.service.js (retry/backoff) · pdf.service.js (Puppeteer)
        ├── prompts/               questionGen · answerEval · resumePdf
        └── Dockerfile             ghcr.io/puppeteer/puppeteer base image
```

---

## Getting started

### Prerequisites
- Node.js 20+
- A MongoDB connection string (local or [Atlas](https://www.mongodb.com/atlas))
- A [Gemini API key](https://ai.google.dev)

### 1. Clone and install

```bash
git clone https://github.com/dhanubansal777/ai-interview-prep.git
cd ai-interview-prep

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

**`server/.env`**

| Variable | Description |
|---|---|
| `PORT` | Port the API listens on (default `5000`) |
| `NODE_ENV` | `production` enables `Secure`/`SameSite=None` cookies for cross-site deploys |
| `MONGODB_URI` | MongoDB connection string |
| `CLIENT_URL` | Deployed frontend origin, for CORS |
| `JWT_SECRET` | Long random string used to sign auth tokens |
| `GEMINI_API_KEY` | Your Gemini API key |

**`client/.env`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL, **including `/api`** |

### 3. Run it

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Visit `http://localhost:5173`.

---

## API reference

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | – | Create an account |
| `POST` | `/api/auth/login` | – | Sign in |
| `GET` | `/api/auth/logout` | ✅ | Sign out, blacklist the current token |
| `GET` | `/api/auth/get-me` | ✅ | Restore session on page reload |
| `POST` | `/api/resumes/upload` | ✅ | Upload a resume PDF, extract its text |
| `GET` | `/api/resumes` | ✅ | List the current user's resumes |
| `POST` | `/api/resumes/:resumeId/resume-pdf` | ✅ | Generate a job-tailored resume PDF |
| `POST` | `/api/sessions/start` | ✅ | Start a mock interview, generate questions |
| `GET` | `/api/sessions` | ✅ | List the current user's sessions |
| `GET` | `/api/sessions/stats` | ✅ | Aggregated analytics across completed sessions |
| `GET` | `/api/sessions/:id` | ✅ | Fetch one session in full |
| `POST` | `/api/sessions/:id/answer` | ✅ | Submit and score one answer |

---

## Deployment notes

- **Frontend** deploys to Vercel straight from this repo (`client/` as the project root).
- **Backend** deploys to Render as a **Docker** service — not the default Node runtime — because Puppeteer needs system-level Chrome libraries the default runtime doesn't include. The `Dockerfile` starts from `ghcr.io/puppeteer/puppeteer`, which ships Chrome pre-installed.
- Cross-site auth (frontend and backend on different domains) requires cookies set with `SameSite=None; Secure`, which only applies when `NODE_ENV=production` — set that explicitly in your host's environment variables.
- The free Gemini tier caps out at **20 requests/day** — fine for development, but budget accordingly for real usage.

---

## License

MIT
