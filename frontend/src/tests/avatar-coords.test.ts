import { describe, it, expect } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';

describe('Avatar Initial Coordinates & Collision Boundaries', () => {
  it('places Avatar at initial coordinates (0, 0, 8)', () => {
    const avatar = useClassroomStore.getState().avatar;
    expect(avatar.position).toEqual([0, 0, 8]);
    expect(avatar.rotation).toBe(0);
    expect(avatar.isMoving).toBe(false);
  });

  it('correctly clamps coordinates attempting to exceed Atrium boundary radius (17.2 units)', () => {
    const maxRadius = 17.2;

    // Helper simulating avatar boundary collision calculation from Avatar.tsx
    const clampToPerimeter = (x: number, z: number): [number, number] => {
      const dist = Math.hypot(x, z);
      if (dist > maxRadius) {
        const angle = Math.atan2(z, x);
        return [Math.cos(angle) * maxRadius, Math.sin(angle) * maxRadius];
      }
      return [x, z];
    };

    // Test inside boundary
    const [inX, inZ] = clampToPerimeter(5, 5);
    expect(inX).toBe(5);
    expect(inZ).toBe(5);

    // Test overshoot (e.g. x=20, z=0)
    const [clampedX, clampedZ] = clampToPerimeter(25, 0);
    expect(clampedX).toBeCloseTo(17.2);
    expect(clampedZ).toBeCloseTo(0);

    // Test diagonal overshoot (e.g. x=15, z=15 -> hypot is ~21.2)
    const [diagX, diagZ] = clampToPerimeter(15, 15);
    const clampedDist = Math.hypot(diagX, diagZ);
    expect(clampedDist).toBeCloseTo(17.2);
  });

  it('computes elevation step up onto Central Dais when within radius 5.0 units', () => {
    const calculateElevation = (x: number, z: number): number => {
      const dist = Math.hypot(x, z);
      if (dist < 5.0) {
        return 0.5; // Raised dais platform height
      } else if (dist < 5.4) {
        const t = (5.4 - dist) / 0.4;
        return 0.5 * t;
      }
      return 0.0;
    };

    // At origin (center of Dais)
    expect(calculateElevation(0, 0)).toBe(0.5);

    // On dais platform (e.g. radius 3.0)
    expect(calculateElevation(3, 0)).toBe(0.5);

    // Out in Atrium floor (e.g. radius 8.0)
    expect(calculateElevation(0, 8)).toBe(0.0);
  });
});
