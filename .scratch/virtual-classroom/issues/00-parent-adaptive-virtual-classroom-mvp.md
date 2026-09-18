---
id: "01"
title: "Agentic AI Adaptive Learning Virtual Classroom MVP"
triage: "ready-for-agent"
created_at: "2026-09-17T19:32:00Z"
---

## Problem Statement

Educational coding games and intelligent tutoring systems treat gamification and AI as superficial attachments to an inflexible curriculum. When learners encounter prerequisite gaps (such as attempting recursion without understanding stacks), existing platforms either let them fail repeatedly or require manual human intervention. Conversely, advanced learners are subjected to redundant introductory exercises. Furthermore, existing AI educational tools function primarily as detached chatbots that generate conversational advice without dynamically altering the physical learning environment itself.

Learners and instructors lack an immersive virtual classroom where the physical 3D architecture, wing access barriers, kinetic apparatuses, and missions dynamically adapt in direct response to verified learner mastery and prerequisite constraints.

## Solution

Build an Agentic AI-powered 3D Virtual Classroom where the physical cybernetic laboratory itself serves as the execution layer of an adaptive learning policy.

The virtual classroom features a central hexagonal Atrium connecting radial subject Wings (Array Station, Linked List Lab, Stack Lab, Recursion Lab, and Tree Lab). As a learner navigates the environment using a third-person Avatar, their knowledge state is continuously evaluated through Bayesian Knowledge Tracing (BKT) and a prerequisite Knowledge Graph.

The environment adapts in real time:
- Advanced Wings (such as the Recursion Lab) are physically sealed by glowing crimson Prerequisite Barriers accompanied by floating Diagnostic Plaques detailing missing prerequisite mastery thresholds.
- When an Agentic Planner detects a Prerequisite Gap, it directs the learner to the required foundational Station (e.g., Stack Lab), activates custom-tailored Missions, commands floor Conduits to pulse with light toward the target, and prompts the in-world AI Mentor on the Central Dais to provide contextual guidance and Feynman-style conceptual breakdowns.
- When the learner solves Challenges and crosses the required Mastery threshold, the environment triggers a live Barrier Dissolve: the Prerequisite Barrier flickers and disintegrates into sparkling cyan energy particles.
- An integrated Telemetry Drawer enables evaluators to inspect the live 5-agent deliberation trace, mathematical BKT updates, and deterministic guardrail justifications alongside the 3D action.

---

## Tracer-Bullet Vertical Slice Roadmap (10 Atomic Issues)

