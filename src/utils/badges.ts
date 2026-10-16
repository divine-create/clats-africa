import { Child } from "../types";
import { CURRICULUM } from "../data/curriculum";
import { computeEffectiveStreak } from "./streak";

export interface EvaluatedBadge {
  id: string;
  step: number;
  name: string;
  icon: string;
  emoji: string;
  desc: string;
  howToEarn: string;
  unlocked: boolean;
  unlockedLabel: string;
  progressCurrent: number;
  progressTarget: number;
  progressPct: number;
  progressUnit: string;
  color: string;
}

export interface EvaluatedSticker {
  id: string;
  step: number;
  emoji: string;
  name: string;
  desc: string;
  howToEarn: string;
  unlocked: boolean;
  progressText: string;
  color: string;
}

/**
 * Evaluates the unified 8-step Academy Badge progression sequence for a child.
 * Used consistently across ChildApp (celebration popups), ChildRewards, ChildProgress, and ParentDashboard.
 */
export function evaluateChildBadges(child: Child | null | undefined): EvaluatedBadge[] {
  if (!child) return [];

  const completedMap = child.completed || {};
  const completedIds = Object.keys(completedMap).filter((k) => Boolean(completedMap[k]));
  const completedCount = completedIds.length;
  const currentXP = Number(child.xp) || 0;
  const { streak, bestStreak } = computeEffectiveStreak(child);
  const maxStreak = Math.max(streak, bestStreak);
  const savedBadges = Array.isArray(child.badges) ? child.badges : [];

  // Quiz calculations (quizResults stores score as 0-100 percentage)
  const quizResultsObj = (child.quizResults || {}) as Record<string, { score?: number; totalQuestions?: number }>;
  const quizEntries = Object.values(quizResultsObj).filter((q) => q && typeof q.score === "number");
  const perfectQuizzesCount = quizEntries.filter(
    (q) => (q.score ?? 0) >= 100 || (q.totalQuestions && q.totalQuestions > 0 && q.score === q.totalQuestions)
  ).length;

  // AI Foundations lessons completed
  const course = CURRICULUM[child.ageGroup] || CURRICULUM["early explorers"];
  const modules = course?.modules || [];
  const prefix =
    child.ageGroup === "early explorers"
      ? "t-a1"
      : child.ageGroup === "future builders"
      ? "p-a1"
      : "j-a1";
  const oldPrefix =
    child.ageGroup === "early explorers"
      ? "t-m"
      : child.ageGroup === "future builders"
      ? "p-m"
      : "j-m";
  const aiModules = modules.filter((m) => m.id.startsWith(prefix) || m.id.startsWith(oldPrefix));
  const totalAiLessonsInPathway = aiModules.reduce((acc, m) => acc + (m.lessons || []).length, 0);
  const aiPathwayTarget = Math.max(1, totalAiLessonsInPathway);
  const completedAiLessonsCount =
    aiModules.length > 0
      ? aiModules.reduce(
          (acc, m) => acc + (m.lessons || []).filter((l: any) => Boolean(completedMap[l.id])).length,
          0
        )
      : completedCount;

  // Cybersecurity & Digital Citizenship lessons and games
  const cyberPrefix =
    child.ageGroup === "early explorers"
      ? "t-a2"
      : child.ageGroup === "future builders"
      ? "p-a2"
      : "j-a2";
  const cyberModules = modules.filter((m) => m.id.startsWith(cyberPrefix));
  const completedCyberLessons = cyberModules.reduce(
    (acc, m) => acc + (m.lessons || []).filter((l: any) => Boolean(completedMap[l.id])).length,
    0
  );
  const savedGames: string[] = (child as any).completedGames || [];
  const cyberGamesCount = savedGames.filter((g) => g === "phishing-swipe" || g === "cyber-shield").length;
  const calculatedCyberXP = completedCyberLessons * 100 + cyberGamesCount * 150;
  const cyberXP = Math.min(500, Math.max(calculatedCyberXP, currentXP >= 500 && (completedCyberLessons > 0 || cyberGamesCount > 0) ? 500 : calculatedCyberXP));

  const hasSaved = (...ids: string[]) => ids.some((id) => savedBadges.includes(id));

  const definitions: Omit<EvaluatedBadge, "progressPct">[] = [
    {
      id: "first-completed",
      step: 1,
      name: "First Step Explorer",
      icon: "🏅",
      emoji: "🏅",
      desc: "Complete your very first lesson and set sail on your CLATS journey.",
      howToEarn: "Step 1: Finish 1 curriculum lesson",
      unlocked: completedCount >= 1 || hasSaved("first-completed", "bdg-ai-newbie"),
      unlockedLabel: "Step 1 Complete",
      progressCurrent: Math.min(1, completedCount),
      progressTarget: 1,
      progressUnit: "Lesson",
      color: "text-[#2EC4B6] border-[#2EC4B6]"
    },
    {
      id: "badge_3_day_spark",
      step: 2,
      name: "3-Day Spark",
      icon: "🔥",
      emoji: "🔥",
      desc: "Build a daily learning habit by studying 3 days in a row.",
      howToEarn: "Step 2: Reach a 3-day learning streak",
      unlocked: maxStreak >= 3 || hasSaved("badge_3_day_spark"),
      unlockedLabel: "Step 2 Complete",
      progressCurrent: Math.min(3, maxStreak),
      progressTarget: 3,
      progressUnit: "Days",
      color: "text-orange-500 border-orange-400"
    },
    {
      id: "ai-explorer",
      step: 3,
      name: "AI Explorer",
      icon: "🤖",
      emoji: "🤖",
      desc: "Complete all lessons in the foundational AI & Emerging Technologies pathway.",
      howToEarn: "Step 3: Finish the AI & Emerging Technologies pathway",
      unlocked: completedAiLessonsCount >= aiPathwayTarget || hasSaved("ai-explorer"),
      unlockedLabel: "Step 3 Complete",
      progressCurrent: Math.min(aiPathwayTarget, completedAiLessonsCount),
      progressTarget: aiPathwayTarget,
      progressUnit: "AI Lessons",
      color: "text-indigo-400 border-indigo-400"
    },
    {
      id: "quiz-champ",
      step: 4,
      name: "Quiz Champion",
      icon: "🎯",
      emoji: "🎯",
      desc: "Score a flawless 100% on any lesson assessment quiz.",
      howToEarn: "Step 4: Score 100% on 1 lesson quiz",
      unlocked: perfectQuizzesCount >= 1 || hasSaved("quiz-champ", "badge_flawless_victory"),
      unlockedLabel: "Step 4 Complete",
      progressCurrent: Math.min(1, perfectQuizzesCount),
      progressTarget: 1,
      progressUnit: "Perfect Quiz",
      color: "text-[#FFD166] border-[#FFD166]"
    },
    {
      id: "bdg-cyber-shield",
      step: 5,
      name: "Cyber Shield",
      icon: "🛡️",
      emoji: "🛡️",
      desc: "Power up your digital armor by earning 500 XP from cybersecurity & digital citizenship lessons and games.",
      howToEarn: "Step 5: Earn 500 XP from Cybersecurity lessons & games",
      unlocked: cyberXP >= 500 || hasSaved("bdg-cyber-shield"),
      unlockedLabel: "Step 5 Complete",
      progressCurrent: cyberXP,
      progressTarget: 500,
      progressUnit: "Cyber XP",
      color: "text-teal-400 border-teal-400"
    },
    {
      id: "future-thinker",
      step: 6,
      name: "Future Thinker",
      icon: "🌟",
      emoji: "🌟",
      desc: "Grow your knowledge bank to 500+ total XP.",
      howToEarn: "Step 6: Reach 500 XP in your wallet",
      unlocked: currentXP >= 500 || hasSaved("future-thinker", "bdg-prompt-pro"),
      unlockedLabel: "Step 6 Complete",
      progressCurrent: Math.min(500, currentXP),
      progressTarget: 500,
      progressUnit: "XP",
      color: "text-amber-400 border-amber-300"
    },
    {
      id: "smart-learner",
      step: 7,
      name: "Smart Learner",
      icon: "🧩",
      emoji: "🧩",
      desc: "Master the fundamentals by completing 20 curriculum lessons.",
      howToEarn: "Step 7: Complete 20 curriculum lessons in total",
      unlocked: completedCount >= 20 || hasSaved("smart-learner"),
      unlockedLabel: "Step 7 Complete",
      progressCurrent: Math.min(20, completedCount),
      progressTarget: 20,
      progressUnit: "Lessons",
      color: "text-[#B8A0FF] border-[#B8A0FF]"
    },
    {
      id: "streak-consistent",
      step: 8,
      name: "Consistency Star",
      icon: "👑",
      emoji: "👑",
      desc: "Maintain a 7-day learning streak or reach 1,000+ XP as a Bronze Scholar.",
      howToEarn: "Step 8: Reach a 7-day streak (or 1,000 XP)",
      unlocked:
        maxStreak >= 7 ||
        currentXP >= 1000 ||
        hasSaved("streak-consistent", "badge_bronze_scholar"),
      unlockedLabel: "Step 8 Complete",
      progressCurrent: maxStreak >= 7 ? 7 : Math.min(7, Math.max(maxStreak, Math.floor((currentXP / 1000) * 7))),
      progressTarget: 7,
      progressUnit: "Days",
      color: "text-rose-500 border-rose-400"
    }
  ];

  return definitions.map((b) => ({
    ...b,
    progressPct: b.unlocked
      ? 100
      : Math.min(100, Math.max(0, Math.round((b.progressCurrent / Math.max(1, b.progressTarget)) * 100)))
  }));
}

