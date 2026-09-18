import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';
import { resolveAvatarCollision } from '../../utils/collision';

interface AvatarProps {
  cameraAngleRef: React.MutableRefObject<number>; // Horizontal orbit angle in radians
}

export const Avatar: React.FC<AvatarProps> = ({ cameraAngleRef }) => {
  const avatarGroupRef = useRef<THREE.Group>(null);
  const bodyMeshRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  // Position and movement vector tracking
  const position = useRef(new THREE.Vector3(0, 0, 8));
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef<{ [key: string]: boolean }>({});
  const setAvatarState = useClassroomStore((s) => s.setAvatarState);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

    // Movement input vector relative to camera azimuth
    const forward = (keys.current['KeyW'] || keys.current['ArrowUp']) ? 1 : (keys.current['KeyS'] || keys.current['ArrowDown']) ? -1 : 0;
    const strafe = (keys.current['KeyA'] || keys.current['ArrowLeft']) ? -1 : (keys.current['KeyD'] || keys.current['ArrowRight']) ? 1 : 0;
    const isSprinting = !!keys.current['ShiftLeft'] || !!keys.current['ShiftRight'];

    const moveSpeed = (isSprinting ? 9.0 : 5.5) * delta;
    const isMoving = forward !== 0 || strafe !== 0;

    if (isMoving) {
      // Calculate movement direction relative to camera angle
      const camAngle = cameraAngleRef.current;
      const inputAngle = Math.atan2(strafe, forward);
      const moveAngle = camAngle + inputAngle;

      // Move in camera forward direction (toward -Z when camAngle=0)
      const targetVx = -Math.sin(moveAngle) * moveSpeed;
      const targetVz = -Math.cos(moveAngle) * moveSpeed;

      // Smooth acceleration lerp
      velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, targetVx, 0.2);
      velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, targetVz, 0.2);

      // Rotate avatar mesh toward movement direction
      const currentRot = avatarGroupRef.current.rotation.y;
      const targetRot = Math.atan2(-velocity.current.x, -velocity.current.z);
      let diff = (targetRot - currentRot) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      avatarGroupRef.current.rotation.y += diff * 0.25;
    } else {
      // Damping deceleration
      velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, 0, 0.25);
      velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, 0, 0.25);
    }

    // Apply translation
    position.current.x += velocity.current.x;
    position.current.z += velocity.current.z;

    // Boundary collision with Atrium perimeter & sealed Prerequisite Barriers
    const { worldState } = useClassroomStore.getState();
    const collision = resolveAvatarCollision(
      position.current.x,
      position.current.z,
      worldState,
      17.2
    );
    position.current.x = collision.x;
    position.current.z = collision.z;

    if (collision.isBlockedByBarrier) {
      // Dampen velocity when contacting an energized barrier
      velocity.current.x *= 0.1;
      velocity.current.z *= 0.1;
    }

    const currentDist = Math.hypot(position.current.x, position.current.z);

    // Vertical elevation: step up smoothly onto Central Dais (radius 5.0 has elevation 0.5)
    let targetY = 0;
    if (currentDist < 5.0) {
      targetY = 0.5;
    } else if (currentDist < 5.4) {
      // Step ramp
      const t = (5.4 - currentDist) / 0.4;
      targetY = 0.5 * t;
    }
    position.current.y = THREE.MathUtils.lerp(position.current.y, targetY, 0.15);

    // Walking animation cycle
    if (isMoving) {
      const time = performance.now() * 0.012 * (isSprinting ? 1.4 : 1.0);
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(time) * 0.6;
        rightLegRef.current.rotation.x = -Math.sin(time) * 0.6;
      }
      if (bodyMeshRef.current) {
        bodyMeshRef.current.position.y = 0.95 + Math.abs(Math.sin(time * 2)) * 0.08;
      }
    } else {
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.2);
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.2);
      }
      if (bodyMeshRef.current) {
        bodyMeshRef.current.position.y = THREE.MathUtils.lerp(bodyMeshRef.current.position.y, 0.95, 0.2);
      }
    }

    avatarGroupRef.current.position.copy(position.current);

    // Sync transient coordinates to store at low interval or frame
    setAvatarState(
      [position.current.x, position.current.y, position.current.z],
      avatarGroupRef.current.rotation.y,
      isMoving
    );
  });

  return (
    <group ref={avatarGroupRef} position={[0, 0, 8]}>
      {/* Procedural Cybernetic Avatar Rig */}
      <group ref={bodyMeshRef} position={[0, 0.95, 0]}>
        {/* Sleek Torso */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.55, 0.65, 0.35]} />
          <meshStandardMaterial color="#0c101d" roughness={0.3} metalness={0.85} />
        </mesh>

        {/* Emissive Core Crystal */}
        <mesh position={[0, 0.4, 0.185]}>
          <boxGeometry args={[0.18, 0.22, 0.05]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>

        {/* Cyber Helm / Head */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.36, 0.36, 0.38]} />
          <meshStandardMaterial color="#161c2e" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Emissive Visor */}
        <mesh position={[0, 0.86, 0.19]}>
          <planeGeometry args={[0.28, 0.12]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>

        {/* Shoulder Pauldrons */}
        <mesh position={[-0.38, 0.58, 0]} castShadow>
          <boxGeometry args={[0.2, 0.22, 0.3]} />
          <meshStandardMaterial color="#1a2238" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0.38, 0.58, 0]} castShadow>
          <boxGeometry args={[0.2, 0.22, 0.3]} />
          <meshStandardMaterial color="#1a2238" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* Left Articulated Leg */}
      <mesh ref={leftLegRef} position={[-0.18, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.85, 12]} />
        <meshStandardMaterial color="#0f1424" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Right Articulated Leg */}
      <mesh ref={rightLegRef} position={[0.18, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.85, 12]} />
        <meshStandardMaterial color="#0f1424" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Subtle Avatar Ground Spotlight / Shadow Anchor */}
      <pointLight position={[0, 0.2, 0]} intensity={0.6} distance={2.5} color="#00f0ff" />
    </group>
  );
};
