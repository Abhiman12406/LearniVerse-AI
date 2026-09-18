# Feynman Agent --- Multimodal Adaptive Explanation System

## 1. Purpose

The Feynman Agent is a component of the AI-powered adaptive learning
system.

Its primary purpose is:

> When a student finds a concept difficult to understand, the Feynman
> Agent identifies the difficulty and provides an easier explanation
> using the most appropriate modality.

Supported explanation modalities:

-   Text explanation
-   Diagram / visual explanation
-   Image
-   Voice explanation
-   Code/example visualization
-   AI-generated short video
-   Interactive 3D visualization through the existing game environment

The agent should not behave like a generic chatbot. It should use the
student's current learning context to decide what to explain, how deeply
to explain it, and which modality is most useful.

The Feynman Agent uses **n8n as the workflow orchestration layer**,
while the existing FastAPI backend, learner model, Knowledge Graph, BKT,
database, game environment, and AI services remain responsible for their
respective domains.

------------------------------------------------------------------------

## 2. Position in the Existing System

``` text
Student
   ↓
Learning Interaction
   ↓
Learning Evidence
   ↓
FastAPI Backend
   ↓
Learner Model + BKT
   ↓
Knowledge Graph
   ↓
Adaptive Planner
   ↓
Student encounters difficulty
   ↓
Feynman Agent
   ↓
Multimodal Explanation
   ↓
Student learns
   ↓
Verification / New Learning Evidence
   ↓
FastAPI
   ↓
BKT / Learner Model Update
   ↺
```

The Feynman Agent consumes existing learner context rather than
maintaining a separate independent student model.

------------------------------------------------------------------------

## 3. Core Design Principle

The agent should answer five questions:

1.  What is the student struggling with?
2.  Why is the student struggling?
3.  What prerequisite or misconception may be responsible?
4.  What explanation modality is most suitable?
5.  Did the explanation actually help?

The agent should not simply respond:

> "Here is an explanation of recursion."

Instead:

``` text
Student struggles with recursion
        ↓
Check learner state
        ↓
Identify weak prerequisite / misconception
        ↓
Select explanation strategy
        ↓
Generate suitable explanation
        ↓
Deliver through UI
        ↓
Check understanding
        ↓
Generate learning evidence
        ↓
Update learner model
```

------------------------------------------------------------------------

## 4. What the Feynman Agent Is NOT

The Feynman Agent should NOT:

-   Directly modify BKT mastery values.
-   Directly unlock prerequisite-gated zones.
-   Decide authoritative curriculum correctness.
-   Replace the Knowledge Graph.
-   Replace the adaptive planner.
-   Store the complete student database inside an LLM prompt.
-   Make the 3D game independently decide learning progression.
-   Generate unrestricted curriculum paths.
-   Depend entirely on an LLM being available.

The LLM interprets and generates explanations.

The deterministic backend remains the source of truth.

------------------------------------------------------------------------

## 5. Existing System Components

  -----------------------------------------------------------------------
  Component                           Responsibility
  ----------------------------------- -----------------------------------
  React + React Three Fiber           Student UI and 3D classroom

  FastAPI                             Application backend and learning
                                      APIs

  PostgreSQL                          Persistent student, event, mastery
                                      and content data

  BKT                                 Knowledge/mastery estimation

  Knowledge Graph                     Concept relationships and
                                      prerequisites

  Adaptive Planner                    Determines next learning action

  Game Agent                          Converts validated learning
                                      decisions into game-world changes

  n8n                                 Feynman workflow orchestration

  Gemini                              Multimodal reasoning and
                                      explanation generation

  Speech-to-Text                      Converts voice input to text

  Video generation service            Creates visual/video explanations
                                      where supported

  Template/content database           Trusted educational examples,
                                      questions and media

  Observability                       Records decisions, inputs, outputs
                                      and failures
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 6. Recommended Architecture

