import React, { useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { StackApparatus } from './StackApparatus';
import { useClassroomStore } from '../../store/useClassroomStore';
import {
  getClassroomMaterials,
  getScreenDisplayMaterial,
  getDoorPortalSignMaterial,
  getDoorPortalGlowMaterial,
} from '../../assets/3d/classroomSingletons';

export const StackLabWing: React.FC = () => {
  const avatar = useClassroomStore((s) => s.avatar);
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);

  const [isNear, setIsNear] = useState(false);

  // Position of Stack Lab Wing (South Wing at X = 0.0, Z = 20.0)
  const wingPos: [number, number, number] = [0.0, 0.0, 20.0];
  const consolePos: [number, number, number] = [0.0, 0.0, 20.0];

  const materials = useMemo(() => getClassroomMaterials(), []);

  // Proximity detection to central apparatus
  useFrame(() => {
    const [ax, , az] = avatar.position;
    const dist = Math.hypot(ax - consolePos[0], az - consolePos[2]);
    const near = dist <= 4.2;
    if (near !== isNear) {
      setIsNear(near);
    }
  });

  // Handle [E] to engage console and [ESC] to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'KeyE' && isNear && !activeStation) {
        setActiveStation('stack_lab');
      } else if (e.code === 'Escape' && activeStation === 'stack_lab') {
        setActiveStation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, activeStation, setActiveStation]);

  // Terminal screen materials
  const screenMat1 = useMemo(
    () =>
      getScreenDisplayMaterial('stack_lifo_engine', [
        '// LIFO Stack Engine: Last-In, First-Out',
        'void push(T val) { stack[++top] = val; }',
        'T pop() { if(top < 0) underflow(); return stack[top--]; }',
        'T peek() { return stack[top]; }',
        'Top of Stack Pointer: Disc [3]',
      ]),
    []
  );

  const screenMat2 = useMemo(
    () =>
      getScreenDisplayMaterial('stack_applications', [
        '// Real-World Stack Applications',
        '1. Balanced Parentheses: O(n) verify',
        '2. Call Stack & Recursion Activation',
        '3. Undo / Redo History Buffers',
        '4. Depth-First Graph Search (DFS)',
        'Stack Depth: 4 / 6 discs',
      ]),
    []
  );

  const portalSignMat = useMemo(
    () => getDoorPortalSignMaterial('STACK LAB // LIFO ENGINE', '#f59e0b'),
    []
  );
  const portalGlowMat = useMemo(() => getDoorPortalGlowMaterial('#f59e0b'), []);

  return (
    <group position={wingPos}>
      {/* --- 1. ROOM FLOORING (Warm Planks with Amber Cybernetic Inlay) --- */}
      {/* 9.6m wide (X in [-4.8, 4.8]), 13.5m deep (Z in [-7.0, 6.5], centered at Z = -0.25) */}
      <mesh position={[0, -0.2, -0.25]} receiveShadow>
        <boxGeometry args={[9.6, 0.4, 13.5]} />
        <primitive object={materials.floorWood} attach="material" />
      </mesh>

      {/* Cybernetic Accent Inlay on Floor (Amber / Cyan rings around pedestal) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 4.0, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.62, 32]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* --- 2. ENCLOSED PERIMETER WALLS (Height: 5.6m, Thickness: 0.35m) --- */}
      {/* South Exterior Wall (local Z = 6.5, spanning X: -4.8 to +4.8) */}
      <mesh position={[0, 2.8, 6.5]} receiveShadow>
        <boxGeometry args={[9.6, 5.6, 0.35]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>

      {/* West Exterior Wall (local X = -4.8, spanning Z: -7.0 to +6.5) */}
      <mesh position={[-4.8, 2.8, -0.25]} receiveShadow>
        <boxGeometry args={[0.35, 5.6, 13.5]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* East Dividing Wall (local X = +4.8, cleanly abutting Tree Lab at X = 5.0) */}
      <mesh position={[4.8, 2.8, -0.25]} receiveShadow>
        <boxGeometry args={[0.35, 5.6, 13.5]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* North Wall: Facing South Corridor entrance with 3.8m doorway opening at X in [-1.9, 1.9] */}
      {/* North Wall West Segment (center X = -3.35, width = 2.9m, Z = -7.0) */}
      <mesh position={[-3.35, 2.8, -7.0]} receiveShadow>
        <boxGeometry args={[2.9, 5.6, 0.35]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>
      {/* North Wall East Segment (center X = +3.35, width = 2.9m, Z = -7.0) */}
      <mesh position={[3.35, 2.8, -7.0]} receiveShadow>
        <boxGeometry args={[2.9, 5.6, 0.35]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>
      {/* North Doorway Lintel across entrance (width 3.8m, height 1.8m, sits at top Y = 4.7) */}
      <mesh position={[0, 4.7, -7.0]} receiveShadow>
        <boxGeometry args={[3.8, 1.8, 0.35]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>

      {/* --- 3. CORRIDOR ENTRANCE PORTAL SIGNBOARD --- */}
      <group position={[0, 4.2, -6.8]}>
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[3.6, 0.75, 0.1]} />
          <primitive object={materials.woodDark} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[3.4, 0.6]} />
          <primitive object={portalSignMat} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <ringGeometry args={[0.32, 0.34, 16]} />
          <primitive object={portalGlowMat} attach="material" />
        </mesh>
      </group>

      {/* --- 4. THEMATIC LIGHTING --- */}
      <pointLight position={[0, 4.8, 0]} color="#f59e0b" intensity={2.2} distance={12.0} />
      <pointLight position={[-3.2, 3.2, 2.5]} color="#00f0ff" intensity={1.2} distance={7.0} />
      <pointLight position={[3.2, 3.2, -2.5]} color="#f59e0b" intensity={1.2} distance={7.0} />

      {/* Ceiling Fluorescent Panel Light Fixtures */}
      <mesh position={[-2.2, 5.5, -2.0]}>
        <boxGeometry args={[2.2, 0.1, 0.6]} />
        <primitive object={materials.lightFixture} attach="material" />
      </mesh>
      <mesh position={[2.2, 5.5, 2.0]}>
        <boxGeometry args={[2.2, 0.1, 0.6]} />
        <primitive object={materials.lightFixture} attach="material" />
      </mesh>

      {/* --- 5. RESEARCH BENCHES & DIAGNOSTIC SCREEN MONITORS --- */}
      {/* West Wall Tech Desk */}
      <group position={[-3.9, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.0, 0.9, 1.0]} />
          <primitive object={materials.woodMedium} attach="material" />
        </mesh>
        {/* Terminal Stand & Screen */}
        <group position={[-0.8, 0.9, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.08]} />
            <primitive object={materials.metalBlack} attach="material" />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[1.4, 0.7, 0.06]} />
            <primitive object={materials.metalBlack} attach="material" />
          </mesh>
          <mesh position={[0, 0.55, 0.035]}>
            <planeGeometry args={[1.34, 0.64]} />
            <primitive object={screenMat1} attach="material" />
          </mesh>
        </group>
      </group>

      {/* East Wall Tech Desk */}
      <group position={[3.9, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.0, 0.9, 1.0]} />
          <primitive object={materials.woodMedium} attach="material" />
        </mesh>
        {/* Terminal Stand & Screen */}
        <group position={[0.8, 0.9, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.08]} />
            <primitive object={materials.metalBlack} attach="material" />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[1.4, 0.7, 0.06]} />
            <primitive object={materials.metalBlack} attach="material" />
          </mesh>
          <mesh position={[0, 0.55, 0.035]}>
            <planeGeometry args={[1.34, 0.64]} />
            <primitive object={screenMat2} attach="material" />
          </mesh>
        </group>
      </group>

      {/* --- 6. CENTRAL DAIS & 3D KINETIC STACK APPARATUS --- */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.6, 1.8, 0.8, 8]} />
          <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.81, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.4, 1.55, 8]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>

        {/* 3D Kinetic Stack Apparatus mounted on table */}
        <group position={[0, 0.8, 0]}>
          <StackApparatus />
        </group>

        {/* Floating Proximity Interaction Prompt */}
        {isNear && !activeStation && (
          <Float speed={2.5} rotationIntensity={0.02} floatIntensity={0.15}>
            <group position={[0, 4.2, 0.6]}>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[3.2, 0.65]} />
                <meshStandardMaterial color="#0f172a" transparent opacity={0.88} />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[3.24, 0.69]} />
                <meshBasicMaterial color="#f59e0b" wireframe />
              </mesh>
              <Text
                position={[0, 0.02, 0.02]}
                fontSize={0.2}
                color="#f59e0b"
                anchorX="center"
                anchorY="middle"
                fontWeight={700}
                letterSpacing={0.05}
              >
                [E] OPERATE STACK TOWER
              </Text>
            </group>
          </Float>
        )}
      </group>
    </group>
  );
};
