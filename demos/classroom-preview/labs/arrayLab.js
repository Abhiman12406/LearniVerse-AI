import * as THREE from 'three';

/**
 * Array Station Apparatus & Wing (Enlarged & Walkable with Solid Wall Colliders)
 */
export function createArrayLab(COLORS, parentColliders, registerInteractive) {
  const root = new THREE.Group();
  root.name = 'ArrayLabWing';
  root.position.set(-20, 0, 0);

  const roomSize = 14;
  const wallHeight = 6.0;
  const wallThickness = 0.4;
  const doorWidth = 3.6;

  // Materials
  const floorMat = new THREE.MeshStandardMaterial({
    color: '#e4d8c8',
    roughness: 0.6,
    metalness: 0.05,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: '#6e625d',
    roughness: 0.85,
    metalness: 0.02,
  });

  const orangeAccentMat = new THREE.MeshStandardMaterial({
    color: '#f97316',
    emissive: '#ea580c',
    emissiveIntensity: 0.5,
    roughness: 0.3,
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

  // Helper to add mesh to root and register as solid obstacle collider
  function addWallCollider(mesh, name, widthX, widthZ) {
    mesh.receiveShadow = true;
    root.add(mesh);
    registerInteractive(mesh, name, { widthX, widthZ });
  }

  // Outer Walls with Solid Colliders
  // West Wall (Outer)
  const wallWest = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, roomSize), wallMat);
  wallWest.position.set(-roomSize / 2 - wallThickness / 2, wallHeight / 2, 0);
  addWallCollider(wallWest, 'Array Lab West Outer Wall', wallThickness, roomSize);

  // North Wall
  const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, wallThickness), wallMat);
  wallNorth.position.set(0, wallHeight / 2, -roomSize / 2 - wallThickness / 2);
  addWallCollider(wallNorth, 'Array Lab North Wall', roomSize, wallThickness);

  // South Wall
  const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, wallThickness), wallMat);
  wallSouth.position.set(0, wallHeight / 2, roomSize / 2 + wallThickness / 2);
  addWallCollider(wallSouth, 'Array Lab South Wall', roomSize, wallThickness);

  // East Wall Segments (with wide entrance |z| <= 1.8)
  const eastWingLen = (roomSize - doorWidth) / 2;
  const wallEastN = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, eastWingLen), wallMat);
  wallEastN.position.set(roomSize / 2 + wallThickness / 2, wallHeight / 2, -roomSize / 2 + eastWingLen / 2);
  addWallCollider(wallEastN, 'Array Lab East Wall (North Section)', wallThickness, eastWingLen);

  const wallEastS = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, eastWingLen), wallMat);
  wallEastS.position.set(roomSize / 2 + wallThickness / 2, wallHeight / 2, roomSize / 2 - eastWingLen / 2);
  addWallCollider(wallEastS, 'Array Lab East Wall (South Section)', wallThickness, eastWingLen);

  const wallEastLintel = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, 2.2, doorWidth), wallMat);
  wallEastLintel.position.set(roomSize / 2 + wallThickness / 2, wallHeight - 1.1, 0);
  root.add(wallEastLintel);

  // 2. Wide Connecting Corridor (West wing corridor to Main Classroom)
  const corridorLen = 10.0;
  const corridorFloor = new THREE.Mesh(new THREE.BoxGeometry(corridorLen, 0.38, doorWidth), floorMat);
  corridorFloor.position.set(roomSize / 2 + corridorLen / 2, -0.2, 0);
  corridorFloor.receiveShadow = true;
  root.add(corridorFloor);

  const corridorWallN = new THREE.Mesh(new THREE.BoxGeometry(corridorLen, wallHeight, wallThickness), wallMat);
  corridorWallN.position.set(roomSize / 2 + corridorLen / 2, wallHeight / 2, -doorWidth / 2 - wallThickness / 2);
  addWallCollider(corridorWallN, 'Array Corridor North Wall', corridorLen, wallThickness);

  const corridorWallS = new THREE.Mesh(new THREE.BoxGeometry(corridorLen, wallHeight, wallThickness), wallMat);
  corridorWallS.position.set(roomSize / 2 + corridorLen / 2, wallHeight / 2, doorWidth / 2 + wallThickness / 2);
  addWallCollider(corridorWallS, 'Array Corridor South Wall', corridorLen, wallThickness);

  // Door Portal Banner Signboard
  function createDoorSign(text) {
    const signGroup = new THREE.Group();
    signGroup.position.set(roomSize / 2 + 0.1, 4.0, 0);
    signGroup.rotation.y = -Math.PI / 2;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.75, 0.1),
      new THREE.MeshStandardMaterial({ color: '#1e1b18', roughness: 0.4 })
    );
    signGroup.add(frame);

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(3.05, 0.62, 0.12),
      new THREE.MeshStandardMaterial({ color: '#0284c7', emissive: '#0369a1', emissiveIntensity: 0.6 })
    );
    signGroup.add(plate);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#38bdf8';
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

  root.add(createDoorSign('ARRAY STATION LAB'));

  // 3. ARRAY STATION APPARATUS
  const apparatusGroup = new THREE.Group();
  apparatusGroup.position.set(0, 0, 0);
  root.add(apparatusGroup);

  const arrayValues = [12, 45, 78, 99, 33];
  const bayCount = arrayValues.length;
  const baySpacing = 1.6;
  const totalW = (bayCount - 1) * baySpacing;
  const startX = -totalW / 2;

  const valueMeshes = [];
  const textCanvases = [];

  const baseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(totalW + 2.2, 0.35, 2.0),
    new THREE.MeshStandardMaterial({ color: '#292524', roughness: 0.4, metalness: 0.3 })
  );
  baseMesh.position.set(0, 0.175, 0);
  baseMesh.receiveShadow = true;
  apparatusGroup.add(baseMesh);

  // Laser Pointer Carriage
  const pointerGroup = new THREE.Group();
  pointerGroup.position.set(startX, 2.1, 0);
  apparatusGroup.add(pointerGroup);

  const pointerCarriage = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5), orangeAccentMat);
  pointerGroup.add(pointerCarriage);

  const pointerBeacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8),
    new THREE.MeshBasicMaterial({ color: '#fb923c', transparent: true, opacity: 0.85 })
  );
  pointerBeacon.position.y = -0.55;
  pointerGroup.add(pointerBeacon);

  const pointerLight = new THREE.PointLight(0xf97316, 2.5, 4.0);
  pointerLight.position.y = -0.7;
  pointerGroup.add(pointerLight);

  // Memory Bays
  for (let i = 0; i < bayCount; i++) {
    const bayX = startX + i * baySpacing;
    const bay = new THREE.Group();
    bay.position.set(bayX, 0.35, 0);
    apparatusGroup.add(bay);

    const chamber = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.65, 1.1),
      new THREE.MeshStandardMaterial({
        color: '#0284c7',
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
        metalness: 0.2,
      })
    );
    chamber.position.y = 0.325;
    bay.add(chamber);

    const dataCube = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.52, 0.75),
      new THREE.MeshStandardMaterial({
        color: '#0284c7',
        emissive: '#0369a1',
        emissiveIntensity: 0.35,
        roughness: 0.3,
      })
    );
    dataCube.position.y = 0.92;
    dataCube.castShadow = true;
    bay.add(dataCube);
    valueMeshes.push(dataCube);

    const valCanvas = document.createElement('canvas');
    valCanvas.width = 256;
    valCanvas.height = 256;
    const vctx = valCanvas.getContext('2d');
    vctx.fillStyle = '#0369a1';
    vctx.fillRect(0, 0, 256, 256);
    vctx.fillStyle = '#ffffff';
    vctx.font = 'bold 80px sans-serif';
    vctx.textAlign = 'center';
    vctx.textBaseline = 'middle';
    vctx.fillText(String(arrayValues[i]), 128, 128);

    const valTex = new THREE.CanvasTexture(valCanvas);
    const valLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.45),
      new THREE.MeshBasicMaterial({ map: valTex })
    );
    valLabel.position.set(0, 0.92, 0.385);
    bay.add(valLabel);

    const idxCanvas = document.createElement('canvas');
    idxCanvas.width = 256;
    idxCanvas.height = 128;
    const ictx = idxCanvas.getContext('2d');
    ictx.fillStyle = '#0f172a';
    ictx.fillRect(0, 0, 256, 128);
    ictx.fillStyle = '#38bdf8';
    ictx.font = 'bold 44px monospace';
    ictx.textAlign = 'center';
    ictx.textBaseline = 'middle';
    ictx.fillText(`INDEX [${i}]`, 128, 44);
    ictx.fillStyle = '#94a3b8';
    ictx.font = '26px monospace';
    ictx.fillText(`0x100${i * 4}`, 128, 92);

    const idxTex = new THREE.CanvasTexture(idxCanvas);
    const idxPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.45),
      new THREE.MeshBasicMaterial({ map: idxTex })
    );
    idxPlate.position.set(0, 0.32, 0.56);
    bay.add(idxPlate);

    textCanvases.push({ valCanvas, valTex, value: arrayValues[i], index: i });
  }

  // 4. Blackboard on West Wall
  const theoryBoard = new THREE.Group();
  theoryBoard.position.set(-roomSize / 2 + 0.08, 3.2, 0);
  theoryBoard.rotation.y = Math.PI / 2;
  root.add(theoryBoard);

  const tbCanvas = document.createElement('canvas');
  tbCanvas.width = 1024;
  tbCanvas.height = 512;
  const tbCtx = tbCanvas.getContext('2d');
  tbCtx.fillStyle = '#18181b';
  tbCtx.fillRect(0, 0, 1024, 512);
  tbCtx.fillStyle = '#38bdf8';
  tbCtx.font = 'bold 36px sans-serif';
  tbCtx.fillText('ARRAY MEMORY ARCHITECTURE — CONTIGUOUS ADDRESSING', 40, 60);
  tbCtx.fillStyle = '#f8fafc';
  tbCtx.font = '28px monospace';
  tbCtx.fillText('• Random Access Time Complexity: O(1) [Base + Index * Size]', 40, 130);
  tbCtx.fillText('• Sequential Linear Search: O(N) worst-case comparison', 40, 190);
  tbCtx.fillText('• Contiguous RAM Allocation: Fast Cache-Line Prefetching', 40, 250);
  tbCtx.fillText('• Walk close & Press [E] to test O(1) random access!', 40, 310);
  tbCtx.fillStyle = '#fb923c';
  tbCtx.fillText('Active Array: [12, 45, 78, 99, 33] | Size: 5 Elements', 40, 400);

  const tbTex = new THREE.CanvasTexture(tbCanvas);
  const tbMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.5), new THREE.MeshBasicMaterial({ map: tbTex }));
  tbMesh.position.z = 0.05;
  theoryBoard.add(tbMesh);

  // Student Workstation Desks along North & South Walls
  const benchN = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 1.0), woodMat);
  benchN.position.set(0, 0.425, -roomSize / 2 + 1.2);
  benchN.castShadow = true;
  addWallCollider(benchN, 'Array Workstation Bench North', 2.6, 1.2);

  const benchS = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 1.0), woodMat);
  benchS.position.set(0, 0.425, roomSize / 2 - 1.2);
  benchS.castShadow = true;
  addWallCollider(benchS, 'Array Workstation Bench South', 2.6, 1.2);

  // Interactive Apparatus API
  let activeIndex = 0;
  let targetPointerX = startX;

  function setTargetIndex(idx) {
    if (idx >= 0 && idx < bayCount) {
      activeIndex = idx;
      targetPointerX = startX + idx * baySpacing;

      valueMeshes.forEach((mesh, i) => {
        if (i === idx) {
          mesh.material.color.set('#f97316');
          mesh.material.emissive.set('#ea580c');
          mesh.material.emissiveIntensity = 0.85;
          mesh.scale.set(1.18, 1.18, 1.18);
        } else {
          mesh.material.color.set('#0284c7');
          mesh.material.emissive.set('#0369a1');
          mesh.material.emissiveIntensity = 0.35;
          mesh.scale.set(1.0, 1.0, 1.0);
        }
      });
    }
  }

  function triggerLinearScan(onComplete) {
    let currentStep = 0;
    const interval = setInterval(() => {
      setTargetIndex(currentStep);
      currentStep++;
      if (currentStep >= bayCount) {
        clearInterval(interval);
        if (onComplete) onComplete(arrayValues[bayCount - 1]);
      }
    }, 400);
  }

  function interact() {
    const nextIdx = (activeIndex + 1) % bayCount;
    setTargetIndex(nextIdx);
    return `Array Index [${nextIdx}] accessed: Value = ${arrayValues[nextIdx]} in O(1) time`;
  }

  function update(delta) {
    pointerGroup.position.x = THREE.MathUtils.lerp(pointerGroup.position.x, targetPointerX, delta * 8);
    const time = performance.now() * 0.003;
    valueMeshes.forEach((mesh, i) => {
      mesh.position.y = 0.92 + Math.sin(time + i * 0.8) * 0.04;
    });
  }

  // Register Apparatus Center Collider
  registerInteractive(apparatusGroup, 'Array Station Memory Bay Apparatus', { widthX: 6.8, widthZ: 2.2 });

  return {
    group: root,
    update: update,
    setTargetIndex: setTargetIndex,
    triggerLinearScan: triggerLinearScan,
    interact: interact,
    getValues: () => [...arrayValues],
    interactionCenter: new THREE.Vector3(-20, 0, 0),
  };
}