/**
 * Evaluates the 6 sequenced Adventure Stickers for Ages 6–10 (Early Explorers).
 */
export function evaluateAdventureStickers(child: Child | null | undefined): EvaluatedSticker[] {
  if (!child) return [];

  const completedMap = child.completed || {};
  const completedCount = Object.keys(completedMap).filter((k) => Boolean(completedMap[k])).length;
  const totalStars = Object.values(child.stars || {}).reduce((acc: number, s: any) => acc + (Number(s) || 0), 0);
  const currentXP = Number(child.xp) || 0;
  const { streak, bestStreak } = computeEffectiveStreak(child);
  const maxStreak = Math.max(streak, bestStreak);

  return [
    {
      id: "koala",
      step: 1,
      emoji: "🐨",
      name: "Playful Koala",
      desc: "Welcome sticker for starting your CLATS adventure!",
      howToEarn: "Step 1: Join CLATS Academy",
      unlocked: true,
      progressText: "1 / 1 Joined",
      color: "from-[#FFD166] to-amber-500"
    },
    {
      id: "whale",
      step: 2,
      emoji: "🐳",
      name: "Ocean Explorer",
      desc: "Complete your first lesson to dive into discovery!",
      howToEarn: "Step 2: Complete 1 lesson",
      unlocked: completedCount >= 1,
      progressText: `${Math.min(1, completedCount)} / 1 Lesson`,
      color: "from-[#2EC4B6] to-teal-600"
    },
    {
      id: "dinotech",
      step: 3,
      emoji: "🦖",
      name: "Dino-Coder",
      desc: "Complete 2 lessons to awaken the Dino-Coder!",
      howToEarn: "Step 3: Complete 2 lessons",
      unlocked: completedCount >= 2,
      progressText: `${Math.min(2, completedCount)} / 2 Lessons`,
      color: "from-[#B8A0FF] to-violet-600"
    },
    {
      id: "star_badge",
      step: 4,
      emoji: "⭐",
      name: "Super Star",
      desc: "Collect 5 or more quiz stars across your lessons!",
      howToEarn: "Step 4: Earn 5+ Lesson Stars",
      unlocked: totalStars >= 5,
      progressText: `${Math.min(5, totalStars)} / 5 Stars`,
      color: "from-amber-300 to-yellow-500"
    },
    {
      id: "leader_lion",
      step: 5,
      emoji: "🦁",
      name: "Leader Lion",
      desc: "Keep a 5-day learning streak roaring strong!",
      howToEarn: "Step 5: Reach a 5-day streak",
      unlocked: maxStreak >= 5,
      progressText: `${Math.min(5, maxStreak)} / 5 Days`,
      color: "from-rose-400 to-red-500"
    },
    {
      id: "rocket",
      step: 6,
      emoji: "🚀",
      name: "Apex Rocket",
      desc: "Blast off into orbit by earning 500+ XP!",
      howToEarn: "Step 6: Earn 500+ XP",
      unlocked: currentXP >= 500,
      progressText: `${Math.min(500, currentXP)} / 500 XP`,
      color: "from-blue-400 to-indigo-600"
    }
  ];
}

