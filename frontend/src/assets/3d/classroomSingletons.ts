import * as THREE from 'three';

export const CLASSROOM_COLORS = {
  floorBase: '#c29a6b',
  floorLines: '#5c3514',
  floorDark: '#9e7040',
  wallPlaster: '#d8cfc4',
  wallTaupe: '#5c524c',
  wallTrim: '#c4b5a5',
  woodLight: '#d4aa7d',
  woodMedium: '#a8794c',
  woodDark: '#3d2817',
  metalBlack: '#1c1d21',
  metalSilver: '#94a3b8',
  chalkboardGreen: '#1b3b27',
  chalkboardFrame: '#2c1e14',
  whiteboardFrame: '#2c1e14',
  whiteboardInner: '#fcfcfd',
  noticeBoardCork: '#b58b54',
  blindOrange: '#ea580c',
  blindRibs: '#c2410c',
  screenGlow: '#00f0ff',
  screenBg: '#090d16',
  bookBlue: '#2563eb',
  bookGreen: '#16a34a',
  bookOrange: '#ea580c',
  bookPurple: '#8b5cf6',
  bookGold: '#d97706',
  chairFabric: '#334155',
};

// ==========================================
// 1. PROCEDURAL CANVAS TEXTURE SINGLETONS
// ==========================================

let cachedWoodFloorTexture: THREE.CanvasTexture | null = null;
let cachedChalkboardTexture: THREE.CanvasTexture | null = null;
let cachedWhiteboardTexture: THREE.CanvasTexture | null = null;
const cachedScreenTextures = new Map<string, THREE.CanvasTexture>();
const cachedPortalSignTextures = new Map<string, THREE.CanvasTexture>();

/**
 * Creates or retrieves the cached Staggered Wood Plank Floor Texture (1024x1024).
 * Repeated 2x2 with anisotropic filtering.
 */
