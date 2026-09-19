# Learniverse AI — Backend Logic & Mathematical Specification

## 0. Purpose

This document defines the mathematical and backend logic that should be implemented for the **Learniverse AI** adaptive-learning prototype.

The uploaded TechnoSpark proposal specifies the following core components:

- 2PL IRT diagnostic/adaptive placement
- 2-step Bayesian Knowledge Tracing (BKT)
- NetworkX prerequisite DAG / Knowledge Graph
- ZPD Gaussian-gain planning
- SM-2 spaced repetition
- POMDP-based adaptive tutoring / sequential decision-making
- Multi-agent planning, validation and tool execution

The proposal's stated learning loop is:

> **Student → Assess → Understand → Plan → Teach → Evaluate → Adapt → Revise → Next Action**

The formulas below turn that architecture into an implementable backend specification. Where the proposal names an algorithm but does not specify exact parameter values/equations, this document labels the equation as a **prototype implementation choice** that must be calibrated later.

---

# 1. Core Backend Data Model

The backend maintains a learner state per concept.

For concept `c`:

```text
LearnerConceptState(c) = {
  mastery_bkt,
  ability_irt,
  confidence,
  recall_score,
  understanding_score,
  problem_solving_score,
  transfer_score,
  misconception_flags,
  prerequisite_status,
  last_review_at,
  next_review_at
}
```

Represent the learner's knowledge map as:

\[
\mathbf{K}_t = [M_1(t), M_2(t), ..., M_n(t)]
\]

where:

\[
M_c(t) = P(K_c=1 \mid E_{1:t})
\]

is the estimated probability that the learner has mastered concept `c` after all valid evidence up to time `t`.

**Important:** this is a probabilistic **knowledge state**, not a literal measurement of biological memory.

---

# 2. Evidence Validity Gate

Before any BKT or IRT update, the backend must determine whether an event is valid learning evidence.

## 2.1 Learning vs technical telemetry

### Learning evidence

- answer correctness
- concept tested
- item difficulty
- item discrimination
- explanation quality / rubric result
- problem-solving outcome
- transfer outcome
- hint/support level
- prerequisite performance
- retention/retrieval result

### Technical/context telemetry

- network latency
- bandwidth
- timeout
- packet loss
- buffering
- FPS/device performance
- browser/API failure

Technical telemetry can change **delivery mode**, but must not directly lower mastery.

## 2.2 Validity variable

Define:

\[
V_i \in [0,1]
\]

For normal completed evidence:

\[
V_i = 1
\]

For a failed/ambiguous technical event:

\[
V_i = 0
\]

Examples:

```text
VALID_ANSWER       -> V = 1
NETWORK_TIMEOUT    -> V = 0
BROWSER_CRASH      -> V = 0
VIDEO_BUFFERING    -> V = 0 for video-consumption evidence
INCOMPLETE_ATTEMPT -> V = 0
```

Do **not** convert timeout into an incorrect answer.

Conceptually:

\[
\Delta M_{effective} = V_i \cdot \Delta M
\]

Therefore if `V = 0`, the mastery update is zero.

---

# 3. BKT — Continuous Concept Mastery

BKT is the primary mechanism for continuous concept-level mastery tracking.

For a concept `c`, maintain:

\[
L_t = P(K_t=1)
\]

where `L_t` is the current probability that the learner knows the concept.

Parameters:

- `L0` = initial knowledge probability
- `T` = probability of learning after an opportunity
- `S` = slip probability
- `G` = guess probability

## 3.1 Correct response update

For a correct response:

\[
P(K_t=1 \mid C)
=
\frac{L_t(1-S)}{L_t(1-S)+(1-L_t)G}
\]

Then learning transition:

\[
L_{t+1} = P(K_t=1 \mid C) + (1-P(K_t=1 \mid C))T
\]

## 3.2 Incorrect response update

For an incorrect response:

\[
P(K_t=1 \mid I)
=
\frac{L_t S}{L_t S+(1-L_t)(1-G)}
\]

