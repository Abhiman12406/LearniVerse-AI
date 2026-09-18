import React, { useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useClassroomStore } from '../../store/useClassroomStore';
import {
  createPrerequisiteDoorModel,
  PrerequisiteDoorModel,
} from '../../assets/3d/createPrerequisiteDoorModel';

export interface PrerequisiteBarrierProps {
  wingId?: string;
  wingName?: string;
  isSealed: boolean;
  width?: number;
  height?: number;
  requiredText?: string;
  currentText?: string;
}

export const PrerequisiteBarrier: React.FC<PrerequisiteBarrierProps> = ({
  wingId = 'recursion_lab',
  wingName = 'Recursion Lab',
  isSealed,
  width = 4.2,
  height = 5.6,
  requiredText,
  currentText,
}) => {
  const dissolvingWingId = useClassroomStore((s) => s.dissolvingWingId);
  const dissolvePhase = useClassroomStore((s) => s.dissolvePhase);
  const learner = useClassroomStore((s) => s.learner);
  const worldState = useClassroomStore((s) => s.worldState);

  const isThisDissolving = dissolvingWingId === wingId;

  // Resolve dynamic prerequisite & mastery text for the digital LED marquee
  const derivedRequiredText = useMemo(() => {
    if (requiredText) return requiredText;
    const wing = worldState?.wings[wingId];
    if (wing?.reason) {
      return wing.reason.split('|')[0]?.trim() || 'Prerequisite Required';
    }
    if (wingId === 'recursion_lab') return 'Req: Stack >= 70%';
    if (wingId === 'tree_lab') return 'Req: Recursion >= 75%';
    return 'Prerequisite Met';
  }, [requiredText, worldState, wingId]);

  const derivedCurrentText = useMemo(() => {
    if (currentText) return currentText;
    const wing = worldState?.wings[wingId];
    if (wing?.reason && wing.reason.includes('|')) {
      return wing.reason.split('|')[1]?.trim() || '';
    }
    if (wingId === 'recursion_lab') {
      const stackMastery = Math.round((learner?.mastery_map.stack ?? 0.38) * 100);
      return `Current: ${stackMastery}%`;
    }
    if (wingId === 'tree_lab') {
      const recMastery = Math.round((learner?.mastery_map.recursion ?? 0.2) * 100);
      return `Current: ${recMastery}%`;
    }
    return 'Access Granted';
  }, [currentText, worldState, wingId, learner]);

  // Create procedural 3D doorway asset
  const doorModel: PrerequisiteDoorModel = useMemo(() => {
    return createPrerequisiteDoorModel({
      wingId,
      wingName,
      isSealed,
      requiredText: derivedRequiredText,
      currentText: derivedCurrentText,
      width,
      height,
    });
  }, [wingId]); // Stable instance per wingId

  // Clean disposal on unmount
  useEffect(() => {
    return () => {
      doorModel.dispose();
    };
  }, [doorModel]);

  // Update LED display status and barrier state when props or mastery change
  useEffect(() => {
    doorModel.updateStatus({
      wingId,
      wingName,
      isSealed,
      requiredText: derivedRequiredText,
      currentText: derivedCurrentText,
    });
  }, [doorModel, wingId, wingName, isSealed, derivedRequiredText, derivedCurrentText]);

  // Frame tick for hexagonal forcefield animation and particle shockwave physics
  useFrame((_, delta) => {
    doorModel.update(delta, dissolvePhase, isThisDissolving);
  });

  return <primitive object={doorModel.group} />;
};
