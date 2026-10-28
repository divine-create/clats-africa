/**
 * CLATS Pattern Quest: Wonder Woods
 * Game-Specific Rank Progression & Mastery Model
 */

export type PatternQuestRankId =
  | "novice"
  | "apprentice"
  | "assistant"
  | "expert"
  | "wizard";

export type PatternQuestRankName =
  | "Pattern Novice"
  | "Pattern Apprentice"
  | "Pattern Assistant"
  | "Pattern Expert"
  | "Pattern Wizard";

export interface PatternQuestRankInfo {
  id: PatternQuestRankId;
  name: PatternQuestRankName;
  level: number; // 1 to 5
  icon: string;
  color: string;
  badgeBg: string;
  nextRankName?: PatternQuestRankName;
  nextMilestoneDesc: string;
  minCompletedMissions: number;
  minStars: number;
  mustIncludeLevel10?: boolean;
}

export const PATTERN_QUEST_RANKS: PatternQuestRankInfo[] = [
  {
    id: "novice",
    name: "Pattern Novice",
    level: 1,
    icon: "🌱",
    color: "#10B981",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    nextRankName: "Pattern Apprentice",
    nextMilestoneDesc: "Complete 2 missions to reach Pattern Apprentice!",
    minCompletedMissions: 0,
    minStars: 0
  },
  {
    id: "apprentice",
    name: "Pattern Apprentice",
    level: 2,
    icon: "🔍",
    color: "#38BDF8",
    badgeBg: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    nextRankName: "Pattern Assistant",
    nextMilestoneDesc: "Complete 4 missions and earn 8 stars to reach Pattern Assistant!",
    minCompletedMissions: 2,
    minStars: 0
  },
  {
    id: "assistant",
    name: "Pattern Assistant",
    level: 3,
    icon: "🧩",
    color: "#F59E0B",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    nextRankName: "Pattern Expert",
    nextMilestoneDesc: "Complete 7 missions and earn 16 stars to reach Pattern Expert!",
    minCompletedMissions: 4,
    minStars: 8
  },
  {
    id: "expert",
    name: "Pattern Expert",
    level: 4,
    icon: "⭐",
    color: "#A855F7",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    nextRankName: "Pattern Wizard",
    nextMilestoneDesc: "Master all 10 missions including the Keeper's Trial with 24+ stars!",
    minCompletedMissions: 7,
    minStars: 16
  },
  {
    id: "wizard",
    name: "Pattern Wizard",
    level: 5,
    icon: "🧙‍♂️",
    color: "#EC4899",
    badgeBg: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    nextMilestoneDesc: "Pinnacle Rank Achieved! You are a master Pattern Wizard! 🧙‍♂️",
    minCompletedMissions: 10,
    minStars: 24,
    mustIncludeLevel10: true
  }
];

/**
 * Deterministically calculate total stars from completed levels and recorded stars.
 * Provides safe fallback (3 stars) for legacy completed levels without granular star records.
 * Uses Set deduplication to guarantee unique mission evaluation.
 */
export function calculateTotalStars(
  completedLevels: number[] = [],
  starsPerLevel: Record<number, number> = {}
): number {
  if (!Array.isArray(completedLevels) || completedLevels.length === 0) return 0;
  const uniqueCompleted = Array.from(new Set(completedLevels));
  return uniqueCompleted.reduce((total, lvlId) => {
    const recorded = starsPerLevel[lvlId];
    const val = typeof recorded === "number" ? Math.max(1, Math.min(3, recorded)) : 3;
    return total + val;
  }, 0);
}

/**
 * Deterministic rank calculator for Pattern Quest based on unique completed missions,
 * total stars, and final trial mastery.
 */
