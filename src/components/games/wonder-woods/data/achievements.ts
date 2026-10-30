/**
 * CLATS Pattern Quest: Wonder Woods
 * Game Achievements & Milestone Progression Model (Stage 3)
 */

import { calculateTotalStars, getPatternQuestRank, PatternQuestRankInfo } from "./ranks";

export interface PatternQuestAchievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: "progression" | "skill" | "mastery";
  requirementText: string;
  unlocked: boolean;
  progressCurrent: number;
  progressTarget: number;
  unlockedAtLabel?: string;
}

export interface MeadowMilestoneStatus {
  isCompleted: boolean;
  completedMissionsCount: number;
  totalMissions: number;
  totalStars: number;
  maxStars: number;
  totalSparks: number;
  rank: PatternQuestRankInfo;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  archwayRestored: boolean;
  groveUnlocked: boolean;
}

/**
 * Checks whether Pattern Meadow is 100% completed (all 10 missions including Keeper's Trial).
 */
export function isMeadowMastered(completedLevels: number[] = []): boolean {
  if (!Array.isArray(completedLevels)) return false;
  const uniqueCompleted = Array.from(new Set(completedLevels));
  return uniqueCompleted.length >= 10 && uniqueCompleted.includes(10);
}

/**
 * Returns the full Meadow completion milestone summary for celebration displays.
 */
export function getMeadowMilestoneStatus(
  completedLevels: number[] = [],
  starsPerLevel: Record<number, number> = {},
  totalSparks: number = 0
): MeadowMilestoneStatus {
  const uniqueCompleted = Array.isArray(completedLevels) ? Array.from(new Set(completedLevels)) : [];
  const totalStars = calculateTotalStars(uniqueCompleted, starsPerLevel);
  const rank = getPatternQuestRank(uniqueCompleted, starsPerLevel);
  const isMastered = isMeadowMastered(uniqueCompleted);

  return {
    isCompleted: isMastered,
    completedMissionsCount: Math.min(10, uniqueCompleted.length),
    totalMissions: 10,
    totalStars,
    maxStars: 30,
    totalSparks,
    rank,
    badgeId: "bdg-pattern-meadow-master",
    badgeName: "Pattern Meadow Master",
    badgeIcon: "🌳",
    archwayRestored: uniqueCompleted.includes(10),
    groveUnlocked: isMastered || uniqueCompleted.includes(10)
  };
}

/**
 * Evaluates all 8 game-specific achievements for Pattern Quest.
 */
export function evaluatePatternQuestAchievements(
  completedLevels: number[] = [],
  starsPerLevel: Record<number, number> = {},
  totalSparks: number = 0
): PatternQuestAchievement[] {
  const uniqueCompleted = Array.isArray(completedLevels) ? Array.from(new Set(completedLevels)) : [];
  const totalStars = calculateTotalStars(uniqueCompleted, starsPerLevel);
  const rank = getPatternQuestRank(uniqueCompleted, starsPerLevel);
  const threeStarMissionsCount = uniqueCompleted.filter((lvl) => (starsPerLevel[lvl] || 3) >= 3).length;

  return [
    {
      id: "first_spark",
      name: "First Woodland Spark",
      desc: "Complete your very first pattern mission in the enchanted meadow.",
      icon: "🌱",
      category: "progression",
      requirementText: "Complete Mission 1",
      unlocked: uniqueCompleted.includes(1) || uniqueCompleted.length >= 1,
      progressCurrent: Math.min(1, uniqueCompleted.length),
      progressTarget: 1
    },
    {
      id: "apprentice_solver",
      name: "Apprentice Solver",
      desc: "Solve 2 missions and ascend to the Pattern Apprentice rank.",
      icon: "🔍",
      category: "progression",
      requirementText: "Reach Pattern Apprentice rank (2 missions)",
      unlocked: uniqueCompleted.length >= 2,
      progressCurrent: Math.min(2, uniqueCompleted.length),
      progressTarget: 2
    },
    {
      id: "star_harvester",
      name: "Star Harvester",
      desc: "Demonstrate pattern mastery by harvesting 15 or more golden stars.",
      icon: "⭐",
      category: "skill",
      requirementText: "Collect 15+ Stars",
      unlocked: totalStars >= 15,
      progressCurrent: Math.min(15, totalStars),
      progressTarget: 15
    },
    {
      id: "anomaly_spotter",
      name: "Sharp Eye Detector",
      desc: "Spot and replace the intruder tile in Mission 9: Odd One Out.",
      icon: "👁️",
      category: "skill",
      requirementText: "Complete Mission 9 (Odd One Out)",
      unlocked: uniqueCompleted.includes(9),
      progressCurrent: uniqueCompleted.includes(9) ? 1 : 0,
      progressTarget: 1
    },
    {
      id: "pattern_architect",
      name: "Pattern Architect",
      desc: "Design and validate your own custom pattern sequence in Level 10 Part 2.",
      icon: "🎨",
      category: "mastery",
      requirementText: "Complete the Pattern Architect challenge",
      unlocked: uniqueCompleted.includes(10),
      progressCurrent: uniqueCompleted.includes(10) ? 1 : 0,
      progressTarget: 1
    },
    {
      id: "archway_restorer",
      name: "Meadow Archway Restorer",
      desc: "Conquer the Pattern Keeper's Trial and restore the ancient Meadow Archway.",
      icon: "⛩️",
      category: "mastery",
      requirementText: "Complete Level 10 (Keeper's Trial)",
      unlocked: uniqueCompleted.includes(10),
      progressCurrent: uniqueCompleted.includes(10) ? 1 : 0,
      progressTarget: 1
    },
    {
      id: "sparks_collector",
      name: "Sparks Dynamo",
      desc: "Gather 10 Pattern Sparks by mastering missions across the woodland trail.",
      icon: "✨",
      category: "progression",
      requirementText: "Collect 10 Pattern Sparks",
      unlocked: totalSparks >= 10 || uniqueCompleted.length >= 10,
      progressCurrent: Math.min(10, Math.max(totalSparks, uniqueCompleted.length)),
      progressTarget: 10
    },
    {
      id: "grand_wizard",
      name: "Pinnacle Pattern Wizard",
      desc: "Attain the highest woodland rank: 24+ stars, 10 missions, and the Keeper's Trial.",
      icon: "🧙‍♂️",
      category: "mastery",
      requirementText: "Attain Pattern Wizard Rank (24+ Stars & Level 10)",
      unlocked: rank.id === "wizard",
      progressCurrent: rank.id === "wizard" ? 24 : Math.min(24, totalStars),
      progressTarget: 24
    }
  ];
}
