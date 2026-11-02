/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unified Child Metadata, Approved Age Segmentation, and Screen Monitoring Policy Engine.
 * Persists structured per-child settings inside `clats_children.badges` (via a reserved
 * `__clats_meta__:` token) so all settings sync automatically with Supabase across devices,
 * Parent Dashboard, School Coordinator Portal, and Admin Dashboard without requiring DDL changes.
 */

import { AgeGroup, Child } from "../types";

export const CLATS_META_PREFIX = "__clats_meta__:";

export type ApprovedSegmentId =
  | "early_explorers"
  | "young_explorers"
  | "young_builders"
  | "future_innovators"
  | "early_explorers_2_5"
  | "young_explorers_6_10"
  | "young_builders_11_13"
  | "future_innovators_14_18";

export type ApprovedAgeSegmentId = ApprovedSegmentId;

export interface ApprovedAgeSegment {
  id: ApprovedSegmentId;
  segmentId: ApprovedSegmentId;
  /** Underlying curriculum/app key for backward compatibility with existing records */
  ageGroup: AgeGroup;
  appAgeGroup: AgeGroup;
  curriculumKey: AgeGroup;
  label: string;
  ages: string;
  agesLabel: string;
  rangeLabel: string;
  minAge: number;
  maxAge: number;
  icon: string;
  emoji: string;
  color: string;
  description: string;
  defaultDailyLimitMins: number;
  defaultSessionLimitMins: number;
  defaultBreakIntervalMins: number;
}

/**
 * Approved 4-tier CLATS age segmentation:
 * - Early Explorers: 2–5
 * - Young Explorers: 6–10
 * - Young Builders: 11–13
 * - Future Innovators: 14–18
 */
export const APPROVED_AGE_SEGMENTS: ApprovedAgeSegment[] = [
  {
    id: "early_explorers",
    segmentId: "early_explorers",
    ageGroup: "early explorers",
    appAgeGroup: "early explorers",
    curriculumKey: "early explorers",
    label: "Early Explorers",
    ages: "2–5",
    agesLabel: "Ages 2–5",
    rangeLabel: "2–5",
    minAge: 2,
    maxAge: 5,
    icon: "🧸",
    emoji: "🧸",
    color: "#F472B6",
    description: "Gentle sensory discovery, voice-guided stories, colours, shapes, and playful sound exploration.",
    defaultDailyLimitMins: 20,
    defaultSessionLimitMins: 15,
    defaultBreakIntervalMins: 10
  },
  {
    id: "young_explorers",
    segmentId: "young_explorers",
    ageGroup: "young explorers",
    appAgeGroup: "early explorers",
    curriculumKey: "young explorers",
    label: "Young Explorers",
    ages: "6–10",
    agesLabel: "Ages 6–10",
    rangeLabel: "6–10",
    minAge: 6,
    maxAge: 10,
    icon: "🌱",
    emoji: "🌱",
    color: "#F59E0B",
    description: "Adventure-based AI & smart tech discovery, digital safety, creative play, and hands-on Wonder Lab.",
    defaultDailyLimitMins: 30,
    defaultSessionLimitMins: 20,
    defaultBreakIntervalMins: 15
  },
  {
    id: "young_builders",
    segmentId: "young_builders",
    ageGroup: "young builders",
    appAgeGroup: "young innovators",
    curriculumKey: "young builders",
    label: "Young Builders",
    ages: "11–13",
    agesLabel: "Ages 11–13",
    rangeLabel: "11–13",
    minAge: 11,
    maxAge: 13,
    icon: "⚡",
    emoji: "⚡",
    color: "#2EC4B6",
    description: "Foundational AI literacy, cyber safety, logic puzzles, drag-and-drop coding, and interactive labs.",
    defaultDailyLimitMins: 45,
    defaultSessionLimitMins: 30,
    defaultBreakIntervalMins: 20
  },
  {
    id: "future_innovators",
    segmentId: "future_innovators",
    ageGroup: "future innovators",
    appAgeGroup: "future builders",
    curriculumKey: "future innovators",
    label: "Future Innovators",
    ages: "14–18",
    agesLabel: "Ages 14–18",
    rangeLabel: "14–18",
    minAge: 14,
    maxAge: 18,
    icon: "🚀",
    emoji: "🚀",
    color: "#A78BFA",
    description: "Advanced AI prompting, software engineering, cybersecurity, data science, Web3, and career capstones.",
    defaultDailyLimitMins: 60,
    defaultSessionLimitMins: 45,
    defaultBreakIntervalMins: 25
  }
];

