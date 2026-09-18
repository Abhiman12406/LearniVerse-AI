import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { createClassroomEnvironment } from '../assets/3d/createClassroomEnvironment';
import { resolveObstacleCollision, resolveAvatarCollision } from '../utils/collision';
import { setCampusObstacleColliders } from '../components/canvas/ClassroomCampus';
import { useClassroomStore } from '../store/useClassroomStore';
import { createTreeBSTModel } from '../assets/3d/createTreeBSTModel';

describe('Issue 15: North & South-East Lab Wings (Recursion Chamber & Tree/BST Lab)', () => {
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
  });

  afterEach(() => {
    if (campus) {
      campus.dispose();
    }
    setCampusObstacleColliders([]);
  });

  describe('Perimeter Colliders Registration', () => {
    it('registers solid perimeter wall colliders for Recursion Chamber and Tree Lab wings', () => {
      const colliders = campus.getActiveColliders();
      const names = colliders.map((c) => c.name);

      // Recursion Chamber (North Wing)
      expect(names).toContain('Recursion Chamber North Wall');
      expect(names).toContain('Recursion Chamber West Wall');
      expect(names).toContain('Recursion Chamber East Wall');
      expect(names).toContain('Recursion Chamber South Wall (West)');
      expect(names).toContain('Recursion Chamber South Wall (East)');
      expect(names).toContain('Recursion Chamber Tech Bench (West)');
      expect(names).toContain('Recursion Chamber Tech Bench (East)');

      // North Corridor
      expect(names).toContain('Corridor North West Wall');
      expect(names).toContain('Corridor North East Wall');

      // Tree & BST Lab (South-East Wing)
      expect(names).toContain('Tree Lab South Wall');
      expect(names).toContain('Tree Lab East Wall');
      expect(names).toContain('Tree Lab West Wall');
      expect(names).toContain('Tree Lab North Wall (West)');
      expect(names).toContain('Tree Lab North Wall (East)');
      expect(names).toContain('Tree Lab Tech Bench (East)');
      expect(names).toContain('Tree Lab Tech Bench (South)');

      // South-East Corridor
      expect(names).toContain('Corridor South-East West Wall');
      expect(names).toContain('Corridor South-East East Wall');
    });
  });

  describe('North Corridor & Prerequisite Barrier Enforcement', () => {
    it('strictly blocks avatar from entering North corridor when Stack mastery is below 70% (Learner B)', () => {
      const { worldState } = useClassroomStore.getState();
      expect(worldState?.wings.recursion_lab.status).toBe('sealed');

      // Attempt to walk North into the doorway at x = 0, z = -6.0
      const attemptX = 0.0;
      const attemptZ = -6.0;

      const result = resolveAvatarCollision(attemptX, attemptZ, worldState);
      expect(result.isBlockedByBarrier).toBe(true);
      expect(result.blockedWingId).toBe('recursion_lab');
      expect(result.z).toBeCloseTo(-5.6, 2);
    });

    it('permits full unobstructed passage through North corridor into Recursion Chamber for Learner A (Stack >= 70%)', async () => {
      const { switchLearner } = useClassroomStore.getState();
      await switchLearner('learner_a');

      const { worldState } = useClassroomStore.getState();
      expect(worldState?.wings.recursion_lab.status).toBe('accessible');

      // Waypoints from Central Classroom through North Corridor into Recursion Chamber
      const waypoints = [
        { x: 0.0, z: 0.0 },
        { x: 0.0, z: -5.0 },
        { x: 0.0, z: -8.0 },
        { x: 0.0, z: -11.0 },
        { x: 0.0, z: -13.0 },
        { x: 0.0, z: -16.0 },
        { x: 0.0, z: -20.0 }, // Room center
      ];

      for (const pt of waypoints) {
        const result = resolveAvatarCollision(pt.x, pt.z, worldState);
        expect(result.isBlockedByBarrier).toBe(false);
        expect(result.blockedWingId).toBeNull();
        expect(result.x).toBeCloseTo(pt.x, 2);
        expect(result.z).toBeCloseTo(pt.z, 2);
      }
    });

    it('strictly blocks avatar penetration through Recursion Chamber perimeter walls', () => {
      // Approach North outer wall from inside room (at x = 0, z = -26.6)
      const northRes = resolveObstacleCollision(0.0, -26.6, 0.35);
      expect(northRes.collided).toBe(true);
      expect(northRes.colliderName).toBe('Recursion Chamber North Wall');
      expect(northRes.z).toBeGreaterThan(-26.5);
      expect(northRes.z).toBeCloseTo(-26.45, 2);

      // Approach West outer wall from inside room away from tech bench (at x = -6.6, z = -16.0)
      const westRes = resolveObstacleCollision(-6.6, -16.0, 0.35);
      expect(westRes.collided).toBe(true);
      expect(westRes.colliderName).toBe('Recursion Chamber West Wall');
      expect(westRes.x).toBeGreaterThan(-6.5);
      expect(westRes.x).toBeCloseTo(-6.45, 2);

      // Approach East outer wall from inside room away from tech bench (at x = 6.6, z = -16.0)
      const eastRes = resolveObstacleCollision(6.6, -16.0, 0.35);
      expect(eastRes.collided).toBe(true);
      expect(eastRes.colliderName).toBe('Recursion Chamber East Wall');
      expect(eastRes.x).toBeLessThan(6.5);
      expect(eastRes.x).toBeCloseTo(6.45, 2);

      // Approach South wall west of doorway (at x = -4.0, z = -13.4)
      const southWestRes = resolveObstacleCollision(-4.0, -13.4, 0.35);
      expect(southWestRes.collided).toBe(true);
      expect(southWestRes.colliderName).toBe('Recursion Chamber South Wall (West)');

      // Approach South wall east of doorway (at x = 4.0, z = -13.4)
      const southEastRes = resolveObstacleCollision(4.0, -13.4, 0.35);
      expect(southEastRes.collided).toBe(true);
      expect(southEastRes.colliderName).toBe('Recursion Chamber South Wall (East)');

      // Approach West tech bench (at x = -5.4, z = -20.0)
      const benchWestRes = resolveObstacleCollision(-5.4, -20.0, 0.35);
      expect(benchWestRes.collided).toBe(true);
      expect(benchWestRes.colliderName).toBe('Recursion Chamber Tech Bench (West)');
    });
  });

  describe('South-East Corridor & Tree/BST Lab Wing', () => {
    it('permits smooth, unobstructed passage through South-East corridor into Tree Lab', () => {
      // Waypoints from Central Classroom through South-East Corridor into Tree Lab
      const waypoints = [
        { x: 12.0, z: 6.0 },
        { x: 12.0, z: 8.0 },
        { x: 12.0, z: 11.0 },
        { x: 12.0, z: 13.8 }, // Portal doorway
        { x: 12.0, z: 16.0 },
        { x: 12.0, z: 20.8 }, // Room center
      ];

      for (const pt of waypoints) {
        const res = resolveObstacleCollision(pt.x, pt.z, 0.35);
        expect(res.collided).toBe(false);
        expect(res.x).toBeCloseTo(pt.x, 2);
        expect(res.z).toBeCloseTo(pt.z, 2);
      }
    });

    it('strictly blocks avatar penetration through Tree Lab perimeter walls', () => {
      // Approach South outer wall from inside room away from south bench (at x = 8.0, z = 27.4)
      const southRes = resolveObstacleCollision(8.0, 27.4, 0.35);
      expect(southRes.collided).toBe(true);
      expect(southRes.colliderName).toBe('Tree Lab South Wall');
      expect(southRes.z).toBeLessThan(27.3);
      expect(southRes.z).toBeCloseTo(27.25, 2);

      // Approach East outer wall from inside room away from east bench (at x = 18.6, z = 16.0)
      const eastRes = resolveObstacleCollision(18.6, 16.0, 0.35);
      expect(eastRes.collided).toBe(true);
      expect(eastRes.colliderName).toBe('Tree Lab East Wall');
      expect(eastRes.x).toBeLessThan(18.5);
      expect(eastRes.x).toBeCloseTo(18.45, 2);

      // Approach West outer wall from inside room (at x = 5.4, z = 20.8)
      const westRes = resolveObstacleCollision(5.4, 20.8, 0.35);
      expect(westRes.collided).toBe(true);
      expect(westRes.colliderName).toBe('Tree Lab West Wall');
      expect(westRes.x).toBeGreaterThan(5.5);
      expect(westRes.x).toBeCloseTo(5.55, 2);

      // Approach North wall west of doorway (at x = 8.0, z = 14.2)
      const northWestRes = resolveObstacleCollision(8.0, 14.2, 0.35);
      expect(northWestRes.collided).toBe(true);
      expect(northWestRes.colliderName).toBe('Tree Lab North Wall (West)');

      // Approach North wall east of doorway (at x = 16.0, z = 14.2)
      const northEastRes = resolveObstacleCollision(16.0, 14.2, 0.35);
      expect(northEastRes.collided).toBe(true);
      expect(northEastRes.colliderName).toBe('Tree Lab North Wall (East)');

      // Approach South tech bench (at x = 12.0, z = 25.8)
      const southBenchRes = resolveObstacleCollision(12.0, 25.8, 0.35);
      expect(southBenchRes.collided).toBe(true);
      expect(southBenchRes.colliderName).toBe('Tree Lab Tech Bench (South)');
    });

    it('blocks avatar when attempting to walk off South-East corridor side walls', () => {
      // Walk off West side of South-East corridor (x = 9.8, z = 9.9)
      const westSideRes = resolveObstacleCollision(9.8, 9.9, 0.35);
      expect(westSideRes.collided).toBe(true);
      expect(westSideRes.colliderName).toBe('Corridor South-East West Wall');

      // Walk off East side of South-East corridor (x = 14.2, z = 9.9)
      const eastSideRes = resolveObstacleCollision(14.2, 9.9, 0.35);
      expect(eastSideRes.collided).toBe(true);
      expect(eastSideRes.colliderName).toBe('Corridor South-East East Wall');
    });
  });

  describe('Procedural 3D BST Model & Tree Store Operations', () => {
    it('constructs procedural 3D Tree BST model with 7 canonical nodes and disposes cleanly', () => {
      const treeModel = createTreeBSTModel();
      expect(treeModel.group).toBeDefined();

      const nodes = treeModel.getNodes();
      expect(nodes).toHaveLength(7);

      const values = nodes.map((n) => n.value);
      expect(values).toEqual([50, 30, 70, 20, 40, 60, 80]);

      // Root node verification
      const rootNode = nodes.find((n) => n.value === 50);
      expect(rootNode).toBeDefined();
      expect(rootNode?.level).toBe(0);
      expect(rootNode?.position[0]).toBe(0);

      // Verify update and dispose
      expect(() =>
        treeModel.update(0.016, { activeNodeValue: 50, traversingValues: [50, 30, 20] })
      ).not.toThrow();
      expect(() => treeModel.dispose()).not.toThrow();
    });

    it('executes in-order traversal generating sorted values in store', async () => {
      const store = useClassroomStore.getState();
      expect(store.treeNodes).toHaveLength(7);

      await store.runTreeInOrderTraversal(0);
      const updated = useClassroomStore.getState();

      expect(updated.treeOperation?.type).toBe('in_order_traversal');
      expect(updated.treeTraversingValues).toEqual([20, 30, 40, 50, 60, 70, 80]);
    });

    it('executes binary search correctly identifying path to target key', async () => {
      const store = useClassroomStore.getState();

      // Search for 60 (path: 50 -> 70 -> 60)
      await store.runTreeSearch(60, 0);
      let state = useClassroomStore.getState();

      expect(state.treeOperation?.type).toBe('search');
      expect(state.treeSearchTarget).toBe(60);
      expect(state.treeTraversingValues).toEqual([50, 70, 60]);

      // Search for 20 (path: 50 -> 30 -> 20)
      await store.runTreeSearch(20, 0);
      state = useClassroomStore.getState();
      expect(state.treeTraversingValues).toEqual([50, 30, 20]);
    });

    it('integrates activeStation state with tree_lab', () => {
      const store = useClassroomStore.getState();
      expect(store.activeStation).toBeNull();

      store.setActiveStation('tree_lab');
      expect(useClassroomStore.getState().activeStation).toBe('tree_lab');

      store.setActiveStation(null);
      expect(useClassroomStore.getState().activeStation).toBeNull();
    });
  });
});
