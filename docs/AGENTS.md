# Agents.md — Adaptive Agentic Learning Virtual Classroom MVP

## 0. Mission

Build a complete, demonstrable MVP of an **Agentic AI-powered Adaptive Learning Virtual Classroom**.

### Core product thesis

> **Know the learner → decide what they should do next → change the game world accordingly.**

The MVP must prove that two students with different knowledge states can enter the same virtual classroom and receive different, explainable learning experiences.

### Primary domain for the MVP

Use **Data Structures** as the initial subject.

Recommended concept progression:

```text
Arrays
   ↓
Linked Lists
   ↓
Stacks
   ↓
Recursion
   ↓
Trees
```

The prerequisite graph is intentionally small. Do not attempt to support every data-structures topic.

---

# 1. MVP Scope — Exactly 3 Core Features

Do not add additional core product features until these three work end-to-end.

## Feature 1 — Adaptive Learner + Prerequisite Model

### Purpose

Continuously estimate what the learner knows and identify prerequisite gaps.

### Technology

- Python
- FastAPI
- PostgreSQL
- BKT implementation using Python/NumPy
- Neo4j for prerequisite relationships

### Output

For every student and concept:

```json
{
  "student_id": "S001",
  "concept": "stack",
  "mastery": 0.38,
  "status": "weak",
  "updated_at": "..."
}
```

The Knowledge Graph must support questions such as:

- What are the prerequisites of this concept?
- Which prerequisite is currently weak?
- Is the student ready for the target concept?

---

## Feature 2 — Agentic Adaptive Learning Planner

### Purpose

Use learner state + prerequisite information + recent performance to determine the student's next best learning action.

### Technology

- Python
- LangGraph
- LLM API
- Structured JSON outputs
- Deterministic policy checks

### Possible actions

```text
LEARN
PRACTICE
REMEDIATE
CHALLENGE
REVIEW
```

Example decision:

```json
{
  "action": "REMEDIATE",
  "concept": "stack",
  "difficulty": "easy",
  "reason": "Stack mastery is 0.38 and Stack is a prerequisite for Recursion."
}
```

### Critical rule

The LLM must not be the source of truth for mastery.

Use:

```text
BKT → learner state
Neo4j → prerequisites
Policy/Planner → decision
LLM → reasoning, language, mission narrative
```

---

## Feature 3 — Adaptive Game Environment

### Purpose

Turn the planner's decision into an actual change in the game world.

This is the main product USP.

The game must not be a static educational UI with an AI chatbot attached.

The environment itself must adapt.

Examples:

```text
Low Stack mastery
        ↓
Stack Lab unlocked
        ↓
Easy Stack mission
        ↓
NPC hint available
```

versus:

```text
High Stack mastery
        ↓
Skip basic Stack mission
        ↓
Recursion Lab door unlocked
        ↓
Advanced challenge
```

### Technology

- React
- Three.js
- React Three Fiber
- Drei
- Blender for optional 3D assets
- WebSocket or REST for game/backend communication
- FastAPI backend

---

# 2. Product Architecture

```text
                         STUDENT
                            │
                            ▼
                 ┌─────────────────────┐
                 │   GAME CLIENT       │
                 │ React + Three.js    │
                 │ React Three Fiber   │
                 └──────────┬──────────┘
                            │
                   game events / answers
                            │
                            ▼
                 ┌─────────────────────┐
                 │     FastAPI API     │
                 └──────────┬──────────┘
                            │
            ┌───────────────┼────────────────┐
            ▼               ▼                ▼
      PostgreSQL           BKT             Neo4j
      app/game data    learner state    prerequisite KG
            │               │                │
            └───────────────┼────────────────┘
                            ▼
                  ┌──────────────────┐
                  │ LangGraph        │
                  │ Agent Workflow   │
                  └────────┬─────────┘
                           │
                ┌──────────┼───────────┐
                ▼          ▼           ▼
             Context     Planner     Game
              Agent       Agent      Agent
                │          │           │
                └──────────┼───────────┘
                           ▼
                    Structured Decision
                           │
                           ▼
                    🎮 Game World
                           │
                           ▼
                    Student Action
                           │
                           └──────────────→ BKT update
```

