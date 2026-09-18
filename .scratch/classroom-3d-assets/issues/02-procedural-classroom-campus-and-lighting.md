# 02: Procedural Classroom Campus Diorama & Lighting

**What to build:** An expansive, interconnected procedural classroom campus environment replacing the dark cyber atrium in `frontend/src/components/canvas/`. Features a central warm wooden classroom hub with teacher desk, student double-workstations, computer terminals, bookshelves, chalkboards, wall clocks, and orange window blinds, seamlessly connected to 4 walkable laboratory wings with warm sunbeam directional lighting and solid collision boundaries.

**Blocked by:** None (can start immediately)

**Status:** closed

- [x] Create procedural Three.js factory in `frontend/src/assets/3d/createClassroomEnvironment.ts` generating campus architecture and furniture diorama with canvas-rendered staggered wood plank floor textures.
- [x] Construct R3F canvas component `ClassroomCampus.tsx` mounting the campus factory with memoized instance management and proper geometry/material disposal.
- [x] Update `Lighting.tsx` with warm directional sunlight beams angled from window blinds (#fff3d6), soft ambient fill, and localized apparatus spotlighting.
- [x] Update `ClassroomCanvas.tsx` camera framing and bounds to smoothly orbit and follow across the enlarged classroom campus.
- [x] Verify solid obstacle collision boxes prevent avatar from clipping through teacher/student desks, bookshelves, and outer walls.
