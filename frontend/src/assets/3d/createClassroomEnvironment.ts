import * as THREE from 'three';
import {
  CLASSROOM_COLORS,
  getClassroomMaterials,
  getBookMaterial,
  getDoorPortalSignMaterial,
  getDoorPortalGlowMaterial,
  getScreenDisplayMaterial,
  clearClassroomSingletons,
} from './classroomSingletons';

export { CLASSROOM_COLORS, clearClassroomSingletons };

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
 * whiteboards with architecture diagrams, wall clocks, orange window blinds,
 * and walkable corridors to DSA lab wings.
 *
 * Performance-optimized: Uses module-level singleton textures, shared PBR materials,
 * and restricted shadow casting (disabled on minor decorative props) for consistent 60 FPS.
 */
export function createClassroomEnvironment(): ClassroomEnvironment {
  const root = new THREE.Group();
  root.name = 'ClassroomCampusDiorama';

  const colliders: CampusCollider[] = [];
  const instanceGeometries: THREE.BufferGeometry[] = [];

  function trackGeometry<T extends THREE.BufferGeometry>(geo: T): T {
    instanceGeometries.push(geo);
    return geo;
  }

  // Retrieve global shared materials
  const materials = getClassroomMaterials();
  const COLORS = CLASSROOM_COLORS;

  // Solid obstacle collider registration
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

  // --- 1. CAMPUS ARCHITECTURE ---
  const roomSize = 12.0; // Central classroom hub size: 12x12
  const wallHeight = 5.6;
  const wallThick = 0.35;
  const doorWidth = 3.6;

  // Central Classroom Floor
  const mainFloorGeo = trackGeometry(new THREE.BoxGeometry(roomSize, 0.4, roomSize));
  const mainFloor = new THREE.Mesh(mainFloorGeo, materials.floorWood);
  mainFloor.position.set(0, -0.2, 0);
  mainFloor.receiveShadow = true;
  root.add(mainFloor);

  // Staggered Corridors leading from classroom hub to lab wings
  // (Array at X=-20, Linked List at X=+20, Recursion at Z=-20, Stack at Z=+20)
  const corridorWidth = 3.8;
  const corridorLength = 10.0; // extends from radius 6.0 to 16.0

  function createCorridor(x: number, z: number, rotY: number) {
    const corridorGeo = trackGeometry(new THREE.BoxGeometry(corridorWidth, 0.38, corridorLength));
    const corridor = new THREE.Mesh(corridorGeo, materials.floorWood);
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
  // Structural pillars are key architecture and retain dynamic shadow casting
  function createDoorPortal(x: number, z: number, rotY: number, title: string, glowColor: string) {
    const portalGroup = new THREE.Group();
    portalGroup.position.set(x, 0, z);
    portalGroup.rotation.y = rotY;
    root.add(portalGroup);

    const pillarGeo = trackGeometry(new THREE.BoxGeometry(0.35, 3.4, 0.4));
    const leftPillar = new THREE.Mesh(pillarGeo, materials.woodDark);
    leftPillar.position.set(-doorWidth / 2 - 0.15, 1.7, 0);
    leftPillar.castShadow = true;
    portalGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, materials.woodDark);
    rightPillar.position.set(doorWidth / 2 + 0.15, 1.7, 0);
    rightPillar.castShadow = true;
    portalGroup.add(rightPillar);

    const lintelGeo = trackGeometry(new THREE.BoxGeometry(doorWidth + 0.7, 0.4, 0.45));
    const lintel = new THREE.Mesh(lintelGeo, materials.woodDark);
    lintel.position.set(0, 3.5, 0);
    lintel.castShadow = true;
    portalGroup.add(lintel);

    // Illuminated Doorway Header Sign
    const signFrameGeo = trackGeometry(new THREE.BoxGeometry(3.2, 0.65, 0.12));
    const signFrame = new THREE.Mesh(signFrameGeo, materials.metalBlack);
    signFrame.position.set(0, 4.0, 0);
    portalGroup.add(signFrame);

    const signMat = getDoorPortalSignMaterial(title, glowColor);
    const signPlateGeo = trackGeometry(new THREE.PlaneGeometry(3.05, 0.55));
    const signPlateFront = new THREE.Mesh(signPlateGeo, signMat);
    signPlateFront.position.set(0, 4.0, 0.07);
    portalGroup.add(signPlateFront);

    const signPlateBack = new THREE.Mesh(signPlateGeo, signMat);
    signPlateBack.position.set(0, 4.0, -0.07);
    signPlateBack.rotation.y = Math.PI;
    portalGroup.add(signPlateBack);

    // Emissive Doorway Threshold Underglow
    const glowGeo = trackGeometry(new THREE.PlaneGeometry(doorWidth, 0.2));
    const glowMat = getDoorPortalGlowMaterial(glowColor);
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
    mesh.castShadow = false; // Disable redundant wall shadow casting
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
    materials.wallPlaster
  );
  buildWallSegment(
    'Classroom North Wall (East)',
    halfRoom - wallSegmentLen / 2,
    -halfRoom - wallThick / 2,
    wallSegmentLen,
    wallThick,
    materials.wallPlaster
  );

  // South Wall Segments (opening at x in [-1.8, 1.8])
  buildWallSegment(
    'Classroom South Wall (West)',
    -halfRoom + wallSegmentLen / 2,
    halfRoom + wallThick / 2,
    wallSegmentLen,
    wallThick,
    materials.wallPlaster
  );
  buildWallSegment(
    'Classroom South Wall (East)',
    halfRoom - wallSegmentLen / 2,
    halfRoom + wallThick / 2,
    wallSegmentLen,
    wallThick,
    materials.wallPlaster
  );

  // West Wall Segments (opening at z in [-1.8, 1.8])
  buildWallSegment(
    'Classroom West Wall (North)',
    -halfRoom - wallThick / 2,
    -halfRoom + wallSegmentLen / 2,
    wallThick,
    wallSegmentLen,
    materials.wallTaupe
  );
  buildWallSegment(
    'Classroom West Wall (South)',
    -halfRoom - wallThick / 2,
    halfRoom - wallSegmentLen / 2,
    wallThick,
    wallSegmentLen,
    materials.wallTaupe
  );

  // East Wall Segments (opening at z in [-1.8, 1.8])
  buildWallSegment(
    'Classroom East Wall (North)',
    halfRoom + wallThick / 2,
    -halfRoom + wallSegmentLen / 2,
    wallThick,
    wallSegmentLen,
    materials.wallPlaster
  );
  buildWallSegment(
    'Classroom East Wall (South)',
    halfRoom + wallThick / 2,
    halfRoom - wallSegmentLen / 2,
    wallThick,
    wallSegmentLen,
    materials.wallPlaster
  );

  // --- 2. WINDOWS & ORANGE BLINDS ---
  function createWindowWithBlinds(xPos: number, zPos: number, rotY: number) {
    const winGroup = new THREE.Group();
    winGroup.position.set(xPos, 3.0, zPos);
    winGroup.rotation.y = rotY;
    root.add(winGroup);

    const winW = 1.6;
    const winH = 2.6;

    // Window Outer Frame
    const frameGeo = trackGeometry(new THREE.BoxGeometry(winW + 0.12, winH + 0.12, 0.08));
    const frame = new THREE.Mesh(frameGeo, materials.metalBlack);
    winGroup.add(frame);

    // Glass Pane
    const glassGeo = trackGeometry(new THREE.PlaneGeometry(winW, winH));
    const glass = new THREE.Mesh(glassGeo, materials.windowGlass);
    winGroup.add(glass);

    // Orange Accordion Window Blinds (#f0745b) - decorative, shadows disabled
    const blindH = winH * 0.65;
    const blindGeo = trackGeometry(new THREE.BoxGeometry(winW + 0.04, blindH, 0.06));
    const blindMesh = new THREE.Mesh(blindGeo, materials.orangeBlind);
    blindMesh.position.set(0, (winH - blindH) / 2, 0.04);
    blindMesh.castShadow = false;
    winGroup.add(blindMesh);

    // Horizontal Slats/Ribs across Blinds
    const numSlats = 8;
    const slatH = blindH / numSlats;
    const slatGeo = trackGeometry(new THREE.BoxGeometry(winW + 0.06, 0.025, 0.075));
    for (let s = 0; s < numSlats; s++) {
      const slat = new THREE.Mesh(slatGeo, materials.blindRibs);
      slat.position.set(0, (winH - blindH) / 2 - blindH / 2 + s * slatH + slatH / 2, 0.045);
      winGroup.add(slat);
    }
  }

  // Windows on North wall
  createWindowWithBlinds(-3.8, -halfRoom + 0.02, 0);
  createWindowWithBlinds(3.8, -halfRoom + 0.02, 0);

  // --- 3. TEACHER'S PODIUM DESK & LAPTOP ---
  const teacherDeskGroup = new THREE.Group();
  teacherDeskGroup.position.set(-2.0, 0, -3.2);
  teacherDeskGroup.rotation.y = Math.PI / 2;
  root.add(teacherDeskGroup);

  const tdW = 2.0;
  const tdD = 0.95;
  const tdH = 0.95;

  // Desktop Surface (casts primary surface shadow)
  const tdTopGeo = trackGeometry(new THREE.BoxGeometry(tdW, 0.06, tdD));
  const tdTop = new THREE.Mesh(tdTopGeo, materials.woodLight);
  tdTop.position.set(0, tdH, 0);
  tdTop.castShadow = true;
  tdTop.receiveShadow = true;
  teacherDeskGroup.add(tdTop);

  // Modesty Panel and Pedestal Legs (minor decorative, shadows disabled)
  const tdPanelGeo = trackGeometry(new THREE.BoxGeometry(tdW - 0.1, tdH - 0.06, 0.04));
  const tdPanel = new THREE.Mesh(tdPanelGeo, materials.woodMedium);
  tdPanel.position.set(0, (tdH - 0.06) / 2, -tdD / 2 + 0.04);
  tdPanel.castShadow = false;
  teacherDeskGroup.add(tdPanel);

  const tdSideGeo = trackGeometry(new THREE.BoxGeometry(0.06, tdH - 0.06, tdD - 0.08));
  const tdSideL = new THREE.Mesh(tdSideGeo, materials.woodMedium);
  tdSideL.position.set(-tdW / 2 + 0.05, (tdH - 0.06) / 2, 0);
  tdSideL.castShadow = false;
  teacherDeskGroup.add(tdSideL);

  const tdSideR = new THREE.Mesh(tdSideGeo, materials.woodMedium);
  tdSideR.position.set(tdW / 2 - 0.05, (tdH - 0.06) / 2, 0);
  tdSideR.castShadow = false;
  teacherDeskGroup.add(tdSideR);

  // Teacher Laptop (Open)
  const laptopBaseGeo = trackGeometry(new THREE.BoxGeometry(0.42, 0.018, 0.28));
  const laptopBase = new THREE.Mesh(laptopBaseGeo, materials.metalSilver);
  laptopBase.position.set(-0.35, tdH + 0.035, 0.08);
  laptopBase.castShadow = false;
  teacherDeskGroup.add(laptopBase);

  // Screen
  const laptopScreenGroup = new THREE.Group();
  laptopScreenGroup.position.set(-0.35, tdH + 0.045, -0.05);
  laptopScreenGroup.rotation.x = -0.35;
  teacherDeskGroup.add(laptopScreenGroup);

  const laptopScreenLidGeo = trackGeometry(new THREE.BoxGeometry(0.42, 0.28, 0.015));
  const laptopScreenLid = new THREE.Mesh(laptopScreenLidGeo, materials.metalSilver);
  laptopScreenLid.position.set(0, 0.14, 0);
  laptopScreenGroup.add(laptopScreenLid);

  const laptopDisplayMat = getScreenDisplayMaterial('Learner_Profile_Inspector.sh', [
    'const profile = await getLearner("S001");',
    'if (profile.mastery.stack < 0.70) {',
    '  world.lockZone("recursion_lab");',
    '  world.suggestZone("stack_lab");',
    '}',
  ]);
  const laptopDisplayGeo = trackGeometry(new THREE.PlaneGeometry(0.38, 0.24));
  const laptopDisplay = new THREE.Mesh(laptopDisplayGeo, laptopDisplayMat);
  laptopDisplay.position.set(0, 0.14, 0.009);
  laptopScreenGroup.add(laptopDisplay);

  // Teacher Desk Lamp (decorative, shadows disabled)
  const lampBaseGeo = trackGeometry(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 16));
  const lampBase = new THREE.Mesh(lampBaseGeo, materials.metalBlack);
  lampBase.position.set(0.65, tdH + 0.04, -0.2);
  teacherDeskGroup.add(lampBase);

  const lampPoleGeo = trackGeometry(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8));
  const lampPole = new THREE.Mesh(lampPoleGeo, materials.metalSilver);
  lampPole.position.set(0.65, tdH + 0.2, -0.2);
  teacherDeskGroup.add(lampPole);

  const lampShadeGeo = trackGeometry(new THREE.ConeGeometry(0.09, 0.12, 16, 1, true));
  const lampShade = new THREE.Mesh(lampShadeGeo, materials.lampShade);
  lampShade.position.set(0.65, tdH + 0.38, -0.15);
  lampShade.rotation.x = 0.4;
  teacherDeskGroup.add(lampShade);

  // Teacher Chair (decorative, shadows disabled)
  const chairGroup = new THREE.Group();
  chairGroup.position.set(0, 0, 0.75);
  teacherDeskGroup.add(chairGroup);

  const chairSeatGeo = trackGeometry(new THREE.BoxGeometry(0.5, 0.06, 0.5));
  const chairSeat = new THREE.Mesh(chairSeatGeo, materials.chairFabric);
  chairSeat.position.set(0, 0.5, 0);
  chairSeat.castShadow = false;
  chairGroup.add(chairSeat);

  const chairBackGeo = trackGeometry(new THREE.BoxGeometry(0.48, 0.5, 0.05));
  const chairBack = new THREE.Mesh(chairBackGeo, materials.chairFabric);
  chairBack.position.set(0, 0.78, 0.22);
  chairBack.castShadow = false;
  chairGroup.add(chairBack);

  const chairStemGeo = trackGeometry(new THREE.CylinderGeometry(0.03, 0.03, 0.48, 8));
  const chairStem = new THREE.Mesh(chairStemGeo, materials.metalSilver);
  chairStem.position.set(0, 0.24, 0);
  chairGroup.add(chairStem);

  registerBoxCollider("Teacher's Podium Desk", -2.0, -3.2, 1.2, 2.2);

  // --- 4. STUDENT DOUBLE-WORKSTATIONS WITH COMPUTER TERMINALS ---
  function buildDoubleWorkstation(name: string, posX: number, posZ: number, rotY: number) {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(posX, 0, posZ);
    stationGroup.rotation.y = rotY;
    root.add(stationGroup);

    const deskW = 1.35;
    const deskL = 2.4; // Accommodates 2 student seats side-by-side
    const deskH = 0.82;

    // Desktop (casts primary surface shadow)
    const topGeo = trackGeometry(new THREE.BoxGeometry(deskW, 0.05, deskL));
    const top = new THREE.Mesh(topGeo, materials.woodLight);
    top.position.set(0, deskH, 0);
    top.castShadow = true;
    top.receiveShadow = true;
    stationGroup.add(top);

    // Sturdy metal legs (decorative, shadows disabled)
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
      const leg = new THREE.Mesh(legGeo, materials.metalBlack);
      leg.position.set(ox, deskH / 2, oz);
      leg.castShadow = false;
      stationGroup.add(leg);
    });

    // 2 Computer Terminals per workstation
    [-0.65, 0.65].forEach((termZ, termIdx) => {
      // Monitor Stand
      const standGeo = trackGeometry(new THREE.BoxGeometry(0.18, 0.015, 0.18));
      const stand = new THREE.Mesh(standGeo, materials.metalBlack);
      stand.position.set(-0.15, deskH + 0.03, termZ);
      stationGroup.add(stand);

      const standArmGeo = trackGeometry(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8));
      const standArm = new THREE.Mesh(standArmGeo, materials.metalSilver);
      standArm.position.set(-0.15, deskH + 0.14, termZ);
      stationGroup.add(standArm);

      // Monitor Screen Frame (decorative, shadows disabled)
      const monFrameGeo = trackGeometry(new THREE.BoxGeometry(0.05, 0.36, 0.52));
      const monFrame = new THREE.Mesh(monFrameGeo, materials.metalBlack);
      monFrame.position.set(-0.15, deskH + 0.26, termZ);
      monFrame.castShadow = false;
      stationGroup.add(monFrame);

      // Glowing Code Display (cached singleton material)
      const codeLines =
        termIdx === 0
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
      const monDisplayMat = getScreenDisplayMaterial(`Terminal_${termIdx + 1}.ts`, codeLines);
      const monDisplayGeo = trackGeometry(new THREE.PlaneGeometry(0.48, 0.32));
      const monDisplay = new THREE.Mesh(monDisplayGeo, monDisplayMat);
      monDisplay.position.set(-0.12, deskH + 0.26, termZ);
      monDisplay.rotation.y = Math.PI / 2;
      stationGroup.add(monDisplay);

      // Mechanical Keyboard (decorative, shadows disabled)
      const kbGeo = trackGeometry(new THREE.BoxGeometry(0.16, 0.018, 0.42));
      const kb = new THREE.Mesh(kbGeo, materials.metalBlack);
      kb.position.set(0.14, deskH + 0.035, termZ);
      kb.castShadow = false;
      stationGroup.add(kb);

      // Mouse
      const mouseGeo = trackGeometry(new THREE.BoxGeometry(0.1, 0.015, 0.06));
      const mouse = new THREE.Mesh(mouseGeo, materials.metalBlack);
      mouse.position.set(0.14, deskH + 0.033, termZ + 0.28);
      mouse.castShadow = false;
      stationGroup.add(mouse);

      // PC Tower under desk (decorative, shadows disabled)
      const pcGeo = trackGeometry(new THREE.BoxGeometry(0.44, 0.45, 0.18));
      const pc = new THREE.Mesh(pcGeo, materials.metalBlack);
      pc.position.set(-0.1, 0.23, termZ);
      pc.castShadow = false;
      stationGroup.add(pc);

      // PC Power LED
      const ledGeo = trackGeometry(new THREE.SphereGeometry(0.015, 8, 8));
      const led = new THREE.Mesh(ledGeo, materials.led);
      led.position.set(0.13, 0.38, termZ);
      stationGroup.add(led);

      // Student Chair (decorative, shadows disabled)
      const sChair = new THREE.Group();
      sChair.position.set(0.65, 0, termZ);
      stationGroup.add(sChair);

      const sSeatGeo = trackGeometry(new THREE.BoxGeometry(0.42, 0.045, 0.42));
      const sSeat = new THREE.Mesh(sSeatGeo, materials.chairFabric);
      sSeat.position.set(0, 0.46, 0);
      sSeat.castShadow = false;
      sChair.add(sSeat);

      const sBackGeo = trackGeometry(new THREE.BoxGeometry(0.04, 0.4, 0.4));
      const sBack = new THREE.Mesh(sBackGeo, materials.chairFabric);
      sBack.position.set(0.2, 0.7, 0);
      sBack.castShadow = false;
      sChair.add(sBack);

      const sLegGeo = trackGeometry(new THREE.CylinderGeometry(0.018, 0.018, 0.46, 8));
      [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]].forEach(([lx, lz]) => {
        const cl = new THREE.Mesh(sLegGeo, materials.metalBlack);
        cl.position.set(lx, 0.23, lz);
        cl.castShadow = false;
        sChair.add(cl);
      });
    });

    registerBoxCollider(name, posX, posZ, deskW + 0.3, deskL + 0.2);
  }

  // 3 Student Double-Workstations with generous walking space
  buildDoubleWorkstation('Student Workstation #1', 2.8, -2.6, 0);
  buildDoubleWorkstation('Student Workstation #2', 2.8, 2.6, 0);
  buildDoubleWorkstation('Student Workstation #3', -2.8, 2.6, 0);

  // --- 5. BOOKSHELVES WITH PROCEDURAL BOOKS ---
  // Bookshelf frames, shelves, and books have dynamic shadows disabled
  function buildBookshelf(name: string, posX: number, posZ: number, rotY: number) {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(posX, 0, posZ);
    shelfGroup.rotation.y = rotY;
    root.add(shelfGroup);

    const sW = 1.6;
    const sH = 2.8;
    const sD = 0.42;

    // Left upright
    const upL = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(0.05, sH, sD)), materials.woodDark);
    upL.position.set(-sW / 2 + 0.025, sH / 2, 0);
    upL.castShadow = false;
    shelfGroup.add(upL);

    // Right upright
    const upR = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(0.05, sH, sD)), materials.woodDark);
    upR.position.set(sW / 2 - 0.025, sH / 2, 0);
    upR.castShadow = false;
    shelfGroup.add(upR);

    // Back panel
    const backP = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(sW, sH, 0.02)), materials.woodMedium);
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
      const shMesh = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(sW, 0.04, sD)), materials.woodDark);
      shMesh.position.set(0, sy, 0);
      shMesh.castShadow = false;
      shelfGroup.add(shMesh);

      // Procedural books on shelf: use cached getBookMaterial(bookColor)
      let currentX = -sW / 2 + 0.12;
      while (currentX < sW / 2 - 0.18) {
        const bookW = 0.04 + Math.random() * 0.035;
        const bookH = shelfSpacing * (0.65 + Math.random() * 0.28);
        const bookD = sD * 0.75;
        const bookColor = bookColors[Math.floor(Math.random() * bookColors.length)];

        const bookMat = getBookMaterial(bookColor);
        const bookMesh = new THREE.Mesh(
          trackGeometry(new THREE.BoxGeometry(bookW, bookH, bookD)),
          bookMat
        );
        bookMesh.position.set(currentX + bookW / 2, sy + bookH / 2 + 0.02, 0.02);
        bookMesh.castShadow = false; // Minor decorative props: dynamic shadow casting disabled
        shelfGroup.add(bookMesh);

        currentX += bookW + 0.008;
      }
    }

    registerBoxCollider(name, posX, posZ, sW + 0.2, sD + 0.2);
  }

  buildBookshelf('Classroom Bookshelf (West)', -halfRoom + 0.45, -halfRoom + 2.2, Math.PI / 2);
  buildBookshelf('Classroom Bookshelf (East)', halfRoom - 0.45, -halfRoom + 2.2, -Math.PI / 2);

  // --- 6. CHALKBOARD (WEST WALL) ---
  const cbGroup = new THREE.Group();
  cbGroup.position.set(-halfRoom + 0.06, 2.8, 3.8);
  cbGroup.rotation.y = Math.PI / 2;
  root.add(cbGroup);

  const cbW = 2.8;
  const cbH = 1.6;

  const cbFrame = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(cbW + 0.14, cbH + 0.14, 0.05)),
    materials.woodDark
  );
  cbFrame.castShadow = false;
  cbGroup.add(cbFrame);

  const cbInner = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(cbW, cbH)),
    materials.chalkboardInner
  );
  cbInner.position.z = 0.03;
  cbGroup.add(cbInner);

  // Chalk ledge with chalk sticks
  const chalkLedge = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(cbW, 0.03, 0.09)),
    materials.woodDark
  );
  chalkLedge.position.set(0, -cbH / 2 - 0.015, 0.045);
  cbGroup.add(chalkLedge);

  // --- 7. WHITEBOARD WITH ARCHITECTURE DIAGRAMS (EAST WALL) ---
  const wbGroup = new THREE.Group();
  wbGroup.position.set(halfRoom - 0.06, 2.8, 3.8);
  wbGroup.rotation.y = -Math.PI / 2;
  root.add(wbGroup);

  const wbW = 2.8;
  const wbH = 1.6;

  const wbFrame = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(wbW + 0.14, wbH + 0.14, 0.05)),
    materials.woodDark
  );
  wbFrame.castShadow = false;
  wbGroup.add(wbFrame);

  const wbInner = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(wbW, wbH)),
    materials.whiteboardInner
  );
  wbInner.position.z = 0.03;
  wbGroup.add(wbInner);

  // Whiteboard marker tray with markers
  const markerTray = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(wbW, 0.03, 0.09)),
    materials.metalSilver
  );
  markerTray.position.set(0, -wbH / 2 - 0.015, 0.045);
  wbGroup.add(markerTray);

  // --- 8. NOTICE BOARD (EAST WALL NORTH SEGMENT) ---
  const nbGroup = new THREE.Group();
  nbGroup.position.set(halfRoom - 0.06, 2.8, -halfRoom + 4.6);
  nbGroup.rotation.y = -Math.PI / 2;
  root.add(nbGroup);

  const nbFrame = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(1.6, 1.2, 0.04)),
    materials.woodDark
  );
  nbGroup.add(nbFrame);

  const nbInner = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(1.5, 1.1)),
    materials.corkBoard
  );
  nbInner.position.z = 0.025;
  nbGroup.add(nbInner);

  // Notice Papers on Bulletin Board
  [[-0.4, 0.2], [0.1, 0.25], [-0.2, -0.2], [0.35, -0.15]].forEach(([px, py], pidx) => {
    const paperMat = pidx % 2 === 0 ? materials.paperYellow : materials.paperWhite;
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
  const clockRim = new THREE.Mesh(clockRimGeo, materials.metalBlack);
  clockRim.rotation.x = Math.PI / 2;
  clockRim.castShadow = false; // Clock dynamic shadow disabled
  clockGroup.add(clockRim);

  const clockDialGeo = trackGeometry(new THREE.CircleGeometry(0.34, 32));
  const clockDial = new THREE.Mesh(clockDialGeo, materials.clockDial);
  clockDial.position.z = 0.028;
  clockGroup.add(clockDial);

  // Clock hour hand
  const hourHandGroup = new THREE.Group();
  hourHandGroup.position.z = 0.032;
  clockGroup.add(hourHandGroup);
  const hourHandMesh = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(0.02, 0.16, 0.005)),
    materials.metalBlack
  );
  hourHandMesh.position.y = 0.08;
  hourHandGroup.add(hourHandMesh);

  // Clock minute hand
  const minuteHandGroup = new THREE.Group();
  minuteHandGroup.position.z = 0.035;
  clockGroup.add(minuteHandGroup);
  const minuteHandMesh = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(0.014, 0.24, 0.005)),
    materials.metalBlack
  );
  minuteHandMesh.position.y = 0.12;
  minuteHandGroup.add(minuteHandMesh);

  // Clock second hand
  const secondHandGroup = new THREE.Group();
  secondHandGroup.position.z = 0.038;
  clockGroup.add(secondHandGroup);
  const secondHandMesh = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(0.006, 0.26, 0.005)),
    materials.clockSecondHand
  );
  secondHandMesh.position.y = 0.13;
  secondHandGroup.add(secondHandMesh);

  // Center pin
  const pinMesh = new THREE.Mesh(
    trackGeometry(new THREE.SphereGeometry(0.02, 12, 12)),
    materials.metalBlack
  );
  pinMesh.position.z = 0.042;
  clockGroup.add(pinMesh);

  // --- 10. CAMPUS CORRIDOR PERIMETER COLLIDERS ---
  registerBoxCollider('Corridor West North Wall', -11.0, -corridorWidth / 2 - 0.1, corridorLength, 0.2);
  registerBoxCollider('Corridor West South Wall', -11.0, corridorWidth / 2 + 0.1, corridorLength, 0.2);

  registerBoxCollider('Corridor East North Wall', 11.0, -corridorWidth / 2 - 0.1, corridorLength, 0.2);
  registerBoxCollider('Corridor East South Wall', 11.0, corridorWidth / 2 + 0.1, corridorLength, 0.2);

  registerBoxCollider('Corridor North West Wall', -corridorWidth / 2 - 0.1, -11.0, 0.2, corridorLength);
  registerBoxCollider('Corridor North East Wall', corridorWidth / 2 + 0.1, -11.0, 0.2, corridorLength);

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
    // Only dispose instance-owned buffer geometries.
    // Singleton textures and materials remain active for subsequent mounts/re-renders.
    instanceGeometries.forEach((g) => g.dispose());
    instanceGeometries.length = 0;
  }

  return {
    group: root,
    getActiveColliders: () => colliders,
    update,
    dispose,
  };
}
