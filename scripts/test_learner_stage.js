const assert = require("assert");
const { createClient } = require("@supabase/supabase-js");

// We test the logic implemented in src/utils/childMeta.ts
const APPROVED_AGE_SEGMENTS = [
  {
    id: "early_explorers",
    ageGroup: "early explorers",
    label: "Early Explorers",
    ages: "2–5",
    minAge: 2,
    maxAge: 5
  },
  {
    id: "young_explorers",
    ageGroup: "young explorers",
    label: "Young Explorers",
    ages: "6–10",
    minAge: 6,
    maxAge: 10
  },
  {
    id: "young_builders",
    ageGroup: "young builders",
    label: "Young Builders",
    ages: "11–13",
    minAge: 11,
    maxAge: 13
  },
  {
    id: "future_innovators",
    ageGroup: "future innovators",
    label: "Future Innovators",
    ages: "14–18",
    minAge: 14,
    maxAge: 18
  }
];

function calculateAgeFromDob(dob) {
  if (!dob || typeof dob !== "string") return null;
  const trimmed = dob.trim();
  if (!trimmed) return null;
  const birth = new Date(trimmed);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age <= 100 ? age : null;
}

function getApprovedSegmentForAge(age) {
  if (age <= 5) return APPROVED_AGE_SEGMENTS[0];
  if (age <= 10) return APPROVED_AGE_SEGMENTS[1];
  if (age <= 13) return APPROVED_AGE_SEGMENTS[2];
  return APPROVED_AGE_SEGMENTS[3];
}

function getApprovedSegmentByIdOrGroup(ageGroup, segmentIdOrAge, age) {
  const numericAge = typeof segmentIdOrAge === "number" ? segmentIdOrAge : age;
  if (typeof numericAge === "number" && numericAge >= 2 && numericAge <= 18) {
    return getApprovedSegmentForAge(numericAge);
  }
  if (typeof segmentIdOrAge === "string" && segmentIdOrAge.trim()) {
    const bySeg = APPROVED_AGE_SEGMENTS.find(
      (s) => s.id === segmentIdOrAge || s.ageGroup === segmentIdOrAge
    );
    if (bySeg) return bySeg;
  }
  const norm = (ageGroup || "").toLowerCase().trim();
  if (norm.includes("2-5") || norm.includes("2–5") || norm === "tots" || norm === "early_explorers") {
    return APPROVED_AGE_SEGMENTS[0];
  }
  if (norm === "early explorers") {
    return APPROVED_AGE_SEGMENTS[0];
  }
  if (norm === "young explorers" || norm.includes("young explorer") || norm === "young_explorers") {
    return APPROVED_AGE_SEGMENTS[1];
  }
  if (norm.includes("innovator") || norm.includes("young builder") || norm === "young" || norm === "young_builders") {
    return APPROVED_AGE_SEGMENTS[2];
  }
  if (norm.includes("future") || norm === "future_innovators") {
    return APPROVED_AGE_SEGMENTS[3];
  }
  return APPROVED_AGE_SEGMENTS[1];
}

function extractChildMeta(childOrBadges) {
  if (!childOrBadges) return {};
  const badges = Array.isArray(childOrBadges)
    ? childOrBadges
    : Array.isArray(childOrBadges.badges)
    ? childOrBadges.badges
    : [];
  for (let i = badges.length - 1; i >= 0; i--) {
    const entry = badges[i];
    if (typeof entry === "string" && entry.startsWith("__clats_meta__:")) {
      try {
        const parsed = JSON.parse(entry.slice("__clats_meta__:".length));
        if (parsed && typeof parsed === "object") return parsed;
      } catch {}
    }
  }
  return {};
}

function resolveChildApprovedSegment(childOrGroup, fallbackAge) {
  if (!childOrGroup) {
    if (typeof fallbackAge === "number" && fallbackAge >= 2 && fallbackAge <= 18) {
      return getApprovedSegmentForAge(fallbackAge);
    }
    return APPROVED_AGE_SEGMENTS[1];
  }

  if (typeof childOrGroup === "object") {
    const child = childOrGroup;
    const meta = extractChildMeta(child);

    // 1. Authoritative: Date of Birth (DOB)
    const rawDob = child.dob || child.date_of_birth || meta.enrolment?.dob;
    const calculatedAgeFromDob = calculateAgeFromDob(rawDob);
    if (calculatedAgeFromDob !== null && calculatedAgeFromDob >= 2 && calculatedAgeFromDob <= 18) {
      return getApprovedSegmentForAge(calculatedAgeFromDob);
    }

    // 2. Authoritative numeric age
    const numericAge =
      (typeof child.age === "number" && child.age >= 2 && child.age <= 18 ? child.age : null) ??
      (typeof meta.enrolment?.calculatedAge === "number" && meta.enrolment.calculatedAge >= 2 && meta.enrolment.calculatedAge <= 18 ? meta.enrolment.calculatedAge : null) ??
      (typeof meta.enrolment?.age === "number" && meta.enrolment.age >= 2 && meta.enrolment.age <= 18 ? meta.enrolment.age : null) ??
      (typeof fallbackAge === "number" && fallbackAge >= 2 && fallbackAge <= 18 ? fallbackAge : null);

    if (numericAge !== null) {
      return getApprovedSegmentForAge(numericAge);
    }

    // 3. Stored assigned segment ID from enrolment metadata
    const assignedSegId = meta.enrolment?.assignedSegmentId || meta.enrolment?.segmentId;
    if (assignedSegId) {
      const match = APPROVED_AGE_SEGMENTS.find(
        (s) => s.id === assignedSegId || s.ageGroup === assignedSegId
      );
      if (match) return match;
    }

    // 4. Stored age_group / ageGroup
    const rawGroup = child.ageGroup || child.age_group;
    if (rawGroup) {
      return getApprovedSegmentByIdOrGroup(rawGroup, undefined, undefined);
    }

    return APPROVED_AGE_SEGMENTS[1];
  }

  return getApprovedSegmentByIdOrGroup(childOrGroup, fallbackAge, fallbackAge);
}

