/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CLATS Explorers: Practical Learning Evidence & Skill Mapping Engine
 * 
 * Provides privacy-first, educational telemetry to record genuine skill evidence
 * from lessons, quizzes, practice activities, and purposeful games without
 * interfering with gameplay or creating duplicate rewards.
 */

export type SkillCategory = 
  | "ai_and_emerging_tech"
  | "cyber_safety"
  | "design_and_creation"
  | "adaptability_and_patterns";

export interface SkillDefinition {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  successCondition: string;
}

// Master Approved Skill Registry for Ages 6–10 (Explorers)
export const SKILL_REGISTRY: Record<string, SkillDefinition> = {
  // Pattern Quest & Computational Thinking
  "pattern.alternation.binary": {
    id: "pattern.alternation.binary",
    name: "Binary Pattern Recognition",
    category: "adaptability_and_patterns",
    description: "Perceives and continues an alternating 2-element pattern (AB · AB).",
    successCondition: "Fills sequence slot correctly with no more than 1 hint."
  },
  "pattern.shape.geometric": {
    id: "pattern.shape.geometric",
    name: "Geometric Shape Sequencing",
    category: "adaptability_and_patterns",
    description: "Identifies and projects abstract geometric shape patterns regardless of color.",
    successCondition: "Identifies alternating geometry correctly on initial attempt."
  },
  "pattern.category.object": {
    id: "pattern.category.object",
    name: "Real-World Category Alternation",
    category: "adaptability_and_patterns",
    description: "Discovers and continues sequences formed by natural items and objects.",
    successCondition: "Completes sequence slots using category rules."
  },
  "pattern.repeat.double": {
    id: "pattern.repeat.double",
    name: "Multi-Frequency Repetition",
    category: "adaptability_and_patterns",
    description: "Recognizes grouped repeating units before a transition (AAB · AAB).",
    successCondition: "Correctly places repeating elements before alternating."
  },
  "pattern.attribute.size": {
    id: "pattern.attribute.size",
    name: "Scalar Dimension Discrimination",
    category: "adaptability_and_patterns",
    description: "Distinguishes scale and size attributes (Big vs Small) rather than symbol identity.",
    successCondition: "Evaluates relative dimension hierarchy accurately."
  },
  "pattern.sequence.triple": {
    id: "pattern.sequence.triple",
    name: "3-Part Rhythm Projection",
    category: "adaptability_and_patterns",
    description: "Tracks and extends complex 3-element sequences (ABC · ABC).",
    successCondition: "Projects future sequence across 6+ elements."
  },
  "pattern.multi_attribute": {
    id: "pattern.multi_attribute",
    name: "Multi-Attribute Synthesis",
    category: "adaptability_and_patterns",
    description: "Evaluates two simultaneous attributes (e.g. Color AND Shape) to solve a pattern.",
    successCondition: "Matches composite attribute criteria without confusion."
  },
  "pattern.rule_induction": {
    id: "pattern.rule_induction",
    name: "Rule Induction & Articulation",
    category: "adaptability_and_patterns",
    description: "Formulates and selects the verbal algorithmic rule that governs an observed sequence.",
    successCondition: "Selects correct verbal explanation over plausible distractors."
  },
  "pattern.anomaly.detection": {
    id: "pattern.anomaly.detection",
    name: "Anomaly Detection & Debugging",
    category: "adaptability_and_patterns",
    description: "Locates an intruder element breaking a sequence and applies the correct repair item.",
    successCondition: "Identifies intruder index and selects exact valid replacement."
  },
  "pattern.creation.synthesis": {
    id: "pattern.creation.synthesis",
    name: "Constructive Pattern Synthesis",
    category: "design_and_creation",
    description: "Constructs an original, mathematically valid repeating pattern from scratch.",
    successCondition: "Builds a verified repeating sequence of at least 2 complete cycles."
  },

  // Purposeful Games
  "ml.classification.training": {
    id: "ml.classification.training",
    name: "Machine Learning from Examples",
    category: "ai_and_emerging_tech",
    description: "Understands that AI learns by categorizing example datasets and testing on new data.",
    successCondition: "Categorizes training data and achieves ≥80% accuracy on unseen test items."
  },
  "cyber.phishing.detection": {
    id: "cyber.phishing.detection",
    name: "Digital Safety & Phishing Detection",
    category: "cyber_safety",
    description: "Identifies deceptive cues, spoofed domains, and unauthorized password requests.",
    successCondition: "Correctly flags phishing scenarios with zero false positives on safe messages."
  },
  "systems.resource.tradeoffs": {
    id: "systems.resource.tradeoffs",
    name: "Systems Thinking & Tradeoffs",
    category: "ai_and_emerging_tech",
    description: "Balances multi-variable feedback loops between power, pollution, and city health.",
    successCondition: "Successfully manages city resources without metric collapse."
  },
  "info.verification.fact_checking": {
    id: "info.verification.fact_checking",
    name: "Fact-Checking & Source Verification",
    category: "cyber_safety",
    description: "Detects sensationalized and AI-fabricated claims by verifying credibility.",
    successCondition: "Separates genuine science/news facts from fake viral content."
  },

  // Curriculum Quizzes
  "curriculum.quiz.mastery": {
    id: "curriculum.quiz.mastery",
    name: "Curriculum Concept Grasp",
    category: "ai_and_emerging_tech",
    description: "Demonstrates recall, comprehension, and critical reasoning on lesson checkpoints.",
    successCondition: "Passes lesson quiz with ≥70% score."
  }
};

