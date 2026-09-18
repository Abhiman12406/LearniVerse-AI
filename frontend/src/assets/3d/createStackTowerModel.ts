import * as THREE from 'three';

export interface StackDiscData {
  id: string;
  value: number;
}

export interface StackTowerModelOptions {
  capacity?: number;
  initialDiscs?: StackDiscData[];
}

export interface StackTowerModelRig {
  group: THREE.Group;
  discsGroup: THREE.Group;
  update: (delta: number, discs: StackDiscData[]) => void;
  triggerPush: (value?: number) => void;
  triggerPop: () => void;
  setHighlightTop: (highlight: boolean) => void;
  dispose: () => void;
}

interface ActiveDiscState {
  id: string;
  value: number;
  group: THREE.Group;
  currentY: number;
  velocity: number;
  targetY: number;
  isTop: boolean;
  scale: number;
  disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  };
}

interface EjectingDiscState {
  group: THREE.Group;
  currentY: number;
  velocity: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  opacity: number;
  scale: number;
  disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  };
}

/**
 * Procedural 3D Stack LIFO Cylinder Apparatus Factory
 * Faithful high-fidelity reconstruction from `asstesimages/stack_apparatus.png`:
 * - Rounded oak wood plinth base with ivory/cream beveled edge contour
 * - Lower acrylic gearbox housing with brass retention studs, "POP" decal, and sliding horizontal brass piston
 * - Right brushed brass control console with twin analog dial pressure gauges, knurled knobs, and vertical level meter
 * - Elevated acrylic & brass support pylons
 * - Transparent glass LIFO cylinder column with 4 vertical brass guide rods & acorn cap nuts
 * - Glowing amber vertical stack index scale (`0`, `1`, `2`, `3`, `4`) with alignment ticks
 * - Flared golden brass loading funnel stamped with "PUSH ↓"
 * - Dynamic pastel data discs with smooth vertical damped spring physics and pop ejection mechanics
 */
