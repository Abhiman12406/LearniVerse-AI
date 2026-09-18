import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';
import {
  createLinkedListModel,
  LinkedListModelRig,
} from '../../assets/3d/createLinkedListModel';

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

  // Position of Linked List Lab Wing Chamber (Azimuth 90° East, Radius 24.0)
  const wingPos: [number, number, number] = [24.0, 0.0, 0.0];
  const consolePos: [number, number, number] = [24.0, 0.0, 0.0];

  // Proximity detection to apparatus table
  useFrame(() => {
    const [ax, , az] = avatar.position;
    const dist = Math.hypot(ax - consolePos[0], az - consolePos[2]);
    const near = dist <= 4.0;
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

  // Face archway entrance (toward atrium center, azimuth 90° + 180° = -90° / -Math.PI / 2)
  const chamberRotationY = -Math.PI / 2;

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

  return (
    <group position={wingPos} rotation={[0, chamberRotationY, 0]}>
      {/* Hexagonal Laboratory Chamber Platform */}
      <mesh position={[0, -0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.2, 6]} />
        <meshStandardMaterial
          color="#0b1120"
          roughness={0.45}
          metalness={0.75}
        />
      </mesh>

      {/* Outer Chamber Boundary Accent Ring (Gold/Amber Linked List motif) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.8, 5.1, 6]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Cybernetic Floor Grid Concentric Ring */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 2.92, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Linked List Lab Wing Atmospheric Illumination */}
      <pointLight position={[0, 4.2, 0]} color="#f59e0b" intensity={1.5} distance={8.5} />
      <pointLight position={[-2.5, 2.5, 2.0]} color="#00d4ff" intensity={1.1} distance={5.0} />
      <pointLight position={[2.5, 2.5, -2.0]} color="#10b981" intensity={0.9} distance={5.0} />

      {/* Safety Stanchions around chamber perimeter */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const ang = (i / 6) * Math.PI * 2;
        const sx = Math.sin(ang) * 4.8;
        const sz = Math.cos(ang) * 4.8;
        return (
          <group key={i} position={[sx, 0, sz]}>
            <mesh position={[0, 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 1.4, 12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.9} />
            </mesh>
            <mesh position={[0, 1.42, 0]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color="#f59e0b" />
            </mesh>
          </group>
        );
      })}

      {/* Elevated Apparatus Pedestal Table */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.8, 0.76, 2.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.28} metalness={0.85} />
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
        <Float speed={2.5} rotationIntensity={0.05} floatIntensity={0.35}>
          <group position={[0, 2.4, 0.8]}>
            <mesh position={[0, 0, -0.02]}>
              <planeGeometry args={[3.2, 0.65]} />
              <meshBasicMaterial color="#020617" transparent opacity={0.88} />
            </mesh>
            <mesh position={[0, 0, -0.025]}>
              <planeGeometry args={[3.24, 0.69]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
            </mesh>
            <Text
              position={[0, 0.08, 0]}
              fontSize={0.16}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
              font="monospace"
              fontWeight="bold"
            >
              [E] ENGAGE LINKED LIST APPARATUS
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

      {/* Floating Title Plaque above the Apparatus */}
      <group position={[0, 3.2, -1.2]}>
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[3.8, 0.7]} />
          <meshBasicMaterial color="#020617" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.025]}>
          <planeGeometry args={[3.84, 0.74]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.5} />
        </mesh>
        <Text
          position={[0, 0.1, 0]}
          fontSize={0.18}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
          font="monospace"
          fontWeight="bold"
        >
          LINKED LIST LAB // EAST WING
        </Text>
        <Text
          position={[0, -0.12, 0]}
          fontSize={0.11}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          font="monospace"
        >
          Non-Contiguous Dynamic Nodes Linked By Pointers
        </Text>
      </group>
    </group>
  );
};