export type EvidenceLevel = "participated" | "completed_with_support" | "demonstrated" | "mastered";

export interface SkillEvidenceRecord {
  id: string;
  childId: string;
  skillId: string;
  skillName: string;
  sourceType: "game" | "quiz" | "practice" | "creation";
  sourceId: string;
  attemptCount: number;
  hintsUsed: number;
  demonstrated: boolean;
  evidenceLevel: EvidenceLevel;
  outputValid?: boolean;
  notes?: string;
  timestamp: string;
}

export type LearningEventType = 
  | "activity_started"
  | "attempt_submitted"
  | "hint_requested"
  | "solution_validated"
  | "activity_completed"
  | "skill_evidence_recorded";

export interface LearningTelemetryEvent {
  id: string;
  childId: string;
  eventType: LearningEventType;
  sourceType: "game" | "quiz" | "practice" | "creation";
  sourceId: string;
  skillId?: string;
  attemptNumber?: number;
  hintsUsed?: number;
  success?: boolean;
  metadata?: Record<string, any>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Telemetry Storage & Synchronization Helpers
// ---------------------------------------------------------------------------

function getStoragePrefix(childId: string): string {
  return `clats_evidence_${childId}`;
}

/**
 * Record a raw educational telemetry event in non-blocking fashion
 */
export function recordLearningEvent(event: Omit<LearningTelemetryEvent, "id" | "timestamp">): void {
  if (typeof window === "undefined" || !event.childId) return;

  const fullEvent: LearningTelemetryEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };

  try {
    const key = `${getStoragePrefix(event.childId)}_events`;
    const existingRaw = localStorage.getItem(key);
    const events: LearningTelemetryEvent[] = existingRaw ? JSON.parse(existingRaw) : [];
    
    // Maintain maximum rolling window of 100 recent events per child
    events.push(fullEvent);
    if (events.length > 100) events.shift();
    localStorage.setItem(key, JSON.stringify(events));
  } catch (e) {
    // Non-blocking fallback
  }

  // Non-blocking async sync to backend (safe even if offline or endpoint fails)
  try {
    fetch("/api/supabase/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId: event.childId,
        type: "event",
        payload: fullEvent
      }),
      keepalive: true
    }).catch(() => {
      // Offline / network failure handled gracefully
    });
  } catch {}
}

/**
 * Record a validated skill evidence record
 */
