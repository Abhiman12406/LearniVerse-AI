# 08: 5-Agent LangGraph Deliberation Pipeline & Deterministic Guardrails

**What to build:** Upgrades backend decision-making to a sequential 5-agent LangGraph workflow (`Context Agent` → `Diagnostic Agent` → `Planner Agent` → `Validator Agent` → `Game Agent`). The Validator Agent strictly enforces deterministic DAG policy guardrails, overruling unready Recursion proposals to `REMEDIATE STACK`. Supports dual-mode execution (Gemini API with seamless offline deterministic fallback).

**Blocked by:** 06: BKT Bayesian Knowledge Tracing Engine & Interaction Loop

**Status:** ready-for-agent

- [ ] 5-agent LangGraph sequential pipeline executes upon interaction: Context → Diagnostic → Planner → Validator → Game Agent
- [ ] Validator Agent enforces deterministic prerequisite guardrails, rejecting premature advanced assignments and certifying remedial routing
- [ ] Dual-mode LLM integration uses Google Gemini API when configured and seamlessly falls back to deterministic decision generator offline
- [ ] Multi-agent coordinator produces structured execution traces with timestamps, proposed actions, and certification status
- [ ] Game Agent outputs structured world instructions (wing barrier states, recommended station, active mission, and AI Mentor guidance)
- [ ] Automated integration tests verify 5-agent pipeline execution, deterministic guardrail overrules, and offline resilience
