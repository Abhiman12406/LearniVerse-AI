import * as THREE from 'three';

export interface CampusCollider {
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ClassroomEnvironment {
  group: THREE.Group;
  getActiveColliders: () => CampusCollider[];
  update: (delta: number) => void;
  dispose: () => void;
}

/**
 * Procedural 3D Virtual Classroom Campus Diorama
 * Inspired by asstesimages/classroom.webp with warm wooden furniture,
 * student double-workstations, computer terminals, bookshelves, chalkboards,
 * wall clocks, orange window blinds, and walkable corridors to DSA lab wings.
 */
export function createClassroomEnvironment(): ClassroomEnvironment {
  const root = new THREE.Group();
  root.name = 'ClassroomCampusDiorama';

  const colliders: CampusCollider[] = [];
  const disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  } = {
    geometries: [],
    materials: [],
    textures: [],
  };

  function trackGeometry<T extends THREE.BufferGeometry>(geo: T): T {
    disposables.geometries.push(geo);
    return geo;
  }

  function trackMaterial<T extends THREE.Material>(mat: T): T {
    disposables.materials.push(mat);
    return mat;
  }

  function trackTexture<T extends THREE.Texture>(tex: T): T {
    disposables.textures.push(tex);
    return tex;
  }

  // --- PALETTE ---
  const COLORS = {
    floorBase: '#ecd6bf',
    floorLines: '#cbb69e',
    floorDark: '#d8bfa5',
    wallPlaster: '#f3eee6',
    wallTaupe: '#7e716c',
    wallTrim: '#ded6cb',
    woodLight: '#e4c9a8',
    woodMedium: '#c29b71',
    woodDark: '#3d3028',
    metalBlack: '#222326',
    metalSilver: '#94a3b8',
    chalkboardGreen: '#203d2b',
    chalkboardFrame: '#382f2a',
    noticeBoardCork: '#b58b54',
    blindOrange: '#f0745b',
    blindRibs: '#d95a41',
    screenGlow: '#00f0ff',
    screenBg: '#090d16',
    bookBlue: '#2563eb',
    bookGreen: '#16a34a',
    bookOrange: '#ea580c',
    bookPurple: '#8b5cf6',
    bookGold: '#d97706',
    chairFabric: '#334155',
  };

