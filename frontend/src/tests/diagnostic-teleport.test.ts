import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { DEFAULT_DIAGNOSTIC_ASSESSMENT } from '../data/diagnosticQuestions';

describe('Issue 03: LangGraph Agent Deliberation & 1-Click Lab Teleport', () => {
  beforeEach(() => {
    const store = useClassroomStore.getState();
    store.resetDiagnosticAssessment();
    useClassroomStore.setState({
      activeStation: null,
      isDiagnosticOpen: false,
      teleportRequest: null,
      cameraAngleRequest: null,
      avatar: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        isMoving: false,
      },
    });
  });

  it('submitting diagnostic assessment populates latestDeliberation and diagnosticResult.deliberation', async () => {
    const store = useClassroomStore.getState();

    // Answer questions: Array & LL correct, Stack incorrect -> weak Stack (<70%)
    store.setDiagnosticAnswer('diag_arr_01', 'opt_arr_01_a');
    store.setDiagnosticAnswer('diag_ll_01', 'opt_ll_01_a');
    store.setDiagnosticAnswer('diag_stk_01', 'opt_stk_01_b'); // incorrect
    store.setDiagnosticAnswer('diag_rec_01', 'opt_rec_01_b');
    store.setDiagnosticAnswer('diag_tree_01', 'opt_tree_01_c');

    await store.submitDiagnosticAssessment();

    const state = useClassroomStore.getState();
    expect(state.diagnosticSubmitted).toBe(true);
    expect(state.diagnosticResult).not.toBeNull();
    expect(state.diagnosticResult?.deliberation).toBeDefined();
    expect(state.latestDeliberation).toBeDefined();

    const delib = state.latestDeliberation!;
    expect(delib.final_decision).toBeDefined();
    expect(delib.world_instructions).toBeDefined();
    expect(delib.traces).toHaveLength(5);

    // Verify 5 agent traces are present
    const agentNames = delib.traces.map((t) => t.agent_name);
    expect(agentNames).toContain('Context Agent');
    expect(agentNames).toContain('Diagnostic Agent');
    expect(agentNames).toContain('Planner Agent');
    expect(agentNames).toContain('Validator Agent');
    expect(agentNames).toContain('Game Agent');
  });

  it('enforces REMEDIATE on stack and assigns stack_lab when Stack mastery is below threshold', async () => {
    const store = useClassroomStore.getState();

    store.setDiagnosticAnswer('diag_arr_01', 'opt_arr_01_a');
    store.setDiagnosticAnswer('diag_ll_01', 'opt_ll_01_a');
    store.setDiagnosticAnswer('diag_stk_01', 'opt_stk_01_b'); // incorrect

    await store.submitDiagnosticAssessment();

    const state = useClassroomStore.getState();
    const delib = state.latestDeliberation!;

    expect(delib.final_decision.action).toBe('REMEDIATE');
    expect(delib.final_decision.concept).toBe('stack');
    expect(delib.world_instructions.recommended_station).toBe('stack_lab');
    expect(delib.final_decision.reason).toContain('Stack');
  });

  it('teleportToAssignedLab smoothly repositions avatar, camera angle, and opens the target station console', async () => {
    const store = useClassroomStore.getState();
    store.openDiagnostic();
    expect(useClassroomStore.getState().isDiagnosticOpen).toBe(true);

    // Answer with weak stack to trigger stack_lab recommendation
    store.setDiagnosticAnswer('diag_arr_01', 'opt_arr_01_a');
    store.setDiagnosticAnswer('diag_stk_01', 'opt_stk_01_b');
    await store.submitDiagnosticAssessment();

    // 1-Click Teleport to assigned lab
    useClassroomStore.getState().teleportToAssignedLab();

    const state = useClassroomStore.getState();

    // 1. Diagnostic modal must be closed
    expect(state.isDiagnosticOpen).toBe(false);

    // 2. Avatar must be repositioned in front of Stack Lab console [0.0, 0.0, 17.5]
    expect(state.avatar.position).toEqual([0.0, 0.0, 17.5]);
    expect(state.teleportRequest).toEqual([0.0, 0.0, 17.5]);
    expect(state.cameraAngleRequest).toBe(0);

    // 3. Target lab station console modal must open automatically
    expect(state.activeStation).toBe('stack_lab');

    // 4. Toast notification must confirm teleport
    expect(state.toastMessage).toContain('Teleported to Stack Lab');
  });

  it('teleportToAssignedLab with explicit stationId teleports to that lab and opens its console', () => {
    const store = useClassroomStore.getState();
    store.openDiagnostic();

    // Teleport explicitly to recursion_lab
    store.teleportToAssignedLab('recursion_lab');

    const state = useClassroomStore.getState();
    expect(state.isDiagnosticOpen).toBe(false);
    expect(state.avatar.position).toEqual([0.0, 0.0, -17.5]);
    expect(state.teleportRequest).toEqual([0.0, 0.0, -17.5]);
    expect(state.cameraAngleRequest).toBe(Math.PI);
    expect(state.activeStation).toBe('recursion_lab');
    expect(state.toastMessage).toContain('Recursion Chamber');
  });

  it('teleportToAssignedLab with array_station teleports to west wing apparatus', () => {
    const store = useClassroomStore.getState();
    store.teleportToAssignedLab('array_station');

    const state = useClassroomStore.getState();
    expect(state.avatar.position).toEqual([-17.5, 0.0, 0.0]);
    expect(state.teleportRequest).toEqual([-17.5, 0.0, 0.0]);
    expect(state.activeStation).toBe('array_station');
    expect(state.toastMessage).toContain('Array Station');
  });

  it('telemetry drawer can inspect deliberation traces after diagnostic submission', async () => {
    const store = useClassroomStore.getState();

    store.setDiagnosticAnswer('diag_arr_01', 'opt_arr_01_a');
    await store.submitDiagnosticAssessment();

    // Open telemetry drawer directly on agents tab
    store.openTelemetry('agents');

    const state = useClassroomStore.getState();
    expect(state.isTelemetryOpen).toBe(true);
    expect(state.activeTelemetryTab).toBe('agents');
    expect(state.latestDeliberation?.traces).toBeDefined();
    expect(state.latestDeliberation?.traces.length).toBe(5);
  });
});
