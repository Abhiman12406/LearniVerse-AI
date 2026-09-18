import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KnowledgeGraphConstellation } from './KnowledgeGraphConstellation';
import { AIMentorBeacon } from './AIMentorBeacon';

export const CentralDais: React.FC = () => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRuneRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.15;
    }
    if (innerRuneRef.current) {
      innerRuneRef.current.rotation.z -= delta * 0.25;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Lower Step Tier */}
      <mesh position={[0, 0.125, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 5.5, 0.25, 64]} />
        <meshStandardMaterial color="#0c0e17" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Main Elevated Platform */}
      <mesh position={[0, 0.375, 0]} receiveShadow>
        <cylinderGeometry args={[4.2, 4.4, 0.25, 64]} />
        <meshStandardMaterial color="#121624" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* Outer Rotating Emissive Energy Ring */}
      <mesh ref={outerRingRef} position={[0, 0.505, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 4.05, 64]} />
        <meshBasicMaterial color="#00f0ff" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* Inner Concentric Rune Ring */}
      <mesh ref={innerRuneRef} position={[0, 0.508, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.4, 2.6, 6]} />
        <meshBasicMaterial color="#7928ca" side={THREE.DoubleSide} transparent opacity={0.75} />
      </mesh>

      {/* Center Core Emitter */}
      <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial
          color="#050811"
          emissive="#00f0ff"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* 3D Holographic Knowledge Graph Constellation */}
      <KnowledgeGraphConstellation />

      {/* In-World Holographic AI Mentor Beacon */}
      <AIMentorBeacon position={[2, 0.5, 2]} />
    </group>
  );
};
