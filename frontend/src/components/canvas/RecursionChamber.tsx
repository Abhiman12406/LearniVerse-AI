import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';
import {
  createRecursionChamberModel,
  RecursionChamberModelRig,
} from '../../assets/3d/createRecursionChamberModel';

export const RecursionChamber: React.FC = () => {
  const recursionFrames = useClassroomStore((s) => s.recursionFrames);
  const recursionIsUnwinding = useClassroomStore((s) => s.recursionIsUnwinding);
  const recursionReturnStep = useClassroomStore((s) => s.recursionReturnStep);
  const recursionStackOverflow = useClassroomStore((s) => s.recursionStackOverflow);

  const sparkParticlesRef = useRef<THREE.Points>(null);

  // Initialize the procedural Recursion Call-Stack Elevator Apparatus
  const modelRig = useMemo<RecursionChamberModelRig>(() => {
    return createRecursionChamberModel({
      maxDepth: 5,
      initialFrames: recursionFrames,
    });
  }, []);

  // Cleanup WebGL resources on unmount
  useEffect(() => {
    return () => {
      modelRig.dispose();
    };
  }, [modelRig]);

  // Subtle ambient energy particles rising through the elevator shaft
  const { particlePositions, particleCount } = useMemo(() => {
    const count = 42;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.15 + Math.random() * 0.55;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = 0.8 + Math.random() * 3.4;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    return { particlePositions: positions, particleCount: count };
  }, []);

  useFrame((_, delta) => {
    // Drive physics and translation easing for the procedural model
    modelRig.update(delta, {
      frames: recursionFrames,
      isUnwinding: recursionIsUnwinding,
      returnStep: recursionReturnStep,
      stackOverflow: recursionStackOverflow,
    });

    // Update ascending spark particles inside shaft
    if (sparkParticlesRef.current) {
      const geom = sparkParticlesRef.current.geometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      const speed = recursionIsUnwinding ? 1.8 : 0.65;
      for (let i = 0; i < particleCount; i++) {
        array[i * 3 + 1] += delta * speed;
        if (array[i * 3 + 1] > 4.4) {
          array[i * 3 + 1] = 0.85;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Procedural Three.js Apparatus Mesh Assembly */}
      <primitive object={modelRig.group} />

      {/* Internal Shaft Spark Particles */}
      <points ref={sparkParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color={recursionStackOverflow ? '#ef4444' : recursionIsUnwinding ? '#00f0ff' : '#ffaa22'}
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Atmospheric lighting */}
      <pointLight position={[1.4, 2.8, 1.4]} color="#ffaa22" intensity={1.2} distance={5.5} />
      <pointLight position={[-1.4, 2.0, -1.2]} color="#00f0ff" intensity={0.9} distance={4.8} />
      {recursionStackOverflow && (
        <pointLight position={[0, 4.6, 0]} color="#ef4444" intensity={3.5} distance={8.0} />
      )}
    </group>
  );
};
