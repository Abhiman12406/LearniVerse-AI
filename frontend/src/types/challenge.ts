export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export type ChallengeType = 'multiple_choice' | 'sequence_order' | 'interactive_trace';

export interface ChallengeOption {
  id: string;
  label: string; // e.g., 'A', 'B', 'C', 'D'
  text: string;
  explanation?: string;
}

export interface StackChallenge {
  id: string;
  missionId: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  concept: 'stack';
  difficulty: ChallengeDifficulty;
  type: ChallengeType;
  objective: string;
  scenario: string;
  codeSnippet?: string[];
  options: ChallengeOption[];
  correctOptionId: string;
  hint: string;
  feynmanAnalogy: string;
  pedagogicalExplanation: string;
  simulatedStackInitial?: number[];
}

export interface StackMission {
  id: string;
  title: string;
  subtitle: string;
  concept: 'stack';
  difficulty: ChallengeDifficulty;
  targetMastery: string;
  description: string;
  learningObjectives: string[];
  challenges: StackChallenge[];
}
