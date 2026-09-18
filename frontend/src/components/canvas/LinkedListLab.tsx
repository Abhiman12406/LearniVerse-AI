import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';
import {
  createLinkedListModel,
  LinkedListModelRig,
} from '../../assets/3d/createLinkedListModel';
import {
  getClassroomMaterials,
  getDoorPortalSignMaterial,
  getDoorPortalGlowMaterial,
  getScreenDisplayMaterial,
} from '../../assets/3d/classroomSingletons';

export const LinkedListLab: React.FC = () => {
  const avatar = useClassroomStore((s) => s.avatar);
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);

  const linkedListNodes = useClassroomStore((s) => s.linkedListNodes);
  const linkedListActiveNodeId = useClassroomStore((s) => s.linkedListActiveNodeId);
  const linkedListIsTraversing = useClassroomStore((s) => s.linkedListIsTraversing);
  const linkedListIsSevered = useClassroomStore((s) => s.linkedListIsSevered);
  const linkedListSeveredNodeId = useClassroomStore((s) => s.linkedListSeveredNodeId);
  const linkedListNullError = useClassroomStore((s) => s.linkedListNullError);

  const [isNear, setIsNear] = useState(false);
  const sparkParticlesRef = useRef<THREE.Points>(null);

  // Position of Linked List Lab Wing Chamber (East Wing at X = 20.0, Z = 0)
  const wingPos: [number, number, number] = [20.0, 0.0, 0.0];
  const consolePos: [number, number, number] = [20.0, 0.0, 0.0];

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
        setActiveStation('linked_list_lab');
      } else if (e.code === 'Escape' && activeStation === 'linked_list_lab') {
        setActiveStation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, activeStation, setActiveStation]);

  // Initialize procedural 3D Linked List apparatus rig
  const modelRig = useMemo<LinkedListModelRig>(() => {
    return createLinkedListModel({
      initialNodes: linkedListNodes,
      spacing: 1.3,
    });
  }, []);

  // Cleanup WebGL resources on unmount
  useEffect(() => {
    return () => {
      modelRig.dispose();
    };
  }, [modelRig]);

  // Ambient floating particles around apparatus
  const { particlePositions, particleCount } = useMemo(() => {
    const count = 36;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4.2;
      positions[i * 3 + 1] = 0.6 + Math.random() * 1.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }
    return { particlePositions: positions, particleCount: count };
  }, []);

  // Synchronize kinetic simulation with current store state
  useFrame((_, delta) => {
    modelRig.update(delta, {
      nodes: linkedListNodes,
      activeNodeId: linkedListActiveNodeId,
      isTraversing: linkedListIsTraversing,
      isSevered: linkedListIsSevered,
      severedNodeId: linkedListSeveredNodeId,
      hasNullError: !!linkedListNullError,
    });

    // Update ambient floating particles
    if (sparkParticlesRef.current) {
      const geom = sparkParticlesRef.current.geometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        array[i * 3 + 1] += delta * 0.25;
        if (array[i * 3 + 1] > 2.4) {
          array[i * 3 + 1] = 0.6;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  // Terminal screen materials
  const screenMat1 = useMemo(
    () =>
      getScreenDisplayMaterial('ll_heap_manager', [
        '// Dynamic Heap Pointer Allocator',
        'struct Node { int data; Node* next; };',
        'Node* head = (Node*)malloc(sizeof(Node));',
        'head->data = 10; head->next = node2;',
        'status: HEAP_ALLOCATED // addr: 0x4010',
        'null_guard: active // leak_protection: on',
      ]),
    []
  );

  const screenMat2 = useMemo(
    () =>
      getScreenDisplayMaterial('ll_traversal_trace', [
        '// O(n) Pointer Traversal Engine',
        'Node* curr = head;',
        'while (curr != NULL) {',
        '  visit(curr->data);',
        '  curr = curr->next; // advance pointer',
        '}',
        'terminates: NULL pointer reached',
      ]),
    []
  );

  const portalSignMat = useMemo(
    () => getDoorPortalSignMaterial('LINKED LIST LAB // EAST WING', '#f59e0b'),
    []
  );
  const portalGlowMat = useMemo(() => getDoorPortalGlowMaterial('#f59e0b'), []);

  return (
    <group position={wingPos}>
      {/* --- 1. 14x14m ROOM FLOORING (Matching Campus Wood Planks) --- */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[14.0, 0.4, 14.0]} />
        <primitive object={materials.floorWood} attach="material" />
      </mesh>

      {/* Cybernetic Accent Inlays on Floor (Amber & Gold Node Chain motif) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.2, 5.4, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.32, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* --- 2. 14x14m ENCLOSED PERIMETER WALLS (Height: 5.6m, Thickness: 0.35m) --- */}
      {/* East Exterior Wall (X = +7.0, spanning Z: -7.0 to +7.0) */}
      <mesh position={[7.0, 2.8, 0]} receiveShadow>
        <boxGeometry args={[0.35, 5.6, 14.0]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>

      {/* North Exterior Wall (Z = -7.0, spanning X: -7.0 to +7.0) */}
      <mesh position={[0, 2.8, -7.0]} receiveShadow>
        <boxGeometry args={[14.0, 5.6, 0.35]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* South Exterior Wall (Z = +7.0, spanning X: -7.0 to +7.0) */}
      <mesh position={[0, 2.8, 7.0]} receiveShadow>
        <boxGeometry args={[14.0, 5.6, 0.35]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* West Entrance Wall (X = -7.0, facing East corridor at X = +13.0) */}
      {/* North Segment: Z from -7.0 to -1.9 (center Z = -4.45, length = 5.1) */}
      <mesh position={[-7.0, 2.8, -4.45]} receiveShadow>
        <boxGeometry args={[0.35, 5.6, 5.1]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* South Segment: Z from +1.9 to +7.0 (center Z = +4.45, length = 5.1) */}
      <mesh position={[-7.0, 2.8, 4.45]} receiveShadow>
        <boxGeometry args={[0.35, 5.6, 5.1]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* Doorway Header Lintel (X = -7.0, Y = 4.6, spanning Z: -2.1 to +2.1, height = 2.0) */}
      <mesh position={[-7.0, 4.6, 0]} receiveShadow>
        <boxGeometry args={[0.38, 2.0, 4.2]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>

      {/* Doorway Frame Pillars */}
      <mesh position={[-7.0, 1.8, -2.0]}>
        <boxGeometry args={[0.42, 3.6, 0.42]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>
      <mesh position={[-7.0, 1.8, 2.0]}>
        <boxGeometry args={[0.42, 3.6, 0.42]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>

      {/* Doorway Header Sign Plate (Facing West toward corridor) */}
      <group position={[-7.15, 4.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
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
      <mesh position={[-7.0, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[3.8, 0.25]} />
        <primitive object={portalGlowMat} attach="material" />
      </mesh>

      {/* --- 3. BRANDED INTERIOR PLAQUES & SIGNAGE --- */}
      {/* Main East Feature Plaque (Facing West into the room) */}
      <group position={[6.8, 3.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[6.2, 1.1]} />
          <meshBasicMaterial color="#020617" transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, 0, -0.025]}>
          <planeGeometry args={[6.26, 1.16]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} />
        </mesh>
        <Text
          position={[0, 0.2, 0]}
          fontSize={0.24}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
          font="monospace"
          fontWeight="bold"
          letterSpacing={0.06}
        >
          LINKED LIST LAB // EAST WING
        </Text>
        <Text
          position={[0, -0.16, 0]}
          fontSize={0.14}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          font="monospace"
        >
          Non-Contiguous Heap Allocation // Pointer Chain [Data | Next]
        </Text>
      </group>

      {/* --- 4. TECH BENCHES & WORKSTATIONS --- */}
      {/* North Tech Bench (Z = -5.8, X = 0) */}
      <group position={[0, 0, -5.8]}>
        <mesh position={[0, 0.42, 0]} receiveShadow>
          <boxGeometry args={[4.2, 0.84, 1.2]} />
          <primitive object={materials.woodLight} attach="material" />
        </mesh>
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

      {/* South Tech Bench (Z = +5.8, X = 0) */}
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
      <pointLight position={[0, 4.6, 0]} color="#f59e0b" intensity={2.2} distance={14.0} />
      <pointLight position={[-4.5, 3.2, 3.5]} color="#00d4ff" intensity={1.4} distance={8.0} />
      <pointLight position={[4.5, 3.2, -3.5]} color="#fbbf24" intensity={1.4} distance={8.0} />

      {/* --- 6. ELEVATED CENTRAL APPARATUS TABLE & APPARATUS --- */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.8, 0.76, 2.2]} />
          <primitive object={materials.woodDark} attach="material" />
        </mesh>

        {/* Brushed Brass Tabletop Edge Trim */}
        <mesh position={[0, 0.77, 0]}>
          <boxGeometry args={[4.84, 0.03, 2.24]} />
          <meshStandardMaterial color="#d8aa46" roughness={0.25} metalness={0.9} />
        </mesh>

        {/* Procedural Three.js Model Assembly */}
        <primitive object={modelRig.group} position={[0, 0.78, 0]} />

        {/* Floating Optical Particle Field */}
        <points ref={sparkParticlesRef} position={[0, 0.78, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.035}
            color={linkedListNullError ? '#ef4444' : linkedListIsSevered ? '#f97316' : '#f59e0b'}
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Direct Apparatus Spotlights */}
        <pointLight
          position={[0, 3.2, 1.2]}
          color={linkedListNullError ? '#ef4444' : '#fef08a'}
          intensity={linkedListNullError ? 2.5 : 1.4}
          distance={5.5}
        />
      </group>

      {/* Floating 3D Interaction Prompt Badge */}
      {isNear && !activeStation && (
        <Float speed={2.5} rotationIntensity={0.03} floatIntensity={0.25}>
          <group position={[0, 2.8, 0.8]}>
            <mesh position={[0, 0, -0.02]}>
              <planeGeometry args={[3.4, 0.7]} />
              <meshBasicMaterial color="#020617" transparent opacity={0.9} />
            </mesh>
            <mesh position={[0, 0, -0.025]}>
              <planeGeometry args={[3.44, 0.74]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} />
            </mesh>
            <Text
              position={[0, 0.09, 0]}
              fontSize={0.18}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
              font="monospace"
              fontWeight="bold"
              letterSpacing={0.04}
            >
              [E] Operate Station
            </Text>
            <Text
              position={[0, -0.12, 0]}
              fontSize={0.11}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
              font="monospace"
            >
              Pointer Node Chain // Dynamic Allocation
            </Text>
          </group>
        </Float>
      )}
    </group>
  );
};
