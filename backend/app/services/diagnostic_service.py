"""AI Diagnostic Assessment Service.

Generates schema-validated 5-question Data Structures diagnostic assessments
covering Array, Linked List, Stack, Recursion, and Tree using Google Gemini AI
with a robust offline question bank fallback, and provides evaluation scoring.
"""

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from backend.app.models.assessment import (
    BarrierRecalculationDetail,
    DiagnosticAnswerReview,
    DiagnosticAssessmentResponse,
    DiagnosticBktDelta,
    DiagnosticOption,
    DiagnosticQuestion,
    DiagnosticSubmissionRequest,
    DiagnosticSubmissionResponse,
)
from backend.app.services.bkt_service import bkt_service
from backend.app.services.irt_service import irt_service
from backend.app.services.learner_service import WING_DEFINITIONS, learner_service
from backend.app.services.multidimensional_mastery_service import multidimensional_mastery_service
from backend.app.services.prerequisite_service import prerequisite_service



CURATED_OFFLINE_QUESTIONS: List[DiagnosticQuestion] = [
    # 1. Array
    DiagnosticQuestion(
        id="diag_arr_01",
        concept="array",
        concept_title="Array Memory & Indexing",
        difficulty="medium",
        title="Direct Index Random Access",
        scenario="A high-throughput cybernetic buffer stores 1,000 telemetry packets in a contiguous 0-indexed array. An algorithm accesses the element at index 742.",
        code_snippet=[
            "int[] telemetryBuffer = new int[1000];",
            "// ... buffer initialized with packets",
            "int packet = telemetryBuffer[742]; // Access by index",
        ],
        options=[
            DiagnosticOption(
                id="opt_arr_01_a",
                label="A",
                text="O(1) Constant Time — the memory address is computed directly via Base_Address + (Index * Element_Size)",
                explanation="Correct! Arrays provide instantaneous O(1) random access because elements reside in contiguous memory locations.",
            ),
            DiagnosticOption(
                id="opt_arr_01_b",
                label="B",
                text="O(n) Linear Time — the computer must sequentially scan the first 741 items from index 0",
                explanation="Incorrect. Sequential scanning is required in linked lists, not indexed arrays.",
            ),
            DiagnosticOption(
                id="opt_arr_01_c",
                label="C",
                text="O(log n) Logarithmic Time — binary partition search locates index 742",
                explanation="Incorrect. Binary search is for finding an element by value in sorted data, not accessing an index directly.",
            ),
            DiagnosticOption(
                id="opt_arr_01_d",
                label="D",
                text="O(n²) Quadratic Time — each index lookup re-indexes the entire buffer table",
                explanation="Incorrect. Array memory indexing requires no re-indexing.",
            ),
        ],
        correct_option_id="opt_arr_01_a",
        hint="Think of array memory like numbered lockers in a straight row where you can walk straight to locker #742.",
        feynman_analogy="If you know locker #0 is at the door and each locker is 1 foot wide, locker #742 is exactly 742 feet down without checking the earlier doors.",
        pedagogical_objective="Verify understanding of contiguous memory layout and O(1) indexing arithmetic.",
    ),

    # 2. Linked List
    DiagnosticQuestion(
        id="diag_ll_01",
        concept="linked_list",
        concept_title="Linked List Pointer Mechanics",
        difficulty="medium",
        title="Singly-Linked List Middle Insertion",
        scenario="You are given a singly-linked list: Head -> [A] -> [B] -> [C] -> NULL. You have a pointer referencing node [A]. You want to insert a new node [X] between [A] and [B] in O(1) time.",
        code_snippet=[
            "Node newNode = new Node(\"X\");",
            "// nodeA currently points to nodeB: nodeA.next == nodeB",
            "// Which sequence correctly weaves newNode between nodeA and nodeB?",
        ],
        options=[
            DiagnosticOption(
                id="opt_ll_01_a",
                label="A",
                text="newNode.next = nodeA.next; nodeA.next = newNode;",
                explanation="Correct! First link the new node to node B, then point node A to the new node, preserving the pointer chain.",
            ),
            DiagnosticOption(
                id="opt_ll_01_b",
                label="B",
                text="nodeA.next = newNode; newNode.next = nodeA.next;",
                explanation="Incorrect! Overwriting nodeA.next first severs the reference to node B, causing newNode.next to point back to itself (memory leak and circular loop).",
            ),
            DiagnosticOption(
                id="opt_ll_01_c",
                label="C",
                text="nodeA.next = null; newNode.next = nodeA;",
                explanation="Incorrect! This severs the tail of the list and reverses the pointer incorrectly.",
            ),
            DiagnosticOption(
                id="opt_ll_01_d",
                label="D",
                text="Shift all elements right by one index position in the backing heap",
                explanation="Incorrect! Linked lists do not shift elements; they only update pointers.",
            ),
        ],
        correct_option_id="opt_ll_01_a",
        hint="Always secure the forward link to the rest of the chain before detaching the predecessor.",
        feynman_analogy="Grab the hand of person B with your right hand before person A lets go of person B with their left hand.",
        pedagogical_objective="Verify understanding of pointer assignment ordering and link preservation.",
    ),

    # 3. Stack
    DiagnosticQuestion(
        id="diag_stk_01",
        concept="stack",
        concept_title="Stack Discipline & LIFO Mechanics",
        difficulty="easy",
        title="LIFO Extraction Sequence",
        scenario="An empty cybernetic stack undergoes the following sequence of operations: PUSH(10), PUSH(20), POP(), PUSH(30), PUSH(40), POP(), PUSH(50). What are the remaining elements from Base to Top?",
        code_snippet=[
            "Stack<Integer> stack = new Stack<>();",
            "stack.push(10);",
            "stack.push(20);",
            "stack.pop();      // removes 20",
            "stack.push(30);",
            "stack.push(40);",
            "stack.pop();      // removes 40",
            "stack.push(50);",
        ],
        options=[
            DiagnosticOption(
                id="opt_stk_01_a",
                label="A",
                text="[10, 30, 50]  (Base: 10, Top: 50)",
                explanation="Correct! 20 and 40 were popped immediately after being pushed, leaving 10 at the base, 30 in the middle, and 50 at the top.",
            ),
            DiagnosticOption(
                id="opt_stk_01_b",
                label="B",
                text="[50, 30, 10]  (Base: 50, Top: 10)",
                explanation="Incorrect. Stacks append new items to the top, so 10 was pushed first and remains at the bottom/base.",
            ),
            DiagnosticOption(
                id="opt_stk_01_c",
                label="C",
                text="[10, 20, 30, 40, 50]  (All pushed elements)",
                explanation="Incorrect. This ignores the two POP() operations that removed 20 and 40.",
            ),
            DiagnosticOption(
                id="opt_stk_01_d",
                label="D",
                text="[30, 50]  (Base: 30, Top: 50)",
                explanation="Incorrect. 10 was never popped from the base of the stack.",
            ),
        ],
        correct_option_id="opt_stk_01_a",
        hint="Trace each PUSH and POP sequentially: a POP only removes the most recently pushed item.",
        feynman_analogy="Think of a spring dispenser of cafeteria trays: the last tray placed on top is the first one taken.",
        pedagogical_objective="Verify mastery of Last-In, First-Out (LIFO) state transitions.",
    ),

    # 4. Recursion
    DiagnosticQuestion(
        id="diag_rec_01",
        concept="recursion",
        concept_title="Recursion & Call Stack Foundations",
        difficulty="medium",
        title="Recursive Base Case & Stack Unwinding",
        scenario="A student analyzes the following recursive function for computing factorials. What role does the `n <= 1` condition serve in terms of the execution call stack?",
        code_snippet=[
            "int factorial(int n) {",
            "    if (n <= 1) return 1;          // Condition under inspection",
            "    return n * factorial(n - 1);",
            "}",
        ],
        options=[
            DiagnosticOption(
                id="opt_rec_01_a",
                label="A",
                text="It is the Base Case that terminates recursive branching and triggers call stack unwinding",
                explanation="Correct! Without a base case, recursive calls would push activation frames indefinitely until encountering a Stack Overflow exception.",
            ),
            DiagnosticOption(
                id="opt_rec_01_b",
                label="B",
                text="It resets all previously allocated call frames to zero in heap memory",
                explanation="Incorrect. Call stack frames are not reset to zero; they return their value and are deallocated.",
            ),
            DiagnosticOption(
                id="opt_rec_01_c",
                label="C",
                text="It converts the recursive call into an iterative while loop automatically",
                explanation="Incorrect. Unless tail-call optimization is explicitly applied by a compiler, recursion retains its call stack frames.",
            ),
            DiagnosticOption(
                id="opt_rec_01_d",
                label="D",
                text="It provides memoization caching to store all intermediate answers",
                explanation="Incorrect. The base case does not cache or memoize values.",
            ),
        ],
        correct_option_id="opt_rec_01_a",
        hint="Every recursive descent must have a stopping rule to reverse direction and return values back up the chain.",
        feynman_analogy="When climbing down a ladder into a cave, the base case is touching the ground so you can turn around and climb back up.",
        pedagogical_objective="Verify understanding of recursive termination, activation frames, and call stack unwinding.",
    ),

    # 5. Tree
    DiagnosticQuestion(
        id="diag_tree_01",
        concept="tree",
        concept_title="Binary Search Tree Hierarchy",
        difficulty="hard",
        title="Binary Search Tree (BST) Invariant & In-Order Traversal",
        scenario="A Binary Search Tree (BST) contains the numbers [20, 50, 70, 30, 60]. If you perform an In-Order Traversal (Left subtree -> Root -> Right subtree) on this valid BST, what output sequence is guaranteed?",
        code_snippet=[
            "void inOrder(Node root) {",
            "    if (root == null) return;",
            "    inOrder(root.left);",
            "    System.out.print(root.val + \" \");",
            "    inOrder(root.right);",
            "}",
        ],
        options=[
            DiagnosticOption(
                id="opt_tree_01_a",
                label="A",
                text="[20, 30, 50, 60, 70]  (Strictly non-decreasing sorted order)",
                explanation="Correct! By definition, in a BST left < root < right. An in-order traversal visits all smaller elements first, then the root, then larger elements, producing sorted order.",
            ),
            DiagnosticOption(
                id="opt_tree_01_b",
                label="B",
                text="[50, 30, 20, 70, 60]  (Pre-order hierarchical root-first order)",
                explanation="Incorrect. Root-first traversal is Pre-Order traversal, not In-Order.",
            ),
            DiagnosticOption(
                id="opt_tree_01_c",
                label="C",
                text="[20, 70, 30, 60, 50]  (Arbitrary heap layout order)",
                explanation="Incorrect. BST traversal is strictly deterministic.",
            ),
            DiagnosticOption(
                id="opt_tree_01_d",
                label="D",
                text="[70, 60, 50, 30, 20]  (Reverse descending order)",
                explanation="Incorrect. Descending order requires reverse in-order traversal (Right -> Root -> Left).",
            ),
        ],
        correct_option_id="opt_tree_01_a",
        hint="In-Order traversal on a BST reads values from smallest on the far left to greatest on the far right.",
        feynman_analogy="Walking along a bookshelf from left to right where all books on the left are thinner and all books on the right are thicker.",
        pedagogical_objective="Verify understanding of the BST invariant and traversal algorithms.",
    ),
]