---

# 3. Technology Stack

## Frontend / Game

### Required

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- Drei

### Recommended supporting libraries

- Zustand — game/client state
- React Router — application routing
- Tailwind CSS — normal UI panels
- Recharts — optional learner/progress visualizations

### Why React Three Fiber

It lets the team combine normal web UI with a 3D game environment.

Use HTML/React for:

- menus
- mission panels
- mastery indicators
- NPC dialogue
- question interfaces
- explanations

Use Three.js for:

- world
- player
- camera
- buildings
- portals
- NPCs
- interactive objects
- locked/unlocked zones

---

# 4. Game Development Strategy

## Do NOT build a large open world.

Build one small, polished **3D adaptive virtual classroom / learning laboratory**. The classroom should be visually engaging, but every major object must have a learning or adaptation purpose.

Recommended progression inside the classroom:

```text
                    🚪 TREE LAB
                         ▲
                         │
                  🚪 RECURSION LAB
                         ▲
                         │
                     🚪 STACK LAB
                         ▲
                         │
                🚪 LINKED LIST LAB
                         ▲
                         │
                   🚪 ARRAY STATION
```

These are learning areas inside the same classroom. **Concept Doors** make prerequisite relationships visible instead of turning the product into a conventional level-based game.

Each learning area has:

- a learning objective;
- interactive objects;
- missions;
- questions/challenges;
- prerequisite rules;
- mastery threshold;
- locked/unlocked/active/completed state.

---

# 5. Classroom Learning Areas

## 5.1 Array Station

Theme: an interactive storage/indexing station.

Learning interactions:

- identify array index;
- access an element;
- insert/update an element;
- find an element;
- answer complexity questions.

Visual metaphor:

```text
[10] [20] [30] [40] [50]
 0    1    2    3    4
```

---

## 5.2 Linked List Lab

Theme: an interactive node-and-connection laboratory.

Visual:

```text
[10] → [20] → [30] → [40] → NULL
```

Game interaction:

Student repairs broken links, rearranges nodes, or chooses the correct next node.

---

## 5.3 Stack Lab

Theme: a vertical data-structure simulator built into the classroom.

Visual:

```text
      [C]  ← TOP
      [B]
      [A]
    ───────
   PUSH / POP
```

Core concepts:

- push;
- pop;
- peek;
- LIFO;
- overflow/underflow;
- stack applications.

Game interaction:

Student manipulates elements using push/pop controls and solves increasingly complex stack tasks.

---

## 5.4 Recursion Lab

Theme: a visualization laboratory for nested function calls.

Visual metaphor:

```text
f(4)
 ↓
f(3)
 ↓
f(2)
 ↓
f(1)
 ↓
BASE CASE
 ↑
RETURN
```

Core concepts:

- base case;
- recursive case;
- call stack;
- tracing recursive calls.

Important prerequisite:

```text
Stack → prerequisite → Recursion
```

If Stack mastery is below threshold, the Recursion Lab Door remains locked and the classroom redirects the student to Stack Lab.

---

## 5.5 Tree Lab

Theme: an interactive hierarchical data-structure laboratory.

Visual:

```text
           50
         /    \
       30      70
      /  \    /  \
    20   40  60   80
```

This is a stretch area. Do not build it before the Array → Stack → Recursion vertical slice works.

---

# 6. Game Architecture

Create separate modules.

