# 05: Stack LIFO Cylinder Apparatus & Interactive Console

**What to build:** An interactive, tactile 3D Stack apparatus residing in the Stack Lab wing. Features a warm brass and transparent cylinder column with top funnel loading and bottom piston actuation, allowing students to visually push and pop labeled data discs with smooth physical descent and ejection animations wired directly to classroom challenges.

**Blocked by:** 01: Reference Blueprints Generation (Nanabanana), 02: Procedural Classroom Campus Diorama & Lighting

**Status:** ready-for-agent

- [ ] Create procedural Three.js factory in `frontend/src/assets/3d/createStackTowerModel.ts` based on `asstesimages/stack_apparatus.png`.
- [ ] Implement smooth vertical translation physics/easing for pushing discs into the stack and popping them out.
- [ ] Mount apparatus into `frontend/src/components/canvas/StackApparatus.tsx`, replacing the previous sci-fi mesh.
- [ ] Bind disc state dynamically to `useClassroomStore.stackDiscs`, `pushStackDisc`, and `popStackDisc`.
- [ ] Integrate with the Challenge Console UI so answering stack questions animates corresponding push/pop operations.