export function calculateAgeFromDob(dob?: string | null): number | null {
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

export function getApprovedSegmentForAge(age: number): ApprovedAgeSegment {
  if (age <= 5) return APPROVED_AGE_SEGMENTS[0]; // 2–5: Early Explorers
  if (age <= 10) return APPROVED_AGE_SEGMENTS[1]; // 6–10: Young Explorers
  if (age <= 13) return APPROVED_AGE_SEGMENTS[2]; // 11–13: Young Builders
  return APPROVED_AGE_SEGMENTS[3]; // 14–18: Future Innovators
}

export function getApprovedSegmentByIdOrGroup(
  ageGroup?: string | null,
  segmentIdOrAge?: ApprovedSegmentId | number | string | null,
  age?: number | null
): ApprovedAgeSegment {
  const numericAge = typeof segmentIdOrAge === "number" ? segmentIdOrAge : age;
  if (typeof numericAge === "number" && numericAge >= 2 && numericAge <= 18) {
    return getApprovedSegmentForAge(numericAge);
  }
  if (typeof segmentIdOrAge === "string" && segmentIdOrAge.trim()) {
    const bySeg = APPROVED_AGE_SEGMENTS.find(
      (s) => s.id === segmentIdOrAge || s.segmentId === segmentIdOrAge || s.ageGroup === segmentIdOrAge
    );
    if (bySeg) return bySeg;
  }
  const norm = (ageGroup || "").toLowerCase().trim();
  if (norm.includes("2-5") || norm.includes("2–5") || norm === "tots" || norm === "early_explorers" || norm === "early_explorers_2_5") {
    return APPROVED_AGE_SEGMENTS[0];
  }
  if (norm === "early explorers") {
    return APPROVED_AGE_SEGMENTS[0];
  }
  if (norm === "young explorers" || norm.includes("young explorer") || norm === "young_explorers") {
    return APPROVED_AGE_SEGMENTS[1];
  }
  if (norm === "early") {
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

/**
 * Authoritative resolver for a child's approved learning stage.
 * Strictly adheres to:
 * 1. Date of Birth (DOB) -> authoritative calculated age
 * 2. Stored numeric age (2–18)
 * 3. Enrolment metadata assignedSegmentId
 * 4. Stored age_group / ageGroup
 * 
 * Never uses XP, stars, badges, completed lessons, or streaks.
 */
export function resolveChildApprovedSegment(
  childOrGroup?: any,
  fallbackAge?: number | null
): ApprovedAgeSegment {
  if (!childOrGroup) {
    if (typeof fallbackAge === "number" && fallbackAge >= 2 && fallbackAge <= 18) {
      return getApprovedSegmentForAge(fallbackAge);
    }
    return APPROVED_AGE_SEGMENTS[1];
  }

  // If passed an object (Partial<Child> or any learner record)
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
        (s) => s.id === assignedSegId || s.segmentId === assignedSegId || s.ageGroup === assignedSegId
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

  // If passed a string (ageGroup or segment ID)
  return getApprovedSegmentByIdOrGroup(childOrGroup, fallbackAge, fallbackAge);
}

export function isYoungExplorerGroup(ageGroup?: string | null): boolean {
  const norm = (ageGroup || "").toLowerCase().trim();
  return (
    norm === "early explorers" ||
    norm === "young explorers" ||
    norm === "early" ||
    norm === "tots" ||
    norm.includes("explorer")
  );
}

export interface ScreenMonitoringPolicy {
  enabled: boolean;
  dailyLimitMins: number;
  dailyLimitMinutes?: number;
  sessionLimitMins: number;
  sessionLimitMinutes?: number;
  breakReminderEnabled: boolean;
  breakRemindersEnabled?: boolean;
  breakIntervalMins: number;
  breakReminderIntervalMinutes?: number;
  breakDurationMins: number;
  breakDurationMinutes?: number;
  preferredHoursEnabled: boolean;
  preferredHoursStart: string;
  preferredStartHour?: string;
  preferredHoursEnd: string;
  preferredEndHour?: string;
  slots: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  parentPolicy?: Partial<ScreenMonitoringPolicy>;
  schoolPolicy?: Partial<ScreenMonitoringPolicy>;
  updatedBy?: "parent" | "school" | "admin";
  updatedAt?: string;
}

export interface ScreenMonitoringConfig extends Partial<ScreenMonitoringPolicy> {
  enabled?: boolean;
  dailyLimitMins?: number;
  dailyLimitMinutes?: number;
  sessionLimitMins?: number;
  sessionLimitMinutes?: number;
  breakReminderEnabled?: boolean;
  breakRemindersEnabled?: boolean;
  breakIntervalMins?: number;
  breakReminderIntervalMinutes?: number;
  breakDurationMins?: number;
  breakDurationMinutes?: number;
  preferredHoursEnabled?: boolean;
  preferredHoursStart?: string;
  preferredStartHour?: string;
  preferredHoursEnd?: string;
  preferredEndHour?: string;
  slots?: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  parentPolicy?: Partial<ScreenMonitoringPolicy>;
  schoolPolicy?: Partial<ScreenMonitoringPolicy>;
}

export type ScreenMonitoringSettings = ScreenMonitoringConfig;

export const DEFAULT_SCREEN_MONITORING: ScreenMonitoringPolicy = {
  enabled: false,
  dailyLimitMins: 30,
  dailyLimitMinutes: 30,
  sessionLimitMins: 20,
  sessionLimitMinutes: 20,
  breakReminderEnabled: true,
  breakRemindersEnabled: true,
  breakIntervalMins: 15,
  breakReminderIntervalMinutes: 15,
  breakDurationMins: 2,
  breakDurationMinutes: 2,
  preferredHoursEnabled: false,
  preferredHoursStart: "06:00",
  preferredStartHour: "06:00",
  preferredHoursEnd: "20:00",
  preferredEndHour: "20:00",
  slots: {
    morning: 600,
    afternoon: 600,
    evening: 600,
  },
};

export interface ChildEnrolmentMeta {
  enrolledAt?: string;
  dob?: string;
  age?: number;
  calculatedAge?: number;
  segmentId?: ApprovedSegmentId;
  assignedSegmentId?: string;
  assignedSegmentLabel?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  consentGiven?: boolean;
  consentTimestamp?: string;
  communicationPrefs?: string[];
  schoolName?: string;
  schoolClass?: string;
  linkedSchoolCode?: string;
  linkedStudentId?: string;
  supportPreferences?: string[];
  companionSelectedAt?: string;
  status?: "active" | "paused" | "archived";
}

export interface ChildEmbeddedMeta {
  activityDates?: string[];
  claimedMilestones?: string[];
  screenMonitoring?: ScreenMonitoringConfig;
  enrolment?: ChildEnrolmentMeta;
}

/**
 * Extracts the embedded metadata object from `child` OR directly from a `badges: string[]` array.
 */
export function extractChildMeta(childOrBadges?: Partial<Child> | string[] | null): ChildEmbeddedMeta {
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
          return parsed as ChildEmbeddedMeta;
        }
      } catch {}
    }
  }
  return {};
}

