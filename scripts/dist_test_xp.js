/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CLATS_META_PREFIX = "__clats_meta__:";

const XP_CONFIG = {
  LESSON_QUIZ_PERFECT: 50,
  LESSON_QUIZ_PASS: 35,
  LESSON_QUIZ_FAIL: 0,
  WONDER_LAB_ACTIVITY: 25,
  WONDER_LAB_REPLAY: 0,
  WONDER_WOODS_MEADOW: 20,
  WONDER_WOODS_BOSS: 50,
  GAME_AI_SORTING: 200,
  GAME_SMART_MACHINE: 250,
  GAME_ROBOT_TRAINING: 300,
  GAME_SMART_CITY: 150,
  STREAK_3_DAYS: 50,
  STREAK_7_DAYS: 150,
  STREAK_14_DAYS: 300
};

function extractChildMeta(childOrBadges) {
  if (!childOrBadges) return {};
  const badges = Array.isArray(childOrBadges)
    ? childOrBadges
    : Array.isArray(childOrBadges.badges)
    ? childOrBadges.badges
    : [];
  for (let i = badges.length - 1; i >= 0; i--) {
    const entry = badges[i];
    if (typeof entry === "string" && entry.startsWith(CLATS_META_PREFIX)) {
      try {
        const parsed = JSON.parse(entry.slice(CLATS_META_PREFIX.length));
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch {}
    }
  }
  return {};
}

function getCleanBadges(badges) {
  if (!Array.isArray(badges)) return [];
  return badges.filter((b) => typeof b === "string" && !b.startsWith(CLATS_META_PREFIX));
}

function mergeChildMetaOntoBadges(existingBadges, metaPatch) {
  const clean = getCleanBadges(existingBadges);
  const currentMeta = extractChildMeta(existingBadges || []);
  const nextMeta = {
    ...currentMeta,
    ...metaPatch
  };
  return [...clean, `${CLATS_META_PREFIX}${JSON.stringify(nextMeta)}`];
}

function isActivityAlreadyRewarded(child, category, activityId) {
  if (!child || !activityId) return false;

  const meta = extractChildMeta(child);
  const ledger = meta.xpLedger;
  const ledgerKey = `${category}:${activityId}`;
  if (ledger && ledger[ledgerKey] && ledger[ledgerKey].amount > 0) {
    return true;
  }

  if (category === "lesson_quiz") {
    const isCompleted = Boolean(child.completed && child.completed[activityId]);
    const quizResult = child.quizResults && child.quizResults[activityId];
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

function calculateLessonQuizXp(score, status, isAlreadyRewarded) {
  if (isAlreadyRewarded) return 0;
  if (status !== "Passed" || score < 50) return 0;
  if (score === 100) return XP_CONFIG.LESSON_QUIZ_PERFECT;
  return XP_CONFIG.LESSON_QUIZ_PASS;
}

function awardGenuinelyEarnedXp(child, params) {
  const { activityId, category, amount, reason, conditionSatisfied } = params;

  if (!conditionSatisfied) {
    return { updatedChild: child, xpAwarded: 0, transaction: null };
  }

  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return { updatedChild: child, xpAwarded: 0, transaction: null };
  }

  if (isActivityAlreadyRewarded(child, category, activityId)) {
    return { updatedChild: child, xpAwarded: 0, transaction: null };
  }

  const timestamp = new Date().toISOString();
  const txId = `tx_${child.id.slice(0, 8)}_${category}_${activityId.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}`;

  const transaction = {
    id: txId,
    childId: child.id,
    activityId,
    category,
    amount,
    earnedAt: timestamp,
    reason
  };

  const currentMeta = extractChildMeta(child);
  const currentLedger = currentMeta.xpLedger || {};
  const ledgerKey = `${category}:${activityId}`;

  const nextLedger = {
    ...currentLedger,
    [ledgerKey]: transaction
  };

  const updatedBadges = mergeChildMetaOntoBadges(child.badges, {
    ...currentMeta,
    xpLedger: nextLedger
  });

  const nextTotalXp = Math.max(0, (child.xp || 0) + amount);

  const updatedChild = {
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

function auditAndReconcileChildXp(child) {
  const recordedXp = Math.max(0, Number(child.xp) || 0);
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

  const meta = extractChildMeta(child);
  const claimedMilestones = meta.claimedMilestones || [];
  let streakXp = 0;
  for (const mId of claimedMilestones) {
    if (mId === "3-Days-Reward") streakXp += XP_CONFIG.STREAK_3_DAYS;
    if (mId === "7-Days-Reward") streakXp += XP_CONFIG.STREAK_7_DAYS;
    if (mId === "14-Days-Reward") streakXp += XP_CONFIG.STREAK_14_DAYS;
  }

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

module.exports = {
  XP_CONFIG,
  extractChildMeta,
  getCleanBadges,
  mergeChildMetaOntoBadges,
  isActivityAlreadyRewarded,
  calculateLessonQuizXp,
  awardGenuinelyEarnedXp,
  auditAndReconcileChildXp
};