Then:

\[
L_{t+1} = P(K_t=1 \mid I) + (1-P(K_t=1 \mid I))T
\]

Depending on the prototype's selected BKT convention, the learning-transition step can be disabled after an incorrect response or kept as a small learning opportunity. Keep this behavior configurable.

## 3.3 Implementation rule

Only apply BKT when:

```text
assessment_event.valid == true
AND
assessment_event.concept_id != null
```

Do not update BKT from:

- time spent alone
- movement in the 3D world
- network delay
- video loading failure
- number of clicks

unless the interaction contains a valid educational outcome.

---

# 4. 2PL IRT — Ability and Adaptive Assessment

The proposal specifies **2PL IRT diagnostic placement** and adaptive IRT assessment.

For item `i`:

\[
P(X_i=1 \mid \theta,a_i,b_i)
=
\frac{1}{1+e^{-a_i(\theta-b_i)}}
\]

where:

- `theta` = learner ability
- `a_i` = item discrimination
- `b_i` = item difficulty
- `X_i=1` = correct answer

## 4.1 Interpretation

- If `theta > b_i`, probability of success increases.
- If `theta < b_i`, probability of success decreases.
- Higher `a_i` means the item is more discriminative around its difficulty.

## 4.2 Adaptive question selection

A simple first prototype may choose the item whose difficulty is closest to current ability:

\[
i^* = \arg\min_i |b_i-\theta|
\]

A more complete IRT implementation should select the item with maximum expected information.

For 2PL:

\[
I_i(\theta)=a_i^2 P_i(\theta)(1-P_i(\theta))
\]

Then:

\[
i^* = \arg\max_i I_i(\theta)
\]

subject to constraints such as:

```text
- concept must be eligible
- prerequisite gate must be satisfied
- item not recently repeated
- item must match the learning objective
```

## 4.3 Ability estimation

For the prototype, estimate `theta` with a stable iterative method such as Newton-Raphson or a bounded optimizer.

For item responses `x_i ∈ {0,1}`:

\[
\ell(\theta)
=
\sum_i \left[x_i\ln P_i(\theta)+(1-x_i)\ln(1-P_i(\theta))\right]
\]

Estimate:

\[
\hat\theta = \arg\max_\theta \ell(\theta)
\]

Use bounds to avoid numerical explosion, for example:

\[
-4 \le \theta \le 4
\]

with these bounds treated as a prototype implementation setting.

---

# 5. Knowledge Graph / Prerequisite Model

Represent the curriculum as a directed acyclic graph (DAG):

\[
G=(V,E)
\]

where:

- `V` = concepts
- `E` = prerequisite edges

Example:

```text
Arrays → Stack → Recursion
```

For edge:

\[
p \rightarrow c
\]

`p` is a prerequisite for `c`.

## 5.1 Prerequisite gate

Let:

- `M_p` = BKT mastery of prerequisite `p`
- `tau_p` = required mastery threshold

Then:

\[
Eligible(c)=
\mathbf{1}\left[\min_{p\in Pred(c)}M_p \ge \tau_p\right]
\]

If the prerequisite condition fails, the planner should consider remediation before advancing.

Your current demo uses a 70% prerequisite threshold for the Stack → Recursion gate; keep this as a configurable parameter rather than a universal rule.

---

# 6. Mastery Dimensions: Recall, Understanding, Problem Solving, Transfer

A single percentage should not be used to represent every aspect of learning.

For each concept, maintain separate evidence streams:

```text
Recall
Understanding
Application
Problem Solving
Transfer
Retention
```

For dimension `d`, define a weighted performance estimate:

\[
D_d = \frac{\sum_i w_i x_i}{\sum_i w_i}
\]

where:

- `x_i ∈ {0,1}` for correct/incorrect valid evidence
- `w_i` is the item weight

The initial prototype can use equal weights:

\[
w_i=1
\]

and later weight items by IRT information, expert labels, or calibrated item quality.

## 6.1 Example

