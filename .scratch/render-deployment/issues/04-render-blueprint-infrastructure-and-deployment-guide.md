# 04: Render Blueprint Infrastructure & Deployment Verification Guide

**What to build:**
Deliver the unified `render.yaml` blueprint defining all 3 services for automated 1-click cloud provisioning, along with a comprehensive deployment guide documenting the architecture, environment variables, real-time agent log inspection on Render, local validation, and live verification checklist.

**Blocked by:** 02: Frontend API Client Gateway & Render Static Build Compatibility, 03: n8n Container Dynamic Port & Backend URL Scheme Normalization

**Status:** closed

- [x] Render blueprint file (`render.yaml`) accurately declares the 3 decoupled services:
  - `learniverse-frontend` (Static Site with SPA rewrite route `/* -> /index.html` and `VITE_API_URL` service binding).
  - `learniverse-backend` (Python Web Service with dynamic uvicorn command, `PYTHONUNBUFFERED: "1"`, `healthCheckPath: /api/feynman/health`, `PYTHONPATH`, and optional secrets).
  - `learniverse-n8n` (Docker Web Service with `healthCheckPath: /healthz` and backend service URL binding).
- [x] Services default to `plan: free` so any user or evaluator can deploy without upfront cost.
- [x] Optional secrets (`GEMINI_API_KEY`, `GROQ_API_KEY`, `NEO4J_URI`, `LANGCACHE_API_KEY`) are clearly marked `sync: false` in blueprint with documented heuristic fallbacks.
- [x] Comprehensive deployment guide is authored under `docs/RENDER_DEPLOYMENT.md` providing step-by-step setup walkthrough, service topology diagram, Render live agent log viewer instructions, troubleshooting tips, and verification flows.
- [x] Blueprint syntax and service configurations pass validation check.