```text
frontend/
├── src/
│   ├── game/
│   │   ├── GameCanvas.tsx
│   │   ├── GameWorld.tsx
│   │   ├── Player/
│   │   ├── Camera/
│   │   ├── Zones/
│   │   ├── NPCs/
│   │   ├── Missions/
│   │   ├── Interactions/
│   │   ├── Portals/
│   │   └── effects/
│   │
│   ├── components/
│   │   ├── MissionPanel/
│   │   ├── MasteryPanel/
│   │   ├── DialoguePanel/
│   │   └── QuestionPanel/
│   │
│   ├── state/
│   │   ├── gameStore.ts
│   │   └── studentStore.ts
│   │
│   └── api/
│       └── client.ts
```

Do not put all game logic into one React component.

---

# 7. Game State Model

The game must have a clear state object.

Example:

```typescript
interface GameState {
  currentZone: string;
  unlockedZones: string[];
  activeMission: string | null;
  missionDifficulty: "easy" | "medium" | "hard";
  npcState: Record<string, string>;
  playerPosition: {
    x: number;
    y: number;
    z: number;
  };
}
```

The backend should remain the source of truth for learning state.

The frontend owns transient presentation/game state.

---

# 8. Event-Driven Game Design

Every important student interaction should produce an event.

Example:

```json
{
  "event_type": "QUESTION_ANSWERED",
  "student_id": "S001",
  "concept": "stack",
  "question_id": "Q17",
  "correct": false,
  "response_time_ms": 8400,
  "difficulty": 0.35,
  "mission_id": "stack_intro_02"
}
```

Other events:

```text
MISSION_STARTED
MISSION_COMPLETED
QUESTION_ANSWERED
NPC_INTERACTED
ZONE_ENTERED
HINT_REQUESTED
CHALLENGE_FAILED
CHALLENGE_COMPLETED
```

The backend converts these into learner-model updates.

---

# 9. Backend Architecture

Use:

```text
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── students.py
│   │   ├── assessment.py
│   │   ├── learning.py
│   │   ├── game.py
│   │   └── missions.py
│   │
│   ├── agents/
│   │   ├── graph.py
│   │   ├── state.py
│   │   ├── context_agent.py
│   │   ├── planner_agent.py
│   │   └── game_agent.py
│   │
│   ├── learning/
│   │   ├── bkt.py
│   │   ├── prerequisite.py
│   │   └── policy.py
│   │
│   ├── game/
│   │   ├── mission_service.py
│   │   ├── world_service.py
│   │   └── event_service.py
│   │
│   ├── db/
│   │   ├── models.py
│   │   ├── postgres.py
│   │   └── neo4j.py
│   │
│   └── schemas/
│       ├── student.py
│       ├── learning.py
│       ├── game.py
│       └── agents.py
```

---

# 10. Database Design

## PostgreSQL tables

Minimum tables:

### students

```text
id
name
created_at
```

### concepts

```text
id
name
description
```

### questions

```text
id
concept_id
text
difficulty
correct_answer
explanation
```

### interactions

```text
id
student_id
question_id
concept_id
correct
response_time
timestamp
```

### mastery

```text
id
student_id
concept_id
mastery
updated_at
```

### missions

```text
id
concept_id
name
difficulty
type
content
```

### game_sessions

```text
id
student_id
current_zone
active_mission
game_state
```

### agent_decisions

```text
id
student_id
action
concept
difficulty
reason
timestamp
```

Store agent decisions for explainability and debugging.

---

# 11. Knowledge Graph

Use Neo4j.

Minimum nodes:

```text
(:Concept {id, name})
```

Relationships:

```text
(:Concept)-[:PREREQUISITE_OF]->(:Concept)
```

Example:

```text
Arrays
  -[:PREREQUISITE_OF]->
LinkedList

LinkedList
  -[:PREREQUISITE_OF]->
Stack

Stack
  -[:PREREQUISITE_OF]->
Recursion
```

Optional:

```text
Concept → TESTED_BY → Question
Concept → IMPLEMENTED_BY → Mission
```

Do not overbuild the graph.

---

# 12. BKT Implementation

Implement a simplified Bayesian Knowledge Tracing model.

For each concept maintain:

```text
P(L0) = initial probability learner already knows concept
P(T)  = probability of learning after opportunity
P(G)  = probability of guessing correctly
P(S)  = probability of slipping
```

A practical MVP configuration can use fixed parameters per concept.

The exact parameters are less important than demonstrating the dynamic update.

## Interaction flow

```text
Question answered
      ↓
Correct / incorrect
      ↓
BKT update
      ↓
New mastery probability
      ↓
Persist to PostgreSQL
```

Example:

```text
Stack mastery
0.30
 ↓ correct
0.43
 ↓ correct
0.56
 ↓ incorrect
0.51
```

Always display this as an estimate, not absolute truth.

---

# 13. Readiness / Prerequisite Logic

Create a deterministic readiness service.

Example:

```python
def is_ready(student_mastery, prerequisites, threshold=0.70):
    for prerequisite in prerequisites:
        if student_mastery.get(prerequisite, 0) < threshold:
            return False
    return True
```

The Planner Agent should never be allowed to override hard prerequisite constraints without an explicit policy.

Example:

```text
Recursion requested
        ↓
Check Stack mastery
        ↓
Stack < 0.70
        ↓
REMEDIATE STACK
```

This is more reliable than asking an LLM whether the student is ready.

---

# 14. Agentic AI Architecture

Use LangGraph.

## Keep the first implementation to 3 logical agents

### Agent 1 — Context/Learner Agent

Responsibilities:

- gather mastery
- gather recent interactions
- identify weak concepts
- retrieve prerequisites
- produce a structured learner context

Example:

```json
{
  "student_id": "S001",
  "target_concept": "recursion",
  "mastery": {
    "stack": 0.38,
    "recursion": 0.22
  },
  "blocking_prerequisite": "stack"
}
```

---

## Agent 2 — Planner Agent

Responsibilities:

- decide next learning action
- choose target concept
- choose difficulty
- explain decision

Input:

```text
Learner context
+
Knowledge graph
+
Learning objective
+
Recent performance
```

Output:

```json
{
  "action": "REMEDIATE",
  "concept": "stack",
  "difficulty": "easy",
  "reason": "Stack is a prerequisite for recursion and current mastery is below threshold."
}
```

Use structured output.

Never parse free-form prose when a decision can be represented as JSON.

---

## Agent 3 — Game/Mission Agent

Responsibilities:

- map planner decision to a game action
- select or generate a mission
- choose NPC dialogue
- determine environment state
- return structured game instructions

Example:

```json
{
  "zone": "stack_lab",
  "mission": "defend_the_stack",
  "difficulty": "easy",
  "npc": "mentor_01",
  "hint_level": 1,
  "unlock": ["stack_training_area"],
  "lock": ["recursion_lab"]
}
```

The frontend should consume this structured output.

---

# 15. Agent Coordinator

The LangGraph workflow should resemble:

```text
START
  ↓
Load Student
  ↓
Load Mastery
  ↓
Load Prerequisites
  ↓
Context Agent
  ↓
Policy/Constraint Check
  ↓
Planner Agent
  ↓
Decision Validation
  ↓
Game/Mission Agent
  ↓
Return Game State
  ↓
END
```

Important:

## Do not allow unrestricted agent loops in the MVP.

Use bounded workflows.

Agentic does not mean uncontrolled autonomy.

---

# 16. Deterministic Guardrails

Before a decision reaches the game, validate it.

Example:

```text
Planner says:
"Send student to Recursion"

Guard:
Stack mastery = 0.38
Required = 0.70

Result:
REJECT planner decision

Correct action:
REMEDIATE STACK
```

This is a strong architectural feature.

It lets you tell judges:

> **The agents reason about learning, but hard educational constraints are enforced by deterministic services.**

---

# 17. Adaptive Mission System

Do not generate every mission completely from scratch.

Create a mission template library.

Example:

```text
Stack:
- push/pop challenge
- FIFO vs LIFO challenge
- overflow challenge
- trace-the-stack challenge
```

Each template has:

```json
{
  "concept": "stack",
  "difficulty": "easy",
  "objective": "Understand LIFO",
  "question_pool": ["Q1", "Q2", "Q3"],
  "world_zone": "stack_lab"
}
```

The agent selects/configures the template.

Use the LLM mainly for:

- narrative
- NPC wording
- contextualization
- hints

Do not let the LLM freely invent correctness-critical educational rules.

---

# 18. Adaptive Difficulty

For MVP use three levels:

```text
EASY
MEDIUM
HARD
```

Map mastery roughly:

```text
0.00–0.45 → EASY
0.45–0.70 → MEDIUM
0.70–1.00 → HARD
```

These thresholds should be configuration values, not hard-coded throughout the codebase.

Later IRT can replace/augment this logic.

---

# 19. Game World Adaptation

The Game Agent must be able to modify at least:

## A. Zone access

```text
Stack mastery < 70%
→ Recursion locked
```

## B. Mission difficulty

```text
Mastery 35%
→ Easy mission

Mastery 82%
→ Hard challenge
```

## C. NPC support

```text
Repeated mistakes
→ Mentor NPC becomes available
```

For the MVP, A + B are mandatory.

C is recommended if time allows.

---

# 20. Dynamic Game Map

Do not hard-code the complete progression as:

```text
level 1 → level 2 → level 3
```

Instead load a world state.

Example:

```json
{
  "zones": {
    "array_station": {
      "unlocked": true
    },
    "linked_list_lab": {
      "unlocked": true
    },
    "stack_lab": {
      "unlocked": true
    },
    "recursion_lab": {
      "unlocked": false,
      "reason": "Stack mastery below 70%"
    }
  }
}
```

The frontend renders the environment based on this state.

---

# 21. Locked Zone UX

Do not simply make the zone invisible.

Make the prerequisite relationship understandable.

When the student approaches the Recursion Lab:

```text
🔒 RECURSION DUNGEON

Requires:
✓ Linked List — 72%
✗ Stack — 38%

"Strengthen your Stack skills to unlock this area."
```

Then provide a portal/path to Stack Lab.

This turns the Knowledge Graph into visible gameplay.

---

# 22. NPC Design

Use simple NPCs.

### Mentor NPC

Purpose:

- explain
- hint
- redirect
- encourage

Example:

```text
Mentor:
"You are trying to enter the Recursion Lab,
but your Stack skills are still developing."

Student:
"Why does Stack matter?"

Mentor:
"Recursive calls are managed using a call stack.
Let's strengthen that skill first."
```

The Tutor Agent can generate the language, but the underlying fact should come from the curriculum/knowledge graph.

---

# 23. Question / Challenge UI

When the player enters a mission:

```text
┌──────────────────────────────────┐
│ 🛡️ STACK FORTRESS                │
│                                  │
│ The fortress can hold items      │
│ using LIFO order.                │
│                                  │
│ Which item is popped first?      │
│                                  │
│ [ A ] [ B ] [ C ] [ D ]          │
│                                  │
│ Difficulty: EASY                 │
└──────────────────────────────────┘
```

After answering:

```text
Correct
  ↓
BKT update
  ↓
Mission result
  ↓
Planner may run again
```

The game should not require a page reload for this.

---

# 24. End-to-End Adaptive Loop

This is the most important implementation flow.

```text
1. Student starts game
       ↓
2. Initial assessment / seeded learner state
       ↓
3. Backend loads learner model
       ↓
4. Knowledge Graph checks prerequisites
       ↓
5. Context Agent builds learner context
       ↓
6. Planner chooses next action
       ↓
7. Guardrail validates action
       ↓
8. Game Agent converts action into mission/world state
       ↓
9. Frontend changes game
       ↓
10. Student completes challenge
       ↓
11. Interaction recorded
       ↓
12. BKT updates mastery
       ↓
13. New learner state persisted
       ↓
14. Planner runs again
       ↓
15. Game changes again
```

