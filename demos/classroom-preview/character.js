import * as THREE from 'three';

/**
 * Procedural 3D Student Character with Camera-Relative Locomotion & Sliding Collisions
 * Supports full 5-room campus roaming across corridors and doorways.
 */
export function createStudentCharacter() {
  const characterGroup = new THREE.Group();
  characterGroup.name = 'AnimatedStudentCharacter';

  // --- PALETTE & MATERIALS ---
  const SKIN_COLOR = '#f8c29b';
  const HAIR_COLOR = '#5a311b';
  const SHORTS_COLOR = '#18191d';
  const BACKPACK_COLOR = '#0ea5e9';
  const PENCIL_YELLOW = '#f59e0b';
  const PENCIL_WOOD = '#fde68a';
  const PENCIL_LEAD = '#1f2937';
  const PENCIL_GREEN = '#16a34a';
  const BOOK_COVER = '#f8fafc';
  const BOOK_SPINE = '#15803d';
  const BOOK_PAGES = '#e2e8f0';
  const SHOE_BLACK = '#18181b';
  const SHOE_WHITE = '#ffffff';

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(SKIN_COLOR),
    roughness: 0.55,
    metalness: 0.05,
  });

  const hairMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(HAIR_COLOR),
    roughness: 0.65,
    metalness: 0.08,
  });

  const shortsMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(SHORTS_COLOR),
    roughness: 0.7,
    metalness: 0.05,
  });

  const backpackMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BACKPACK_COLOR),
    roughness: 0.45,
    metalness: 0.1,
  });

  // Procedural Striped Shirt
  function createStripedTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const numStripes = 8;
    const stripeHeight = canvas.height / numStripes;

    for (let i = 0; i < numStripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#1e3a8a' : '#f8fafc';
      ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  const stripedTexture = createStripedTexture();
  const shirtMaterial = new THREE.MeshStandardMaterial({
    map: stripedTexture,
    roughness: 0.6,
    metalness: 0.05,
  });

  // Procedural Face
  function createFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = SKIN_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(310, 410);
    ctx.quadraticCurveTo(390, 360, 460, 420);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(564, 420);
    ctx.quadraticCurveTo(634, 360, 714, 410);
    ctx.stroke();

    const drawEye = (x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 44, 58, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(14, -18, 14, 20, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(-12, 18, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawEye(385, 490);
    drawEye(639, 490);

    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.ellipse(290, 560, 44, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(734, 560, 44, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(512, 580, 80, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  const faceTexture = createFaceTexture();
  const faceMaterial = new THREE.MeshStandardMaterial({
    map: faceTexture,
    roughness: 0.55,
    metalness: 0.05,
  });

  // --- RIG HIERARCHY ---
  const rootAnchor = new THREE.Group();
  characterGroup.add(rootAnchor);

  // Pelvis / Hips
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, 0.82, 0);
  rootAnchor.add(pelvisGroup);

  const shortsMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.35, 0.30, 20),
    shortsMaterial
  );
  shortsMesh.position.set(0, 0.05, 0);
  shortsMesh.castShadow = true;
  pelvisGroup.add(shortsMesh);

  // Torso / Spine
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.20, 0);
  pelvisGroup.add(torsoGroup);

  const shirtMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.39, 0.38, 0.52, 20),
    shirtMaterial
  );
  shirtMesh.position.set(0, 0.26, 0);
  shirtMesh.castShadow = true;
  torsoGroup.add(shirtMesh);

  // Backpack
  const backpackMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.54, 0.28),
    backpackMaterial
  );
  backpackMesh.position.set(0, 0.26, -0.25);
  backpackMesh.castShadow = true;
  torsoGroup.add(backpackMesh);

  // Pencils in Backpack
  const createPencil = (color, x, y, rotZ) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(x, y, -0.32);
    pGroup.rotation.z = rotZ;

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6),
      new THREE.MeshStandardMaterial({ color: color })
    );
    pGroup.add(body);

    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.015, 0.05, 6),
      new THREE.MeshStandardMaterial({ color: PENCIL_WOOD })
    );
    tip.position.y = 0.135;
    pGroup.add(tip);

    torsoGroup.add(pGroup);
  };
  createPencil(PENCIL_YELLOW, -0.09, 0.54, -0.15);
  createPencil(PENCIL_GREEN, 0.09, 0.54, 0.18);

  // Neck & Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.63, 0);
  torsoGroup.add(headGroup);

  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.15, 0.16, 16),
    skinMaterial
  );
  neckMesh.position.set(0, -0.02, 0);
  headGroup.add(neckMesh);

  const headFaceMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.44, 28, 28),
    faceMaterial
  );
  headFaceMesh.rotation.y = -Math.PI / 2;
  headFaceMesh.position.set(0, 0.32, 0);
  headFaceMesh.castShadow = true;
  headGroup.add(headFaceMesh);

  // Stylized Hair
  const hairBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.47, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMaterial
  );
  hairBase.position.set(0, 0.34, -0.02);
  hairBase.castShadow = true;
  headGroup.add(hairBase);

  function createHairLock(x, y, z, rx, ry, rz, scale) {
    const lock = new THREE.Mesh(
      new THREE.ConeGeometry(0.12 * scale, 0.32 * scale, 8),
      hairMaterial
    );
    lock.position.set(x, y, z);
    lock.rotation.set(rx, ry, rz);
    headGroup.add(lock);
  }
  createHairLock(0.24, 0.70, 0.22, 0.4, 0.2, -0.6, 1.3);
  createHairLock(-0.15, 0.73, 0.24, 0.5, -0.3, 0.4, 1.4);
  createHairLock(0.04, 0.76, 0.26, 0.6, 0, 0.1, 1.5);
  createHairLock(0.38, 0.50, 0.12, 0.1, 0.4, -0.8, 1.1);
  createHairLock(-0.38, 0.50, 0.12, 0.1, -0.4, 0.8, 1.1);

  // ARMS
  // Right Arm (Swings dynamically)
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(-0.46, 0.46, 0);
  torsoGroup.add(rightArmPivot);

  const rShoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), shirtMaterial);
  rightArmPivot.add(rShoulderMesh);

  const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.32, 12), skinMaterial);
  rArmMesh.position.set(0, -0.20, 0);
  rArmMesh.castShadow = true;
  rightArmPivot.add(rArmMesh);

  const rHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 12), skinMaterial);
  rHandMesh.position.set(0, -0.38, 0);
  rightArmPivot.add(rHandMesh);

  // Left Arm (Holds book in front)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(0.46, 0.46, 0);
  torsoGroup.add(leftArmPivot);

  const lShoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), shirtMaterial);
  leftArmPivot.add(lShoulderMesh);

  const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.32, 12), skinMaterial);
  lArmMesh.position.set(0, -0.18, 0.08);
  lArmMesh.rotation.x = -0.45;
  lArmMesh.castShadow = true;
  leftArmPivot.add(lArmMesh);

  const lHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 12), skinMaterial);
  lHandMesh.position.set(0, -0.32, 0.22);
  leftArmPivot.add(lHandMesh);

  // Book in Left Arm
  const bookGroup = new THREE.Group();
  bookGroup.position.set(-0.06, -0.28, 0.28);
  bookGroup.rotation.set(0.2, 0.3, -0.1);
  leftArmPivot.add(bookGroup);

  const bookCover = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.36, 0.06),
    new THREE.MeshStandardMaterial({ color: BOOK_COVER })
  );
  bookGroup.add(bookCover);

  const bookSpine = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.36, 0.065),
    new THREE.MeshStandardMaterial({ color: BOOK_SPINE })
  );
  bookSpine.position.set(-0.12, 0, 0);
  bookGroup.add(bookSpine);

  // LEGS
  function createLegAssembly() {
    const hipPivot = new THREE.Group();

    const thighMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.09, 0.44, 14),
      skinMaterial
    );
    thighMesh.position.set(0, -0.24, 0);
    thighMesh.castShadow = true;
    hipPivot.add(thighMesh);

    const sockMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.092, 0.16, 14),
      new THREE.MeshStandardMaterial({ color: SHOE_WHITE })
    );
    sockMesh.position.set(0, -0.42, 0);
    hipPivot.add(sockMesh);

    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.54, 0.06);
    hipPivot.add(shoeGroup);

    const shoeSole = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.06, 0.34),
      new THREE.MeshStandardMaterial({ color: SHOE_WHITE })
    );
    shoeGroup.add(shoeSole);

    const shoeUpper = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.11, 0.30),
      new THREE.MeshStandardMaterial({ color: SHOE_BLACK })
    );
    shoeUpper.position.set(0, 0.07, -0.01);
    shoeUpper.castShadow = true;
    shoeGroup.add(shoeUpper);

    return hipPivot;
  }

  const rightLegPivot = createLegAssembly();
  rightLegPivot.position.set(-0.23, -0.09, 0);
  pelvisGroup.add(rightLegPivot);

  const leftLegPivot = createLegAssembly();
  leftLegPivot.position.set(0.23, -0.09, 0);
  pelvisGroup.add(leftLegPivot);

  // --- LOCOMOTION & COLLISION RESOLUTION ---
  let walkPhase = 0;
  let currentSpeed = 0;
  let currentHeading = 0;
  const maxWalkSpeed = 4.2;
  const charRadius = 0.38;

  // Continuous Circle-to-AABB collision resolver with smooth sliding
  function resolveCollisions(newX, newZ, colliders = []) {
    let resolvedX = newX;
    let resolvedZ = newZ;

    // Full Campus outer boundaries (West/East: +/-28, North/South: +/-28)
    resolvedX = Math.max(-28.0 + charRadius, Math.min(28.0 - charRadius, resolvedX));
    resolvedZ = Math.max(-28.0 + charRadius, Math.min(28.0 - charRadius, resolvedZ));

    // Resolve against all obstacle and wall colliders
    for (const col of colliders) {
      const closestX = Math.max(col.minX, Math.min(resolvedX, col.maxX));
      const closestZ = Math.max(col.minZ, Math.min(resolvedZ, col.maxZ));

      const distX = resolvedX - closestX;
      const distZ = resolvedZ - closestZ;
      const distSq = distX * distX + distZ * distZ;

      if (distSq < charRadius * charRadius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = charRadius - dist;
          resolvedX += (distX / dist) * overlap;
          resolvedZ += (distZ / dist) * overlap;
        } else {
          const toMinX = Math.abs(resolvedX - col.minX);
          const toMaxX = Math.abs(col.maxX - resolvedX);
          const toMinZ = Math.abs(resolvedZ - col.minZ);
          const toMaxZ = Math.abs(col.maxZ - resolvedZ);
          const minOverlap = Math.min(toMinX, toMaxX, toMinZ, toMaxZ);

          if (minOverlap === toMinX) resolvedX = col.minX - charRadius;
          else if (minOverlap === toMaxX) resolvedX = col.maxX + charRadius;
          else if (minOverlap === toMinZ) resolvedZ = col.minZ - charRadius;
          else resolvedZ = col.maxZ + charRadius;
        }
      }
    }

    return { x: resolvedX, z: resolvedZ };
  }

  return {
    mesh: characterGroup,
    getPosition: () => characterGroup.position,
    setPosition: (x, y, z) => characterGroup.position.set(x, y, z),
    getHeading: () => currentHeading,

    update: (delta, moveVector, colliders = []) => {
      const isMoving = moveVector.lengthSq() > 0.001;

      if (isMoving) {
        currentSpeed = THREE.MathUtils.lerp(currentSpeed, maxWalkSpeed, delta * 12);

        const targetAngle = Math.atan2(moveVector.x, moveVector.z);
        let angleDiff = (targetAngle - currentHeading) % (Math.PI * 2);
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        currentHeading += angleDiff * Math.min(1.0, delta * 14);
        characterGroup.rotation.y = currentHeading;

        const targetX = characterGroup.position.x + moveVector.x * currentSpeed * delta;
        const targetZ = characterGroup.position.z + moveVector.z * currentSpeed * delta;

        const resolved = resolveCollisions(targetX, targetZ, colliders);
        characterGroup.position.x = resolved.x;
        characterGroup.position.z = resolved.z;

        walkPhase += delta * currentSpeed * 3.8;
      } else {
        currentSpeed = THREE.MathUtils.lerp(currentSpeed, 0, delta * 14);
      }

      const speedRatio = currentSpeed / maxWalkSpeed;

      if (speedRatio > 0.05) {
        leftLegPivot.rotation.x = Math.sin(walkPhase) * 0.75 * speedRatio;
        rightLegPivot.rotation.x = -Math.sin(walkPhase) * 0.75 * speedRatio;

        rightArmPivot.rotation.x = Math.sin(walkPhase) * 0.65 * speedRatio + 0.05;
        leftArmPivot.rotation.x = -Math.sin(walkPhase) * 0.30 * speedRatio + 0.15;

        torsoGroup.position.y = 0.40 + Math.abs(Math.sin(walkPhase * 2)) * 0.08 * speedRatio;
        torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0.08 * speedRatio, delta * 8);
        torsoGroup.rotation.z = Math.sin(walkPhase) * 0.04 * speedRatio;

        headGroup.position.y = 0.63 + Math.abs(Math.sin(walkPhase * 2)) * 0.03 * speedRatio;
        headGroup.rotation.y = -Math.sin(walkPhase) * 0.04 * speedRatio;
      } else {
        const time = performance.now() * 0.0025;
        const breathe = Math.sin(time) * 0.015;

        leftLegPivot.rotation.x = THREE.MathUtils.lerp(leftLegPivot.rotation.x, 0, delta * 8);
        rightLegPivot.rotation.x = THREE.MathUtils.lerp(rightLegPivot.rotation.x, 0, delta * 8);
        rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, 0.05, delta * 8);
        leftArmPivot.rotation.x = THREE.MathUtils.lerp(leftArmPivot.rotation.x, 0.20, delta * 8);

        torsoGroup.position.y = THREE.MathUtils.lerp(torsoGroup.position.y, 0.40 + breathe, delta * 8);
        torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0, delta * 8);
        torsoGroup.rotation.z = THREE.MathUtils.lerp(torsoGroup.rotation.z, 0, delta * 8);

        headGroup.position.y = THREE.MathUtils.lerp(headGroup.position.y, 0.63 + breathe * 1.2, delta * 8);
        headGroup.rotation.y = Math.sin(time * 0.5) * 0.03;
      }
    },
  };
}
