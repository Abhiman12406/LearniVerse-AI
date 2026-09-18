import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { WingInfo } from '../../types/world';
import { getDiagnosticPlaqueMaterial } from '../../assets/3d/classroomSingletons';

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

  const plaqueMat = useMemo(
    () => getDiagnosticPlaqueMaterial(wingName, isSealed, reqText, currentText, directiveText),
    [wingName, isSealed, reqText, currentText, directiveText]
  );

  useFrame((_, delta) => {
    // When sealed, plaque is fully visible (1.0). When accessible, gently fade to 0.2
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

        {/* Front Diagnostic Plaque Canvas Surface */}
        <mesh position={[0, 0, 0.026]}>
          <planeGeometry args={[3.55, 1.95]} />
          <primitive object={plaqueMat} attach="material" />
        </mesh>

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

