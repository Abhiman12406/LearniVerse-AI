# 08: Recursion Call-Stack Elevator Apparatus

**What to build:** An interactive 3D Recursion apparatus situated in the North Lab wing. Features a vertical telescoping elevator shaft with stacked translucent call-frame platforms visualizing nested function calls `f(n) -> f(n-1)` down to the base case, which triggers a luminous upward cascade of return values.

**Blocked by:** 01: Reference Blueprints Generation (Nanabanana), 02: Procedural Classroom Campus Diorama & Lighting

**Status:** ready-for-agent

- [ ] Create procedural Three.js factory in `frontend/src/assets/3d/createRecursionChamberModel.ts` based on `asstesimages/recursion_chamber.png`.
- [ ] Implement nested platform spawning where each recursive invocation pushes a new platform downward into the shaft.
- [ ] Create R3F canvas component `frontend/src/components/canvas/RecursionChamber.tsx` situated in the Recursion Lab wing.
- [ ] Implement base-case return sequence: upon reaching $n=1$, trigger an upward light beam that resolves each frame's return value up to the root.
- [ ] Add visual stack-overflow warning animation if recursion exceeds the maximum depth limit.
