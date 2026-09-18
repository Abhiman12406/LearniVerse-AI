# Specification: 3D Adaptive Virtual Classroom Game Environment

## Problem Statement

Current educational coding games and tutoring platforms treat gamification as a superficial skin (badges, points, or static quizzes) attached to an inflexible curriculum. When students experience gaps in prerequisite knowledge (such as attempting recursion without understanding stacks), traditional platforms either let them fail repeatedly or require manual human intervention. Conversely, advanced students are forced through redundant introductory exercises. Furthermore, existing AI educational tools operate as detached chatbots that generate conversational advice without dynamically altering the physical learning environment itself.

Learners and instructors lack an immersive, visually responsive virtual classroom where the physical world, accessible laboratory zones, interactive machinery, and challenges dynamically reshape in direct response to verified learner mastery and prerequisite constraints.

## Solution

Build an Agentic AI-powered 3D Virtual Classroom Environment where the physical laboratory itself is the execution layer of an adaptive learning policy. 

Using React, Three.js, and React Three Fiber, the virtual classroom presents a sleek, deep-tech cybernetic facility featuring a central hexagonal hub with radiating concept wings (Array Station, Linked List Lab, Stack Lab, Recursion Lab, and Tree Lab). As a student moves through the world in third-person, their knowledge state is continuously tracked via Bayesian Knowledge Tracing (BKT) and a Neo4j prerequisite graph. 

Crucially, the game environment adapts in real time:
- Prerequisite gates (such as the Recursion Lab entrance) are physically sealed by glowing holographic laser forcefields displaying dynamic diagnostic status plaques.
- When an agentic planner detects a prerequisite deficiency, it physically redirects the learner to the required foundational station (e.g., Stack Lab), activates custom-tailored missions, and commands an in-world AI Mentor to provide contextual guidance.
- When the student successfully solves challenges and crosses the mastery threshold, the environment triggers a live unlocking event: the laser barrier flickers and dissolves into cyan energy particles, opening the advanced chamber.
- An integrated "Agent Brain" telemetry drawer allows judges, teachers, and developers to inspect the live multi-agent execution trace and explainability rationales alongside the 3D action.

---

## User Stories

### Student Persona
1. As a student, I want to control a 3D avatar with intuitive WASD and mouse-orbit controls, so that I can naturally explore the virtual classroom and discover learning stations.
2. As a student, I want to see a central 3D Holographic Knowledge Graph in the atrium, so that I can visually comprehend how data-structure concepts connect and see my mastery levels represented in real-time glowing colors.
3. As a student, I want to approach the AI Mentor on the central dais and press `[E]`, so that I can receive contextual advice and an explanation of my recommended next learning action.
4. As a student, I want to see pulsing floor energy conduits leading from the central hub to recommended stations, so that I always have clear spatial guidance on what to tackle next.
5. As a student, I want approaching a locked laboratory wing (e.g., Recursion Lab) to display an in-world holographic prerequisite plaque, so that I understand exactly which prerequisites are missing and why the door is sealed.
6. As a student, I want to interact with a lab console (e.g., Stack Lab) by pressing `[E]` to engage with a dual-layer console, so that the camera cinematically frames the 3D apparatus while a clean HTML glassmorphism panel presents the challenge.
7. As a student, I want to see real-time 3D physical animations (e.g., glowing data discs pushing into a magnetic cylinder) when I interact with the Stack Lab console, so that abstract LIFO principles become concrete visual mechanisms.
8. As a student, I want to see pointer energy beams connect and route between floating node capsules in the Linked List Lab, so that I can develop intuitive spatial mental models of pointer manipulation and references.
9. As a student, I want to see a descending holographic call-stack tower in the Recursion Lab, so that I can visualize stack-frame accumulation and unwinding toward base-case termination.
10. As a student, I want immediate visual and audio feedback (harmonic chimes for correct answers, low-frequency hums for errors) when submitting answers, so that I stay engaged and aware of my progress.
11. As a student, I want to witness the locked laser barrier flicker, dissolve into cyan energy particles, and unlock when my mastery crosses the prerequisite threshold, so that I feel a strong sense of achievement and progression.
12. As a student, I want to have a global audio mute toggle on my HUD, so that I can silence environmental sound effects whenever I am in a quiet environment.

### Presenter & Judge Persona
13. As a hackathon judge or pitch evaluator, I want an instant Student A / Student B switcher in the top bar, so that I can immediately observe how two students with different mastery profiles experience two completely different world configurations.
14. As a presenter, I want to click a "Simulate Mastery Jump" button during a live 2-minute pitch, so that I can demonstrate the end-to-end BKT update, agent re-planning, and dramatic 3D gate dissolve animation without being stalled by manual typing.
15. As a presenter, I want a "Reset Seed" button, so that I can reliably return the virtual classroom to its initial demonstration state between judging rounds.
16. As a judge, I want to open an "Agent Brain & Judge Telemetry" drawer, so that I can inspect the multi-agent pipeline trace (`Context Agent` → `Diagnostic Agent` → `Planner Agent` → `Validator` → `Game Agent`) in real time.
17. As a judge, I want to inspect a "Why This Decision?" explainability card in the telemetry drawer, so that I can verify that educational decisions are strictly governed by deterministic prerequisite policies rather than hallucinated by an unconstrained LLM.
18. As a judge, I want to see numerical BKT probability gauges and Neo4j prerequisite paths alongside the 3D game canvas, so that the underlying learning science rigor is immediately apparent.