export function getPatternQuestRank(
  completedLevels: number[] = [],
  starsPerLevel: Record<number, number> = {}
): PatternQuestRankInfo {
  const uniqueCompleted = Array.isArray(completedLevels) ? Array.from(new Set(completedLevels)) : [];
  const completedCount = uniqueCompleted.length;
  const totalStars = calculateTotalStars(uniqueCompleted, starsPerLevel);
  const hasLevel10 = uniqueCompleted.includes(10);

  // Evaluate from highest rank down
  if (completedCount >= 10 && hasLevel10 && totalStars >= 24) {
    return PATTERN_QUEST_RANKS[4]; // Pattern Wizard
  }
  if (completedCount >= 7 && totalStars >= 16) {
    return PATTERN_QUEST_RANKS[3]; // Pattern Expert
  }
  if (completedCount >= 4 && totalStars >= 8) {
    return PATTERN_QUEST_RANKS[2]; // Pattern Assistant
  }
  if (completedCount >= 2) {
    return PATTERN_QUEST_RANKS[1]; // Pattern Apprentice
  }
  return PATTERN_QUEST_RANKS[0]; // Pattern Novice
}

/**
 * Progress summary toward the next rank for child-friendly status displays.
 */
export function getRankProgressSummary(
  completedLevels: number[] = [],
  starsPerLevel: Record<number, number> = {}
): {
  currentRank: PatternQuestRankInfo;
  nextRank?: PatternQuestRankInfo;
  progressPercent: number;
  milestoneMessage: string;
} {
  const uniqueCompleted = Array.isArray(completedLevels) ? Array.from(new Set(completedLevels)) : [];
  const currentRank = getPatternQuestRank(uniqueCompleted, starsPerLevel);
  const completedCount = uniqueCompleted.length;
  const totalStars = calculateTotalStars(uniqueCompleted, starsPerLevel);

  if (currentRank.id === "wizard") {
    return {
      currentRank,
      progressPercent: 100,
      milestoneMessage: "Pinnacle Rank Achieved! You are a master Pattern Wizard! 🧙‍♂️"
    };
  }

  const nextRank = PATTERN_QUEST_RANKS[currentRank.level]; // index corresponds to next rank
  const missionsNeeded = Math.max(0, nextRank.minCompletedMissions - completedCount);
  const starsNeeded = Math.max(0, nextRank.minStars - totalStars);

  let milestoneMessage = "";
  if (missionsNeeded > 0 && starsNeeded > 0) {
    milestoneMessage = `${missionsNeeded} more mission${missionsNeeded > 1 ? "s" : ""} and ${starsNeeded} more star${starsNeeded > 1 ? "s" : ""} to reach ${nextRank.name}!`;
  } else if (missionsNeeded > 0) {
    milestoneMessage = `${missionsNeeded} more mission${missionsNeeded > 1 ? "s" : ""} to reach ${nextRank.name}!`;
  } else if (starsNeeded > 0) {
    milestoneMessage = `${starsNeeded} more star${starsNeeded > 1 ? "s" : ""} to reach ${nextRank.name}!`;
  } else if (nextRank.mustIncludeLevel10 && !uniqueCompleted.includes(10)) {
    milestoneMessage = `Complete the Pattern Keeper's Trial to reach ${nextRank.name}!`;
  } else {
    milestoneMessage = `Almost at ${nextRank.name}! Complete your next quest!`;
  }

  const prevMissions = currentRank.minCompletedMissions;
  const targetMissions = nextRank.minCompletedMissions;
  const missionProgress = targetMissions > prevMissions
    ? Math.max(0, Math.min(1, (completedCount - prevMissions) / (targetMissions - prevMissions)))
    : 1;

  const prevStars = currentRank.minStars;
  const targetStars = nextRank.minStars;
  const hasStarRequirement = targetStars > prevStars;
  const starProgress = hasStarRequirement
    ? Math.max(0, Math.min(1, (totalStars - prevStars) / (targetStars - prevStars)))
    : 1;

  const progressPercent = hasStarRequirement
    ? Math.round(((missionProgress + starProgress) / 2) * 100)
    : Math.round(missionProgress * 100);

  return {
    currentRank,
    nextRank,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    milestoneMessage
  };
}
