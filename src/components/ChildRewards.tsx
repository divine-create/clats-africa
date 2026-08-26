/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Child, Language } from "../types";
import { C, F } from "../utils/config";
import { Heading, Txt, Chip } from "./Primitives";
import { sfx, companionVoice } from "../utils/audio";
import { 
  Trophy, 
  Star, 
  Flame, 
  Award, 
  Download, 
  Share2, 
  Lock, 
  Check, 
  Gift, 
  Sparkles, 
  ArrowRight
} from "lucide-react";
import { MascotImage } from "./Onboarding";
import { CURRICULUM } from "../data/curriculum";
import { downloadCertificateImage } from "../utils/pdfGenerator";

interface ChildRewardsProps {
  child: Child;
  lang: Language;
  onStartLearning?: () => void;
  theme?: "light" | "dark";
  onUpdateChild?: (updated: Child) => void;
}

interface MilestoneDay {
  dayName: string;
  isCompleted: boolean;
  isToday: boolean;
}

export const ChildRewards: React.FC<ChildRewardsProps> = ({ 
  child, 
  lang,
  onStartLearning,
  theme,
  onUpdateChild
}) => {
  // 1. Theme State Detection
  const [isDark, setIsDark] = useState(() => {
    return theme === "dark" || document.body.classList.contains("dark-theme") || localStorage.getItem("clats_theme") === "dark";
  });

  useEffect(() => {
    if (theme) {
      setIsDark(theme === "dark");
    }
  }, [theme]);

  useEffect(() => {
    const companionName = child.companion === "chibi" ? "Chibi" : "Kobe";
    const rewardsWelcome = `Wow! Look at all your milestone achievements and badges! Keep learning to collect even more. I am so proud of you!`;
    const timer = setTimeout(() => {
      companionVoice.speak(rewardsWelcome, child.companion || "kobe", child.ageGroup);
    }, 850);
    return () => {
      clearTimeout(timer);
      companionVoice.stop();
    };
  }, [child.companion, child.ageGroup]);

  const resolvedCompletedCount = Object.keys(child.completed || {}).length;

  // 2. Playful Gamified States
  const streak = child.streak_count || 0;
  const bestStreak = child.best_streak || child.streak_count || 0;

  // Keep track of claimed rewards in localStorage
  const [claimedMilestones, setClaimedMilestones] = useState<string[]>(() => {
    if (resolvedCompletedCount === 0) return [];
    try {
      const val = localStorage.getItem(`clats_claimed_milestones_${child.id}`);
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  });

  // Certificate Interaction States
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [downloadStep, setDownloadStep] = useState<"idle" | "generating" | "downloading" | "ready">("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Companion celebration notification
  const [speechBubble] = useState<{ mascot: "kobe" | "chibi"; message: string }>(() => {
    const isKobe = child.companion !== "chibi";
    return {
      mascot: isKobe ? "kobe" : "chibi",
      message: isKobe 
        ? "You're becoming a future-ready explorer! Keep up the brilliant logic work!" 
        : "Keep learning to unlock more rewards, awesome certificates, and beautiful badges!"
    };
  });

  // 3. Dynamic Progress Arithmetic
  const currentXP = child.xp || 0;
  const completed = child.completed || {};
  const completedCount = Object.keys(completed).filter(k => completed[k]).length;
  
  // Cast types safely to avoid TypeScript 'unknown' array object reducers
  const starsRecord = (child.stars || {}) as Record<string, number>;
  const totalStars = Object.values(starsRecord).reduce((sum: number, val: number) => sum + val, 0);

  // Syllabus configuration
  const course = CURRICULUM[child.ageGroup] || CURRICULUM["young innovators"];
  const modules = course ? course.modules : [];
  
  // Cast Quiz results for TS
  const quizResults = (child.quizResults || {}) as Record<string, any>;
  const hasQuizChampion = Object.values(quizResults).some((r: any) => r && r.score === r.totalQuestions && r.totalQuestions > 0);

  // Track AI module progress
  const aiModule = modules[0];
  const completedAiLessonsCount = aiModule ? aiModule.lessons.filter(l => completed[l.id]).length : 0;
  const totalAiLessonsCount = aiModule ? aiModule.lessons.length : 4;
  const isAiModuleCompleted = aiModule && aiModule.lessons?.length > 0 ? aiModule.lessons.every(l => completed[l.id]) : false;
  const aiPct = Math.round((completedAiLessonsCount / totalAiLessonsCount) * 100);

  const isNewUser = currentXP === 0 && completedCount === 0;

  // 4. XP levels mapping tables
  const levels = [
    { lv: 1, title: "Curious Learner", xpMin: 0, xpMax: 299 },
    { lv: 2, title: "Technology Explorer", xpMin: 300, xpMax: 599 },
    { lv: 3, title: "AI Adventurer", xpMin: 600, xpMax: 999 },
    { lv: 4, title: "Future Builder", xpMin: 1000, xpMax: 1499 },
    { lv: 5, title: "Innovation Champion", xpMin: 1500, xpMax: 2499 },
    { lv: 6, title: "CLATS Ambassador", xpMin: 2500, xpMax: 100000 }
  ];

  const currentLevelObj = levels.find(l => currentXP >= l.xpMin && currentXP <= l.xpMax) || levels[levels.length - 1];
  
  // Progress bar dimensions
  const currentStepMin = currentLevelObj.xpMin;
  const currentStepMax = currentLevelObj.xpMax === 100000 ? 5000 : currentLevelObj.xpMax;
  const levelRange = currentStepMax - currentStepMin;
  const levelProgress = currentXP - currentStepMin;
  const levelProgressPct = currentLevelObj.lv === 6 ? 100 : Math.min(100, Math.max(0, (levelProgress / levelRange) * 100));

  // 5. Dynamic MVP Badges Log
  const badgesData = [
    {
      id: "first-completed",
      name: "First Lesson Completed",
      desc: "Complete your first lesson and set sail.",
      unlocked: completedCount >= 1,
      unlockedDate: "Activated",
      icon: "🏅"
    },
    {
      id: "quiz-champ",
      name: "Quiz Champion",
      desc: "Score 100% on any futuristic lesson quiz.",
      unlocked: hasQuizChampion || completedCount >= 4,
      unlockedDate: "Earned Today",
      icon: "🏆"
    },
    {
      id: "ai-explorer",
      name: "AI Explorer",
      desc: "Complete the master AI Foundations module.",
      unlocked: isAiModuleCompleted || completedCount >= 2,
      unlockedDate: "Earned Recently",
      icon: "🤖"
    },
    {
      id: "streak-consistent",
      name: "Consistency Star",
      desc: "Maintain a gorgeous 7-day learning streak.",
      unlocked: streak >= 7,
      unlockedDate: "Earned Today",
      icon: "⭐"
    },
    {
      id: "future-thinker",
      name: "Future Thinker",
      desc: "Amass a balance of 500+ XP in your wallet.",
      unlocked: currentXP >= 500,
      unlockedDate: "Activated",
      icon: "🌟"
    },
    {
      id: "smart-learner",
      name: "Smart Learner",
      desc: "Conquer and absolute pass 5 lessons total.",
      unlocked: completedCount >= 5,
      unlockedDate: "Activated",
      icon: "🧩"
    }
  ];

  const earnedBadgesCount = badgesData.filter(b => b.unlocked).length;

  // 6. Dynamic Certificates Map
  const certificatesData = [
    {
      id: "ai-foundations",
      name: "AI Foundations Certificate",
      desc: "Demonstrated master capability of AI concepts, neural nodes and machines.",
      unlocked: isAiModuleCompleted || completedCount >= 2,
      requirement: "Complete first module",
      icon: "🎓"
    },
    {
      id: "ai-explorer-level",
      name: "AI Explorer Certificate",
      desc: "Acquired a high learning level and earned substantial XP milestones.",
      unlocked: currentXP >= 500,
      requirement: "Earn 500+ XP",
      icon: "📜"
    },
    {
      id: "digital-literacy",
      name: "Digital Literacy Certificate",
      desc: "Engaged in interactive logic, system design and safety modules.",
      unlocked: completedCount >= 3,
      requirement: "Complete 3+ Lessons",
      icon: "🌟"
    },
    {
      id: "cyber-safety",
      name: "Cyber Safety Certificate",
      desc: "Coming Soon - Complete required modules to unlock.",
      unlocked: false,
      requirement: "Complete Cyber Track",
      icon: "🔒"
    }
  ];

  const earnedCertificatesCount = certificatesData.filter(c => c.unlocked).length;

  // 7. Sticker Sheet items for Tiny Ages 2–5
  const adventureStickers = [
    { id: "koala", emoji: "🐨", name: "Playful Koala", desc: "Unlock by beginning your adventure!", unlocked: true, color: "from-[#FFD166] to-amber-500" },
    { id: "whale", emoji: "🐳", name: "Ocean Explorer", desc: "Earned by completing 1+ lessons!", unlocked: completedCount >= 1, color: "from-[#2EC4B6] to-teal-600" },
    { id: "dinotech", emoji: "🦖", name: "Dino-Coder", desc: "Earned by completing 2+ lessons!", unlocked: completedCount >= 2, color: "from-[#B8A0FF] to-violet-600" },
    { id: "leader_lion", emoji: "🦁", name: "Leader Lion", desc: "Earned by maintaining a streak!", unlocked: streak >= 5, color: "from-rose-400 to-red-500" },
    { id: "rocket", emoji: "🚀", name: "Apex Rocket", desc: "Unlock with 500+ XP milestone!", unlocked: currentXP >= 500, color: "from-blue-400 to-indigo-600" },
    { id: "star_badge", emoji: "⭐", name: "Super Star", desc: "Unlock by gaining 5+ Stars!", unlocked: totalStars >= 5, color: "from-amber-300 to-yellow-500" }
  ];

  const earnedStickersCount = adventureStickers.filter(s => s.unlocked).length;

  // Interaction handlers
  const handleOpenCertificate = (cert: any) => {
    sfx.playLevelUp();
    setSelectedCertificate(cert);
    setDownloadStep("idle");
    setDownloadProgress(0);
    setShareFeedback(null);
  };

  const handleDownloadCertificate = () => {
    sfx.playCoin();
    setDownloadStep("generating");
    setDownloadProgress(20);

    setTimeout(() => {
      setDownloadProgress(50);
      setDownloadStep("downloading");
    }, 500);

    setTimeout(() => {
      setDownloadProgress(85);
    }, 1000);

    setTimeout(() => {
      setDownloadProgress(100);
      setDownloadStep("ready");
      sfx.playLevelUp();
      // Trigger the real image screenshot download
      if (selectedCertificate) {
        (async () => {
          await downloadCertificateImage(selectedCertificate.name);
        })();
      }
    }, 1500);
  };

  const handleShareCertificate = () => {
    sfx.playCoin();
    try {
      navigator.clipboard.writeText(`Wow! I just completed my CLATS Future-Tech course and earned the "${selectedCertificate?.name}"! 🚀🎓`);
      setShareFeedback("📋 Achievement copy-pasted to clipboard! Go share with parents and family!");
    } catch {
      setShareFeedback("Achievement copy-pasted! Go share with parents!");
    }
    setTimeout(() => {
      setShareFeedback(null);
    }, 4500);
  };

  const handleClaimMilestone = (id: string, bonus: number) => {
    if (claimedMilestones.includes(id)) {
      sfx.playTap();
      return;
    }
    sfx.playLevelUp();
    const nextClaimed = [...claimedMilestones, id];
    setClaimedMilestones(nextClaimed);
    try {
      localStorage.setItem(`clats_claimed_milestones_${child.id}`, JSON.stringify(nextClaimed));
    } catch (e) {}

    if (onUpdateChild) {
      onUpdateChild({
        ...child,
        xp: currentXP + bonus
      });
    }
  };

  // Calendar Days representation
  const calendarDays: MilestoneDay[] = Array.from({ length: 7 }, (_, i) => {
    const todayIndex = 6;
    const isToday = i === todayIndex;
    const isCompleted = i > (todayIndex - streak) && i <= todayIndex;
    return {
      dayName: ["M", "T", "W", "T", "F", "S", "S"][i],
      isCompleted,
      isToday
    };
  });

  return (
    <div
      id="clats-rewards-hub"
      style={{
        padding: "24px 20px 120px",
        background: isDark ? "#0f172a" : "#f8fafc",
        minHeight: "100vh",
        fontFamily: F.body,
        transition: "background-color 0.4s ease, color 0.4s ease",
        color: isDark ? "#f8fafc" : "#1e293b"
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        
        {/* HERO TITLE SECTION */}
        <div 
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            marginBottom: 26,
            background: isDark ? "rgba(46, 196, 182, 0.05)" : "rgba(46, 196, 182, 0.04)",
            border: isDark ? "1.5px solid rgba(46, 196, 182, 0.25)" : "1.5px solid rgba(46, 196, 182, 0.12)",
            borderRadius: 24,
            padding: "20px 24px"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🏆</span>
              <Heading size={32} style={{ color: isDark ? "#2EC4B6" : "#0f172a", fontWeight: 900 }}>
                My Rewards
              </Heading>
            </div>
            <Txt size={14.5} color={isDark ? "#94a3b8" : "#475569"} style={{ display: "block", marginTop: 4 }}>
              Celebrate your learning journey and unlock exciting achievements.
            </Txt>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Chip bg={isDark ? "rgba(184, 160, 255, 0.15)" : "#f1f5f9"} color={isDark ? "#B8A0FF" : "#4f46e5"} style={{ fontWeight: 800 }}>
              👤 Active: {child.name || "Explorer"}
            </Chip>
            <Chip bg={isDark ? "#212d44" : "#ecfdf5"} color="#10b981" style={{ fontWeight: 900 }}>
              🟢 Live Sync Connected
            </Chip>
          </div>
        </div>

        {/* EMPTY STATE COMPONENT */}
        {isNewUser && (
          <div 
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              border: `3px solid ${isDark ? "#475569" : "#e2e8f0"}`,
              borderBottom: `6px solid ${isDark ? "#334155" : "#cbd5e1"}`,
              borderRadius: 28,
              padding: "44px 32px",
              textAlign: "center",
              marginBottom: 28,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)"
            }}
          >
            <span style={{ fontSize: 62, display: "block", marginBottom: 14 }}>🌟</span>
            <Heading size={24} style={{ color: isDark ? "#2EC4B6" : "#0f172a", marginBottom: 8, fontWeight: 900 }}>
              Your Adventure Starts Here
            </Heading>
            <Txt size={15} color={isDark ? "#cbd5e1" : "#475569"} style={{ display: "block", maxWidth: 500, margin: "0 auto 22px", lineHeight: 1.5 }}>
              Complete lessons, quizzes, and challenges to earn rewards, accumulate XP, and unlock premium future-tech certs.
            </Txt>
            {onStartLearning && (
              <button
                onClick={() => {
                  sfx.playLevelUp();
                  onStartLearning();
                }}
                className="transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #2EC4B6, #20877d)",
                  border: "none",
                  borderBottom: "4px solid #145d55",
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 900,
                  padding: "14px 34px",
                  borderRadius: 16,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: F.display
                }}
              >
                Start Learning <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {/* COMPANION speech bubble */}
        <div 
          className="transition-all duration-300 hover:shadow-md"
          style={{
            background: isDark ? "#1e293b" : "#ffffff",
            border: isDark ? "2px solid #334155" : "2.5px solid #cbd5e1",
            borderRadius: 24,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
            boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
          }}
        >
          <div 
            style={{ 
              flexShrink: 0, 
              width: 58, 
              height: 58, 
              borderRadius: "50%", 
              background: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "2px solid #FFD166"
            }}
          >
            <MascotImage character={speechBubble.mascot} height={50} />
          </div>
          <div>
            <Txt size={11} style={{ display: "block", fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "#FFD166" }}>
              {speechBubble.mascot === "kobe" ? "KOBE CHIRP" : "CHIBI FLIGHT"}
            </Txt>
            <Txt size={14.5} style={{ display: "block", fontStyle: "italic", fontWeight: 700, color: isDark ? "#f1f5f9" : "#334155", marginTop: 2 }}>
              "{speechBubble.message}"
            </Txt>
          </div>
        </div>

        {/* TOP METRICS INVENTORY */}
        <div 
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 32
          }}
        >
          {/* XP */}
          <div 
            className="transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{
              padding: "20px 18px",
              borderRadius: 24,
              background: isDark ? "#000000" : "#ffffff",
              border: "2.5px solid #FFD166",
              borderBottom: "6px solid #FFD166",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ fontSize: 36, background: "rgba(255, 209, 102, 0.15)", width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ⭐
            </div>
            <div>
              <Txt size={11} color={isDark ? "#ffffff" : "#000000"} style={{ display: "block", fontWeight: 900, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.8 }}>
                Total XP
              </Txt>
              <Txt size={24} weight={950} color={isDark ? "#ffffff" : "#000000"} style={{ display: "block", marginTop: 2 }}>
                {currentXP}
              </Txt>
            </div>
          </div>

          {/* STREAK */}
          <div 
            className="transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{
              padding: "20px 18px",
              borderRadius: 24,
              background: isDark ? "#000000" : "#ffffff",
              border: "2.5px solid #B8A0FF",
              borderBottom: "6px solid #B8A0FF",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ fontSize: 36, background: "rgba(184, 160, 255, 0.15)", width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              🔥
            </div>
            <div>
              <Txt size={11} color={isDark ? "#ffffff" : "#000000"} style={{ display: "block", fontWeight: 900, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.8 }}>
                Streak
              </Txt>
              <Txt size={24} weight={950} color={isDark ? "#ffffff" : "#000000"} style={{ display: "block", marginTop: 2 }}>
                {streak} Days
              </Txt>
            </div>
          </div>

          {/* BADGES */}
          <div 
            className="transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{
              padding: "20px 18px",
              borderRadius: 24,
              background: isDark ? "#000000" : "#ffffff",
              border: "2.5px solid #FFD166",
              borderBottom: "6px solid #FFD166",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ fontSize: 36, background: "rgba(255, 209, 102, 0.15)", width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              🏅
            </div>
            <div>
              <Txt size={11} color={isDark ? "#ffffff" : "#000000"} style={{ display: "block", fontWeight: 900, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.8 }}>
                Badges
              </Txt>
              <Txt size={24} weight={950} color={isDark ? "#ffffff" : "#000000"} style={{ display: "block", marginTop: 2 }}>
                {child.ageGroup === "early explorers" ? earnedStickersCount : earnedBadgesCount}
              </Txt>
            </div>
          </div>

          {/* CERTIFICATES */}
          <div 
            className="transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{
              padding: "20px 18px",
              borderRadius: 24,
              background: isDark ? "#000000" : "#ffffff",
              border: "2.5px solid #B8A0FF",
              borderBottom: "6px solid #B8A0FF",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ fontSize: 36, background: "rgba(184, 160, 255, 0.15)", width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              🎓
            </div>
            <div>
              <Txt size={11} color={isDark ? "#ffffff" : "#000000"} style={{ display: "block", fontWeight: 900, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.8 }}>
                Certificates
              </Txt>
              <Txt size={24} weight={950} color={isDark ? "#ffffff" : "#000000"} style={{ display: "block", marginTop: 2 }}>
                {earnedCertificatesCount}
              </Txt>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT PANEL */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }} className="grid grid-cols-1 xl:grid-cols-12">
          
          {/* MAIN SPACE (col-span-8) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="xl:col-span-8">
            
            {/* STICKER SHEETS FOR TINY AGES 2-5 */}
            {child.ageGroup === "early explorers" && (
              <div 
                style={{
                  background: isDark ? "#1e293b" : "#ffffff",
                  border: `2px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: 28,
                  padding: "24px 22px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  <div>
                    <Heading size={20} style={{ color: "#2EC4B6", fontWeight: 800 }}>
                      🌈 Adventure Stickers Album
                    </Heading>
                    <Txt size={13} color={isDark ? "#94a3b8" : "#64748b"}>
                      Complete standard lessons to unlock gorgeous, colorful stickers!
                    </Txt>
                  </div>
                  <Chip bg="rgba(46,196,182,0.15)" color="#2EC4B6" style={{ fontWeight: 900 }}>
                    ✨ COLLECTED: {earnedStickersCount} / {adventureStickers.length}
                  </Chip>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 14 }}>
                  {adventureStickers.map(stick => (
                    <div
                      key={stick.id}
                      className="transition-all hover:rotate-3 duration-200"
                      style={{
                        background: stick.unlocked 
                          ? (isDark ? "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06))" : "#faf5ff")
                          : (isDark ? "#0f172a" : "#f1f5f9"),
                        border: stick.unlocked 
                          ? `2px solid ${isDark ? "#475569" : "#B8A0FF"}`
                          : `2.5px dashed ${isDark ? "#334155" : "#cbd5e1"}`,
                        borderRadius: 20,
                        padding: 12,
                        textAlign: "center",
                        opacity: stick.unlocked ? 1 : 0.52
                      }}
                    >
                      <div 
                        style={{
                          width: 64,
                          height: 64,
                          margin: "0 auto 8px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 34,
                          background: stick.unlocked ? `linear-gradient(135deg, ${stick.color || "from-[#2EC4B6] to-[#B8A0FF]"})` : "#cbd5e122",
                          border: stick.unlocked ? "3px solid #ffffff" : "2px dashed #94a3b8",
                          boxShadow: stick.unlocked ? "0 8px 12px rgba(0,0,0,0.1)" : "none"
                        }}
                      >
                        {stick.emoji}
                      </div>
                      <Heading size={13.5} style={{ fontWeight: 800, color: isDark ? "#fff" : "#1e293b" }}>{stick.name}</Heading>
                      <Txt size={10} color={isDark ? "#94a3b8" : "#64748b"} style={{ display: "block", marginTop: 4, lineHeight: 1.2 }}>
                        {stick.desc}
                      </Txt>
                      {stick.unlocked ? (
                        <div style={{ display: "flex", justifyContent: "center", gap: 3, alignItems: "center", marginTop: 6, color: "#10b981" }}>
                          <Check size={10} strokeWidth={4} />
                          <Txt size={9.5} weight={900}>GOT IT</Txt>
                        </div>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "center", gap: 3, alignItems: "center", marginTop: 6, color: "#94a3b8" }}>
                          <Lock size={10} />
                          <Txt size={9.5} weight={850}>LOCKED</Txt>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AGE-ADAPTIVE EXPERIENCE: HERO XP PROGRESS OR GENERAL LEVEL CARDS */}
            {child.ageGroup !== "early explorers" && (
              <div 
                style={{
                  background: isDark ? "#1e293b" : "#ffffff",
                  border: `2px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderBottom: `6px solid ${isDark ? "#1e293b" : "#cbd5e1"}`,
                  borderRadius: 28,
                  padding: "24px 22px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <Heading size={20} style={{ color: isDark ? "#2EC4B6" : "#0f172a", fontWeight: 800 }}>
                      My Learning Level
                    </Heading>
                    <Txt size={13.5} color={isDark ? "#cbd5e1" : "#475569"}>
                      Earn continuous XP to scale up tech categories.
                    </Txt>
                  </div>
                  <Chip bg={isDark ? "rgba(46,196,182,0.12)" : "rgba(46,196,182,0.06)"} color="#2EC4B6" style={{ fontWeight: 900 }}>
                    🚀 ACADEMY SCORECARD
                  </Chip>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <div 
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, #FFD166, #eab308)`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "4px solid #ffffff",
                      boxShadow: "0 8px 16px rgba(255,209,102,0.3)"
                    }}
                  >
                    <Txt size={11} weight={900} color="#1e293b" style={{ lineHeight: 1 }}>LEVEL</Txt>
                    <Txt size={32} weight={950} color="#1e293b" style={{ lineHeight: 1, marginTop: 2 }}>{currentLevelObj.lv}</Txt>
                  </div>

                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <Heading size={18} style={{ fontWeight: 900, color: isDark ? "#B8A0FF" : "#4f46e5" }}>
                        {currentLevelObj.title}
                      </Heading>
                      <Txt size={13.5} weight={900} color={isDark ? "#cbd5e1" : "#1e293b"}>
                        {currentXP} <span style={{ color: "#94a3b8", fontWeight: 500 }}>/ {currentStepMax === 100000 ? "Max" : `${currentStepMax} XP`}</span>
                      </Txt>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: 16, background: isDark ? "#334155" : "#e2e8f0", borderRadius: 8, overflow: "hidden", position: "relative" }}>
                      <div 
                        style={{ 
                          width: `${levelProgressPct}%`, 
                          height: "100%", 
                          background: `linear-gradient(90deg, #2EC4B6, #B8A0FF)`, 
                          borderRadius: 8,
                          transition: "width 0.4s ease" 
                        }} 
                      />
                    </div>
                    
                    <Txt size={11.5} color={isDark ? "#94a3b8" : "#64748b"} style={{ display: "block", marginTop: 6, fontWeight: 700 }}>
                      {currentLevelObj.lv === 6 
                        ? "⭐ Amazing! You have conquered the pinnacle of our curriculum level scale!" 
                        : `🎯 Earn ${currentStepMax - currentXP} more XP to reach the next tier: Level ${currentLevelObj.lv + 1}!`
                      }
                    </Txt>
                  </div>
                </div>

                {/* Horizontal Level milestones */}
                <div 
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                    gap: 10,
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`
                  }}
                >
                  {levels.map(l => {
                    const isPassed = currentXP >= l.xpMin;
                    const isCurrent = currentLevelObj.lv === l.lv;
                    return (
                      <div 
                        key={l.lv}
                        style={{
                          textAlign: "center",
                          padding: "6px 4px",
                          borderRadius: 12,
                          background: isCurrent ? "rgba(46,196,182,0.06)" : "transparent",
                          border: isCurrent ? "1.5px solid #2EC4B6" : "1.5px solid transparent"
                        }}
                      >
                        <span style={{ fontSize: 13, display: "block", filter: isPassed ? "none" : "grayscale(1) opacity(0.35)" }}>
                          {l.lv === 1 ? "👶" : l.lv === 2 ? "🚀" : l.lv === 3 ? "🧠" : l.lv === 4 ? "🛠️" : l.lv === 5 ? "👑" : "🏆"}
                        </span>
                        <Txt size={11} weight={800} color={isCurrent ? "#2EC4B6" : isPassed ? (isDark ? "#cbd5e1" : "#1e293b") : "#94a3b8"} style={{ display: "block", marginTop: 2 }}>
                          Lvl {l.lv}
                        </Txt>
                        <Txt size={9} color={isCurrent ? "#2EC4B6" : "#94a3b8"} style={{ display: "block", textTransform: "uppercase", fontWeight: 700 }}>
                          {l.title.split(" ")[0]}
                        </Txt>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ACHIEVEMENT BADGES GRID */}
            <div 
              id="tour-badges"
              style={{
                background: isDark ? "#1e293b" : "#ffffff",
                border: `2px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                borderRadius: 28,
                padding: "24px 22px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                <div>
                  <Heading size={20} style={{ fontWeight: 800, color: isDark ? "#2EC4B6" : "#0f172a" }}>
                    🏅 Achievement Badges
                  </Heading>
                  <Txt size={13.5} color={isDark ? "#cbd5e1" : "#475569"}>
                    Complete tasks and lessons in CLATS to collect unique credentials of honor.
                  </Txt>
                </div>
                <Chip bg={isDark ? "rgba(184,160,255,0.12)" : "rgba(99,102,241,0.06)"} color="#B8A0FF" style={{ fontWeight: 900 }}>
                  🎖️ {earnedBadgesCount} / {badgesData.length} UNLOCKED
                </Chip>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {badgesData.map(badge => {
                  const isUnlocked = badge.unlocked;

                  return (
                    <div
                      key={badge.id}
                      className="transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        background: isUnlocked 
                          ? (isDark ? "rgba(46,196,182,0.04)" : "linear-gradient(135deg, rgba(254,243,197,0.15) 0%, rgba(251,191,36,0.04) 100%)") 
                          : (isDark ? "#151f32" : "#f8fafc"),
                        border: isUnlocked 
                          ? `2.5px solid ${isDark ? "#2EC4B6" : "#FFD166"}`
                          : `2px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                        borderRadius: 22,
                        padding: "18px 16px",
                        position: "relative",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        opacity: isUnlocked ? 1 : 0.65
                      }}
                    >
                      <div 
                        style={{
                          fontSize: 32,
                          filter: isUnlocked ? "none" : "grayscale(100%)",
                          opacity: isUnlocked ? 1 : 0.4
                        }}
                      >
                        {badge.icon}
                      </div>

                      <div style={{ flex: 1 }}>
                        <Heading size={14.5} style={{ color: isUnlocked ? (isDark ? "#ffffff" : "#0f172a") : (isDark ? "#64748b" : "#94a3b8"), fontWeight: 900 }}>
                          {badge.name}
                        </Heading>
                        <Txt size={11} color={isDark ? "#94a3b8" : "#475569"} style={{ display: "block", marginTop: 4, lineHeight: 1.3 }}>
                          {badge.desc}
                        </Txt>

                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 3 }}>
                          {isUnlocked ? (
                            <>
                              <span style={{ fontSize: 10 }}>🌟</span>
                              <Txt size={9.5} weight={900} color="#10b981" style={{ textTransform: "uppercase" }}>
                                GOT {badge.unlockedDate}!
                              </Txt>
                            </>
                          ) : (
                            <>
                              <Lock size={10} style={{ color: "#94a3b8" }} />
                              <Txt size={9.5} weight={800} color="#94a3b8" style={{ textTransform: "uppercase" }}>
                                LOCKED
                              </Txt>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CERTIFICATES SECTION */}
            <div 
              style={{
                background: isDark ? "#1e293b" : "#ffffff",
                border: `2px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                borderRadius: 28,
                padding: "24px 22px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                <div>
                  <Heading size={20} style={{ fontWeight: 800, color: isDark ? "#2EC4B6" : "#0f172a" }}>
                    🎓 CLATS Academy Certificates
                  </Heading>
                  <Txt size={13.5} color={isDark ? "#cbd5e1" : "#475569"}>
                    Complete core modules to earn recognized, shareable future-tech diplomas.
                  </Txt>
                </div>
                <Chip bg={isDark ? "rgba(184,160,255,0.12)" : "rgba(124,58,237,0.06)"} color="#B8A0FF" style={{ fontWeight: 900 }}>
                  🎖️ {earnedCertificatesCount} / {certificatesData.length} UNLOCKED
                </Chip>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {certificatesData.map(cert => {
                  const isUnlocked = cert.unlocked;

                  return (
                    <div
                      key={cert.id}
                      className="transition-all duration-300 hover:shadow-md"
                      style={{
                        background: isUnlocked 
                          ? (isDark ? "rgba(184, 160, 255, 0.04)" : "#ffffff") 
                          : (isDark ? "rgba(15,23,42,0.15)" : "#f1f5f9"),
                        border: isUnlocked 
                          ? `2.5px solid ${isDark ? "#B8A0FF" : "transparent"}`
                          : `2px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                        borderRadius: 24,
                        padding: "18px 16px",
                        opacity: isUnlocked ? 1 : 0.8,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: 180
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <span style={{ fontSize: 32, filter: isUnlocked ? "none" : "grayscale(1) opacity(0.4)" }}>{cert.icon}</span>
                          <Chip 
                            bg={isUnlocked ? "#ecfdf5" : "transparent"} 
                            color={isUnlocked ? "#047857" : "#64748b"}
                            style={{ fontSize: 10, border: isUnlocked ? "none" : `1px dashed ${isDark ? "#475569" : "#cbd5e1"}` }}
                          >
                            {isUnlocked ? "✓ Unlocked & Signed" : cert.requirement}
                          </Chip>
                        </div>

                        <Heading size={15.5} style={{ color: isUnlocked ? (isDark ? "#fff" : "#1e293b") : "#94a3b8", fontWeight: 800 }}>
                          {cert.name}
                        </Heading>
                        <Txt size={11} color={isDark ? "#94a3b8" : "#475569"} style={{ display: "block", marginTop: 4, lineHeight: 1.4 }}>
                          {cert.desc}
                        </Txt>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        {isUnlocked ? (
                          <button
                            onClick={() => handleOpenCertificate(cert)}
                            style={{
                              width: "100%",
                              background: isDark ? "rgba(184, 160, 255, 0.15)" : "#f3e8ff",
                              border: "none",
                              color: isDark ? "#E0D5FF" : "#6b21a8",
                              padding: "9px 12px",
                              borderRadius: 14,
                              fontSize: 12.5,
                              fontWeight: 900,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6
                            }}
                          >
                            ⭐ View & Download Certificate
                          </button>
                        ) : (
                          <div 
                            style={{
                              padding: "9px 12px",
                              borderRadius: 14,
                              background: isDark ? "#0f172a" : "#e2e8f0",
                              color: isDark ? "#475569" : "#64748b",
                              fontSize: 12,
                              fontWeight: 800,
                              textAlign: "center",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6
                            }}
                          >
                            <Lock size={12} /> Coming Soon (Modules Incomplete)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* SIDEBAR COL (col-span-4) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="xl:col-span-4">
            
            {/* PIONEER TRACK MATURE VIEW */}
            {child.ageGroup === "future builders" && (
              <div
                style={{
                  background: isDark ? "#1e293b" : "#ffffff",
                  border: `2px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: 24,
                  padding: "20px 18px"
                }}
              >
                <Heading size={17} style={{ fontWeight: 800, color: "#2EC4B6", marginBottom: 4 }}>
                  ⚙️ Professional Readiness Skills
                </Heading>
                <Txt size={12} color={isDark ? "#94a3b8" : "#64748b"} style={{ display: "block", marginBottom: 12 }}>
                  Your future builders competence domains compiled based on completed courses.
                </Txt>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Txt size={13} weight={800}>🤖 AI Machine Classification</Txt>
                    <Chip bg={completedCount >= 1 ? "rgba(16,185,129,0.15)" : "#f1f5f9"} color={completedCount >= 1 ? "#10b981" : "#64748b"}>
                      {completedCount >= 1 ? "✓ MASTERED" : "INCOMPLETE"}
                    </Chip>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Txt size={13} weight={800}>🔒 Digital Ethics & Threat Detection</Txt>
                    <Chip bg={completedCount >= 3 ? "rgba(16,185,129,0.15)" : "#f1f5f9"} color={completedCount >= 3 ? "#10b981" : "#64748b"}>
                      {completedCount >= 3 ? "✓ CERTIFIED" : "INCOMPLETE"}
                    </Chip>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Txt size={13} weight={800}>🐚 Interactive Mechanics Logic</Txt>
                    <Chip bg={completedCount >= 4 ? "rgba(16,185,129,0.15)" : "#f1f5f9"} color={completedCount >= 4 ? "#10b981" : "#64748b"}>
                      {completedCount >= 4 ? "✓ QUALIFIED" : "PRE-RELEASED"}
                    </Chip>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Txt size={13} weight={800}>🚀 Career Pitch-Decks & Strategy</Txt>
                    <Chip bg="#e2e8f0" color="#64748b">COMING SOON</Chip>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC LEARNING JOURNEY */}
            <div 
              style={{
                background: isDark ? "#1e293b" : "#ffffff",
                border: `2px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                borderRadius: 24,
                padding: "20px 18px"
              }}
            >
              <Heading size={18} style={{ fontWeight: 800, color: isDark ? "#2EC4B6" : "#0f172a", marginBottom: 12 }}>
                My Learning Journey
              </Heading>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                {/* ACADEMY 1: AI */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 28, background: "rgba(46,196,182,0.1)", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    🤖
                  </div>
                  <div style={{ flex: 1 }}>
                    <Heading size={14.5} style={{ fontWeight: 900 }}>AI & Emerging Tech</Heading>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
                      <Txt size={11.5} color={isDark ? "#94a3b8" : "#64748b"}>
                        Modules complete: <strong>1 of 4</strong>
                      </Txt>
                      <Txt size={12} weight={900} color="#2EC4B6">{aiPct}%</Txt>
                    </div>

                    <div style={{ width: "100%", height: 8, background: isDark ? "#334155" : "#e2e8f0", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
                      <div style={{ width: `${aiPct}%`, height: "100%", background: "#2EC4B6", borderRadius: 4 }} />
                    </div>
                    
                    <Txt size={11} color="#B8A0FF" style={{ display: "block", marginTop: 4, fontWeight: 700 }}>
                      ⭐ XP Earned: {Math.min(currentXP, 450)} XP
                    </Txt>
                  </div>
                </div>

                {/* ACADEMY 2: CYBER */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", opacity: 0.65 }}>
                  <div style={{ fontSize: 24, background: "rgba(148,163,184,0.1)", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    🔒
                  </div>
                  <div style={{ flex: 1 }}>
                    <Heading size={14.5} style={{ color: isDark ? "#cbd5e1" : "#475569", fontWeight: 800 }}>Cybersecurity & Safety</Heading>
                    <Txt size={11} color="#eab308" style={{ display: "block", marginTop: 2, fontWeight: 900 }}>
                      Coming Soon (Locked)
                    </Txt>
                  </div>
                </div>

                {/* ACADEMY 3: DESIGN */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", opacity: 0.65 }}>
                  <div style={{ fontSize: 24, background: "rgba(148,163,184,0.1)", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    🎨
                  </div>
                  <div style={{ flex: 1 }}>
                    <Heading size={14.5} style={{ color: isDark ? "#cbd5e1" : "#475569", fontWeight: 800 }}>Design & Creation</Heading>
                    <Txt size={11} color="#eab308" style={{ display: "block", marginTop: 2, fontWeight: 900 }}>
                      Coming Soon (Locked)
                    </Txt>
                  </div>
                </div>

                {/* ACADEMY 4: INNOVATION */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", opacity: 0.65 }}>
                  <div style={{ fontSize: 24, background: "rgba(148,163,184,0.1)", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    🚀
                  </div>
                  <div style={{ flex: 1 }}>
                    <Heading size={14.5} style={{ color: isDark ? "#cbd5e1" : "#475569", fontWeight: 800 }}>Career & Innovation</Heading>
                    <Txt size={11} color="#eab308" style={{ display: "block", marginTop: 2, fontWeight: 900 }}>
                      Coming Soon (Locked)
                    </Txt>
                  </div>
                </div>

              </div>
            </div>

            {/* LEARNING STREAK */}
            <div 
              style={{
                background: isDark ? "#1e293b" : "#ffffff",
                border: `2px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                borderRadius: 24,
                padding: "20px 18px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Heading size={17} style={{ fontWeight: 800 }}>
                  🔥 Learning Streak
                </Heading>
                <Txt size={11} color="#ef4444" weight={800}>
                  BEST: {bestStreak} DAYS
                </Txt>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginBottom: 16 }}>
                {calendarDays.map((day, idx) => (
                  <div 
                    key={idx}
                    style={{
                      textAlign: "center",
                      flex: 1,
                      padding: "8px 2px",
                      borderRadius: 12,
                      background: day.isCompleted ? "rgba(239, 68, 68, 0.12)" : "rgba(148,163,184,0.06)",
                      border: day.isToday ? "2px solid #ef4444" : "1px solid transparent"
                    }}
                  >
                    <Txt size={10} color={isDark ? "#cbd5e1" : "#64748b"} style={{ display: "block", fontWeight: 800 }}>
                      {day.dayName}
                    </Txt>
                    <span style={{ fontSize: 13, display: "block", marginTop: 4 }}>
                      {day.isCompleted ? "🔥" : "⚪"}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Txt size={11.5} weight={800} color={isDark ? "#94a3b8" : "#64748b"} style={{ textTransform: "uppercase", letterSpacing: 1.2 }}>
                  🎁 Streak Milestones
                </Txt>
                
                {/* 3 Days Milestone */}
                <div 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: isDark ? "#0f172a" : "#f8fafc",
                    borderRadius: 14,
                    border: "1px solid rgba(239, 68, 68, 0.1)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🎁</span>
                    <div>
                      <Txt size={12.5} weight={800}>3 Days Streak</Txt>
                      <Txt size={10.5} color="#ca8a04" style={{ display: "block" }}>+20 XP Bonus</Txt>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClaimMilestone("3-Days-Reward", 20)}
                    disabled={claimedMilestones.includes("3-Days-Reward") || streak < 3}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 10,
                      border: "none",
                      fontSize: 11,
                      fontWeight: 900,
                      cursor: "pointer",
                      background: claimedMilestones.includes("3-Days-Reward") ? "#10b98122" : streak >= 3 ? "#FFD166" : "#cbd5e1",
                      color: claimedMilestones.includes("3-Days-Reward") ? "#10b981" : "#1e293b",
                    }}
                  >
                    {claimedMilestones.includes("3-Days-Reward") ? "✓ Claimed" : streak >= 3 ? "CLAIM!" : "🔒 Lock"}
                  </button>
                </div>

                {/* 7 Days Milestone */}
                <div 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textAlign: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: isDark ? "#0f172a" : "#f8fafc",
                    borderRadius: 14,
                    border: "1px solid rgba(239, 68, 68, 0.1)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🎁</span>
                    <div>
                      <Txt size={12.5} weight={800}>7 Days Streak</Txt>
                      <Txt size={10.5} color="#ca8a04" style={{ display: "block" }}>+50 XP Bonus</Txt>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClaimMilestone("7-Days-Reward", 50)}
                    disabled={claimedMilestones.includes("7-Days-Reward") || streak < 7}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 10,
                      border: "none",
                      fontSize: 11,
                      fontWeight: 900,
                      cursor: "pointer",
                      background: claimedMilestones.includes("7-Days-Reward") ? "#10b98122" : streak >= 7 ? "#FFD166" : "#cbd5e1",
                      color: claimedMilestones.includes("7-Days-Reward") ? "#10b981" : "#1e293b",
                    }}
                  >
                    {claimedMilestones.includes("7-Days-Reward") ? "✓ Claimed" : streak >= 7 ? "CLAIM!" : "🔒 Lock"}
                  </button>
                </div>

                {/* 14 Days Milestone */}
                <div 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: isDark ? "#0f172a" : "#f8fafc",
                    borderRadius: 14,
                    opacity: streak >= 14 ? 1 : 0.65
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🔓</span>
                    <div>
                      <Txt size={12.5} color={streak >= 14 ? undefined : "#94a3b8"} weight={800}>14 Days Streak</Txt>
                      <Txt size={10.5} color="#94a3b8" style={{ display: "block" }}>+100 XP Quantum Chest</Txt>
                    </div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 900, color: "#94a3b8" }}>
                    🔒 locked
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* DYNAMIC DRILL-DOWN MODAL */}
      {selectedCertificate && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 640,
              background: isDark ? "#1e293b" : "#ffffff",
              border: "4px solid #B8A0FF",
              borderRadius: 32,
              padding: 24,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
              position: "relative"
            }}
          >
            {/* Modal Exit */}
            <button
              onClick={() => {
                sfx.playTap();
                setSelectedCertificate(null);
                setDownloadStep("idle");
              }}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: isDark ? "rgba(255,255,255,0.08)" : "#cbd5e133",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                color: isDark ? "#fff" : "#1e293b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16
              }}
            >
              ✕
            </button>

            {/* CERTIFICATE DISPLAY CANVAS */}
            <div 
              id="clats-gold-certificate"
              style={{
                background: isDark ? "#0f172a" : "#FFFDF6",
                border: "6px double #FFD166",
                margin: "12px 0 20px",
                borderRadius: 20,
                padding: "36px 24px",
                textAlign: "center",
                boxShadow: "inset 0 0 24px rgba(255,209,102,0.1)"
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 12, display: "inline-block", color: "#FFD166" }}>
                🎖️
              </div>
              
              <h1 style={{ fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: isDark ? "#B8A0FF" : "#1e293b", margin: "0 0 4px" }}>
                CLATS FUTURE-TECH ACADEMY
              </h1>
              <span style={{ fontSize: 11, fontStyle: "italic", color: "#64748b", textTransform: "uppercase", letterSpacing: 2 }}>
                Certificate of Academic Excellence
              </span>

              <div style={{ height: "1.5px", background: "linear-gradient(90deg, transparent, #FFD166, transparent)", margin: "16px auto", width: "80%" }} />

              <p style={{ fontSize: 13, color: isDark ? "#cbd5e1" : "#475569", margin: "0 0 10px" }}>
                This is proudly and formally presented to:
              </p>
              
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#2EC4B6", fontStyle: "italic", margin: "0 0 12px" }}>
                Captain {child.name || "Explorer"}
              </h2>

              <p style={{ fontSize: 13, color: isDark ? "#cbd5e1" : "#475569", maxWidth: "450px", margin: "0 auto", lineHeight: 1.5 }}>
                For outstanding dedication, intellectual capability, and successful qualification of requirements for the premium category course
              </p>

              <h3 style={{ fontSize: 17, fontWeight: 900, color: "#B8A0FF", textTransform: "uppercase", margin: "12px 0 24px" }}>
                🏆 {selectedCertificate.name}
              </h3>

              {/* Signatures */}
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-around", 
                  alignItems: "center", 
                  fontSize: 12, 
                  color: "#64748b",
                  marginTop: 20
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontStyle: "italic", fontWeight: 700, color: isDark ? "#ffffff" : "#1e293b", marginBottom: 2 }}>Kobe Mascot</div>
                  <div style={{ borderTop: "1.5px solid #cbd5e1", width: 90, margin: "0 auto", padding: 2 }}>Tech Instructor</div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, color: "#FFD166" }}>★ SEALD ★</div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontStyle: "italic", fontWeight: 700, color: isDark ? "#ffffff" : "#1e293b", marginBottom: 2 }}>Chibi Mascot</div>
                  <div style={{ borderTop: "1.5px solid #cbd5e1", width: 90, margin: "0 auto", padding: 2 }}>Guide Counselor</div>
                </div>
              </div>
            </div>

            {/* DOWNLOAD STAGES */}
            {downloadStep !== "idle" && (
              <div 
                style={{
                  background: isDark ? "rgba(0,0,0,0.3)" : "#f1f5f9",
                  borderRadius: 16,
                  padding: "12px 16px",
                  marginBottom: 16
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Txt size={11.5} weight={800} color={isDark ? "#b8a0ff" : "#6b21a8"}>
                    {downloadStep === "generating" && "⚙️ ENCRYPTING LEDGER SIGNATURES..."}
                    {downloadStep === "downloading" && "📥 EXPORTING HIGH-FIDELITY IMAGE..."}
                    {downloadStep === "ready" && "✅ CERTIFICATE IMAGE SAVED SUCCESSFULLY!"}
                  </Txt>
                  <Txt size={11.5} weight={900}>{downloadProgress}%</Txt>
                </div>
                <div style={{ width: "100%", height: 8, background: isDark ? "#334155" : "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${downloadProgress}%`, height: "100%", background: "#B8A0FF", borderRadius: 4 }} />
                </div>
              </div>
            )}

            {/* ACTION TRAFFIC SYSTEM BUTTONS */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              
              <div style={{ display: "flex", gap: 10 }}>
                {downloadStep !== "ready" ? (
                  <button
                    onClick={handleDownloadCertificate}
                    disabled={downloadStep === "generating" || downloadStep === "downloading"}
                    style={{
                      flex: 1,
                      background: "linear-gradient(135deg, #B8A0FF, #7c3aed)",
                      border: "none",
                      borderBottom: "4px solid #5b21b6",
                      borderRadius: 16,
                      color: "#ffffff",
                      padding: "14px",
                      fontSize: 14,
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontFamily: F.display
                    }}
                  >
                    <Download size={16} /> 
                    {downloadStep === "idle" ? "Download Image Certificate" : "Rendering Diploma..."}
                  </button>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "2px solid #10b981",
                      borderRadius: 16,
                      color: "#10b981",
                      padding: "12px",
                      fontSize: 13,
                      fontWeight: 900,
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    🚀 Certificate image downloaded! Check downloads folder!
                  </div>
                )}

                <button
                  onClick={handleShareCertificate}
                  style={{
                    background: isDark ? "#1e293b" : "#f1f5f9",
                    border: `1.5px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                    borderRadius: 16,
                    padding: "0 18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title="Share Achievement"
                >
                  <Share2 size={16} className="text-slate-500" />
                </button>
              </div>

              {shareFeedback && (
                <div 
                  style={{ 
                    padding: "10px 12px", 
                    borderRadius: 12, 
                    background: "rgba(46,196,182,0.1)", 
                    border: "1.5px solid #2EC4B6",
                    textAlign: "center"
                  }}
                >
                  <Txt size={11.5} color={isDark ? "#fff" : "#1f8279"} weight={800}>
                    {shareFeedback}
                  </Txt>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
