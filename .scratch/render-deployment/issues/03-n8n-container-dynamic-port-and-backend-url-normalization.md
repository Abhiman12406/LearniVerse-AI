# 03: n8n Container Dynamic Port & Backend URL Scheme Normalization

**What to build:**
Harden the n8n Docker Web Service startup script to operate reliably within Render's container runtime, automatically ensuring the backend connection URL has a valid network protocol scheme and dynamically binding to Render's assigned HTTP port.

**Blocked by:** 01: Backend Production Healthchecks & LangGraph Packaging

**Status:** closed

- [x] Container startup script dynamically binds n8n to `$PORT` provided by Render environment with fallback to default 5678.
- [x] Backend communication URL (`FASTAPI_BACKEND_URL`) is checked and automatically prefixed with `https://` if Render supplies a bare hostname from service discovery.
- [x] Healthcheck probe loop confirms local n8n server readiness on the dynamic port before triggering workflow imports.
- [x] Pre-packaged Feynman workflow (`feynman-assistant.json`) automatically imports and activates on initial container boot.
- [x] Container filesystem permissions for n8n configuration and workflow directories are preserved across non-root user execution.
