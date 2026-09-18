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

# Background daemon: wait for n8n web server to become healthy, then import & activate workflows
(
  echo "[Feynman-n8n] Background workflow loader started. Probing http://127.0.0.1:${N8N_PORT}/healthz ..."
  
  HEALTHY=0
  for i in $(seq 1 30); do
    sleep 2
    if node -e "const http = require('http'); http.get('http://127.0.0.1:' + process.env.N8N_PORT + '/healthz', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1));" 2>/dev/null; then
      HEALTHY=1
      break
    fi
  done

  if [ "$HEALTHY" -eq 1 ]; then
    echo "[Feynman-n8n] Server is healthy! Importing Feynman workflow..."
    if [ -f "/workflows/feynman-assistant.json" ]; then
      n8n import:workflow --input=/workflows/feynman-assistant.json || true
      n8n update:workflow --all --active=true || true
      echo "[Feynman-n8n] Workflow /workflows/feynman-assistant.json imported and activated successfully!"
    fi
  else
    echo "[Feynman-n8n] Healthcheck probe timed out. Running fallback direct import..."
    if [ -f "/workflows/feynman-assistant.json" ]; then
      n8n import:workflow --input=/workflows/feynman-assistant.json || true
    fi
  fi
) &

# Start n8n in foreground
exec n8n start
