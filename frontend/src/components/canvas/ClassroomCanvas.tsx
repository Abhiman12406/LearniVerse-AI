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
import { TreeLabWing } from './TreeLabWing';
import {
  exponentialDamp,
  calculateThirdPersonCamera,
  calculateFirstPersonCamera,
} from '../../utils/cameraDamping';

interface CameraFollowerProps {
  cameraAngleRef: React.MutableRefObject<number>;
  cameraPitchRef: React.MutableRefObject<number>;
  cameraDistanceRef: React.MutableRefObject<number>;
  isDraggingRef: React.MutableRefObject<boolean>;
}

const CameraFollower: React.FC<CameraFollowerProps> = ({
  cameraAngleRef,
  cameraPitchRef,
  cameraDistanceRef,
  isDraggingRef,
}) => {
  const { camera } = useThree();
  const currentCamPos = useRef(new THREE.Vector3(0, 3, 15));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.2, 8));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 1.2, 8));

  useFrame((_, delta) => {
    const {
      avatar,
      cinematicCamera,
      activeStation,
      perspectiveMode,
      cameraAngleRequest,
      clearCameraAngleRequest,
    } = useClassroomStore.getState();

    if (cameraAngleRequest !== null && cameraAngleRequest !== undefined) {
      cameraAngleRef.current = cameraAngleRequest;
      clearCameraAngleRequest();
    }

    let idealX: number;
    let idealY: number;
    let idealZ: number;
    let posLambda = 9.0;
    let lookLambda = 12.0;

    if (cinematicCamera && cinematicCamera.active) {
      // Cinematic camera framing (e.g. framing Recursion Lab entrance during barrier dissolve)
      [idealX, idealY, idealZ] = cinematicCamera.position;
      targetLookAtRef.current.set(
        cinematicCamera.lookAt[0],
        cinematicCamera.lookAt[1],
        cinematicCamera.lookAt[2]
      );
      posLambda = 5.0;
      lookLambda = 6.0;
    } else if (activeStation === 'stack_lab') {
      // Cinematic Fixed Framing: Facing the South Wing Stack Apparatus
      idealX = 0.0;
      idealY = 2.4;
      idealZ = 17.5;
      targetLookAtRef.current.set(0.0, 1.8, 20.0);
      posLambda = 8.0;
      lookLambda = 10.0;
    } else if (activeStation === 'array_station') {
      // Cinematic Fixed Framing: Facing the West Wing Array Station
      idealX = -17.5;
      idealY = 2.4;
      idealZ = 0.0;
      targetLookAtRef.current.set(-20.0, 1.8, 0.0);
      posLambda = 8.0;
      lookLambda = 10.0;
    } else if (activeStation === 'linked_list_lab') {
      // Cinematic Fixed Framing: Facing the East Wing Linked List apparatus
      idealX = 17.5;
      idealY = 2.4;
      idealZ = 0.0;
      targetLookAtRef.current.set(20.0, 1.8, 0.0);
      posLambda = 8.0;
      lookLambda = 10.0;
    } else if (activeStation === 'recursion_lab') {
      // Cinematic Fixed Framing: Facing the North Wing Recursion elevator shaft
      idealX = 0.0;
      idealY = 2.4;
      idealZ = -17.5;
      targetLookAtRef.current.set(0.0, 1.8, -20.0);
      posLambda = 8.0;
      lookLambda = 10.0;
    } else if (activeStation === 'tree_lab') {
      // Cinematic Fixed Framing: Facing the South-East Wing Tree & BST apparatus
      idealX = 12.0;
      idealY = 2.4;
      idealZ = 18.0;
      targetLookAtRef.current.set(12.0, 2.0, 20.8);
      posLambda = 8.0;
      lookLambda = 10.0;
    } else if (perspectiveMode === '1st_person') {
      // First-Person Perspective: Eye-level camera fixed at 1.62m looking forward along view angles
      const pose = calculateFirstPersonCamera(
        avatar.position,
        cameraAngleRef.current,
        cameraPitchRef.current
      );
      idealX = pose.position[0];
      idealY = pose.position[1];
      idealZ = pose.position[2];
      targetLookAtRef.current.set(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2]);
      posLambda = 24.0;
      lookLambda = 45.0; // Responsive, crisp FPP look feel
    } else {
      // Third-Person Perspective: Smooth chase camera automatically following player from behind
      if (
        perspectiveMode === '3rd_person' &&
        activeStation === null &&
        (!cinematicCamera || !cinematicCamera.active)
      ) {
        if (avatar.isMoving && !isDraggingRef.current) {
          // Desired camera azimuth directly behind avatar
          const desiredAngle = avatar.rotation - Math.PI;
          let angleDiff = (desiredAngle - cameraAngleRef.current) % (Math.PI * 2);
          if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          // Smoothly track behind avatar (damped follow)
          const followSpeed = 3.5;
          cameraAngleRef.current += angleDiff * Math.min(1.0, followSpeed * delta);

          // Keep cameraAngleRef bounded between -PI and PI
          if (cameraAngleRef.current > Math.PI) cameraAngleRef.current -= Math.PI * 2;
          if (cameraAngleRef.current < -Math.PI) cameraAngleRef.current += Math.PI * 2;
        }
      }

      const pose = calculateThirdPersonCamera(
        avatar.position,
        cameraAngleRef.current,
        cameraPitchRef.current,
        cameraDistanceRef.current
      );
      idealX = pose.position[0];
      idealY = pose.position[1];
      idealZ = pose.position[2];
      targetLookAtRef.current.set(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2]);
      posLambda = 9.0;
      lookLambda = 12.0;
    }

    // Frame-rate independent exponential damping: 1 - Math.exp(-lambda * delta)
    currentCamPos.current.x = exponentialDamp(currentCamPos.current.x, idealX, posLambda, delta);
    currentCamPos.current.y = exponentialDamp(currentCamPos.current.y, idealY, posLambda, delta);
    currentCamPos.current.z = exponentialDamp(currentCamPos.current.z, idealZ, posLambda, delta);

    camera.position.copy(currentCamPos.current);

    currentLookAt.current.x = exponentialDamp(
      currentLookAt.current.x,
      targetLookAtRef.current.x,
      lookLambda,
      delta
    );
    currentLookAt.current.y = exponentialDamp(
      currentLookAt.current.y,
      targetLookAtRef.current.y,
      lookLambda,
      delta
    );
    currentLookAt.current.z = exponentialDamp(
      currentLookAt.current.z,
      targetLookAtRef.current.z,
      lookLambda,
      delta
    );

    camera.lookAt(currentLookAt.current);
  });

  return null;
};

