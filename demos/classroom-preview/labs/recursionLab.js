import * as THREE from 'three';

/**
 * Recursion Chamber Apparatus & Wing (Enlarged & Walkable with Solid Wall Colliders)
 */
export function createRecursionLab(COLORS, parentColliders, registerInteractive) {
  const root = new THREE.Group();
  root.name = 'RecursionChamberWing';
  root.position.set(0, 0, -20);

  const roomSize = 14;
  const wallHeight = 7.0;
  const wallThickness = 0.4;
  const doorWidth = 3.6;

  // Materials
  const floorMat = new THREE.MeshStandardMaterial({
    color: '#d6cbbe',
    roughness: 0.65,
    metalness: 0.05,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: '#5a5250',
    roughness: 0.85,
    metalness: 0.02,
  });

  const violetGlowMat = new THREE.MeshStandardMaterial({
    color: '#8b5cf6',
    emissive: '#6d28d9',
    emissiveIntensity: 0.7,
    roughness: 0.2,
    metalness: 0.7,
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
  // North Wall (Outer)
  const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, wallThickness), wallMat);
  wallNorth.position.set(0, wallHeight / 2, -roomSize / 2 - wallThickness / 2);
  addWallCollider(wallNorth, 'Recursion Chamber North Outer Wall', roomSize, wallThickness);

  // West Wall
  const wallWest = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, roomSize), wallMat);
  wallWest.position.set(-roomSize / 2 - wallThickness / 2, wallHeight / 2, 0);
  addWallCollider(wallWest, 'Recursion Chamber West Wall', wallThickness, roomSize);

  // East Wall
  const wallEast = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, roomSize), wallMat);
  wallEast.position.set(roomSize / 2 + wallThickness / 2, wallHeight / 2, 0);
  addWallCollider(wallEast, 'Recursion Chamber East Wall', wallThickness, roomSize);

  // South Wall Segments (with wide entrance |x| <= 1.8)
  const southWingLen = (roomSize - doorWidth) / 2;
  const wallSouthW = new THREE.Mesh(new THREE.BoxGeometry(southWingLen, wallHeight, wallThickness), wallMat);
  wallSouthW.position.set(-roomSize / 2 + southWingLen / 2, wallHeight / 2, roomSize / 2 + wallThickness / 2);
  addWallCollider(wallSouthW, 'Recursion South Wall (West Section)', southWingLen, wallThickness);

  const wallSouthE = new THREE.Mesh(new THREE.BoxGeometry(southWingLen, wallHeight, wallThickness), wallMat);
  wallSouthE.position.set(roomSize / 2 - southWingLen / 2, wallHeight / 2, roomSize / 2 + wallThickness / 2);
  addWallCollider(wallSouthE, 'Recursion South Wall (East Section)', southWingLen, wallThickness);

  const wallSouthLintel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 2.4, wallThickness), wallMat);
  wallSouthLintel.position.set(0, wallHeight - 1.2, roomSize / 2 + wallThickness / 2);
  root.add(wallSouthLintel);

  // 2. Wide Connecting Corridor (North wing corridor to Main Classroom)
  const corridorLen = 10.0;
  const corridorFloor = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 0.38, corridorLen), floorMat);
  corridorFloor.position.set(0, -0.2, roomSize / 2 + corridorLen / 2);
  corridorFloor.receiveShadow = true;
  root.add(corridorFloor);

  const corridorWallW = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, corridorLen), wallMat);
  corridorWallW.position.set(-doorWidth / 2 - wallThickness / 2, wallHeight / 2, roomSize / 2 + corridorLen / 2);
  addWallCollider(corridorWallW, 'Recursion Corridor West Wall', wallThickness, corridorLen);

  const corridorWallE = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, corridorLen), wallMat);
  corridorWallE.position.set(doorWidth / 2 + wallThickness / 2, wallHeight / 2, roomSize / 2 + corridorLen / 2);
  addWallCollider(corridorWallE, 'Recursion Corridor East Wall', wallThickness, corridorLen);

  // Door Portal Banner Signboard
  function createDoorSign(text) {
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 4.0, roomSize / 2 + 0.1);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.75, 0.1),
      new THREE.MeshStandardMaterial({ color: '#1e1b18', roughness: 0.4 })
    );
    signGroup.add(frame);

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(3.05, 0.62, 0.12),
      new THREE.MeshStandardMaterial({ color: '#7c3aed', emissive: '#6d28d9', emissiveIntensity: 0.6 })
    );
    signGroup.add(plate);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#c4b5fd';
    ctx.font = 'bold 36px sans-serif';
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

  root.add(createDoorSign('RECURSION CHAMBER'));

  // 3. RECURSION CALL-STACK ELEVATOR APPARATUS
  const apparatusGroup = new THREE.Group();
  apparatusGroup.position.set(0, 0, 0);
  root.add(apparatusGroup);

  const baseMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.6, 0.4, 32),
    new THREE.MeshStandardMaterial({ color: '#1e1b4b', roughness: 0.3, metalness: 0.6 })
  );
  baseMesh.position.y = 0.2;
  baseMesh.receiveShadow = true;
  apparatusGroup.add(baseMesh);

  const glassTower = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 4.6, 24, 1, true),
    new THREE.MeshStandardMaterial({
      color: '#c4b5fd',
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      metalness: 0.2,
      side: THREE.DoubleSide,
    })
  );
  glassTower.position.y = 2.7;
  apparatusGroup.add(glassTower);

  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.8, 12), violetGlowMat);
    pillar.position.set(Math.cos(ang) * 1.7, 2.6, Math.sin(ang) * 1.7);
    apparatusGroup.add(pillar);
  }

  const stackFramesData = [
    { n: 1, call: 'fact(1) -> 1 [BASE]', result: 1, isBase: true },
    { n: 2, call: 'fact(2) -> 2 * fact(1)', result: 2, isBase: false },
    { n: 3, call: 'fact(3) -> 3 * fact(2)', result: 6, isBase: false },
    { n: 4, call: 'fact(4) -> 4 * fact(3)', result: 24, isBase: false },
  ];

  const frameMeshes = [];
  const framesContainer = new THREE.Group();
  apparatusGroup.add(framesContainer);

  function rebuildStackFrames(activeCount = 4) {
    while (framesContainer.children.length > 0) {
      framesContainer.remove(framesContainer.children[0]);
    }
    frameMeshes.length = 0;

    for (let i = 0; i < activeCount; i++) {
      const frameData = stackFramesData[i];
      const frameGroup = new THREE.Group();
      frameGroup.position.set(0, 0.85 + i * 0.98, 0);
      framesContainer.add(frameGroup);

      const frameDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(1.28, 1.28, 0.52, 24),
        new THREE.MeshStandardMaterial({
          color: frameData.isBase ? '#10b981' : '#7c3aed',
          emissive: frameData.isBase ? '#059669' : '#5b21b6',
          emissiveIntensity: 0.55,
          roughness: 0.3,
        })
      );
      frameDisc.castShadow = true;
      frameGroup.add(frameDisc);

      const fCanvas = document.createElement('canvas');
      fCanvas.width = 512;
      fCanvas.height = 128;
      const fctx = fCanvas.getContext('2d');
      fctx.fillStyle = frameData.isBase ? '#064e3b' : '#3b0764';
      fctx.fillRect(0, 0, 512, 128);
      fctx.fillStyle = '#f5f3ff';
      fctx.font = 'bold 34px monospace';
      fctx.textAlign = 'center';
      fctx.textBaseline = 'middle';
      fctx.fillText(frameData.call, 256, 64);

      const fTex = new THREE.CanvasTexture(fCanvas);
      const fLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.48), new THREE.MeshBasicMaterial({ map: fTex }));
      fLabel.position.set(0, 0, 1.3);
      frameGroup.add(fLabel);

      frameMeshes.push(frameGroup);
    }
  }

  rebuildStackFrames(4);

  // 4. Blackboard on North Wall
  const theoryBoard = new THREE.Group();
  theoryBoard.position.set(0, 3.4, -roomSize / 2 + 0.08);
  root.add(theoryBoard);

  const tbCanvas = document.createElement('canvas');
  tbCanvas.width = 1024;
  tbCanvas.height = 512;
  const tbCtx = tbCanvas.getContext('2d');
  tbCtx.fillStyle = '#0f172a';
  tbCtx.fillRect(0, 0, 1024, 512);
  tbCtx.fillStyle = '#a78bfa';
  tbCtx.font = 'bold 36px sans-serif';
  tbCtx.fillText('RECURSION CALL STACK — EXECUTION & RETURN UNWINDING', 40, 60);
  tbCtx.fillStyle = '#f8fafc';
  tbCtx.font = '28px monospace';
  tbCtx.fillText('• 1. Base Case: Halting condition prevents infinite loop recursion', 40, 130);
  tbCtx.fillText('• 2. Recursive Step: Function pushes new activation frame to Stack', 40, 190);
  tbCtx.fillText('• 3. Call Stack Unwinding: Returns propagate upward O(N) auxiliary space', 40, 250);
  tbCtx.fillText('• Walk close & Press [E] to unwind call stack returns!', 40, 310);
  tbCtx.fillStyle = '#fbbf24';
  tbCtx.fillText('Current State: factorial(4) -> 4 * 3 * 2 * 1 = 24', 40, 400);

  const tbTex = new THREE.CanvasTexture(tbCanvas);
  const tbMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.5), new THREE.MeshBasicMaterial({ map: tbTex }));
  tbMesh.position.z = 0.05;
  theoryBoard.add(tbMesh);

  // Interactive APIs
  let currentDepth = 4;
  let isUnwinding = false;

  function pushFrame() {
    if (currentDepth >= 4) return;
    currentDepth++;
    rebuildStackFrames(currentDepth);
  }

  function unwindCallStack(onComplete) {
    if (isUnwinding || currentDepth <= 0) return;
    isUnwinding = true;
    let step = currentDepth;

    const interval = setInterval(() => {
      if (step > 0) {
        step--;
        rebuildStackFrames(step);
      } else {
        clearInterval(interval);
        isUnwinding = false;
        setTimeout(() => {
          currentDepth = 4;
          rebuildStackFrames(4);
          if (onComplete) onComplete(24);
        }, 800);
      }
    }, 550);
  }

  function interact() {
    unwindCallStack();
    return 'Unwinding Recursion Tower: Base case reached -> Factorial(4) returned 24!';
  }

  function update(delta) {
    const time = performance.now() * 0.002;
    frameMeshes.forEach((mesh, i) => {
      mesh.rotation.y = Math.sin(time + i * 0.5) * 0.06;
    });
  }

  // Register Apparatus Center Collider
  registerInteractive(apparatusGroup, 'Recursion Call-Stack Elevator Tower', { widthX: 4.2, widthZ: 4.2 });

  return {
    group: root,
    update: update,
    pushFrame: pushFrame,
    unwindCallStack: unwindCallStack,
    interact: interact,
    getDepth: () => currentDepth,
    interactionCenter: new THREE.Vector3(0, 0, -20),
  };
}