/**
 * Returns only real achievement badge IDs, stripping internal metadata tokens.
 */
export function getCleanBadges(badges?: string[] | null): string[] {
  if (!Array.isArray(badges)) return [];
  return badges.filter((b) => typeof b === "string" && !b.startsWith(CLATS_META_PREFIX));
}

/**
 * Merges a partial metadata update into the `badges` array on a Child record.
 */
export function mergeChildMetaOntoBadges(
  existingBadges: string[] | undefined | null,
  metaPatch: Partial<ChildEmbeddedMeta>
): string[] {
  const clean = getCleanBadges(existingBadges);
  const currentMeta = extractChildMeta(existingBadges || []);

  const nextMeta: ChildEmbeddedMeta = {
    ...currentMeta,
    ...metaPatch,
    activityDates: metaPatch.activityDates
      ? Array.from(new Set(metaPatch.activityDates)).sort().slice(-90)
      : currentMeta.activityDates,
    claimedMilestones: metaPatch.claimedMilestones
      ? Array.from(new Set(metaPatch.claimedMilestones))
      : currentMeta.claimedMilestones,
    screenMonitoring: metaPatch.screenMonitoring
      ? { ...(currentMeta.screenMonitoring || {}), ...metaPatch.screenMonitoring }
      : currentMeta.screenMonitoring,
    enrolment: metaPatch.enrolment
      ? { ...(currentMeta.enrolment || {}), ...metaPatch.enrolment }
      : currentMeta.enrolment
  };

  return [...clean, `${CLATS_META_PREFIX}${JSON.stringify(nextMeta)}`];
}

