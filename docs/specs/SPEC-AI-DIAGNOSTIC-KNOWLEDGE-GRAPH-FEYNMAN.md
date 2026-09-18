# Feature Specification: AI Diagnostic Assessment, Knowledge Graph Adaptive Routing & Feynman Agent Integration

## Problem Statement

When computer science students enter the 3D Cybernetic Virtual Classroom, they enter with disparate prior knowledge. Currently, entering students must either guess where to begin or rely on pre-seeded profiles that don't reflect their active cognitive state. Without an automated, AI-driven initial diagnostic, students cannot demonstrate their true knowledge across the curriculum graph, causing them to either enter advanced wings without prerequisite readiness (e.g., attempting Recursion without mastering Stacks) or repeat mastered introductory topics. Furthermore, once an assessment occurs, students need clear explainability: why their knowledge graph changed, why a specific lab was assigned by the agentic deliberation pipeline, how in-lab kinetic activities reinforce that concept, and how the multimodal Feynman Agent can be engaged when cognitive roadblocks occur.

## Solution

A closed-loop adaptive pedagogical cycle combining:
1. An **AI Diagnostic Assessment** generated via Google Gemini AI API consisting of 5 questions that rigorously span the five core curriculum nodes: Arrays, Linked Lists, Stacks, Recursion, and Binary Search Trees.
2. A **Knowledge Graph & BKT Engine** that consumes the student's 5 answers, calculates Bayesian Knowledge Tracing (BKT) posteriors for each concept, updates the student's mastery graph, and recalculates physical forcefield barriers throughout the virtual world.
3. A **LangGraph 5-Agent Deliberation Pipeline** (Context Agent → Diagnostic Agent → Planner Agent → Validator Agent → Game Agent) that analyzes the updated graph, enforces deterministic prerequisite guardrails, determines the optimal learning action (`REMEDIATE`, `LEARN`, `PRACTICE`, `CHALLENGE`), and designates the target lab station.
4. An **Adaptive Lab Routing & Transition Flow** featuring a 1-click teleportation transition that transports the student's avatar and camera directly into the assigned lab station console with active mission instructions.
5. **In-Lab LangGraph Activities** where student interactions directly drive kinetic 3D simulations (e.g. stack push/pop, recursion frames), continuously updating mastery.
6. A **Demonstration of the Multimodal Feynman Agent** accessible both contextually (when a student misses an in-lab challenge) and on-demand via a dedicated HUD trigger, showcasing 5 distinct explanation modalities (Text analogy, Visual diagram, Voice transcription via Groq Whisper, Video animation, and 3D kinetic apparatus) along with an interactive verification loop.

---

## User Stories

