import * as THREE from 'three';
import { createArrayLab } from './labs/arrayLab.js';
import { createLinkedListLab } from './labs/linkedListLab.js';
import { createRecursionLab } from './labs/recursionLab.js';
import { createTreeLab } from './labs/treeLab.js';

/**
 * Procedural 3D Adaptive Virtual Classroom Campus (Enlarged & Enterable)
 * Central Main Classroom connected seamlessly to 4 Large Walkable Interactive Labs:
 * 1. Array Station Lab (West Wing at X = -20)
 * 2. Linked List Lab (East Wing at X = +20)
 * 3. Recursion Chamber (North Wing at Z = -20)
 * 4. Tree & BST Lab (South Wing at Z = +20)
 */
export function createClassroomDiorama() {
  const root = new THREE.Group();
  root.name = 'AdaptiveClassroomCampus';

  const interactiveObjects = [];

  // --- PALETTES ---
  const COLORS = {
    floor: '#ecd6bf',
    floorLines: '#cbb69e',
    wallLeft: '#7e716c',
    wallRight: '#f2ede4',
    wallTrim: '#ded6cb',
    woodLight: '#e4c9a8',
    woodDark: '#3d3028',
    metalBlack: '#222326',
    whiteboardFrame: '#382f2a',
    whiteboardInner: '#fcfcfd',
    chalkboardGreen: '#234433',
    blindOrange: '#f0745b',
    blindRibs: '#d95a41',
    clockGrey: '#474a51',
    skeletonBone: '#e8ecef',
    backpackOrange: '#ea580c',
    backpackTan: '#a16207',
    bookBlue: '#2563eb',
    bookGreen: '#16a34a',
    bookOrange: '#f97316',
    cyanDevice: '#06b6d4',
    greyMachine: '#64748b',
  };

  // --- PROCEDURAL WOOD FLOOR TEXTURE ---
  function createWoodFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const numPlanks = 20;
    const plankWidth = canvas.width / numPlanks;
    ctx.strokeStyle = COLORS.floorLines;
    ctx.lineWidth = 2.5;

    for (let i = 0; i <= numPlanks; i++) {
      ctx.beginPath();
      ctx.moveTo(i * plankWidth, 0);
      ctx.lineTo(i * plankWidth, canvas.height);
      ctx.stroke();

      for (let j = 0; j < 8; j++) {
        const y = (j + ((i % 3) * 0.33)) * (canvas.height / 7);
        ctx.beginPath();
        ctx.moveTo(i * plankWidth, y);
        ctx.lineTo((i + 1) * plankWidth, y);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Materials
  const floorMat = new THREE.MeshStandardMaterial({
    map: createWoodFloorTexture(),
    roughness: 0.65,
    metalness: 0.05,
  });

  const wallLeftMat = new THREE.MeshStandardMaterial({
    color: COLORS.wallLeft,
    roughness: 0.9,
    metalness: 0.02,
  });

  const wallRightMat = new THREE.MeshStandardMaterial({
    color: COLORS.wallRight,
    roughness: 0.85,
    metalness: 0.02,
  });

  const woodLightMat = new THREE.MeshStandardMaterial({
    color: COLORS.woodLight,
    roughness: 0.6,
    metalness: 0.05,
  });

  const woodDarkMat = new THREE.MeshStandardMaterial({
    color: COLORS.woodDark,
    roughness: 0.7,
    metalness: 0.05,
  });

  const metalBlackMat = new THREE.MeshStandardMaterial({
    color: COLORS.metalBlack,
    roughness: 0.4,
    metalness: 0.6,
  });

  const blindMat = new THREE.MeshStandardMaterial({
    color: COLORS.blindOrange,
    roughness: 0.7,
    metalness: 0.05,
  });

  // --- 1. MAIN ROOM ARCHITECTURE ---
  const roomSize = 10;
  const wallHeight = 5.6;
  const wallThickness = 0.3;
  const doorWidth = 3.6;

  // Central Floor
  const floorGeo = new THREE.BoxGeometry(roomSize, 0.4, roomSize);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(0, -0.2, 0);
  floorMesh.receiveShadow = true;
  root.add(floorMesh);

  // Helper to register interactive object & colliders
  function registerDraggable(group, name, boundSize = { widthX: 0.8, widthZ: 0.8 }) {
    group.userData = {
      isDraggable: true,
      name: name,
      boundSize: boundSize,
      initialPosition: group.position.clone(),
      initialRotation: group.rotation.clone(),
    };
    interactiveObjects.push(group);
    root.add(group);
    return group;
  }

  // Door Arches with Illuminated Signboards leading out of Main Classroom
  function createMainDoorPortal(x, z, rotY, text, colorHex = '#ea580c') {
    const portalGroup = new THREE.Group();
    portalGroup.position.set(x, 0, z);
    portalGroup.rotation.y = rotY;
    root.add(portalGroup);

    const pillarGeo = new THREE.BoxGeometry(0.25, 3.2, 0.35);
    const pillarMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.5 });
    const pL = new THREE.Mesh(pillarGeo, pillarMat);
    pL.position.set(-1.8, 1.6, 0);
    portalGroup.add(pL);

    const pR = new THREE.Mesh(pillarGeo, pillarMat);
    pR.position.set(1.8, 1.6, 0);
    portalGroup.add(pR);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.35, 0.38), pillarMat);
    lintel.position.set(0, 3.3, 0);
    portalGroup.add(lintel);

    const signFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.65, 0.12),
      new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.4 })
    );
    signFrame.position.set(0, 3.8, 0);
    portalGroup.add(signFrame);

    const signPlate = new THREE.Mesh(
      new THREE.BoxGeometry(3.05, 0.52, 0.14),
      new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.55 })
    );
    signPlate.position.set(0, 3.8, 0);
    portalGroup.add(signPlate);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚪 ' + text, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 0.48),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    labelMesh.position.set(0, 3.8, 0.08);
    portalGroup.add(labelMesh);

    return portalGroup;
  }

  createMainDoorPortal(-roomSize / 2, 0, Math.PI / 2, 'ARRAY STATION LAB', '#0284c7');
  createMainDoorPortal(roomSize / 2, 0, -Math.PI / 2, 'LINKED LIST LAB', '#059669');
  createMainDoorPortal(0, -roomSize / 2, 0, 'RECURSION CHAMBER', '#7c3aed');
  createMainDoorPortal(0, roomSize / 2, Math.PI, 'TREE & BST LAB', '#16a34a');

  // Back-Left Wall Segments (opening for West portal at |z| <= 1.8)
  const sideWallLen = (roomSize - doorWidth) / 2;
  const wallLeftN = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, sideWallLen), wallLeftMat);
  wallLeftN.position.set(-roomSize / 2 - wallThickness / 2, wallHeight / 2, -roomSize / 2 + sideWallLen / 2);
  wallLeftN.receiveShadow = true;
  registerDraggable(wallLeftN, 'Main Classroom West Wall (North Section)', { widthX: wallThickness, widthZ: sideWallLen });

  const wallLeftS = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, sideWallLen), wallLeftMat);
  wallLeftS.position.set(-roomSize / 2 - wallThickness / 2, wallHeight / 2, roomSize / 2 - sideWallLen / 2);
  wallLeftS.receiveShadow = true;
  registerDraggable(wallLeftS, 'Main Classroom West Wall (South Section)', { widthX: wallThickness, widthZ: sideWallLen });

  const wallLeftLintel = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, 2.2, doorWidth), wallLeftMat);
  wallLeftLintel.position.set(-roomSize / 2 - wallThickness / 2, wallHeight - 1.1, 0);
  root.add(wallLeftLintel);

  // Back-Right Wall Segments (opening for North portal at |x| <= 1.8)
  const wallRightW = new THREE.Mesh(new THREE.BoxGeometry(sideWallLen, wallHeight, wallThickness), wallRightMat);
  wallRightW.position.set(-roomSize / 2 + sideWallLen / 2, wallHeight / 2, -roomSize / 2 - wallThickness / 2);
  wallRightW.receiveShadow = true;
  registerDraggable(wallRightW, 'Main Classroom North Wall (West Section)', { widthX: sideWallLen, widthZ: wallThickness });

  const wallRightE = new THREE.Mesh(new THREE.BoxGeometry(sideWallLen, wallHeight, wallThickness), wallRightMat);
  wallRightE.position.set(roomSize / 2 - sideWallLen / 2, wallHeight / 2, -roomSize / 2 - wallThickness / 2);
  wallRightE.receiveShadow = true;
  registerDraggable(wallRightE, 'Main Classroom North Wall (East Section)', { widthX: sideWallLen, widthZ: wallThickness });

  const wallRightLintel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 2.2, wallThickness), wallRightMat);
  wallRightLintel.position.set(0, wallHeight - 1.1, -roomSize / 2 - wallThickness / 2);
  root.add(wallRightLintel);

  // --- 2. BACK-LEFT WALL OBJECTS ---
  const wbWidth = 3.0;
  const wbHeight = 2.2;
  const wbGroup = new THREE.Group();
  wbGroup.position.set(-roomSize / 2 + 0.08, 3.0, -3.4);
  wbGroup.rotation.y = Math.PI / 2;
  root.add(wbGroup);

  const wbFrame = new THREE.Mesh(
    new THREE.BoxGeometry(wbWidth + 0.18, wbHeight + 0.18, 0.08),
    new THREE.MeshStandardMaterial({ color: COLORS.whiteboardFrame, roughness: 0.6 })
  );
  wbFrame.castShadow = true;
  wbGroup.add(wbFrame);

  const wbInner = new THREE.Mesh(
    new THREE.BoxGeometry(wbWidth, wbHeight, 0.09),
    new THREE.MeshStandardMaterial({ color: COLORS.whiteboardInner, roughness: 0.2, metalness: 0.05 })
  );
  wbGroup.add(wbInner);

  // Green Notice Board
  const cbGroup = new THREE.Group();
  cbGroup.position.set(-roomSize / 2 + 0.06, 2.8, 3.4);
  cbGroup.rotation.y = Math.PI / 2;
  root.add(cbGroup);

  const cbFrame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.05), woodDarkMat);
  cbGroup.add(cbFrame);
  const cbInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.3, 0.06),
    new THREE.MeshStandardMaterial({ color: COLORS.chalkboardGreen, roughness: 0.8 })
  );
  cbGroup.add(cbInner);

  // Windows
  function createWindowWithBlind(xPos) {
    const winGroup = new THREE.Group();
    winGroup.position.set(xPos, 3.0, -roomSize / 2 + 0.04);
    root.add(winGroup);

    const winW = 1.4;
    const winH = 2.8;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.1, winH + 0.1, 0.06), metalBlackMat);
    winGroup.add(frame);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winW, winH),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
    );
    glass.position.z = -0.01;
    winGroup.add(glass);

    const blindH = winH * 0.62;
    const blindMesh = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.06, blindH, 0.05), blindMat);
    blindMesh.position.set(0, (winH - blindH) / 2, 0.04);
    blindMesh.castShadow = true;
    winGroup.add(blindMesh);
  }

  createWindowWithBlind(-3.4);
  createWindowWithBlind(3.4);

  // --- 4. FURNITURE & PROPS (Walkable central aisle) ---
  // Teacher Desk
  const teacherDeskGroup = new THREE.Group();
  teacherDeskGroup.position.set(-1.8, 0, -2.6);
  teacherDeskGroup.rotation.y = Math.PI / 2;

  const tdWidth = 1.8;
  const tdDepth = 0.9;
  const tdHeight = 0.95;

  const tdTop = new THREE.Mesh(new THREE.BoxGeometry(tdWidth, 0.06, tdDepth), woodLightMat);
  tdTop.position.set(0, tdHeight, 0);
  tdTop.castShadow = true;
  teacherDeskGroup.add(tdTop);

  const laptop = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.015, 0.26),
    new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.8, roughness: 0.2 })
  );
  laptop.position.set(-0.2, tdHeight + 0.02, 0.05);
  teacherDeskGroup.add(laptop);

  registerDraggable(teacherDeskGroup, "Teacher's Desk & Laptop", { widthX: 1.0, widthZ: 1.9 });

  // Student Desks & Chairs
  function buildStudentDesk(name) {
    const desk = new THREE.Group();
    const dWidthAlongZ = 1.4;
    const dDepthAlongX = 0.7;
    const dH = 0.85;

    const top = new THREE.Mesh(new THREE.BoxGeometry(dDepthAlongX, 0.045, dWidthAlongZ), woodLightMat);
    top.position.y = dH;
    top.castShadow = true;
    desk.add(top);

    const legGeo = new THREE.CylinderGeometry(0.022, 0.022, dH, 8);
    const legPositions = [
      [-dDepthAlongX / 2 + 0.05, -dWidthAlongZ / 2 + 0.05],
      [dDepthAlongX / 2 - 0.05, -dWidthAlongZ / 2 + 0.05],
      [-dDepthAlongX / 2 + 0.05, dWidthAlongZ / 2 - 0.05],
      [dDepthAlongX / 2 - 0.05, dWidthAlongZ / 2 - 0.05],
    ];

    legPositions.forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, metalBlackMat);
      leg.position.set(x, dH / 2, z);
      leg.castShadow = true;
      desk.add(leg);
    });

    return registerDraggable(desk, name, { widthX: 0.75, widthZ: 1.45 });
  }

  const desk1 = buildStudentDesk('Student Desk #1');
  desk1.position.set(2.4, 0, -2.4);

  const desk2 = buildStudentDesk('Student Desk #2');
  desk2.position.set(2.4, 0, 2.4);

  const desk3 = buildStudentDesk('Student Desk #3');
  desk3.position.set(-2.4, 0, 2.4);

  // --- 5. INITIALIZE THE 4 ENLARGED CONNECTED SPECIALIZED LABS ---
  function registerLabInteractive(group, name, boundSize) {
    group.userData = {
      isDraggable: false,
      name: name,
      boundSize: boundSize,
    };
    interactiveObjects.push(group);
  }

  const arrayLab = createArrayLab(COLORS, [], registerLabInteractive);
  root.add(arrayLab.group);

  const linkedListLab = createLinkedListLab(COLORS, [], registerLabInteractive);
  root.add(linkedListLab.group);

  const recursionLab = createRecursionLab(COLORS, [], registerLabInteractive);
  root.add(recursionLab.group);

  const treeLab = createTreeLab(COLORS, [], registerLabInteractive);
  root.add(treeLab.group);

  // Dynamic Colliders Query across Campus
  function getActiveColliders() {
    return interactiveObjects.map((obj) => {
      let worldPos = new THREE.Vector3();
      obj.getWorldPosition(worldPos);

      const halfX = (obj.userData.boundSize?.widthX || 0.6) / 2;
      const halfZ = (obj.userData.boundSize?.widthZ || 0.6) / 2;
      return {
        name: obj.userData.name,
        minX: worldPos.x - halfX,
        maxX: worldPos.x + halfX,
        minZ: worldPos.z - halfZ,
        maxZ: worldPos.z + halfZ,
      };
    });
  }

  function update(delta) {
    if (arrayLab.update) arrayLab.update(delta);
    if (linkedListLab.update) linkedListLab.update(delta);
    if (recursionLab.update) recursionLab.update(delta);
    if (treeLab.update) treeLab.update(delta);
  }

  return {
    mesh: root,
    interactiveObjects: interactiveObjects,
    getActiveColliders: getActiveColliders,
    update: update,
    labs: {
      array: arrayLab,
      linkedList: linkedListLab,
      recursion: recursionLab,
      tree: treeLab,
    },
  };
}