function normalizePolicyFields(pol?: Partial<ScreenMonitoringPolicy> | null, fallback?: ScreenMonitoringPolicy): ScreenMonitoringPolicy {
  const fb = fallback || DEFAULT_SCREEN_MONITORING;
  const daily = Number(pol?.dailyLimitMins ?? pol?.dailyLimitMinutes ?? fb.dailyLimitMins);
  const session = Number(pol?.sessionLimitMins ?? pol?.sessionLimitMinutes ?? fb.sessionLimitMins);
  const breakOn = Boolean(pol?.breakReminderEnabled ?? pol?.breakRemindersEnabled ?? fb.breakReminderEnabled);
  const breakInt = Number(pol?.breakIntervalMins ?? pol?.breakReminderIntervalMinutes ?? fb.breakIntervalMins);
  const breakDur = Number(pol?.breakDurationMins ?? pol?.breakDurationMinutes ?? fb.breakDurationMins);
  const startHr = pol?.preferredHoursStart || pol?.preferredStartHour || fb.preferredHoursStart;
  const endHr = pol?.preferredHoursEnd || pol?.preferredEndHour || fb.preferredHoursEnd;
  const prefEnabled = Boolean(
    pol?.preferredHoursEnabled ??
      (Boolean(pol?.preferredHoursStart || pol?.preferredStartHour) && Boolean(pol?.preferredHoursEnd || pol?.preferredEndHour))
  );
  return {
    enabled: Boolean(pol?.enabled ?? fb.enabled),
    dailyLimitMins: daily,
    dailyLimitMinutes: daily,
    sessionLimitMins: session,
    sessionLimitMinutes: session,
    breakReminderEnabled: breakOn,
    breakRemindersEnabled: breakOn,
    breakIntervalMins: breakInt,
    breakReminderIntervalMinutes: breakInt,
    breakDurationMins: breakDur,
    breakDurationMinutes: breakDur,
    preferredHoursEnabled: prefEnabled,
    preferredHoursStart: startHr,
    preferredStartHour: startHr,
    preferredHoursEnd: endHr,
    preferredEndHour: endHr,
    slots: pol?.slots || fb.slots,
    updatedBy: pol?.updatedBy,
    updatedAt: pol?.updatedAt,
  };
}

/**
 * Builds sensible age-appropriate default Screen Monitoring settings for a child.
 */
export function getDefaultScreenMonitoringConfig(child?: Partial<Child> | null): ScreenMonitoringPolicy {
  const meta = extractChildMeta(child);
  const seg = getApprovedSegmentByIdOrGroup(child?.ageGroup, meta.enrolment?.segmentId, meta.enrolment?.age ?? child?.age);
  const dailyMins = seg.defaultDailyLimitMins;
  const sessionMins = seg.defaultSessionLimitMins;
  const slotSecs = Math.floor((dailyMins * 60) / 3);

  return {
    enabled: false,
    dailyLimitMins: dailyMins,
    dailyLimitMinutes: dailyMins,
    sessionLimitMins: sessionMins,
    sessionLimitMinutes: sessionMins,
    breakReminderEnabled: isYoungExplorerGroup(child?.ageGroup),
    breakRemindersEnabled: isYoungExplorerGroup(child?.ageGroup),
    breakIntervalMins: seg.defaultBreakIntervalMins,
    breakReminderIntervalMinutes: seg.defaultBreakIntervalMins,
    breakDurationMins: 2,
    breakDurationMinutes: 2,
    preferredHoursEnabled: false,
    preferredHoursStart: "06:00",
    preferredStartHour: "06:00",
    preferredHoursEnd: "20:00",
    preferredEndHour: "20:00",
    slots: {
      morning: slotSecs,
      afternoon: slotSecs,
      evening: slotSecs
    }
  };
}

