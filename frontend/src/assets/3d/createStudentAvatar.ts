import * as THREE from 'three';

export interface AvatarPalette {
  skinColor?: string;
  hairColor?: string;
  shortsColor?: string;
  backpackColor?: string;
  shirtPrimary?: string;
  shirtSecondary?: string;
  shoeBlack?: string;
  shoeWhite?: string;
}

export interface AvatarLocomotionInput {
  isMoving: boolean;
  isSprinting?: boolean;
  isJumping?: boolean;
  jumpProgress?: number;
  speed?: number;
  turnRate?: number; // angular change in radians / delta
}

export interface StudentAvatarRig {
  characterGroup: THREE.Group;
  rootOffsetGroup: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftShoulderGroup: THREE.Group;
  rightShoulderGroup: THREE.Group;
  hipsGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  backpackGroup: THREE.Group;
  bookGroup: THREE.Group;
  pencilGroup: THREE.Group;
  update: (delta: number, input: AvatarLocomotionInput) => void;
  dispose: () => void;
}

/**
 * Procedural 3D Stylized Student Avatar Factory
 * Faithfully reconstructed from `asstesimages/character.webp`:
 * - Blocky humanoid anatomy with clean chamfers and expressive proportions
 * - Layered spiky swept brown anime hair sculpt
 * - Procedural expressive anime/Roblox face decal (catchlight cartoon eyes, smile with teeth)
 * - Striped navy & white long-sleeve sweater with white V-collar
 * - Sky-blue backpack with shoulder straps & protruding yellow pencil with eraser
 * - White textbook with green spine held under left arm
 * - Black shorts, bare peach knees, black skate sneakers with white soles & laces
 * - Full limb articulation and responsive locomotion state machine
 */
