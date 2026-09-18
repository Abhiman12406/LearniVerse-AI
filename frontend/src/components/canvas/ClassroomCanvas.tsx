import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Lighting } from './Lighting';
import { Atrium } from './Atrium';
import { CentralDais } from './CentralDais';
import { Archways } from './Archways';
import { Avatar } from './Avatar';
import { useClassroomStore } from '../../store/useClassroomStore';

interface CameraFollowerProps {
  cameraAngleRef: React.MutableRefObject<number>;
  cameraPitchRef: React.MutableRefObject<number>;
}

const CameraFollower: React.FC<CameraFollowerProps> = ({ cameraAngleRef, cameraPitchRef }) => {
  const { camera } = useThree();
  const avatar = useClassroomStore((s) => s.avatar);
  const currentCamPos = useRef(new THREE.Vector3(0, 3, 15));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.2, 8));

  useFrame(() => {
    const [ax, ay, az] = avatar.position;
    const distance = 6.8;
    const height = 2.6 + Math.sin(cameraPitchRef.current) * 1.8;

    // Calculate ideal camera position behind avatar based on orbit azimuth
    const angle = cameraAngleRef.current;
    const idealX = ax + Math.sin(angle) * distance;
    const idealZ = az + Math.cos(angle) * distance;
    const idealY = ay + height;

    // Smooth lerp camera position
    currentCamPos.current.x = THREE.MathUtils.lerp(currentCamPos.current.x, idealX, 0.08);
    currentCamPos.current.y = THREE.MathUtils.lerp(currentCamPos.current.y, idealY, 0.08);
    currentCamPos.current.z = THREE.MathUtils.lerp(currentCamPos.current.z, idealZ, 0.08);

    camera.position.copy(currentCamPos.current);

    // Camera targets slightly above avatar torso and toward atrium center
    const targetLookAt = new THREE.Vector3(ax, ay + 1.2, az);
    currentLookAt.current.lerp(targetLookAt, 0.1);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

export const ClassroomCanvas: React.FC = () => {
  const cameraAngleRef = useRef<number>(0); // 0 = looking towards negative Z (toward dais from Z=8)
  const cameraPitchRef = useRef<number>(0.25); // Pitch angle
  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Ignore clicks on UI overlay buttons
      if ((e.target as HTMLElement).closest('.ui-interactive')) return;
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      // Sensitivity
      cameraAngleRef.current -= dx * 0.005;
      cameraPitchRef.current = THREE.MathUtils.clamp(
        cameraPitchRef.current + dy * 0.004,
        -0.2,
        0.75
      );
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 3, 15], fov: 60, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        shadows
      >
        <React.Suspense fallback={null}>
          <Lighting />
          <Atrium />
          <CentralDais />
          <Archways />
          <Avatar cameraAngleRef={cameraAngleRef} />
          <CameraFollower
            cameraAngleRef={cameraAngleRef}
            cameraPitchRef={cameraPitchRef}
          />
        </React.Suspense>
      </Canvas>
    </div>
  );
};