``` text
                    React / 3D Classroom
                           │
                           │ Feynman Request
                           ▼
                       FastAPI
                           │
                           ▼
                     n8n Webhook
                           │
                           ▼
                  ┌──────────────────┐
                  │ Input Router     │
                  └────────┬─────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           TEXT          AUDIO          IMAGE
             │             │             │
             │        Speech-to-Text     │
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                  Unified Student Input
                           │
                           ▼
                 Get Learning Context
                           │
                           ▼
                Feynman Analysis Agent
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
          Knowledge       Gap       Misconception
          confirmed     detected      detected
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                Explanation Strategy
                           │
             ┌─────────────┼──────────────┐
             ▼             ▼              ▼
           TEXT          VISUAL          VIDEO
             │             │              │
             ▼             ▼              ▼
          Gemini       Gemini /         Gemini /
          output       visual output    video-capable service
             │             │              │
             └─────────────┼──────────────┘
                           ▼
                    Student Response
                           │
                           ▼
                     Verification
                           │
                           ▼
                  Learning Evidence
                           │
                           ▼
                       FastAPI
                           │
                           ▼
                    BKT / Learner Model
                           │
                           ▼
                    Adaptive Planner
```

------------------------------------------------------------------------

## 7. Why n8n Should Be Used

n8n acts as the workflow orchestration layer.

It coordinates:

``` text
Receive input
   ↓
Determine modality
   ↓
Process audio/image if required
   ↓
Fetch learner state
   ↓
Fetch concept context
   ↓
Analyze difficulty
   ↓
Choose explanation modality
   ↓
Generate explanation
   ↓
Validate response
   ↓
Return result
   ↓
Collect learning evidence
```

n8n coordinates these operations but does not become the source of
educational truth.

------------------------------------------------------------------------

## 8. n8n Workflow

Recommended initial workflow:

``` text
Webhook
   ↓
Validate Request
   ↓
Set / Normalize Input
   ↓
Get Student State
   ↓
Get Concept Context
   ↓
Switch: Input Type
   ├── Text
   ├── Audio → Speech-to-Text
   └── Image → Gemini Vision
   ↓
Unified Evidence
   ↓
Gemini — Feynman Analyzer
   ↓
Parse Structured JSON
   ↓
Explanation Strategy
   ↓
Switch: Explanation Modality
   ├── Text
   ├── Visual
   ├── Voice
   ├── Video
   └── 3D
   ↓
Generate Explanation
   ↓
Validate Output
   ↓
Respond to Webhook
```

Verification can be a second n8n webhook/workflow:

``` text
Student Response
      ↓
n8n Verification Webhook
      ↓
Gemini Evaluator
      ↓
Learning Evidence
      ↓
FastAPI
      ↓
BKT
```

------------------------------------------------------------------------

## 9. Step 1 --- Student Requests Help

The student can press:

> 🧠 Ask Feynman

inside a learning activity.

Example:

``` json
{
  "student_id": "S001",
  "concept_id": "recursion",
  "activity_id": "recursion_trace_01",
  "input_type": "TEXT",
  "input": "I don't understand why the function keeps calling itself.",
  "request_type": "EXPLAIN"
}
```

FastAPI sends the request to the n8n webhook.

------------------------------------------------------------------------

## 10. Step 2 --- Input Router

Supported input types:

``` text
TEXT
AUDIO
IMAGE
CODE
GAME_EVENT
```

For audio:

``` text
Audio
 ↓
Speech-to-Text
 ↓
Transcript
```

For image:

``` text
Image
 ↓
Gemini Vision
 ↓
Visual understanding
```

For code:

``` text
Code
 ↓
Code analysis
 ↓
Concept evidence
```

All modalities should eventually become a common evidence structure.

------------------------------------------------------------------------

## 11. Unified Evidence

Example:

