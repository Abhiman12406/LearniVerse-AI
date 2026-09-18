import * as THREE from 'three';

export interface LinkedListNodeModelData {
  id: string;
  label: string;
  value: number;
  address?: string;
  crystalColor?: string;
  nextId?: string | null;
}

export interface LinkedListModelOptions {
  initialNodes?: LinkedListNodeModelData[];
  spacing?: number; // Distance between node centers along X axis (default 1.3m)
}

export interface LinkedListModelState {
  activeNodeId?: string | null;
  isTraversing?: boolean;
  isSevered?: boolean;
  severedNodeId?: string | null;
  hasNullError?: boolean;
  nodes?: LinkedListNodeModelData[];
}

export interface LinkedListNodeRig {
  id: string;
  label: string;
  group: THREE.Group;
  crystalMesh: THREE.Mesh;
  crystalLight: THREE.PointLight;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
  targetScale: number;
  rotY: number;
}

export interface LinkedListModelRig {
  group: THREE.Group;
  nodesGroup: THREE.Group;
  beamsGroup: THREE.Group;
  nullPlateGroup: THREE.Group;
  sparkParticles: THREE.Points;
  update: (delta: number, state?: Partial<LinkedListModelState>) => void;
  insertNode: (node: LinkedListNodeModelData, atIndex: number) => void;
  removeNode: (id: string) => void;
  severLink: (nodeId: string) => void;
  repairLink: () => void;
  triggerNullError: () => void;
  clearNullError: () => void;
  dispose: () => void;
}

/**
 * Procedural 3D Linked List Pointer Node Apparatus Factory
 * Faithful high-fidelity reconstruction from `asstesimages/linked_list_apparatus.png`:
 * - Modular cubic node housings with warm beveled oak wood grain texture
 * - Split top face with brass engraved plaques for `[Data]` and node letter (`A`, `B`, `C`)
 * - Recessed front observation chamber with beveled brass bezel and transparent glass pane
 * - Floating, rotating faceted luminous crystal cubes (Sapphire Blue, Emerald Green, Ruby Magenta)
 * - Right side `[Next]` circular brass port and left side receiving port socket
 * - Curve-extruded dynamic connection beams with GLSL traveling plasma pulse energy animation
 * - Polished brass `NULL` floor termination plate with laser-etched amber text and central docking collar
 * - Real-time node insertion with pointer redirection, link severing, and null pointer error flashing
 */
