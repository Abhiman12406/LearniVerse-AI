# Feynman Agent n8n Orchestrator (Render Docker Service)

This directory contains the production-ready Docker packaging and workflow orchestration definitions for the **Feynman Multimodal Learning Agent**, designed for deployment on **Render** as a Docker Web Service per [RENDER.md](file:///c:/Users/Naren/Desktop/DevHack%20V1/RENDER.md) and [FEYNMAN.md](file:///c:/Users/Naren/Desktop/DevHack%20V1/FEYNMAN.md).

---

## 1. System Architecture

```text
       React Three Fiber 3D Classroom
                     │
         🧠 Feynman "Ask & Explain"
                     │
                     ▼
              FastAPI Backend
                     │
                     ▼ (POST /webhook/feynman-request)
       ┌─────────────────────────────┐
       │   Render n8n Web Service    │
       │   (Dockerized Orchestrator) │
       └─────────────┬───────────────┘
                     │
         1. Fetch Context from FastAPI (/api/feynman/learning-context)
         2. Normalize Multimodal Student Input (Text/Voice/Action)
         3. Gemini 2.5 Flash Multimodal Agent Diagnostic
         4. Modality Router (Text / Audio / Visual / 3D Lab Metaphor)
         5. Assemble Adaptive Response Payload
                     │
                     ▼
          Return to 3D Classroom UI
                     │
             Student Verifies
                     │
                     ▼ (POST /webhook/feynman-verify)
       ┌─────────────────────────────┐
       │  n8n Verification Webhook   │
       └─────────────┬───────────────┘
                     │
         POST /api/feynman/verify-understanding
                     │
                     ▼
             FastAPI BKT Update (Mastery Progression)
                     │
         3D Barrier Dissolve & Zone Unlock
```

---

## 2. Directory Contents

- `Dockerfile`: Production multi-stage Docker build extending `n8nio/n8n:latest`, configured with custom dynamic port binding and auto-import daemon.
- `docker-entrypoint.sh`: Startup script that dynamically maps Render's `$PORT` environment variable to `N8N_PORT`, waits for the server health check (`/healthz`), and automatically imports and activates all workflows on container boot.
- `workflows/feynman-assistant.json`: Complete n8n workflow definition with webhooks, FastAPI context retrieval, Gemini AI prompt engine, modality routing, and BKT callback integration.
- `feynman_workflow.json`: Root workflow backup for local and GUI importing.

---

## 3. Deploying to Render

### Method 1: Render Blueprint (Recommended)
This repository includes a root `render.yaml` blueprint. In your Render Dashboard:
1. Click **New +** → **Blueprint**.
2. Connect your Git repository (`LearniVerse-AI`).
3. Render will automatically configure:
   - `learniverse-n8n` (Docker Web Service)
   - `learniverse-backend` (FastAPI Python Service)
   - `learniverse-frontend` (Static Site)
4. Provide your `GEMINI_API_KEY` when prompted and click **Apply**.

### Method 2: Manual Web Service Deployment
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your repository.
3. Configure the service settings:
   - **Name**: `learniverse-n8n`
   - **Environment**: `Docker`
   - **Region**: `Oregon` (or match backend region)
   - **Branch**: `main`
   - **Dockerfile Path**: `n8n/Dockerfile`
   - **Docker Context**: `n8n`
   - **Health Check Path**: `/healthz`
4. Add the following **Environment Variables**:

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `FASTAPI_BACKEND_URL` | `https://learniverse-backend.onrender.com` | URL of the live FastAPI service |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API Key for LLM nodes |
| `GROQ_API_KEY` | `gsk_...` | Groq Cloud API Key for Whisper speech-to-text voice input |
| `WEBHOOK_URL` | `https://learniverse-n8n.onrender.com/` | Public URL of this n8n service for webhooks |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` | `false` | Allows workflow expressions to read `$env` |
| `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS` | `true` | Security hardening for configuration files |
| `GENERIC_TIMEZONE` | `UTC` | Timezone setting |

5. Click **Create Web Service**.

---

## 4. Connecting Backend to Render n8n

Once Render assigns your n8n service an address (e.g., `https://learniverse-n8n.onrender.com`), configure your FastAPI backend:

Set in the backend environment variables:
```env
N8N_WEBHOOK_URL=https://learniverse-n8n.onrender.com/webhook/feynman-request
```

### Dual-Mode Resilience (Fail-Safe Architecture)
- When `N8N_WEBHOOK_URL` is configured and online, requests flow through the n8n visual orchestration engine.
- If n8n is restarting, cold-starting, or unconfigured, the FastAPI backend automatically executes its built-in Python Feynman engine (`backend/app/services/feynman_service.py`), ensuring **100% uptime, zero demo interruptions, and full offline test passing**.

---

## 5. Local Docker Testing

To test this Docker container locally:

```bash
cd n8n
docker build -t learniverse-n8n .
docker run -p 5678:5678 -e FASTAPI_BACKEND_URL="http://host.docker.internal:8000" learniverse-n8n
```

Visit `http://localhost:5678` to inspect the workflow canvas.
