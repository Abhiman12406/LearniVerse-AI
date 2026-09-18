import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';
import { createArrayStationModel, ArrayStationModelRig } from '../../assets/3d/createArrayStationModel';

export const ArrayStation: React.FC = () => {
  const arrayTargetIndex = useClassroomStore((s) => s.arrayTargetIndex);
  const arrayIsScanning = useClassroomStore((s) => s.arrayIsScanning);
  const arrayScanCurrentStep = useClassroomStore((s) => s.arrayScanCurrentStep);
  const arrayOutOfBounds = useClassroomStore((s) => s.arrayOutOfBounds);
  const arrayBays = useClassroomStore((s) => s.arrayBays);

  const sparkParticlesRef = useRef<THREE.Points>(null);

  // Initialize procedural 3D Array Station Indexing Apparatus
  const modelRig = useMemo<ArrayStationModelRig>(() => {
    return createArrayStationModel({
      capacity: 5,
      initialBays: arrayBays,
      baseAddress: 0x2000,
    });
  }, []);

  // Cleanup WebGL resources on unmount
  useEffect(() => {
    return () => {
      modelRig.dispose();
    };
  }, [modelRig]);

  // Subtle floating optical dust/spark particles near the probe carriage
  const { particlePositions, particleCount } = useMemo(() => {
    const count = 32;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3.2;
      positions[i * 3 + 1] = 0.6 + Math.random() * 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2 + 0.3;
    }
    return { particlePositions: positions, particleCount: count };
  }, []);

  useFrame((_, delta) => {
    // Synchronize kinetic simulation with current store state
    modelRig.update(delta, {
      targetIndex: arrayTargetIndex,
      isScanning: arrayIsScanning,
      scanStep: arrayScanCurrentStep,
      isOutOfBounds: arrayOutOfBounds,
      probeMode: arrayOutOfBounds ? 'error' : arrayIsScanning ? 'linear' : 'random',
      bays: arrayBays,
    });

    // Update floating optical particles
    if (sparkParticlesRef.current) {
      const geom = sparkParticlesRef.current.geometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        array[i * 3 + 1] += delta * 0.25;
        if (array[i * 3 + 1] > 2.2) {
          array[i * 3 + 1] = 0.5;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Procedural Three.js Model Assembly */}
      <primitive object={modelRig.group} />

      {/* Floating Optical Particle Field */}
      <points ref={sparkParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color={arrayOutOfBounds ? '#ef4444' : arrayIsScanning ? '#00f0ff' : '#ffb700'}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Studio Lighting Accents */}
      <pointLight
        position={[0, 2.8, 1.4]}
        color={arrayOutOfBounds ? '#ef4444' : arrayIsScanning ? '#00f0ff' : '#ffc043'}
        intensity={arrayOutOfBounds ? 2.5 : 1.4}
        distance={5.0}
      />
      <pointLight position={[-1.8, 1.8, -0.6]} color="#38bdf8" intensity={0.6} distance={4.0} />
      <pointLight position={[1.8, 1.8, -0.6]} color="#f59e0b" intensity={0.8} distance={4.0} />
    </group>
  );
};
