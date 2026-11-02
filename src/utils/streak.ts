/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Daily Learning Streak Engine for CLATS Child Portal.
 * Provides a single source of truth for streak calculation, daily activity recording,
 * cross-device Supabase activity-date synchronization, rolling week/month calendar
 * visualization, encouraging child-friendly messaging, and streak milestone rewards.
 */

import { Child } from "../types";
import { extractChildMeta, mergeChildMetaOntoBadges } from "./childMeta";

export interface StreakStatus {
  streak: number;
  bestStreak: number;
  lastActiveAt: string | null;
  activeToday: boolean;
  /** True if the child had a previous streak that paused after missing >=1 calendar day */
  returningAfterMiss: boolean;
  /** Total unique calendar days recorded */
  totalActiveDays: number;
}

export interface WeekDayStreakItem {
  dayName: string;
  dateStr: string;
  isCompleted: boolean;
  isToday: boolean;
}

export interface StreakMilestoneDef {
  id: string;
  days: number;
  xp: number;
  title: string;
  subtitle: string;
}

export interface SystemStreakRules {
  qualifyLessonPass: boolean;
  qualifyPracticeSandbox: boolean;
  qualifyEducationalGames: boolean;
  encourageGentleRecovery: boolean;
  milestones: StreakMilestoneDef[];
  milestoneDays?: number[];
  updatedAt?: string;
}

export const DEFAULT_STREAK_MILESTONES: StreakMilestoneDef[] = [
  { id: "3-Days-Reward", days: 3, xp: 50, title: "3 Days Streak", subtitle: "+50 XP Bonus" },
  { id: "7-Days-Reward", days: 7, xp: 150, title: "7 Days Streak", subtitle: "+150 XP Bonus" },
  { id: "14-Days-Reward", days: 14, xp: 300, title: "14 Days Streak", subtitle: "+300 XP Quantum Chest" }
];

export const STREAK_MILESTONES: StreakMilestoneDef[] = DEFAULT_STREAK_MILESTONES;

const STREAK_RULES_STORAGE_KEY = "clats_system_streak_rules_v1";

export function getSystemStreakRules(): SystemStreakRules {
  const defaults: SystemStreakRules = {
    qualifyLessonPass: true,
    qualifyPracticeSandbox: true,
    qualifyEducationalGames: true,
    encourageGentleRecovery: true,
    milestones: DEFAULT_STREAK_MILESTONES,
    milestoneDays: [3, 7, 14]
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STREAK_RULES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const ms = Array.isArray(parsed.milestones) && parsed.milestones.length > 0
          ? parsed.milestones
          : DEFAULT_STREAK_MILESTONES;
        return {
          ...defaults,
          ...parsed,
          milestones: ms,
          milestoneDays: ms.map((m: any) => m.days)
        };
      }
    }
  } catch {}
  return defaults;
}

export function saveSystemStreakRules(rules: Partial<SystemStreakRules>): SystemStreakRules {
  const merged: SystemStreakRules = {
    ...getSystemStreakRules(),
    ...rules,
    updatedAt: new Date().toISOString()
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STREAK_RULES_STORAGE_KEY, JSON.stringify(merged));
    } catch {}
  }
  return merged;
}

/**
 * Formats a Date or ISO date string into local YYYY-MM-DD calendar date.
 * Handles midnight boundaries in the user's local timezone consistently.
 */
export function toLocalDateStr(input?: Date | string | null): string | null {
  if (!input) return null;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return input.trim();
  }
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates whole calendar days between two YYYY-MM-DD strings (toDateStr - fromDateStr).
 */
