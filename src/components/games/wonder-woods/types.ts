/**
 * CLATS Pattern Quest: Wonder Woods
 * Core Type Definitions & Data Contracts
 */

export type CognitivePhase = "SPOT" | "MATCH" | "CLASSIFY" | "DISCOVER" | "APPLY" | "CREATE";

export type ChallengeMode = "sequence_fill" | "category_sort" | "rule_builder" | "odd_one_out";

export type PreviewAnimationType = 
  | "color_fireflies"
  | "shape_stepping_stones"
  | "blooming_flowers"
  | "butterfly_grouping"
  | "odd_one_out_highlight"
  | "river_loop"
  | "multi_attribute_gems"
  | "archway_assembly";

export interface PatternItem {
  id: string;
  label: string;
  symbol: string;
  color: string;
  textColor?: string;
  borderColor?: string;
  shape?: "circle" | "square" | "triangle" | "star" | "diamond";
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

export interface MeadowLevelConfig {
  id: number;
  title: string;
  subrule: string;
  phase: CognitivePhase;
  mode: ChallengeMode;
  instruction: string;
  companionVoicePrompt: string;
  preview: MissionPreviewConfig;
  sequence?: {
    slots: SequenceSlotData[];
    choices: PatternItem[];
  };
  classification?: {
    bins: ClassificationBinData[];
    items: PatternItem[];
  };
  creation?: {
    targetLength: number;
    allowedRules: ("AB" | "AAB" | "ABC")[];
    palette: PatternItem[];
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
