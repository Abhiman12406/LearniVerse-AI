import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createArrayStationModel } from '../assets/3d/createArrayStationModel';

describe('createArrayStationModel (Procedural 3D Array Station Apparatus)', () => {
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

  it('instantiates complete procedural Array Station rig with authentic blueprint hierarchy', () => {
    const rig = createArrayStationModel({
      capacity: 5,
      initialBays: [
        { index: 0, value: 10 },
        { index: 1, value: 20 },
        { index: 2, value: 30 },
        { index: 3, value: 40 },
        { index: 4, value: 50 },
      ],
    });

    expect(rig.group).toBeInstanceOf(THREE.Group);
    expect(rig.group.name).toBe('ArrayStationApparatus');

    // 1. Verify Oak Chassis (floor plinth, backboard, top beam, side support wings)
    const chassis = rig.group.getObjectByName('OakChassis');
    expect(chassis).toBeDefined();
    expect(chassis?.children.length).toBeGreaterThanOrEqual(4);

    // 2. Verify Dual Brass Guide Rails & Mount Brackets
    const rails = rig.group.getObjectByName('DualBrassRails');
    expect(rails).toBeDefined();
    const leftBracket = rails?.getObjectByName('LeftMountBracket');
    const rightBracket = rails?.getObjectByName('RightStepperBracket');
    expect(leftBracket).toBeDefined();
    expect(rightBracket).toBeDefined();

    // 3. Verify Sliding Probe Carriage & Mechanical Details
    const carriage = rig.group.getObjectByName('ProbeCarriage');
    expect(carriage).toBeDefined();
    const stepper = carriage?.getObjectByName('CarriageStepper');
    const gears = carriage?.getObjectByName('FrontSpurGears');
    const led = carriage?.getObjectByName('CarriageLedIndicator');
    const stylus = carriage?.getObjectByName('ProbeStylus');
    expect(stepper).toBeDefined();
    expect(gears).toBeDefined();
    expect(led).toBeDefined();
    expect(stylus).toBeDefined();

    // 4. Verify Probe Beam and Point Light
    const beamCore = stylus?.getObjectByName('ProbeBeamCore');
    const beamGlow = stylus?.getObjectByName('ProbeBeamGlow');
    const pointLight = stylus?.getObjectByName('ProbePointLight');
    expect(beamCore).toBeDefined();
    expect(beamGlow).toBeDefined();
    expect(pointLight).toBeDefined();

    // 5. Verify 5 Storage Bays with Data Cards & Brass Frames
    const baysGroup = rig.group.getObjectByName('StorageBays');
    expect(baysGroup).toBeDefined();
    expect(baysGroup?.children).toHaveLength(5);
    for (let i = 0; i < 5; i++) {
      const bay = baysGroup?.getObjectByName(`StorageBay_${i}`);
      expect(bay).toBeDefined();
      const cards = bay?.getObjectByName(`DataCards_${i}`);
      expect(cards).toBeDefined();
      const splash = bay?.getObjectByName(`SplashRing_${i}`);
      expect(splash).toBeDefined();
    }

    // 6. Verify 5 Physical Index Number Plaques mounted on backboard
    for (let i = 0; i < 5; i++) {
      const plaque = rig.group.getObjectByName(`IndexPlaque_${i}`);
      expect(plaque).toBeDefined();
      const ledDot = plaque?.getObjectByName(`LedDot_${i}`);
      expect(ledDot).toBeDefined();
    }

    rig.dispose();
  });

  it('simulates smooth carriage translation between indices during O(1) random access', () => {
    const rig = createArrayStationModel({ capacity: 5 });

    const initialX = rig.probeGroup.position.x;

    // Direct jump to index 4 (rightmost bay)
    rig.setTargetIndex(4, 'random');

    // First physics tick
    rig.update(0.016);
    // Carriage should have begun accelerating toward index 4 (positive X direction)
    const midX = rig.probeGroup.position.x;
    expect(midX).toBeGreaterThanOrEqual(initialX);

    // Advance physics across several frames to allow spring to settle
    for (let i = 0; i < 40; i++) {
      rig.update(0.032);
    }

    // Target X for index 4 with spacing 0.62 and center at (4 - 2)*0.62 = 1.24
    expect(rig.probeGroup.position.x).toBeCloseTo(1.24, 1);

    // Jump to index 0 (leftmost bay)
    rig.setTargetIndex(0, 'random');
    for (let i = 0; i < 40; i++) {
      rig.update(0.032);
    }
    // Target X for index 0 = (0 - 2)*0.62 = -1.24
    expect(rig.probeGroup.position.x).toBeCloseTo(-1.24, 1);

    rig.dispose();
  });

  it('updates carriage state and LED colors during sequential linear search scan', () => {
    const rig = createArrayStationModel({ capacity: 5 });

    // Step to index 1 during scan
    rig.triggerScanStep(1);
    rig.update(0.016, { isScanning: true, probeMode: 'linear' });

    const ledMesh = rig.probeGroup.getObjectByName('CarriageLedIndicator') as THREE.Mesh;
    const ledMat = ledMesh.material as THREE.MeshBasicMaterial;

    // During scanning, LED switches to cyan
    expect(ledMat.color.getHexString()).toBe('00f0ff');

    rig.dispose();
  });

  it('handles out-of-bounds error state with crimson LED alarm and limit shudder', () => {
    const rig = createArrayStationModel({ capacity: 5 });

    // Access out-of-bounds index 5
    rig.setTargetIndex(5, 'error');
    rig.triggerError('Index 5 out of bounds');

    rig.update(0.05, { isOutOfBounds: true, probeMode: 'error' });

    const ledMesh = rig.probeGroup.getObjectByName('CarriageLedIndicator') as THREE.Mesh;
    const ledMat = ledMesh.material as THREE.MeshBasicMaterial;

    // Error state turns LED red (#ef4444)
    expect(ledMat.color.getHexString()).toBe('ef4444');

    // Clearing error restores normal state
    rig.clearError();
    rig.update(0.05, { isOutOfBounds: false, probeMode: 'idle' });

    rig.dispose();
  });

  it('cleans up all resources thoroughly on dispose()', () => {
    const rig = createArrayStationModel({ capacity: 5 });
    expect(rig.group.children.length).toBeGreaterThan(0);

    rig.dispose();
    expect(rig.group.children.length).toBe(0);
  });
});