```text
Recall         = 0.95
Understanding  = 0.82
Application    = 0.74
Problem solving= 0.68
Transfer       = 0.45
```

Interpretation:

> Strong recall does not necessarily imply strong transfer.

This allows the planner to recommend a transfer-oriented task instead of repeating recall questions.

---

# 7. Confidence in the Learner Model

Do not make aggressive decisions when evidence is sparse.

Maintain:

\[
C_c \in [0,1]
\]

as a configurable confidence estimate.

A simple prototype confidence model is:

\[
C_c = 1-e^{-n_c/\kappa}
\]

where:

- `n_c` = number of valid observations for concept `c`
- `kappa` = configurable saturation constant

This is a **prototype heuristic**, not a standard BKT equation.

Use confidence in decisions:

```text
Low confidence  -> collect additional evidence
Medium confidence -> cautious adaptation
High confidence -> stronger progression/remediation action
```

---

# 8. Detecting the Gap to Improve

For concept `c`, define a target mastery threshold `tau_c`.

Current gap:

\[
Gap_c = \max(0, \tau_c-M_c)
\]

Example:

\[
M_{Stack}=0.38
\]

\[
\tau_{Stack}=0.70
\]

Therefore:

\[
Gap_{Stack}=0.70-0.38=0.32
\]

This identifies the size of the current gap.

For multiple concepts, define a priority score:

\[
Priority_c = Gap_c \times W_c
\]

where `W_c` can represent prerequisite importance / downstream dependency weight.

A concept blocking several downstream concepts can receive a larger `W_c`.

---

# 9. Improvement Task Generation

Candidate actions can include:

```text
- recall quiz
- conceptual explanation
- worked example
- Feynman explanation
- visual simulation
- 3D mission
- guided tracing
- coding problem
- transfer problem
- retrieval practice
- spaced review
```

For each candidate action `a`, estimate expected mastery improvement:

\[
\Delta M_c(a)
=
E[M_c^{after}-M_c^{before}\mid a]
\]

In the first prototype, this can be estimated from historical task effectiveness or a rule-based prior.

Example rule-based estimate:

```text
expected_gain = base_gain(task_type)
                 × concept_gap
                 × difficulty_fit
                 × quality_factor
```

Mark all such coefficients as configurable and calibrate them from real interaction data.

---

# 10. ZPD Gaussian-Gain Planner

The submitted architecture names **ZPD Gaussian-gain planning**.

The planner should prefer activities near the learner's productive challenge zone.

Let:

- `d_a` = difficulty of candidate action `a`
- `theta` = learner ability
- `sigma` = width of the challenge zone

Define:

\[
ZPD(a)=
\exp\left(-\frac{(d_a-\theta)^2}{2\sigma^2}\right)
\]

Interpretation:

- too easy → lower expected gain
- appropriately challenging → higher gain
- far beyond current ability → lower gain

Then define an improvement value:

\[
Gain(a,c)=\Delta M_c(a)\times ZPD(a)
\]

---

# 11. Prerequisite-Aware Task Utility

Not all useful tasks have equal priority.

Define:

\[
Utility(a,c)=
Gain(a,c)\times W_c
-\lambda Cost(a)
\]

where:

- `W_c` = concept/prerequisite importance
- `Cost(a)` = computational, time, or interaction cost
- `lambda` = trade-off parameter

Choose:

\[
\boxed{
a^* = \arg\max_{a\in A} Utility(a,c)
}
\]

This is the key optimization that turns the learner state into an improvement recommendation.

---

# 12. POMDP-Style Sequential Decision Layer

The submitted technical approach describes a **POMDP-based adaptive tutor**.

Use the following abstraction:

### Hidden state

\[
s_t = \text{true learner knowledge state at time }t
\]

### Observation

\[
o_t = \text{observed learning evidence}
\]

Examples:

```text
correct answer
incorrect answer
explanation response
hint use
3D mission outcome
transfer task result
```

### Action

\[
a_t \in A
\]

Examples:

```text
teach
practice
give hint
activate Feynman
increase difficulty
decrease difficulty
unlock concept
schedule review
```

### Reward

Use a learning-oriented reward rather than engagement-only reward:

\[
R_t =
\alpha\Delta M_t
+\beta\Delta T_t
-\gamma Cost_t
\]

where:

- `ΔM_t` = mastery improvement
- `ΔT_t` = transfer/retention improvement
- `Cost_t` = intervention cost

These weights are prototype parameters and need calibration.

The sequential objective is:

\[
\pi^*
=
\arg\max_\pi
E\left[\sum_{t=0}^{T}\gamma^tR_t\right]
\]

where `gamma` is the discount factor.

For the hackathon prototype, the full POMDP can be simplified into the expected-gain utility planner above while keeping the same state/action abstraction.

---

# 13. Feynman Agent Decision Logic

The Feynman component should be invoked when evidence indicates a conceptual issue, not merely whenever a student gets one question wrong.

Possible trigger function:

\[
FeynmanTrigger(c)=
\mathbf{1}
[Misconception_c
\lor RepeatedErrors_c
\lor LowConfidence_c]
\]

A stronger configurable trigger score can be:

\[
T_F =
\alpha E_c
+\beta H_c
+\gamma Mis_c
+\delta(1-C_c)
\]

where:

- `E_c` = normalized repeated-error signal
- `H_c` = normalized hint dependence
- `Mis_c` = misconception signal
- `C_c` = confidence

Trigger if:

\[
T_F > \tau_F
\]

The Feynman Agent then selects a modality:

```text
text
visual
worked example
code visualization
voice
video
3D interaction
```

The proposal specifies the sequence:

**Detect → Diagnose → Select modality → Explain and verify.**

After the explanation, a verification question must produce fresh evidence before mastery is increased.

---

# 14. Verification After Intervention

After a Feynman intervention:

```text
Explanation
   ↓
Check question
   ↓
Valid result
   ↓
BKT update
```

Do not treat “watched explanation” as proof of learning.

The intervention is successful only if subsequent learning evidence supports improvement.

Define:

\[
InterventionGain = M_c^{post}-M_c^{pre}
\]

Track this separately to estimate which intervention types work best for each concept and learner state.

---

# 15. SM-2 — Spaced Repetition

SM-2 is used primarily for **when to review**, not for deciding which concept is currently the biggest prerequisite gap.

Maintain:

- `EF` = easiness factor
- `n` = successful repetition count
- `I` = review interval
- `q` = quality score, typically 0–5

Classic SM-2 easiness-factor update:

\[
EF' = EF + \left(0.1-(5-q)(0.08+(5-q)0.02)\right)
\]

with a floor:

\[
EF' = \max(1.3,EF')
\]

Typical interval progression:

\[
I_1=1
\]

\[
I_2=6
\]

and for subsequent repetitions:

\[
I_n=I_{n-1}EF
\]

If the quality is below the success threshold, reset/restart the repetition schedule according to the selected SM-2 implementation.

For the prototype, keep the exact SM-2 variant configurable and test it independently from BKT.

---

# 16. High / Medium / Low Mastery Classification

The system should not use a single raw score.

A practical prototype rule is:

```text
HIGH
- BKT mastery above calibrated threshold
- sufficient confidence
- prerequisites satisfied
- acceptable problem-solving/transfer evidence

MEDIUM
- partial BKT mastery
- some inconsistency or support dependence
- prerequisites mostly satisfied

LOW
- low BKT mastery
- major prerequisite gap or repeated misconception
- insufficient independent application evidence

UNCERTAIN
- insufficient valid evidence
- do not penalize; collect more evidence
```

Initial numeric thresholds should be treated as **calibration parameters**, not universal educational truths.

Example configurable values:

```text
HIGH_MASTERY_THRESHOLD = 0.75
LOW_MASTERY_THRESHOLD  = 0.45
PREREQ_THRESHOLD       = 0.70
MIN_CONFIDENCE          = configurable
```

