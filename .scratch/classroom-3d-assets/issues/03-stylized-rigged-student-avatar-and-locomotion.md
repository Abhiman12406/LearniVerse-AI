# 03: Stylized Rigged Student Avatar & Locomotion

**What to build:** A stylized student avatar faithful to `asstesimages/character.webp` with swept anime hair, cute eyes, orange hoodie, dark jeans, and sneakers. Features fully articulated procedural limbs and a responsive locomotion state machine (idle breathing bob, walk cycle, sprint, turn banking, and jump arc) controlled via WASD keys with smooth velocity damping and obstacle collision response.

**Blocked by:** 02: Procedural Classroom Campus Diorama & Lighting

**Status:** ready-for-agent

- [ ] Create procedural Three.js factory in `frontend/src/assets/3d/createStudentAvatar.ts` matching the anatomical proportions and palette of `asstesimages/character.webp`.
- [ ] Implement skeletal/limb articulation for head, torso, upper/lower arms, hands, legs, and sneakers.
- [ ] Port and optimize the locomotion cycle engine from `demos/character-preview/character.js` (idle breathing, walk, run, jump, turn banking).
- [ ] Mount the new student avatar into `frontend/src/components/canvas/Avatar.tsx`, binding position and orientation to `useClassroomStore`.
- [ ] Verify WASD navigation feels snappy, direction slerp is smooth, and collision boundaries against desks and walls stop forward movement cleanly.