export function getCalendarDaysDiff(fromDateStr: string, toDateStr: string): number {
  const [y1, m1, d1] = fromDateStr.split("-").map(Number);
  const [y2, m2, d2] = toDateStr.split("-").map(Number);
  const utc1 = Date.UTC(y1, (m1 || 1) - 1, d1 || 1);
  const utc2 = Date.UTC(y2, (m2 || 1) - 1, d2 || 1);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Collects all known activity date strings (YYYY-MM-DD) for a child from:
 * 1. Cloud-synced child metadata (`__clats_meta__.activityDates` in `clats_children.badges`)
 * 2. `last_active_at` timestamp
 * 3. `quizResults` completion timestamps
 * 4. Browser `localStorage` fallback (`clats_activity_dates_${child.id}`)
 */
export function getChildActivityDateSet(child?: Partial<Child> | null): Set<string> {
  const dates = new Set<string>();
  if (!child) return dates;

  // 1. Cloud-synced activityDates from child metadata
  const meta = extractChildMeta(child);
  if (Array.isArray(meta.activityDates)) {
    meta.activityDates.forEach((d) => {
      if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        dates.add(d);
      }
    });
  }

  // 2. Latest active timestamp from DB
  const lastActiveDate = toLocalDateStr(child.last_active_at);
  if (lastActiveDate) {
    dates.add(lastActiveDate);
  }

  // 3. Quiz completion timestamps from DB
  if (child.quizResults && typeof child.quizResults === "object") {
    Object.values(child.quizResults).forEach((q: any) => {
      const dStr = toLocalDateStr(q?.completedAt);
      if (dStr) dates.add(dStr);
    });
  }

  // 4. LocalStorage history on current device
  if (typeof window !== "undefined" && child.id) {
    try {
      const raw = localStorage.getItem(`clats_activity_dates_${child.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((d) => {
            if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
              dates.add(d);
            }
          });
        }
      }
    } catch {}
  }

  return dates;
}

/**
 * Saves a YYYY-MM-DD date into the child's local activity history.
 */
export function persistChildActivityDate(childId?: string, dateStr?: string) {
  if (typeof window === "undefined" || !childId) return;
  const targetDate = dateStr || toLocalDateStr(new Date());
  if (!targetDate) return;
  try {
    const key = `clats_activity_dates_${childId}`;
    const raw = localStorage.getItem(key);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    if (!existing.includes(targetDate)) {
      const updated = [...existing, targetDate].slice(-90); // Keep last 90 days
      localStorage.setItem(key, JSON.stringify(updated));
    }
    localStorage.removeItem(`clats_streak_${childId}`);
  } catch {}
}

/**
 * Computes the child's effective current streak and best streak dynamically.
 * - Uses both `streak_count` and `streak` fields so B2B and regular profiles match.
 * - Verifies `last_active_at` (or latest activity date) so expired streaks (>1 day gap) reset to 0.
 * - Recovers consecutive streak from cloud-synced `activityDates` and `quizResults` timestamps.
 * - Never awards multiple streak days for multiple activities on the same calendar day.
 */
export function computeEffectiveStreak(
  child?: Partial<Child> | null,
  referenceDate: Date = new Date()
): StreakStatus {
  if (!child) {
    return {
      streak: 0,
      bestStreak: 0,
      lastActiveAt: null,
      activeToday: false,
      returningAfterMiss: false,
      totalActiveDays: 0
    };
  }

  const todayStr = toLocalDateStr(referenceDate)!;
  const rawStreak = Math.max(Number(child.streak_count) || 0, Number(child.streak) || 0);
  const rawBest = Math.max(Number(child.best_streak) || 0, rawStreak);

  // Gather all known unique activity dates sorted descending (newest first)
  const dateSet = getChildActivityDateSet(child);
  const activityDates = Array.from(dateSet).sort().reverse();
  const latestActivityDate = toLocalDateStr(child.last_active_at) || activityDates[0] || null;

  // Also compute longest consecutive run from known history dates
  let longestFromHistory = 0;
  if (activityDates.length > 0) {
    let run = 1;
    longestFromHistory = 1;
    for (let i = 0; i < activityDates.length - 1; i++) {
      const diff = getCalendarDaysDiff(activityDates[i + 1], activityDates[i]);
      if (diff === 1) {
        run++;
        if (run > longestFromHistory) longestFromHistory = run;
      } else if (diff > 1) {
        run = 1;
      }
    }
  }

  const resolvedBestBase = Math.max(rawBest, longestFromHistory);

  if (latestActivityDate) {
    const daysSinceLast = getCalendarDaysDiff(latestActivityDate, todayStr);
    const activeToday = daysSinceLast === 0;

    // Count consecutive days ending at latestActivityDate
    let consecutiveFromHistory = 0;
    if (activityDates.length > 0 && (daysSinceLast === 0 || daysSinceLast === 1)) {
      consecutiveFromHistory = 1;
      for (let i = 0; i < activityDates.length - 1; i++) {
        const diff = getCalendarDaysDiff(activityDates[i + 1], activityDates[i]);
        if (diff === 1) {
          consecutiveFromHistory++;
        } else if (diff > 1) {
          break;
        }
      }
    }

    if (daysSinceLast === 0 || daysSinceLast === 1) {
      // Streak is alive (completed an activity today or yesterday)
      const effectiveStreak = Math.max(1, rawStreak, consecutiveFromHistory);
      const effectiveBest = Math.max(resolvedBestBase, effectiveStreak);
      return {
        streak: effectiveStreak,
        bestStreak: effectiveBest,
        lastActiveAt: child.last_active_at || latestActivityDate,
        activeToday,
        returningAfterMiss: false,
        totalActiveDays: dateSet.size
      };
    }

    if (daysSinceLast > 1) {
      // Missed 1+ full calendar days -> current streak resets to 0 until next qualifying activity,
      // while preserving bestStreak and flagging returningAfterMiss for gentle encouragement.
      return {
        streak: 0,
        bestStreak: resolvedBestBase,
        lastActiveAt: child.last_active_at || latestActivityDate,
        activeToday: false,
        returningAfterMiss: resolvedBestBase > 0,
        totalActiveDays: dateSet.size
      };
    }
  }

  // Fallback for legacy profiles that completed lessons before last_active_at was synced
  const completedCount = Object.keys(child.completed || (child as any).completedLessons || {}).filter(
    (k) => (child.completed || (child as any).completedLessons)?.[k]
  ).length;

  if (rawStreak > 0) {
    return {
      streak: rawStreak,
      bestStreak: Math.max(resolvedBestBase, rawStreak),
      lastActiveAt: child.last_active_at || null,
      activeToday: false,
      returningAfterMiss: false,
      totalActiveDays: Math.max(dateSet.size, rawStreak)
    };
  }

  if (completedCount > 0) {
    return {
      streak: 1,
      bestStreak: Math.max(resolvedBestBase, 1),
      lastActiveAt: null,
      activeToday: false,
      returningAfterMiss: false,
      totalActiveDays: Math.max(1, dateSet.size)
    };
  }

  return {
    streak: 0,
    bestStreak: resolvedBestBase,
    lastActiveAt: null,
    activeToday: false,
    returningAfterMiss: false,
    totalActiveDays: dateSet.size
  };
}

/**
 * Records a qualifying learning activity today (lesson/quiz pass, Practice Sandbox completion,
 * or educational game completion) and returns the updated streak fields + cloud-synced badges metadata.
 *
 * Guarantees:
 * - Completing multiple activities on the same calendar day (`diff === 0`) NEVER increments the streak more than once.
 * - Completing an activity on consecutive calendar days (`diff === 1`) increments the streak by +1.
 * - Returning after missing a day (`diff > 1`) starts a fresh 1-day streak while preserving `best_streak`.
 */
export function recordDailyActivityStreak(
  child: Partial<Child>,
  nowDate: Date = new Date()
): {
  streak_count: number;
  streak: number;
  best_streak: number;
  last_active_at: string;
  badges: string[];
  advancedToday: boolean;
} {
  const nowIso = nowDate.toISOString();
  const todayStr = toLocalDateStr(nowDate)!;
  const currentStatus = computeEffectiveStreak(child, nowDate);
  const existingDates = getChildActivityDateSet(child);
  const alreadyActiveToday = existingDates.has(todayStr) || currentStatus.activeToday;

  const sortedPriorDates = Array.from(existingDates)
    .filter((d) => d !== todayStr)
    .sort()
    .reverse();

  const lastDateStr =
    (toLocalDateStr(child.last_active_at) !== todayStr ? toLocalDateStr(child.last_active_at) : null) ||
    sortedPriorDates[0] ||
    toLocalDateStr(currentStatus.lastActiveAt);

  let nextStreak = 1;
  let advancedToday = false;

  if (alreadyActiveToday) {
    // Already completed a qualifying activity on this calendar day — keep current streak (minimum 1)
    nextStreak = Math.max(1, currentStatus.streak);
    advancedToday = false;
  } else if (lastDateStr) {
    const diff = getCalendarDaysDiff(lastDateStr, todayStr);
    if (diff === 0) {
      nextStreak = Math.max(1, currentStatus.streak);
      advancedToday = false;
    } else if (diff === 1) {
      // Learned yesterday and today -> increment consecutive streak!
      nextStreak = Math.max(1, currentStatus.streak) + 1;
      advancedToday = true;
    } else if (diff < 0) {
      // Clock skew guard
      nextStreak = Math.max(1, currentStatus.streak);
      advancedToday = false;
    } else {
      // Missed >= 1 full calendar day -> start fresh 1-day streak today
      nextStreak = 1;
      advancedToday = true;
    }
  } else {
    // First-ever qualifying activity!
    nextStreak = 1;
    advancedToday = true;
  }

  const nextBest = Math.max(nextStreak, currentStatus.bestStreak, Number(child.best_streak) || 0);

  if (child.id) {
    persistChildActivityDate(child.id, todayStr);
  }

  const updatedActivityDates = Array.from(new Set([...Array.from(existingDates), todayStr]))
    .sort()
    .slice(-90);

  const updatedBadges = mergeChildMetaOntoBadges(child.badges, {
    activityDates: updatedActivityDates
  });

  return {
    streak_count: nextStreak,
    streak: nextStreak,
    best_streak: nextBest,
    last_active_at: nowIso,
    badges: updatedBadges,
    advancedToday
  };
}

/**
 * Generates encouraging, non-punitive, child-friendly streak feedback for Young Explorers (ages 6–10).
 */
export function getEncouragingStreakMessage(
  child?: Partial<Child> | null,
  companionName: string = "Kobe"
): {
  headline: string;
  subtext: string;
  milestoneBanner: string | null;
  tone: "celebrate" | "continue" | "welcome_back" | "start";
} {
  const status = computeEffectiveStreak(child);
  const { streak, bestStreak, activeToday, returningAfterMiss } = status;

  let milestoneBanner: string | null = null;
  if (streak === 3) milestoneBanner = "🎉 3-Day Spark Milestone! You are building a super habit!";
  else if (streak === 5) milestoneBanner = "🌟 5-Day High-Five Streak! Keep shining, Explorer!";
  else if (streak === 7) milestoneBanner = "🏆 7-Day Super Week! A whole week of curious learning!";
  else if (streak === 14) milestoneBanner = "🚀 14-Day Champion Streak! Two weeks of awesome discovery!";
  else if (streak > 0 && streak % 10 === 0) milestoneBanner = `👑 ${streak}-Day Explorer Legend!`;

  if (activeToday && streak >= 1) {
    return {
      headline:
        streak === 1
          ? `Day 1 Streak Lit! Great start!`
          : `${streak}-Day Learning Streak!`,
      subtext: `${companionName} says: "Awesome job learning today! Your ${streak}-day adventure spark is glowing bright!"`,
      milestoneBanner,
      tone: "celebrate"
    };
  }

  if (!activeToday && streak >= 1) {
    return {
      headline: `${streak}-Day Streak Ready to Grow!`,
      subtext: `${companionName} says: "Welcome back! Complete 1 fun lesson or Wonder Lab activity today to reach Day ${streak + 1}!"`,
      milestoneBanner,
      tone: "continue"
    };
  }

  if (returningAfterMiss) {
    return {
      headline: `Fresh Adventure Day! (Best: ${bestStreak} ${bestStreak === 1 ? "Day" : "Days"})`,
      subtext: `${companionName} says: "So happy to see you back! Every day is a brand-new adventure — complete 1 activity today to spark a new streak!"`,
      milestoneBanner: null,
      tone: "welcome_back"
    };
  }

  return {
    headline: "Start Your 1st Learning Streak!",
    subtext: `${companionName} says: "Complete any lesson, quiz, or Wonder Lab activity today to light your very first adventure spark!"`,
    milestoneBanner: null,
    tone: "start"
  };
}

/**
 * Generates the current Monday-Sunday week with accurate `isToday` and `isCompleted` flags.
 */
export function getCurrentWeekStreakDays(child?: Partial<Child> | null): WeekDayStreakItem[] {
  const now = new Date();
  const todayStr = toLocalDateStr(now)!;
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const { streak, lastActiveAt } = computeEffectiveStreak(child);
  const activityDates = getChildActivityDateSet(child);
  const anchorDateStr = toLocalDateStr(lastActiveAt) || (streak > 0 ? todayStr : null);

  const labels = ["M", "T", "W", "T", "F", "S", "S"];

  return labels.map((dayName, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + i);
    const dStr = toLocalDateStr(d)!;
    const isToday = dStr === todayStr;

    let withinActiveStreakWindow = false;
    if (streak > 0 && anchorDateStr) {
      const diffFromAnchor = getCalendarDaysDiff(dStr, anchorDateStr);
      if (diffFromAnchor >= 0 && diffFromAnchor < streak) {
        withinActiveStreakWindow = true;
      }
    }

    const isCompleted = activityDates.has(dStr) || withinActiveStreakWindow;

    return {
      dayName,
      dateStr: dStr,
      isCompleted,
      isToday
    };
  });
}

/**
 * Returns unified claimed streak milestone IDs for a child (from both cloud metadata and localStorage).
 */
export function getClaimedStreakMilestones(
  childId?: string,
  completedCount: number = 1,
  child?: Partial<Child> | null
): string[] {
  if (!childId || completedCount === 0) return [];
  const metaClaims = extractChildMeta(child).claimedMilestones || [];
  if (typeof window === "undefined") return metaClaims;
  try {
    const a = localStorage.getItem(`clats_claimed_milestones_${childId}`);
    const b = localStorage.getItem(`clats_profile_claims_${childId}`);
    const listA: string[] = a ? JSON.parse(a) : [];
    const listB: string[] = b ? JSON.parse(b) : [];
    return Array.from(new Set([...metaClaims, ...listA, ...listB]));
  } catch {
    return metaClaims;
  }
}

/**
 * Persists a claimed streak milestone ID across both localStorage and returns updated badges array for Supabase sync.
 */
export function saveClaimedStreakMilestones(
  childId: string,
  claimedIds: string[],
  existingBadges?: string[]
): string[] {
  const unique = Array.from(new Set(claimedIds));
  if (typeof window !== "undefined" && childId) {
    try {
      const serialized = JSON.stringify(unique);
      localStorage.setItem(`clats_claimed_milestones_${childId}`, serialized);
      localStorage.setItem(`clats_profile_claims_${childId}`, serialized);
    } catch {}
  }
  return mergeChildMetaOntoBadges(existingBadges, {
    claimedMilestones: unique
  });
}
