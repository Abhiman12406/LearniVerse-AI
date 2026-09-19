"""Feynman Multimodal Explanation Sub-package.

Separates curriculum content repository and delivery adapters (Google GenAI, Groq Whisper)
from the core pedagogical reasoning engine.
"""

from backend.app.services.feynman.google_genai_service import (
    GoogleGenAIService,
    google_genai_service,
)