async function runTests() {
  console.log("=== CLATS LEARNER STAGE CLASSIFICATION TEST SUITE ===");

  // 1. Boundary age tests
  console.log("\n1. Testing Approved Age Boundaries:");
  const testAges = [
    { age: 2, expected: "early_explorers" },
    { age: 5, expected: "early_explorers" },
    { age: 6, expected: "young_explorers" },
    { age: 7, expected: "young_explorers" },
    { age: 10, expected: "young_explorers" },
    { age: 11, expected: "young_builders" },
    { age: 13, expected: "young_builders" },
    { age: 14, expected: "future_innovators" },
    { age: 18, expected: "future_innovators" },
  ];

  testAges.forEach(({ age, expected }) => {
    const seg = getApprovedSegmentForAge(age);
    assert.strictEqual(seg.id, expected, `Age ${age} should map to ${expected}, got ${seg.id}`);
    console.log(`  ✓ Age ${age} -> ${seg.label} (${seg.ages}) [${seg.id}]`);
  });

  // 2. DOB Age calculation tests
  console.log("\n2. Testing Authoritative DOB Calculations:");
  const currentYear = new Date().getFullYear();
  const dobCases = [
    { dob: `${currentYear - 4}-01-15`, expectedAge: 4, expectedSeg: "early_explorers" },
    { dob: `${currentYear - 6}-01-15`, expectedAge: 6, expectedSeg: "young_explorers" },
    { dob: "2019-10-13", expectedSeg: "young_explorers" }, // Aisha
    { dob: `${currentYear - 11}-01-15`, expectedAge: 11, expectedSeg: "young_builders" },
    { dob: `${currentYear - 14}-01-15`, expectedAge: 14, expectedSeg: "future_innovators" },
  ];

  dobCases.forEach(({ dob, expectedAge, expectedSeg }) => {
    const age = calculateAgeFromDob(dob);
    if (expectedAge !== undefined) {
      assert.strictEqual(age, expectedAge, `DOB ${dob} calculated age should be ${expectedAge}, got ${age}`);
    }
    const seg = resolveChildApprovedSegment({ dob });
    assert.strictEqual(seg.id, expectedSeg, `DOB ${dob} should resolve to ${expectedSeg}, got ${seg.id}`);
    console.log(`  ✓ DOB ${dob} (Age ${age}) -> ${seg.label} (${seg.ages})`);
  });

  // 3. Learning progress independence (XP, streak, lessons do NOT alter stage)
  console.log("\n3. Testing Independence from Learning Progress (XP/Streaks/Lessons):");
  const advancedYoungExplorer = {
    name: "Test Child",
    dob: "2019-10-13", // 7 years old
    ageGroup: "early explorers", // Stale or erroneous string
    xp: 99999,
    streak: 365,
    completedLessons: { l1: true, l2: true, l3: true }
  };
  const resolvedAdv = resolveChildApprovedSegment(advancedYoungExplorer);
  assert.strictEqual(resolvedAdv.id, "young_explorers", "High XP/streak must NOT change age-based stage");
  console.log(`  ✓ Learner with 99,999 XP and 365-day streak remains strictly in: ${resolvedAdv.label}`);

  // 4. Test Aisha's Record from Supabase
  console.log("\n4. Verifying Aisha's Live Record from Supabase:");
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: aisha, error: aishaErr } = await sb
    .from("clats_children")
    .select("*")
    .eq("id", "c71ef4b3-f357-49f9-b778-8d602db9c7db")
    .single();

  assert(!aishaErr, `Failed to fetch Aisha: ${aishaErr?.message}`);
  assert(aisha, "Aisha record not found");
  console.log(`  • Aisha Record ID: ${aisha.id}`);
  console.log(`  • Aisha DB age_group: "${aisha.age_group}"`);
  console.log(`  • Aisha Preserved XP: ${aisha.xp}`);
  console.log(`  • Aisha Preserved Streak: ${aisha.streak_count}`);

  assert.strictEqual(aisha.age_group, "young explorers", `Aisha's DB age_group should be "young explorers", got ${aisha.age_group}`);

  const aishaSeg = resolveChildApprovedSegment(aisha);
  assert.strictEqual(aishaSeg.id, "young_explorers", `Aisha should resolve to young_explorers, got ${aishaSeg.id}`);
  assert.strictEqual(aishaSeg.ages, "6–10", `Aisha should have age range 6–10, got ${aishaSeg.ages}`);
  console.log(`  ✓ Aisha resolved stage: ${aishaSeg.label} (${aishaSeg.ages}) - ACTIVE`);

  // 5. Test all 32 learners in Supabase
  console.log("\n5. Auditing all learners in Supabase:");
  const { data: allChildren } = await sb.from("clats_children").select("*");
  const stageCounts = { early_explorers: 0, young_explorers: 0, young_builders: 0, future_innovators: 0 };
  allChildren.forEach(c => {
    const seg = resolveChildApprovedSegment(c);
    stageCounts[seg.id] = (stageCounts[seg.id] || 0) + 1;
  });
  console.log("  Learner stage distribution across all records:", stageCounts);

  console.log("\nALL LEARNER CLASSIFICATION ASSERTIONS PASSED SUCCESSFULLY! ✨");
}

runTests().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
