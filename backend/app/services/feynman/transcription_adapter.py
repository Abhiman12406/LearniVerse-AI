"""Transcription Adapter for Groq Whisper Audio Speech-to-Text.

Decouples external HTTP audio transcription sockets and simulated offline
test fallbacks from the Feynman reasoning service.
"""

import base64
import os
from typing import Optional
import httpx

from backend.app.models.feynman import TranscribeRequest, TranscribeResponse

MIME_TYPES = {
    "webm": "audio/webm",
    "wav": "audio/wav",
    "mp3": "audio/mp3",
    "m4a": "audio/m4a",
    "ogg": "audio/ogg",
}


class TranscriptionAdapter:
    """Adapter managing Groq Whisper speech-to-text API calls and simulated fallbacks."""

    def transcribe_sync(
        self,
        audio_bytes: bytes,
        audio_format: str = "webm",
        language: str = "en",
        prompt: Optional[str] = None,
    ) -> TranscribeResponse:
        """Synchronously transcribe audio using Groq Whisper API (model: whisper-large-v3).

        Falls back gracefully if GROQ_API_KEY is not configured or in offline test environments.
        """
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return TranscribeResponse(
                transcript="Why does recursion need a base case?",
                provider="groq_whisper_simulated",
                model="whisper-large-v3",
                success=True,
                warning="GROQ_API_KEY environment variable not configured. Returned simulated transcription for testing.",
            )

        mime = MIME_TYPES.get(audio_format.lower(), "audio/webm")
        filename = f"speech.{audio_format}"

        try:
            with httpx.Client(timeout=30.0) as client:
                data = {
                    "model": "whisper-large-v3",
                    "response_format": "json",
                    "temperature": "0.0",
                    "language": language,
                }
                if prompt:
                    data["prompt"] = prompt

                files = {"file": (filename, audio_bytes, mime)}
                resp = client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    data=data,
                    files=files,
                )
                if resp.status_code == 200:
                    text = resp.json().get("text", "").strip()
                    return TranscribeResponse(
                        transcript=text,
                        provider="groq_whisper",
                        model="whisper-large-v3",
                        success=True,
                    )
                else:
                    return TranscribeResponse(
                        transcript="Explain how this data structure works in the classroom",
                        provider="groq_whisper_fallback",
                        model="whisper-large-v3",
                        success=False,
                        warning=f"Groq API error {resp.status_code}: {resp.text}",
                    )
        except Exception as e:
            return TranscribeResponse(
                transcript="Explain how this data structure works in the classroom",
                provider="groq_whisper_fallback",
                model="whisper-large-v3",
                success=False,
                warning=f"Connection error to Groq Whisper: {str(e)}",
            )

    async def transcribe_async(self, req: TranscribeRequest) -> TranscribeResponse:
        """Async transcription endpoint handler for student voice input using Groq Whisper."""
        if not req.audio_base64:
            return TranscribeResponse(
                transcript="Why does recursion need a base case?",
                provider="groq_whisper_simulated",
                model="whisper-large-v3",
                success=True,
                warning="No audio payload received, provided default prompt.",
            )

        try:
            audio_bytes = base64.b64decode(req.audio_base64)
        except Exception as e:
            return TranscribeResponse(
                transcript="Invalid audio data",
                provider="groq_whisper",
                model="whisper-large-v3",
                success=False,
                warning=f"Base64 decode failed: {str(e)}",
            )

        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return TranscribeResponse(
                transcript="Why does recursion need a base case?",
                provider="groq_whisper_simulated",
                model="whisper-large-v3",
                success=True,
                warning="GROQ_API_KEY environment variable not configured. Set GROQ_API_KEY for live Whisper transcription.",
            )

        mime = MIME_TYPES.get(req.audio_format.lower(), "audio/webm")
        filename = f"speech.{req.audio_format}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                data = {
                    "model": "whisper-large-v3",
                    "response_format": "json",
                    "temperature": "0.0",
                    "language": req.language,
                }
                if req.prompt:
                    data["prompt"] = req.prompt

                files = {"file": (filename, audio_bytes, mime)}
                resp = await client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    data=data,
                    files=files,
                )
                if resp.status_code == 200:
                    text = resp.json().get("text", "").strip()
                    return TranscribeResponse(
                        transcript=text,
                        provider="groq_whisper",
                        model="whisper-large-v3",
                        success=True,
                    )
                else:
                    return TranscribeResponse(
                        transcript="Explain how this data structure works in the classroom",
                        provider="groq_whisper_fallback",
                        model="whisper-large-v3",
                        success=False,
                        warning=f"Groq API error {resp.status_code}: {resp.text}",
                    )
        except Exception as e:
            return TranscribeResponse(
                transcript="Explain how this data structure works in the classroom",
                provider="groq_whisper_fallback",
                model="whisper-large-v3",
                success=False,
                warning=f"Connection error to Groq Whisper: {str(e)}",
            )


transcription_adapter = TranscriptionAdapter()
