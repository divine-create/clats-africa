/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Child, Language } from "../types";
import { C, F, T, getLevel as getLevelConfig, getParentLimits } from "../utils/config";
import { CURRICULUM } from "../data/curriculum";
import { MascotImage } from "./Onboarding";
import { sfx } from "../utils/audio";
import { calculateStudyAnalytics } from "../utils/timeTracker";
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
  ArrowRight,
  Edit2,
  CheckCircle,
  Calendar,
  Zap,
  TrendingUp,
  Volume2,
  VolumeX,
  Compass,
  Shield,
  HelpCircle,
  Target,
  Palette,
  Info
} from "lucide-react";
import { downloadCertificateImage } from "../utils/pdfGenerator";

interface ChildProgressScreenProps {
  child: Child;
  onBack: () => void;
  lang: Language;
  parentEmail: string;
  onUpdateChild?: (updated: Child) => void;
  theme?: "light" | "dark";
  onTabChange?: (tab: any) => void;
}

export const ChildProgressScreen: React.FC<ChildProgressScreenProps> = ({
  child,
  onBack,
  lang,
  parentEmail,
  onUpdateChild,
  theme,
  onTabChange
}) => {
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return theme === "dark" || document.body.classList.contains("dark-theme") || localStorage.getItem("clats_theme") === "dark";
    }
    return theme === "dark";
  });

  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!child?.id) return;
    fetch(`/api/supabase/sessions/child/${child.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setSessions(data.sessions || []);
        }
      })
      .catch((err) => console.error("Error fetching child sessions in progress screen:", err));
  }, [child?.id]);

  const studyAnalytics = React.useMemo(() => calculateStudyAnalytics(sessions), [sessions]);

  useEffect(() => {
    if (theme) {
      setIsDark(theme === "dark");
    }
  }, [theme]);

  // Global variables & core math
  const currentXP = child.xp || 0;
  const completed = child.completed || {};
  const completedCount = Object.keys(completed).filter(k => completed[k]).length;
  
  const starsRecord = (child.stars || {}) as Record<string, number>;
  const totalStars = Object.values(starsRecord).reduce((sum: number, val: number) => sum + val, 0);

  const course = CURRICULUM[child.ageGroup] || CURRICULUM["young innovators"];
  const modules = course ? course.modules : [];
  const totalLessonsCount = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  // Quizzes count
  const quizResults = (child.quizResults || {}) as Record<string, any>;
  const quizzesPassed = Object.values(quizResults).filter((r: any) => r && r.status === "Passed").length;
  const perfectQuizzes = Object.values(quizResults).filter((r: any) => r && r.score === r.totalQuestions && r.totalQuestions > 0).length;

  // Level bands configuration
  const levelBands = [
    { level: 1, name: "Curious Learner", minXp: 0, maxXp: 299 },
    { level: 2, name: "Technology Explorer", minXp: 300, maxXp: 599 },
    { level: 3, name: "AI Adventurer", minXp: 600, maxXp: 999 },
    { level: 4, name: "AI Explorer", minXp: 1000, maxXp: 1499 },
    { level: 5, name: "Future Builder", minXp: 1500, maxXp: 2499 },
    { level: 6, name: "Innovation Champion", minXp: 2500, maxXp: 4999 },
    { level: 7, name: "CLATS Ambassador", minXp: 5000, maxXp: 100000 },
  ];

  const currentLevelBand = levelBands.find(b => currentXP >= b.minXp && currentXP <= b.maxXp) || levelBands[levelBands.length - 1];
  const levelNum = currentLevelBand.level;
  const levelName = currentLevelBand.name;

  const xpMin = currentLevelBand.minXp;
  const xpMax = currentLevelBand.maxXp === 100000 ? 5000 : currentLevelBand.maxXp;
  const range = xpMax - xpMin;
  const progressInLevel = currentXP - xpMin;
  const lProgressPct = currentLevelBand.level === 7 ? 100 : Math.min(100, Math.max(0, (progressInLevel / range) * 100));

  // Streak state
  const streak = child.streak_count || 0;
  const bestStreak = child.best_streak || child.streak_count || 0;

  // Track claimed reward milestones to prevent multiple claims
  const [claimedMilestones, setClaimedMilestones] = useState<string[]>(() => {
    if (completedCount === 0) return [];
    try {
      const val = localStorage.getItem(`clats_profile_claims_${child.id}`);
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  });

  // Chosen Avatar frame & decoration stored in local Fallback
  const [selectedFrame, setSelectedFrame] = useState<string>(() => {
    return localStorage.getItem(`clats_selected_frame_${child.id}`) || "none";
  });

  // State managers
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(child.name);
  const [tempAvatar, setTempAvatar] = useState(child.avatar);
  const [tempFrame, setTempFrame] = useState(selectedFrame);

  // Certificate Modal State
  const [activeDiploma, setActiveDiploma] = useState<any | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStep, setDownloadStep] = useState<"idle" | "running" | "done">("idle");
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // General Settings toggles
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [accessibilityZoom, setAccessibilityZoom] = useState(false);
  const [prefNotification, setPrefNotification] = useState(true);

  // Inclusive Accessibility Suite toggles
  const [voiceReaderOn, setVoiceReaderOn] = useState(false);
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [colorMode, setColorMode] = useState<"normal" | "accessible" | "night">("normal");
  const [dyslexicMode, setDyslexicMode] = useState(false);
  const [fontSizePref, setFontSizePref] = useState<"normal" | "large" | "extra">("normal");
  const [reducedMotion, setReducedMotion] = useState(false);

  // Track AI module lesson progress across ALL AI modules (Academy 1)
  const prefix = child.ageGroup === "early explorers" ? "t-a1" : child.ageGroup === "future builders" ? "p-a1" : "j-a1";
  const oldPrefix = child.ageGroup === "early explorers" ? "t-m" : child.ageGroup === "future builders" ? "p-m" : "j-m";
  const aiModules = modules.filter(m => m.id.startsWith(prefix) || m.id.startsWith(oldPrefix));
  const totalAiLessonsCount = aiModules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedAiLessonsCount = aiModules.reduce((acc, m) => {
    return acc + m.lessons.filter((l: any) => completed[l.id || l]).length;
  }, 0);
  const aiProgressPct = Math.round((completedAiLessonsCount / (totalAiLessonsCount || 1)) * 100);

  // Determine current lesson focusing on
  const findCurrentFocus = () => {
    if (!modules || modules.length === 0) return null;
    for (const m of modules) {
      for (const l of m.lessons) {
        if (!completed[l.id]) {
          return { module: m, lesson: l };
        }
      }
    }
    // All done! Fallback to last
    const lastM = modules[modules.length - 1];
    const lastL = lastM?.lessons[lastM.lessons.length - 1];
    return { module: lastM, lesson: lastL };
  };

  const activeFocus = findCurrentFocus();

  // STICKER SHEETS FOR TINY AGES 2-5
  const adventureStickers = [
    { id: "koala", emoji: "🐨", name: "Playful Koala", desc: "Unlock by beginning your adventure!", unlocked: true, color: "from-amber-400 to-yellow-500" },
    { id: "whale", emoji: "🐳", name: "Ocean Explorer", desc: "Earned by completing 1+ lessons!", unlocked: completedCount >= 1, color: "from-teal-400 to-emerald-500" },
    { id: "dinotech", emoji: "Rex", name: "Dino-Coder", desc: "Earned by completing 2+ lessons!", unlocked: completedCount >= 2, color: "from-purple-400 to-violet-600" },
    { id: "leader_lion", emoji: "🦁", name: "Leader Lion", desc: "Earned by keeping learning streaks!", unlocked: streak >= 5, color: "from-rose-400 to-red-500" },
    { id: "rocket", emoji: "🚀", name: "Apex Rocket", desc: "Unlock on gaining 500+ XP!", unlocked: currentXP >= 500, color: "from-blue-400 to-indigo-600" },
    { id: "star_badge2", emoji: "⭐", name: "Super Star", desc: "Unlock with 5+ Stars!", unlocked: totalStars >= 5, color: "from-[#FFD166] to-amber-500" },
  ];
  const earnedStickersCount = adventureStickers.filter(s => s.unlocked).length;

  // BADGES FOR AGES 6-12
  const badgesData = [
    { id: "first-completed", name: "First Lesson Completed", desc: "Complete your first lesson and set sail.", unlocked: completedCount >= 1, icon: "🏅", color: "text-[#2EC4B6] border-[#2EC4B6]" },
    { id: "quiz-champ", name: "Quiz Champion", desc: "Score 100% on any futuristic lesson quiz.", unlocked: perfectQuizzes > 0, icon: "🏆", color: "text-[#FFD166] border-[#FFD166]" },
    { id: "ai-explorer", name: "AI Explorer Badge", desc: "Complete 2+ AI Academy modules or lessons.", unlocked: completedAiLessonsCount >= 2, icon: "🤖", color: "text-indigo-400 border-indigo-400" },
    { id: "streak-consistent", name: "Consistency Star", desc: "Maintain a learning streak of 7+ days.", unlocked: streak >= 7, icon: "🔥", color: "text-rose-500 border-rose-400" },
    { id: "future-thinker", name: "Future Thinker", desc: "Amass a balance of 500+ XP in your wallet.", unlocked: currentXP >= 500, icon: "🌟", color: "text-amber-400 border-amber-300" },
    { id: "smart-learner", name: "Smart Learner", desc: "Complete 5 lessons total in curriculum.", unlocked: completedCount >= 5, icon: "🧩", color: "text-[#B8A0FF] border-[#B8A0FF]" }
  ];
  const earnedBadgesCount = badgesData.filter(b => b.unlocked).length;

  // CERTIFICATES Log
  const certificatesList = [
    { id: "ai-foundations", name: "AI Foundations Certificate", desc: "Demonstrated master capability of AI concepts, neural nodes and machines.", requirement: "Complete 2+ AI Lessons", date: "Earned Recently", unlocked: completedAiLessonsCount >= 2, icon: "🤖" },
    { id: "ai-explorer", name: "AI Explorer Diploma", desc: "Achieved substantial high level milestone and tech logic credentials.", requirement: "Reach 500+ XP", date: "Earned Recently", unlocked: currentXP >= 500, icon: "📜" },
    { id: "digital-literacy", name: "Digital Literacy Diploma", desc: "Engaged in safe interactive digital logic and creative design guidelines.", requirement: "Complete 4+ Lessons", date: "Earned Recently", unlocked: completedCount >= 4, icon: "🌟" },
    { id: "cyber-safety", name: "Cyber Safety Specialist", desc: "Coming soon - complete Cybersecurity & Cryptography modules to unlock.", requirement: "Incomplete Modules", date: "Locked", unlocked: false, icon: "🔒" },
  ];
  const earnedCertsCount = certificatesList.filter(c => c.unlocked).length;

  // Dynamic Avatar frame descriptions and lock states
  const framesList = [
    { id: "none", name: "No Frame Default", design: "border-gray-200 dark:border-slate-700", label: "Free Default", unlocked: true },
    { id: "ai-explorer", name: "🤖 AI Explorer Frame", design: "border-[#2EC4B6] ring-4 ring-[#2EC4B6]/20 shadow-[0_0_15px_rgba(46,196,182,0.4)]", label: "Unlock at 500+ XP", unlocked: currentXP >= 500 },
    { id: "creative", name: "🎨 Creative Builder Frame", design: "border-[#B8A0FF] ring-4 ring-[#B8A0FF]/20 shadow-[0_0_15px_rgba(184,160,255,0.4)]", label: "Unlock on 4+ Lessons Done", unlocked: completedCount >= 4 },
    { id: "innovation", name: "🚀 Innovation Champion Frame", design: "border-[#FFD166] ring-4 ring-[#FFD166]/20 shadow-[0_0_15px_rgba(255,209,102,0.5)]", label: "Unlock on Level 4+", unlocked: levelNum >= 4 }
  ];

  // Helper avatar options
  const avatarPresets = ["🧑‍🚀", "🤖", "🦄", "🦖", "🦁", "🐳", "🦊", "🐱", "🐻", "🦉", "🐝", "🐙", "🐼", "🐸", "🐶", "🐒"];

  // Activity feed constructor
  const recentActivities = [
    { id: "act-1", text: completedCount >= 1 ? `Completed futuristic lesson task!` : "Began onboarding journey in CLATS!", type: "check", time: "Today" },
    { id: "act-2", text: levelNum > 1 ? `Leveled up to Level ${levelNum}: ${levelName}` : "Level 1: Curious Learner activated!", type: "level", time: "This week" },
    { id: "act-3", text: quizzesPassed > 0 ? `Passed lesson assessment quiz with success!` : "First quiz test pending", type: "quiz", time: "This week" },
    { id: "act-4", text: earnedBadgesCount > 0 ? `Unlocked badge: ${badgesData.find(b => b.unlocked)?.name || "First Step"}` : "Unlocking badges...", type: "badge", time: "This week" },
  ];

  // Claim streak milestone reward
  const handleClaimStreakReward = (id: string, requiredDays: number, bonusXP: number) => {
    if (streak < requiredDays) return;
    if (claimedMilestones.includes(id)) return;

    if (soundEnabled) sfx.playLevelUp();
    const nextClaims = [...claimedMilestones, id];
    setClaimedMilestones(nextClaims);
    localStorage.setItem(`clats_profile_claims_${child.id}`, JSON.stringify(nextClaims));

    if (onUpdateChild) {
      onUpdateChild({
        ...child,
        xp: currentXP + bonusXP
      });
    }
  };

  // Profile Save handler
  const handleSaveProfileCustomization = () => {
    if (soundEnabled) sfx.playCoin();
    localStorage.setItem(`clats_selected_frame_${child.id}`, tempFrame);
    setSelectedFrame(tempFrame);

    if (onUpdateChild) {
      onUpdateChild({
        ...child,
        name: tempName || child.name,
        avatar: tempAvatar || child.avatar
      });
    }
    setIsEditingProfile(false);
  };

  // Certificate triggers
  const handleOpenCertificate = (cert: any) => {
    if (soundEnabled) sfx.playLevelUp();
    setActiveDiploma(cert);
    setDownloadProgress(0);
    setDownloadStep("idle");
    setShareFeedback(null);
  };

  const handleDownloadDiploma = () => {
    if (soundEnabled) sfx.playTap();
    setDownloadStep("running");
    setDownloadProgress(0);

    const intv = setInterval(() => {
      setDownloadProgress(p => {
        if (p >= 100) {
          clearInterval(intv);
          setDownloadStep("done");
          if (soundEnabled) sfx.playCoin();
          // Trigger the real image screenshot download
          if (activeDiploma) {
            (async () => {
              await downloadCertificateImage(activeDiploma.name);
            })();
          }
          return 100;
        }
        return p + 20;
      });
    }, 240);
  };

  const handleShareDiploma = (name: string) => {
    if (soundEnabled) sfx.playTap();
    try {
      navigator.clipboard.writeText(`🎉 Proud parents announcement! My child just completed their CLATS Future-Ready curriculum module and earned the "${name}"! Check out the leading kid-tech app. 🚀🎓`);
      setShareFeedback("📋 Achievement message copied! Ready to share via WhatsApp, Twitter or SMS.");
    } catch {
      setShareFeedback("📋 Message copied!");
    }
    setTimeout(() => {
      setShareFeedback(null);
    }, 4000);
  };

  // Live real-world calendar calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = monthNames[currentMonth];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // Sunday=0, Monday=1, ...

  // Generate calendar dates representing the real-world current month based on actual completion dates or active streaks!
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    
    // Check if the student completed any lesson on this date
    const dateStrPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    
    const completedOnThisDay = Object.values(child.quizResults || {}).some((q: any) => {
      return q.completedAt && q.completedAt.startsWith(dateStrPrefix);
    });

    // Also count days within the current active streak ending today
    const withinStreak = dayNum <= currentDay && dayNum >= currentDay - streak + 1 && streak > 0;

    return { 
      day: dayNum, 
      active: completedOnThisDay || withinStreak
    };
  });

  // Mascot dynamic advice quote
  const getMascotChat = () => {
    if (child.ageGroup === "early explorers") {
      return {
        mascot: (child.companion || "kobe") as "kobe" | "chibi",
        title: child.companion === "kobe" ? "KOBE CHIRP" : "CHIBI CHIRP",
        quote: "You have sticker album collections! Do more tasks to get fun stickers! 🦈"
      };
    }
    if (child.ageGroup === "future builders") {
      return {
        mascot: (child.companion || "kobe") as "kobe" | "chibi",
        title: child.companion === "kobe" ? "KOBE CHIRP" : "CHIBI PILOT",
        quote: "Looking professional! Your certificate portfolio is growing. Practice cybersecurity logic to dominate future roles!"
      };
    }
    return {
      mascot: child.companion || "chibi",
      title: child.companion === "kobe" ? "KOBE LOGIC" : "CHIBI WAVE",
      quote: currentXP < 500 
        ? "Awesome start! Earn 500 total XP to unlock your shiny AI Explorer Frame! 🚀"
        : "You are climbing high levels! One more quiz masterscore to solidify your Rank!"
    };
  };

  const activeMascotTalk = getMascotChat();

  return (
    <div
      id="clats-child-profile-hq"
      className="clats-profile-scaled"
      style={{
        padding: "24px 16px 120px",
        background: isDark ? "#080c14" : "#ffffff",
        minHeight: "100vh",
        color: isDark ? "#f8fafc" : "#1e293b",
        fontFamily: F.body,
        fontSize: accessibilityZoom ? "17px" : "15px",
        transition: "all 0.3s ease"
      }}
    >
      <div className="max-w-6xl mx-auto">

        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">👤</span>
              <h1 className="text-3xl font-black text-[#2EC4B6] tracking-tight">
                My Profile
              </h1>
            </div>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Track your learning journey and celebrate your progress.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-transform active:scale-95 ${
                isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              ← Back to Map
            </button>
            <div className="bg-[#2EC4B6]/10 text-[#2EC4B6] font-extrabold text-xs px-3 py-1.5 rounded-full border border-[#2EC4B6]/20">
              🟢 Live Parent Sync Safe
            </div>
          </div>
        </div>

        {/* COMPANION TALK */}
        <div className={`p-4 rounded-2xl mb-8 flex items-center gap-4 border transition-all hover:scale-[1.01] ${
          isDark ? "bg-slate-900/50 border-slate-800" : "bg-[#2EC4B6]/5 border-[#2EC4B6]/10"
        }`}>
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center p-1 shadow-sm shrink-0 border-2 border-[#FFD166]">
            <MascotImage character={activeMascotTalk.mascot} height={48} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#FFD166] tracking-widest uppercase mb-0.5">
              {activeMascotTalk.title}
            </div>
            <div className={`italic text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
              "{activeMascotTalk.quote}"
            </div>
          </div>
        </div>

        {/* TWO COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: HERO IDENTITY CARD, ROADMAPS & SPECIFICS (col-span-12 or 8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* LARGE IDENTITY PROFILE CARD */}
            <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all duration-300 ${
              isDark ? "bg-slate-900 border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-lg"
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2EC4B6]/5 rounded-bl-full pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                {/* Visual Frame Render */}
                <div className="relative">
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-4 transition-all duration-300 ${
                    framesList.find(f => f.id === selectedFrame)?.design || "border-slate-300"
                  }`}>
                    <span className="text-6xl select-none">{child.avatar}</span>
                  </div>
                  
                  {/* Decorative tag for chosen custom frame */}
                  {selectedFrame !== "none" && (
                    <div className="absolute -bottom-1 -right-1 bg-[#FFD166] text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                      {selectedFrame === "ai-explorer" ? "AI NODE" : selectedFrame === "creative" ? "ARTIST" : "CHAMP"}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-col sm:flex-row items-center gap-2 justify-center sm:justify-start">
                    <h2 className="text-3xl font-black tracking-tight">{child.name}</h2>
                    <span className="scale-95">
                      {child.ageGroup === "early explorers" && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-black border border-amber-200">
                          🌈 Early Explorer
                        </span>
                      )}
                      {child.ageGroup === "young innovators" && (
                        <span className="bg-cyan-100 text-cyan-800 text-xs px-2.5 py-1 rounded-full font-black border border-cyan-200">
                          🚀 Young Innovator
                        </span>
                      )}
                      {child.ageGroup === "future builders" && (
                        <span className="bg-purple-100 text-purple-850 text-xs px-2.5 py-1 rounded-full font-black border border-purple-200">
                          🎯 Future Builder
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-extrabold bg-slate-100 dark:bg-slate-850 px-3 py-1.5 rounded-lg">
                      <Trophy size={14} className="text-[#FFD166]" />
                      <span>Level {levelNum}: <strong className="text-[#B8A0FF]">{levelName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-extrabold bg-slate-100 dark:bg-slate-850 px-3 py-1.5 rounded-lg">
                      <Star size={14} className="text-amber-500" />
                      <span>{currentXP} XP Wallet</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-extrabold bg-slate-100 dark:bg-slate-850 px-3 py-1.5 rounded-lg">
                      <Flame size={14} className="text-rose-500 animate-pulse" />
                      <span>{streak} Day Streak</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      onClick={() => {
                        if (soundEnabled) sfx.playTap();
                        setTempName(child.name);
                        setTempAvatar(child.avatar);
                        setTempFrame(selectedFrame);
                        setIsEditingProfile(true);
                      }}
                      className="inline-flex items-center gap-1 bg-[#2EC4B6] hover:bg-[#20877d] text-white text-xs font-black px-4 py-2 rounded-xl border-b-4 border-[#1c786e] active:border-b-0 active:translate-y-[4px] transition-all"
                    >
                      <Edit2 size={12} /> Edit Avatar & Frames
                    </button>
                    <button
                      onClick={() => {
                        if (soundEnabled) sfx.playTap();
                        const badgesSection = document.getElementById("profile-badges-landmark");
                        if (badgesSection) badgesSection.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`inline-flex items-center gap-1 text-xs font-black px-4 py-2 rounded-xl border-b-4 transition-all ${
                        isDark 
                          ? "bg-slate-800 border-slate-900 hover:bg-slate-700 text-slate-200" 
                          : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      🏅 View Achievements
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AGE GROUP VISUAL ADAPTATIONS */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-[#B8A0FF] uppercase tracking-wider block">
                Learner Stage Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { tag: "early explorers", label: "Early Explorer", emoji: "🌈", style: "border-amber-300 bg-amber-500/5 text-amber-500" },
                  { tag: "young innovators", label: "Young Innovator", emoji: "🚀", style: "border-[#2EC4B6] bg-[#2EC4B6]/5 text-[#2EC4B6]" },
                  { tag: "future builders", label: "Future Builder", emoji: "🎯", style: "border-[#B8A0FF] bg-[#B8A0FF]/5 text-[#B8A0FF]" }
                ].map((item) => {
                  const isActive = child.ageGroup === item.tag;
                  return (
                    <div
                      key={item.tag}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        isActive 
                          ? `${item.style} border-2 scale-100 shadow-sm font-black` 
                          : "border-slate-300/40 dark:border-slate-850/40 text-slate-400 opacity-40 select-none"
                      }`}
                    >
                      <div className="text-3xl mb-1">{item.emoji}</div>
                      <div className="text-xs font-extrabold uppercase">{item.label}</div>
                      {isActive && (
                        <span className="inline-block mt-2 bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                          ACTIVE CURRENT
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* XP LEVEL DETAIL & MILESTONE LANDSCAPE CARDS */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <span>🏆</span> My Level XP Roadmap
                </h3>
                <span className="text-xs font-extrabold text-[#B8A0FF] bg-[#B8A0FF]/15 px-2.5 py-1 rounded-full">
                  LEVEL {levelNum}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-baseline text-xs font-bold text-slate-400">
                  <span>Current XP Progress</span>
                  <span>
                    <strong className="text-amber-500 text-sm font-black">{currentXP}</strong> / {xpMax} XP
                  </span>
                </div>

                {/* Custom Gradient Progress Bar */}
                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-[#2EC4B6] to-[#B8A0FF] rounded-full transition-all duration-500"
                    style={{ width: `${lProgressPct}%` }}
                  />
                </div>

                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  {levelNum === 7 ? (
                    "🎉 Sensational! You have mounted the pinnacle level: CLATS Ambassador Rank! Keep shining!"
                  ) : (
                    <>
                      🎯 Advance <strong className="text-[#2EC4B6]">{xpMax - currentXP}</strong> more XP to claim <strong>Level {levelNum + 1}</strong>!
                    </>
                  )}
                </div>

                {/* Horizon Track Levels list */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex overflow-x-auto gap-3 pb-2 scrollbar-none">
                  {levelBands.map((band) => {
                    const isPassedVal = currentXP >= band.minXp;
                    const isCurrentVal = band.level === levelNum;
                    return (
                      <div
                        key={band.level}
                        className={`min-w-[100px] p-2.5 rounded-xl border text-center shrink-0 ${
                          isCurrentVal 
                            ? "border-[#2EC4B6] bg-[#2EC4B6]/5" 
                            : isPassedVal 
                              ? "border-[#B8A0FF]/30 dark:border-purple-900/30" 
                              : "border-slate-200 dark:border-slate-800 opacity-40"
                        }`}
                      >
                        <div className={`text-lg mb-1 ${!isPassedVal && "grayscale opacity-50"}`}>
                          {band.level === 1 ? "👶" : band.level === 2 ? "🚀" : band.level === 3 ? "🧠" : band.level === 4 ? "🤖" : band.level === 5 ? "🛠️" : band.level === 6 ? "👑" : "🏆"}
                        </div>
                        <div className="text-[10px] font-black text-slate-500 dark:text-slate-200">
                          Lvl {band.level}
                        </div>
                        <div className="text-[9px] font-bold text-[#B8A0FF] uppercase truncate leading-none mt-1">
                          {band.name.split(" ")[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* TINY STICKERS VS GENERAL ROADMAP */}
            {child.ageGroup === "early explorers" ? (
              <div className={`p-6 rounded-3xl border ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <div>
                    <h3 className="text-xl font-black text-amber-500 flex items-center gap-2">
                      <span>🌈</span> Adventure Stickers Album
                    </h3>
                    <p className="text-xs text-slate-400">
                      Complete learning modules to collect glowing sticker trophies!
                    </p>
                  </div>
                  <span className="bg-amber-500/10 text-amber-500 text-xs px-3 py-1 rounded-full font-black">
                    🐳 Collected: {earnedStickersCount} / {adventureStickers.length} Stickers
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {adventureStickers.map((stick) => (
                    <div
                      key={stick.id}
                      className={`p-3.5 rounded-2xl border text-center transition-transform hover:scale-105 duration-350 ${
                        stick.unlocked
                          ? (isDark ? "bg-slate-855 border-slate-700" : "bg-gradient-to-br from-amber-50/20 to-yellow-50/50 border-[#FFD166]")
                          : "border-dashed border-slate-200 dark:border-slate-800 opacity-45"
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-3xl shadow-sm ${
                        stick.unlocked ? `bg-gradient-to-br ${stick.color} text-white` : "bg-slate-100 dark:bg-slate-850 grayscale"
                      }`}>
                        {stick.emoji}
                      </div>
                      <div className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">
                        {stick.name}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 leading-tight">
                        {stick.desc}
                      </div>
                      {stick.unlocked ? (
                        <div className="text-[10px] text-emerald-500 font-extrabold mt-1.5 flex items-center justify-center gap-1 uppercase">
                          <Check size={8} strokeWidth={4} /> GOT IT!
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center justify-center gap-1 uppercase">
                          <Lock size={8} /> Lock
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* THE GENERAL 4 ACADEMIES ROADMAP */
              <div className={`p-6 rounded-3xl border ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-[#2EC4B6] flex items-center gap-2">
                      <span>🗺️</span> My Learning Journey
                    </h3>
                    <p className="text-xs text-slate-400">
                      Progress tracks of academies active in the CLATS futurist academy.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* ACADEMY 1: AI */}
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"
                  }`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl bg-[#2EC4B6]/10 p-1.5 rounded-lg text-[#2EC4B6]">🤖</span>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                            AI & Emerging Technologies
                          </h4>
                          <span className="bg-[#2EC4B6]/10 text-[#2EC4B6] text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            🚀 Rolling Out
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-xs font-black text-[#2EC4B6]">{aiProgressPct}% Done</div>
                        <div className="text-[10px] text-slate-400">
                          {completedAiLessonsCount} of {totalAiLessonsCount} Lessons Completed
                        </div>
                      </div>
                    </div>

                    {/* Progress slider bar */}
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full bg-[#2EC4B6] rounded-full transition-all"
                        style={{ width: `${aiProgressPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                      <span className="font-extrabold text-slate-400">
                        ⭐ XP Gained: {completedAiLessonsCount * 150} XP
                      </span>
                      <button
                        onClick={() => {
                          if (soundEnabled) sfx.playTap();
                          if (onTabChange) onTabChange("home");
                        }}
                        className="bg-gradient-to-r from-[#2EC4B6] to-[#0ea5e9] hover:from-[#28ad9f] hover:to-[#0284c7] text-white font-black px-5 py-2.5 rounded-xl text-sm transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        Continue Journey 🚀
                      </button>
                    </div>
                  </div>

                  {/* SEC 2: DIGITAL SECURITIES (COMING SOON) */}
                  <div className={`p-4 rounded-2xl border border-dashed text-slate-400 ${
                    isDark ? "bg-slate-900/10 border-slate-850" : "bg-slate-100/10 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-3 opacity-60">
                      <span className="text-2xl">🔒</span>
                      <div>
                        <h4 className="text-sm font-black">Digital Citizenship & Cybersecurity</h4>
                        <span className="text-[#B8A0FF] text-[9px] font-black uppercase">
                          🌟 Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SEC 3: CREATIVE CODES (COMING SOON) */}
                  <div className={`p-4 rounded-2xl border border-dashed text-slate-400 ${
                    isDark ? "bg-slate-900/10 border-slate-850" : "bg-slate-100/10 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-3 opacity-60">
                      <span className="text-2xl">🎨</span>
                      <div>
                        <h4 className="text-sm font-black">Design & Creation</h4>
                        <span className="text-[#B8A0FF] text-[9px] font-black uppercase">
                          🌟 Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SEC 4: CAREER ADAPTABILITY (COMING SOON) */}
                  <div className={`p-4 rounded-2xl border border-dashed text-slate-400 ${
                    isDark ? "bg-slate-900/10 border-slate-850" : "bg-slate-100/10 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-3 opacity-60">
                      <span className="text-2xl">{child.ageGroup === "future builders" ? "🚀" : "🌱"}</span>
                      <div>
                        <h4 className="text-sm font-black">
                          {child.ageGroup === "future builders" ? "Innovation & Career Readiness" : "Adaptability & Lifelong Learning"}
                        </h4>
                        <span className="text-[#B8A0FF] text-[9px] font-black uppercase">
                          🌟 Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>

                  {child.ageGroup === "future builders" && (
                    <div className={`p-4 rounded-2xl border border-dashed text-slate-400 ${
                      isDark ? "bg-slate-900/10 border-slate-850" : "bg-slate-100/10 border-slate-200"
                    }`}>
                      <div className="flex items-center gap-3 opacity-60">
                        <span className="text-2xl">🌱</span>
                        <div>
                          <h4 className="text-sm font-black">Adaptability & Lifelong Learning</h4>
                          <span className="text-[#B8A0FF] text-[9px] font-black uppercase">
                            🌟 Coming Soon
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* CURRENT LEARNING FOCUS ACTION PLAN */}
            {activeFocus && (
              <div className={`p-5 rounded-3xl border ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-[#2EC4B6]/5 border-[#2EC4B6]/15"
              }`}>
                <div className="flex items-center gap-2 text-xs font-black text-[#2EC4B6] uppercase tracking-widest mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2EC4B6] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2EC4B6]"></span>
                  </span>
                  <span>Current Study Focus</span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Academy: AI & Emerging Tech
                    </span>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                      {activeFocus.lesson.title[lang] || activeFocus.lesson.title.en}
                    </h3>
                    <p className="text-xs text-[#B8A0FF] font-black mt-1">
                      📚 Module Track: {activeFocus.module.name[lang] || activeFocus.module.name.en}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (soundEnabled) sfx.playTap();
                      if (onTabChange) onTabChange("home");
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#FFD166] hover:bg-amber-400 text-slate-900 text-xs font-black px-4 py-2.5 rounded-xl border-b-4 border-amber-600 transition-all active:scale-95 shrink-0"
                  >
                    Resume Lesson <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ACHIEVEMENT BADGES PORTAL */}
            <div id="profile-badges-landmark" className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h3 className="text-xl font-black text-[#B8A0FF] flex items-center gap-2">
                    <span>🏅</span> My Badges & Achievements
                  </h3>
                  <p className="text-xs text-slate-400">
                    Solve quizzes and climb high levels in CLATS to collect unique credentials of honor.
                  </p>
                </div>
                <span className="bg-[#B8A0FF]/10 text-[#B8A0FF] text-xs px-3 py-1 rounded-full font-black">
                  🛡️ {earnedBadgesCount} / {badgesData.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {badgesData.map((badge) => {
                  const unlocked = badge.unlocked;
                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                        unlocked 
                          ? "bg-[#FFD166]/5 border-[#FFD166]/40 text-slate-800 dark:text-white"
                          : "border-slate-100 dark:border-slate-850 text-slate-400 opacity-50 select-none"
                      }`}
                    >
                      <div className="text-3xl shrink-0 leading-none">{badge.icon}</div>
                      <div>
                        <h4 className="text-xs font-black leading-tight mb-1">{badge.name}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          {badge.desc}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase">
                          {unlocked ? (
                            <span className="text-[#FFD166] flex items-center gap-0.5">
                              <CheckCircle size={10} /> Got It!
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-0.5">
                              <Lock size={10} /> Locked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DIPLOMAS AND CERTIFICATES */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h3 className="text-xl font-black text-[#2EC4B6] flex items-center gap-2">
                    <span>🎓</span> My Academy Certificates
                  </h3>
                  <p className="text-xs text-slate-400">
                    Graduates get premium, verified smart diploma certificates based on milestone achievements!
                  </p>
                </div>
                <span className="bg-[#2EC4B6]/10 text-[#2EC4B6] text-xs px-3 py-1 rounded-full font-black shrink-0">
                  🎖️ {earnedCertsCount} / {certificatesList.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certificatesList.map((cert) => {
                  const unlocked = cert.unlocked;
                  return (
                    <div
                      key={cert.id}
                      className={`p-4 rounded-2xl border transition-all relative ${
                        unlocked
                          ? (isDark ? "bg-slate-850 hover:bg-slate-800 border-[#B8A0FF]" : "bg-white shadow border-[#B8A0FF]/30")
                          : "border-slate-200 dark:border-slate-850 grayscale opacity-60"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-3xl bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                          {cert.icon}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                          unlocked ? "bg-emerald-500/15 text-emerald-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {unlocked ? "Unlocks & Signed" : cert.requirement}
                        </span>
                      </div>

                      <h4 className={`text-sm font-black mb-1 ${unlocked ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>
                        {cert.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mb-4 h-10 overflow-hidden leading-tight">
                        {cert.desc}
                      </p>

                      {unlocked ? (
                        <button
                          onClick={() => handleOpenCertificate(cert)}
                          className="w-full text-center bg-[#B8A0FF]/10 text-[#B8A0FF] hover:bg-[#B8A0FF]/20 text-xs font-extrabold py-2 rounded-xl border border-[#B8A0FF]/30"
                        >
                          📜 View & Download Certificate
                        </button>
                      ) : (
                        <div className="text-center font-black text-slate-400 text-xs bg-slate-100 dark:bg-slate-800/40 py-2 rounded-xl flex items-center justify-center gap-1">
                          <Lock size={12} /> Complete requirements
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: RECENT ACTIVITIES, STREAK AND SETTINGS (col-span-12 or 4) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* STREAK VISUALIZATION BOX */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900 border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-lg"
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black flex items-center gap-1">
                  <span>🔥</span> Streak Calendar
                </h3>
                <span className="text-xs bg-rose-500/10 text-rose-500 font-black px-2.5 py-0.5 rounded-full">
                  {streak} Days
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Current Streak</span>
                  <span className="text-xl font-black text-rose-500 flex items-center justify-center gap-1">
                    🔥 {streak}
                  </span>
                </div>
                <div className="text-center border-l border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Best Streak</span>
                  <span className="text-xl font-black text-emerald-500 flex items-center justify-center gap-1">
                    ⚡ {bestStreak}
                  </span>
                </div>
              </div>

              {/* Habit Calendar Grid */}
              <div className="mb-4">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider flex justify-between">
                  <span>{currentMonthName} {currentYear} Activity heatmap</span>
                  <span>Total log: {calendarDays.filter(d => d.active).length} Days</span>
                </div>
                
                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[9px] font-black uppercase text-slate-400/70">
                  <span>S</span>
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells representing week start offset */}
                  {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="w-full aspect-square opacity-0 select-none pointer-events-none" />
                  ))}

                  {/* Real calendar days */}
                  {calendarDays.map((d) => (
                    <div
                      key={d.day}
                      title={`${currentMonthName} ${d.day}: ${d.active ? "Learnt Lesson" : "No Session Logged"}`}
                      className={`w-full aspect-square rounded-md text-[11px] font-bold flex items-center justify-center transition-colors ${
                        d.active 
                          ? "bg-[#2EC4B6] text-white hover:bg-[#20877d]" 
                          : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-700"
                      }`}
                    >
                      {d.day}
                    </div>
                  ))}
                </div>
              </div>

              {/* MILTESTONES MINI CLAIMS */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
                <span className="text-xs font-black text-[#B8A0FF] block uppercase">
                  Streak Milestones Gifts
                </span>

                {[
                  { id: "3-Days-Reward", days: 3, xp: 50, label: "3 Day streak box" },
                  { id: "7-Days-Reward", days: 7, xp: 150, label: "7 Day streak chest" },
                  { id: "14-Days-Reward", days: 14, xp: 300, label: "14 Day legendary safe" },
                  { id: "30-Days-Reward", days: 30, xp: 600, label: "30 Day ultimate chest" }
                ].map((gift) => {
                  const eligible = streak >= gift.days;
                  const claimed = claimedMilestones.includes(gift.id);
                  return (
                    <div
                      key={gift.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        claimed 
                          ? "bg-slate-100/50 dark:bg-slate-850/50 border-slate-200 opacity-60 text-slate-400" 
                          : eligible 
                            ? "bg-[#FFD166]/10 border-[#FFD166] text-slate-800 dark:text-white" 
                            : "border-slate-100 dark:border-slate-850/40 opacity-40 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Gift size={16} className={eligible && !claimed ? "text-[#FFD166]" : "text-slate-400"} />
                        <div>
                          <div className="text-[11px] font-extrabold leading-none">{gift.label}</div>
                          <div className="text-[9px] mt-0.5 font-bold text-amber-500">+{gift.xp} XP reward</div>
                        </div>
                      </div>

                      {claimed ? (
                        <span className="text-[9px] font-black text-emerald-500 uppercase">
                          Claimed ✓
                        </span>
                      ) : eligible ? (
                        <button
                          onClick={() => handleClaimStreakReward(gift.id, gift.days, gift.xp)}
                          className="bg-[#FFD166] text-slate-900 border-b-2 border-amber-600 hover:bg-amber-400 text-[10px] font-black px-2 py-1 rounded"
                        >
                          Claim
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {streak}/{gift.days}d
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LEARNING STATS DASHBOARD CONTAINER */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h3 className="text-lg font-black text-[#FFD166] mb-4 flex items-center gap-1.5">
                <TrendingUp size={18} /> Profile Stats Tracker
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Score 1 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 text-center">
                  <span className="text-[20px] block leading-none mb-1">⭐</span>
                  <span className="text-xs font-black text-slate-400 block leading-none">Total XP</span>
                  <span className="text-lg font-bold text-[#FFD166] leading-relaxed block">{currentXP}</span>
                </div>

                {/* Score 2 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 text-center">
                  <span className="text-[20px] block leading-none mb-1">🔥</span>
                  <span className="text-xs font-black text-slate-400 block leading-none">Day Streak</span>
                  <span className="text-lg font-bold text-rose-500 leading-relaxed block">{streak}</span>
                </div>

                {/* Score 3 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 text-center">
                  <span className="text-[20px] block leading-none mb-1">💪</span>
                  <span className="text-xs font-black text-slate-400 block leading-none">Completed</span>
                  <span className="text-lg font-bold text-[#2EC4B6] leading-relaxed block">{completedCount} Lessons</span>
                </div>

                {/* Score 4 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 text-center">
                  <span className="text-[20px] block leading-none mb-1">🧠</span>
                  <span className="text-xs font-black text-slate-400 block leading-none">Quizzes Pass</span>
                  <span className="text-lg font-bold text-amber-500 leading-relaxed block">{quizzesPassed}</span>
                </div>

                {/* Score 5 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 text-center">
                  <span className="text-[20px] block leading-none mb-1">🎓</span>
                  <span className="text-xs font-black text-slate-400 block leading-none">Diplomas</span>
                  <span className="text-lg font-bold text-indigo-400 leading-relaxed block">{earnedCertsCount} Earned</span>
                </div>

                {/* Score 6 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 text-center">
                  <span className="text-[20px] block leading-none mb-1">🎖️</span>
                  <span className="text-xs font-black text-slate-400 block leading-none">Badges</span>
                  <span className="text-lg font-bold text-[#B8A0FF] leading-relaxed block">{earnedBadgesCount} Got</span>
                </div>
              </div>

              {/* Core study duration from Supabase */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#2EC4B6] font-bold block mb-3 text-center sm:text-left">
                  STUDY DURATION METRICS (SUPABASE SYNCED)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-1">Today</span>
                    <strong className="text-sm font-black text-[#2EC4B6]">{studyAnalytics.todayMins}m</strong>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-1">Weekly</span>
                    <strong className="text-sm font-black text-[#2EC4B6]">{studyAnalytics.weeklyMins}m</strong>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-1">Total</span>
                    <strong className="text-sm font-black text-[#2EC4B6]">{studyAnalytics.totalMins}m</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* PIONEER STAGE COMPETENCY DOMAIN EXTRA INFO */}
            {child.ageGroup === "future builders" && (
              <div className={`p-5 rounded-3xl border border-[#B8A0FF]/40 bg-[#B8A0FF]/5`}>
                <h4 className="text-xs font-black uppercase text-[#B8A0FF] tracking-wider mb-2">
                  🔒 Pioneer Domain Portfolio Status
                </h4>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex justify-between items-center bg-slate-900/40 p-2 rounded">
                    <span>🤖 Machine Classification</span>
                    <span className="text-[#2EC4B6] font-extrabold">{completedCount >= 1 ? "✓ Core Competence" : "Locked"}</span>
                  </li>
                  <li className="flex justify-between items-center bg-slate-900/40 p-2 rounded">
                    <span>🔐 Cyber Ethics & Signatures</span>
                    <span className="text-slate-400">{completedCount >= 4 ? "✓ High Qualified" : "Modules Locked"}</span>
                  </li>
                  <li className="flex justify-between items-center bg-slate-900/40 p-2 rounded">
                    <span>🚀 Career Elevator Pitch</span>
                    <span className="text-slate-400">{completedCount >= 6 ? "✓ Done" : "Locked"}</span>
                  </li>
                </ul>
              </div>
            )}

            {/* RECENT HISTORIC ROAD TIMELINE */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h3 className="text-lg font-black mb-4 flex items-center gap-1 text-black dark:text-white">
                <span>📅</span> Recent Activity
              </h3>

              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 pl-4 space-y-5">
                {recentActivities.map((act) => (
                  <div key={act.id} className="relative">
                    {/* Circle marker dot */}
                    <span className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-[#2EC4B6] border-2 border-white dark:border-slate-900" />
                    
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="text-xs font-semibold leading-tight text-black dark:text-slate-200">
                        {act.text}
                      </p>
                      <span className="text-[9px] text-black dark:text-[#B8A0FF] font-black uppercase shrink-0">
                        {act.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK LOCAL PROFILE SETTINGS */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h3 className="text-lg font-black mb-4 flex items-center gap-1 text-slate-500 dark:text-slate-350">
                <span>⚙️</span> Shortcut Preference Toggles
              </h3>

              <div className="space-y-3.5 text-xs text-slate-400 font-extrabold">
                {/* Toggle 1: Sound */}
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} Sounds & SFX Cheer
                  </span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={() => setSoundEnabled(!soundEnabled)}
                    className="w-4 h-4 rounded text-[#2EC4B6] focus:ring-[#2EC4B6]/25"
                  />
                </div>

                {/* Toggle 2: Font Zoom accessibility */}
                <div className="flex justify-between items-center">
                  <span>🔎 High Visibility Accessibility Mode</span>
                  <input
                    type="checkbox"
                    checked={accessibilityZoom}
                    onChange={() => setAccessibilityZoom(!accessibilityZoom)}
                    className="w-4 h-4 rounded text-[#2EC4B6] focus:ring-[#2EC4B6]/25"
                  />
                </div>

                {/* Toggle 3: Sync notifications */}
                <div className="flex justify-between items-center">
                  <span>📨 Notify Parent on Email</span>
                  <input
                    type="checkbox"
                    checked={prefNotification}
                    onChange={() => setPrefNotification(!prefNotification)}
                    className="w-4 h-4 rounded text-[#2EC4B6] focus:ring-[#2EC4B6]/25"
                  />
                </div>

                {/* Onboarding Re-run banner */}
                <button
                  onClick={() => {
                    if (soundEnabled) sfx.playTap();
                    alert("Re-triggering initial mascot introduction simulation done! Keep exploring.");
                  }}
                  className="w-full text-center py-2 bg-slate-100 dark:bg-slate-850 rounded-xl hover:bg-slate-200 text-slate-500 dark:text-slate-300 text-xs font-bold"
                >
                  📖 Replay Introductory Guides
                </button>
              </div>
            </div>

            {/* INCLUSIVE ACCESSIBILITY SUITE */}
            <div className={`p-6 mt-6 rounded-3xl border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <h3 className="text-[11px] font-black mb-4 text-center uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                ⚙️ INCLUSIVE ACCESSIBILITY SUITE
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* Voice-over Speech toggle */}
                <button
                  onClick={() => {
                    if (soundEnabled) sfx.playTap();
                    if (voiceReaderOn) {
                      window.speechSynthesis.cancel();
                    }
                    setVoiceReaderOn(!voiceReaderOn);
                  }}
                  style={{
                    background: voiceReaderOn ? "rgba(46,196,182,0.1)" : (isDark ? "#1e293b" : "#f8fafc"),
                    border: `1.5px solid ${voiceReaderOn ? "#2EC4B6" : (isDark ? "#334155" : "#cbd5e1")}`,
                    borderRadius: 14,
                    padding: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: voiceReaderOn ? "#208a80" : (isDark ? "#cbd5e1" : "#334155")
                  }}
                >
                  <span style={{ fontSize: 16 }}>🔊</span>
                  <span style={{ fontSize: 11, fontWeight: 900, fontFamily: F.mono }}>
                    READER {voiceReaderOn ? "ON" : "OFF"}
                  </span>
                </button>

                {/* Toggle Subtitles */}
                <button
                  onClick={() => {
                    if (soundEnabled) sfx.playTap();
                    setSubtitlesOn(!subtitlesOn);
                  }}
                  style={{
                    background: subtitlesOn ? "rgba(46,196,182,0.1)" : (isDark ? "#1e293b" : "#f8fafc"),
                    border: `1.5px solid ${subtitlesOn ? "#2EC4B6" : (isDark ? "#334155" : "#cbd5e1")}`,
                    borderRadius: 14,
                    padding: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: subtitlesOn ? "#208a80" : (isDark ? "#cbd5e1" : "#334155")
                  }}
                >
                  <span style={{ fontSize: 16 }}>📝</span>
                  <span style={{ fontSize: 11, fontWeight: 900, fontFamily: F.mono }}>
                    SUBTITLES {subtitlesOn ? "ON" : "OFF"}
                  </span>
                </button>

                {/* Accessible color contrasts */}
                <button
                  onClick={() => {
                    if (soundEnabled) sfx.playTap();
                    setColorMode((p) => p === "normal" ? "accessible" : p === "accessible" ? "night" : "normal");
                  }}
                  style={{
                    background: colorMode !== "normal" ? "rgba(217,119,6,0.1)" : (isDark ? "#1e293b" : "#f8fafc"),
                    border: `1.5px solid ${colorMode !== "normal" ? "#d97706" : (isDark ? "#334155" : "#cbd5e1")}`,
                    borderRadius: 14,
                    padding: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: colorMode !== "normal" ? "#d97706" : (isDark ? "#cbd5e1" : "#334155")
                  }}
                >
                  <span style={{ fontSize: 16 }}>🌗</span>
                  <span style={{ fontSize: 11, fontWeight: 900, fontFamily: F.mono }}>
                    {colorMode === "normal" ? "STANDARD" : colorMode === "accessible" ? "HIGH CONTRAST" : "NIGHT SHADE"}
                  </span>
                </button>

                {/* Dyslexia mode toggle */}
                <button
                  onClick={() => {
                    if (soundEnabled) sfx.playTap();
                    setDyslexicMode(!dyslexicMode);
                  }}
                  style={{
                    background: dyslexicMode ? "rgba(139,92,246,0.1)" : (isDark ? "#1e293b" : "#f8fafc"),
                    border: `1.5px solid ${dyslexicMode ? "#8b5cf6" : (isDark ? "#334155" : "#cbd5e1")}`,
                    borderRadius: 14,
                    padding: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: dyslexicMode ? "#8b5cf6" : (isDark ? "#cbd5e1" : "#334155")
                  }}
                >
                  <span style={{ fontSize: 16 }}>🔤</span>
                  <span style={{ fontSize: 11, fontWeight: 900, fontFamily: F.mono }}>
                    DYSLEXIA {dyslexicMode ? "ON" : "OFF"}
                  </span>
                </button>

                {/* Font Size Incrementor */}
                <button
                  onClick={() => {
                    if (soundEnabled) sfx.playTap();
                    setFontSizePref((p) => p === "normal" ? "large" : p === "large" ? "extra" : "normal");
                  }}
                  style={{
                    background: fontSizePref !== "normal" ? "rgba(13,148,136,0.1)" : (isDark ? "#1e293b" : "#f8fafc"),
                    border: `1.5px solid ${fontSizePref !== "normal" ? "#0d9488" : (isDark ? "#334155" : "#cbd5e1")}`,
                    borderRadius: 14,
                    padding: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: fontSizePref !== "normal" ? "#0d9488" : (isDark ? "#cbd5e1" : "#334155")
                  }}
                >
                  <span style={{ fontSize: 16 }}>🔍</span>
                  <span style={{ fontSize: 11, fontWeight: 900, fontFamily: F.mono }}>
                    TEXT: {fontSizePref.toUpperCase()}
                  </span>
                </button>

                {/* Reduced Motion Toggle */}
                <button
                  onClick={() => {
                    if (soundEnabled) sfx.playTap();
                    setReducedMotion(!reducedMotion);
                  }}
                  style={{
                    background: reducedMotion ? "rgba(244,63,94,0.1)" : (isDark ? "#1e293b" : "#f8fafc"),
                    border: `1.5px solid ${reducedMotion ? "#f43f5e" : (isDark ? "#334155" : "#cbd5e1")}`,
                    borderRadius: 14,
                    padding: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: reducedMotion ? "#f43f5e" : (isDark ? "#cbd5e1" : "#334155")
                  }}
                >
                  <span style={{ fontSize: 16 }}>🏃</span>
                  <span style={{ fontSize: 11, fontWeight: 900, fontFamily: F.mono }}>
                    MOTION {reducedMotion ? "REDUCED" : "AUTO"}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* AVATAR FRAMES CUSTOMIZER MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 z-[999]">
          <div className={`p-2.5 rounded-2xl w-full max-w-[280px] border relative clats-no-scale ${
            isDark ? "bg-black border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <h3 className="text-base font-black mb-0.5 text-[#2EC4B6] flex items-center gap-1.5">
              <span>🌈</span> Character Customizer HQ
            </h3>
            <p className="text-[10px] text-slate-400 mb-2.5">
              Unlock avatars, badges, and customizable frames as you conquer lessons.
            </p>
 
            <div className="space-y-2.5">
              {/* Name Editor inline */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                  Change Display Name
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-black focus:ring-2 focus:ring-[#2EC4B6] focus:outline-none transition-all ${
                    isDark ? "bg-black border-slate-800 text-white" : "bg-white border-slate-300 text-black"
                  }`}
                />
              </div>
 
              {/* Avatar Emoji grids */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                  Select Avatar Character
                </label>
                <div className="grid grid-cols-8 gap-1.5 overflow-y-auto max-h-20 p-1">
                  {avatarPresets.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        if (soundEnabled) sfx.playTap();
                        setTempAvatar(em);
                      }}
                      className={`text-xl p-0.5 rounded-lg transition-all ${
                        tempAvatar === em 
                          ? "bg-[#2EC4B6]/25 border-2 border-[#2EC4B6]" 
                          : isDark 
                            ? "bg-black border border-slate-800 hover:bg-slate-900 text-white" 
                            : "bg-white border border-slate-200 hover:bg-slate-100 text-black"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
 
              {/* Frames Customizer Selection list */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                  Select Unlocked Frame Halo
                </label>
                <div className="space-y-1.5">
                  {framesList.map((f) => {
                    const unlocked = f.unlocked;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => {
                          if (soundEnabled) sfx.playTap();
                          setTempFrame(f.id);
                        }}
                        className={`w-full p-2 rounded-xl flex items-center justify-between border text-left transition-all ${
                          !unlocked 
                            ? "opacity-35 select-none cursor-not-allowed " + (isDark ? "border-slate-850" : "border-slate-100")
                            : tempFrame === f.id
                              ? "border-[#2EC4B6] bg-[#2EC4B6]/5 text-[#2EC4B6]"
                              : isDark
                                ? "border-slate-800 bg-black hover:bg-slate-900 text-white"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${f.design}`}>
                            {tempAvatar}
                          </span>
                          <div>
                            <div className="text-[10px] font-black">{f.name}</div>
                            <div className="text-[9px] text-slate-400">{f.label}</div>
                          </div>
                        </div>
 
                        <div>
                          {unlocked ? (
                            tempFrame === f.id ? (
                              <span className="text-[10px] text-[#2EC4B6] font-black flex items-center gap-0.5">
                                <Check size={11} /> Active
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-bold uppercase">
                                Equip
                              </span>
                            )
                          ) : (
                            <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                              <Lock size={8} /> Locked
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
 
              {/* Trigger Footer */}
              <div className="pt-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className={`flex-1 border text-[10px] font-black py-2 rounded-xl transition-all ${
                    isDark 
                      ? "bg-black border-slate-800 text-white hover:bg-slate-900" 
                      : "bg-white border-slate-200 text-black hover:bg-slate-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfileCustomization}
                  className="flex-1 bg-[#2EC4B6] text-white text-[10px] font-black py-2 rounded-xl border-b-2 border-[#1b756d] active:border-b-0 active:translate-y-[2px]"
                >
                  Save & Sparkle! ✨
                </button>
              </div>
 
            </div>
          </div>
        </div>
      )}

      {/* DIPLOMA VIEWER OVERLAY MODAL */}
      {activeDiploma && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur flex items-center justify-center p-4 z-[999]">
          <div className={`p-8 rounded-3xl w-full max-w-2xl border relative overflow-hidden text-center select-none ${
            isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-amber-50/10 border-amber-200 text-slate-800"
          }`}>
            {/* Ribbon Background Decorations for certificate signature feeling */}
            <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-teal-500 via-amber-400 to-indigo-500" />
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-[#FFD166]/10 rounded-full" />
            <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#B8A0FF]/15 rounded-full" />

            <div id="clats-gold-certificate" className="border-4 border-double border-amber-300 dark:border-amber-600 p-6 rounded-2xl">
              <span className="text-5xl block mb-2">{activeDiploma.icon}</span>
              <div className="text-[10px] tracking-widest text-[#FFD166] font-bold uppercase mb-1">
                CLATS Future-Tech Academy Certificate
              </div>
              
              <h2 className="text-2xl font-black mb-1 text-slate-800 dark:text-white">
                DIPLOMA OF EXCELLENCE
              </h2>
              <div className="w-24 h-0.5 bg-amber-450 mx-auto my-3" />

              <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">
                This academic honor is proudly awarded to:
              </p>

              <div className="text-2xl font-extrabold text-[#2EC4B6] tracking-tight bg-slate-100 dark:bg-slate-850 px-4 py-2 rounded-xl inline-block mb-3 border-2 border-[#2EC4B6]/20">
                ⭐ {child.name} ⭐
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-200 max-w-md mx-auto leading-relaxed mb-6">
                Who completed the requisite logic tracks and masteries of <strong>&ldquo;{activeDiploma.name}&rdquo;</strong> with exceptional score rating on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
              </p>

              {/* Mock signed seals structure */}
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6 text-slate-450 dark:text-slate-400">
                <div className="text-center pt-2 border-t border-slate-350 select-none">
                  <div className="text-[13px] font-black text-rose-500 font-mono italic">Kobe Mascot</div>
                  <div className="text-[8px] uppercase tracking-wider font-bold">Mascot Advocate</div>
                </div>
                <div className="text-center pt-2 border-t border-slate-350 select-none">
                  <div className="text-[13px] font-black text-indigo-400 font-mono italic">CLATS Academy Board</div>
                  <div className="text-[8px] uppercase tracking-wider font-bold">Official Seal Sync</div>
                </div>
              </div>

              {/* Progress Generative loader element */}
              {downloadStep === "running" && (
                <div className="mb-4">
                  <div className="text-[10px] text-slate-400 mb-1">Downloading diploma... {downloadProgress}%</div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-[#2EC4B6] h-2 rounded-full" style={{ width: `${downloadProgress}%` }} />
                  </div>
                </div>
              )}

              {downloadStep === "done" && (
                <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl py-2 px-3 text-xs font-black inline-flex items-center gap-1.5 mb-4">
                  <Check size={14} strokeWidth={4} /> Certificate image downloaded! Check downloads folder!
                </div>
              )}

              {shareFeedback && (
                <div className="bg-cyan-500/10 text-[#2EC4B6] border border-cyan-500/20 rounded-xl py-2 px-3 text-xs font-black mb-4">
                  {shareFeedback}
                </div>
              )}

              {/* Trigger interactions */}
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleDownloadDiploma}
                  disabled={downloadStep === "running"}
                  className="bg-[#2EC4B6] text-white text-xs font-black px-4 py-2.5 rounded-xl border-b-4 border-[#125850] active:translate-y-[3px] disabled:opacity-50"
                >
                  💾 Download Image Certificate
                </button>
                <button
                  type="button"
                  onClick={() => handleShareDiploma(activeDiploma.name)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-4 py-2.5 rounded-xl border-b-4 border-purple-800"
                >
                  🔗 Share with Parents
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDiploma(null)}
                  className="bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black px-4 py-2.5 rounded-xl"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChildProgressScreen;