### Developer & Administrator Persona
19. As a developer, I want all architectural geometry, forcefield shaders, and data-structure apparatuses to be procedurally generated in React Three Fiber, so that the application loads instantly without missing asset files, heavy texture downloads, or CORS errors.
20. As a developer, I want the client-backend communication to use structured REST endpoints with world-delta payloads, so that the game state remains robust and deterministic even on unstable presentation Wi-Fi networks.
21. As a developer, I want an optional Server-Sent Events (SSE) stream for agent execution logs, so that live multi-agent reasoning steps stream into the telemetry drawer without the overhead and disconnection vulnerabilities of bidirectional WebSockets.
22. As a developer, I want strict decoupling between transient game state (avatar position, camera angle, particle animations) and authoritative learning state (BKT mastery, interaction log, prerequisite graph), so that no educational mastery calculation can ever be tampered with on the client.

---

## Implementation Decisions

### 1. Architectural Layout & Spatial Coordinates
- **Hub-and-Spoke Hexagonal Atrium**: A central circular hall with a radius of 18 units centered at origin `(0, 0, 0)`.
- **Radial Wing Alignment**:
  - `Array Station`: North-East archway (azimuth 30°), coordinates `(12, 0, -20)`.
  - `Linked List Lab`: East archway (azimuth 90°), coordinates `(24, 0, 0)`.
  - `Stack Lab`: South-East archway (azimuth 150°), coordinates `(12, 0, 20)`.
  - `Recursion Lab (Dungeon Wing)`: North-West archway (azimuth 270°), coordinates `(-24, 0, 0)`, sealed by default for remedial profiles.
  - `Tree Lab (Stretch Wing)`: South-West archway (azimuth 210°), coordinates `(-12, 0, 20)`.
- **Central Dais**: Elevated platform at `(0, 0.5, 0)` holding the rotating 3D Knowledge Graph constellation and AI Mentor NPC anchor point `(2, 0.5, 2)`.

### 2. Camera & Control System
- **Third-Person Controller**:
  - Uses standard WASD keys for character translation and pointer-lock mouse drag for spherical camera orbit.
  - Spherical coordinate follow-camera maintaining a distance of 6 units and pitch angle of 25° behind the avatar.
  - Camera lerping: Smooth transition (damping factor 0.08) between exploration follow-cam and fixed cinematic station framing cameras upon console activation.

### 3. Visual Styling & Post-Processing Pipeline
- **Palette & Finishes**:
  - Structural Shell: Deep obsidian (`#0a0b10`) and dark slate navy (`#121520`).
  - Conduit Tracks: Floor paths etched with glowing emissive lines (`#00f0ff` cyan and `#7928ca` violet).
  - Prerequisite Barriers: Crimson laser grids (`#ff0055`) with high emissive intensity.
  - Mastery Nodes: Color-mapped to BKT probabilities: Crimson (`< 0.45`), Amber (`0.45 - 0.70`), Cyan/Emerald (`≥ 0.70`).
- **Post-Processing**: React Three Fiber `@react-three/postprocessing` pipeline incorporating Selective Bloom (`luminanceThreshold: 0.8`, `intensity: 1.5`), Chromatic Aberration on barrier contacts, and Vignette.

### 4. 3D Apparatus & Animation Metaphors
- **Stack Apparatus**: A vertical transparent glass-and-brass cylinder with an open top. Data elements are represented as glowing metallic discs stamped with value labels. Pushing animates a disc dropping from above with damped spring physics; popping lifts the topmost disc and dissolves it into sparks.
- **Linked List Apparatus**: Raised pedestals holding horizontal capsule containers (data payload + pointer socket). Connecting nodes fires a continuous bezier particle beam between output sockets and successor input ports.
- **Recursion Apparatus**: A vertical holographic projection matrix that spawns descending rectangular call-stack frames. When a recursive condition branches, frames duplicate downward; upon hitting base case, frames flash bright gold and collapse upward.

