import React, { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { ArrayStation } from './ArrayStation';
import { useClassroomStore } from '../../store/useClassroomStore';

export const ArrayLabWing: React.FC = () => {
  const avatar = useClassroomStore((s) => s.avatar);
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);

  const [isNear, setIsNear] = useState(false);

  // Position of Array Station Wing Chamber (West Wing at X = -20.0, Z = 0)
  const wingPos: [number, number, number] = [-20.0, 0.0, 0.0];
  // Console apparatus anchor point on chamber platform
  const consolePos: [number, number, number] = [-20.0, 0.0, 0.0];

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
        setActiveStation('array_station');
      } else if (e.code === 'Escape' && activeStation === 'array_station') {
        setActiveStation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, activeStation, setActiveStation]);

  // Face archway entrance (facing East toward central classroom)
  const chamberRotationY = Math.PI / 2;

  return (
    <group position={wingPos} rotation={[0, chamberRotationY, 0]}>
      {/* Hexagonal Laboratory Chamber Platform */}
      <mesh position={[0, -0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.2, 6]} />
        <meshStandardMaterial
          color="#0b1120"
          roughness={0.45}
          metalness={0.75}
        />
      </mesh>

      {/* Outer Chamber Boundary Accent Ring (Emerald/Amber Array motif) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.8, 5.1, 6]} />
        <meshBasicMaterial color="#059669" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Cybernetic Floor Grid Concentric Ring */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 2.92, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Array Lab Wing Atmospheric Illumination */}
      <pointLight position={[0, 4.2, 0]} color="#10b981" intensity={1.6} distance={8.5} />
      <pointLight position={[-2.5, 2.5, 2.0]} color="#ffb700" intensity={1.1} distance={5.0} />
      <pointLight position={[2.5, 2.5, -2.0]} color="#00f0ff" intensity={0.9} distance={5.0} />

      {/* Safety Stanchions around chamber perimeter */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const ang = (i / 6) * Math.PI * 2;
        const sx = Math.sin(ang) * 4.8;
        const sz = Math.cos(ang) * 4.8;
        return (
          <group key={i} position={[sx, 0, sz]}>
            <mesh position={[0, 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 1.4, 12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.9} />
            </mesh>
            <mesh position={[0, 1.42, 0]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
          </group>
        );
      })}

      {/* Elevated Apparatus Pedestal Table */}
      <group position={[0, 0, 0.5]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.0, 2.2, 0.8, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.88} />
        </mesh>
        <mesh position={[0, 0.81, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.75, 1.95, 8]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>

        {/* 3D Kinetic Array Station mounted on table */}
        <group position={[0, 0.8, 0]}>
          <ArrayStation />
        </group>

        {/* Floating Proximity Interaction Prompt */}
        {isNear && !activeStation && (
          <Float speed={2.5} rotationIntensity={0.02} floatIntensity={0.15}>
            <group position={[0, 3.8, 0.6]}>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[3.2, 0.65]} />
                <meshStandardMaterial color="#0f172a" transparent opacity={0.88} />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[3.24, 0.69]} />
                <meshBasicMaterial color="#10b981" wireframe />
              </mesh>
              <Text
                position={[0, 0.02, 0.02]}
                fontSize={0.2}
                color="#34d399"
                anchorX="center"
                anchorY="middle"
                fontWeight={700}
                letterSpacing={0.05}
              >
                [E] ENTER ARRAY STATION
              </Text>
            </group>
          </Float>
        )}
      </group>
    </group>
  );
};
