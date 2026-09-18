import React, { useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { RecursionChamber } from './RecursionChamber';
import { useClassroomStore } from '../../store/useClassroomStore';
import {
  getClassroomMaterials,
  getDoorPortalSignMaterial,
  getDoorPortalGlowMaterial,
  getScreenDisplayMaterial,
  getFloatingBadgeMaterial,
} from '../../assets/3d/classroomSingletons';

export const RecursionLabWing: React.FC = () => {
  const avatar = useClassroomStore((s) => s.avatar);
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);

  const [isNear, setIsNear] = useState(false);

  // Position of Recursion Lab Wing Chamber (North Wing at X = 0, Z = -20.0)
  const wingPos: [number, number, number] = [0.0, 0.0, -20.0];
  const consolePos: [number, number, number] = [0.0, 0.0, -20.0];

  // Retrieve cached singleton materials
  const materials = useMemo(() => getClassroomMaterials(), []);

  // Proximity detection
  useFrame(() => {
    const [ax, , az] = avatar.position;
    const dist = Math.hypot(ax - consolePos[0], az - consolePos[2]);
    const near = dist <= 4.4;
    if (near !== isNear) {
      setIsNear(near);
    }
  });

  // Handle [E] to engage console and [ESC] to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'KeyE' && isNear && !activeStation) {
        setActiveStation('recursion_lab');
      } else if (e.code === 'Escape' && activeStation === 'recursion_lab') {
        setActiveStation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, activeStation, setActiveStation]);

  // Terminal screen materials
  const screenMat1 = useMemo(
    () =>
      getScreenDisplayMaterial('recursion_call_stack', [
        '// Factorial Call Stack Execution Engine',
        'int fact(int n) {',
        '  if (n <= 1) return 1; // Base Case',
        '  return n * fact(n - 1); // Recursive Step',
        '}',
        'status: UNWINDING // product: 6',
      ]),
    []
  );

  const screenMat2 = useMemo(
    () =>
      getScreenDisplayMaterial('activation_records', [
        '// CPU Stack Activation Record Engine',
        'struct Frame { int n; void* ret_addr; };',
        'push: [f(3)] -> [f(2)] -> [f(1)]',
        'pop:  [f(1)] resolves -> [f(2)] resumes',
        'LIFO guarantee: reverse unwind',
      ]),
    []
  );

  const portalSignMat = useMemo(
    () => getDoorPortalSignMaterial('RECURSION CHAMBER // CALL STACK', '#8b5cf6'),
    []
  );
  const portalGlowMat = useMemo(() => getDoorPortalGlowMaterial('#8b5cf6'), []);
  const promptMat = useMemo(
    () =>
      getFloatingBadgeMaterial(
        '[E] ACCESS CONSOLE',
        'Recursion Call Stack Elevator',
        '#c084fc'
      ),
    []
  );

  return (
    <group position={wingPos}>
      {/* --- 1. 14x14m ROOM FLOORING (Matching Campus Wood Planks) --- */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[14.0, 0.4, 14.0]} />
        <primitive object={materials.floorWood} attach="material" />
      </mesh>

      {/* Cybernetic Accent Inlay on Floor (Violet / Cyan Call Stack rings) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.2, 5.4, 32]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.32, 32]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* --- 2. 14x14m ENCLOSED PERIMETER WALLS (High-Ceiling: 6.8m, Thickness: 0.35m) --- */}
      {/* North Exterior Wall (Z = -7.0, spanning X: -7.0 to +7.0) */}
      <mesh position={[0, 3.4, -7.0]} receiveShadow>
        <boxGeometry args={[14.0, 6.8, 0.35]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>

      {/* West Exterior Wall (X = -7.0, spanning Z: -7.0 to +7.0) */}
      <mesh position={[-7.0, 3.4, 0]} receiveShadow>
        <boxGeometry args={[0.35, 6.8, 14.0]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* East Exterior Wall (X = +7.0, spanning Z: -7.0 to +7.0) */}
      <mesh position={[7.0, 3.4, 0]} receiveShadow>
        <boxGeometry args={[0.35, 6.8, 14.0]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* South Wall: Facing the North Corridor entrance with 3.8m doorway opening */}
      {/* South Wall West Segment (center X = -4.45, width = 5.1m, Z = +7.0) */}
      <mesh position={[-4.45, 3.4, 7.0]} receiveShadow>
        <boxGeometry args={[5.1, 6.8, 0.35]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>
      {/* South Wall East Segment (center X = +4.45, width = 5.1m, Z = +7.0) */}
      <mesh position={[4.45, 3.4, 7.0]} receiveShadow>
        <boxGeometry args={[5.1, 6.8, 0.35]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>
      {/* South Doorway Lintel across entrance (width 3.8m, height 2.2m, sits at top Y = 5.7) */}
      <mesh position={[0, 5.7, 7.0]} receiveShadow>
        <boxGeometry args={[3.8, 2.2, 0.35]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>

      {/* --- 3. CORRIDOR ENTRANCE PORTAL SIGNBOARD --- */}
      <group position={[0, 4.2, 6.8]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[4.2, 0.9]} />
          <primitive object={portalGlowMat} attach="material" />
        </mesh>
        <mesh>
          <planeGeometry args={[4.0, 0.75]} />
          <primitive object={portalSignMat} attach="material" />
        </mesh>
      </group>

      {/* --- 4. THEMATIC LIGHTING --- */}
      <pointLight position={[0, 5.5, 0]} color="#a855f7" intensity={2.4} distance={12.0} />
      <pointLight position={[-4.5, 3.5, 4.0]} color="#00f0ff" intensity={1.3} distance={8.0} />
      <pointLight position={[4.5, 3.5, -4.0]} color="#c084fc" intensity={1.3} distance={8.0} />

      {/* Ceiling Fluorescent Panel Light Fixtures */}
      <mesh position={[-2.8, 6.6, -2.5]}>
        <boxGeometry args={[2.4, 0.1, 0.6]} />
        <primitive object={materials.lightFixture} attach="material" />
      </mesh>
      <mesh position={[2.8, 6.6, 2.5]}>
        <boxGeometry args={[2.4, 0.1, 0.6]} />
        <primitive object={materials.lightFixture} attach="material" />
      </mesh>

      {/* --- 5. RESEARCH BENCHES & DIAGNOSTIC SCREEN MONITORS --- */}
      {/* West Wall Research Desk */}
      <group position={[-5.8, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.9, 1.1]} />
          <primitive object={materials.woodLight} attach="material" />
        </mesh>
        <group position={[-1.2, 0.9, -0.1]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.2, 0.75, 0.08]} />
            <primitive object={materials.metalBlack} attach="material" />
          </mesh>
          <mesh position={[0, 0.4, 0.045]}>
            <planeGeometry args={[1.14, 0.69]} />
            <primitive object={screenMat1} attach="material" />
          </mesh>
        </group>
        <group position={[1.2, 0.9, -0.1]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.2, 0.75, 0.08]} />
            <primitive object={materials.metalBlack} attach="material" />
          </mesh>
          <mesh position={[0, 0.4, 0.045]}>
            <planeGeometry args={[1.14, 0.69]} />
            <primitive object={screenMat2} attach="material" />
          </mesh>
        </group>
      </group>

      {/* East Wall Research Desk */}
      <group position={[5.8, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.9, 1.1]} />
          <primitive object={materials.woodLight} attach="material" />
        </mesh>
        <group position={[0, 0.9, -0.1]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.6, 0.85, 0.08]} />
            <primitive object={materials.metalBlack} attach="material" />
          </mesh>
          <mesh position={[0, 0.4, 0.045]}>
            <planeGeometry args={[1.54, 0.79]} />
            <primitive object={screenMat1} attach="material" />
          </mesh>
        </group>
      </group>

      {/* --- 6. ELEVATED APPARATUS TABLE & 3D CALL-STACK ELEVATOR --- */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.0, 2.2, 0.8, 16]} />
          <meshStandardMaterial color="#131127" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.81, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.75, 1.95, 16]} />
          <meshBasicMaterial color="#8b5cf6" />
        </mesh>

        {/* 3D Kinetic Recursion Call-Stack Elevator Apparatus */}
        <group position={[0, 0.8, 0]}>
          <RecursionChamber />
        </group>

        {/* Floating Proximity Interaction Prompt */}
        {isNear && !activeStation && (
          <Float speed={2.5} rotationIntensity={0.02} floatIntensity={0.15}>
            <group position={[0, 4.4, 0.8]}>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[3.2, 0.72]} />
                <primitive object={promptMat} attach="material" />
              </mesh>
            </group>
          </Float>
        )}
      </group>
    </group>
  );
};