export const ClassroomCanvas: React.FC = () => {
  const cameraAngleRef = useRef<number>(0); // 0 = looking towards negative Z (toward classroom front from Z=8)
  const cameraPitchRef = useRef<number>(0.25); // Pitch angle
  const cameraDistanceRef = useRef<number>(6.8); // 3P chase distance (zoomable between 2.2 and 14.0)
  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPointerLocked, setIsPointerLocked] = React.useState<boolean>(false);

  const perspectiveMode = useClassroomStore((s) => s.perspectiveMode);

  // Auto-release pointer lock if any modal opens
  useEffect(() => {
    const unsub = useClassroomStore.subscribe((state) => {
      const isModalOpen =
        state.isMentorOpen ||
        (state as any).isFeynmanOpen ||
        (state as any).isAssessmentOpen;
      if (isModalOpen && document.pointerLockElement) {
        document.exitPointerLock();
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked =
        document.pointerLockElement !== null &&
        (document.pointerLockElement === containerRef.current ||
          document.pointerLockElement?.tagName === 'CANVAS');
      setIsPointerLocked(locked);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);

    const handleMouseDown = (e: MouseEvent) => {
      // Ignore clicks on UI overlay buttons
      if ((e.target as HTMLElement).closest('.ui-interactive')) return;

      const { perspectiveMode: currentMode, isMentorOpen, isFeynmanOpen, isAssessmentOpen } =
        useClassroomStore.getState() as any;
      const isModalOpen = isMentorOpen || isFeynmanOpen || isAssessmentOpen;

      if (currentMode === '1st_person' && !isModalOpen) {
        // Request pointer lock on canvas click in 1P mode for FPS mouselook
        if (document.pointerLockElement === null && containerRef.current) {
          try {
            containerRef.current.requestPointerLock();
          } catch (_) {}
        }
      }

      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { perspectiveMode: currentMode, isMentorOpen, isFeynmanOpen, isAssessmentOpen } =
        useClassroomStore.getState() as any;
      const isModalOpen = isMentorOpen || isFeynmanOpen || isAssessmentOpen;

      if (currentMode === '1st_person') {
        const isLocked = document.pointerLockElement !== null;
        // In 1st person: moving mouse directly controls camera (FPP game style)
        if (isLocked || (isDragging.current && !isModalOpen)) {
          const dx = isLocked && e.movementX !== undefined ? e.movementX : e.clientX - lastMousePos.current.x;
          const dy = isLocked && e.movementY !== undefined ? e.movementY : e.clientY - lastMousePos.current.y;
          lastMousePos.current = { x: e.clientX, y: e.clientY };

          const sensitivity = 0.0022;
          cameraAngleRef.current -= dx * sensitivity;
          cameraPitchRef.current = THREE.MathUtils.clamp(
            cameraPitchRef.current + dy * sensitivity,
            -1.4, // Look up (~80 deg)
            1.4   // Look down (~80 deg)
          );
        }
        return;
      }

      // 3rd Person Perspective Orbit Controls (when dragging)
      if (!isDragging.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      const minPitch = -0.2;
      const maxPitch = 0.75;

      // Orbit sensitivity
      cameraAngleRef.current -= dx * 0.005;
      cameraPitchRef.current = THREE.MathUtils.clamp(
        cameraPitchRef.current + dy * 0.004,
        minPitch,
        maxPitch
      );
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('.ui-interactive')) return;
      const { perspectiveMode: currentMode, setPerspectiveMode } = useClassroomStore.getState();
      const zoomDelta = e.deltaY * 0.005;

      if (currentMode === '1st_person') {
        // Scrolling backward pulls camera out into 3P mode
        if (e.deltaY > 0) {
          cameraDistanceRef.current = 3.5;
          setPerspectiveMode('3rd_person');
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
        }
      } else {
        const newDist = cameraDistanceRef.current + zoomDelta;
        // Zooming in past threshold enters 1P mode seamlessly
        if (newDist <= 2.2) {
          cameraDistanceRef.current = 2.2;
          setPerspectiveMode('1st_person');
          try {
            containerRef.current?.requestPointerLock();
          } catch (_) {}
        } else {
          cameraDistanceRef.current = THREE.MathUtils.clamp(newDist, 2.2, 14.0);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'KeyV' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        const { perspectiveMode: currentMode, setPerspectiveMode } = useClassroomStore.getState();
        if (currentMode === '1st_person') {
          cameraDistanceRef.current = 6.8;
          setPerspectiveMode('3rd_person');
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
        } else {
          setPerspectiveMode('1st_person');
          try {
            containerRef.current?.requestPointerLock();
          } catch (_) {}
        }
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="canvas-container" ref={containerRef}>
      <Canvas
        camera={{ position: [0, 3, 15], fov: 60, near: 0.1, far: 250 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        shadows
      >
        <Lighting />
        <CameraFollower
          cameraAngleRef={cameraAngleRef}
          cameraPitchRef={cameraPitchRef}
          cameraDistanceRef={cameraDistanceRef}
          isDraggingRef={isDragging}
        />
        <ClassroomCampus />
        <Avatar cameraAngleRef={cameraAngleRef} />

        <CentralDais />
        <Archways />
        <StackLabWing />
        <ArrayLabWing />
        <LinkedListLab />
        <RecursionLabWing />
        <TreeLabWing />
      </Canvas>

      {/* First-Person Perspective (FPP) Reticle & Mouselook HUD Overlay */}
      {perspectiveMode === '1st_person' && (
        <div className="fpp-overlay-container">
          <div className="fpp-reticle" />
          {!isPointerLocked && (
            <div className="fpp-pointer-hint">
              <span className="fpp-icon">🎯</span>
              <span>Click to lock mouse look</span>
              <span className="fpp-kbd">[ESC] unlock</span>
              <span className="fpp-kbd">[V] 3P Mode</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