---

# 17. 3D Environment Interaction → Learning Evidence

3D interaction should only affect mastery when it contains an educational objective.

### Valid educational interaction

```text
Predict state of Stack
→ manipulate Push/Pop
→ answer correctly
→ explain reasoning
```

This creates learning evidence.

### Context/behavioral interaction

```text
Walk around classroom
Open objects
Time spent exploring
```

These may inform engagement/context but should **not directly change mastery**.

### Technical interaction

```text
FPS
latency
buffering
API error
```

These should never reduce mastery.

---

# 18. Network-Aware Delivery Optimization

The backend should maintain a separate technical context:

```text
NetworkContext = {
  bandwidth_class,
  latency_ms,
  connection_stability,
  device_class
}
```

This context affects **content delivery**, not mastery estimation.

Example policy:

```text
GOOD_NETWORK
→ video + voice + rich 3D

LIMITED_NETWORK
→ compressed media + diagrams + text

VERY_LOW_NETWORK
→ text + static diagrams + lightweight interactions
```

The same learning objective should remain available through alternate modalities.

Formally:

\[
DeliveryMode = f(NetworkContext, ContentType)
\]

while:

\[
Mastery = f(LearningEvidence)
\]

and explicitly:

\[
\frac{\partial Mastery}{\partial NetworkQuality}=0
\]

as a design constraint.

---

# 19. Recommended Backend Decision Pipeline

```text
1. Receive student event
        ↓
2. Validate event
        ↓
3. Separate learning vs technical telemetry
        ↓
4. Update BKT for relevant concepts
        ↓
5. Update IRT ability / select next item
        ↓
6. Read Knowledge Graph prerequisites
        ↓
7. Detect gaps and misconceptions
        ↓
8. Compute candidate task expected gain
        ↓
9. Apply ZPD Gaussian factor
        ↓
10. Apply prerequisite importance / cost
        ↓
11. Select argmax Utility(task)
        ↓
12. Agent selects approved tool(s)
        ↓
13. Execute learning action
        ↓
14. Verify outcome
        ↓
15. Recompute learner state
        ↓
16. Re-plan if state changed
        ↓
17. Update 3D environment
        ↓
18. Schedule future review using SM-2
```

This maps directly to the project's agentic cycle:

**Observe → Diagnose → Plan → Act → Verify & Adapt**.

---

# 20. Example: Stack → Recursion

Initial state:

\[
M_{Stack}=0.38
\]

Recursion requires:

\[
\tau_{Stack}=0.70
\]

Therefore:

\[
Gap=0.32
\]

Student fails a recursion item.

Knowledge Graph:

```text
Stack → Recursion
```

Planner evaluates candidates:

```text
A1 = easy Stack quiz
A2 = Stack push/pop visualization
A3 = hard Stack coding task
```

For each task:

\[
Utility(a)=
\Delta M(a)\times ZPD(a)\times W_{prerequisite}
-\lambda Cost(a)
\]

Assume:

```text
A1 Utility = 0.08
A2 Utility = 0.20
A3 Utility = 0.03
```

Select:

\[
a^*=A2
\]

Student performs the task.

BKT updates:

\[
0.38 \rightarrow 0.56
\]

Planner repeats the process.

Later:

\[
0.56 \rightarrow 0.68 \rightarrow 0.74
\]

Now:

\[
0.74 > 0.70
\]

Prerequisite gate passes → Recursion becomes eligible.

This matches the submitted demo, where Stack mastery rises from 38% to 74% before Recursion is unlocked. 

---

# 21. API-Level Functions to Implement

Recommended backend service boundaries:

```python
update_bkt(event)
estimate_irt_ability(responses)
select_adaptive_item(theta, item_bank, constraints)
get_prerequisites(concept_id)
compute_prerequisite_gap(concept_id, learner_state)
detect_misconception(events)
generate_candidate_tasks(concept_id, learner_state)
predict_task_gain(task, learner_state)
compute_zpd_score(task, theta, sigma)
compute_task_utility(task, learner_state)
select_next_action(tasks, learner_state)
run_feynman_intervention(concept_id, learner_state)
verify_intervention(result)
schedule_sm2_review(concept_id, quality)
update_3d_environment(learner_state, decision)
```

