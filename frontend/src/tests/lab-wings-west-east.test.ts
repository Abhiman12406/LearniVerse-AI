import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { createClassroomEnvironment } from '../assets/3d/createClassroomEnvironment';
import { resolveObstacleCollision } from '../utils/collision';
import { setCampusObstacleColliders } from '../components/canvas/ClassroomCampus';
import { useClassroomStore } from '../store/useClassroomStore';

describe('Issue 14: West & East Lab Wings (Array Station & Linked List Lab)', () => {
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

  it('registers solid perimeter wall colliders for both 14x14m lab wings', () => {
    const colliders = campus.getActiveColliders();
    const names = colliders.map((c) => c.name);

    // Array Lab (West Wing) wall colliders
    expect(names).toContain('Array Lab West Wall');
    expect(names).toContain('Array Lab North Wall');
    expect(names).toContain('Array Lab South Wall');
    expect(names).toContain('Array Lab East Wall (North)');
    expect(names).toContain('Array Lab East Wall (South)');
    expect(names).toContain('Array Lab Research Desk (North)');
    expect(names).toContain('Array Lab Research Desk (South)');

    // Linked List Lab (East Wing) wall colliders
    expect(names).toContain('Linked List Lab East Wall');
    expect(names).toContain('Linked List Lab North Wall');
    expect(names).toContain('Linked List Lab South Wall');
    expect(names).toContain('Linked List Lab West Wall (North)');
    expect(names).toContain('Linked List Lab West Wall (South)');
    expect(names).toContain('Linked List Lab Tech Bench (North)');
    expect(names).toContain('Linked List Lab Tech Bench (South)');

    // Corridors
    expect(names).toContain('Corridor West North Wall');
    expect(names).toContain('Corridor West South Wall');
    expect(names).toContain('Corridor East North Wall');
    expect(names).toContain('Corridor East South Wall');
  });

  it('permits smooth, unobstructed passage from central classroom through West corridor into Array Lab', () => {
    // Traverse West: from x = -5 (classroom), through x = -9.5 (corridor), through x = -13 (doorway), to x = -20 (room center)
    const waypoints = [
      { x: -5.0, z: 0.0 },
      { x: -9.5, z: 0.0 },
      { x: -13.0, z: 0.0 },
      { x: -16.0, z: 0.0 },
      { x: -20.0, z: 0.0 },
    ];

    for (const pt of waypoints) {
      const res = resolveObstacleCollision(pt.x, pt.z, 0.35);
      expect(res.collided).toBe(false);
      expect(res.x).toBeCloseTo(pt.x, 2);
      expect(res.z).toBeCloseTo(pt.z, 2);
    }
  });

  it('permits smooth, unobstructed passage from central classroom through East corridor into Linked List Lab', () => {
    // Traverse East: from x = 5 (classroom), through x = 9.5 (corridor), through x = 13 (doorway), to x = 20 (room center)
    const waypoints = [
      { x: 5.0, z: 0.0 },
      { x: 9.5, z: 0.0 },
      { x: 13.0, z: 0.0 },
      { x: 16.0, z: 0.0 },
      { x: 20.0, z: 0.0 },
    ];

    for (const pt of waypoints) {
      const res = resolveObstacleCollision(pt.x, pt.z, 0.35);
      expect(res.collided).toBe(false);
      expect(res.x).toBeCloseTo(pt.x, 2);
      expect(res.z).toBeCloseTo(pt.z, 2);
    }
  });

  it('strictly blocks avatar penetration through Array Lab perimeter walls', () => {
    // Approach West outer wall from inside room (at x = -26.6, z = 0)
    const westRes = resolveObstacleCollision(-26.6, 0.0, 0.35);
    expect(westRes.collided).toBe(true);
    expect(westRes.colliderName).toBe('Array Lab West Wall');
    // Avatar is blocked and clamped inside the room
    expect(westRes.x).toBeGreaterThan(-26.5);
    expect(westRes.x).toBeCloseTo(-26.45, 2);

    // Approach North outer wall at open wall section (at x = -16.0, z = -6.6)
    const northRes = resolveObstacleCollision(-16.0, -6.6, 0.35);
    expect(northRes.collided).toBe(true);
    expect(northRes.colliderName).toBe('Array Lab North Wall');
    expect(northRes.z).toBeGreaterThan(-6.5);
    expect(northRes.z).toBeCloseTo(-6.45, 2);

    // Approach South outer wall at open wall section (at x = -16.0, z = +6.6)
    const southRes = resolveObstacleCollision(-16.0, 6.6, 0.35);
    expect(southRes.collided).toBe(true);
    expect(southRes.colliderName).toBe('Array Lab South Wall');
    expect(southRes.z).toBeLessThan(6.5);
    expect(southRes.z).toBeCloseTo(6.45, 2);

    // Approach North Research Desk (at x = -20.0, z = -5.4)
    const deskRes = resolveObstacleCollision(-20.0, -5.4, 0.35);
    expect(deskRes.collided).toBe(true);
    expect(deskRes.colliderName).toBe('Array Lab Research Desk (North)');

    // Approach East wall north of doorway from inside room (at x = -13.4, z = -4.0)
    const eastNorthRes = resolveObstacleCollision(-13.4, -4.0, 0.35);
    expect(eastNorthRes.collided).toBe(true);
    expect(eastNorthRes.colliderName).toBe('Array Lab East Wall (North)');

    // Approach East wall south of doorway from inside room (at x = -13.4, z = 4.0)
    const eastSouthRes = resolveObstacleCollision(-13.4, 4.0, 0.35);
    expect(eastSouthRes.collided).toBe(true);
    expect(eastSouthRes.colliderName).toBe('Array Lab East Wall (South)');
  });

  it('strictly blocks avatar penetration through Linked List Lab perimeter walls', () => {
    // Approach East outer wall from inside room (at x = +26.6, z = 0)
    const eastRes = resolveObstacleCollision(26.6, 0.0, 0.35);
    expect(eastRes.collided).toBe(true);
    expect(eastRes.colliderName).toBe('Linked List Lab East Wall');
    // Avatar is blocked and clamped inside the room
    expect(eastRes.x).toBeLessThan(26.5);
    expect(eastRes.x).toBeCloseTo(26.45, 2);

    // Approach North outer wall at open wall section (at x = 16.0, z = -6.6)
    const northRes = resolveObstacleCollision(16.0, -6.6, 0.35);
    expect(northRes.collided).toBe(true);
    expect(northRes.colliderName).toBe('Linked List Lab North Wall');
    expect(northRes.z).toBeGreaterThan(-6.5);
    expect(northRes.z).toBeCloseTo(-6.45, 2);

    // Approach South outer wall at open wall section (at x = 16.0, z = +6.6)
    const southRes = resolveObstacleCollision(16.0, 6.6, 0.35);
    expect(southRes.collided).toBe(true);
    expect(southRes.colliderName).toBe('Linked List Lab South Wall');
    expect(southRes.z).toBeLessThan(6.5);
    expect(southRes.z).toBeCloseTo(6.45, 2);

    // Approach North Tech Bench (at x = 20.0, z = -5.4)
    const benchRes = resolveObstacleCollision(20.0, -5.4, 0.35);
    expect(benchRes.collided).toBe(true);
    expect(benchRes.colliderName).toBe('Linked List Lab Tech Bench (North)');

    // Approach West wall north of doorway from inside room (at x = 13.4, z = -4.0)
    const westNorthRes = resolveObstacleCollision(13.4, -4.0, 0.35);
    expect(westNorthRes.collided).toBe(true);
    expect(westNorthRes.colliderName).toBe('Linked List Lab West Wall (North)');

    // Approach West wall south of doorway from inside room (at x = 13.4, z = 4.0)
    const westSouthRes = resolveObstacleCollision(13.4, 4.0, 0.35);
    expect(westSouthRes.collided).toBe(true);
    expect(westSouthRes.colliderName).toBe('Linked List Lab West Wall (South)');
  });

  it('blocks avatar when attempting to walk off side of corridors', () => {
    // Walk off West corridor north side at x = -9.5, z = -2.1
    const wNorthRes = resolveObstacleCollision(-9.5, -2.0, 0.35);
    expect(wNorthRes.collided).toBe(true);
    expect(wNorthRes.colliderName).toBe('Corridor West North Wall');

    // Walk off East corridor south side at x = 9.5, z = +2.0
    const eSouthRes = resolveObstacleCollision(9.5, 2.0, 0.35);
    expect(eSouthRes.collided).toBe(true);
    expect(eSouthRes.colliderName).toBe('Corridor East South Wall');
  });

  it('integrates activeStation state with both Array Station and Linked List Lab', () => {
    const store = useClassroomStore.getState();

    // Initially null
    expect(store.activeStation).toBeNull();

    // Engage Array Station
    store.setActiveStation('array_station');
    expect(useClassroomStore.getState().activeStation).toBe('array_station');

    // Engage Linked List Lab
    store.setActiveStation('linked_list_lab');
    expect(useClassroomStore.getState().activeStation).toBe('linked_list_lab');

    // Disengage
    store.setActiveStation(null);
    expect(useClassroomStore.getState().activeStation).toBeNull();
  });
});
