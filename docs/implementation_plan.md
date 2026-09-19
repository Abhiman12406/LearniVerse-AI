# Implementation Plan: Adaptive Agentic Learning Virtual Classroom MVP

Build a complete, demonstrable MVP of an **Agentic AI-powered Adaptive Learning Virtual Classroom** based on the architecture and specifications in [AGENTS.md](file:///c:/Users/Asus/Desktop/DevHack/AGENTS.md), [GAME.md](file:///c:/Users/Asus/Desktop/DevHack/GAME.md), [CONTEXT.md](file:///c:/Users/Asus/Desktop/DevHack/CONTEXT.md), [AI_USE.md](file:///c:/Users/Asus/Desktop/DevHack/AI_USE.md), and [DEMO.md](file:///c:/Users/Asus/Desktop/DevHack/DEMO.md).

The system proves the core product thesis:
> **Know the learner → decide what they should do next → change the game world accordingly.**

---

## User Review Required

> [!IMPORTANT]
> - **Zero-Asset Fragility**: In accordance with user selection, all 3D geometry (Hex Atrium, Dais, Wings, Robot Avatar, Laser Barrier, Kinetic Apparatuses) and sound effects are generated procedurally (React Three Fiber + Web Audio API). No external asset downloads or texture CDN dependencies will block loading.
> - **Dual-Mode LLM**: The 5-agent LangGraph workflow connects to Google Gemini API when `GEMINI_API_KEY` is present in `backend/.env`, but features an automated deterministic fallback generator so the entire system runs seamlessly offline or in offline hackathon environments.
> - **Hero Pitch Flow**: Student A (Advanced, Recursion unlocked) and Student B (Stack gap at 38%, Recursion locked) can be switched with one click in the top bar, alongside a "Simulate Mastery Jump (38% → 74%)" button that demonstrates the end-to-end BKT update, agent re-planning, and live 3D laser barrier dissolution in real time.

---

## Proposed Changes

### Backend (`backend/`)

Python 3.14 + FastAPI backend implementing the probabilistic BKT learner model, prerequisite Knowledge Graph, deterministic guardrails, 5-agent planner, and REST API.

#### [NEW] [requirements.txt](file:///c:/Users/Asus/Desktop/DevHack/backend/requirements.txt)
- `fastapi`, `uvicorn`, `pydantic`, `numpy`, `httpx`, `python-dotenv`.

#### [NEW] [app/learning/bkt.py](file:///c:/Users/Asus/Desktop/DevHack/backend/app/learning/bkt.py)
- Bayesian Knowledge Tracing engine:
  - Standard BKT parameters per concept: $P(L_0)$, $P(T)$, $P(G)$, $P(S)$.
  - Exact Bayesian belief update equations for correct/incorrect answers + learning transition.
  - Generates numerical mastery, classification (`novice`, `developing`, `mastered`), and step-by-step mathematical telemetry.

#### [NEW] [app/learning/knowledge_graph.py](file:///c:/Users/Asus/Desktop/DevHack/backend/app/learning/knowledge_graph.py)
- Prerequisite DAG:
  - `Arrays` → `Linked Lists` → `Stacks` → `Recursion` (threshold 0.70) → `Trees`.
  - Computes readiness, prerequisite gaps, and blocking concepts.

#### [NEW] [app/learning/policy.py](file:///c:/Users/Asus/Desktop/DevHack/backend/app/learning/policy.py)
- Deterministic educational guardrail:
  - Hard constraint: If student requests or is routed to Recursion when Stack mastery < 0.70, overrules decision to `REMEDIATE STACK`.
  - Verifies and certifies every agent decision before it reaches the game world.

#### [NEW] [app/agents/](file:///c:/Users/Asus/Desktop/DevHack/backend/app/agents/)
- `state.py`: Typed state model for agent pipeline.
- `context_agent.py`: Collects student mastery, current zone, recent interactions.
- `diagnostic_agent.py`: Identifies weak prerequisite concepts and failure patterns.
- `planner_agent.py`: Decides next action (`LEARN`, `PRACTICE`, `REMEDIATE`, `CHALLENGE`, `REVIEW`) with Gemini LLM + deterministic fallback.
- `validator_agent.py`: Enforces policy guardrails and records compliance traces.
- `game_agent.py`: Maps pedagogical decision to 3D world instructions (zones unlocked/locked, active mission, apparatus animations, AI mentor dialogue, conduit destination).
- `coordinator.py`: Bounded sequential workflow orchestrator producing structured telemetry.

#### [NEW] [app/game/mission_service.py](file:///c:/Users/Asus/Desktop/DevHack/backend/app/game/mission_service.py)
- Curated interactive DSA missions and challenges for Stack, Recursion, Arrays, Linked Lists:
  - Stack LIFO push/pop evaluation
  - Call stack frame tracing
  - Linked list pointer reconnection
  - Array indexing & lookup

#### [NEW] [app/db/store.py](file:///c:/Users/Asus/Desktop/DevHack/backend/app/db/store.py)
- Thread-safe repository pre-seeded with:
  - **Student A** (Arrays 0.92, Linked List 0.88, Stack 0.84, Recursion 0.72)
  - **Student B** (Arrays 0.90, Linked List 0.70, Stack 0.38, Recursion 0.20)

#### [NEW] [app/api/](file:///c:/Users/Asus/Desktop/DevHack/backend/app/api/)
- `students.py`: Switch/get student profiles.
- `world.py`: Fetch dynamic 3D world state (zones, barriers, conduit target).
- `interactions.py`: Process challenge submission → BKT update → agent re-planning → world delta + agent execution trace.
- `missions.py`: Fetch mission content and apparatus control parameters.
- `simulation.py`: One-click mastery jump & world reset endpoints.

#### [NEW] [app/main.py](file:///c:/Users/Asus/Desktop/DevHack/backend/app/main.py)
- FastAPI entrypoint with CORS middleware, router registrations, and startup health checks.

---

### Frontend (`frontend/`)

React + TypeScript + Vite + React Three Fiber + Tailwind CSS 3D cybernetic classroom.

#### [NEW] [package.json](file:///c:/Users/Asus/Desktop/DevHack/frontend/package.json)
- React 18/19, Three.js, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `zustand`, `lucide-react`, `tailwindcss`.

#### [NEW] [src/index.css](file:///c:/Users/Asus/Desktop/DevHack/frontend/src/index.css)
- Deep-tech cybernetic styling: Obsidian background `#0a0b10`, cyan `#00f0ff`, purple `#7928ca`, laser crimson `#ff0055`, glassmorphic panels with backdrop blur.

#### [NEW] [src/game/](file:///c:/Users/Asus/Desktop/DevHack/frontend/src/game/)
- `GameCanvas.tsx`: Three.js Canvas with Bloom, Chromatic Aberration, and directional cyber lighting.
- `GameWorld.tsx`: Assembles the 3D cybernetic environment:
  - **Hexagonal Atrium**: obsidian floor grid with radial corridors.
  - **Central Dais**: elevated circular dais with rotating 3D Knowledge Graph constellation (color-coded nodes) and AI Mentor hologram.
  - **Energy Conduits**: floor paths with glowing shader animation guiding the player to the recommended station.
- `Player/Avatar.tsx`: Procedural cybernetic robot avatar with third-person WASD translation, smooth heading rotation, and bobbing animation.
- `Camera/FollowCamera.tsx`: Damped orbital follow-camera, smoothly lerping to fixed cinematic framing when an apparatus console is engaged.
- `Zones/`:
  - `StackLab.tsx`: Glass cylinder apparatus with glowing metallic discs stamped with numbers; animated spring push & pop effects.
  - `RecursionLab.tsx`: Guarded by `PrerequisiteBarrier` (crimson laser forcefield) and floating `DiagnosticPlaque`. Triggers `BarrierDissolve` cyan particle explosion when Stack mastery reaches 70%! Inside: descending call-stack tower.
  - `LinkedListLab.tsx`: Nodes with animated bezier pointer beams.
  - `ArrayStation.tsx`: Indexed data blocks with active highlighting.

#### [NEW] [src/components/](file:///c:/Users/Asus/Desktop/DevHack/frontend/src/components/)
- `TopBar.tsx`: Student A / Student B switcher, "Simulate Mastery Jump (38% → 74%)" button, Reset button, Audio toggle, Telemetry drawer toggle.
- `ChallengeConsole.tsx`: Dual-layer glassmorphism console overlay when pressing `[E]` near a station apparatus, presenting the challenge, interactive choices/controls, and instant BKT feedback.
- `TelemetryDrawer.tsx` ("Agent Brain"): Collapsible inspector displaying:
  - 5-stage agent execution trace (Context → Diagnostic → Planner → Validator → Game)
  - Mathematical BKT step-by-step update calculation
  - "Why This Decision?" explainability card showing deterministic prerequisite rules
  - Knowledge graph prerequisite path
- `AIMentorDialogue.tsx`: Contextual dialogue when interacting with the AI Mentor on the dais.

#### [NEW] [src/utils/audio.ts](file:///c:/Users/Asus/Desktop/DevHack/frontend/src/utils/audio.ts)
- Procedural Web Audio API sound synthesizer: Harmonic chimes for correct answers, low buzz for incorrect/deflected barrier, and dynamic dissolve woosh when barriers unlock.

#### [NEW] [src/state/](file:///c:/Users/Asus/Desktop/DevHack/frontend/src/state/)
- `gameStore.ts`: Transient client state (avatar position, camera mode, near interactable, open modals, sound mute).
- `learnerStore.ts`: Authoritative state synced with FastAPI (mastery levels, unlocked zones, active mission, agent trace).

---

## Verification Plan

### Automated Tests
1. **BKT Unit Tests**:
   - Run pytest on BKT engine to verify correct calculation of mastery increase on success and decrease on slip/incorrect:
   ```bash
   pytest backend/tests/test_bkt.py
   ```
2. **Deterministic Guardrail Tests**:
   - Verify that when Stack mastery is < 0.70, any request for Recursion is rejected and overruled to `REMEDIATE STACK`:
   ```bash
   pytest backend/tests/test_guardrails.py
   ```
3. **Agent Workflow Integration Tests**:
   - Verify complete agent pipeline execution for Student A (unlocked) and Student B (remedial):
   ```bash
   pytest backend/tests/test_agents.py
   ```
4. **Frontend TypeScript & Build Verification**:
   - Verify zero TypeScript or bundling errors:
   ```bash
   npm --prefix frontend run build
   ```

### Manual Verification
1. **Hero Scenario 1 (Student B — Remedial)**:
   - Load app as Student B. Observe Recursion Lab is sealed by crimson laser barrier with floating Diagnostic Plaque ("Requires Stack ≥ 70%, Current: 38%").
   - Observe energy conduit lights leading to Stack Lab.
   - Walk avatar into Stack Lab, press `[E]` to open challenge console.
   - Solve Stack challenges. Watch BKT probability gauge increase step-by-step.
   - Observe barrier dissolve when crossing 70% threshold.
2. **Hero Scenario 2 (One-Click Demo Jump)**:
   - Click "Simulate Mastery Jump (38% → 74%)" on top bar.
   - Verify instant agent replan, barrier dissolution animation, and telemetry drawer trace.
3. **Hero Scenario 3 (Student A — Advanced)**:
   - Click "Student A". Observe Recursion Lab is already unlocked, conduit routes directly to Recursion Lab, and advanced challenge is available.
4. **Telemetry Inspection**:
   - Open "Agent Brain" drawer. Verify that Context Agent, Diagnostic Agent, Planner Agent, Validator Agent, and Game Agent traces are clearly visible with mathematical BKT formulas and explainability rationales.
