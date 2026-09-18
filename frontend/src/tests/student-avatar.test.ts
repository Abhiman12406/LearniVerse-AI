import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { createStudentAvatar, StudentAvatarRig } from '../assets/3d/createStudentAvatar';

describe('Procedural 3D Student Avatar & Locomotion State Machine', () => {
  let avatar: StudentAvatarRig;

  beforeAll(() => {
    // Mock 2D canvas context for JSDOM headless testing
    HTMLCanvasElement.prototype.getContext = (() => ({
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      arc: () => {},
      ellipse: () => {},
      fill: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      clip: () => {},
      closePath: () => {},
      quadraticCurveTo: () => {},
    })) as any;
  });

  beforeEach(() => {
    avatar = createStudentAvatar();
  });

  afterEach(() => {
    if (avatar) {
      avatar.dispose();
    }
  });

  it('creates an articulated student character group matching canonical anatomy', () => {
    expect(avatar.characterGroup).toBeDefined();
    expect(avatar.characterGroup.name).toBe('StudentCharacter');
    expect(avatar.rootOffsetGroup).toBeDefined();
    expect(avatar.torsoGroup).toBeDefined();
    expect(avatar.headGroup).toBeDefined();
    expect(avatar.leftShoulderGroup).toBeDefined();
    expect(avatar.rightShoulderGroup).toBeDefined();
    expect(avatar.hipsGroup).toBeDefined();
    expect(avatar.leftLegGroup).toBeDefined();
    expect(avatar.rightLegGroup).toBeDefined();
    expect(avatar.backpackGroup).toBeDefined();
    expect(avatar.bookGroup).toBeDefined();
    expect(avatar.pencilGroup).toBeDefined();

    // Verify key accessory meshes exist in the hierarchy
    const names: string[] = [];
    avatar.characterGroup.traverse((child) => {
      if (child.name) names.push(child.name);
    });

    expect(names).toContain('Torso');
    expect(names).toContain('Head');
    expect(names).toContain('Hair');
    expect(names).toContain('Backpack');
    expect(names).toContain('Pencil');
    expect(names).toContain('RightShoulder');
    expect(names).toContain('LeftShoulder');
    expect(names).toContain('Textbook');
    expect(names).toContain('Hips');
    expect(names).toContain('LeftLeg');
    expect(names).toContain('RightLeg');
    expect(names).toContain('Sneaker');
  });

  it('executes idle breathing oscillations with steady rest posture', () => {
    // Run several idle frames
    for (let i = 0; i < 20; i++) {
      avatar.update(0.05, { isMoving: false });
    }

    // Torso should oscillate smoothly near Y = 1.25
    expect(avatar.torsoGroup.position.y).toBeGreaterThan(1.23);
    expect(avatar.torsoGroup.position.y).toBeLessThan(1.27);

    // In idle, legs should remain at vertical rest (near 0 rotation)
    expect(Math.abs(avatar.leftLegGroup.rotation.x)).toBeLessThan(0.05);
    expect(Math.abs(avatar.rightLegGroup.rotation.x)).toBeLessThan(0.05);

    // Torso lean should be zero in idle
    expect(Math.abs(avatar.torsoGroup.rotation.x)).toBeLessThan(0.02);
  });

  it('performs alternating leg strides and opposing arm swing during walk cycle', () => {
    // Step forward through walk cycle to peak stride
    let maxLeft = -Infinity;
    let minLeft = Infinity;
    let maxRightArm = -Infinity;

    for (let t = 0; t < 30; t++) {
      avatar.update(0.04, { isMoving: true, isSprinting: false });
      maxLeft = Math.max(maxLeft, avatar.leftLegGroup.rotation.x);
      minLeft = Math.min(minLeft, avatar.leftLegGroup.rotation.x);
      maxRightArm = Math.max(maxRightArm, avatar.rightShoulderGroup.rotation.x);
    }

    // Legs should swing forward and backward with natural amplitude (~0.5 rad)
    expect(maxLeft).toBeGreaterThan(0.4);
    expect(minLeft).toBeLessThan(-0.4);

    // Right arm should swing with clear amplitude
    expect(maxRightArm).toBeGreaterThan(0.3);

    // Left and right legs should swing in opposing directions at peak
    // Let's run until left leg is swung well forward
    for (let t = 0; t < 30; t++) {
      avatar.update(0.02, { isMoving: true, isSprinting: false });
      if (avatar.leftLegGroup.rotation.x > 0.4) {
        expect(avatar.rightLegGroup.rotation.x).toBeLessThan(-0.3);
        // Right arm swings back when right leg swings back (opposes right leg swing)
        expect(avatar.rightShoulderGroup.rotation.x).toBeLessThan(0);
        break;
      }
    }
  });

  it('engages forward torso lean and deeper strides in sprint mode', () => {
    for (let t = 0; t < 30; t++) {
      avatar.update(0.04, { isMoving: true, isSprinting: true });
    }

    // Torso should noticeably lean forward into the sprint
    expect(avatar.torsoGroup.rotation.x).toBeGreaterThan(0.12);

    // Leg stride amplitude should exceed normal walking stride
    let sprintMaxLeg = 0;
    for (let t = 0; t < 25; t++) {
      avatar.update(0.02, { isMoving: true, isSprinting: true });
      sprintMaxLeg = Math.max(sprintMaxLeg, Math.abs(avatar.leftLegGroup.rotation.x));
    }
    expect(sprintMaxLeg).toBeGreaterThan(0.65);
  });

  it('banks into turns based on steering angular velocity (turn banking)', () => {
    // Sharp right turn (positive turn rate)
    for (let t = 0; t < 15; t++) {
      avatar.update(0.04, { isMoving: true, turnRate: 1.5 });
    }
    // Root group should roll tilt into turn (negative Z rotation)
    expect(avatar.rootOffsetGroup.rotation.z).toBeLessThan(-0.04);

    // Sharp left turn (negative turn rate)
    for (let t = 0; t < 25; t++) {
      avatar.update(0.04, { isMoving: true, turnRate: -1.5 });
    }
    // Root group should roll tilt into left turn (positive Z rotation)
    expect(avatar.rootOffsetGroup.rotation.z).toBeGreaterThan(0.04);
  });

  it('adopts athletic tucked air pose during jump state', () => {
    avatar.update(0.05, { isMoving: true, isJumping: true, jumpProgress: 0.5 });
    avatar.update(0.05, { isMoving: true, isJumping: true, jumpProgress: 0.5 });

    // Legs should tuck backward in air
    expect(avatar.leftLegGroup.rotation.x).toBeLessThan(0);
    expect(avatar.rightLegGroup.rotation.x).toBeLessThan(0);

    // Arms flare slightly for balance
    expect(avatar.rightShoulderGroup.rotation.z).toBeLessThan(0);
  });

  it('supports custom palette configuration', () => {
    const customAvatar = createStudentAvatar({
      shirtPrimary: '#ea580c', // Orange hoodie variant
      shortsColor: '#1e293b',
      backpackColor: '#8b5cf6',
    });

    expect(customAvatar.characterGroup).toBeDefined();
    customAvatar.dispose();
  });

  it('disposes all geometries, materials, and textures without throwing', () => {
    expect(() => {
      avatar.dispose();
    }).not.toThrow();
  });
});
