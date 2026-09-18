import * as THREE from 'three';

/**
 * Procedural 3D Roblox/Blocky Student Character Model
 * Built strictly according to the reference image (asstesimages/character.webp):
 * - Blocky humanoid anatomy with rounded chamfers
 * - Layered spiky brown hair
 * - Procedural expressive anime/Roblox face decal
 * - Horizontal navy blue & white striped long-sleeve shirt
 * - Sky-blue backpack with shoulder straps
 * - Yellow pencil with eraser protruding from right shoulder
 * - Textbook with green spine held under left arm
 * - Black shorts, bare peach knees, black skate sneakers with white soles & laces
 */

export function createStudentCharacter() {
  const characterGroup = new THREE.Group();
  characterGroup.name = 'StudentCharacter';

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

  // Skin Material
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(SKIN_COLOR),
    roughness: 0.55,
    metalness: 0.05,
  });

  // Hair Material
  const hairMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(HAIR_COLOR),
    roughness: 0.65,
    metalness: 0.08,
  });

  // Shorts Material
  const shortsMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(SHORTS_COLOR),
    roughness: 0.7,
    metalness: 0.05,
  });

  // Backpack Material
  const backpackMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BACKPACK_COLOR),
    roughness: 0.45,
    metalness: 0.1,
  });

  // --- PROCEDURAL TEXTURES ---

  // 1. Procedural Striped Shirt Texture
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

  // 2. Procedural Face Texture
  function createFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base skin fill
    ctx.fillStyle = SKIN_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Eyebrows
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';

    // Left Eyebrow (curved friendly arch)
    ctx.beginPath();
    ctx.moveTo(310, 410);
    ctx.quadraticCurveTo(390, 360, 460, 420);
    ctx.stroke();

    // Right Eyebrow
    ctx.beginPath();
    ctx.moveTo(564, 420);
    ctx.quadraticCurveTo(634, 360, 714, 410);
    ctx.stroke();

    // Eyes (Dark friendly cartoon eyes with specular catchlights)
    const drawEye = (x, y) => {
      ctx.save();
      ctx.translate(x, y);

      // Eye shadow / socket contour
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 44, 58, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight top-right
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(14, -18, 14, 20, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Secondary small highlight bottom-left
      ctx.beginPath();
      ctx.ellipse(-12, 18, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawEye(385, 495);
    drawEye(639, 495);

    // Mouth (Warm open smile with teeth)
    ctx.save();
    ctx.translate(512, 630);

    // Mouth cavity
    ctx.beginPath();
    ctx.moveTo(-90, 0);
    ctx.quadraticCurveTo(0, 85, 90, 0);
    ctx.closePath();
    ctx.fillStyle = '#450a0a';
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#18181b';
    ctx.stroke();

    // Teeth (top white bar)
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-90, 0, 180, 26);
    // Tongue hint
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(0, 50, 45, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  const faceTexture = createFaceTexture();

  // Multi-material for head: 6 faces of box [right, left, top, bottom, front, back]
  const headMaterials = [
    skinMaterial, // right
    skinMaterial, // left
    skinMaterial, // top
    skinMaterial, // bottom
    new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.55, metalness: 0.05 }), // front
    skinMaterial, // back
  ];

  // --- 1. HEAD & HAIR GROUP ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.88, 0);
  characterGroup.add(headGroup);

  // Head Box (slightly beveled / rounded proportions)
  const headGeo = new THREE.BoxGeometry(0.56, 0.56, 0.54, 4, 4, 4);
  const headMesh = new THREE.Mesh(headGeo, headMaterials);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.12, 16);
  const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
  neckMesh.position.set(0, -0.32, 0);
  neckMesh.castShadow = true;
  headGroup.add(neckMesh);

  // --- HAIR SCULPT ---
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  // Hair Skull Base Cap
  const hairCapGeo = new THREE.BoxGeometry(0.60, 0.36, 0.58);
  const hairCapMesh = new THREE.Mesh(hairCapGeo, hairMaterial);
  hairCapMesh.position.set(0, 0.14, -0.02);
  hairCapMesh.castShadow = true;
  hairGroup.add(hairCapMesh);

  // Function to create a styled spiky hair wedge/cone
  function createHairSpike(width, height, depth, pos, rot) {
    const spikeGeo = new THREE.ConeGeometry(width, height, 4);
    spikeGeo.rotateY(Math.PI / 4); // Facet diamond profile
    const spike = new THREE.Mesh(spikeGeo, hairMaterial);
    spike.position.set(pos[0], pos[1], pos[2]);
    spike.rotation.set(rot[0], rot[1], rot[2]);
    spike.castShadow = true;
    hairGroup.add(spike);
    return spike;
  }

  // Front Layer Spikes (Forehead fringe)
  createHairSpike(0.14, 0.28, 0.14, [-0.18, 0.32, 0.25], [-0.5, 0.2, -0.3]);
  createHairSpike(0.16, 0.34, 0.16, [-0.06, 0.35, 0.28], [-0.55, 0.05, -0.1]);
  createHairSpike(0.15, 0.32, 0.15, [0.08, 0.34, 0.27], [-0.5, -0.15, 0.2]);
  createHairSpike(0.14, 0.26, 0.14, [0.20, 0.30, 0.24], [-0.45, -0.3, 0.4]);

  // Top Spikes (Swept up and dynamic)
  createHairSpike(0.18, 0.38, 0.18, [-0.12, 0.42, 0.05], [-0.1, 0.2, -0.25]);
  createHairSpike(0.20, 0.44, 0.20, [0.02, 0.46, 0.08], [-0.15, 0, 0.1]);
  createHairSpike(0.18, 0.40, 0.18, [0.15, 0.43, 0.04], [-0.1, -0.2, 0.3]);
  createHairSpike(0.16, 0.34, 0.16, [-0.02, 0.42, -0.12], [0.3, 0.1, 0.05]);

  // Left Side Spikes
  createHairSpike(0.15, 0.30, 0.15, [0.32, 0.22, 0.12], [-0.2, -0.4, 0.65]);
  createHairSpike(0.16, 0.32, 0.16, [0.32, 0.24, -0.08], [0.1, -0.4, 0.7]);
  createHairSpike(0.14, 0.26, 0.14, [0.30, 0.10, 0.02], [0, -0.3, 0.8]);

  // Right Side Spikes
  createHairSpike(0.15, 0.30, 0.15, [-0.32, 0.22, 0.12], [-0.2, 0.4, -0.65]);
  createHairSpike(0.16, 0.32, 0.16, [-0.32, 0.24, -0.08], [0.1, 0.4, -0.7]);
  createHairSpike(0.14, 0.26, 0.14, [-0.30, 0.10, 0.02], [0, 0.3, -0.8]);

  // Back Layer Spikes
  createHairSpike(0.18, 0.32, 0.18, [-0.14, 0.26, -0.30], [0.55, 0.2, -0.1]);
  createHairSpike(0.19, 0.36, 0.19, [0.02, 0.28, -0.32], [0.6, 0, 0.05]);
  createHairSpike(0.17, 0.32, 0.17, [0.16, 0.25, -0.29], [0.55, -0.2, 0.15]);
  createHairSpike(0.15, 0.24, 0.15, [0.0, 0.08, -0.30], [0.4, 0, 0]);

  // --- 2. TORSO & SHIRT ---
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 1.25, 0);
  characterGroup.add(torsoGroup);

  const torsoGeo = new THREE.BoxGeometry(0.88, 0.72, 0.44, 4, 4, 4);
  const torsoMesh = new THREE.Mesh(torsoGeo, shirtMaterial);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  // White V-Neck Collar detail
  const collarGeo = new THREE.BufferGeometry();
  const collarVertices = new Float32Array([
    -0.18, 0.361, 0.222,
     0.18, 0.361, 0.222,
     0.0,  0.18,  0.222,
  ]);
  collarGeo.setAttribute('position', new THREE.BufferAttribute(collarVertices, 3));
  collarGeo.computeVertexNormals();
  const collarMesh = new THREE.Mesh(
    collarGeo,
    new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5, side: THREE.DoubleSide })
  );
  torsoGroup.add(collarMesh);

  // --- 3. BACKPACK & PENCIL ---
  const backpackGroup = new THREE.Group();
  backpackGroup.position.set(0, 0.02, -0.27);
  torsoGroup.add(backpackGroup);

  // Main Backpack Body
  const backpackGeo = new THREE.BoxGeometry(0.66, 0.62, 0.24, 3, 3, 3);
  const backpackMesh = new THREE.Mesh(backpackGeo, backpackMaterial);
  backpackMesh.castShadow = true;
  backpackGroup.add(backpackMesh);

  // Outer Pocket
  const pocketGeo = new THREE.BoxGeometry(0.50, 0.34, 0.08);
  const pocketMesh = new THREE.Mesh(pocketGeo, backpackMaterial);
  pocketMesh.position.set(0, -0.08, -0.14);
  pocketMesh.castShadow = true;
  backpackGroup.add(pocketMesh);

  // Shoulder Straps (curved loops over shoulders)
  function createStrap(xPos) {
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xPos * 0.24, 0.28, -0.12),
      new THREE.Vector3(xPos * 0.28, 0.38, 0.06),
      new THREE.Vector3(xPos * 0.26, 0.10, 0.23),
      new THREE.Vector3(xPos * 0.22, -0.26, 0.23),
      new THREE.Vector3(xPos * 0.22, -0.32, -0.10),
    ]);
    const strapGeo = new THREE.TubeGeometry(strapCurve, 20, 0.038, 8, false);
    const strapMesh = new THREE.Mesh(strapGeo, backpackMaterial);
    strapMesh.castShadow = true;
    return strapMesh;
  }

  torsoGroup.add(createStrap(-1)); // Right shoulder strap
  torsoGroup.add(createStrap(1));  // Left shoulder strap

  // Yellow Pencil sticking out behind right shoulder
  const pencilGroup = new THREE.Group();
  pencilGroup.position.set(-0.25, 0.34, -0.18);
  pencilGroup.rotation.set(-0.2, 0.15, -0.18);
  torsoGroup.add(pencilGroup);

  // Pencil Shaft (Yellow hexagonal cylinder)
  const pencilShaftGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.44, 6);
  const pencilShaftMesh = new THREE.Mesh(
    pencilShaftGeo,
    new THREE.MeshStandardMaterial({ color: PENCIL_YELLOW, roughness: 0.4 })
  );
  pencilShaftMesh.castShadow = true;
  pencilGroup.add(pencilShaftMesh);

  // Green Eraser / Ferrule at Top
  const eraserGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.08, 12);
  const eraserMesh = new THREE.Mesh(
    eraserGeo,
    new THREE.MeshStandardMaterial({ color: PENCIL_GREEN, roughness: 0.5 })
  );
  eraserMesh.position.set(0, 0.24, 0);
  eraserMesh.castShadow = true;
  pencilGroup.add(eraserMesh);

  // Sharpened Wood Cone at Bottom
  const woodTipGeo = new THREE.ConeGeometry(0.024, 0.07, 12);
  const woodTipMesh = new THREE.Mesh(
    woodTipGeo,
    new THREE.MeshStandardMaterial({ color: PENCIL_WOOD, roughness: 0.6 })
  );
  woodTipMesh.position.set(0, -0.255, 0);
  woodTipMesh.rotation.x = Math.PI;
  woodTipMesh.castShadow = true;
  pencilGroup.add(woodTipMesh);

  // Graphite Point
  const leadTipGeo = new THREE.ConeGeometry(0.010, 0.025, 12);
  const leadTipMesh = new THREE.Mesh(
    leadTipGeo,
    new THREE.MeshStandardMaterial({ color: PENCIL_LEAD, roughness: 0.3 })
  );
  leadTipMesh.position.set(0, -0.28, 0);
  leadTipMesh.rotation.x = Math.PI;
  pencilGroup.add(leadTipMesh);

  // --- 4. ARMS & ACCESSORIES ---

  // C-Clamp Blocky Hand Generator
  function createBlockyHand() {
    const handGroup = new THREE.Group();
    // Palm / wrist
    const wristGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16);
    const wristMesh = new THREE.Mesh(wristGeo, skinMaterial);
    wristMesh.castShadow = true;
    handGroup.add(wristMesh);

    // C-clamp grip arc (Torus segment)
    const clampGeo = new THREE.TorusGeometry(0.10, 0.045, 12, 24, Math.PI * 1.35);
    const clampMesh = new THREE.Mesh(clampGeo, skinMaterial);
    clampMesh.position.set(0, -0.08, 0);
    clampMesh.rotation.set(Math.PI / 2, 0, Math.PI * 0.35);
    clampMesh.castShadow = true;
    handGroup.add(clampMesh);

    return handGroup;
  }

  // Right Arm (Relaxed at side)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(-0.60, 0.24, 0);
  rightArmGroup.rotation.set(0.05, 0, 0.08); // Slight natural flare
  torsoGroup.add(rightArmGroup);

  const armGeo = new THREE.BoxGeometry(0.32, 0.70, 0.36);
  const rightArmMesh = new THREE.Mesh(armGeo, shirtMaterial);
  rightArmMesh.position.set(0, -0.32, 0);
  rightArmMesh.castShadow = true;
  rightArmGroup.add(rightArmMesh);

  const rightHand = createBlockyHand();
  rightHand.position.set(0, -0.72, 0);
  rightArmGroup.add(rightHand);

  // Left Arm (Holding textbook under arm)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(0.60, 0.24, 0);
  leftArmGroup.rotation.set(0.20, 0, -0.12); // Angled forward/inward to hold book
  torsoGroup.add(leftArmGroup);

  const leftArmMesh = new THREE.Mesh(armGeo, shirtMaterial);
  leftArmMesh.position.set(0, -0.32, 0);
  leftArmMesh.castShadow = true;
  leftArmGroup.add(leftArmMesh);

  const leftHand = createBlockyHand();
  leftHand.position.set(0, -0.72, 0);
  leftArmGroup.add(leftHand);

  // Textbook held under left arm
  const bookGroup = new THREE.Group();
  bookGroup.position.set(0.50, -0.22, 0.05);
  bookGroup.rotation.set(0.15, 0.10, -0.12);
  torsoGroup.add(bookGroup);

  // Book Pages Block
  const pagesGeo = new THREE.BoxGeometry(0.10, 0.44, 0.32);
  const pagesMesh = new THREE.Mesh(
    pagesGeo,
    new THREE.MeshStandardMaterial({ color: BOOK_PAGES, roughness: 0.9 })
  );
  pagesMesh.castShadow = true;
  bookGroup.add(pagesMesh);

  // Book Cover (White)
  const coverGeo = new THREE.BoxGeometry(0.11, 0.46, 0.33);
  const coverMesh = new THREE.Mesh(
    coverGeo,
    new THREE.MeshStandardMaterial({ color: BOOK_COVER, roughness: 0.4 })
  );
  coverMesh.castShadow = true;
  bookGroup.add(coverMesh);

  // Book Spine (Green)
  const spineGeo = new THREE.BoxGeometry(0.115, 0.462, 0.06);
  const spineMesh = new THREE.Mesh(
    spineGeo,
    new THREE.MeshStandardMaterial({ color: BOOK_SPINE, roughness: 0.5 })
  );
  spineMesh.position.set(0, 0, -0.145);
  spineMesh.castShadow = true;
  bookGroup.add(spineMesh);

  // --- 5. LEGS, SHORTS & SNEAKERS ---
  const hipsGroup = new THREE.Group();
  hipsGroup.position.set(0, 0.88, 0);
  characterGroup.add(hipsGroup);

  // Pelvis / Shorts Top
  const pelvisGeo = new THREE.BoxGeometry(0.86, 0.18, 0.42);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, shortsMaterial);
  pelvisMesh.castShadow = true;
  pelvisMesh.receiveShadow = true;
  hipsGroup.add(pelvisMesh);

  // Leg Generator (Shorts upper + Peach knee + Black/White sneaker)
  function createLeg(xPos) {
    const legGroup = new THREE.Group();
    legGroup.position.set(xPos * 0.23, -0.09, 0);

    // Shorts Thigh
    const thighGeo = new THREE.BoxGeometry(0.38, 0.36, 0.40);
    const thighMesh = new THREE.Mesh(thighGeo, shortsMaterial);
    thighMesh.position.set(0, -0.18, 0);
    thighMesh.castShadow = true;
    legGroup.add(thighMesh);

    // Bare Peach Lower Leg / Knee
    const kneeGeo = new THREE.BoxGeometry(0.36, 0.24, 0.38);
    const kneeMesh = new THREE.Mesh(kneeGeo, skinMaterial);
    kneeMesh.position.set(0, -0.46, 0);
    kneeMesh.castShadow = true;
    legGroup.add(kneeMesh);

    // --- Black Skate Sneaker ---
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.68, 0.03);
    legGroup.add(shoeGroup);

    // Sneaker Upper (Black Canvas)
    const shoeUpperGeo = new THREE.BoxGeometry(0.38, 0.20, 0.46);
    const shoeUpperMesh = new THREE.Mesh(
      shoeUpperGeo,
      new THREE.MeshStandardMaterial({ color: SHOE_BLACK, roughness: 0.7 })
    );
    shoeUpperMesh.castShadow = true;
    shoeGroup.add(shoeUpperMesh);

    // White Rubber Outsole / Foxing
    const outsoleGeo = new THREE.BoxGeometry(0.40, 0.06, 0.48);
    const outsoleMesh = new THREE.Mesh(
      outsoleGeo,
      new THREE.MeshStandardMaterial({ color: SHOE_WHITE, roughness: 0.35 })
    );
    outsoleMesh.position.set(0, -0.09, 0.01);
    outsoleMesh.castShadow = true;
    shoeGroup.add(outsoleMesh);

    // White Rubber Toe Cap
    const toeCapGeo = new THREE.BoxGeometry(0.385, 0.12, 0.14);
    const toeCapMesh = new THREE.Mesh(
      toeCapGeo,
      new THREE.MeshStandardMaterial({ color: SHOE_WHITE, roughness: 0.35 })
    );
    toeCapMesh.position.set(0, -0.03, 0.17);
    toeCapMesh.castShadow = true;
    shoeGroup.add(toeCapMesh);

    // White Shoelaces (Criss-Cross Decal / Geometry)
    const laceGeo = new THREE.BoxGeometry(0.24, 0.015, 0.04);
    const laceMat = new THREE.MeshStandardMaterial({ color: SHOE_WHITE, roughness: 0.4 });
    for (let l = 0; l < 3; l++) {
      const lace = new THREE.Mesh(laceGeo, laceMat);
      lace.position.set(0, 0.103, 0.08 - l * 0.08);
      shoeGroup.add(lace);
    }

    return legGroup;
  }

  const rightLeg = createLeg(-1);
  const leftLeg = createLeg(1);
  hipsGroup.add(rightLeg);
  hipsGroup.add(leftLeg);

  // Return character group with animation hook
  return {
    mesh: characterGroup,
    animate: (time) => {
      // Subtle idle breathing & swaying
      const breathe = Math.sin(time * 2.5) * 0.015;
      torsoGroup.position.y = 1.25 + breathe;
      headGroup.position.y = 1.88 + breathe * 1.2;
      headGroup.rotation.y = Math.sin(time * 1.2) * 0.04;
      rightArmGroup.rotation.x = 0.05 + Math.sin(time * 2.0) * 0.03;
      leftArmGroup.rotation.x = 0.20 - Math.sin(time * 2.0) * 0.02;
    },
  };
}
