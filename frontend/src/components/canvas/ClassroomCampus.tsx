import React, { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  createClassroomEnvironment,
  ClassroomEnvironment,
  CampusCollider,
} from '../../assets/3d/createClassroomEnvironment';

export type { CampusCollider, ClassroomEnvironment };


// Module-level cache of active campus colliders for fast collision checks
let activeCampusColliders: CampusCollider[] = [];

export function getCampusObstacleColliders(): CampusCollider[] {
  return activeCampusColliders;
}

export function setCampusObstacleColliders(colliders: CampusCollider[]): void {
  activeCampusColliders = colliders;
}

export const ClassroomCampus: React.FC = () => {
  const campus: ClassroomEnvironment = useMemo(() => {
    return createClassroomEnvironment();
  }, []);

  // Update colliders registry and clean up on unmount
  useEffect(() => {
    const colliders = campus.getActiveColliders();
    setCampusObstacleColliders(colliders);

    return () => {
      setCampusObstacleColliders([]);
      campus.dispose();
    };
  }, [campus]);

  // Frame tick for procedural animations (wall clocks, screen flickers)
  useFrame((_, delta) => {
    campus.update(delta);
  });

  return <primitive object={campus.group} />;
};