---

# 22. Minimum Database Tables

```text
users
concepts
concept_prerequisites
items
item_responses
learner_concept_state
learner_ability_state
misconceptions
learning_events
interventions
intervention_outcomes
spaced_reviews
environment_state
agent_decisions
```

Store both:

1. **raw evidence** for auditability
2. **derived state** for fast decision-making

Never overwrite historical evidence when recalculating the learner state.

---

# 23. Agent Governance Rules

The LLM/agents should **not** become the source of truth for mastery.

Use:

```text
BKT           → mastery evidence
IRT           → ability / assessment evidence
Knowledge Graph→ prerequisite truth
SM-2          → review scheduling
Rule/validator → safety and threshold checks
Agent         → reasoning, planning, tool selection
```

The agent should receive structured state and return a constrained action such as:

```json
{
  "action": "STACK_REMEDIATION",
  "concept": "stack",
  "reason": "prerequisite_gap",
  "tool": "start_stack_mission",
  "difficulty": 0.3
}
```

The backend validator checks whether the action is allowed before execution.

---

# 24. Critical Implementation Rules

### Rule A — Technical failure is not a learning failure

Timeout ≠ wrong answer.

### Rule B — Interaction is not automatically mastery

Walking/clicking ≠ learning.

### Rule C — One correct answer is not full mastery

Use repeated, varied evidence.

### Rule D — Recall is not transfer

Test across multiple cognitive task types.

### Rule E — Low confidence should cause evidence collection

Do not make strong negative decisions from sparse data.

### Rule F — Agent recommendations must be validated

LLM output cannot directly unlock a concept or modify BKT.

### Rule G — Personalization changes the path, not the mastery standard

Different students may receive different tasks, but the competency criteria remain consistent.

---

# 25. Parameter Configuration File

Store parameters outside code so they can be tuned:

```yaml
bkt:
  initial_mastery: 0.30
  guess: 0.20
  slip: 0.10
  learn: 0.15

irt:
  theta_min: -4.0
  theta_max: 4.0
  selection: "max_information"

prerequisites:
  default_threshold: 0.70

mastery:
  low_threshold: 0.45
  high_threshold: 0.75

zpd:
  sigma: 0.50
  utility_cost_lambda: 0.10

confidence:
  kappa: 8

feynman:
  trigger_threshold: 0.60

sm2:
  min_easiness_factor: 1.30
```

These are **initial prototype defaults only** and must be calibrated with test data.

---

# 26. What the Backend Ultimately Optimizes

The backend should not optimize for:

```text
more clicks
more time in app
more videos watched
higher raw quiz score
```

It should optimize for:

\[
\boxed{
\text{Expected improvement in learner knowledge state}
}
\]

subject to:

```text
prerequisite constraints
assessment validity
technical constraints
content availability
intervention cost
confidence / uncertainty
```

The central decision is therefore:

\[
\boxed{
a^*=
\arg\max_a
E[\text{Learning Gain}\mid learner\ state,a]
}
\]

That is the mathematical core of Learniverse AI's adaptive loop.

---

# 27. Source Alignment

The uploaded TechnoSpark proposal explicitly identifies the implemented/proposed stack around **2PL IRT, 2-step BKT, SM-2, NetworkX prerequisite DAG, ZPD Gaussian-gain planning, and POMDP-based adaptive tutoring**, and describes the closed-loop adaptive workflow. The proposal's Recursion remediation example uses **Stack mastery 38% vs required 70%**, followed by remediation and mastery reaching 74% before Recursion is unlocked.

When implementing, keep the exact parameter values and simplifications configurable so the prototype can be calibrated from actual learner data rather than presenting prototype thresholds as universal educational constants.
