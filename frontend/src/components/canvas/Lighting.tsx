import React from 'react';

export const Lighting: React.FC = () => {
  return (
    <>
      {/* Warm atmospheric campus background and soft fog */}
      <color attach="background" args={['#1c1815']} />
      <fog attach="fog" args={['#1c1815', 25, 110]} />

      {/* Soft warm ambient fill light for wooden architecture and furniture */}
      <ambientLight intensity={0.85} color="#ffedd5" />

      {/* Warm directional sunlight beams angled through window blinds (#fff3d6) */}
      <directionalLight
        position={[14, 28, -18]}
        intensity={2.6}
        color="#fff3d6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-near={5}
        shadow-camera-far={70}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />

      {/* Secondary soft cool sky/window bounce fill light from opposite angle */}
      <directionalLight position={[-20, 16, 20]} intensity={0.45} color="#dbeafe" />

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
