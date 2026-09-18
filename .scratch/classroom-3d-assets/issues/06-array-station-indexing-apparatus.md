# 06: Array Station Indexing Apparatus

**What to build:** An interactive 3D Array Station apparatus residing in the West Lab wing. Features 5 contiguous numbered storage bays `[0..4]` with data slots, physical index labels, and an illuminated sliding probe needle that moves across cells to demonstrate $O(1)$ random access pointer arithmetic versus $O(n)$ linear sequential search.

**Blocked by:** 01: Reference Blueprints Generation (Nanabanana), 02: Procedural Classroom Campus Diorama & Lighting

**Status:** closed

- [x] Create procedural Three.js factory in `frontend/src/assets/3d/createArrayStationModel.ts` based on `asstesimages/array_station.png`.
- [x] Implement animated sliding probe carriage that moves smoothly between array indices with LED indicator lights.
- [x] Create R3F canvas component `frontend/src/components/canvas/ArrayStation.tsx` situated in the Array Lab wing.
- [x] Add interactive buttons / key triggers to jump directly to an index ($O(1)$) or animate a step-by-step linear search scan ($O(n)$).
- [x] Display visual error indicator when attempting an out-of-bounds index access (e.g. index 5 or -1).
