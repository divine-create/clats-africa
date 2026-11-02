/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Child, Lesson, Module, Language, AgeGroup } from "../types";
import { CURRICULUM } from "../data/curriculum";
import { T, C, F } from "../utils/config";
import { Lock, Star, Check, Play, Compass, Sparkles, Trophy, Shield, Palette, Cpu, ChevronRight, Volume2 } from "lucide-react";
import { sfx, companionVoice } from "../utils/audio";
import { KobeAvatar } from "./KobeAvatar";
import { SANDBOX_ACTIVITIES } from "../data/sandboxActivities";

interface SagaMapProps {
  child: Child;
  lang: Language;
  onSelectLesson: (l: Lesson) => void;
  onShowPaywall: () => void;
  onOpenSandbox?: (adventureId?: string, moduleId?: string, lessonId?: string) => void;
  onBack?: () => void;
  theme?: "light" | "dark";
  initialAdventureId?: string;
}

interface YoungExplorerAdventure {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  themeColors: {
    gradientLight: string;
    gradientDark: string;
    cardBgLight: string;
    cardBgDark: string;
    accent: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    trailStroke: string;
  };
  modules: {
    module: Module;
    globalModIndex: number;
  }[];
}

const BIOME_COLORS = [
  { bgLight: "#FEF08A", bgDark: "#854D0E", node: "#FBBF24", accent: "#F59E0B" }, // Sunny Beach (Sand)
  { bgLight: "#A5F3FC", bgDark: "#164E63", node: "#06B6D4", accent: "#0891B2" }, // Tropical Ocean (Aqua)
  { bgLight: "#BBF7D0", bgDark: "#14532D", node: "#22C55E", accent: "#16A34A" }, // Jungle Canopy (Green)
  { bgLight: "#FFEDD5", bgDark: "#7C2D12", node: "#F97316", accent: "#EA580C" }, // Island Sunset (Orange)
  { bgLight: "#C7D2FE", bgDark: "#312E81", node: "#6366F1", accent: "#4F46E5" }, // Deep Reef (Indigo)
];

const YOUNG_EXPLORER_ADVENTURE_DEFS: Omit<YoungExplorerAdventure, "modules">[] = [
  {
    id: "academy-1",
    number: 1,
    title: "AI & Smart Technology",
    subtitle: "Adventure 1 · Smart Discovery Island",
    description: "Discover what technology is, meet friendly AI helpers Kobe and Chibi, and see how smart machines learn!",
    emoji: "🤖",
    themeColors: {
      gradientLight: "from-emerald-50 via-teal-50 to-cyan-50",
      gradientDark: "from-emerald-950/60 via-teal-950/50 to-slate-900",
      cardBgLight: "#ECFDF5",
      cardBgDark: "#064E3B",
      accent: "#10B981",
      border: "#2EC4B6",
      badgeBg: "rgba(16, 185, 129, 0.15)",
      badgeText: "#059669",
      trailStroke: "#2EC4B6"
    }
  },
  {
    id: "academy-2",
    number: 2,
    title: "Digital Literacy and Cyber Safety",
    subtitle: "Adventure 2 · Safe Harbor Lagoon",
    description: "Learn healthy screen habits, kindness online, and how to stay safe and smart in the digital world!",
    emoji: "🛡️",
    themeColors: {
      gradientLight: "from-sky-50 via-cyan-50 to-blue-50",
      gradientDark: "from-sky-950/60 via-cyan-950/50 to-slate-900",
      cardBgLight: "#F0F9FF",
      cardBgDark: "#0C4A6E",
      accent: "#0284C7",
      border: "#38BDF8",
      badgeBg: "rgba(2, 132, 199, 0.15)",
      badgeText: "#0284C7",
      trailStroke: "#38BDF8"
    }
  },
  {
    id: "academy-3",
    number: 3,
    title: "Creativity & Play",
    subtitle: "Adventure 3 · Rainbow Studio Cove",
    description: "Explore colors, shapes, digital drawing, music, and story adventures through creative play!",
    emoji: "🎨",
    themeColors: {
      gradientLight: "from-amber-50 via-orange-50 to-rose-50",
      gradientDark: "from-amber-950/60 via-orange-950/40 to-slate-900",
      cardBgLight: "#FFFBEB",
      cardBgDark: "#78350F",
      accent: "#F59E0B",
      border: "#FBBF24",
      badgeBg: "rgba(245, 158, 11, 0.15)",
      badgeText: "#D97706",
      trailStroke: "#F59E0B"
    }
  },
  {
    id: "academy-4",
    number: 4,
    title: "Adaptability & Lifelong Learning",
    subtitle: "Adventure 4 · Wonder Peak Trail",
    description: "Ask big questions, spot patterns around us, try new things, and grow your curious explorer mind!",
    emoji: "🧭",
    themeColors: {
      gradientLight: "from-purple-50 via-fuchsia-50 to-indigo-50",
      gradientDark: "from-purple-950/60 via-indigo-950/50 to-slate-900",
      cardBgLight: "#FAF5FF",
      cardBgDark: "#4C1D95",
      accent: "#8B5CF6",
      border: "#A855F7",
      badgeBg: "rgba(139, 92, 246, 0.15)",
      badgeText: "#7C3AED",
      trailStroke: "#A855F7"
    }
  }
];

