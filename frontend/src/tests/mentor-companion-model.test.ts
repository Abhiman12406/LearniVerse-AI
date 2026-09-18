import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  createMentorCompanionModel,
  MentorCompanionModelRig,
} from '../assets/3d/createMentorCompanionModel';

describe('Friendly Mentor Companion Bot 3D Model & Interaction Rig', () => {
  beforeEach(() => {
    // Mock 2D canvas context for JSDOM
    HTMLCanvasElement.prototype.getContext = (() => ({
      fillRect: () => {},
      clearRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      bezierCurveTo: () => {},
      ellipse: () => {},
      stroke: () => {},
      arc: () => {},
      fill: () => {},
      fillText: () => {},
      measureText: () => ({ width: 100 }),
    })) as any;
  });

  it('instantiates complete Three.js procedural hierarchy based on mentor_bot.png blueprint', () => {
    const rig: MentorCompanionModelRig = createMentorCompanionModel({
      initialExpression: 'happy',
      isRemedial: false,
    });

    expect(rig.group).toBeInstanceOf(THREE.Group);
    expect(rig.group.name).toBe('MentorCompanionBot');

    // Pedestal plinth base
    expect(rig.pedestalGroup).toBeInstanceOf(THREE.Group);
    expect(rig.pedestalGroup.children.length).toBeGreaterThanOrEqual(4);

    // Floating hover rings
    expect(rig.hoverRingsGroup).toBeInstanceOf(THREE.Group);
    expect(rig.hoverRingsGroup.children.length).toBe(2);

    // Floating body and flank panels
    expect(rig.floatingBodyGroup).toBeInstanceOf(THREE.Group);
    expect(rig.floatingBodyGroup.children.length).toBeGreaterThanOrEqual(4);

    // Head assembly and visor
    expect(rig.headGroup).toBeInstanceOf(THREE.Group);
    expect(rig.headGroup.children.length).toBeGreaterThanOrEqual(4);

    // Coiled gooseneck antenna and light
    expect(rig.antennaGroup).toBeInstanceOf(THREE.Group);
    expect(rig.antennaLight).toBeInstanceOf(THREE.PointLight);
    expect(rig.antennaLight.color.getHexString()).toBe('f59e0b');

    rig.dispose();
  });

  it('manages facial expression states and canvas texture updates', () => {
    const rig = createMentorCompanionModel({ initialExpression: 'happy' });

    expect(rig.getExpression()).toBe('happy');

    rig.setExpression('curious');
    expect(rig.getExpression()).toBe('curious');

    rig.setExpression('blink');
    expect(rig.getExpression()).toBe('blink');

    rig.setExpression('talking');
    expect(rig.getExpression()).toBe('talking');

    rig.setExpression('remedial');
    expect(rig.getExpression()).toBe('remedial');

    rig.dispose();
  });

  it('animates idle hover bobbing, ring rotation, and antenna pulse during delta updates', () => {
    const rig = createMentorCompanionModel();

    const initialBodyY = rig.floatingBodyGroup.position.y;
    const initialRingY = rig.hoverRingsGroup.position.y;
    const initialLightIntensity = rig.antennaLight.intensity;

    // Simulate 0.5 seconds of game time
    rig.update(0.5);

    // Body bob position oscillates
    expect(rig.floatingBodyGroup.position.y).not.toBe(initialBodyY);
    expect(rig.floatingBodyGroup.position.y).toBeGreaterThan(0.35);
    expect(rig.floatingBodyGroup.position.y).toBeLessThan(0.50);

    // Hover rings oscillate
    expect(rig.hoverRingsGroup.position.y).not.toBe(initialRingY);

    // Antenna light pulses
    expect(rig.antennaLight.intensity).not.toBe(initialLightIntensity);
    expect(rig.antennaLight.intensity).toBeGreaterThan(0.8);
    expect(rig.antennaLight.intensity).toBeLessThan(2.0);

    rig.dispose();
  });

  it('tracks student avatar with smooth head yaw and pitch when within proximity', () => {
    const rig = createMentorCompanionModel();
    rig.group.position.set(-2.0, 0.98, -3.2);

    // Initially head yaw and pitch are 0
    expect(rig.headGroup.rotation.y).toBe(0);
    expect(rig.headGroup.rotation.x).toBe(0);

    // Target avatar approaches to the front-right of the bot: (-1.0, 0, -2.0)
    // Relative: dx = 1.0, dz = 1.2 -> target angle ~0.69 rad
    for (let i = 0; i < 15; i++) {
      rig.update(0.05, {
        targetPosition: [-1.0, 0, -2.0],
        isNear: true,
      });
    }

    // Head should have turned toward avatar (positive yaw)
    expect(rig.headGroup.rotation.y).toBeGreaterThan(0.2);
    expect(Math.abs(rig.headGroup.rotation.y)).toBeLessThanOrEqual(1.2); // within clamped bounds

    // Move avatar to the left: (-3.5, 0, -2.0)
    for (let i = 0; i < 30; i++) {
      rig.update(0.05, {
        targetPosition: [-3.5, 0, -2.0],
        isNear: true,
      });
    }

    // Head should have turned toward left (negative yaw)
    expect(rig.headGroup.rotation.y).toBeLessThan(0);
    expect(Math.abs(rig.headGroup.rotation.y)).toBeLessThanOrEqual(1.2);

    // Move avatar out of range
    for (let i = 0; i < 30; i++) {
      rig.update(0.05, {
        targetPosition: [10.0, 0, 10.0],
        isNear: false,
      });
    }

    // Head yaw returns toward 0
    expect(Math.abs(rig.headGroup.rotation.y)).toBeLessThan(0.05);

    rig.dispose();
  });

  it('adapts visual glow themes dynamically between cyan normal and violet remedial focus', () => {
    const rig = createMentorCompanionModel({ isRemedial: false });

    // Update with remedial focus active
    rig.update(0.1, { isRemedial: true });

    // Reverts gracefully when normal
    rig.update(0.1, { isRemedial: false });

    rig.dispose();
  });

  it('properly disposes all geometries, materials, and textures', () => {
    const rig = createMentorCompanionModel();
    expect(() => rig.dispose()).not.toThrow();
  });
});