/**
 * Lookup dictionary for Celebration Modal in ChildApp.tsx
 */
export const UNIFIED_BADGE_MAP: Record<string, { title: string; icon: string; desc: string }> = {
  "first-completed": {
    title: "First Step Explorer",
    icon: "🏅",
    desc: "Step 1 Complete: You finished your very first CLATS lesson!"
  },
  "bdg-ai-newbie": {
    title: "First Step Explorer",
    icon: "🏅",
    desc: "Step 1 Complete: You finished your very first CLATS lesson!"
  },
  "badge_3_day_spark": {
    title: "3-Day Spark",
    icon: "🔥",
    desc: "Step 2 Complete: You built a 3-day learning streak!"
  },
  "ai-explorer": {
    title: "AI Explorer",
    icon: "🤖",
    desc: "Step 3 Complete: You completed the foundational AI & Emerging Technologies pathway!"
  },
  "quiz-champ": {
    title: "Quiz Champion",
    icon: "🎯",
    desc: "Step 4 Complete: You scored 100% on a lesson quiz!"
  },
  "badge_flawless_victory": {
    title: "Quiz Champion",
    icon: "🎯",
    desc: "Step 4 Complete: You scored 100% on a lesson quiz!"
  },
  "bdg-cyber-shield": {
    title: "Cyber Shield",
    icon: "🛡️",
    desc: "Step 5 Complete: You earned 500 XP across Cybersecurity lessons and games!"
  },
  "future-thinker": {
    title: "Future Thinker",
    icon: "🌟",
    desc: "Step 6 Complete: You reached 500+ XP in your wallet!"
  },
  "bdg-prompt-pro": {
    title: "Future Thinker",
    icon: "🌟",
    desc: "Step 6 Complete: You reached 500+ XP in your wallet!"
  },
  "smart-learner": {
    title: "Smart Learner",
    icon: "🧩",
    desc: "Step 7 Complete: You completed 20 curriculum lessons in total!"
  },
  "streak-consistent": {
    title: "Consistency Star",
    icon: "👑",
    desc: "Step 8 Complete: You achieved a 7-day streak / 1,000+ XP milestone!"
  },
  "badge_bronze_scholar": {
    title: "Consistency Star",
    icon: "👑",
    desc: "Step 8 Complete: You achieved 1,000+ XP as a Bronze Scholar!"
  }
};