export const SagaMap: React.FC<SagaMapProps> = ({
  child,
  lang,
  onSelectLesson,
  onShowPaywall,
  onOpenSandbox,
  onBack,
  theme = "dark",
  initialAdventureId
}) => {
  const ageGroup: AgeGroup = child.ageGroup || "early explorers";
  const isYoungExplorer = ageGroup === "early explorers" || ageGroup === "young explorers";
  const course = CURRICULUM[isYoungExplorer ? "early explorers" : ageGroup] || CURRICULUM[ageGroup];
  const modules = course?.modules || [];
  const isDark = theme === "dark";
  const companion = child.companion || "kobe";
  const compLabel = companion === "chibi" ? "Chibi" : "Kobe";

  // Calculate overall level progression across course
  const totalLevels = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const totalCompletedLevels = modules.reduce(
    (acc, m) => acc + (m.lessons?.filter((l) => Boolean(child.completed?.[l.id])).length || 0),
    0
  );

  // Group existing curriculum modules into the 4 Young Explorers Adventures without altering module/lesson order
  const adventures: YoungExplorerAdventure[] = useMemo(() => {
    const grouped: YoungExplorerAdventure[] = YOUNG_EXPLORER_ADVENTURE_DEFS.map((def) => ({
      ...def,
      modules: []
    }));

    const pathwaysList = course?.pathways || [];

    modules.forEach((mod, globalModIndex) => {
      const modIdLower = (mod.id || "").toLowerCase();
      const modNameLower = (mod.name?.en || "").toLowerCase();
      const linkedPathway = pathwaysList.find((p) => p.id === mod.pathwayId);
      const pathwayTitleLower = (linkedPathway?.title || "").toLowerCase();

      let targetAdvIdx = 0;

      if (modIdLower.startsWith("t-a1") || modIdLower.includes("a1m")) {
        targetAdvIdx = 0;
      } else if (modIdLower.startsWith("t-a2") || modIdLower.includes("a2m")) {
        targetAdvIdx = 1;
      } else if (modIdLower.startsWith("t-a3") || modIdLower.includes("a3m")) {
        targetAdvIdx = 2;
      } else if (modIdLower.startsWith("t-a4") || modIdLower.includes("a4m")) {
        targetAdvIdx = 3;
      } else if (
        pathwayTitleLower.includes("digital") ||
        pathwayTitleLower.includes("cyber") ||
        pathwayTitleLower.includes("safety") ||
        modNameLower.includes("digital world") ||
        modNameLower.includes("cyber")
      ) {
        targetAdvIdx = 1;
      } else if (
        pathwayTitleLower.includes("creat") ||
        pathwayTitleLower.includes("design") ||
        pathwayTitleLower.includes("play") ||
        modNameLower.includes("creative")
      ) {
        targetAdvIdx = 2;
      } else if (
        pathwayTitleLower.includes("adapt") ||
        pathwayTitleLower.includes("lifelong") ||
        pathwayTitleLower.includes("curious") ||
        modNameLower.includes("curious")
      ) {
        targetAdvIdx = 3;
      } else {
        targetAdvIdx = 0;
      }

      grouped[targetAdvIdx].modules.push({ module: mod, globalModIndex });
    });

    return grouped;
  }, [modules, course?.pathways]);

  // Identify the global current active lesson (first uncompleted lesson in curriculum sequence)
  const globalActiveInfo = useMemo(() => {
    for (const adv of adventures) {
      let levelNumInAdv = 0;
      for (const { module: mod, globalModIndex } of adv.modules) {
        for (const les of mod.lessons || []) {
          levelNumInAdv++;
          if (!child.completed?.[les.id]) {
            return {
              adventureId: adv.id,
              adventureTitle: adv.title,
              module: mod,
              globalModIndex,
              lesson: les,
              levelNumberInAdventure: levelNumInAdv
            };
          }
        }
      }
    }
    return null;
  }, [adventures, child.completed]);

  const [selectedAdventureId, setSelectedAdventureId] = useState<string>(() => {
    if (initialAdventureId && YOUNG_EXPLORER_ADVENTURE_DEFS.some((d) => d.id === initialAdventureId)) {
      return initialAdventureId;
    }
    return globalActiveInfo?.adventureId || "academy-1";
  });

  // Update selected adventure if globalActiveInfo advances to a new adventure on completion
  useEffect(() => {
    if (globalActiveInfo?.adventureId && !initialAdventureId) {
      setSelectedAdventureId(globalActiveInfo.adventureId);
    }
  }, [globalActiveInfo?.adventureId, initialAdventureId]);

  const activeNodeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to the active lesson on mount
  useEffect(() => {
    if (activeNodeRef.current) {
      const timer = setTimeout(() => {
        activeNodeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [selectedAdventureId]);

  if (!modules.length) {
    return <div className="p-8 text-center text-white">No curriculum available for this age group yet.</div>;
  }

  // ============================================================================
  // YOUNG EXPLORERS (AGES 6–10) ADVENTURE & LEVEL LEARNING MAP
  // ============================================================================
  if (isYoungExplorer) {
    const selectedAdventure = adventures.find((a) => a.id === selectedAdventureId) || adventures[0];
    const adventureLessons = selectedAdventure.modules.flatMap((m) => m.module.lessons || []);
    const adventureTotalLevels = adventureLessons.length;
    const adventureCompletedLevels = adventureLessons.filter((l) => Boolean(child.completed?.[l.id])).length;
    const adventureProgressPct =
      adventureTotalLevels > 0 ? Math.round((adventureCompletedLevels / adventureTotalLevels) * 100) : 0;
    const isAdventureComplete = adventureTotalLevels > 0 && adventureCompletedLevels === adventureTotalLevels;

    let runningLevelNumber = 0;

    const handleSelectAdventureTab = (adv: YoungExplorerAdventure) => {
      sfx.playTap();
      setSelectedAdventureId(adv.id);
      const advLessons = adv.modules.flatMap((m) => m.module.lessons || []);
      const advDone = advLessons.filter((l) => Boolean(child.completed?.[l.id])).length;
      companionVoice.speak(
        `Adventure ${adv.number}: ${adv.title}. ${adv.description} You have completed ${advDone} of ${advLessons.length} levels.`,
        companion,
        ageGroup
      );
    };

    return (
      <div
        className={`w-full min-h-screen pb-32 transition-colors duration-500 overflow-x-hidden relative ${
          isDark ? "bg-[#0B1120] text-white" : "bg-[#F0FDFA] text-slate-900"
        }`}
      >
        <style>{`
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes pulseRing {
            0% { transform: scale(0.95); opacity: 0.8; }
            70% { transform: scale(1.15); opacity: 0; }
            100% { transform: scale(1.15); opacity: 0; }
          }
        `}</style>

        {/* Sticky Top Adventure Bar */}
        <div
          className={`sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-3 sm:px-6 flex items-center justify-between shadow-sm ${
            isDark ? "bg-[#0B1120]/90 border-slate-800" : "bg-white/90 border-teal-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={() => {
                  sfx.playTap();
                  onBack();
                }}
                className={`p-2.5 rounded-2xl transition-transform active:scale-95 flex-shrink-0 border-2 ${
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                    : "bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-200"
                }`}
                title="Return to Explorer Hub"
                aria-label="Return to Explorer Hub"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <Compass size={16} className="text-[#2EC4B6]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#2EC4B6]">
                  Young Explorers World
                </span>
              </div>
              <h1
                className={`text-lg sm:text-2xl font-black leading-tight m-0 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
                style={{ fontFamily: F.display }}
              >
                Adventure Map
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 ${
                isDark
                  ? "bg-slate-800/90 border-slate-700 text-emerald-300"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              <Check size={14} className="text-emerald-500 stroke-[3]" />
              <span className="text-xs font-black">
                {totalCompletedLevels} / {totalLevels} Levels
              </span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 ${
                isDark
                  ? "bg-slate-800/90 border-slate-700 text-amber-300"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-black">{child.xp || 0} XP</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-12 relative z-10">
          {/* ================================================================ */}
          {/* SECTION 1: CHOOSE YOUR ADVENTURE (4 LEARNING PATHWAYS)           */}
          {/* ================================================================ */}
          <section aria-label="Choose Your Adventure" className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 m-0 flex items-center gap-2">
                  <span>🗺️ Choose Your Adventure</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-300">
                    4 Learning Pathways
                  </span>
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 m-0 mt-0.5">
                  Tap an Adventure below to explore its Levels on the map!
                </p>
              </div>

              {globalActiveInfo && (
                <button
                  onClick={() => {
                    sfx.playTap();
                    setSelectedAdventureId(globalActiveInfo.adventureId);
                    setTimeout(() => {
                      activeNodeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 150);
                  }}
                  className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#2EC4B6] to-[#14B8A6] text-white font-black text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer border-0"
                >
                  <Play size={13} className="fill-white" />
                  <span>Current Level: {globalActiveInfo.lesson.title?.[lang] || globalActiveInfo.lesson.title?.en}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {adventures.map((adv) => {
                const isSelected = adv.id === selectedAdventure.id;
                const advLessons = adv.modules.flatMap((m) => m.module.lessons || []);
                const advTotal = advLessons.length;
                const advDone = advLessons.filter((l) => Boolean(child.completed?.[l.id])).length;
                const advPct = advTotal > 0 ? Math.round((advDone / advTotal) * 100) : 0;
                const isAdvComplete = advTotal > 0 && advDone === advTotal;
                const isCurrentAdv = globalActiveInfo?.adventureId === adv.id;
                const hasFreeModule = adv.modules.some((m) => m.globalModIndex === 0);
                const isAdvPaywalled = !child.is_premium && !hasFreeModule;

                return (
                  <button
                    key={adv.id}
                    onClick={() => handleSelectAdventureTab(adv)}
                    aria-pressed={isSelected}
                    className={`group text-left rounded-3xl p-4 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between border-3 ${
                      isSelected
                        ? isDark
                          ? "bg-slate-800 border-[#2EC4B6] ring-4 ring-[#2EC4B6]/30 shadow-xl -translate-y-0.5"
                          : "bg-white border-[#2EC4B6] ring-4 ring-[#2EC4B6]/25 shadow-xl -translate-y-0.5"
                        : isDark
                        ? "bg-slate-900/90 border-slate-800 hover:border-slate-700 opacity-90 hover:opacity-100"
                        : "bg-white/85 border-slate-200/90 hover:border-teal-300 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div>
                      {/* Top row: Icon + Adventure badge */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-sm border"
                          style={{
                            background: isDark ? "rgba(255,255,255,0.07)" : adv.themeColors.cardBgLight,
                            borderColor: adv.themeColors.border
                          }}
                        >
                          {adv.emoji}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                            style={{
                              background: adv.themeColors.badgeBg,
                              color: isDark ? "#5EEAD4" : adv.themeColors.badgeText
                            }}
                          >
                            Adventure {adv.number}
                          </span>

                          {isAdvComplete ? (
                            <span className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5">
                              <Trophy size={11} /> Completed!
                            </span>
                          ) : isCurrentAdv ? (
                            <span className="text-[10px] font-black text-amber-500 flex items-center gap-0.5">
                              <Sparkles size={11} /> Continue Here
                            </span>
                          ) : isAdvPaywalled ? (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                              <Lock size={10} /> Pathway Pass
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Adventure Title */}
                      <h3
                        className={`text-sm sm:text-base font-black leading-snug m-0 mb-1 ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {adv.title}
                      </h3>
                    </div>

                    {/* Progress bar + Level count */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 w-full">
                      <div className="flex items-center justify-between text-[11px] font-extrabold mb-1.5">
                        <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                          {advDone} / {advTotal} Levels
                        </span>
                        <span style={{ color: adv.themeColors.accent }}>{advPct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${advPct}%`,
                            background: adv.themeColors.accent
                          }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/* SECTION 2: ACTIVE ADVENTURE BANNER & COMPANION GUIDE             */}
          {/* ================================================================ */}
          <section
            aria-label={selectedAdventure.title}
            className={`rounded-3xl p-5 sm:p-6 mb-8 border-3 shadow-lg relative overflow-hidden bg-gradient-to-br ${
              isDark ? selectedAdventure.themeColors.gradientDark : selectedAdventure.themeColors.gradientLight
            }`}
            style={{ borderColor: selectedAdventure.themeColors.border }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 flex-1">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl bg-white/90 dark:bg-slate-800/90 shadow-md border-2 border-white">
                    {selectedAdventure.emoji}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80 text-xs font-black uppercase tracking-wider mb-1.5" style={{ color: selectedAdventure.themeColors.accent }}>
                    <span>{selectedAdventure.subtitle}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h2
                      className={`text-xl sm:text-2xl md:text-3xl font-black m-0 ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                      style={{ fontFamily: F.display }}
                    >
                      {selectedAdventure.title}
                    </h2>
                    <button
                      onClick={() => {
                        sfx.playTap();
                        companionVoice.speakTTS(
                          `Adventure ${selectedAdventure.number}: ${selectedAdventure.title}. ${selectedAdventure.description} You have finished ${adventureCompletedLevels} out of ${adventureTotalLevels} levels!`,
                          companion,
                          ageGroup,
                          lang
                        );
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-800 text-sky-700 dark:text-teal-300 border border-sky-300 dark:border-slate-600 text-xs font-extrabold cursor-pointer hover:scale-105 active:scale-95"
                      title="Read Adventure description aloud"
                    >
                      <Volume2 size={13} />
                      <span>Read</span>
                    </button>
                    {onOpenSandbox && (
                      <button
                        onClick={() => {
                          sfx.playTap();
                          onOpenSandbox(selectedAdventure.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500 text-xs font-black cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                        title="Open Hands-On Practice Sandbox for this Adventure"
                      >
                        <span>🧪 Practice Sandbox</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 mb-0 max-w-2xl">
                    {selectedAdventure.description}
                  </p>
                </div>
              </div>

              {/* Adventure Completion / Progress Pill */}
              <div className="w-full md:w-56 bg-white/90 dark:bg-slate-900/85 rounded-2xl p-3.5 border-2 border-white/80 dark:border-slate-700 shadow-sm flex-shrink-0">
                <div className="flex items-center justify-between text-xs font-black mb-1.5">
                  <span className={isDark ? "text-slate-200" : "text-slate-700"}>
                    {isAdventureComplete ? "🏆 Adventure Complete!" : "Adventure Progress"}
                  </span>
                  <span style={{ color: selectedAdventure.themeColors.accent }}>
                    {adventureCompletedLevels}/{adventureTotalLevels} Levels
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${adventureProgressPct}%`,
                      background: selectedAdventure.themeColors.accent
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>{selectedAdventure.modules.length} {selectedAdventure.modules.length === 1 ? "Module" : "Modules"}</span>
                  <span>{adventureProgressPct}% Mastered</span>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* SECTION 3: WINDING ADVENTURE TRAIL & LEVELS                      */}
          {/* ================================================================ */}
          <div className="flex flex-col gap-10">
            {selectedAdventure.modules.map(({ module: mod, globalModIndex }, modInAdvIdx) => {
              const isPremiumModule = globalModIndex > 0;
              const isLockedByPaywall = isPremiumModule && !child.is_premium;
              const modLessons = mod.lessons || [];
              const modCompletedCount = modLessons.filter((l) => Boolean(child.completed?.[l.id])).length;
              const isModFullyCompleted = modLessons.length > 0 && modCompletedCount === modLessons.length;
              const rawModTitle = mod.name?.[lang] || mod.name?.en || `Module ${modInAdvIdx + 1}`;

              return (
                <div
                  key={mod.id}
                  className={`rounded-3xl p-5 sm:p-8 border-2 relative overflow-hidden transition-all ${
                    isDark
                      ? "bg-slate-900/75 border-slate-800 shadow-xl"
                      : "bg-white/90 border-teal-100 shadow-lg"
                  }`}
                >
                  {/* Module / Chapter Header inside the Adventure */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-8 border-b-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border-2 flex-shrink-0"
                        style={{
                          background: isDark ? "#1E293B" : selectedAdventure.themeColors.cardBgLight,
                          borderColor: selectedAdventure.themeColors.border
                        }}
                      >
                        {mod.badge?.icon || "🌟"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                            style={{
                              background: selectedAdventure.themeColors.badgeBg,
                              color: isDark ? "#5EEAD4" : selectedAdventure.themeColors.badgeText
                            }}
                          >
                            {rawModTitle}
                          </span>
                          {isModFullyCompleted && (
                            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                              <Check size={12} className="stroke-[3]" /> Badge Earned: {mod.badge?.name}
                            </span>
                          )}
                          {isLockedByPaywall && (
                            <button
                              onClick={() => {
                                sfx.playTap();
                                onShowPaywall();
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-300 bg-amber-500/15 border border-amber-400/40 px-2.5 py-0.5 rounded-full cursor-pointer hover:scale-105"
                            >
                              <Lock size={11} /> Pathway Pass Required
                            </button>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 m-0 mt-1">
                          {mod.goal?.[lang] || mod.goal?.en}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0 flex-wrap">
                      {onOpenSandbox && !isLockedByPaywall && (
                        <button
                          onClick={() => {
                            sfx.playTap();
                            onOpenSandbox(selectedAdventure.id, mod.id);
                          }}
                          className="text-xs font-black px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-700 dark:text-teal-300 border border-teal-400/40 cursor-pointer transition-transform active:scale-95"
                        >
                          🧪 Module Sandbox
                        </button>
                      )}
                      <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {modCompletedCount} / {modLessons.length} Levels Done
                      </span>
                    </div>
                  </div>

                  {/* Winding Level Nodes Trail */}
                  <div className="relative max-w-xl mx-auto py-4 flex flex-col items-center space-y-10">
                    {/* Connecting Trail Line */}
                    <div
                      className="absolute top-8 bottom-8 w-1.5 rounded-full left-1/2 -translate-x-1/2 pointer-events-none opacity-35"
                      style={{
                        background: `repeating-linear-gradient(to bottom, ${selectedAdventure.themeColors.trailStroke} 0, ${selectedAdventure.themeColors.trailStroke} 12px, transparent 12px, transparent 22px)`
                      }}
                    />

                    {modLessons.map((les, lesIndex) => {
                      runningLevelNumber++;
                      const displayLevelNum = runningLevelNumber;
                      const isCompleted = Boolean(child.completed?.[les.id]);
                      const isCurrentLevel = globalActiveInfo?.lesson.id === les.id;

                      // Determine if all prior lessons in the curriculum have been completed
                      const isUnlockedByProgression = isCompleted || isCurrentLevel;
                      const isLockedByProgression = !isUnlockedByProgression;
                      const isLocked = isLockedByPaywall || isLockedByProgression;

                      const earnedStars = child.stars?.[les.id] || (isCompleted ? 3 : 0);
                      const isFinaleLevel = lesIndex === modLessons.length - 1;

                      // Gentle winding zig-zag positions suitable for desktop and mobile
                      const offsets = [
                        "sm:-translate-x-16 -translate-x-5",
                        "translate-x-0",
                        "sm:translate-x-16 translate-x-5",
                        "translate-x-0"
                      ];
                      const offsetClass = offsets[lesIndex % 4];

                      return (
                        <div
                          key={les.id}
                          className={`relative z-10 flex flex-col items-center transition-transform duration-300 ${offsetClass}`}
                        >
                          {/* Floating Companion Indicator on Current Active Level */}
                          {isCurrentLevel && !isLockedByPaywall && (
                            <div
                              className="mb-2 flex flex-col items-center z-20"
                              style={{ animation: "floatSlow 2.2s ease-in-out infinite" }}
                            >
                              <div className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md border-2 border-white mb-1 flex items-center gap-1 whitespace-nowrap">
                                <Sparkles size={12} className="text-slate-950 fill-slate-950" />
                                <span>Continue Level {displayLevelNum}!</span>
                              </div>
                              <KobeAvatar size={48} character={companion} ageGroup={ageGroup} expression="happy" />
                            </div>
                          )}

                          {/* Level Node Button */}
                          <button
                            ref={isCurrentLevel ? activeNodeRef : null}
                            onClick={() => {
                              if (isLockedByPaywall) {
                                sfx.playBuzzer();
                                onShowPaywall();
                              } else if (isLockedByProgression) {
                                sfx.playBuzzer();
                                companionVoice.speak(
                                  `Level ${displayLevelNum} is locked! Finish the earlier levels first to unlock "${les.title?.[lang] || les.title?.en}".`,
                                  companion,
                                  ageGroup
                                );
                              } else {
                                sfx.playTap();
                                onSelectLesson(les);
                              }
                            }}
                            aria-label={`Level ${displayLevelNum}: ${les.title?.[lang] || les.title?.en} - ${
                              isCompleted
                                ? "Completed"
                                : isLockedByPaywall
                                ? "Locked by Pathway Pass"
                                : isCurrentLevel
                                ? "Current Level, tap to start"
                                : "Locked, complete previous levels first"
                            }`}
                            className={`rounded-full flex flex-col items-center justify-center border-4 shadow-xl transition-all duration-300 relative cursor-pointer select-none ${
                              isFinaleLevel ? "w-24 h-24" : "w-20 h-20"
                            } ${
                              isCompleted
                                ? "bg-gradient-to-br from-[#10B981] to-[#0D9488] border-white text-white hover:scale-105"
                                : isCurrentLevel && !isLockedByPaywall
                                ? "bg-gradient-to-br from-[#2EC4B6] to-[#0284C7] border-amber-300 text-white scale-110 ring-8 ring-[#2EC4B6]/25 hover:scale-115"
                                : isLockedByPaywall
                                ? isDark
                                  ? "bg-slate-800 border-amber-500/50 text-amber-300 hover:scale-105"
                                  : "bg-amber-50 border-amber-300 text-amber-700 hover:scale-105"
                                : isDark
                                ? "bg-slate-800 border-slate-700 text-slate-500 opacity-75"
                                : "bg-slate-200 border-slate-300 text-slate-400 opacity-80"
                            }`}
                            style={{
                              boxShadow:
                                isCurrentLevel && !isLockedByPaywall
                                  ? "0 10px 30px rgba(46, 196, 182, 0.45)"
                                  : isCompleted
                                  ? "0 8px 20px rgba(16, 185, 129, 0.3)"
                                  : undefined
                            }}
                          >
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-90">
                              Lv {displayLevelNum}
                            </span>

                            {isCompleted ? (
                              isFinaleLevel ? (
                                <Trophy size={28} className="text-amber-300 fill-amber-300 mt-0.5" />
                              ) : (
                                <Check size={28} className="text-white stroke-[3.5] mt-0.5" />
                              )
                            ) : isLockedByPaywall ? (
                              <Lock size={24} className="mt-0.5" />
                            ) : isCurrentLevel ? (
                              <Play size={28} className="text-white fill-white ml-0.5 mt-0.5" />
                            ) : (
                              <Lock size={24} className="mt-0.5" />
                            )}
                          </button>

                          {/* Stars Indicator for Completed Levels */}
                          {isCompleted && (
                            <div className="flex items-center gap-0.5 -mt-2.5 z-20 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 shadow-sm">
                              {[1, 2, 3].map((sNum) => (
                                <Star
                                  key={sNum}
                                  size={12}
                                  className={
                                    sNum <= earnedStars
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-300 dark:text-slate-600"
                                  }
                                />
                              ))}
                            </div>
                          )}

                          {/* Level Label Card */}
                          <div
                            onClick={() => {
                              if (isLockedByPaywall) {
                                sfx.playBuzzer();
                                onShowPaywall();
                              } else if (!isLockedByProgression) {
                                sfx.playTap();
                                onSelectLesson(les);
                              }
                            }}
                            className={`mt-2.5 px-4 py-2.5 rounded-2xl shadow-md border-2 text-center w-60 sm:w-64 transition-all cursor-pointer ${
                              isCurrentLevel && !isLockedByPaywall
                                ? isDark
                                  ? "bg-slate-800 text-white border-[#2EC4B6] ring-2 ring-[#2EC4B6]/30"
                                  : "bg-white text-slate-900 border-[#2EC4B6] ring-2 ring-[#2EC4B6]/25"
                                : isCompleted
                                ? isDark
                                  ? "bg-slate-800/95 text-white border-emerald-500/50"
                                  : "bg-white text-slate-900 border-emerald-300"
                                : isDark
                                ? "bg-slate-900/90 text-slate-300 border-slate-800"
                                : "bg-white/90 text-slate-700 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5 mb-0.5">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider ${
                                  isCurrentLevel && !isLockedByPaywall
                                    ? "text-[#2EC4B6]"
                                    : isCompleted
                                    ? "text-emerald-500"
                                    : "text-slate-400"
                                }`}
                              >
                                {isFinaleLevel
                                  ? `⭐ Level ${displayLevelNum} · Finale`
                                  : `Level ${displayLevelNum}`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">• {les.duration || "⏱ 3 min"}</span>
                            </div>

                            <div className="font-black text-sm sm:text-base leading-snug">
                              {les.title?.[lang] || les.title?.en}
                            </div>

                            <div className="mt-1.5 flex items-center justify-center">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                                  ✓ Completed · Tap to Replay
                                </span>
                              ) : isLockedByPaywall ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full">
                                  🔒 Unlock with Pathway Pass
                                </span>
                              ) : isCurrentLevel ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-gradient-to-r from-[#2EC4B6] to-[#0D9488] px-3 py-0.5 rounded-full shadow-sm">
                                  ▶ Start Level Now
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                  🔒 Complete Previous Level
                                </span>
                              )}
                            </div>

                            {onOpenSandbox &&
                              !isLocked &&
                              SANDBOX_ACTIVITIES.some((a) => a.lessonId === les.id) && (
                                <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex justify-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sfx.playTap();
                                      onOpenSandbox(selectedAdventure.id, mod.id, les.id);
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 px-2.5 py-1 rounded-full cursor-pointer"
                                  >
                                    <span>🧪 Hands-On Practice</span>
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // EXISTING MAP FOR OTHER AGE GROUPS (11–13 AND 14–18) — UNCHANGED
  // ============================================================================
  let foundActive = false;

  return (
    <div 
      className={`w-full min-h-screen pb-32 transition-colors duration-500 overflow-hidden relative ${isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]"}`}
    >
      <style>{`
        @keyframes drift {
          0% { transform: translateX(-100px); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateX(120vw); opacity: 0; }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes wave {
          0%, 100% { transform: translateX(0) scale(1); }
          50% { transform: translateX(-15px) scale(1.05); }
        }
      `}</style>

      {/* Moving Beach Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Clouds */}
        <div className={`absolute top-20 left-0 text-6xl opacity-30 animate-[drift_25s_linear_infinite] ${isDark ? 'grayscale brightness-50' : ''}`}>☁️</div>
        <div className={`absolute top-64 left-0 text-5xl opacity-20 animate-[drift_35s_linear_infinite_5s] ${isDark ? 'grayscale brightness-50' : ''}`}>☁️</div>
        
        {/* Sun/Moon */}
        <div className={`absolute top-32 right-12 text-7xl opacity-40 animate-[bob_10s_ease-in-out_infinite]`}>{isDark ? '🌕' : '☀️'}</div>

        {/* Beach Items (Drifting / Bobbing) */}
        <div className="absolute top-[400px] left-0 text-5xl opacity-40 animate-[drift_40s_linear_infinite_2s]">⛵</div>
        <div className="absolute top-[700px] -right-10 text-6xl opacity-30 animate-[bob_6s_ease-in-out_infinite] rotate-12">⛱️</div>
        <div className="absolute top-[1100px] -left-8 text-5xl opacity-30 animate-[wave_8s_ease-in-out_infinite] -rotate-12">🌊</div>
        <div className="absolute top-[1500px] right-4 text-4xl opacity-30 animate-[bob_7s_ease-in-out_infinite_1s] rotate-45">🐚</div>
        <div className="absolute top-[1900px] left-0 text-6xl opacity-30 animate-[drift_50s_linear_infinite_10s]">🚤</div>
      </div>
      {/* Map Header */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl border-b p-3 sm:p-4 flex items-center justify-between shadow-sm ${
        isDark ? "bg-[#0B1120]/80 border-slate-800" : "bg-white/80 border-slate-200"
      }`}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className={`p-2 rounded-xl transition-transform active:scale-95 flex-shrink-0 ${
                isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
              title="Return to Hub"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <div>
            <h2 className={`text-lg sm:text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontFamily: F.display }}>
              {isYoungExplorer ? "Adventure Map" : "Learning Map"}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
              {isYoungExplorer ? "Pathways & Levels" : "Your Adventure"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isYoungExplorer && (
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
              isDark ? "bg-slate-800/80 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
            }`}>
              <Check size={13} className="text-emerald-400" />
              <span className="text-xs font-black">
                {totalCompletedLevels} / {totalLevels} Levels
              </span>
            </div>
          )}

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
          }`}>
            <Star size={14} className="text-amber-400" />
            <span className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}>{child.xp || 0} XP</span>
          </div>
        </div>
      </div>

      {/* The Biomes */}
      <div className="flex flex-col relative">
        {modules.map((mod, modIndex) => {
          const biome = BIOME_COLORS[modIndex % BIOME_COLORS.length];
          const isPremiumModule = modIndex > 0;
          const isLockedByPaywall = isPremiumModule && !child.is_premium;

          const modLessons = mod.lessons || [];
          const modCompletedCount = modLessons.filter((l) => Boolean(child.completed?.[l.id])).length;
          const isModFullyCompleted = modLessons.length > 0 && modCompletedCount === modLessons.length;

          // Clean module title for Young Explorers (remove redundant "Module X: " prefix)
          const rawModTitle = mod.name?.[lang] || mod.name?.en || `Module ${modIndex + 1}`;
          const displayPathwayTitle = isYoungExplorer
            ? rawModTitle.replace(/^Module\s*\d+:\s*/i, "").trim()
            : rawModTitle;

          return (
            <div 
              key={mod.id} 
              className="relative py-24 px-4 flex flex-col items-center"
            >
              {/* Pathway Header Overlay */}
              <div className={`absolute top-6 left-1/2 -translate-x-1/2 backdrop-blur-md border px-6 sm:px-8 py-3 rounded-2xl text-center shadow-lg z-10 w-[92%] max-w-sm md:max-w-md ${
                isDark ? "bg-black/60 border-white/10" : "bg-white/70 border-slate-300"
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    isModFullyCompleted
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : isLockedByPaywall
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : isDark
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                      : "bg-teal-50 text-teal-700 border-teal-200"
                  }`}>
                    {isYoungExplorer ? `🧭 PATHWAY ${modIndex + 1}` : `Section ${modIndex + 1}`}
                  </span>

                  {isYoungExplorer && (
                    <span className="text-[10px] font-black text-slate-400">
                      {isModFullyCompleted
                        ? "⭐ Pathway Pass Earned!"
                        : isLockedByPaywall
                        ? "🔒 Premium"
                        : `${modCompletedCount}/${modLessons.length} Levels`}
                    </span>
                  )}
                </div>

                <h3 className={`text-lg sm:text-xl md:text-2xl font-black leading-tight ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontFamily: F.display }}>
                  {displayPathwayTitle}
                </h3>
              </div>

              {/* Lesson Nodes Path */}
              <div className="mt-20 w-full max-w-md flex flex-col items-center relative space-y-12">
                {/* SVG dashed path connecting nodes behind them */}
                <div className={`absolute top-0 bottom-0 w-2 border-l-4 border-dashed left-1/2 -translate-x-[2px] ${isDark ? "border-white/10" : "border-black/10"}`} />

                {mod.lessons.map((les, lesIndex) => {
                  const isCompleted = !!child.completed?.[les.id];
                  
                  // A lesson is active if it's the very first uncompleted one across the entire map
                  let isActive = false;
                  if (!isCompleted && !foundActive) {
                    isActive = true;
                    foundActive = true;
                  }

                  const isLockedByProgression = !isCompleted && !isActive;
                  const totallyLocked = isLockedByPaywall || isLockedByProgression;

                  // Zig-zag alignment (Left, Center, Right, Center)
                  const alignPattern = ["self-start ml-8", "self-center", "self-end mr-8", "self-center"];
                  const alignment = alignPattern[lesIndex % 4];

                  const isLastLesson = lesIndex === mod.lessons.length - 1;
                  const isBossNode = isLastLesson;

                  return (
                    <div key={les.id} className={`relative z-10 flex flex-col items-center ${alignment}`}>
                      
                      {isActive && (
                        <div className="absolute -top-16 flex flex-col items-center animate-[bounce_2s_ease-in-out_infinite] z-20 pointer-events-none">
                          {isYoungExplorer && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#FFD166] text-slate-900 font-black text-[10px] shadow-md border border-amber-600 mb-1 whitespace-nowrap">
                              👉 Level {lesIndex + 1} Ready!
                            </span>
                          )}
                          <KobeAvatar size={52} character={child.companion || "kobe"} ageGroup={ageGroup} />
                        </div>
                      )}

                      <button
                        ref={isActive ? activeNodeRef : null}
                        onClick={() => {
                          if (isLockedByPaywall) {
                            sfx.playBuzzer();
                            onShowPaywall();
                          } else if (totallyLocked) {
                            sfx.playBuzzer();
                          } else {
                            sfx.playTap();
                            onSelectLesson(les);
                          }
                        }}
                        className={`rounded-full flex items-center justify-center border-4 shadow-xl transition-all duration-300 relative group
                          ${isBossNode ? "w-24 h-24 border-[6px]" : "w-20 h-20"}
                          ${isCompleted ? "bg-gradient-to-br from-[#2EC4B6] to-[#20877d] border-white scale-95" : ""}
                          ${isActive ? "scale-110 ring-8 ring-[#2EC4B6]/30 animate-pulse border-white bg-gradient-to-br from-[#2EC4B6] to-[#20877d]" : ""}
                          ${totallyLocked ? (isDark ? "bg-slate-800 border-slate-700 opacity-60" : "bg-slate-200 border-slate-300 opacity-60") : ""}
                        `}
                        style={{
                          boxShadow: isActive ? `0 0 40px #2EC4B6` : isCompleted ? `0 0 20px #2EC4B6` : 'none'
                        }}
                      >
                        {isCompleted && (isBossNode ? <Star size={40} className="text-white fill-white" /> : <Check size={32} className="text-white" />)}
                        {isActive && <Play size={isBossNode ? 40 : 32} className="text-white ml-1" />}
                        {totallyLocked && <Lock size={isBossNode ? 36 : 28} className={isDark ? "text-slate-500" : "text-slate-400"} />}
                      </button>

                      {/* Node Label (Centered below) */}
                      <div className={`mt-4 px-4 py-2 rounded-xl z-30 shadow-md border text-center w-max max-w-[210px] flex flex-col items-center transition-all ${
                        isActive
                          ? (isDark ? "bg-[#1e293b] text-white border-teal-400 ring-2 ring-teal-400/40" : "bg-white text-slate-900 border-teal-400 ring-2 ring-teal-400/30")
                          : (isDark ? "bg-[#1e293b]/95 text-white border-slate-700" : "bg-white/95 text-slate-800 border-slate-200")
                      }`}>
                        <span className={`font-black text-[10px] uppercase tracking-wider mb-0.5 ${
                          isActive ? "text-teal-400 font-black" : "opacity-60"
                        }`}>
                          {isYoungExplorer 
                            ? (isBossNode ? `⭐ LEVEL ${lesIndex + 1} · FINALE` : `LEVEL ${lesIndex + 1}`) 
                            : `Lesson ${lesIndex + 1}`}
                        </span>

                        <span className="font-black text-sm sm:text-base block leading-tight">
                          {les.title?.[lang] || les.title?.en}
                        </span>

                        {isYoungExplorer && (
                          <div className="mt-1 flex items-center gap-1">
                            {isCompleted && (
                              <span className="text-[10px] font-black text-emerald-400">
                                ✓ Mastered
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] font-black text-[#2EC4B6] animate-pulse">
                                ⚡ Current Quest
                              </span>
                            )}
                            {totallyLocked && (
                              <span className="text-[10px] font-bold text-slate-400">
                                {isLockedByPaywall ? "🔒 Premium Gate" : "🔒 Complete Prior Levels"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
