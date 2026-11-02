/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CLATS XP (Experience Points) Sovereign Calculation, Idempotency & Audit Engine.
 * 
 * CORE RULES:
 * 1. XP is ONLY awarded when genuinely earned through approved, completed learning activities.
 * 2. Unsuccessful activities (failed quizzes, score < 50%, incomplete tasks) award 0 XP.
 * 3. Opening, viewing, visiting pages, refreshing, or loading does NOT award XP.
 * 4. Repeating an already rewarded activity awards 0 duplicate XP.
 * 5. Newly enrolled children with no completed activities have an XP total of 0.
 * 6. Zero XP is never recorded as an earning transaction.
 * 7. All XP awards are idempotent, strictly positive (> 0), and tracked with audit references.
 */

import { Child } from "../types";
import { extractChildMeta, mergeChildMetaOntoBadges } from "./childMeta";

/**
 * Standard Approved XP Reward Amounts
 */
export const XP_CONFIG = {
  // Curriculum Lessons & Quizzes
  LESSON_QUIZ_PERFECT: 50, // 100% score on lesson quiz
  LESSON_QUIZ_PASS: 35,    // 50% - 99% score on lesson quiz
  LESSON_QUIZ_FAIL: 0,     // < 50% score ("Needs Review") -> strictly 0 XP

  // Wonder Lab (Practice Sandbox Activities)
  WONDER_LAB_ACTIVITY: 25, // First-time genuine activity completion
  WONDER_LAB_REPLAY: 0,    // Replay of already completed sandbox activity -> strictly 0 XP

  // Educational Games & Quests
  WONDER_WOODS_MEADOW: 20, // Pattern Quest Meadow levels 1-9
  WONDER_WOODS_BOSS: 50,   // Pattern Quest Boss level 10
  GAME_AI_SORTING: 200,    // AI Sorting Challenge
  GAME_SMART_MACHINE: 250, // Smart Machine Match
  GAME_ROBOT_TRAINING: 300,// Train the Robot Challenge
  GAME_SMART_CITY: 150,    // Smart City Builder

  // Streak Habit Milestones (One-time claim per milestone)
  STREAK_3_DAYS: 50,       // 3-day active habit streak
  STREAK_7_DAYS: 150,      // 7-day active habit streak
  STREAK_14_DAYS: 300      // 14-day active habit streak
} as const;

export type XpCategory =
  | "lesson_quiz"
  | "wonder_lab"
  | "educational_game"
  | "streak_milestone";

export interface XpTransactionRecord {
  id: string;               // Unique transaction reference, e.g. "tx_c123_lesson_j-a1m1-l1_1690000000"
  childId: string;
  activityId: string;       // Unique activity or lesson ID
  category: XpCategory;
  amount: number;           // Strictly positive (> 0)
  earnedAt: string;         // ISO timestamp
  reason: string;
}

/**
 * Checks if a specific activity has already been awarded XP for a given child.
 * Verifies against:
 * 1. Child's embedded XP ledger (persisted via childMeta).
 * 2. Child's completed lessons and quiz results.
 * 3. Child's completed games list / claimed streak milestones.
 */