1. As a student entering the classroom, I want an AI-powered 5-question diagnostic assessment to appear automatically, so that the system can immediately evaluate my current baseline across the entire curriculum.
2. As a student, I want each of the 5 questions to map directly to one of the 5 curriculum nodes (Array, Linked List, Stack, Recursion, Tree), so that every concept in the knowledge graph is tested fairly and independently.
3. As a student, I want the questions to be generated dynamically via Gemini AI with authentic code snippets and realistic scenarios, so that the assessment feels engaging and non-repetitive.
4. As a student, I want the test to proceed smoothly even if offline or if API quotas are exceeded, so that my learning session is never blocked by external service disruptions.
5. As a student taking the test, I want an intuitive cybernetic interface with clear concept indicators, progress tracking, and multiple-choice options, so that I can focus on solving the problems without UI friction.
6. As a student submitting the diagnostic assessment, I want to see a clear breakdown of my answers and instant explanation feedback for each question, so that I understand why my answers were correct or incorrect.
7. As a student, I want to see my Knowledge Graph mastery update in real time with visual prior-to-posterior BKT deltas, so that I can track how my baseline was mathematically established.
8. As a student, I want to see the LangGraph AI agent's pedagogical rationale explaining which lab I have been assigned to and why, so that the system's decision is fully transparent and explainable.
9. As a student whose Stack mastery is below the 70% threshold, I want the Recursion Wing forcefield to remain sealed with a clear prerequisite warning, so that I am prevented from jumping into advanced recursion prematurely.
10. As a student who receives an assigned lab recommendation, I want a 1-click "Teleport to Assigned Lab" button, so that I don't have to wander through the 3D space looking for the right door unless I choose to.
11. As a student arriving in the assigned lab, I want the kinetic lab apparatus and console to open automatically with the LangGraph agent's prescribed mission and difficulty level, so that I can immediately begin learning.
12. As a student performing activities in the lab (such as pushing and popping stack frames or scanning array indices), I want each completed step to submit an interaction that updates my BKT mastery, so that my progress is continuously recognized.
13. As a student who struggles or answers incorrectly during in-lab activities, I want the system to offer an ambient Feynman Agent intervention, so that I can get conceptual help without feeling stuck.
14. As a student or evaluator who wants to experience the Feynman technique at any time, I want a "Demonstrate Feynman Agent" trigger in the HUD and lab console, so that I can explore all multimodal capabilities on demand.
15. As a visual learner, I want the Feynman Agent to provide structured SVG/ASCII step-by-step diagrams of the concept, so that I can visualize memory states and pointer movements clearly.
16. As an auditory learner, I want to be able to speak my question or struggle aloud and have Groq Whisper transcribe it accurately, so that I can interact hands-free with the AI tutor.
17. As an interactive learner, I want the Feynman Agent to control the kinetic 3D apparatus in the lab to demonstrate concepts visually in the world, so that abstract data structures become tangible.
18. As a student receiving a Feynman explanation, I want to complete a targeted verification question, so that the system can verify my newfound understanding and update my knowledge graph accordingly.
19. As a judge or instructor, I want to view the LangGraph deliberation traces in the Telemetry Drawer, so that I can inspect the decision-making process of each of the 5 agents (Context, Diagnostic, Planner, Validator, Game).
20. As a student, I want to be able to retake or reopen the diagnostic test at any time via a top HUD button, so that I can benchmark my improvement after studying in the labs.

---

## Implementation Decisions

### Decision 1: Assessment Generation and Evaluation Seam
- Create a dedicated Assessment router in the backend providing:
  - `POST /api/assessment/generate-test`: Generates 5 structured DSA diagnostic questions targeting `array`, `linked_list`, `stack`, `recursion`, and `tree` using Gemini AI (`gemini-2.5-flash` / `gemini-1.5-flash`), with structured Pydantic response formatting and a resilient 5-question offline fallback bank.
  - `POST /api/assessment/submit-test`: Accepts the student's submission for all 5 questions, iterates through each concept to compute Bayesian Knowledge Tracing (BKT) posterior mastery values, updates the student's authoritative profile, recalculates prerequisite barrier statuses across all wings, and invokes the 5-Agent LangGraph Deliberation pipeline.
  - `GET /api/assessment/status/{student_id}`: Returns the current diagnostic assessment state and history for a learner.

### Decision 2: Knowledge Graph Update Semantics
- Each of the 5 diagnostic questions maps 1-to-1 with a node in the Curriculum DAG:
  - Question 1 → `array`
  - Question 2 → `linked_list`
  - Question 3 → `stack`
  - Question 4 → `recursion`
  - Question 5 → `tree`
- Submitting a correct answer executes a BKT posterior update indicating mastery acquisition; an incorrect answer scales down or holds the prior belief.
- The posterior mastery map is persisted directly to the active learner profile, updating node states in the Neo4j/NetworkX curriculum knowledge graph.
- Barrier forcefields are evaluated: if `stack` mastery is below `0.70`, the Recursion Wing barrier is marked as `sealed`; if `0.70` or above, it is marked as `accessible`.

### Decision 3: LangGraph 5-Agent Deliberation Pipeline Execution
- Following the diagnostic test evaluation, the backend immediately triggers the sequential 5-Agent LangGraph workflow:
  - `Context Agent`: Extracts the updated 5-node mastery vector and identifies weak prerequisite dependencies.
  - `Diagnostic Agent`: Formulates the diagnostic health evaluation (identifying prerequisite blocks or readiness).
  - `Planner Agent`: Proposes the optimal pedagogical action (`REMEDIATE`, `LEARN`, `PRACTICE`, `CHALLENGE`) and target concept.
  - `Validator Agent`: Deterministically verifies that hard prerequisite rules are not violated (e.g., rejecting an advance to Recursion if Stack < 70%).
  - `Game Agent`: Emits concrete world adaptation instructions, designating the target station (`array_station`, `linked_list_lab`, `stack_lab`, `recursion_lab`, or `tree_lab`) and active mission difficulty.

