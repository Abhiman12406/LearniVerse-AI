import * as THREE from 'three';

export interface ArrayBayData {
  index: number;
  value: number;
  label?: string;
  color?: string;
}

export interface ArrayStationModelOptions {
  capacity?: number; // default 5
  initialBays?: ArrayBayData[];
  baseAddress?: number; // default 0x2000
}

export type ProbeMode = 'random' | 'linear' | 'error' | 'idle';

export interface ArrayStationModelState {
  targetIndex: number;
  probeMode: ProbeMode;
  isScanning: boolean;
  scanStep: number | null;
  isOutOfBounds: boolean;
  bays: ArrayBayData[];
}

export interface ArrayStationModelRig {
  group: THREE.Group;
  probeGroup: THREE.Group;
  baysGroup: THREE.Group;
  update: (delta: number, state?: Partial<ArrayStationModelState>) => void;
  setTargetIndex: (index: number, mode?: ProbeMode) => void;
  triggerScanStep: (stepIndex: number) => void;
  triggerError: (message?: string) => void;
  clearError: () => void;
  dispose: () => void;
}

/**
 * Procedural 3D Array Station Indexing Apparatus Factory
 * Faithful high-fidelity reconstruction from `asstesimages/array_station.png`:
 * - Warm rich oak wood casing with angled side wings and backboard with oak grain
 * - Dual polished brass guide rails across the top with left bracket and right stepper motor mount
 * - Sliding probe carriage with top stepper motor, front spur gears, and glowing square LED indicator
 * - Downward probe needle emitting an illuminated vertical beam with bay floor contact splash
 * - 5 contiguous numbered storage bays `[0..4]` with front brass plaque brackets & vertical pastel data slabs
 * - 5 physical index number plaques `[0]`, `[1]`, `[2]`, `[3]`, `[4]` with LED alignment dots
 * - Kinetic animation rig contrasting O(1) direct random access against O(n) linear sequential scans
 * - Out-of-bounds mechanical limit warning with flashing crimson alarm LED
 */
