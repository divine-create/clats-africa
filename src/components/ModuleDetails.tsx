/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { Child, Module, Language } from "../types";
import { C, F, AGE_META } from "../utils/config";
import { Card, Heading, Txt, Btn, Chip } from "./Primitives";
import { KobeAvatar } from "./KobeAvatar";
import { companionVoice } from "../utils/audio";

interface ModuleDetailsProps {
  child: Child;
  module: Module;
  onBack: () => void;
  onStartModule: () => void;
  lang: Language;
}

export const ModuleDetails: React.FC<ModuleDetailsProps> = ({
  child,
  module,
  onBack,
  onStartModule,
  lang
}) => {
  const meta = AGE_META[child.ageGroup] || { color: C.teal, soft: C.tealGhost };
  const companion = child.companion || "kobe";

  useEffect(() => {
    const title = module.name[lang] || module.name.en;
    const desc = module.goal[lang] || module.goal.en;
    const speechText = `Let's work on the ${title} module! ${desc}`;
    const timer = setTimeout(() => {
      companionVoice.speak(speechText, child.companion || "kobe", child.ageGroup);
    }, 700);
    return () => {
      clearTimeout(timer);
      companionVoice.stop();
    };
  }, [module.id, child.companion, child.ageGroup, lang]);

  const lessons = module.lessons || [];
  const completedCount = lessons.filter((l) => child.completed && child.completed[l.id]).length;
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // Skills dynamic resolver
  const getSkillsLearned = (modId: string): string[] => {
    const defaultSkills = ["Logical analysis", "Problem modeling", "Emerging technology basics"];
    const id = modId.toLowerCase();
    if (id.includes("t-a1") || id.includes("technology")) {
      return ["Smart Tool Identification", "Manual vs Digital Mechanics", "Household Technology Recognition", "Digital Safety Literacy"];
    }
    if (id.includes("j-a1") || id.includes("foundations") || id.includes("p-a1")) {
      return ["Neural Synapses Basics", "Prompt Engineering", "Data Collection & Labeling", "Ethics & Responsibilities of AI"];
    }
    if (id.includes("a2") || id.includes("cyber") || id.includes("safety") || id.includes("password")) {
      return ["Password Architecture", "Secure Browsing Habits", "Social Engineering Awareness", "Device Lock Systems"];
    }
    if (id.includes("a3") || id.includes("design") || id.includes("creat")) {
      return ["UI/UX Hierarchy", "Wireframing Concepts", "Color Harmonies & Contrast", "Vector Asset Management"];
    }
    if (id.includes("a4") || id.includes("career") || id.includes("leader")) {
      return ["Confident Projections", "Goal Design Frameworks", "Startup Model Canvas", "Team Interaction Logistics"];
    }
    return defaultSkills;
  };

  // Mascot dynamic statement
  const getMascotSpeech = () => {
    if (module.comingSoon) {
      return companion === "kobe"
        ? `This module is coming soon! 🔓 We can explore its lessons list and skills map. Wait for your parent or the next update to play!`
        : `Stay tuned, superstar! 🌸 This is a sneak peek! You can view the skills you will master very soon!`;
    }
    if (pct === 100) {
      return companion === "kobe"
        ? `Incredible job, ${child.name}! You finished this entire adventure and secured your ${module.badge.name}! 🏆`
        : `Yay! You're a true champion, ${child.name}! You mastered all lessons here! Let's brag with our ${module.badge.name}! ✨`;
    }
    if (pct > 0) {
      return companion === "kobe"
        ? `We are ${pct}% of the way there, ${child.name}! Keep that momentum going!`
        : `Wow! Almost there, digital navigator! Let's lock in those remaining lessons together! 🚀`;
    }
    return companion === "kobe"
      ? `Hi ${child.name}! 👋 Ready for a new tech puzzle? Let's unlock the ${module.badge.name} together!`
      : `Hooray! A brand new quest is waiting for us! I'll guide you step-by-step, ${child.name}! Let's begin! 🌸`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        padding: "24px 20px 120px",
        fontFamily: F.body,
        position: "relative",
        zIndex: 10
      }}
    >
      {/* Navigation header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: "#ffffff",
            border: "2px solid #cbd5e1",
            borderRadius: 14,
            padding: "8px 16px",
            color: "#000000",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            transition: "all 0.15s ease"
          }}
          className="hover:translate-y-[-1px] active:translate-y-[1px]"
        >
          <span style={{ color: "#000000", fontWeight: 900 }}>←</span> Explore Modules
        </button>
      </div>

      {/* Main Presentation Container */}
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        
        {/* Giant Module Hero Card - Light Purple / Lavender theme for child friendliness */}
        <div
          className="playful-card"
          style={{
            background: "#faf5ff",
            borderColor: "#d8b4fe",
            borderBottom: "7px solid #c084fc",
            borderRadius: 28,
            padding: 24,
            marginBottom: 24,
            textAlign: "center"
          }}
        >
          {/* Badge Showcase Circular Glow */}
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(167, 139, 250, 0.3))",
              margin: "12px auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `3px solid #c084fc`,
              position: "relative",
              boxShadow: `0 8px 16px rgba(167,139,250,0.15)`
            }}
          >
            <span style={{ fontSize: 52 }}>{module.badge.icon || "🏆"}</span>
            
            {/* Crown corner badge */}
            <div
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#ffb800",
                borderRadius: "50%",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
              }}
            >
              <span style={{ fontSize: 13 }}>⭐</span>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Chip color="#6b21a8" bg="rgba(167, 139, 250, 0.15)">{child.ageGroup.toUpperCase()} TRACK</Chip>
          </div>

          <Heading size={24} color="#0f172a" style={{ marginTop: 14, marginBottom: 12, lineHeight: 1.25, fontWeight: 900 }}>
            {module.name[lang] || module.name.en}
          </Heading>

          <Txt size={15} color="#334155" style={{ display: "block", marginBottom: 24, padding: "0 10px", fontWeight: 600 }}>
            {module.goal ? (module.goal[lang] || module.goal.en) : "Discover safe, smart habits and build creative solutions through computational thinking."}
          </Txt>

          {/* Core Metrics Bento Rows 2x2 Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 24
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: 18,
                padding: "12px",
                border: "2.5px solid #e9d5ff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
              }}
            >
              <Txt size={11} color="#6b21a8" weight={850} style={{ textTransform: "uppercase", display: "block", marginBottom: 2, fontFamily: F.mono }}>
                📚 Lessons
              </Txt>
              <Txt size={17} weight={950} color="#000000">
                {lessons.length || 5} Quests
              </Txt>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: 18,
                padding: "12px",
                border: "2.5px solid #e9d5ff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
              }}
            >
              <Txt size={11} color="#6b21a8" weight={850} style={{ textTransform: "uppercase", display: "block", marginBottom: 2, fontFamily: F.mono }}>
                ⏱️ Est. Time
              </Txt>
              <Txt size={17} weight={950} color="#000000">
                {(lessons.length || 5) * 4} mins
              </Txt>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: 18,
                padding: "12px",
                border: "2.5px solid #e9d5ff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
              }}
            >
              <Txt size={11} color="#6b21a8" weight={850} style={{ textTransform: "uppercase", display: "block", marginBottom: 2, fontFamily: F.mono }}>
                ✨ XP Reward
              </Txt>
              <Txt size={17} weight={950} color="#10b981">
                +{(lessons.length || 5) * 50} XP
              </Txt>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: 18,
                padding: "12px",
                border: "2.5px solid #e9d5ff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
              }}
            >
              <Txt size={11} color="#6b21a8" weight={850} style={{ textTransform: "uppercase", display: "block", marginBottom: 2, fontFamily: F.mono }}>
                🏅 Badge
              </Txt>
              <Txt size={15} weight={950} color="#d97706" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                {module.badge.name || "Badge"}
              </Txt>
            </div>
          </div>

          {/* Gamified Progress Progress Bar */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: "16px 20px",
              border: "2px solid #e9d5ff",
              textAlign: "left"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
              <Txt size={13} weight={900} color="#6b21a8" style={{ textTransform: "uppercase", fontFamily: F.mono }}>
                Module Progress
              </Txt>
              <Txt size={14} weight={900} color="#000000">
                {pct}% Complete
              </Txt>
            </div>
            <div style={{ height: 14, background: "#f3e8ff", borderRadius: 8, overflow: "hidden", position: "relative" }}>
              <div
                style={{
                  height: "100%",
                  width: pct + "%",
                  background: `linear-gradient(90deg, #10b981, #34d399)`,
                  borderRadius: 8,
                  transition: "width 0.6s ease"
                }}
              />
            </div>
            <Txt size={12} color="#475569" style={{ display: "block", marginTop: 8, fontWeight: 600 }}>
              {pct === 100 
                ? "Excellent! Gold crown is yours! You can review lessons anytime to keep your tech brain healthy."
                : `Complete all ${lessons.length || 5} interactive units sequentially to earn the official ${module.badge.name}.`}
            </Txt>
          </div>
        </div>

        {/* Skills Gained Section */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 24,
            padding: "20px 24px",
            border: "3px solid #cbd5e1",
            borderBottom: "7px solid #cbd5e1",
            textAlign: "left",
            marginBottom: 24
          }}
        >
          <Txt size={12} weight={950} color="#0d9488" style={{ textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 12, fontFamily: F.mono }}>
            ⭐ CORE SKILLS YOU WILL ACQUIRE:
          </Txt>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {getSkillsLearned(module.id).map((skill, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#2EC4B6", fontSize: 18, fontWeight: 900 }}>✓</span>
                <Txt size={14.5} weight={800} color="#334155">{skill}</Txt>
              </div>
            ))}
          </div>
        </div>

        {/* Supporting Mascot speech block */}
        <div
          className="playful-card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "#ffffff",
            borderRadius: 24,
            padding: "14px 20px",
            border: "3px solid #cbd5e1",
            borderBottom: "7px solid #cbd5e1",
            marginBottom: 28,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <KobeAvatar size={64} ageGroup={child.ageGroup} character={companion} expression={pct === 100 ? "celebrating" : "happy"} />
          </div>
          <div style={{ flex: 1 }}>
            <Txt size={11} weight={900} color="#0284c7" style={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4, fontFamily: F.mono }}>
              YOUR STUDY COMPANION ({companion.toUpperCase()})
            </Txt>
            <Txt size={13.5} color="#000000" style={{ fontStyle: "normal", fontWeight: 700, lineHeight: 1.4, display: "block" }}>
              "{getMascotSpeech()}"
            </Txt>
          </div>
        </div>

        {/* Start Module Call to Action */}
        {module.comingSoon ? (
          <button
            className="w-full bg-slate-300 text-slate-600 font-extrabold uppercase tracking-wider rounded-2xl"
            style={{
              height: 58,
              fontSize: 16,
              display: "block",
              cursor: "not-allowed",
              border: "3px solid #cbd5e1",
              borderBottom: "7px solid #94a3b8"
            }}
            disabled
          >
            Locked - Coming Soon 🔒
          </button>
        ) : (
          <button
            onClick={onStartModule}
            className={`w-full font-black rounded-2xl transition-all duration-200 transform hover:scale-[1.03] active:scale-95 shadow-lg border-none cursor-pointer flex items-center justify-center ${
              pct > 0 ? "animate-pulse" : ""
            }`}
            style={{
              height: 64,
              fontSize: 18,
              fontWeight: 950,
              letterSpacing: "0.05em",
              color: "#ffffff",
              background: pct === 100
                ? "linear-gradient(135deg, #10b981, #059669)"
                : pct > 0
                ? "linear-gradient(135deg, #FF007A, #7928CA, #2EC4B6)"
                : "linear-gradient(135deg, #FFB800, #FF9900)",
              boxShadow: pct === 100
                ? "0 8px 20px rgba(16, 185, 129, 0.3)"
                : pct > 0
                ? "0 10px 25px rgba(121, 40, 202, 0.45), 0 0 15px rgba(46, 196, 182, 0.3)"
                : "0 8px 20px rgba(255, 153, 0, 0.3)",
              borderBottom: pct === 100
                ? "5px solid #047857"
                : pct > 0
                ? "5px solid #4f1d8c"
                : "5px solid #cc7a00",
              textShadow: "0 2px 4px rgba(0,0,0,0.25)"
            }}
          >
            {pct === 100 ? (
              <span>Review Lessons 🔄</span>
            ) : pct > 0 ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                ✨ CONTINUE JOURNEY 🚀 ({pct}% Done)
              </span>
            ) : (
              <span>Start Adventure 🎮</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