``` json
{
  "student_id": "S001",
  "concept_id": "recursion",
  "input_type": "AUDIO",
  "transcript": "I think recursion keeps calling until the answer is found.",
  "visual_observations": [],
  "code_observations": [],
  "source": "feynman_request"
}
```

This allows the remaining workflow to be modality-independent.

------------------------------------------------------------------------

## 12. Step 3 --- Retrieve Student Context

n8n calls the FastAPI backend.

Example:

``` http
GET /students/S001/learning-context?concept=recursion
```

FastAPI returns only relevant context.

Example:

``` json
{
  "student_id": "S001",
  "concept": "recursion",
  "mastery": 0.31,
  "prerequisites": {
    "stack": 0.42,
    "functions": 0.78
  },
  "recent_mistakes": [
    "cannot explain call stack",
    "confuses base case and recursive case"
  ],
  "recent_attempts": [
    {
      "question": "Q17",
      "correct": false
    }
  ],
  "current_activity": "recursion_lab"
}
```

Do not send the complete database to Gemini.

Only provide relevant context.

------------------------------------------------------------------------

## 13. Step 4 --- Feynman Analysis Agent

Gemini analyzes:

-   What the student already understands.
-   What the student does not understand.
-   Possible misconception.
-   Missing prerequisite.
-   Appropriate explanation complexity.
-   Recommended modality.

Example output:

``` json
{
  "concept": "recursion",
  "understood": [
    "function_calls_itself"
  ],
  "gaps": [
    "base_case",
    "call_stack"
  ],
  "misconceptions": [
    "thinks_recursive_calls_execute_without waiting"
  ],
  "recommended_explanation": {
    "modality": "VISUAL_3D",
    "difficulty": "BEGINNER",
    "focus": "call_stack"
  },
  "confidence": 0.91
}
```

The LLM does not assign authoritative mastery.

------------------------------------------------------------------------

## 14. Explanation Modality Selection

Example policy:

``` text
Simple factual confusion
        ↓
Text explanation

Relationship / process confusion
        ↓
Diagram / animation

Spatial / sequential concept
        ↓
Interactive 3D visualization

Abstract mental-model difficulty
        ↓
Visual + animation

Student requests audio
        ↓
Voice explanation

Complex dynamic process
        ↓
Short AI-generated video

Code execution confusion
        ↓
Code trace + visualization
```

This should be policy-guided rather than an unrestricted LLM choice.

------------------------------------------------------------------------

## 15. Example --- Recursion

Student says:

> "I don't understand what happens when a recursive function calls
> itself."

Analyzer:

``` json
{
  "gap": "call_stack",
  "recommended_modality": "VIDEO",
  "difficulty": "BEGINNER"
}
```

The Feynman Agent can generate a short visual explanation showing:

``` text
factorial(4)
      ↓
factorial(3)
      ↓
factorial(2)
      ↓
factorial(1)
      ↓
   BASE CASE
      ↑
   RETURN
```

The explanation should show:

1.  Function call.
2.  New call being added to the stack.
3.  Base case.
4.  Stack unwinding.
5.  Final result.

------------------------------------------------------------------------

## 16. Gemini's Role

### Understanding

Gemini can:

-   Analyze text.
-   Analyze images.
-   Understand diagrams.
-   Analyze code.
-   Interpret student explanations.

### Explanation

Gemini can:

-   Generate simplified explanations.
-   Generate examples.
-   Generate analogies.
-   Generate visual explanations.
-   Produce multimodal responses where supported.

### Verification

Gemini can:

-   Generate a short verification question.
-   Evaluate the student's explanation.
-   Detect remaining conceptual gaps.

Gemini should not directly write:

``` text
mastery = 0.87
```

Correct flow:

``` text
Feynman Agent
     ↓
Learning Evidence
     ↓
FastAPI
     ↓
BKT
     ↓
Mastery
```

------------------------------------------------------------------------

## 17. AI-Generated Video

Video is a specialized explanation format, not something generated for
every request.

Use video when:

-   The concept involves a process.
-   Sequence matters.
-   A static diagram is insufficient.
-   The student has failed previous explanations.
-   The student explicitly requests a video.

Recommended fallback:

``` text
AI Video
   ↓ unavailable
Animated diagram
   ↓ unavailable
Pre-built concept animation
   ↓ unavailable
Text + image explanation
```

The learning experience must continue even if video generation fails.

------------------------------------------------------------------------

## 18. 3D Integration

The Feynman Agent can request a 3D explanation through the existing Game
Agent.

Example:

``` json
{
  "action": "SHOW_3D_EXPLANATION",
  "concept": "recursion",
  "visualization": "call_stack",
  "zone": "recursion_lab",
  "focus": [
    "function_call",
    "stack_push",
    "base_case",
    "stack_pop"
  ]
}
```

The Feynman Agent should not directly manipulate Three.js objects.

Correct architecture:

``` text
Feynman Agent
      ↓
3D Explanation Instruction
      ↓
Game Agent
      ↓
Validated Game State
      ↓
React / R3F
      ↓
3D Visualization
```

------------------------------------------------------------------------

## 19. Student Verification

After the explanation, perform a small verification.

Example:

> "If factorial(4) calls factorial(3), what happens to factorial(4)
> while factorial(3) is executing?"

Student:

> "It stays on the call stack waiting for factorial(3) to return."

Example evidence:

``` json
{
  "student_id": "S001",
  "concept": "recursion",
  "evidence_type": "FEYNMAN_VERIFICATION",
  "skill": "call_stack",
  "correct": true,
  "confidence": 0.88
}
```

------------------------------------------------------------------------

## 20. BKT Integration

The Feynman Agent produces evidence.

BKT updates the learner model.

``` text
Feynman Verification
        ↓
Learning Evidence
        ↓
FastAPI
        ↓
BKT
        ↓
Updated Mastery
```

The numerical result must come from the BKT implementation and
configured parameters.

------------------------------------------------------------------------

## 21. Adaptive Replanning

After BKT updates the student state:

``` text
Updated learner state
        ↓
Knowledge Graph
        ↓
Adaptive Planner
        ↓
Next Best Action
```

Possible outcomes:

``` text
Still weak
   ↓
More remediation

Improving
   ↓
Normal practice

Prerequisite satisfied
   ↓
Unlock next concept

High mastery
   ↓
Advanced challenge
```

This connects Feynman back into the main adaptive-learning loop.

------------------------------------------------------------------------

## 22. Complete Example

Suppose:

``` text
Stack = 42%
Recursion = 31%
```

Student enters Recursion Lab.

The system detects a prerequisite problem:

``` text
Recursion Lab
     ↓
Stack prerequisite insufficient
     ↓
Student enters Stack remediation
```

Student struggles with LIFO.

They press:

> 🧠 Feynman --- Explain this to me.

Student speaks:

> "I don't understand why the last item is removed first."

Workflow:

``` text
Voice
 ↓
Speech-to-Text
 ↓
n8n
 ↓
Get learner state
 ↓
Gemini analysis
 ↓
Detect LIFO confusion
 ↓
Select visual explanation
 ↓
Generate explanation
 ↓
Student answers verification
 ↓
Learning evidence
 ↓
FastAPI
 ↓
BKT
```

If the student still struggles:

``` text
Second attempt
     ↓
Agent selects video
     ↓
Short visual explanation
     ↓
Verification
```

If the student later demonstrates sufficient Stack mastery:

``` text
Stack mastery ≥ prerequisite threshold
        ↓
Planner validates progression
        ↓
Recursion Lab unlocked
```

------------------------------------------------------------------------

## 23. n8n Node-Level Design

Recommended initial n8n nodes:

``` text
1. Webhook
      ↓
2. Validate Input
      ↓
3. Set / Normalize Request
      ↓
4. HTTP Request — Get Student Context
      ↓
5. Switch — Input Type
      ├── Text
      ├── Audio → STT
      └── Image → Gemini Vision
      ↓
6. Merge — Unified Evidence
      ↓
7. Gemini — Feynman Analyzer
      ↓
8. Structured Output Parser
      ↓
9. IF / Switch — Explanation Modality
      ├── Text → Gemini
      ├── Visual → Gemini
      ├── Voice → TTS / Browser speech
      ├── Video → Video generation service
      └── 3D → FastAPI/Game Agent
      ↓
10. Validate Output
      ↓
11. Respond to Webhook
```

Verification:

``` text
Student Response
      ↓
n8n Verification Webhook
      ↓
Gemini Evaluator
      ↓
Learning Evidence
      ↓
FastAPI
      ↓
BKT
```

------------------------------------------------------------------------

## 24. API Contracts

### Feynman Request

``` json
{
  "student_id": "S001",
  "concept_id": "recursion",
  "input_type": "TEXT",
  "input": "I don't understand recursion.",
  "requested_modality": null,
  "activity_id": "recursion_lab_01"
}
```

### Feynman Decision

``` json
{
  "decision_id": "FD001",
  "concept_id": "recursion",
  "problem": "call_stack_confusion",
  "modality": "VIDEO",
  "difficulty": "BEGINNER",
  "learning_objective": "understand_recursive_call_stack",
  "reason": "Student has repeatedly failed call-stack questions."
}
```

### Learning Evidence

``` json
{
  "student_id": "S001",
  "concept_id": "recursion",
  "evidence_type": "FEYNMAN_VERIFICATION",
  "skill": "call_stack",
  "correct": true,
  "response_time_ms": 6200,
  "confidence": 0.88,
  "source": "feynman_agent"
}
```

------------------------------------------------------------------------

## 25. Database Requirements

Reuse the existing database rather than creating a completely separate
Feynman database.

### feynman_sessions

``` text
session_id
student_id
concept_id
started_at
input_type
initial_problem
selected_modality
status
```

### feynman_interactions

``` text
interaction_id
session_id
input
input_type
analysis
response
modality
created_at
```

### learning_evidence

``` text
evidence_id
student_id
concept_id
source
evidence_type
skill
correct
confidence
timestamp
```

The learning evidence table can also be used by other parts of the
learning system.

------------------------------------------------------------------------

## 26. Prompt Design

### Feynman Analyzer

``` text
You are the Feynman Analysis Agent in an adaptive learning system.

Your job is to identify what the student understands,
what they do not understand, and what misconception may
be preventing understanding.

Use the supplied learner context.

Do not assign or modify mastery scores.

Do not invent prerequisite relationships.

Recommend the simplest effective explanation modality.

Return JSON only.
```

Expected schema:

``` json
{
  "understood": [],
  "gaps": [],
  "misconceptions": [],
  "recommended_modality": "TEXT",
  "difficulty": "BEGINNER",
  "learning_objective": "",
  "reason": "",
  "confidence": 0.0
}
```

### Explanation Generator

Input:

``` text
Concept
Student level
Current mastery
Detected gap
Misconception
Learning objective
Selected modality
```

Instruction:

> Explain only the identified gap. Use simple language, one concrete
> example, and a short verification question. Do not introduce unrelated
> advanced concepts.

------------------------------------------------------------------------

## 27. Personalization Rules

### Mastery

``` text
Low mastery
→ simple language
→ concrete example
→ visual support
→ more scaffolding

Medium mastery
→ analogy
→ guided example
→ independent question

High mastery
→ concise explanation
→ edge cases
→ transfer/application
```

### Previous attempts

``` text
Repeated failure
→ change explanation strategy

Successful previous strategy
→ reuse or extend it
```

### Misconception

``` text
Known misconception
→ explicitly address misconception
```

### Prerequisite

``` text
Prerequisite weakness
→ explain prerequisite first
```