### 5. Client State & World Synchronization Contract
- Transient game state is managed via Zustand stores on the frontend, separated cleanly from persistent learning state.
- **State Shape (Prototype Model)**:
```typescript
interface ClientWorldState {
  studentId: string;
  activeZone: "atrium" | "array_station" | "linked_list_lab" | "stack_lab" | "recursion_lab" | "tree_lab";
  zones: Record<string, {
    unlocked: boolean;
    reason?: string;
    requiredMastery?: Record<string, number>;
  }>;
  activeMission: {
    id: string;
    concept: string;
    difficulty: "easy" | "medium" | "hard";
    title: string;
    description: string;
    questions: Array<{
      id: string;
      prompt: string;
      options: string[];
      difficulty: number;
    }>;
  } | null;
  mastery: Record<string, number>;
  agentTrace: {
    contextSummary: string;
    plannerDecision: string;
    policyReason: string;
    timestamp: string;
  } | null;
}
```
- **REST Interaction Flow**:
  - `POST /api/interactions`: Payload `{ student_id, question_id, concept, answer, response_time_ms }`.
  - Response synchronously returns `{ correct, new_mastery, world_delta: { unlocked_zones, new_mission, agent_trace } }`.
  - Receiving a new zone in `unlocked_zones` immediately triggers the local particle dissolution and barrier power-down sequence for that gate.

### 6. Sound Architecture
- Web Audio API procedural synthesis for micro-interactions:
  - Base ambient hum: Twin low-frequency sine oscillators (55Hz / 110Hz) with gentle lowpass filtering.
  - Push/Pop action: Bandpass filtered white noise burst with rapid pitch decay (magnetic/pneumatic thud).
  - Prerequisite gate unlock: Ascending pentatonic synth arpeggio (C4-E4-G4-B4-D5) with reverberant delay.
  - UI clicks: Short 10ms high-frequency chirps (1200Hz).
  - Global master gain node connected to the HUD mute toggle button.

### 7. Presenter Hero Demo Interface
- Floating top overlay bar featuring:
  - `[Student A (Advanced - Recursion Ready)]`: Injects seed `{ array: 0.92, linked_list: 0.88, stack: 0.84, recursion: 0.72 }`, setting Recursion Lab unlocked with an emerald aura.
  - `[Student B (Remedial - Stack Deficient)]`: Injects seed `{ array: 0.90, linked_list: 0.70, stack: 0.38, recursion: 0.20 }`, sealing Recursion Lab with a crimson forcefield and pointing conduits to Stack Lab.
  - `[Simulate Mastery Jump]`: Simulates a perfect Stack mission answer streak, stepping Stack BKT from 0.38 → 0.55 → 0.74, instantly triggering the agent re-evaluation and live Recursion forcefield power-down.
  - `[Reset World]`: Restores initial clean demonstration conditions.

---

## Testing Decisions

### Seam Architecture
The entire 3D Virtual Classroom feature will be tested at the **Client-Backend Adaptive Session Seam**.

By interfacing at the point where user interactions generate API interaction payloads and return world-delta states to the Zustand store, tests verify that external behavioral contracts hold without depending on Three.js canvas rendering internals:

1. **Prerequisite Enforcement Seam**:
   - Given Student B (Stack: 0.38), mounting the session must yield `zones.recursion_lab.unlocked === false`.
   - Attempting to trigger an enter event on Recursion Lab must emit a prerequisite blockage notification with exact prerequisite gap details.
2. **Dynamic Adaptation & Unlock Seam**:
   - Submitting a correct interaction payload for Stack Lab that raises mastery above 0.70 must result in `world_delta.unlocked_zones` containing `"recursion_lab"`.
   - The client store must update `zones.recursion_lab.unlocked` to `true` and transition the gate entity state from `SEALED` to `DISSOLVING` to `OPEN`.
3. **Agent Explainability Seam**:
   - Every state transition must supply a non-empty `agentTrace` payload containing the deterministic policy rule applied (e.g., `"Stack mastery 0.38 < 0.70 prerequisite threshold"`).
4. **Student Profile Independence**:
   - Switching from Student B to Student A must replace world state immediately without residual lock states from the previous profile.

### Test Characteristics
- Tests must assert observable external state and API payloads, not internal Three.js matrix transforms or canvas draw calls.
- Automated tests will use Vitest / React Testing Library for store and HUD component assertions, with mock API handlers verifying the REST contract.

---

## Out of Scope

- Massive multi-room open world exploration or external terrain.
- Multiplayer networking, shared avatar synchronizations, or real-time student-to-student chat.
- Complex rigid-body Havok/Rapier ragdoll physics.
- Voice-to-voice streaming LLM integration (text dialogue with Web Audio sound cues is the target).
- Full LMS integrations (SCORM/xAPI/Canvas LMS exports).
- Item Response Theory (IRT) parameter estimation pipelines (reserved for post-MVP; BKT with fixed parameters is authoritative).

---

## Further Notes

- All 3D procedural components must have bounding-box frustum culling enabled to maintain 60 FPS on standard integrated laptop GPUs.
- The `Agent Brain` drawer should default to collapsed on mobile/small viewports and open on desktop viewports to give judges maximum visibility into the agent architecture.
- For hackathon presentations, the entire demonstration can be completed in under 90 seconds using the Presenter Hero Demo Bar while still highlighting the core innovation: *the virtual world physically adapts based on agentic learning policy decisions.*
