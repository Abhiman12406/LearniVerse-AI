import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';

interface DiscPhysicsState {
  currentY: number;
  velocity: number;
}

export const StackApparatus: React.FC = () => {
  const stackDiscs = useClassroomStore((s) => s.stackDiscs);
  const physicsMap = useRef<Map<string, DiscPhysicsState>>(new Map());
  const sparkParticlesRef = useRef<THREE.Points>(null);

  // Spark particles buffer for kinetic burst effects
  const { particlePositions, particleCount } = useMemo(() => {
    const count = 48;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 0.7;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = 0.5 + Math.random() * 2.8;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    return { particlePositions: positions, particleCount: count };
  }, []);

  useFrame((_, delta) => {
    // Update spark particles animation
    if (sparkParticlesRef.current) {
      const geom = sparkParticlesRef.current.geometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        array[i * 3 + 1] += delta * 0.8;
        if (array[i * 3 + 1] > 3.4) {
          array[i * 3 + 1] = 0.4;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Heavy Octagonal Inductor Base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.3, 1.45, 0.3, 8]} />
        <meshStandardMaterial color="#0b0e17" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Brass Magnetic Compression Rings */}
      <mesh position={[0, 0.32, 0]}>
        <torusGeometry args={[1.1, 0.08, 16, 32]} />
        <meshStandardMaterial color="#b45309" roughness={0.25} metalness={0.85} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <torusGeometry args={[1.35, 0.06, 16, 32]} />
        <meshStandardMaterial color="#b45309" roughness={0.25} metalness={0.85} />
      </mesh>

      {/* Internal Magnetic Levitation Emitter Pad */}
      <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.65} />
      </mesh>
      <pointLight position={[0, 0.5, 0]} color="#00f0ff" intensity={1.5} distance={3.5} />

      {/* Transparent Glass Magnetic Containment Cylinder */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 3.0, 32, 1, true]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.1}
          metalness={0.2}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 4 Vertical Chrome Guide Rails */}
      {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, idx) => {
        const x = Math.sin(angle) * 1.0;
        const z = Math.cos(angle) * 1.0;
        return (
          <mesh key={idx} position={[x, 1.8, z]}>
            <cylinderGeometry args={[0.035, 0.035, 3.0, 12]} />
            <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.95} />
          </mesh>
        );
      })}

      {/* Top Lintel Containment Ring */}
      <mesh position={[0, 3.32, 0]}>
        <torusGeometry args={[0.98, 0.08, 16, 32]} />
        <meshStandardMaterial color="#b45309" roughness={0.25} metalness={0.85} />
      </mesh>

      {/* Dynamic Spark Particle System */}
      <points ref={sparkParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#00f0ff"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Render Stack Data Discs with Damped Spring Animation */}
      {stackDiscs.map((disc, index) => {
        const isTop = index === stackDiscs.length - 1;
        const targetY = 0.48 + index * 0.42;

        return (
          <StackDiscMesh
            key={disc.id}
            id={disc.id}
            value={disc.value}
            targetY={targetY}
            isTop={isTop}
            physicsMap={physicsMap}
          />
        );
      })}
    </group>
  );
};

interface StackDiscMeshProps {
  id: string;
  value: number;
  targetY: number;
  isTop: boolean;
  physicsMap: React.MutableRefObject<Map<string, DiscPhysicsState>>;
}

const StackDiscMesh: React.FC<StackDiscMeshProps> = ({
  id,
  value,
  targetY,
  isTop,
  physicsMap,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Initialize physics state (drop in from above cylinder on spawn)
  if (!physicsMap.current.has(id)) {
    physicsMap.current.set(id, { currentY: 3.6, velocity: 0 });
  }

  useFrame((_, delta) => {
    const state = physicsMap.current.get(id);
    if (!state || !groupRef.current) return;

    // Damped harmonic spring physics
    const springStrength = 45.0;
    const damping = 0.72;

    const displacement = targetY - state.currentY;
    const force = displacement * springStrength;

    state.velocity = (state.velocity + force * delta) * damping;
    state.currentY += state.velocity * delta;

    groupRef.current.position.y = state.currentY;
  });

  const discColor = isTop ? '#0284c7' : '#0f172a';
  const rimColor = isTop ? '#38bdf8' : '#64748b';
  const glowLightColor = isTop ? '#00f0ff' : '#3b82f6';

  return (
    <group ref={groupRef} position={[0, targetY, 0]}>
      {/* Metallic Disc Body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.82, 0.82, 0.32, 32]} />
        <meshStandardMaterial
          color={discColor}
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      {/* Emissive Rim Ring */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.82, 0.025, 16, 32]} />
        <meshBasicMaterial color={rimColor} />
      </mesh>

      {/* Numeric Value Label stamped on face */}
      <Text
        position={[0, 0.17, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.24}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight={800}
      >
        {value.toString()}
      </Text>

      {/* Front facing label */}
      <Text
        position={[0, 0, 0.83]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        {value.toString()}
      </Text>

      {/* TOP indicator badge */}
      {isTop && (
        <group position={[0, 0.38, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.13}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.1}
          >
            ▲ TOP
          </Text>
          <pointLight color={glowLightColor} intensity={0.9} distance={1.8} />
        </group>
      )}
    </group>
  );
};
