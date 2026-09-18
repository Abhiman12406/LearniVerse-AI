import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';

interface AIMentorBeaconProps {
  position?: [number, number, number];
}

export const AIMentorBeacon: React.FC<AIMentorBeaconProps> = ({
  position = [2, 0.5, 2],
}) => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const promptGroupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const wasNearRef = useRef<boolean>(false);

  const isMentorOpen = useClassroomStore((s) => s.isMentorOpen);
  const isNearMentor = useClassroomStore((s) => s.isNearMentor);
  const openMentor = useClassroomStore((s) => s.openMentor);
  const learner = useClassroomStore((s) => s.learner);

  const isRemedial = learner?.learning_state.status === 'remediation_required';
  const beaconColor = isRemedial ? '#a855f7' : '#00f0ff';
  const accentColor = isRemedial ? '#ff0055' : '#00ff88';

  useFrame(({ clock }, delta) => {
    // Continuous rotation of holographic rings
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x += delta * 0.8;
      outerRingRef.current.rotation.y += delta * 0.5;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y -= delta * 0.9;
      innerRingRef.current.rotation.z += delta * 0.6;
    }
    if (coreMeshRef.current) {
      coreMeshRef.current.rotation.y += delta * 1.2;
    }

    // Gentle pulsing emissive glow
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      lightRef.current.intensity = 1.6 + Math.sin(t * 3) * 0.5;
    }

    // Proximity check against Avatar position
    const [ax, , az] = useClassroomStore.getState().avatar.position;
    const [bx, , bz] = position;
    const dist = Math.hypot(ax - bx, az - bz);
    const isNear = dist <= 3.2;

    if (isNear !== wasNearRef.current) {
      wasNearRef.current = isNear;
      useClassroomStore.getState().setIsNearMentor(isNear);
    }

    // Billboarding for interaction prompt: face the camera/avatar
    if (promptGroupRef.current) {
      promptGroupRef.current.lookAt(ax, 2.5, az);
    }
  });

  return (
    <group position={position}>
      {/* Dais Mount Pedestal */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.7, 0.3, 24]} />
        <meshStandardMaterial
          color="#0c0f1a"
          roughness={0.3}
          metalness={0.9}
        />
      </mesh>

      {/* Pedestal Top Glowing Energy Inset */}
      <mesh position={[0, 0.305, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 24]} />
        <meshBasicMaterial color={beaconColor} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* Floor Energy Halo Ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.4, 32]} />
        <meshBasicMaterial
          color={beaconColor}
          side={THREE.DoubleSide}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Upward Holographic Projection Light Column */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.65, 0.45, 2.4, 24, 1, true]} />
        <meshBasicMaterial
          color={beaconColor}
          side={THREE.DoubleSide}
          transparent
          opacity={0.12}
          wireframe={false}
        />
      </mesh>

      {/* Dynamic Point Light */}
      <pointLight
        ref={lightRef}
        position={[0, 1.6, 0]}
        intensity={2.0}
        distance={6}
        color={beaconColor}
      />

      {/* Floating Holographic Core & Orbital Rings */}
      <Float speed={2.4} rotationIntensity={0.2} floatIntensity={0.3}>
        <group position={[0, 1.5, 0]}>
          {/* Outer Gyro Ring */}
          <mesh ref={outerRingRef}>
            <torusGeometry args={[0.7, 0.02, 16, 48]} />
            <meshStandardMaterial
              color={beaconColor}
              emissive={beaconColor}
              emissiveIntensity={0.8}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>

          {/* Inner Counter-Rotating Gyro Ring */}
          <mesh ref={innerRingRef}>
            <torusGeometry args={[0.5, 0.02, 16, 48]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.9}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>

          {/* Central Floating Crystalline Octahedron Core */}
          <mesh ref={coreMeshRef} castShadow>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={beaconColor}
              emissiveIntensity={1.4}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>

          {/* Satellites / Mini Data Nodes */}
          <mesh position={[0.45, 0.3, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>
          <mesh position={[-0.45, -0.2, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color={beaconColor} />
          </mesh>
        </group>
      </Float>

      {/* Permanent In-World Holographic Name Tag */}
      <group position={[0, 2.45, 0]}>
        <Text
          fontSize={0.16}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          AI MENTOR
        </Text>
        <Text
          position={[0, -0.16, 0]}
          fontSize={0.10}
          color={beaconColor}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
        >
          FEYNMAN COGNITIVE BEACON
        </Text>
      </group>

      {/* Interactive In-World Prompt Billboard when in proximity */}
      {isNearMentor && !isMentorOpen && (
        <group ref={promptGroupRef} position={[0, 2.9, 0]}>
          <Float speed={4.0} rotationIntensity={0} floatIntensity={0.15}>
            <group
              onClick={(e) => {
                e.stopPropagation();
                openMentor();
              }}
              onPointerOver={() => {
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default';
              }}
            >
              {/* Pill Backplate */}
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[1.9, 0.42]} />
                <meshBasicMaterial color="#0c1020" transparent opacity={0.88} />
              </mesh>
              {/* Glowing Outline */}
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[1.94, 0.46]} />
                <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.8} />
              </mesh>
              <Text
                fontSize={0.14}
                color="#00f0ff"
                anchorX="center"
                anchorY="middle"
                fontWeight={700}
                letterSpacing={0.04}
              >
                [E] CONSULT AI MENTOR
              </Text>
            </group>
          </Float>
        </group>
      )}
    </group>
  );
};
