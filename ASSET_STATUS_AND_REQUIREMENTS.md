# LearniVerse-AI: Asset Status & Requirements Report

> **Project:** Adaptive Agentic Learning Virtual Classroom MVP  
> **Repository:** `LearniVerse-AI`  
> **Date:** September 2026  
> **Strategy:** Zero-Asset Fragility & Procedural Generation (Three.js / React Three Fiber / Web Audio API) + Curated Reference Target Ingestion.

---

## 1. Executive Summary

This document provides a comprehensive inventory of:
1. **Generated Assets** (Reference images, standalone procedural Three.js demos, and production React Three Fiber canvas components).
2. **Required Assets** (Interactive DSA learning apparatuses, audio synthesizers, and environmental assets) alongside their educational and gameplay purpose.

---

## 2. Assets Already Generated

### 2.1 Reference Source Images (`/asstesimages`)
Visual and architectural source images used as geometric/stylistic blueprints:

| File | Type | Purpose & Target Application |
|---|---|---|
| [`classroom.webp`](file:///c:/Users/Naren/Desktop/DevHack%20V1/asstesimages/classroom.webp) | Image (WebP) | Blueprint for isometric classroom lighting, warm wood tones, wall trims, and furniture layout. |
| [`character.webp`](file:///c:/Users/Naren/Desktop/DevHack%20V1/asstesimages/character.webp) | Image (WebP) | Blueprint for stylized 3D student avatar (hoodie, hair geometry, proportions, color palette). |
| [`desk.jpeg`](file:///c:/Users/Naren/Desktop/DevHack%20V1/asstesimages/desk.jpeg) | Image (JPEG) | Blueprint for student & teacher wooden desks with rounded steel legs. |
| [`computer.jpg`](file:///c:/Users/Naren/Desktop/DevHack%20V1/asstesimages/computer.jpg) | Image (JPEG) | Blueprint for desktop monitor, screen bezels, and PC base. |
| [`keyb.jpg`](file:///c:/Users/Naren/Desktop/DevHack%20V1/asstesimages/keyb.jpg) | Image (JPEG) | Blueprint for tactile keyboard and peripheral layout. |
| [`bshelf.jpg`](file:///c:/Users/Naren/Desktop/DevHack%20V1/asstesimages/bshelf.jpg) | Image (JPEG) | Blueprint for classroom wooden bookshelf & stacked textbook arrangements. |
| [`wboard.jpg`](file:///c:/Users/Naren/Desktop/DevHack%20V1/asstesimages/wboard.jpg) | Image (JPEG) | Blueprint for framed magnetic whiteboard and marker trays. |
| [`bbaord.jpg`](file:///c:/Users/Naren/Desktop/DevHack%20V1/asstesimages/bbaord.jpg) | Image (JPEG) | Blueprint for traditional green chalkboard and cork bulletin board. |

---

### 2.2 Standalone Procedural 3D Demos (`/demos`)
Standalone Three.js implementations with dynamic collision bounding boxes and procedural textures:

* **[character-preview/character.js](file:///c:/Users/Naren/Desktop/DevHack%20V1/demos/character-preview/character.js)**:
  * Procedurally modeled and rigged 3rd-person character (head, swept hair, eyes, hoodie body, articulated limbs, sneakers).
  * Smooth locomotion cycles: Idle breathing, walk cycle, run cycle, turn banking, and jump arc.
* **[classroom-preview/classroom.js](file:///c:/Users/Naren/Desktop/DevHack%20V1/demos/classroom-preview/classroom.js)**:
  * Complete procedural isometric classroom diorama.
  * Canvas-rendered procedural wood plank floor texture with offset stagger.
  * Teacher desk, student workstation rows, desktop computers with illuminated screens.
  * Bookshelves with multi-colored books, whiteboards, chalkboards, wall clocks, orange blinds, and student backpacks.
  * Integrated solid AABB obstacle colliders.

---

### 2.3 Production R3F Canvas Components (`/frontend/src/components/canvas`)
The interactive 3D virtual classroom environment running inside React Three Fiber:

| Component | Asset ID | Purpose & In-Game Function |
|---|---|---|
| **[`Atrium.tsx`](file:///c:/Users/Naren/Desktop/DevHack%20V1/frontend/src/components/canvas/Atrium.tsx)** | `procedural_hexagonal_atrium` | Main architectural hub; hexagonal geometry with glowing conduits, columns, floor grid, and holographic ceiling dome. |
| **[`CentralDais.tsx`](file:///c:/Users/Naren/Desktop/DevHack%20V1/frontend/src/components/canvas/CentralDais.tsx)** | `procedural_central_dais` | Stepped platform with glowing radial rings that houses the holographic emitter and mentor beacon. |
| **[`KnowledgeGraphConstellation.tsx`](file:///c:/Users/Naren/Desktop/DevHack%20V1/frontend/src/components/canvas/KnowledgeGraphConstellation.tsx)** | `procedural_knowledge_graph` | Live 3D holographic constellation visualizing DSA nodes, real-time BKT mastery levels (color-coded), and prerequisite energy conduits. |
| **[`Avatar.tsx`](file:///c:/Users/Naren/Desktop/DevHack%20V1/frontend/src/components/canvas/Avatar.tsx)** | `procedural_cyber_avatar` | 3rd-person avatar with WASD keyboard controls, smooth orientation slerp, walking bob, shadow projector, and collision avoidance. |
| **[`AIMentorBeacon.tsx`](file:///c:/Users/Naren/Desktop/DevHack%20V1/frontend/src/components/canvas/AIMentorBeacon.tsx)** | `procedural_ai_mentor_beacon` | Floating dual-gyro torus with octahedron core; triggers Feynman explanations and Socratic tutor interactions. |
| **[`Archways.tsx`](file:///c:/Users/Naren/Desktop/DevHack%20V1/frontend/src/components/canvas/Archways.tsx)** | `procedural_radial_archways` | Five radial gateways leading to concept zones (Array, Linked List, Stack, Recursion, Tree). |
| **[`PrerequisiteBarrier.tsx`](file:///c:/Users/Naren/Desktop/DevHack%20V1/frontend/src/components/canvas/PrerequisiteBarrier.tsx)** | `procedural_prereq_barrier` | Dynamic forcefields that lock/unlock concept zones based on BKT thresholds, with proximity-based prerequisite HUD readouts. |
| **[`StackLabWing.tsx`](file:///c:/Users/Naren/Desktop/DevHack%20V1/frontend/src/components/canvas/StackLabWing.tsx)** | `procedural_stack_lab_wing` | Dedicated room chamber for Stack data structure training. |
| **[`StackApparatus.tsx`](file:///c:/Users/Naren/Desktop/DevHack%20V1/frontend/src/components/canvas/StackApparatus.tsx)** | `procedural_stack_apparatus` | Interactive 3D LIFO column apparatus with Push/Pop buttons, animated data discs, and overflow/underflow indicators. |
| **[`DiagnosticPlaque.tsx`](file:///c:/Users/Naren/Desktop/DevHack%20V1/frontend/src/components/canvas/DiagnosticPlaque.tsx)** | `procedural_diagnostic_plaque` | 3D in-world developer/judge explainability terminal showing live agent decisions, rule evaluation, and BKT calculations. |

---

## 3. Assets Required & Their Purpose

According to [ASSETS.md](file:///c:/Users/Naren/Desktop/DevHack%20V1/ASSETS.md) and [AGENTS.md](file:///c:/Users/Naren/Desktop/DevHack%20V1/AGENTS.md), the following assets are required for full educational coverage:

### 3.1 Priority 1: Interactive DSA Concept Apparatuses (Procedural R3F)
These are active educational simulations driven by the student's mastery and agent decisions:

#### 1. Array Station Apparatus (`ArrayStation.tsx` & `ArrayLabWing.tsx`)
* **Purpose:** Teach contiguous indexing, `O(1)` random access, linear search, and memory address offsets.
* **Metaphor / Gameplay:** A horizontal row of numbered storage bays `[0] [1] [2] [3] [4]`.
* **Interaction:** The student inputs an index or searches for a value; a pointer beam slides across indices, illustrating time complexity and index-out-of-bounds errors.

#### 2. Linked List Lab Apparatus (`LinkedListLab.tsx` & `LinkedListWing.tsx`)
* **Purpose:** Teach dynamic node allocation, pointer redirection, insertion/deletion, and `NULL` termination.
* **Metaphor / Gameplay:** Floating node containers `[Data | Next]` linked by glowing plasma beams.
* **Interaction:** The student reconnects pointers to insert/remove nodes or repairs broken chains to prevent memory leaks.

#### 3. Recursion Chamber Apparatus (`RecursionLab.tsx` & `RecursionWing.tsx`)
* **Purpose:** Demystify nested function calls, stack frames, base cases, and return value propagation.
* **Metaphor / Gameplay:** A vertical fractal call-frame elevator chamber.
* **Interaction:** Each recursive call pushes a new frame `f(n-1)` downward until the base case is reached, triggering a luminous upward return cascade.

#### 4. Tree Lab Apparatus (`TreeLab.tsx`) *(Stretch Goal)*
* **Purpose:** Teach hierarchical data organization, parent/child pointers, and tree traversals (In-order, Pre-order, Post-order, BFS).
* **Metaphor / Gameplay:** A 3D branching node tree with glowing traversal paths.

---

### 3.2 Priority 2: Audio & Sound Synthesis (Web Audio API / CC0)
Zero-dependency procedural sound generators to enrich tactile feedback:

* **Barrier Hum & Warp:** Low-frequency drone that shifts pitch when a student approaches locked or unlocked gateways.
* **Stack Clank & Whoosh:** Mechanical actuation sound on Stack Push and Pop operations.
* **Mastery Threshold Fanfare:** Harmonic chord chime played when a student crosses the 70% prerequisite threshold.
* **AI Beacon Chime:** Synthesizer frequency pulse when interacting with the Feynman mentor.

---

### 3.3 Priority 3: Optional High-Fidelity CC0 GLB World Props
If migrating from procedural meshes to textured CC0 packs (from Quaternius / Poly Haven):

* **Classroom Props Bundle (`props.glb`):** Notebooks, test tubes, robotic arms, desk lamps.
* **Specialized NPC Models (`mentor_tutor.glb`):** Alternate humanoid robot/mentor models for multi-agent persona roles.

---

## 4. Complete Status Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 LEARNIVERSE-AI ASSET STATUS                            │
├──────────────────────────────┬──────────────┬───────────────────┬──────────────────────┤
│ Asset Name                   │ Category     │ Status            │ Location             │
├──────────────────────────────┼──────────────┼───────────────────┼──────────────────────┤
│ Classroom Reference Blueprint│ Reference    │ ✅ Generated       │ /asstesimages        │
│ Character Avatar Reference   │ Reference    │ ✅ Generated       │ /asstesimages        │
│ Desk & Peripherals Reference │ Reference    │ ✅ Generated       │ /asstesimages        │
│ Standalone Isometric Class   │ Vanilla 3D   │ ✅ Generated       │ /demos/classroom-..  │
│ Standalone Rigged Avatar     │ Vanilla 3D   │ ✅ Generated       │ /demos/character-..  │
│ Hexagonal Atrium             │ R3F Canvas   │ ✅ Generated       │ /frontend/.../canvas │
│ Central Dais & Emitter       │ R3F Canvas   │ ✅ Generated       │ /frontend/.../canvas │
│ 3D Knowledge Graph Node Mesh │ R3F Canvas   │ ✅ Generated       │ /frontend/.../canvas │
│ 3rd-Person Robot Avatar      │ R3F Canvas   │ ✅ Generated       │ /frontend/.../canvas │
│ AI Mentor Beacon             │ R3F Canvas   │ ✅ Generated       │ /frontend/.../canvas │
│ Radial Archways & Portals    │ R3F Canvas   │ ✅ Generated       │ /frontend/.../canvas │
│ Prerequisite Forcefield      │ R3F Canvas   │ ✅ Generated       │ /frontend/.../canvas │
│ Stack Lab Wing               │ R3F Canvas   │ ✅ Generated       │ /frontend/.../canvas │
│ Stack Push/Pop Apparatus     │ R3F Canvas   │ ✅ Generated       │ /frontend/.../canvas │
│ Diagnostic Explainability    │ R3F Canvas   │ ✅ Generated       │ /frontend/.../canvas │
├──────────────────────────────┼──────────────┼───────────────────┼──────────────────────┤
│ Array Station Apparatus      │ R3F Canvas   │ ⏳ REQUIRED (Next) │ /frontend/.../canvas │
│ Linked List Lab Apparatus    │ R3F Canvas   │ ⏳ REQUIRED        │ /frontend/.../canvas │
│ Recursion Chamber Apparatus  │ R3F Canvas   │ ⏳ REQUIRED        │ /frontend/.../canvas │
│ Tree Lab Apparatus (Stretch) │ R3F Canvas   │ ⏳ REQUIRED        │ /frontend/.../canvas │
│ Web Audio Sound Synthesizer  │ Audio Engine │ ⏳ REQUIRED        │ /frontend/src/audio  │
└──────────────────────────────┴──────────────┴───────────────────┴──────────────────────┘
```