------------------------------------------------------------------------

## 28. Explanation Strategy Memory

Record which explanation formats helped.

Example:

``` json
{
  "student_id": "S001",
  "concept": "recursion",
  "strategy_history": [
    {
      "modality": "TEXT",
      "result": "NOT_HELPFUL"
    },
    {
      "modality": "DIAGRAM",
      "result": "PARTIALLY_HELPFUL"
    },
    {
      "modality": "VIDEO",
      "result": "HELPFUL"
    }
  ]
}
```

This creates another personalization layer:

> Not only "What does this student know?" but also "What explanation
> approach has helped this student before?"

------------------------------------------------------------------------

## 29. Fallback Architecture

The Feynman Agent must not become a single point of failure.

``` text
Gemini available?
       │
   ┌───┴───┐
  YES      NO
   ↓        ↓
Gemini    Template
explanation explanation
   │        │
   └───┬────┘
       ↓
     Student
```

For video:

``` text
Video generation available?
       │
   ┌───┴───┐
  YES      NO
   ↓        ↓
Video    Animation
           ↓
        Diagram
           ↓
          Text
```

The core learning system must continue if:

-   n8n is temporarily unavailable.
-   Gemini is unavailable.
-   Speech-to-text is unavailable.
-   Video generation is unavailable.
-   3D service is unavailable.

------------------------------------------------------------------------

## 30. Security and Reliability

Never send unnecessary:

-   student information
-   credentials
-   database secrets
-   internal API keys
-   unrelated learning history

to the LLM.

Use:

``` text
Minimal context
+
Structured outputs
+
Validation
+
Deterministic backend
```

Every AI response should be validated before it affects the application.

------------------------------------------------------------------------

## 31. Observability

Log each Feynman interaction.

Recommended fields:

``` text
session_id
student_id
concept_id
input_type
input_length
learner_state_before
detected_gap
detected_misconception
selected_modality
agent_decision
generation_success
verification_result
learning_evidence_id
learner_state_after
latency
fallback_used
```

This helps answer:

> "Why did the system give this student a video?"

Example:

``` text
Student had failed two text explanations.
Student had weak visual/process understanding.
Agent selected VIDEO.
```

------------------------------------------------------------------------

## 32. Cost Optimization

Do not generate expensive AI media for every question.

Use a hierarchy:

``` text
Is AI required?
     ↓
No → deterministic/template explanation

Yes
 ↓
Can text solve it?
 ↓
Yes → text

No
 ↓
Can diagram solve it?
 ↓
Yes → diagram

No
 ↓
Can existing animation/3D solve it?
 ↓
Yes → 3D

No
 ↓
Generate video
```

Cache reusable explanations where appropriate.

For common concepts:

``` text
Concept
 ↓
Existing explanation?
 ↓
YES → reuse
NO → generate
```

Personalization should happen around the explanation rather than
regenerating everything from scratch.

------------------------------------------------------------------------

## 33. MVP Implementation

For the hackathon, do not implement every modality simultaneously.

### Phase 1 --- Required

Implement:

-   Text input
-   Voice input
-   Speech-to-text
-   Gemini analysis
-   Student context retrieval
-   Gap detection
-   Text explanation
-   Visual/diagram explanation
-   Verification
-   Learning evidence
-   FastAPI → BKT

### Phase 2 --- Strong Demo Feature

Add:

-   3D explanation
-   Interactive call-stack visualization
-   Adaptive modality selection

### Phase 3 --- Premium Multimodal Feature

Add:

-   AI-generated short video
-   More advanced visual generation
-   Personalized explanation strategy history

------------------------------------------------------------------------

## 34. Recommended Hackathon Demo

Use one concept: **Recursion**.

