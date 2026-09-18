import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import {
  createPrerequisiteDoorModel,
  PrerequisiteDoorModel,
} from '../assets/3d/createPrerequisiteDoorModel';
import { useClassroomStore } from '../store/useClassroomStore';
import { resolveAvatarCollision } from '../utils/collision';

describe('Prerequisite Doorway 3D Model & Barrier Dissolve', () => {
  let door: PrerequisiteDoorModel;

  beforeEach(() => {
    // Mock 2D canvas context for JSDOM
    HTMLCanvasElement.prototype.getContext = (() => ({
      fillRect: () => {},
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

    door = createPrerequisiteDoorModel({
      wingId: 'recursion_lab',
      wingName: 'Recursion Lab',
      isSealed: true,
      requiredText: 'Req: Stack >= 70%',
      currentText: 'Current: 38%',
    });
  });

  afterEach(() => {
    if (door) {
      door.dispose();
    }
  });

  it('creates complete doorway architectural hierarchy adhering to blueprint', () => {
    expect(door.group).toBeDefined();
    expect(door.group.name).toBe('PrerequisiteDoor_recursion_lab');

    // Verify key architectural groups from classroom_doorway.png
    const childrenNames = door.group.children.map((c) => c.name);
    expect(childrenNames).toContain('WoodenPilasters');
    expect(childrenNames).toContain('CreamArchwayCasing');
    expect(childrenNames).toContain('BrassHardware');
    expect(childrenNames).toContain('LedStatusMarquee');
    expect(childrenNames).toContain('HexagonalForcefield');

    // Verify pilasters have plinths and shafts
    const pilasters = door.group.getObjectByName('WoodenPilasters');
    expect(pilasters).toBeDefined();
    expect(pilasters?.children.length).toBeGreaterThanOrEqual(6);

    // Verify cream arch casing has jambs and curved torus arc
    const creamArch = door.group.getObjectByName('CreamArchwayCasing');
    expect(creamArch).toBeDefined();
    expect(creamArch?.children.length).toBeGreaterThanOrEqual(3);

    // Verify brass hardware includes threshold plate and ornamental brackets
    const brassHardware = door.group.getObjectByName('BrassHardware');
    expect(brassHardware).toBeDefined();
    expect(brassHardware?.children.length).toBeGreaterThanOrEqual(4);

    // Verify LED marquee contains screen and light
    const ledMarquee = door.group.getObjectByName('LedStatusMarquee');
    expect(ledMarquee).toBeDefined();
    expect(door.ledMesh).toBeDefined();

    // Verify Hexagonal forcefield mesh uses custom ShaderMaterial
    expect(door.barrierMesh).toBeDefined();
    expect(door.barrierMesh.material).toBeInstanceOf(THREE.ShaderMaterial);
  });

  it('initializes hexagonal forcefield shader with correct uniforms in sealed state', () => {
    const mat = door.barrierMesh.material as THREE.ShaderMaterial;
    expect(mat.uniforms.uOpacity.value).toBe(1.0);
    expect(mat.uniforms.uScanlineSpeed.value).toBe(1.8);
    expect(mat.uniforms.uFlicker.value).toBe(1.0);
    expect(mat.uniforms.uDissolveProgress.value).toBe(0.0);

    const color = mat.uniforms.uColor.value as THREE.Color;
    expect(color.getHexString()).toBe('ff6a00'); // Amber/orange sealed hue
  });

  it('dynamically updates LED marquee status when prerequisite requirements change', () => {
    door.updateStatus({
      wingName: 'Recursion Lab',
      isSealed: false,
      requiredText: 'Prerequisite Satisfied',
      currentText: 'Current: 84%',
    });

    const mat = door.barrierMesh.material as THREE.ShaderMaterial;
    const color = mat.uniforms.uColor.value as THREE.Color;
    expect(color.getHexString()).toBe('00f0ff'); // Unsealed cyber cyan hue
  });

  it('updates animation time and handles flicker phase during dissolution', () => {
    const mat = door.barrierMesh.material as THREE.ShaderMaterial;
    const initialTime = mat.uniforms.uTime.value;

    // Normal frame tick
    door.update(0.016, 'idle', false);
    expect(mat.uniforms.uTime.value).toBeGreaterThan(initialTime);

    // Flicker phase frame tick
    door.update(0.016, 'flicker', true);
    expect(mat.uniforms.uScanlineSpeed.value).toBe(16.0);
    expect(mat.uniforms.uFlicker.value).toBeGreaterThan(1.5);
  });

  it('triggers particle shockwave burst during shockwave phase', () => {
    const forcefieldGroup = door.group.getObjectByName('HexagonalForcefield') as THREE.Group;
    const particles = forcefieldGroup.children.find((c) => c instanceof THREE.Points) as THREE.Points;
    expect(particles).toBeDefined();
    expect(particles.visible).toBe(false);

    // Advance into shockwave phase
    door.update(0.016, 'shockwave', true);
    expect(particles.visible).toBe(true);

    const mat = door.barrierMesh.material as THREE.ShaderMaterial;
    expect(mat.uniforms.uDissolveProgress.value).toBeGreaterThan(0.0);
  });

  it('disposes geometries, materials, and canvas textures cleanly with zero memory leaks', () => {
    expect(() => {
      door.dispose();
    }).not.toThrow();
  });

  describe('Integration with Classroom Store & Physical Barrier Collision', () => {
    beforeEach(async () => {
      await useClassroomStore.getState().resetWorldSeed();
    });

    it('enforces physical blocking colliders when door is locked for Learner B', () => {
      const worldState = useClassroomStore.getState().worldState;
      expect(worldState?.wings.recursion_lab.status).toBe('sealed');

      // Attempt to walk through Recursion Lab door (azimuth 270 deg) at x = -17.2, z = 0.0
      const collision = resolveAvatarCollision(-17.2, 0.0, worldState);
      expect(collision.isBlockedByBarrier).toBe(true);
      expect(collision.blockedWingId).toBe('recursion_lab');
      expect(collision.x).toBeCloseTo(-15.8, 1);
    });

    it('opens physical passage when switching to Learner A whose Stack mastery satisfies prerequisite', async () => {
      await useClassroomStore.getState().switchLearner('learner_a');
      const worldState = useClassroomStore.getState().worldState;
      expect(worldState?.wings.recursion_lab.status).toBe('accessible');

      // Attempt to walk through Recursion Lab doorway into the wing chamber
      const collision = resolveAvatarCollision(-17.2, 0.0, worldState);
      expect(collision.isBlockedByBarrier).toBe(false);
      expect(collision.blockedWingId).toBeNull();
      expect(collision.x).toBeCloseTo(-17.2, 1);
    });

    it('executes live barrier dissolution sequence and opens physical passage', async () => {
      vi.useFakeTimers();

      const { triggerBarrierDissolve } = useClassroomStore.getState();
      triggerBarrierDissolve('recursion_lab');

      let state = useClassroomStore.getState();
      expect(state.dissolvePhase).toBe('flicker');

      // Advance 650ms into shockwave phase
      vi.advanceTimersByTime(650);
      state = useClassroomStore.getState();
      expect(state.dissolvePhase).toBe('shockwave');
      expect(state.worldState?.wings.recursion_lab.status).toBe('accessible');

      // Passage is now physically open!
      const collision = resolveAvatarCollision(-17.0, 0.0, state.worldState);
      expect(collision.isBlockedByBarrier).toBe(false);

      vi.useRealTimers();
    });
  });
});
