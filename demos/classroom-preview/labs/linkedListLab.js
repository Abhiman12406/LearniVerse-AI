import * as THREE from 'three';

/**
 * Linked List Lab Apparatus & Wing (Enlarged & Walkable with Solid Wall Colliders)
 */
export function createLinkedListLab(COLORS, parentColliders, registerInteractive) {
  const root = new THREE.Group();
  root.name = 'LinkedListLabWing';
  root.position.set(20, 0, 0);

  const roomSize = 14;
  const wallHeight = 6.0;
  const wallThickness = 0.4;
  const doorWidth = 3.6;

  // Materials
  const floorMat = new THREE.MeshStandardMaterial({
    color: '#dad2c6',
    roughness: 0.65,
    metalness: 0.05,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: '#655e5b',
    roughness: 0.85,
    metalness: 0.02,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: COLORS.woodLight,
    roughness: 0.6,
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
  // East Wall (Outer)
  const wallEast = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, roomSize), wallMat);
  wallEast.position.set(roomSize / 2 + wallThickness / 2, wallHeight / 2, 0);
  addWallCollider(wallEast, 'Linked List Lab East Outer Wall', wallThickness, roomSize);

  // North Wall
  const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, wallThickness), wallMat);
  wallNorth.position.set(0, wallHeight / 2, -roomSize / 2 - wallThickness / 2);
  addWallCollider(wallNorth, 'Linked List Lab North Wall', roomSize, wallThickness);

  // South Wall
  const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, wallThickness), wallMat);
  wallSouth.position.set(0, wallHeight / 2, roomSize / 2 + wallThickness / 2);
  addWallCollider(wallSouth, 'Linked List Lab South Wall', roomSize, wallThickness);

  // West Wall Segments (with wide entrance |z| <= 1.8)
  const westWingLen = (roomSize - doorWidth) / 2;
  const wallWestN = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, westWingLen), wallMat);
  wallWestN.position.set(-roomSize / 2 - wallThickness / 2, wallHeight / 2, -roomSize / 2 + westWingLen / 2);
  addWallCollider(wallWestN, 'Linked List West Wall (North Section)', wallThickness, westWingLen);

  const wallWestS = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, westWingLen), wallMat);
  wallWestS.position.set(-roomSize / 2 - wallThickness / 2, wallHeight / 2, roomSize / 2 - westWingLen / 2);
  addWallCollider(wallWestS, 'Linked List West Wall (South Section)', wallThickness, westWingLen);

  const wallWestLintel = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, 2.2, doorWidth), wallMat);
  wallWestLintel.position.set(-roomSize / 2 - wallThickness / 2, wallHeight - 1.1, 0);
  root.add(wallWestLintel);

  // 2. Wide Connecting Corridor (East wing corridor to Main Classroom)
  const corridorLen = 10.0;
  const corridorFloor = new THREE.Mesh(new THREE.BoxGeometry(corridorLen, 0.38, doorWidth), floorMat);
  corridorFloor.position.set(-roomSize / 2 - corridorLen / 2, -0.2, 0);
  corridorFloor.receiveShadow = true;
  root.add(corridorFloor);

  const corridorWallN = new THREE.Mesh(new THREE.BoxGeometry(corridorLen, wallHeight, wallThickness), wallMat);
  corridorWallN.position.set(-roomSize / 2 - corridorLen / 2, wallHeight / 2, -doorWidth / 2 - wallThickness / 2);
  addWallCollider(corridorWallN, 'Linked List Corridor North Wall', corridorLen, wallThickness);

  const corridorWallS = new THREE.Mesh(new THREE.BoxGeometry(corridorLen, wallHeight, wallThickness), wallMat);
  corridorWallS.position.set(-roomSize / 2 - corridorLen / 2, wallHeight / 2, doorWidth / 2 + wallThickness / 2);
  addWallCollider(corridorWallS, 'Linked List Corridor South Wall', corridorLen, wallThickness);

  // Door Portal Banner Signboard
  function createDoorSign(text) {
    const signGroup = new THREE.Group();
    signGroup.position.set(-roomSize / 2 - 0.1, 4.0, 0);
    signGroup.rotation.y = Math.PI / 2;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.75, 0.1),
      new THREE.MeshStandardMaterial({ color: '#1e1b18', roughness: 0.4 })
    );
    signGroup.add(frame);

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(3.05, 0.62, 0.12),
      new THREE.MeshStandardMaterial({ color: '#059669', emissive: '#047857', emissiveIntensity: 0.6 })
    );
    signGroup.add(plate);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#6ee7b7';
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

  root.add(createDoorSign('LINKED LIST LAB'));

  // 3. LINKED LIST APPARATUS
  const apparatusGroup = new THREE.Group();
  apparatusGroup.position.set(0, 0, 0);
  root.add(apparatusGroup);

  const baseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(9.0, 0.35, 2.4),
    new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.4, metalness: 0.4 })
  );
  baseMesh.position.set(0, 0.175, 0);
  baseMesh.receiveShadow = true;
  apparatusGroup.add(baseMesh);

  let listData = [
    { id: 1, val: 10, nextId: 2 },
    { id: 2, val: 20, nextId: 3 },
    { id: 3, val: 30, nextId: 4 },
    { id: 4, val: 40, nextId: null },
  ];

  const nodeMeshes = [];
  const nodeContainer = new THREE.Group();
  apparatusGroup.add(nodeContainer);

  const pulseSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#34d399' })
  );
  pulseSphere.visible = false;
  apparatusGroup.add(pulseSphere);

  const pulseLight = new THREE.PointLight(0x34d399, 2.5, 3.5);
  pulseLight.visible = false;
  pulseSphere.add(pulseLight);

  function rebuildApparatusNodes() {
    while (nodeContainer.children.length > 0) {
      nodeContainer.remove(nodeContainer.children[0]);
    }
    nodeMeshes.length = 0;

    const count = listData.length;
    const spacing = 1.9;
    const startX = -((count - 1) * spacing) / 2;

    listData.forEach((item, i) => {
      const nodeX = startX + i * spacing;
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(nodeX, 1.25, 0);
      nodeContainer.add(nodeGroup);

      // Data Chamber
      const dataChamber = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.72, 0.72),
        new THREE.MeshStandardMaterial({ color: '#047857', emissive: '#065f46', emissiveIntensity: 0.45, roughness: 0.3 })
      );
      dataChamber.position.set(-0.38, 0, 0);
      dataChamber.castShadow = true;
      nodeGroup.add(dataChamber);

      const valCanvas = document.createElement('canvas');
      valCanvas.width = 256;
      valCanvas.height = 256;
      const vctx = valCanvas.getContext('2d');
      vctx.fillStyle = '#064e3b';
      vctx.fillRect(0, 0, 256, 256);
      vctx.fillStyle = '#a7f3d0';
      vctx.font = 'bold 80px sans-serif';
      vctx.textAlign = 'center';
      vctx.textBaseline = 'middle';
      vctx.fillText(String(item.val), 128, 128);

      const valTex = new THREE.CanvasTexture(valCanvas);
      const valLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.6),
        new THREE.MeshBasicMaterial({ map: valTex })
      );
      valLabel.position.set(-0.38, 0, 0.37);
      nodeGroup.add(valLabel);

      // Pointer Core
      const ptrCore = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.72, 0.72),
        new THREE.MeshStandardMaterial({ color: '#7c3aed', emissive: '#6d28d9', emissiveIntensity: 0.5, roughness: 0.3 })
      );
      ptrCore.position.set(0.24, 0, 0);
      ptrCore.castShadow = true;
      nodeGroup.add(ptrCore);

      const ptrCanvas = document.createElement('canvas');
      ptrCanvas.width = 128;
      ptrCanvas.height = 256;
      const pctx = ptrCanvas.getContext('2d');
      pctx.fillStyle = '#4c1d95';
      pctx.fillRect(0, 0, 128, 256);
      pctx.fillStyle = '#e9d5ff';
      pctx.font = 'bold 36px monospace';
      pctx.textAlign = 'center';
      pctx.textBaseline = 'middle';
      pctx.fillText('NEXT', 64, 128);

      const ptrTex = new THREE.CanvasTexture(ptrCanvas);
      const ptrLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.36, 0.6),
        new THREE.MeshBasicMaterial({ map: ptrTex })
      );
      ptrLabel.position.set(0.24, 0, 0.37);
      nodeGroup.add(ptrLabel);

      // Pointer Beam
      if (i < count - 1) {
        const beamLen = spacing - 0.85;
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, beamLen, 12),
          new THREE.MeshBasicMaterial({ color: '#34d399' })
        );
        beam.rotation.z = Math.PI / 2;
        beam.position.set(nodeX + 0.46 + beamLen / 2, 1.25, 0);
        nodeContainer.add(beam);

        const arrow = new THREE.Mesh(
          new THREE.ConeGeometry(0.14, 0.24, 12),
          new THREE.MeshBasicMaterial({ color: '#10b981' })
        );
        arrow.rotation.z = -Math.PI / 2;
        arrow.position.set(nodeX + 0.46 + beamLen, 1.25, 0);
        nodeContainer.add(arrow);
      } else {
        const nullBadge = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.35, 0.1),
          new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#991b1b', emissiveIntensity: 0.6 })
        );
        nullBadge.position.set(nodeX + 0.85, 1.25, 0);
        nodeContainer.add(nullBadge);

        const nullCanvas = document.createElement('canvas');
        nullCanvas.width = 128;
        nullCanvas.height = 64;
        const nctx = nullCanvas.getContext('2d');
        nctx.fillStyle = '#7f1d1d';
        nctx.fillRect(0, 0, 128, 64);
        nctx.fillStyle = '#fecaca';
        nctx.font = 'bold 30px monospace';
        nctx.textAlign = 'center';
        nctx.textBaseline = 'middle';
        nctx.fillText('NULL', 64, 32);

        const nullTex = new THREE.CanvasTexture(nullCanvas);
        const nullLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.28), new THREE.MeshBasicMaterial({ map: nullTex }));
        nullLabel.position.set(nodeX + 0.85, 1.25, 0.06);
        nodeContainer.add(nullLabel);
      }

      nodeMeshes.push(nodeGroup);
    });
  }

  rebuildApparatusNodes();

  // 4. Blackboard on East Wall
  const theoryBoard = new THREE.Group();
  theoryBoard.position.set(roomSize / 2 - 0.08, 3.2, 0);
  theoryBoard.rotation.y = -Math.PI / 2;
  root.add(theoryBoard);

  const tbCanvas = document.createElement('canvas');
  tbCanvas.width = 1024;
  tbCanvas.height = 512;
  const tbCtx = tbCanvas.getContext('2d');
  tbCtx.fillStyle = '#111827';
  tbCtx.fillRect(0, 0, 1024, 512);
  tbCtx.fillStyle = '#34d399';
  tbCtx.font = 'bold 36px sans-serif';
  tbCtx.fillText('LINKED LIST ARCHITECTURE — DYNAMIC HEAP ALLOCATION', 40, 60);
  tbCtx.fillStyle = '#f9fafb';
  tbCtx.font = '28px monospace';
  tbCtx.fillText('• Node Structure: [ Data Value | *Next Pointer Reference ]', 40, 130);
  tbCtx.fillText('• Dynamic Memory: Non-contiguous heap allocation O(1) prepend', 40, 190);
  tbCtx.fillText('• Traversal Time: O(N) sequential pointer dereferencing', 40, 250);
  tbCtx.fillText('• Walk close & Press [E] to traverse the pointer chain!', 40, 310);
  tbCtx.fillStyle = '#a7f3d0';
  tbCtx.fillText('Chain: HEAD -> [10] -> [20] -> [30] -> [40] -> NULL', 40, 400);

  const tbTex = new THREE.CanvasTexture(tbCanvas);
  const tbMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.5), new THREE.MeshBasicMaterial({ map: tbTex }));
  tbMesh.position.z = 0.05;
  theoryBoard.add(tbMesh);

  // Interactive APIs
  let isTraversing = false;

  function traverseList(onComplete) {
    if (isTraversing || listData.length === 0) return;
    isTraversing = true;
    pulseSphere.visible = true;
    pulseLight.visible = true;

    const count = listData.length;
    const spacing = 1.9;
    const startX = -((count - 1) * spacing) / 2;
    let step = 0;

    pulseSphere.position.set(startX, 1.25, 0);

    const interval = setInterval(() => {
      if (step < count) {
        const currentX = startX + step * spacing;
        pulseSphere.position.x = currentX;

        if (nodeMeshes[step]) {
          nodeMeshes[step].scale.set(1.22, 1.22, 1.22);
          setTimeout(() => {
            if (nodeMeshes[step]) nodeMeshes[step].scale.set(1.0, 1.0, 1.0);
          }, 250);
        }
        step++;
      } else {
        clearInterval(interval);
        pulseSphere.visible = false;
        pulseLight.visible = false;
        isTraversing = false;
        if (onComplete) onComplete(listData.map((d) => d.val));
      }
    }, 450);
  }

  function insertNode(val) {
    if (listData.length >= 5) return;
    const newId = Date.now();
    listData.push({ id: newId, val: val || (listData.length + 1) * 10, nextId: null });
    if (listData.length > 1) {
      listData[listData.length - 2].nextId = newId;
    }
    rebuildApparatusNodes();
  }

  function deleteNode() {
    if (listData.length <= 1) return;
    listData.pop();
    listData[listData.length - 1].nextId = null;
    rebuildApparatusNodes();
  }

  function interact() {
    traverseList();
    return `Traversed Linked List: HEAD -> ${listData.map(d => d.val).join(' -> ')} -> NULL`;
  }

  function update(delta) {
    const time = performance.now() * 0.003;
    nodeMeshes.forEach((mesh, i) => {
      mesh.position.y = 1.25 + Math.sin(time + i * 0.9) * 0.05;
    });
  }

  // Register Apparatus Center Collider
  registerInteractive(apparatusGroup, 'Linked List Node Chain Apparatus', { widthX: 7.8, widthZ: 2.2 });

  return {
    group: root,
    update: update,
    traverseList: traverseList,
    insertNode: insertNode,
    deleteNode: deleteNode,
    interact: interact,
    getData: () => [...listData],
    interactionCenter: new THREE.Vector3(20, 0, 0),
  };
}
