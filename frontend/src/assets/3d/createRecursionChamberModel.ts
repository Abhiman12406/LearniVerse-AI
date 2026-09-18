import * as THREE from 'three';

export interface RecursionFrameData {
  id: string;
  n: number;
  callLabel: string;
  argValue: number;
  returnValue: number | null;
  status: 'active' | 'base_case' | 'resolved';
}

export interface RecursionChamberModelOptions {
  maxDepth?: number;
  initialFrames?: RecursionFrameData[];
}

export interface RecursionChamberModelState {
  frames?: RecursionFrameData[];
  isUnwinding?: boolean;
  returnStep?: number;
  stackOverflow?: boolean;
}

export interface RecursionChamberModelRig {
  group: THREE.Group;
  framesGroup: THREE.Group;
  basePlinthGroup: THREE.Group;
  basePedestalGroup: THREE.Group;
  towerFrameGroup: THREE.Group;
  conduitsGroup: THREE.Group;
  returnBeam: THREE.Mesh;
  overflowBeacon: THREE.Group;
  update: (delta: number, state?: Partial<RecursionChamberModelState>) => void;
  pushCallFrame: (n: number, callLabel?: string) => void;
  popCallFrame: () => void;
  triggerReturnCascade: () => void;
  triggerStackOverflow: () => void;
  clearStackOverflow: () => void;
  reset: () => void;
  dispose: () => void;
}

interface ActivePlatformState {
  id: string;
  n: number;
  callLabel: string;
  argValue: number;
  returnValue: number | null;
  status: 'active' | 'base_case' | 'resolved';
  group: THREE.Group;
  currentY: number;
  targetY: number;
  velocity: number;
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  meshMat: THREE.MeshStandardMaterial;
  glowRimMat: THREE.MeshBasicMaterial;
  disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  };
}

/**
 * Procedural 3D Recursion Call-Stack Elevator Apparatus Factory
 * Faithful high-fidelity reconstruction from `asstesimages/recursion_chamber.png`:
 * - Layered oak wood base plinth with rounded ivory/cream beveled edge contour
 * - Golden Base Case pedestal platform at the bottom of the elevator shaft (`BASE CASE n=1`)
 * - 4 vertical oak pillars with brass banding collars and corner cap finials
 * - Brass diagonal truss cross-bracing (X-braces) on elevator side tiers
 * - Stacked translucent call-frame platforms (`f(3)`, `f(2)`, `f(1)`) with gold undercarriages,
 *   neon edge glow, and dynamic call signature/return value plates
 * - Twin curved luminous energy conduits (cyan `#00f0ff` & gold `#ffaa22`) with traveling pulse waves
 * - Luminous vertical upward light beam for base-case return sequence unwinding
 * - Emergency strobe beacon and violent jitter vibration for Stack Overflow warning
 */
