# LearniVerse-AI: Production Render Deployment Guide

Complete step-by-step guide for deploying and operating **LearniVerse-AI: Adaptive Agentic 3D Virtual Classroom** on **Render**.

---

## 1. Architecture Topology (Decoupled 3-Tier Model)

Conforming to `RENDER.md §5` and `FEYNMAN.md §7, §8`, LearniVerse-AI is deployed as three decoupled, independently scalable cloud services managed through a single Infrastructure-as-Code Blueprint (`render.yaml`):

```text
                                🌐 USER BROWSER
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    ▼ (HTTPS)                             ▼ (HTTPS)
      ┌───────────────────────────┐         ┌───────────────────────────┐
      │    learniverse-frontend   │         │    learniverse-backend    │
      │    (Render Static Site)   │────────►│    (Python Web Service)   │
      │    React 19 + Three.js    │  /api/* │    FastAPI + LangGraph    │
      └───────────────────────────┘         └─────────────┬─────────────┘
                                                          │
                                                    Internal Webhook
                                                          │
                                                          ▼
                                            ┌───────────────────────────┐
                                            │      learniverse-n8n      │
                                            │    (Docker Web Service)   │
                                            │  Feynman Workflow Engine  │
                                            └───────────────────────────┘
```

| Service | Type | Plan | Region | Build Command / Dockerfile | Start Command / Healthcheck |
|---|---|---|---|---|---|
| **`learniverse-frontend`** | Static Site | Free | Singapore (Global CDN) | `cd frontend && npm install && npm run build` | Route: `/* -> /index.html` |
| **`learniverse-backend`** | Web Service (Python) | Free | Singapore | `pip install -r backend/requirements.txt` | `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`<br>`healthCheckPath: /api/feynman/health` |
| **`learniverse-n8n`** | Web Service (Docker) | Free | Singapore | `n8n/Dockerfile` (context: `n8n`) | `healthCheckPath: /healthz`<br>Entrypoint: `/docker-entrypoint-feynman.sh` |

> [!TIP]
> **Regional Placement (`region: singapore`):** Conforming to `RENDER2.md`, compute services are colocated in **Singapore** to provide low round-trip latency (~40ms–65ms) for India and APAC users, while keeping private inter-service communication fast on Render's regional mesh.

---

## 2. Real-Time Agent Logs on Render 🔍

The backend is configured with `PYTHONUNBUFFERED=1` and high-visibility ASCII banners so judges and evaluators can monitor agentic decisions in real time.

To view live agent logs:
1. Open your **Render Dashboard**.
2. Click on **`learniverse-backend`**.
3. Select the **Logs** tab.

### What you will see in the live stream:

#### A. 5-Agent LangGraph Deliberation Cycle
When a student triggers diagnostic assessment, answers a question, or switches profiles:
```text
================================================================================
🤖 [LANGGRAPH 5-AGENT DELIBERATION] Student: learner_b | Mode: deterministic_fallback
--------------------------------------------------------------------------------
1. 🔍 [Context Agent]    Target: recursion | Weak: ['stack', 'recursion'] | Blocking Prereq: stack
2. 🩺 [Diagnostic Agent] Learner Status: remediation_required | Gap: Stack mastery 0.38 < 0.70
3. 🎯 [Planner Agent]    Action: REMEDIATE | Concept: stack | Difficulty: easy
      Reasoning: Pedagogical Planner identifies Stack mastery (38%) is below 70% threshold...
4. 🛡️  [Validator Agent]  Deterministic Policy Check: ✓ APPROVED
      Policy Rule: Certified: Hard prerequisite gate enforced. Stack remediation approved.
5. 🎮 [Game Agent]       Station: stack_lab | Assigned Mission: Operation Stack Fortress
--------------------------------------------------------------------------------
⭐ DECISION OUTCOME: REMEDIATE on [STACK] (EASY) ➔ Redirect to stack_lab
================================================================================
```

#### B. Multimodal Feynman Agent Diagnosis & Repair
When a student struggles or asks for an explanation:
```text
================================================================================
🧠 [FEYNMAN MULTIMODAL AGENT: DIAGNOSIS & REPAIR] Session: FS_8E4A9C12
--------------------------------------------------------------------------------
• Student: learner_b | Concept: STACK
• Student Input: "I think the first plate we add comes out first"
• Detected Gap: Confuses LIFO ordering with FIFO queue processing
• Selected Pedagogical Modality: 3D (Interactive Cylindrical Push/Pop Simulation)
• Learning Objective: Discover LIFO behavior via tactile apparatus manipulation
================================================================================
```

#### C. Feynman Verification & BKT Posterior Synchronization
When a student answers the Feynman check question:
```text
================================================================================
✨ [FEYNMAN AGENT: VERIFICATION & BKT SYNCHRONIZATION] Session: FS_8E4A9C12
--------------------------------------------------------------------------------
• Student: learner_b | Concept: STACK
• Student Response Evaluation: ✓ CORRECT (Misconception Repaired)
• BKT Mastery Shift: 0.38 ➔ 0.61 (+0.23 Confidence Gain)
• Triggering Re-deliberation: Pedagogical workflow adapting classroom environment
================================================================================
```

