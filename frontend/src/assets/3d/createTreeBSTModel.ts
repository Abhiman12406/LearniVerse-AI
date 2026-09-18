import * as THREE from 'three';

export interface TreeNodeData {
  value: number;
  level: number;
  position: [number, number, number];
  parentValue: number | null;
  leftChildValue: number | null;
  rightChildValue: number | null;
  color: string;
}

export interface TreeBSTModelState {
  activeNodeValue: number | null;
  traversingValues: number[];
  targetValue: number | null;
  isSearching: boolean;
  nodes: TreeNodeData[];
}

export interface TreeBSTModelRig {
  group: THREE.Group;
  nodesGroup: THREE.Group;
  branchesGroup: THREE.Group;
  pedestalGroup: THREE.Group;
  getNodes: () => TreeNodeData[];
  update: (delta: number, state?: Partial<TreeBSTModelState>) => void;
  highlightNode: (val: number | null) => void;
  setTraversingPath: (path: number[]) => void;
  resetTree: () => void;
  dispose: () => void;
}

export const CANONICAL_BST_NODES: TreeNodeData[] = [
  // Level 0: Root
  {
    value: 50,
    level: 0,
    position: [0.0, 3.2, 0.0],
    parentValue: null,
    leftChildValue: 30,
    rightChildValue: 70,
    color: '#00f0ff',
  },
  // Level 1: Left & Right Children
  {
    value: 30,
    level: 1,
    position: [-2.2, 2.1, -0.1],
    parentValue: 50,
    leftChildValue: 20,
    rightChildValue: 40,
    color: '#10b981',
  },
  {
    value: 70,
    level: 1,
    position: [2.2, 2.1, -0.1],
    parentValue: 50,
    leftChildValue: 60,
    rightChildValue: 80,
    color: '#10b981',
  },
  // Level 2: Leaves
  {
    value: 20,
    level: 2,
    position: [-3.3, 0.9, 0.1],
    parentValue: 30,
    leftChildValue: null,
    rightChildValue: null,
    color: '#34d399',
  },
  {
    value: 40,
    level: 2,
    position: [-1.1, 0.9, 0.1],
    parentValue: 30,
    leftChildValue: null,
    rightChildValue: null,
    color: '#34d399',
  },
  {
    value: 60,
    level: 2,
    position: [1.1, 0.9, 0.1],
    parentValue: 70,
    leftChildValue: null,
    rightChildValue: null,
    color: '#34d399',
  },
  {
    value: 80,
    level: 2,
    position: [3.3, 0.9, 0.1],
    parentValue: 70,
    leftChildValue: null,
    rightChildValue: null,
    color: '#34d399',
  },
];

/**
 * Creates a dynamic canvas badge texture displaying the node's numeric value
 */
