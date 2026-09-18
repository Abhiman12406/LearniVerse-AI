"""Missions API router serving curated Data Structures missions and challenges."""

from fastapi import APIRouter, HTTPException
from backend.app.models.mission import StackMissionModel, StackChallengeModel, ChallengeOptionModel

router = APIRouter(prefix="/api/missions", tags=["Missions"])

STACK_CHALLENGES_DATA = [
    StackChallengeModel(
        id="stack_lifo_order",
        mission_id="stack_diagnostic_mission",
        step_number=1,
        total_steps=4,
        title="LIFO Extraction Order",
        concept="stack",
        difficulty="easy",
        type="multiple_choice",
        objective="Determine output order under Last-In, First-Out (LIFO) discipline.",
        scenario="Four data frames [A, B, C, D] are sequentially pushed onto an initially empty stack. Immediately afterward, four consecutive POP() operations are executed.",
        code_snippet=[
            "Stack S = new Stack();",
            "S.push(\"A\");",
            "S.push(\"B\");",
            "S.push(\"C\");",
            "S.push(\"D\");",
            "result = [S.pop(), S.pop(), S.pop(), S.pop()];",
        ],
        options=[
            ChallengeOptionModel(id="opt_lifo_correct", label="A", text="D, C, B, A", explanation="Correct! The last pushed element (D) is at the top."),
            ChallengeOptionModel(id="opt_fifo", label="B", text="A, B, C, D", explanation="Incorrect. That is FIFO (Queue)."),
            ChallengeOptionModel(id="opt_random", label="C", text="A, D, B, C", explanation="Incorrect. Arbitrary extraction is not permitted in stacks."),
            ChallengeOptionModel(id="opt_partial_reverse", label="D", text="D, A, C, B", explanation="Incorrect. Must follow strict reverse order."),
        ],
        correct_option_id="opt_lifo_correct",
        hint="Think of a spring-loaded cafeteria tray dispenser.",
        feynman_analogy="Placing books in a vertical box means you can only grab the topmost one.",
        pedagogical_explanation="By definition, a Stack enforces LIFO (Last-In, First-Out). Elements are inserted and deleted at the Top.",
        simulated_stack_initial=[10, 20, 30, 40],
    ),
    StackChallengeModel(
        id="stack_push_pop_trace",
        mission_id="stack_diagnostic_mission",
        step_number=2,
        total_steps=4,
        title="Interleaved Push & Pop Trace",
        concept="stack",
        difficulty="medium",
        type="multiple_choice",
        objective="Trace stack state through mixed push and pop transitions.",
        scenario="Starting from an empty stack, trace the internal buffer across: PUSH(15) -> PUSH(30) -> POP() -> PUSH(45) -> PUSH(60) -> POP() -> PUSH(75). What remains from Base to Top?",
        code_snippet=[
            "PUSH(15)  // [15]",
            "PUSH(30)  // [15, 30]",
            "POP()     // removes 30",
            "PUSH(45)  // [15, 45]",
            "PUSH(60)  // [15, 45, 60]",
            "POP()     // removes 60",
            "PUSH(75)  // [15, 45, 75]",
        ],
        options=[
            ChallengeOptionModel(id="opt_trace_correct", label="A", text="[15, 45, 75]  (Base: 15, Top: 75)", explanation="Correct! 30 and 60 were popped, leaving 15, 45, 75."),
            ChallengeOptionModel(id="opt_trace_reversed", label="B", text="[75, 45, 15]  (Top to Base)", explanation="Incorrect. The question asked Base to Top."),
            ChallengeOptionModel(id="opt_trace_all", label="C", text="[15, 30, 45, 60, 75]", explanation="Incorrect. Ignores the POP calls."),
            ChallengeOptionModel(id="opt_trace_dropped_base", label="D", text="[45, 75]", explanation="Incorrect. Base 15 was never popped."),
        ],
        correct_option_id="opt_trace_correct",
        hint="Test it directly on the kinetic apparatus on the right.",
        feynman_analogy="Each POP undoes the most recent PUSH without disturbing the layers beneath.",
        pedagogical_explanation="Tracing step-by-step leaves [15, 45, 75] from Base to Top.",
        simulated_stack_initial=[15, 45, 75],
    ),
    StackChallengeModel(
        id="stack_overflow_underflow",
        mission_id="stack_diagnostic_mission",
        step_number=3,
        total_steps=4,
        title="Capacity Overflow & Underflow Guard",
        concept="stack",
        difficulty="easy",
        type="multiple_choice",
        objective="Understand structural boundary constraints and safety guards.",
        scenario="The cylinder has an allocated buffer limit of 6 elements. What occurs if an algorithm executes POP() on an empty stack (size = 0)?",
        code_snippet=[
            "Stack S = new Stack(capacity = 6);",
            "element = S.pop(); // ???",
        ],
        options=[
            ChallengeOptionModel(id="opt_underflow_correct", label="A", text="Stack Underflow Exception; mirrors violating a recursive Base Case", explanation="Correct! Popping an empty stack triggers Underflow."),
            ChallengeOptionModel(id="opt_overflow_error", label="B", text="Stack Overflow Exception; memory buffer exceeded", explanation="Incorrect. Overflow occurs when pushing into a full buffer."),
            ChallengeOptionModel(id="opt_wraparound", label="C", text="Wraparound Circular Buffer extraction", explanation="Incorrect. Stacks do not wrap around."),
            ChallengeOptionModel(id="opt_silent_null", label="D", text="Silent allocation of synthetic zero", explanation="Incorrect. Stacks guard against invalid reads with exceptions."),
        ],
        correct_option_id="opt_underflow_correct",
        hint="Grasping into an empty box gives you nothing.",
        feynman_analogy="Trying to take a tray from an empty dispenser gives thin air.",
        pedagogical_explanation="Underflow occurs when attempting to pop or peek an empty stack. In recursion, the base case prevents underflow.",
        simulated_stack_initial=[],
    ),
    StackChallengeModel(
        id="stack_bracket_balance",
        mission_id="stack_diagnostic_mission",
        step_number=4,
        total_steps=4,
        title="Call Stack & Bracket Validation",
        concept="stack",
        difficulty="hard",
        type="multiple_choice",
        objective="Bridge LIFO mechanics to nested syntax parsing and call stack execution.",
        scenario="Compilers validate nested syntax using a stack. When encountering a closing token like '}', what rule must hold?",
        code_snippet=[
            "function isBalanced(code: string): boolean {",
            "  const stack = new Stack();",
            "  // ...",
            "}",
        ],
        options=[
            ChallengeOptionModel(id="opt_bracket_correct", label="A", text="The top of stack must match the closing token's opening counterpart, and is immediately popped.", explanation="Correct! The most recently opened scope must close first."),
            ChallengeOptionModel(id="opt_bracket_base", label="B", text="The bottom of the stack must match.", explanation="Incorrect. That would be FIFO."),
            ChallengeOptionModel(id="opt_bracket_all_pop", label="C", text="All open brackets are popped at once.", explanation="Incorrect. Must resolve sequentially."),
            ChallengeOptionModel(id="opt_bracket_accumulate", label="D", text="Closing tokens are pushed until EOF.", explanation="Incorrect. Closing tokens cancel out opening tokens."),
        ],
        correct_option_id="opt_bracket_correct",
        hint="Inner scopes must finish before outer scopes.",
        feynman_analogy="You must finish an inner tangent before returning to the outer conversation topic.",
        pedagogical_explanation="Because stacks enforce LIFO, the top of stack always represents the most immediate active scope.",
        simulated_stack_initial=[28, 44, 90],
    ),
]

