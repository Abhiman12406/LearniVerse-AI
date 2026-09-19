# Feynman Agent: n8n Docker & Render Deployment Guide

This guide details the packaging, containerization, and deployment of the **Feynman Agent n8n Orchestrator** as a Docker Web Service on **Render**, conforming strictly to [RENDER.md](file:///c:/Users/Naren/Desktop/DevHack%20V1/RENDER.md) §5, §14 and [FEYNMAN.md](file:///c:/Users/Naren/Desktop/DevHack%20V1/FEYNMAN.md) §7, §8, §23.

---

## 1. Architecture Overview

```text
               Student (React Three Fiber Classroom)
                                │
                 🧠 "Ask Feynman" (Voice or Text)
                                │
                                ▼
                         FastAPI Backend
                                │
                                ▼ (POST /webhook/feynman-request)
                  ┌───────────────────────────┐
                  │    Render n8n Service     │
                  │  (Dockerized Orchestrator)│
                  └─────────────┬─────────────┘
                                │
                 1. Fetch Student Context (FastAPI)
                 2. Normalize Multimodal Evidence
                 3. Gemini 2.5 Analyzer Agent
                 4. Modality Switch (Text/Visual/Audio/3D Lab)
                 5. Assemble Multimodal Payload
                                │
                                ▼
                      Return to Student UI
                                │
                       Verification Answer
                                │
                                ▼ (POST /webhook/feynman-verify)
                  ┌───────────────────────────┐
                  │  n8n Verification Webhook │
                  └─────────────┬─────────────┘
                                │
                         Learning Evidence
                                │
                                ▼
                      FastAPI BKT Update
                                │
                    Barrier Dissolve & World Delta
```

---

## 2. Render Docker Deployment

The n8n orchestrator is packaged as a lightweight, production-grade Docker container located at `n8n/Dockerfile`.

### Automated Container Boot Process
Render web services dynamically assign arbitrary port numbers via the `$PORT` environment variable (e.g. `10000`). The custom entrypoint script (`n8n/docker-entrypoint.sh`) guarantees:
1. **Dynamic Port Mapping**: Binds n8n to `${PORT:-5678}`.
2. **Auto-Import Daemon**: Probes the local health check endpoint (`/healthz`). Once n8n is live, it automatically imports `workflows/feynman-assistant.json` and runs `n8n update:workflow --all --active=true`.
3. **Zero-Config Webhook Activation**: Webhooks at `/webhook/feynman-request` and `/webhook/feynman-verify` become active immediately upon deployment with no manual GUI configuration required.

---

## 3. Deploying via Render Blueprint (`render.yaml`)

The repository includes a unified [render.yaml](file:///c:/Users/Naren/Desktop/DevHack%20V1/render.yaml) blueprint file for 1-click provisioning of the entire stack:

1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Select your connected repository (`LearniVerse-AI`).
4. Render detects `render.yaml` and provisions:
   - `learniverse-n8n`: Docker Web Service running the n8n orchestrator.
   - `learniverse-backend`: Python Web Service running FastAPI.
   - `learniverse-frontend`: Static Site serving the Vite + React Three Fiber 3D classroom.
5. Enter your `GEMINI_API_KEY` when prompted and click **Apply**.

---

## 4. Manual Web Service Creation on Render

If creating the n8n service manually in Render:
1. Click **New +** → **Web Service**.
2. Source: **Deploy an existing image or repository** → select your Git repo.
3. Configure the following fields:
   - **Name**: `learniverse-n8n`
   - **Environment**: `Docker`
   - **Region**: `Oregon`
   - **Branch**: `main`
   - **Dockerfile Path**: `n8n/Dockerfile`
   - **Docker Context**: `n8n`
   - **Health Check Path**: `/healthz`
4. Configure Environment Variables:

| Variable | Value | Purpose |
| :--- | :--- | :--- |
| `FASTAPI_BACKEND_URL` | `https://learniverse-backend-a4go.onrender.com` | FastAPI backend URL for context and verification |
| `GEMINI_API_KEY` | `AIzaSy...` | Gemini 2.5 API Key for the diagnostic agent |
| `GROQ_API_KEY` | `gsk_...` | Groq API Key for Whisper speech-to-text voice input (`whisper-large-v3`) |
| `WEBHOOK_URL` | `https://learniverse-n8n.onrender.com/` | Public URL of this n8n instance for webhooks |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` | `false` | Enables workflow expressions to access environment variables |
| `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS` | `true` | Security hardening |
| `GENERIC_TIMEZONE` | `UTC` | Standard timezone |

---

## 5. Connecting FastAPI to Live Render n8n

Add the webhook URL to your FastAPI service environment variables (on Render or in `backend/.env` locally):

```env
N8N_WEBHOOK_URL=https://learniverse-n8n.onrender.com/webhook/feynman-request
```

### Fallback Mode (Resilient Hackathon Guarantee)
If the n8n container is cold-starting or offline, `feynman_service.py` automatically falls back to its internal Python cognitive engine:
- Full support for text, voice simulation, and 3D concept analogies
- Continuous Bayesian Knowledge Tracing updates
- Zero downtime or connection drops during live judging demonstrations
