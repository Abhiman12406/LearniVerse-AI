"""Webhook Dispatch Adapter for n8n Workflow Automation.

Decouples external n8n HTTP webhook dispatching and timeout resilience
from the core Feynman reasoning pipeline.
"""

import os
from typing import Any, Dict, Optional, Tuple
import httpx


class WebhookDispatchAdapter:
    """Adapter managing external n8n workflow dispatch with resilient local fallback."""

    def __init__(self, default_webhook_url: Optional[str] = None):
        self._default_url = default_webhook_url

    def dispatch_n8n_sync(
        self,
        payload: Dict[str, Any],
        webhook_url: Optional[str] = None,
        timeout_seconds: float = 3.0,
    ) -> Tuple[str, Optional[Dict[str, Any]]]:
        """Synchronously dispatch payload to n8n webhook.

        Returns (orchestrator_mode, response_dict_or_none).
        Falls back seamlessly to ("builtin_engine", None) on error or absent URL.
        """
        target_url = webhook_url or self._default_url or os.environ.get("N8N_WEBHOOK_URL")
        if not target_url:
            return "builtin_engine", None

        try:
            with httpx.Client(timeout=timeout_seconds) as client:
                resp = client.post(target_url, json=payload)
                if resp.status_code == 200:
                    try:
                        return "n8n", resp.json()
                    except Exception:
                        return "n8n", None
                else:
                    return "builtin_engine", None
        except Exception:
            # Resilient fallback: continue with builtin engine
            return "builtin_engine", None


webhook_adapter = WebhookDispatchAdapter()