export function isActivityAlreadyRewarded(
  child: Partial<Child> | null | undefined,
  category: XpCategory,
  activityId: string
): boolean {
  if (!child || !activityId) return false;

  // 1. Check embedded child metadata ledger
  const meta = extractChildMeta(child);
  const ledger = (meta as any)?.xpLedger as Record<string, XpTransactionRecord> | undefined;
  const ledgerKey = `${category}:${activityId}`;
  if (ledger && ledger[ledgerKey] && ledger[ledgerKey].amount > 0) {
    return true;
  }

  // 2. Check category-specific existing completion state
  if (category === "lesson_quiz") {
    const isCompleted = Boolean(child.completed && child.completed[activityId]);
    const quizResult = child.quizResults && child.quizResults[activityId];
    // If the quiz is already marked as passed in historical quizResults, it was already rewarded
    if (isCompleted && quizResult && quizResult.status === "Passed" && quizResult.score >= 50) {
      return true;
    }
  }

  if (category === "streak_milestone") {
    const claimed = meta.claimedMilestones || [];
    if (claimed.includes(activityId)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates genuine XP to award for a lesson quiz completion.
 * Enforces:
 * - Unsuccessful quiz (score < 50% or status === "Needs Review") -> 0 XP.
 * - Already rewarded lesson -> 0 XP.
 * - Perfect score (100%) -> 50 XP.
 * - Passing score (>= 50%) -> 35 XP.
 */
export function calculateLessonQuizXp(
  score: number,
  status: "Passed" | "Needs Review",
  isAlreadyRewarded: boolean
): number {
  if (isAlreadyRewarded) return 0;
  if (status !== "Passed" || score < 50) return 0;
  if (score === 100) return XP_CONFIG.LESSON_QUIZ_PERFECT;
  return XP_CONFIG.LESSON_QUIZ_PASS;
}

/**
 * Processes an XP earning event with strict idempotency and audit trail.
 * Returns the updated child and the exact amount of XP awarded (0 if ineligible or already rewarded).
 */
export function awardGenuinelyEarnedXp(
  child: Child,
  params: {
    activityId: string;
    category: XpCategory;
    amount: number;
    reason: string;
    conditionSatisfied: boolean;
  }
): {
  updatedChild: Child;
  xpAwarded: number;
  transaction: XpTransactionRecord | null;
} {
  const { activityId, category, amount, reason, conditionSatisfied } = params;

  // Rule: Condition must be satisfied
  if (!conditionSatisfied) {
    return { updatedChild: child, xpAwarded: 0, transaction: null };
  }

  // Rule: Must be positive numeric amount
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return { updatedChild: child, xpAwarded: 0, transaction: null };
  }

  // Rule: Idempotency check — cannot be awarded twice
  if (isActivityAlreadyRewarded(child, category, activityId)) {
    return { updatedChild: child, xpAwarded: 0, transaction: null };
  }

  const timestamp = new Date().toISOString();
  const txId = `tx_${child.id.slice(0, 8)}_${category}_${activityId.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}`;

  const transaction: XpTransactionRecord = {
    id: txId,
    childId: child.id,
    activityId,
    category,
    amount,
    earnedAt: timestamp,
    reason
  };

  // Record transaction in child's embedded metadata ledger
  const currentMeta = extractChildMeta(child);
  const currentLedger = ((currentMeta as any)?.xpLedger || {}) as Record<string, XpTransactionRecord>;
  const ledgerKey = `${category}:${activityId}`;

  const nextLedger = {
    ...currentLedger,
    [ledgerKey]: transaction
  };

  const updatedBadges = mergeChildMetaOntoBadges(child.badges, {
    ...(currentMeta as any),
    xpLedger: nextLedger
  });

  const nextTotalXp = Math.max(0, (child.xp || 0) + amount);

  const updatedChild: Child = {
    ...child,
    xp: nextTotalXp,
    badges: updatedBadges
  };

  return {
    updatedChild,
    xpAwarded: amount,
    transaction
  };
}

/**
 * Reconciles and verifies the genuine earned XP for a child.
 * Audits historical passed quizzes, verified sandbox activities, and valid games.
 */
export function auditAndReconcileChildXp(child: Partial<Child>): {
  currentRecordedXp: number;
  verifiedEarnedXp: number;
  isAccurate: boolean;
  breakdown: {
    passedQuizzesCount: number;
    quizXp: number;
    claimedStreakMilestonesCount: number;
    streakXp: number;
  };
} {
  const recordedXp = Math.max(0, Number(child.xp) || 0);

  // 1. Audit quiz completions
  const quizResults = child.quizResults || {};
  let quizXp = 0;
  let passedQuizzesCount = 0;

  for (const [lessonId, q] of Object.entries(quizResults)) {
    if (q && q.status === "Passed" && Number(q.score) >= 50) {
      passedQuizzesCount++;
      if (Number(q.score) === 100) {
        quizXp += XP_CONFIG.LESSON_QUIZ_PERFECT;
      } else {
        quizXp += XP_CONFIG.LESSON_QUIZ_PASS;
      }
    }
  }

  // 2. Audit claimed streak milestones
  const meta = extractChildMeta(child);
  const claimedMilestones = meta.claimedMilestones || [];
  let streakXp = 0;
  for (const mId of claimedMilestones) {
    if (mId === "3-Days-Reward") streakXp += XP_CONFIG.STREAK_3_DAYS;
    if (mId === "7-Days-Reward") streakXp += XP_CONFIG.STREAK_7_DAYS;
    if (mId === "14-Days-Reward") streakXp += XP_CONFIG.STREAK_14_DAYS;
  }

  // Baseline verified XP from verifiable server records
  const verifiedEarnedXp = quizXp + streakXp;

  return {
    currentRecordedXp: recordedXp,
    verifiedEarnedXp,
    isAccurate: recordedXp === verifiedEarnedXp,
    breakdown: {
      passedQuizzesCount,
      quizXp,
      claimedStreakMilestonesCount: claimedMilestones.length,
      streakXp
    }
  };
}