export function getWoodFloorTexture(): THREE.CanvasTexture {
  if (cachedWoodFloorTexture) {
    return cachedWoodFloorTexture;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = CLASSROOM_COLORS.floorBase;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const numPlanks = 16;
    const plankWidth = canvas.width / numPlanks;

    // Subtle plank tone variation & grain lines
    for (let i = 0; i < numPlanks; i++) {
      const x = i * plankWidth;
      const tint = i % 3 === 0 ? '#b88c5a' : i % 3 === 1 ? '#c79c6b' : '#ad804e';
      ctx.fillStyle = tint;
      ctx.fillRect(x + 1, 0, plankWidth - 2, canvas.height);

      ctx.strokeStyle = 'rgba(90, 55, 25, 0.35)';
      ctx.lineWidth = 1.2;
      for (let g = 0; g < 4; g++) {
        const gx = x + (g + 1) * (plankWidth / 5);
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvas.height);
        ctx.stroke();
      }
    }

    // Vertical plank dividers & staggered horizontal joints
    ctx.strokeStyle = CLASSROOM_COLORS.floorLines;
    ctx.lineWidth = 3.0;
    for (let i = 0; i <= numPlanks; i++) {
      const x = i * plankWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();

      const jointsPerPlank = 6;
      for (let j = 0; j < jointsPerPlank; j++) {
        const y = (j + (i % 4) * 0.25) * (canvas.height / jointsPerPlank);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + plankWidth, y);
        ctx.stroke();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 4;
  cachedWoodFloorTexture = tex;
  return tex;
}

/**
 * Creates or retrieves the cached Chalkboard Algorithm Texture (1024x512).
 * Features DSA formulas, Array indexing diagram, Stack Tower ASCII diagram, and BKT formula.
 */
export function getChalkboardTexture(): THREE.CanvasTexture {
  if (cachedChalkboardTexture) {
    return cachedChalkboardTexture;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = CLASSROOM_COLORS.chalkboardGreen;
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

    // Array diagram boxes
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 3;
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

  const tex = new THREE.CanvasTexture(canvas);
  cachedChalkboardTexture = tex;
  return tex;
}

/**
 * Creates or retrieves the cached Whiteboard Architecture Texture (1024x512).
 * Features Knowledge Graph Curriculum DAG and Adaptive Feedback Loop architecture.
 */
export function getWhiteboardTexture(): THREE.CanvasTexture {
  if (cachedWhiteboardTexture) {
    return cachedWhiteboardTexture;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Clean whiteboard surface with subtle glossy tone
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle blueprint grid
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Outer framing accent
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Title & Subtitle
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('SYSTEM ARCHITECTURE: ADAPTIVE VIRTUAL CLASSROOM', 40, 58);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#2563eb';
    ctx.fillText('PREREQUISITE KNOWLEDGE GRAPH (DAG) & BKT LEARNER FEEDBACK LOOP', 40, 88);

    // --- Section A: 5-Node Prerequisite DAG ---
    const dagNodes = [
      { name: 'ARRAY', tag: 'O(1) Access', col: '#0284c7' },
      { name: 'LINKED LIST', tag: 'Heap Nodes', col: '#059669' },
      { name: 'STACK', tag: 'LIFO Tower', col: '#d97706' },
      { name: 'RECURSION', tag: 'Call Stack', col: '#7c3aed' },
      { name: 'TREE / BST', tag: 'Hierarchical', col: '#db2777' },
    ];

    const startX = 40;
    const boxY = 120;
    const boxW = 150;
    const boxH = 75;
    const gap = 45;

    dagNodes.forEach((node, idx) => {
      const bx = startX + idx * (boxW + gap);

      // Node box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, boxY, boxW, boxH);
      ctx.strokeStyle = node.col;
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, boxY, boxW, boxH);

      // Top colored bar
      ctx.fillStyle = node.col;
      ctx.fillRect(bx, boxY, boxW, 8);

      // Label & Tag
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, bx + boxW / 2, boxY + 36);

      ctx.font = '12px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(node.tag, bx + boxW / 2, boxY + 58);

      // Directional arrow between nodes
      if (idx < dagNodes.length - 1) {
        const ax = bx + boxW + 8;
        const ay = boxY + boxH / 2;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + gap - 16, ay);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(ax + gap - 16, ay - 6);
        ctx.lineTo(ax + gap - 8, ay);
        ctx.lineTo(ax + gap - 16, ay + 6);
        ctx.fill();
      }
    });

    ctx.textAlign = 'left';

    // --- Section B: Adaptive Agentic Closed-Loop Engine ---
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 225);
    ctx.lineTo(canvas.width - 40, 225);
    ctx.stroke();

    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('REACTIVE AGENT WORKFLOW & POLICY GUARDRAILS', 40, 260);

    const loopBoxes = [
      { title: '1. Interaction Event', desc: 'Question / Apparatus Move', fill: '#eff6ff', stroke: '#3b82f6' },
      { title: '2. BKT Estimator', desc: 'P(L_t) Bayesian Update', fill: '#f0fdf4', stroke: '#22c55e' },
      { title: '3. Policy Guardrail', desc: 'Strict Prerequisite Check', fill: '#fffbeb', stroke: '#f59e0b' },
      { title: '4. Planner Agent', desc: 'Action: REMEDIATE / CHALLENGE', fill: '#faf5ff', stroke: '#a855f7' },
      { title: '5. World Mutation', desc: '3D Barrier Dissolve & Wings', fill: '#ecfeff', stroke: '#06b6d4' },
    ];

    const lStartX = 40;
    const lBoxY = 280;
    const lBoxW = 168;
    const lBoxH = 75;
    const lGap = 27;

    loopBoxes.forEach((box, idx) => {
      const bx = lStartX + idx * (lBoxW + lGap);

      ctx.fillStyle = box.fill;
      ctx.fillRect(bx, lBoxY, lBoxW, lBoxH);
      ctx.strokeStyle = box.stroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, lBoxY, lBoxW, lBoxH);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(box.title, bx + 10, lBoxY + 28);

      ctx.fillStyle = '#475569';
      ctx.font = '11px sans-serif';
      ctx.fillText(box.desc, bx + 10, lBoxY + 52);

      // Connecting arrow
      if (idx < loopBoxes.length - 1) {
        const ax = bx + lBoxW + 4;
        const ay = lBoxY + lBoxH / 2;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + lGap - 8, ay);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(ax + lGap - 8, ay - 4);
        ctx.lineTo(ax + lGap - 2, ay);
        ctx.lineTo(ax + lGap - 8, ay + 4);
        ctx.fill();
      }
    });

    // Notes at bottom
    ctx.fillStyle = '#64748b';
    ctx.font = '13px monospace';
    ctx.fillText('• Prerequisite Rule: Stack Mastery >= 0.70 required to unlock Recursion Chamber', 40, 400);
    ctx.fillText('• Multi-Perspective Camera: Third-Person Locomotion [3P] <-> First-Person Inspection [1P] via [V]', 40, 430);
    ctx.fillStyle = '#059669';
    ctx.fillText('✓ 60 FPS Target Achieved: Texture Singleton Caching + Shared Materials + Occlusion Frustum', 40, 460);
  }

  const tex = new THREE.CanvasTexture(canvas);
  cachedWhiteboardTexture = tex;
  return tex;
}

/**
 * Creates or retrieves a cached Glowing Computer Screen Code Texture (512x384).
 * Singletons are keyed by terminalTitle.
 */
