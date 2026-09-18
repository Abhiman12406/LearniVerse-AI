"""SuperMemo-2 (SM-2) Spaced Repetition Scheduler.

Conforms strictly to BACKEND_LOGIC.md §15:
- EF' = max(1.30, EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
- Intervals:
    q < 3  => n = 0, I = 1
    q >= 3 => n=0: I=1, n=1: I=6, n>=2: I = round(I_prev * EF')
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple

from backend.app.models.evidence import Sm2Record
from backend.app.services.config_service import config_service


class Sm2Service:
    """Calculates spaced repetition intervals and easiness factors according to the SM-2 algorithm."""

    def __init__(self):
        pass

    def map_performance_to_quality(
        self,
        correct: bool,
        response_time_ms: float = 5000.0,
        hints_used: int = 0,
        validity: float = 1.0,
    ) -> int:
        """
        Maps interaction outcome to standard SM-2 quality grade q in [0, 5].
        5: perfect response without hesitation or hints
        4: correct response after slight hesitation
        3: correct response with serious difficulty / hint usage
        2: incorrect response where correct answer seemed easy to recall
        1: incorrect response where correct answer was remembered
        0: complete blackout / failure
        """
        if validity < 0.2:
            # Invalid/technical glitch should not severely penalize
            return 3

        if not correct:
            if hints_used > 2:
                return 0
            if response_time_ms > 20000.0:
                return 1
            return 2

        # Correct responses
        if hints_used == 0 and response_time_ms < 8000.0:
            return 5
        elif hints_used <= 1 and response_time_ms < 15000.0:
            return 4
        else:
            return 3

    def update_schedule(
        self,
        record: Sm2Record,
        quality: int,
        review_time: Optional[datetime] = None,
    ) -> Sm2Record:
        """
        Applies SM-2 algorithm update to a learner's concept spaced-repetition record.
        """
        q = max(0, min(5, int(quality)))
        now = review_time or datetime.now(timezone.utc)

        min_ef = float(config_service.get_nested("sm2", "min_easiness_factor", 1.30))
        i1 = int(config_service.get_nested("sm2", "initial_interval_1", 1))
        i2 = int(config_service.get_nested("sm2", "initial_interval_2", 6))
        q_thresh = int(config_service.get_nested("sm2", "quality_threshold", 3))

        ef = record.easiness_factor
        repetitions = record.repetitions
        interval = record.interval_days

        # Calculate new Easiness Factor
        # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        delta_ef = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
        new_ef = max(min_ef, round(ef + delta_ef, 4))

        if q < q_thresh:
            # Failure / reset streak
            new_repetitions = 0
            new_interval = i1
        else:
            # Successful recall
            if repetitions == 0:
                new_interval = i1
            elif repetitions == 1:
                new_interval = i2
            else:
                new_interval = max(1, int(round(interval * new_ef)))
            new_repetitions = repetitions + 1

        next_date = now + timedelta(days=new_interval)

        return Sm2Record(
            concept_id=record.concept_id,
            easiness_factor=new_ef,
            repetitions=new_repetitions,
            interval_days=new_interval,
            last_reviewed_at=now.isoformat(),
            next_review_at=next_date.isoformat(),
        )

    def is_due_for_review(self, record: Sm2Record, reference_time: Optional[datetime] = None) -> bool:
        """Checks if concept is due for spaced review."""
        now = reference_time or datetime.now(timezone.utc)
        try:
            next_dt = datetime.fromisoformat(record.next_review_at)
            return now >= next_dt
        except Exception:
            return False

    def create_initial_record(self, concept_id: str) -> Sm2Record:
        """Initializes default SM-2 record for a concept."""
        default_ef = float(config_service.get_nested("sm2", "default_ef", 2.50))
        now = datetime.now(timezone.utc)
        return Sm2Record(
            concept_id=concept_id,
            easiness_factor=default_ef,
            repetitions=0,
            interval_days=1,
            last_reviewed_at=now.isoformat(),
            next_review_at=(now + timedelta(days=1)).isoformat(),
        )


sm2_service = Sm2Service()
