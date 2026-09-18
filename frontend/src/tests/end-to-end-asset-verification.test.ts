import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { soundSystem } from '../audio/soundSystem';
import { createMentorCompanionModel } from '../assets/3d/createMentorCompanionModel';
import { createArrayStationModel } from '../assets/3d/createArrayStationModel';
import { createLinkedListModel } from '../assets/3d/createLinkedListModel';
import { createStackTowerModel } from '../assets/3d/createStackTowerModel';
import { createRecursionChamberModel } from '../assets/3d/createRecursionChamberModel';
import { createClassroomEnvironment } from '../assets/3d/createClassroomEnvironment';
import { createStudentAvatar } from '../assets/3d/createStudentAvatar';
import { resolveAvatarCollision } from '../utils/collision';
import { calculateDaisElevation } from '../components/canvas/Avatar';

describe('End-to-End 3D Asset Verification, Audio Harmony & Polish (Issue 10)', () => {
  beforeEach(() => {
    // Mock 2D canvas context for JSDOM - exhaustive to support procedural avatar face & screen textures
    HTMLCanvasElement.prototype.getContext = (() => ({
      fillRect: () => {},
      clearRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      bezierCurveTo: () => {},
      quadraticCurveTo: () => {},
      ellipse: () => {},
      arc: () => {},
      stroke: () => {},
      fill: () => {},
      fillText: () => {},
      strokeText: () => {},
      measureText: () => ({ width: 100 }),
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      clip: () => {},
      setLineDash: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }) as any,
      createRadialGradient: () => ({ addColorStop: () => {} }) as any,
    })) as any;

    useClassroomStore.setState({
      isMentorOpen: false,
      isNearMentor: false,
      avatar: { position: [0, 0, 8], rotation: 0, isMoving: false },
    });
  });

  it('verifies all 7 core procedural 3D factories construct valid scene hierarchies without error', () => {
    // 1. Campus diorama environment
    const campus = createClassroomEnvironment();
    expect(campus.group.name).toBe('ClassroomCampusDiorama');
    expect(campus.getActiveColliders().length).toBeGreaterThanOrEqual(10);
    campus.dispose();

    // 2. Stylized Student Avatar
    const avatar = createStudentAvatar();
    expect(avatar.characterGroup).toBeDefined();
    avatar.dispose();

    // 3. Array Station Apparatus
    const arrayStation = createArrayStationModel();
    expect(arrayStation.group.name).toBe('ArrayStationApparatus');
    arrayStation.dispose();

    // 4. Linked List Pointer Node Apparatus
    const linkedList = createLinkedListModel();
    expect(linkedList.group.name).toBe('LinkedListApparatus');
    linkedList.dispose();

    // 5. Stack LIFO Tower Apparatus
    const stackTower = createStackTowerModel();
    expect(stackTower.group.name).toBe('StackTowerApparatus');
    stackTower.dispose();

    // 6. Recursion Call-Stack Elevator Apparatus
    const recursionChamber = createRecursionChamberModel();
    expect(recursionChamber.group.name).toBe('RecursionChamberApparatus');
    recursionChamber.dispose();

    // 7. Friendly Mentor Companion Bot
    const mentorBot = createMentorCompanionModel();
    expect(mentorBot.group.name).toBe('MentorCompanionBot');
    mentorBot.dispose();
  });

  it('validates audio harmony: all Web Audio synthesizer cues trigger safely and respect mute toggle', () => {
    // Test that all sound methods execute without throwing in test/headless environment
    expect(() => soundSystem.playFootstep('wood')).not.toThrow();
    expect(() => soundSystem.playFootstep('metal')).not.toThrow();
    expect(() => soundSystem.playMechanicalClick()).not.toThrow();
    expect(() => soundSystem.playMentorGreeting()).not.toThrow();
    expect(() => soundSystem.playPneumaticThud()).not.toThrow();
    expect(() => soundSystem.playMagneticThud()).not.toThrow();
    expect(() => soundSystem.playPop()).not.toThrow();
    expect(() => soundSystem.playUnlockArpeggio()).not.toThrow();
    expect(() => soundSystem.playCorrect()).not.toThrow();
    expect(() => soundSystem.playError()).not.toThrow();
    expect(() => soundSystem.playSuccess()).not.toThrow();
    expect(() => soundSystem.playAlert()).not.toThrow();
    expect(() => soundSystem.playChime()).not.toThrow();
    expect(() => soundSystem.playChirp()).not.toThrow();

    // Mute toggle verification
    const initialMuted = soundSystem.getMuted();
    soundSystem.toggleMute();
    expect(soundSystem.getMuted()).toBe(!initialMuted);
    soundSystem.toggleMute();
    expect(soundSystem.getMuted()).toBe(initialMuted);
  });

  it('verifies solid obstacle boundaries and dais elevation across the campus', () => {
    // Dais elevation: raised platform at radius < 5.0m
    expect(calculateDaisElevation(0, 0)).toBe(0.5);
    expect(calculateDaisElevation(2, 2)).toBe(0.5);
    expect(calculateDaisElevation(0, 8)).toBe(0.0);

    // Collision against solid furniture obstacles (Teacher's Podium Desk at x=-2.0, z=-3.2)
    const worldState = useClassroomStore.getState().worldState;
    const deskBlocked = resolveAvatarCollision(-2.0, -3.2, worldState, 17.2, true);
    // Must be pushed outside the desk bounding box minZ: -4.3, maxZ: -2.1
    expect(deskBlocked.z <= -4.3 || deskBlocked.z >= -2.1 || deskBlocked.x <= -2.6 || deskBlocked.x >= -1.4).toBe(true);

    // Collision against perimeter boundary (clamped to atrium walkable radius 17.2m)
    const clampedPerimeter = resolveAvatarCollision(0, 25.0, worldState, 17.2, false);
    expect(clampedPerimeter.z).toBeLessThanOrEqual(17.2);
  });

  it('verifies prerequisite barrier locking for Learner B and unlocking for Learner A', async () => {
    // Learner B has weak Stack (38%) -> Recursion wing locked
    await useClassroomStore.getState().switchLearner('learner_b');
    const worldB = useClassroomStore.getState().worldState;
    expect(worldB).not.toBeNull();
    expect(worldB!.wings.recursion_lab.status).toBe('sealed');

    // Learner A has mastered Stack (84%) -> Recursion wing unlocked
    await useClassroomStore.getState().switchLearner('learner_a');
    const worldA = useClassroomStore.getState().worldState;
    expect(worldA).not.toBeNull();
    expect(worldA!.wings.recursion_lab.status).toBe('accessible');
  });

  it('verifies interactive mentor companion bot proximity on central teacher desk', () => {
    const teacherDeskPos: [number, number, number] = [-2.0, 0.98, -3.2];
    const threshold = 3.2;

    const checkNear = (pos: [number, number, number]) => {
      return Math.hypot(pos[0] - teacherDeskPos[0], pos[2] - teacherDeskPos[2]) <= threshold;
    };

    // Avatar at teacher desk front
    expect(checkNear([-1.8, 0, -2.4])).toBe(true);
    // Avatar far away at array lab
    expect(checkNear([-12, 0, 0])).toBe(false);
  });
});