export function getScreenTexture(terminalTitle: string, lines: string[]): THREE.CanvasTexture {
  if (cachedScreenTextures.has(terminalTitle)) {
    return cachedScreenTextures.get(terminalTitle)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = CLASSROOM_COLORS.screenBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, 36);

    // Window control buttons
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

    // Terminal Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(terminalTitle, 76, 23);

    // Code lines
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

  const tex = new THREE.CanvasTexture(canvas);
  cachedScreenTextures.set(terminalTitle, tex);
  return tex;
}

/**
 * Creates or retrieves a cached Illuminated Doorway Header Sign Texture (512x128).
 * Singletons are keyed by title.
 */
export function getDoorPortalSignTexture(title: string, glowColor: string): THREE.CanvasTexture {
  if (cachedPortalSignTextures.has(title)) {
    return cachedPortalSignTextures.get(title)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
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

  const tex = new THREE.CanvasTexture(canvas);
  cachedPortalSignTextures.set(title, tex);
  return tex;
}

// ==========================================
// 2. SHARED PBR MATERIAL SINGLETONS
// ==========================================

export interface ClassroomMaterials {
  floorWood: THREE.MeshStandardMaterial;
  wallPlaster: THREE.MeshStandardMaterial;
  wallTaupe: THREE.MeshStandardMaterial;
  woodLight: THREE.MeshStandardMaterial;
  woodMedium: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  metalBlack: THREE.MeshStandardMaterial;
  metalSilver: THREE.MeshStandardMaterial;
  orangeBlind: THREE.MeshStandardMaterial;
  blindRibs: THREE.MeshStandardMaterial;
  chairFabric: THREE.MeshStandardMaterial;
  windowGlass: THREE.MeshBasicMaterial;
  corkBoard: THREE.MeshStandardMaterial;
  chalkboardInner: THREE.MeshStandardMaterial;
  whiteboardInner: THREE.MeshStandardMaterial;
  paperWhite: THREE.MeshBasicMaterial;
  paperYellow: THREE.MeshBasicMaterial;
  lampShade: THREE.MeshStandardMaterial;
  led: THREE.MeshBasicMaterial;
  clockDial: THREE.MeshBasicMaterial;
  clockSecondHand: THREE.MeshBasicMaterial;
  lightFixture: THREE.MeshStandardMaterial;
}

let cachedMaterials: ClassroomMaterials | null = null;
const cachedBookMaterials = new Map<string, THREE.MeshStandardMaterial>();
const cachedPortalSignMaterials = new Map<string, THREE.MeshBasicMaterial>();
const cachedPortalGlowMaterials = new Map<string, THREE.MeshBasicMaterial>();
const cachedScreenDisplayMaterials = new Map<string, THREE.MeshBasicMaterial>();

/**
 * Returns the global singleton repository of standard PBR materials for architectural and furniture props.
 */
export function getClassroomMaterials(): ClassroomMaterials {
  if (cachedMaterials) {
    return cachedMaterials;
  }

  cachedMaterials = {
    floorWood: new THREE.MeshStandardMaterial({
      map: getWoodFloorTexture(),
      roughness: 0.65,
      metalness: 0.05,
    }),
    wallPlaster: new THREE.MeshStandardMaterial({
      color: CLASSROOM_COLORS.wallPlaster,
      roughness: 0.85,
      metalness: 0.02,
    }),
    wallTaupe: new THREE.MeshStandardMaterial({
      color: CLASSROOM_COLORS.wallTaupe,
      roughness: 0.9,
      metalness: 0.02,
    }),
    woodLight: new THREE.MeshStandardMaterial({
      color: CLASSROOM_COLORS.woodLight,
      roughness: 0.55,
      metalness: 0.05,
    }),
    woodMedium: new THREE.MeshStandardMaterial({
      color: CLASSROOM_COLORS.woodMedium,
      roughness: 0.65,
      metalness: 0.05,
    }),
    woodDark: new THREE.MeshStandardMaterial({
      color: CLASSROOM_COLORS.woodDark,
      roughness: 0.75,
      metalness: 0.05,
    }),
    metalBlack: new THREE.MeshStandardMaterial({
      color: CLASSROOM_COLORS.metalBlack,
      roughness: 0.35,
      metalness: 0.7,
    }),
    metalSilver: new THREE.MeshStandardMaterial({
      color: CLASSROOM_COLORS.metalSilver,
      roughness: 0.3,
      metalness: 0.85,
    }),
    orangeBlind: new THREE.MeshStandardMaterial({
      color: CLASSROOM_COLORS.blindOrange,
      roughness: 0.7,
      metalness: 0.05,
    }),
    blindRibs: new THREE.MeshStandardMaterial({
      color: CLASSROOM_COLORS.blindRibs,
      roughness: 0.6,
    }),
    chairFabric: new THREE.MeshStandardMaterial({
      color: CLASSROOM_COLORS.chairFabric,
      roughness: 0.8,
      metalness: 0.1,
    }),
    windowGlass: new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    }),
    corkBoard: new THREE.MeshStandardMaterial({
      color: CLASSROOM_COLORS.noticeBoardCork,
      roughness: 0.9,
    }),
    chalkboardInner: new THREE.MeshStandardMaterial({
      map: getChalkboardTexture(),
      roughness: 0.75,
    }),
    whiteboardInner: new THREE.MeshStandardMaterial({
      map: getWhiteboardTexture(),
      roughness: 0.25,
      metalness: 0.05,
    }),
    paperWhite: new THREE.MeshBasicMaterial({
      color: '#f8fafc',
      side: THREE.DoubleSide,
    }),
    paperYellow: new THREE.MeshBasicMaterial({
      color: '#fef08a',
      side: THREE.DoubleSide,
    }),
    lampShade: new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      roughness: 0.4,
    }),
    led: new THREE.MeshBasicMaterial({
      color: CLASSROOM_COLORS.screenGlow,
    }),
    clockDial: new THREE.MeshBasicMaterial({
      color: '#fcfcfc',
    }),
    clockSecondHand: new THREE.MeshBasicMaterial({
      color: '#ef4444',
    }),
    lightFixture: new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.3,
      metalness: 0.8,
    }),
  };

  return cachedMaterials;
}

