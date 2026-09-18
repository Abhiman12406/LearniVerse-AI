import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';

export const Atrium: React.FC = () => {
  const worldState = useClassroomStore((s) => s.worldState);
  const targetWing = worldState?.conduits_target_wing || 'stack_lab';

  const conduitMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (conduitMaterialRef.current) {
      // Pulse brightness on the targeted conduit
      const t = clock.getElapsedTime();
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.5);
      conduitMaterialRef.current.opacity = 0.4 + 0.6 * pulse;
    }
  });

  // Calculate radiating floor conduits to the 5 wing archways
  const conduits = useMemo(() => {
    const list = [
      { id: 'array_station', azimuthDeg: 30 },
      { id: 'linked_list_lab', azimuthDeg: 90 },
      { id: 'stack_lab', azimuthDeg: 150 },
      { id: 'tree_lab', azimuthDeg: 210 },
      { id: 'recursion_lab', azimuthDeg: 270 },
    ];

    return list.map((item) => {
      const angleRad = (item.azimuthDeg * Math.PI) / 180;
      const startRadius = 5.2; // Edge of Dais
      const endRadius = 17.2; // Near Archway
      const length = endRadius - startRadius;
      const midRadius = startRadius + length / 2;

      const midX = Math.sin(angleRad) * midRadius;
      const midZ = -Math.cos(angleRad) * midRadius;

      return {
        id: item.id,
        isTarget: item.id === targetWing,
        position: [midX, 0.02, midZ] as [number, number, number],
        rotationY: -angleRad + Math.PI / 2,
        length,
      };
    });
  }, [targetWing]);

  // Perimeter wall boundary pillars (12 segments forming cybernetic boundary)
  const boundaryPillars = useMemo(() => {
    const count = 24;
    const radius = 18.2;
    const pillars = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      pillars.push({ x, z, rotY: angle });
    }
    return pillars;
  }, []);

  return (
    <group>
      {/* Hexagonal Main Floor Tile (radius 18.5) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <circleGeometry args={[18.5, 6]} />
        <meshStandardMaterial
          color="#0a0d14"
          roughness={0.6}
          metalness={0.7}
        />
      </mesh>

      {/* Decorative Outer Cyber Ring Accent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[17.6, 18.2, 64]} />
        <meshBasicMaterial color="#1a2238" side={THREE.DoubleSide} />
      </mesh>

      {/* Concentric Decorative Floor Rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[11.5, 11.65, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[7.8, 7.95, 64]} />
        <meshBasicMaterial color="#7928ca" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Radiating Emissive Floor Conduits */}
      {conduits.map((c) => (
        <group key={c.id} position={c.position} rotation={[0, c.rotationY, 0]}>
          {/* Main Conduit Track Base */}
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[c.length, 0.6]} />
            <meshStandardMaterial color="#07090f" roughness={0.7} metalness={0.9} />
          </mesh>

          {/* Central Glowing Energy Line */}
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[c.length, 0.18]} />
            {c.isTarget ? (
              <meshBasicMaterial
                ref={conduitMaterialRef}
                color="#00f0ff"
                transparent
                opacity={0.9}
              />
            ) : (
              <meshBasicMaterial
                color="#3b4261"
                transparent
                opacity={0.4}
              />
            )}
          </mesh>
        </group>
      ))}

      {/* Perimeter Pillars & Boundary Architecture */}
      {boundaryPillars.map((p, idx) => (
        <group key={idx} position={[p.x, 0, p.z]} rotation={[0, p.rotY, 0]}>
          <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.8, 5, 0.8]} />
            <meshStandardMaterial color="#0f1322" roughness={0.4} metalness={0.8} />
          </mesh>
          <mesh position={[0, 2.5, 0.42]}>
            <planeGeometry args={[0.12, 4.4]} />
            <meshBasicMaterial color="#7928ca" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
