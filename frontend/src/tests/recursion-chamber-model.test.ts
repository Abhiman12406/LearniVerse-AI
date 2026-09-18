import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createRecursionChamberModel } from '../assets/3d/createRecursionChamberModel';

describe('createRecursionChamberModel (Procedural 3D Recursion Elevator Apparatus)', () => {
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

  it('instantiates complete procedural Recursion Chamber rig matching blueprint architecture', () => {
    const rig = createRecursionChamberModel({
      maxDepth: 5,
      initialFrames: [
        { id: 'f3', n: 3, callLabel: 'f(3)', argValue: 3, returnValue: null, status: 'active' },
        { id: 'f2', n: 2, callLabel: 'f(2)', argValue: 2, returnValue: null, status: 'active' },
        { id: 'f1', n: 1, callLabel: 'f(1)', argValue: 1, returnValue: null, status: 'base_case' },
      ],
    });

    expect(rig.group).toBeInstanceOf(THREE.Group);
    expect(rig.group.name).toBe('RecursionChamberApparatus');

    // 1. Verify Base Plinth (Dark foot, ivory/cream rim, oak wood deck)
    const plinth = rig.group.getObjectByName('BasePlinth');
    expect(plinth).toBeDefined();
    expect(plinth?.children.length).toBeGreaterThanOrEqual(3);

    // 2. Verify Base Case Pedestal Platform
    const pedestal = rig.group.getObjectByName('BaseCasePedestal');
    expect(pedestal).toBeDefined();
    const baseCasePad = pedestal?.getObjectByName('BaseCasePad');
    expect(baseCasePad).toBeDefined();

    // 3. Verify Elevator Tower Frame with 4 pillars, top tie beams, and X-braces
    const tower = rig.group.getObjectByName('ElevatorTowerFrame');
    expect(tower).toBeDefined();
    expect(tower?.getObjectByName('Pillar_0')).toBeDefined();
    expect(tower?.getObjectByName('Pillar_1')).toBeDefined();
    expect(tower?.getObjectByName('Pillar_2')).toBeDefined();
    expect(tower?.getObjectByName('Pillar_3')).toBeDefined();

    // 4. Verify Twin Luminous Energy Conduits (Cyan & Gold)
    const conduits = rig.group.getObjectByName('EnergyConduits');
    expect(conduits).toBeDefined();
    expect(conduits?.getObjectByName('CyanConduit')).toBeDefined();
    expect(conduits?.getObjectByName('GoldConduit')).toBeDefined();

    // 5. Verify Upward Return Light Beam
    const returnBeam = rig.group.getObjectByName('ReturnLightBeam');
    expect(returnBeam).toBeDefined();
    expect(rig.group.getObjectByName('ReturnLightBeamCore')).toBeDefined();

    // 6. Verify Stack Overflow Emergency Beacon & HUD Plate
    const overflowBeacon = rig.group.getObjectByName('StackOverflowBeacon');
    expect(overflowBeacon).toBeDefined();
    expect(overflowBeacon?.getObjectByName('BeaconDome')).toBeDefined();
    expect(overflowBeacon?.getObjectByName('BeaconLight')).toBeDefined();
    expect(overflowBeacon?.getObjectByName('WarningHUDPlate')).toBeDefined();

    // 7. Verify Call-Frame Platforms
    expect(rig.framesGroup).toBeDefined();
    expect(rig.framesGroup.children).toHaveLength(3);

    rig.dispose();
  });

  it('correctly stacks call-frame platforms with increasing Y elevation from base case', () => {
    const rig = createRecursionChamberModel({
      maxDepth: 5,
      initialFrames: [
        { id: 'f3', n: 3, callLabel: 'f(3)', argValue: 3, returnValue: null, status: 'active' },
        { id: 'f2', n: 2, callLabel: 'f(2)', argValue: 2, returnValue: null, status: 'active' },
        { id: 'f1', n: 1, callLabel: 'f(1)', argValue: 1, returnValue: null, status: 'base_case' },
      ],
    });

    const frames = rig.framesGroup.children;
    expect(frames).toHaveLength(3);

    // Platform 0 (f(3)) is highest, Platform 2 (f(1)) is nearest the base case
    // Slot Y positions: f(1) at slot 0 (~1.35), f(2) at slot 1 (~2.15), f(3) at slot 2 (~2.95)
    const yF3 = frames[0].position.y;
    const yF2 = frames[1].position.y;
    const yF1 = frames[2].position.y;

    expect(yF3).toBeGreaterThan(yF2);
    expect(yF2).toBeGreaterThan(yF1);
    expect(yF1).toBeGreaterThanOrEqual(1.2);

    rig.dispose();
  });

  it('simulates downward spring-damped telescoping when pushing a new recursive invocation', () => {
    const rig = createRecursionChamberModel({
      maxDepth: 5,
      initialFrames: [
        { id: 'f2', n: 2, callLabel: 'f(2)', argValue: 2, returnValue: null, status: 'active' },
        { id: 'f1', n: 1, callLabel: 'f(1)', argValue: 1, returnValue: null, status: 'base_case' },
      ],
    });

    expect(rig.framesGroup.children).toHaveLength(2);

    // Push new invocation f(3)
    rig.pushCallFrame(3, 'f(3)');
    expect(rig.framesGroup.children).toHaveLength(3);

    const newlySpawned = rig.framesGroup.children[rig.framesGroup.children.length - 1];
    const initialY = newlySpawned.position.y;
    expect(initialY).toBeGreaterThan(4.5); // Spawns above elevator crown

    // Step physics forward across animation frames
    for (let i = 0; i < 35; i++) {
      rig.update(0.032);
    }

    // Platform should have descended into its allocated slot
    expect(newlySpawned.position.y).toBeLessThan(initialY);
    expect(newlySpawned.position.y).toBeCloseTo(2.95, 0);

    rig.dispose();
  });

  it('activates upward return light beam and resolves frame values on return cascade', () => {
    const rig = createRecursionChamberModel({
      maxDepth: 5,
      initialFrames: [
        { id: 'f3', n: 3, callLabel: 'f(3)', argValue: 3, returnValue: null, status: 'active' },
        { id: 'f2', n: 2, callLabel: 'f(2)', argValue: 2, returnValue: null, status: 'active' },
        { id: 'f1', n: 1, callLabel: 'f(1)', argValue: 1, returnValue: null, status: 'base_case' },
      ],
    });

    const beamMat = (rig.returnBeam.material as THREE.MeshBasicMaterial);
    expect(beamMat.opacity).toBe(0.0);

    // Trigger return unwinding cascade
    rig.triggerReturnCascade();

    // Step physics forward
    for (let i = 0; i < 20; i++) {
      rig.update(0.032, { isUnwinding: true });
    }

    // Upward beam should now be luminous and active
    expect(beamMat.opacity).toBeGreaterThan(0.2);

    // Update with resolved frame return value
    rig.update(0.016, {
      frames: [
        { id: 'f3', n: 3, callLabel: 'f(3)', argValue: 3, returnValue: 6, status: 'resolved' },
        { id: 'f2', n: 2, callLabel: 'f(2)', argValue: 2, returnValue: 2, status: 'resolved' },
        { id: 'f1', n: 1, callLabel: 'f(1)', argValue: 1, returnValue: 1, status: 'resolved' },
      ],
      isUnwinding: true,
    });

    // Should not throw and maintain 3 resolved platforms
    expect(rig.framesGroup.children).toHaveLength(3);

    rig.dispose();
  });

  it('triggers emergency strobe warning and vibration tremor on Stack Overflow', () => {
    const rig = createRecursionChamberModel({ maxDepth: 4 });

    const towerFrame = rig.towerFrameGroup;
    expect(towerFrame.position.x).toBe(0);

    // Trigger stack overflow warning
    rig.triggerStackOverflow();

    for (let i = 0; i < 15; i++) {
      rig.update(0.032, { stackOverflow: true });
    }

    // Beacon light and HUD warning become active
    const beaconLight = rig.overflowBeacon.getObjectByName('BeaconLight') as THREE.PointLight;
    const warningPlate = rig.overflowBeacon.getObjectByName('WarningHUDPlate') as THREE.Mesh;
    const warningMat = warningPlate.material as THREE.MeshBasicMaterial;

    expect(warningMat.opacity).toBeGreaterThan(0.1);

    // Clear overflow and verify settling
    rig.clearStackOverflow();
    for (let i = 0; i < 30; i++) {
      rig.update(0.032, { stackOverflow: false });
    }

    expect(warningMat.opacity).toBeLessThan(0.2);
    expect(beaconLight.intensity).toBe(0);

    rig.dispose();
  });

  it('supports popCallFrame and complete reset without throwing or leaking', () => {
    const rig = createRecursionChamberModel({
      maxDepth: 5,
      initialFrames: [
        { id: 'f3', n: 3, callLabel: 'f(3)', argValue: 3, returnValue: null, status: 'active' },
        { id: 'f2', n: 2, callLabel: 'f(2)', argValue: 2, returnValue: null, status: 'active' },
        { id: 'f1', n: 1, callLabel: 'f(1)', argValue: 1, returnValue: null, status: 'base_case' },
      ],
    });

    expect(rig.framesGroup.children).toHaveLength(3);

    // Pop top frame
    rig.popCallFrame();
    expect(rig.framesGroup.children).toHaveLength(2);

    // Reset restores initial 3 frames
    rig.reset();
    expect(rig.framesGroup.children).toHaveLength(3);

    // Dispose cleans up all children and resources
    rig.dispose();
    expect(rig.framesGroup.children).toHaveLength(0);
    expect(rig.group.children).toHaveLength(0);
  });
});