/**
 * Resolves the effective Screen Monitoring policy for a child by combining:
 * 1. Child-level metadata stored in Supabase (`__clats_meta__.screenMonitoring`)
 * 2. Parent Policy and School Policy (if both exist, neither overwrites the other;
 *    the more protective/stricter active limit is applied).
 * 3. Legacy browser `localStorage` fallback (`clats_settings_v1[parentEmail]`) if present.
 */
export function resolveEffectiveScreenMonitoring(
  child?: Partial<Child> | null,
  parentEmail?: string | null
): ScreenMonitoringPolicy & {
  dailyLimitMinutes: number;
  sessionLimitMinutes: number;
  breakRemindersEnabled: boolean;
  breakReminderIntervalMinutes: number;
  breakDurationMinutes: number;
  preferredStartHour: string;
  preferredEndHour: string;
  parentPolicy?: ScreenMonitoringPolicy;
  schoolPolicy?: ScreenMonitoringPolicy;
  activeSource: "parent" | "school" | "combined" | "default";
  hasParentPolicy: boolean;
  hasSchoolPolicy: boolean;
} {
  const defaults = getDefaultScreenMonitoringConfig(child);
  const meta = extractChildMeta(child);
  const saved = meta.screenMonitoring;

  let legacyLocal: any = null;
  if (typeof window !== "undefined") {
    try {
      const allSettings = JSON.parse(localStorage.getItem("clats_settings_v1") || "{}");
      const childKey = child?.id ? `child_${child.id}` : null;
      const emailKey = (parentEmail || (child as any)?.parentEmail || (child as any)?.parent_email || "")
        .toLowerCase()
        .trim();
      legacyLocal = (childKey && allSettings[childKey]) || (emailKey && allSettings[emailKey]) || null;
    } catch {}
  }

  const baseNormalized = normalizePolicyFields(
    {
      ...(legacyLocal
        ? {
            enabled: Boolean(legacyLocal.limitsEnabled),
            dailyLimitMins:
              legacyLocal.dailyLimitMins ??
              Math.round(
                ((legacyLocal.slots?.morning || 0) +
                  (legacyLocal.slots?.afternoon || 0) +
                  (legacyLocal.slots?.evening || 0)) /
                  60
              ),
            sessionLimitMins: legacyLocal.sessionLimitMins ?? defaults.sessionLimitMins,
            breakReminderEnabled: legacyLocal.breakReminderEnabled ?? defaults.breakReminderEnabled,
            breakIntervalMins: legacyLocal.breakIntervalMins ?? defaults.breakIntervalMins,
            breakDurationMins: legacyLocal.breakDurationMins ?? defaults.breakDurationMins,
            preferredHoursEnabled: legacyLocal.preferredHoursEnabled ?? false,
            preferredHoursStart: legacyLocal.preferredHoursStart || "06:00",
            preferredHoursEnd: legacyLocal.preferredHoursEnd || "20:00",
            slots: legacyLocal.slots || defaults.slots
          }
        : {}),
      ...(saved || {})
    },
    defaults
  );

  const pPolRaw = saved?.parentPolicy;
  const sPolRaw = saved?.schoolPolicy;
  const hasParentPolicy = Boolean(pPolRaw && Object.keys(pPolRaw).length > 0);
  const hasSchoolPolicy = Boolean(sPolRaw && Object.keys(sPolRaw).length > 0);
  const pPol = hasParentPolicy ? normalizePolicyFields(pPolRaw, baseNormalized) : undefined;
  const sPol = hasSchoolPolicy ? normalizePolicyFields(sPolRaw, baseNormalized) : undefined;

  if (hasParentPolicy && hasSchoolPolicy && pPol && sPol) {
    const pDaily = Number(pPol.dailyLimitMins || 0);
    const sDaily = Number(sPol.dailyLimitMins || 0);
    const combinedDaily =
      pDaily > 0 && sDaily > 0 ? Math.min(pDaily, sDaily) : pDaily > 0 ? pDaily : sDaily;

    const pSess = Number(pPol.sessionLimitMins || 0);
    const sSess = Number(sPol.sessionLimitMins || 0);
    const combinedSession =
      pSess > 0 && sSess > 0 ? Math.min(pSess, sSess) : pSess > 0 ? pSess : sSess;

    const pBreak = Number(pPol.breakIntervalMins || 0);
    const sBreak = Number(sPol.breakIntervalMins || 0);
    const combinedBreak =
      pBreak > 0 && sBreak > 0 ? Math.min(pBreak, sBreak) : pBreak || sBreak || defaults.breakIntervalMins;

    const combined = normalizePolicyFields(
      {
        ...baseNormalized,
        enabled: Boolean(pPol.enabled || sPol.enabled),
        dailyLimitMins: combinedDaily,
        sessionLimitMins: combinedSession,
        breakReminderEnabled: Boolean(pPol.breakReminderEnabled || sPol.breakReminderEnabled),
        breakIntervalMins: combinedBreak,
        preferredHoursEnabled: Boolean(pPol.preferredHoursEnabled || sPol.preferredHoursEnabled),
        preferredHoursStart: pPol.preferredHoursStart || sPol.preferredHoursStart || "06:00",
        preferredHoursEnd: pPol.preferredHoursEnd || sPol.preferredHoursEnd || "20:00",
        slots: pPol.slots || sPol.slots || baseNormalized.slots,
      },
      defaults
    );

    return {
      ...combined,
      dailyLimitMinutes: combined.dailyLimitMins,
      sessionLimitMinutes: combined.sessionLimitMins,
      breakRemindersEnabled: combined.breakReminderEnabled,
      breakReminderIntervalMinutes: combined.breakIntervalMins,
      breakDurationMinutes: combined.breakDurationMins,
      preferredStartHour: combined.preferredHoursStart,
      preferredEndHour: combined.preferredHoursEnd,
      parentPolicy: pPol,
      schoolPolicy: sPol,
      activeSource: "combined",
      hasParentPolicy: true,
      hasSchoolPolicy: true
    };
  }

  const single = hasSchoolPolicy && sPol ? sPol : hasParentPolicy && pPol ? pPol : baseNormalized;
  return {
    ...single,
    dailyLimitMinutes: single.dailyLimitMins,
    sessionLimitMinutes: single.sessionLimitMins,
    breakRemindersEnabled: single.breakReminderEnabled,
    breakReminderIntervalMinutes: single.breakIntervalMins,
    breakDurationMinutes: single.breakDurationMins,
    preferredStartHour: single.preferredHoursStart,
    preferredEndHour: single.preferredHoursEnd,
    parentPolicy: pPol,
    schoolPolicy: sPol,
    activeSource: hasSchoolPolicy ? "school" : hasParentPolicy || saved ? "parent" : "default",
    hasParentPolicy,
    hasSchoolPolicy
  };
}

