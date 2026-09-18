import * as THREE from 'three';

/**
 * Tree & BST Lab Apparatus & Wing (Enlarged & Walkable with Solid Wall Colliders)
 */
export function createTreeLab(COLORS, parentColliders, registerInteractive) {
  const root = new THREE.Group();
  root.name = 'TreeLabWing';
  root.position.set(0, 0, 20);

  const roomSize = 14;
  const wallHeight = 6.0;
  const wallThickness = 0.4;
  const doorWidth = 3.6;

  // Materials
  const floorMat = new THREE.MeshStandardMaterial({
    color: '#d1c7b8',
    roughness: 0.65,
    metalness: 0.05,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: '#5e5653',
    roughness: 0.85,
    metalness: 0.02,
  });

  const treeBranchMat = new THREE.MeshStandardMaterial({
    color: '#059669',
    emissive: '#047857',
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.5,
  });

  // 1. Floor
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(roomSize, 0.4, roomSize), floorMat);
  floorMesh.position.set(0, -0.2, 0);
  floorMesh.receiveShadow = true;
  root.add(floorMesh);

  function addWallCollider(mesh, name, widthX, widthZ) {
    mesh.receiveShadow = true;
    root.add(mesh);
    registerInteractive(mesh, name, { widthX, widthZ });
  }

  // Outer Walls with Solid Colliders
  // South Wall (Outer)
  const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, wallThickness), wallMat);
  wallSouth.position.set(0, wallHeight / 2, roomSize / 2 + wallThickness / 2);
  addWallCollider(wallSouth, 'Tree Lab South Outer Wall', roomSize, wallThickness);

  // West Wall
  const wallWest = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, roomSize), wallMat);
  wallWest.position.set(-roomSize / 2 - wallThickness / 2, wallHeight / 2, 0);
  addWallCollider(wallWest, 'Tree Lab West Wall', wallThickness, roomSize);

  // East Wall
  const wallEast = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, roomSize), wallMat);
  wallEast.position.set(roomSize / 2 + wallThickness / 2, wallHeight / 2, 0);
  addWallCollider(wallEast, 'Tree Lab East Wall', wallThickness, roomSize);

  // North Wall Segments (with wide entrance |x| <= 1.8)
  const northWingLen = (roomSize - doorWidth) / 2;
  const wallNorthW = new THREE.Mesh(new THREE.BoxGeometry(northWingLen, wallHeight, wallThickness), wallMat);
  wallNorthW.position.set(-roomSize / 2 + northWingLen / 2, wallHeight / 2, -roomSize / 2 - wallThickness / 2);
  addWallCollider(wallNorthW, 'Tree Lab North Wall (West Section)', northWingLen, wallThickness);

  const wallNorthE = new THREE.Mesh(new THREE.BoxGeometry(northWingLen, wallHeight, wallThickness), wallMat);
  wallNorthE.position.set(roomSize / 2 - northWingLen / 2, wallHeight / 2, -roomSize / 2 - wallThickness / 2);
  addWallCollider(wallNorthE, 'Tree Lab North Wall (East Section)', northWingLen, wallThickness);

  const wallNorthLintel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 2.2, wallThickness), wallMat);
  wallNorthLintel.position.set(0, wallHeight - 1.1, -roomSize / 2 - wallThickness / 2);
  root.add(wallNorthLintel);

  // 2. Wide Connecting Corridor (South wing corridor to Main Classroom)
  const corridorLen = 10.0;
  const corridorFloor = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 0.38, corridorLen), floorMat);
  corridorFloor.position.set(0, -0.2, -roomSize / 2 - corridorLen / 2);
  corridorFloor.receiveShadow = true;
  root.add(corridorFloor);

  const corridorWallW = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, corridorLen), wallMat);
  corridorWallW.position.set(-doorWidth / 2 - wallThickness / 2, wallHeight / 2, -roomSize / 2 - corridorLen / 2);
  addWallCollider(corridorWallW, 'Tree Corridor West Wall', wallThickness, corridorLen);

  const corridorWallE = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, corridorLen), wallMat);
  corridorWallE.position.set(doorWidth / 2 + wallThickness / 2, wallHeight / 2, -roomSize / 2 - corridorLen / 2);
  addWallCollider(corridorWallE, 'Tree Corridor East Wall', wallThickness, corridorLen);

  // Door Portal Banner Signboard
  function createDoorSign(text) {
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 4.0, -roomSize / 2 - 0.1);
    signGroup.rotation.y = Math.PI;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.75, 0.1),
      new THREE.MeshStandardMaterial({ color: '#1e1b18', roughness: 0.4 })
    );
    signGroup.add(frame);

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(3.05, 0.62, 0.12),
      new THREE.MeshStandardMaterial({ color: '#047857', emissive: '#065f46', emissiveIntensity: 0.6 })
    );
    signGroup.add(plate);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚪 ' + text, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 0.58),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    labelMesh.position.z = 0.07;
    signGroup.add(labelMesh);

    return signGroup;
  }

  root.add(createDoorSign('TREE & BST LAB'));

  // 3. 3D BINARY SEARCH TREE APPARATUS
  const apparatusGroup = new THREE.Group();
  apparatusGroup.position.set(0, 0, 0);
  root.add(apparatusGroup);

  const baseMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(3.8, 4.0, 0.35, 32),
    new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.4, metalness: 0.3 })
  );
  baseMesh.position.y = 0.175;
  baseMesh.receiveShadow = true;
  apparatusGroup.add(baseMesh);

  const bstNodes = [
    { id: 'n50', val: 50, x: 0, y: 3.4, z: -0.6, left: 'n30', right: 'n70' },
    { id: 'n30', val: 30, x: -2.0, y: 2.2, z: 0, left: 'n20', right: 'n40' },
    { id: 'n70', val: 70, x: 2.0, y: 2.2, z: 0, left: 'n60', right: 'n80' },
    { id: 'n20', val: 20, x: -3.0, y: 1.0, z: 0.7, left: null, right: null },
    { id: 'n40', val: 40, x: -1.1, y: 1.0, z: 0.7, left: null, right: null },
    { id: 'n60', val: 60, x: 1.1, y: 1.0, z: 0.7, left: null, right: null },
    { id: 'n80', val: 80, x: 3.0, y: 1.0, z: 0.7, left: null, right: null },
  ];

  const nodeMap = new Map();
  const nodeMeshList = [];

  function createBranch(fromNode, toNode) {
    const p1 = new THREE.Vector3(fromNode.x, fromNode.y, fromNode.z);
    const p2 = new THREE.Vector3(toNode.x, toNode.y, toNode.z);
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    const branchGeo = new THREE.CylinderGeometry(0.05, 0.05, len, 8);
    const branchMesh = new THREE.Mesh(branchGeo, treeBranchMat);
    branchMesh.position.copy(mid);
    branchMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    apparatusGroup.add(branchMesh);
  }

  bstNodes.forEach((nodeData) => {
    const nodeGroup = new THREE.Group();
    nodeGroup.position.set(nodeData.x, nodeData.y, nodeData.z);
    apparatusGroup.add(nodeGroup);

    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 2),
      new THREE.MeshStandardMaterial({
        color: '#0284c7',
        emissive: '#0369a1',
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.5,
      })
    );
    sphere.castShadow = true;
    nodeGroup.add(sphere);

    const valCanvas = document.createElement('canvas');
    valCanvas.width = 256;
    valCanvas.height = 256;
    const vctx = valCanvas.getContext('2d');
    vctx.fillStyle = '#0c4a6e';
    vctx.fillRect(0, 0, 256, 256);
    vctx.fillStyle = '#bae6fd';
    vctx.font = 'bold 88px sans-serif';
    vctx.textAlign = 'center';
    vctx.textBaseline = 'middle';
    vctx.fillText(String(nodeData.val), 128, 128);

    const valTex = new THREE.CanvasTexture(valCanvas);
    const valLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.52),
      new THREE.MeshBasicMaterial({ map: valTex })
    );
    valLabel.position.set(0, 0, 0.43);
    nodeGroup.add(valLabel);

    nodeMap.set(nodeData.id, { group: nodeGroup, sphere: sphere, data: nodeData });
    nodeMeshList.push({ id: nodeData.id, group: nodeGroup, sphere: sphere, val: nodeData.val });
  });

  bstNodes.forEach((nodeData) => {
    if (nodeData.left) createBranch(nodeData, nodeMap.get(nodeData.left).data);
    if (nodeData.right) createBranch(nodeData, nodeMap.get(nodeData.right).data);
  });

  // 4. Blackboard on South Wall
  const theoryBoard = new THREE.Group();
  theoryBoard.position.set(0, 3.4, roomSize / 2 - 0.08);
  theoryBoard.rotation.y = Math.PI;
  root.add(theoryBoard);

  const tbCanvas = document.createElement('canvas');
  tbCanvas.width = 1024;
  tbCanvas.height = 512;
  const tbCtx = tbCanvas.getContext('2d');
  tbCtx.fillStyle = '#052e16';
  tbCtx.fillRect(0, 0, 1024, 512);
  tbCtx.fillStyle = '#4ade80';
  tbCtx.font = 'bold 36px sans-serif';
  tbCtx.fillText('BINARY SEARCH TREE (BST) — HIERARCHY & ORDERING', 40, 60);
  tbCtx.fillStyle = '#f0fdf4';
  tbCtx.font = '28px monospace';
  tbCtx.fillText('• BST Invariant: Left Subtree < Root < Right Subtree', 40, 130);
  tbCtx.fillText('• In-Order Traversal (L -> Root -> R): Sorted Sequence', 40, 190);
  tbCtx.fillText('• Search / Insert Complexity: O(log N) balanced, O(N) worst', 40, 250);
  tbCtx.fillText('• Walk close & Press [E] to trigger in-order traversal!', 40, 310);
  tbCtx.fillStyle = '#fbbf24';
  tbCtx.fillText('In-Order Output: 20 -> 30 -> 40 -> 50 -> 60 -> 70 -> 80', 40, 400);

  const tbTex = new THREE.CanvasTexture(tbCanvas);
  const tbMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.5), new THREE.MeshBasicMaterial({ map: tbTex }));
  tbMesh.position.z = 0.05;
  theoryBoard.add(tbMesh);

  // Interactive APIs
  let isTraversing = false;

  function runInOrderTraversal(onComplete) {
    if (isTraversing) return;
    isTraversing = true;
    const inOrderSeq = ['n20', 'n30', 'n40', 'n50', 'n60', 'n70', 'n80'];
    let step = 0;

    const interval = setInterval(() => {
      if (step < inOrderSeq.length) {
        const item = nodeMap.get(inOrderSeq[step]);
        if (item) {
          item.sphere.material.color.set('#f59e0b');
          item.sphere.material.emissive.set('#d97706');
          item.group.scale.set(1.3, 1.3, 1.3);

          setTimeout(() => {
            item.sphere.material.color.set('#0284c7');
            item.sphere.material.emissive.set('#0369a1');
            item.group.scale.set(1.0, 1.0, 1.0);
          }, 350);
        }
        step++;
      } else {
        clearInterval(interval);
        isTraversing = false;
        if (onComplete) onComplete([20, 30, 40, 50, 60, 70, 80]);
      }
    }, 450);
  }

  function searchBST(targetVal, onComplete) {
    if (isTraversing) return;
    isTraversing = true;
    const path = targetVal === 60 ? ['n50', 'n70', 'n60'] : ['n50', 'n30', 'n20'];
    let step = 0;

    const interval = setInterval(() => {
      if (step < path.length) {
        const item = nodeMap.get(path[step]);
        if (item) {
          item.sphere.material.color.set('#10b981');
          item.sphere.material.emissive.set('#059669');
          item.group.scale.set(1.35, 1.35, 1.35);

          setTimeout(() => {
            item.sphere.material.color.set('#0284c7');
            item.sphere.material.emissive.set('#0369a1');
            item.group.scale.set(1.0, 1.0, 1.0);
          }, 400);
        }
        step++;
      } else {
        clearInterval(interval);
        isTraversing = false;
        if (onComplete) onComplete(targetVal);
      }
    }, 550);
  }

  function interact() {
    runInOrderTraversal();
    return 'Triggered In-Order BST Traversal: 20 -> 30 -> 40 -> 50 -> 60 -> 70 -> 80 (Sorted output!)';
  }

  function update(delta) {
    const time = performance.now() * 0.002;
    nodeMeshList.forEach((item, i) => {
      item.group.rotation.y = Math.sin(time + i * 0.7) * 0.1;
    });
  }

  // Register Apparatus Center Collider
  registerInteractive(apparatusGroup, '3D Binary Search Tree (BST) Apparatus', { widthX: 7.2, widthZ: 7.2 });

  return {
    group: root,
    update: update,
    runInOrderTraversal: runInOrderTraversal,
    searchBST: searchBST,
    interact: interact,
    interactionCenter: new THREE.Vector3(0, 0, 20),
  };
}
