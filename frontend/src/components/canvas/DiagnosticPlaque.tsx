import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { WingInfo } from '../../types/world';

interface DiagnosticPlaqueProps {
  wingInfo?: WingInfo;
  isSealed: boolean;
  position?: [number, number, number];
}

export const DiagnosticPlaque: React.FC<DiagnosticPlaqueProps> = ({
  wingInfo,
  isSealed,
  position = [0, 2.6, 1.8],
}) => {
  const plaqueGroupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef<number>(isSealed ? 1.0 : 0.0);

  // Derive concept details
  const wingName = wingInfo?.name || 'Sector Entrance';
  const reasonText = wingInfo?.reason || 'Requires Prerequisite Mastery';

  // Parse required threshold & current values from reason or fallback
  const isRecursion = wingInfo?.wing_id === 'recursion_lab';
  const reqText = isRecursion ? 'REQUIRES: STACK MASTERY ≥ 70%' : reasonText.split('|')[0] || 'PREREQUISITE REQUIRED';
  const currentText = isRecursion
    ? (isSealed ? 'CURRENT MASTERY: 38% (GAP DETECTED)' : 'CURRENT MASTERY: 84% (VERIFIED)')
    : reasonText.split('|')[1] || '';
  const directiveText = isSealed
    ? 'ACTION: Remediate in Stack Lab'
    : 'ACTION: Walk through to enter';

  const themeColor = isSealed ? '#ff0055' : '#00ff88';
  const accentGlow = isSealed ? '#ff1744' : '#00e676';

  useFrame((_, delta) => {
    // When sealed, plaque is fully visible (1.0). When accessible, gently fade to 0.15 so entrance is clear
    const targetOpacity = isSealed ? 1.0 : 0.2;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, delta * 3.5);

    if (plaqueGroupRef.current) {
      plaqueGroupRef.current.visible = opacityRef.current > 0.05;
    }
  });

  return (
    <group ref={plaqueGroupRef} position={position}>
      <Float speed={2.0} rotationIntensity={0.05} floatIntensity={0.12}>
        {/* Main Holographic Plaque Backplate */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.6, 2.0, 0.03]} />
          <meshStandardMaterial
            color="#070913"
            roughness={0.2}
            metalness={0.9}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Emissive Holographic Border Frame */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[3.64, 2.04, 0.01]} />
          <meshBasicMaterial
            color={themeColor}
            wireframe
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Top Header Alert Bar */}
        <mesh position={[0, 0.85, 0.025]}>
          <planeGeometry args={[3.4, 0.18]} />
          <meshBasicMaterial color={themeColor} transparent opacity={0.3} />
        </mesh>

        {/* Alert Category Label */}
        <Text
          position={[0, 0.85, 0.03]}
          fontSize={0.11}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          {isSealed ? '/// PREREQUISITE GATE SEALED ///' : '>>> ACCESS GRANTED: PREREQUISITES VERIFIED <<<'}
        </Text>

        {/* Wing Title */}
        <Text
          position={[0, 0.52, 0.03]}
          fontSize={0.24}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
        >
          {wingName.toUpperCase()}
        </Text>

        {/* Divider line */}
        <mesh position={[0, 0.34, 0.025]}>
          <planeGeometry args={[3.1, 0.015]} />
          <meshBasicMaterial color={themeColor} transparent opacity={0.6} />
        </mesh>

        {/* Requirement line */}
        <Text
          position={[0, 0.14, 0.03]}
          fontSize={0.14}
          color={isSealed ? '#ff99aa' : '#a7f3d0'}
          anchorX="center"
          anchorY="middle"
        >
          {reqText}
        </Text>

        {/* Current status line */}
        <Text
          position={[0, -0.14, 0.03]}
          fontSize={0.13}
          color={isSealed ? '#ff0055' : '#00ff88'}
          anchorX="center"
          anchorY="middle"
          fontWeight={600}
        >
          {currentText}
        </Text>

        {/* Action Directive Banner */}
        <mesh position={[0, -0.56, 0.025]}>
          <planeGeometry args={[3.2, 0.32]} />
          <meshStandardMaterial
            color={isSealed ? '#2a0a14' : '#072418'}
            roughness={0.4}
            metalness={0.8}
          />
        </mesh>
        <Text
          position={[0, -0.56, 0.035]}
          fontSize={0.12}
          color={isSealed ? '#00f0ff' : '#6ee7b7'}
          anchorX="center"
          anchorY="middle"
          fontWeight={500}
        >
          {directiveText}
        </Text>

        {/* Corner Neon Bracket Accents */}
        {/* Top-Left */}
        <mesh position={[-1.75, 0.95, 0.03]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color={accentGlow} />
        </mesh>
        {/* Top-Right */}
        <mesh position={[1.75, 0.95, 0.03]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color={accentGlow} />
        </mesh>
        {/* Bottom-Left */}
        <mesh position={[-1.75, -0.95, 0.03]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color={accentGlow} />
        </mesh>
        {/* Bottom-Right */}
        <mesh position={[1.75, -0.95, 0.03]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color={accentGlow} />
        </mesh>

        {/* Plaque Ambient Glow */}
        <pointLight
          position={[0, 0, 0.5]}
          color={themeColor}
          intensity={0.8}
          distance={2.5}
        />
      </Float>
    </group>
  );
};
