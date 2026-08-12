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
  AVATARS,
  INTERESTS
} from "../utils/config";
import { CURRICULUM } from "../data/curriculum";
import { Card, Txt, Heading, Label, Chip, Btn, Toggle, FieldInput, FontOffsetContext } from "./Primitives";
import { KobeAvatar } from "./KobeAvatar";

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
  onDone: (childName?: string) => void;
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
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("young innovators");
  const [avatar, setAvatar] = useState("👦🏾");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [companion, setCompanion] = useState<"kobe" | "chibi">("kobe");
  const [limitMins, setLimitMins] = useState(30);
  const [err, setErr] = useState("");

  const ageGroups = [
    { key: "early explorers" as const, label: "Early Explorers", sub: "Stage 1", color: C.amber, icon: "🌱" },
    { key: "young innovators" as const, label: "Young Innovators", sub: "Stage 2", color: C.teal, icon: "⚡" },
    { key: "future builders" as const, label: "Future Builders", sub: "Stage 3", color: C.lavender, icon: "🚀" }
  ];

  // Tailor interests based on the selected AgeGroup!
  const getInterestOptions = (ag: AgeGroup) => {
    if (ag === "early explorers") {
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
    { val: 0, label: "No Limit", sub: "Unlimited learning time" },
    { val: 20, label: "20 min", sub: "Ideal for 2–5 year olds" },
    { val: 40, label: "40 min", sub: "Ideal for 6–12 year olds" },
    { val: 60, label: "60 min", sub: "Ideal for 13–18 year olds" }
  ];

  const stepTitles = ["Child Details", "Personalise path", "Login PIN", "Time control", "Ready?"];
  const meta = AGE_META[ageGroup] || { color: C.teal, soft: C.tealGhost };
  const borderCol = meta.color;

  const toggleInterest = (k: string) => {
    setInterests((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const handleNext = async () => {
    setErr("");
    if (step === 0) {
      if (!name.trim()) {
        setErr("Please enter the child's name.");
        return;
      }
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) {
        setErr("Please enter a username.");
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
      // Populate custom default avatar depending on ageGroup choice
      setAvatar(ageGroup === "early explorers" ? "🧸" : ageGroup === "young innovators" ? "👦🏾" : "💻");
      setInterests([]);
      setStep(1);
    } else if (step === 1) {
      if (!avatar) {
        setErr("Please select an avatar.");
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
      // Save constraints locally
      const allSettings = S.getSettings();
      const secs = limitMins * 60;
      const thirds = Math.floor(secs / 3);

      const safeEmail = (parentEmail || "").toLowerCase().trim();

      if (safeEmail) {
        allSettings[safeEmail] = {
          limitsEnabled: limitMins > 0,
          slots: {
            morning: ageGroup === "future builders" ? Math.floor(secs * 0.5) : thirds,
            afternoon: ageGroup === "future builders" ? 0 : thirds,
            evening: ageGroup === "future builders" ? Math.ceil(secs * 0.5) : thirds
          }
        };
        S.setSettings(allSettings);
      }

      const newChild: any = {
        id: Date.now().toString(),
        name: name.trim(),
        username: username.trim().toLowerCase(),
        ageGroup,
        avatar,
        pin,
        interests,
        completed: {},
        xp: 0,
        stars: {},
        createdAt: Date.now(),
        companion: companion || "kobe"
      };

      // Sync child directly to Supabase
      if (safeEmail) {
        // 1. Update local storage parent data first to ensure instant UI response
        try {
          const parents = S.getParents();
          if (parents[safeEmail]) {
            if (!parents[safeEmail].children) parents[safeEmail].children = [];
            parents[safeEmail].children.push(newChild);
            S.setParents(parents);
          }
        } catch (e) {
          console.error("Failed to update local parents cache:", e);
        }

        // 2. Sync to backend database
        try {
          await fetch("/api/supabase/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              parentEmail: safeEmail,
              children: [newChild]
            })
          });
        } catch (e) {
          console.error("Failed to sync new child to Supabase:", e);
        }
      }

      onDone(name.trim());
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
          <Card style={{ background: cardBg, borderColor: border, color: text }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <FieldInput
                label="Child's Name"
                value={name}
                onChange={setName}
                theme={theme}
                placeholder="What should Kobe call them?"
              />
              <FieldInput
                label="Unique Username"
                value={username}
                onChange={(v) => setUsername(v.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""))}
                theme={theme}
                placeholder="e.g. codestar_aisha"
              />
              <div>
                <Label style={{ marginBottom: 8, color: textMuted }}>Select Learning Track</Label>
                {ageGroups.map((g) => (
                  <div
                    key={g.key}
                    onClick={() => setAgeGroup(g.key)}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 14,
                      border: "1.5px solid " + (ageGroup === g.key ? g.color : border),
                      background: ageGroup === g.key ? g.color + "0C" : innerBg,
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 10
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: g.color + "18",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20
                      }}
                    >
                      {g.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Txt
                        size={14}
                        weight={g.key === ageGroup ? 700 : 500}
                        color={g.key === ageGroup ? g.color : text}
                      >
                        {g.label}
                      </Txt>
                      <br />
                      <Txt size={11} color={textMuted}>
                        {g.sub}
                      </Txt>
                    </div>
                    {ageGroup === g.key && (
                      <span style={{ fontSize: 16, fontWeight: "bold", color: g.color }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Unique Adaptive assistant welcome panel! */}
            <Card
              style={{
                background: `linear-gradient(135deg, ${meta.soft}, ${cardBg})`,
                borderColor: border,
                color: text
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <KobeAvatar size={56} ageGroup={ageGroup} pulse expression="happy" character={companion} />
                <div style={{ flex: 1 }}>
                  <Label color={borderCol}>{companion === "chibi" ? "Chibi" : "Kobe"} Assistant Mode</Label>
                  <Txt size={13} weight={600} style={{ display: "block", color: text }}>
                    {ageGroup === "early explorers" && "Sensory Tot Helper Active"}
                    {ageGroup === "young innovators" && "Adventure Quest Guide Active"}
                    {ageGroup === "future builders" && "Enterprise Tech Mentor Active"}
                  </Txt>
                  <Txt size={12} color={textMuted}>
                    {ageGroup === "early explorers" &&
                      "I speak in tiny gentle blocks, show cartoons, and play sounds!"}
                    {ageGroup === "young innovators" &&
                      "I teach machine learning, internet navigation, and quiz badges!"}
                    {ageGroup === "future builders" &&
                      "I cover advanced neural nets, coding algorithms, prompting, and Web3!"}
                  </Txt>
                </div>
              </div>
            </Card>

            <Card style={{ background: cardBg, borderColor: border, color: text }}>
              <Label style={{ marginBottom: 10, color: textMuted }}>Choose AI Learning Companion</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div
                  onClick={() => setCompanion("kobe")}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "2px solid " + (companion === "kobe" ? borderCol : border),
                    background: companion === "kobe" ? borderCol + "12" : innerBg,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    transition: "all 0.15s"
                  }}
                >
                  <KobeAvatar size={38} ageGroup={ageGroup} character="kobe" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Txt size={12.5} weight={700} color={companion === "kobe" ? borderCol : text}>Kobe (Boy)</Txt>
                    <Txt size={10} color={textMuted}>Tech Mentor 🚀</Txt>
                  </div>
                </div>

                <div
                  onClick={() => setCompanion("chibi")}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "2px solid " + (companion === "chibi" ? borderCol : border),
                    background: companion === "chibi" ? borderCol + "12" : innerBg,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    transition: "all 0.15s"
                  }}
                >
                  <KobeAvatar size={38} ageGroup={ageGroup} character="chibi" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Txt size={12.5} weight={700} color={companion === "chibi" ? borderCol : text}>Chibi (Girl)</Txt>
                    <Txt size={10} color={textMuted}>Companion ⚡</Txt>
                  </div>
                </div>
              </div>

              <Label style={{ marginBottom: 10, color: textMuted }}>Select Avatar</Label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 10,
                  marginBottom: 16
                }}
              >
                {(ageGroup === "early explorers" ? ["🧸", "🐱", "🐶", "👾"] : AVATARS.slice(0, 8)).map((av) => (
                  <div
                    key={av}
                    onClick={() => setAvatar(av)}
                    style={{
                      height: 52,
                      borderRadius: 12,
                      border: "2px solid " + (avatar === av ? borderCol : border),
                      background: avatar === av ? borderCol + "12" : innerBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      transform: avatar === av ? "scale(1.05)" : "scale(1)"
                    }}
                  >
                    {av}
                  </div>
                ))}
              </div>

            </Card>
          </div>
        )}

        {step === 2 && (
          <Card style={{ background: cardBg, borderColor: border, color: text }}>
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
                💡 Create a private 4-digit PIN for {name}. They will enter this to log into their
                student area independently without accessing your dashboard.
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
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {limitPresets.map((preset) => (
              <div
                key={preset.val}
                onClick={() => setLimitMins(preset.val)}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1.5px solid " + (limitMins === preset.val ? borderCol : border),
                  background: limitMins === preset.val ? borderCol + "0D" : cardBg,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.18s"
                }}
              >
                <div>
                  <Txt
                    size={15}
                    weight={700}
                    color={limitMins === preset.val ? borderCol : text}
                  >
                    {preset.label}
                  </Txt>
                  <br />
                  <Txt size={11} color={textMuted}>
                    {preset.sub}
                  </Txt>
                </div>
                {limitMins === preset.val && (
                  <span style={{ fontSize: 16, fontWeight: "bold", color: borderCol }}>✓</span>
                )}
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <Card style={{ textAlign: "center", padding: "28px 20px", background: cardBg, borderColor: border, color: text }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 52,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid " + border
                }}
              >
                {avatar}
              </div>
            </div>
            <Heading size={22} color={text}>{name} is enrolled!</Heading>
            <Txt size={13} color={textMuted} style={{ display: "block", marginTop: 4 }}>
              Learning Track: {AGE_LABEL[ageGroup]} · {AGE_AGES[ageGroup]} years old.
            </Txt>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
              <Chip color={borderCol}>{limitMins > 0 ? `${limitMins} Mins Daily` : "No Limit"}</Chip>
              {interests.map((int) => (
                <Chip key={int} color={isDark ? "#FFFFFF" : "#1E293B"} bg={innerBg}>
                  {int}
                </Chip>
              ))}
            </div>

            <div
              style={{
                marginTop: 22,
                padding: "12px 14px",
                background: innerBg,
                borderRadius: 10,
                border: "1.5px solid " + border,
                textAlign: "left"
              }}
            >
              <Txt size={12} color={text} style={{ lineHeight: 1.65 }}>
                ✨ <strong>Parent Note:</strong> {name} can now access their dashboard from the main login screen. Give them their individual PIN to sign in!
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
            <Btn variant="ghost" onClick={() => { setStep((s) => s - 1); setErr(""); }} style={{ color: text, background: innerBg, borderColor: border }}>
              Back
            </Btn>
          )}
          <Btn full variant="yellow" size="lg" onClick={handleNext}>
            {step === 3 ? "Next steps" : step === 4 ? "Complete Enrollment" : "Continue"}
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
    slots: { morning: 380, afternoon: 380, evening: 380 }
  };

  const [limitsOn, setLimitsOn] = useState(saved.limitsEnabled || false);
  const [slots, setSlots] = useState({
    morning: Math.floor((saved.slots?.morning || 300) / 60),
    afternoon: Math.floor((saved.slots?.afternoon || 300) / 60),
    evening: Math.floor((saved.slots?.evening || 300) / 60)
  });
  const [savedOk, setSavedOk] = useState(false);
  const [appLang, setAppLang] = useState<Language>(() => S.getLang() as Language || lang);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccessString, setEnrollSuccessString] = useState<string | null>(null);

  const isDark = theme === "dark";
  const bg = isDark ? "#0F172A" : "#F8FAFC";
  const text = isDark ? "#F8FAFC" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#475569";
  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const border = isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0";
  const innerBg = isDark ? "rgba(255, 255, 255, 0.03)" : "#F1F5F9";

  const save = () => {
    const all = S.getSettings();
    all[settingsKey] = {
      limitsEnabled: limitsOn,
      slots: {
        morning: slots.morning * 60,
        afternoon: slots.afternoon * 60,
        evening: slots.evening * 60
      }
    };
    S.setSettings(all);
    S.setLang(appLang);
    onLanguageChange(appLang);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2000);
  };

  const handleEnrollDone = (newChildName?: string) => {
    if (newChildName) {
      setEnrollSuccessString(newChildName);
    } else {
      setEnrollSuccessString("your child");
    }
    
    // Refresh the parent global state so the dashboard updates instantly
    try {
      const safeEmail = (parent.email || "").toLowerCase().trim();
      const freshParents = S.getParents();
      if (freshParents[safeEmail]) {
        onParentRefresh(freshParents[safeEmail]);
      }
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

  const children = parent.children || [];

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
            const courseLessonsCount = 6; // Sync dynamic module length
            const completedCount = Object.keys(c.completed || {}).length;
            const pct = Math.round((completedCount / courseLessonsCount) * 100);
            const m = AGE_META[c.ageGroup] || { color: C.teal };

            return (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderTop: i === 0 ? "none" : "1px solid " + border
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    width: 44,
                    height: 44,
                    background: innerBg,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1.5px solid " + border
                  }}
                >
                  {c.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={14} weight={700} color={text} style={{ display: "block", marginBottom: 2 }}>
                    {c.name}
                  </Txt>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <Chip color={m.color}>{AGE_LABEL[c.ageGroup]}</Chip>
                    <Txt size={11} color={textMuted}>
                      {c.xp || 0} XP · PIN: {c.pin}
                    </Txt>
                  </div>
                </div>
                <Txt size={13} weight={700} color={m.color}>
                  {pct}% Completed
                </Txt>
              </div>
            );
          })}
        </Card>

        {/* Daily Time blocks constraints */}
        <Card style={{ marginBottom: 14, background: cardBg, borderColor: border, color: text }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6
            }}
          >
            <div>
              <Txt size={15} weight={700} color={text} style={{ display: "block" }}>
                Session Controls
              </Txt>
              <Txt size={12} color={textMuted}>
                Limit hourly duration blocks
              </Txt>
            </div>
            <Toggle on={limitsOn} onToggle={() => setLimitsOn((l) => !l)} />
          </div>

          {limitsOn && (
            <>
              <div style={{ height: 1, background: border, margin: "14px 0" }} />
              <Txt size={12} color={textMuted} style={{ display: "block", marginBottom: 16 }}>
                Preset minutes allowed per learning block. Set 0 to disable slot:
              </Txt>
              {[
                { key: "morning" as const, label: "Morning (5am – 12pm)" },
                { key: "afternoon" as const, label: "Afternoon (12pm – 6pm)" },
                { key: "evening" as const, label: "Evening (6pm – Midnight)" }
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 16 }}>
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
              {savedOk ? "Saved Settings ✓" : "Save Changes"}
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
              { code: "en", label: "English (EN)" },
              { code: "yo", label: "Yorùbá (YO)" },
              { code: "ig", label: "Igbo (IG)" }
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
