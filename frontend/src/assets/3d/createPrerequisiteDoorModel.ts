import * as THREE from 'three';

export interface PrerequisiteDoorModelOptions {
  wingId?: string;
  wingName?: string;
  isSealed?: boolean;
  requiredText?: string;
  currentText?: string;
  width?: number;
  height?: number;
}

export interface PrerequisiteDoorModel {
  group: THREE.Group;
  barrierMesh: THREE.Mesh;
  ledMesh: THREE.Mesh;
  updateStatus: (params: {
    wingId?: string;
    wingName?: string;
    isSealed?: boolean;
    requiredText?: string;
    currentText?: string;
  }) => void;
  update: (delta: number, dissolvePhase?: string, isDissolving?: boolean) => void;
  setSealed: (isSealed: boolean) => void;
  triggerShockwave: () => void;
  dispose: () => void;
}

const PARTICLE_COUNT = 380;

// Custom GLSL Hexagonal Honeycomb Forcefield Shader
const hexVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const hexFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;
  uniform float uScanlineSpeed;
  uniform float uFlicker;
  uniform float uDissolveProgress;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  // Hexagonal grid math
  vec4 getHexGrid(vec2 p) {
    vec2 r = vec2(1.0, 1.7320508);
    vec2 h = r * 0.5;
    vec2 a = mod(p, r) - h;
    vec2 b = mod(p - h, r) - h;
    vec2 gv = dot(a, a) < dot(b, b) ? a : b;
    float edgeDist = 0.5 - max(dot(abs(gv), vec2(0.8660254, 0.5)), abs(gv.y));
    vec2 cellId = p - gv;
    return vec4(gv.x, gv.y, edgeDist, length(cellId));
  }

  // Hash for cell variance
  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    // Arch contour mask: curve the top of the barrier to fit the cream arch
    // uv.x in [0, 1], uv.y in [0, 1]. Arch spring at y = 0.65
    float springY = 0.66;
    if (vUv.y > springY) {
      float normX = (vUv.x - 0.5) * 2.0; // [-1, 1]
      float normY = (vUv.y - springY) / (1.0 - springY); // [0, 1]
      if (normX * normX + normY * normY > 1.0) {
        discard;
      }
    }

    // Scale UV for hexagonal honeycomb tiling
    vec2 hexUv = vUv * vec2(14.0, 20.0);
    vec4 hex = getHexGrid(hexUv);
    float edgeDist = hex.z;
    vec2 cellCoord = hexUv - hex.xy;
    float cellRand = hash21(floor(cellCoord));

    // Crisp hex border lines with inner wireframe glow
    float borderLine = smoothstep(0.065, 0.015, edgeDist) * 1.8;
    float innerGlow = smoothstep(0.35, 0.02, edgeDist) * 0.35;

    // Individual cell brightness pulsing
    float cellPulse = sin(uTime * 2.4 + cellRand * 6.28) * 0.5 + 0.5;
    float cellFill = (cellRand > 0.42 ? 0.35 * cellPulse : 0.08) * smoothstep(0.02, 0.2, edgeDist);

    // Vertical sweeping laser scan wave
    float scanPos = fract(uTime * uScanlineSpeed * 0.18);
    float scanBeam = smoothstep(0.09, 0.0, abs(vUv.y - scanPos)) * 2.5;

    // Arch perimeter rim illumination
    float rimFalloff = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x)
                     * smoothstep(0.0, 0.06, vUv.y);

    // Flicker modulation
    float flicker = (sin(uTime * 42.0 + vUv.y * 30.0) * 0.12 + 0.88) * uFlicker;

    // Honeycomb disintegrating dissolution wave
    float dissolveWave = smoothstep(0.0, 1.0, uDissolveProgress);
    float dissolveCutoff = cellRand * 0.6 + length(vUv - vec2(0.5, 0.4)) * 0.8;
    float dissolveMask = 1.0 - smoothstep(dissolveWave - 0.2, dissolveWave + 0.2, dissolveCutoff);

    // Total intensity
    float baseIntensity = (borderLine + innerGlow + cellFill + scanBeam + 0.12) * flicker * rimFalloff;
    float alpha = clamp(baseIntensity * uOpacity * dissolveMask, 0.0, 1.0);

    // Color gradient: warm fiery amber/orange or cyber cyan with bright white highlights
    vec3 baseColor = uColor;
    vec3 highlightColor = mix(baseColor, vec3(1.0, 0.95, 0.85), clamp(scanBeam * 0.7 + borderLine * 0.3, 0.0, 1.0));

    // Flash white if strobe flicker is active
    if (uFlicker > 1.4) {
      highlightColor = mix(highlightColor, vec3(1.0), 0.5);
    }

    gl_FragColor = vec4(highlightColor, alpha);
  }
