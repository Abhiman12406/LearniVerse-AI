# ==============================================================================
# Feynman n8n Workflow Orchestrator - Render Production Dockerfile
# Conforming to RENDER.md §5, §14 and FEYNMAN.md §7, §8, §23
# ==============================================================================

FROM n8nio/n8n:latest

USER root

# Create workflows and data directory
RUN mkdir -p /workflows /home/node/.n8n && \
    chown -R node:node /workflows /home/node/.n8n

# Copy workflows into the container
COPY --chown=node:node workflows/ /workflows/

# Copy custom entrypoint for Render dynamic $PORT and auto-import
COPY --chown=node:node docker-entrypoint.sh /docker-entrypoint-feynman.sh
RUN chmod +x /docker-entrypoint-feynman.sh

USER node

# Default n8n port (dynamically overridden by Render via $PORT)
EXPOSE 5678

# Set entrypoint to our custom Render startup script
ENTRYPOINT ["/docker-entrypoint-feynman.sh"]
