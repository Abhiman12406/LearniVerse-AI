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
import { ArrayLabWing } from './ArrayLabWing';
import { LinkedListLab } from './LinkedListLab';
import { RecursionLabWing } from './RecursionLabWing';

interface CameraFollowerProps {
  cameraAngleRef: React.MutableRefObject<number>;
  cameraPitchRef: React.MutableRefObject<number>;
}

const CameraFollower: React.FC<CameraFollowerProps> = ({ cameraAngleRef, cameraPitchRef }) => {
  const { camera } = useThree();
  const currentCamPos = useRef(new THREE.Vector3(0, 3, 15));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.2, 8));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 1.2, 8));

  useFrame(() => {
    const { avatar, cinematicCamera, activeStation } = useClassroomStore.getState();
    let idealX: number;
    let idealY: number;
    let idealZ: number;
    let lerpFactor = 0.08;

    if (cinematicCamera && cinematicCamera.active) {
      // Cinematic camera framing (e.g. framing Recursion Lab entrance during barrier dissolve)
      [idealX, idealY, idealZ] = cinematicCamera.position;
      targetLookAtRef.current.set(
        cinematicCamera.lookAt[0],
        cinematicCamera.lookAt[1],
        cinematicCamera.lookAt[2]
      );
      lerpFactor = 0.05;
    } else if (activeStation === 'stack_lab') {
      // Cinematic Fixed Framing: Facing the South Wing Stack Apparatus
      idealX = 0.0;
      idealY = 2.4;
      idealZ = 17.5;
      targetLookAtRef.current.set(0.0, 1.8, 20.0);
      lerpFactor = 0.08;
    } else if (activeStation === 'array_station') {
      // Cinematic Fixed Framing: Facing the West Wing Array Station
      idealX = -17.5;
      idealY = 2.4;
      idealZ = 0.0;
      targetLookAtRef.current.set(-20.0, 1.8, 0.0);
      lerpFactor = 0.08;
    } else if (activeStation === 'linked_list_lab') {
      // Cinematic Fixed Framing: Facing the East Wing Linked List apparatus
      idealX = 17.5;
      idealY = 2.4;
      idealZ = 0.0;
      targetLookAtRef.current.set(20.0, 1.8, 0.0);
      lerpFactor = 0.08;
    } else if (activeStation === 'recursion_lab') {
      // Cinematic Fixed Framing: Facing the North Wing Recursion elevator shaft
      idealX = 0.0;
      idealY = 2.4;
      idealZ = -17.5;
      targetLookAtRef.current.set(0.0, 1.8, -20.0);
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
      targetLookAtRef.current.set(ax, ay + 1.2, az);
    }

    // Smooth lerp camera position with cinematic damping across campus
    currentCamPos.current.x = THREE.MathUtils.lerp(currentCamPos.current.x, idealX, lerpFactor);
    currentCamPos.current.y = THREE.MathUtils.lerp(currentCamPos.current.y, idealY, lerpFactor);
    currentCamPos.current.z = THREE.MathUtils.lerp(currentCamPos.current.z, idealZ, lerpFactor);

    camera.position.copy(currentCamPos.current);
    currentLookAt.current.lerp(targetLookAtRef.current, lerpFactor + 0.02);
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
        <Lighting />
        <CameraFollower
          cameraAngleRef={cameraAngleRef}
          cameraPitchRef={cameraPitchRef}
        />
        <ClassroomCampus />
        <Avatar cameraAngleRef={cameraAngleRef} />

        <React.Suspense fallback={null}>
          <CentralDais />
          <Archways />
          <StackLabWing />
          <ArrayLabWing />
          <LinkedListLab />
          <RecursionLabWing />
        </React.Suspense>
      </Canvas>
    </div>
  );
};