#### D. Prerequisite Barrier Dissolve
When mastery crosses the 70% threshold:
```text
================================================================================
📊 [BKT INTERACTION] Student: learner_b | Concept: stack | Result: CORRECT ✓
• BKT: 0.61 ➔ 0.74 (+0.13)
🔓 [GATE UNLOCKED] STACK mastery crossed 70% threshold! Recursion Wing unlocked!
================================================================================
```

---

## 3. 1-Click Deployment via Render Blueprint

### Prerequisites:
* A [Render account](https://render.com) (free).
* Your forked / cloned GitHub repository.

### Deployment Steps:

1. **Log in to Render** and navigate to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top-right corner and select **Blueprint**.
3. Connect your GitHub repository (`Abhiman12406/LearniVerse-AI` or your fork).
4. Render will automatically detect `render.yaml` in the project root.
5. In the **Blueprint Name** field, provide a name (e.g. `learniverse-ai`).
6. Click **Apply**.
7. Render will create all 3 services concurrently:
   - `learniverse-frontend` (Static Site)
   - `learniverse-backend` (Python Web Service)
   - `learniverse-n8n` (Docker Web Service)

---

## 4. Environment Variables Reference

All external cloud services have **built-in zero-config fallbacks**, allowing 100% functionality out-of-the-box even without external API keys:

| Environment Variable | Service | Default / Fallback | Purpose |
|---|---|---|---|
| `PYTHONUNBUFFERED` | `backend` | `1` | Forces unbuffered stdout streaming for real-time Render agent logs. |
| `PYTHONPATH` | `backend` | `.` | Ensures Python imports resolve cleanly from repository root. |
| `VITE_API_URL` | `frontend` | Auto-wired by Render | Points static frontend to live FastAPI backend URL. |
| `FASTAPI_BACKEND_URL` | `n8n` | Auto-wired by Render | Points n8n workflows to FastAPI backend API endpoints. |
| `GEMINI_API_KEY` | `backend`, `n8n` | Heuristic fallback | *(Optional)* Google Gemini 2.5 Flash for live multimodal reasoning. |
| `GROQ_API_KEY` | `backend`, `n8n` | Heuristic fallback | *(Optional)* Groq Whisper-large-v3 speech-to-text transcription. |
| `NEO4J_URI` | `backend` | NetworkX in-memory DAG | *(Optional)* Neo4j Aura cloud graph instance for live Cypher queries. |
| `LANGCACHE_API_KEY` | `backend` | In-memory semantic cache | *(Optional)* Redis LangCache semantic prompt cache. |
| `N8N_WEBHOOK_URL` | `backend` | Internal agent engine | *(Optional)* URL of the live n8n webhook for visual orchestration. |

To add real API keys anytime after deployment:
Go to **`learniverse-backend`** -> **Environment** -> **Add Environment Variable**, enter your key, and click **Save Changes**.

---

## 5. Step-by-Step Live Verification Flow

Once deployed, follow this checklist to verify full system operation:

### Step 1: Healthcheck Endpoints
* Backend Health: `https://learniverse-backend.onrender.com/health` ➔ `{"status": "healthy"}`
* Feynman Health: `https://learniverse-backend.onrender.com/api/feynman/health` ➔ `{"status": "healthy", "service": "feynman"}`
* n8n Health: `https://learniverse-n8n.onrender.com/healthz` ➔ HTTP 200

### Step 2: 3D Classroom Initial State
* Navigate to your `https://learniverse-frontend.onrender.com` URL.
* Confirm the 3D Atrium loads with glowing architectural materials and student avatar.
* Notice Alex Mercer (Learner B) is active:
  - Stack mastery is **38%**.
  - Recursion Wing is **Sealed by a Prerequisite Energy Barrier**.

### Step 3: Diagnostic Assessment & Teleportation
* Click **AI Diagnostic** in the top HUD.
* Complete or fast-forward the diagnostic assessment.
* Confirm the 5-Agent LangGraph Deliberation executes and teleports the avatar to the recommended station.
* Check your Render backend logs to see the deliberation banner printed live!

### Step 4: Feynman Multimodal Explanation
* Walk to the AI Mentor or click **Demonstrate Feynman Agent**.
* Submit an explanation (e.g. *"Stack removes the first item inserted"*).
* Observe Feynman detect the LIFO misconception and trigger the 3D kinetic apparatus animation.
* Answer the verification question: observe BKT mastery elevate from 38% to 61%!

### Step 5: Hero Barrier Dissolve
* Complete consecutive challenges in the Stack Lab or use the simulation control to cross 70%.
* Watch the golden shockwave trigger and the Recursion Door barrier dissolve in real-time 3D!

---

## 6. Free Tier Optimization & Sleep Behavior

Render Free tier web services spin down after **15 minutes of inactivity**.
* When visiting after a period of dormancy, the initial request takes ~40-50 seconds while Render boots the container.
* Once awake, all interactions execute in under 100ms.
* **Pro-tip for Hackathon Presentations:** Open the frontend and backend 2 minutes before presenting to ensure all services are warm and responsive.
* If 24/7 instant response is desired without spin-down, upgrade `learniverse-backend` or `learniverse-n8n` to **Starter Plan ($7/month)** under the service settings tab.