export function createStudentAvatar(palette: AvatarPalette = {}): StudentAvatarRig {
  const characterGroup = new THREE.Group();
  characterGroup.name = 'StudentCharacter';

  // Root offset group to support roll banking & jump squash/stretch
  const rootOffsetGroup = new THREE.Group();
  rootOffsetGroup.name = 'RootOffset';
  characterGroup.add(rootOffsetGroup);

  // Resource tracking for leak-free disposal
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

  // --- PALETTE ---
  const SKIN_COLOR = palette.skinColor || '#f8c29b';
  const HAIR_COLOR = palette.hairColor || '#5a311b';
  const SHORTS_COLOR = palette.shortsColor || '#18191d';
  const BACKPACK_COLOR = palette.backpackColor || '#0ea5e9';
  const SHIRT_NAVY = palette.shirtPrimary || '#1e3a8a';
  const SHIRT_WHITE = palette.shirtSecondary || '#f8fafc';
  const PENCIL_YELLOW = '#f59e0b';
  const PENCIL_WOOD = '#fde68a';
  const PENCIL_LEAD = '#1f2937';
  const PENCIL_GREEN = '#16a34a';
  const BOOK_COVER = '#f8fafc';
  const BOOK_SPINE = '#15803d';
  const BOOK_PAGES = '#e2e8f0';
  const SHOE_BLACK = palette.shoeBlack || '#18181b';
  const SHOE_WHITE = palette.shoeWhite || '#ffffff';

  // --- MATERIALS ---
  const skinMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(SKIN_COLOR),
      roughness: 0.55,
      metalness: 0.05,
    })
  );

  const hairMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(HAIR_COLOR),
      roughness: 0.65,
      metalness: 0.08,
    })
  );

  const shortsMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(SHORTS_COLOR),
      roughness: 0.7,
      metalness: 0.05,
    })
  );

  const backpackMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(BACKPACK_COLOR),
      roughness: 0.45,
      metalness: 0.1,
    })
  );

  // --- PROCEDURAL TEXTURES ---

  // 1. Striped Long-sleeve Shirt Texture
  function createStripedTexture(): THREE.Texture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const numStripes = 8;
    const stripeHeight = canvas.height / numStripes;

    for (let i = 0; i < numStripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? SHIRT_NAVY : SHIRT_WHITE;
      ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight);
    }

    const texture = trackTex(new THREE.CanvasTexture(canvas));
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  const stripedTexture = createStripedTexture();
  const shirtMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      map: stripedTexture || undefined,
      color: new THREE.Color(stripedTexture ? '#ffffff' : SHIRT_NAVY),
      roughness: 0.6,
      metalness: 0.05,
    })
  );

  // 2. Expressive Face Decal Texture
  function createFaceTexture(): THREE.Texture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Base skin fill
    ctx.fillStyle = SKIN_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Eyebrows
    if (ctx.stroke) {
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';

      // Left Eyebrow (warm friendly arch)
      ctx.beginPath();
      ctx.moveTo(310, 410);
      if (ctx.quadraticCurveTo) ctx.quadraticCurveTo(390, 360, 460, 420);
      ctx.stroke();

      // Right Eyebrow
      ctx.beginPath();
      ctx.moveTo(564, 420);
      if (ctx.quadraticCurveTo) ctx.quadraticCurveTo(634, 360, 714, 410);
      ctx.stroke();
    }

    // Eyes (Dark friendly cartoon eyes with specular catchlights)
    const drawEye = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      if (ctx.ellipse) {
        ctx.ellipse(0, 0, 44, 58, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
      }
      ctx.fill();

      // Specular highlight top-right
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (ctx.ellipse) {
        ctx.ellipse(14, -18, 14, 20, Math.PI / 6, 0, Math.PI * 2);
      } else {
        ctx.arc(14, -18, 14, 0, Math.PI * 2);
      }
      ctx.fill();

      // Secondary highlight bottom-left
      ctx.beginPath();
      if (ctx.ellipse) {
        ctx.ellipse(-12, 18, 8, 10, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(-12, 18, 8, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.restore();
    };

    drawEye(385, 495);
    drawEye(639, 495);

    // Mouth (Warm open smile with teeth)
    ctx.save();
    ctx.translate(512, 630);

    ctx.beginPath();
    ctx.moveTo(-90, 0);
    if (ctx.quadraticCurveTo) ctx.quadraticCurveTo(0, 85, 90, 0);
    ctx.closePath();
    ctx.fillStyle = '#450a0a';
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#18181b';
    ctx.stroke();

    // Upper Teeth bar
    if (ctx.clip) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-90, 0, 180, 26);

      // Tongue
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      if (ctx.ellipse) {
        ctx.ellipse(0, 50, 45, 25, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(0, 50, 35, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    return trackTex(new THREE.CanvasTexture(canvas));
  }

  const faceTexture = createFaceTexture();
  const frontFaceMaterial = trackMat(
    faceTexture
      ? new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.55, metalness: 0.05 })
      : skinMaterial
  );

  // Multi-material for head cube: [right, left, top, bottom, front, back]
  const headMaterials = [
    skinMaterial, // right
    skinMaterial, // left
    skinMaterial, // top
    skinMaterial, // bottom
    frontFaceMaterial, // front
    skinMaterial, // back
  ];

  // --- 1. TORSO & SPINE ---
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'Torso';
  torsoGroup.position.set(0, 1.25, 0);
  rootOffsetGroup.add(torsoGroup);

  const torsoGeo = trackGeo(new THREE.BoxGeometry(0.88, 0.72, 0.44, 4, 4, 4));
  const torsoMesh = new THREE.Mesh(torsoGeo, shirtMaterial);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  // White V-Neck Collar detail
  const collarGeo = trackGeo(new THREE.BufferGeometry());
  const collarVertices = new Float32Array([
    -0.18, 0.361, 0.222,
     0.18, 0.361, 0.222,
     0.0,  0.18,  0.222,
  ]);
  collarGeo.setAttribute('position', new THREE.BufferAttribute(collarVertices, 3));
  collarGeo.computeVertexNormals();
  const collarMesh = new THREE.Mesh(
    collarGeo,
    trackMat(new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5, side: THREE.DoubleSide }))
  );
  torsoGroup.add(collarMesh);

  // --- 2. HEAD & SWEPT HAIR ---
  const headGroup = new THREE.Group();
  headGroup.name = 'Head';
  headGroup.position.set(0, 0.63, 0); // Positioned above torso top (1.25 + 0.63 = 1.88 world Y)
  torsoGroup.add(headGroup);

  const headGeo = trackGeo(new THREE.BoxGeometry(0.56, 0.56, 0.54, 4, 4, 4));
  const headMesh = new THREE.Mesh(headGeo, headMaterials);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // Neck
  const neckGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.18, 0.14, 16));
  const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
  neckMesh.position.set(0, -0.32, 0);
  neckMesh.castShadow = true;
  headGroup.add(neckMesh);

  // Hair sculpt group
  const hairGroup = new THREE.Group();
  hairGroup.name = 'Hair';
  headGroup.add(hairGroup);

  // Hair Base Cap
  const hairCapGeo = trackGeo(new THREE.BoxGeometry(0.60, 0.36, 0.58));
  const hairCapMesh = new THREE.Mesh(hairCapGeo, hairMaterial);
  hairCapMesh.position.set(0, 0.14, -0.02);
  hairCapMesh.castShadow = true;
  hairGroup.add(hairCapMesh);

  // Function to create faceted diamond spikes for swept hair
  function createHairSpike(
    width: number,
    height: number,
    pos: [number, number, number],
    rot: [number, number, number]
  ): THREE.Mesh {
    const spikeGeo = trackGeo(new THREE.ConeGeometry(width, height, 4));
    spikeGeo.rotateY(Math.PI / 4);
    const spike = new THREE.Mesh(spikeGeo, hairMaterial);
    spike.position.set(...pos);
    spike.rotation.set(...rot);
    spike.castShadow = true;
    hairGroup.add(spike);
    return spike;
  }

  // Front Bangs & Fringe
  createHairSpike(0.14, 0.28, [-0.18, 0.32, 0.25], [-0.5, 0.2, -0.3]);
  createHairSpike(0.16, 0.34, [-0.06, 0.35, 0.28], [-0.55, 0.05, -0.1]);
  createHairSpike(0.15, 0.32, [0.08, 0.34, 0.27], [-0.5, -0.15, 0.2]);
  createHairSpike(0.14, 0.26, [0.20, 0.30, 0.24], [-0.45, -0.3, 0.4]);

  // Top Swept-Up Crest
  createHairSpike(0.18, 0.38, [-0.12, 0.42, 0.05], [-0.1, 0.2, -0.25]);
  createHairSpike(0.20, 0.44, [0.02, 0.46, 0.08], [-0.15, 0, 0.1]);
  createHairSpike(0.18, 0.40, [0.15, 0.43, 0.04], [-0.1, -0.2, 0.3]);
  createHairSpike(0.16, 0.34, [-0.02, 0.42, -0.12], [0.3, 0.1, 0.05]);

  // Left & Right Side Locks
  createHairSpike(0.15, 0.30, [0.32, 0.22, 0.12], [-0.2, -0.4, 0.65]);
  createHairSpike(0.16, 0.32, [0.32, 0.24, -0.08], [0.1, -0.4, 0.7]);
  createHairSpike(0.14, 0.26, [0.30, 0.10, 0.02], [0, -0.3, 0.8]);

  createHairSpike(0.15, 0.30, [-0.32, 0.22, 0.12], [-0.2, 0.4, -0.65]);
  createHairSpike(0.16, 0.32, [-0.32, 0.24, -0.08], [0.1, 0.4, -0.7]);
  createHairSpike(0.14, 0.26, [-0.30, 0.10, 0.02], [0, 0.3, -0.8]);

  // Back Layer Spikes
  createHairSpike(0.18, 0.32, [-0.14, 0.26, -0.30], [0.55, 0.2, -0.1]);
  createHairSpike(0.19, 0.36, [0.02, 0.28, -0.32], [0.6, 0, 0.05]);
  createHairSpike(0.17, 0.32, [0.16, 0.25, -0.29], [0.55, -0.2, 0.15]);
  createHairSpike(0.15, 0.24, [0.0, 0.08, -0.30], [0.4, 0, 0]);

  // --- 3. BACKPACK & PROTRUDING PENCIL ---
  const backpackGroup = new THREE.Group();
  backpackGroup.name = 'Backpack';
  backpackGroup.position.set(0, 0.02, -0.27);
  torsoGroup.add(backpackGroup);

  // Main Pack Box
  const backpackGeo = trackGeo(new THREE.BoxGeometry(0.66, 0.62, 0.24, 3, 3, 3));
  const backpackMesh = new THREE.Mesh(backpackGeo, backpackMaterial);
  backpackMesh.castShadow = true;
  backpackGroup.add(backpackMesh);

  // Outer Pocket
  const pocketGeo = trackGeo(new THREE.BoxGeometry(0.50, 0.34, 0.08));
  const pocketMesh = new THREE.Mesh(pocketGeo, backpackMaterial);
  pocketMesh.position.set(0, -0.08, -0.14);
  pocketMesh.castShadow = true;
  backpackGroup.add(pocketMesh);

  // Curved Shoulder Straps
  function createStrap(xSign: number): THREE.Mesh {
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xSign * 0.24, 0.28, -0.12),
      new THREE.Vector3(xSign * 0.28, 0.38, 0.06),
      new THREE.Vector3(xSign * 0.26, 0.10, 0.23),
      new THREE.Vector3(xSign * 0.22, -0.26, 0.23),
      new THREE.Vector3(xSign * 0.22, -0.32, -0.10),
    ]);
    const strapGeo = trackGeo(new THREE.TubeGeometry(strapCurve, 16, 0.038, 8, false));
    const strapMesh = new THREE.Mesh(strapGeo, backpackMaterial);
    strapMesh.castShadow = true;
    return strapMesh;
  }

  torsoGroup.add(createStrap(-1));
  torsoGroup.add(createStrap(1));

  // Yellow Pencil Protruding Over Right Shoulder
  const pencilGroup = new THREE.Group();
  pencilGroup.name = 'Pencil';
  pencilGroup.position.set(-0.25, 0.34, -0.18);
  pencilGroup.rotation.set(-0.2, 0.15, -0.18);
  torsoGroup.add(pencilGroup);

  const pencilShaftGeo = trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.44, 6));
  const pencilShaftMesh = new THREE.Mesh(
    pencilShaftGeo,
    trackMat(new THREE.MeshStandardMaterial({ color: PENCIL_YELLOW, roughness: 0.4 }))
  );
  pencilShaftMesh.castShadow = true;
  pencilGroup.add(pencilShaftMesh);

  const eraserGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 12));
  const eraserMesh = new THREE.Mesh(
    eraserGeo,
    trackMat(new THREE.MeshStandardMaterial({ color: PENCIL_GREEN, roughness: 0.5 }))
  );
  eraserMesh.position.set(0, 0.24, 0);
  eraserMesh.castShadow = true;
  pencilGroup.add(eraserMesh);

  const woodTipGeo = trackGeo(new THREE.ConeGeometry(0.024, 0.07, 12));
  const woodTipMesh = new THREE.Mesh(
    woodTipGeo,
    trackMat(new THREE.MeshStandardMaterial({ color: PENCIL_WOOD, roughness: 0.6 }))
  );
  woodTipMesh.position.set(0, -0.255, 0);
  woodTipMesh.rotation.x = Math.PI;
  woodTipMesh.castShadow = true;
  pencilGroup.add(woodTipMesh);

  const leadTipGeo = trackGeo(new THREE.ConeGeometry(0.010, 0.025, 12));
  const leadTipMesh = new THREE.Mesh(
    leadTipGeo,
    trackMat(new THREE.MeshStandardMaterial({ color: PENCIL_LEAD, roughness: 0.3 }))
  );
  leadTipMesh.position.set(0, -0.28, 0);
  leadTipMesh.rotation.x = Math.PI;
  pencilGroup.add(leadTipMesh);

  // --- 4. ARMS & LIMB ARTICULATION ---

  // C-Clamp Blocky Hand Generator
  function createBlockyHand(): THREE.Group {
    const handGroup = new THREE.Group();
    const wristGeo = trackGeo(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16));
    const wristMesh = new THREE.Mesh(wristGeo, skinMaterial);
    wristMesh.castShadow = true;
    handGroup.add(wristMesh);

    const clampGeo = trackGeo(new THREE.TorusGeometry(0.10, 0.045, 12, 24, Math.PI * 1.35));
    const clampMesh = new THREE.Mesh(clampGeo, skinMaterial);
    clampMesh.position.set(0, -0.08, 0);
    clampMesh.rotation.set(Math.PI / 2, 0, Math.PI * 0.35);
    clampMesh.castShadow = true;
    handGroup.add(clampMesh);
    return handGroup;
  }

  const armGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.70, 0.36));

  // Right Shoulder Group (Pivot anchor at top of shoulder joint)
  const rightShoulderGroup = new THREE.Group();
  rightShoulderGroup.name = 'RightShoulder';
  rightShoulderGroup.position.set(-0.60, 0.24, 0);
  rightShoulderGroup.rotation.set(0.05, 0, 0.08); // Slight natural resting flare
  torsoGroup.add(rightShoulderGroup);

  const rightArmMesh = new THREE.Mesh(armGeo, shirtMaterial);
  rightArmMesh.position.set(0, -0.32, 0);
  rightArmMesh.castShadow = true;
  rightShoulderGroup.add(rightArmMesh);

  const rightHand = createBlockyHand();
  rightHand.position.set(0, -0.72, 0);
  rightShoulderGroup.add(rightHand);

  // Left Shoulder Group (Pivot anchor at top of shoulder joint)
  const leftShoulderGroup = new THREE.Group();
  leftShoulderGroup.name = 'LeftShoulder';
  leftShoulderGroup.position.set(0.60, 0.24, 0);
  leftShoulderGroup.rotation.set(0.20, 0, -0.12); // Tucked naturally holding book
  torsoGroup.add(leftShoulderGroup);

  const leftArmMesh = new THREE.Mesh(armGeo, shirtMaterial);
  leftArmMesh.position.set(0, -0.32, 0);
  leftArmMesh.castShadow = true;
  leftShoulderGroup.add(leftArmMesh);

  const leftHand = createBlockyHand();
  leftHand.position.set(0, -0.72, 0);
  leftShoulderGroup.add(leftHand);

  // Textbook tucked under left arm (parented to left shoulder group for synchronized movement)
  const bookGroup = new THREE.Group();
  bookGroup.name = 'Textbook';
  bookGroup.position.set(-0.08, -0.42, 0.06);
  bookGroup.rotation.set(0.12, 0.10, 0.10);
  leftShoulderGroup.add(bookGroup);

  const pagesGeo = trackGeo(new THREE.BoxGeometry(0.10, 0.44, 0.32));
  const pagesMesh = new THREE.Mesh(
    pagesGeo,
    trackMat(new THREE.MeshStandardMaterial({ color: BOOK_PAGES, roughness: 0.9 }))
  );
  pagesMesh.castShadow = true;
  bookGroup.add(pagesMesh);

  const coverGeo = trackGeo(new THREE.BoxGeometry(0.11, 0.46, 0.33));
  const coverMesh = new THREE.Mesh(
    coverGeo,
    trackMat(new THREE.MeshStandardMaterial({ color: BOOK_COVER, roughness: 0.4 }))
  );
  coverMesh.castShadow = true;
  bookGroup.add(coverMesh);

  const spineGeo = trackGeo(new THREE.BoxGeometry(0.115, 0.462, 0.06));
  const spineMesh = new THREE.Mesh(
    spineGeo,
    trackMat(new THREE.MeshStandardMaterial({ color: BOOK_SPINE, roughness: 0.5 }))
  );
  spineMesh.position.set(0, 0, -0.145);
  spineMesh.castShadow = true;
  bookGroup.add(spineMesh);

  // --- 5. HIPS, LEGS & SKATE SNEAKERS ---
  const hipsGroup = new THREE.Group();
  hipsGroup.name = 'Hips';
  hipsGroup.position.set(0, 0.88, 0);
  rootOffsetGroup.add(hipsGroup);

  // Pelvis / Shorts Top
  const pelvisGeo = trackGeo(new THREE.BoxGeometry(0.86, 0.18, 0.42));
  const pelvisMesh = new THREE.Mesh(pelvisGeo, shortsMaterial);
  pelvisMesh.castShadow = true;
  pelvisMesh.receiveShadow = true;
  hipsGroup.add(pelvisMesh);

  // Leg Articulation Generator (Pivots at hip socket)
  function createLegJoint(xSign: number, name: string): THREE.Group {
    const legJoint = new THREE.Group();
    legJoint.name = name;
    legJoint.position.set(xSign * 0.23, -0.09, 0);

    // Shorts Thigh
    const thighGeo = trackGeo(new THREE.BoxGeometry(0.38, 0.36, 0.40));
    const thighMesh = new THREE.Mesh(thighGeo, shortsMaterial);
    thighMesh.position.set(0, -0.18, 0);
    thighMesh.castShadow = true;
    legJoint.add(thighMesh);

    // Bare Peach Knee / Lower Leg
    const kneeGeo = trackGeo(new THREE.BoxGeometry(0.36, 0.24, 0.38));
    const kneeMesh = new THREE.Mesh(kneeGeo, skinMaterial);
    kneeMesh.position.set(0, -0.46, 0);
    kneeMesh.castShadow = true;
    legJoint.add(kneeMesh);

    // Skate Sneaker
    const shoeGroup = new THREE.Group();
    shoeGroup.name = 'Sneaker';
    shoeGroup.position.set(0, -0.68, 0.03);
    legJoint.add(shoeGroup);

    // Black Canvas Upper
    const shoeUpperGeo = trackGeo(new THREE.BoxGeometry(0.38, 0.20, 0.46));
    const shoeUpperMesh = new THREE.Mesh(
      shoeUpperGeo,
      trackMat(new THREE.MeshStandardMaterial({ color: SHOE_BLACK, roughness: 0.7 }))
    );
    shoeUpperMesh.castShadow = true;
    shoeGroup.add(shoeUpperMesh);

    // White Rubber Outsole Foxing
    const outsoleGeo = trackGeo(new THREE.BoxGeometry(0.40, 0.06, 0.48));
    const outsoleMesh = new THREE.Mesh(
      outsoleGeo,
      trackMat(new THREE.MeshStandardMaterial({ color: SHOE_WHITE, roughness: 0.35 }))
    );
    outsoleMesh.position.set(0, -0.09, 0.01);
    outsoleMesh.castShadow = true;
    shoeGroup.add(outsoleMesh);

    // White Rubber Toe Cap
    const toeCapGeo = trackGeo(new THREE.BoxGeometry(0.385, 0.12, 0.14));
    const toeCapMesh = new THREE.Mesh(
      toeCapGeo,
      trackMat(new THREE.MeshStandardMaterial({ color: SHOE_WHITE, roughness: 0.35 }))
    );
    toeCapMesh.position.set(0, -0.03, 0.17);
    toeCapMesh.castShadow = true;
    shoeGroup.add(toeCapMesh);

    // White Shoelaces
    const laceGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.015, 0.04));
    const laceMat = trackMat(new THREE.MeshStandardMaterial({ color: SHOE_WHITE, roughness: 0.4 }));
    for (let l = 0; l < 3; l++) {
      const lace = new THREE.Mesh(laceGeo, laceMat);
      lace.position.set(0, 0.103, 0.08 - l * 0.08);
      shoeGroup.add(lace);
    }

    return legJoint;
  }

  const rightLegGroup = createLegJoint(-1, 'RightLeg');
  const leftLegGroup = createLegJoint(1, 'LeftLeg');
  hipsGroup.add(rightLegGroup);
  hipsGroup.add(leftLegGroup);

  // --- LOCOMOTION STATE MACHINE ---
  let strideCycle = 0;
  let idleTime = 0;
  let currentBanking = 0;

  function update(delta: number, input: AvatarLocomotionInput) {
    const {
      isMoving,
      isSprinting = false,
      isJumping = false,
      jumpProgress = 0,
      turnRate = 0,
    } = input;

    // 1. Turn Banking (Roll tilt into turning direction)
    const targetBank = THREE.MathUtils.clamp(-turnRate * 0.32, -0.14, 0.14);
    currentBanking = THREE.MathUtils.lerp(currentBanking, targetBank, 0.18);
    rootOffsetGroup.rotation.z = currentBanking;

    if (isJumping) {
      // 2. Jumping Air Arc State
      // Air pose: legs tuck backward, arms flare slightly outward, torso absorbs jump
      const tuckAngle = -0.35 * Math.sin(Math.PI * Math.min(jumpProgress * 1.5, 1.0));
      leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, tuckAngle, 0.25);
      rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, tuckAngle * 0.9, 0.25);

      rightShoulderGroup.rotation.x = THREE.MathUtils.lerp(rightShoulderGroup.rotation.x, -0.45, 0.2);
      rightShoulderGroup.rotation.z = THREE.MathUtils.lerp(rightShoulderGroup.rotation.z, -0.22, 0.2);

      leftShoulderGroup.rotation.x = THREE.MathUtils.lerp(leftShoulderGroup.rotation.x, 0.35, 0.2);
      leftShoulderGroup.rotation.z = THREE.MathUtils.lerp(leftShoulderGroup.rotation.z, 0.18, 0.2);

      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0.12, 0.2);
      torsoGroup.position.y = THREE.MathUtils.lerp(torsoGroup.position.y, 1.25, 0.2);
    } else if (isMoving) {
      // 3. Walk & Sprint Locomotion Cycle
      const cycleFrequency = isSprinting ? 13.5 : 7.8;
      strideCycle += delta * cycleFrequency;

      const legStrideAmp = isSprinting ? 0.82 : 0.54;
      const armSwingAmp = isSprinting ? 0.72 : 0.42;

      // Alternating leg stride
      leftLegGroup.rotation.x = Math.sin(strideCycle) * legStrideAmp;
      rightLegGroup.rotation.x = -Math.sin(strideCycle) * legStrideAmp;

      // Right arm swings in opposite phase to right leg
      rightShoulderGroup.rotation.x = -Math.sin(strideCycle) * armSwingAmp;
      rightShoulderGroup.rotation.z = THREE.MathUtils.lerp(rightShoulderGroup.rotation.z, 0.08, 0.15);

      // Left arm holds textbook with subtle compensatory stabilization
      leftShoulderGroup.rotation.x = 0.20 + Math.sin(strideCycle) * 0.12;
      leftShoulderGroup.rotation.z = THREE.MathUtils.lerp(leftShoulderGroup.rotation.z, -0.12, 0.15);

      // Torso bobbing & forward lean
      const bounceHeight = isSprinting ? 0.075 : 0.045;
      const forwardLean = isSprinting ? 0.16 : 0.04;
      torsoGroup.position.y = 1.25 + Math.abs(Math.sin(strideCycle * 2)) * bounceHeight;
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, forwardLean, 0.15);

      // Counter-rotational torso yaw
      torsoGroup.rotation.y = Math.sin(strideCycle) * 0.05;

      // Head absorbs torso movement and looks forward
      headGroup.position.y = 0.63;
      headGroup.rotation.y = -torsoGroup.rotation.y * 0.5;
      headGroup.rotation.x = -torsoGroup.rotation.x * 0.3;
    } else {
      // 4. Idle Breathing & Sway State
      idleTime += delta;

      // Smoothly return legs to vertical rest
      leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0, 0.18);
      rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0, 0.18);

      // Reset torso tilt & yaw
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0, 0.15);
      torsoGroup.rotation.y = THREE.MathUtils.lerp(torsoGroup.rotation.y, 0, 0.15);

      // Subtle breathing oscillations
      const breatheBob = Math.sin(idleTime * 2.4) * 0.015;
      torsoGroup.position.y = 1.25 + breatheBob;

      // Head gentle natural breathing & gaze sway
      headGroup.position.y = 0.63 + breatheBob * 0.6;
      headGroup.rotation.y = Math.sin(idleTime * 1.1) * 0.04;
      headGroup.rotation.x = Math.sin(idleTime * 0.8) * 0.02;

      // Relaxed resting arms with gentle breath sway
      rightShoulderGroup.rotation.x = THREE.MathUtils.lerp(
        rightShoulderGroup.rotation.x,
        0.05 + Math.sin(idleTime * 2.0) * 0.03,
        0.15
      );
      rightShoulderGroup.rotation.z = THREE.MathUtils.lerp(rightShoulderGroup.rotation.z, 0.08, 0.15);

      leftShoulderGroup.rotation.x = THREE.MathUtils.lerp(
        leftShoulderGroup.rotation.x,
        0.20 - Math.sin(idleTime * 2.0) * 0.015,
        0.15
      );
      leftShoulderGroup.rotation.z = THREE.MathUtils.lerp(leftShoulderGroup.rotation.z, -0.12, 0.15);
    }
  }

  // --- CLEAN MEMORY DISPOSAL ---
  function dispose() {
    disposables.geometries.forEach((g) => g.dispose());
    disposables.materials.forEach((m) => m.dispose());
    disposables.textures.forEach((t) => t.dispose());
    disposables.geometries.length = 0;
    disposables.materials.length = 0;
    disposables.textures.length = 0;
  }

  return {
    characterGroup,
    rootOffsetGroup,
    torsoGroup,
    headGroup,
    leftShoulderGroup,
    rightShoulderGroup,
    hipsGroup,
    leftLegGroup,
    rightLegGroup,
    backpackGroup,
    bookGroup,
    pencilGroup,
    update,
    dispose,
  };
}
