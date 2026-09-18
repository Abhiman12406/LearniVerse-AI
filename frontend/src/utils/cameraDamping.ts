/**
 * Camera Damping and Dual-Perspective Spatial Math Utilities
 *
 * Implements frame-rate independent exponential smoothing:
 *   factor = 1 - Math.exp(-lambda * delta)
 *   val = val + (target - val) * factor
 *
 * Provides analytical position and orientation calculations for:
 *   - Third-Person Perspective (3P chase orbit camera)
 *   - First-Person Perspective (1P eye-level camera at 1.62m)
 */

export type PerspectiveMode = '3rd_person' | '1st_person';

export interface CameraPose {
  position: [number, number, number];
  lookAt: [number, number, number];
}

/**
 * Calculates frame-rate independent exponential damping for scalar values.
 *
 * @param current Current value
 * @param target Desired target value
 * @param lambda Damping coefficient (higher = faster convergence)
 * @param delta Elapsed time in seconds
 */
export function exponentialDamp(
  current: number,
  target: number,
  lambda: number,
  delta: number
): number {
  if (delta <= 0) return current;
  const factor = 1 - Math.exp(-lambda * delta);
  return current + (target - current) * factor;
}

/**
 * Computes ideal 3P chase camera position and look target behind the avatar.
 *
 * @param avatarPos [x, y, z] avatar world position
 * @param angle Horizontal azimuth orbit angle in radians
 * @param pitch Vertical pitch orbit angle in radians
 * @param distance Orbit distance from avatar (meters)
 */
export function calculateThirdPersonCamera(
  avatarPos: [number, number, number],
  angle: number,
  pitch: number,
  distance: number = 6.8
): CameraPose {
  const [ax, ay, az] = avatarPos;
  const height = 2.8 + Math.sin(pitch) * 1.8;

  const idealX = ax + Math.sin(angle) * distance;
  const idealZ = az + Math.cos(angle) * distance;
  const idealY = ay + height;

  return {
    position: [idealX, idealY, idealZ],
    lookAt: [ax, ay + 1.2, az],
  };
}

/**
 * Computes 1P eye-level camera position and forward look target from the avatar.
 *
 * @param avatarPos [x, y, z] avatar world position
 * @param angle Horizontal view azimuth in radians
 * @param pitch Vertical view pitch in radians
 * @param eyeHeight Eye elevation above avatar feet (default: 1.62m)
 */
export function calculateFirstPersonCamera(
  avatarPos: [number, number, number],
  angle: number,
  pitch: number,
  eyeHeight: number = 1.62
): CameraPose {
  const [ax, ay, az] = avatarPos;
  const eyeX = ax;
  const eyeY = ay + eyeHeight;
  const eyeZ = az;

  // Forward unit direction: angle=0 faces -Z
  const forwardX = -Math.sin(angle) * Math.cos(pitch);
  const forwardY = -Math.sin(pitch);
  const forwardZ = -Math.cos(angle) * Math.cos(pitch);

  const lookDistance = 10.0;

  return {
    position: [eyeX, eyeY, eyeZ],
    lookAt: [
      eyeX + forwardX * lookDistance,
      eyeY + forwardY * lookDistance,
      eyeZ + forwardZ * lookDistance,
    ],
  };
}
