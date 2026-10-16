/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Daily Learning Streak Engine for CLATS Child Portal.
 * Provides a single source of truth for streak calculation, daily activity recording,
 * rolling week/month calendar visualization, and streak milestone rewards.
 */

import { Child } from "../types";

export interface StreakStatus {
  streak: number;
  bestStreak: number;
  lastActiveAt: string | null;
  activeToday: boolean;
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

export const STREAK_MILESTONES: StreakMilestoneDef[] = [
  { id: "3-Days-Reward", days: 3, xp: 50, title: "3 Days Streak", subtitle: "+50 XP Bonus" },
  { id: "7-Days-Reward", days: 7, xp: 150, title: "7 Days Streak", subtitle: "+150 XP Bonus" },
  { id: "14-Days-Reward", days: 14, xp: 300, title: "14 Days Streak", subtitle: "+300 XP Quantum Chest" }
];

/**
 * Formats a Date or ISO date string into local YYYY-MM-DD calendar date.
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
 * Calculates whole calendar days between two YYYY-MM-DD strings (b - a).
 */
export function getCalendarDaysDiff(fromDateStr: string, toDateStr: string): number {
  const [y1, m1, d1] = fromDateStr.split("-").map(Number);
  const [y2, m2, d2] = toDateStr.split("-").map(Number);
  const utc1 = Date.UTC(y1, (m1 || 1) - 1, d1 || 1);
  const utc2 = Date.UTC(y2, (m2 || 1) - 1, d2 || 1);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Collects all known activity date strings (YYYY-MM-DD) for a child from quizResults,
 * last_active_at, and localStorage history.
 */
export function getChildActivityDateSet(child?: Partial<Child> | null): Set<string> {
  const dates = new Set<string>();
  if (!child) return dates;

  const lastActiveDate = toLocalDateStr(child.last_active_at);
  if (lastActiveDate) {
    dates.add(lastActiveDate);
  }

  if (child.quizResults && typeof child.quizResults === "object") {
    Object.values(child.quizResults).forEach((q: any) => {
      const dStr = toLocalDateStr(q?.completedAt);
      if (dStr) dates.add(dStr);
    });
  }

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
    // Clean up legacy hardcoded localStorage key if present
    localStorage.removeItem(`clats_streak_${childId}`);
  } catch {}
}

/**
 * Computes the child's effective current streak and best streak dynamically.
 * - Uses both `streak_count` and `streak` fields so B2B and regular profiles match.
 * - Verifies `last_active_at` (or latest quiz completion date) so expired streaks (>1 day gap) reset to 0.
 * - Recovers streak from `quizResults` timestamps if `last_active_at` was previously unsynced.
 */
export function computeEffectiveStreak(child?: Partial<Child> | null): StreakStatus {
  if (!child) {
    return { streak: 0, bestStreak: 0, lastActiveAt: null, activeToday: false };
  }

  const todayStr = toLocalDateStr(new Date())!;
  const rawStreak = Math.max(Number(child.streak_count) || 0, Number(child.streak) || 0);
  const rawBest = Math.max(Number(child.best_streak) || 0, rawStreak);

  // Gather all known activity dates sorted descending
  const activityDates = Array.from(getChildActivityDateSet(child)).sort().reverse();
  const latestActivityDate = toLocalDateStr(child.last_active_at) || activityDates[0] || null;

  if (latestActivityDate) {
    const daysSinceLast = getCalendarDaysDiff(latestActivityDate, todayStr);
    const activeToday = daysSinceLast === 0;

    // Count consecutive days from activityDates if available
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
      // Streak is still alive (active today or yesterday)
      const effectiveStreak = Math.max(1, rawStreak, consecutiveFromHistory);
      const effectiveBest = Math.max(rawBest, effectiveStreak);
      return {
        streak: effectiveStreak,
        bestStreak: effectiveBest,
        lastActiveAt: child.last_active_at || latestActivityDate,
        activeToday
      };
    }

    if (daysSinceLast > 1) {
      // Missed one or more full calendar days -> current streak resets to 0 until next activity
      return {
        streak: 0,
        bestStreak: rawBest,
        lastActiveAt: child.last_active_at || latestActivityDate,
        activeToday: false
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
      bestStreak: Math.max(rawBest, rawStreak),
      lastActiveAt: child.last_active_at || null,
      activeToday: false
    };
  }

  if (completedCount > 0) {
    return {
      streak: 1,
      bestStreak: Math.max(rawBest, 1),
      lastActiveAt: null,
      activeToday: false
    };
  }

  return {
    streak: 0,
    bestStreak: rawBest,
    lastActiveAt: null,
    activeToday: false
  };
}

/**
 * Records a learning activity today (lesson completion, quiz pass, or educational game completion)
 * and returns the updated streak fields to merge onto the Child object.
 */
export function recordDailyActivityStreak(child: Partial<Child>): {
  streak_count: number;
  streak: number;
  best_streak: number;
  last_active_at: string;
} {
  const nowIso = new Date().toISOString();
  const todayStr = toLocalDateStr(new Date())!;
  const currentStatus = computeEffectiveStreak(child);
  const lastDateStr = toLocalDateStr(child.last_active_at) || toLocalDateStr(currentStatus.lastActiveAt);

  let nextStreak = 1;
  if (lastDateStr) {
    const diff = getCalendarDaysDiff(lastDateStr, todayStr);
    if (diff === 0) {
      // Already active today — preserve current streak (at least 1)
      nextStreak = Math.max(1, currentStatus.streak);
    } else if (diff === 1) {
      // Active yesterday — increment streak!
      nextStreak = Math.max(1, currentStatus.streak) + 1;
    } else if (diff < 0) {
      // Clock skew guard
      nextStreak = Math.max(1, currentStatus.streak);
    } else {
      // Gap > 1 day — start fresh 1-day streak today
      nextStreak = 1;
    }
  } else {
    nextStreak = Math.max(1, currentStatus.streak);
  }

  const nextBest = Math.max(nextStreak, currentStatus.bestStreak, Number(child.best_streak) || 0);

  if (child.id) {
    persistChildActivityDate(child.id, todayStr);
  }

  return {
    streak_count: nextStreak,
    streak: nextStreak,
    best_streak: nextBest,
    last_active_at: nowIso
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
 * Returns unified claimed streak milestone IDs for a child.
 */
export function getClaimedStreakMilestones(childId?: string, completedCount: number = 1): string[] {
  if (typeof window === "undefined" || !childId || completedCount === 0) return [];
  try {
    const a = localStorage.getItem(`clats_claimed_milestones_${childId}`);
    const b = localStorage.getItem(`clats_profile_claims_${childId}`);
    const listA: string[] = a ? JSON.parse(a) : [];
    const listB: string[] = b ? JSON.parse(b) : [];
    return Array.from(new Set([...listA, ...listB]));
  } catch {
    return [];
  }
}

/**
 * Persists a claimed streak milestone ID across both Rewards and Progress storage keys.
 */
export function saveClaimedStreakMilestones(childId: string, claimedIds: string[]) {
  if (typeof window === "undefined" || !childId) return;
  try {
    const serialized = JSON.stringify(Array.from(new Set(claimedIds)));
    localStorage.setItem(`clats_claimed_milestones_${childId}`, serialized);
    localStorage.setItem(`clats_profile_claims_${childId}`, serialized);
  } catch {}
}
