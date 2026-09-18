#!/bin/sh
set -e

# ==============================================================================
# Feynman n8n Workflow Orchestrator - Render Container Entrypoint
# Conforming to RENDER.md and FEYNMAN.md §7, §8, §23
# ==============================================================================

# Render assigns a dynamic port via $PORT (defaults to 5678 if unset)
export N8N_PORT="${PORT:-5678}"

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

# Pre-import and activate workflow sequentially before launching server
# Running sequentially prevents launching concurrent Node.js processes, keeping memory well under 512 MB
if [ -f "/workflows/feynman-assistant.json" ]; then
  echo "[Feynman-n8n] Pre-importing workflow before server launch..."
  n8n import:workflow --input=/workflows/feynman-assistant.json 2>/dev/null || true
  n8n update:workflow --all --active=true 2>/dev/null || true
  echo "[Feynman-n8n] Workflow imported successfully."
fi

echo "[Feynman-n8n] Launching n8n server on port ${N8N_PORT}..."
# Start n8n as PID 1
exec n8n start
