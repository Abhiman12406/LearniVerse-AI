import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';
import { createStackTowerModel, StackTowerModelRig } from '../../assets/3d/createStackTowerModel';

export const StackApparatus: React.FC = () => {
  const stackDiscs = useClassroomStore((s) => s.stackDiscs);
  const sparkParticlesRef = useRef<THREE.Points>(null);

  // Initialize the procedural Stack LIFO Cylinder Apparatus
  const modelRig = useMemo<StackTowerModelRig>(() => {
    return createStackTowerModel({
      capacity: 6,
      initialDiscs: stackDiscs,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      modelRig.dispose();
    };
  }, [modelRig]);

  // Subtle ambient spark particles rising through the transparent cylinder column
  const { particlePositions, particleCount } = useMemo(() => {
    const count = 36;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.1 + Math.random() * 0.35;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = 1.2 + Math.random() * 2.2;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    return { particlePositions: positions, particleCount: count };
  }, []);

  useFrame((_, delta) => {
    // Drive physics and translation easing for the procedural model
    modelRig.update(delta, stackDiscs);

    // Update spark particles inside column
    if (sparkParticlesRef.current) {
      const geom = sparkParticlesRef.current.geometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        array[i * 3 + 1] += delta * 0.6;
        if (array[i * 3 + 1] > 3.4) {
          array[i * 3 + 1] = 1.25;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Procedural Three.js Apparatus Mesh Assembly */}
      <primitive object={modelRig.group} />

      {/* Internal Column Spark Particles */}
      <points ref={sparkParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color="#ff9a1f"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Warm brass & amber studio rim highlights */}
      <pointLight position={[1.2, 2.5, 1.2]} color="#ffaa22" intensity={0.9} distance={4.0} />
      <pointLight position={[-1.2, 1.5, -1.0]} color="#00f0ff" intensity={0.6} distance={3.5} />
    </group>
  );
};
