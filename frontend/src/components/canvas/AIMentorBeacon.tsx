import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';
import {
  createMentorCompanionModel,
  MentorCompanionModelRig,
} from '../../assets/3d/createMentorCompanionModel';
import { soundSystem } from '../../audio/soundSystem';
import { getFloatingBadgeMaterial } from '../../assets/3d/classroomSingletons';

interface AIMentorBeaconProps {
  position?: [number, number, number];
}

export const AIMentorBeacon: React.FC<AIMentorBeaconProps> = ({
  position = [-2.0, 0.98, -3.2],
}) => {
  const promptGroupRef = useRef<THREE.Group>(null);
  const wasNearRef = useRef<boolean>(false);

  const isMentorOpen = useClassroomStore((s) => s.isMentorOpen);
  const isNearMentor = useClassroomStore((s) => s.isNearMentor);
  const openMentor = useClassroomStore((s) => s.openMentor);
  const learner = useClassroomStore((s) => s.learner);

  const isRemedial = learner?.learning_state.status === 'remediation_required';
  const beaconColor = isRemedial ? '#a855f7' : '#00f0ff';

  // Instantiate procedural 3D model rig
  const botRig: MentorCompanionModelRig = useMemo(() => {
    return createMentorCompanionModel({
      initialExpression: isRemedial ? 'remedial' : 'happy',
      isRemedial,
    });
  }, [isRemedial]);

  // Clean up 3D geometries/materials on unmount
  useEffect(() => {
    return () => {
      botRig.dispose();
    };
  }, [botRig]);

  // Update facial expression based on dialogue state
  useEffect(() => {
    if (isMentorOpen) {
      botRig.setExpression('talking');
    } else if (isNearMentor) {
      botRig.setExpression(isRemedial ? 'remedial' : 'curious');
    } else {
      botRig.setExpression(isRemedial ? 'remedial' : 'happy');
    }
  }, [isMentorOpen, isNearMentor, isRemedial, botRig]);

  useFrame((_, delta) => {
    // Proximity check against Avatar position
    const avatarPos = useClassroomStore.getState().avatar.position;
    const [ax, , az] = avatarPos;
    const [bx, , bz] = position;
    const dist = Math.hypot(ax - bx, az - bz);
    const isNear = dist <= 3.2;

    if (isNear !== wasNearRef.current) {
      wasNearRef.current = isNear;
      useClassroomStore.getState().setIsNearMentor(isNear);
      if (isNear) {
        soundSystem.playMentorGreeting();
      }
    }

    // Update procedural bot animation rig
    botRig.update(delta, {
      targetPosition: avatarPos,
      isSpeaking: isMentorOpen,
      isRemedial,
      isNear,
    });

    // Billboarding for interaction prompt: face avatar
    if (promptGroupRef.current) {
      promptGroupRef.current.lookAt(ax, position[1] + 1.6, az);
    }
  });

  const nameTagMat = useMemo(
    () => getFloatingBadgeMaterial('AI MENTOR BOT', 'SOCRATIC COMPANION', beaconColor),
    [beaconColor]
  );
  const promptMat = useMemo(
    () => getFloatingBadgeMaterial('[E] CONSULT AI MENTOR', 'Press E to ask Socratic Guide', beaconColor),
    [beaconColor]
  );

  return (
    <group position={position}>
      {/* Mentor Holographic Floating Beacon Core Rig */}
      <primitive
        object={botRig.group}
        onClick={(e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          soundSystem.playMentorGreeting();
          openMentor();
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      />

      {/* Floating Holographic Name Tag */}
      <group position={[0, 1.35, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.5, 0.46]} />
          <primitive object={nameTagMat} attach="material" />
        </mesh>
      </group>

      {/* Interactive In-World Prompt Billboard when in proximity */}
      {isNearMentor && !isMentorOpen && (
        <group ref={promptGroupRef} position={[0, 1.75, 0]}>
          <Float speed={4.0} rotationIntensity={0} floatIntensity={0.12}>
            <group
              onClick={(e) => {
                e.stopPropagation();
                soundSystem.playMentorGreeting();
                openMentor();
              }}
              onPointerOver={() => {
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default';
              }}
            >
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2.0, 0.55]} />
                <primitive object={promptMat} attach="material" />
              </mesh>
            </group>
          </Float>
        </group>
      )}
    </group>
  );
};
