/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Parent, Language, AgeGroup } from "../types";
import {
  C,
  F,
  T,
  S,
  getParentLimits,
  slotAllowance,
  AGE_LABEL,
  AGE_AGES,
  AGE_META,
  LANG_OPTIONS,
  INTERESTS,
  getDynamicAgeGroups,
  getAgeLabel,
  getAgeRange
} from "../utils/config";
import { CURRICULUM } from "../data/curriculum";
import { Card, Txt, Heading, Label, Chip, Btn, Toggle, FieldInput, FontOffsetContext } from "./Primitives";
import { KobeAvatar } from "./KobeAvatar";
import confetti from "canvas-confetti";
import { sfx, companionVoice } from "../utils/audio";
import {
  APPROVED_AGE_SEGMENTS,
  ApprovedAgeSegmentId,
  calculateAgeFromDob,
  getApprovedSegmentForAge,
  getApprovedSegmentByIdOrGroup,
  extractChildMeta,
  mergeChildMetaOntoBadges,
  resolveEffectiveScreenMonitoring,
  DEFAULT_SCREEN_MONITORING,
  ScreenMonitoringSettings
} from "../utils/childMeta";
import { computeEffectiveStreak } from "../utils/streak";

interface SettingsScreenProps {
  parent: Parent;
  onBack: () => void;
  lang: Language;
  onParentRefresh: (fresh: Parent) => void;
  theme: "light" | "dark";
  onLanguageChange: (lang: Language) => void;
  onTriggerParentTour?: () => void;
  onTriggerChildTour?: () => void;
  onToggleTheme?: () => void;
}

// ----------------------------------------------------
// CHILD SETUP SCREEN (Tailored visual flow for age groups)
// ----------------------------------------------------
interface ChildSetupScreenProps {
  parentEmail: string;
  onDone: (childName?: string, newChild?: any) => void;
  lang: Language;
  onBack?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export const ChildSetupScreen: React.FC<ChildSetupScreenProps> = ({
  parentEmail,
  onDone,
  lang,
  onBack,
  theme = "dark",
  onToggleTheme
}) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [childAge, setChildAge] = useState<number>(8);
  const [segmentId, setSegmentId] = useState<ApprovedAgeSegmentId>("young_explorers");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("early explorers");
  const [guardianRelationship, setGuardianRelationship] = useState("Parent");
  const [schoolName, setSchoolName] = useState("");
  const [className, setClassName] = useState("");
  const [parentConsent, setParentConsent] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [supportPrefs, setSupportPrefs] = useState<string[]>(["Voice Reader ON", "Gentle Break Reminders"]);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [companion, setCompanion] = useState<"kobe" | "chibi">("kobe");
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [limitMins, setLimitMins] = useState(30);
  const [sessionLimitMins, setSessionLimitMins] = useState(20);
  const [breakRemindersEnabled, setBreakRemindersEnabled] = useState(true);
  const [breakIntervalMins, setBreakIntervalMins] = useState(15);
  const [preferredHoursEnabled, setPreferredHoursEnabled] = useState(false);
  const [preferredStartHour, setPreferredStartHour] = useState("07:00");
  const [preferredEndHour, setPreferredEndHour] = useState("20:00");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [auditioning, setAuditioning] = useState<"kobe" | "chibi" | null>(null);
  const [microQuestSolved, setMicroQuestSolved] = useState(false);
  const pendingChildRef = React.useRef<any>(null);

  // Automatic age calculation & approved 4-segment assignment
  const handleAgeOrDobChange = (nextAge: number, nextDob?: string) => {
    const clampedAge = Math.max(2, Math.min(18, Math.round(nextAge || 8)));
    setChildAge(clampedAge);
    if (nextDob !== undefined) setDob(nextDob);
    const seg = getApprovedSegmentForAge(clampedAge);
    setSegmentId(seg.id);
    setAgeGroup(seg.curriculumKey as AgeGroup);
    // Apply sensible age-appropriate screen monitoring defaults
    if (seg.id === "early_explorers") {
      setLimitMins(20);
      setSessionLimitMins(15);
      setBreakIntervalMins(10);
    } else if (seg.id === "young_explorers") {
      setLimitMins(30);
      setSessionLimitMins(20);
      setBreakIntervalMins(15);
    } else if (seg.id === "young_builders") {
      setLimitMins(45);
      setSessionLimitMins(30);
      setBreakIntervalMins(20);
    } else {
      setLimitMins(60);
      setSessionLimitMins(40);
      setBreakIntervalMins(25);
    }
  };

  const handleSelectSegment = (seg: typeof APPROVED_AGE_SEGMENTS[number]) => {
    setSegmentId(seg.id);
    setAgeGroup(seg.curriculumKey as AgeGroup);
    if (childAge < seg.minAge || childAge > seg.maxAge) {
      const midAge = Math.round((seg.minAge + seg.maxAge) / 2);
      setChildAge(midAge);
      setDob("");
    }
  };

  const activeSegment = APPROVED_AGE_SEGMENTS.find((s) => s.id === segmentId) || APPROVED_AGE_SEGMENTS[1];

  const handleAudition = (comp: "kobe" | "chibi") => {
    setCompanion(comp);
    setAuditioning(comp);
    sfx.playTap();
    const sampleText = comp === "kobe"
      ? `Hello ${name || "friend"}! I am Kobe, your learning companion. Let's explore technology and create something awesome together!`
      : `Hi ${name || "friend"}! I am Chibi. I am so excited to guide your learning adventures in tech and creative coding!`;
    companionVoice.speakTTS(sampleText, comp, ageGroup, lang);
    setTimeout(() => {
      setAuditioning((curr) => (curr === comp ? null : curr));
    }, 4500);
  };

  // Tailor interests based on the selected AgeGroup!
  const getInterestOptions = (ag: AgeGroup) => {
    if (ag === "early explorers" || (ag as any) === "young explorers") {
      return [
        { key: "Story Matching", icon: "🧸", label: "Story Matching" },
        { key: "Shapes & Colors", icon: "🎨", label: "Shapes & Colors" },
        { key: "Sights & Sounds", icon: "🎵", label: "Sights & Sounds" },
        { key: "Cartoon Helpers", icon: "🤖", label: "Cartoon Helpers" }
      ];
    } else if (ag === "young innovators") {
      return [
        { key: "How AI Thinks", icon: "⚡", label: "How AI Thinks" },
        { key: "Cyber Safety", icon: "🛡️", label: "Cyber Safety" },
        { key: "Drag-Drop Coding", icon: "🧩", label: "Drag-Drop Coding" },
        { key: "Creative Design", icon: "🎨", label: "Creative Design" }
      ];
    } else {
      return [
        { key: "AI Prompt Engineering", icon: "✍️", label: "AI Prompting" },
        { key: "Cybersecurity Hacks", icon: "🔒", label: "Cybersecurity" },
        { key: "Software & Web Apps", icon: "💻", label: "Web Coding" },
        { key: "Data Science & Web3", icon: "📈", label: "Data & Web3" }
      ];
    }
  };

  const limitPresets = [
    { val: 20, session: 15, label: "20 min / day", sub: "Recommended for Early Explorers (Ages 2–5)" },
    { val: 30, session: 20, label: "30 min / day", sub: "Recommended for Young Explorers (Ages 6–10)" },
    { val: 45, session: 30, label: "45 min / day", sub: "Recommended for Young Builders (Ages 11–13)" },
    { val: 60, session: 40, label: "60 min / day", sub: "Recommended for Future Innovators (Ages 14–18)" },
    { val: 0, session: 0, label: "No Daily Cap", sub: "Flexible learning time with break reminders" }
  ];

  const stepTitles = [
    "Child & Guardian Details",
    "Choose Learning Companion",
    "Security Login PIN",
    "Screen Monitoring & Habits",
    "Enrolment Summary"
  ];
  const meta = AGE_META[ageGroup] || { color: C.teal, soft: C.tealGhost };
  const borderCol = meta.color;

