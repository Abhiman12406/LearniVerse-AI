# 04: In-Lab Kinetic Activities with Live Mastery Sync

**What to build:** Inside the assigned lab (e.g., Stack Lab, Recursion Lab, Array Station), the student engages in kinetic 3D challenges aligned with the LangGraph agent's assigned mission. As the student solves challenge steps and interacts with the physical apparatus (such as pushing/popping frames or stepping through pointers), each action submits learning interactions that update BKT mastery in real-time, trigger barrier dissolution when mastery thresholds are crossed (e.g. Stack crossing 70% dissolves the Recursion barrier), and streams agent deliberation traces to the Telemetry Drawer.

**Blocked by:** 03: LangGraph Agent Deliberation & 1-Click Lab Teleport

**Status:** completed

- [x] Kinetic console displays the LangGraph-assigned mission, learning objectives, and challenge steps.
- [x] Submitting step answers manipulates the 3D apparatus (e.g. stack cylinder, memory bays) with visual feedback.
- [x] Each answered challenge step submits an interaction to the backend, computing immediate BKT posterior delta.
- [x] Crossing the 70% prerequisite threshold triggers the cinematic barrier dissolve sequence and sound effects for the locked downstream wing.
- [x] All updated deliberation traces are viewable in the Telemetry Drawer for explainability.
