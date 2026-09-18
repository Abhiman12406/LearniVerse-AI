import React, { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RecursionChamber } from './RecursionChamber';
import { useClassroomStore } from '../../store/useClassroomStore';

export const RecursionLabWing: React.FC = () => {
  const avatar = useClassroomStore((s) => s.avatar);
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);

  const [isNear, setIsNear] = useState(false);

  // Position of Recursion Lab Wing Chamber (North Wing at X = 0, Z = -20.0)
  const wingPos: [number, number, number] = [0.0, 0.0, -20.0];
  // Console apparatus anchor point on chamber platform
  const consolePos: [number, number, number] = [0.0, 0.0, -20.0];

  // Proximity detection
  useFrame(() => {
    const [ax, , az] = avatar.position;
    const dist = Math.hypot(ax - consolePos[0], az - consolePos[2]);
    const near = dist <= 4.0;
    if (near !== isNear) {
      setIsNear(near);
    }
  });

  // Handle [E] to engage console and [ESC] to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'KeyE' && isNear && !activeStation) {
        setActiveStation('recursion_lab');
      } else if (e.code === 'Escape' && activeStation === 'recursion_lab') {
        setActiveStation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, activeStation, setActiveStation]);

  // Face archway entrance (facing South toward central classroom)
  const chamberRotationY = 0;

  return (
    <group position={wingPos} rotation={[0, chamberRotationY, 0]}>
      {/* Hexagonal Laboratory Chamber Platform */}
      <mesh position={[0, -0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.2, 6]} />
        <meshStandardMaterial
          color="#0c0a17"
          roughness={0.45}
          metalness={0.8}
        />
      </mesh>

      {/* Outer Chamber Boundary Accent Ring (Violet / Cyan Recursion motif) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.8, 5.1, 6]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Cybernetic Floor Grid Lines */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 2.92, 32]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Ambient Recursion Laboratory Lighting */}
      <pointLight position={[0, 4.5, 0]} color="#a855f7" intensity={2.0} distance={8.5} />
      <pointLight position={[-2.5, 2.8, 2.0]} color="#00f0ff" intensity={1.2} distance={5.5} />
      <pointLight position={[2.5, 2.8, -2.0]} color="#ffaa22" intensity={1.2} distance={5.5} />

      {/* Safety Stanchions around perimeter */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const ang = (i / 6) * Math.PI * 2;
        const sx = Math.sin(ang) * 4.8;
        const sz = Math.cos(ang) * 4.8;
        return (
          <group key={i} position={[sx, 0, sz]}>
            <mesh position={[0, 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 1.4, 12]} />
              <meshStandardMaterial color="#1e1b4b" roughness={0.3} metalness={0.9} />
            </mesh>
            <mesh position={[0, 1.42, 0]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color={i % 2 === 0 ? '#a855f7' : '#00f0ff'} />
            </mesh>
          </group>
        );
      })}

      {/* Elevated Apparatus Pedestal Table */}
      <group position={[0, 0, 0.0]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.8, 2.0, 0.8, 8]} />
          <meshStandardMaterial color="#131127" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.81, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.55, 1.75, 8]} />
          <meshBasicMaterial color="#8b5cf6" />
        </mesh>

        {/* 3D Kinetic Recursion Call-Stack Elevator Apparatus mounted on table */}
        <group position={[0, 0.8, 0]}>
          <RecursionChamber />
        </group>

        {/* Floating Proximity Interaction Prompt */}
        {isNear && !activeStation && (
          <Float speed={2.5} rotationIntensity={0.02} floatIntensity={0.15}>
            <group position={[0, 4.4, 0.6]}>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[3.2, 0.65]} />
                <meshStandardMaterial color="#0b081c" transparent opacity={0.88} />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[3.24, 0.69]} />
                <meshBasicMaterial color="#a855f7" wireframe />
              </mesh>
              <Text
                position={[0, 0.02, 0.02]}
                fontSize={0.21}
                color="#c084fc"
                anchorX="center"
                anchorY="middle"
                fontWeight={700}
                letterSpacing={0.05}
              >
                [E] ACCESS CONSOLE
              </Text>
            </group>
          </Float>
        )}
      </group>
    </group>
  );
};