  const toggleInterest = (k: string) => {
    setInterests((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const toggleSupportPref = (k: string) => {
    setSupportPrefs((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const handleNext = async () => {
    setErr("");
    if (step === 0) {
      if (!name.trim()) {
        setErr("Please enter the child's first or display name.");
        return;
      }
      const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
      if (!cleanUsername) {
        setErr("Please enter a unique username for the child.");
        return;
      }
      if (cleanUsername.length < 3) {
        setErr("Username must be at least 3 characters.");
        return;
      }
      if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
        setErr("Username must only contain lowercase letters, numbers, and underscores.");
        return;
      }
      if (childAge < 2 || childAge > 18) {
        setErr("Please enter an age between 2 and 18.");
        return;
      }
      if (!parentConsent) {
        setErr("Please confirm parent/guardian consent to enrol your child.");
        return;
      }
      // Duplicate child check under this parent account
      const safeEmailCheck = (parentEmail || "").toLowerCase().trim();
      if (safeEmailCheck) {
        const existingChildren = S.getParents()?.[safeEmailCheck]?.children || [];
        const duplicate = existingChildren.find(
          (c: any) =>
            (c.username && String(c.username).toLowerCase() === cleanUsername) ||
            (String(c.name || "").trim().toLowerCase() === name.trim().toLowerCase() &&
              Number(c.age || 0) === Number(childAge))
        );
        if (duplicate) {
          setErr(
            `A profile for "${duplicate.name}" (@${duplicate.username || cleanUsername}) is already enrolled under your account.`
          );
          return;
        }
      }
      setStep(1);
    } else if (step === 1) {
      if (companion !== "kobe" && companion !== "chibi") {
        setErr("Please select Kobe or Chibi as your child's learning companion.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (pin.length < 4) {
        setErr("PIN must be at least 4 digits.");
        return;
      }
      if (pin !== pin2) {
        setErr("PINs do not match.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      // Save constraints locally + inside child metadata for cross-device Supabase sync
      const allSettings = S.getSettings();
      const effectiveLimitMins = monitoringEnabled ? limitMins : 0;
      const secs = effectiveLimitMins * 60;
      const thirds = Math.floor(secs / 3);

      const safeEmail = (parentEmail || "").toLowerCase().trim();

      const slotsObj = {
        morning: ageGroup === "future builders" ? Math.floor(secs * 0.5) : thirds,
        afternoon: ageGroup === "future builders" ? 0 : thirds,
        evening: ageGroup === "future builders" ? Math.ceil(secs * 0.5) : thirds
      };

      if (safeEmail) {
        allSettings[safeEmail] = {
          limitsEnabled: monitoringEnabled && effectiveLimitMins > 0,
          slots: slotsObj
        };
        S.setSettings(allSettings);
      }

      const parentPolicyObj = {
        enabled: monitoringEnabled,
        dailyLimitMins: effectiveLimitMins,
        sessionLimitMins: monitoringEnabled ? sessionLimitMins : 0,
        breakRemindersEnabled: monitoringEnabled && breakRemindersEnabled,
        breakIntervalMins,
        breakDurationMins: 2,
        preferredHoursEnabled: monitoringEnabled && preferredHoursEnabled,
        preferredStartHour,
        preferredEndHour,
        slots: slotsObj,
        updatedBy: "parent" as const,
        updatedAt: new Date().toISOString()
      };

      const screenMonitoringMeta: ScreenMonitoringSettings = {
        ...DEFAULT_SCREEN_MONITORING,
        ...parentPolicyObj,
        parentPolicy: parentPolicyObj
      };

      const enrolmentMeta = {
        dob: dob || undefined,
        calculatedAge: childAge,
        assignedSegmentId: activeSegment.id,
        assignedSegmentLabel: `${activeSegment.label} (${activeSegment.rangeLabel})`,
        guardianRelationship,
        parentConsent,
        communicationPrefs: weeklyDigest ? ["Weekly Progress Digest", "Milestone Alerts"] : ["Milestone Alerts"],
        schoolName: schoolName.trim() || undefined,
        className: className.trim() || undefined,
        accessibilityPrefs: supportPrefs,
        companionSelectedAt: new Date().toISOString(),
        enrolledBy: "parent" as const
      };

      const initialBadges = mergeChildMetaOntoBadges([], {
        screenMonitoring: screenMonitoringMeta,
        enrolment: enrolmentMeta
      });

      if (!pendingChildRef.current) {
        pendingChildRef.current = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + Date.now().toString().slice(-12),
          name: name.trim(),
          username: username.trim().toLowerCase().replace(/\s+/g, '_'),
          age: childAge,
          ageGroup,
          pin,
          interests,
          completed: {},
          xp: microQuestSolved ? 20 : 0,
          stars: {},
          badges: initialBadges,
          createdAt: Date.now(),
          companion: companion || "kobe"
        };

        // 1. Update local storage parent data first to ensure instant UI response
        if (safeEmail) {
          try {
            const parents = S.getParents();
            if (!parents[safeEmail]) {
              parents[safeEmail] = { email: safeEmail, name: "Parent", children: [] };
            }
            if (!parents[safeEmail].children) parents[safeEmail].children = [];
            parents[safeEmail].children.push(pendingChildRef.current);
            S.setParents(parents);
          } catch (e) {
            console.error("Failed to update local parents cache:", e);
          }
        }
      }
      const newChild: any = pendingChildRef.current;

      // Sync child directly to Supabase
      if (safeEmail) {
        // 2. Sync to backend database -- verify the write actually landed instead of
        // assuming it did. Previously this response was never checked, so if the
        // cloud write was rejected (e.g. schema drift, missing parent row) the parent
        // would still see "enrolled!" while the child only existed on this device,
        // and login from any other device would fail with no explanation.
        setSaving(true);
        try {
          const res = await fetch("/api/supabase/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              parentEmail: safeEmail,
              children: [newChild]
            })
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.ok) {
            setSaving(false);
            setErr(
              (data && (data.msg || data.error)) ||
              "Could not save this profile to the cloud. Please check your connection and try again -- otherwise this child won't be able to log in from another device."
            );
            return;
          }
        } catch (e) {
          // Genuinely offline (fetch never reached the server): keep the app's
          // documented offline-tolerant behavior, but let the parent know this
          // profile hasn't synced yet so cross-device login won't work until it does.
          console.warn("Failed to sync new child to Supabase (offline?):", e);
          setSaving(false);
          setErr("You appear to be offline. This profile was saved on this device but won't be available on other devices until you're back online.");
          return;
        }
        setSaving(false);
      }

      onDone(name.trim(), newChild);
    }
  };

  const isDark = theme === "dark";
  const bg = isDark ? "#0F172A" : "#F8FAFC";
  const text = isDark ? "#F8FAFC" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#475569";
  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const border = isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0";
  const innerBg = isDark ? "rgba(255, 255, 255, 0.03)" : "#F1F5F9";

  return (
    <div style={{ height: "100vh", maxHeight: "100vh", overflow: "hidden", background: bg, color: text, display: "flex", flexDirection: "column", transition: "background 0.3s, color 0.3s" }}>
      {/* Dynamic Header color changes based on selected Age Group */}
      <div
        style={{
          background: `linear-gradient(135deg, ${borderCol}, ${borderCol}CC)`,
          padding: "24px 22px 28px",
          borderRadius: "0 0 26px 26px",
          transition: "all 0.5s ease"
        }}
      >
        {/* Navigation / Header Actions Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          {onBack ? (
            <button
              onClick={onBack}
              style={{
                background: "rgba(255, 255, 255, 0.16)",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                color: "#FFFFFF",
                fontFamily: F.body,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "background 0.2s"
              }}
            >
              ← Cancel
            </button>
          ) : <div />}
          
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              style={{
                background: "rgba(255, 255, 255, 0.16)",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                color: "#FFFFFF",
                fontFamily: F.body,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "background 0.2s"
              }}
            >
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 3,
                background: i <= step ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.25)",
                transition: "background 0.3s"
              }}
            />
          ))}
        </div>
        <div style={{ fontFamily: F.display, fontSize: 24, color: "#FFFFFF", marginBottom: 4 }}>
          {stepTitles[step]}
        </div>
        <Txt size={13} color="rgba(255,255,255,0.85)">
          {step === 0 && "Let's capture details to tailor their AI curriculum."}
          {step === 1 && `Configure personal settings for ${name}.`}
          {step === 2 && "Enter a 4-digit safety PIN for private login."}
          {step === 3 && "Help your child build healthy screen balance."}
          {step === 4 && `${name}'s personalized learning universe is ready!`}
        </Txt>
      </div>

      <div style={{ flex: 1, padding: "20px 18px 24px", overflowY: "auto" }}>
        {step === 0 && (
          <Card style={{ background: cardBg, borderColor: border, color: text, maxWidth: 560, margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FieldInput
                  label="Child's First / Display Name"
                  value={name}
                  onChange={setName}
                  theme={theme}
                  placeholder="e.g. Aisha"
                />
                <FieldInput
                  label="Unique Login Username"
                  value={username}
                  onChange={(v) => setUsername(v.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""))}
                  theme={theme}
                  placeholder="e.g. explorer_aisha"
                />
              </div>

              {/* Date of Birth OR Age (2-18) -> Automatic Age Segment Assignment */}
              <div
                style={{
                  padding: "14px",
                  borderRadius: 14,
                  background: innerBg,
                  border: `1.5px solid ${border}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Label style={{ margin: 0, color: text }}>Date of Birth or Age (Ages 2–18)</Label>
                  <Chip color={borderCol}>Auto-Assigns Stage</Chip>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <Txt size={11} weight={700} color={textMuted} style={{ display: "block", marginBottom: 4 }}>
                      Date of Birth (Optional)
                    </Txt>
                    <input
                      type="date"
                      value={dob}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        const val = e.target.value;
                        const calc = calculateAgeFromDob(val);
                        if (calc !== null) {
                          handleAgeOrDobChange(calc, val);
                        } else {
                          setDob(val);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: `1.5px solid ${border}`,
                        background: cardBg,
                        color: text,
                        fontSize: 13,
                        fontWeight: 700
                      }}
                    />
                  </div>
                  <div>
                    <Txt size={11} weight={700} color={textMuted} style={{ display: "block", marginBottom: 4 }}>
                      Child&apos;s Age (Years)
                    </Txt>
                    <select
                      value={childAge}
                      onChange={(e) => handleAgeOrDobChange(Number(e.target.value), dob)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: `1.5px solid ${border}`,
                        background: cardBg,
                        color: text,
                        fontSize: 13,
                        fontWeight: 800
                      }}
                    >
                      {Array.from({ length: 17 }, (_, i) => i + 2).map((yr) => (
                        <option key={yr} value={yr}>
                          {yr} years old
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Approved 4-Segment Learning Track Display */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Label style={{ margin: 0, color: textMuted }}>Assigned Learning Pathway Stage</Label>
                  <Txt size={11} color={borderCol} weight={800}>
                    ✓ {activeSegment.label} (Ages {activeSegment.rangeLabel})
                  </Txt>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {APPROVED_AGE_SEGMENTS.map((seg) => {
                    const isSelected = segmentId === seg.id;
                    return (
                      <div
                        key={seg.id}
                        onClick={() => handleSelectSegment(seg)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 14,
                          border: "2px solid " + (isSelected ? borderCol : border),
                          background: isSelected ? borderCol + "14" : innerBg,
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          display: "flex",
                          alignItems: "center",
                          gap: 10
                        }}
                      >
                        <div style={{ fontSize: 22 }}>{seg.emoji}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Txt
                            size={13}
                            weight={isSelected ? 800 : 600}
                            color={isSelected ? borderCol : text}
                            style={{ display: "block" }}
                          >
                            {seg.label}
                          </Txt>
                          <Txt size={10.5} color={textMuted}>
                            Ages {seg.rangeLabel}
                          </Txt>
                        </div>
                        {isSelected && (
                          <span style={{ fontSize: 14, fontWeight: 900, color: borderCol }}>✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guardian Relationship & Optional School / Class Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <Txt size={11} weight={700} color={textMuted} style={{ display: "block", marginBottom: 4 }}>
                    Your Relationship to Child
                  </Txt>
                  <select
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1.5px solid ${border}`,
                      background: innerBg,
                      color: text,
                      fontSize: 13,
                      fontWeight: 700
                    }}
                  >
                    <option value="Parent">Parent</option>
                    <option value="Legal Guardian">Legal Guardian</option>
                    <option value="Relative">Family Member / Relative</option>
                  </select>
                </div>
                <FieldInput
                  label="School / Class (Optional)"
                  value={schoolName}
                  onChange={setSchoolName}
                  theme={theme}
                  placeholder="e.g. Greenfield Primary - Grade 3"
                />
              </div>

              {/* Parental Consent & Digest Toggle */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: innerBg,
                  border: `1px solid ${border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}
              >
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={parentConsent}
                    onChange={(e) => setParentConsent(e.target.checked)}
                    style={{ marginTop: 3, accentColor: borderCol, width: 16, height: 16 }}
                  />
                  <Txt size={12} color={text} style={{ lineHeight: 1.4 }}>
                    <strong>Parent / Guardian Consent:</strong> I consent to creating this child learning profile and managing their progress and healthy screen-time settings in CLATS.
                  </Txt>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    style={{ accentColor: borderCol, width: 15, height: 15 }}
                  />
                  <Txt size={11.5} color={textMuted}>
                    Send me weekly learning milestones and screen-time summaries.
                  </Txt>
                </label>
              </div>
            </div>
          </Card>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 560, margin: "0 auto" }}>
            {/* Companion Selection Hero Banner */}
            <Card
              style={{
                background: `linear-gradient(135deg, ${meta.soft}, ${cardBg})`,
                borderColor: borderCol,
                color: text
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <KobeAvatar size={64} ageGroup={ageGroup} pulse expression="excited" character={companion} />
                <div style={{ flex: 1 }}>
                  <Label color={borderCol}>
                    Meet Your Learning Companion: {companion === "chibi" ? "Chibi" : "Kobe"}!
                  </Label>
                  <Txt size={14} weight={800} style={{ display: "block", color: text, marginBottom: 2 }}>
                    {companion === "kobe"
                      ? "Kobe — Curious Tech & Logic Explorer 🚀"
                      : "Chibi — Creative Story & Cyber Safety Guide ✨"}
                  </Txt>
                  <Txt size={12} color={textMuted}>
                    {companion === "kobe"
                      ? `Kobe guides ${name || "your child"} through smart devices, robotics, patterns, and step-by-step problem solving!`
                      : `Chibi inspires ${name || "your child"} with colourful stories, digital creativity, music, and safe online adventures!`}
                  </Txt>
                </div>
              </div>
            </Card>

            <Card style={{ background: cardBg, borderColor: border, color: text }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Label style={{ margin: 0, color: text }}>Choose {name || "Your Child"}&apos;s Companion</Label>
                <Txt size={11} color={borderCol} weight={800}>Tap to select · Tap 🔊 to hear voice</Txt>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                {[
                  {
                    id: "kobe" as const,
                    title: "Kobe",
                    badge: "Tech & Logic Guide 🚀",
                    desc: "Loves smart gadgets, coding puzzles, pattern quests, and building cool inventions!",
                    traits: ["🤖 Robotics & AI", "🧩 Pattern Quests", "⚡ Step-by-Step Hints"]
                  },
                  {
                    id: "chibi" as const,
                    title: "Chibi",
                    badge: "Creative & Safety Guide ✨",
                    desc: "Loves digital art, music studio, storytelling, and keeping explorers safe online!",
                    traits: ["🎨 Art & Storytelling", "🛡️ Cyber Safety", "🎵 Friendly Encouragement"]
                  }
                ].map((comp) => {
                  const isSel = companion === comp.id;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => setCompanion(comp.id)}
                      style={{
                        padding: "16px 14px",
                        borderRadius: 20,
                        border: "2.5px solid " + (isSel ? borderCol : border),
                        background: isSel ? borderCol + "14" : innerBg,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.2s",
                        textAlign: "center",
                        position: "relative"
                      }}
                    >
                      {isSel && (
                        <span
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            background: borderCol,
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 900,
                            padding: "2px 8px",
                            borderRadius: 999
                          }}
                        >
                          ✓ SELECTED
                        </span>
                      )}
                      <KobeAvatar size={72} ageGroup={ageGroup} character={comp.id} expression={isSel ? "excited" : "happy"} />
                      <div>
                        <Txt size={16} weight={900} color={isSel ? borderCol : text} style={{ display: "block" }}>
                          {comp.title}
                        </Txt>
                        <Txt size={11} weight={800} color={borderCol} style={{ display: "block", marginTop: 2 }}>
                          {comp.badge}
                        </Txt>
                      </div>
                      <Txt size={11.5} color={textMuted} style={{ lineHeight: 1.35 }}>
                        {comp.desc}
                      </Txt>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 2 }}>
                        {comp.traits.map((tr) => (
                          <span
                            key={tr}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 8,
                              background: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                              color: textMuted
                            }}
                          >
                            {tr}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAudition(comp.id);
                        }}
                        style={{
                          marginTop: 6,
                          background: auditioning === comp.id ? borderCol : (isDark ? "#334155" : "#e2e8f0"),
                          color: auditioning === comp.id ? "#ffffff" : text,
                          border: "none",
                          borderRadius: 20,
                          padding: "6px 14px",
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <span>{auditioning === comp.id ? `🔊 ${comp.title} Speaking...` : `🔊 Hear ${comp.title}`}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* FIRST INTERACTIVE MICRO-QUEST PREVIEW */}
              <div
                style={{
                  marginTop: 4,
                  marginBottom: 16,
                  padding: "14px 16px",
                  borderRadius: 18,
                  background: microQuestSolved
                    ? (isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5")
                    : (isDark ? "rgba(245, 158, 11, 0.12)" : "#fef3c7"),
                  border: `1.5px solid ${microQuestSolved ? "#10b981" : "#f59e0b"}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Txt size={12} weight={900} color={microQuestSolved ? "#059669" : "#b45309"} style={{ textTransform: "uppercase" }}>
                    🚀 {microQuestSolved ? "Starter Micro-Quest Solved!" : `Warm-Up with ${companion === "chibi" ? "Chibi" : "Kobe"}`}
                  </Txt>
                  {microQuestSolved && <Chip color="#10b981" bg="#d1fae5">+20 STARTER XP</Chip>}
                </div>
                <Txt size={12.5} color={text} style={{ display: "block", marginBottom: 10 }}>
                  {microQuestSolved
                    ? `Awesome work! ${name || "Your child"} unlocked +20 Starter XP with ${companion === "chibi" ? "Chibi" : "Kobe"}!`
                    : `Tap a clean energy source to power up ${companion === "chibi" ? "Chibi" : "Kobe"}'s adventure ship:`}
                </Txt>
                {!microQuestSolved ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { title: "☀️ Clean Solar Battery", correct: true },
                      { title: "💨 Wind Turbine Node", correct: true },
                      { title: "🪵 Old Smoke Furnace", correct: false }
                    ].map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (opt.correct) {
                            sfx.playLevelUp();
                            confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
                            setMicroQuestSolved(true);
                            companionVoice.speakTTS(`Super choice! You just powered up our rocket engine!`, companion, ageGroup, lang);
                          } else {
                            sfx.playError();
                          }
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 12,
                          border: `1.5px solid ${border}`,
                          background: innerBg,
                          color: text,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {opt.title}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>⚡</span>
                    <Txt size={12} color="#10b981" weight={700}>Adventure engine 100% online & ready!</Txt>
                  </div>
                )}
              </div>

              {/* Learning Support & Accessibility Preferences */}
              <div style={{ marginBottom: 16 }}>
                <Label style={{ marginBottom: 8, color: textMuted }}>Learning Support Preferences (Optional)</Label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { key: "Voice Reader ON", icon: "🔊" },
                    { key: "Gentle Break Reminders", icon: "🌿" },
                    { key: "Visual Step Hints", icon: "💡" }
                  ].map((pref) => {
                    const isSel = supportPrefs.includes(pref.key);
                    return (
                      <button
                        key={pref.key}
                        type="button"
                        onClick={() => toggleSupportPref(pref.key)}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 12,
                          border: `1.5px solid ${isSel ? borderCol : border}`,
                          background: isSel ? `${borderCol}18` : innerBg,
                          color: isSel ? borderCol : text,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span>{pref.icon}</span>
                        <span>{pref.key}</span>
                        {isSel && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INTEREST TOPICS MULTI-SELECT PICKER */}
              <div>
                <Label style={{ marginBottom: 8, color: textMuted }}>Select Focus Interests (Optional)</Label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {getInterestOptions(ageGroup).map((item) => {
                    const isSelected = interests.includes(item.key);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleInterest(item.key)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 14,
                          border: `1.5px solid ${isSelected ? borderCol : border}`,
                          background: isSelected ? `${borderCol}18` : innerBg,
                          color: isSelected ? borderCol : text,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === 2 && (
          <Card style={{ background: cardBg, borderColor: border, color: text, maxWidth: 560, margin: "0 auto" }}>
            <div
              style={{
                padding: "12px 14px",
                background: isDark ? "rgba(34, 211, 238, 0.08)" : "rgba(34, 211, 238, 0.05)",
                borderRadius: 10,
                border: "1px solid " + (isDark ? "rgba(34, 211, 238, 0.15)" : "rgba(34, 211, 238, 0.2)"),
                marginBottom: 16
              }}
            >
              <Txt size={13} color={text} style={{ lineHeight: 1.6 }}>
                💡 Create a private 4-digit PIN for {name}. They will enter this PIN along with their username to sign in safely from any device.
              </Txt>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FieldInput
                label="Enter 4-Digit PIN"
                value={pin}
                onChange={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))}
                type="password"
                theme={theme}
                placeholder="4 numbers"
              />
              <FieldInput
                label="Confirm PIN"
                value={pin2}
                onChange={(v) => setPin2(v.replace(/\D/g, "").slice(0, 4))}
                type="password"
                theme={theme}
                placeholder="Repeat selected PIN"
              />
            </div>
          </Card>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 560, margin: "0 auto" }}>
            <Card style={{ background: cardBg, borderColor: border, color: text }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <Txt size={15} weight={800} color={text} style={{ display: "block" }}>
                    Enable Screen Monitoring & Healthy Habits
                  </Txt>
                  <Txt size={12} color={textMuted}>
                    Track learning time, enforce daily/session limits, and prompt eye-rest breaks
                  </Txt>
                </div>
                <Toggle on={monitoringEnabled} onToggle={() => setMonitoringEnabled((v) => !v)} />
              </div>

              {monitoringEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                  <div>
                    <Label style={{ marginBottom: 8, color: textMuted }}>Daily Screen-Time Limit</Label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {limitPresets.map((preset) => (
                        <div
                          key={preset.val}
                          onClick={() => {
                            setLimitMins(preset.val);
                            if (preset.session > 0) setSessionLimitMins(preset.session);
                          }}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 12,
                            border: "1.5px solid " + (limitMins === preset.val ? borderCol : border),
                            background: limitMins === preset.val ? borderCol + "12" : innerBg,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <Txt size={14} weight={800} color={limitMins === preset.val ? borderCol : text}>
                              {preset.label}
                            </Txt>
                            <Txt size={11} color={textMuted} style={{ display: "block" }}>
                              {preset.sub}
                            </Txt>
                          </div>
                          {limitMins === preset.val && (
                            <span style={{ fontSize: 16, fontWeight: "bold", color: borderCol }}>✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Session Limit & Break Reminders */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ padding: 12, borderRadius: 12, background: innerBg, border: `1px solid ${border}` }}>
                      <Txt size={11} weight={800} color={textMuted} style={{ display: "block", marginBottom: 6 }}>
                        Max Continuous Session
                      </Txt>
                      <select
                        value={sessionLimitMins}
                        onChange={(e) => setSessionLimitMins(Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${border}`,
                          background: cardBg,
                          color: text,
                          fontSize: 13,
                          fontWeight: 700
                        }}
                      >
                        <option value={15}>15 mins per session</option>
                        <option value={20}>20 mins per session</option>
                        <option value={30}>30 mins per session</option>
                        <option value={45}>45 mins per session</option>
                        <option value={0}>No session cap</option>
                      </select>
                    </div>

                    <div style={{ padding: 12, borderRadius: 12, background: innerBg, border: `1px solid ${border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <Txt size={11} weight={800} color={textMuted}>
                          Eye-Rest Break Prompts
                        </Txt>
                        <input
                          type="checkbox"
                          checked={breakRemindersEnabled}
                          onChange={(e) => setBreakRemindersEnabled(e.target.checked)}
                          style={{ accentColor: borderCol }}
                        />
                      </div>
                      <select
                        value={breakIntervalMins}
                        disabled={!breakRemindersEnabled}
                        onChange={(e) => setBreakIntervalMins(Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${border}`,
                          background: cardBg,
                          color: text,
                          fontSize: 13,
                          fontWeight: 700
                        }}
                      >
                        <option value={10}>Every 10 mins</option>
                        <option value={15}>Every 15 mins</option>
                        <option value={20}>Every 20 mins</option>
                        <option value={30}>Every 30 mins</option>
                      </select>
                    </div>
                  </div>

                  {/* Preferred Learning Hours Window */}
                  <div style={{ padding: 12, borderRadius: 12, background: innerBg, border: `1px solid ${border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: preferredHoursEnabled ? 10 : 0 }}>
                      <div>
                        <Txt size={12.5} weight={800} color={text} style={{ display: "block" }}>
                          Preferred Learning Hours Window
                        </Txt>
                        <Txt size={11} color={textMuted}>
                          Restrict portal access outside permitted daytime hours
                        </Txt>
                      </div>
                      <Toggle on={preferredHoursEnabled} onToggle={() => setPreferredHoursEnabled((v) => !v)} />
                    </div>
                    {preferredHoursEnabled && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <Txt size={11} color={textMuted} style={{ display: "block", marginBottom: 4 }}>Start Time</Txt>
                          <input
                            type="time"
                            value={preferredStartHour}
                            onChange={(e) => setPreferredStartHour(e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`, background: cardBg, color: text }}
                          />
                        </div>
                        <div>
                          <Txt size={11} color={textMuted} style={{ display: "block", marginBottom: 4 }}>End Time</Txt>
                          <input
                            type="time"
                            value={preferredEndHour}
                            onChange={(e) => setPreferredEndHour(e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`, background: cardBg, color: text }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {step === 4 && (
          <Card style={{ textAlign: "center", padding: "28px 20px", background: cardBg, borderColor: border, color: text, maxWidth: 560, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 52,
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid " + borderCol
                }}
              >
                <KobeAvatar size={64} character={companion} ageGroup={ageGroup} expression="excited" />
              </div>
            </div>
            <Heading size={22} color={text}>{name} is ready to explore!</Heading>
            <Txt size={13} color={textMuted} style={{ display: "block", marginTop: 4 }}>
              Assigned Stage: <strong>{activeSegment.label}</strong> (Ages {activeSegment.rangeLabel} · {childAge} yrs old)
            </Txt>
            <Txt size={12.5} color={borderCol} weight={800} style={{ display: "block", marginTop: 4 }}>
              Learning Companion: {companion === "chibi" ? "Chibi ✨" : "Kobe 🚀"}
            </Txt>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
              <Chip color={borderCol}>
                {monitoringEnabled && limitMins > 0 ? `${limitMins}m Daily Limit` : "Flexible Time"}
              </Chip>
              {monitoringEnabled && sessionLimitMins > 0 && (
                <Chip color={borderCol}>{sessionLimitMins}m Session Cap</Chip>
              )}
              {monitoringEnabled && breakRemindersEnabled && (
                <Chip color="#10b981">Break Every {breakIntervalMins}m</Chip>
              )}
              {interests.map((int) => (
                <Chip key={int} color={isDark ? "#FFFFFF" : "#1E293B"} bg={innerBg}>
                  {int}
                </Chip>
              ))}
            </div>

            <div
              style={{
                marginTop: 22,
                padding: "16px 18px",
                background: innerBg,
                borderRadius: 12,
                border: "1.5px solid " + borderCol,
                textAlign: "left"
              }}
            >
              <Txt size={11} color={textMuted} style={{ display: "block", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, marginBottom: 10 }}>
                🔑 Login Details for {name}
              </Txt>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Txt size={12} color={textMuted}>Username</Txt>
                  <Txt size={15} color={text} style={{ fontFamily: F.mono, fontWeight: 800, letterSpacing: "0.03em" }}>{username.trim().toLowerCase().replace(/\s+/g, '_')}</Txt>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Txt size={12} color={textMuted}>PIN</Txt>
                  <Txt size={15} color={text} style={{ fontFamily: F.mono, fontWeight: 800, letterSpacing: "0.2em" }}>{pin}</Txt>
                </div>
              </div>
              <Txt size={11} color={textMuted} style={{ display: "block", marginTop: 12, lineHeight: 1.6, fontStyle: "italic" }}>
                Give {name} both of these to sign in from the main login screen -- the username alone or PIN alone will not work. You can look this up again anytime from this profile card on your dashboard.
              </Txt>
            </div>
          </Card>
        )}

        {err && (
          <div style={{ marginTop: 12, color: C.red, fontWeight: 600, fontSize: 12 }}>{err}</div>
        )}
      </div>

      <div
        style={{
          padding: "14px 18px 24px",
          background: isDark ? "rgba(15,23,42,0.95)" : "rgba(248,250,252,0.95)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid " + border,
          zIndex: 50,
          flexShrink: 0
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", gap: 10 }}>
          {step === 0 && onBack && (
            <Btn variant="ghost" onClick={onBack} style={{ color: text, background: innerBg, borderColor: border }}>
              Cancel
            </Btn>
          )}
          {step > 0 && (
            <Btn
              variant="ghost"
              onClick={() => {
                // If a pending child was already written to the local cache (a prior
                // "Complete Enrollment" attempt that failed to sync), drop it -- the
                // parent is about to edit details, so the next attempt should create
                // a fresh entry rather than leaving this stale one behind too.
                if (pendingChildRef.current) {
                  try {
                    const safeEmail = (parentEmail || "").toLowerCase().trim();
                    const parents = S.getParents();
                    if (safeEmail && parents[safeEmail]?.children) {
                      parents[safeEmail].children = parents[safeEmail].children.filter(
                        (c: any) => c.id !== pendingChildRef.current.id
                      );
                      S.setParents(parents);
                    }
                  } catch (e) {}
                  pendingChildRef.current = null;
                }
                setStep((s) => s - 1);
                setErr("");
              }}
              style={{ color: text, background: innerBg, borderColor: border }}
            >
              Back
            </Btn>
          )}
          <Btn full variant="yellow" size="lg" onClick={handleNext} disabled={saving}>
            {saving ? "Saving to cloud..." : step === 3 ? "Next steps" : step === 4 ? "Complete Enrollment" : "Continue"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// MAIN PARENT SETTINGS SCREEN MODULE
// ----------------------------------------------------
export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  parent,
  onBack,
  lang,
  onParentRefresh,
  theme,
  onLanguageChange,
  onTriggerParentTour,
  onTriggerChildTour,
  onToggleTheme
}) => {
  const settingsKey = parent.email;
  const savedAll = S.getSettings();
  const saved = savedAll[settingsKey] || {
    limitsEnabled: false,
    slots: { morning: 1200, afternoon: 1200, evening: 1200 }
  };

  const children = parent.children || [];
  const [selectedChildId, setSelectedChildId] = useState<string>(() => children[0]?.id || "");
  const activeChild = children.find((c) => c.id === selectedChildId) || children[0] || null;
  const activeChildMonitoring = React.useMemo(
    () => (activeChild ? resolveEffectiveScreenMonitoring(activeChild, parent.email) : DEFAULT_SCREEN_MONITORING),
    [activeChild, parent.email]
  );

  const [limitsOn, setLimitsOn] = useState<boolean>(() =>
    activeChild ? activeChildMonitoring.enabled : Boolean(saved.limitsEnabled)
  );
  const [dailyLimitMins, setDailyLimitMins] = useState<number>(() =>
    activeChild ? activeChildMonitoring.dailyLimitMins : 30
  );
  const [sessionLimitMins, setSessionLimitMins] = useState<number>(() =>
    activeChild ? activeChildMonitoring.sessionLimitMins : 20
  );
  const [breakRemindersOn, setBreakRemindersOn] = useState<boolean>(() =>
    activeChild ? activeChildMonitoring.breakRemindersEnabled : true
  );
  const [breakIntervalMins, setBreakIntervalMins] = useState<number>(() =>
    activeChild ? activeChildMonitoring.breakIntervalMins : 15
  );
  const [preferredHoursOn, setPreferredHoursOn] = useState<boolean>(() =>
    activeChild ? activeChildMonitoring.preferredHoursEnabled : false
  );
  const [preferredStart, setPreferredStart] = useState<string>(() =>
    activeChild ? activeChildMonitoring.preferredStartHour : "07:00"
  );
  const [preferredEnd, setPreferredEnd] = useState<string>(() =>
    activeChild ? activeChildMonitoring.preferredEndHour : "20:00"
  );
  const [slots, setSlots] = useState({
    morning: Math.floor(((activeChildMonitoring?.slots?.morning ?? saved.slots?.morning) || 1200) / 60),
    afternoon: Math.floor(((activeChildMonitoring?.slots?.afternoon ?? saved.slots?.afternoon) || 1200) / 60),
    evening: Math.floor(((activeChildMonitoring?.slots?.evening ?? saved.slots?.evening) || 1200) / 60)
  });
  const [savedOk, setSavedOk] = useState(false);
  const [appLang, setAppLang] = useState<Language>(() => S.getLang() as Language || lang);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccessString, setEnrollSuccessString] = useState<string | null>(null);

  // Sync form state when switching selected child
  React.useEffect(() => {
    if (!activeChild) return;
    const mon = resolveEffectiveScreenMonitoring(activeChild, parent.email);
    setLimitsOn(mon.enabled);
    setDailyLimitMins(mon.dailyLimitMins);
    setSessionLimitMins(mon.sessionLimitMins);
    setBreakRemindersOn(mon.breakRemindersEnabled);
    setBreakIntervalMins(mon.breakIntervalMins);
    setPreferredHoursOn(mon.preferredHoursEnabled);
    setPreferredStart(mon.preferredStartHour || "07:00");
    setPreferredEnd(mon.preferredEndHour || "20:00");
    setSlots({
      morning: Math.floor((mon.slots?.morning || 1200) / 60),
      afternoon: Math.floor((mon.slots?.afternoon || 1200) / 60),
      evening: Math.floor((mon.slots?.evening || 1200) / 60)
    });
  }, [activeChild?.id]);

  const isDark = theme === "dark";
  const bg = isDark ? "#0F172A" : "#F8FAFC";
  const text = isDark ? "#F8FAFC" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#475569";
  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const border = isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0";
  const innerBg = isDark ? "rgba(255, 255, 255, 0.03)" : "#F1F5F9";

  const handleSwitchChildCompanion = async (childId: string, nextCompanion: "kobe" | "chibi") => {
    sfx.playTap();
    const safeEmail = (parent.email || "").toLowerCase().trim();
    const updatedChildren = (parent.children || []).map((c) => {
      if (c.id !== childId) return c;
      const existingMeta = extractChildMeta(c);
      const nextBadges = mergeChildMetaOntoBadges(c.badges, {
        enrolment: {
          ...(existingMeta.enrolment || {}),
          companionSelectedAt: new Date().toISOString()
        }
      });
      return { ...c, companion: nextCompanion, badges: nextBadges };
    });
    const updatedParent = { ...parent, children: updatedChildren };
    try {
      const parents = S.getParents();
      if (safeEmail && parents[safeEmail]) {
        parents[safeEmail].children = updatedChildren;
        S.setParents(parents);
      }
    } catch {}
    onParentRefresh(updatedParent);

    const targetChild = updatedChildren.find((c) => c.id === childId);
    if (safeEmail && targetChild) {
      fetch("/api/supabase/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentEmail: safeEmail, children: [targetChild] })
      }).catch(() => {});
    }
  };

  const save = async () => {
    const slotsSecs = {
      morning: slots.morning * 60,
      afternoon: slots.afternoon * 60,
      evening: slots.evening * 60
    };
    const all = S.getSettings();
    all[settingsKey] = {
      limitsEnabled: limitsOn,
      slots: slotsSecs
    };
    S.setSettings(all);
    S.setLang(appLang);
    onLanguageChange(appLang);

    // Also persist screen monitoring policy into child metadata & sync to Supabase
    const safeEmail = (parent.email || "").toLowerCase().trim();
    const updatedChildren = (parent.children || []).map((c) => {
      if (activeChild && c.id !== activeChild.id && children.length > 1) return c;
      const existingMeta = extractChildMeta(c);
      const prevMon = existingMeta.screenMonitoring || DEFAULT_SCREEN_MONITORING;
      const parentPolicy = {
        enabled: limitsOn,
        dailyLimitMins,
        sessionLimitMins,
        breakRemindersEnabled: breakRemindersOn,
        breakIntervalMins,
        breakDurationMins: 2,
        preferredHoursEnabled: preferredHoursOn,
        preferredStartHour: preferredStart,
        preferredEndHour: preferredEnd,
        slots: slotsSecs,
        updatedBy: "parent" as const,
        updatedAt: new Date().toISOString()
      };
      const nextScreenMonitoring: ScreenMonitoringSettings = {
        ...prevMon,
        ...parentPolicy,
        parentPolicy,
        schoolPolicy: (prevMon as any).schoolPolicy
      };
      const nextBadges = mergeChildMetaOntoBadges(c.badges, {
        screenMonitoring: nextScreenMonitoring
      });
      return { ...c, badges: nextBadges };
    });

    const updatedParent = { ...parent, children: updatedChildren };
    try {
      const parents = S.getParents();
      if (safeEmail && parents[safeEmail]) {
        parents[safeEmail].children = updatedChildren;
        S.setParents(parents);
      }
    } catch {}
    onParentRefresh(updatedParent);

    if (safeEmail && updatedChildren.length > 0) {
      try {
        await fetch("/api/supabase/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentEmail: safeEmail, children: updatedChildren })
        });
      } catch (e) {
        console.warn("Could not sync screen monitoring settings to cloud:", e);
      }
    }

    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
  };

  const handleEnrollDone = (newChildName?: string, newChildObj?: any) => {
    if (newChildName) {
      setEnrollSuccessString(newChildName);
    } else {
      setEnrollSuccessString("your child");
    }
    
    // Refresh the parent global state so the dashboard updates instantly
    try {
      const safeEmail = (parent.email || "").toLowerCase().trim();
      const freshParents = S.getParents();
      
      let updatedParent = parent;
      if (freshParents[safeEmail]) {
        updatedParent = {
          ...parent,
          children: freshParents[safeEmail].children || []
        };
      } else if (newChildObj) {
        updatedParent = {
          ...parent,
          children: [...(parent.children || []), newChildObj]
        };
      }
      onParentRefresh(updatedParent);
    } catch (e) {
      console.error("Failed to refresh parent state after enrollment", e);
    }

    setEnrolling(false);
    setTimeout(() => setEnrollSuccessString(null), 3500);
  };

  if (enrolling) {
    return (
      <ChildSetupScreen
        parentEmail={parent.email}
        onDone={handleEnrollDone}
        lang={lang}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onBack={() => setEnrolling(false)}
      />
    );
  }

  return (
    <FontOffsetContext.Provider value={3}>
      <div style={{ minHeight: "100vh", background: bg, color: text, paddingBottom: 88, transition: "background 0.3s, color 0.3s" }}>
        <div
          style={{
            background: isDark ? "linear-gradient(135deg, #1E293B, #0F172A)" : `linear-gradient(135deg, ${C.yellow}, #FCD34D)`,
            padding: "38px 20px 48px",
            borderRadius: "0 0 22px 22px",
            borderBottom: "1.5px solid " + (isDark ? "rgba(250,204,21,0.2)" : "transparent"),
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.15)" : "0 4px 12px rgba(15,23,42,0.03)"
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(28,43,43,0.12)",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              color: isDark ? "#FFFFFF" : C.charcoal,
              fontFamily: F.body,
              fontSize: 13,
              fontWeight: 650,
              cursor: "pointer",
              marginBottom: 14,
              transition: "background 0.2s"
            }}
          >
          ← {T[lang].back}
        </button>
        <Heading size={24} color={isDark ? "#FFFFFF" : C.charcoal} style={{ marginBottom: 4 }}>
          {T[lang].settings}
        </Heading>
        <Txt size={13} color={isDark ? "#94A3B8" : C.charcoal} style={{ opacity: 0.8 }}>
          Parent Dashboard schedules, session limits and custom profiles
        </Txt>
      </div>

      <div style={{ padding: "0 18px", marginTop: -18, maxWidth: 640, margin: "-18px auto 0" }}>
        {enrollSuccessString && (
          <div
            style={{
              background: C.green,
              borderRadius: 12,
              padding: "12.5px 16px",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 3px 12px rgba(46,189,126,0.18)"
            }}
          >
            <span style={{ fontSize: 18, color: C.white }}>✓</span>
            <Txt size={13} weight={700} color={C.white}>
              {enrollSuccessString} has been enrolled successfully! Give them their PIN code to start.
            </Txt>
          </div>
        )}

        {/* Profiles List */}
        <Card style={{ marginBottom: 14, background: cardBg, borderColor: border, color: text }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14
            }}
          >
            <div>
              <Txt size={15} weight={700} color={text} style={{ display: "block" }}>
                Enrolled Children
              </Txt>
              <Txt size={12} color={textMuted}>
                {children.length} active profile{children.length !== 1 ? "s" : ""}
              </Txt>
            </div>
            <Btn variant="yellow" size="sm" onClick={() => setEnrolling(true)}>
              + Enroll child
            </Btn>
          </div>

          {children.length === 0 && (
            <div style={{ textAlign: "center", padding: "18px 0" }}>
              <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>👶</span>
              <Txt size={12} color={textMuted}>
                No kids profiles added yet. Set one up to start!
              </Txt>
            </div>
          )}

          {children.map((c, i) => {
            const course = CURRICULUM[c.ageGroup] || CURRICULUM["early explorers"];
            const courseLessonsCount = course ? course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) : 30;
            const completedCount = Object.keys(c.completed || {}).filter((k) => c.completed?.[k]).length;
            const pct = Math.min(100, Math.round((completedCount / Math.max(1, courseLessonsCount)) * 100));
            const m = AGE_META[c.ageGroup] || { color: C.teal };
            const seg = getApprovedSegmentByIdOrGroup(c.ageGroup, c.age);
            const { streak, bestStreak } = computeEffectiveStreak(c);
            const childMon = resolveEffectiveScreenMonitoring(c, parent.email);
            const activeComp = c.companion === "chibi" ? "chibi" : "kobe";

            return (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: "14px 0",
                  borderTop: i === 0 ? "none" : "1px solid " + border
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      fontSize: 28,
                      width: 48,
                      height: 48,
                      background: innerBg,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1.5px solid " + m.color
                    }}
                  >
                    <KobeAvatar size={38} character={activeComp} ageGroup={c.ageGroup} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <Txt size={14.5} weight={800} color={text}>
                        {c.name}
                      </Txt>
                      <Chip color={m.color}>
                        {seg.emoji} {seg.label} ({seg.rangeLabel})
                      </Chip>
                      <Chip color="#f59e0b" bg="rgba(245,158,11,0.12)">
                        🔥 {streak}d Streak (Best {bestStreak}d)
                      </Chip>
                    </div>
                    <Txt size={11} color={textMuted}>
                      @{c.username || c.name.toLowerCase()} · PIN: <strong>{c.pin}</strong> · {c.xp || 0} XP ·{" "}
                      {childMon.enabled ? `${childMon.dailyLimitMins}m/day limit` : "No daily limit"}
                    </Txt>
                  </div>
                  <Txt size={13} weight={800} color={m.color}>
                    {pct}% Done
                  </Txt>
                </div>

                {/* Companion Switcher & Quick Screen Policy Select */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, paddingLeft: 60 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Txt size={11} weight={700} color={textMuted}>
                      Companion:
                    </Txt>
                    {(["kobe", "chibi"] as const).map((compKey) => {
                      const isSel = activeComp === compKey;
                      return (
                        <button
                          key={compKey}
                          type="button"
                          onClick={() => handleSwitchChildCompanion(c.id, compKey)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: `1.5px solid ${isSel ? "#2EC4B6" : border}`,
                            background: isSel ? "rgba(46,196,182,0.15)" : innerBg,
                            color: isSel ? "#2EC4B6" : textMuted,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer"
                          }}
                        >
                          {compKey === "kobe" ? "🤖 Kobe" : "✨ Chibi"} {isSel ? "✓" : ""}
                        </button>
                      );
                    })}
                  </div>
                  {children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSelectedChildId(c.id)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 8,
                        border: `1px solid ${selectedChildId === c.id ? "#2EC4B6" : border}`,
                        background: selectedChildId === c.id ? "rgba(46,196,182,0.12)" : "transparent",
                        color: selectedChildId === c.id ? "#2EC4B6" : textMuted,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {selectedChildId === c.id ? "⚙️ Editing Screen Limits" : "Configure Limits"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>

        {/* Screen Monitoring & Healthy Digital Habits */}
        <Card style={{ marginBottom: 14, background: cardBg, borderColor: border, color: text }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8
            }}
          >
            <div>
              <Txt size={15} weight={800} color={text} style={{ display: "block" }}>
                Screen Monitoring & Healthy Digital Habits {activeChild ? `(${activeChild.name})` : ""}
              </Txt>
              <Txt size={12} color={textMuted}>
                Configure daily limits, session caps, break reminders, and permitted learning hours (synced across devices)
              </Txt>
            </div>
            <Toggle on={limitsOn} onToggle={() => setLimitsOn((l) => !l)} />
          </div>

          {(activeChildMonitoring as any)?.schoolPolicy && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                marginBottom: 12
              }}
            >
              <Txt size={11.5} weight={800} color="#0284c7" style={{ display: "block" }}>
                🏫 School Policy Coordination Active
              </Txt>
              <Txt size={11} color={textMuted}>
                Your child&apos;s school has also configured classroom monitoring ({(activeChildMonitoring as any).schoolPolicy.dailyLimitMins || (activeChildMonitoring as any).schoolPolicy.dailyLimitMinutes}m/day). CLATS preserves both policies and applies the more protective limit during active hours without overwriting your parent settings.
              </Txt>
            </div>
          )}

          {limitsOn && (
            <>
              <div style={{ height: 1, background: border, margin: "14px 0" }} />

              {/* Daily Limit & Session Limit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ padding: 12, borderRadius: 12, background: innerBg, border: `1px solid ${border}` }}>
                  <Txt size={11.5} weight={800} color={textMuted} style={{ display: "block", marginBottom: 6 }}>
                    Daily Screen-Time Limit
                  </Txt>
                  <select
                    value={dailyLimitMins}
                    onChange={(e) => setDailyLimitMins(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: `1px solid ${border}`,
                      background: cardBg,
                      color: text,
                      fontSize: 13,
                      fontWeight: 700
                    }}
                  >
                    <option value={15}>15 mins / day</option>
                    <option value={20}>20 mins / day (Ages 2–5)</option>
                    <option value={30}>30 mins / day (Ages 6–10)</option>
                    <option value={45}>45 mins / day (Ages 11–13)</option>
                    <option value={60}>60 mins / day (Ages 14–18)</option>
                    <option value={90}>90 mins / day</option>
                    <option value={120}>120 mins / day</option>
                    <option value={0}>No Daily Cap</option>
                  </select>
                </div>

                <div style={{ padding: 12, borderRadius: 12, background: innerBg, border: `1px solid ${border}` }}>
                  <Txt size={11.5} weight={800} color={textMuted} style={{ display: "block", marginBottom: 6 }}>
                    Session-Duration Limit
                  </Txt>
                  <select
                    value={sessionLimitMins}
                    onChange={(e) => setSessionLimitMins(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: `1px solid ${border}`,
                      background: cardBg,
                      color: text,
                      fontSize: 13,
                      fontWeight: 700
                    }}
                  >
                    <option value={10}>10 mins / session</option>
                    <option value={15}>15 mins / session</option>
                    <option value={20}>20 mins / session</option>
                    <option value={30}>30 mins / session</option>
                    <option value={45}>45 mins / session</option>
                    <option value={60}>60 mins / session</option>
                    <option value={0}>No Session Cap</option>
                  </select>
                </div>
              </div>

              {/* Break Reminders & Preferred Learning Hours */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 12, borderRadius: 12, background: innerBg, border: `1px solid ${border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Txt size={11.5} weight={800} color={text}>
                      🌿 Break Reminders
                    </Txt>
                    <input
                      type="checkbox"
                      checked={breakRemindersOn}
                      onChange={(e) => setBreakRemindersOn(e.target.checked)}
                      style={{ accentColor: "#2EC4B6" }}
                    />
                  </div>
                  <select
                    value={breakIntervalMins}
                    disabled={!breakRemindersOn}
                    onChange={(e) => setBreakIntervalMins(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: `1px solid ${border}`,
                      background: cardBg,
                      color: text,
                      fontSize: 12.5,
                      fontWeight: 700
                    }}
                  >
                    <option value={10}>Prompt every 10 mins</option>
                    <option value={15}>Prompt every 15 mins</option>
                    <option value={20}>Prompt every 20 mins</option>
                    <option value={30}>Prompt every 30 mins</option>
                  </select>
                </div>

                <div style={{ padding: 12, borderRadius: 12, background: innerBg, border: `1px solid ${border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Txt size={11.5} weight={800} color={text}>
                      🕒 Permitted Hours Window
                    </Txt>
                    <input
                      type="checkbox"
                      checked={preferredHoursOn}
                      onChange={(e) => setPreferredHoursOn(e.target.checked)}
                      style={{ accentColor: "#2EC4B6" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="time"
                      disabled={!preferredHoursOn}
                      value={preferredStart}
                      onChange={(e) => setPreferredStart(e.target.value)}
                      style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${border}`, background: cardBg, color: text, fontSize: 12 }}
                    />
                    <Txt size={11} color={textMuted}>to</Txt>
                    <input
                      type="time"
                      disabled={!preferredHoursOn}
                      value={preferredEnd}
                      onChange={(e) => setPreferredEnd(e.target.value)}
                      style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${border}`, background: cardBg, color: text, fontSize: 12 }}
                    />
                  </div>
                </div>
              </div>

              <Txt size={12} color={textMuted} style={{ display: "block", marginBottom: 12 }}>
                Time-of-day slot allowances (Morning, Afternoon, Evening):
              </Txt>
              {[
                { key: "morning" as const, label: "Morning (5am – 12pm)" },
                { key: "afternoon" as const, label: "Afternoon (12pm – 6pm)" },
                { key: "evening" as const, label: "Evening (6pm – Midnight)" }
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifySelf: "stretch", justifyContent: "space-between", marginBottom: 6 }}>
                    <Txt size={13} weight={650} color={text}>
                      {label}
                    </Txt>
                    <Txt size={12} color={textMuted} weight={650}>
                      {slots[key]} Mins
                    </Txt>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={5}
                    value={slots[key]}
                    onChange={(e) =>
                      setSlots((s) => ({ ...s, [key]: Number(e.target.value) }))
                    }
                    style={{ width: "100%", accentColor: "#2EC4B6" }}
                  />
                </div>
              ))}
            </>
          )}

          <div style={{ marginTop: 12 }}>
            <Btn variant="yellow" size="sm" onClick={save}>
              {savedOk ? "Saved & Synced to Cloud ✓" : "Save Screen Monitoring Settings"}
            </Btn>
          </div>
        </Card>

        {/* Global language option */}
        <Card style={{ marginBottom: 14, background: cardBg, borderColor: border, color: text }}>
          <Txt size={15} weight={700} color={text} style={{ display: "block", marginBottom: 10 }}>
            Preferred Language
          </Txt>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { code: "en", label: "English (EN)" }
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => setAppLang(l.code as Language)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: "1.5px solid " + (appLang === l.code ? "#2EC4B6" : border),
                  background: appLang === l.code ? (isDark ? "rgba(46,196,182,0.15)" : "rgba(46,196,182,0.06)") : innerBg,
                  fontFamily: F.body,
                  fontSize: 13,
                  fontWeight: 700,
                  color: appLang === l.code ? "#2EC4B6" : textMuted,
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Help & Tutorials Section */}
        <FAQAndTutorialsCard
          isDark={isDark}
          cardBg={cardBg}
          border={border}
          text={text}
          textMuted={textMuted}
          onTriggerParentTour={onTriggerParentTour}
          onTriggerChildTour={onTriggerChildTour}
        />

        {/* Account Info */}
        <Card style={{ background: cardBg, borderColor: border, color: text }}>
          <Txt size={15} weight={700} color={text} style={{ display: "block", marginBottom: 4 }}>
            Parent Account Credentials
          </Txt>
          <Txt size={13} color={textMuted} style={{ display: "block" }}>
            E-mail: {parent.email}
          </Txt>
          <Txt size={13} color={textMuted} style={{ display: "block", marginTop: 2 }}>
            Enrolled Profiles: {children.length}
          </Txt>
        </Card>
      </div>
    </div>
    </FontOffsetContext.Provider>
  );
};

// ----------------------------------------------------
// SUPPORTING FAQ AND INTERACTIVE TUTORIALS REPLAY COMPONENT
// ----------------------------------------------------
interface FAQAndTutorialsCardProps {
  isDark: boolean;
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
  onTriggerParentTour?: () => void;
  onTriggerChildTour?: () => void;
}

export const FAQAndTutorialsCard: React.FC<FAQAndTutorialsCardProps> = ({
  isDark,
  cardBg,
  border,
  text,
  textMuted,
  onTriggerParentTour,
  onTriggerChildTour
}) => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showOverviewVideo, setShowOverviewVideo] = useState(false);

  const faqs = [
    {
      q: "How do I secure my child's login PIN?",
      a: "Each child profile gets a unique 4-digit PIN under child setup, which you can check here. Children use this PIN to protect their learning scores and profiles."
    },
    {
      q: "Can I manage time slots differently on weekends?",
      a: "Yes! Scroll up to the Session Controls card to toggle active hours or disable limits."
    },
    {
      q: "How can I request custom syllabi?",
      a: "Use the Share Feedback button in the header banner or join the Parents Community page to connect directly with the CLATS curriculum design team."
    }
  ];

  return (
    <Card style={{ marginBottom: 14, background: cardBg, borderColor: border, color: text }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>📚</span>
        <div>
          <Txt size={15} weight={700} color={text} style={{ display: "block" }}>
            Help & Tutorials
          </Txt>
          <Txt size={12} color={textMuted}>
            Replay tours, watch overview or explore FAQs
          </Txt>
        </div>
      </div>

      {/* Tour Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Txt size={12} weight={800} color={text} style={{ opacity: 0.8 }}>
              Replay Parent Dashboard Tutorial
            </Txt>
            <button
              onClick={onTriggerParentTour}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "#2EC4B6",
                color: "#FFFFFF",
                border: "none",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
                transition: "opacity 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Start Tutorial 🚀
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Txt size={12} weight={800} color={text} style={{ opacity: 0.8 }}>
              Replay Child Portal Tutorial
            </Txt>
            <button
              onClick={onTriggerChildTour}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "#B8A0FF",
                color: "#0F172A",
                border: "none",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
                transition: "opacity 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Start Tutorial 🚀
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowOverviewVideo(true)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)",
            color: text,
            border: "1px solid " + border,
            fontSize: 12.5,
            fontWeight: 800,
            cursor: "pointer",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}
        >
          📺 Watch Platform Overview Video
        </button>
      </div>

      {/* Exp FAQ area */}
      <Label style={{ letterSpacing: 1.2, marginBottom: 10, color: textMuted }}>FREQUENTLY ASKED QUESTIONS</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {faqs.map((faq, i) => {
          const isExp = expandedFAQ === i;
          return (
            <div
              key={i}
              style={{
                border: "1px solid " + border,
                borderRadius: 12,
                overflow: "hidden",
                background: isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.01)"
              }}
            >
              <button
                onClick={() => setExpandedFAQ(isExp ? null : i)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  color: text
                }}
              >
                <Txt size={12.5} weight={700} color={text}>
                  {faq.q}
                </Txt>
                <span style={{ fontSize: 14 }}>{isExp ? "▲" : "▼"}</span>
              </button>
              {isExp && (
                <div style={{ padding: "0 14px 12px", borderTop: "1px solid " + border }}>
                  <Txt size={12} color={textMuted} style={{ lineHeight: 1.5, display: "block", marginTop: 8 }}>
                    {faq.a}
                  </Txt>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Video Mock Trailer Dialogue */}
      {showOverviewVideo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            background: "rgba(15,23,42,0.65)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: cardBg,
              border: "3px solid " + border,
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 20px 48px rgba(0,0,0,0.3)",
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>🎬</div>
            <Heading size={18} color={text} style={{ marginBottom: 8 }}>
              Kobe & Chibi's Training Overview
            </Heading>
            <Txt size={13} color={textMuted} style={{ display: "block", marginBottom: 20, lineHeight: 1.5 }}>
              "Ahoy! Welcome to the CLATS platform training program. Under this portal, parents configure safe profiles and track children's progress, while children master AI, block programming and coding loops alongside custom companion mascot guides. Happy learning!"
            </Txt>
            <button
              onClick={() => setShowOverviewVideo(false)}
              style={{
                padding: "8px 24px",
                borderRadius: 12,
                background: "#2EC4B6",
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Close Presentation
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
