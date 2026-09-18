import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { createClassroomEnvironment } from '../assets/3d/createClassroomEnvironment';
import { resolveObstacleCollision, resolveAvatarCollision } from '../utils/collision';
import { setCampusObstacleColliders } from '../components/canvas/ClassroomCampus';
import { useClassroomStore } from '../store/useClassroomStore';
import {
  calculateThirdPersonCamera,
  calculateFirstPersonCamera,
  exponentialDamp,
} from '../utils/cameraDamping';

describe('Issue 16: Connected Campus Integration & End-to-End Verification', () => {
  let campus: ReturnType<typeof createClassroomEnvironment>;

  beforeAll(() => {
    // Mock 2D canvas context for JSDOM headless testing
    HTMLCanvasElement.prototype.getContext = (() => ({
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      arc: () => {},
      fill: () => {},
      fillText: () => {},
    })) as any;
  });

  beforeEach(async () => {
    campus = createClassroomEnvironment();
    setCampusObstacleColliders(campus.getActiveColliders());
    await useClassroomStore.getState().resetWorldSeed();
    useClassroomStore.setState({
      activeStation: null,
      perspectiveMode: '3rd_person',
      avatar: { position: [0, 0, 0], rotation: 0, isMoving: false },
    });
  });

  afterEach(() => {
    if (campus) {
      campus.dispose();
    }
    setCampusObstacleColliders([]);
  });

  describe('1. 5-Wing Campus Architecture & Collider Registration', () => {
    it('registers complete perimeter and tech bench colliders for all 5 wings and corridors', () => {
      const colliders = campus.getActiveColliders();
      const names = colliders.map((c) => c.name);

      // Central Hub Furniture
      expect(names).toContain("Teacher's Podium Desk");
      expect(names).toContain('Student Workstation #1');
      expect(names).toContain('Student Workstation #2');
      expect(names).toContain('Student Workstation #3');
      expect(names).toContain('Classroom Bookshelf (West)');
      expect(names).toContain('Classroom Bookshelf (East)');

      // Corridors
      expect(names).toContain('Corridor West North Wall');
      expect(names).toContain('Corridor West South Wall');
      expect(names).toContain('Corridor East North Wall');
      expect(names).toContain('Corridor East South Wall');
      expect(names).toContain('Corridor North West Wall');
      expect(names).toContain('Corridor North East Wall');
      expect(names).toContain('Corridor South West Wall');
      expect(names).toContain('Corridor South East Wall');
      expect(names).toContain('Corridor South-East West Wall');
      expect(names).toContain('Corridor South-East East Wall');

      // 1. Array Station Lab (West Wing)
      expect(names).toContain('Array Lab West Wall');
      expect(names).toContain('Array Lab North Wall');
      expect(names).toContain('Array Lab South Wall');
      expect(names).toContain('Array Lab East Wall (North)');
      expect(names).toContain('Array Lab East Wall (South)');
      expect(names).toContain('Array Lab Research Desk (North)');

      // 2. Linked List Lab (East Wing)
      expect(names).toContain('Linked List Lab East Wall');
      expect(names).toContain('Linked List Lab North Wall');
      expect(names).toContain('Linked List Lab South Wall');
      expect(names).toContain('Linked List Lab West Wall (North)');
      expect(names).toContain('Linked List Lab West Wall (South)');
      expect(names).toContain('Linked List Lab Tech Bench (North)');

      // 3. Stack Lab (South Wing)
      expect(names).toContain('Stack Lab South Wall');
      expect(names).toContain('Stack Lab West Wall');
      expect(names).toContain('Stack Lab East Wall');
      expect(names).toContain('Stack Lab North Wall (West)');
      expect(names).toContain('Stack Lab North Wall (East)');
      expect(names).toContain('Stack Lab Tech Bench (West)');
      expect(names).toContain('Stack Lab Tech Bench (East)');

      // 4. Recursion Chamber (North Wing)
      expect(names).toContain('Recursion Chamber North Wall');
      expect(names).toContain('Recursion Chamber West Wall');
      expect(names).toContain('Recursion Chamber East Wall');
      expect(names).toContain('Recursion Chamber South Wall (West)');
      expect(names).toContain('Recursion Chamber South Wall (East)');
      expect(names).toContain('Recursion Chamber Tech Bench (West)');

      // 5. Tree & BST Lab (South-East Wing)
      expect(names).toContain('Tree Lab South Wall');
      expect(names).toContain('Tree Lab East Wall');
      expect(names).toContain('Tree Lab West Wall');
      expect(names).toContain('Tree Lab North Wall (West)');
      expect(names).toContain('Tree Lab North Wall (East)');
      expect(names).toContain('Tree Lab Tech Bench (East)');
      expect(names).toContain('Tree Lab Tech Bench (South)');
    });
  });

  describe('2. Unobstructed Navigation to All 5 Laboratory Wings', () => {
    it('permits smooth, uninterrupted walking from Central Hub into West Wing (Array Lab)', () => {
      const waypoints = [
        { x: 0.0, z: 0.0 },
        { x: -5.0, z: 0.0 },
        { x: -9.5, z: 0.0 }, // West Corridor
        { x: -13.0, z: 0.0 }, // Doorway
        { x: -20.0, z: 0.0 }, // Room Center
      ];

      for (const pt of waypoints) {
        const res = resolveObstacleCollision(pt.x, pt.z, 0.35);
        expect(res.collided).toBe(false);
        expect(res.x).toBeCloseTo(pt.x, 2);
        expect(res.z).toBeCloseTo(pt.z, 2);
      }
    });

    it('permits smooth, uninterrupted walking from Central Hub into East Wing (Linked List Lab)', () => {
      const waypoints = [
        { x: 0.0, z: 0.0 },
        { x: 5.0, z: 0.0 },
        { x: 9.5, z: 0.0 }, // East Corridor
        { x: 13.0, z: 0.0 }, // Doorway
        { x: 20.0, z: 0.0 }, // Room Center
      ];

      for (const pt of waypoints) {
        const res = resolveObstacleCollision(pt.x, pt.z, 0.35);
        expect(res.collided).toBe(false);
        expect(res.x).toBeCloseTo(pt.x, 2);
        expect(res.z).toBeCloseTo(pt.z, 2);
      }
    });

    it('permits smooth, uninterrupted walking from Central Hub into South Wing (Stack Lab)', () => {
      const waypoints = [
        { x: 0.0, z: 0.0 },
        { x: 0.0, z: 5.0 },
        { x: 0.0, z: 9.5 }, // South Corridor
        { x: 0.0, z: 13.0 }, // Doorway
        { x: 0.0, z: 20.0 }, // Stack Pedestal
      ];

      for (const pt of waypoints) {
        const res = resolveObstacleCollision(pt.x, pt.z, 0.35);
        expect(res.collided).toBe(false);
        expect(res.x).toBeCloseTo(pt.x, 2);
        expect(res.z).toBeCloseTo(pt.z, 2);
      }
    });

    it('permits smooth, uninterrupted walking from Central Hub into South-East Wing (Tree & BST Lab)', () => {
      const waypoints = [
        { x: 0.0, z: 0.0 },
        { x: 12.0, z: 6.0 },
        { x: 12.0, z: 9.9 }, // South-East Corridor
        { x: 12.0, z: 13.8 }, // Doorway
        { x: 12.0, z: 20.8 }, // Room Center
      ];

      for (const pt of waypoints) {
        const res = resolveObstacleCollision(pt.x, pt.z, 0.35);
        expect(res.collided).toBe(false);
        expect(res.x).toBeCloseTo(pt.x, 2);
        expect(res.z).toBeCloseTo(pt.z, 2);
      }
    });

    it('permits smooth, uninterrupted walking into North Wing (Recursion Chamber) when unsealed', async () => {
      const { switchLearner } = useClassroomStore.getState();
      await switchLearner('learner_a');

      const waypoints = [
        { x: 0.0, z: 0.0 },
        { x: 0.0, z: -5.0 },
        { x: 0.0, z: -9.5 }, // North Corridor
        { x: 0.0, z: -13.0 }, // Doorway
        { x: 0.0, z: -20.0 }, // Elevator Dais
      ];

      const { worldState } = useClassroomStore.getState();
      for (const pt of waypoints) {
        const res = resolveAvatarCollision(pt.x, pt.z, worldState);
        expect(res.isBlockedByBarrier).toBe(false);
        expect(res.x).toBeCloseTo(pt.x, 2);
        expect(res.z).toBeCloseTo(pt.z, 2);
      }
    });
  });

  describe('3. Perimeter Containment Across All 5 Wings', () => {
    it('strictly contains avatar within Stack Lab perimeter walls', () => {
      // Approach South Wall from inside room (at x = 0.0, z = 26.2)
      const southRes = resolveObstacleCollision(0.0, 26.2, 0.35);
      expect(southRes.collided).toBe(true);
      expect(southRes.colliderName).toBe('Stack Lab South Wall');
      expect(southRes.z).toBeLessThan(26.0);

      // Approach West Wall from inside room (at x = -4.6, z = 16.0)
      const westRes = resolveObstacleCollision(-4.6, 16.0, 0.35);
      expect(westRes.collided).toBe(true);
      expect(westRes.colliderName).toBe('Stack Lab West Wall');
      expect(westRes.x).toBeGreaterThan(-4.5);

      // Approach East Wall from inside room (at x = 4.6, z = 16.0)
      const eastRes = resolveObstacleCollision(4.6, 16.0, 0.35);
      expect(eastRes.collided).toBe(true);
      expect(eastRes.colliderName).toBe('Stack Lab East Wall');
      expect(eastRes.x).toBeLessThan(4.5);

      // Approach North Wall West Segment from inside room (at x = -3.0, z = 13.4)
      const northWestRes = resolveObstacleCollision(-3.0, 13.4, 0.35);
      expect(northWestRes.collided).toBe(true);
      expect(northWestRes.colliderName).toBe('Stack Lab North Wall (West)');
    });

    it('strictly contains avatar within Array Lab, Linked List Lab, Recursion Chamber, and Tree Lab', () => {
      // Array Lab West Wall
      const arrayRes = resolveObstacleCollision(-26.6, 0.0, 0.35);
      expect(arrayRes.collided).toBe(true);
      expect(arrayRes.colliderName).toBe('Array Lab West Wall');

      // Linked List Lab East Wall
      const listRes = resolveObstacleCollision(26.6, 0.0, 0.35);
      expect(listRes.collided).toBe(true);
      expect(listRes.colliderName).toBe('Linked List Lab East Wall');

      // Recursion Chamber North Wall
      const recRes = resolveObstacleCollision(0.0, -26.6, 0.35);
      expect(recRes.collided).toBe(true);
      expect(recRes.colliderName).toBe('Recursion Chamber North Wall');

      // Tree Lab South Wall
      const treeRes = resolveObstacleCollision(8.0, 27.4, 0.35);
      expect(treeRes.collided).toBe(true);
      expect(treeRes.colliderName).toBe('Tree Lab South Wall');
    });
  });

  describe('4. Dual-Perspective Camera Controller & Avatar Hiding', () => {
    it('manages perspective mode state transitions in global store', () => {
      const store = useClassroomStore.getState();
      expect(store.perspectiveMode).toBe('3rd_person');

      store.togglePerspectiveMode();
      expect(useClassroomStore.getState().perspectiveMode).toBe('1st_person');

      store.togglePerspectiveMode();
      expect(useClassroomStore.getState().perspectiveMode).toBe('3rd_person');

      store.setPerspectiveMode('1st_person');
      expect(useClassroomStore.getState().perspectiveMode).toBe('1st_person');
    });

    it('calculates mathematically distinct 3P chase vs 1P eye-level camera poses', () => {
      const avatarPos: [number, number, number] = [12.0, 0.0, 20.8]; // In Tree Lab
      const angle = 0.5;
      const pitch = 0.2;

      // 1P Camera: exactly at eye-height 1.62m, zero offset behind avatar
      const p1 = calculateFirstPersonCamera(avatarPos, angle, pitch, 1.62);
      expect(p1.position[0]).toBeCloseTo(12.0, 2);
      expect(p1.position[1]).toBeCloseTo(1.62, 2);
      expect(p1.position[2]).toBeCloseTo(20.8, 2);

      // 3P Camera: elevated and distanced behind avatar
      const p3 = calculateThirdPersonCamera(avatarPos, angle, pitch, 6.8);
      expect(p3.position[1]).toBeGreaterThan(2.0); // elevated
      expect(Math.hypot(p3.position[0] - avatarPos[0], p3.position[2] - avatarPos[2])).toBeGreaterThan(4.0);
    });

    it('applies frame-rate independent exponential motion damping smoothly', () => {
      // Step with 60 FPS (16.6ms) vs 30 FPS (33.3ms)
      const current = 0.0;
      const target = 10.0;
      const lambda = 9.0;

      const step60 = exponentialDamp(current, target, lambda, 0.0166);
      const step30 = exponentialDamp(current, target, lambda, 0.0333);

      expect(step60).toBeGreaterThan(current);
      expect(step30).toBeGreaterThan(step60);
      expect(step30).toBeLessThan(target);
    });
  });

  describe('5. All 5 DSA Station Consoles & Apparatus Interaction', () => {
    it('activates and deactivates all 5 laboratory consoles cleanly without state leakage', () => {
      const store = useClassroomStore.getState();
      const stations: Array<
        'array_station' | 'linked_list_lab' | 'stack_lab' | 'recursion_lab' | 'tree_lab'
      > = ['array_station', 'linked_list_lab', 'stack_lab', 'recursion_lab', 'tree_lab'];

      for (const st of stations) {
        store.setActiveStation(st);
        expect(useClassroomStore.getState().activeStation).toBe(st);

        store.setActiveStation(null);
        expect(useClassroomStore.getState().activeStation).toBeNull();
      }
    });

    it('supports live apparatus operations across all curriculum topics', async () => {
      const store = useClassroomStore.getState();

      // 1. Array Station: linear search scan
      await store.runArrayLinearSearch(42);
      expect(useClassroomStore.getState().arrayOperation?.type).toBe('linear_search');

      // 2. Linked List Lab: traversal
      await store.traverseLinkedList();
      expect(useClassroomStore.getState().linkedListActiveNodeId).toBeNull();

      // 3. Stack Lab: push / pop
      store.pushStackDisc(99);
      expect(useClassroomStore.getState().stackDiscs.some((d) => d.value === 99)).toBe(true);
      store.popStackDisc();
      expect(useClassroomStore.getState().stackDiscs.some((d) => d.value === 99)).toBe(false);

      // 4. Recursion Chamber: push call frame
      store.pushRecursionCall(4);
      expect(useClassroomStore.getState().recursionFrames.some((f) => f.n === 4)).toBe(true);

      // 5. Tree Lab: in-order traversal
      await store.runTreeInOrderTraversal(0);
      expect(useClassroomStore.getState().treeOperation?.type).toBe('in_order_traversal');
      expect(useClassroomStore.getState().treeTraversingValues).toEqual([20, 30, 40, 50, 60, 70, 80]);
    });
  });

  describe('6. 90-Second Hero Pitch Flow End-to-End Verification', () => {
    it('executes the full adaptive pitch: Learner B blocked -> Stack Challenge -> BKT update -> Barrier dissolves -> Recursion accessible', async () => {
      // Step 1: Baseline state with Learner B
      await useClassroomStore.getState().resetWorldSeed();
      const s1 = useClassroomStore.getState();
      expect(s1.learner?.learner_id).toBe('learner_b');
      expect(s1.learner?.mastery_map.stack).toBe(0.38);
      expect(s1.worldState?.wings.recursion_lab.status).toBe('sealed');

      // Step 2: Attempting to walk into North Corridor is strictly blocked
      const blockRes = resolveAvatarCollision(0.0, -6.0, s1.worldState);
      expect(blockRes.isBlockedByBarrier).toBe(true);
      expect(blockRes.blockedWingId).toBe('recursion_lab');
      expect(blockRes.z).toBeCloseTo(-5.6, 2);

      // Step 3: Enter Stack Lab and solve challenge
      useClassroomStore.getState().setActiveStation('stack_lab');
      expect(useClassroomStore.getState().activeStation).toBe('stack_lab');

      // Answer challenge correctly
      useClassroomStore.getState().setChallengeAnswer('stack_lifo_order', 'opt_lifo_correct');
      const submitRes = await useClassroomStore.getState().submitChallengeAnswer('stack_lifo_order');
      expect(submitRes.isCorrect).toBe(true);

      // Step 4: Trigger barrier dissolution (simulating threshold crossing to 0.74)
      useClassroomStore.getState().triggerBarrierDissolve('recursion_lab');
      const dissolveState = useClassroomStore.getState();
      expect(dissolveState.dissolvingWingId).toBe('recursion_lab');
      expect(dissolveState.dissolvePhase).toBe('flicker');
      expect(dissolveState.cinematicCamera?.active).toBe(true);

      // Transition to accessible state
      useClassroomStore.setState((prev) => ({
        ...prev,
        worldState: prev.worldState
          ? {
              ...prev.worldState,
              wings: {
                ...prev.worldState.wings,
                recursion_lab: {
                  ...prev.worldState.wings.recursion_lab,
                  status: 'accessible',
                  reason: null,
                },
              },
            }
          : null,
      }));

      // Step 5: Now avatar can pass freely through North corridor into Recursion Chamber
      const postWorld = useClassroomStore.getState().worldState;
      const walkRes = resolveAvatarCollision(0.0, -13.0, postWorld);
      expect(walkRes.isBlockedByBarrier).toBe(false);
      expect(walkRes.blockedWingId).toBeNull();
      expect(walkRes.z).toBeCloseTo(-13.0, 2);

      // Reaches Recursion Chamber dais
      const daisRes = resolveAvatarCollision(0.0, -20.0, postWorld);
      expect(daisRes.isBlockedByBarrier).toBe(false);
      expect(daisRes.z).toBeCloseTo(-20.0, 2);
    });
  });
});