This loop is the MVP.

---

# 25. Hero Demonstration

The demo should use two students.

## Student A

Seed:

```text
Arrays       0.92
Linked List  0.88
Stack        0.84
Recursion    0.72
```

Expected:

```text
Recursion Lab door unlocked
→ Advanced recursion mission
```

## Student B

Seed:

```text
Arrays       0.90
Linked List  0.70
Stack        0.38
Recursion    0.20
```

Expected:

```text
Recursion Lab locked
→ Stack Lab recommended and activated
→ Easy Stack mission
```

Then demonstrate:

```text
Stack
0.38
 ↓
0.51
 ↓
0.67
 ↓
0.74
```

Once threshold is crossed:

```text
🔓 RECURSION DUNGEON
```

This single scenario should be the center of the presentation.

---

# 26. Explainability Panel

Build a small developer/judge panel.

Display:

```text
WHY THIS MISSION?

Student: Student B

Stack mastery: 38%
Recursion mastery: 20%

Prerequisite:
Stack → Recursion

Decision:
REMEDIATE STACK

Reason:
Stack mastery is below the 70% prerequisite threshold.

Action:
Generate EASY Stack mission.
```

This is more valuable than a generic AI chat screen.

---

# 27. API Contract

Minimum endpoints:

```text
POST /api/students
GET  /api/students/{id}

GET  /api/students/{id}/mastery
GET  /api/students/{id}/world

POST /api/interactions
POST /api/learning/next-action

POST /api/missions/generate
GET  /api/missions/{id}

POST /api/game/events
```

Example:

```http
POST /api/learning/next-action
```

Response:

```json
{
  "action": "REMEDIATE",
  "concept": "stack",
  "difficulty": "easy",
  "zone": "stack_lab",
  "mission_id": "stack_easy_01",
  "reason": "Stack is a prerequisite for recursion and mastery is 38%."
}
```

---

# 28. Frontend ↔ Backend Communication

Use REST initially.

Do not start with WebSockets unless the team already knows them.

### REST is sufficient for:

- loading world state
- submitting answers
- getting next action
- getting missions
- updating mastery

Add WebSockets only if you need live events.

---

# 29. Game Performance Rules

The 3D game must remain lightweight.

Use:

- low-poly models
- simple lighting
- limited dynamic shadows
- compressed textures
- GLB/GLTF assets
- instancing for repeated objects
- simple collision detection

Avoid:

- huge textures
- photorealistic assets
- large open worlds
- complex physics
- multiplayer networking

The judge should see a responsive game, not a technically ambitious but unstable environment.

---

# 30. 3D Asset Pipeline

Recommended:

```text
Blender
   ↓
.glb
   ↓
React Three Fiber
   ↓
Game zone
```

Create reusable assets:

```text
assets/
├── environment/
│   ├── virtual_classroom.glb
│   ├── stack_lab.glb
│   └── recursion_lab.glb
├── characters/
│   └── mentor.glb
├── props/
│   ├── crate.glb
│   ├── portal.glb
│   └── stack.glb
└── icons/
```

Do not model every object manually.

Use primitive geometry where possible.

---

# 31. Game Camera

For the MVP choose one camera model:

### Recommended: third-person

Features:

- WASD movement
- mouse camera rotation
- basic collision
- interaction key
- simple zone transitions

If third-person movement takes too long, use:

### Fallback: top-down/isometric

The adaptive logic is more important than camera sophistication.

---

# 32. Game Interaction System

Use a generic interaction interface.

```typescript
interface Interactable {
  id: string;
  type: "npc" | "portal" | "mission" | "object";
  interact(): void;
}
```

Examples:

```text
Player approaches NPC
→ press E
→ open dialogue

Player approaches portal
→ press E
→ check unlock state

Player approaches mission object
→ press E
→ start mission
```

