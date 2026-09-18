# 01: Core Navigable Atrium, Central Dais & Learner Profile Switcher

**What to build:** The learner can freely navigate the cybernetic hexagonal Atrium in third-person controlling a 3D Avatar (WASD keyboard translation + mouse orbital follow-camera). In the center of the Atrium, an elevated Central Dais displays a rotating 3D holographic Knowledge Graph constellation whose nodes dynamically glow emerald, amber, or crimson based on the active learner's Mastery vector. A top-bar HUD connects to the backend, enabling instantaneous switching between Learner A (Advanced: high mastery across all concepts) and Learner B (Remedial: prerequisite gap with Stack at 38%), which immediately updates backend state and re-colors the 3D Knowledge Graph nodes live.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Backend serves learner profiles and dynamic world states for Learner A and Learner B
- [x] React Three Fiber 3D canvas renders the hexagonal Atrium with obsidian flooring, radial archways, and atmospheric cybernetic lighting
- [x] Third-person Avatar controller supports smooth WASD translation, heading orientation, and boundary collision
- [x] Damped follow-camera tracks the Avatar smoothly with mouse-drag orbit controls
- [x] Central Dais displays a rotating 3D holographic Knowledge Graph constellation with concept nodes color-coded by active Mastery
- [x] Top-bar HUD enables instant switching between Learner A and Learner B, immediately re-rendering 3D node colors without page reload
- [x] Automated integration test verifies profile switching and 3D state synchronization
- [x] 3D models and materials conform to ASSETS.md: educational Knowledge Graph and architecture are built dynamically in Three.js, with any static assets adhering to CC0 GLTF/GLB standards and recorded in public/assets/manifest.json

