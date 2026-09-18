import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PrerequisiteBarrierProps {
  isSealed: boolean;
  width?: number;
  height?: number;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;
  uniform float uScanlineSpeed;
  varying vec2 vUv;

  void main() {
    // Sharp horizontal laser containment lines
    float horizGrid = pow(abs(sin(vUv.y * 36.0)), 18.0) * 1.6;
    
    // Vertical confinement beams
    float vertGrid = pow(abs(sin(vUv.x * 16.0)), 24.0) * 1.3;

    // Moving high-intensity scanning laser bar sweeping vertically
    float scanPos = 0.5 + 0.5 * sin(uTime * uScanlineSpeed);
    float scanBeam = smoothstep(0.07, 0.0, abs(vUv.y - scanPos)) * 2.2;

    // Secondary subtle downward scan wave
    float scanDown = smoothstep(0.03, 0.0, abs(fract(vUv.y * 2.5 - uTime * 1.2) - 0.5)) * 0.7;

    // High frequency electric hum / plasma noise
    float noiseFlicker = sin(uTime * 32.0 + vUv.y * 64.0) * 0.08 + 0.92;

    // Edge falloff vignette so the forcefield terminates cleanly inside the portal frame
    float edgeFalloff = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x)
                      * smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);

    // Combine energy grid, scanning beam, and base luminescence
    float baseIntensity = (horizGrid + vertGrid + scanBeam + scanDown + 0.15) * noiseFlicker;
    float alpha = clamp(baseIntensity * edgeFalloff * uOpacity, 0.0, 1.0);

    // Core laser glow color modulation with white-hot core on direct scan beam
    vec3 glowColor = uColor;
    vec3 finalColor = mix(glowColor, vec3(1.0, 0.88, 0.92), clamp(scanBeam * 0.55, 0.0, 1.0));

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const PrerequisiteBarrier: React.FC<PrerequisiteBarrierProps> = ({
  isSealed,
  width = 4.2,
  height = 5.6,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const opacityRef = useRef<number>(isSealed ? 1.0 : 0.0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: isSealed ? 1.0 : 0.0 },
      uColor: { value: new THREE.Color('#ff0055') },
      uScanlineSpeed: { value: 1.8 },
    }),
    []
  );

  useFrame((_, delta) => {
    // Smoothly animate opacity for barrier recession / deployment
    const targetOpacity = isSealed ? 1.0 : 0.0;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, delta * 5.0);

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uOpacity.value = opacityRef.current;
    }

    if (lightRef.current) {
      lightRef.current.intensity = opacityRef.current * 2.0;
    }

    if (meshRef.current) {
      // Toggle visibility when fully dissolved to save rendering work
      meshRef.current.visible = opacityRef.current > 0.01;
    }
  });

  return (
    <group position={[0, height / 2 + 0.1, 0]}>
      {/* Procedural Laser Grid Plane */}
      <mesh ref={meshRef}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Top Projector Emitter Rail */}
      <mesh position={[0, height / 2 - 0.05, 0]}>
        <boxGeometry args={[width * 0.95, 0.1, 0.2]} />
        <meshStandardMaterial color="#1a0b12" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Top Emitter Core Glow Strip */}
      <mesh position={[0, height / 2 - 0.11, 0]}>
        <planeGeometry args={[width * 0.92, 0.04]} />
        <meshBasicMaterial color={isSealed ? '#ff0055' : '#334155'} />
      </mesh>

      {/* Bottom Ground Projector Emitter Rail */}
      <mesh position={[0, -height / 2 + 0.05, 0]}>
        <boxGeometry args={[width * 0.95, 0.1, 0.2]} />
        <meshStandardMaterial color="#1a0b12" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Bottom Emitter Core Glow Strip */}
      <mesh position={[0, -height / 2 + 0.11, 0]}>
        <planeGeometry args={[width * 0.92, 0.04]} />
        <meshBasicMaterial color={isSealed ? '#ff0055' : '#334155'} />
      </mesh>

      {/* Dynamic Ground & Frame Laser Glow Light */}
      <pointLight
        ref={lightRef}
        color="#ff0055"
        intensity={isSealed ? 2.0 : 0.0}
        distance={6.5}
        decay={2}
        position={[0, 0, 0.4]}
      />
    </group>
  );
};