export function createArrayStationModel(options: ArrayStationModelOptions = {}): ArrayStationModelRig {
  const { capacity = 5, initialBays: _initialBays, baseAddress: _baseAddress = 0x2000 } = options;

  const root = new THREE.Group();
  root.name = 'ArrayStationApparatus';

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

  // --- AUTHENTIC COLOR PALETTE (From array_station.png) ---
  const COLORS = {
    woodOak: '#b8824f',
    woodOakDark: '#784c24',
    woodOakDeep: '#502e12',
    creamBin: '#f5f0e4',
    creamBevel: '#e8ded0',
    creamPlaque: '#faf7ee',
    brassGold: '#d8aa46',
    brassDark: '#997322',
    brassPolish: '#f7d67b',
    stepperBlack: '#232528',
    stepperSilver: '#a8b0b8',
    ledAmber: '#ffb700',
    ledAmberCore: '#fff7ed',
    ledScanCyan: '#00f0ff',
    ledErrorRed: '#ef4444',
    gearBronze: '#b88a3b',
    railBrass: '#e5b955',
    // Pastel card colors inside bays matching blueprint
    bayCardColors: [
      ['#6ee7b7', '#f43f5e', '#facc15'], // Bay 0: Mint, Rose, Gold
      ['#fb7185', '#38bdf8', '#eab308'], // Bay 1: Coral, Sky Blue, Mustard
      ['#c084fc', '#34d399', '#fde047'], // Bay 2 (Target in image): Lavender, Emerald, Yellow
      ['#10b981', '#a855f7', '#f43f5e'], // Bay 3: Emerald, Purple, Coral
      ['#8b5cf6', '#0ea5e9', '#f59e0b'], // Bay 4: Violet, Cyan, Amber
    ],
  };

  // --- PROCEDURAL TEXTURES ---
  function createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = COLORS.woodOak;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fine oak wood grain streaks
      ctx.fillStyle = 'rgba(120, 76, 36, 0.26)';
      for (let i = 0; i < 64; i++) {
        const x = Math.random() * canvas.width;
        const w = 2 + Math.random() * 6;
        ctx.fillRect(x, 0, w, canvas.height);
      }

      // Horizontal subtle grain waves
      ctx.strokeStyle = 'rgba(80, 48, 20, 0.18)';
      ctx.lineWidth = 1.5;
      for (let y = 15; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.lineTo(x, y + (Math.sin(x * 0.05) * 4));
        }
        ctx.stroke();
      }
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createIndexPlaqueTexture(indexNumber: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background ivory plate
      ctx.fillStyle = COLORS.creamPlaque;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border rim
      ctx.strokeStyle = '#c4b59d';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      // Inner thin frame
      ctx.strokeStyle = '#8c7759';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // High-contrast numeral
      ctx.fillStyle = '#1e1b18';
      ctx.font = 'bold 74px "SF Pro Display", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(indexNumber), canvas.width / 2, canvas.height / 2 + 2);
    }
    return trackTexture(new THREE.CanvasTexture(canvas));
  }

  const woodTex = createWoodTexture();

  // Shared Materials
  const woodMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      map: woodTex,
      color: COLORS.woodOak,
      roughness: 0.65,
      metalness: 0.12,
    })
  );

  const woodDarkMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      map: woodTex,
      color: COLORS.woodOakDark,
      roughness: 0.75,
      metalness: 0.08,
    })
  );

  const brassMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.brassGold,
      metalness: 0.88,
      roughness: 0.28,
    })
  );

  const polishedBrassMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.brassPolish,
      metalness: 0.94,
      roughness: 0.18,
    })
  );

  const creamBinMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.creamBin,
      roughness: 0.45,
      metalness: 0.08,
    })
  );

  const creamCarriageMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.creamBin,
      roughness: 0.4,
      metalness: 0.12,
    })
  );

  const stepperDarkMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.stepperBlack,
      roughness: 0.55,
      metalness: 0.65,
    })
  );

  const stepperSilverMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.stepperSilver,
      metalness: 0.85,
      roughness: 0.3,
    })
  );

  // Geometric Layout Measurements (matching array_station.png)
  const TOTAL_WIDTH = 3.6;
  const CHASSIS_DEPTH = 1.35;
  const BACKBOARD_HEIGHT = 1.65;
  const BAY_SPACING = 0.62;
  const BAY_WIDTH = 0.54;
  const BAY_HEIGHT = 0.68;
  const BAY_DEPTH = 0.78;
  const RAIL_Y = 1.55;
  const RAIL_Z = 0.28;
  const RAIL_LENGTH = 3.25;

  // 1. BASE PLINTH & OAK CHASSIS
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'OakChassis';
  root.add(chassisGroup);

  // Main floor board
  const baseFloorGeo = trackGeometry(new THREE.BoxGeometry(TOTAL_WIDTH, 0.14, CHASSIS_DEPTH));
  const baseFloorMesh = new THREE.Mesh(baseFloorGeo, woodMaterial);
  baseFloorMesh.position.set(0, 0.07, 0.1);
  baseFloorMesh.castShadow = true;
  baseFloorMesh.receiveShadow = true;
  chassisGroup.add(baseFloorMesh);

  // Front bottom lip molding
  const frontLipGeo = trackGeometry(new THREE.BoxGeometry(TOTAL_WIDTH + 0.04, 0.08, 0.08));
  const frontLipMesh = new THREE.Mesh(frontLipGeo, woodDarkMaterial);
  frontLipMesh.position.set(0, 0.04, 0.1 + CHASSIS_DEPTH / 2 + 0.04);
  chassisGroup.add(frontLipMesh);

  // Upright backboard panel
  const backboardGeo = trackGeometry(new THREE.BoxGeometry(TOTAL_WIDTH - 0.12, BACKBOARD_HEIGHT, 0.12));
  const backboardMesh = new THREE.Mesh(backboardGeo, woodMaterial);
  backboardMesh.position.set(0, BACKBOARD_HEIGHT / 2 + 0.14, -0.42);
  backboardMesh.castShadow = true;
  backboardMesh.receiveShadow = true;
  chassisGroup.add(backboardMesh);

  // Horizontal top beam header
  const topBeamGeo = trackGeometry(new THREE.BoxGeometry(TOTAL_WIDTH, 0.16, 0.44));
  const topBeamMesh = new THREE.Mesh(topBeamGeo, woodMaterial);
  topBeamMesh.position.set(0, BACKBOARD_HEIGHT + 0.18, -0.26);
  topBeamMesh.castShadow = true;
  chassisGroup.add(topBeamMesh);

  // Left & Right Angled Side Support Wings
  [-1, 1].forEach((side) => {
    const sideX = (TOTAL_WIDTH / 2) * side;

    // Custom trapezoidal prism for angled cheek
    const sideShape = new THREE.Shape();
    sideShape.moveTo(0, 0);
    sideShape.lineTo(CHASSIS_DEPTH, 0);
    sideShape.lineTo(0.52, BACKBOARD_HEIGHT + 0.1);
    sideShape.lineTo(0, BACKBOARD_HEIGHT + 0.1);
    sideShape.closePath();

    const extrudeSettings = {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    };
    const sideGeo = trackGeometry(new THREE.ExtrudeGeometry(sideShape, extrudeSettings));
    const sideMesh = new THREE.Mesh(sideGeo, woodMaterial);
    sideMesh.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
    sideMesh.position.set(sideX, 0.14, side === 1 ? -0.48 : 0.82);
    sideMesh.castShadow = true;
    chassisGroup.add(sideMesh);

    // Brass corner reinforcement brackets on lower front and top
    const bracketGeo = trackGeometry(new THREE.BoxGeometry(0.14, 0.16, 0.16));
    const bracketMesh = new THREE.Mesh(bracketGeo, brassMaterial);
    bracketMesh.position.set(sideX, 0.22, 0.68);
    chassisGroup.add(bracketMesh);

    const topBracketGeo = trackGeometry(new THREE.BoxGeometry(0.14, 0.18, 0.14));
    const topBracketMesh = new THREE.Mesh(topBracketGeo, brassMaterial);
    topBracketMesh.position.set(sideX, BACKBOARD_HEIGHT + 0.12, -0.26);
    chassisGroup.add(topBracketMesh);
  });

  // 2. DUAL BRASS GUIDE RAILS & DRIVE MECHANISM
  const railGroup = new THREE.Group();
  railGroup.name = 'DualBrassRails';
  root.add(railGroup);

  // Twin horizontal cylindrical brass rods (upper and lower)
  const railRadius = 0.024;
  const railGeo = trackGeometry(new THREE.CylinderGeometry(railRadius, railRadius, RAIL_LENGTH, 16));
  railGeo.rotateZ(Math.PI / 2);

  const upperRail = new THREE.Mesh(railGeo, polishedBrassMaterial);
  upperRail.position.set(0, RAIL_Y + 0.06, RAIL_Z);
  upperRail.castShadow = true;
  railGroup.add(upperRail);

  const lowerRail = new THREE.Mesh(railGeo, polishedBrassMaterial);
  lowerRail.position.set(0, RAIL_Y - 0.06, RAIL_Z);
  lowerRail.castShadow = true;
  railGroup.add(lowerRail);

  // Left machined brass mounting bracket
  const leftMountGroup = new THREE.Group();
  leftMountGroup.name = 'LeftMountBracket';
  leftMountGroup.position.set(-RAIL_LENGTH / 2 - 0.08, RAIL_Y, RAIL_Z);

  const leftBracketGeo = trackGeometry(new THREE.BoxGeometry(0.16, 0.32, 0.18));
  const leftBracketMesh = new THREE.Mesh(leftBracketGeo, brassMaterial);
  leftBracketMesh.castShadow = true;
  leftMountGroup.add(leftBracketMesh);

  // Screws on bracket
  [-0.08, 0.08].forEach((sy) => {
    const screwGeo = trackGeometry(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8));
    screwGeo.rotateX(Math.PI / 2);
    const screwMesh = new THREE.Mesh(screwGeo, polishedBrassMaterial);
    screwMesh.position.set(0, sy, 0.09);
    leftMountGroup.add(screwMesh);
  });
  railGroup.add(leftMountGroup);

  // Right machined brass mounting bracket + NEMA Stepper Motor
  const rightMountGroup = new THREE.Group();
  rightMountGroup.name = 'RightStepperBracket';
  rightMountGroup.position.set(RAIL_LENGTH / 2 + 0.08, RAIL_Y, RAIL_Z);

  const rightBracketGeo = trackGeometry(new THREE.BoxGeometry(0.16, 0.32, 0.18));
  const rightBracketMesh = new THREE.Mesh(rightBracketGeo, brassMaterial);
  rightBracketMesh.castShadow = true;
  rightMountGroup.add(rightBracketMesh);

  // Stepper Motor body attached to right bracket
  const stepperBodyGeo = trackGeometry(new THREE.BoxGeometry(0.24, 0.24, 0.26));
  const stepperBodyMesh = new THREE.Mesh(stepperBodyGeo, stepperDarkMaterial);
  stepperBodyMesh.position.set(0.16, 0.02, 0);
  rightMountGroup.add(stepperBodyMesh);

  // Stepper front/back metallic caps
  const stepperCapGeo = trackGeometry(new THREE.BoxGeometry(0.245, 0.04, 0.265));
  const stepperCapMesh = new THREE.Mesh(stepperCapGeo, stepperSilverMaterial);
  stepperCapMesh.position.set(0.16, 0.14, 0);
  rightMountGroup.add(stepperCapMesh);

  // Brass timing pulley
  const pulleyGeo = trackGeometry(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 16));
  pulleyGeo.rotateZ(Math.PI / 2);
  const pulleyMesh = new THREE.Mesh(pulleyGeo, brassMaterial);
  pulleyMesh.position.set(-0.02, 0, 0);
  rightMountGroup.add(pulleyMesh);

  railGroup.add(rightMountGroup);

  // 3. STORAGE BAYS & DATA CARDS [0..4]
  const baysGroup = new THREE.Group();
  baysGroup.name = 'StorageBays';
  root.add(baysGroup);

  const bayMeshes: THREE.Group[] = [];
  const indexPlaqueMeshes: THREE.Group[] = [];
  const indexLeds: THREE.Mesh[] = [];

  for (let i = 0; i < capacity; i++) {
    const bayX = (i - (capacity - 1) / 2) * BAY_SPACING;
    const bayGroup = new THREE.Group();
    bayGroup.name = `StorageBay_${i}`;
    bayGroup.position.set(bayX, 0.14 + BAY_HEIGHT / 2, 0.35);

    // Cream Bin Body (Hollow / Open-top effect via composite boxes)
    // Main base and back of bin
    const binBackGeo = trackGeometry(new THREE.BoxGeometry(BAY_WIDTH, BAY_HEIGHT, 0.06));
    const binBackMesh = new THREE.Mesh(binBackGeo, creamBinMaterial);
    binBackMesh.position.set(0, 0, -BAY_DEPTH / 2 + 0.03);
    binBackMesh.castShadow = true;
    bayGroup.add(binBackMesh);

    // Bin bottom floor
    const binFloorGeo = trackGeometry(new THREE.BoxGeometry(BAY_WIDTH, 0.06, BAY_DEPTH));
    const binFloorMesh = new THREE.Mesh(binFloorGeo, creamBinMaterial);
    binFloorMesh.position.set(0, -BAY_HEIGHT / 2 + 0.03, 0);
    binFloorMesh.receiveShadow = true;
    bayGroup.add(binFloorMesh);

    // Left and right bin walls with beveled front chamfer
    [-1, 1].forEach((wallSide) => {
      const wallGeo = trackGeometry(new THREE.BoxGeometry(0.04, BAY_HEIGHT, BAY_DEPTH));
      const wallMesh = new THREE.Mesh(wallGeo, creamBinMaterial);
      wallMesh.position.set(wallSide * (BAY_WIDTH / 2 - 0.02), 0, 0);
      wallMesh.castShadow = true;
      bayGroup.add(wallMesh);
    });

    // Lower front face of the bin
    const frontFaceGeo = trackGeometry(new THREE.BoxGeometry(BAY_WIDTH, BAY_HEIGHT * 0.44, 0.04));
    const frontFaceMesh = new THREE.Mesh(frontFaceGeo, creamBinMaterial);
    frontFaceMesh.position.set(0, -BAY_HEIGHT * 0.28, BAY_DEPTH / 2 - 0.02);
    frontFaceMesh.castShadow = true;
    bayGroup.add(frontFaceMesh);

    // Brushed brass label holder frame on the lower front face
    const frameWidth = 0.28;
    const frameHeight = 0.16;
    const labelFrameGeo = trackGeometry(new THREE.BoxGeometry(frameWidth, frameHeight, 0.02));
    const labelFrameMesh = new THREE.Mesh(labelFrameGeo, brassMaterial);
    labelFrameMesh.position.set(0, -BAY_HEIGHT * 0.28, BAY_DEPTH / 2 + 0.01);
    bayGroup.add(labelFrameMesh);

    // Inner cutout plaque on brass frame
    const innerPlaqueGeo = trackGeometry(new THREE.BoxGeometry(frameWidth - 0.06, frameHeight - 0.06, 0.022));
    const innerPlaqueMat = trackMaterial(new THREE.MeshBasicMaterial({ color: '#2a241e' }));
    const innerPlaqueMesh = new THREE.Mesh(innerPlaqueGeo, innerPlaqueMat);
    innerPlaqueMesh.position.set(0, -BAY_HEIGHT * 0.28, BAY_DEPTH / 2 + 0.012);
    bayGroup.add(innerPlaqueMesh);

    // Vertical pastel data cards / slabs stacked inside the bay
    const cardColors = COLORS.bayCardColors[i % COLORS.bayCardColors.length];
    const cardsGroup = new THREE.Group();
    cardsGroup.name = `DataCards_${i}`;

    cardColors.forEach((colorHex, cardIdx) => {
      const cardGeo = trackGeometry(new THREE.BoxGeometry(BAY_WIDTH - 0.12, BAY_HEIGHT * 0.65, 0.04));
      const cardMat = trackMaterial(
        new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.35,
          metalness: 0.1,
        })
      );
      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardMesh.position.set(
        0,
        -BAY_HEIGHT * 0.05 + cardIdx * 0.02,
        -0.12 + cardIdx * 0.08
      );
      cardMesh.rotation.x = 0.05;
      cardMesh.castShadow = true;
      cardsGroup.add(cardMesh);
    });
    bayGroup.add(cardsGroup);

    // Bay Floor Contact Splash Ring (illuminates when probe points here)
    const splashGeo = trackGeometry(new THREE.RingGeometry(0.08, 0.16, 24));
    splashGeo.rotateX(-Math.PI / 2);
    const splashMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: COLORS.ledAmber,
        transparent: true,
        opacity: i === 2 ? 0.75 : 0.0,
        side: THREE.DoubleSide,
      })
    );
    const splashMesh = new THREE.Mesh(splashGeo, splashMat);
    splashMesh.name = `SplashRing_${i}`;
    splashMesh.position.set(0, -BAY_HEIGHT / 2 + 0.065, 0);
    bayGroup.add(splashMesh);

    baysGroup.add(bayGroup);
    bayMeshes.push(bayGroup);

    // 4. PHYSICAL INDEX PLAQUE (Mounted above bay on the wooden backboard)
    const plaqueGroup = new THREE.Group();
    plaqueGroup.name = `IndexPlaque_${i}`;
    plaqueGroup.position.set(bayX, BACKBOARD_HEIGHT * 0.68, -0.34);

    // Brass backing bezel
    const bezelGeo = trackGeometry(new THREE.BoxGeometry(0.24, 0.24, 0.03));
    const bezelMesh = new THREE.Mesh(bezelGeo, brassMaterial);
    bezelMesh.castShadow = true;
    plaqueGroup.add(bezelMesh);

    // Ivory face with index number texture
    const plaqueTex = createIndexPlaqueTexture(i);
    const plaqueGeo = trackGeometry(new THREE.PlaneGeometry(0.2, 0.2));
    const plaqueMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        map: plaqueTex,
      })
    );
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueMesh.position.set(0, 0, 0.018);
    plaqueGroup.add(plaqueMesh);

    // LED alignment dot above plaque
    const ledGeo = trackGeometry(new THREE.CylinderGeometry(0.02, 0.02, 0.025, 12));
    ledGeo.rotateX(Math.PI / 2);
    const ledMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: i === 2 ? COLORS.ledAmber : '#475569',
      })
    );
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.name = `LedDot_${i}`;
    ledMesh.position.set(0, 0.16, 0.02);
    plaqueGroup.add(ledMesh);

    indexLeds.push(ledMesh);
    indexPlaqueMeshes.push(plaqueGroup);
    root.add(plaqueGroup);
  }

  // 5. SLIDING PROBE CARRIAGE ASSEMBLY
  const probeGroup = new THREE.Group();
  probeGroup.name = 'ProbeCarriage';
  // Initial target at index 2 (center bay) matching reference image
  const initialIndex = 2;
  const initialX = (initialIndex - (capacity - 1) / 2) * BAY_SPACING;
  probeGroup.position.set(initialX, RAIL_Y, RAIL_Z);
  root.add(probeGroup);

  // Carriage Main Body Block (Ivory/cream cube with bevels)
  const carriageBodyGeo = trackGeometry(new THREE.BoxGeometry(0.42, 0.42, 0.38));
  const carriageBodyMesh = new THREE.Mesh(carriageBodyGeo, creamCarriageMaterial);
  carriageBodyMesh.castShadow = true;
  probeGroup.add(carriageBodyMesh);

  // Carriage Rail Bushings / Linear Bearings (brass sleeves through which rails pass)
  [0.06, -0.06].forEach((by) => {
    const bushingGeo = trackGeometry(new THREE.CylinderGeometry(0.038, 0.038, 0.44, 16));
    bushingGeo.rotateZ(Math.PI / 2);
    const bushingMesh = new THREE.Mesh(bushingGeo, brassMaterial);
    bushingMesh.position.set(0, by, 0);
    probeGroup.add(bushingMesh);
  });

  // Top Stepper Motor on Carriage
  const topStepperGroup = new THREE.Group();
  topStepperGroup.name = 'CarriageStepper';
  topStepperGroup.position.set(0, 0.28, 0);

  const topStepperBodyGeo = trackGeometry(new THREE.BoxGeometry(0.24, 0.16, 0.24));
  const topStepperBodyMesh = new THREE.Mesh(topStepperBodyGeo, stepperDarkMaterial);
  topStepperBodyMesh.castShadow = true;
  topStepperGroup.add(topStepperBodyMesh);

  const topStepperCapGeo = trackGeometry(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 16));
  const topStepperCapMesh = new THREE.Mesh(topStepperCapGeo, stepperSilverMaterial);
  topStepperCapMesh.position.set(0, 0.09, 0);
  topStepperGroup.add(topStepperCapMesh);

  // Brass collar gear below stepper
  const stepperGearGeo = trackGeometry(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16));
  const stepperGearMesh = new THREE.Mesh(stepperGearGeo, brassMaterial);
  stepperGearMesh.position.set(0, -0.09, 0);
  topStepperGroup.add(stepperGearMesh);

  probeGroup.add(topStepperGroup);

  // Front Brass Spur Gears (Meshed gear train on front face)
  const gearsGroup = new THREE.Group();
  gearsGroup.name = 'FrontSpurGears';
  gearsGroup.position.set(-0.1, 0.05, 0.2);

  const gear1Geo = trackGeometry(new THREE.CylinderGeometry(0.085, 0.085, 0.025, 20));
  gear1Geo.rotateX(Math.PI / 2);
  const gear1Mesh = new THREE.Mesh(gear1Geo, brassMaterial);
  gearsGroup.add(gear1Mesh);

  const gear2Geo = trackGeometry(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 16));
  gear2Geo.rotateX(Math.PI / 2);
  const gear2Mesh = new THREE.Mesh(gear2Geo, brassMaterial);
  gear2Mesh.position.set(0.12, 0.06, 0.01);
  gearsGroup.add(gear2Mesh);

  probeGroup.add(gearsGroup);

  // Glowing Square LED Indicator on Carriage Front Face
  const ledWindowGeo = trackGeometry(new THREE.BoxGeometry(0.08, 0.08, 0.015));
  const ledWindowMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: COLORS.ledAmber,
    })
  );
  const ledWindowMesh = new THREE.Mesh(ledWindowGeo, ledWindowMat);
  ledWindowMesh.name = 'CarriageLedIndicator';
  ledWindowMesh.position.set(0.1, 0.02, 0.198);
  probeGroup.add(ledWindowMesh);

  // Downward Probe Stylus Nozzle
  const probeStylusGroup = new THREE.Group();
  probeStylusGroup.name = 'ProbeStylus';
  probeStylusGroup.position.set(0.08, -0.21, 0.07);

  const nozzleCollarGeo = trackGeometry(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 16));
  const nozzleCollarMesh = new THREE.Mesh(nozzleCollarGeo, brassMaterial);
  probeStylusGroup.add(nozzleCollarMesh);

  const nozzleConeGeo = trackGeometry(new THREE.ConeGeometry(0.035, 0.09, 16));
  nozzleConeGeo.rotateX(Math.PI);
  const nozzleConeMesh = new THREE.Mesh(nozzleConeGeo, polishedBrassMaterial);
  nozzleConeMesh.position.set(0, -0.065, 0);
  probeStylusGroup.add(nozzleConeMesh);

  // Glowing Vertical Laser / Probe Beam
  const beamLength = 0.82;
  const beamCoreGeo = trackGeometry(new THREE.CylinderGeometry(0.012, 0.012, beamLength, 12));
  beamCoreGeo.translate(0, -beamLength / 2, 0);
  const beamCoreMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: COLORS.ledAmberCore,
      transparent: true,
      opacity: 0.95,
    })
  );
  const beamCoreMesh = new THREE.Mesh(beamCoreGeo, beamCoreMat);
  beamCoreMesh.name = 'ProbeBeamCore';
  beamCoreMesh.position.set(0, -0.11, 0);
  probeStylusGroup.add(beamCoreMesh);

  const beamGlowGeo = trackGeometry(new THREE.CylinderGeometry(0.038, 0.038, beamLength, 12));
  beamGlowGeo.translate(0, -beamLength / 2, 0);
  const beamGlowMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: COLORS.ledAmber,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    })
  );
  const beamGlowMesh = new THREE.Mesh(beamGlowGeo, beamGlowMat);
  beamGlowMesh.name = 'ProbeBeamGlow';
  beamGlowMesh.position.set(0, -0.11, 0);
  probeStylusGroup.add(beamGlowMesh);

  // Attached dynamic warm point light illuminating target bay
  const probeLight = new THREE.PointLight(COLORS.ledAmber, 1.8, 3.2);
  probeLight.name = 'ProbePointLight';
  probeLight.position.set(0, -0.35, 0);
  probeStylusGroup.add(probeLight);

  probeGroup.add(probeStylusGroup);

  // --- KINETIC SIMULATION & ANIMATION STATE ---
  let targetIndex = initialIndex;
  let currentProbeX = initialX;
  let targetProbeX = initialX;
  let probeVelocity = 0;
  let probeMode: ProbeMode = 'idle';
  let isScanning = false;
  let isOutOfBounds = false;
  let errorBlinkTimer = 0;
  let gearRotation = 0;
  let pulseTimer = 0;

  function calculateBayX(idx: number): number {
    return (idx - (capacity - 1) / 2) * BAY_SPACING;
  }

  function setTargetIndexInternal(index: number, mode: ProbeMode = 'random'): void {
    targetIndex = index;
    probeMode = mode;

    if (index < 0 || index >= capacity) {
      isOutOfBounds = true;
      // Clamp to mechanical stop position with visual overextension bump
      const clamped = Math.max(-0.5, Math.min(capacity - 0.5, index));
      targetProbeX = calculateBayX(clamped);
    } else {
      isOutOfBounds = false;
      targetProbeX = calculateBayX(index);
    }
  }

  function updateRig(delta: number, state?: Partial<ArrayStationModelState>): void {
    if (state) {
      if (state.targetIndex !== undefined && state.targetIndex !== targetIndex) {
        setTargetIndexInternal(state.targetIndex, state.probeMode || 'random');
      }
      if (state.probeMode !== undefined) {
        probeMode = state.probeMode;
      }
      if (state.isScanning !== undefined) {
        isScanning = state.isScanning;
      }
      if (state.isOutOfBounds !== undefined) {
        isOutOfBounds = state.isOutOfBounds;
      }
    }

    pulseTimer += delta;

    // Critically damped spring simulation for carriage horizontal motion
    const springConstant = isScanning ? 45 : 65;
    const damping = isScanning ? 12 : 14;
    const displacement = targetProbeX - currentProbeX;
    const springForce = displacement * springConstant;
    const dampingForce = -probeVelocity * damping;
    const acceleration = springForce + dampingForce;

    probeVelocity += acceleration * delta;
    currentProbeX += probeVelocity * delta;

    // Rotate spur gears proportionally to carriage velocity
    if (Math.abs(probeVelocity) > 0.01) {
      gearRotation += probeVelocity * delta * 8;
      gear1Mesh.rotation.z = gearRotation;
      gear2Mesh.rotation.z = -gearRotation * 1.4;
    }

    // Vibration shudder when hitting out-of-bounds mechanical limit stop
    if (isOutOfBounds || probeMode === 'error') {
      errorBlinkTimer += delta;
      const shudder = Math.sin(errorBlinkTimer * 45) * 0.015;
      probeGroup.position.x = currentProbeX + shudder;

      // Flash Crimson RED
      const isBlinkOn = Math.sin(errorBlinkTimer * 12) > 0;
      const errorColor = isBlinkOn ? COLORS.ledErrorRed : '#450a0a';
      (ledWindowMat as THREE.MeshBasicMaterial).color.set(errorColor);
      (beamCoreMat as THREE.MeshBasicMaterial).color.set(errorColor);
      (beamGlowMat as THREE.MeshBasicMaterial).color.set(errorColor);
      probeLight.color.set(errorColor);
      probeLight.intensity = isBlinkOn ? 2.2 : 0.4;
    } else if (isScanning) {
      // Pulsing Cyan LED & Beam during Linear Search Scan
      probeGroup.position.x = currentProbeX;
      const scanPulse = 0.65 + Math.sin(pulseTimer * 10) * 0.35;
      (ledWindowMat as THREE.MeshBasicMaterial).color.set(COLORS.ledScanCyan);
      (beamCoreMat as THREE.MeshBasicMaterial).color.set('#e0f2fe');
      (beamGlowMat as THREE.MeshBasicMaterial).color.set(COLORS.ledScanCyan);
      beamGlowMat.opacity = 0.4 + scanPulse * 0.3;
      probeLight.color.set(COLORS.ledScanCyan);
      probeLight.intensity = 1.4 + scanPulse * 0.8;
    } else {
      // Normal Amber / Golden Light
      probeGroup.position.x = currentProbeX;
      (ledWindowMat as THREE.MeshBasicMaterial).color.set(COLORS.ledAmber);
      (beamCoreMat as THREE.MeshBasicMaterial).color.set(COLORS.ledAmberCore);
      (beamGlowMat as THREE.MeshBasicMaterial).color.set(COLORS.ledAmber);
      beamGlowMat.opacity = 0.55;
      probeLight.color.set(COLORS.ledAmber);
      probeLight.intensity = 1.8;
    }

    // Update active index plaque LEDs & floor splash rings
    const roundedIndex = Math.round((currentProbeX / BAY_SPACING) + (capacity - 1) / 2);
    for (let i = 0; i < capacity; i++) {
      const isCurrentActive = i === roundedIndex && !isOutOfBounds;
      const ledColor = isCurrentActive
        ? isScanning
          ? COLORS.ledScanCyan
          : COLORS.ledAmber
        : '#475569';
      (indexLeds[i].material as THREE.MeshBasicMaterial).color.set(ledColor);

      // Floor contact splash
      const splash = bayMeshes[i].getObjectByName(`SplashRing_${i}`) as THREE.Mesh;
      if (splash && splash.material) {
        const splashMat = splash.material as THREE.MeshBasicMaterial;
        splashMat.color.set(isScanning ? COLORS.ledScanCyan : COLORS.ledAmber);
        splashMat.opacity = isCurrentActive ? (0.6 + Math.sin(pulseTimer * 6) * 0.2) : 0.0;
      }
    }
  }

  function triggerScanStep(stepIndex: number): void {
    setTargetIndexInternal(stepIndex, 'linear');
    isScanning = true;
  }

  function triggerError(_message?: string): void {
    isOutOfBounds = true;
    probeMode = 'error';
    errorBlinkTimer = 0;
  }

  function clearError(): void {
    isOutOfBounds = false;
    probeMode = 'idle';
    setTargetIndexInternal(Math.max(0, Math.min(capacity - 1, targetIndex)), 'random');
  }

  function dispose(): void {
    disposables.geometries.forEach((g) => g.dispose());
    disposables.materials.forEach((m) => m.dispose());
    disposables.textures.forEach((t) => t.dispose());
    disposables.geometries.length = 0;
    disposables.materials.length = 0;
    disposables.textures.length = 0;
    root.clear();
  }

  return {
    group: root,
    probeGroup,
    baysGroup,
    update: updateRig,
    setTargetIndex: (idx: number, mode?: ProbeMode) => setTargetIndexInternal(idx, mode || 'random'),
    triggerScanStep,
    triggerError,
    clearError,
    dispose,
  };
}
