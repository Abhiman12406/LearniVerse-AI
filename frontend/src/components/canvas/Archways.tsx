import React from 'react';
import { useClassroomStore } from '../../store/useClassroomStore';
import { PrerequisiteBarrier } from './PrerequisiteBarrier';
import { DiagnosticPlaque } from './DiagnosticPlaque';

interface ArchwayProps {
  id: string;
  name: string;
  position: [number, number, number];
  rotationY: number;
}

const ArchwayPortal: React.FC<ArchwayProps> = ({ id, name, position, rotationY }) => {
  const worldState = useClassroomStore((s) => s.worldState);
  const learner = useClassroomStore((s) => s.learner);
  const wingInfo = worldState?.wings[id];
  const isSealed = wingInfo?.status === 'sealed';

  const [x, y, z] = position;

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
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
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
        position={[0, 2.7, 1.6]}
      />
    </group>
  );
};

export const Archways: React.FC = () => {
  const doorways: ArchwayProps[] = [
    { id: 'array_station', name: 'Array Station', position: [-6.0, 0, 0], rotationY: Math.PI / 2 },
    { id: 'linked_list_lab', name: 'Linked List Lab', position: [6.0, 0, 0], rotationY: -Math.PI / 2 },
    { id: 'recursion_lab', name: 'Recursion Lab', position: [0, 0, -6.0], rotationY: 0 },
    { id: 'stack_lab', name: 'Stack Lab', position: [0, 0, 6.0], rotationY: Math.PI },
  ];

  return (
    <group name="ClassroomLabDoorways">
      {doorways.map((d) => (
        <ArchwayPortal
          key={d.id}
          id={d.id}
          name={d.name}
          position={d.position}
          rotationY={d.rotationY}
        />
      ))}
    </group>
  );
};
