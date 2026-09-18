# 02: Knowledge Graph BKT Updates & Prerequisite Barrier Recalculation

**What to build:** Upon submitting the 5 diagnostic answers, the system executes Bayesian Knowledge Tracing (BKT) belief updates across all 5 nodes of the Knowledge Graph, updating the student's authoritative profile. Prerequisite forcefields across the virtual classroom are dynamically recalculated (e.g. Recursion Wing remains locked if Stack mastery < 70%). The assessment results view renders real-time animated prior-to-posterior BKT deltas and question-by-question explanations.

**Blocked by:** 01: AI Diagnostic Assessment Test Delivery

**Status:** completed

- [x] Each of the 5 submitted answers executes a 2-step BKT belief update for its corresponding concept node (Array, Linked List, Stack, Recursion, Tree).
- [x] Active student profile is atomically updated with new mastery probabilities, IRT estimates, and classification tiers.
- [x] Prerequisite barrier forcefield states are evaluated across all wings, enforcing hard prerequisite rules (e.g., Recursion sealed when Stack < 70%).
- [x] The results screen displays visual BKT mastery delta bars showing before-and-after scores per concept.
- [x] Correct/incorrect explanations are provided for each question to reinforce foundational concepts.

