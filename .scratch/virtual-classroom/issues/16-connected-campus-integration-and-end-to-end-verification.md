# 16: Connected Campus Integration & End-to-End Verification

**What to build:** All 5 specialized laboratories (Array Station, Linked List Lab, Stack Lab, Recursion Chamber, Tree & BST Lab) and the central diorama hub are unified into a fully functional, seamlessly connected virtual classroom campus. The avatar can smoothly navigate across the entire compound at a solid 60 FPS in either Third-Person or First-Person perspective. Switching perspectives, walking through corridors, operating apparatuses, and triggering the 90-second hero pitch barrier dissolve work end-to-end without graphical glitches, physics snags, or performance regressions. Comprehensive automated tests verify collision clamping, store perspective state management, lab apparatus activations, and texture caching.

**Blocked by:** 13: Dual-Perspective Camera Controller & Exponential Motion Damping, 14: West & East Lab Wings (Array Station & Linked List Lab with Walk-in Corridors), 15: North & South-East Lab Wings (Recursion Chamber & Tree/BST Lab with Prerequisite Barrier)

**Status:** ready-for-agent

- [ ] Complete connected campus with 5 enterable laboratory wings renders reliably at 60 FPS across continuous navigation.
- [ ] Avatar can freely traverse all corridors and enter each lab through doorway openings without clipping or falling.
- [ ] First-person (1P) and Third-person (3P) views transition smoothly with exponential damping across the entire world, with avatar mesh properly hidden in 1P.
- [ ] All 5 DSA apparatuses (Array rack, Linked list nodes, Stack cylinder, Recursion tower, Tree canopy) respond to proximity and interaction hotkeys.
- [ ] Hero pitch flow (Student B starting with locked Recursion Barrier, solving Stack challenge, BKT updating to 0.74, Barrier dissolving with audio and particles) functions flawlessly in the enlarged campus.
- [ ] Automated test suite passes 100% of tests with no regressions in frontend or backend suites.
