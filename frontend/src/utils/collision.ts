import { WorldState } from '../types/world';

export interface CollisionBounds {
  wingId: string;
  isSealed: boolean;
  azimuthDeg: number;
  centerX: number;
  centerZ: number;
  portalWidth: number;
  barrierDistance: number; // radius threshold where sealed barrier blocks
}

/**
 * Calculates collision boundaries for classroom archways and sealed barriers.
 */
export function getArchwayCollisionBounds(worldState: WorldState | null): CollisionBounds[] {
  if (!worldState) return [];

  const archways = [
    { wingId: 'array_station', azimuthDeg: 30 },
    { wingId: 'linked_list_lab', azimuthDeg: 90 },
    { wingId: 'stack_lab', azimuthDeg: 150 },
    { wingId: 'tree_lab', azimuthDeg: 210 },
    { wingId: 'recursion_lab', azimuthDeg: 270 },
  ];

  return archways.map(({ wingId, azimuthDeg }) => {
    const wing = worldState.wings[wingId];
    const isSealed = wing?.status === 'sealed';
    const angleRad = (azimuthDeg * Math.PI) / 180;
    const archwayRadius = 17.5;
    const centerX = Math.sin(angleRad) * archwayRadius;
    const centerZ = -Math.cos(angleRad) * archwayRadius;

    return {
      wingId,
      isSealed,
      azimuthDeg,
      centerX,
      centerZ,
      portalWidth: 4.4,
      // Sealed barrier stands at radius 15.8 (in front of the 17.5 archway lintel)
      barrierDistance: isSealed ? 15.8 : 22.0,
    };
  });
}

/**
 * Applies physical boundary and sealed barrier collision constraints to the avatar position.
 * Returns the resolved [x, z] coordinates.
 */
export function resolveAvatarCollision(
  x: number,
  z: number,
  worldState: WorldState | null,
  atriumRadius: number = 17.2
): { x: number; z: number; isBlockedByBarrier: boolean; blockedWingId: string | null } {
  let resolvedX = x;
  let resolvedZ = z;
  let isBlocked = false;
  let blockedWing: string | null = null;

  const currentDist = Math.hypot(resolvedX, resolvedZ);
  const bounds = getArchwayCollisionBounds(worldState);

  // Check specific archway portals
  for (const b of bounds) {
    const angleRad = (b.azimuthDeg * Math.PI) / 180;
    // Direction vector from origin to archway center
    const dirX = Math.sin(angleRad);
    const dirZ = -Math.cos(angleRad);

    // Tangent vector along portal width
    const tanX = -dirZ;
    const tanZ = dirX;

    // Project avatar position onto archway radial axis and lateral axis
    const radialDist = resolvedX * dirX + resolvedZ * dirZ;
    const lateralDist = resolvedX * tanX + resolvedZ * tanZ;

    // Must be in the positive radial sector approaching this archway (outer half of atrium)
    const halfWidth = b.portalWidth / 2;
    if (radialDist > 10.0 && Math.abs(lateralDist) <= halfWidth) {
      if (b.isSealed && radialDist >= b.barrierDistance) {
        // Avatar is approaching a sealed barrier: clamp to barrier distance
        isBlocked = true;
        blockedWing = b.wingId;
        const clampedRadial = b.barrierDistance;
        resolvedX = clampedRadial * dirX + lateralDist * tanX;
        resolvedZ = clampedRadial * dirZ + lateralDist * tanZ;
        return { x: resolvedX, z: resolvedZ, isBlockedByBarrier: true, blockedWingId: blockedWing };
      } else if (!b.isSealed && radialDist <= b.barrierDistance) {
        // Portal is accessible: allow passage beyond standard atrium radius up to barrierDistance (22.0)
        return { x: resolvedX, z: resolvedZ, isBlockedByBarrier: false, blockedWingId: null };
      }
    }
  }

  // Standard atrium perimeter clamp if not passing through an accessible portal
  if (currentDist > atriumRadius) {
    const angle = Math.atan2(resolvedZ, resolvedX);
    resolvedX = Math.cos(angle) * atriumRadius;
    resolvedZ = Math.sin(angle) * atriumRadius;
  }

  return { x: resolvedX, z: resolvedZ, isBlockedByBarrier: isBlocked, blockedWingId: blockedWing };
}
