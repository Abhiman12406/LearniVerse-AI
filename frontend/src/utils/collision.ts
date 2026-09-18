import { WorldState } from '../types/world';
import { getCampusObstacleColliders, CampusCollider } from '../components/canvas/ClassroomCampus';

export interface CollisionBounds {
  wingId: string;
  isSealed: boolean;
  azimuthDeg: number;
  centerX: number;
  centerZ: number;
  portalWidth: number;
  barrierDistance: number; // radius threshold where sealed barrier blocks
}

// Default fallback obstacle colliders for central classroom furniture
const DEFAULT_CLASSROOM_COLLIDERS: CampusCollider[] = [
  { name: "Teacher's Podium Desk", minX: -2.6, maxX: -1.4, minZ: -4.3, maxZ: -2.1 },
  { name: 'Student Workstation #1', minX: 2.0, maxX: 3.6, minZ: -3.8, maxZ: -1.4 },
  { name: 'Student Workstation #2', minX: 2.0, maxX: 3.6, minZ: 1.4, maxZ: 3.8 },
  { name: 'Student Workstation #3', minX: -3.6, maxX: -2.0, minZ: 1.4, maxZ: 3.8 },
  { name: 'Classroom Bookshelf (West)', minX: -5.7, maxX: -4.9, minZ: -4.6, maxZ: -3.0 },
  { name: 'Classroom Bookshelf (East)', minX: 4.9, maxX: 5.7, minZ: -4.6, maxZ: -3.0 },
];

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
      // Sealed barrier stands at radius 15.8; accessible wings allow walking into lab chamber up to 25.5
      barrierDistance: isSealed ? 15.8 : 25.5,
    };
  });
}

/**
 * Resolves avatar collision against solid furniture obstacles (teacher desk, student workstations, bookshelves)
 * using smooth axis-separated pushback.
 */
export function resolveObstacleCollision(
  x: number,
  z: number,
  avatarRadius: number = 0.35,
  customColliders?: CampusCollider[]
): { x: number; z: number; collided: boolean; colliderName: string | null } {
  const dynamicColliders = getCampusObstacleColliders();
  const colliders =
    customColliders ||
    (dynamicColliders.length > 0 ? dynamicColliders : DEFAULT_CLASSROOM_COLLIDERS);

  let resX = x;
  let resZ = z;
  let collided = false;
  let colliderName: string | null = null;

  for (const c of colliders) {
    const minX = c.minX - avatarRadius;
    const maxX = c.maxX + avatarRadius;
    const minZ = c.minZ - avatarRadius;
    const maxZ = c.maxZ + avatarRadius;

    // Check if avatar point is inside expanded obstacle bounding box
    if (resX > minX && resX < maxX && resZ > minZ && resZ < maxZ) {
      collided = true;
      colliderName = c.name;

      // Distance to each edge
      const dLeft = resX - minX;
      const dRight = maxX - resX;
      const dBottom = resZ - minZ;
      const dTop = maxZ - resZ;

      const minOverlap = Math.min(dLeft, dRight, dBottom, dTop);

      if (minOverlap === dLeft) {
        resX = minX;
      } else if (minOverlap === dRight) {
        resX = maxX;
      } else if (minOverlap === dBottom) {
        resZ = minZ;
      } else {
        resZ = maxZ;
      }
    }
  }

  return { x: resX, z: resZ, collided, colliderName };
}

/**
 * Applies physical obstacle constraints, boundary limits, and sealed barrier constraints to the avatar position.
 * Returns the resolved [x, z] coordinates.
 */
export function resolveAvatarCollision(
  x: number,
  z: number,
  worldState: WorldState | null,
  atriumRadius: number = 17.2,
  checkObstacles: boolean = true
): { x: number; z: number; isBlockedByBarrier: boolean; blockedWingId: string | null } {
  let resolvedX = x;
  let resolvedZ = z;
  let isBlocked = false;
  let blockedWing: string | null = null;

  // 1. Resolve collision against furniture & solid obstacles first (if enabled)
  if (checkObstacles) {
    const obs = resolveObstacleCollision(resolvedX, resolvedZ);
    resolvedX = obs.x;
    resolvedZ = obs.z;
  }

  const currentDist = Math.hypot(resolvedX, resolvedZ);
  const bounds = getArchwayCollisionBounds(worldState);

  // 2. Check archway portals & sealed barriers
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

    // Within portal opening width or chamber width once inside
    const allowedWidth = radialDist > 17.5 ? 6.0 : b.portalWidth;
    const halfWidth = allowedWidth / 2;
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
        // Portal is accessible: allow passage beyond standard atrium radius up to barrierDistance
        return { x: resolvedX, z: resolvedZ, isBlockedByBarrier: false, blockedWingId: null };
      }
    }
  }

  // 3. Standard atrium perimeter clamp if not passing through an accessible portal
  if (currentDist > atriumRadius) {
    const angle = Math.atan2(resolvedZ, resolvedX);
    resolvedX = Math.cos(angle) * atriumRadius;
    resolvedZ = Math.sin(angle) * atriumRadius;
  }

  return { x: resolvedX, z: resolvedZ, isBlockedByBarrier: isBlocked, blockedWingId: blockedWing };
}
