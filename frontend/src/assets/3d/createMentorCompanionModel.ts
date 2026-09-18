import * as THREE from 'three';

export type MentorExpression = 'happy' | 'blink' | 'curious' | 'talking' | 'remedial';

export interface MentorCompanionModelOptions {
  initialExpression?: MentorExpression;
  isRemedial?: boolean;
}

export interface MentorCompanionUpdateState {
  targetPosition?: [number, number, number] | null;
  isSpeaking?: boolean;
  isRemedial?: boolean;
  isNear?: boolean;
}

export interface MentorCompanionModelRig {
  group: THREE.Group;
  pedestalGroup: THREE.Group;
  floatingBodyGroup: THREE.Group;
  headGroup: THREE.Group;
  antennaGroup: THREE.Group;
  hoverRingsGroup: THREE.Group;
  antennaLight: THREE.PointLight;
  setExpression: (expr: MentorExpression) => void;
  getExpression: () => MentorExpression;
  update: (delta: number, state?: MentorCompanionUpdateState) => void;
  dispose: () => void;
}

/**
 * Procedural 3D Friendly Mentor Companion Bot Factory
 * Faithful high-fidelity reconstruction from `asstesimages/mentor_bot.png`:
 * - Layered oak wood desk pedestal plinth with polished brass rim base
 * - Concentric glowing cyan hover rings floating beneath the body
 * - Rounded creamy off-white molded plastic torso shell
 * - Curved warm oak wood side flank panels with brass edge trims
 * - Polished brass neck swivel collar
 * - Rounded off-white head helmet assembly
 * - Polished brass visor aperture frame
 * - Curved dark glossy screen with dynamic canvas glowing cyan expressions (^ _ ^, blink, curious, talking)
 * - Round brass ear dials with warm oak wood inset cores
 * - Flexible coiled brass gooseneck antenna with warm-amber glowing bulb finial
 * - Smooth head tilt/yaw player tracking and gentle idle floating bob
 */