export function createLinkedListModel(options: LinkedListModelOptions = {}): LinkedListModelRig {
  const {
    initialNodes = [
      { id: 'node_a', label: 'A', value: 10, address: '0x3F00', crystalColor: '#00d4ff', nextId: 'node_b' },
      { id: 'node_b', label: 'B', value: 20, address: '0x3F40', crystalColor: '#10b981', nextId: 'node_c' },
      { id: 'node_c', label: 'C', value: 30, address: '0x3F80', crystalColor: '#f43f5e', nextId: null },
    ],
    spacing = 1.3,
  } = options;

  const root = new THREE.Group();
  root.name = 'LinkedListApparatus';

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

  // --- AUTHENTIC COLOR PALETTE (From linked_list_apparatus.png) ---
  const COLORS = {
    woodOak: '#b8824f',
    woodOakDark: '#784c24',
    woodOakDeep: '#502e12',
    brassGold: '#d8aa46',
    brassDark: '#997322',
    brassPolish: '#f7d67b',
    plasmaAmber: '#f59e0b',
    plasmaCore: '#fffbeb',
    plasmaBeamHot: '#fde68a',
    crimsonAlert: '#ef4444',
    crimsonGlow: '#dc2626',
    nullAmber: '#fbbf24',
    glass: '#94a3b8',
    defaultCrystals: ['#00d4ff', '#10b981', '#f43f5e', '#f59e0b', '#ec4899', '#8b5cf6'],
  };

  // --- PROCEDURAL CANVAS TEXTURES ---

  function createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = COLORS.woodOak;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Warm oak grain streaks
      ctx.fillStyle = 'rgba(120, 76, 36, 0.28)';
      for (let i = 0; i < 48; i++) {
        const x = Math.random() * canvas.width;
        const w = 3 + Math.random() * 8;
        ctx.fillRect(x, 0, w, canvas.height);
      }

      // Fine dark fiber lines
      ctx.strokeStyle = 'rgba(80, 46, 18, 0.22)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 28; i++) {
        const x = Math.random() * canvas.width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(
          x + (Math.random() - 0.5) * 20,
          canvas.height * 0.35,
          x + (Math.random() - 0.5) * 20,
          canvas.height * 0.7,
          x,
          canvas.height
        );
        ctx.stroke();
      }
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createBrassPlaqueTexture(text: string, sub?: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Metallic brass gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#f7d67b');
      grad.addColorStop(0.5, '#d8aa46');
      grad.addColorStop(1, '#997322');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border frame
      ctx.strokeStyle = '#6b4d12';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      // Corner rivets
      ctx.fillStyle = '#4a3307';
      [
        [12, 12],
        [canvas.width - 12, 12],
        [12, canvas.height - 12],
        [canvas.width - 12, canvas.height - 12],
      ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Engraved Typography
      ctx.fillStyle = '#382506';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(text, canvas.width / 2, sub ? canvas.height * 0.42 : canvas.height / 2);

      if (sub) {
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#54390a';
        ctx.fillText(sub, canvas.width / 2, canvas.height * 0.78);
      }
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    return tex;
  }

  function createNullPlateTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Golden brass grounding plate
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#ebd188');
      grad.addColorStop(0.5, '#c99932');
      grad.addColorStop(1, '#8c6418');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer bezel line
      ctx.strokeStyle = '#573d09';
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

      // Inner recessed panel
      ctx.fillStyle = '#261b05';
      ctx.fillRect(24, 24, canvas.width - 48, canvas.height - 48);
      ctx.strokeStyle = '#a67c22';
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

      // Corner hex bolts
      ctx.fillStyle = '#ffd978';
      [
        [16, 16],
        [canvas.width - 16, 16],
        [16, canvas.height - 16],
        [canvas.width - 16, canvas.height - 16],
      ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Luminous engraved "NULL" text
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 44px monospace';
      ctx.fillText('NULL', canvas.width / 2, canvas.height / 2);
    }
    const tex = trackTexture(new THREE.CanvasTexture(canvas));
    return tex;
  }

  // --- REUSABLE MATERIALS ---
  const woodTexture = createWoodTexture();
  const woodMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.55,
      metalness: 0.1,
    })
  );

  const woodBevelMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.woodOakDark,
      roughness: 0.65,
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

  const darkInteriorMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: '#1a1208',
      roughness: 0.85,
      metalness: 0.1,
    })
  );

  const glassMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: COLORS.glass,
      roughness: 0.12,
      metalness: 0.15,
      transparent: true,
      opacity: 0.32,
    })
  );

  // --- SUB-GROUPS ---
  const nodesGroup = new THREE.Group();
  nodesGroup.name = 'NodesGroup';
  root.add(nodesGroup);

  const beamsGroup = new THREE.Group();
  beamsGroup.name = 'BeamsGroup';
  root.add(beamsGroup);

  const nullPlateGroup = new THREE.Group();
  nullPlateGroup.name = 'NullPlateGroup';
  root.add(nullPlateGroup);

  // --- PULSING PLASMA SHADER MATERIAL ---
  const plasmaShaderMaterial = trackMaterial(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPulseSpeed: { value: 4.5 },
        uBaseColor: { value: new THREE.Color(COLORS.plasmaAmber) },
        uCoreColor: { value: new THREE.Color(COLORS.plasmaCore) },
        uGlowColor: { value: new THREE.Color(COLORS.plasmaBeamHot) },
        uSevered: { value: 0.0 },
        uActiveHighlight: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uPulseSpeed;
        uniform vec3 uBaseColor;
        uniform vec3 uCoreColor;
        uniform vec3 uGlowColor;
        uniform float uSevered;
        uniform float uActiveHighlight;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          // If connection is severed, cut off beam with edge fade
          if (uSevered > 0.5 && vUv.x > 0.35) {
            discard;
          }

          // Directional energy pulse traveling from head to tail along UV.x
          float pulse = sin(vUv.x * 24.0 - uTime * uPulseSpeed);
          float pulseIntensity = smoothstep(0.2, 0.95, pulse);

          // Hot inner core with luminous plasma gradient
          vec3 plasmaCol = mix(uBaseColor, uGlowColor, pulseIntensity);
          plasmaCol = mix(plasmaCol, uCoreColor, smoothstep(0.7, 1.0, pulseIntensity));

          // Boost if actively traversed
          if (uActiveHighlight > 0.5) {
            plasmaCol += vec3(0.3, 0.2, 0.0);
          }

          // Edge glow / rim fresnel
          float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          plasmaCol += uGlowColor * pow(rim, 2.0) * 0.4;

          gl_FragColor = vec4(plasmaCol, 0.95);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    })
  );

  // --- DYNAMIC STATE TRACKING ---
  let activeNodes: LinkedListNodeModelData[] = [...initialNodes];
  const nodeRigs: Map<string, LinkedListNodeRig> = new Map();
  let timeElapsed = 0;
  let isSeveredState = false;
  let severedNodeIdState: string | null = null;
  let nullErrorState = false;
  let activeNodeIdState: string | null = null;

  // --- CREATE INDIVIDUAL NODE HOUSING ---
  function buildNodeMesh(node: LinkedListNodeModelData, index: number, total: number): LinkedListNodeRig {
    const nodeRoot = new THREE.Group();
    nodeRoot.name = `LinkedListNode_${node.label}`;

    // Target center-aligned X position
    const offsetX = (index - (total - 1) / 2) * spacing;
    const targetPos = new THREE.Vector3(offsetX, 0.8, 0);
    const initialPos = new THREE.Vector3(offsetX, 0.8, 0);

    nodeRoot.position.copy(initialPos);

    // 1. Warm Oak Wooden Casing Shell (0.76 x 0.76 x 0.76m cube)
    const cubeWidth = 0.76;
    const cubeHeight = 0.76;
    const cubeDepth = 0.76;

    const casingGeo = trackGeometry(new THREE.BoxGeometry(cubeWidth, cubeHeight, cubeDepth));
    const casingMesh = new THREE.Mesh(casingGeo, woodMaterial);
    casingMesh.name = 'OakCasing';
    casingMesh.castShadow = true;
    casingMesh.receiveShadow = true;
    nodeRoot.add(casingMesh);

    // Beveled corner trim bands
    const topBevelGeo = trackGeometry(new THREE.BoxGeometry(cubeWidth + 0.04, 0.05, cubeDepth + 0.04));
    const topBevelMesh = new THREE.Mesh(topBevelGeo, woodBevelMaterial);
    topBevelMesh.position.y = cubeHeight / 2;
    nodeRoot.add(topBevelMesh);

    const bottomBevelMesh = new THREE.Mesh(topBevelGeo, woodBevelMaterial);
    bottomBevelMesh.position.y = -cubeHeight / 2;
    nodeRoot.add(bottomBevelMesh);

    // 2. Top Face Split Plaques: [Data] on left, Node Label (A, B, C) on right
    const plaqueWidth = (cubeWidth - 0.1) / 2;
    const plaqueDepth = cubeDepth - 0.16;
    const plaqueGeo = trackGeometry(new THREE.PlaneGeometry(plaqueWidth, plaqueDepth));

    // Left: [Data] plaque
    const dataPlaqueTex = createBrassPlaqueTexture('[Data]');
    const dataPlaqueMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        map: dataPlaqueTex,
        roughness: 0.3,
        metalness: 0.85,
      })
    );
    const dataPlaque = new THREE.Mesh(plaqueGeo, dataPlaqueMat);
    dataPlaque.name = 'TopPlaque_Data';
    dataPlaque.rotation.x = -Math.PI / 2;
    dataPlaque.rotation.z = Math.PI / 2;
    dataPlaque.position.set(-plaqueWidth / 2 - 0.015, cubeHeight / 2 + 0.026, 0);
    nodeRoot.add(dataPlaque);

    // Right: Node Label plaque (e.g. 'A', 'B', 'C')
    const labelPlaqueTex = createBrassPlaqueTexture(node.label);
    const labelPlaqueMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        map: labelPlaqueTex,
        roughness: 0.3,
        metalness: 0.85,
      })
    );
    const labelPlaque = new THREE.Mesh(plaqueGeo, labelPlaqueMat);
    labelPlaque.name = 'TopPlaque_Label';
    labelPlaque.rotation.x = -Math.PI / 2;
    labelPlaque.rotation.z = Math.PI / 2;
    labelPlaque.position.set(plaqueWidth / 2 + 0.015, cubeHeight / 2 + 0.026, 0);
    nodeRoot.add(labelPlaque);

    // 3. Recessed Front Observation Window with Brass Bezel
    const windowWidth = 0.48;
    const windowHeight = 0.48;

    // Recessed dark interior chamber
    const chamberGeo = trackGeometry(new THREE.BoxGeometry(windowWidth + 0.04, windowHeight + 0.04, 0.45));
    const chamberMesh = new THREE.Mesh(chamberGeo, darkInteriorMaterial);
    chamberMesh.position.set(0, 0, 0.12);
    nodeRoot.add(chamberMesh);

    // Brass outer bezel frame around window
    const bezelGeo = trackGeometry(new THREE.BoxGeometry(windowWidth + 0.08, windowHeight + 0.08, 0.04));
    const bezelMesh = new THREE.Mesh(bezelGeo, brassMaterial);
    bezelMesh.name = 'FrontBezel';
    bezelMesh.position.set(0, 0, cubeDepth / 2 + 0.01);
    nodeRoot.add(bezelMesh);

    // Transparent glass pane
    const glassGeo = trackGeometry(new THREE.PlaneGeometry(windowWidth, windowHeight));
    const glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
    glassMesh.name = 'GlassWindow';
    glassMesh.position.set(0, 0, cubeDepth / 2 + 0.025);
    nodeRoot.add(glassMesh);

    // 4. Luminous Floating Crystal Cube inside chamber
    const crystalColor = node.crystalColor || COLORS.defaultCrystals[index % COLORS.defaultCrystals.length];
    const crystalGeo = trackGeometry(new THREE.BoxGeometry(0.24, 0.24, 0.24));
    const crystalMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: crystalColor,
        emissive: crystalColor,
        emissiveIntensity: 0.85,
        roughness: 0.15,
        metalness: 0.2,
        transparent: true,
        opacity: 0.9,
      })
    );
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.name = `CrystalCube_${node.label}`;
    crystalMesh.position.set(0, 0, 0.12);
    nodeRoot.add(crystalMesh);

    // Inner point light radiating from crystal
    const crystalLight = new THREE.PointLight(crystalColor, 1.2, 2.5);
    crystalLight.name = `CrystalLight_${node.label}`;
    crystalLight.position.set(0, 0, 0.12);
    nodeRoot.add(crystalLight);

    // 5. Right Face: [Next] Brass Port Plate & Collar
    const nextPortGroup = new THREE.Group();
    nextPortGroup.name = 'NextPort';
    nextPortGroup.position.set(cubeWidth / 2, 0, 0);
    nextPortGroup.rotation.y = Math.PI / 2;

    const nextPlaqueTex = createBrassPlaqueTexture('[Next]');
    const nextPlaqueMat = trackMaterial(
      new THREE.MeshStandardMaterial({ map: nextPlaqueTex, roughness: 0.3, metalness: 0.85 })
    );
    const nextPlateGeo = trackGeometry(new THREE.BoxGeometry(0.32, 0.32, 0.025));
    const nextPlateMesh = new THREE.Mesh(nextPlateGeo, nextPlaqueMat);
    nextPortGroup.add(nextPlateMesh);

    // Circular brass socket ring
    const socketGeo = trackGeometry(new THREE.CylinderGeometry(0.065, 0.075, 0.06, 16));
    const socketMesh = new THREE.Mesh(socketGeo, brassMaterial);
    socketMesh.name = 'NextPortSocket';
    socketMesh.rotation.x = Math.PI / 2;
    socketMesh.position.z = 0.035;
    nextPortGroup.add(socketMesh);
    nodeRoot.add(nextPortGroup);

    // 6. Left Face: Incoming Receiving Port Socket
    const prevPortGroup = new THREE.Group();
    prevPortGroup.name = 'PrevPort';
    prevPortGroup.position.set(-cubeWidth / 2, 0, 0);
    prevPortGroup.rotation.y = -Math.PI / 2;

    const prevPlateMesh = new THREE.Mesh(nextPlateGeo, brassMaterial);
    prevPortGroup.add(prevPlateMesh);

    const prevSocketMesh = new THREE.Mesh(socketGeo, brassMaterial);
    prevSocketMesh.name = 'PrevPortSocket';
    prevSocketMesh.rotation.x = Math.PI / 2;
    prevSocketMesh.position.z = 0.035;
    prevPortGroup.add(prevSocketMesh);
    nodeRoot.add(prevPortGroup);

    nodesGroup.add(nodeRoot);

    return {
      id: node.id,
      label: node.label,
      group: nodeRoot,
      crystalMesh,
      crystalLight,
      currentPos: initialPos,
      targetPos,
      velocity: new THREE.Vector3(),
      scale: 1.0,
      targetScale: 1.0,
      rotY: 0,
    };
  }

  // --- CREATE NULL FLOOR TERMINATION PLATE ---
  const nullPlateTex = createNullPlateTexture();
  const nullPlateMat = trackMaterial(
    new THREE.MeshStandardMaterial({
      map: nullPlateTex,
      roughness: 0.35,
      metalness: 0.8,
    })
  );

  const nullPlateGeo = trackGeometry(new THREE.BoxGeometry(0.55, 0.04, 0.55));
  const nullPlateMesh = new THREE.Mesh(nullPlateGeo, nullPlateMat);
  nullPlateMesh.name = 'NullPlateMesh';
  nullPlateMesh.receiveShadow = true;
  nullPlateGroup.add(nullPlateMesh);

  // Central raised brass collar for the terminal cable
  const nullCollarGeo = trackGeometry(new THREE.CylinderGeometry(0.06, 0.075, 0.08, 16));
  const nullCollarMesh = new THREE.Mesh(nullCollarGeo, brassMaterial);
  nullCollarMesh.name = 'NullDockingCollar';
  nullCollarMesh.position.y = 0.04;
  nullPlateGroup.add(nullCollarMesh);

  // Amber/Gold glow ring around collar
  const nullGlowRingGeo = trackGeometry(new THREE.RingGeometry(0.08, 0.16, 24));
  const nullGlowRingMat = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: COLORS.nullAmber,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    })
  );
  const nullGlowRing = new THREE.Mesh(nullGlowRingGeo, nullGlowRingMat);
  nullGlowRing.rotation.x = -Math.PI / 2;
  nullGlowRing.position.y = 0.022;
  nullPlateGroup.add(nullGlowRing);

  // Soft amber/crimson point light at the NULL plate
  const nullPointLight = new THREE.PointLight(COLORS.nullAmber, 0.9, 2.5);
  nullPointLight.name = 'NullPointLight';
  nullPointLight.position.set(0, 0.3, 0);
  nullPlateGroup.add(nullPointLight);

  // --- CURVED CONNECTION BEAM FACTORY ---
  interface BeamRig {
    id: string;
    fromNodeId: string;
    toNodeId: string | null; // null represents NULL termination plate
    mesh: THREE.Mesh;
    coreMesh: THREE.Mesh;
    tubeGeo: THREE.TubeGeometry | null;
    coreGeo: THREE.TubeGeometry | null;
  }

  const beamRigs: BeamRig[] = [];

  function buildConnectionBeams(): void {
    // Clear existing beam meshes
    beamRigs.forEach((b) => {
      beamsGroup.remove(b.mesh);
      beamsGroup.remove(b.coreMesh);
      if (b.tubeGeo) b.tubeGeo.dispose();
      if (b.coreGeo) b.coreGeo.dispose();
    });
    beamRigs.length = 0;

    for (let i = 0; i < activeNodes.length; i++) {
      const node = activeNodes[i];
      const fromRig = nodeRigs.get(node.id);
      if (!fromRig) continue;

      const nextNode = activeNodes.find((n) => n.id === node.nextId);
      const toRig = nextNode ? nodeRigs.get(nextNode.id) : null;

      // Start position: [Next] port of current node
      const startPos = new THREE.Vector3(fromRig.currentPos.x + 0.41, fromRig.currentPos.y, fromRig.currentPos.z);

      let curve: THREE.CatmullRomCurve3;

      if (toRig) {
        // Node-to-node connecting beam
        const endPos = new THREE.Vector3(toRig.currentPos.x - 0.41, toRig.currentPos.y, toRig.currentPos.z);
        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2 - 0.12; // Natural flexible droop
        const midZ = (startPos.z + endPos.z) / 2 + 0.05;

        curve = new THREE.CatmullRomCurve3([
          startPos,
          new THREE.Vector3(startPos.x + 0.15, startPos.y, startPos.z),
          new THREE.Vector3(midX, midY, midZ),
          new THREE.Vector3(endPos.x - 0.15, endPos.y, endPos.z),
          endPos,
        ]);
      } else {
        // Node-to-NULL plate terminal beam
        const endPos = new THREE.Vector3(nullPlateGroup.position.x, nullPlateGroup.position.y + 0.08, nullPlateGroup.position.z);
        const midX = (startPos.x + endPos.x) / 2 + 0.1;
        const midY = (startPos.y + endPos.y) / 2 + 0.05;
        const midZ = (startPos.z + endPos.z) / 2 + 0.25;

        curve = new THREE.CatmullRomCurve3([
          startPos,
          new THREE.Vector3(startPos.x + 0.25, startPos.y - 0.05, startPos.z + 0.1),
          new THREE.Vector3(midX, midY, midZ),
          new THREE.Vector3(endPos.x - 0.05, endPos.y + 0.25, endPos.z),
          endPos,
        ]);
      }

      // Outer plasma tube
      const tubeGeo = trackGeometry(new THREE.TubeGeometry(curve, 32, 0.024, 10, false));
      const beamMesh = new THREE.Mesh(tubeGeo, plasmaShaderMaterial);
      beamMesh.name = `ConnectionBeam_${node.label}_to_${nextNode ? nextNode.label : 'NULL'}`;
      beamsGroup.add(beamMesh);

      // Hot inner filament core
      const coreGeo = trackGeometry(new THREE.TubeGeometry(curve, 32, 0.009, 8, false));
      const coreMat = trackMaterial(
        new THREE.MeshBasicMaterial({
          color: COLORS.plasmaCore,
          transparent: true,
          opacity: 0.92,
        })
      );
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.name = `ConnectionBeamCore_${node.label}`;
      beamsGroup.add(coreMesh);

      beamRigs.push({
        id: `beam_${node.id}`,
        fromNodeId: node.id,
        toNodeId: nextNode ? nextNode.id : null,
        mesh: beamMesh,
        coreMesh,
        tubeGeo,
        coreGeo,
      });
    }
  }

  // --- FLOATING SPARK / PLASMA PARTICLES ---
  const sparkCount = 48;
  const sparkGeo = trackGeometry(new THREE.BufferGeometry());
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    sparkPos[i * 3] = (Math.random() - 0.5) * 3.5;
    sparkPos[i * 3 + 1] = 0.4 + Math.random() * 1.2;
    sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));

  const sparkMat = trackMaterial(
    new THREE.PointsMaterial({
      size: 0.04,
      color: COLORS.plasmaAmber,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    })
  );
  const sparkParticles = new THREE.Points(sparkGeo, sparkMat);
  sparkParticles.name = 'PlasmaSparks';
  root.add(sparkParticles);

  // --- INITIAL ASSEMBLY ---
  function rebuildApparatus(nodes: LinkedListNodeModelData[]): void {
    // Clear old node groups
    nodeRigs.forEach((rig) => {
      nodesGroup.remove(rig.group);
    });
    nodeRigs.clear();

    activeNodes = [...nodes];
    const total = activeNodes.length;

    // Build each node rig
    for (let i = 0; i < total; i++) {
      const node = activeNodes[i];
      const rig = buildNodeMesh(node, i, total);
      nodeRigs.set(node.id, rig);
    }

    // Position NULL plate to the right and forward of the last node
    const lastOffsetX = ((total - 1) - (total - 1) / 2) * spacing;
    nullPlateGroup.position.set(lastOffsetX + 0.95, 0.02, 0.45);

    // Build dynamic connection beams
    buildConnectionBeams();
  }

  // Assemble initial nodes
  rebuildApparatus(activeNodes);

  // --- KINETIC SIMULATION & ANIMATION ---
  function updateRig(delta: number, state?: Partial<LinkedListModelState>): void {
    timeElapsed += delta;

    // Apply state updates if passed
    if (state) {
      if (state.nodes && state.nodes.length !== activeNodes.length) {
        rebuildApparatus(state.nodes);
      }
      if (state.isSevered !== undefined) isSeveredState = state.isSevered;
      if (state.severedNodeId !== undefined) severedNodeIdState = state.severedNodeId;
      if (state.hasNullError !== undefined) nullErrorState = state.hasNullError;
      if (state.activeNodeId !== undefined) activeNodeIdState = state.activeNodeId;
    }

    // 1. Update GLSL shader uniforms
    plasmaShaderMaterial.uniforms.uTime.value = timeElapsed;
    plasmaShaderMaterial.uniforms.uSevered.value = isSeveredState ? 1.0 : 0.0;
    plasmaShaderMaterial.uniforms.uActiveHighlight.value = activeNodeIdState ? 1.0 : 0.0;

    // 2. Animate floating crystals inside each node chamber
    let nodeIndex = 0;
    nodeRigs.forEach((rig) => {
      const hoverY = Math.sin(timeElapsed * 2.2 + nodeIndex * 1.5) * 0.025;
      rig.crystalMesh.position.y = hoverY;
      rig.crystalMesh.rotation.y += delta * 0.8;
      rig.crystalMesh.rotation.x = Math.sin(timeElapsed * 1.5 + nodeIndex) * 0.15;

      // Highlight active node during traversal
      const isActive = activeNodeIdState === rig.id;
      const crystalMat = rig.crystalMesh.material as THREE.MeshStandardMaterial;
      crystalMat.emissiveIntensity = isActive ? 1.8 : 0.85;
      rig.crystalLight.intensity = isActive ? 2.2 : 1.2;

      // Spring-based translation easing for node position
      rig.currentPos.lerp(rig.targetPos, Math.min(1.0, delta * 7.5));
      rig.group.position.copy(rig.currentPos);

      // Spring scale
      rig.scale += (rig.targetScale - rig.scale) * Math.min(1.0, delta * 9.0);
      rig.group.scale.setScalar(rig.scale);

      nodeIndex++;
    });

    // 3. NULL Plate visual feedback and error flashing
    if (nullErrorState) {
      const flash = (Math.sin(timeElapsed * 12.0) + 1.0) / 2;
      nullPointLight.color.set(COLORS.crimsonAlert);
      nullPointLight.intensity = 1.5 + flash * 2.0;
      nullGlowRingMat.color.set(COLORS.crimsonAlert);
      nullGlowRingMat.opacity = 0.5 + flash * 0.5;
    } else {
      nullPointLight.color.set(COLORS.nullAmber);
      nullPointLight.intensity = 0.9 + Math.sin(timeElapsed * 3.0) * 0.2;
      nullGlowRingMat.color.set(COLORS.nullAmber);
      nullGlowRingMat.opacity = 0.65;
    }

    // 4. Update spark particles
    const posAttr = sparkParticles.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    for (let i = 0; i < sparkCount; i++) {
      posArray[i * 3 + 1] += delta * 0.35;
      if (posArray[i * 3 + 1] > 1.8) {
        posArray[i * 3 + 1] = 0.4;
      }
    }
    posAttr.needsUpdate = true;

    // In severed state, particles flash crimson alert
    if (isSeveredState) {
      sparkMat.color.set(COLORS.crimsonAlert);
    } else {
      sparkMat.color.set(COLORS.plasmaAmber);
    }
  }

  // --- ACTIONS ---

  function insertNode(newNode: LinkedListNodeModelData, atIndex: number): void {
    const updated = [...activeNodes];
    const safeIdx = Math.max(0, Math.min(atIndex, updated.length));
    const nextNode = updated[safeIdx] || null;

    const nodeWithPointers: LinkedListNodeModelData = {
      ...newNode,
      nextId: nextNode ? nextNode.id : null,
    };

    if (safeIdx > 0 && updated[safeIdx - 1]) {
      updated[safeIdx - 1] = {
        ...updated[safeIdx - 1],
        nextId: newNode.id,
      };
    }

    updated.splice(safeIdx, 0, nodeWithPointers);
    rebuildApparatus(updated);

    // Newly inserted node descends from above with scale spring
    const insertedRig = nodeRigs.get(newNode.id);
    if (insertedRig) {
      insertedRig.currentPos.y = 2.2;
      insertedRig.scale = 0.2;
    }
  }

  function removeNode(id: string): void {
    const updated = [...activeNodes];
    const idx = updated.findIndex((n) => n.id === id);
    if (idx === -1) return;

    const targetNode = updated[idx];
    if (idx > 0 && updated[idx - 1]) {
      updated[idx - 1] = {
        ...updated[idx - 1],
        nextId: targetNode.nextId,
      };
    }
    updated.splice(idx, 1);
    rebuildApparatus(updated);
  }

  function severLink(nodeId: string): void {
    isSeveredState = true;
    severedNodeIdState = nodeId;
  }

  function repairLink(): void {
    isSeveredState = false;
    severedNodeIdState = null;
    nullErrorState = false;
  }

  function triggerNullError(): void {
    nullErrorState = true;
  }

  function clearNullError(): void {
    nullErrorState = false;
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
    nodesGroup,
    beamsGroup,
    nullPlateGroup,
    sparkParticles,
    update: updateRig,
    insertNode,
    removeNode,
    severLink,
    repairLink,
    triggerNullError,
    clearNullError,
    dispose,
  };
}
