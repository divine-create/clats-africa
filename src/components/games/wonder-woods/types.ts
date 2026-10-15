/**
 * CLATS Pattern Quest: Wonder Woods
 * Core Type Definitions & Data Contracts
 */

export type CognitivePhase = "SPOT" | "MATCH" | "CLASSIFY" | "DISCOVER" | "APPLY" | "CREATE";

export type ChallengeMode = 
  | "sequence_fill"       // Levels 1, 2, 3, 4, 5, 6, 7
  | "category_sort"       // Classification tasks
  | "rule_selection"      // Level 8: Discovering the rule description
  | "odd_one_out"         // Level 9: Finding the pattern intruder & fixing it
  | "rule_builder"        // Level 10 Part 2: Building your own pattern
  | "trial_hybrid";       // Level 10: Mixed sequence solve + Pattern Architect creation

export type PreviewAnimationType = 
  | "color_fireflies"
  | "shape_stepping_stones"
  | "blooming_flowers"
  | "butterfly_grouping"
  | "odd_one_out_highlight"
  | "river_loop"
  | "multi_attribute_gems"
  | "archway_assembly"
  | "size_growth";

export interface PatternItem {
  id: string;
  label: string;
  symbol: string;
  color: string;
  textColor?: string;
  borderColor?: string;
  shape?: "circle" | "square" | "triangle" | "star" | "diamond" | "mushroom" | "flower" | "leaf" | "firefly";
  size?: "sm" | "md" | "lg";
  category?: string;
}

export interface SequenceSlotData {
  index: number;
  expectedItem: PatternItem;
  isMissing: boolean;
  prefilledItem?: PatternItem;
  filledItem?: PatternItem | null;
}

export interface ClassificationBinData {
  id: string;
  name: string;
  icon: string;
  color: string;
  ruleDescription: string;
  acceptedCategories: string[];
}

export interface MissionPreviewConfig {
  type: PreviewAnimationType;
  title: string;
  explanation: string;
  demonstrationItems: PatternItem[];
  highlightIndex?: number;
  durationSeconds?: number;
}

export interface RuleSelectionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface OddOneOutData {
  items: PatternItem[];
  intruderIndex: number;
  replacementChoices: PatternItem[];
  correctReplacement: PatternItem;
}

export interface MeadowLevelConfig {
  id: number;
  title: string;
  subrule: string;
  phase: CognitivePhase;
  mode: ChallengeMode;
  instruction: string;
  companionVoicePrompt: string;
  hintLevel1: string;       // First attempt encouragement
  hintLevel2: string;       // Contextual progressive hint
  successExplanation: string;
  preview: MissionPreviewConfig;
  
  // Mode specific data
  sequence?: {
    slots: SequenceSlotData[];
    choices: PatternItem[];
  };
  classification?: {
    bins: ClassificationBinData[];
    items: PatternItem[];
  };
  ruleSelection?: {
    visualSequence: PatternItem[];
    options: RuleSelectionOption[];
  };
  oddOneOut?: OddOneOutData;
  creation?: {
    targetLength: number;
    allowedRules: ("AB" | "AAB" | "ABC")[];
    palette: PatternItem[];
  };
  trialHybrid?: {
    step1Slots: SequenceSlotData[];
    step1Choices: PatternItem[];
    step2Palette: PatternItem[];
    step2TargetLength: number;
  };
  xpAward: number;
}

export type RegionId = "meadow" | "grove" | "trail" | "river" | "observatory" | "castle";

export interface RegionData {
  id: RegionId;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  badgeColor: string;
  accentBg: string;
  isLocked: boolean;
  unlockRequirement: string;
  totalLevels: number;
  x: number; // Percentage on map
  y: number;
  lore: string;
}

export interface WonderWoodsProgress {
  unlockedLevel: number;
  completedLevels: number[];
  starsPerLevel: Record<number, number>;
  totalSparks: number;
  isGroveUnlocked: boolean;
  badgeEarned?: string;
  updatedAt: string;
}

export type TileInteractionState = 
  | "idle"
  | "hover"
  | "selected"
  | "dragging"
  | "correct"
  | "incorrect"
  | "hint"
  | "completed"
  | "locked"
  | "newly_unlocked";