/**
 * Checks whether the current local time falls within the permitted usage window.
 * Supports either `(config: ScreenMonitoringPolicy, now?: Date)` or `(startStr: string, endStr: string, now?: Date)`.
 */
export function isWithinPreferredHours(
  configOrStart?: ScreenMonitoringPolicy | string | null,
  endOrNow?: string | Date | null,
  maybeNow?: Date
): boolean {
  let start = "06:00";
  let end = "20:00";
  let now = new Date();

  if (typeof configOrStart === "string") {
    start = configOrStart || "06:00";
    end = typeof endOrNow === "string" ? endOrNow : "20:00";
    if (maybeNow instanceof Date) now = maybeNow;
  } else if (configOrStart && typeof configOrStart === "object") {
    if (!configOrStart.preferredHoursEnabled) return true;
    start = configOrStart.preferredHoursStart || configOrStart.preferredStartHour || "06:00";
    end = configOrStart.preferredHoursEnd || configOrStart.preferredEndHour || "20:00";
    if (endOrNow instanceof Date) now = endOrNow;
  } else {
    return true;
  }

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(eh)) return true;

  const curMins = now.getHours() * 60 + now.getMinutes();
  const startMins = sh * 60 + (sm || 0);
  const endMins = eh * 60 + (em || 0);

  if (startMins <= endMins) {
    return curMins >= startMins && curMins <= endMins;
  }
  return curMins >= startMins || curMins <= endMins;
}