/**
 * Returns a cached standard material for a book of a given color, avoiding unique allocations per book.
 */
export function getBookMaterial(color: string): THREE.MeshStandardMaterial {
  if (cachedBookMaterials.has(color)) {
    return cachedBookMaterials.get(color)!;
  }
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  cachedBookMaterials.set(color, mat);
  return mat;
}

/**
 * Returns a cached sign plate material for a doorway portal.
 */
export function getDoorPortalSignMaterial(title: string, glowColor: string): THREE.MeshBasicMaterial {
  if (cachedPortalSignMaterials.has(title)) {
    return cachedPortalSignMaterials.get(title)!;
  }
  const tex = getDoorPortalSignTexture(title, glowColor);
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  cachedPortalSignMaterials.set(title, mat);
  return mat;
}

/**
 * Returns a cached glowing threshold material for a doorway portal.
 */
export function getDoorPortalGlowMaterial(glowColor: string): THREE.MeshBasicMaterial {
  if (cachedPortalGlowMaterials.has(glowColor)) {
    return cachedPortalGlowMaterials.get(glowColor)!;
  }
  const mat = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  cachedPortalGlowMaterials.set(glowColor, mat);
  return mat;
}

/**
 * Returns a cached screen display material.
 */
export function getScreenDisplayMaterial(terminalTitle: string, lines: string[]): THREE.MeshBasicMaterial {
  if (cachedScreenDisplayMaterials.has(terminalTitle)) {
    return cachedScreenDisplayMaterials.get(terminalTitle)!;
  }
  const tex = getScreenTexture(terminalTitle, lines);
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  cachedScreenDisplayMaterials.set(terminalTitle, mat);
  return mat;
}

// ==========================================
// 3. TEARDOWN & RECOVERY HELPERS (FOR TESTS)
// ==========================================

export function clearClassroomSingletons(): void {
  if (cachedWoodFloorTexture) {
    cachedWoodFloorTexture.dispose();
    cachedWoodFloorTexture = null;
  }
  if (cachedChalkboardTexture) {
    cachedChalkboardTexture.dispose();
    cachedChalkboardTexture = null;
  }
  if (cachedWhiteboardTexture) {
    cachedWhiteboardTexture.dispose();
    cachedWhiteboardTexture = null;
  }
  cachedScreenTextures.forEach((t) => t.dispose());
  cachedScreenTextures.clear();

  cachedPortalSignTextures.forEach((t) => t.dispose());
  cachedPortalSignTextures.clear();

  if (cachedMaterials) {
    Object.values(cachedMaterials).forEach((m) => m.dispose());
    cachedMaterials = null;
  }

  cachedBookMaterials.forEach((m) => m.dispose());
  cachedBookMaterials.clear();

  cachedPortalSignMaterials.forEach((m) => m.dispose());
  cachedPortalSignMaterials.clear();

  cachedPortalGlowMaterials.forEach((m) => m.dispose());
  cachedPortalGlowMaterials.clear();

  cachedScreenDisplayMaterials.forEach((m) => m.dispose());
  cachedScreenDisplayMaterials.clear();
}
