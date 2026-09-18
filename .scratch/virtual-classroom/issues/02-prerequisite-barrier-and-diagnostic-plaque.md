# 02: Prerequisite Barrier & In-World Floating Diagnostic Plaque

**What to build:** Approaching the Recursion Lab archway physically blocks the Avatar with an energized crimson laser Prerequisite Barrier when the learner has an unresolved prerequisite gap. A floating 3D holographic Diagnostic Plaque projects in front of the barrier, displaying the missing prerequisite ("Requires Stack Mastery >= 70%, Current: 38%"). When the evaluator toggles the active profile to Learner A on the top-bar HUD, the barrier dynamically recedes and the entrance opens freely, demonstrating real-time spatial access control.

**Blocked by:** 01: Core Navigable Atrium, Central Dais & Learner Profile Switcher

**Status:** completed

- [x] Prerequisite Knowledge Graph model evaluates readiness and marks Recursion Lab as locked when Stack Mastery < 0.70
- [x] Procedural crimson laser grid shader renders across the entrance of the Recursion Lab when locked
- [x] Floating 3D holographic Diagnostic Plaque displays the required threshold and current mastery
- [x] Physical Avatar movement collision prevents passing through sealed Prerequisite Barriers
- [x] Toggling between Learner A and Learner B on the HUD immediately updates barrier obstruction and collision state in the 3D scene
- [x] Automated test verifies barrier state matches prerequisite evaluation
