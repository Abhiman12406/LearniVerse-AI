# 04: Classroom Prerequisite Doorways & Barrier Dissolve

**What to build:** Stylized classroom doorway frames situated at the entrance of each of the 4 DSA laboratory wings. Each doorway includes a digital prerequisite status plaque showing required mastery thresholds and an illuminated barrier forcefield that dynamically unlocks, plays an energy dissolve sequence, and allows physical passage when a student's BKT score meets the prerequisite requirements.

**Blocked by:** 01: Reference Blueprints Generation (Nanabanana), 02: Procedural Classroom Campus Diorama & Lighting

**Status:** closed

- [x] Create procedural Three.js factory in `frontend/src/assets/3d/createPrerequisiteDoorModel.ts` based on `asstesimages/classroom_doorway.png`.
- [x] Incorporate interactive LED plaque showing prerequisite status (e.g. "Stack Mastery: 38% / Req: 70% - LOCKED").
- [x] Mount doorways at the thresholds of all 4 lab wings inside `frontend/src/components/canvas/PrerequisiteBarrier.tsx`.
- [x] Connect barrier mesh opacity and shockwave shader animation to `useClassroomStore.dissolvingWingId` and `dissolvePhase`.
- [x] Enforce physical blocking colliders when a door is locked (e.g. Recursion locked for Student B) and open passage when unlocked (Student A).
