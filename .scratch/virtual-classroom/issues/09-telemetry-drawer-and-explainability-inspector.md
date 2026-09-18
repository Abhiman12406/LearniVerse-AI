# 09: Slide-Out Telemetry Drawer & Explainability Inspector

**What to build:** Clicking `[🧠 AGENT BRAIN]` on the HUD smoothly slides out the Telemetry Drawer alongside the 3D canvas. Evaluators can inspect the live 5-agent deliberation trace, the "Why This Decision?" explainability card proving deterministic guardrail certification, and step-by-step mathematical BKT belief calculations.

**Blocked by:** 08: 5-Agent LangGraph Deliberation Pipeline & Deterministic Guardrails

**Status:** closed

- [x] Top-bar HUD includes `[🧠 AGENT BRAIN]` button that smoothly toggles the slide-out Telemetry Drawer overlay
- [x] Multi-agent trace view displays step-by-step cards for each agent with status badges (`CERTIFIED`, `OVERRULED`) and execution timestamps
- [x] "Why This Decision?" Explainability Card clearly articulates the deterministic policy justification behind the active recommendation
- [x] BKT Mathematics Inspector explains prior mastery, slip/guess probability contributions, and posterior transition step-by-step
- [x] Telemetry Drawer subscribes to store events and updates in real time whenever an interaction or profile switch occurs
- [x] Automated tests verify Telemetry Drawer toggling, trace rendering, and explainability card formatting

