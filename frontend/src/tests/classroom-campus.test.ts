import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { createClassroomEnvironment } from '../assets/3d/createClassroomEnvironment';
import {
  resolveObstacleCollision,
  resolveAvatarCollision,
} from '../utils/collision';
import {
  setCampusObstacleColliders,
} from '../components/canvas/ClassroomCampus';
import { WorldState } from '../types/world';


describe('Classroom Campus Environment & Obstacle Collisions', () => {
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

  beforeEach(() => {
    campus = createClassroomEnvironment();
    setCampusObstacleColliders(campus.getActiveColliders());
  });

  afterEach(() => {
    if (campus) {
      campus.dispose();
    }
    setCampusObstacleColliders([]);
  });

  it('creates a campus diorama group with proper hierarchy and colliders', () => {
    expect(campus.group).toBeDefined();
    expect(campus.group.name).toBe('ClassroomCampusDiorama');

    const colliders = campus.getActiveColliders();
    expect(colliders.length).toBeGreaterThan(5);

    // Verify key architectural furniture pieces are registered
    const names = colliders.map((c) => c.name);
    expect(names).toContain("Teacher's Podium Desk");
    expect(names).toContain('Student Workstation #1');
    expect(names).toContain('Student Workstation #2');
    expect(names).toContain('Student Workstation #3');
    expect(names).toContain('Classroom Bookshelf (West)');
    expect(names).toContain('Classroom Bookshelf (East)');
  });

  it('blocks avatar from penetrating Teacher Desk and clamps smoothly to boundary', () => {
    // Teacher Desk is centered at approx x = -2.0, z = -3.2 (with collider bounds approx x: [-2.6, -1.4], z: [-4.3, -2.1])
    // Test avatar attempting to walk into the center of the teacher's desk
    const attemptX = -2.0;
    const attemptZ = -3.2;

    const result = resolveObstacleCollision(attemptX, attemptZ, 0.35);
    expect(result.collided).toBe(true);
    expect(result.colliderName).toBe("Teacher's Podium Desk");

    // Must be pushed outside the bounding box
    const colliders = campus.getActiveColliders();
    const desk = colliders.find((c) => c.name === "Teacher's Podium Desk")!;
    const isOutside =
      result.x <= desk.minX - 0.35 + 0.001 ||
      result.x >= desk.maxX + 0.35 - 0.001 ||
      result.z <= desk.minZ - 0.35 + 0.001 ||
      result.z >= desk.maxZ + 0.35 - 0.001;
    expect(isOutside).toBe(true);
  });

  it('blocks avatar from penetrating Student Workstation #1', () => {
    // Student Workstation #1 is at x = 2.8, z = -2.6
    const attemptX = 2.8;
    const attemptZ = -2.6;

    const result = resolveObstacleCollision(attemptX, attemptZ, 0.35);
    expect(result.collided).toBe(true);
    expect(result.colliderName).toBe('Student Workstation #1');
  });

  it('allows free movement in clear classroom aisles and walkways', () => {
    // Center of classroom aisle at (0, 0)
    const aisleResult = resolveObstacleCollision(0, 0, 0.35);
    expect(aisleResult.collided).toBe(false);
    expect(aisleResult.x).toBe(0);
    expect(aisleResult.z).toBe(0);

    // Initial avatar spawn point at (0, 8)
    const spawnResult = resolveObstacleCollision(0, 8, 0.35);
    expect(spawnResult.collided).toBe(false);
    expect(spawnResult.x).toBe(0);
    expect(spawnResult.z).toBe(8);
  });

  it('supports smooth slide-along-surface when approaching an obstacle diagonally', () => {
    // Approaching Student Workstation #2 (at x=2.8, z=2.6) from the aisle at x=1.9, z=2.6
    const result = resolveObstacleCollision(2.2, 2.6, 0.35);
    expect(result.collided).toBe(true);
    // X is clamped to the left edge of the desk collider
    expect(result.x).toBeLessThan(2.2);
    // Z is preserved, allowing smooth sliding along the edge
    expect(result.z).toBe(2.6);
  });

  it('retains sealed prerequisite barrier blocking alongside furniture obstacles', () => {
    const mockWorldState: WorldState = {
      active_learner_id: 'learner_b',
      atrium_radius: 18.0,
      wings: {
        array_station: { wing_id: 'array_station', name: 'Array', concept: 'array', status: 'accessible', azimuth_deg: 30, coordinates: [12, 0, -20] },
        linked_list_lab: { wing_id: 'linked_list_lab', name: 'List', concept: 'linked_list', status: 'accessible', azimuth_deg: 90, coordinates: [24, 0, 0] },
        stack_lab: { wing_id: 'stack_lab', name: 'Stack', concept: 'stack', status: 'accessible', azimuth_deg: 150, coordinates: [12, 0, 20] },
        tree_lab: { wing_id: 'tree_lab', name: 'Tree', concept: 'tree', status: 'sealed', azimuth_deg: 210, coordinates: [-12, 0, 20] },
        recursion_lab: { wing_id: 'recursion_lab', name: 'Recursion', concept: 'recursion', status: 'sealed', azimuth_deg: 270, coordinates: [-24, 0, 0] },
      },
      conduits_target_wing: 'stack_lab',
    };

    // Approach sealed Recursion Lab barrier at x = -17.0, z = 0.0
    const barrierResult = resolveAvatarCollision(-17.0, 0.0, mockWorldState);
    expect(barrierResult.isBlockedByBarrier).toBe(true);
    expect(barrierResult.blockedWingId).toBe('recursion_lab');
    expect(barrierResult.x).toBeCloseTo(-15.8, 1);
  });

  it('updates animation without throwing errors', () => {
    expect(() => {
      campus.update(0.016);
      campus.update(1.0);
    }).not.toThrow();
  });

  it('disposes geometries, materials, and textures cleanly', () => {
    expect(() => {
      campus.dispose();
    }).not.toThrow();
  });
});
