import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Lighting } from './Lighting';
import { ClassroomCampus } from './ClassroomCampus';
import { CentralDais } from './CentralDais';
import { Archways } from './Archways';
import { Avatar } from './Avatar';
import { useClassroomStore } from '../../store/useClassroomStore';
import { StackLabWing } from './StackLabWing';

interface CameraFollowerProps {
  cameraAngleRef: React.MutableRefObject<number>;
  cameraPitchRef: React.MutableRefObject<number>;
}

const CameraFollower: React.FC<CameraFollowerProps> = ({ cameraAngleRef, cameraPitchRef }) => {
  const { camera } = useThree();
  const avatar = useClassroomStore((s) => s.avatar);
  const cinematicCamera = useClassroomStore((s) => s.cinematicCamera);
  const activeStation = useClassroomStore((s) => s.activeStation);
  const currentCamPos = useRef(new THREE.Vector3(0, 3, 15));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.2, 8));

  useFrame(() => {
    let idealX: number;
    let idealY: number;
    let idealZ: number;
    let targetLookAt: THREE.Vector3;
    let lerpFactor = 0.08;

    if (cinematicCamera && cinematicCamera.active) {
      // Cinematic camera framing (e.g. framing Recursion Lab entrance during barrier dissolve)
      [idealX, idealY, idealZ] = cinematicCamera.position;
      targetLookAt = new THREE.Vector3(...cinematicCamera.lookAt);
      lerpFactor = 0.05;
    } else if (activeStation === 'stack_lab') {
      // Cinematic Fixed Framing: Close-up facing the Stack Apparatus cylinder
      idealX = 10.2;
      idealY = 2.4;
      idealZ = 18.0;
      targetLookAt = new THREE.Vector3(12.0, 1.9, 21.0);
      lerpFactor = 0.08;
    } else {
      const [ax, ay, az] = avatar.position;
      const distance = 6.8;
      const height = 2.8 + Math.sin(cameraPitchRef.current) * 1.8;

      // Calculate ideal camera position behind avatar based on orbit azimuth
      const angle = cameraAngleRef.current;
      idealX = ax + Math.sin(angle) * distance;
      idealZ = az + Math.cos(angle) * distance;
      idealY = ay + height;

      // Camera targets slightly above avatar torso
      targetLookAt = new THREE.Vector3(ax, ay + 1.2, az);
    }

    // Smooth lerp camera position with cinematic damping across campus
    currentCamPos.current.x = THREE.MathUtils.lerp(currentCamPos.current.x, idealX, lerpFactor);
    currentCamPos.current.y = THREE.MathUtils.lerp(currentCamPos.current.y, idealY, lerpFactor);
    currentCamPos.current.z = THREE.MathUtils.lerp(currentCamPos.current.z, idealZ, lerpFactor);

    camera.position.copy(currentCamPos.current);
    currentLookAt.current.lerp(targetLookAt, lerpFactor + 0.02);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

export const ClassroomCanvas: React.FC = () => {
  const cameraAngleRef = useRef<number>(0); // 0 = looking towards negative Z (toward classroom front from Z=8)
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

      // Orbit sensitivity
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
        camera={{ position: [0, 3, 15], fov: 60, near: 0.1, far: 250 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        shadows
      >
        <React.Suspense fallback={null}>
          <Lighting />
          <ClassroomCampus />
          <CentralDais />
          <Archways />
          <StackLabWing />
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