To enable reliable, incremental development with zero-fragility execution and strict compliance with [ASSETS.md](file:///c:/Users/Naren/Desktop/DevHack/ASSETS.md), the MVP is divided into 10 tracer-bullet vertical slices:

1. **[01: Core Navigable Atrium, Central Dais & Learner Profile Switcher](file:///c:/Users/Naren/Desktop/DevHack/.scratch/virtual-classroom/issues/01-core-navigable-atrium-and-learner-profile.md)**
2. **[02: Prerequisite Barrier & In-World Floating Diagnostic Plaque](file:///c:/Users/Naren/Desktop/DevHack/.scratch/virtual-classroom/issues/02-prerequisite-barrier-and-diagnostic-plaque.md)**
3. **[03: Central Dais AI Mentor Beacon & Contextual Feynman Guidance](file:///c:/Users/Naren/Desktop/DevHack/.scratch/virtual-classroom/issues/03-ai-mentor-and-feynman-guidance.md)**
4. **[04: Conduit Guidance & Stack Lab Kinetic 3D Apparatus](file:///c:/Users/Naren/Desktop/DevHack/.scratch/virtual-classroom/issues/04-conduit-guidance-and-stack-lab-apparatus.md)**
5. **[05: Dual-Layer Glassmorphic Challenge Console & Stack DSA Missions](file:///c:/Users/Naren/Desktop/DevHack/.scratch/virtual-classroom/issues/05-challenge-console-and-dsa-content.md)**
6. **[06: BKT Bayesian Knowledge Tracing Engine & Interaction Loop](file:///c:/Users/Naren/Desktop/DevHack/.scratch/virtual-classroom/issues/06-bkt-engine-and-interaction-loop.md)**
7. **[07: Procedural Web Audio Synthesis & Live Barrier Dissolve Particle Shockwave](file:///c:/Users/Naren/Desktop/DevHack/.scratch/virtual-classroom/issues/07-web-audio-and-barrier-dissolve.md)**
8. **[08: 5-Agent LangGraph Deliberation Pipeline & Deterministic Guardrails](file:///c:/Users/Naren/Desktop/DevHack/.scratch/virtual-classroom/issues/08-multi-agent-deliberation-and-guardrails.md)**
9. **[09: Slide-Out Telemetry Drawer & Explainability Inspector](file:///c:/Users/Naren/Desktop/DevHack/.scratch/virtual-classroom/issues/09-telemetry-drawer-and-explainability-inspector.md)**
10. **[10: End-to-End Reactive Loop Integration & Hero Pitch Demonstration](file:///c:/Users/Naren/Desktop/DevHack/.scratch/virtual-classroom/issues/10-end-to-end-reactive-loop-and-hero-pitch.md)**


---

## User Stories

### Learner Persona
1. As a learner, I want to control a 3D Avatar using standard WASD and mouse-orbit controls, so that I can intuitively navigate the Atrium and discover Stations.
2. As a learner, I want to view a rotating 3D holographic Knowledge Graph on the Central Dais, so that I can spatially comprehend concept dependencies and visually recognize my Mastery levels via dynamic glowing node colors.
3. As a learner, I want to approach the AI Mentor on the Central Dais and press `[E]`, so that I can receive contextual narrative guidance, understand my next recommended learning objective, and explore Feynman-style conceptual explanations.
4. As a learner, I want to observe pulsating floor Conduits radiating from the Atrium, so that I have clear navigational guidance directing my Avatar toward the recommended Station.
5. As a learner, I want an energized Prerequisite Barrier with a floating Diagnostic Plaque to block my entrance when approaching a locked Wing (e.g., Recursion Lab), so that I immediately see which foundational concept is deficient and what Mastery percentage is required.
6. As a learner, I want to interact with a Station Console by pressing `[E]`, so that the camera cinematically frames the kinetic Apparatus while a dual-layer glassmorphic Console presents the active Challenge.
7. As a learner, I want to see real-time 3D animations (glowing metallic data discs pushing and popping with spring physics) on the Stack Apparatus, so that abstract LIFO principles become concrete mechanical intuitions.
8. As a learner, I want to see animated bezier energy beams connect floating node capsules on the Linked List Apparatus, so that pointer dereferencing and node linkages become visually tangible.
9. As a learner, I want to see a cascading holographic call-stack tower on the Recursion Apparatus, so that frame accumulation, branching, and unwinding toward the base case are visually reinforced.
10. As a learner, I want immediate audio-visual feedback (harmonic chimes for correct submissions, low-frequency cyber hums for incorrect attempts) upon submitting Challenge solutions, so that I stay engaged and clearly understand my outcome.
11. As a learner, I want to witness a dramatic Barrier Dissolve animation when my Mastery crosses the prerequisite threshold, so that my academic progress is rewarded with environmental transformation and newly unlocked territory.
12. As a learner, I want a global audio toggle on the HUD, so that I can silence environmental sound effects whenever operating in sound-sensitive settings.

### Presenter & Evaluator Persona
13. As an evaluator, I want an instant Learner A / Learner B profile switcher on the top navigation bar, so that I can immediately observe how two learners with divergent Mastery profiles experience two completely different world configurations.
14. As a presenter, I want a single-click "Simulate Mastery Jump (38% → 74%)" control, so that I can trigger an end-to-end BKT update, agent re-planning, and dramatic Barrier Dissolve animation during a rapid two-minute pitch without requiring manual input.
15. As a presenter, I want a "Reset Seed" control, so that I can reliably restore the virtual classroom to its initial demonstration state between demonstration sessions.
16. As an evaluator, I want to expand an "Agent Brain & Telemetry Drawer", so that I can inspect the live 5-agent deliberation trace (`Context Agent` → `Diagnostic Agent` → `Planner Agent` → `Validator Agent` → `Game Agent`) in real time.
17. As an evaluator, I want to examine an explainability card within the Telemetry Drawer, so that I can verify educational recommendations are certified by deterministic prerequisite guardrails rather than unconstrained LLM hallucinations.
18. As an evaluator, I want to view mathematical BKT belief calculations ($P(L_{t-1}) \to P(L_t)$) with explicit slip and guess parameters, so that the pedagogical rigor underlying the learning model is transparent and provable.

### System & Engineering Persona
19. As an engineer, I want all architectural geometry, forcefield shaders, and Apparatus models to be procedurally constructed in React Three Fiber, so that the 3D application loads instantaneously without external asset-file dependencies, CDN latency, or CORS failures.
20. As an engineer, I want authoritative educational state (BKT probabilistic mastery, interaction logs, prerequisite rules) to reside strictly on the backend, so that learning assessments cannot be tampered with on the client.
21. As an engineer, I want client-backend communication to use structured REST world-delta payloads, so that synchronization remains reliable even across fluctuating presentation networks.
22. As an engineer, I want procedural Web Audio API synthesis for all sound effects, so that acoustic feedback functions reliably without external audio asset downloads.
23. As an engineer, I want a dual-mode LLM integration that uses live Gemini models when configured with an API key and seamlessly falls back to a deterministic structured generator when offline, ensuring 100% operational uptime.

---

## Domain Terminology Enforcement

All implementation issues strictly conform to [CONTEXT.md](file:///c:/Users/Naren/Desktop/DevHack/CONTEXT.md):
- **Learner** (avoid: Student, user, client, player)
- **Avatar** (avoid: Character, player model, pawn)
- **Atrium** (avoid: Hub, lobby, central room, main hall)
- **Wing** (avoid: Zone, room, chamber, sector, branch)
- **Station** (avoid: Terminal, kiosk, desk, lab)
- **Central Dais** (avoid: Stage, podium, altar, platform)
- **Conduit** (avoid: Wire, path, trail, waypoint, track)
- **Apparatus** (avoid: Machine, widget, 3D object, simulation)
- **Console** (avoid: Screen, panel, terminal, popup)
- **Challenge** (avoid: Question, problem, test item, quiz)
- **Mission** (avoid: Task, quest, assignment, module)
- **Mastery** (avoid: Score, grade, progress, level)
- **Prerequisite Gap** (avoid: Deficiency, blocker, failure, deficit)
- **Knowledge Graph** (avoid: Skill tree, concept map, curriculum graph)
- **Prerequisite Barrier** (avoid: Door, gate, wall, laser fence, forcefield)
- **Diagnostic Plaque** (avoid: Sign, billboard, notice, warning plaque)
- **Barrier Dissolve** (avoid: Gate unlock, door open, deactivation)
- **AI Mentor** (avoid: Bot, NPC, tutor, assistant)
- **Telemetry Drawer** (avoid: Debug panel, admin panel, log viewer, inspector)

---

## Verification & Pitch Demonstration Script

- **Minute 0:00 - 0:40**: Switch to Learner B. Show Recursion Lab sealed by crimson Prerequisite Barrier with Diagnostic Plaque. Highlight pulsing Conduit to Stack Lab.
- **Minute 0:40 - 1:15**: Avatar enters Stack Lab. Press `[E]`, solve Stack push/pop Challenge on the Console. Show BKT gauge climbing and Apparatus disc animations.
- **Minute 1:15 - 1:45**: Trigger "Simulate Mastery Jump (38% → 74%)". Camera frames the Recursion Lab as the laser grid violently flickers and dissolves into cyan energy particles.
- **Minute 1:45 - 2:00**: Open "Agent Brain" Telemetry Drawer to present the 5-agent deliberation trace, BKT mathematics, and deterministic guardrail proof.
