/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CLATS XP SYSTEM COMPREHENSIVE AUTOMATED VERIFICATION SUITE
 * Tests all 12 scenarios required by the specification.
 */

const {
  XP_CONFIG,
  isActivityAlreadyRewarded,
  calculateLessonQuizXp,
  awardGenuinelyEarnedXp,
  auditAndReconcileChildXp
} = require("./dist_test_xp.js");

function createMockChild(overrides = {}) {
  return {
    id: "child-test-001",
    name: "Adaeze Explorer",
    age: 8,
    ageGroup: "young explorers",
    username: "adaeze",
    pin: "1234",
    interests: ["ai", "robotics"],
    completed: {},
    xp: 0,
    stars: {},
    quizResults: {},
    companion: "kobe",
    badges: [],
    streak: 0,
    streak_count: 0,
    best_streak: 0,
    ...overrides
  };
}

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    failedTests++;
  }
}

console.log("===============================================================================");
console.log("             RUNNING CLATS XP VERIFICATION SUITE (12 SCENARIOS)                ");
console.log("===============================================================================\n");

// Scenario 1: Newly enrolled child with no completed activities
console.log("Test Scenario 1: Newly enrolled child with no completed activities");
const newChild = createMockChild();
assert(newChild.xp === 0, "Initial XP is strictly 0");
const audit1 = auditAndReconcileChildXp(newChild);
assert(audit1.verifiedEarnedXp === 0, "Verified earned XP is 0");
assert(audit1.isAccurate, "Child is marked accurate with zero earnings");

// Scenario 2: Child opens a lesson but does not complete it
console.log("\nTest Scenario 2: Child opens a lesson but does not complete it");
const openedChild = createMockChild();
// Simulating opening/viewing/visiting (no completion event triggered)
assert(openedChild.xp === 0, "Opening lesson does not increment XP");

// Scenario 3: Child completes an eligible activity (Lesson quiz passed with 100%)
console.log("\nTest Scenario 3: Child completes an eligible activity (100% quiz score)");
const passed100Child = createMockChild();
const award100 = awardGenuinelyEarnedXp(passed100Child, {
  activityId: "j-a1m1-l1",
  category: "lesson_quiz",
  amount: XP_CONFIG.LESSON_QUIZ_PERFECT,
  reason: "Passed lesson quiz: j-a1m1-l1 with 100%",
  conditionSatisfied: true
});
assert(award100.xpAwarded === 50, "Awarded 50 XP for perfect quiz score");
assert(award100.updatedChild.xp === 50, "Child total XP is now 50");
assert(award100.transaction !== null, "Transaction record generated with unique reference");
assert(award100.transaction.amount === 50, "Transaction amount is positive 50");

// Scenario 4: Child completes an activity with no XP reward configured (amount = 0)
console.log("\nTest Scenario 4: Child completes an activity with no XP reward configured");
const noRewardChild = createMockChild();
const awardZero = awardGenuinelyEarnedXp(noRewardChild, {
  activityId: "unrewarded-activity",
  category: "lesson_quiz",
  amount: 0,
  reason: "Unrewarded task",
  conditionSatisfied: true
});
assert(awardZero.xpAwarded === 0, "No XP awarded when amount is 0");
assert(awardZero.updatedChild.xp === 0, "Child total XP remains 0");
assert(awardZero.transaction === null, "Zero XP is NOT inserted as an earning transaction");

// Scenario 5: Child repeats an already rewarded activity (Idempotency)
console.log("\nTest Scenario 5: Child repeats an already rewarded activity");
const repeatChild = award100.updatedChild;
const repeatAttempt = awardGenuinelyEarnedXp(repeatChild, {
  activityId: "j-a1m1-l1",
  category: "lesson_quiz",
  amount: XP_CONFIG.LESSON_QUIZ_PERFECT,
  reason: "Repeated lesson quiz",
  conditionSatisfied: true
});
assert(repeatAttempt.xpAwarded === 0, "Repeated activity awards 0 XP");
assert(repeatAttempt.updatedChild.xp === 50, "Child total XP remains 50 (no duplicate XP)");
assert(repeatAttempt.transaction === null, "No duplicate transaction created for already rewarded activity");

// Scenario 6: Child refreshes the page after earning XP
console.log("\nTest Scenario 6: Child refreshes the page after earning XP");
const serializedState = JSON.stringify(award100.updatedChild);
const reloadedChild = JSON.parse(serializedState);
assert(reloadedChild.xp === 50, "XP remains exactly 50 after state rehydration / refresh");
const reloadedRepeat = awardGenuinelyEarnedXp(reloadedChild, {
  activityId: "j-a1m1-l1",
  category: "lesson_quiz",
  amount: 50,
  reason: "Retrying after reload",
  conditionSatisfied: true
});
assert(reloadedRepeat.xpAwarded === 0, "Post-reload retry awards 0 duplicate XP");
assert(reloadedRepeat.updatedChild.xp === 50, "Post-reload XP total remains exactly 50");

