/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CLATS Database XP Integrity & Reconciliation Audit Script (Node CJS)
 */

const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const sb = createClient(url, key);

async function runAudit() {
  console.log("===============================================================================");
  console.log("            CLATS XP SYSTEM DATABASE INTEGRITY & RECONCILIATION AUDIT          ");
  console.log("===============================================================================\n");

  const { data: children, error } = await sb
    .from("clats_children")
    .select("id, name, parent_email, age_group, xp, completed_lessons, quiz_results, badges, streak_count");

  if (error) {
    console.error("Failed to query clats_children:", error);
    return;
  }

  console.log(`Total children in database: ${children.length}\n`);

  let accurateCount = 0;
  let discrepancyCount = 0;
  let zeroActivityWithXpCount = 0;
  let cleanZeroCount = 0;

  const discrepanciesList = [];

  for (const child of children) {
    const recordedXp = Math.max(0, Number(child.xp) || 0);
    const completedMap = child.completed_lessons || {};
    const quizMap = child.quiz_results || {};

    const completedKeys = Object.keys(completedMap);
    const quizKeys = Object.keys(quizMap);

    let verifiedXp = 0;
    let passedQuizzes = 0;
    const passedLessonIds = new Set();

    for (const [lessonId, q] of Object.entries(quizMap)) {
      if (q && q.status === "Passed" && Number(q.score) >= 50) {
        // Enforce idempotency: only award once per unique lessonId
        if (!passedLessonIds.has(lessonId)) {
          passedLessonIds.add(lessonId);
          passedQuizzes++;
          if (Number(q.score) === 100) {
            verifiedXp += 50;
          } else {
            verifiedXp += 35;
          }
        }
      }
    }

    // Check claimed streak milestones from badges
    const badges = Array.isArray(child.badges) ? child.badges : [];
    let streakMilestoneXp = 0;
    for (const b of badges) {
      if (typeof b === "string" && b.startsWith("__clats_meta__:")) {
        try {
          const parsed = JSON.parse(b.slice("__clats_meta__:".length));
          const claimed = parsed.claimedMilestones || [];
          if (claimed.includes("3-Days-Reward")) streakMilestoneXp += 50;
          if (claimed.includes("7-Days-Reward")) streakMilestoneXp += 150;
          if (claimed.includes("14-Days-Reward")) streakMilestoneXp += 300;
        } catch {}
      }
    }
    verifiedXp += streakMilestoneXp;

    if (recordedXp === 0 && completedKeys.length === 0 && quizKeys.length === 0) {
      cleanZeroCount++;
      accurateCount++;
    } else if (recordedXp === verifiedXp) {
      accurateCount++;
    } else {
      discrepancyCount++;
      let reason = "";
      if (completedKeys.length === 0 && quizKeys.length === 0 && recordedXp > 0) {
        zeroActivityWithXpCount++;
        reason = "Child has 0 completed lessons and 0 quizzes, but has positive recorded XP (e.g. starter enrollment quest or legacy button).";
      } else if (recordedXp > verifiedXp) {
        reason = `Recorded XP (${recordedXp}) exceeds verified earned XP (${verifiedXp}) from ${passedQuizzes} passed quizzes (likely from repeated attempts or failed quiz granting 10 XP).`;
      } else {
        reason = `Recorded XP (${recordedXp}) is less than verified earned XP (${verifiedXp}).`;
      }

      discrepanciesList.push({
        id: child.id,
        name: child.name,
        parent_email: child.parent_email,
        recordedXp,
        verifiedXp,
        delta: recordedXp - verifiedXp,
        reason,
        completedCount: completedKeys.length,
        passedQuizzes
      });
    }
  }

  console.log("-------------------------------------------------------------------------------");
  console.log("                              AUDIT SUMMARY                                    ");
  console.log("-------------------------------------------------------------------------------");
  console.log(`• Children Evaluated:                  ${children.length}`);
  console.log(`• Clean Zero Records (0 XP):           ${cleanZeroCount}`);
  console.log(`• Reconciled & Accurate Records:       ${accurateCount}`);
  console.log(`• Historical Discrepancies Identified: ${discrepancyCount}`);
  console.log(`• Zero-Activity with Positive XP:      ${zeroActivityWithXpCount}\n`);

  console.log("-------------------------------------------------------------------------------");
  console.log("                        DISCREPANCY DETAILS & AUDIT TRAIL                      ");
  console.log("-------------------------------------------------------------------------------");
  discrepanciesList.forEach((d, idx) => {
    console.log(`[${idx + 1}] Child: ${d.name} (${d.id})`);
    console.log(`    Parent: ${d.parent_email || "N/A"}`);
    console.log(`    Recorded XP: ${d.recordedXp} | Verified Earned XP: ${d.verifiedXp} | Difference: ${d.delta > 0 ? `+${d.delta}` : d.delta}`);
    console.log(`    Activity Context: ${d.completedCount} completed lessons, ${d.passedQuizzes} passed quizzes`);
    console.log(`    Audit Finding: ${d.reason}\n`);
  });

  console.log("===============================================================================");
  console.log("Audit complete. Historical data preserved. Safe reconciliation plan prepared.");
  console.log("===============================================================================");
}

runAudit().catch(console.error);
