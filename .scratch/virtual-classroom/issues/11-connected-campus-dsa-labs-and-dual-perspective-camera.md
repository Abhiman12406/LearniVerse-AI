# 11: Connected Campus DSA Labs, Performance Optimization & Dual Perspective Camera

**Triage Label:** `ready-for-agent`  
**Status:** open  

## Problem Statement

When exploring the 3D adaptive virtual classroom, the user experiences significant rendering lag and frame rate drops. Additionally, the specialized laboratory rooms that existed in the standalone demos are missing from the primary application, leaving the avatar enclosed in a small room with doorways opening into void or missing wings. Furthermore, the avatar camera movement feels rigid and jerky, lacking smooth chase physics, and there is no ability to toggle between first-person (1P) and third-person (3P) perspectives to inspect the educational apparatus up close.

## Solution

1. Integrate the complete connected campus architecture inspired by `demos/classroom-preview`: a central classroom hub seamlessly connected via open corridors to five full-sized, enterable laboratory rooms (Array Station Lab, Linked List Lab, Stack Lab, Recursion Chamber, and Tree & BST Lab).
2. Overhaul rendering performance to achieve a smooth 60 FPS by caching procedural textures, reusing shared PBR materials, batching static architectural geometry, and disabling unnecessary dynamic shadow casters on decorative props.
3. Replace linear camera tracking with frame-rate independent exponential damping for butter-smooth camera motion.
4. Implement a dual perspective camera system allowing seamless switching between Third-Person (3P) chase camera and First-Person (1P) eye-level camera via hotkey ('V'), top HUD toggle button, and mouse scroll wheel zoom.

## User Stories

1. As a student, I want the virtual classroom to render at a consistent, smooth 60 FPS without stutter or lag, so that I can comfortably explore the environment.
2. As a student, I want to walk out of the central classroom through clear doorways and corridors into specialized DSA laboratory rooms, so that each data structure concept feels like a distinct physical learning zone.
3. As a student, I want to enter the Array Station Lab and operate the memory index apparatus, so that I can visualize direct $O(1)$ random access versus $O(n)$ linear traversal.
4. As a student, I want to enter the Linked List Lab and inspect pointer connections between dynamic heap nodes, so that I can see how nodes link to `NULL` and how pointer traversal occurs.
5. As a student, I want to enter the Stack Lab and operate the vertical LIFO cylinder, so that I can observe items pushing and popping from the top pointer.
6. As a student, I want to enter the Recursion Chamber and observe the call stack tower, so that I can watch stack frames push and unwind during recursive factorial execution.
7. As a student, I want to enter the Tree & BST Lab and interact with the 3D hierarchical binary search tree canopy, so that I can see sorted in-order traversal and logarithmic search paths in action.
8. As a student, I want to press the 'V' key on my keyboard to switch between First-Person and Third-Person views, so that I can effortlessly alternate between immersion and spatial awareness.
9. As a student, I want a clickable HUD button on screen to toggle camera perspectives, so that I can change views without needing to remember keyboard shortcuts.
10. As a student, I want scrolling forward with my mouse wheel to zoom smoothly into First-Person view, and scrolling backward to pull back into Third-Person view, so that camera distance adjustment feels natural and intuitive.
11. As a student, I want my avatar model to be automatically hidden when in First-Person perspective, so that my camera view is never obstructed by the character's head or hair mesh.
12. As a student, I want camera movement to use smooth exponential damping rather than rigid snapping, so that navigating corners and corridors feels fluid and cinematic.
13. As a teacher or judge, I want to observe all five curriculum concepts (Array, Linked List, Stack, Recursion, Tree) physically represented across the campus, so that the learning progression matches the Knowledge Graph DAG.

## Implementation Decisions

### Architectural Decisions
- Central hub classroom diorama (warm wood flooring, desks, whiteboard, chalkboard, clock) acts as the central spawn and navigational hub.
- Four cardinal corridors connect to 5 distinct lab wings positioned around the perimeter matching the curriculum DAG:
  - West Wing: Array Station Lab
  - East Wing: Linked List Lab
  - North Wing: Recursion Chamber
  - South-West Wing: Stack Lab
  - South-East Wing: Tree & BST Lab
- All lab rooms feature solid perimeter boundary colliders preventing the avatar from falling into empty space, while keeping corridor doorways open and unobstructed.

### Performance & Lag Elimination Decisions
- Pre-bake procedural canvas textures (floor planks, computer terminal screens, chalkboards, signage) once upon module initialization rather than allocating new canvas contexts and textures on each render frame or component mount.
- Consolidate common materials (`woodLight`, `woodDark`, `metalBlack`, `wallPlaster`, `floorPlanks`) as singletons shared across the diorama and labs.
- Small decorative props (books, pens, keyboards, chair casters) must not cast dynamic shadows; shadow casting is strictly reserved for the avatar, main apparatus pedestals, and major architectural pillars.
- Directional light shadow map configured with optimized resolution (1024x1024) and tight orthographic bounds.

### Camera Controller & Perspective Decisions
- Camera controller state machine extended to support:
  - `THIRD_PERSON`: Distance 4.5m - 6.5m behind avatar, pitch clamped between -15° and 45°, auto-following locomotion heading, avatar visible.
  - `FIRST_PERSON`: Position fixed at avatar eye-level (1.62m above ground), pitch clamped between -70° and 80°, avatar root mesh invisible, camera rotates directly with mouse look.
  - `CINEMATIC`: Fixed focus shots during apparatus operation or barrier dissolution.
- Camera smoothing implemented using delta-timed exponential decay:
  `position.lerp(targetPosition, 1 - Math.exp(-lambda * delta))`
- Perspective switching triggered by:
  - Keyboard: `KeyV`
  - UI Button: Camera icon pill in HUD navigation bar
  - Scroll Wheel: Delta accumulation past zero distance triggers 1P transition; negative scroll pulls camera back into 3P.

### State & Store Integration
- Add `cameraPerspective: '1st_person' | '3rd_person'` to the classroom store.
- Action `toggleCameraPerspective()` to toggle modes and sync HUD and avatar visibility.

## Testing Decisions

- **Good Test Criteria**: Tests must verify observable user behavior—camera positions, store mode toggles, collider responses, and lab interaction feedback—without relying on private component internals.
- **Modules to Test**:
  - `CameraFollower` / perspective toggle state in the classroom store.
  - Connected campus diorama and lab wing generation (ensuring all 5 labs are created with interactive targets).
  - Collision resolution ensuring avatar can enter all 5 wings through corridor openings and cannot walk through outer walls.
  - Material and texture caching verification ensuring singletons are reused.
- **Prior Art**:
  - `frontend/src/tests/classroom-campus.test.ts`
  - `frontend/src/tests/avatar-coords.test.ts`
  - `frontend/src/tests/barrier-dissolve.test.ts`

## Out of Scope

- VR / WebXR headset controllers and hand tracking.
- Network multiplayer synchronization of other players' avatar perspectives.
- Full physics rigid-body simulation for classroom furniture (collision uses fast AABB bounding boxes).

## Further Notes

- Retains full compatibility with existing BKT mastery updates, AI Mentor dialogues, Feynman explanation modals, and the 90-second hero pitch barrier dissolve sequence.
