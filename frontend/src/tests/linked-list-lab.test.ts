import { describe, it, expect, beforeEach } from 'vitest';
import { useClassroomStore } from '../store/useClassroomStore';
import { resolveAvatarCollision } from '../utils/collision';

describe('Linked List Pointer Node Apparatus & Dynamic Heap Mechanics', () => {
  beforeEach(async () => {
    // Reset store state
    await useClassroomStore.getState().resetWorldSeed();
    useClassroomStore.getState().resetLinkedList();
  });

  it('initializes Linked List with 3 default nodes [A, B, C] and pointer chain terminating at NULL', () => {
    const { linkedListNodes, linkedListNullError, linkedListIsSevered } =
      useClassroomStore.getState();

    expect(linkedListNodes).toHaveLength(3);
    expect(linkedListNullError).toBeNull();
    expect(linkedListIsSevered).toBe(false);

    // Node A points to Node B
    expect(linkedListNodes[0].id).toBe('node_a');
    expect(linkedListNodes[0].label).toBe('A');
    expect(linkedListNodes[0].value).toBe(10);
    expect(linkedListNodes[0].nextId).toBe('node_b');

    // Node B points to Node C
    expect(linkedListNodes[1].id).toBe('node_b');
    expect(linkedListNodes[1].label).toBe('B');
    expect(linkedListNodes[1].value).toBe(20);
    expect(linkedListNodes[1].nextId).toBe('node_c');

    // Node C points to NULL
    expect(linkedListNodes[2].id).toBe('node_c');
    expect(linkedListNodes[2].label).toBe('C');
    expect(linkedListNodes[2].value).toBe(30);
    expect(linkedListNodes[2].nextId).toBeNull();
  });

  it('executes sequential traversal across all nodes in O(n) terminating at NULL', async () => {
    const { traverseLinkedList } = useClassroomStore.getState();

    const result = await traverseLinkedList();

    expect(result.completed).toBe(true);
    expect(result.steps).toBe(3);

    const { linkedListOperation, linkedListIsTraversing, linkedListActiveNodeId } =
      useClassroomStore.getState();

    expect(linkedListIsTraversing).toBe(false);
    expect(linkedListActiveNodeId).toBeNull();
    expect(linkedListOperation?.type).toBe('traversal');
    expect(linkedListOperation?.timeComplexity).toBe('O(n)');
    expect(linkedListOperation?.stepsCount).toBe(3);
    expect(linkedListOperation?.codeSnippet).toContain('while (curr != NULL)');
  });

  it('performs O(1) dynamic node insertion with pointer redirection', () => {
    const { insertLinkedListNode } = useClassroomStore.getState();

    // Insert Node D (value 42) at index 1 (between A and B)
    insertLinkedListNode(1, 42, 'D');

    const { linkedListNodes, linkedListOperation } = useClassroomStore.getState();

    expect(linkedListNodes).toHaveLength(4);

    // Node A (index 0) now points to new Node D
    expect(linkedListNodes[0].id).toBe('node_a');
    expect(linkedListNodes[0].nextId).toContain('node_d');

    // Node D (index 1) now points to Node B
    expect(linkedListNodes[1].label).toBe('D');
    expect(linkedListNodes[1].value).toBe(42);
    expect(linkedListNodes[1].nextId).toBe('node_b');

    // Node B (index 2) still points to Node C
    expect(linkedListNodes[2].id).toBe('node_b');
    expect(linkedListNodes[2].nextId).toBe('node_c');

    // Complexity verification
    expect(linkedListOperation?.type).toBe('insert');
    expect(linkedListOperation?.timeComplexity).toBe('O(1)');
    expect(linkedListOperation?.stepsCount).toBe(2);
    expect(linkedListOperation?.codeSnippet).toContain('prev->next = newNode');
  });

  it('performs O(1) node deletion by bypassing target node pointers', () => {
    const { removeLinkedListNode } = useClassroomStore.getState();

    // Delete Node B
    removeLinkedListNode('node_b');

    const { linkedListNodes, linkedListOperation } = useClassroomStore.getState();

    expect(linkedListNodes).toHaveLength(2);
    expect(linkedListNodes.find((n) => n.id === 'node_b')).toBeUndefined();

    // Node A should now bypass directly to Node C
    expect(linkedListNodes[0].id).toBe('node_a');
    expect(linkedListNodes[0].nextId).toBe('node_c');

    expect(linkedListOperation?.type).toBe('delete');
    expect(linkedListOperation?.timeComplexity).toBe('O(1)');
    expect(linkedListOperation?.codeSnippet).toContain('prev->next = target->next');
  });

  it('simulates dangling pointer when severLinkedListLink() is called', () => {
    const { severLinkedListLink } = useClassroomStore.getState();

    severLinkedListLink('node_b');

    const { linkedListIsSevered, linkedListSeveredNodeId, linkedListOperation } =
      useClassroomStore.getState();

    expect(linkedListIsSevered).toBe(true);
    expect(linkedListSeveredNodeId).toBe('node_b');
    expect(linkedListOperation?.type).toBe('sever');
    expect(linkedListOperation?.description).toContain('Dangling pointer');
  });

  it('repairs severed link and clears dangling pointer state', () => {
    const { severLinkedListLink, repairLinkedListLink } = useClassroomStore.getState();

    severLinkedListLink('node_b');
    expect(useClassroomStore.getState().linkedListIsSevered).toBe(true);

    repairLinkedListLink();

    const { linkedListIsSevered, linkedListSeveredNodeId, linkedListOperation } =
      useClassroomStore.getState();

    expect(linkedListIsSevered).toBe(false);
    expect(linkedListSeveredNodeId).toBeNull();
    expect(linkedListOperation?.type).toBe('repair');
  });

  it('triggers and clears NullPointerException when dereferencing NULL', () => {
    const { triggerNullPointerDereference, clearLinkedListError } = useClassroomStore.getState();

    triggerNullPointerDereference();

    const { linkedListNullError, linkedListOperation } = useClassroomStore.getState();

    expect(linkedListNullError).toContain('NullPointerException');
    expect(linkedListOperation?.type).toBe('null_dereference');
    expect(linkedListOperation?.codeSnippet).toContain('SIGSEGV');

    clearLinkedListError();
    expect(useClassroomStore.getState().linkedListNullError).toBeNull();
  });

  it('activates and deactivates Linked List Lab console mode via activeStation', () => {
    const { setActiveStation } = useClassroomStore.getState();

    expect(useClassroomStore.getState().activeStation).toBeNull();

    setActiveStation('linked_list_lab');
    expect(useClassroomStore.getState().activeStation).toBe('linked_list_lab');

    setActiveStation(null);
    expect(useClassroomStore.getState().activeStation).toBeNull();
  });

  it('permits Avatar movement through Linked List Lab archway into the East wing chamber', () => {
    const { worldState } = useClassroomStore.getState();

    // Linked List Lab archway is at azimuth 90 deg (East, sin=1.0, cos=0.0)
    // Coordinates at radius 21.0 in radial sector
    const angleRad = (90 * Math.PI) / 180;
    const testX = Math.sin(angleRad) * 21.0;
    const testZ = -Math.cos(angleRad) * 21.0;

    const result = resolveAvatarCollision(testX, testZ, worldState);

    // Linked List Lab is accessible, so Avatar is allowed past the barrier into the chamber
    expect(result.isBlockedByBarrier).toBe(false);
    expect(result.blockedWingId).toBeNull();
    expect(result.x).toBeCloseTo(testX, 1);
    expect(result.z).toBeCloseTo(testZ, 1);
  });
});
