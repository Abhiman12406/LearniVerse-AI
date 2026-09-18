#!/bin/sh
set -e

# ==============================================================================
# Feynman n8n Workflow Orchestrator - Render Container Entrypoint
# Conforming to RENDER.md and FEYNMAN.md §7, §8, §23
# ==============================================================================

# Render assigns a dynamic port via $PORT (defaults to 5678 if unset)
export N8N_PORT="${PORT:-5678}"

# Enforce Node.js heap limit for Render Free Tier (512 MB total container RAM)
case "$NODE_OPTIONS" in
  *max-old-space-size*)
    ;;
  *)
    export NODE_OPTIONS="--max-old-space-size=384 ${NODE_OPTIONS:-}"
    ;;
esac

# Optimize for low-memory environments: disable diagnostics, telemetry, and metrics
export N8N_METRICS="${N8N_METRICS:-false}"
export N8N_DIAGNOSTICS_ENABLED="false"
export N8N_VERSION_NOTIFICATIONS_ENABLED="false"

# Normalize FASTAPI_BACKEND_URL scheme for n8n HTTP Request nodes
if [ -n "$FASTAPI_BACKEND_URL" ]; then
  case "$FASTAPI_BACKEND_URL" in
    http://*|https://*)
      ;;
    localhost*|127.0.0.1*)
      export FASTAPI_BACKEND_URL="http://${FASTAPI_BACKEND_URL}"
      ;;
    *)
      export FASTAPI_BACKEND_URL="https://${FASTAPI_BACKEND_URL}"
      ;;
  esac
  echo "[Feynman-n8n] Target Backend: ${FASTAPI_BACKEND_URL}"
fi

echo "================================================================================"
echo "⚡ [FEYNMAN-N8N ORCHESTRATOR] Booting on port: ${N8N_PORT}"
echo "================================================================================"

# Ensure n8n data directory has proper permissions
mkdir -p /home/node/.n8n

# One-time workflow pre-import: only runs on first container initialization
# Using a sentinel file ensures subsequent reboots and wakeups start instantly in <2 seconds
IMPORT_FLAG="/home/node/.n8n/.feynman_workflow_imported"
if [ ! -f "$IMPORT_FLAG" ] && [ -f "/workflows/feynman-assistant.json" ]; then
  echo "[Feynman-n8n] Initial setup: importing Feynman agent workflow..."
  n8n import:workflow --input=/workflows/feynman-assistant.json 2>/dev/null || true
  touch "$IMPORT_FLAG"
  echo "[Feynman-n8n] Initial workflow import complete."
else
  echo "[Feynman-n8n] Workflow already configured; booting server immediately."
fi

echo "[Feynman-n8n] Launching n8n server on port ${N8N_PORT}..."
# Start n8n as PID 1
exec n8n start
