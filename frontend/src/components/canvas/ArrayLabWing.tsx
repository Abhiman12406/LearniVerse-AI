import React, { useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { ArrayStation } from './ArrayStation';
import { useClassroomStore } from '../../store/useClassroomStore';
import {
  getClassroomMaterials,
  getDoorPortalSignMaterial,
  getDoorPortalGlowMaterial,
  getScreenDisplayMaterial,
  getFloatingBadgeMaterial,
} from '../../assets/3d/classroomSingletons';

export const ArrayLabWing: React.FC = () => {
  const avatar = useClassroomStore((s) => s.avatar);
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);

  const [isNear, setIsNear] = useState(false);

  // Position of Array Station Wing Chamber (West Wing at X = -20.0, Z = 0)
  const wingPos: [number, number, number] = [-20.0, 0.0, 0.0];
  const consolePos: [number, number, number] = [-20.0, 0.0, 0.0];

  // Retrieve cached singleton materials
  const materials = useMemo(() => getClassroomMaterials(), []);

  // Proximity detection to apparatus table
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
        setActiveStation('array_station');
      } else if (e.code === 'Escape' && activeStation === 'array_station') {
        setActiveStation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, activeStation, setActiveStation]);

  // Terminal screen materials
  const screenMat1 = useMemo(
    () =>
      getScreenDisplayMaterial('array_bus_controller', [
        '// Contiguous RAM Bus Controller',
        '#define BASE_ADDR  0x2000',
        'int target = 3;',
        'void* ptr = (void*)(BASE_ADDR + (target * 4));',
        'int val = *ptr; // O(1) Constant Time',
        'status: BUS_STABLE // latency: 1 clock cycle',
      ]),
    []
  );

  const screenMat2 = useMemo(
    () =>
      getScreenDisplayMaterial('linear_search_trace', [
        '// Sequential Linear Search Scan',
        'for (int i = 0; i < N; i++) {',
        '  compare(RAM[i], searchTarget);',
        '  if (matched) break;',
        '}',
        'worst_case: O(n) // sequential scans',
      ]),
    []
  );

  const portalSignMat = useMemo(
    () => getDoorPortalSignMaterial('ARRAY STATION // MEMORY BUS', '#0284c7'),
    []
  );
  const portalGlowMat = useMemo(() => getDoorPortalGlowMaterial('#0284c7'), []);
  const featureSignMat = useMemo(
    () =>
      getFloatingBadgeMaterial(
        'ARRAY STATION // MEMORY BUS LAB',
        'Contiguous Memory Bays // Addr = Base + (Index * 4)',
        '#38bdf8'
      ),
    []
  );
  const promptMat = useMemo(
    () =>
      getFloatingBadgeMaterial(
        '[E] Operate Station',
        'Memory Index Rack // O(1) Access',
        '#38bdf8'
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

      {/* Cybernetic Accent Inlay on Floor (Emerald & Cyan Array Bus lines) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.2, 5.4, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.32, 32]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* --- 2. 14x14m ENCLOSED PERIMETER WALLS (Height: 5.6m, Thickness: 0.35m) --- */}
      {/* West Exterior Wall (X = -7.0, spanning Z: -7.0 to +7.0) */}
      <mesh position={[-7.0, 2.8, 0]} receiveShadow>
        <boxGeometry args={[0.35, 5.6, 14.0]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>

      {/* North Exterior Wall (Z = -7.0, spanning X: -7.0 to +7.0) */}
      <mesh position={[0, 2.8, -7.0]} receiveShadow>
        <boxGeometry args={[14.0, 5.6, 0.35]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* South Diorama Knee-Wall (Z = +7.0, height: 0.85m for third-person camera clearance) */}
      <mesh position={[0, 0.425, 7.0]} receiveShadow>
        <boxGeometry args={[14.0, 0.85, 0.35]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>
      <mesh position={[0, 0.89, 7.0]}>
        <boxGeometry args={[14.1, 0.08, 0.42]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>

      {/* East Entrance Wall (X = +7.0, facing West corridor at X = -13.0) */}
      {/* North Segment: Z from -7.0 to -1.9 (center Z = -4.45, length = 5.1) */}
      <mesh position={[7.0, 2.8, -4.45]} receiveShadow>
        <boxGeometry args={[0.35, 5.6, 5.1]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* South Segment: Z from +1.9 to +7.0 (center Z = +4.45, length = 5.1) */}
      <mesh position={[7.0, 2.8, 4.45]} receiveShadow>
        <boxGeometry args={[0.35, 5.6, 5.1]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* Doorway Header Lintel (X = 7.0, Y = 4.6, spanning Z: -2.1 to +2.1, height = 2.0) */}
      <mesh position={[7.0, 4.6, 0]} receiveShadow>
        <boxGeometry args={[0.38, 2.0, 4.2]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>

      {/* Doorway Frame Pillars */}
      <mesh position={[7.0, 1.8, -2.0]}>
        <boxGeometry args={[0.42, 3.6, 0.42]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>
      <mesh position={[7.0, 1.8, 2.0]}>
        <boxGeometry args={[0.42, 3.6, 0.42]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>

      {/* Doorway Header Sign Plate (Facing East toward corridor) */}
      <group position={[7.15, 4.0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.2, 0.65, 0.1]} />
          <primitive object={materials.metalBlack} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[3.05, 0.55]} />
          <primitive object={portalSignMat} attach="material" />
        </mesh>
      </group>

      {/* Doorway Threshold Glow */}
      <mesh position={[7.0, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[3.8, 0.25]} />
        <primitive object={portalGlowMat} attach="material" />
      </mesh>

      {/* --- 3. BRANDED INTERIOR PLAQUES & SIGNAGE --- */}
      {/* Main West Feature Plaque (Facing East into the room) */}
      <group position={[-6.8, 3.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[6.2, 1.2]} />
          <primitive object={featureSignMat} attach="material" />
        </mesh>
      </group>

      {/* --- 4. RESEARCH DESKS & WORKSTATIONS --- */}
      {/* North Research Desk (Z = -5.8, X = 0) */}
      <group position={[0, 0, -5.8]}>
        <mesh position={[0, 0.42, 0]} receiveShadow>
          <boxGeometry args={[4.2, 0.84, 1.2]} />
          <primitive object={materials.woodLight} attach="material" />
        </mesh>
        {/* Desk Trim */}
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[4.24, 0.04, 1.24]} />
          <primitive object={materials.woodDark} attach="material" />
        </mesh>
        {/* Terminal Monitor 1 */}
        <mesh position={[-1.0, 1.28, -0.2]}>
          <boxGeometry args={[1.2, 0.75, 0.08]} />
          <primitive object={materials.metalBlack} attach="material" />
        </mesh>
        <mesh position={[-1.0, 1.28, -0.155]}>
          <planeGeometry args={[1.12, 0.68]} />
          <primitive object={screenMat1} attach="material" />
        </mesh>
        {/* Terminal Monitor 2 */}
        <mesh position={[1.0, 1.28, -0.2]}>
          <boxGeometry args={[1.2, 0.75, 0.08]} />
          <primitive object={materials.metalBlack} attach="material" />
        </mesh>
        <mesh position={[1.0, 1.28, -0.155]}>
          <planeGeometry args={[1.12, 0.68]} />
          <primitive object={screenMat2} attach="material" />
        </mesh>
        {/* Keyboards */}
        <mesh position={[-1.0, 0.88, 0.2]}>
          <boxGeometry args={[0.55, 0.02, 0.22]} />
          <primitive object={materials.metalBlack} attach="material" />
        </mesh>
        <mesh position={[1.0, 0.88, 0.2]}>
          <boxGeometry args={[0.55, 0.02, 0.22]} />
          <primitive object={materials.metalBlack} attach="material" />
        </mesh>
      </group>

      {/* South Research Desk (Z = +5.8, X = 0) */}
      <group position={[0, 0, 5.8]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.42, 0]} receiveShadow>
          <boxGeometry args={[4.2, 0.84, 1.2]} />
          <primitive object={materials.woodLight} attach="material" />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[4.24, 0.04, 1.24]} />
          <primitive object={materials.woodDark} attach="material" />
        </mesh>
        {/* Terminal Monitor */}
        <mesh position={[0, 1.28, -0.2]}>
          <boxGeometry args={[1.4, 0.85, 0.08]} />
          <primitive object={materials.metalBlack} attach="material" />
        </mesh>
        <mesh position={[0, 1.28, -0.155]}>
          <planeGeometry args={[1.32, 0.78]} />
          <primitive object={screenMat1} attach="material" />
        </mesh>
        <mesh position={[0, 0.88, 0.2]}>
          <boxGeometry args={[0.65, 0.02, 0.22]} />
          <primitive object={materials.metalBlack} attach="material" />
        </mesh>
      </group>

      {/* --- 5. THEMATIC ATMOSPHERIC LIGHTING --- */}
      <pointLight position={[0, 4.6, 0]} color="#10b981" intensity={2.2} distance={14.0} />
      <pointLight position={[-4.5, 3.2, -3.5]} color="#00f0ff" intensity={1.4} distance={8.0} />
      <pointLight position={[4.5, 3.2, 3.5]} color="#38bdf8" intensity={1.4} distance={8.0} />

      {/* --- 6. ELEVATED CENTRAL APPARATUS TABLE & APPARATUS --- */}
      <group position={[0, 0, 0]}>
        {/* Main Apparatus Platform Table */}
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.8, 0.76, 2.2]} />
          <primitive object={materials.metalBlack} attach="material" />
        </mesh>
        <mesh position={[0, 0.77, 0]}>
          <boxGeometry args={[3.84, 0.03, 2.24]} />
          <meshStandardMaterial color="#0284c7" roughness={0.25} metalness={0.85} />
        </mesh>

        {/* 3D Kinetic Array Station mounted on table */}
        <group position={[0, 0.78, 0]}>
          <ArrayStation />
        </group>

        {/* Floating Proximity Interaction Prompt */}
        {isNear && !activeStation && (
          <Float speed={2.5} rotationIntensity={0.03} floatIntensity={0.25}>
            <group position={[0, 2.8, 0.8]}>
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