export function createRecursionChamberModel(
  options: RecursionChamberModelOptions = {}
): RecursionChamberModelRig {
  const {
    maxDepth = 5,
    initialFrames = [
      { id: 'frame-3', n: 3, callLabel: 'f(3)', argValue: 3, returnValue: null, status: 'active' },
      { id: 'frame-2', n: 2, callLabel: 'f(2)', argValue: 2, returnValue: null, status: 'active' },
      { id: 'frame-1', n: 1, callLabel: 'f(1)', argValue: 1, returnValue: null, status: 'base_case' },
    ],
  } = options;

  const root = new THREE.Group();
  root.name = 'RecursionChamberApparatus';

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

  // --- AUTHENTIC COLOR PALETTE (From recursion_chamber.png) ---
  const COLORS = {
    woodOak: '#b8824f',
    woodOakDark: '#784c24',
    creamRim: '#f5f0e4',
    brassGold: '#d8aa46',
    brassDark: '#997322',
    brassPolish: '#f7d67b',
    acrylicPad: '#fef9e7',
    acrylicTranslucent: '#f8fafc',
    neonCyan: '#00f0ff',
    neonGold: '#ffaa22',
    neonAmberGlow: '#ff9a1f',
    neonGreen: '#22c55e',
    dangerRed: '#ef4444',
  };

  // --- PROCEDURAL WOOD GRAIN TEXTURE ---
  function createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = COLORS.woodOak;
      ctx.fillRect(0, 0, 512, 512);

      // Wood fiber streaks
      for (let i = 0; i < 60; i++) {
        const y = Math.random() * 512;
        const h = 2 + Math.random() * 6;
        ctx.fillStyle = COLORS.woodOakDark;
        ctx.globalAlpha = 0.12 + Math.random() * 0.16;
        ctx.fillRect(0, y, 512, h);
      }
      ctx.globalAlpha = 1.0;
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return trackTexture(tex);
  }

  const woodTexture = createWoodTexture();

  // --- 1. BASE PLINTH ---
  const basePlinthGroup = new THREE.Group();
  basePlinthGroup.name = 'BasePlinth';

  // Lower dark footing
  const footGeo = trackGeometry(new THREE.BoxGeometry(2.7, 0.14, 2.7));
  const footMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.woodOakDark,
      roughness: 0.7,
      metalness: 0.15,
    })
  );
  const footMesh = new THREE.Mesh(footGeo, footMat);
  footMesh.position.y = 0.07;
  footMesh.receiveShadow = true;
  basePlinthGroup.add(footMesh);

  // Middle ivory/cream rounded beveled rim
  const creamRimGeo = trackGeometry(new THREE.BoxGeometry(2.52, 0.12, 2.52));
  const creamRimMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.creamRim,
      roughness: 0.35,
      metalness: 0.2,
    })
  );
  const creamRimMesh = new THREE.Mesh(creamRimGeo, creamRimMat);
  creamRimMesh.position.y = 0.2;
  creamRimMesh.receiveShadow = true;
  basePlinthGroup.add(creamRimMesh);

  // Upper oak wood plinth deck
  const deckGeo = trackGeometry(new THREE.BoxGeometry(2.36, 0.14, 2.36));
  const deckMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.woodOak,
      map: woodTexture,
      roughness: 0.55,
      metalness: 0.2,
    })
  );
  const deckMesh = new THREE.Mesh(deckGeo, deckMat);
  deckMesh.position.y = 0.33;
  deckMesh.receiveShadow = true;
  deckMesh.castShadow = true;
  basePlinthGroup.add(deckMesh);

  // Brass deck perimeter bezel trim
  const deckTrimGeo = trackGeometry(new THREE.BoxGeometry(2.4, 0.02, 2.4));
  const deckTrimMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.brassGold,
      roughness: 0.3,
      metalness: 0.85,
    })
  );
  const deckTrimMesh = new THREE.Mesh(deckTrimGeo, deckTrimMat);
  deckTrimMesh.position.y = 0.405;
  basePlinthGroup.add(deckTrimMesh);

  root.add(basePlinthGroup);

  // --- 2. BASE CASE PEDESTAL PLATFORM ---
  const basePedestalGroup = new THREE.Group();
  basePedestalGroup.name = 'BaseCasePedestal';
  basePedestalGroup.position.set(0, 0.41, 0);

  // Metallic gold pedestal housing
  const pedHousingGeo = trackGeometry(new THREE.BoxGeometry(1.28, 0.22, 1.28));
  const pedHousingMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.brassGold,
      roughness: 0.32,
      metalness: 0.85,
    })
  );
  const pedHousing = new THREE.Mesh(pedHousingGeo, pedHousingMat);
  pedHousing.position.y = 0.11;
  pedHousing.castShadow = true;
  pedHousing.receiveShadow = true;
  basePedestalGroup.add(pedHousing);

  // Beveled collar lip
  const pedLipGeo = trackGeometry(new THREE.BoxGeometry(1.34, 0.04, 1.34));
  const pedLipMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.brassPolish,
      roughness: 0.2,
      metalness: 0.9,
    })
  );
  const pedLip = new THREE.Mesh(pedLipGeo, pedLipMat);
  pedLip.position.y = 0.02;
  basePedestalGroup.add(pedLip);

  // Glowing Base Case acrylic illumination pad
  const baseCasePadGeo = trackGeometry(new THREE.BoxGeometry(1.08, 0.08, 1.08));

  // Dynamic canvas texture for "BASE CASE n=1"
  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = 512;
  baseCanvas.height = 512;
  const bCtx = baseCanvas.getContext('2d');
  if (bCtx) {
    bCtx.fillStyle = '#fff9eb';
    bCtx.fillRect(0, 0, 512, 512);

    // Warm golden gradient border
    bCtx.strokeStyle = '#f59e0b';
    bCtx.lineWidth = 24;
    bCtx.strokeRect(16, 16, 480, 480);

    bCtx.strokeStyle = '#d97706';
    bCtx.lineWidth = 6;
    bCtx.strokeRect(36, 36, 440, 440);

    // Bold title: "BASE CASE"
    bCtx.fillStyle = '#1e1b18';
    bCtx.font = '900 68px monospace';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.fillText('BASE', 256, 190);
    bCtx.fillText('CASE', 256, 265);

    // Subtitle: "n=1"
    bCtx.fillStyle = '#b45309';
    bCtx.font = '800 60px monospace';
    bCtx.fillText('n=1', 256, 350);
  }
  const basePadTex = trackTexture(new THREE.CanvasTexture(baseCanvas));

  const basePadMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: basePadTex,
      roughness: 0.2,
      metalness: 0.1,
      emissive: '#ffaa22',
      emissiveIntensity: 0.45,
    })
  );
  const baseCasePad = new THREE.Mesh(baseCasePadGeo, basePadMat);
  baseCasePad.name = 'BaseCasePad';
  baseCasePad.position.y = 0.26;
  baseCasePad.castShadow = true;
  basePedestalGroup.add(baseCasePad);

  // Base case edge glow rim
  const baseGlowRimGeo = trackGeometry(new THREE.BoxGeometry(1.12, 0.02, 1.12));
  const baseGlowRimMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: COLORS.neonGold,
      wireframe: false,
    })
  );
  const baseGlowRim = new THREE.Mesh(baseGlowRimGeo, baseGlowRimMat);
  baseGlowRim.position.y = 0.22;
  basePedestalGroup.add(baseGlowRim);

  // Dual cable conduit sockets on rear-right corner of base pedestal
  const socketGeo = trackGeometry(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 12));
  const socketMat = trackMaterial(
    new THREE.MeshStandardMaterial({ color: COLORS.brassDark, roughness: 0.3, metalness: 0.85 })
  );
  const socket1 = new THREE.Mesh(socketGeo, socketMat);
  socket1.position.set(0.48, 0.24, 0.38);
  basePedestalGroup.add(socket1);

  const socket2 = new THREE.Mesh(socketGeo, socketMat);
  socket2.position.set(0.38, 0.24, 0.48);
  basePedestalGroup.add(socket2);

  root.add(basePedestalGroup);

  // --- 3. ELEVATOR TOWER FRAME & CROSS-BRACING ---
  const towerFrameGroup = new THREE.Group();
  towerFrameGroup.name = 'ElevatorTowerFrame';
  towerFrameGroup.position.set(0, 0.41, 0);

  const pillarHeight = 3.9;
  const pillarRadius = 0.85; // Distance from center
  const pillarPositions: [number, number][] = [
    [-pillarRadius, -pillarRadius],
    [pillarRadius, -pillarRadius],
    [pillarRadius, pillarRadius],
    [-pillarRadius, pillarRadius],
  ];

  // Wood Pillar Geometry & Material
  const pillarGeo = trackGeometry(new THREE.BoxGeometry(0.18, pillarHeight, 0.18));
  const pillarMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.woodOak,
      map: woodTexture,
      roughness: 0.55,
      metalness: 0.2,
    })
  );

  const brassCollarGeo = trackGeometry(new THREE.BoxGeometry(0.22, 0.08, 0.22));
  const brassCollarMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.brassGold,
      roughness: 0.3,
      metalness: 0.85,
    })
  );

  const ivoryCapGeo = trackGeometry(new THREE.BoxGeometry(0.24, 0.12, 0.24));
  const ivoryCapMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.creamRim,
      roughness: 0.3,
      metalness: 0.2,
    })
  );

  // Build 4 corner pillars with collars & finials
  pillarPositions.forEach(([px, pz], idx) => {
    const pGroup = new THREE.Group();
    pGroup.name = `Pillar_${idx}`;
    pGroup.position.set(px, 0, pz);

    // Main column
    const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
    pillarMesh.position.y = pillarHeight / 2;
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;
    pGroup.add(pillarMesh);

    // Base shoe collar
    const baseShoe = new THREE.Mesh(brassCollarGeo, brassCollarMat);
    baseShoe.position.y = 0.08;
    pGroup.add(baseShoe);

    // Mid brass banding rings (2 tiers)
    const midBand1 = new THREE.Mesh(brassCollarGeo, brassCollarMat);
    midBand1.position.y = 1.35;
    pGroup.add(midBand1);

    const midBand2 = new THREE.Mesh(brassCollarGeo, brassCollarMat);
    midBand2.position.y = 2.65;
    pGroup.add(midBand2);

    // Top ivory and brass crown finial
    const topCap = new THREE.Mesh(ivoryCapGeo, ivoryCapMat);
    topCap.position.y = pillarHeight + 0.06;
    pGroup.add(topCap);

    const topBrassBezel = new THREE.Mesh(brassCollarGeo, brassCollarMat);
    topBrassBezel.position.y = pillarHeight - 0.04;
    pGroup.add(topBrassBezel);

    towerFrameGroup.add(pGroup);
  });

  // Top header crossbeams connecting 4 pillars
  const beamXGeo = trackGeometry(new THREE.BoxGeometry(pillarRadius * 2, 0.12, 0.12));
  const beamZGeo = trackGeometry(new THREE.BoxGeometry(0.12, 0.12, pillarRadius * 2));
  const headerBeamMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.woodOak,
      map: woodTexture,
      roughness: 0.5,
      metalness: 0.25,
    })
  );

  // Top horizontal beams
  const topBeamN = new THREE.Mesh(beamXGeo, headerBeamMat);
  topBeamN.position.set(0, pillarHeight - 0.04, -pillarRadius);
  towerFrameGroup.add(topBeamN);

  const topBeamS = new THREE.Mesh(beamXGeo, headerBeamMat);
  topBeamS.position.set(0, pillarHeight - 0.04, pillarRadius);
  towerFrameGroup.add(topBeamS);

  const topBeamW = new THREE.Mesh(beamZGeo, headerBeamMat);
  topBeamW.position.set(-pillarRadius, pillarHeight - 0.04, 0);
  towerFrameGroup.add(topBeamW);

  const topBeamE = new THREE.Mesh(beamZGeo, headerBeamMat);
  topBeamE.position.set(pillarRadius, pillarHeight - 0.04, 0);
  towerFrameGroup.add(topBeamE);

  // Diagonal Brass Truss Cross-Bracing (X-Braces on Left, Right, Back sides)
  const trussMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.brassGold,
      roughness: 0.35,
      metalness: 0.85,
    })
  );

  function createXTrussTier(
    p1: [number, number],
    p2: [number, number],
    yBottom: number,
    yTop: number
  ): THREE.Group {
    const trussTier = new THREE.Group();
    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    const horizontalDist = Math.hypot(dx, dz);
    const height = yTop - yBottom;
    const diagLength = Math.hypot(horizontalDist, height);

    const strutGeo = trackGeometry(new THREE.CylinderGeometry(0.022, 0.022, diagLength, 8));

    const angleY = Math.atan2(dx, dz);
    const tiltAngle = Math.atan2(horizontalDist, height);

    // Strut 1 (forward diagonal)
    const strut1 = new THREE.Mesh(strutGeo, trussMat);
    strut1.position.set((p1[0] + p2[0]) / 2, (yBottom + yTop) / 2, (p1[1] + p2[1]) / 2);
    strut1.rotation.y = angleY;
    strut1.rotation.x = tiltAngle;
    trussTier.add(strut1);

    // Strut 2 (reverse diagonal)
    const strut2 = new THREE.Mesh(strutGeo, trussMat);
    strut2.position.set((p1[0] + p2[0]) / 2, (yBottom + yTop) / 2, (p1[1] + p2[1]) / 2);
    strut2.rotation.y = angleY;
    strut2.rotation.x = -tiltAngle;
    trussTier.add(strut2);

    return trussTier;
  }

  // Add 3 vertical tiers of X-braces on sides
  // Left side: [-R, R] to [-R, -R]
  // Right side: [R, -R] to [R, R]
  // Back side: [-R, -R] to [R, -R]
  const tiers = [
    { yB: 0.12, yT: 1.35 },
    { yB: 1.35, yT: 2.65 },
    { yB: 2.65, yT: 3.86 },
  ];

  tiers.forEach(({ yB, yT }) => {
    // Left side (West)
    towerFrameGroup.add(
      createXTrussTier([-pillarRadius, pillarRadius], [-pillarRadius, -pillarRadius], yB, yT)
    );
    // Right side (East)
    towerFrameGroup.add(
      createXTrussTier([pillarRadius, -pillarRadius], [pillarRadius, pillarRadius], yB, yT)
    );
    // Back side (North)
    towerFrameGroup.add(
      createXTrussTier([-pillarRadius, -pillarRadius], [pillarRadius, -pillarRadius], yB, yT)
    );
  });

  root.add(towerFrameGroup);

  // --- 4. TWIN CURVED LUMINOUS ENERGY CONDUITS ---
  const conduitsGroup = new THREE.Group();
  conduitsGroup.name = 'EnergyConduits';
  conduitsGroup.position.set(0, 0.41, 0);

  // Curve 1: Neon Cyan Conduit Tube
  // Routes from base pedestal socket at (0.38, 0.24, 0.48), bending gracefully,
  // running up rear-right corner, looping over top crown
  const cyanCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.38, 0.24, 0.48),
    new THREE.Vector3(0.55, 0.32, 0.65),
    new THREE.Vector3(0.72, 0.55, 0.76),
    new THREE.Vector3(0.78, 1.35, 0.78),
    new THREE.Vector3(0.78, 2.65, 0.78),
    new THREE.Vector3(0.78, 3.65, 0.78),
    new THREE.Vector3(0.65, 3.98, 0.68),
    new THREE.Vector3(0.48, 4.02, 0.58),
  ]);

  const cyanTubeGeo = trackGeometry(new THREE.TubeGeometry(cyanCurve, 64, 0.022, 8, false));
  const cyanTubeMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: '#00ffff',
      emissive: COLORS.neonCyan,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.1,
    })
  );
  const cyanConduitMesh = new THREE.Mesh(cyanTubeGeo, cyanTubeMat);
  cyanConduitMesh.name = 'CyanConduit';
  conduitsGroup.add(cyanConduitMesh);

  // Curve 2: Neon Gold Conduit Tube (Parallel offset)
  const goldCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.48, 0.24, 0.38),
    new THREE.Vector3(0.65, 0.32, 0.55),
    new THREE.Vector3(0.76, 0.55, 0.72),
    new THREE.Vector3(0.82, 1.35, 0.72),
    new THREE.Vector3(0.82, 2.65, 0.72),
    new THREE.Vector3(0.82, 3.65, 0.72),
    new THREE.Vector3(0.72, 3.98, 0.62),
    new THREE.Vector3(0.56, 4.02, 0.52),
  ]);

  const goldTubeGeo = trackGeometry(new THREE.TubeGeometry(goldCurve, 64, 0.022, 8, false));
  const goldTubeMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: '#ffbf00',
      emissive: COLORS.neonGold,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.1,
    })
  );
  const goldConduitMesh = new THREE.Mesh(goldTubeGeo, goldTubeMat);
  goldConduitMesh.name = 'GoldConduit';
  conduitsGroup.add(goldConduitMesh);

  root.add(conduitsGroup);

  // --- 5. UPWARD RETURN LIGHT BEAM ---
  // Luminous vertical cylinder that triggers on base case reaching and return unwinding
  const beamGeo = trackGeometry(new THREE.CylinderGeometry(0.38, 0.48, 3.6, 24, 1, true));
  const beamMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: COLORS.neonCyan,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const returnBeam = new THREE.Mesh(beamGeo, beamMat);
  returnBeam.name = 'ReturnLightBeam';
  returnBeam.position.set(0, 2.2, 0);
  root.add(returnBeam);

  // Inner beam core
  const beamCoreGeo = trackGeometry(new THREE.CylinderGeometry(0.16, 0.22, 3.6, 16, 1, true));
  const beamCoreMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const returnBeamCore = new THREE.Mesh(beamCoreGeo, beamCoreMat);
  returnBeamCore.name = 'ReturnLightBeamCore';
  returnBeamCore.position.set(0, 2.2, 0);
  root.add(returnBeamCore);

  // --- 6. STACK OVERFLOW EMERGENCY BEACON & BANNER ---
  const overflowBeacon = new THREE.Group();
  overflowBeacon.name = 'StackOverflowBeacon';
  overflowBeacon.position.set(0, 4.45, 0);

  // Warning beacon housing
  const beaconBaseGeo = trackGeometry(new THREE.CylinderGeometry(0.18, 0.24, 0.15, 16));
  const beaconBaseMat = trackMaterial(
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.85 })
  );
  const beaconBase = new THREE.Mesh(beaconBaseGeo, beaconBaseMat);
  beaconBase.position.y = 0.08;
  overflowBeacon.add(beaconBase);

  // Red strobe dome
  const domeGeo = trackGeometry(new THREE.SphereGeometry(0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.7));
  const domeMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.dangerRed,
      emissive: COLORS.dangerRed,
      emissiveIntensity: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    })
  );
  const beaconDome = new THREE.Mesh(domeGeo, domeMat);
  beaconDome.name = 'BeaconDome';
  beaconDome.position.y = 0.15;
  overflowBeacon.add(beaconDome);

  // Beacon point light
  const beaconLight = new THREE.PointLight(COLORS.dangerRed, 0, 4.5);
  beaconLight.name = 'BeaconLight';
  beaconLight.position.y = 0.25;
  overflowBeacon.add(beaconLight);

  // Holographic Warning Decal (Hidden until overflow)
  const warningCanvas = document.createElement('canvas');
  warningCanvas.width = 512;
  warningCanvas.height = 256;
  const wCtx = warningCanvas.getContext('2d');
  if (wCtx) {
    wCtx.fillStyle = '#450a0a';
    wCtx.fillRect(0, 0, 512, 256);
    wCtx.strokeStyle = '#ef4444';
    wCtx.lineWidth = 12;
    wCtx.strokeRect(8, 8, 496, 240);

    wCtx.fillStyle = '#ef4444';
    wCtx.font = '900 42px monospace';
    wCtx.textAlign = 'center';
    wCtx.textBaseline = 'middle';
    wCtx.fillText('⚠️ STACK OVERFLOW ⚠️', 256, 75);

    wCtx.font = '700 28px monospace';
    wCtx.fillStyle = '#fca5a5';
    wCtx.fillText('CALL DEPTH EXCEEDED', 256, 135);
    wCtx.fillText('MEMORY LIMIT REACHED', 256, 185);
  }
  const warningTex = trackTexture(new THREE.CanvasTexture(warningCanvas));
  const warningPlateGeo = trackGeometry(new THREE.PlaneGeometry(1.8, 0.9));
  const warningPlateMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: warningTex,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    })
  );
  const warningPlate = new THREE.Mesh(warningPlateGeo, warningPlateMat);
  warningPlate.name = 'WarningHUDPlate';
  warningPlate.position.set(0, 0.9, 0.4);
  overflowBeacon.add(warningPlate);

  root.add(overflowBeacon);

  // --- 7. CALL-FRAME PLATFORMS ---
  const framesGroup = new THREE.Group();
  framesGroup.name = 'CallFramePlatforms';
  root.add(framesGroup);

  // Compute standard resting Y slot height based on index from bottom
  // Slot 0 (f(1), just above base case at y=0.41 + 0.3): y = 1.35
  // Slot 1 (f(2)): y = 2.15
  // Slot 2 (f(3)): y = 2.95
  // Slot 3 (f(4)): y = 3.65
  // Slot 4 (f(5)): y = 4.25
  function getSlotY(slotIndex: number): number {
    return 1.35 + slotIndex * 0.82;
  }

  const activePlatforms: ActivePlatformState[] = [];

  function drawPlatformCanvas(
    canvas: HTMLCanvasElement,
    n: number,
    callLabel: string,
    returnValue: number | null,
    status: 'active' | 'base_case' | 'resolved'
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 512, 512);

    // Warm ivory / frosted acrylic slab background
    ctx.fillStyle = '#fcf8ee';
    ctx.fillRect(0, 0, 512, 512);

    // Rounded frame border
    const isResolved = status === 'resolved' || returnValue !== null;
    const isBase = status === 'base_case' || n === 1;

    ctx.strokeStyle = isResolved ? '#10b981' : isBase ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 20;
    ctx.strokeRect(14, 14, 484, 484);

    ctx.strokeStyle = isResolved ? '#059669' : isBase ? '#b45309' : '#0284c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, 448, 448);

    // Big central function call label: e.g. "f(3)", "f(2)", "f(1)"
    ctx.fillStyle = '#1e1b18';
    ctx.font = '900 88px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(callLabel || `f(${n})`, 256, 185);

    // Call data subtext: e.g. "call data: n=3"
    ctx.font = '700 40px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`call data: n=${n}`, 256, 280);

    // Return value plate / badge
    if (returnValue !== null) {
      ctx.fillStyle = '#064e3b';
      ctx.font = '900 48px monospace';
      ctx.fillText(`✓ return ${returnValue}`, 256, 375);
    } else {
      ctx.fillStyle = isBase ? '#d97706' : '#94a3b8';
      ctx.font = '700 36px monospace';
      ctx.fillText(isBase ? '⚡ base case' : '⋯ pending return', 256, 375);
    }
  }

  function instantiatePlatformMesh(
    frame: RecursionFrameData,
    slotIndex: number,
    spawnFromSky: boolean = false
  ): ActivePlatformState {
    const pGroup = new THREE.Group();
    pGroup.name = `CallFrame_${frame.id}`;

    // Target Y in elevator shaft
    const targetY = getSlotY(slotIndex);
    const initialY = spawnFromSky ? 5.2 : targetY;
    pGroup.position.set(0, initialY, 0);

    const dispos: {
      geometries: THREE.BufferGeometry[];
      materials: THREE.Material[];
      textures: THREE.Texture[];
    } = {
      geometries: [],
      materials: [],
      textures: [],
    };

    // Golden undercarriage tray
    const trayGeo = new THREE.BoxGeometry(1.18, 0.06, 1.18);
    dispos.geometries.push(trayGeo);
    const trayMat = new THREE.MeshStandardMaterial({
      color: COLORS.brassGold,
      roughness: 0.3,
      metalness: 0.85,
    });
    dispos.materials.push(trayMat);
    const trayMesh = new THREE.Mesh(trayGeo, trayMat);
    trayMesh.position.y = -0.03;
    trayMesh.castShadow = true;
    pGroup.add(trayMesh);

    // Acrylic translucent frosted pad
    const padGeo = new THREE.BoxGeometry(1.08, 0.05, 1.08);
    dispos.geometries.push(padGeo);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    drawPlatformCanvas(canvas, frame.n, frame.callLabel, frame.returnValue, frame.status);

    const texture = new THREE.CanvasTexture(canvas);
    dispos.textures.push(texture);

    const meshMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: texture,
      roughness: 0.25,
      metalness: 0.1,
      emissive: frame.status === 'resolved' ? '#10b981' : COLORS.neonGold,
      emissiveIntensity: frame.status === 'resolved' ? 0.35 : 0.15,
    });
    dispos.materials.push(meshMat);

    const padMesh = new THREE.Mesh(padGeo, meshMat);
    padMesh.position.y = 0.025;
    padMesh.castShadow = true;
    pGroup.add(padMesh);

    // Glowing Neon Perimeter Edge Rim
    const glowRimGeo = new THREE.BoxGeometry(1.12, 0.015, 1.12);
    dispos.geometries.push(glowRimGeo);
    const glowRimMat = new THREE.MeshBasicMaterial({
      color: frame.status === 'resolved' ? COLORS.neonGreen : COLORS.neonAmberGlow,
    });
    dispos.materials.push(glowRimMat);
    const glowRim = new THREE.Mesh(glowRimGeo, glowRimMat);
    glowRim.position.y = 0.045;
    pGroup.add(glowRim);

    framesGroup.add(pGroup);

    return {
      id: frame.id,
      n: frame.n,
      callLabel: frame.callLabel,
      argValue: frame.argValue,
      returnValue: frame.returnValue,
      status: frame.status,
      group: pGroup,
      currentY: initialY,
      targetY,
      velocity: 0,
      canvas,
      texture,
      meshMat,
      glowRimMat,
      disposables: dispos,
    };
  }

  // Populate initial call platforms
  // In the blueprint `recursion_chamber.png`:
  // Lowest tier is f(1) (slot 0), mid is f(2) (slot 1), top is f(3) (slot 2)
  // Reversing so initialFrames[0] (f(3)) sits at top slot, initialFrames[2] (f(1)) sits at slot 0
  initialFrames.forEach((frame, idx) => {
    const slotIndex = initialFrames.length - 1 - idx;
    const platform = instantiatePlatformMesh(frame, slotIndex, false);
    activePlatforms.push(platform);
  });

  // Kinetic state
  let elapsedTime = 0;
  let isUnwindingActive = false;
  let stackOverflowActive = false;

  // --- MODEL RIG CONTROLLER ---
  const rig: RecursionChamberModelRig = {
    group: root,
    framesGroup,
    basePlinthGroup,
    basePedestalGroup,
    towerFrameGroup,
    conduitsGroup,
    returnBeam,
    overflowBeacon,

    update: (delta: number, state?: Partial<RecursionChamberModelState>) => {
      elapsedTime += delta;

      if (state) {
        if (state.stackOverflow !== undefined) {
          stackOverflowActive = state.stackOverflow;
        }
        if (state.isUnwinding !== undefined) {
          isUnwindingActive = state.isUnwinding;
        }

        // Sync platforms with updated frame data
        if (state.frames) {
          const newFrames = state.frames;
          const currentCount = activePlatforms.length;
          const targetCount = newFrames.length;

          // If frames were pushed
          if (targetCount > currentCount) {
            // Find which frames are new
            for (let i = 0; i < targetCount; i++) {
              const nf = newFrames[i];
              if (!activePlatforms.some((p) => p.id === nf.id)) {
                // New platform spawns from sky and drops into its slot
                const slotIndex = targetCount - 1 - i;
                const newP = instantiatePlatformMesh(nf, slotIndex, true);
                activePlatforms.unshift(newP);
              }
            }
          } else if (targetCount < currentCount) {
            // Frames removed (popped)
            const remainingIds = new Set(newFrames.map((f) => f.id));
            for (let i = activePlatforms.length - 1; i >= 0; i--) {
              const p = activePlatforms[i];
              if (!remainingIds.has(p.id)) {
                // Dispose platform meshes
                framesGroup.remove(p.group);
                p.disposables.geometries.forEach((g) => g.dispose());
                p.disposables.materials.forEach((m) => m.dispose());
                p.disposables.textures.forEach((t) => t.dispose());
                activePlatforms.splice(i, 1);
              }
            }
          }

          // Update slot targets and canvas labels for existing platforms
          newFrames.forEach((nf, idx) => {
            const slotIndex = newFrames.length - 1 - idx;
            const p = activePlatforms.find((plat) => plat.id === nf.id);
            if (p) {
              p.targetY = getSlotY(slotIndex);
              if (p.returnValue !== nf.returnValue || p.status !== nf.status) {
                p.returnValue = nf.returnValue;
                p.status = nf.status;
                drawPlatformCanvas(p.canvas, p.n, p.callLabel, p.returnValue, p.status);
                p.texture.needsUpdate = true;

                if (p.status === 'resolved') {
                  p.meshMat.emissive.set(COLORS.neonGreen);
                  p.meshMat.emissiveIntensity = 0.45;
                  p.glowRimMat.color.set(COLORS.neonGreen);
                }
              }
            }
          });
        }
      }

      // --- Damped Spring Physics for Call-Frame Vertical Telescoping ---
      const springK = 18.0;
      const dampingB = 5.2;

      activePlatforms.forEach((p) => {
        const displacement = p.targetY - p.currentY;
        const springForce = displacement * springK;
        const dampingForce = -p.velocity * dampingB;
        const acceleration = springForce + dampingForce;

        p.velocity += acceleration * delta;
        p.currentY += p.velocity * delta;
        p.group.position.y = p.currentY;

        // Subtle gentle floating breathing motion
        const floatOffset = Math.sin(elapsedTime * 2.5 + p.n * 0.8) * 0.012;
        p.group.position.y += floatOffset;
      });

      // --- Energy Conduits Pulse Waves ---
      const pulseSpeed = isUnwindingActive ? 12.0 : 4.0;
      const wave = (Math.sin(elapsedTime * pulseSpeed) + 1) * 0.5;
      cyanTubeMat.emissiveIntensity = 0.5 + wave * 0.65;
      goldTubeMat.emissiveIntensity = 0.5 + (1.0 - wave) * 0.65;

      // Base Case Pad Glow
      basePadMat.emissiveIntensity = isUnwindingActive
        ? 0.75 + Math.sin(elapsedTime * 8) * 0.25
        : 0.35 + Math.sin(elapsedTime * 2) * 0.1;

      // --- Upward Return Light Beam Animation ---
      if (isUnwindingActive) {
        beamMat.opacity = THREE.MathUtils.lerp(beamMat.opacity, 0.65, delta * 5.0);
        beamCoreMat.opacity = THREE.MathUtils.lerp(beamCoreMat.opacity, 0.45, delta * 5.0);
        returnBeam.rotation.y += delta * 1.5;
        returnBeamCore.rotation.y -= delta * 2.0;

        const pulseScale = 1.0 + Math.sin(elapsedTime * 10) * 0.08;
        returnBeam.scale.set(pulseScale, 1.0, pulseScale);
      } else {
        beamMat.opacity = THREE.MathUtils.lerp(beamMat.opacity, 0.0, delta * 4.0);
        beamCoreMat.opacity = THREE.MathUtils.lerp(beamCoreMat.opacity, 0.0, delta * 4.0);
      }

      // --- Stack Overflow Emergency Strobe & Violent Tremor ---
      if (stackOverflowActive) {
        // High frequency tremor vibration on tower frame
        const shakeAmp = 0.035;
        towerFrameGroup.position.x = Math.sin(elapsedTime * 52) * shakeAmp;
        towerFrameGroup.position.z = Math.cos(elapsedTime * 48) * shakeAmp;
        framesGroup.position.x = Math.sin(elapsedTime * 52) * shakeAmp;
        framesGroup.position.z = Math.cos(elapsedTime * 48) * shakeAmp;

        // Flashing beacon strobe
        const flash = Math.sin(elapsedTime * 18) > 0 ? 1.0 : 0.0;
        beaconDome.rotation.y += delta * 10;
        domeMat.emissiveIntensity = 0.3 + flash * 1.2;
        beaconLight.intensity = flash * 3.5;
        warningPlateMat.opacity = THREE.MathUtils.lerp(warningPlateMat.opacity, 0.95, delta * 6);
        warningPlate.rotation.y = Math.sin(elapsedTime * 2) * 0.15;
      } else {
        // Settle back to neutral
        towerFrameGroup.position.x = THREE.MathUtils.lerp(towerFrameGroup.position.x, 0, delta * 8);
        towerFrameGroup.position.z = THREE.MathUtils.lerp(towerFrameGroup.position.z, 0, delta * 8);
        framesGroup.position.x = THREE.MathUtils.lerp(framesGroup.position.x, 0, delta * 8);
        framesGroup.position.z = THREE.MathUtils.lerp(framesGroup.position.z, 0, delta * 8);

        domeMat.emissiveIntensity = 0.2;
        beaconLight.intensity = 0;
        warningPlateMat.opacity = THREE.MathUtils.lerp(warningPlateMat.opacity, 0, delta * 6);
      }
    },

    pushCallFrame: (n: number, callLabel?: string) => {
      if (activePlatforms.length >= maxDepth) {
        rig.triggerStackOverflow();
        return;
      }

      const id = `frame-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const label = callLabel || `f(${n})`;
      const newFrame: RecursionFrameData = {
        id,
        n,
        callLabel: label,
        argValue: n,
        returnValue: null,
        status: n === 1 ? 'base_case' : 'active',
      };

      const newP = instantiatePlatformMesh(newFrame, activePlatforms.length, true);
      activePlatforms.unshift(newP);

      // Re-index slots
      activePlatforms.forEach((p, idx) => {
        p.targetY = getSlotY(activePlatforms.length - 1 - idx);
      });
    },

    popCallFrame: () => {
      if (activePlatforms.length === 0) return;
      const popped = activePlatforms.shift();
      if (popped) {
        framesGroup.remove(popped.group);
        popped.disposables.geometries.forEach((g) => g.dispose());
        popped.disposables.materials.forEach((m) => m.dispose());
        popped.disposables.textures.forEach((t) => t.dispose());
      }
      // Re-index slots
      activePlatforms.forEach((p, idx) => {
        p.targetY = getSlotY(activePlatforms.length - 1 - idx);
      });
    },

    triggerReturnCascade: () => {
      isUnwindingActive = true;
      stackOverflowActive = false;
    },

    triggerStackOverflow: () => {
      stackOverflowActive = true;
    },

    clearStackOverflow: () => {
      stackOverflowActive = false;
    },

    reset: () => {
      isUnwindingActive = false;
      stackOverflowActive = false;

      // Clear all platforms
      while (activePlatforms.length > 0) {
        const p = activePlatforms.pop();
        if (p) {
          framesGroup.remove(p.group);
          p.disposables.geometries.forEach((g) => g.dispose());
          p.disposables.materials.forEach((m) => m.dispose());
          p.disposables.textures.forEach((t) => t.dispose());
        }
      }

      // Recreate initial frames
      initialFrames.forEach((frame, idx) => {
        const slotIndex = initialFrames.length - 1 - idx;
        const platform = instantiatePlatformMesh(frame, slotIndex, false);
        activePlatforms.push(platform);
      });
    },

    dispose: () => {
      // Dispose all platforms
      activePlatforms.forEach((p) => {
        framesGroup.remove(p.group);
        p.disposables.geometries.forEach((g) => g.dispose());
        p.disposables.materials.forEach((m) => m.dispose());
        p.disposables.textures.forEach((t) => t.dispose());
      });
      activePlatforms.length = 0;

      // Dispose all tracked static assets
      disposables.geometries.forEach((g) => g.dispose());
      disposables.materials.forEach((m) => m.dispose());
      disposables.textures.forEach((t) => t.dispose());

      while (root.children.length > 0) {
        root.remove(root.children[0]);
      }
    },
  };

  return rig;
}