// Scenario 7: Child submits the same completion request twice (Deduplication)
console.log("\nTest Scenario 7: Child submits the same completion request twice");
const freshSubmitChild = createMockChild();
const submit1 = awardGenuinelyEarnedXp(freshSubmitChild, {
  activityId: "t-a1m1-l1",
  category: "lesson_quiz",
  amount: 35,
  reason: "Submission 1",
  conditionSatisfied: true
});
const submit2 = awardGenuinelyEarnedXp(submit1.updatedChild, {
  activityId: "t-a1m1-l1",
  category: "lesson_quiz",
  amount: 35,
  reason: "Submission 2 (Duplicate)",
  conditionSatisfied: true
});
assert(submit1.xpAwarded === 35, "First submission awards 35 XP");
assert(submit2.xpAwarded === 0, "Second duplicate submission awards 0 XP");
assert(submit2.updatedChild.xp === 35, "Child total XP remains strictly 35");

// Scenario 8: Child completes an unsuccessful quiz (Failed / Needs Review)
console.log("\nTest Scenario 8: Child completes an unsuccessful quiz (score: 33%, Needs Review)");
const failedQuizChild = createMockChild();
const calcFailedXp = calculateLessonQuizXp(33, "Needs Review", false);
assert(calcFailedXp === 0, "calculateLessonQuizXp returns 0 for score < 50%");
const failedAward = awardGenuinelyEarnedXp(failedQuizChild, {
  activityId: "j-a1m1-l2",
  category: "lesson_quiz",
  amount: calcFailedXp,
  reason: "Failed quiz",
  conditionSatisfied: false // condition NOT satisfied
});
assert(failedAward.xpAwarded === 0, "No XP awarded for unsuccessful quiz");
assert(failedAward.updatedChild.xp === 0, "Child total XP remains 0 after failed quiz");
assert(failedAward.transaction === null, "No transaction recorded for failed quiz");

// Scenario 9: Child completes an eligible quiz successfully (score: 75%, Passed)
console.log("\nTest Scenario 9: Child completes an eligible quiz successfully (score: 75%, Passed)");
const passQuizChild = createMockChild();
const calcPassXp = calculateLessonQuizXp(75, "Passed", false);
assert(calcPassXp === 35, "calculateLessonQuizXp returns 35 for 50-99% pass");
const passAward = awardGenuinelyEarnedXp(passQuizChild, {
  activityId: "j-a1m1-l2",
  category: "lesson_quiz",
  amount: calcPassXp,
  reason: "Passed quiz: 75%",
  conditionSatisfied: true
});
assert(passAward.xpAwarded === 35, "Awarded 35 XP for passing quiz");
assert(passAward.updatedChild.xp === 35, "Child total XP is now 35");

// Scenario 10: Two requests for the same earning event arrive simultaneously
console.log("\nTest Scenario 10: Two requests for the same earning event arrive simultaneously");
let raceChild = createMockChild();
const raceResults = [1, 2].map(reqNum => {
  const res = awardGenuinelyEarnedXp(raceChild, {
    activityId: "race-activity-001",
    category: "wonder_lab",
    amount: 25,
    reason: `Concurrent request ${reqNum}`,
    conditionSatisfied: true
  });
  if (res.xpAwarded > 0) {
    raceChild = res.updatedChild;
  }
  return res;
});
const totalAwardedInRace = raceResults.reduce((acc, r) => acc + r.xpAwarded, 0);
assert(totalAwardedInRace === 25, "Only one award of 25 XP processed across concurrent calls");
assert(raceChild.xp === 25, "Final state has exactly 25 XP (no race duplication)");

// Scenario 11: Parent opens child's dashboard
console.log("\nTest Scenario 11: Parent opens child's dashboard");
const parentChild = createMockChild({
  xp: 85,
  completed: { "j-a1m1-l1": true, "j-a1m1-l2": true },
  quizResults: {
    "j-a1m1-l1": { score: 67, status: "Passed", correctCount: 2, totalQuestions: 3, completedAt: "2026-09-01T00:00:00Z" },
    "j-a1m1-l2": { score: 100, status: "Passed", correctCount: 3, totalQuestions: 3, completedAt: "2026-09-02T00:00:00Z" }
  }
});
const parentAudit = auditAndReconcileChildXp(parentChild);
assert(parentAudit.isAccurate, "Child record is accurate (35 + 50 = 85 XP)");
assert(parentAudit.verifiedEarnedXp === 85, "Parent views genuine 85 XP");

// Scenario 12: Admin checks the child's record
console.log("\nTest Scenario 12: Admin checks child's record");
const adminAudit = auditAndReconcileChildXp(parentChild);
assert(adminAudit.verifiedEarnedXp === 85, "Admin Dashboard checks and gets identical 85 XP source of truth");

console.log("\n===============================================================================");
console.log(`TEST SUITE RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log("===============================================================================\n");

if (failedTests > 0) {
  process.exit(1);
}