Do not create separate interaction code for every object.

---

# 33. Game State vs Learning State

This separation is mandatory.

## Learning state

Backend:

```text
mastery
history
prerequisites
recommendation
```

## Game state

Frontend/backend:

```text
position
current zone
active mission
NPC state
animation state
UI state
```

Never calculate mastery inside the frontend.

Never let the frontend decide whether a concept is educationally unlocked.

---

# 34. Security / Reliability Basics

For the hackathon:

- validate API inputs
- never trust frontend mastery values
- calculate mastery on backend
- validate agent JSON
- validate planner decisions against deterministic rules
- keep API keys server-side
- never expose LLM API keys in React
- log failed agent decisions
- use environment variables

Example:

```text
.env

DATABASE_URL=
NEO4J_URI=
NEO4J_USERNAME=
NEO4J_PASSWORD=
LLM_API_KEY=
```

Never commit `.env`.

---

# 35. Testing Strategy

You don't need huge test coverage.

Create tests for the core learning loop.

## BKT

```text
correct answer → mastery should generally increase
incorrect answer → mastery should generally decrease or update appropriately
```

## Prerequisites

```text
Stack < threshold
→ Recursion unavailable
```

## Planner

```text
Stack low
→ REMEDIATE STACK
```

## Game

```text
planner = REMEDIATE STACK
→ Stack Lab active
```

## Integration

Test:

```text
answer
→ interaction stored
→ mastery updated
→ planner decision changed
→ world state changed
```

---

# 36. 36-Hour Build Plan

## Hours 0–3 — Architecture + setup

- repository
- frontend
- backend
- database
- environment variables
- API skeleton

Deliverable:

```text
React ↔ FastAPI ↔ PostgreSQL
```

---

## Hours 3–8 — Learning model

- concepts
- questions
- interactions
- mastery table
- BKT
- prerequisite data
- Neo4j integration

Deliverable:

```text
Answer question
→ mastery changes
```

---

## Hours 8–13 — Game foundation

Build:

- game canvas
- player
- camera
- Array Station
- Stack Lab
- Recursion Lab
- basic portals
- locked/unlocked visuals

Do not polish.

---

## Hours 13–18 — Agent workflow

Implement:

- LangGraph state
- Context Agent
- Planner Agent
- Game Agent
- structured outputs
- guardrails

Deliverable:

```text
Student state
→ Agent decision
→ game action
```

---

## Hours 18–24 — Mission system

Implement:

- mission templates
- difficulty
- question interaction
- mission completion
- NPC mentor
- dynamic mission selection

---

## Hours 24–30 — Full integration

Implement:

```text
Game
→ answer
→ BKT
→ planner
→ mission
→ world update
```

This is the most important period.

---

## Hours 30–34 — Hero scenario

Prepare:

Student A vs Student B.

Make the difference visually obvious.

---

## Hours 34–36 — Stability

- remove bugs
- seed data
- improve loading
- test API failures
- test LLM failures
- record backup demo
- prepare screenshots/video

---

# 37. 72-Hour Build Plan

If you have 72 hours:

### 0–24h

Core vertical slice:

```text
BKT
+
Neo4j
+
Planner
+
Game
```

### 24–48h

Improve:

- 3–5 zones
- NPC
- mission templates
- better 3D assets
- adaptive difficulty
- explainability

### 48–60h

Add:

- optional IRT
- stronger question selection
- better agent validation
- analytics

### 60–72h

Do NOT add major new features.

Use time for:

- polish
- testing
- demo reliability
- presentation
- backup video
- judge Q&A

---

# 38. What NOT to Build

Explicitly avoid:

```text
❌ Full LMS
❌ Teacher dashboard
❌ Multiplayer
❌ Massive open world
❌ Custom LLM
❌ 20+ agents
❌ Complex RAG pipeline
❌ Mobile app
❌ Blockchain
❌ VR
❌ Voice assistant
❌ Full IRT research implementation
❌ Full spaced-repetition engine
```

