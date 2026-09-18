import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useClassroomStore } from '../../store/useClassroomStore';

interface PrerequisiteBarrierProps {
  wingId?: string;
  isSealed: boolean;
  width?: number;
  height?: number;
}

const PARTICLE_COUNT = 360;

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
  uniform float uFlicker;
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
    float noiseFlicker = (sin(uTime * 48.0 + vUv.y * 64.0) * 0.15 + 0.85) * uFlicker;

    // Edge falloff vignette so the forcefield terminates cleanly inside the portal frame
    float edgeFalloff = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x)
                      * smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);

    // Combine energy grid, scanning beam, and base luminescence
    float baseIntensity = (horizGrid + vertGrid + scanBeam + scanDown + 0.15) * noiseFlicker;
    float alpha = clamp(baseIntensity * edgeFalloff * uOpacity, 0.0, 1.0);

    // Core laser glow color modulation with white-hot core on direct scan beam
    vec3 glowColor = uColor;
    vec3 finalColor = mix(glowColor, vec3(1.0, 1.0, 1.0), clamp(scanBeam * 0.65, 0.0, 1.0));

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const PrerequisiteBarrier: React.FC<PrerequisiteBarrierProps> = ({
  wingId,
  isSealed,
  width = 4.2,
  height = 5.6,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const opacityRef = useRef<number>(isSealed ? 1.0 : 0.0);

  // Particle Shockwave System refs
  const pointsRef = useRef<THREE.Points>(null);
  const particleGeoRef = useRef<THREE.BufferGeometry>(null);
  const shockwaveActiveRef = useRef<boolean>(false);
  const shockwaveTimeRef = useRef<number>(0);

  const dissolvingWingId = useClassroomStore((s) => s.dissolvingWingId);
  const dissolvePhase = useClassroomStore((s) => s.dissolvePhase);
  const isThisDissolving = dissolvingWingId === wingId;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: isSealed ? 1.0 : 0.0 },
      uColor: { value: new THREE.Color('#ff0055') },
      uScanlineSpeed: { value: 1.8 },
      uFlicker: { value: 1.0 },
    }),
    []
  );

  // Pre-allocate particle geometry buffers
  const { particlePositions, particleVelocities, initialPositions } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const init = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spawn across the archway rectangular portal opening
      const px = (Math.random() - 0.5) * (width * 0.95);
      const py = (Math.random() - 0.5) * (height * 0.95);
      const pz = (Math.random() - 0.5) * 0.2;

      pos[i * 3] = px;
      pos[i * 3 + 1] = py;
      pos[i * 3 + 2] = pz;

      init[i * 3] = px;
      init[i * 3 + 1] = py;
      init[i * 3 + 2] = pz;

      // Radial explosive velocities outward from barrier center
      const angle = Math.atan2(py, px) + (Math.random() - 0.5) * 0.5;
      const speed = 3.5 + Math.random() * 5.5;

      vel[i * 3] = Math.cos(angle) * speed;
      vel[i * 3 + 1] = Math.sin(angle) * speed + (Math.random() * 2.0); // Slight upward thermal lift
      vel[i * 3 + 2] = (Math.random() - 0.4) * 4.5; // Shockwave burst into atrium
    }

    return {
      particlePositions: pos,
      particleVelocities: vel,
      initialPositions: init,
    };
  }, [width, height]);

  // Trigger shockwave explosion when phase switches to 'shockwave'
  useEffect(() => {
    if (isThisDissolving && dissolvePhase === 'shockwave') {
      shockwaveActiveRef.current = true;
      shockwaveTimeRef.current = 0;

      // Reset particles to initial portal positions
      if (particleGeoRef.current) {
        const posAttr = particleGeoRef.current.attributes.position as THREE.BufferAttribute;
        posAttr.copyArray(initialPositions);
        posAttr.needsUpdate = true;
      }
    }
  }, [isThisDissolving, dissolvePhase, initialPositions]);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }

    // 1. Violent Flicker Phase handling
    if (isThisDissolving && dissolvePhase === 'flicker') {
      const strobe = Math.sin(performance.now() * 0.05) > 0;
      if (materialRef.current) {
        materialRef.current.uniforms.uScanlineSpeed.value = 14.0;
        materialRef.current.uniforms.uColor.value.set(strobe ? '#ffffff' : '#ff0055');
        materialRef.current.uniforms.uFlicker.value = 1.8 + Math.sin(performance.now() * 0.08) * 0.8;
      }
      if (lightRef.current) {
        lightRef.current.color.set(strobe ? '#ffffff' : '#ff0055');
        lightRef.current.intensity = 4.5;
      }
      opacityRef.current = strobe ? 1.5 : 0.4;
    } else {
      // Standard smooth transition
      const targetOpacity = isSealed ? 1.0 : 0.0;
      opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, delta * 5.0);

      if (materialRef.current) {
        materialRef.current.uniforms.uScanlineSpeed.value = 1.8;
        materialRef.current.uniforms.uColor.value.set('#ff0055');
        materialRef.current.uniforms.uFlicker.value = 1.0;
      }
      if (lightRef.current) {
        lightRef.current.color.set(shockwaveActiveRef.current ? '#00f0ff' : '#ff0055');
        lightRef.current.intensity = shockwaveActiveRef.current
          ? Math.max(0, (1.0 - shockwaveTimeRef.current / 2.5) * 3.5)
          : opacityRef.current * 2.0;
      }
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uOpacity.value = opacityRef.current;
    }

    if (meshRef.current) {
      meshRef.current.visible = opacityRef.current > 0.01;
    }

    // 2. Particle Shockwave Physics Simulation
    if (shockwaveActiveRef.current && pointsRef.current && particleGeoRef.current) {
      shockwaveTimeRef.current += delta;
      const t = shockwaveTimeRef.current;
      const duration = 2.8;

      if (t < duration) {
        const positions = particleGeoRef.current.attributes.position.array as Float32Array;
        const drag = Math.max(0.2, 1.0 - delta * 0.85);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const idx = i * 3;
          // Apply velocity with drag
          particleVelocities[idx] *= drag;
          particleVelocities[idx + 1] *= drag;
          particleVelocities[idx + 2] *= drag;

          positions[idx] += particleVelocities[idx] * delta;
          positions[idx + 1] += particleVelocities[idx + 1] * delta;
          positions[idx + 2] += particleVelocities[idx + 2] * delta;
        }

        particleGeoRef.current.attributes.position.needsUpdate = true;

        // Fade out particle opacity over lifetime
        const mat = pointsRef.current.material as THREE.PointsMaterial;
        mat.opacity = Math.max(0, 1.0 - Math.pow(t / duration, 1.5));
        mat.size = 0.22 * (1.0 + t * 0.6);
        pointsRef.current.visible = true;
      } else {
        shockwaveActiveRef.current = false;
        pointsRef.current.visible = false;
      }
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

      {/* 3D Cyan Particle Shockwave System (360 particles) */}
      <points ref={pointsRef} visible={false}>
        <bufferGeometry ref={particleGeoRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00f0ff"
          size={0.22}
          transparent
          opacity={1.0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Top Projector Emitter Rail */}
      <mesh position={[0, height / 2 - 0.05, 0]}>
        <boxGeometry args={[width * 0.95, 0.1, 0.2]} />
        <meshStandardMaterial color="#1a0b12" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Top Emitter Core Glow Strip */}
      <mesh position={[0, height / 2 - 0.11, 0]}>
        <planeGeometry args={[width * 0.92, 0.04]} />
        <meshBasicMaterial color={isSealed ? '#ff0055' : '#00f0ff'} />
      </mesh>

      {/* Bottom Ground Projector Emitter Rail */}
      <mesh position={[0, -height / 2 + 0.05, 0]}>
        <boxGeometry args={[width * 0.95, 0.1, 0.2]} />
        <meshStandardMaterial color="#1a0b12" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Bottom Emitter Core Glow Strip */}
      <mesh position={[0, -height / 2 + 0.11, 0]}>
        <planeGeometry args={[width * 0.92, 0.04]} />
        <meshBasicMaterial color={isSealed ? '#ff0055' : '#00f0ff'} />
      </mesh>

      {/* Dynamic Ground & Frame Laser Glow Light */}
      <pointLight
        ref={lightRef}
        color={isSealed ? '#ff0055' : '#00f0ff'}
        intensity={isSealed ? 2.0 : 0.0}
        distance={7.0}
        decay={2}
        position={[0, 0, 0.4]}
      />
    </group>
  );
};