  // Helper to register solid obstacle colliders
  function registerCollider(name: string, minX: number, maxX: number, minZ: number, maxZ: number) {
    colliders.push({
      name,
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX),
      minZ: Math.min(minZ, maxZ),
      maxZ: Math.max(minZ, maxZ),
    });
  }

  function registerBoxCollider(name: string, centerX: number, centerZ: number, widthX: number, widthZ: number) {
    const halfX = widthX / 2;
    const halfZ = widthZ / 2;
    registerCollider(name, centerX - halfX, centerX + halfX, centerZ - halfZ, centerZ + halfZ);
  }

  // --- 1. PROCEDURAL CANVAS TEXTURES ---

  // Staggered Wood Plank Floor Texture
  function createWoodFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = COLORS.floorBase;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const numPlanks = 16;
      const plankWidth = canvas.width / numPlanks;

      // Draw subtle grain streaks
      for (let i = 0; i < numPlanks; i++) {
        const x = i * plankWidth;
        // Subtle plank tone variation
        const tint = (i % 3 === 0) ? '#e6cfb6' : (i % 3 === 1) ? '#eed9c3' : '#e2caa9';
        ctx.fillStyle = tint;
        ctx.fillRect(x + 1, 0, plankWidth - 2, canvas.height);

        // Grain lines
        ctx.strokeStyle = 'rgba(180, 150, 125, 0.25)';
        ctx.lineWidth = 1;
        for (let g = 0; g < 4; g++) {
          const gx = x + (g + 1) * (plankWidth / 5);
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, canvas.height);
          ctx.stroke();
        }
      }

      // Vertical plank dividers
      ctx.strokeStyle = COLORS.floorLines;
      ctx.lineWidth = 2.5;
      for (let i = 0; i <= numPlanks; i++) {
        const x = i * plankWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();

        // Staggered horizontal joints
        const jointsPerPlank = 6;
        for (let j = 0; j < jointsPerPlank; j++) {
          const y = (j + ((i % 4) * 0.25)) * (canvas.height / jointsPerPlank);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + plankWidth, y);
          ctx.stroke();
        }
      }
    }

    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  // Glowing Computer Screen Code Texture
  function createScreenTexture(terminalTitle: string, lines: string[]): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark IDE window
      ctx.fillStyle = COLORS.screenBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top title bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, 36);

      // Window controls
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(20, 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(38, 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(56, 18, 6, 0, Math.PI * 2);
      ctx.fill();

      // Title
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(terminalTitle, 76, 23);

      // Code editor body
      ctx.font = '15px monospace';
      let y = 68;
      const palette = ['#38bdf8', '#f59e0b', '#10b981', '#cbd5e1', '#c084fc', '#f43f5e'];
      lines.forEach((line, idx) => {
        ctx.fillStyle = palette[idx % palette.length];
        ctx.fillText(line, 24, y);
        y += 28;
      });

      // Terminal status prompt
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('⚡ BKT Mastery Sync: Active', 24, canvas.height - 24);
    }

    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    return tex;
  }

  // Chalkboard Algorithm Texture
  function createChalkboardTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = COLORS.chalkboardGreen;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Chalk dust effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let i = 0; i < 60; i++) {
        const cx = Math.random() * canvas.width;
        const cy = Math.random() * canvas.height;
        const r = 20 + Math.random() * 60;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('DATA STRUCTURES & ADAPTIVE LEARNING', 50, 65);

      ctx.font = '22px monospace';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('// 1. Array Random Access: O(1) by index base + i * size', 50, 125);
      ctx.fillText('// 2. Linked List Pointer: [Data | Next*] -> NULL', 50, 165);
      ctx.fillText('// 3. Stack Apparatus: LIFO Push / Pop Actuation', 50, 205);
      ctx.fillText('// 4. Recursion: Base Case f(0) + Call Stack Unwinding', 50, 245);

      // Visual ASCII diagram of a Stack and Array
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 3;
      // Array boxes
      for (let b = 0; b < 5; b++) {
        const bx = 50 + b * 75;
        ctx.strokeRect(bx, 300, 70, 50);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '18px monospace';
        ctx.fillText(`[${b}]`, bx + 22, 332);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText(`i=${b}`, bx + 24, 375);
      }

      // Stack Tower ASCII diagram
      const stX = 540;
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(stX, 290);
      ctx.lineTo(stX, 420);
      ctx.lineTo(stX + 110, 420);
      ctx.lineTo(stX + 110, 290);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(stX + 12, 375, 86, 35);
      ctx.fillRect(stX + 12, 330, 86, 35);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('DISC A', stX + 28, 398);
      ctx.fillText('DISC B', stX + 28, 353);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('TOP ->', stX + 125, 353);

      // BKT Formula
      ctx.fillStyle = '#a7f3d0';
      ctx.font = '20px sans-serif';
      ctx.fillText('BKT: P(L_t) = P(L_{t-1}|Obs) + (1 - P(L_{t-1}|Obs)) * P(T)', 50, 450);
    }

    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    return tex;
  }

  // --- 2. MATERIALS ---
  const floorWoodMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      map: createWoodFloorTexture(),
      roughness: 0.65,
      metalness: 0.05,
    })
  );

  const wallPlasterMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.wallPlaster,
      roughness: 0.85,
      metalness: 0.02,
    })
  );

  const wallTaupeMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.wallTaupe,
      roughness: 0.9,
      metalness: 0.02,
    })
  );

  const woodLightMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.woodLight,
      roughness: 0.55,
      metalness: 0.05,
    })
  );

  const woodMediumMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.woodMedium,
      roughness: 0.65,
      metalness: 0.05,
    })
  );

  const woodDarkMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.woodDark,
      roughness: 0.75,
      metalness: 0.05,
    })
  );

  const metalBlackMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.metalBlack,
      roughness: 0.35,
      metalness: 0.7,
    })
  );

  const metalSilverMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.metalSilver,
      roughness: 0.3,
      metalness: 0.85,
    })
  );

  const orangeBlindMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.blindOrange,
      roughness: 0.7,
      metalness: 0.05,
    })
  );

  const chairMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.chairFabric,
      roughness: 0.8,
      metalness: 0.1,
    })
  );

  // --- 3. CAMPUS ARCHITECTURE ---
  const roomSize = 12.0; // Central classroom hub size: 12x12
  const wallHeight = 5.6;
  const wallThick = 0.35;
  const doorWidth = 3.6;

  // Central Classroom Floor
  const mainFloorGeo = trackGeometry(new THREE.BoxGeometry(roomSize, 0.4, roomSize));
  const mainFloor = new THREE.Mesh(mainFloorGeo, floorWoodMat);
  mainFloor.position.set(0, -0.2, 0);
  mainFloor.receiveShadow = true;
  root.add(mainFloor);

  // Staggered Corridors leading from classroom hub to lab wings (Array at X=-20, Linked List at X=+20, Recursion at Z=-20, Stack at Z=+20)
  const corridorWidth = 3.8;
  const corridorLength = 10.0; // extends from radius 6.0 to 16.0

  function createCorridor(x: number, z: number, rotY: number) {
    const corridorGeo = trackGeometry(new THREE.BoxGeometry(corridorWidth, 0.38, corridorLength));
    const corridor = new THREE.Mesh(corridorGeo, floorWoodMat);
    corridor.position.set(x, -0.19, z);
    corridor.rotation.y = rotY;
    corridor.receiveShadow = true;
    root.add(corridor);
  }

  // 4 Corridors to Wings
  createCorridor(-11.0, 0, Math.PI / 2); // West (Array Lab)
  createCorridor(11.0, 0, Math.PI / 2);  // East (Linked List Lab)
  createCorridor(0, -11.0, 0);           // North (Recursion Chamber)
  createCorridor(0, 11.0, 0);            // South (Stack Lab)

  // Doorway Portals on Classroom Perimeter
  function createDoorPortal(x: number, z: number, rotY: number, title: string, glowColor: string) {
    const portalGroup = new THREE.Group();
    portalGroup.position.set(x, 0, z);
    portalGroup.rotation.y = rotY;
    root.add(portalGroup);

    const pillarGeo = trackGeometry(new THREE.BoxGeometry(0.35, 3.4, 0.4));
    const leftPillar = new THREE.Mesh(pillarGeo, woodDarkMat);
    leftPillar.position.set(-doorWidth / 2 - 0.15, 1.7, 0);
    leftPillar.castShadow = true;
    portalGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, woodDarkMat);
    rightPillar.position.set(doorWidth / 2 + 0.15, 1.7, 0);
    rightPillar.castShadow = true;
    portalGroup.add(rightPillar);

    const lintelGeo = trackGeometry(new THREE.BoxGeometry(doorWidth + 0.7, 0.4, 0.45));
    const lintel = new THREE.Mesh(lintelGeo, woodDarkMat);
    lintel.position.set(0, 3.5, 0);
    lintel.castShadow = true;
    portalGroup.add(lintel);

    // Illuminated Doorway Header Sign
    const signFrameGeo = trackGeometry(new THREE.BoxGeometry(3.2, 0.65, 0.12));
    const signFrame = new THREE.Mesh(signFrameGeo, metalBlackMat);
    signFrame.position.set(0, 4.0, 0);
    portalGroup.add(signFrame);

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, 500, 116);

      ctx.fillStyle = glowColor;
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, 256, 64);
    }
    const signTex = trackTexture(new THREE.CanvasTexture(signCanvas));
    const signPlateGeo = trackGeometry(new THREE.PlaneGeometry(3.05, 0.55));
    const signMat = trackMaterial(new THREE.MeshBasicMaterial({ map: signTex }));
    const signPlateFront = new THREE.Mesh(signPlateGeo, signMat);
    signPlateFront.position.set(0, 4.0, 0.07);
    portalGroup.add(signPlateFront);

    const signPlateBack = new THREE.Mesh(signPlateGeo, signMat);
    signPlateBack.position.set(0, 4.0, -0.07);
    signPlateBack.rotation.y = Math.PI;
    portalGroup.add(signPlateBack);

    // Emissive Doorway Threshold Underglow
    const glowGeo = trackGeometry(new THREE.PlaneGeometry(doorWidth, 0.2));
    const glowMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      })
    );
    const thresholdGlow = new THREE.Mesh(glowGeo, glowMat);
    thresholdGlow.rotation.x = -Math.PI / 2;
    thresholdGlow.position.set(0, 0.02, 0);
    portalGroup.add(thresholdGlow);
  }

  // 4 Main Classroom Exit Portals
  createDoorPortal(-roomSize / 2, 0, Math.PI / 2, 'ARRAY LAB', '#0284c7');
  createDoorPortal(roomSize / 2, 0, -Math.PI / 2, 'LINKED LIST LAB', '#059669');
  createDoorPortal(0, -roomSize / 2, 0, 'RECURSION CHAMBER', '#7c3aed');
  createDoorPortal(0, roomSize / 2, Math.PI, 'STACK LAB', '#f59e0b');

  // Perimeter Classroom Walls (with openings for doorWidth = 3.6 in each cardinal direction)
  const halfRoom = roomSize / 2;
  const wallSegmentLen = (roomSize - doorWidth) / 2; // (12 - 3.6) / 2 = 4.2

  function buildWallSegment(
    name: string,
    x: number,
    z: number,
    widthX: number,
    widthZ: number,
    mat: THREE.Material
  ) {
    const geo = trackGeometry(new THREE.BoxGeometry(widthX, wallHeight, widthZ));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, wallHeight / 2, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    root.add(mesh);
    registerBoxCollider(name, x, z, widthX, widthZ);
  }

  // North Wall Segments (opening at x in [-1.8, 1.8])
  buildWallSegment(
    'Classroom North Wall (West)',
    -halfRoom + wallSegmentLen / 2,
    -halfRoom - wallThick / 2,
    wallSegmentLen,
    wallThick,
    wallPlasterMat
  );
  buildWallSegment(
    'Classroom North Wall (East)',
    halfRoom - wallSegmentLen / 2,
    -halfRoom - wallThick / 2,
    wallSegmentLen,
    wallThick,
    wallPlasterMat
  );

  // South Wall Segments (opening at x in [-1.8, 1.8])
  buildWallSegment(
    'Classroom South Wall (West)',
    -halfRoom + wallSegmentLen / 2,
    halfRoom + wallThick / 2,
    wallSegmentLen,
    wallThick,
    wallPlasterMat
  );
  buildWallSegment(
    'Classroom South Wall (East)',
    halfRoom - wallSegmentLen / 2,
    halfRoom + wallThick / 2,
    wallSegmentLen,
    wallThick,
    wallPlasterMat
  );

  // West Wall Segments (opening at z in [-1.8, 1.8])
  buildWallSegment(
    'Classroom West Wall (North)',
    -halfRoom - wallThick / 2,
    -halfRoom + wallSegmentLen / 2,
    wallThick,
    wallSegmentLen,
    wallTaupeMat
  );
  buildWallSegment(
    'Classroom West Wall (South)',
    -halfRoom - wallThick / 2,
    halfRoom - wallSegmentLen / 2,
    wallThick,
    wallSegmentLen,
    wallTaupeMat
  );

  // East Wall Segments (opening at z in [-1.8, 1.8])
  buildWallSegment(
    'Classroom East Wall (North)',
    halfRoom + wallThick / 2,
    -halfRoom + wallSegmentLen / 2,
    wallThick,
    wallSegmentLen,
    wallPlasterMat
  );
  buildWallSegment(
    'Classroom East Wall (South)',
    halfRoom + wallThick / 2,
    halfRoom - wallSegmentLen / 2,
    wallThick,
    wallSegmentLen,
    wallPlasterMat
  );

  // --- 4. WINDOWS & ORANGE BLINDS ---
  function createWindowWithBlinds(xPos: number, zPos: number, rotY: number) {
    const winGroup = new THREE.Group();
    winGroup.position.set(xPos, 3.0, zPos);
    winGroup.rotation.y = rotY;
    root.add(winGroup);

    const winW = 1.6;
    const winH = 2.6;

    // Window Outer Frame
    const frameGeo = trackGeometry(new THREE.BoxGeometry(winW + 0.12, winH + 0.12, 0.08));
    const frame = new THREE.Mesh(frameGeo, metalBlackMat);
    winGroup.add(frame);

    // Glass Pane
    const glassGeo = trackGeometry(new THREE.PlaneGeometry(winW, winH));
    const glassMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      })
    );
    const glass = new THREE.Mesh(glassGeo, glassMat);
    winGroup.add(glass);

    // Orange Accordion Window Blinds (#f0745b)
    const blindH = winH * 0.65;
    const blindGeo = trackGeometry(new THREE.BoxGeometry(winW + 0.04, blindH, 0.06));
    const blindMesh = new THREE.Mesh(blindGeo, orangeBlindMat);
    blindMesh.position.set(0, (winH - blindH) / 2, 0.04);
    blindMesh.castShadow = true;
    winGroup.add(blindMesh);

    // Horizontal Slats/Ribs across Blinds
    const numSlats = 8;
    const slatH = blindH / numSlats;
    const slatGeo = trackGeometry(new THREE.BoxGeometry(winW + 0.06, 0.025, 0.075));
    const slatMat = trackMaterial(new THREE.MeshStandardMaterial({ color: COLORS.blindRibs, roughness: 0.6 }));
    for (let s = 0; s < numSlats; s++) {
      const slat = new THREE.Mesh(slatGeo, slatMat);
      slat.position.set(0, (winH - blindH) / 2 - blindH / 2 + s * slatH + slatH / 2, 0.045);
      winGroup.add(slat);
    }
  }

  // Windows on North wall
  createWindowWithBlinds(-3.8, -halfRoom + 0.02, 0);
  createWindowWithBlinds(3.8, -halfRoom + 0.02, 0);

  // --- 5. TEACHER'S PODIUM DESK & LAPTOP ---
  const teacherDeskGroup = new THREE.Group();
  teacherDeskGroup.position.set(-2.0, 0, -3.2);
  teacherDeskGroup.rotation.y = Math.PI / 2;
  root.add(teacherDeskGroup);

  const tdW = 2.0;
  const tdD = 0.95;
  const tdH = 0.95;

  // Desktop Surface
  const tdTopGeo = trackGeometry(new THREE.BoxGeometry(tdW, 0.06, tdD));
  const tdTop = new THREE.Mesh(tdTopGeo, woodLightMat);
  tdTop.position.set(0, tdH, 0);
  tdTop.castShadow = true;
  tdTop.receiveShadow = true;
  teacherDeskGroup.add(tdTop);

  // Modesty Panel and Pedestal Legs
  const tdPanelGeo = trackGeometry(new THREE.BoxGeometry(tdW - 0.1, tdH - 0.06, 0.04));
  const tdPanel = new THREE.Mesh(tdPanelGeo, woodMediumMat);
  tdPanel.position.set(0, (tdH - 0.06) / 2, -tdD / 2 + 0.04);
  tdPanel.castShadow = true;
  teacherDeskGroup.add(tdPanel);

  const tdSideGeo = trackGeometry(new THREE.BoxGeometry(0.06, tdH - 0.06, tdD - 0.08));
  const tdSideL = new THREE.Mesh(tdSideGeo, woodMediumMat);
  tdSideL.position.set(-tdW / 2 + 0.05, (tdH - 0.06) / 2, 0);
  tdSideL.castShadow = true;
  teacherDeskGroup.add(tdSideL);

  const tdSideR = new THREE.Mesh(tdSideGeo, woodMediumMat);
  tdSideR.position.set(tdW / 2 - 0.05, (tdH - 0.06) / 2, 0);
  tdSideR.castShadow = true;
  teacherDeskGroup.add(tdSideR);

  // Teacher Laptop (Open)
  const laptopBaseGeo = trackGeometry(new THREE.BoxGeometry(0.42, 0.018, 0.28));
  const laptopBase = new THREE.Mesh(laptopBaseGeo, metalSilverMat);
  laptopBase.position.set(-0.35, tdH + 0.035, 0.08);
  laptopBase.castShadow = true;
  teacherDeskGroup.add(laptopBase);

  // Screen
  const laptopScreenGroup = new THREE.Group();
  laptopScreenGroup.position.set(-0.35, tdH + 0.045, -0.05);
  laptopScreenGroup.rotation.x = -0.35; // open angle
  teacherDeskGroup.add(laptopScreenGroup);

  const laptopScreenLidGeo = trackGeometry(new THREE.BoxGeometry(0.42, 0.28, 0.015));
  const laptopScreenLid = new THREE.Mesh(laptopScreenLidGeo, metalSilverMat);
  laptopScreenLid.position.set(0, 0.14, 0);
  laptopScreenGroup.add(laptopScreenLid);

  const laptopDisplayTex = createScreenTexture('Learner_Profile_Inspector.sh', [
    'const profile = await getLearner("S001");',
    'if (profile.mastery.stack < 0.70) {',
    '  world.lockZone("recursion_lab");',
    '  world.suggestZone("stack_lab");',
    '}',
  ]);
  const laptopDisplayGeo = trackGeometry(new THREE.PlaneGeometry(0.38, 0.24));
  const laptopDisplayMat = trackMaterial(new THREE.MeshBasicMaterial({ map: laptopDisplayTex }));
  const laptopDisplay = new THREE.Mesh(laptopDisplayGeo, laptopDisplayMat);
  laptopDisplay.position.set(0, 0.14, 0.009);
  laptopScreenGroup.add(laptopDisplay);

  // Teacher Desk Lamp
  const lampBaseGeo = trackGeometry(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 16));
  const lampBase = new THREE.Mesh(lampBaseGeo, metalBlackMat);
  lampBase.position.set(0.65, tdH + 0.04, -0.2);
  teacherDeskGroup.add(lampBase);

  const lampPoleGeo = trackGeometry(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8));
  const lampPole = new THREE.Mesh(lampPoleGeo, metalSilverMat);
  lampPole.position.set(0.65, tdH + 0.2, -0.2);
  teacherDeskGroup.add(lampPole);

  const lampShadeGeo = trackGeometry(new THREE.ConeGeometry(0.09, 0.12, 16, 1, true));
  const lampShade = new THREE.Mesh(
    lampShadeGeo,
    trackMaterial(new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 }))
  );
  lampShade.position.set(0.65, tdH + 0.38, -0.15);
  lampShade.rotation.x = 0.4;
  teacherDeskGroup.add(lampShade);

  // Teacher Chair
  const chairGroup = new THREE.Group();
  chairGroup.position.set(0, 0, 0.75);
  teacherDeskGroup.add(chairGroup);

  const chairSeatGeo = trackGeometry(new THREE.BoxGeometry(0.5, 0.06, 0.5));
  const chairSeat = new THREE.Mesh(chairSeatGeo, chairMat);
  chairSeat.position.set(0, 0.5, 0);
  chairSeat.castShadow = true;
  chairGroup.add(chairSeat);

  const chairBackGeo = trackGeometry(new THREE.BoxGeometry(0.48, 0.5, 0.05));
  const chairBack = new THREE.Mesh(chairBackGeo, chairMat);
  chairBack.position.set(0, 0.78, 0.22);
  chairBack.castShadow = true;
  chairGroup.add(chairBack);

  const chairStemGeo = trackGeometry(new THREE.CylinderGeometry(0.03, 0.03, 0.48, 8));
  const chairStem = new THREE.Mesh(chairStemGeo, metalSilverMat);
  chairStem.position.set(0, 0.24, 0);
  chairGroup.add(chairStem);

  registerBoxCollider("Teacher's Podium Desk", -2.0, -3.2, 1.2, 2.2);

  // --- 6. STUDENT DOUBLE-WORKSTATIONS WITH COMPUTER TERMINALS ---
  function buildDoubleWorkstation(name: string, posX: number, posZ: number, rotY: number) {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(posX, 0, posZ);
    stationGroup.rotation.y = rotY;
    root.add(stationGroup);

    const deskW = 1.35;
    const deskL = 2.4; // Accommodates 2 student seats side-by-side
    const deskH = 0.82;

    // Desktop
    const topGeo = trackGeometry(new THREE.BoxGeometry(deskW, 0.05, deskL));
    const top = new THREE.Mesh(topGeo, woodLightMat);
    top.position.set(0, deskH, 0);
    top.castShadow = true;
    top.receiveShadow = true;
    stationGroup.add(top);

    // Sturdy metal legs
    const legGeo = trackGeometry(new THREE.CylinderGeometry(0.025, 0.025, deskH, 8));
    const legOffsets = [
      [-deskW / 2 + 0.06, -deskL / 2 + 0.06],
      [deskW / 2 - 0.06, -deskL / 2 + 0.06],
      [-deskW / 2 + 0.06, deskL / 2 - 0.06],
      [deskW / 2 - 0.06, deskL / 2 - 0.06],
      [-deskW / 2 + 0.06, 0],
      [deskW / 2 - 0.06, 0],
    ];

    legOffsets.forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(legGeo, metalBlackMat);
      leg.position.set(ox, deskH / 2, oz);
      leg.castShadow = true;
      stationGroup.add(leg);
    });

    // 2 Computer Terminals (left terminal at oz = -0.65, right terminal at oz = 0.65)
    [-0.65, 0.65].forEach((termZ, termIdx) => {
      // Monitor Stand
      const standGeo = trackGeometry(new THREE.BoxGeometry(0.18, 0.015, 0.18));
      const stand = new THREE.Mesh(standGeo, metalBlackMat);
      stand.position.set(-0.15, deskH + 0.03, termZ);
      stationGroup.add(stand);

      const standArmGeo = trackGeometry(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8));
      const standArm = new THREE.Mesh(standArmGeo, metalSilverMat);
      standArm.position.set(-0.15, deskH + 0.14, termZ);
      stationGroup.add(standArm);

      // Monitor Screen Frame
      const monFrameGeo = trackGeometry(new THREE.BoxGeometry(0.05, 0.36, 0.52));
      const monFrame = new THREE.Mesh(monFrameGeo, metalBlackMat);
      monFrame.position.set(-0.15, deskH + 0.26, termZ);
      monFrame.castShadow = true;
      stationGroup.add(monFrame);

      // Glowing Code Display
      const codeLines = termIdx === 0
        ? [
            'function push(disc) {',
            '  stack[top++] = disc;',
            '  emit("STACK_UPDATED");',
            '}',
          ]
        : [
            'function factorial(n) {',
            '  if (n <= 1) return 1;',
            '  return n * factorial(n-1);',
            '}',
          ];
      const monTex = createScreenTexture(`Terminal_${termIdx + 1}.ts`, codeLines);
      const monDisplayGeo = trackGeometry(new THREE.PlaneGeometry(0.48, 0.32));
      const monDisplayMat = trackMaterial(new THREE.MeshBasicMaterial({ map: monTex }));
      const monDisplay = new THREE.Mesh(monDisplayGeo, monDisplayMat);
      monDisplay.position.set(-0.12, deskH + 0.26, termZ);
      monDisplay.rotation.y = Math.PI / 2;
      stationGroup.add(monDisplay);

      // Mechanical Keyboard
      const kbGeo = trackGeometry(new THREE.BoxGeometry(0.16, 0.018, 0.42));
      const kb = new THREE.Mesh(kbGeo, metalBlackMat);
      kb.position.set(0.14, deskH + 0.035, termZ);
      kb.castShadow = true;
      stationGroup.add(kb);

      // Mouse
      const mouseGeo = trackGeometry(new THREE.BoxGeometry(0.1, 0.015, 0.06));
      const mouse = new THREE.Mesh(mouseGeo, metalBlackMat);
      mouse.position.set(0.14, deskH + 0.033, termZ + 0.28);
      stationGroup.add(mouse);

      // PC Tower under desk
      const pcGeo = trackGeometry(new THREE.BoxGeometry(0.44, 0.45, 0.18));
      const pc = new THREE.Mesh(pcGeo, metalBlackMat);
      pc.position.set(-0.1, 0.23, termZ);
      pc.castShadow = true;
      stationGroup.add(pc);

      // PC Power LED
      const ledGeo = trackGeometry(new THREE.SphereGeometry(0.015, 8, 8));
      const ledMat = trackMaterial(new THREE.MeshBasicMaterial({ color: COLORS.screenGlow }));
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0.13, 0.38, termZ);
      stationGroup.add(led);

      // Student Chair
      const sChair = new THREE.Group();
      sChair.position.set(0.65, 0, termZ);
      stationGroup.add(sChair);

      const sSeatGeo = trackGeometry(new THREE.BoxGeometry(0.42, 0.045, 0.42));
      const sSeat = new THREE.Mesh(sSeatGeo, chairMat);
      sSeat.position.set(0, 0.46, 0);
      sSeat.castShadow = true;
      sChair.add(sSeat);

      const sBackGeo = trackGeometry(new THREE.BoxGeometry(0.04, 0.4, 0.4));
      const sBack = new THREE.Mesh(sBackGeo, chairMat);
      sBack.position.set(0.2, 0.7, 0);
      sBack.castShadow = true;
      sChair.add(sBack);

      const sLegGeo = trackGeometry(new THREE.CylinderGeometry(0.018, 0.018, 0.46, 8));
      [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]].forEach(([lx, lz]) => {
        const cl = new THREE.Mesh(sLegGeo, metalBlackMat);
        cl.position.set(lx, 0.23, lz);
        sChair.add(cl);
      });
    });

    registerBoxCollider(name, posX, posZ, deskW + 0.3, deskL + 0.2);
  }

  // 3 Student Double-Workstations with generous walking space
  buildDoubleWorkstation('Student Workstation #1', 2.8, -2.6, 0);
  buildDoubleWorkstation('Student Workstation #2', 2.8, 2.6, 0);
  buildDoubleWorkstation('Student Workstation #3', -2.8, 2.6, 0);

  // --- 7. BOOKSHELVES WITH PROCEDURAL BOOKS ---
  function buildBookshelf(name: string, posX: number, posZ: number, rotY: number) {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(posX, 0, posZ);
    shelfGroup.rotation.y = rotY;
    root.add(shelfGroup);

    const sW = 1.6;
    const sH = 2.8;
    const sD = 0.42;

    // Outer Frame
    const frameMat = woodDarkMat;
    // Left upright
    const upL = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(0.05, sH, sD)), frameMat);
    upL.position.set(-sW / 2 + 0.025, sH / 2, 0);
    upL.castShadow = true;
    shelfGroup.add(upL);

    // Right upright
    const upR = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(0.05, sH, sD)), frameMat);
    upR.position.set(sW / 2 - 0.025, sH / 2, 0);
    upR.castShadow = true;
    shelfGroup.add(upR);

    // Back panel
    const backP = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(sW, sH, 0.02)), woodMediumMat);
    backP.position.set(0, sH / 2, -sD / 2 + 0.01);
    shelfGroup.add(backP);

    // 4 Shelves
    const numShelves = 4;
    const shelfSpacing = sH / (numShelves + 1);
    const bookColors = [
      COLORS.bookBlue,
      COLORS.bookGreen,
      COLORS.bookOrange,
      COLORS.bookPurple,
      COLORS.bookGold,
      '#dc2626',
      '#0284c7',
      '#059669',
    ];

    for (let s = 1; s <= numShelves; s++) {
      const sy = s * shelfSpacing;
      const shMesh = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(sW, 0.04, sD)), frameMat);
      shMesh.position.set(0, sy, 0);
      shMesh.castShadow = true;
      shelfGroup.add(shMesh);

      // Procedural books on shelf
      let currentX = -sW / 2 + 0.12;
      while (currentX < sW / 2 - 0.18) {
        const bookW = 0.04 + Math.random() * 0.035;
        const bookH = shelfSpacing * (0.65 + Math.random() * 0.28);
        const bookD = sD * 0.75;
        const bookColor = bookColors[Math.floor(Math.random() * bookColors.length)];

        const bookMat = trackMaterial(new THREE.MeshStandardMaterial({ color: bookColor, roughness: 0.6 }));
        const bookMesh = new THREE.Mesh(
          trackGeometry(new THREE.BoxGeometry(bookW, bookH, bookD)),
          bookMat
        );
        bookMesh.position.set(currentX + bookW / 2, sy + bookH / 2 + 0.02, 0.02);
        bookMesh.castShadow = true;
        shelfGroup.add(bookMesh);

        currentX += bookW + 0.008;
      }
    }

    registerBoxCollider(name, posX, posZ, sW + 0.2, sD + 0.2);
  }

  buildBookshelf('Classroom Bookshelf (West)', -halfRoom + 0.45, -halfRoom + 2.2, Math.PI / 2);
  buildBookshelf('Classroom Bookshelf (East)', halfRoom - 0.45, -halfRoom + 2.2, -Math.PI / 2);

  // --- 8. CHALKBOARD & NOTICE BOARD ---
  // Large Classroom Chalkboard on West wall
  const cbGroup = new THREE.Group();
  cbGroup.position.set(-halfRoom + 0.06, 2.8, -halfRoom + 4.6);
  cbGroup.rotation.y = Math.PI / 2;
  root.add(cbGroup);

  const cbW = 2.8;
  const cbH = 1.6;

  const cbFrame = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(cbW + 0.14, cbH + 0.14, 0.05)),
    woodDarkMat
  );
  cbFrame.castShadow = true;
  cbGroup.add(cbFrame);

  const cbTex = createChalkboardTexture();
  const cbInner = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(cbW, cbH)),
    trackMaterial(new THREE.MeshStandardMaterial({ map: cbTex, roughness: 0.75 }))
  );
  cbInner.position.z = 0.03;
  cbGroup.add(cbInner);

  // Chalk ledge with chalk sticks
  const chalkLedge = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(cbW, 0.03, 0.09)),
    woodDarkMat
  );
  chalkLedge.position.set(0, -cbH / 2 - 0.015, 0.045);
  cbGroup.add(chalkLedge);

  // Notice Board on East wall
  const nbGroup = new THREE.Group();
  nbGroup.position.set(halfRoom - 0.06, 2.8, halfRoom - 4.6);
  nbGroup.rotation.y = -Math.PI / 2;
  root.add(nbGroup);

  const nbFrame = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(1.6, 1.2, 0.04)),
    woodDarkMat
  );
  nbGroup.add(nbFrame);

  const nbInner = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(1.5, 1.1)),
    trackMaterial(new THREE.MeshStandardMaterial({ color: COLORS.noticeBoardCork, roughness: 0.9 }))
  );
  nbInner.position.z = 0.025;
  nbGroup.add(nbInner);

  // Notice Papers on Bulletin Board
  [[-0.4, 0.2], [0.1, 0.25], [-0.2, -0.2], [0.35, -0.15]].forEach(([px, py], pidx) => {
    const paperMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: pidx % 2 === 0 ? '#fef08a' : '#f8fafc',
        side: THREE.DoubleSide,
      })
    );
    const paperMesh = new THREE.Mesh(trackGeometry(new THREE.PlaneGeometry(0.24, 0.3)), paperMat);
    paperMesh.position.set(px, py, 0.03);
    paperMesh.rotation.z = (pidx - 1.5) * 0.08;
    nbGroup.add(paperMesh);
  });

  // --- 9. WALL CLOCK (ANIMATED) ---
  const clockGroup = new THREE.Group();
  clockGroup.position.set(0, 4.2, -halfRoom + 0.06);
  root.add(clockGroup);

  const clockRimGeo = trackGeometry(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 32));
  const clockRim = new THREE.Mesh(clockRimGeo, metalBlackMat);
  clockRim.rotation.x = Math.PI / 2;
  clockRim.castShadow = true;
  clockGroup.add(clockRim);

  const clockDialGeo = trackGeometry(new THREE.CircleGeometry(0.34, 32));
  const clockDialMat = trackMaterial(new THREE.MeshBasicMaterial({ color: '#fcfcfc' }));
  const clockDial = new THREE.Mesh(clockDialGeo, clockDialMat);
  clockDial.position.z = 0.028;
  clockGroup.add(clockDial);

  // Clock hour hand
  const hourHandGroup = new THREE.Group();
  hourHandGroup.position.z = 0.032;
  clockGroup.add(hourHandGroup);
  const hourHandMesh = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(0.02, 0.16, 0.005)),
    metalBlackMat
  );
  hourHandMesh.position.y = 0.08;
  hourHandGroup.add(hourHandMesh);

  // Clock minute hand
  const minuteHandGroup = new THREE.Group();
  minuteHandGroup.position.z = 0.035;
  clockGroup.add(minuteHandGroup);
  const minuteHandMesh = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(0.014, 0.24, 0.005)),
    metalBlackMat
  );
  minuteHandMesh.position.y = 0.12;
  minuteHandGroup.add(minuteHandMesh);

  // Clock second hand
  const secondHandGroup = new THREE.Group();
  secondHandGroup.position.z = 0.038;
  clockGroup.add(secondHandGroup);
  const secondHandMesh = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(0.006, 0.26, 0.005)),
    trackMaterial(new THREE.MeshBasicMaterial({ color: '#ef4444' }))
  );
  secondHandMesh.position.y = 0.13;
  secondHandGroup.add(secondHandMesh);

  // Center pin
  const pinMesh = new THREE.Mesh(
    trackGeometry(new THREE.SphereGeometry(0.02, 12, 12)),
    metalBlackMat
  );
  pinMesh.position.z = 0.042;
  clockGroup.add(pinMesh);

  // --- 10. CAMPUS CORRIDOR PERIMETER COLLIDERS ---
  // Ensure the avatar cannot walk outside the corridors into empty space
  // Corridor West (Array)
  registerBoxCollider('Corridor West North Wall', -11.0, -corridorWidth / 2 - 0.1, corridorLength, 0.2);
  registerBoxCollider('Corridor West South Wall', -11.0, corridorWidth / 2 + 0.1, corridorLength, 0.2);

  // Corridor East (Linked List)
  registerBoxCollider('Corridor East North Wall', 11.0, -corridorWidth / 2 - 0.1, corridorLength, 0.2);
  registerBoxCollider('Corridor East South Wall', 11.0, corridorWidth / 2 + 0.1, corridorLength, 0.2);

  // Corridor North (Recursion)
  registerBoxCollider('Corridor North West Wall', -corridorWidth / 2 - 0.1, -11.0, 0.2, corridorLength);
  registerBoxCollider('Corridor North East Wall', corridorWidth / 2 + 0.1, -11.0, 0.2, corridorLength);

  // Corridor South (Stack)
  registerBoxCollider('Corridor South West Wall', -corridorWidth / 2 - 0.1, 11.0, 0.2, corridorLength);
  registerBoxCollider('Corridor South East Wall', corridorWidth / 2 + 0.1, 11.0, 0.2, corridorLength);

  // --- 11. UPDATE & DISPOSAL ---
  let clockTime = 10 * 3600 + 15 * 60; // 10:15 am

  function update(delta: number) {
    clockTime += delta;
    const hours = (clockTime / 3600) % 12;
    const minutes = (clockTime / 60) % 60;
    const seconds = clockTime % 60;

    hourHandGroup.rotation.z = -((hours / 12) * Math.PI * 2);
    minuteHandGroup.rotation.z = -((minutes / 60) * Math.PI * 2);
    secondHandGroup.rotation.z = -((seconds / 60) * Math.PI * 2);
  }

  function dispose() {
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });

    disposables.geometries.forEach((g) => g.dispose());
    disposables.materials.forEach((m) => m.dispose());
    disposables.textures.forEach((t) => t.dispose());

    disposables.geometries.length = 0;
    disposables.materials.length = 0;
    disposables.textures.length = 0;
  }

  return {
    group: root,
    getActiveColliders: () => colliders,
    update,
    dispose,
  };
}