These are future roadmap items, not MVP requirements.

---

# 39. Optional Features — Only After MVP Works

## Priority 1

Adaptive assessment with IRT.

Replace:

```text
fixed difficulty
```

with:

```text
student ability + item difficulty
→ next question
```

## Priority 2

Spaced repetition.

Turn revision into:

```text
"Return to the Stack Lab"
```

when retention is predicted to decline.

## Priority 3

Misconception Agent.

Detect repeated conceptual errors and generate a targeted game event.

---

# 40. Definition of Done

The MVP is complete only when this works:

```text
1. Create/select Student A
2. Student A enters world
3. Learner state is loaded
4. Agent determines next action
5. Appropriate zone/mission appears
6. Student completes challenge
7. Interaction is stored
8. BKT updates mastery
9. Agent makes a new decision
10. Game changes accordingly
```

And separately:

```text
Student B
→ different learner state
→ different agent decision
→ different mission
→ different game progression
```

If these two paths work, the MVP is successful.

---

# 41. Core Demo Script

## Scene 1 — Same world

Show two students.

```text
Student A
Student B
```

Both begin in the same Virtual Classroom, with Array Station available.

## Scene 2 — Different learner states

```text
A: Stack 84%
B: Stack 38%
```

## Scene 3 — Agent decision

For A:

```text
→ Challenge Recursion
```

For B:

```text
→ Remediate Stack
```

## Scene 4 — Game changes

A:

```text
🔓 Recursion Lab
```

B:

```text
🧩 Stack Lab
```

## Scene 5 — Learning happens

B completes Stack mission.

```text
38% → 55% → 72%
```

## Scene 6 — World changes again

```text
🔓 Recursion Lab
```

## Scene 7 — Explain why

Show:

```text
WHY?

Stack is a prerequisite for Recursion.
Current Stack mastery was below 70%.
The planner therefore selected Stack remediation.
```

This should be the main hackathon demonstration.

---

# 42. Judge-Facing Technical Positioning

Do not say:

> "We have many AI agents."

Say:

> "Our agents have distinct responsibilities in a closed adaptive learning loop."

Do not say:

> "The LLM decides what the student knows."

Say:

> "BKT estimates learner mastery, the Knowledge Graph models prerequisites, and agents use those structured signals to plan the next action."

Do not say:

> "The game is gamification."

Say:

> "The virtual classroom is the execution layer of the learning policy. Agent decisions directly modify missions, difficulty and progression."

---

# 43. USP

### Short version

> **Your knowledge shapes your classroom.**

### Technical version

> **An Agentic AI learning environment that continuously models learner mastery, reasons over prerequisite relationships, plans the next best learning action, and dynamically changes the game world accordingly.**

### Strong judge statement

> **"Most educational games adapt rewards and difficulty. Our system adapts the learning journey itself—and the game world is the mechanism through which that adaptation happens."**

---

# 44. Final Engineering Principle

The architecture must preserve this separation:

```text
┌─────────────────────────────────────┐
│ Learning Science                    │
│ BKT / IRT / prerequisite rules      │
│                                     │
│ SOURCE OF EDUCATIONAL STATE         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│ Agentic AI                          │
│ Context / Planner / Game Agents     │
│                                     │
│ REASON + PLAN + COORDINATE          │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│ Game Environment                    │
│ Three.js / React Three Fiber        │
│                                     │
│ EXECUTE + VISUALIZE                 │
└──────────────────┬──────────────────┘
                   │
                   ▼
               STUDENT
                   │
                   └──────────────→ new evidence
```

### The single most important rule

> **Never build the game first and attach AI afterward.**

Build the smallest **end-to-end adaptive loop** first.

Then make the game environment beautiful around that loop.

The product is not:

**"a 3D educational game."**

It is:

**"an adaptive learning engine that happens to express its decisions through a living game world."**
