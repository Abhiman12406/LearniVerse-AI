import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { resolveAvatarCollision } from '../utils/collision';

describe('Array Station Indexing Apparatus & Memory Pointer Mechanics', () => {
  beforeEach(async () => {
    // Reset store state
    await useClassroomStore.getState().resetWorldSeed();
    useClassroomStore.getState().resetArrayStation();
  });

  it('initializes Array Station with 5 contiguous memory bays [0..4] and addresses', () => {
    const { arrayBays, arrayTargetIndex, arrayOutOfBounds } = useClassroomStore.getState();

    expect(arrayBays).toHaveLength(5);
    expect(arrayTargetIndex).toBe(2); // Center bay initially active
    expect(arrayOutOfBounds).toBe(false);

    // Contiguous memory addresses spaced by 4 bytes (0x2000, 0x2004, 0x2008, 0x200C, 0x2010)
    expect(arrayBays[0].address).toBe('0x2000');
    expect(arrayBays[1].address).toBe('0x2004');
    expect(arrayBays[2].address).toBe('0x2008');
    expect(arrayBays[3].address).toBe('0x200C');
    expect(arrayBays[4].address).toBe('0x2010');
  });

  it('performs O(1) random access pointer calculation for valid indices', () => {
    const { jumpToArrayIndex } = useClassroomStore.getState();

    // Jump to index 3
    jumpToArrayIndex(3);

    const { arrayTargetIndex, arrayProbeIndex, arrayOutOfBounds, arrayOperation } =
      useClassroomStore.getState();

    expect(arrayTargetIndex).toBe(3);
    expect(arrayProbeIndex).toBe(3);
    expect(arrayOutOfBounds).toBe(false);
    expect(arrayOperation?.type).toBe('random_access');
    expect(arrayOperation?.timeComplexity).toBe('O(1)');
    expect(arrayOperation?.targetAddress).toBe('0x200C');
    expect(arrayOperation?.stepsCount).toBe(1);
    expect(arrayOperation?.formula).toContain('0x200C');
  });

  it('triggers ArrayIndexOutOfBoundsException on negative index (-1)', () => {
    const { jumpToArrayIndex } = useClassroomStore.getState();

    jumpToArrayIndex(-1);

    const { arrayOutOfBounds, arrayErrorMessage, arrayOperation } = useClassroomStore.getState();

    expect(arrayOutOfBounds).toBe(true);
    expect(arrayErrorMessage).toContain('ArrayIndexOutOfBoundsException: Index -1 out of bounds');
    expect(arrayOperation?.type).toBe('out_of_bounds');
  });

  it('triggers ArrayIndexOutOfBoundsException on over-capacity index (5)', () => {
    const { jumpToArrayIndex } = useClassroomStore.getState();

    jumpToArrayIndex(5);

    const { arrayOutOfBounds, arrayErrorMessage, arrayOperation } = useClassroomStore.getState();

    expect(arrayOutOfBounds).toBe(true);
    expect(arrayErrorMessage).toContain('ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 5');
    expect(arrayOperation?.type).toBe('out_of_bounds');
  });

  it('clears error state when clearArrayError() is called', () => {
    const { jumpToArrayIndex, clearArrayError } = useClassroomStore.getState();

    jumpToArrayIndex(6);
    expect(useClassroomStore.getState().arrayOutOfBounds).toBe(true);

    clearArrayError();
    const { arrayOutOfBounds, arrayErrorMessage, arrayTargetIndex } = useClassroomStore.getState();
    expect(arrayOutOfBounds).toBe(false);
    expect(arrayErrorMessage).toBeNull();
    expect(arrayTargetIndex).toBe(2);
  });

  it('executes step-by-step linear search scan demonstrating O(n) traversal', async () => {
    const { runArrayLinearSearch, arrayBays } = useClassroomStore.getState();

    // Search for value in bay 2 (value: 78)
    const targetVal = arrayBays[2].value;
    const result = await runArrayLinearSearch(targetVal);

    expect(result.found).toBe(true);
    expect(result.index).toBe(2);
    expect(result.steps).toBe(3); // Checked index 0, index 1, index 2 (3 steps)

    const { arrayOperation, arrayIsScanning } = useClassroomStore.getState();
    expect(arrayIsScanning).toBe(false);
    expect(arrayOperation?.type).toBe('linear_search');
    expect(arrayOperation?.timeComplexity).toBe('O(n)');
    expect(arrayOperation?.stepsCount).toBe(3);
  });

  it('performs O(1) in-place array element write mutation', () => {
    const { updateArrayElement } = useClassroomStore.getState();

    updateArrayElement(1, 999);

    const { arrayBays, arrayOperation } = useClassroomStore.getState();
    expect(arrayBays[1].value).toBe(999);
    expect(arrayOperation?.type).toBe('write');
    expect(arrayOperation?.timeComplexity).toBe('O(1)');
    expect(arrayOperation?.formula).toContain('999');
  });

  it('activates and deactivates Array Station console mode via activeStation', () => {
    const { setActiveStation } = useClassroomStore.getState();

    expect(useClassroomStore.getState().activeStation).toBeNull();

    setActiveStation('array_station');
    expect(useClassroomStore.getState().activeStation).toBe('array_station');

    setActiveStation(null);
    expect(useClassroomStore.getState().activeStation).toBeNull();
  });

  it('permits Avatar movement through Array Station archway into the lab chamber', () => {
    const { worldState } = useClassroomStore.getState();

    // Array Station archway is at azimuth 30 deg (sin=0.5, cos=-0.866)
    // Coordinates at radius 21.0 in radial sector
    const angleRad = (30 * Math.PI) / 180;
    const testX = Math.sin(angleRad) * 21.0;
    const testZ = -Math.cos(angleRad) * 21.0;

    const result = resolveAvatarCollision(testX, testZ, worldState);

    // Array Station is accessible, so Avatar is allowed past the 17.2 boundary into the chamber
    expect(result.isBlockedByBarrier).toBe(false);
    expect(result.blockedWingId).toBeNull();
    expect(result.x).toBeCloseTo(testX, 1);
    expect(result.z).toBeCloseTo(testZ, 1);
  });
});
