import React from 'react';
import { Text } from '@react-three/drei';
import { useClassroomStore } from '../../store/useClassroomStore';
import { PrerequisiteBarrier } from './PrerequisiteBarrier';
import { DiagnosticPlaque } from './DiagnosticPlaque';

interface ArchwayProps {
  id: string;
  name: string;
  azimuthDeg: number;
  radius: number;
}

const ArchwayPortal: React.FC<ArchwayProps> = ({ id, name, azimuthDeg, radius }) => {
  const worldState = useClassroomStore((s) => s.worldState);
  const wingInfo = worldState?.wings[id];
  const isSealed = wingInfo?.status === 'sealed';

  // Compute archway position on atrium perimeter
  const angleRad = (azimuthDeg * Math.PI) / 180;
  const x = Math.sin(angleRad) * radius;
  const z = -Math.cos(angleRad) * radius;

  // Face inward toward origin
  const rotationY = angleRad + Math.PI;

  const glowColor = isSealed ? '#ff0055' : '#00f0ff';
  const beaconColor = isSealed ? '#ff1744' : '#00e676';

  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
      {/* Left Pillar */}
      <mesh position={[-2.4, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 6, 0.9]} />
        <meshStandardMaterial color="#0c0e18" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Left Pillar Emissive Accent Strip */}
      <mesh position={[-2.4, 3, 0.46]}>
        <planeGeometry args={[0.15, 5.2]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Right Pillar */}
      <mesh position={[2.4, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 6, 0.9]} />
        <meshStandardMaterial color="#0c0e18" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Right Pillar Emissive Accent Strip */}
      <mesh position={[2.4, 3, 0.46]}>
        <planeGeometry args={[0.15, 5.2]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Top Lintel Beam */}
      <mesh position={[0, 6.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.6, 0.8, 1.1]} />
        <meshStandardMaterial color="#131726" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Lintel Underglow */}
      <mesh position={[0, 5.75, 0]}>
        <boxGeometry args={[4.2, 0.08, 0.8]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Status Beacon Orb */}
      <mesh position={[0, 7.0, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color={beaconColor} />
      </mesh>
      <pointLight position={[0, 5.5, 0]} intensity={isSealed ? 1.5 : 1.0} distance={7} color={glowColor} />

      {/* Holographic Archway Label */}
      <Text
        position={[0, 5.2, 0.5]}
        fontSize={0.35}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {name.toUpperCase()}
      </Text>

      {/* Status sublabel */}
      <Text
        position={[0, 4.7, 0.5]}
        fontSize={0.2}
        color={glowColor}
        anchorX="center"
        anchorY="middle"
      >
        {isSealed ? '/// PREREQUISITE SEALED ///' : '>>> ACCESS GRANTED <<<'}
      </Text>

      {/* Procedural Prerequisite Barrier across Portal opening */}
      <PrerequisiteBarrier
        isSealed={!!isSealed}
        width={4.2}
        height={5.6}
      />

      {/* In-World Floating 3D Holographic Diagnostic Plaque */}
      <DiagnosticPlaque
        wingInfo={wingInfo}
        isSealed={!!isSealed}
        position={[0, 2.7, 1.8]}
      />
    </group>
  );
};

export const Archways: React.FC = () => {
  const wings = [
    { id: 'array_station', name: 'Array Station', azimuthDeg: 30 },
    { id: 'linked_list_lab', name: 'Linked List Lab', azimuthDeg: 90 },
    { id: 'stack_lab', name: 'Stack Lab', azimuthDeg: 150 },
    { id: 'tree_lab', name: 'Tree Lab', azimuthDeg: 210 },
    { id: 'recursion_lab', name: 'Recursion Lab', azimuthDeg: 270 },
  ];

  return (
    <group>
      {wings.map((w) => (
        <ArchwayPortal
          key={w.id}
          id={w.id}
          name={w.name}
          azimuthDeg={w.azimuthDeg}
          radius={17.5}
        />
      ))}
    </group>
  );
};