export function recordSkillEvidence(
  params: Omit<SkillEvidenceRecord, "id" | "skillName" | "timestamp">
): SkillEvidenceRecord {
  const skillDef = SKILL_REGISTRY[params.skillId];
  const skillName = skillDef?.name || params.skillId;

  const record: SkillEvidenceRecord = {
    ...params,
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    skillName,
    timestamp: new Date().toISOString()
  };

  if (typeof window !== "undefined" && params.childId) {
    try {
      const key = `${getStoragePrefix(params.childId)}_records`;
      const existingRaw = localStorage.getItem(key);
      const records: SkillEvidenceRecord[] = existingRaw ? JSON.parse(existingRaw) : [];

      // Avoid exact duplicate record within 5 seconds for the same source
      const isDuplicate = records.some(
        r => r.skillId === record.skillId &&
             r.sourceId === record.sourceId &&
             Math.abs(new Date(r.timestamp).getTime() - new Date(record.timestamp).getTime()) < 5000
      );

      if (!isDuplicate) {
        records.push(record);
        if (records.length > 150) records.shift();
        localStorage.setItem(key, JSON.stringify(records));
      }
    } catch (e) {
      // Non-blocking fallback
    }

    // Async sync to server
    try {
      fetch("/api/supabase/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: params.childId,
          type: "evidence",
          payload: record
        }),
        keepalive: true
      }).catch(() => {});
    } catch {}
  }

  return record;
}

/**
 * Retrieve all local skill evidence for a child
 */
export function getChildLocalEvidence(childId: string): SkillEvidenceRecord[] {
  if (typeof window === "undefined" || !childId) return [];
  try {
    const raw = localStorage.getItem(`${getStoragePrefix(childId)}_records`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export interface ChildSkillSummary {
  totalDemonstrated: number;
  totalPracticed: number;
  independentSuccessRatio: number;
  demonstratedSkills: Array<{
    skillId: string;
    name: string;
    category: SkillCategory;
    successCount: number;
    lastDemonstrated: string;
    hintsUsedAvg: number;
  }>;
  emergingSkills: Array<{
    skillId: string;
    name: string;
    category: SkillCategory;
    attempts: number;
    hintsUsedAvg: number;
  }>;
}

/**
 * Aggregate evidence into an educational summary for parent and school reports
 */
export function aggregateChildSkills(childId: string): ChildSkillSummary {
  const records = getChildLocalEvidence(childId);

  const skillMap: Record<string, {
    demonstratedCount: number;
    totalAttempts: number;
    hintsTotal: number;
    lastSeen: string;
  }> = {};

  records.forEach(r => {
    if (!skillMap[r.skillId]) {
      skillMap[r.skillId] = {
        demonstratedCount: 0,
        totalAttempts: 0,
        hintsTotal: 0,
        lastSeen: r.timestamp
      };
    }
    skillMap[r.skillId].totalAttempts += 1;
    skillMap[r.skillId].hintsTotal += (r.hintsUsed || 0);
    if (r.demonstrated) {
      skillMap[r.skillId].demonstratedCount += 1;
    }
    if (new Date(r.timestamp) > new Date(skillMap[r.skillId].lastSeen)) {
      skillMap[r.skillId].lastSeen = r.timestamp;
    }
  });

  const demonstratedSkills: ChildSkillSummary["demonstratedSkills"] = [];
  const emergingSkills: ChildSkillSummary["emergingSkills"] = [];

  Object.keys(skillMap).forEach(sId => {
    const data = skillMap[sId];
    const def = SKILL_REGISTRY[sId];
    const name = def?.name || sId;
    const category = def?.category || "adaptability_and_patterns";
    const hintsAvg = data.totalAttempts > 0 ? Number((data.hintsTotal / data.totalAttempts).toFixed(1)) : 0;

    if (data.demonstratedCount > 0) {
      demonstratedSkills.push({
        skillId: sId,
        name,
        category,
        successCount: data.demonstratedCount,
        lastDemonstrated: data.lastSeen,
        hintsUsedAvg: hintsAvg
      });
    } else {
      emergingSkills.push({
        skillId: sId,
        name,
        category,
        attempts: data.totalAttempts,
        hintsUsedAvg: hintsAvg
      });
    }
  });

  const independentRecords = records.filter(r => r.demonstrated && (r.hintsUsed === 0));
  const independentSuccessRatio = records.length > 0 
    ? Math.round((independentRecords.length / records.length) * 100) 
    : 100;

  return {
    totalDemonstrated: demonstratedSkills.length,
    totalPracticed: Object.keys(skillMap).length,
    independentSuccessRatio,
    demonstratedSkills,
    emergingSkills
  };
}
