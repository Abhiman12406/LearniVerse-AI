# 07: Linked List Pointer Node Apparatus

**What to build:** An interactive 3D Linked List node chain apparatus situated in the East Lab wing. Features modular node housings with split `[Data | Next]` chambers linked together by luminous plasma pointer beams terminating in an illuminated NULL ground plate, demonstrating dynamic allocation, pointer redirection, node insertion, and chain repairs.

**Blocked by:** 01: Reference Blueprints Generation (Nanabanana), 02: Procedural Classroom Campus Diorama & Lighting

**Status:** ready-for-agent

- [ ] Create procedural Three.js factory in `frontend/src/assets/3d/createLinkedListModel.ts` based on `asstesimages/linked_list_apparatus.png`.
- [ ] Implement curve-extruded dynamic connection beams between nodes with pulsing energy shader animation.
- [ ] Create R3F canvas component `frontend/src/components/canvas/LinkedListLab.tsx` situated in the Linked List Lab wing.
- [ ] Implement node insertion and pointer redirection animations (rerouting `prev.next` to a newly inserted node).
- [ ] Visualize broken links and null pointer dereference errors when a node points to NULL improperly.
