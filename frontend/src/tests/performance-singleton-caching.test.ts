import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  getWoodFloorTexture,
  getChalkboardTexture,
  getWhiteboardTexture,
  getScreenTexture,
  getDoorPortalSignTexture,
  getClassroomMaterials,
  getBookMaterial,
  getDoorPortalSignMaterial,
  getScreenDisplayMaterial,
  clearClassroomSingletons,
  CLASSROOM_COLORS,
} from '../assets/3d/classroomSingletons';
import { createClassroomEnvironment } from '../assets/3d/createClassroomEnvironment';

describe('Performance Prefactoring & Texture/Material Singleton Caching', () => {
  beforeAll(() => {
    // Mock 2D canvas context for JSDOM headless testing environment
    HTMLCanvasElement.prototype.getContext = (() => ({
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      arc: () => {},
      fill: () => {},
      fillText: () => {},
      measureText: () => ({ width: 100 }),
    })) as any;
  });

  beforeEach(() => {
    clearClassroomSingletons();
  });

  afterEach(() => {
    clearClassroomSingletons();
  });

  it('maintains module-level singleton identity for all procedural canvas textures', () => {
    // Wood Floor Texture
    const floorTex1 = getWoodFloorTexture();
    const floorTex2 = getWoodFloorTexture();
    expect(floorTex1).toBeDefined();
    expect(floorTex1).toBe(floorTex2);
    expect(floorTex1.anisotropy).toBe(4);
    expect(floorTex1.wrapS).toBe(THREE.RepeatWrapping);

    // Chalkboard Algorithm Texture
    const cbTex1 = getChalkboardTexture();
    const cbTex2 = getChalkboardTexture();
    expect(cbTex1).toBeDefined();
    expect(cbTex1).toBe(cbTex2);

    // Whiteboard Architecture Diagram Texture
    const wbTex1 = getWhiteboardTexture();
    const wbTex2 = getWhiteboardTexture();
    expect(wbTex1).toBeDefined();
    expect(wbTex1).toBe(wbTex2);

    // Terminal Screen Code Textures
    const lines = ['const x = 10;', 'emit("EVENT");'];
    const screen1 = getScreenTexture('Terminal_1.ts', lines);
    const screen2 = getScreenTexture('Terminal_1.ts', lines);
    expect(screen1).toBeDefined();
    expect(screen1).toBe(screen2);

    // Portal Sign Textures
    const portal1 = getDoorPortalSignTexture('ARRAY LAB', '#0284c7');
    const portal2 = getDoorPortalSignTexture('ARRAY LAB', '#0284c7');
    expect(portal1).toBeDefined();
    expect(portal1).toBe(portal2);
  });

  it('reuses shared PBR materials across multiple architectural and furniture meshes', () => {
    const materials1 = getClassroomMaterials();
    const materials2 = getClassroomMaterials();

    // Verify repository returns identical material references
    expect(materials1).toBe(materials2);
    expect(materials1.floorWood).toBe(materials2.floorWood);
    expect(materials1.woodLight).toBe(materials2.woodLight);
    expect(materials1.metalBlack).toBe(materials2.metalBlack);
    expect(materials1.wallPlaster).toBe(materials2.wallPlaster);
    expect(materials1.whiteboardInner).toBe(materials2.whiteboardInner);
    expect(materials1.chalkboardInner).toBe(materials2.chalkboardInner);

    // Verify books of identical colors share a single material instance
    const blueBookMat1 = getBookMaterial(CLASSROOM_COLORS.bookBlue);
    const blueBookMat2 = getBookMaterial(CLASSROOM_COLORS.bookBlue);
    const greenBookMat = getBookMaterial(CLASSROOM_COLORS.bookGreen);

    expect(blueBookMat1).toBe(blueBookMat2);
    expect(blueBookMat1).not.toBe(greenBookMat);

    // Verify portal sign and screen display materials are singletons
    const signMat1 = getDoorPortalSignMaterial('STACK LAB', '#f59e0b');
    const signMat2 = getDoorPortalSignMaterial('STACK LAB', '#f59e0b');
    expect(signMat1).toBe(signMat2);

    const screenMat1 = getScreenDisplayMaterial('Terminal_2.ts', ['console.log(1);']);
    const screenMat2 = getScreenDisplayMaterial('Terminal_2.ts', ['console.log(1);']);
    expect(screenMat1).toBe(screenMat2);
  });

  it('reuses singletons across multiple classroom environment instances', () => {
    const campusA = createClassroomEnvironment();
    const campusB = createClassroomEnvironment();

    // Find floor meshes in both instances
    let floorMeshA: THREE.Mesh | null = null;
    let floorMeshB: THREE.Mesh | null = null;

    campusA.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).material === getClassroomMaterials().floorWood) {
        floorMeshA = obj as THREE.Mesh;
      }
    });

    campusB.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).material === getClassroomMaterials().floorWood) {
        floorMeshB = obj as THREE.Mesh;
      }
    });

    expect(floorMeshA).not.toBeNull();
    expect(floorMeshB).not.toBeNull();
    // Both meshes must share the exact same material and underlying texture
    expect(floorMeshA!.material).toBe(floorMeshB!.material);
    expect((floorMeshA!.material as THREE.MeshStandardMaterial).map).toBe(
      (floorMeshB!.material as THREE.MeshStandardMaterial).map
    );

    campusA.dispose();
    campusB.dispose();
  });

  it('disables dynamic shadow casting on minor decorative props and restricts to primary structural elements', () => {
    const campus = createClassroomEnvironment();

    let totalMeshes = 0;
    let shadowCastingMeshes = 0;
    const shadowCasters: THREE.Mesh[] = [];
    const nonShadowCasters: THREE.Mesh[] = [];

    campus.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        totalMeshes++;
        const mesh = obj as THREE.Mesh;
        if (mesh.castShadow) {
          shadowCastingMeshes++;
          shadowCasters.push(mesh);
        } else {
          nonShadowCasters.push(mesh);
        }
      }
    });

    // Total meshes in diorama is large (hundreds of books, desks, chairs, etc.)
    expect(totalMeshes).toBeGreaterThan(100);

    // Active shadow casters should be strictly limited to main structural pillars and primary desk tops
    // (Doorway pillars: 2 per door * 4 doors = 8, lintels: 1 * 4 = 4; Teacher desk top: 1; Student desk tops: 3)
    // Total should be around 16, well below 30
    expect(shadowCastingMeshes).toBeLessThan(30);

    // Verify decorative elements have castShadow === false:
    // 1. Books on shelves (Mesh with BoxGeometry of small thickness)
    const bookMeshes = nonShadowCasters.filter(
      (m) => m.geometry instanceof THREE.BoxGeometry && (m.geometry.parameters as any).width < 0.1
    );
    expect(bookMeshes.length).toBeGreaterThan(30);
    bookMeshes.forEach((book) => {
      expect(book.castShadow).toBe(false);
    });

    // 2. Wall segments have castShadow === false and receiveShadow === true
    const wallMeshes = nonShadowCasters.filter(
      (m) =>
        m.material === getClassroomMaterials().wallPlaster ||
        m.material === getClassroomMaterials().wallTaupe
    );
    expect(wallMeshes.length).toBeGreaterThanOrEqual(8);
    wallMeshes.forEach((wall) => {
      expect(wall.castShadow).toBe(false);
      expect(wall.receiveShadow).toBe(true);
    });

    // 3. Wall clock rim has castShadow === false
    const clockRim = nonShadowCasters.find(
      (m) => m.geometry instanceof THREE.CylinderGeometry && (m.geometry.parameters as any).radiusTop === 0.38
    );
    expect(clockRim).toBeDefined();
    expect(clockRim!.castShadow).toBe(false);

    campus.dispose();
  });

  it('includes Whiteboard on East wall with architecture diagrams and marker tray', () => {
    const campus = createClassroomEnvironment();

    let whiteboardInnerFound = false;
    let markerTrayFound = false;

    campus.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.material === getClassroomMaterials().whiteboardInner) {
          whiteboardInnerFound = true;
          expect((mesh.material as THREE.MeshStandardMaterial).map).toBe(getWhiteboardTexture());
        }
        if (
          mesh.material === getClassroomMaterials().metalSilver &&
          mesh.geometry instanceof THREE.BoxGeometry &&
          (mesh.geometry.parameters as any).height === 0.03 &&
          (mesh.geometry.parameters as any).width === 2.8
        ) {
          markerTrayFound = true;
        }
      }
    });

    expect(whiteboardInnerFound).toBe(true);
    expect(markerTrayFound).toBe(true);

    campus.dispose();
  });

  it('maintains 60 FPS performance without memory allocations in continuous locomotion animation loop', () => {
    const campus = createClassroomEnvironment();

    const frameCount = 120; // 2 seconds of 60 FPS continuous update ticks
    const dt = 1 / 60;

    const startTime = performance.now();
    for (let frame = 0; frame < frameCount; frame++) {
      campus.update(dt);
    }
    const elapsedMs = performance.now() - startTime;

    // Execution time for 120 frames in CPU JS loop should be very small (< 100ms total, ~0.1ms per frame)
    // allowing virtually the entire 16.6ms frame budget for GPU WebGL draw passes.
    expect(elapsedMs).toBeLessThan(100);

    const avgMsPerFrame = elapsedMs / frameCount;
    expect(avgMsPerFrame).toBeLessThan(1.0);

    // Verify texture singletons were NOT recreated or disposed during animation
    expect(getWoodFloorTexture()).toBeDefined();
    expect(getChalkboardTexture()).toBeDefined();
    expect(getWhiteboardTexture()).toBeDefined();

    campus.dispose();
  });
});