export function createStackTowerModel(options: StackTowerModelOptions = {}): StackTowerModelRig {
  const { capacity = 6, initialDiscs = [] } = options;

  const root = new THREE.Group();
  root.name = 'StackTowerApparatus';

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

  // --- AUTHENTIC COLOR PALETTE (From stack_apparatus.png) ---
  const COLORS = {
    woodOak: '#b8824f',
    woodOakDark: '#784c24',
    creamRim: '#f5f0e4',
    brassGold: '#d8aa46',
    brassDark: '#997322',
    brassPolish: '#f7d67b',
    acrylic: '#e2e8f0',
    glass: '#cbd5e1',
    amberNeon: '#ff9a1f',
    gaugeFace: '#fbfbf9',
    gaugeDark: '#1a1815',
    needleRed: '#ef4444',
    greenSafe: '#22c55e',
    // Pastel disc spectrum matching blueprint
    discColors: [
      '#a78bfa', // 0: Lavender
      '#f43f5e', // 1: Coral / Rose
      '#facc15', // 2: Mustard / Warm Gold
      '#38bdf8', // 3: Soft Cyan
      '#6ee7b7', // 4: Mint Green
      '#818cf8', // 5: Periwinkle
    ],
    topDiscTopper: '#fef08a',
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

      // Oak grain streaks
      ctx.fillStyle = 'rgba(120, 76, 36, 0.22)';
      for (let i = 0; i < 48; i++) {
        const x = Math.random() * canvas.width;
        const w = 3 + Math.random() * 8;
        ctx.fillRect(x, 0, w, canvas.height);
      }

      // Parquet plank lines
      ctx.strokeStyle = 'rgba(80, 48, 20, 0.25)';
      ctx.lineWidth = 2;
      for (let x = 40; x < canvas.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createPopDecalTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 58px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '6px';
      ctx.fillText('POP', canvas.width / 2, canvas.height / 2);
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    return tex;
  }

  function createPushFunnelTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6b4d1b';
      ctx.font = 'bold 54px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '5px';
      ctx.fillText('PUSH', canvas.width / 2, 70);

      // Downward arrow symbol "↓"
      ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
      ctx.fillText('↓', canvas.width / 2, 145);
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    return tex;
  }

  function createGaugeDialTexture(isPrimary: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = 110;

      // Dial face
      ctx.fillStyle = COLORS.gaugeFace;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Outer bezel ring line
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Green / Red zone arcs
      ctx.lineWidth = 10;
      // Green arc (safe)
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)';
      ctx.beginPath();
      ctx.arc(cx, cy, r - 16, Math.PI * 0.75, Math.PI * 1.75);
      ctx.stroke();

      // Red arc (overflow danger)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.beginPath();
      ctx.arc(cx, cy, r - 16, Math.PI * 1.75, Math.PI * 2.25);
      ctx.stroke();

      // Calibration ticks
      ctx.strokeStyle = COLORS.gaugeDark;
      const startAngle = Math.PI * 0.75;
      const endAngle = Math.PI * 2.25;
      const totalTicks = 16;

      for (let i = 0; i <= totalTicks; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / totalTicks);
        const isMajor = i % 4 === 0;
        const tickLength = isMajor ? 14 : 7;
        ctx.lineWidth = isMajor ? 3 : 1.5;

        const x1 = cx + Math.cos(angle) * (r - 8);
        const y1 = cy + Math.sin(angle) * (r - 8);
        const x2 = cx + Math.cos(angle) * (r - 8 - tickLength);
        const y2 = cy + Math.sin(angle) * (r - 8 - tickLength);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Title & Units
      ctx.fillStyle = COLORS.gaugeDark;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPrimary ? 'PSI x10' : 'VACUUM', cx, cy + 45);

      // Center pivot dot
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    return tex;
  }

  function createLevelMeterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scale markings
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      for (let y = 16; y < canvas.height - 16; y += 20) {
        const isMajor = (y - 16) % 40 === 0;
        ctx.beginPath();
        ctx.moveTo(6, y);
        ctx.lineTo(isMajor ? 24 : 14, y);
        ctx.stroke();
      }
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    return tex;
  }

  // --- SHARED REUSABLE MATERIALS ---
  const woodMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      map: createWoodTexture(),
      roughness: 0.38,
      metalness: 0.04,
    })
  );

  const creamRimMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.creamRim,
      roughness: 0.35,
      metalness: 0.08,
    })
  );

  const brassMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.brassGold,
      roughness: 0.26,
      metalness: 0.88,
    })
  );

  const brassPolishedMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.brassPolish,
      roughness: 0.18,
      metalness: 0.94,
    })
  );

  const darkBrassMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.brassDark,
      roughness: 0.32,
      metalness: 0.82,
    })
  );

  const acrylicMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.acrylic,
      roughness: 0.08,
      metalness: 0.12,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );

  const glassMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.glass,
      roughness: 0.05,
      metalness: 0.08,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );

  const amberGlowMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: COLORS.amberNeon,
    })
  );

  // Helper for rounded rectangle geometry
  function createRoundedRectGeometry(
    width: number,
    depth: number,
    height: number,
    radius: number
  ): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -depth / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + depth - radius);
    shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
    shape.lineTo(x + radius, y + depth);
    shape.quadraticCurveTo(x, y + depth, x, y + depth - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: height,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Orient so extrusion is vertical along Y
    geom.rotateX(-Math.PI / 2);
    return trackGeometry(geom);
  }

  // ==========================================================================
  // 1. BASE PLINTH (Oak Wood with Cream Bevel Lip)
  // ==========================================================================
  const baseGroup = new THREE.Group();
  baseGroup.name = 'BasePlinth';
  root.add(baseGroup);

  // Outer Cream Rim Bumper
  const outerRimGeom = createRoundedRectGeometry(2.3, 2.3, 0.08, 0.25);
  const outerRimMesh = new THREE.Mesh(outerRimGeom, creamRimMaterial);
  outerRimMesh.position.y = 0.02;
  outerRimMesh.receiveShadow = true;
  baseGroup.add(outerRimMesh);

  // Solid Oak Wooden Block
  const woodCoreGeom = createRoundedRectGeometry(2.18, 2.18, 0.24, 0.22);
  const woodCoreMesh = new THREE.Mesh(woodCoreGeom, woodMaterial);
  woodCoreMesh.position.y = 0.06;
  woodCoreMesh.castShadow = true;
  woodCoreMesh.receiveShadow = true;
  baseGroup.add(woodCoreMesh);

  // Top Inset Cream Border Ring
  const topTrimGeom = createRoundedRectGeometry(2.08, 2.08, 0.025, 0.2);
  const topTrimMesh = new THREE.Mesh(topTrimGeom, creamRimMaterial);
  topTrimMesh.position.y = 0.3;
  baseGroup.add(topTrimMesh);

  // 4 Corner Brass Mounting Studs on Base
  const cornerCoords = [
    [-0.95, -0.95],
    [0.95, -0.95],
    [-0.95, 0.95],
    [0.95, 0.95],
  ];
  cornerCoords.forEach(([cx, cz]) => {
    const footGeom = trackGeometry(new THREE.CylinderGeometry(0.045, 0.055, 0.04, 16));
    const footMesh = new THREE.Mesh(footGeom, darkBrassMaterial);
    footMesh.position.set(cx, 0.32, cz);
    baseGroup.add(footMesh);
  });

  // ==========================================================================
  // 2. LOWER LEFT: CLEAR ACRYLIC GEARBOX & "POP" PISTON MECHANISM
  // ==========================================================================
  const gearboxGroup = new THREE.Group();
  gearboxGroup.name = 'AcrylicGearbox';
  gearboxGroup.position.set(-0.48, 0.32, 0.24);
  root.add(gearboxGroup);

  const gbWidth = 0.72;
  const gbHeight = 0.42;
  const gbDepth = 0.52;

  // Acrylic Box Chamber Walls
  const gbBoxGeom = trackGeometry(new THREE.BoxGeometry(gbWidth, gbHeight, gbDepth));
  const gbBoxMesh = new THREE.Mesh(gbBoxGeom, acrylicMaterial);
  gbBoxMesh.position.set(0, gbHeight / 2, 0);
  gearboxGroup.add(gbBoxMesh);

  // 4 Corner Brass Retention Rods with knurled hex nuts
  const rodOffsets = [
    [-gbWidth / 2 + 0.03, -gbDepth / 2 + 0.03],
    [gbWidth / 2 - 0.03, -gbDepth / 2 + 0.03],
    [-gbWidth / 2 + 0.03, gbDepth / 2 - 0.03],
    [gbWidth / 2 - 0.03, gbDepth / 2 - 0.03],
  ];
  rodOffsets.forEach(([rx, rz]) => {
    const rodGeom = trackGeometry(new THREE.CylinderGeometry(0.016, 0.016, gbHeight + 0.04, 12));
    const rodMesh = new THREE.Mesh(rodGeom, brassMaterial);
    rodMesh.position.set(rx, gbHeight / 2, rz);
    gearboxGroup.add(rodMesh);

    // Top thumb nut
    const nutGeom = trackGeometry(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 6));
    const nutMesh = new THREE.Mesh(nutGeom, darkBrassMaterial);
    nutMesh.position.set(rx, gbHeight + 0.02, rz);
    gearboxGroup.add(nutMesh);
  });

  // Front "POP" Transparent Plate
  const popPlaneGeom = trackGeometry(new THREE.PlaneGeometry(0.48, 0.24));
  const popPlaneMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: createPopDecalTexture(),
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    })
  );
  const popPlaneMesh = new THREE.Mesh(popPlaneGeom, popPlaneMat);
  popPlaneMesh.position.set(0, gbHeight / 2, gbDepth / 2 + 0.002);
  gearboxGroup.add(popPlaneMesh);

  // Horizontal Brass Piston Actuator Mechanism
  const pistonGroup = new THREE.Group();
  pistonGroup.name = 'PistonActuator';
  gearboxGroup.add(pistonGroup);

  // Dual guide rails inside gearbox
  [-0.14, 0.14].forEach((pz) => {
    const railGeom = trackGeometry(new THREE.CylinderGeometry(0.018, 0.018, gbWidth - 0.08, 12));
    const railMesh = new THREE.Mesh(railGeom, brassPolishedMaterial);
    railMesh.rotation.z = Math.PI / 2;
    railMesh.position.set(0, gbHeight / 2 - 0.05, pz);
    pistonGroup.add(railMesh);
  });

  // Central Sliding Brass Actuator Shaft
  const mainPistonShaftGeom = trackGeometry(new THREE.CylinderGeometry(0.034, 0.034, 0.85, 16));
  const mainPistonShaftMesh = new THREE.Mesh(mainPistonShaftGeom, brassPolishedMaterial);
  mainPistonShaftMesh.rotation.z = Math.PI / 2;
  mainPistonShaftMesh.position.set(0.12, gbHeight / 2, 0);
  pistonGroup.add(mainPistonShaftMesh);

  // Piston Plunger Head / Coupler directly under cylinder axis
  const plungerHeadGeom = trackGeometry(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24));
  const plungerHeadMesh = new THREE.Mesh(plungerHeadGeom, darkBrassMaterial);
  plungerHeadMesh.position.set(0.48, gbHeight / 2 + 0.08, -0.24);
  gearboxGroup.add(plungerHeadMesh);

  // ==========================================================================
  // 3. LOWER RIGHT: BRUSHED BRASS CONTROL CONSOLE
  // ==========================================================================
  const consoleGroup = new THREE.Group();
  consoleGroup.name = 'ControlConsole';
  consoleGroup.position.set(0.46, 0.32, 0.18);
  root.add(consoleGroup);

  const conWidth = 0.58;
  const conHeight = 0.52;
  const conDepth = 0.44;

  // Solid Brass Console Housing
  const conBoxGeom = trackGeometry(new THREE.BoxGeometry(conWidth, conHeight, conDepth));
  const conBoxMesh = new THREE.Mesh(conBoxGeom, brassMaterial);
  conBoxMesh.position.set(0, conHeight / 2, 0);
  conBoxMesh.castShadow = true;
  consoleGroup.add(conBoxMesh);

  // Console Bevel Frame
  const conTrimGeom = trackGeometry(new THREE.BoxGeometry(conWidth + 0.02, conHeight + 0.02, 0.04));
  const conTrimMesh = new THREE.Mesh(conTrimGeom, darkBrassMaterial);
  conTrimMesh.position.set(0, conHeight / 2, conDepth / 2 + 0.01);
  consoleGroup.add(conTrimMesh);

  // Top Analog Pressure Gauge (Primary PSI)
  const topGaugeGroup = new THREE.Group();
  topGaugeGroup.position.set(-0.12, conHeight - 0.14, conDepth / 2 + 0.035);
  consoleGroup.add(topGaugeGroup);

  const gaugeRadius = 0.095;
  const gaugeBezelGeom = trackGeometry(new THREE.CylinderGeometry(gaugeRadius + 0.015, gaugeRadius + 0.015, 0.03, 32));
  const gaugeBezelMesh = new THREE.Mesh(gaugeBezelGeom, brassPolishedMaterial);
  gaugeBezelMesh.rotation.x = Math.PI / 2;
  topGaugeGroup.add(gaugeBezelMesh);

  const dialPlaneGeom = trackGeometry(new THREE.CircleGeometry(gaugeRadius, 32));
  const dialPlaneMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: createGaugeDialTexture(true),
      side: THREE.DoubleSide,
    })
  );
  const dialPlaneMesh = new THREE.Mesh(dialPlaneGeom, dialPlaneMat);
  dialPlaneMesh.position.z = 0.016;
  topGaugeGroup.add(dialPlaneMesh);

  // Needle for Top Gauge
  const needleGroup1 = new THREE.Group();
  needleGroup1.position.z = 0.018;
  topGaugeGroup.add(needleGroup1);

  const needleGeom1 = trackGeometry(new THREE.BoxGeometry(0.008, gaugeRadius * 0.85, 0.004));
  needleGeom1.translate(0, (gaugeRadius * 0.85) / 2, 0);
  const needleMat = trackMaterial(new THREE.MeshBasicMaterial({ color: COLORS.needleRed }));
  const needleMesh1 = new THREE.Mesh(needleGeom1, needleMat);
  needleGroup1.add(needleMesh1);
  needleGroup1.rotation.z = -Math.PI * 0.25;

  // Bottom Analog Gauge (Vacuum)
  const botGaugeGroup = new THREE.Group();
  botGaugeGroup.position.set(-0.12, 0.13, conDepth / 2 + 0.035);
  consoleGroup.add(botGaugeGroup);

  const botGaugeRadius = 0.075;
  const botBezelGeom = trackGeometry(new THREE.CylinderGeometry(botGaugeRadius + 0.012, botGaugeRadius + 0.012, 0.025, 32));
  const botBezelMesh = new THREE.Mesh(botBezelGeom, brassPolishedMaterial);
  botBezelMesh.rotation.x = Math.PI / 2;
  botGaugeGroup.add(botBezelMesh);

  const botDialPlaneGeom = trackGeometry(new THREE.CircleGeometry(botGaugeRadius, 32));
  const botDialPlaneMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: createGaugeDialTexture(false),
      side: THREE.DoubleSide,
    })
  );
  const botDialMesh = new THREE.Mesh(botDialPlaneGeom, botDialPlaneMat);
  botDialMesh.position.z = 0.014;
  botGaugeGroup.add(botDialMesh);

  const needleGroup2 = new THREE.Group();
  needleGroup2.position.z = 0.016;
  botGaugeGroup.add(needleGroup2);

  const needleGeom2 = trackGeometry(new THREE.BoxGeometry(0.006, botGaugeRadius * 0.8, 0.003));
  needleGeom2.translate(0, (botGaugeRadius * 0.8) / 2, 0);
  const needleMesh2 = new THREE.Mesh(needleGeom2, needleMat);
  needleGroup2.add(needleMesh2);
  needleGroup2.rotation.z = Math.PI * 0.15;

  // Knurled Rotary Adjustment Knobs on Right of Console
  [conHeight - 0.14, 0.22, 0.10].forEach((ky) => {
    const knobGeom = trackGeometry(new THREE.CylinderGeometry(0.035, 0.038, 0.04, 16));
    const knobMesh = new THREE.Mesh(knobGeom, darkBrassMaterial);
    knobMesh.rotation.x = Math.PI / 2;
    knobMesh.position.set(0.12, ky, conDepth / 2 + 0.02);
    consoleGroup.add(knobMesh);

    // Knurl detail ring
    const knurlRingGeom = trackGeometry(new THREE.TorusGeometry(0.036, 0.006, 8, 24));
    const knurlRingMesh = new THREE.Mesh(knurlRingGeom, brassPolishedMaterial);
    knurlRingMesh.position.set(0.12, ky, conDepth / 2 + 0.038);
    consoleGroup.add(knurlRingMesh);
  });

  // Vertical Level Indicator Meter Slot
  const levelSlotGeom = trackGeometry(new THREE.PlaneGeometry(0.07, 0.32));
  const levelSlotMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: createLevelMeterTexture(),
      side: THREE.DoubleSide,
    })
  );
  const levelSlotMesh = new THREE.Mesh(levelSlotGeom, levelSlotMat);
  levelSlotMesh.position.set(0.21, conHeight / 2, conDepth / 2 + 0.022);
  consoleGroup.add(levelSlotMesh);

  // Animated Level Meter Bar
  const levelBarGeom = trackGeometry(new THREE.PlaneGeometry(0.025, 0.28));
  const levelBarMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: COLORS.amberNeon,
      side: THREE.DoubleSide,
    })
  );
  const levelBarMesh = new THREE.Mesh(levelBarGeom, levelBarMat);
  levelBarMesh.position.set(0.21, conHeight / 2, conDepth / 2 + 0.024);
  levelBarMesh.scale.set(1, 0.5, 1);
  consoleGroup.add(levelBarMesh);

  // ==========================================================================
  // 4. VERTICAL TRANSPARENT GLASS LIFO CYLINDER & BRASS FLANGES
  // ==========================================================================
  const towerGroup = new THREE.Group();
  towerGroup.name = 'CylinderTower';
  root.add(towerGroup);

  const cylinderRadius = 0.52;
  const cylinderHeight = 2.4;
  const cylinderCenterY = 2.3; // From y = 1.10 to y = 3.50

  // Elevated Support Pylons (Mounting cylinder base at y = 1.10)
  const pylonPositions = [
    [-0.38, -0.28],
    [0.38, -0.28],
    [-0.38, 0.24],
    [0.38, 0.24],
  ];
  pylonPositions.forEach(([px, pz]) => {
    const pylonGeom = trackGeometry(new THREE.CylinderGeometry(0.032, 0.038, 0.76, 16));
    const pylonMesh = new THREE.Mesh(pylonGeom, darkBrassMaterial);
    pylonMesh.position.set(px, 0.72, pz);
    towerGroup.add(pylonMesh);
  });

  // Lower Heavy Brass Base Flange Ring
  const lowerFlangeGeom = trackGeometry(new THREE.CylinderGeometry(0.66, 0.70, 0.12, 32));
  const lowerFlangeMesh = new THREE.Mesh(lowerFlangeGeom, brassMaterial);
  lowerFlangeMesh.position.set(0, 1.14, 0);
  towerGroup.add(lowerFlangeMesh);

  // Decorative Torus Collar Rim
  const lowerTorusGeom = trackGeometry(new THREE.TorusGeometry(0.66, 0.035, 16, 32));
  const lowerTorusMesh = new THREE.Mesh(lowerTorusGeom, brassPolishedMaterial);
  lowerTorusMesh.rotation.x = Math.PI / 2;
  lowerTorusMesh.position.set(0, 1.20, 0);
  towerGroup.add(lowerTorusMesh);

  // Transparent Glass Column
  const glassGeom = trackGeometry(
    new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight, 32, 1, true)
  );
  const glassMesh = new THREE.Mesh(glassGeom, glassMaterial);
  glassMesh.position.set(0, cylinderCenterY, 0);
  towerGroup.add(glassMesh);

  // 4 Vertical Outer Brass Guide Rods with Acorn Caps
  const guideAngles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
  const guideRadius = 0.58;

  guideAngles.forEach((angle) => {
    const gx = Math.sin(angle) * guideRadius;
    const gz = Math.cos(angle) * guideRadius;

    // Vertical Rod
    const rodGeom = trackGeometry(new THREE.CylinderGeometry(0.016, 0.016, cylinderHeight + 0.1, 12));
    const rodMesh = new THREE.Mesh(rodGeom, brassMaterial);
    rodMesh.position.set(gx, cylinderCenterY, gz);
    towerGroup.add(rodMesh);

    // Top and bottom brass acorn cap nuts
    [-1, 1].forEach((dir) => {
      const capGeom = trackGeometry(new THREE.SphereGeometry(0.032, 12, 12));
      const capMesh = new THREE.Mesh(capGeom, brassPolishedMaterial);
      capMesh.position.set(gx, cylinderCenterY + (dir * (cylinderHeight + 0.1)) / 2, gz);
      towerGroup.add(capMesh);
    });
  });

  // Top Brass Ring Lintel Collar
  const topCollarGeom = trackGeometry(new THREE.CylinderGeometry(0.66, 0.62, 0.1, 32));
  const topCollarMesh = new THREE.Mesh(topCollarGeom, brassMaterial);
  topCollarMesh.position.set(0, 3.52, 0);
  towerGroup.add(topCollarMesh);

  const topTorusGeom = trackGeometry(new THREE.TorusGeometry(0.65, 0.03, 16, 32));
  const topTorusMesh = new THREE.Mesh(topTorusGeom, brassPolishedMaterial);
  topTorusMesh.rotation.x = Math.PI / 2;
  topTorusMesh.position.set(0, 3.57, 0);
  towerGroup.add(topTorusMesh);

  // ==========================================================================
  // 5. GOLDEN TOP FUNNEL ("PUSH ↓")
  // ==========================================================================
  const funnelGroup = new THREE.Group();
  funnelGroup.name = 'TopFunnel';
  funnelGroup.position.set(0, 3.62, 0);
  root.add(funnelGroup);

  // Conical Flared Funnel Body
  const funnelGeom = trackGeometry(
    new THREE.CylinderGeometry(0.78, 0.46, 0.52, 32, 1, false)
  );
  const funnelMesh = new THREE.Mesh(funnelGeom, brassPolishedMaterial);
  funnelMesh.position.set(0, 0.26, 0);
  funnelGroup.add(funnelMesh);

  // Funnel Upper Lip Torus Rim
  const lipGeom = trackGeometry(new THREE.TorusGeometry(0.78, 0.04, 16, 32));
  const lipMesh = new THREE.Mesh(lipGeom, brassMaterial);
  lipMesh.rotation.x = Math.PI / 2;
  lipMesh.position.set(0, 0.52, 0);
  funnelGroup.add(lipMesh);

  // "PUSH ↓" Label Plate inside the flared funnel
  const pushLabelGeom = trackGeometry(new THREE.PlaneGeometry(0.44, 0.22));
  const pushLabelMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: createPushFunnelTexture(),
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    })
  );
  const pushLabelMesh = new THREE.Mesh(pushLabelGeom, pushLabelMat);
  pushLabelMesh.position.set(0, 0.28, 0.44);
  pushLabelMesh.rotation.x = -0.32;
  funnelGroup.add(pushLabelMesh);

  // ==========================================================================
  // 6. GLOWING NEON AMBER STACK INDEX SCALE (Right Side: 0..4)
  // ==========================================================================
  const indexScaleGroup = new THREE.Group();
  indexScaleGroup.name = 'StackIndexScale';
  indexScaleGroup.position.set(0.68, 0, 0);
  root.add(indexScaleGroup);

  // Vertical Index Scale Ladder Ticks
  const baseDiscY = 1.34;
  const discHeightStep = 0.36;

  function createIndexNumberTexture(num: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COLORS.amberNeon;
      ctx.font = 'bold 84px system-ui, -apple-system, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = COLORS.amberNeon;
      ctx.shadowBlur = 12;
      ctx.fillText(num.toString(), canvas.width / 2, canvas.height / 2);
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    return tex;
  }

  for (let i = 0; i < 5; i++) {
    const yPos = baseDiscY + i * discHeightStep;

    // Horizontal Tick Bar
    const tickGeom = trackGeometry(new THREE.BoxGeometry(0.08, 0.016, 0.016));
    const tickMesh = new THREE.Mesh(tickGeom, amberGlowMaterial);
    tickMesh.position.set(-0.04, yPos, 0);
    indexScaleGroup.add(tickMesh);

    // Glowing Number Decal
    const numGeom = trackGeometry(new THREE.PlaneGeometry(0.18, 0.18));
    const numMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        map: createIndexNumberTexture(i),
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      })
    );
    const numMesh = new THREE.Mesh(numGeom, numMat);
    numMesh.position.set(0.08, yPos, 0);
    indexScaleGroup.add(numMesh);
  }

  // Soft internal ambient amber/cyan illumination
  const columnPointLight = new THREE.PointLight(COLORS.amberNeon, 1.2, 3.5);
  columnPointLight.position.set(0, 2.2, 0);
  root.add(columnPointLight);

  // ==========================================================================
  // 7. DYNAMIC DATA DISCS SYSTEM WITH DAMPED SPRING PHYSICS
  // ==========================================================================
  const discsGroup = new THREE.Group();
  discsGroup.name = 'DataDiscsContainer';
  root.add(discsGroup);

  const activeDiscs = new Map<string, ActiveDiscState>();
  const ejectingDiscs: EjectingDiscState[] = [];

  // Helper to create a single styled disc mesh assembly
  function buildDiscMesh(value: number, index: number, isTop: boolean) {
    const discAssembly = new THREE.Group();
    const discRadius = 0.44;
    const discThickness = 0.28;

    const discColor = COLORS.discColors[index % COLORS.discColors.length] || '#a78bfa';

    const discGeom = trackGeometry(new THREE.CylinderGeometry(discRadius, discRadius, discThickness, 32));
    const discMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: discColor,
        roughness: 0.32,
        metalness: 0.18,
      })
    );
    const discBodyMesh = new THREE.Mesh(discGeom, discMat);
    discBodyMesh.castShadow = true;
    discBodyMesh.receiveShadow = true;
    discAssembly.add(discBodyMesh);

    // Soft rounded rim chamfer (torus ring top & bottom)
    [-1, 1].forEach((dir) => {
      const rimTorusGeom = trackGeometry(new THREE.TorusGeometry(discRadius, 0.016, 12, 32));
      const rimTorusMat = trackMaterial(
        new THREE.MeshStandardMaterial({
          color: isTop ? COLORS.topDiscTopper : '#ffffff',
          roughness: 0.25,
          metalness: 0.3,
        })
      );
      const rimTorusMesh = new THREE.Mesh(rimTorusGeom, rimTorusMat);
      rimTorusMesh.rotation.x = Math.PI / 2;
      rimTorusMesh.position.y = (dir * discThickness) / 2;
      discAssembly.add(rimTorusMesh);
    });

    // Label on Face and Top
    function createDiscValueTexture(val: number): THREE.CanvasTexture {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val.toString(), canvas.width / 2, canvas.height / 2);
      }
      return trackTexture(new THREE.CanvasTexture(canvas));
    }

    const labelPlaneGeom = trackGeometry(new THREE.PlaneGeometry(0.38, 0.2));
    const labelPlaneMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        map: createDiscValueTexture(value),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })
    );
    // Front side label
    const frontLabelMesh = new THREE.Mesh(labelPlaneGeom, labelPlaneMat);
    frontLabelMesh.position.set(0, 0, discRadius + 0.002);
    discAssembly.add(frontLabelMesh);

    // Top face label
    const topLabelGeom = trackGeometry(new THREE.PlaneGeometry(0.32, 0.18));
    const topLabelMesh = new THREE.Mesh(topLabelGeom, labelPlaneMat);
    topLabelMesh.rotation.x = -Math.PI / 2;
    topLabelMesh.position.set(0, discThickness / 2 + 0.002, 0);
    discAssembly.add(topLabelMesh);

    // "TOP" badge topper if this is the topmost disc
    if (isTop) {
      const topperCanvas = document.createElement('canvas');
      topperCanvas.width = 128;
      topperCanvas.height = 64;
      const tCtx = topperCanvas.getContext('2d');
      if (tCtx) {
        tCtx.clearRect(0, 0, topperCanvas.width, topperCanvas.height);
        tCtx.fillStyle = '#b45309';
        tCtx.font = 'bold 36px system-ui, -apple-system, sans-serif';
        tCtx.textAlign = 'center';
        tCtx.textBaseline = 'middle';
        tCtx.fillText('TOP', topperCanvas.width / 2, topperCanvas.height / 2);
      }
      const topperTex = trackTexture(new THREE.CanvasTexture(topperCanvas));
      const topperGeom = trackGeometry(new THREE.PlaneGeometry(0.24, 0.12));
      const topperMat = trackMaterial(
        new THREE.MeshBasicMaterial({
          map: topperTex,
          transparent: true,
          side: THREE.DoubleSide,
        })
      );
      const topperMesh = new THREE.Mesh(topperGeom, topperMat);
      topperMesh.position.set(0, discThickness / 2 + 0.08, 0);
      discAssembly.add(topperMesh);
    }

    return discAssembly;
  }

  // Initialize initial discs if provided
  initialDiscs.forEach((discData, idx) => {
    const isTop = idx === initialDiscs.length - 1;
    const discMesh = buildDiscMesh(discData.value, idx, isTop);
    const targetY = baseDiscY + idx * discHeightStep;
    discMesh.position.set(0, targetY, 0);
    discsGroup.add(discMesh);

    activeDiscs.set(discData.id, {
      id: discData.id,
      value: discData.value,
      group: discMesh,
      currentY: targetY,
      velocity: 0,
      targetY,
      isTop,
      scale: 1,
      disposables: { geometries: [], materials: [], textures: [] },
    });
  });

  // State variables for mechanical recoil & needle flutter
  let pistonRecoil = 0;
  let pistonRecoilVelocity = 0;
  let needleFlutter = 0;
  let highlightTopState = false;

  // ==========================================================================
  // 8. UPDATE CYCLE & PHYSICS ENGINE
  // ==========================================================================
  function update(delta: number, currentDiscs: StackDiscData[]) {
    // Clamp delta to prevent simulation blowup on lag spikes
    const dt = Math.min(delta, 0.05);

    // 1. Detect removals (POP operations)
    const currentIdSet = new Set(currentDiscs.map((d) => d.id));
    for (const [id, state] of activeDiscs.entries()) {
      if (!currentIdSet.has(id)) {
        // Trigger Pop Ejection animation: disc shoots up and out of funnel
        ejectingDiscs.push({
          group: state.group,
          currentY: state.currentY,
          velocity: 7.2, // Launch upward
          rotX: (Math.random() - 0.5) * 6,
          rotY: (Math.random() - 0.5) * 6,
          rotZ: (Math.random() - 0.5) * 6,
          opacity: 1.0,
          scale: 1.0,
          disposables: state.disposables,
        });

        activeDiscs.delete(id);

        // Actuate horizontal piston recoil
        pistonRecoil = 0.22;
        pistonRecoilVelocity = 0;
        needleFlutter = 0.4;
      }
    }

    // 2. Synchronize existing / new discs
    currentDiscs.forEach((discData, idx) => {
      const isTop = idx === currentDiscs.length - 1;
      const targetY = baseDiscY + idx * discHeightStep;

      let state = activeDiscs.get(discData.id);
      if (!state) {
        // New PUSH operation: create disc at top of funnel and drop down
        const discMesh = buildDiscMesh(discData.value, idx, isTop);
        const spawnY = 4.4; // Inside / above top funnel
        discMesh.position.set(0, spawnY, 0);
        discsGroup.add(discMesh);

        state = {
          id: discData.id,
          value: discData.value,
          group: discMesh,
          currentY: spawnY,
          velocity: -1.2, // Initial downward impulse
          targetY,
          isTop,
          scale: 1,
          disposables: { geometries: [], materials: [], textures: [] },
        };
        activeDiscs.set(discData.id, state);

        // Pressure needle flutter
        needleFlutter = 0.35;
      } else {
        state.targetY = targetY;
        if (state.isTop !== isTop) {
          state.isTop = isTop;
        }
      }
    });

    // 3. Damped Harmonic Spring Simulation for active discs
    const springConstant = 52.0;
    const damping = 0.74;

    for (const state of activeDiscs.values()) {
      const displacement = state.targetY - state.currentY;
      const force = displacement * springConstant;

      state.velocity = (state.velocity + force * dt) * damping;
      state.currentY += state.velocity * dt;

      state.group.position.y = state.currentY;
    }

    // 4. Ejecting discs simulation (parabolic pop flight & fade)
    for (let i = ejectingDiscs.length - 1; i >= 0; i--) {
      const ej = ejectingDiscs[i];
      ej.velocity += -14.0 * dt; // Gravity
      ej.currentY += ej.velocity * dt;
      ej.group.position.y = ej.currentY;

      ej.group.rotation.x += ej.rotX * dt;
      ej.group.rotation.y += ej.rotY * dt;
      ej.group.rotation.z += ej.rotZ * dt;

      ej.opacity -= 1.8 * dt;
      ej.scale = Math.max(0.01, ej.scale - 1.2 * dt);
      ej.group.scale.setScalar(ej.scale);

      if (ej.opacity <= 0.05 || ej.currentY < 1.0 || ej.scale <= 0.05) {
        discsGroup.remove(ej.group);
        ejectingDiscs.splice(i, 1);
      }
    }

    // 5. Horizontal piston recoil spring simulation
    const pistonSpring = 45.0;
    const pistonDamp = 0.68;
    const pDisp = -pistonRecoil;
    pistonRecoilVelocity = (pistonRecoilVelocity + pDisp * pistonSpring * dt) * pistonDamp;
    pistonRecoil += pistonRecoilVelocity * dt;
    mainPistonShaftMesh.position.x = 0.12 - pistonRecoil;

    // 6. Gauge Needle & Level Meter Animation
    if (needleFlutter > 0) {
      needleFlutter = Math.max(0, needleFlutter - 1.2 * dt);
    }
    const stackRatio = Math.min(1.0, currentDiscs.length / capacity);
    const targetAngle1 = -Math.PI * 0.45 + stackRatio * Math.PI * 0.9 + Math.sin(Date.now() * 0.015) * needleFlutter;
    needleGroup1.rotation.z = THREE.MathUtils.lerp(needleGroup1.rotation.z, targetAngle1, 0.12);

    const targetAngle2 = Math.PI * 0.2 - stackRatio * Math.PI * 0.35 + Math.cos(Date.now() * 0.018) * (needleFlutter * 0.5);
    needleGroup2.rotation.z = THREE.MathUtils.lerp(needleGroup2.rotation.z, targetAngle2, 0.12);

    // Level meter height
    levelBarMesh.scale.y = THREE.MathUtils.lerp(levelBarMesh.scale.y, Math.max(0.05, stackRatio), 0.15);

    // Subtle breathing light
    columnPointLight.intensity = 1.0 + Math.sin(Date.now() * 0.003) * 0.25;
  }

  function triggerPush(_value = 50) {
    pistonRecoil = 0.15;
    needleFlutter = 0.45;
  }

  function triggerPop() {
    pistonRecoil = 0.25;
    needleFlutter = 0.55;
  }

  function setHighlightTop(highlight: boolean) {
    highlightTopState = highlight;
  }

  function dispose() {
    // Clean up all active discs
    for (const state of activeDiscs.values()) {
      discsGroup.remove(state.group);
    }
    activeDiscs.clear();

    // Clean up ejecting discs
    for (const ej of ejectingDiscs) {
      discsGroup.remove(ej.group);
    }
    ejectingDiscs.length = 0;

    // Clean tracked geometries
    disposables.geometries.forEach((g) => g.dispose());
    disposables.geometries.length = 0;

    // Clean tracked materials
    disposables.materials.forEach((m) => m.dispose());
    disposables.materials.length = 0;

    // Clean tracked textures
    disposables.textures.forEach((t) => t.dispose());
    disposables.textures.length = 0;
  }

  return {
    group: root,
    discsGroup,
    update,
    triggerPush,
    triggerPop,
    setHighlightTop,
    dispose,
  };
}
