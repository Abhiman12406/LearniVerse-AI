import React from 'react';

export const Lighting: React.FC = () => {
  return (
    <>
      {/* Deep atmospheric cyber fog */}
      <color attach="background" args={['#05070a']} />
      <fog attach="fog" args={['#05070a', 15, 65]} />

      {/* Low ambient light for obsidian architecture */}
      <ambientLight intensity={0.4} color="#151b2e" />

      {/* Main directional rim/key light */}
      <directionalLight
        position={[10, 20, 15]}
        intensity={1.2}
        color="#c7d2fe"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />

      {/* Soft fill light from opposite angle */}
      <directionalLight position={[-15, 12, -10]} intensity={0.5} color="#4338ca" />

      {/* Central Dais upward cyan spotlight */}
      <pointLight position={[0, 0.8, 0]} intensity={2.5} distance={14} color="#00f0ff" />

      {/* Ambient violet rim accent */}
      <pointLight position={[0, 14, 0]} intensity={1.8} distance={30} color="#7928ca" />
    </>
  );
};