### Decision 4: Frontend State and Cybernetic Diagnostic Modal
- Integrate a `DiagnosticAssessmentModal` component:
  - Displays a high-aesthetic cybernetic overlay with glassmorphism, glowing neon accents, and step indicators.
  - Manages test progression across the 5 questions with options selection and submission states.
  - Displays an animated evaluation screen showcasing real-time BKT delta bars across all 5 concepts.
  - Shows the final LangGraph recommendation card with the target lab and a "Teleport to Assigned Lab" action.
- Update the global Zustand store with:
  - Diagnostic state: questions, active step, selected answers, submission status, and evaluation results.
  - Actions to launch the test, submit answers, and execute smooth camera/avatar teleportation to the assigned wing.
  - Automatic check on initial load to open the diagnostic test if not yet completed for the session.

### Decision 5: Lab Console and Kinetic Activity Binding
- Inside the assigned lab, the relevant console (e.g., Stack Console, Recursion Console, Array Station Console) opens with the prescribed mission and difficulty.
- Answering questions or manipulating kinetic apparatus steps invokes `/api/interactions`, updating BKT mastery for that concept and logging agent traces in the Telemetry Drawer.
- If Stack mastery crosses the 70% threshold, the Recursion barrier dissolve sequence is triggered.

### Decision 6: Multimodal Feynman Agent Integration
- Dual triggers:
  1. Contextual Trigger: When an incorrect answer is submitted in a lab challenge, an ambient prompt appears offering Feynman intervention ("Struggling with this concept? Consult the Feynman Agent").
  2. On-Demand Trigger: A prominent "Demonstrate Feynman Agent" button in the HUD and lab console headers allowing immediate exploration of the agent across concepts.
- The Feynman Agent modal supports all 5 modalities:
  - `TEXT`: Plain English analogy (e.g., spring-loaded cafeteria tray dispenser for Stacks, Russian nesting dolls for Recursion).
  - `VISUAL`: Interactive ASCII/SVG architectural diagram with step-by-step state visualization.
  - `VOICE`: Speech input transcribed via Groq Whisper (`whisper-large-v3`) with spoken audio response playback.
  - `VIDEO`: Canvas-based animated playback depicting frame allocation or pointer reassignment.
  - `3D`: Direct kinetic manipulation commands issued to the classroom's 3D apparatus.
- Includes the verification question loop: answering the Feynman verification question evaluates understanding and directly updates BKT mastery via `/api/feynman/verify`.

---

## Testing Decisions

### What Makes a Good Test
- Tests must verify external behavioral contracts, not implementation details or internal variable names.
- For the backend assessment API: verify that calling `POST /api/assessment/generate-test` returns 5 questions spanning all 5 concepts, and calling `POST /api/assessment/submit-test` yields updated BKT mastery values, barrier updates, and valid LangGraph deliberation traces.
- For the frontend store: verify that completing the diagnostic assessment correctly updates the active station, moves the avatar, and sets up in-lab missions.

### Tested Modules
- `backend/app/routers/assessment.py`: Assessment generation and submission endpoints.
- `backend/app/services/learner_evaluation_service.py`: BKT update accuracy and LangGraph pipeline execution.
- `frontend/src/store/useClassroomStore.ts`: Diagnostic state transitions, teleport actions, and Feynman modal controls.
- `frontend/src/components/ui/DiagnosticAssessmentModal.tsx`: User interaction and answer submission.

### Prior Art
- `backend/tests/run_feynman_n8n_testcase.py`: Existing end-to-end integration test validating Feynman request, transcription, and verification.
- `frontend/src/tests/feynman-modal.test.ts`: Existing unit test validating Feynman modal modality switching and state changes.

---

## Out of Scope
- Expanding the curriculum beyond the core 5 DSA concepts (Arrays, Linked Lists, Stacks, Recursion, Trees).
- Live audio generation via third-party paid TTS services (we utilize browser Web Speech API / synthesized audio for zero-latency, resilient voice playback).
- Multiplayer avatar networking or concurrent classroom collaboration.

---

## Further Notes
- The offline fallback question bank ensures that during demonstrations or hackathon judging without internet connectivity, the entire diagnostic, knowledge graph update, lab teleport, and Feynman demo run flawlessly.
- All agent deliberations are cached and inspectable in the Telemetry Drawer for total judge explainability.
