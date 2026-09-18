import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';

describe('Recursion Lab Wing & Interactive Call-Stack Elevator Mechanics', () => {
  beforeEach(() => {
    // Reset store state to predictable default
    useClassroomStore.setState({
      activeStation: null,
      avatar: { position: [0, 0, 8], rotation: 0, isMoving: false },
      recursionFrames: [
        { id: 'frame-3', n: 3, callLabel: 'f(3)', argValue: 3, returnValue: null, status: 'active' },
        { id: 'frame-2', n: 2, callLabel: 'f(2)', argValue: 2, returnValue: null, status: 'active' },
        { id: 'frame-1', n: 1, callLabel: 'f(1)', argValue: 1, returnValue: null, status: 'base_case' },
      ],
      recursionMaxDepth: 5,
      recursionIsExecuting: false,
      recursionIsUnwinding: false,
      recursionReturnStep: 0,
      recursionStackOverflow: false,
      recursionOperation: {
        type: 'base_case',
        title: 'Call Stack Initialized',
        description: 'Call frames stacked in elevator shaft: f(3) → f(2) → f(1) [Base Case].',
        depth: 3,
        timestamp: Date.now(),
      },
    });
  });

  it('initializes with default 3-tier recursive call stack matching blueprint', () => {
    const { recursionFrames, recursionMaxDepth, recursionStackOverflow } =
      useClassroomStore.getState();

    expect(recursionFrames).toHaveLength(3);
    expect(recursionMaxDepth).toBe(5);
    expect(recursionStackOverflow).toBe(false);

    expect(recursionFrames[0].callLabel).toBe('f(3)');
    expect(recursionFrames[1].callLabel).toBe('f(2)');
    expect(recursionFrames[2].callLabel).toBe('f(1)');
    expect(recursionFrames[2].status).toBe('base_case');
  });

  it('pushes a new recursive call frame onto the stack in LIFO order', () => {
    const { pushRecursionCall } = useClassroomStore.getState();

    // Currently has f(3), f(2), f(1). Push f(4)
    pushRecursionCall(4);

    const { recursionFrames, recursionOperation } = useClassroomStore.getState();
    expect(recursionFrames).toHaveLength(4);
    expect(recursionFrames[0].callLabel).toBe('f(4)');
    expect(recursionFrames[0].argValue).toBe(4);
    expect(recursionFrames[0].status).toBe('active');

    expect(recursionOperation?.type).toBe('push');
    expect(recursionOperation?.depth).toBe(4);
  });

  it('pops the newest recursive call frame from the top of the stack', () => {
    const { popRecursionCall } = useClassroomStore.getState();

    expect(useClassroomStore.getState().recursionFrames).toHaveLength(3);

    // Pop top frame f(3)
    popRecursionCall();

    const { recursionFrames, recursionOperation } = useClassroomStore.getState();
    expect(recursionFrames).toHaveLength(2);
    expect(recursionFrames[0].callLabel).toBe('f(2)');
    expect(recursionOperation?.type).toBe('unwind');
    expect(recursionOperation?.title).toContain('f(3)');
  });

  it('executes base-case return sequence resolving factorial products from bottom to root', async () => {
    const { triggerRecursionReturn } = useClassroomStore.getState();

    // Trigger upward cascade
    const returnPromise = triggerRecursionReturn();

    // Fast-forward promises
    await returnPromise;

    const { recursionFrames, recursionIsUnwinding, recursionOperation } =
      useClassroomStore.getState();

    expect(recursionIsUnwinding).toBe(false);
    expect(recursionFrames).toHaveLength(3);

    // Base case f(1) resolves to 1
    const frame1 = recursionFrames.find((f) => f.n === 1);
    expect(frame1?.returnValue).toBe(1);
    expect(frame1?.status).toBe('resolved');

    // f(2) resolves to 2 * 1 = 2
    const frame2 = recursionFrames.find((f) => f.n === 2);
    expect(frame2?.returnValue).toBe(2);
    expect(frame2?.status).toBe('resolved');

    // f(3) resolves to 3 * 2 = 6
    const frame3 = recursionFrames.find((f) => f.n === 3);
    expect(frame3?.returnValue).toBe(6);
    expect(frame3?.status).toBe('resolved');

    expect(recursionOperation?.type).toBe('unwind');
    expect(recursionOperation?.description).toContain('6');
  });

  it('enforces maximum call depth limit and triggers Stack Overflow on overflow', () => {
    const { pushRecursionCall } = useClassroomStore.getState();

    // Current length is 3, max depth is 5.
    pushRecursionCall(4); // length = 4
    expect(useClassroomStore.getState().recursionStackOverflow).toBe(false);

    pushRecursionCall(5); // length = 5
    expect(useClassroomStore.getState().recursionStackOverflow).toBe(false);

    // Exceed maxDepth (6th call)
    pushRecursionCall(6);

    const { recursionStackOverflow, recursionOperation, recursionFrames } =
      useClassroomStore.getState();
    expect(recursionStackOverflow).toBe(true);
    expect(recursionFrames).toHaveLength(5); // Stack frame rejected
    expect(recursionOperation?.type).toBe('overflow');
    expect(recursionOperation?.title).toContain('Stack Overflow');
  });

  it('allows explicit trigger and clearance of Stack Overflow simulation', () => {
    const { triggerStackOverflowError, clearRecursionOverflow } = useClassroomStore.getState();

    expect(useClassroomStore.getState().recursionStackOverflow).toBe(false);

    triggerStackOverflowError();
    expect(useClassroomStore.getState().recursionStackOverflow).toBe(true);

    clearRecursionOverflow();
    expect(useClassroomStore.getState().recursionStackOverflow).toBe(false);
  });

  it('resets the recursion elevator apparatus to initial default state', () => {
    const { pushRecursionCall, triggerStackOverflowError, resetRecursionChamber } =
      useClassroomStore.getState();

    // Modify state
    pushRecursionCall(4);
    triggerStackOverflowError();
    expect(useClassroomStore.getState().recursionStackOverflow).toBe(true);

    // Reset
    resetRecursionChamber();

    const { recursionFrames, recursionStackOverflow, recursionIsExecuting, recursionIsUnwinding } =
      useClassroomStore.getState();

    expect(recursionFrames).toHaveLength(3);
    expect(recursionStackOverflow).toBe(false);
    expect(recursionIsExecuting).toBe(false);
    expect(recursionIsUnwinding).toBe(false);
  });

  it('activates and deactivates Recursion Lab console mode via activeStation', () => {
    const { setActiveStation } = useClassroomStore.getState();

    expect(useClassroomStore.getState().activeStation).toBeNull();

    setActiveStation('recursion_lab');
    expect(useClassroomStore.getState().activeStation).toBe('recursion_lab');

    setActiveStation(null);
    expect(useClassroomStore.getState().activeStation).toBeNull();
  });

  it('evaluates avatar proximity correctly for the Recursion Lab wing at coordinates [-24, 0, 0]', () => {
    const recursionConsolePos = [-24.0, 0.0, 0.0];
    const proximityThreshold = 4.0;

    // Avatar inside Recursion Lab Chamber
    const insideAvatarPos = [-23.2, 0.0, 0.5];
    const distInside = Math.hypot(
      insideAvatarPos[0] - recursionConsolePos[0],
      insideAvatarPos[2] - recursionConsolePos[2]
    );
    expect(distInside).toBeLessThanOrEqual(proximityThreshold);

    // Avatar at Atrium origin [0, 0, 8]
    const atriumAvatarPos = [0.0, 0.0, 8.0];
    const distAtrium = Math.hypot(
      atriumAvatarPos[0] - recursionConsolePos[0],
      atriumAvatarPos[2] - recursionConsolePos[2]
    );
    expect(distAtrium).toBeGreaterThan(proximityThreshold);
  });
});
