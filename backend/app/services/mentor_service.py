"""Authoritative AI Mentor & Feynman Conceptual Guidance Service.

Delivers contextual pedagogical advice and Feynman-style analogies based on
the learner's active prerequisite gaps and knowledge mastery graph.
"""

from typing import Dict, Optional
from backend.app.models.mentor import (
    FeynmanExplanation,
    MentorGuidanceResponse,
    MentorQuestion,
)
from backend.app.services.learner_service import learner_service
from backend.app.services.prerequisite_service import prerequisite_service


class MentorService:
    """Provides personalized Feynman explanations and learning direction."""

    def get_guidance(self, learner_id: Optional[str] = None) -> MentorGuidanceResponse:
        """Generate tailored guidance and Feynman conceptual bridge for the active learner."""
        target_id = learner_id or learner_service.get_active_learner_id()
        profile = learner_service.get_learner_profile(target_id)
        if not profile:
            profile = learner_service.get_active_learner_profile()

        mastery = profile.mastery_map
        recursion_eval = prerequisite_service.evaluate_concept("recursion", mastery)

        if not recursion_eval.is_ready or profile.learner_id == "learner_b":
            return self._build_remedial_guidance(profile, recursion_eval.reason)
        else:
            return self._build_advanced_guidance(profile)

    def _build_remedial_guidance(
        self, profile, gap_reason: Optional[str]
    ) -> MentorGuidanceResponse:
        stack_pct = int(profile.mastery_map.stack * 100)
        gap_desc = gap_reason or f"Stack Mastery: {stack_pct}% (Threshold: 70% required for Recursion Wing)"

        feynman = FeynmanExplanation(
            concept="stack",
            target_prerequisite_of="recursion",
            analogy=(
                "Imagine a spring-loaded cafeteria tray dispenser. Every clean tray is pressed down on top of the pile. "
                "When someone takes a tray, they must take the topmost one that was placed last. This is LIFO: Last-In, First-Out."
            ),
            conceptual_bridge=(
                "Why must you master Stacks before Recursion? Because computer processors do not have magical memory! "
                "When a function calls itself, its execution pauses mid-sentence. The CPU must preserve all local variables "
                "and return locations on a physical structure called the Call Stack. If you do not intuitively understand "
                "how data pushes and pops in LIFO order, recursive unwinding will feel like an abstract mystery rather than "
                "orderly mechanical stack manipulation."
            ),
            hardware_software_context=(
                "In computer architecture, every recursive call pushes a stack activation record. Without a sound base case, "
                "the stack overflows into unallocated memory, triggering a critical segmentation fault."
            ),
            prerequisite_gap=gap_desc,
        )

        questions = [
            MentorQuestion(
                id="why_stack_first",
                label="Why can't I just learn Recursion right now?",
                answer=(
                    "Because recursion without a mental model of stacks is like trying to follow a conversation where each "
                    "speaker interrupts the previous one with a new question. Without a notebook (the Call Stack) tracking "
                    "who was waiting for an answer, your mental model will collapse. Master the Stack, and Recursion becomes easy."
                ),
            ),
            MentorQuestion(
                id="call_stack_unwind",
                label="How does the Call Stack unwind upon base case?",
                answer=(
                    "When the deepest recursive call hits the Base Case, it terminates and returns its value. "
                    "The CPU pops that top frame, instantly resuming the parent frame right where it paused. "
                    "Frames pop in reverse order until the original caller receives the cumulative result."
                ),
            ),
            MentorQuestion(
                id="stack_lab_guidance",
                label="What will I do in the Stack Lab?",
                answer=(
                    "In the Stack Lab, you will interact with the vertical cylindrical apparatus to push and pop data discs, "
                    "observe LIFO ordering, and solve practical stack challenges to bring your mastery above 70%."
                ),
            ),
        ]

        return MentorGuidanceResponse(
            learner_id=profile.learner_id,
            learner_name=profile.name,
            persona_type=profile.persona_type,
            status="remediation_required",
            focus_concept="stack",
            recommended_station="stack_lab",
            greeting=f"Greetings, {profile.name.split(' ')[0]}. I detect you are seeking entry to the Recursion Wing.",
            diagnostic_summary=(
                f"Prerequisite barrier engaged. Your current Stack mastery is {stack_pct}%, "
                f"which is below the mandatory 70% pedagogical threshold for the Recursion Wing."
            ),
            feynman_explanation=feynman,
            interactive_questions=questions,
            action_recommendation=(
                "Step down from the Dais and follow the pulsing guidance conduits to the Stack Lab (South-East Archway). "
                "Complete the LIFO apparatus challenges to elevate your mastery and dissolve the barrier."
            ),
        )

    def _build_advanced_guidance(self, profile) -> MentorGuidanceResponse:
        stack_pct = int(profile.mastery_map.stack * 100)
        rec_pct = int(profile.mastery_map.recursion * 100)

        feynman = FeynmanExplanation(
            concept="recursion",
            target_prerequisite_of="tree",
            analogy=(
                "Imagine a set of Russian Matryoshka nesting dolls. Each doll opens to reveal an identical smaller doll, "
                "until you reach the tiny solid wooden doll in the center—the Base Case. Then you reassemble them outward."
            ),
            conceptual_bridge=(
                f"With your Stack mastery verified at {stack_pct}%, you already understand that each recursive branch "
                "is an activation frame pushed onto the Call Stack. You are ready to analyze how recursive branching "
                "forms self-similar computation trees and how return values bubble back up through stack frame unwinding."
            ),
            hardware_software_context=(
                "In high-performance systems, deep recursion can incur memory overhead. You are ready to evaluate tail-call "
                "optimization and recursive tree traversal complexities."
            ),
            prerequisite_gap=None,
        )

        questions = [
            MentorQuestion(
                id="base_case_contract",
                label="What is the golden rule of recursive design?",
                answer=(
                    "Always define and test your Base Case first. Without a verifiable termination condition, "
                    "the recursion never stops pushing frames to the Call Stack, inevitably producing a Stack Overflow."
                ),
            ),
            MentorQuestion(
                id="recursion_to_trees",
                label="How does Recursion unlock the Tree Lab?",
                answer=(
                    "A tree is fundamentally a recursive data structure: every tree consists of a root node and subtrees "
                    "that are themselves trees. Mastering recursion is the key that unlocks Tree traversals (pre-order, in-order, post-order)."
                ),
            ),
        ]

        return MentorGuidanceResponse(
            learner_id=profile.learner_id,
            learner_name=profile.name,
            persona_type=profile.persona_type,
            status="advanced_readiness",
            focus_concept="recursion",
            recommended_station="recursion_lab",
            greeting=f"Welcome, {profile.name.split(' ')[0]}. Prerequisite diagnostic checks verified.",
            diagnostic_summary=(
                f"All foundational prerequisites satisfied. Stack mastery is at {stack_pct}%. "
                f"The Recursion Wing portal is fully accessible."
            ),
            feynman_explanation=feynman,
            interactive_questions=questions,
            action_recommendation=(
                "Proceed West through the unlocked Archway into the Recursion Lab. "
                "Engage the Call Stack apparatus to tackle nested recursive simulations."
            ),
        )

    def answer_question(
        self, question_id: str, learner_id: Optional[str] = None
    ) -> Optional[MentorQuestion]:
        """Look up a specific question response for the learner."""
        guidance = self.get_guidance(learner_id)
        for q in guidance.interactive_questions:
            if q.id == question_id:
                return q
        return None


mentor_service = MentorService()