class DiagnosticAssessmentService:
    """Provides dynamic AI diagnostic question generation with curated fallback and evaluation."""

    def __init__(self, offline_bank: Optional[List[DiagnosticQuestion]] = None):
        self._offline_bank = offline_bank or CURATED_OFFLINE_QUESTIONS
        # In-memory question lookup by id: {question_id: DiagnosticQuestion}
        self._question_index: Dict[str, DiagnosticQuestion] = {
            q.id: q for q in self._offline_bank
        }

    def get_question(self, question_id: str) -> Optional[DiagnosticQuestion]:
        """Retrieve question by ID."""
        return self._question_index.get(question_id)

    def _call_gemini_generate_questions(self) -> Optional[List[DiagnosticQuestion]]:
        """Attempt to dynamically synthesize 5 fresh DSA questions via Gemini AI."""
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            return None

        try:
            import importlib
            genai = importlib.import_module("google.genai")
            client = genai.Client(api_key=api_key)

            prompt = """
You are an expert Data Structures and Algorithms pedagogy engine for an Adaptive Cybernetic 3D Virtual Classroom.
Generate a structured 5-question diagnostic assessment evaluating a student's baseline knowledge across our 5 core curriculum nodes:
1. array (Memory indexing, random access, contiguous layout)
2. linked_list (Pointers, node references, insertion/deletion)
3. stack (LIFO discipline, push/pop mechanics, call stack)
4. recursion (Base case, call stack unwinding, termination)
5. tree (Binary search tree invariant, traversal orders)

Requirements:
- Exactly 5 questions in the exact curriculum order: [array, linked_list, stack, recursion, tree].
- Each question must have exactly 4 multiple choice options (labels "A", "B", "C", "D").
- Each option must include a clear explanation of why it is correct or incorrect.
- Include a 2-6 line code snippet demonstrating the concept.
- Include a real-world intuition or Feynman analogy.

Respond STRICTLY in valid JSON matching this schema:
{
  "questions": [
    {
      "id": "diag_arr_ai",
      "concept": "array",
      "concept_title": "Array Contiguous Indexing",
      "difficulty": "medium",
      "title": "Title here",
      "scenario": "Scenario description",
      "code_snippet": ["line 1", "line 2"],
      "options": [
        {"id": "opt_a", "label": "A", "text": "Option text", "explanation": "Why correct/incorrect"},
        {"id": "opt_b", "label": "B", "text": "Option text", "explanation": "Why correct/incorrect"},
        {"id": "opt_c", "label": "C", "text": "Option text", "explanation": "Why correct/incorrect"},
        {"id": "opt_d", "label": "D", "text": "Option text", "explanation": "Why correct/incorrect"}
      ],
      "correct_option_id": "opt_a",
      "hint": "Pedagogical hint",
      "feynman_analogy": "Intuitive real-world analogy",
      "pedagogical_objective": "What is evaluated"
    }
  ]
}
"""
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )

            if not response or not response.text:
                return None

            cleaned = response.text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            parsed = json.loads(cleaned.strip())

            raw_questions = parsed.get("questions", [])
            if len(raw_questions) != 5:
                return None

            validated_questions: List[DiagnosticQuestion] = []
            for item in raw_questions:
                q = DiagnosticQuestion(**item)
                if len(q.options) != 4:
                    return None
                validated_questions.append(q)

            # Register into index
            for q in validated_questions:
                self._question_index[q.id] = q

            return validated_questions
        except Exception:
            return None

    def generate_assessment(self, force_refresh: bool = False) -> DiagnosticAssessmentResponse:
        """Generate or retrieve a 5-question diagnostic assessment with Gemini AI or offline fallback."""
        assessment_id = f"diag_sess_{uuid.uuid4().hex[:8]}"

        questions: Optional[List[DiagnosticQuestion]] = None
        source = "offline_curated"

        if force_refresh:
            questions = self._call_gemini_generate_questions()
            if questions:
                source = "gemini"

        if not questions:
            questions = list(self._offline_bank)
            source = "offline_curated"
            for q in questions:
                self._question_index[q.id] = q

        return DiagnosticAssessmentResponse(
            assessment_id=assessment_id,
            title="3D Adaptive Virtual Campus Diagnostic Assessment",
            description="Baseline cognitive diagnostic across the 5 Data Structures curriculum nodes: Array, Linked List, Stack, Recursion, and Tree.",
            concepts=["array", "linked_list", "stack", "recursion", "tree"],
            questions=questions,
            generated_by=source,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    def evaluate_submission(self, req: DiagnosticSubmissionRequest) -> DiagnosticSubmissionResponse:
        """Evaluate submitted diagnostic answers, execute 2-step BKT belief updates across all 5 nodes,

        atomically persist learner profile, and recalculate classroom prerequisite barrier forcefields.
        """
        lid = req.student_id or "learner_b"
        profile = learner_service.get_learner_profile(lid)
        if not profile:
            profile = learner_service.get_active_learner_profile()
            lid = profile.learner_id

        # 1. Capture prior wing barrier accessibility states across all wings
        prior_wing_status: Dict[str, str] = {
            wid: prerequisite_service.evaluate_concept(meta["concept"], profile.mastery_map).status
            for wid, meta in WING_DEFINITIONS.items()
        }

        # 2. Capture prior mastery beliefs
        prior_masteries: Dict[str, float] = {
            "array": float(profile.mastery_map.array),
            "linked_list": float(profile.mastery_map.linked_list),
            "stack": float(profile.mastery_map.stack),
            "recursion": float(profile.mastery_map.recursion),
            "tree": float(profile.mastery_map.tree),
        }

        reviews: List[DiagnosticAnswerReview] = []
        correct_count = 0
        concept_breakdown: Dict[str, bool] = {}
        new_masteries: Dict[str, float] = {}
        deltas: Dict[str, float] = {}
        thetas: Dict[str, float] = {}
        confidences: Dict[str, float] = {}

        # Resolve questions to evaluate (match offline bank or question index)
        questions_to_eval: List[DiagnosticQuestion] = []
        for q in self._offline_bank:
            q_obj = self._question_index.get(q.id, q)
            questions_to_eval.append(q_obj)

        # 3. Process each submitted answer through 2-Step BKT and 2PL IRT
        for q in questions_to_eval:
            selected_opt_id = req.answers.get(q.id)
            is_correct = (selected_opt_id == q.correct_option_id) if selected_opt_id else False

            if is_correct:
                correct_count += 1

            concept = q.concept
            concept_breakdown[concept] = is_correct
            prior_m = prior_masteries.get(concept, 0.5)

            # §3.0: 2-Step Bayesian Knowledge Tracing with concept-calibrated parameters
            posterior_m = bkt_service.compute_posterior(
                prior=prior_m,
                correct=is_correct,
                concept=concept,
                difficulty=q.difficulty or "medium",
                validity_score=1.0,
            )
            delta_m = round(posterior_m - prior_m, 2)
            new_masteries[concept] = posterior_m
            deltas[concept] = delta_m

            # §4.0: 2PL IRT Ability Estimation
            irt_service.record_response(
                student_id=lid,
                concept=concept,
                item_id=q.id,
                correct=is_correct,
                difficulty_level=q.difficulty or "medium",
            )
            thetas[concept] = irt_service.estimate_ability(lid, concept)

            # §6.0, §7.0: Multi-dimensional cognitive observation & confidence
            multidimensional_mastery_service.record_observation(
                student_id=lid,
                concept=concept,
                correct=is_correct,
                dimension="understanding",
            )
            confidences[concept] = multidimensional_mastery_service.compute_confidence(lid, concept)

            # Find explanation
            explanation = "No response provided."
            if selected_opt_id:
                for opt in q.options:
                    if opt.id == selected_opt_id:
                        explanation = opt.explanation
                        break
            else:
                for opt in q.options:
                    if opt.id == q.correct_option_id:
                        explanation = f"Correct answer was {opt.label}: {opt.explanation}"
                        break

            reviews.append(
                DiagnosticAnswerReview(
                    question_id=q.id,
                    concept=concept,
                    selected_option_id=selected_opt_id,
                    correct_option_id=q.correct_option_id,
                    is_correct=is_correct,
                    explanation=explanation,
                    title=q.title,
                )
            )

        # 4. Classify updated masteries into 4-tier categories (HIGH | MEDIUM | LOW | UNCERTAIN)
        classifications: Dict[str, str] = {
            c: multidimensional_mastery_service.classify_mastery(
                lid, c, new_masteries[c], new_masteries
            )
            for c in ["array", "linked_list", "stack", "recursion", "tree"]
        }

        # 5. Atomically update learner evidence and profile in authoritative store
        for c in ["array", "linked_list", "stack", "recursion", "tree"]:
            learner_service.update_learner_evidence(
                learner_id=lid,
                concept=c,
                new_mastery=new_masteries[c],
                theta=thetas[c],
                confidence=confidences[c],
                classification=classifications[c],
            )
        updated_profile = learner_service.get_learner_profile(lid)

        # 6. Recalculate Prerequisite Barrier Forcefield states across all wings
        barrier_recalculations: Dict[str, BarrierRecalculationDetail] = {}
        dissolved_wings: List[str] = []

        for wid, meta in WING_DEFINITIONS.items():
            was_sealed = prior_wing_status.get(wid) == "sealed"
            eval_res = prerequisite_service.evaluate_concept(meta["concept"], updated_profile.mastery_map)
            is_sealed = eval_res.status == "sealed"
            dissolved = was_sealed and not is_sealed
            if dissolved:
                dissolved_wings.append(wid)

            barrier_recalculations[wid] = BarrierRecalculationDetail(
                wing_id=wid,
                name=meta["name"],
                concept=meta["concept"],
                status=eval_res.status,
                is_ready=eval_res.is_ready,
                was_sealed=was_sealed,
                is_sealed=is_sealed,
                dissolved=dissolved,
                reason=eval_res.reason,
                required_mastery=meta["required_mastery"],
            )

        threshold_crossed = bool(dissolved_wings) or (
            prior_masteries.get("stack", 0.38) < 0.70 and new_masteries.get("stack", 0.38) >= 0.70
        )
        unlocked_wing = (
            dissolved_wings[0]
            if dissolved_wings
            else ("recursion_lab" if threshold_crossed else None)
        )

        # 7. Construct Concept-to-Gated Barrier Mapping for BKT Delta telemetry
        concept_gated_wing = {
            "array": "linked_list_lab",
            "linked_list": "stack_lab",
            "stack": "recursion_lab",
            "recursion": "tree_lab",
            "tree": "tree_lab",
        }

        bkt_updates: List[DiagnosticBktDelta] = []
        for q in questions_to_eval:
            c = q.concept
            gated_wid = concept_gated_wing.get(c, "array_station")
            barrier_item = barrier_recalculations.get(gated_wid)

            bkt_updates.append(
                DiagnosticBktDelta(
                    concept=c,
                    concept_title=q.concept_title,
                    prior_mastery=prior_masteries.get(c, 0.5),
                    posterior_mastery=new_masteries.get(c, 0.5),
                    delta=deltas.get(c, 0.0),
                    is_correct=concept_breakdown.get(c, False),
                    irt_ability=thetas.get(c, 0.0),
                    confidence=confidences.get(c, 0.5),
                    classification=classifications.get(c, "MEDIUM"),
                    barrier_status=barrier_item.status if barrier_item else "accessible",
                    barrier_reason=barrier_item.reason if barrier_item else None,
                )
            )

        world_state = learner_service.get_world_state(lid)
        total_questions = len(questions_to_eval)
        answered_count = len([k for k in req.answers.values() if k])
        score_percentage = round((correct_count / total_questions) * 100.0, 1)

        return DiagnosticSubmissionResponse(
            assessment_id=req.assessment_id,
            student_id=lid,
            total_questions=total_questions,
            answered_count=answered_count,
            correct_count=correct_count,
            score_percentage=score_percentage,
            reviews=reviews,
            concept_breakdown=concept_breakdown,
            bkt_updates=bkt_updates,
            barrier_recalculations=barrier_recalculations,
            learner_profile=updated_profile,
            world_state=world_state,
            threshold_crossed=threshold_crossed,
            unlocked_wing=unlocked_wing,
            status="evaluated",
            evaluation_timestamp=datetime.now(timezone.utc).isoformat(),
        )


diagnostic_service = DiagnosticAssessmentService()
