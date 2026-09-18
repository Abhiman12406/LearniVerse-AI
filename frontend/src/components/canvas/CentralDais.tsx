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
      {/* Sleek Flush Floor Medallion Projector Plate */}
      <mesh position={[0, 0.015, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 64]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.35} metalness={0.7} />
      </mesh>

      {/* Outer Rotating Emissive Energy Ring */}
      <mesh ref={outerRingRef} position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.35, 1.45, 64]} />
        <meshBasicMaterial color="#00f0ff" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* Inner Concentric Rune Ring */}
      <mesh ref={innerRuneRef} position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 0.95, 6]} />
        <meshBasicMaterial color="#7928ca" side={THREE.DoubleSide} transparent opacity={0.75} />
      </mesh>

      {/* Center Holographic Projector Emitter */}
      <mesh position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 32]} />
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
      <AIMentorBeacon position={[1.4, 0.05, 1.4]} />
    </group>
  );
};
