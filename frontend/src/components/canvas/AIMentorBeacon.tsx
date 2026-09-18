import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';
import {
  createMentorCompanionModel,
  MentorCompanionModelRig,
} from '../../assets/3d/createMentorCompanionModel';
import { soundSystem } from '../../audio/soundSystem';

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

  return (
    <group position={position}>
      {/* Procedural 3D Mentor Companion Model */}
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
        <Text
          fontSize={0.13}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          AI MENTOR BOT
        </Text>
        <Text
          position={[0, -0.13, 0]}
          fontSize={0.085}
          color={beaconColor}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
        >
          SOCRATIC COMPANION
        </Text>
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
              {/* Pill Backplate */}
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[2.0, 0.42]} />
                <meshBasicMaterial color="#0c1020" transparent opacity={0.88} />
              </mesh>
              {/* Glowing Outline */}
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2.04, 0.46]} />
                <meshBasicMaterial color={beaconColor} wireframe transparent opacity={0.8} />
              </mesh>
              <Text
                fontSize={0.13}
                color={beaconColor}
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
