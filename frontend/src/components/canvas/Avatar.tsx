import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';
import { resolveAvatarCollision } from '../../utils/collision';
import { createStudentAvatar } from '../../assets/3d/createStudentAvatar';
import { soundSystem } from '../../audio/soundSystem';

interface AvatarProps {
  cameraAngleRef: React.MutableRefObject<number>; // Horizontal orbit angle in radians
}

/**
 * Computes floor ground elevation taking into account the Central Dais platform (radius 5.0m, height 0.5m)
 * and the beveled step transition down to the Atrium floor (radius 5.0m to 5.4m).
 */
export function calculateDaisElevation(x: number, z: number): number {
  const dist = Math.hypot(x, z);
  if (dist < 5.0) {
    return 0.5; // Raised dais platform height
  } else if (dist < 5.4) {
    const t = (5.4 - dist) / 0.4;
    return 0.5 * t;
  }
  return 0.0;
}

export const Avatar: React.FC<AvatarProps> = ({ cameraAngleRef }) => {
  const avatarGroupRef = useRef<THREE.Group>(null);

  // Position and movement vector tracking
  const position = useRef(new THREE.Vector3(0, 0, 8));
  const velocity = useRef(new THREE.Vector3());
  const verticalVelocity = useRef<number>(0);
  const isJumping = useRef<boolean>(false);
  const stepTimer = useRef<number>(0);
  const keys = useRef<{ [key: string]: boolean }>({});
  const setAvatarState = useClassroomStore((s) => s.setAvatarState);

  // Procedural Student Avatar Rig
  const rig = useMemo(() => createStudentAvatar(), []);

  useEffect(() => {
    return () => {
      rig.dispose();
    };
  }, [rig]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // AI Mentor interaction key
      if (e.code === 'KeyE') {
        const { isNearMentor, isMentorOpen, openMentor, closeMentor } = useClassroomStore.getState();
        if (isNearMentor) {
          if (!isMentorOpen) {
            openMentor();
          } else {
            closeMentor();
          }
          return;
        }
      }

      if (e.code === 'Escape') {
        const { isMentorOpen, closeMentor } = useClassroomStore.getState();
        if (isMentorOpen) {
          closeMentor();
          return;
        }
      }

      // Jump trigger
      if (e.code === 'Space' && !isJumping.current) {
        const { isMentorOpen } = useClassroomStore.getState();
        if (!isMentorOpen) {
          isJumping.current = true;
          verticalVelocity.current = 7.2; // Initial upward jump impulse
        }
      }

      keys.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!avatarGroupRef.current) return;

    const isMentorOpen = useClassroomStore.getState().isMentorOpen;

    // Movement input vector relative to camera azimuth (suppressed if mentor dialogue is open)
    const forward: number = isMentorOpen
      ? 0
      : (keys.current['KeyW'] || keys.current['ArrowUp'])
      ? 1
      : (keys.current['KeyS'] || keys.current['ArrowDown'])
      ? -1
      : 0;

    const strafe: number = isMentorOpen
      ? 0
      : (keys.current['KeyA'] || keys.current['ArrowLeft'])
      ? -1
      : (keys.current['KeyD'] || keys.current['ArrowRight'])
      ? 1
      : 0;

    const isSprinting = !isMentorOpen && (!!keys.current['ShiftLeft'] || !!keys.current['ShiftRight']);
    const isMoving = forward !== 0 || strafe !== 0;
    const moveSpeed = (isSprinting ? 9.2 : 5.4) * delta;

    let turnRate = 0;

    if (isMoving) {
      // Calculate movement direction relative to camera angle
      const camAngle = cameraAngleRef.current;
      const inputAngle = Math.atan2(strafe, forward);
      const moveAngle = camAngle + inputAngle;

      // Move in camera forward direction (toward -Z when camAngle=0)
      const targetVx = -Math.sin(moveAngle) * moveSpeed;
      const targetVz = -Math.cos(moveAngle) * moveSpeed;

      // Smooth acceleration lerp
      velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, targetVx, 0.22);
      velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, targetVz, 0.22);

      // Rotate avatar mesh toward movement direction
      const currentRot = avatarGroupRef.current.rotation.y;
      const targetRot = Math.atan2(-velocity.current.x, -velocity.current.z);
      let diff = (targetRot - currentRot) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;

      // Slerp angular rotation
      const rotStep = diff * 0.25;
      avatarGroupRef.current.rotation.y += rotStep;

      // Turn rate in radians per second to drive turn banking
      turnRate = diff / Math.max(delta, 0.001);
    } else {
      // Deceleration damping
      velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, 0, 0.25);
      velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, 0, 0.25);
    }

    // Apply horizontal translation
    position.current.x += velocity.current.x;
    position.current.z += velocity.current.z;

    // Physical collision against furniture obstacles & sealed prerequisite barriers
    const { worldState } = useClassroomStore.getState();
    const collision = resolveAvatarCollision(
      position.current.x,
      position.current.z,
      worldState,
      17.2,
      true
    );
    position.current.x = collision.x;
    position.current.z = collision.z;

    if (collision.isBlockedByBarrier) {
      // Dampen velocity when contacting an energized barrier
      velocity.current.x *= 0.1;
      velocity.current.z *= 0.1;
    }

    // Vertical elevation: Dais stepping & Jump physics
    const groundY = calculateDaisElevation(position.current.x, position.current.z);

    if (isJumping.current) {
      // Gravity acceleration
      verticalVelocity.current -= 22.0 * delta;
      position.current.y += verticalVelocity.current * delta;

      if (position.current.y <= groundY) {
        position.current.y = groundY;
        verticalVelocity.current = 0;
        isJumping.current = false;
        soundSystem.playFootstep('wood');
      }
    } else {
      // Smoothly step up/down to ground elevation
      position.current.y = THREE.MathUtils.lerp(position.current.y, groundY, 0.25);
    }

    // Procedural footstep audio synchronized with avatar strides
    if (isMoving && !isJumping.current) {
      stepTimer.current += delta;
      const stepCadence = isSprinting ? 0.28 : 0.42;
      if (stepTimer.current >= stepCadence) {
        stepTimer.current = 0;
        soundSystem.playFootstep('wood');
      }
    } else {
      stepTimer.current = 0;
    }

    // Update avatar group position
    avatarGroupRef.current.position.copy(position.current);

    // Update procedural avatar rig locomotion cycle
    const jumpProgress = isJumping.current
      ? Math.min(Math.max((position.current.y - groundY) / 1.2, 0), 1)
      : 0;

    rig.update(delta, {
      isMoving,
      isSprinting,
      isJumping: isJumping.current,
      jumpProgress,
      speed: Math.hypot(velocity.current.x, velocity.current.z) / Math.max(delta, 0.001),
      turnRate,
    });

    // Sync transient coordinates to store for camera and HUD tracking
    setAvatarState(
      [position.current.x, position.current.y, position.current.z],
      avatarGroupRef.current.rotation.y,
      isMoving
    );
  });

  return (
    <group ref={avatarGroupRef} position={[0, 0, 8]}>
      {/* Procedural 3D Student Character Rig */}
      <primitive object={rig.characterGroup} />

      {/* Subtle Avatar Ground Spotlight / Shadow Anchor */}
      <pointLight position={[0, 0.2, 0]} intensity={0.6} distance={2.5} color="#00f0ff" />
    </group>
  );
};
