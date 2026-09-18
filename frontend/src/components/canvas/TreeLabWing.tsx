import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { createTreeBSTModel } from '../../assets/3d/createTreeBSTModel';
import { useClassroomStore } from '../../store/useClassroomStore';
import {
  getClassroomMaterials,
  getDoorPortalSignMaterial,
  getDoorPortalGlowMaterial,
  getScreenDisplayMaterial,
  getFloatingBadgeMaterial,
} from '../../assets/3d/classroomSingletons';

export const TreeLabWing: React.FC = () => {
  const avatar = useClassroomStore((s) => s.avatar);
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);

  const treeActiveNodeValue = useClassroomStore((s) => s.treeActiveNodeValue);
  const treeTraversingValues = useClassroomStore((s) => s.treeTraversingValues);
  const treeSearchTarget = useClassroomStore((s) => s.treeSearchTarget);
  const treeIsTraversing = useClassroomStore((s) => s.treeIsTraversing);

  const [isNear, setIsNear] = useState(false);

  // Position of Tree & BST Wing Chamber (South-East Wing at X = 12.0, Z = 20.8)
  const wingPos: [number, number, number] = [12.0, 0.0, 20.8];
  const consolePos: [number, number, number] = [12.0, 0.0, 20.8];

  // Retrieve cached singleton materials
  const materials = useMemo(() => getClassroomMaterials(), []);

  // Procedural Tree & BST Model Rig
  const treeRig = useMemo(() => createTreeBSTModel(), []);
  const sparkParticlesRef = useRef<THREE.Points>(null);

  useEffect(() => {
    return () => {
      treeRig.dispose();
    };
  }, [treeRig]);

  // Ambient floating particles around apparatus
  const { particlePositions, particleCount } = useMemo(() => {
    const count = 36;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4.2;
      positions[i * 3 + 1] = 0.6 + Math.random() * 2.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
    return { particlePositions: positions, particleCount: count };
  }, []);

  // Proximity detection to apparatus table
  useFrame((_, delta) => {
    const [ax, , az] = avatar.position;
    const dist = Math.hypot(ax - consolePos[0], az - consolePos[2]);
    const near = dist <= 4.4;
    if (near !== isNear) {
      setIsNear(near);
    }

    // Update kinetic tree model animation and highlighting
    treeRig.update(delta, {
      activeNodeValue: treeActiveNodeValue,
      traversingValues: treeTraversingValues,
      targetValue: treeSearchTarget,
      isSearching: treeIsTraversing,
    });

    // Update ambient floating bio-sparks
    if (sparkParticlesRef.current) {
      const geom = sparkParticlesRef.current.geometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        array[i * 3 + 1] += delta * 0.28;
        if (array[i * 3 + 1] > 3.4) {
          array[i * 3 + 1] = 0.6;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  // Handle [E] to engage console and [ESC] to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'KeyE' && isNear && !activeStation) {
        setActiveStation('tree_lab');
      } else if (e.code === 'Escape' && activeStation === 'tree_lab') {
        setActiveStation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, activeStation, setActiveStation]);

  // Terminal screen materials
  const screenMat1 = useMemo(
    () =>
      getScreenDisplayMaterial('bst_logarithmic_search', [
        '// O(log n) Binary Search Tree Invariant',
        'Node* search(Node* root, int key) {',
        '  if (!root || root->val == key) return root;',
        '  if (key < root->val) return search(root->left, key);',
        '  return search(root->right, key);',
        '}',
        'complexity: O(log n) // halving space',
      ]),
    []
  );

  const screenMat2 = useMemo(
    () =>
      getScreenDisplayMaterial('bst_inorder_traversal', [
        '// O(n) In-Order Sorted Traversal',
        'void inOrder(Node* root) {',
        '  if (!root) return;',
        '  inOrder(root->left);  // Left subtree',
        '  visit(root->val);     // Root',
        '  inOrder(root->right); // Right subtree',
        '}',
        'result: sorted sequence [20..80]',
      ]),
    []
  );

  const portalSignMat = useMemo(
    () => getDoorPortalSignMaterial('TREE & BST LAB // CANOPY', '#10b981'),
    []
  );
  const portalGlowMat = useMemo(() => getDoorPortalGlowMaterial('#10b981'), []);
  const promptMat = useMemo(
    () =>
      getFloatingBadgeMaterial(
        '[E] OPERATE TREE LAB',
        'Binary Search Tree & Traversal',
        '#34d399'
      ),
    []
  );

  return (
    <group position={wingPos}>
      {/* --- 1. 14x14m ROOM FLOORING (Matching Campus Wood Planks) --- */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[14.0, 0.4, 14.0]} />
        <primitive object={materials.floorWood} attach="material" />
      </mesh>

      {/* Cybernetic Accent Inlay on Floor (Emerald & Cyan Tree Branch rings) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.2, 5.4, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.32, 32]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* --- 2. 14x14m ENCLOSED PERIMETER WALLS (Height: 5.6m, Thickness: 0.35m) --- */}
      {/* South Diorama Knee-Wall (Z = +7.0, height: 0.85m for third-person camera clearance) */}
      <mesh position={[0, 0.425, 7.0]} receiveShadow>
        <boxGeometry args={[14.0, 0.85, 0.35]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>
      <mesh position={[0, 0.89, 7.0]}>
        <boxGeometry args={[14.1, 0.08, 0.42]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>

      {/* East Exterior Wall (X = +7.0, spanning Z: -7.0 to +7.0) */}
      <mesh position={[7.0, 2.8, 0]} receiveShadow>
        <boxGeometry args={[0.35, 5.6, 14.0]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* West Exterior Wall (X = -7.0, spanning Z: -7.0 to +7.0) */}
      <mesh position={[-7.0, 2.8, 0]} receiveShadow>
        <boxGeometry args={[0.35, 5.6, 14.0]} />
        <primitive object={materials.wallTaupe} attach="material" />
      </mesh>

      {/* North Wall: Divided into West & East segments to create 3.8m doorway entrance */}
      {/* North Wall West Segment (center X = -4.45, width = 5.1m, Z = -7.0) */}
      <mesh position={[-4.45, 2.8, -7.0]} receiveShadow>
        <boxGeometry args={[5.1, 5.6, 0.35]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>
      {/* North Wall East Segment (center X = +4.45, width = 5.1m, Z = -7.0) */}
      <mesh position={[4.45, 2.8, -7.0]} receiveShadow>
        <boxGeometry args={[5.1, 5.6, 0.35]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>
      {/* North Doorway Lintel across entrance (width 3.8m, height 1.6m, sits at top Y = 4.8) */}
      <mesh position={[0, 4.8, -7.0]} receiveShadow>
        <boxGeometry args={[3.8, 1.6, 0.35]} />
        <primitive object={materials.wallPlaster} attach="material" />
      </mesh>

      {/* --- 3. CORRIDOR ENTRANCE PORTAL SIGNBOARD --- */}
      <group position={[0, 3.8, -6.8]}>
        {/* Glow halo backing */}
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[4.2, 0.9]} />
          <primitive object={portalGlowMat} attach="material" />
        </mesh>
        {/* Main signboard panel */}
        <mesh>
          <planeGeometry args={[4.0, 0.75]} />
          <primitive object={portalSignMat} attach="material" />
        </mesh>
      </group>

      {/* --- 4. THEMATIC LIGHTING --- */}
      <pointLight position={[0, 4.8, 0]} color="#10b981" intensity={2.2} distance={11.0} />
      <pointLight position={[-4.5, 3.2, -4.0]} color="#00f0ff" intensity={1.2} distance={7.0} />
      <pointLight position={[4.5, 3.2, 4.0]} color="#34d399" intensity={1.2} distance={7.0} />

      {/* Ceiling Fluorescent Panel Light Fixtures */}
      <mesh position={[-2.8, 5.4, -2.5]}>
        <boxGeometry args={[2.4, 0.1, 0.6]} />
        <primitive object={materials.lightFixture} attach="material" />
      </mesh>
      <mesh position={[2.8, 5.4, 2.5]}>
        <boxGeometry args={[2.4, 0.1, 0.6]} />
        <primitive object={materials.lightFixture} attach="material" />
      </mesh>

      {/* --- 5. RESEARCH BENCHES & DIAGNOSTIC SCREEN MONITORS --- */}
      {/* East Wall Research Bench */}
      <group position={[5.8, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.9, 1.1]} />
          <primitive object={materials.woodLight} attach="material" />
        </mesh>
        {/* Dual Terminal Monitors */}
        <group position={[-1.2, 0.9, -0.1]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.2, 0.75, 0.08]} />
            <primitive object={materials.metalBlack} attach="material" />
          </mesh>
          <mesh position={[0, 0.4, 0.045]}>
            <planeGeometry args={[1.14, 0.69]} />
            <primitive object={screenMat1} attach="material" />
          </mesh>
        </group>
        <group position={[1.2, 0.9, -0.1]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.2, 0.75, 0.08]} />
            <primitive object={materials.metalBlack} attach="material" />
          </mesh>
          <mesh position={[0, 0.4, 0.045]}>
            <planeGeometry args={[1.14, 0.69]} />
            <primitive object={screenMat2} attach="material" />
          </mesh>
        </group>
      </group>

      {/* South Wall Diagnostic Desk */}
      <group position={[0, 0, 5.8]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.9, 1.1]} />
          <primitive object={materials.woodLight} attach="material" />
        </mesh>
        <group position={[0, 0.9, -0.1]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.6, 0.85, 0.08]} />
            <primitive object={materials.metalBlack} attach="material" />
          </mesh>
          <mesh position={[0, 0.4, 0.045]}>
            <planeGeometry args={[1.54, 0.79]} />
            <primitive object={screenMat1} attach="material" />
          </mesh>
        </group>
      </group>

      {/* --- 6. 3D PROCEDURAL BINARY SEARCH TREE CANOPY APPARATUS --- */}
      <primitive object={treeRig.group} />

      {/* Ambient Bio-Sparks */}
      <points ref={sparkParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#10b981" transparent opacity={0.7} />
      </points>

      {/* --- 7. FLOATING INTERACTION PROMPT --- */}
      {isNear && !activeStation && (
        <Float speed={2.5} rotationIntensity={0.02} floatIntensity={0.15}>
          <group position={[0, 3.8, 1.4]}>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[3.2, 0.72]} />
              <primitive object={promptMat} attach="material" />
            </mesh>
          </group>
        </Float>
      )}
    </group>
  );
};
