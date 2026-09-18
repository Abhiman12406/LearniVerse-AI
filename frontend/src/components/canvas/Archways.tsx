import React from 'react';
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
  const learner = useClassroomStore((s) => s.learner);
  const wingInfo = worldState?.wings[id];
  const isSealed = wingInfo?.status === 'sealed';

  // Compute archway position on atrium perimeter
  const angleRad = (azimuthDeg * Math.PI) / 180;
  const x = Math.sin(angleRad) * radius;
  const z = -Math.cos(angleRad) * radius;

  // Face inward toward origin
  const rotationY = angleRad + Math.PI;

  // Compute prerequisite text for the doorway LED marquee
  const isRecursion = id === 'recursion_lab';
  const reasonText = wingInfo?.reason || 'Requires Prerequisite Mastery';
  const reqText = isRecursion
    ? 'Req: Stack >= 70%'
    : wingInfo?.reason
    ? reasonText.split('|')[0]?.trim() || 'Prerequisite Met'
    : 'Prerequisite Met';

  const currText = isRecursion
    ? isSealed
      ? `Current: ${Math.round((learner?.mastery_map.stack ?? 0.38) * 100)}%`
      : `Current: ${Math.round((learner?.mastery_map.stack ?? 0.84) * 100)}%`
    : wingInfo?.reason && reasonText.includes('|')
    ? reasonText.split('|')[1]?.trim() || 'Access Granted'
    : 'Access Granted';

  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
      {/* Procedural Prerequisite Doorway, LED Marquee & Honeycomb Forcefield */}
      <PrerequisiteBarrier
        wingId={id}
        wingName={name}
        isSealed={!!isSealed}
        width={4.2}
        height={5.6}
        requiredText={reqText}
        currentText={currText}
      />

      {/* In-World Floating 3D Holographic Diagnostic Plaque for In-Depth Telemetry */}
      <DiagnosticPlaque
        wingInfo={wingInfo}
        isSealed={!!isSealed}
        position={[0, 2.7, 2.0]}
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
    <group name="ClassroomLabDoorways">
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