export function createMentorCompanionModel(
  options: MentorCompanionModelOptions = {}
): MentorCompanionModelRig {
  const { initialExpression = 'happy', isRemedial = false } = options;

  const root = new THREE.Group();
  root.name = 'MentorCompanionBot';

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

  // --- PALETTE & FINISHES ---
  const PALETTE = {
    shellOffWhite: '#f5f2eb',
    shellShading: '#e7e2d6',
    brassGold: '#d4af37',
    brassDark: '#a17c18',
    woodOak: '#b88a57',
    woodOakDark: '#8a5e30',
    visorGlass: '#070b14',
    cyanGlow: '#00f0ff',
    cyanBright: '#7df9ff',
    violetGlow: '#c084fc',
    amberBulb: '#f59e0b',
    amberBright: '#fef08a',
  };

  // --- PROCEDURAL CANVAS TEXTURES ---

  // Oak Wood Texture for Plinth & Ear/Flank Inserts
  function createOakWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = PALETTE.woodOak;
      ctx.fillRect(0, 0, 512, 512);

      // Wood grain streaks
      ctx.strokeStyle = PALETTE.woodOakDark;
      ctx.lineWidth = 2;
      for (let i = 0; i < 48; i++) {
        const y = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(
          128,
          y + (Math.random() - 0.5) * 30,
          384,
          y + (Math.random() - 0.5) * 30,
          512,
          y + (Math.random() - 0.5) * 15
        );
        ctx.stroke();
      }

      // Subtle warm grain pores
      ctx.fillStyle = 'rgba(100, 60, 20, 0.08)';
      for (let i = 0; i < 120; i++) {
        const px = Math.random() * 512;
        const py = Math.random() * 512;
        ctx.fillRect(px, py, 2 + Math.random() * 8, 1);
      }
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  const oakWoodTexture = createOakWoodTexture();

  // Face Expression Canvas (512x512)
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 512;
  faceCanvas.height = 512;
  const faceCtx = faceCanvas.getContext('2d');
  const faceTexture = trackTexture(new THREE.CanvasTexture(faceCanvas));

  let currentExpression: MentorExpression = initialExpression;
  let activeRemedial = isRemedial;
  let speechAnimFrame = 0;

  function renderFaceExpression(expr: MentorExpression, talkPhase: number = 0) {
    if (!faceCtx) return;

    faceCtx.clearRect(0, 0, 512, 512);

    // Deep dark visor background
    faceCtx.fillStyle = PALETTE.visorGlass;
    faceCtx.fillRect(0, 0, 512, 512);

    const glowColor = activeRemedial ? PALETTE.violetGlow : PALETTE.cyanGlow;
    const brightColor = activeRemedial ? '#f5d0fe' : PALETTE.cyanBright;

    faceCtx.shadowColor = glowColor;
    faceCtx.shadowBlur = 18;
    faceCtx.fillStyle = brightColor;
    faceCtx.strokeStyle = brightColor;
    faceCtx.lineWidth = 14;
    faceCtx.lineCap = 'round';
    faceCtx.lineJoin = 'round';

    const eyeY = 240;
    const leftEyeX = 175;
    const rightEyeX = 337;

    switch (expr) {
      case 'happy': {
        // Cheerful upward arches: ^   ^
        // Left eye
        faceCtx.beginPath();
        faceCtx.moveTo(leftEyeX - 45, eyeY + 20);
        faceCtx.lineTo(leftEyeX, eyeY - 26);
        faceCtx.lineTo(leftEyeX + 45, eyeY + 20);
        faceCtx.stroke();

        // Right eye
        faceCtx.beginPath();
        faceCtx.moveTo(rightEyeX - 45, eyeY + 20);
        faceCtx.lineTo(rightEyeX, eyeY - 26);
        faceCtx.lineTo(rightEyeX + 45, eyeY + 20);
        faceCtx.stroke();

        // Sweet subtle dash mouth
        faceCtx.beginPath();
        faceCtx.moveTo(236, 335);
        faceCtx.lineTo(276, 335);
        faceCtx.stroke();

        // Blush cheeks
        faceCtx.fillStyle = activeRemedial ? 'rgba(232, 121, 249, 0.45)' : 'rgba(0, 240, 255, 0.35)';
        faceCtx.beginPath();
        faceCtx.arc(leftEyeX - 15, eyeY + 50, 16, 0, Math.PI * 2);
        faceCtx.arc(rightEyeX + 15, eyeY + 50, 16, 0, Math.PI * 2);
        faceCtx.fill();
        break;
      }

      case 'blink': {
        // Closed horizontal eye slits: —   —
        faceCtx.beginPath();
        faceCtx.moveTo(leftEyeX - 42, eyeY);
        faceCtx.lineTo(leftEyeX + 42, eyeY);
        faceCtx.stroke();

        faceCtx.beginPath();
        faceCtx.moveTo(rightEyeX - 42, eyeY);
        faceCtx.lineTo(rightEyeX + 42, eyeY);
        faceCtx.stroke();

        faceCtx.beginPath();
        faceCtx.moveTo(242, 335);
        faceCtx.lineTo(270, 335);
        faceCtx.stroke();
        break;
      }

      case 'curious': {
        // One wide open eye, one inquisitive brow: o   ^
        // Left Eye: Round curious circle
        faceCtx.beginPath();
        faceCtx.arc(leftEyeX, eyeY, 32, 0, Math.PI * 2);
        faceCtx.stroke();

        // Left pupil highlight
        faceCtx.beginPath();
        faceCtx.arc(leftEyeX + 8, eyeY - 8, 10, 0, Math.PI * 2);
        faceCtx.fill();

        // Right Eye: Inquisitive arch
        faceCtx.beginPath();
        faceCtx.moveTo(rightEyeX - 40, eyeY + 16);
        faceCtx.lineTo(rightEyeX, eyeY - 32);
        faceCtx.lineTo(rightEyeX + 40, eyeY + 16);
        faceCtx.stroke();

        // Small curious tilted mouth
        faceCtx.beginPath();
        faceCtx.arc(256, 325, 14, 0.2, Math.PI - 0.2);
        faceCtx.stroke();
        break;
      }

      case 'talking': {
        // Animated speaking mouth with open happy eyes
        faceCtx.beginPath();
        faceCtx.moveTo(leftEyeX - 45, eyeY + 15);
        faceCtx.lineTo(leftEyeX, eyeY - 26);
        faceCtx.lineTo(leftEyeX + 45, eyeY + 15);
        faceCtx.stroke();

        faceCtx.beginPath();
        faceCtx.moveTo(rightEyeX - 45, eyeY + 15);
        faceCtx.lineTo(rightEyeX, eyeY - 26);
        faceCtx.lineTo(rightEyeX + 45, eyeY + 15);
        faceCtx.stroke();

        // Dynamic mouth based on talkPhase (0 to 1)
        const mouthH = 10 + Math.sin(talkPhase * Math.PI * 2) * 18;
        faceCtx.beginPath();
        faceCtx.ellipse(256, 335, 26, Math.max(6, mouthH), 0, 0, Math.PI * 2);
        faceCtx.fill();
        break;
      }

      case 'remedial': {
        // Empathetic caring mentor expression
        faceCtx.beginPath();
        faceCtx.arc(leftEyeX, eyeY + 10, 36, Math.PI * 1.05, Math.PI * 1.95);
        faceCtx.stroke();

        faceCtx.beginPath();
        faceCtx.arc(rightEyeX, eyeY + 10, 36, Math.PI * 1.05, Math.PI * 1.95);
        faceCtx.stroke();

        // Reassuring warm smile
        faceCtx.beginPath();
        faceCtx.arc(256, 315, 24, 0.2, Math.PI - 0.2);
        faceCtx.stroke();

        // Soft caring blush
        faceCtx.fillStyle = 'rgba(232, 121, 249, 0.35)';
        faceCtx.beginPath();
        faceCtx.arc(leftEyeX - 15, eyeY + 45, 14, 0, Math.PI * 2);
        faceCtx.arc(rightEyeX + 15, eyeY + 45, 14, 0, Math.PI * 2);
        faceCtx.fill();
        break;
      }
    }

    // Reset shadow blur
    faceCtx.shadowBlur = 0;
    faceTexture.needsUpdate = true;
  }

  // Initial draw
  renderFaceExpression(currentExpression);

  // --- MATERIALS ---
  const shellMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: PALETTE.shellOffWhite,
      roughness: 0.32,
      metalness: 0.08,
    })
  );

  const brassMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: PALETTE.brassGold,
      roughness: 0.24,
      metalness: 0.88,
    })
  );

  const brassDarkMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: PALETTE.brassDark,
      roughness: 0.35,
      metalness: 0.8,
    })
  );

  const woodOakMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      map: oakWoodTexture,
      roughness: 0.58,
      metalness: 0.05,
    })
  );

  const visorMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      map: faceTexture,
      roughness: 0.1,
      metalness: 0.3,
      emissive: PALETTE.cyanGlow,
      emissiveMap: faceTexture,
      emissiveIntensity: 0.95,
    })
  );

  const hoverRingMat1 = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: PALETTE.cyanGlow,
      transparent: true,
      opacity: 0.85,
    })
  );

  const hoverRingMat2 = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: PALETTE.cyanBright,
      transparent: true,
      opacity: 0.65,
    })
  );

  const amberBulbMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: PALETTE.amberBright,
      emissive: PALETTE.amberBulb,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.2,
    })
  );

  // --- 1. DESKTOP PEDESTAL BASE ---
  // Sits directly on desk surface at local Y=0
  const pedestalGroup = new THREE.Group();
  pedestalGroup.name = 'BotPedestalBase';
  root.add(pedestalGroup);

  // Bottom Brass Rim Plinth Plate
  const baseBrassGeo = trackGeometry(new THREE.CylinderGeometry(0.36, 0.40, 0.035, 32));
  const baseBrassMesh = new THREE.Mesh(baseBrassGeo, brassMat);
  baseBrassMesh.position.set(0, 0.0175, 0);
  baseBrassMesh.castShadow = true;
  baseBrassMesh.receiveShadow = true;
  pedestalGroup.add(baseBrassMesh);

  // Layered Warm Oak Circular Plinth Inset
  const baseWoodGeo = trackGeometry(new THREE.CylinderGeometry(0.33, 0.34, 0.04, 32));
  const baseWoodMesh = new THREE.Mesh(baseWoodGeo, woodOakMat);
  baseWoodMesh.position.set(0, 0.045, 0);
  baseWoodMesh.castShadow = true;
  baseWoodMesh.receiveShadow = true;
  pedestalGroup.add(baseWoodMesh);

  // Inner Brass Stepped Collar Rim
  const baseStepGeo = trackGeometry(new THREE.CylinderGeometry(0.25, 0.27, 0.02, 32));
  const baseStepMesh = new THREE.Mesh(baseStepGeo, brassMat);
  baseStepMesh.position.set(0, 0.07, 0);
  pedestalGroup.add(baseStepMesh);

  // Central Recessed Hover Emitter Well
  const baseWellGeo = trackGeometry(new THREE.CylinderGeometry(0.18, 0.16, 0.015, 24));
  const baseWellMesh = new THREE.Mesh(
    baseWellGeo,
    trackMaterial(new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.3, metalness: 0.8 }))
  );
  baseWellMesh.position.set(0, 0.078, 0);
  pedestalGroup.add(baseWellMesh);

  // Emitter Luminous Glow Ring on Pedestal Surface
  const emitterHaloGeo = trackGeometry(new THREE.RingGeometry(0.11, 0.16, 32));
  const emitterHaloMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: PALETTE.cyanGlow,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    })
  );
  const emitterHaloMesh = new THREE.Mesh(emitterHaloGeo, emitterHaloMat);
  emitterHaloMesh.rotation.x = -Math.PI / 2;
  emitterHaloMesh.position.set(0, 0.086, 0);
  pedestalGroup.add(emitterHaloMesh);

  // --- 2. FLOATING ENERGY HOVER RINGS ---
  const hoverRingsGroup = new THREE.Group();
  hoverRingsGroup.name = 'HoverEnergyRings';
  hoverRingsGroup.position.set(0, 0.16, 0);
  root.add(hoverRingsGroup);

  // Lower Floating Cyan Ring
  const lowerRingGeo = trackGeometry(new THREE.TorusGeometry(0.20, 0.012, 16, 48));
  const lowerRingMesh = new THREE.Mesh(lowerRingGeo, hoverRingMat1);
  lowerRingMesh.rotation.x = Math.PI / 2;
  hoverRingsGroup.add(lowerRingMesh);

  // Upper Floating Cyan Ring
  const upperRingGeo = trackGeometry(new THREE.TorusGeometry(0.15, 0.010, 16, 48));
  const upperRingMesh = new THREE.Mesh(upperRingGeo, hoverRingMat2);
  upperRingMesh.rotation.x = Math.PI / 2;
  upperRingMesh.position.set(0, 0.07, 0);
  hoverRingsGroup.add(upperRingMesh);

  // --- 3. FLOATING BODY ASSEMBLY ---
  // Hovers above the pedestal plinth with gentle idle floating bob
  const floatingBodyGroup = new THREE.Group();
  floatingBodyGroup.name = 'BotFloatingBody';
  floatingBodyGroup.position.set(0, 0.42, 0);
  root.add(floatingBodyGroup);

  // Torso Main Egg/Capsule Shell
  // Built from a smooth capsule geometry
  const bodyShellGeo = trackGeometry(new THREE.CapsuleGeometry(0.20, 0.16, 16, 32));
  const bodyShellMesh = new THREE.Mesh(bodyShellGeo, shellMat);
  bodyShellMesh.position.set(0, 0.12, 0);
  bodyShellMesh.castShadow = true;
  bodyShellMesh.receiveShadow = true;
  floatingBodyGroup.add(bodyShellMesh);

  // Torso Lower Brass Rim Ring
  const bodyBrassRimGeo = trackGeometry(new THREE.TorusGeometry(0.18, 0.012, 16, 32));
  const bodyBrassRimMesh = new THREE.Mesh(bodyBrassRimGeo, brassMat);
  bodyBrassRimMesh.rotation.x = Math.PI / 2;
  bodyBrassRimMesh.position.set(0, 0.02, 0);
  floatingBodyGroup.add(bodyBrassRimMesh);

  // Warm Oak Wood Flank Panels (Left & Right Wings)
  function createFlankPanel(side: number): THREE.Group {
    const flankGroup = new THREE.Group();
    flankGroup.position.set(side * 0.20, 0.12, 0);

    // Brass Backing Rim
    const brassTrimGeo = trackGeometry(new THREE.CylinderGeometry(0.12, 0.12, 0.035, 24));
    const brassTrimMesh = new THREE.Mesh(brassTrimGeo, brassMat);
    brassTrimMesh.rotation.z = Math.PI / 2;
    flankGroup.add(brassTrimMesh);

    // Warm Oak Wood Inset Disc
    const woodCoreGeo = trackGeometry(new THREE.CylinderGeometry(0.105, 0.105, 0.042, 24));
    const woodCoreMesh = new THREE.Mesh(woodCoreGeo, woodOakMat);
    woodCoreMesh.rotation.z = Math.PI / 2;
    flankGroup.add(woodCoreMesh);

    return flankGroup;
  }

  floatingBodyGroup.add(createFlankPanel(-1));
  floatingBodyGroup.add(createFlankPanel(1));

  // Torso Chest Status Core / Emblem
  const chestCoreGeo = trackGeometry(new THREE.CylinderGeometry(0.045, 0.045, 0.015, 16));
  const chestCoreMesh = new THREE.Mesh(chestCoreGeo, brassMat);
  chestCoreMesh.rotation.x = Math.PI / 2;
  chestCoreMesh.position.set(0, 0.14, 0.20);
  floatingBodyGroup.add(chestCoreMesh);

  const chestGemGeo = trackGeometry(new THREE.SphereGeometry(0.025, 12, 12));
  const chestGemMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: activeRemedial ? PALETTE.violetGlow : PALETTE.cyanGlow,
    })
  );
  const chestGemMesh = new THREE.Mesh(chestGemGeo, chestGemMat);
  chestGemMesh.position.set(0, 0.14, 0.21);
  floatingBodyGroup.add(chestGemMesh);

  // --- 4. NECK SWIVEL JOINT ---
  const neckGroup = new THREE.Group();
  neckGroup.name = 'BotNeckJoint';
  neckGroup.position.set(0, 0.32, 0);
  floatingBodyGroup.add(neckGroup);

  const neckRingGeo = trackGeometry(new THREE.CylinderGeometry(0.13, 0.15, 0.04, 24));
  const neckRingMesh = new THREE.Mesh(neckRingGeo, brassMat);
  neckRingMesh.position.set(0, 0.02, 0);
  neckGroup.add(neckRingMesh);

  // --- 5. HEAD ASSEMBLY ---
  // Rotates to track player avatar (yaw and pitch)
  const headGroup = new THREE.Group();
  headGroup.name = 'BotHead';
  headGroup.position.set(0, 0.04, 0);
  neckGroup.add(headGroup);

  // Main Rounded Off-White Plastic Helmet
  const headShellGeo = trackGeometry(new THREE.CapsuleGeometry(0.24, 0.12, 16, 32));
  const headShellMesh = new THREE.Mesh(headShellGeo, shellMat);
  headShellMesh.position.set(0, 0.20, 0);
  headShellMesh.scale.set(1.05, 0.96, 0.98);
  headShellMesh.castShadow = true;
  headShellMesh.receiveShadow = true;
  headGroup.add(headShellMesh);

  // Polished Brass Visor Bezel Aperture
  const visorBezelGeo = trackGeometry(new THREE.TorusGeometry(0.18, 0.022, 16, 48));
  const visorBezelMesh = new THREE.Mesh(visorBezelGeo, brassMat);
  visorBezelMesh.position.set(0, 0.20, 0.18);
  visorBezelMesh.scale.set(1.15, 0.88, 1.0);
  visorBezelMesh.castShadow = true;
  headGroup.add(visorBezelMesh);

  // Curved Glossy Visor Screen with Dynamic Canvas Expression
  // Smoothly curved convex plate
  const visorGeo = trackGeometry(new THREE.SphereGeometry(0.22, 32, 16, 0, Math.PI));
  const visorMesh = new THREE.Mesh(visorGeo, visorMat);
  visorMesh.rotation.y = -Math.PI / 2;
  visorMesh.rotation.x = Math.PI / 2;
  visorMesh.position.set(0, 0.20, 0.05);
  visorMesh.scale.set(0.92, 0.65, 0.72);
  headGroup.add(visorMesh);

  // Round Ear Dials on Sides of Head
  function createEarDial(side: number): THREE.Group {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.25, 0.20, 0);

    // Brass Outer Bezel Dial
    const earBezelGeo = trackGeometry(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 24));
    const earBezelMesh = new THREE.Mesh(earBezelGeo, brassMat);
    earBezelMesh.rotation.z = Math.PI / 2;
    earGroup.add(earBezelMesh);

    // Warm Oak Wood Inset Core
    const earWoodGeo = trackGeometry(new THREE.CylinderGeometry(0.075, 0.075, 0.036, 24));
    const earWoodMesh = new THREE.Mesh(earWoodGeo, woodOakMat);
    earWoodMesh.rotation.z = Math.PI / 2;
    earGroup.add(earWoodMesh);

    return earGroup;
  }

  headGroup.add(createEarDial(-1));
  headGroup.add(createEarDial(1));

  // --- 6. COILED BRASS GOOSENECK ANTENNA ---
  const antennaGroup = new THREE.Group();
  antennaGroup.name = 'BotAntenna';
  antennaGroup.position.set(0, 0.38, 0.02);
  headGroup.add(antennaGroup);

  // Brass Collar Base on Top of Head
  const antCollarGeo = trackGeometry(new THREE.CylinderGeometry(0.03, 0.045, 0.025, 16));
  const antCollarMesh = new THREE.Mesh(antCollarGeo, brassMat);
  antCollarMesh.position.set(0, 0.012, 0);
  antennaGroup.add(antCollarMesh);

  // Curving Gooseneck Flexible Stalk
  // Procedural curved path curving gracefully upward and slightly forward
  const antennaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.02, 0),
    new THREE.Vector3(0.01, 0.09, 0.01),
    new THREE.Vector3(0.025, 0.17, 0.03),
    new THREE.Vector3(0.035, 0.25, 0.05),
  ]);
  const antTubeGeo = trackGeometry(new THREE.TubeGeometry(antennaCurve, 20, 0.009, 8, false));
  const antTubeMesh = new THREE.Mesh(antTubeGeo, brassDarkMat);
  antennaGroup.add(antTubeMesh);

  // Antenna Bulb Mounting Brass Finial
  const antBulbMountGeo = trackGeometry(new THREE.CylinderGeometry(0.018, 0.014, 0.02, 12));
  const antBulbMountMesh = new THREE.Mesh(antBulbMountGeo, brassMat);
  antBulbMountMesh.position.set(0.035, 0.25, 0.05);
  antennaGroup.add(antBulbMountMesh);

  // Glowing Warm-Amber Light Bulb Finial
  const antBulbGeo = trackGeometry(new THREE.SphereGeometry(0.038, 16, 16));
  const antBulbMesh = new THREE.Mesh(antBulbGeo, amberBulbMat);
  antBulbMesh.position.set(0.038, 0.285, 0.055);
  antennaGroup.add(antBulbMesh);

  // Localized Dynamic Point Light from Bulb
  const antennaLight = new THREE.PointLight(PALETTE.amberBulb, 1.4, 4.0);
  antennaLight.name = 'AntennaBulbLight';
  antennaLight.position.set(0.038, 0.285, 0.055);
  antennaGroup.add(antennaLight);

  // --- RIG STATE & ANIMATION LOGIC ---
  let elapsedTime = 0;
  let blinkTimer = 2.5 + Math.random() * 2.0;
  let isBlinking = false;
  let blinkDuration = 0.16;
  let preBlinkExpression: MentorExpression = initialExpression;

  // Smoothing targets for head tracking
  let targetHeadYaw = 0;
  let targetHeadPitch = 0;
  let currentHeadYaw = 0;
  let currentHeadPitch = 0;

  const rig: MentorCompanionModelRig = {
    group: root,
    pedestalGroup,
    floatingBodyGroup,
    headGroup,
    antennaGroup,
    hoverRingsGroup,
    antennaLight,

    setExpression: (expr: MentorExpression) => {
      currentExpression = expr;
      if (!isBlinking) {
        renderFaceExpression(expr);
      }
    },

    getExpression: () => currentExpression,

    update: (delta: number, state?: MentorCompanionUpdateState) => {
      elapsedTime += delta;

      const {
        targetPosition = null,
        isSpeaking = false,
        isRemedial = false,
        isNear = false,
      } = state || {};

      // Sync remedial visual style if toggled
      if (isRemedial !== activeRemedial) {
        activeRemedial = isRemedial;
        chestGemMat.color.set(activeRemedial ? PALETTE.violetGlow : PALETTE.cyanGlow);
        visorMat.emissive.set(activeRemedial ? PALETTE.violetGlow : PALETTE.cyanGlow);
        hoverRingMat1.color.set(activeRemedial ? PALETTE.violetGlow : PALETTE.cyanGlow);
        renderFaceExpression(currentExpression);
      }

      // 1. Gentle Idle Hover Bobbing
      // Smooth sinusoidal oscillation with subtle tilt
      const bobY = 0.42 + Math.sin(elapsedTime * 2.2) * 0.032;
      floatingBodyGroup.position.y = bobY;
      floatingBodyGroup.rotation.z = Math.sin(elapsedTime * 1.6) * 0.015;
      floatingBodyGroup.rotation.x = Math.cos(elapsedTime * 1.4) * 0.012;

      // 2. Floating Hover Rings Animation
      // Concentric counter-rotation with gentle vertical breathing
      lowerRingMesh.rotation.z += delta * 1.2;
      upperRingMesh.rotation.z -= delta * 1.5;
      hoverRingsGroup.position.y = 0.16 + Math.sin(elapsedTime * 2.2) * 0.016;

      // 3. Antenna Sway & Breathing Light
      // Subtle springy sway of antenna stalk
      antennaGroup.rotation.z = Math.sin(elapsedTime * 2.8) * 0.035;
      antennaGroup.rotation.x = Math.cos(elapsedTime * 2.5) * 0.025;

      // Pulsating bulb intensity
      const pulse = 1.2 + Math.sin(elapsedTime * 3.5) * 0.35;
      antennaLight.intensity = pulse;
      amberBulbMat.emissiveIntensity = 1.4 + Math.sin(elapsedTime * 3.5) * 0.45;

      // 4. Automatic Eye Blinking Cycle
      blinkTimer -= delta;
      if (blinkTimer <= 0 && !isBlinking) {
        isBlinking = true;
        preBlinkExpression = currentExpression;
        renderFaceExpression('blink');
      } else if (isBlinking) {
        blinkDuration -= delta;
        if (blinkDuration <= 0) {
          isBlinking = false;
          blinkDuration = 0.16;
          blinkTimer = 3.0 + Math.random() * 2.5; // Next blink in 3-5.5s
          renderFaceExpression(preBlinkExpression);
        }
      }

      // 5. Speech Animation
      if (isSpeaking && !isBlinking) {
        speechAnimFrame += delta * 6.5;
        renderFaceExpression('talking', speechAnimFrame);
      }

      // 6. Smooth Player Avatar Head Tracking
      if (targetPosition && isNear) {
        // Compute relative vector from bot world position to target avatar
        const botWorldPos = new THREE.Vector3();
        root.getWorldPosition(botWorldPos);

        const dx = targetPosition[0] - botWorldPos.x;
        const dy = (targetPosition[1] || 0) + 1.2 - (botWorldPos.y + 0.65);
        const dz = targetPosition[2] - botWorldPos.z;

        const distance = Math.hypot(dx, dz);

        if (distance > 0.1 && distance < 6.0) {
          // World target angle
          const targetAngle = Math.atan2(dx, dz);

          // Get bot's current world yaw to calculate local relative angle
          const euler = new THREE.Euler().setFromQuaternion(root.quaternion, 'YXZ');

          let relativeYaw = targetAngle - euler.y;
          // Normalize relative yaw into [-PI, PI]
          relativeYaw = Math.atan2(Math.sin(relativeYaw), Math.cos(relativeYaw));

          // Clamp head yaw to comfortable range [-1.2, 1.2] radians (~68 degrees)
          targetHeadYaw = THREE.MathUtils.clamp(relativeYaw, -1.2, 1.2);

          // Pitch tracking (looking slightly up/down at student)
          const pitchAngle = Math.atan2(dy, distance);
          targetHeadPitch = THREE.MathUtils.clamp(-pitchAngle, -0.35, 0.35);
        } else {
          targetHeadYaw = 0;
          targetHeadPitch = 0;
        }
      } else {
        targetHeadYaw = 0;
        targetHeadPitch = 0;
      }

      // Smooth lerp head rotation toward target
      const lerpSpeed = THREE.MathUtils.clamp(delta * 4.5, 0, 1);
      currentHeadYaw = THREE.MathUtils.lerp(currentHeadYaw, targetHeadYaw, lerpSpeed);
      currentHeadPitch = THREE.MathUtils.lerp(currentHeadPitch, targetHeadPitch, lerpSpeed);

      headGroup.rotation.y = currentHeadYaw;
      headGroup.rotation.x = currentHeadPitch;
    },

    dispose: () => {
      disposables.geometries.forEach((g) => g.dispose());
      disposables.materials.forEach((m) => m.dispose());
      disposables.textures.forEach((t) => t.dispose());
    },
  };

  return rig;
}