``` text
Student enters Recursion Lab
          ↓
Student gets confused
          ↓
Clicks "Ask Feynman"
          ↓
Speaks question
          ↓
Speech-to-text
          ↓
n8n workflow
          ↓
Gemini identifies:
"Student does not understand call stack"
          ↓
Agent chooses visual/video explanation
          ↓
Explanation appears
          ↓
Student answers verification question
          ↓
Learning evidence generated
          ↓
FastAPI
          ↓
BKT updated
          ↓
Adaptive planner
          ↓
3D classroom changes
```

The judge sees the complete adaptive loop instead of a generic chatbot.

------------------------------------------------------------------------

## 35. Final System Flow

``` text
                    STUDENT
                       │
                       ▼
              Student encounters
                  difficulty
                       │
                       ▼
                 ASK FEYNMAN
                       │
                       ▼
                    n8n
                       │
              ┌────────┴────────┐
              │                 │
        Student Input      Learner Context
              │                 │
              └────────┬────────┘
                       ▼
              Feynman Analyzer
                       │
                       ▼
             Detect Learning Gap
                       │
                       ▼
            Choose Best Modality
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
      TEXT           VISUAL            VIDEO
       │               │                │
       └───────────────┼────────────────┘
                       ▼
                Student Learns
                       │
                       ▼
                  Verification
                       │
                       ▼
              Learning Evidence
                       │
                       ▼
                    FastAPI
                       │
                       ▼
                      BKT
                       │
                       ▼
                Learner Model
                       │
                       ▼
              Adaptive Planner
                       │
                       ▼
                Game / 3D World
                       │
                       ▼
              New Learning Evidence
                       │
                       └───────────────↺
```

------------------------------------------------------------------------

## 36. Core Principle for the Development Team

> **The Feynman Agent's job is not to generate more content. Its job is
> to make a difficult concept easier for a particular student.**

Therefore:

``` text
Difficulty
   ↓
Diagnosis
   ↓
Simplification
   ↓
Best modality
   ↓
Explanation
   ↓
Verification
   ↓
Learning evidence
   ↓
Adaptation
```

Architectural separation:

``` text
n8n       → orchestrates the Feynman workflow
Gemini    → understands and generates multimodal explanations
FastAPI   → controls application and learning APIs
BKT       → estimates mastery
Knowledge Graph → defines prerequisites
Planner   → decides next learning action
Game Agent → controls validated 3D-world changes
React/R3F → renders the experience
PostgreSQL → stores persistent truth
```

------------------------------------------------------------------------

## 37. Definition of Done

-   [ ] Student can request help from the learning interface.
-   [ ] Text input works.
-   [ ] Voice input works.
-   [ ] Audio can be converted to text.
-   [ ] n8n orchestrates the complete workflow.
-   [ ] n8n retrieves relevant learner context.
-   [ ] Gemini identifies the student's difficulty.
-   [ ] Agent identifies a specific learning gap.
-   [ ] Agent can select an explanation modality.
-   [ ] Text explanation works.
-   [ ] Visual explanation works.
-   [ ] Video generation is implemented or has a controlled fallback.
-   [ ] Student receives a verification question.
-   [ ] Verification creates structured learning evidence.
-   [ ] Evidence reaches FastAPI.
-   [ ] BKT updates the learner model.
-   [ ] Adaptive planner can use the updated state.
-   [ ] 3D environment can respond to validated decisions.
-   [ ] AI cannot directly modify mastery.
-   [ ] AI cannot directly unlock prerequisite-gated content.
-   [ ] Fallback works when Gemini/video generation is unavailable.
-   [ ] Feynman interactions are logged.
-   [ ] The system can explain why a particular modality was selected.

------------------------------------------------------------------------

## 38. One-Sentence Product Definition

> **The Feynman Agent is a multimodal adaptive explanation agent that
> detects when a student struggles with a concept, identifies the
> underlying learning gap, and uses the most appropriate format---text,
> visual, voice, video, code visualization, or interactive 3D---to make
> that concept easier to understand, then verifies learning and feeds
> the resulting evidence back into the learner model.**
