import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createStackTowerModel } from '../assets/3d/createStackTowerModel';

describe('createStackTowerModel (Procedural 3D Stack LIFO Apparatus)', () => {
  beforeEach(() => {
    // Mock 2D canvas context for JSDOM
    HTMLCanvasElement.prototype.getContext = (() => ({
      fillRect: () => {},
      clearRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      arc: () => {},
      fill: () => {},
      fillText: () => {},
      measureText: () => ({ width: 100 }),
    })) as any;
  });

  it('instantiates complete procedural Stack Tower rig with authentic blueprint hierarchy', () => {
    const rig = createStackTowerModel({
      capacity: 6,
      initialDiscs: [
        { id: 'd1', value: 10 },
        { id: 'd2', value: 20 },
      ],
    });

    expect(rig.group).toBeInstanceOf(THREE.Group);
    expect(rig.group.name).toBe('StackTowerApparatus');

    // 1. Verify Base Plinth (Oak wood plinth with cream bevel lip)
    const basePlinth = rig.group.getObjectByName('BasePlinth');
    expect(basePlinth).toBeDefined();
    expect(basePlinth?.children.length).toBeGreaterThanOrEqual(3);

    // 2. Verify Acrylic Gearbox with "POP" plate & sliding horizontal brass piston
    const gearbox = rig.group.getObjectByName('AcrylicGearbox');
    expect(gearbox).toBeDefined();
    const piston = gearbox?.getObjectByName('PistonActuator');
    expect(piston).toBeDefined();

    // 3. Verify Brushed Brass Control Console with dual dials & level meter
    const consoleGroup = rig.group.getObjectByName('ControlConsole');
    expect(consoleGroup).toBeDefined();
    expect(consoleGroup?.children.length).toBeGreaterThanOrEqual(4);

    // 4. Verify Cylinder Tower & 4 Outer Guide Rods
    const cylinderTower = rig.group.getObjectByName('CylinderTower');
    expect(cylinderTower).toBeDefined();
    expect(cylinderTower?.children.length).toBeGreaterThanOrEqual(6);

    // 5. Verify Top Funnel ("PUSH ↓")
    const topFunnel = rig.group.getObjectByName('TopFunnel');
    expect(topFunnel).toBeDefined();

    // 6. Verify Stack Index Scale (0..4)
    const indexScale = rig.group.getObjectByName('StackIndexScale');
    expect(indexScale).toBeDefined();
    expect(indexScale?.children.length).toBeGreaterThanOrEqual(10); // 5 ticks + 5 numbers

    // Clean up
    rig.dispose();
  });

  it('populates initial data discs with correct vertical positioning and top disc topper', () => {
    const rig = createStackTowerModel({
      capacity: 6,
      initialDiscs: [
        { id: 'disc-1', value: 10 },
        { id: 'disc-2', value: 25 },
        { id: 'disc-3', value: 42 },
      ],
    });

    expect(rig.discsGroup.children).toHaveLength(3);

    // Discs should be placed at increasing Y heights
    const y0 = rig.discsGroup.children[0].position.y;
    const y1 = rig.discsGroup.children[1].position.y;
    const y2 = rig.discsGroup.children[2].position.y;

    expect(y1).toBeGreaterThan(y0);
    expect(y2).toBeGreaterThan(y1);

    rig.dispose();
  });

  it('simulates smooth vertical translation for newly pushed discs dropping into the funnel', () => {
    const rig = createStackTowerModel({
      capacity: 6,
      initialDiscs: [{ id: 'd1', value: 10 }],
    });

    expect(rig.discsGroup.children).toHaveLength(1);

    // Push new disc (d2)
    const updatedDiscs = [
      { id: 'd1', value: 10 },
      { id: 'd2', value: 35 },
    ];

    // First update step: d2 spawns above at y >= 4.0
    rig.update(0.016, updatedDiscs);
    expect(rig.discsGroup.children).toHaveLength(2);

    const newDiscMesh = rig.discsGroup.children[1];
    const initialSpawnY = newDiscMesh.position.y;
    expect(initialSpawnY).toBeGreaterThan(3.5);

    // Step physics forward across multiple frames
    for (let i = 0; i < 30; i++) {
      rig.update(0.032, updatedDiscs);
    }

    // Disc should have descended into cylinder toward target resting Y
    expect(newDiscMesh.position.y).toBeLessThan(initialSpawnY);
    expect(newDiscMesh.position.y).toBeCloseTo(1.7, 0);

    rig.dispose();
  });

  it('executes pop ejection animation and horizontal piston recoil on disc removal', () => {
    const rig = createStackTowerModel({
      capacity: 6,
      initialDiscs: [
        { id: 'd1', value: 10 },
        { id: 'd2', value: 20 },
      ],
    });

    // Pop the top disc (d2)
    const poppedDiscs = [{ id: 'd1', value: 10 }];

    // Trigger update on pop
    rig.update(0.016, poppedDiscs);

    // The popped disc transitions to ejecting state with upward launch velocity
    expect(rig.discsGroup.children).toHaveLength(2); // Still exists while animating ejection

    // Run physics until ejection completes
    for (let i = 0; i < 40; i++) {
      rig.update(0.04, poppedDiscs);
    }

    // After animation fades, only d1 remains in scene
    expect(rig.discsGroup.children).toHaveLength(1);

    rig.dispose();
  });

  it('triggers manual push and pop animations via rig methods', () => {
    const rig = createStackTowerModel({ capacity: 6 });

    // Calling triggers should not throw
    expect(() => rig.triggerPush(99)).not.toThrow();
    expect(() => rig.triggerPop()).not.toThrow();
    expect(() => rig.setHighlightTop(true)).not.toThrow();

    rig.dispose();
  });

  it('cleans up all resources thoroughly on dispose()', () => {
    const rig = createStackTowerModel({
      capacity: 6,
      initialDiscs: [
        { id: 'd1', value: 10 },
        { id: 'd2', value: 20 },
        { id: 'd3', value: 30 },
      ],
    });

    expect(rig.discsGroup.children.length).toBe(3);

    // Calling dispose should empty discsGroup and clean textures/geometries
    rig.dispose();
    expect(rig.discsGroup.children.length).toBe(0);
  });
});
