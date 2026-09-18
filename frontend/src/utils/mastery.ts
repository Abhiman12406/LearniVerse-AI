import { MasteryMap } from '../types/world';

export type MasteryStatus = 'mastered' | 'developing' | 'novice';

/**
 * Returns the cybernetic color coding for a concept mastery level:
 * - >= 0.70: Emerald (#00ff88) - Mastered / Prerequisite satisfied
 * - 0.45 .. 0.69: Amber (#ffb700) - Developing / In progress
 * - < 0.45: Crimson (#ff0055) - Novice / Prerequisite Gap
 */
export function getMasteryColor(mastery: number): string {
  if (mastery >= 0.70) return '#00ff88';
  if (mastery >= 0.45) return '#ffb700';
  return '#ff0055';
}

export function getMasteryStatus(mastery: number): MasteryStatus {
  if (mastery >= 0.70) return 'mastered';
  if (mastery >= 0.45) return 'developing';
  return 'novice';
}

export interface PrerequisiteEdge {
  from: keyof MasteryMap;
  to: keyof MasteryMap;
  threshold: number;
}

export const PREREQUISITE_EDGES: PrerequisiteEdge[] = [
  { from: 'array', to: 'linked_list', threshold: 0.60 },
  { from: 'linked_list', to: 'stack', threshold: 0.50 },
  { from: 'stack', to: 'recursion', threshold: 0.70 },
  { from: 'recursion', to: 'tree', threshold: 0.70 },
];