function createNodeBadgeTexture(value: number, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#060d17';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 116, 116);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Factory for the procedural 3D Hierarchical Binary Search Tree Canopy
 */
export function createTreeBSTModel(): TreeBSTModelRig {
  const root = new THREE.Group();
  root.name = 'TreeBSTApparatus';

  const disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  } = {
    geometries: [],
    materials: [],
    textures: [],
  };

  function trackGeo<T extends THREE.BufferGeometry>(geo: T): T {
    disposables.geometries.push(geo);
    return geo;
  }

  function trackMat<T extends THREE.Material>(mat: T): T {
    disposables.materials.push(mat);
    return mat;
  }

  function trackTex<T extends THREE.Texture>(tex: T): T {
    disposables.textures.push(tex);
    return tex;
  }

  // --- 1. PEDESTAL & BIO-CYBERNETIC BASE ---
  const pedestalGroup = new THREE.Group();
  pedestalGroup.name = 'TreePedestal';
  root.add(pedestalGroup);

  const baseGeo = trackGeo(new THREE.CylinderGeometry(4.2, 4.6, 0.4, 32));
  const baseMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x061118,
      roughness: 0.35,
      metalness: 0.85,
    })
  );
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.2;
  baseMesh.receiveShadow = true;
  pedestalGroup.add(baseMesh);

  // Concentric Neon Circuit Inlays on Base
  const ringGeo1 = trackGeo(new THREE.RingGeometry(3.6, 3.8, 32));
  const ringMat1 = trackMat(
    new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
  );
  const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
  ringMesh1.rotation.x = -Math.PI / 2;
  ringMesh1.position.y = 0.405;
  pedestalGroup.add(ringMesh1);

  const ringGeo2 = trackGeo(new THREE.RingGeometry(1.8, 1.95, 32));
  const ringMat2 = trackMat(
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide })
  );
  const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
  ringMesh2.rotation.x = -Math.PI / 2;
  ringMesh2.position.y = 0.408;
  pedestalGroup.add(ringMesh2);

  // Tree Trunk Core
  const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.35, 0.65, 1.2, 16));
  const trunkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0a1f26,
      roughness: 0.6,
      metalness: 0.6,
    })
  );
  const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
  trunkMesh.position.y = 0.8;
  trunkMesh.castShadow = true;
  pedestalGroup.add(trunkMesh);

  // --- 2. BRANCH CONNECTORS ---
  const branchesGroup = new THREE.Group();
  branchesGroup.name = 'TreeBranches';
  root.add(branchesGroup);

  const branchMeshes: Array<{
    parentVal: number;
    childVal: number;
    cylinder: THREE.Mesh;
    mat: THREE.MeshStandardMaterial;
  }> = [];

  CANONICAL_BST_NODES.forEach((node) => {
    if (node.parentValue !== null) {
      const parentNode = CANONICAL_BST_NODES.find((p) => p.value === node.parentValue)!;
      const start = new THREE.Vector3(...parentNode.position);
      const end = new THREE.Vector3(...node.position);
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = dir.length();

      const branchGeo = trackGeo(new THREE.CylinderGeometry(0.045, 0.055, len, 12));
      const branchMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x059669,
          emissive: 0x059669,
          emissiveIntensity: 0.3,
          roughness: 0.4,
          metalness: 0.7,
        })
      );
      const branchMesh = new THREE.Mesh(branchGeo, branchMat);

      // Orient cylinder along direction vector
      const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      branchMesh.position.copy(midpoint);
      branchMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

      branchesGroup.add(branchMesh);
      branchMeshes.push({
        parentVal: node.parentValue,
        childVal: node.value,
        cylinder: branchMesh,
        mat: branchMat,
      });
    }
  });

  // --- 3. TREE NODES (CRYSTAL SPHERES WITH VALUE BADGES) ---
  const nodesGroup = new THREE.Group();
  nodesGroup.name = 'TreeNodes';
  root.add(nodesGroup);

  const nodeMap = new Map<
    number,
    {
      group: THREE.Group;
      sphere: THREE.Mesh;
      sphereMat: THREE.MeshStandardMaterial;
      glowRing: THREE.Mesh;
      glowMat: THREE.MeshBasicMaterial;
      badgeMesh: THREE.Mesh;
      initialPos: [number, number, number];
      data: TreeNodeData;
    }
  >();

  CANONICAL_BST_NODES.forEach((node) => {
    const nodeGroup = new THREE.Group();
    nodeGroup.position.set(...node.position);
    nodesGroup.add(nodeGroup);

    // Node Sphere
    const sphereRadius = node.level === 0 ? 0.38 : node.level === 1 ? 0.32 : 0.28;
    const sphereGeo = trackGeo(new THREE.SphereGeometry(sphereRadius, 24, 24));
    const sphereMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.8,
      })
    );
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.castShadow = true;
    nodeGroup.add(sphereMesh);

    // Orbit Ring
    const orbitGeo = trackGeo(new THREE.RingGeometry(sphereRadius * 1.3, sphereRadius * 1.45, 24));
    const glowMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: node.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      })
    );
    const orbitMesh = new THREE.Mesh(orbitGeo, glowMat);
    orbitMesh.rotation.x = Math.PI / 2;
    nodeGroup.add(orbitMesh);

    // Front Numeric Badge Plane
    const badgeTex = trackTex(createNodeBadgeTexture(node.value, node.color));
    const badgeGeo = trackGeo(new THREE.PlaneGeometry(0.38, 0.38));
    const badgeMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: badgeTex,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      })
    );
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(0, 0, sphereRadius + 0.05);
    nodeGroup.add(badgeMesh);

    nodeMap.set(node.value, {
      group: nodeGroup,
      sphere: sphereMesh,
      sphereMat,
      glowRing: orbitMesh,
      glowMat,
      badgeMesh,
      initialPos: node.position,
      data: node,
    });
  });

  // State
  let activeValue: number | null = null;
  let traversingPath: number[] = [];
  let animTime = 0;

  function update(delta: number, state?: Partial<TreeBSTModelState>) {
    animTime += delta;

    if (state) {
      if (state.activeNodeValue !== undefined) activeValue = state.activeNodeValue;
      if (state.traversingValues !== undefined) traversingPath = state.traversingValues;
    }

    // Gentle vertical bobbing & orbit rotation
    nodeMap.forEach((entry, val) => {
      const isTarget = activeValue === val;
      const isTraversing = traversingPath.includes(val);

      const bobOffset = Math.sin(animTime * 2.0 + val * 0.5) * 0.04;
      entry.group.position.y = entry.initialPos[1] + bobOffset;
      entry.glowRing.rotation.z += delta * 1.2;

      // Color/Glow emphasis
      if (isTarget) {
        entry.sphereMat.emissive.set('#ff0055');
        entry.sphereMat.emissiveIntensity = 1.4 + Math.sin(animTime * 6.0) * 0.4;
        entry.glowMat.color.set('#ff0055');
        entry.group.scale.setScalar(1.25);
      } else if (isTraversing) {
        entry.sphereMat.emissive.set('#f59e0b');
        entry.sphereMat.emissiveIntensity = 1.1;
        entry.glowMat.color.set('#f59e0b');
        entry.group.scale.setScalar(1.12);
      } else {
        entry.sphereMat.emissive.set(entry.data.color);
        entry.sphereMat.emissiveIntensity = 0.4;
        entry.glowMat.color.set(entry.data.color);
        entry.group.scale.setScalar(1.0);
      }
    });

    // Branch illumination
    branchMeshes.forEach((branch) => {
      const parentHighlighted =
        activeValue === branch.parentVal || traversingPath.includes(branch.parentVal);
      const childHighlighted =
        activeValue === branch.childVal || traversingPath.includes(branch.childVal);

      if (parentHighlighted && childHighlighted) {
        branch.mat.emissive.set('#00f0ff');
        branch.mat.emissiveIntensity = 1.2;
      } else {
        branch.mat.emissive.set('#059669');
        branch.mat.emissiveIntensity = 0.3;
      }
    });
  }

  function highlightNode(val: number | null) {
    activeValue = val;
  }

  function setTraversingPath(path: number[]) {
    traversingPath = path;
  }

  function resetTree() {
    activeValue = null;
    traversingPath = [];
  }

  function dispose() {
    disposables.geometries.forEach((g) => g.dispose());
    disposables.materials.forEach((m) => m.dispose());
    disposables.textures.forEach((t) => t.dispose());
    disposables.geometries.length = 0;
    disposables.materials.length = 0;
    disposables.textures.length = 0;
  }

  return {
    group: root,
    nodesGroup,
    branchesGroup,
    pedestalGroup,
    getNodes: () => CANONICAL_BST_NODES,
    update,
    highlightNode,
    setTraversingPath,
    resetTree,
    dispose,
  };
}