`;

/**
 * Procedural 3D Virtual Classroom Prerequisite Doorway & Barrier Factory
 * Faithful reconstruction from `asstesimages/classroom_doorway.png`:
 * - Fluted wooden pilasters with stepped base plinths & molded capitals
 * - Ivory / cream arched casing contouring the portal opening
 * - Brass ornamental structural brackets in upper corners
 * - Polished brass floor threshold plate with technical engraving
 * - Overhead digital LED marquee status screen with dot-matrix text
 * - Glowing hexagonal honeycomb energy barrier forcefield with shockwave dissolve
 */
export function createPrerequisiteDoorModel(options: PrerequisiteDoorModelOptions = {}): PrerequisiteDoorModel {
  const {
    wingId = 'recursion_lab',
    wingName = 'Recursion Lab',
    isSealed = true,
    requiredText = 'Req: Stack >= 70%',
    currentText = 'Current: 38%',
  } = options;

  const root = new THREE.Group();
  root.name = `PrerequisiteDoor_${wingId}`;

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

  // --- PALETTE (Authentic to classroom_doorway.png) ---
  const COLORS = {
    woodOak: '#ba8c59',
    woodOakDark: '#8a5c30',
    woodOakGrain: '#73461e',
    creamArch: '#f8f3ea',
    creamArchTrim: '#ebe2d3',
    brassGold: '#d8aa46',
    brassDark: '#997322',
    brassHighlight: '#ffdd77',
    screenBezel: '#181512',
    screenBg: '#080705',
    barrierAmber: '#ff6a00',
    barrierUnlocked: '#00f0ff',
    particleShockwave: '#ffaa00',
  };

  // --- PROCEDURAL WOOD TEXTURE ---
  function createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = COLORS.woodOak;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fine wood grain streaks
      ctx.fillStyle = 'rgba(115, 70, 30, 0.15)';
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * canvas.width;
        const w = 2 + Math.random() * 8;
        ctx.fillRect(x, 0, w, canvas.height);
      }

      // Vertical plank shading lines
      ctx.strokeStyle = 'rgba(90, 50, 20, 0.25)';
      ctx.lineWidth = 2;
      for (let x = 32; x < canvas.width; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    return tex;
  }

  // --- PROCEDURAL DIGITAL LED DOT-MATRIX TEXTURE ---
  let ledTexture: THREE.CanvasTexture | null = null;
  let ledCanvas: HTMLCanvasElement | null = null;
  let currentStatusState = {
    wingName,
    isSealed,
    requiredText,
    currentText,
  };

  function createLedScreenCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    return canvas;
  }

  function renderLedScreen() {
    if (!ledCanvas) return;
    const ctx = ledCanvas.getContext('2d');
    if (!ctx) return;

    const w = ledCanvas.width;
    const h = ledCanvas.height;

    // Dark glossy chassis background
    ctx.fillStyle = COLORS.screenBg;
    ctx.fillRect(0, 0, w, h);

    // Dot matrix grid pattern overlay (faint background dots)
    const dotSpacing = 8;
    ctx.fillStyle = 'rgba(45, 35, 25, 0.45)';
    for (let x = 6; x < w; x += dotSpacing) {
      for (let y = 6; y < h; y += dotSpacing) {
        ctx.fillRect(x, y, 2.5, 2.5);
      }
    }

    // Border trim frame
    ctx.strokeStyle = currentStatusState.isSealed ? '#885500' : '#006655';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Status colors
    const isLocked = currentStatusState.isSealed;
    const primaryColor = isLocked ? '#ffb300' : '#00f0ff';
    const accentColor = isLocked ? '#ff3b30' : '#34c759';

    // Top Header: Wing Name & Status Badge
    ctx.font = 'bold 54px monospace';
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 12;
    const statusTag = isLocked ? '[LOCKED]' : '[ACCESS GRANTED]';
    const headerText = `${currentStatusState.wingName.toUpperCase()} ${statusTag}`;
    ctx.fillText(headerText, 32, 85);

    // Bottom Subtitle: Prerequisite Requirements & Current Mastery
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = isLocked ? '#ffcc66' : '#a3f7bf';
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 8;
    const subText = `${currentStatusState.requiredText} | ${currentStatusState.currentText}`;
    ctx.fillText(subText, 32, 175);

    // Decorative LED corner indicators
    ctx.fillStyle = accentColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(w - 45, 80, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    if (ledTexture) {
      ledTexture.needsUpdate = true;
    }
  }

  ledCanvas = createLedScreenCanvas();
  renderLedScreen();
  ledTexture = trackTexture(new THREE.CanvasTexture(ledCanvas));

  // --- MATERIALS ---
  const woodTexture = createWoodTexture();
  const woodMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.55,
      metalness: 0.1,
    })
  );

  const creamArchMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.creamArch,
      roughness: 0.45,
      metalness: 0.05,
    })
  );

  const brassMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.brassGold,
      roughness: 0.28,
      metalness: 0.88,
    })
  );

  const ledScreenMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: ledTexture,
    })
  );

  const screenBezelMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.screenBezel,
      roughness: 0.35,
      metalness: 0.8,
    })
  );

  // --- 1. OUTER WOODEN PILASTERS & PLINTHS ---
  const pillarGroup = new THREE.Group();
  pillarGroup.name = 'WoodenPilasters';
  root.add(pillarGroup);

  const pillarX = 2.15; // Centered at +/- 2.15 (portal opening width ~3.5)
  const pillarWidth = 0.65;
  const pillarDepth = 0.8;
  const pillarHeight = 5.4;

  [-pillarX, pillarX].forEach((x) => {
    // A. Stepped Base Plinth (Pedestal)
    const baseBottom = new THREE.Mesh(
      trackGeometry(new THREE.BoxGeometry(0.9, 0.35, 1.05)),
      woodMaterial
    );
    baseBottom.position.set(x, 0.175, 0);
    baseBottom.castShadow = true;
    baseBottom.receiveShadow = true;
    pillarGroup.add(baseBottom);

    const baseMid = new THREE.Mesh(
      trackGeometry(new THREE.BoxGeometry(0.78, 0.4, 0.92)),
      woodMaterial
    );
    baseMid.position.set(x, 0.55, 0);
    baseMid.castShadow = true;
    baseMid.receiveShadow = true;
    pillarGroup.add(baseMid);

    // B. Vertical Pillar Shaft
    const shaft = new THREE.Mesh(
      trackGeometry(new THREE.BoxGeometry(pillarWidth, pillarHeight - 1.2, pillarDepth)),
      woodMaterial
    );
    shaft.position.set(x, 0.75 + (pillarHeight - 1.2) / 2, 0);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    pillarGroup.add(shaft);

    // Vertical carved channel groove on front face
    const groove = new THREE.Mesh(
      trackGeometry(new THREE.BoxGeometry(0.25, pillarHeight - 1.8, 0.05)),
      woodMaterial
    );
    groove.position.set(x, 2.8, pillarDepth / 2 + 0.01);
    pillarGroup.add(groove);

    // C. Upper Pillar Capital (Molding before lintel)
    const capital = new THREE.Mesh(
      trackGeometry(new THREE.BoxGeometry(0.8, 0.3, 0.95)),
      woodMaterial
    );
    capital.position.set(x, pillarHeight - 0.25, 0);
    capital.castShadow = true;
    pillarGroup.add(capital);
  });

  // --- 2. UPPER WOODEN ENTABLATURE & CROWN PEDIMENT ---
  const entablature = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(5.2, 0.5, 0.95)),
    woodMaterial
  );
  entablature.position.set(0, 5.35, 0);
  entablature.castShadow = true;
  root.add(entablature);

  // Stepped crown pediment molding on top
  const crownPediment = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(4.6, 0.35, 0.8)),
    woodMaterial
  );
  crownPediment.position.set(0, 5.75, 0);
  crownPediment.castShadow = true;
  root.add(crownPediment);

  // --- 3. INNER IVORY / CREAM ARCHED CASING ---
  const archGroup = new THREE.Group();
  archGroup.name = 'CreamArchwayCasing';
  root.add(archGroup);

  // Left & Right cream jambs
  const jambWidth = 0.32;
  const jambDepth = 0.72;
  const jambHeight = 3.6;
  const innerLeftX = -1.68;
  const innerRightX = 1.68;

  const leftJamb = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(jambWidth, jambHeight, jambDepth)),
    creamArchMaterial
  );
  leftJamb.position.set(innerLeftX, jambHeight / 2 + 0.1, 0);
  leftJamb.castShadow = true;
  leftJamb.receiveShadow = true;
  archGroup.add(leftJamb);

  const rightJamb = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(jambWidth, jambHeight, jambDepth)),
    creamArchMaterial
  );
  rightJamb.position.set(innerRightX, jambHeight / 2 + 0.1, 0);
  rightJamb.castShadow = true;
  rightJamb.receiveShadow = true;
  archGroup.add(rightJamb);

  // Curved upper arch casing using curved Torus arc segments
  const archRadius = 1.68;
  const archTube = 0.18;
  const archTorus = new THREE.Mesh(
    trackGeometry(new THREE.TorusGeometry(archRadius, archTube, 16, 32, Math.PI)),
    creamArchMaterial
  );
  archTorus.position.set(0, jambHeight + 0.1, 0);
  archTorus.castShadow = true;
  archGroup.add(archTorus);

  // Inner beveled casing reveal filling the arch header
  const archBacking = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(3.36, 0.45, jambDepth * 0.9)),
    creamArchMaterial
  );
  archBacking.position.set(0, 4.95, 0);
  archGroup.add(archBacking);

  // --- 4. BRASS ORNAMENTAL HARDWARE & CORNER BRACKETS ---
  const brassGroup = new THREE.Group();
  brassGroup.name = 'BrassHardware';
  root.add(brassGroup);

  // A. Polished Brass Floor Threshold Plate
  const thresholdPlate = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(3.8, 0.06, 0.85)),
    brassMaterial
  );
  thresholdPlate.position.set(0, 0.03, 0);
  thresholdPlate.receiveShadow = true;
  brassGroup.add(thresholdPlate);

  // Engraved threshold center strip
  const thresholdStrip = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(3.2, 0.015, 0.3)),
    brassMaterial
  );
  thresholdStrip.position.set(0, 0.065, 0);
  brassGroup.add(thresholdStrip);

  // B. Ornamental Structural Corner Brackets (Inner & Outer)
  [-1, 1].forEach((dir) => {
    // Inner arch bracket
    const innerBracket = new THREE.Mesh(
      trackGeometry(new THREE.BoxGeometry(0.12, 0.65, 0.3)),
      brassMaterial
    );
    innerBracket.position.set(dir * 1.5, 3.8, 0.38);
    innerBracket.rotation.z = dir * 0.4;
    brassGroup.add(innerBracket);

    // Decorative outer scrollwork bracket (as seen in classroom_doorway.png)
    const outerBracket = new THREE.Mesh(
      trackGeometry(new THREE.BoxGeometry(0.1, 0.85, 0.35)),
      brassMaterial
    );
    outerBracket.position.set(dir * 2.5, 4.7, 0.35);
    outerBracket.rotation.z = -dir * 0.2;
    brassGroup.add(outerBracket);
  });

  // --- 5. OVERHEAD DIGITAL LED STATUS MARQUEE ---
  const ledGroup = new THREE.Group();
  ledGroup.name = 'LedStatusMarquee';
  root.add(ledGroup);

  // Brass enclosure frame
  const ledFrame = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(3.5, 0.72, 0.22)),
    brassMaterial
  );
  ledFrame.position.set(0, 5.4, 0.42);
  ledGroup.add(ledFrame);

  // Screen bezel backplate
  const ledBezel = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(3.38, 0.62, 0.05)),
    screenBezelMaterial
  );
  ledBezel.position.set(0, 5.4, 0.52);
  ledGroup.add(ledBezel);

  // Emissive LED Dot-Matrix Display Screen
  const ledMesh = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(3.32, 0.56)),
    ledScreenMaterial
  );
  ledMesh.position.set(0, 5.4, 0.55);
  ledGroup.add(ledMesh);

  // Status indicator light
  const ledLight = new THREE.PointLight(
    isSealed ? '#ff9900' : '#00f0ff',
    isSealed ? 1.8 : 1.2,
    5.0
  );
  ledLight.position.set(0, 5.4, 0.8);
  ledGroup.add(ledLight);

  // --- 6. HEXAGONAL HONEYCOMB FORCEFIELD BARRIER ---
  const barrierGroup = new THREE.Group();
  barrierGroup.name = 'HexagonalForcefield';
  root.add(barrierGroup);

  const barrierWidth = 3.4;
  const barrierHeight = 5.1;
  const barrierGeometry = trackGeometry(new THREE.PlaneGeometry(barrierWidth, barrierHeight, 32, 32));

  const barrierUniforms = {
    uTime: { value: 0 },
    uOpacity: { value: isSealed ? 1.0 : 0.0 },
    uColor: { value: new THREE.Color(isSealed ? COLORS.barrierAmber : COLORS.barrierUnlocked) },
    uScanlineSpeed: { value: 1.8 },
    uFlicker: { value: 1.0 },
    uDissolveProgress: { value: 0.0 },
  };

  const barrierMaterial = trackMaterial(
    new THREE.ShaderMaterial({
      vertexShader: hexVertexShader,
      fragmentShader: hexFragmentShader,
      uniforms: barrierUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );

  const barrierMesh = new THREE.Mesh(barrierGeometry, barrierMaterial);
  // Center plane in the opening (from y = 0 to 5.1)
  barrierMesh.position.set(0, barrierHeight / 2 + 0.08, 0);
  barrierGroup.add(barrierMesh);

  // Ambient barrier rim light
  const barrierLight = new THREE.PointLight(
    isSealed ? COLORS.barrierAmber : COLORS.barrierUnlocked,
    isSealed ? 2.5 : 0.0,
    7.5
  );
  barrierLight.position.set(0, 2.6, 0.4);
  barrierGroup.add(barrierLight);

  // --- 7. RADIAL SHOCKWAVE PARTICLE SYSTEM ---
  const particlePos = new Float32Array(PARTICLE_COUNT * 3);
  const particleVel = new Float32Array(PARTICLE_COUNT * 3);
  const particleInit = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const px = (Math.random() - 0.5) * (barrierWidth * 0.9);
    const py = (Math.random() - 0.5) * (barrierHeight * 0.85);
    const pz = (Math.random() - 0.5) * 0.2;

    particlePos[i * 3] = px;
    particlePos[i * 3 + 1] = py;
    particlePos[i * 3 + 2] = pz;

    particleInit[i * 3] = px;
    particleInit[i * 3 + 1] = py;
    particleInit[i * 3 + 2] = pz;

    const angle = Math.atan2(py, px) + (Math.random() - 0.5) * 0.4;
    const speed = 3.2 + Math.random() * 5.8;

    particleVel[i * 3] = Math.cos(angle) * speed;
    particleVel[i * 3 + 1] = Math.sin(angle) * speed + Math.random() * 2.2;
    particleVel[i * 3 + 2] = (Math.random() - 0.35) * 4.8;
  }

  const particleGeometry = trackGeometry(new THREE.BufferGeometry());
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

  const particleMaterial = trackMaterial(
    new THREE.PointsMaterial({
      color: COLORS.particleShockwave,
      size: 0.22,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
  particlePoints.position.set(0, barrierHeight / 2 + 0.08, 0);
  particlePoints.visible = false;
  barrierGroup.add(particlePoints);

  // State trackers
  let shockwaveActive = false;
  let shockwaveTime = 0;
  let currentOpacity = isSealed ? 1.0 : 0.0;
  let targetOpacity = isSealed ? 1.0 : 0.0;

  function triggerShockwave() {
    shockwaveActive = true;
    shockwaveTime = 0;

    const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
    posAttr.copyArray(particleInit);
    posAttr.needsUpdate = true;
    particlePoints.visible = true;
  }

  function setSealed(sealed: boolean) {
    currentStatusState.isSealed = sealed;
    targetOpacity = sealed ? 1.0 : 0.0;
    renderLedScreen();
    ledLight.color.set(sealed ? '#ff9900' : '#00f0ff');
    barrierLight.color.set(sealed ? COLORS.barrierAmber : COLORS.barrierUnlocked);
    barrierUniforms.uColor.value.set(sealed ? COLORS.barrierAmber : COLORS.barrierUnlocked);
  }

  function updateStatus(params: {
    wingId?: string;
    wingName?: string;
    isSealed?: boolean;
    requiredText?: string;
    currentText?: string;
  }) {
    if (params.wingName !== undefined) currentStatusState.wingName = params.wingName;
    if (params.isSealed !== undefined) {
      currentStatusState.isSealed = params.isSealed;
      targetOpacity = params.isSealed ? 1.0 : 0.0;
      ledLight.color.set(params.isSealed ? '#ff9900' : '#00f0ff');
      barrierLight.color.set(params.isSealed ? COLORS.barrierAmber : COLORS.barrierUnlocked);
      barrierUniforms.uColor.value.set(params.isSealed ? COLORS.barrierAmber : COLORS.barrierUnlocked);
    }
    if (params.requiredText !== undefined) currentStatusState.requiredText = params.requiredText;
    if (params.currentText !== undefined) currentStatusState.currentText = params.currentText;

    renderLedScreen();
  }

  function update(delta: number, dissolvePhase?: string, isDissolving?: boolean) {
    barrierUniforms.uTime.value += delta;

    // Handle dissolve phase states
    if (isDissolving && dissolvePhase === 'flicker') {
      const strobe = Math.sin(performance.now() * 0.06) > 0;
      barrierUniforms.uScanlineSpeed.value = 16.0;
      barrierUniforms.uFlicker.value = 2.2 + Math.sin(performance.now() * 0.1) * 0.8;
      barrierUniforms.uColor.value.set(strobe ? '#ffffff' : COLORS.barrierAmber);
      barrierLight.color.set(strobe ? '#ffffff' : COLORS.barrierAmber);
      barrierLight.intensity = 5.0;
      currentOpacity = strobe ? 1.4 : 0.35;
      barrierUniforms.uDissolveProgress.value = 0.15;
    } else if (isDissolving && dissolvePhase === 'shockwave') {
      if (!shockwaveActive) {
        triggerShockwave();
      }
      barrierUniforms.uScanlineSpeed.value = 8.0;
      barrierUniforms.uFlicker.value = 1.4;
      barrierUniforms.uDissolveProgress.value = Math.min(1.0, barrierUniforms.uDissolveProgress.value + delta * 2.0);
      currentOpacity = THREE.MathUtils.lerp(currentOpacity, 0.0, delta * 8.0);
      barrierLight.intensity = Math.max(0, (1.0 - shockwaveTime / 2.5) * 3.5);
    } else {
      currentOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, delta * 4.5);
      barrierUniforms.uScanlineSpeed.value = 1.8;
      barrierUniforms.uFlicker.value = 1.0;
      barrierUniforms.uDissolveProgress.value = targetOpacity === 0.0 ? 1.0 : 0.0;
      barrierLight.intensity = currentOpacity * 2.2;
    }

    barrierUniforms.uOpacity.value = currentOpacity;
    barrierMesh.visible = currentOpacity > 0.01;

    // Simulate particle shockwave physics
    if (shockwaveActive) {
      shockwaveTime += delta;
      const duration = 2.8;

      if (shockwaveTime < duration) {
        const positions = particleGeometry.attributes.position.array as Float32Array;
        const drag = Math.max(0.25, 1.0 - delta * 0.85);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const idx = i * 3;
          particleVel[idx] *= drag;
          particleVel[idx + 1] *= drag;
          particleVel[idx + 2] *= drag;

          positions[idx] += particleVel[idx] * delta;
          positions[idx + 1] += particleVel[idx + 1] * delta;
          positions[idx + 2] += particleVel[idx + 2] * delta;
        }

        particleGeometry.attributes.position.needsUpdate = true;
        particleMaterial.opacity = Math.max(0, 1.0 - Math.pow(shockwaveTime / duration, 1.4));
        particleMaterial.size = 0.22 * (1.0 + shockwaveTime * 0.7);
        particlePoints.visible = true;
      } else {
        shockwaveActive = false;
        particlePoints.visible = false;
      }
    }
  }

  function dispose() {
    disposables.geometries.forEach((g) => g.dispose());
    disposables.materials.forEach((m) => m.dispose());
    disposables.textures.forEach((t) => t.dispose());
  }

  return {
    group: root,
    barrierMesh,
    ledMesh,
    updateStatus,
    update,
    setSealed,
    triggerShockwave,
    dispose,
  };
}
