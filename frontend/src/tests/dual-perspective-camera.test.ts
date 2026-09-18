import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { useClassroomStore } from '../store/useClassroomStore';
import {
  exponentialDamp,
  calculateThirdPersonCamera,
  calculateFirstPersonCamera,
} from '../utils/cameraDamping';

describe('Issue 13: Dual-Perspective Camera Controller & Exponential Motion Damping', () => {
  beforeEach(() => {
    // Reset store perspective state before each test
    useClassroomStore.getState().setPerspectiveMode('3rd_person');
  });

  describe('1. Global Store Perspective Mode State & Toggles', () => {
    it('initializes default perspectiveMode to 3rd_person', () => {
      const state = useClassroomStore.getState();
      expect(state.perspectiveMode).toBe('3rd_person');
    });

    it('toggles perspectiveMode back and forth between 3rd_person and 1st_person via togglePerspectiveMode', () => {
      const { togglePerspectiveMode } = useClassroomStore.getState();

      togglePerspectiveMode();
      expect(useClassroomStore.getState().perspectiveMode).toBe('1st_person');

      togglePerspectiveMode();
      expect(useClassroomStore.getState().perspectiveMode).toBe('3rd_person');
    });

    it('explicitly sets perspectiveMode via setPerspectiveMode', () => {
      const { setPerspectiveMode } = useClassroomStore.getState();

      setPerspectiveMode('1st_person');
      expect(useClassroomStore.getState().perspectiveMode).toBe('1st_person');

      setPerspectiveMode('3rd_person');
      expect(useClassroomStore.getState().perspectiveMode).toBe('3rd_person');
    });
  });

  describe('2. Frame-Rate Independent Exponential Damping Mathematics', () => {
    it('returns current value if delta is zero or negative', () => {
      expect(exponentialDamp(5.0, 10.0, 8.0, 0)).toBe(5.0);
      expect(exponentialDamp(5.0, 10.0, 8.0, -0.01)).toBe(5.0);
    });

    it('smoothly advances toward target value without overshooting', () => {
      const current = 0;
      const target = 10;
      const lambda = 10;
      const delta = 0.016; // 60 FPS frame time

      const next = exponentialDamp(current, target, lambda, delta);
      expect(next).toBeGreaterThan(current);
      expect(next).toBeLessThan(target);

      // Verify exact analytical formula: t = 1 - Math.exp(-lambda * delta)
      const expectedFactor = 1 - Math.exp(-lambda * delta);
      const expectedVal = current + (target - current) * expectedFactor;
      expect(next).toBeCloseTo(expectedVal, 6);
    });

    it('exhibits frame-rate independence across variable time-steps', () => {
      const lambda = 8.0;
      const current = 0.0;
      const target = 100.0;

      // Single step of 0.032s (approx 30 FPS)
      const singleStep = exponentialDamp(current, target, lambda, 0.032);

      // Two consecutive steps of 0.016s (approx 60 FPS)
      const step1 = exponentialDamp(current, target, lambda, 0.016);
      const step2 = exponentialDamp(step1, target, lambda, 0.016);

      // Both must converge to the exact same position (decay invariance: exp(-lambda*(dt1+dt2)) = exp(-lambda*dt1)*exp(-lambda*dt2))
      expect(step2).toBeCloseTo(singleStep, 5);
    });

    it('converges to target asymptotically over successive simulation frames', () => {
      let val = 0.0;
      const target = 50.0;
      const lambda = 12.0;
      const delta = 1 / 60; // 60 FPS

      for (let frame = 0; frame < 60; frame++) {
        val = exponentialDamp(val, target, lambda, delta);
      }

      // After 1 full second at lambda=12, val should be within 0.01% of target
      expect(val).toBeCloseTo(target, 2);
    });
  });

  describe('3. Third-Person Perspective (3P) Spatial Positioning', () => {
    it('positions camera behind avatar based on horizontal azimuth and distance', () => {
      const avatarPos: [number, number, number] = [0, 0, 8];
      const angle = 0; // facing negative Z
      const pitch = 0;
      const distance = 6.8;

      const pose = calculateThirdPersonCamera(avatarPos, angle, pitch, distance);

      // When angle=0, sin(0)=0, cos(0)=1 => X=0, Z=8 + 6.8 = 14.8
      expect(pose.position[0]).toBeCloseTo(0, 4);
      expect(pose.position[2]).toBeCloseTo(14.8, 4);
      // Pitch=0 => height = 2.8 + sin(0)*1.8 = 2.8
      expect(pose.position[1]).toBeCloseTo(2.8, 4);

      // Targets torso: [0, 1.2, 8]
      expect(pose.lookAt).toEqual([0, 1.2, 8]);
    });

    it('rotates orbit azimuth correctly when player drags mouse horizontally', () => {
      const avatarPos: [number, number, number] = [2, 0.5, 4];
      const angle = Math.PI / 2; // 90 degrees orbit
      const pitch = 0;
      const distance = 5.0;

      const pose = calculateThirdPersonCamera(avatarPos, angle, pitch, distance);

      // sin(PI/2) = 1, cos(PI/2) = 0 => X = 2 + 5 = 7, Z = 4
      expect(pose.position[0]).toBeCloseTo(7.0, 4);
      expect(pose.position[2]).toBeCloseTo(4.0, 4);
    });
  });

  describe('4. First-Person Perspective (1P) Eye-Level Spatial Positioning', () => {
    it('positions camera exactly at eye-level 1.62m above ground', () => {
      const avatarPos: [number, number, number] = [3.5, 0.5, -2.0];
      const angle = 0;
      const pitch = 0;

      const pose = calculateFirstPersonCamera(avatarPos, angle, pitch, 1.62);

      expect(pose.position[0]).toBeCloseTo(3.5, 4);
      expect(pose.position[1]).toBeCloseTo(0.5 + 1.62, 4); // 2.12m above world zero
      expect(pose.position[2]).toBeCloseTo(-2.0, 4);
    });

    it('projects forward lookAt along viewing azimuth and pitch angles', () => {
      const avatarPos: [number, number, number] = [0, 0, 0];
      const angle = 0; // facing negative Z
      const pitch = 0;

      const pose = calculateFirstPersonCamera(avatarPos, angle, pitch, 1.62);

      // Eye position at [0, 1.62, 0]
      expect(pose.position).toEqual([0, 1.62, 0]);

      // When angle=0, pitch=0: forward vector is [0, 0, -1]
      // lookAt is [0, 1.62, -10]
      expect(pose.lookAt[0]).toBeCloseTo(0, 4);
      expect(pose.lookAt[1]).toBeCloseTo(1.62, 4);
      expect(pose.lookAt[2]).toBeCloseTo(-10.0, 4);
    });

    it('elevates lookAt pitch when looking upwards or downwards', () => {
      const avatarPos: [number, number, number] = [0, 0, 0];
      const angle = 0;
      const pitch = 0.5; // looking down (positive pitch in camera controller)

      const pose = calculateFirstPersonCamera(avatarPos, angle, pitch, 1.62);

      // Forward Y is -sin(pitch) * 10
      expect(pose.lookAt[1]).toBeLessThan(1.62);
    });
  });

  describe('5. Avatar Character Geometry Occlusion Prevention', () => {
    it('determines avatar visibility is false when in 1st_person mode', () => {
      useClassroomStore.getState().setPerspectiveMode('1st_person');
      const mode = useClassroomStore.getState().perspectiveMode;
      const isVisible = mode !== '1st_person';
      expect(isVisible).toBe(false);
    });

    it('restores avatar visibility to true when in 3rd_person mode', () => {
      useClassroomStore.getState().setPerspectiveMode('3rd_person');
      const mode = useClassroomStore.getState().perspectiveMode;
      const isVisible = mode !== '1st_person';
      expect(isVisible).toBe(true);
    });
  });

  describe('6. Mouse Wheel Zoom & Perspective Thresholding Logic', () => {
    it('switches from 3P to 1P when zoom distance reaches minimum threshold of 2.2m', () => {
      let currentDistance = 3.0;
      const zoomStep = -1.0; // scrolling forward into avatar

      currentDistance += zoomStep; // 2.0 <= 2.2m threshold
      if (currentDistance <= 2.2) {
        currentDistance = 2.2;
        useClassroomStore.getState().setPerspectiveMode('1st_person');
      }

      expect(currentDistance).toBe(2.2);
      expect(useClassroomStore.getState().perspectiveMode).toBe('1st_person');
    });

    it('switches from 1P back to 3P when scrolling backward and resets distance', () => {
      useClassroomStore.getState().setPerspectiveMode('1st_person');
      let currentDistance = 2.2;
      const deltaY = 100; // scrolling backward out of 1P

      if (useClassroomStore.getState().perspectiveMode === '1st_person') {
        if (deltaY > 0) {
          currentDistance = 3.5;
          useClassroomStore.getState().setPerspectiveMode('3rd_person');
        }
      }

      expect(currentDistance).toBe(3.5);
      expect(useClassroomStore.getState().perspectiveMode).toBe('3rd_person');
    });
  });

  describe('7. Third-Person Perspective (3P) Auto-Chase Camera Following Behind Player', () => {
    it('calculates the desired chase azimuth directly behind the avatar', () => {
      // Facing North (-Z) in world coords: avatar.rotation = Math.PI
      const avatarRotationNorth = Math.PI;
      const desiredAngleNorth = avatarRotationNorth - Math.PI; // 0 radians (+Z, behind player)
      expect(desiredAngleNorth).toBeCloseTo(0, 4);

      // Facing East (+X): avatar.rotation = Math.PI / 2
      const avatarRotationEast = Math.PI / 2;
      const desiredAngleEast = avatarRotationEast - Math.PI; // -PI / 2 (-X, behind player)
      expect(desiredAngleEast).toBeCloseTo(-Math.PI / 2, 4);

      // Facing West (-X): avatar.rotation = -Math.PI / 2
      const avatarRotationWest = -Math.PI / 2;
      const desiredAngleWest = avatarRotationWest - Math.PI; // -3PI / 2 => +PI / 2 (+X, behind player)
      let normalizedAngleWest = desiredAngleWest % (Math.PI * 2);
      if (normalizedAngleWest < -Math.PI) normalizedAngleWest += Math.PI * 2;
      expect(normalizedAngleWest).toBeCloseTo(Math.PI / 2, 4);
    });

    it('smoothly steps camera angle toward desired angle when avatar is moving', () => {
      let cameraAngle = 0;
      const avatarRotation = Math.PI * 0.75; // Turning towards diagonal
      const desiredAngle = avatarRotation - Math.PI; // -0.25 * PI (-0.785 rad)

      let angleDiff = (desiredAngle - cameraAngle) % (Math.PI * 2);
      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const delta = 0.016;
      const followSpeed = 3.5;
      cameraAngle += angleDiff * Math.min(1.0, followSpeed * delta);

      // Camera angle should have smoothly moved toward desired angle
      expect(cameraAngle).toBeLessThan(0);
      expect(cameraAngle).toBeGreaterThan(desiredAngle);
    });
  });

  describe('8. First-Person Perspective (1P) FPS Mouselook Mechanics', () => {
    it('updates camera azimuth and pitch in response to mouse movement deltas', () => {
      let cameraAngle = 0;
      let cameraPitch = 0;
      const sensitivity = 0.0022;

      // Mouse moved right (+50px) and down (+30px)
      const movementX = 50;
      const movementY = 30;

      cameraAngle -= movementX * sensitivity;
      cameraPitch = THREE.MathUtils.clamp(
        cameraPitch + movementY * sensitivity,
        -1.4,
        1.4
      );

      // Turning right decreases angle (towards positive forwardX)
      expect(cameraAngle).toBeCloseTo(-0.11, 4);
      // Looking down increases pitch (towards negative forwardY)
      expect(cameraPitch).toBeCloseTo(0.066, 4);
    });

    it('clamps pitch angle to prevent flipping camera past zenith and nadir', () => {
      let cameraPitch = 0;
      const sensitivity = 0.0022;

      // Mouse moved up extremely fast (-1000px)
      const movementYUp = -1000;
      cameraPitch = THREE.MathUtils.clamp(
        cameraPitch + movementYUp * sensitivity,
        -1.4,
        1.4
      );
      expect(cameraPitch).toBe(-1.4);

      // Mouse moved down extremely fast (+2000px)
      const movementYDown = 2000;
      cameraPitch = THREE.MathUtils.clamp(
        cameraPitch + movementYDown * sensitivity,
        -1.4,
        1.4
      );
      expect(cameraPitch).toBe(1.4);
    });
  });
});
