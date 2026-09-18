# 06: BKT Bayesian Knowledge Tracing Engine & Interaction Loop

**What to build:** Submitting a challenge answer calls `POST /api/interactions`. The Python BKT engine computes posterior beliefs ($P(L_t)$), updates the learner store, and returns a world delta. The HUD displays real-time animated Mastery probability gauges that dynamically climb or drop with every answer. Includes a `POST /api/simulate-mastery-jump` endpoint for 1-click pitch acceleration (38% → 74%).

**Blocked by:** 05: Dual-Layer Glassmorphic Challenge Console & Stack DSA Missions

**Status:** ready-for-agent

- [ ] Backend Python BKT engine implements exact Bayesian belief update equations and learning transition equations
- [ ] `POST /api/interactions` endpoint receives answer submissions, updates concept Mastery, and returns updated world delta
- [ ] HUD displays dynamic animated Mastery probability gauges that update immediately after each interaction
- [ ] `POST /api/simulate-mastery-jump` endpoint accelerates Learner B's Stack Mastery from 38% to 74% in a single call for live demonstrations
- [ ] Crossing 70% Stack Mastery automatically evaluates prerequisite readiness and emits an unlock trigger for Recursion Lab
- [ ] Automated tests verify BKT mathematical bounds, monotonic increases on correct streaks, slip adjustments, and API contracts
