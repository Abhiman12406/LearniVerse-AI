"""Evidence Validity Gate Service.

Conforms strictly to BACKEND_LOGIC.md §2, §17, §24:
- Rule A: Technical failure is not a learning failure (Timeout != wrong answer, Vi = 0)
- Rule B: Interaction is not automatically mastery (Walking/clicking != learning, Vi = 0)
- Separates Learning Evidence from Technical Context Telemetry
- Enforces ΔM_effective = Vi * ΔM
"""

from typing import Any, Dict, Optional
from backend.app.models.evidence import EvidenceType, EvidenceValidity


class EvidenceGateService:
    """Evaluates whether an interaction event constitutes valid learning evidence."""

    def evaluate_validity(
        self,
        evidence_type: str = "COGNITIVE_ASSESSMENT",
        is_timeout: bool = False,
        is_network_error: bool = False,
        response_time_ms: Optional[int] = None,
        fps: Optional[float] = None,
        latency_ms: Optional[float] = None,
        has_educational_content: bool = True,
    ) -> EvidenceValidity:
        """Alias for evaluate_interaction conforming to BACKEND_LOGIC.md §2."""
        return self.evaluate_interaction(
            event_type=evidence_type,
            is_timeout=is_timeout,
            is_network_error=is_network_error,
            response_time_ms=response_time_ms,
            has_educational_content=has_educational_content,
        )

    def evaluate_interaction(
        self,
        event_type: str = "COGNITIVE_ASSESSMENT",
        is_timeout: bool = False,
        is_network_error: bool = False,
        response_time_ms: Optional[int] = None,
        has_educational_content: bool = True,
    ) -> EvidenceValidity:
        """
        Calculates the validity factor V_i in [0, 1] for an incoming event.
        """
        # Rule A: Technical telemetry / failures must never lower mastery
        if is_timeout:
            return EvidenceValidity(
                valid=False,
                validity_score=0.0,
                reason="TECHNICAL_TIMEOUT_RULE_A",
                is_technical_telemetry=True,
            )

        if is_network_error:
            return EvidenceValidity(
                valid=False,
                validity_score=0.0,
                reason="NETWORK_ERROR_RULE_A",
                is_technical_telemetry=True,
            )

        # Rule B: Non-educational physical interactions do not constitute mastery evidence
        if event_type == EvidenceType.EXPLORATORY_WALK.value or not has_educational_content:
            return EvidenceValidity(
                valid=False,
                validity_score=0.0,
                reason="EXPLORATORY_BEHAVIOR_RULE_B",
                is_technical_telemetry=False,
            )

        if event_type == EvidenceType.TECHNICAL_TELEMETRY.value:
            return EvidenceValidity(
                valid=False,
                validity_score=0.0,
                reason="PURE_TELEMETRY",
                is_technical_telemetry=True,
            )

        # Suspiciously fast response (< 300ms) could indicate rapid bot clicking or accidental misclick
        if response_time_ms is not None and response_time_ms < 300:
            return EvidenceValidity(
                valid=True,
                validity_score=0.5,
                reason="SUB_SECOND_RAPID_INPUT_DEPRECIATED",
                is_technical_telemetry=False,
            )

        # Normal valid cognitive assessment response
        return EvidenceValidity(
            valid=True,
            validity_score=1.0,
            reason="VALID_COGNITIVE_OUTCOME",
            is_technical_telemetry=False,
        )

    def compute_effective_delta(self, raw_delta: float, validity: EvidenceValidity) -> float:
        """
        Calculates effective mastery change:
        ΔM_effective = V_i * ΔM
        """
        return round(validity.validity_score * raw_delta, 4)


evidence_gate_service = EvidenceGateService()
