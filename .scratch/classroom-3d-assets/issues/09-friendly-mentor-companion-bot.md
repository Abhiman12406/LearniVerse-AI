# 09: Friendly Mentor Companion Bot & In-World Guidance

**What to build:** A friendly procedural teaching assistant robot perched atop the teacher's podium desk in the central classroom hub. Replaces the floating sci-fi beacon with a charming desktop bot featuring animated eye expressions, rotating antenna, gentle hovering idle bob, and reactive audio chimes that trigger Socratic guidance and Feynman explanations when the student approaches.

**Blocked by:** 01: Reference Blueprints Generation (Nanabanana), 02: Procedural Classroom Campus Diorama & Lighting

**Status:** ready-for-agent

- [ ] Create procedural Three.js factory in `frontend/src/assets/3d/createMentorCompanionModel.ts` based on `asstesimages/mentor_bot.png`.
- [ ] Mount the companion bot into `frontend/src/components/canvas/AIMentorBeacon.tsx`, positioned on the central classroom teacher desk.
- [ ] Add idle animation bob, eye blink/screen face shifts, and head tilt toward the player avatar when nearby.
- [ ] Bind proximity trigger to `useClassroomStore.setIsNearMentor` and open the interactive Socratic mentor dialog on click/E key press.
- [ ] Trigger friendly synth chimes when interaction begins.
