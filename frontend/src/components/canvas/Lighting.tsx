import React from 'react';
import { useClassroomStore } from '../../store/useClassroomStore';

export const Lighting: React.FC = () => {
  const isGoldenHour = useClassroomStore((s) => s.isGoldenHour);

  const bgColor = isGoldenHour ? '#281119' : '#17070b';
  const ambientColor = isGoldenHour ? '#fde047' : '#ffedd5';
  const ambientIntensity = isGoldenHour ? 0.92 : 0.85;
  const sunColor = isGoldenHour ? '#f97316' : '#fff7ed';
  const sunIntensity = isGoldenHour ? 3.6 : 2.8;

  return (
    <>
      {/* Warm atmospheric campus background and soft fog */}
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 25, 110]} />

      {/* Soft warm ambient fill light for wooden architecture and furniture */}
      <ambientLight intensity={ambientIntensity} color={ambientColor} />

      {/* Warm directional sunlight beams */}
      <directionalLight
        position={[12, 30, -20]}
        intensity={sunIntensity}
        color={sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-near={1.0}
        shadow-camera-far={100}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
      />

      {/* Secondary soft cool sky/window bounce fill light from opposite angle */}
      <directionalLight position={[-25, 20, 25]} intensity={0.7} color="#dbeafe" />

      {/* Central classroom overhead warm luminaire */}
      <pointLight position={[0, 4.6, 0]} intensity={1.2} distance={15} color="#ffedd5" />

      {/* Localized Apparatus Spotlights for Walkable Lab Wings */}
      {/* West Wing: Array Station Lab */}
      <pointLight position={[-20, 4.5, 0]} intensity={1.6} distance={14} color="#38bdf8" />

      {/* East Wing: Linked List Lab */}
      <pointLight position={[20, 4.5, 0]} intensity={1.6} distance={14} color="#34d399" />

      {/* North Wing: Recursion Chamber */}
      <pointLight position={[0, 4.5, -20]} intensity={1.8} distance={14} color="#c084fc" />

      {/* South Wing: Stack Lab */}
      <pointLight position={[0, 4.5, 20]} intensity={1.8} distance={14} color="#fbbf24" />
    </>
  );
};
