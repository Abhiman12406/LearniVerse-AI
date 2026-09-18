import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createLinkedListModel } from '../assets/3d/createLinkedListModel';

describe('createLinkedListModel (Procedural 3D Linked List Pointer Node Apparatus)', () => {
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
      stroke: () => {},
      arc: () => {},
      fill: () => {},
      fillText: () => {},
      measureText: () => ({ width: 100 }),
      createLinearGradient: () => ({
        addColorStop: () => {},
      }),
    })) as any;
  });

  it('instantiates complete procedural Linked List rig with authentic blueprint hierarchy', () => {
    const rig = createLinkedListModel({
      initialNodes: [
        { id: 'node_a', label: 'A', value: 10, crystalColor: '#00d4ff', nextId: 'node_b' },
        { id: 'node_b', label: 'B', value: 20, crystalColor: '#10b981', nextId: 'node_c' },
        { id: 'node_c', label: 'C', value: 30, crystalColor: '#f43f5e', nextId: null },
      ],
    });

    expect(rig.group).toBeInstanceOf(THREE.Group);
    expect(rig.group.name).toBe('LinkedListApparatus');

    // 1. Verify Nodes Group has 3 nodes (A, B, C)
    expect(rig.nodesGroup).toBeDefined();
    expect(rig.nodesGroup.children.length).toBe(3);

    const nodeA = rig.nodesGroup.getObjectByName('LinkedListNode_A');
    const nodeB = rig.nodesGroup.getObjectByName('LinkedListNode_B');
    const nodeC = rig.nodesGroup.getObjectByName('LinkedListNode_C');
    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();
    expect(nodeC).toBeDefined();

    // 2. Verify Node A components: Oak Casing, Plaques, Glass, Bezel, Crystal, Ports
    expect(nodeA?.getObjectByName('OakCasing')).toBeDefined();
    expect(nodeA?.getObjectByName('TopPlaque_Data')).toBeDefined();
    expect(nodeA?.getObjectByName('TopPlaque_Label')).toBeDefined();
    expect(nodeA?.getObjectByName('FrontBezel')).toBeDefined();
    expect(nodeA?.getObjectByName('GlassWindow')).toBeDefined();
    expect(nodeA?.getObjectByName('CrystalCube_A')).toBeDefined();
    expect(nodeA?.getObjectByName('CrystalLight_A')).toBeDefined();
    expect(nodeA?.getObjectByName('NextPortSocket')).toBeDefined();
    expect(nodeA?.getObjectByName('PrevPortSocket')).toBeDefined();

    // 3. Verify Connection Beams: A -> B, B -> C, and C -> NULL
    expect(rig.beamsGroup).toBeDefined();
    const beamAB = rig.beamsGroup.getObjectByName('ConnectionBeam_A_to_B');
    const beamBC = rig.beamsGroup.getObjectByName('ConnectionBeam_B_to_C');
    const beamCNULL = rig.beamsGroup.getObjectByName('ConnectionBeam_C_to_NULL');
    expect(beamAB).toBeDefined();
    expect(beamBC).toBeDefined();
    expect(beamCNULL).toBeDefined();

    // 4. Verify Grounded Brass NULL Termination Plate
    expect(rig.nullPlateGroup).toBeDefined();
    const nullPlateMesh = rig.nullPlateGroup.getObjectByName('NullPlateMesh');
    const nullDockingCollar = rig.nullPlateGroup.getObjectByName('NullDockingCollar');
    const nullPointLight = rig.nullPlateGroup.getObjectByName('NullPointLight');
    expect(nullPlateMesh).toBeDefined();
    expect(nullDockingCollar).toBeDefined();
    expect(nullPointLight).toBeDefined();

    // 5. Verify Floating Plasma Sparks
    expect(rig.sparkParticles).toBeDefined();

    rig.dispose();
  });

  it('updates animation time, crystal hover bobbing, and shader uniforms in update()', () => {
    const rig = createLinkedListModel();

    const nodeA = rig.nodesGroup.getObjectByName('LinkedListNode_A');
    const crystalA = nodeA?.getObjectByName('CrystalCube_A') as THREE.Mesh;
    const initialRotY = crystalA.rotation.y;

    // Advance 5 frames
    for (let i = 0; i < 5; i++) {
      rig.update(0.016, { isTraversing: true, activeNodeId: 'node_a' });
    }

    // Crystal should rotate and hover
    expect(crystalA.rotation.y).toBeGreaterThan(initialRotY);

    // Active node has boosted emissive intensity
    const mat = crystalA.material as THREE.MeshStandardMaterial;
    expect(mat.emissiveIntensity).toBeGreaterThan(1.0);

    rig.dispose();
  });

  it('dynamically inserts new Node D and reroutes pointer connection beams', () => {
    const rig = createLinkedListModel();

    expect(rig.nodesGroup.children.length).toBe(3);

    // Insert Node D (value 42) at index 1 (between A and B)
    rig.insertNode(
      { id: 'node_d', label: 'D', value: 42, crystalColor: '#f59e0b', nextId: 'node_b' },
      1
    );

    // Node count should now be 4
    expect(rig.nodesGroup.children.length).toBe(4);
    const nodeD = rig.nodesGroup.getObjectByName('LinkedListNode_D');
    expect(nodeD).toBeDefined();
    expect(nodeD?.getObjectByName('CrystalCube_D')).toBeDefined();

    // Beams should be rerouted: A -> D, D -> B, B -> C, C -> NULL
    const beamAD = rig.beamsGroup.getObjectByName('ConnectionBeam_A_to_D');
    const beamDB = rig.beamsGroup.getObjectByName('ConnectionBeam_D_to_B');
    expect(beamAD).toBeDefined();
    expect(beamDB).toBeDefined();

    rig.dispose();
  });

  it('removes Node B and patches pointer around it in O(1)', () => {
    const rig = createLinkedListModel();

    expect(rig.nodesGroup.children.length).toBe(3);

    // Remove Node B
    rig.removeNode('node_b');

    expect(rig.nodesGroup.children.length).toBe(2);
    expect(rig.nodesGroup.getObjectByName('LinkedListNode_B')).toBeUndefined();

    // Beam should now bypass directly from A to C
    const beamAC = rig.beamsGroup.getObjectByName('ConnectionBeam_A_to_C');
    expect(beamAC).toBeDefined();

    rig.dispose();
  });

  it('handles link severing and null pointer dereference error alarm states', () => {
    const rig = createLinkedListModel();

    // Sever link from Node B
    rig.severLink('node_b');
    rig.update(0.016, { isSevered: true, severedNodeId: 'node_b' });

    // Sparks should switch to crimson alert color
    const sparkMat = rig.sparkParticles.material as THREE.PointsMaterial;
    expect(sparkMat.color.getHexString()).toBe('ef4444');

    // Trigger NULL dereference error
    rig.triggerNullError();
    rig.update(0.016, { hasNullError: true });

    const nullLight = rig.nullPlateGroup.getObjectByName('NullPointLight') as THREE.PointLight;
    expect(nullLight.color.getHexString()).toBe('ef4444');

    // Repair link
    rig.repairLink();
    rig.update(0.016, { isSevered: false, hasNullError: false });
    expect(sparkMat.color.getHexString()).toBe('f59e0b');
    expect(nullLight.color.getHexString()).toBe('fbbf24');

    rig.dispose();
  });

  it('disposes all geometries, materials, and textures cleanly with zero leaks', () => {
    const rig = createLinkedListModel();
    expect(rig.group.children.length).toBeGreaterThan(0);

    rig.dispose();
    expect(rig.group.children.length).toBe(0);
  });
});