STACK_MISSION_DATA = StackMissionModel(
    id="stack_diagnostic_mission",
    title="Stack Lab Diagnostic Mission",
    subtitle="LIFO Mechanics & Call Stack Foundations",
    concept="stack",
    difficulty="easy",
    target_mastery="70%+",
    description="Synthesize stack operation sequences, trace LIFO buffer transitions, and analyze memory boundaries to clear prerequisite gaps.",
    learning_objectives=[
        "Master Last-In, First-Out (LIFO) extraction order",
        "Trace interleaved PUSH and POP memory transitions",
        "Understand Capacity Overflow and Underflow boundary conditions",
        "Bridge stack manipulation directly to Call Stack activation records",
    ],
    challenges=STACK_CHALLENGES_DATA,
)


@router.get("/stack", response_model=StackMissionModel)
def get_stack_mission() -> StackMissionModel:
    """Return the diagnostic Stack mission and challenges."""
    return STACK_MISSION_DATA


@router.get("/{mission_id}", response_model=StackMissionModel)
def get_mission_by_id(mission_id: str) -> StackMissionModel:
    """Retrieve a specific mission by ID."""
    if mission_id in ("stack_diagnostic_mission", "stack"):
        return STACK_MISSION_DATA
    raise HTTPException(status_code=404, detail=f"Mission '{mission_id}' not found")
