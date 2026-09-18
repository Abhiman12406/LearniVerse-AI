import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';
import { MasteryMap } from '../../types/world';
import { getMasteryColor } from '../../utils/mastery';

interface ConceptNodeDef {
  key: keyof MasteryMap;
  label: string;
  position: [number, number, number];
  prerequisiteKey?: keyof MasteryMap;
  prerequisiteThreshold?: number;
}

const CONCEPT_NODES: ConceptNodeDef[] = [
  { key: 'array', label: 'Arrays', position: [-1.4, 1.9, 0.7] },
  { key: 'linked_list', label: 'Linked Lists', position: [-0.8, 2.4, -1.2], prerequisiteKey: 'array', prerequisiteThreshold: 0.60 },
  { key: 'stack', label: 'Stacks', position: [0.8, 2.8, -1.0], prerequisiteKey: 'linked_list', prerequisiteThreshold: 0.50 },
  { key: 'recursion', label: 'Recursion', position: [1.4, 3.3, 0.6], prerequisiteKey: 'stack', prerequisiteThreshold: 0.70 },
  { key: 'tree', label: 'Trees', position: [0.0, 3.9, 1.2], prerequisiteKey: 'recursion', prerequisiteThreshold: 0.70 },
];

interface ConnectorBeamProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  isBlocked: boolean;
}

const ConnectorBeam: React.FC<ConnectorBeamProps> = ({ start, end, color, isBlocked }) => {
  const vStart = useMemo(() => new THREE.Vector3(...start), [start]);
  const vEnd = useMemo(() => new THREE.Vector3(...end), [end]);
  const distance = useMemo(() => vStart.distanceTo(vEnd), [vStart, vEnd]);
  const midPoint = useMemo(() => new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5), [vStart, vEnd]);
  const orientation = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(vEnd, vStart).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(up, dir);
  }, [vStart, vEnd]);

  const beamMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (beamMaterialRef.current && isBlocked) {
      // Rapid crimson hazard pulse for blocked prerequisite link
      const pulse = 0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 6.0);
      beamMaterialRef.current.opacity = 0.35 + 0.5 * pulse;
    }
  });

  return (
    <group position={midPoint} quaternion={orientation}>
      {/* Outer energy beam */}
      <mesh>
        <cylinderGeometry args={[0.028, 0.028, distance, 8]} />
        <meshBasicMaterial
          ref={beamMaterialRef}
          color={color}
          transparent
          opacity={isBlocked ? 0.7 : 0.85}
        />
      </mesh>
      {/* Inner bright laser core */}
      <mesh>
        <cylinderGeometry args={[0.012, 0.012, distance, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
    </group>
  );
};

export const KnowledgeGraphConstellation: React.FC = () => {
  const constellationRef = useRef<THREE.Group>(null);
  const coreBeamRef = useRef<THREE.Mesh>(null);
  const haloRingRef = useRef<THREE.Mesh>(null);

  const learner = useClassroomStore((s) => s.learner);
  const masteryMap = learner?.mastery_map || {
    array: 0.90,
    linked_list: 0.70,
    stack: 0.38,
    recursion: 0.20,
    tree: 0.10,
  };

  useFrame(({ clock }, delta) => {
    // Gentle rotation of the entire holographic constellation
    if (constellationRef.current) {
      constellationRef.current.rotation.y += delta * 0.22;
      constellationRef.current.position.y = Math.sin(clock.getElapsedTime() * 1.5) * 0.08;
    }
    // Pulsing central holographic emitter beam
    if (coreBeamRef.current) {
      const pulse = 0.4 + 0.3 * Math.sin(clock.getElapsedTime() * 3.0);
      (coreBeamRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
    // Counter-rotating halo ring
    if (haloRingRef.current) {
      haloRingRef.current.rotation.z -= delta * 0.3;
    }
  });

  // Calculate directed beams between consecutive prerequisite pairs
  const edges = useMemo(() => {
    return [
      { from: CONCEPT_NODES[0], to: CONCEPT_NODES[1] },
      { from: CONCEPT_NODES[1], to: CONCEPT_NODES[2] },
      { from: CONCEPT_NODES[2], to: CONCEPT_NODES[3] },
      { from: CONCEPT_NODES[3], to: CONCEPT_NODES[4] },
    ];
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Central Holographic Light Column rising from Dais center */}
      <mesh ref={coreBeamRef} position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 3.8, 16]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating Concentric Holographic Anchor Rings */}
      <mesh ref={haloRingRef} position={[0, 1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.7, 1.78, 48]} />
        <meshBasicMaterial color="#7928ca" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating 3D Holographic Constellation */}
      <group ref={constellationRef} position={[0, 0, 0]}>
        {/* Prerequisite DAG Directed Laser Beams */}
        {edges.map(({ from, to }, idx) => {
          const prereqMastery = masteryMap[from.key] ?? 0;
          const reqThreshold = to.prerequisiteThreshold ?? 0.70;
          const isBlocked = prereqMastery < reqThreshold;
          const beamColor = isBlocked ? '#ff0055' : '#00ff88';

          return (
            <ConnectorBeam
              key={`edge-${idx}`}
              start={from.position}
              end={to.position}
              color={beamColor}
              isBlocked={isBlocked}
            />
          );
        })}

        {/* 3D Crystalline Concept Nodes */}
        {CONCEPT_NODES.map((node) => {
          const masteryVal = masteryMap[node.key] ?? 0;
          const color = getMasteryColor(masteryVal);
          const pct = Math.round(masteryVal * 100);

          // Check if this node is currently blocked as a prerequisite gap
          let isBlockedGap = false;
          if (node.prerequisiteKey && node.prerequisiteThreshold) {
            const parentMastery = masteryMap[node.prerequisiteKey] ?? 0;
            if (parentMastery < node.prerequisiteThreshold) {
              isBlockedGap = true;
            }
          }

          return (
            <group key={node.key} position={node.position}>
              {/* Inner Faceted Gem Crystal */}
              <mesh>
                <octahedronGeometry args={[0.22, 0]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={0.8}
                  roughness={0.25}
                  metalness={0.85}
                />
              </mesh>

              {/* Outer Translucent Wireframe Orbital Cage */}
              <mesh>
                <icosahedronGeometry args={[0.32, 1]} />
                <meshBasicMaterial
                  color={color}
                  wireframe
                  transparent
                  opacity={0.45}
                />
              </mesh>

              {/* Surrounding Node Point Light */}
              <pointLight color={color} intensity={1.5} distance={3.5} />

              {/* 3D Holographic HTML Label Badge */}
              <Html
                center
                distanceFactor={13}
                style={{
                  pointerEvents: 'none',
                  userSelect: 'none',
                  transform: 'translate3d(0, -32px, 0)',
                }}
              >
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    background: 'rgba(8, 12, 22, 0.88)',
                    border: `1px solid ${color}`,
                    boxShadow: `0 0 10px ${color}55`,
                    color: '#ffffff',
                    fontFamily: 'Courier New, monospace',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1px',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.05em' }}>
                    {node.label}
                  </span>
                  <span style={{ color, fontWeight: 800, fontSize: '11px' }}>
                    {pct}%
                  </span>
                  {isBlockedGap && (
                    <span
                      style={{
                        fontSize: '8px',
                        background: 'rgba(255, 0, 85, 0.3)',
                        color: '#ff0055',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      PREREQ GAP
                    </span>
                  )}
                </div>
              </Html>
            </group>
          );
        })}
      </group>
    </group>
  );
};
