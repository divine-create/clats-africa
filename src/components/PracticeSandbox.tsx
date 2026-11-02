/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CLATS Young Explorers (Ages 6–10): Interactive Practice Sandbox
 *
 * Organization: Learning Pathway (Adventure) -> Module -> Lesson -> Practice Activity
 * Supports hands-on, non-quiz activities across all 4 Young Explorers pathways:
 *   1. AI & Smart Technology
 *   2. Digital Literacy and Cyber Safety
 *   3. Creativity & Play
 *   4. Adaptability & Lifelong Learning
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Child, Language } from "../types";
import { CURRICULUM } from "../data/curriculum";
import {
  SANDBOX_ACTIVITIES,
  SandboxActivity,
  SandboxCompletionRecord,
  getSandboxProgressMap,
  markSandboxActivityCompleted
} from "../data/sandboxActivities";
import { KobeAvatar } from "./KobeAvatar";
import { sfx, companionVoice } from "../utils/audio";
import { F } from "../utils/config";
import {
  Sparkles,
  Check,
  RotateCcw,
  Volume2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Lock,
  Play,
  Palette,
  Music,
  Eraser,
  Wand2,
  CheckCircle2,
  HelpCircle
} from "lucide-react";

interface PracticeSandboxProps {
  child: Child;
  lang: Language;
  theme?: "light" | "dark";
  initialAdventureId?: string;
  initialModuleId?: string;
  initialLessonId?: string;
  initialActivityId?: string;
  onBack: () => void;
  onShowPaywall: () => void;
  onSelectLesson?: (lessonId: string) => void;
  onCompleteActivity?: (activityId: string, xpEarned: number) => void;
}

interface AdventureMeta {
  id: "academy-1" | "academy-2" | "academy-3" | "academy-4";
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  gradientLight: string;
  gradientDark: string;
}

const ADVENTURE_META: AdventureMeta[] = [
  {
    id: "academy-1",
    number: 1,
    title: "AI & Smart Technology",
    subtitle: "Smart Discovery Lab",
    emoji: "🤖",
    accent: "#10B981",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    badgeText: "#059669",
    border: "#2EC4B6",
    gradientLight: "from-emerald-50 via-teal-50 to-cyan-50",
    gradientDark: "from-emerald-950/60 via-teal-950/50 to-slate-900"
  },
  {
    id: "academy-2",
    number: 2,
    title: "Digital Literacy and Cyber Safety",
    subtitle: "Safe Harbor Workbench",
    emoji: "🛡️",
    accent: "#0284C7",
    badgeBg: "rgba(2, 132, 199, 0.15)",
    badgeText: "#0284C7",
    border: "#38BDF8",
    gradientLight: "from-sky-50 via-cyan-50 to-blue-50",
    gradientDark: "from-sky-950/60 via-cyan-950/50 to-slate-900"
  },
  {
    id: "academy-3",
    number: 3,
    title: "Creativity & Play",
    subtitle: "Rainbow Studio Canvas",
    emoji: "🎨",
    accent: "#F59E0B",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    badgeText: "#D97706",
    border: "#FBBF24",
    gradientLight: "from-amber-50 via-orange-50 to-rose-50",
    gradientDark: "from-amber-950/60 via-orange-950/40 to-slate-900"
  },
  {
    id: "academy-4",
    number: 4,
    title: "Adaptability & Lifelong Learning",
    subtitle: "Wonder Peak Discovery Lab",
    emoji: "🧭",
    accent: "#8B5CF6",
    badgeBg: "rgba(139, 92, 246, 0.15)",
    badgeText: "#7C3AED",
    border: "#A855F7",
    gradientLight: "from-purple-50 via-fuchsia-50 to-indigo-50",
    gradientDark: "from-purple-950/60 via-indigo-950/50 to-slate-900"
  }
];

export const PracticeSandbox: React.FC<PracticeSandboxProps> = ({
  child,
  lang,
  theme = "dark",
  initialAdventureId,
  initialModuleId,
  initialLessonId,
  initialActivityId,
  onBack,
  onShowPaywall,
  onSelectLesson,
  onCompleteActivity
}) => {
  const isDark = theme === "dark";
  const companion = child.companion === "chibi" ? "chibi" : "kobe";
  const compName = companion === "chibi" ? "Chibi" : "Kobe";
  const ageGroup = child.ageGroup || "early explorers";

  const course = CURRICULUM["early explorers"] || CURRICULUM[ageGroup];
  const modules = course?.modules || [];

  const [progressMap, setProgressMap] = useState<Record<string, SandboxCompletionRecord>>(() =>
    getSandboxProgressMap(child.id)
  );

  // Sync progress on child change
  useEffect(() => {
    setProgressMap(getSandboxProgressMap(child.id));
  }, [child.id]);

  // Determine initial adventure and active activity
  const [selectedAdventureId, setSelectedAdventureId] = useState<AdventureMeta["id"]>(() => {
    if (initialActivityId) {
      const act = SANDBOX_ACTIVITIES.find((a) => a.id === initialActivityId);
      if (act) return act.adventureId;
    }
    if (initialLessonId) {
      const act = SANDBOX_ACTIVITIES.find((a) => a.lessonId === initialLessonId);
      if (act) return act.adventureId;
    }
    if (initialModuleId) {
      const act = SANDBOX_ACTIVITIES.find((a) => a.moduleId === initialModuleId);
      if (act) return act.adventureId;
    }
    if (
      initialAdventureId &&
      ADVENTURE_META.some((a) => a.id === initialAdventureId)
    ) {
      return initialAdventureId as AdventureMeta["id"];
    }
    return "academy-1";
  });

  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>(initialModuleId || "all");
  const [activeActivity, setActiveActivity] = useState<SandboxActivity | null>(() => {
    if (initialActivityId) {
      return SANDBOX_ACTIVITIES.find((a) => a.id === initialActivityId) || null;
    }
    if (initialLessonId) {
      return SANDBOX_ACTIVITIES.find((a) => a.lessonId === initialLessonId) || null;
    }
    return null;
  });

  // Helper to check if a module is locked by Pathway Pass paywall
  const isModulePaywalled = useCallback(
    (moduleId: string): boolean => {
      if (child.is_premium) return false;
      const globalModIdx = modules.findIndex((m) => m.id === moduleId);
      return globalModIdx > 0;
    },
    [child.is_premium, modules]
  );

  const selectedAdventure = useMemo(
    () => ADVENTURE_META.find((a) => a.id === selectedAdventureId) || ADVENTURE_META[0],
    [selectedAdventureId]
  );

  const adventureActivities = useMemo(
    () => SANDBOX_ACTIVITIES.filter((a) => a.adventureId === selectedAdventure.id),
    [selectedAdventure.id]
  );

  const adventureModules = useMemo(() => {
    const map = new Map<string, string>();
    for (const act of adventureActivities) {
      if (!map.has(act.moduleId)) {
        map.set(act.moduleId, act.moduleTitle);
      }
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [adventureActivities]);

  const filteredActivities = useMemo(() => {
    if (selectedModuleFilter === "all") return adventureActivities;
    return adventureActivities.filter((a) => a.moduleId === selectedModuleFilter);
  }, [adventureActivities, selectedModuleFilter]);

  const totalActivitiesCount = SANDBOX_ACTIVITIES.length;
  const completedActivitiesCount = SANDBOX_ACTIVITIES.filter(
    (a) => progressMap[a.id]?.completed
  ).length;

  // Speak helper respecting Reader Mode
  const speakText = useCallback(
    (text: string) => {
      companionVoice.speak(text, companion, ageGroup);
    },
    [companion, ageGroup]
  );

  // Narrate hub or active activity on entry
  useEffect(() => {
    if (activeActivity) {
      const timer = setTimeout(() => {
        speakText(`${activeActivity.title}. ${activeActivity.instructions}`);
      }, 450);
      return () => clearTimeout(timer);
    } else {
      const advDone = adventureActivities.filter((a) => progressMap[a.id]?.completed).length;
      const timer = setTimeout(() => {
        speakText(
          `Practice Sandbox: ${selectedAdventure.title}. Choose a hands-on activity to experiment and practise! You have completed ${advDone} of ${adventureActivities.length} activities in this Adventure.`
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeActivity, selectedAdventure, adventureActivities.length]);

  const handleCompleteActivity = useCallback(
    (activity: SandboxActivity) => {
      sfx.playSuccess();
      const wasAlreadyDone = Boolean(progressMap[activity.id]?.completed);
      const updated = markSandboxActivityCompleted(child.id, activity);
      setProgressMap({ ...updated });
      speakText(`${activity.successMessage} ${activity.learningObjective}`);
      if (onCompleteActivity) {
        onCompleteActivity(activity.id, wasAlreadyDone ? 5 : 25);
      }
    },
    [child.id, speakText, progressMap, onCompleteActivity]
  );

  const handleLaunchActivity = (act: SandboxActivity) => {
    if (isModulePaywalled(act.moduleId)) {
      sfx.playBuzzer();
      onShowPaywall();
      return;
    }
    sfx.playTap();
    setActiveActivity(act);
  };

  // ============================================================================
  // RENDER INTERACTIVE ACTIVITY WORKBENCH WHEN AN ACTIVITY IS SELECTED
  // ============================================================================
  if (activeActivity) {
    const isCompleted = Boolean(progressMap[activeActivity.id]?.completed);
    return (
      <div
        className={`w-full min-h-screen pb-32 transition-colors duration-300 ${
          isDark ? "bg-[#0B1120] text-white" : "bg-[#F0FDFA] text-slate-900"
        }`}
      >
        {/* Top Bar */}
        <div
          className={`sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-3 sm:px-6 flex items-center justify-between shadow-sm ${
            isDark ? "bg-[#0B1120]/90 border-slate-800" : "bg-white/90 border-teal-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sfx.playTap();
                setActiveActivity(null);
              }}
              className={`px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 border-2 transition-transform active:scale-95 cursor-pointer ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  : "bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-200"
              }`}
            >
              <ArrowLeft size={18} />
              <span>All Sandbox Activities</span>
            </button>

            <div className="hidden sm:block">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#2EC4B6]">
                {activeActivity.adventureTitle} · {activeActivity.moduleTitle}
              </div>
              <div className="text-sm font-black truncate">
                Lesson: {activeActivity.lessonTitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sfx.playTap();
                companionVoice.speakTTS(
                  `${activeActivity.title}. ${activeActivity.instructions}. Learning Goal: ${activeActivity.learningObjective}`,
                  companion,
                  ageGroup,
                  lang
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2EC4B6]/15 text-[#0F766E] dark:text-[#2EC4B6] border border-[#2EC4B6]/40 text-xs font-black cursor-pointer hover:scale-105 active:scale-95"
              title="Read instructions aloud"
            >
              <Volume2 size={14} />
              <span>Read Aloud</span>
            </button>

            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black">
                <CheckCircle2 size={14} />
                <span>Completed</span>
              </span>
            )}
          </div>
        </div>

        {/* Main Workbench Container */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
          {/* Activity Header & Companion Prompt */}
          <div
            className={`rounded-3xl p-5 sm:p-6 mb-6 border-3 shadow-lg ${
              isDark
                ? "bg-slate-900/90 border-slate-700"
                : "bg-white border-teal-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-4xl bg-teal-500/10 border-2 border-teal-400/40 shrink-0">
                {activeActivity.emoji}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-300">
                    {activeActivity.moduleTitle}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    • Connected to Level: <strong>{activeActivity.lessonTitle}</strong>
                  </span>
                </div>

                <h1
                  className="text-xl sm:text-2xl md:text-3xl font-black m-0"
                  style={{ fontFamily: F.display }}
                >
                  {activeActivity.title}
                </h1>

                <p className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-200 mt-1.5 mb-0">
                  {activeActivity.instructions}
                </p>
              </div>

              <div className="shrink-0 hidden md:flex flex-col items-center">
                <KobeAvatar
                  size={56}
                  character={companion}
                  ageGroup={ageGroup}
                  expression="happy"
                />
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-500 mt-1">
                  {compName} Guide
                </span>
              </div>
            </div>

            {/* Helper Tip Bar */}
            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <HelpCircle size={15} className="text-amber-500 shrink-0" />
                <span>
                  <strong>Learning Goal:</strong> {activeActivity.learningObjective}
                </span>
              </div>

              {onSelectLesson && (
                <button
                  onClick={() => {
                    sfx.playTap();
                    onSelectLesson(activeActivity.lessonId);
                  }}
                  className="text-xs font-black text-[#2EC4B6] hover:underline cursor-pointer bg-transparent border-0"
                >
                  Watch "{activeActivity.lessonTitle}" Lesson →
                </button>
              )}
            </div>
          </div>

          {/* Engine-Specific Interactive Workbench */}
          {activeActivity.engineType === "sorting-buckets" && (
            <SortingBucketsEngine
              key={activeActivity.id}
              activity={activeActivity}
              isDark={isDark}
              onComplete={() => handleCompleteActivity(activeActivity)}
              speakText={speakText}
            />
          )}

          {activeActivity.engineType === "device-matcher" && (
            <DeviceMatcherEngine
              key={activeActivity.id}
              activity={activeActivity}
              isDark={isDark}
              onComplete={() => handleCompleteActivity(activeActivity)}
              speakText={speakText}
            />
          )}

          {activeActivity.engineType === "sequence-builder" && (
            <SequenceBuilderEngine
              key={activeActivity.id}
              activity={activeActivity}
              isDark={isDark}
              onComplete={() => handleCompleteActivity(activeActivity)}
              speakText={speakText}
            />
          )}

          {activeActivity.engineType === "pattern-builder" && (
            <PatternBuilderEngine
              key={activeActivity.id}
              activity={activeActivity}
              isDark={isDark}
              onComplete={() => handleCompleteActivity(activeActivity)}
              speakText={speakText}
            />
          )}

          {activeActivity.engineType === "digital-canvas" && (
            <DigitalCanvasEngine
              key={activeActivity.id}
              activity={activeActivity}
              isDark={isDark}
              onComplete={() => handleCompleteActivity(activeActivity)}
              speakText={speakText}
            />
          )}

          {activeActivity.engineType === "sound-pad" && (
            <SoundPadEngine
              key={activeActivity.id}
              activity={activeActivity}
              isDark={isDark}
              onComplete={() => handleCompleteActivity(activeActivity)}
              speakText={speakText}
            />
          )}

          {activeActivity.engineType === "scenario-simulator" && (
            <ScenarioSimulatorEngine
              key={activeActivity.id}
              activity={activeActivity}
              isDark={isDark}
              onComplete={() => handleCompleteActivity(activeActivity)}
              speakText={speakText}
            />
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER SANDBOX DISCOVERY HUB (4 ADVENTURES -> MODULES -> LESSONS -> ACTIVITIES)
  // ============================================================================
  return (
    <div
      className={`w-full min-h-screen pb-32 transition-colors duration-300 ${
        isDark ? "bg-[#0B1120] text-white" : "bg-[#F0FDFA] text-slate-900"
      }`}
    >
      {/* Top Bar */}
      <div
        className={`sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-3 sm:px-6 flex items-center justify-between shadow-sm ${
          isDark ? "bg-[#0B1120]/90 border-slate-800" : "bg-white/90 border-teal-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sfx.playTap();
              onBack();
            }}
            className={`p-2.5 rounded-2xl transition-transform active:scale-95 flex-shrink-0 border-2 cursor-pointer ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                : "bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-200"
            }`}
            title="Return"
            aria-label="Return"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <Wand2 size={15} className="text-[#2EC4B6]" />
              <span className="text-[11px] font-black uppercase tracking-wider text-[#2EC4B6]">
                Young Explorers · Hands-On Lab
              </span>
            </div>
            <h1
              className="text-lg sm:text-2xl font-black leading-tight m-0"
              style={{ fontFamily: F.display }}
            >
              Practice Sandbox
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              sfx.playTap();
              speakText(
                `Welcome to the Practice Sandbox! Pick one of the 4 Adventures below to sort, match, draw, make music, and solve puzzles connected to your lessons!`
              );
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#2EC4B6]/15 text-[#0F766E] dark:text-[#2EC4B6] border border-[#2EC4B6]/30 text-xs font-black cursor-pointer"
          >
            <Volume2 size={14} />
            <span className="hidden sm:inline">Read Guide</span>
          </button>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 ${
              isDark
                ? "bg-slate-800/90 border-slate-700 text-emerald-300"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <Check size={14} className="text-emerald-500 stroke-[3]" />
            <span className="text-xs font-black">
              {completedActivitiesCount} / {totalActivitiesCount} Practised
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        {/* Section 1: 4 Adventure Tabs */}
        <section aria-label="Select Adventure Pathway" className="mb-7">
          <div className="mb-3">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 m-0">
              🧪 Step 1: Choose an Adventure Pathway
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 m-0 mt-0.5">
              Every hands-on activity is connected to an Adventure, Module, and Lesson in your curriculum!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {ADVENTURE_META.map((adv) => {
              const isSelected = adv.id === selectedAdventure.id;
              const advActs = SANDBOX_ACTIVITIES.filter((a) => a.adventureId === adv.id);
              const advDone = advActs.filter((a) => progressMap[a.id]?.completed).length;

              return (
                <button
                  key={adv.id}
                  onClick={() => {
                    sfx.playTap();
                    setSelectedAdventureId(adv.id);
                    setSelectedModuleFilter("all");
                  }}
                  className={`text-left rounded-3xl p-4 transition-all cursor-pointer border-3 flex flex-col justify-between ${
                    isSelected
                      ? isDark
                        ? "bg-slate-800 border-[#2EC4B6] ring-4 ring-[#2EC4B6]/30 shadow-xl -translate-y-0.5"
                        : "bg-white border-[#2EC4B6] ring-4 ring-[#2EC4B6]/25 shadow-xl -translate-y-0.5"
                      : isDark
                      ? "bg-slate-900/90 border-slate-800 hover:border-slate-700 opacity-90"
                      : "bg-white/85 border-slate-200 hover:border-teal-300 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-2xl">{adv.emoji}</span>
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                        style={{
                          background: adv.badgeBg,
                          color: isDark ? "#5EEAD4" : adv.badgeText
                        }}
                      >
                        Adventure {adv.number}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-black leading-snug m-0">
                      {adv.title}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                      {adv.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] font-black">
                    <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                      {advDone} / {advActs.length} Activities
                    </span>
                    <span style={{ color: adv.accent }}>
                      {advActs.length > 0 ? Math.round((advDone / advActs.length) * 100) : 0}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Module Filter Pills */}
        {adventureModules.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
              Filter by Module:
            </span>
            <button
              onClick={() => {
                sfx.playTap();
                setSelectedModuleFilter("all");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black cursor-pointer border transition-all ${
                selectedModuleFilter === "all"
                  ? "bg-[#2EC4B6] text-white border-[#2EC4B6]"
                  : isDark
                  ? "bg-slate-800 text-slate-300 border-slate-700"
                  : "bg-white text-slate-700 border-slate-300"
              }`}
            >
              All Modules ({adventureActivities.length})
            </button>
            {adventureModules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => {
                  sfx.playTap();
                  setSelectedModuleFilter(mod.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black cursor-pointer border transition-all ${
                  selectedModuleFilter === mod.id
                    ? "bg-[#2EC4B6] text-white border-[#2EC4B6]"
                    : isDark
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                {mod.title}
              </button>
            ))}
          </div>
        )}

        {/* Section 3: Activities Grid Organized by Module & Lesson */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredActivities.map((act) => {
            const isDone = Boolean(progressMap[act.id]?.completed);
            const isPaywalled = isModulePaywalled(act.moduleId);
            const lessonDone = Boolean(child.completed?.[act.lessonId]);

            return (
              <div
                key={act.id}
                onClick={() => handleLaunchActivity(act)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleLaunchActivity(act);
                  }
                }}
                className={`group rounded-3xl p-5 sm:p-6 border-3 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isDone
                    ? isDark
                      ? "bg-slate-900/95 border-emerald-500/60 hover:border-emerald-400 shadow-lg"
                      : "bg-white border-emerald-300 hover:border-emerald-400 shadow-lg"
                    : isDark
                    ? "bg-slate-900/90 border-slate-800 hover:border-[#2EC4B6] shadow-md"
                    : "bg-white border-teal-200/80 hover:border-[#2EC4B6] shadow-md"
                } hover:-translate-y-0.5`}
              >
                <div>
                  {/* Top metadata row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                        style={{
                          background: selectedAdventure.badgeBg,
                          color: isDark ? "#5EEAD4" : selectedAdventure.badgeText
                        }}
                      >
                        {act.moduleTitle}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                        • {act.subtitle}
                      </span>
                    </div>

                    {isDone ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-black">
                        <Check size={12} className="stroke-[3]" /> Practised!
                      </span>
                    ) : isPaywalled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-xs font-black">
                        <Lock size={12} /> Pathway Pass
                      </span>
                    ) : null}
                  </div>

                  {/* Icon + Title */}
                  <div className="flex items-start gap-3.5 mb-2">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-teal-500/10 border border-teal-400/30 shrink-0">
                      {act.emoji}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black leading-snug m-0">
                        {act.title}
                      </h3>
                      <div className="text-xs font-bold text-[#2EC4B6] mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>📖 Lesson: {act.lessonTitle}</span>
                        {lessonDone && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/15 text-emerald-500 rounded-md font-black">
                            ✓ Lesson Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-2 mb-4">
                    {act.instructions}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                    🎯 {act.learningObjective}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl font-black text-xs shrink-0 shadow-sm ${
                      isPaywalled
                        ? "bg-amber-500 text-slate-950"
                        : isDone
                        ? "bg-emerald-500 text-white"
                        : "bg-[#2EC4B6] text-white"
                    }`}
                  >
                    {isPaywalled ? (
                      <>
                        <Lock size={13} />
                        <span>Unlock</span>
                      </>
                    ) : isDone ? (
                      <>
                        <RotateCcw size={13} />
                        <span>Practise Again</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} className="fill-white" />
                        <span>Start Activity</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ENGINE 1: SORTING BUCKETS ENGINE
// ============================================================================
const SortingBucketsEngine: React.FC<{
  activity: SandboxActivity;
  isDark: boolean;
  onComplete: () => void;
  speakText: (t: string) => void;
}> = ({ activity, isDark, onComplete, speakText }) => {
  const cfg = activity.sortingConfig;
  const buckets = cfg ? [cfg.bucketA, cfg.bucketB] : [];
  const items = cfg?.items || [];

  const [placed, setPlaced] = useState<Record<string, "A" | "B">>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    items[0]?.id || null
  );
  const [feedback, setFeedback] = useState<{
    text: string;
    isCorrect: boolean;
  } | null>(null);

  const remainingItems = items.filter((item) => !placed[item.id]);
  const currentItem =
    remainingItems.find((i) => i.id === selectedItemId) || remainingItems[0] || null;
  const allSorted = remainingItems.length === 0 && items.length > 0;

  useEffect(() => {
    if (allSorted) {
      onComplete();
    }
  }, [allSorted]);

  const handleSortIntoBucket = (bucketId: "A" | "B") => {
    if (!currentItem) return;
    if (currentItem.correctBucket === bucketId) {
      sfx.playCoin();
      const nextPlaced = { ...placed, [currentItem.id]: bucketId };
      setPlaced(nextPlaced);
      setFeedback({ text: `Great job! ${currentItem.hint}`, isCorrect: true });
      speakText(`Correct! ${currentItem.hint}`);
      const nextRemaining = items.filter((i) => !nextPlaced[i.id]);
      setSelectedItemId(nextRemaining[0]?.id || null);
    } else {
      sfx.playBuzzer();
      setFeedback({
        text: `Not quite! Hint: ${currentItem.hint}`,
        isCorrect: false
      });
      speakText(`Try the other group! ${currentItem.hint}`);
    }
  };

  const handleReset = () => {
    sfx.playTap();
    setPlaced({});
    setSelectedItemId(items[0]?.id || null);
    setFeedback(null);
  };

  return (
    <div className="space-y-6">
      {/* Item Queue */}
      {!allSorted && currentItem && (
        <div
          className={`rounded-3xl p-5 sm:p-6 border-3 text-center ${
            isDark ? "bg-slate-900 border-teal-500/40" : "bg-white border-teal-300"
          } shadow-lg`}
        >
          <div className="text-xs font-black uppercase tracking-wider text-[#2EC4B6] mb-2">
            Item {Object.keys(placed).length + 1} of {items.length} · Tap a Group Below to Sort!
          </div>

          <div className="inline-flex flex-col items-center justify-center px-8 py-5 rounded-3xl bg-gradient-to-br from-teal-500/15 to-emerald-500/10 border-2 border-[#2EC4B6] mb-3">
            <span className="text-5xl mb-2">{currentItem.emoji}</span>
            <span className="text-lg sm:text-xl font-black">{currentItem.label}</span>
          </div>

          {/* Remaining items preview */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
            {remainingItems.map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  sfx.playTap();
                  setSelectedItemId(it.id);
                  speakText(it.label);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                  it.id === currentItem.id
                    ? "bg-[#2EC4B6] text-white border-[#2EC4B6] scale-105"
                    : isDark
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {it.emoji} {it.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-2xl p-4 border-2 font-black text-sm flex items-center justify-between ${
            feedback.isCorrect
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
              : "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
          }`}
        >
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Two Sorting Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {buckets.map((b) => {
          const bucketItems = items.filter((i) => placed[i.id] === b.id);
          return (
            <button
              key={b.id}
              type="button"
              disabled={allSorted}
              onClick={() => handleSortIntoBucket(b.id)}
              className={`rounded-3xl p-5 sm:p-6 border-3 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[220px] ${
                isDark
                  ? "bg-slate-900/90 hover:bg-slate-800/90 border-slate-700"
                  : "bg-white hover:bg-teal-50/40 border-slate-200 shadow-md"
              } active:scale-[0.99]`}
              style={{ borderColor: b.color }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{b.emoji}</span>
                    <h3 className="text-base sm:text-lg font-black m-0">{b.label}</h3>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-black text-white"
                    style={{ background: b.color }}
                  >
                    {bucketItems.length} Sorted
                  </span>
                </div>

                {!allSorted && (
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">
                    Tap here to place <strong>{currentItem?.label}</strong> in this group!
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {bucketItems.map((bi) => (
                    <span
                      key={bi.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-black"
                    >
                      <span>{bi.emoji}</span>
                      <span>{bi.label}</span>
                      <Check size={12} className="text-emerald-500" />
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Completion Celebration */}
      {allSorted && (
        <div className="rounded-3xl p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-center shadow-xl">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-2xl font-black m-0">All Items Sorted!</h3>
          <p className="text-sm font-bold opacity-95 mt-1 mb-4">
            {activity.successMessage}
          </p>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-2xl bg-white text-emerald-900 font-black text-sm shadow-md cursor-pointer border-0 inline-flex items-center gap-2"
          >
            <RotateCcw size={15} />
            <span>Sort Again</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ENGINE 2: DEVICE MATCHER & SIMULATION ENGINE
// ============================================================================
const DeviceMatcherEngine: React.FC<{
  activity: SandboxActivity;
  isDark: boolean;
  onComplete: () => void;
  speakText: (t: string) => void;
}> = ({ activity, isDark, onComplete, speakText }) => {
  const pairs = activity.matcherConfig?.pairs || [];
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(
    pairs[0]?.id || null
  );
  const [matchedIds, setMatchedIds] = useState<Record<string, boolean>>({});
  const [simulationMsg, setSimulationMsg] = useState<string | null>(null);

  // Deterministic shuffled right column
  const rightOptions = useMemo(() => {
    const copy = [...pairs];
    return copy.reverse();
  }, [pairs]);

  const allMatched =
    pairs.length > 0 && pairs.every((p) => Boolean(matchedIds[p.id]));

  useEffect(() => {
    if (allMatched) {
      onComplete();
    }
  }, [allMatched]);

  const handleSelectRight = (pairId: string) => {
    if (!selectedLeftId) return;
    const targetPair = pairs.find((p) => p.id === selectedLeftId);
    if (!targetPair) return;

    if (targetPair.id === pairId) {
      sfx.playCoin();
      const next = { ...matchedIds, [pairId]: true };
      setMatchedIds(next);
      setSimulationMsg(targetPair.simulationReaction);
      speakText(targetPair.simulationReaction);
      const nextUnmatched = pairs.find((p) => !next[p.id]);
      setSelectedLeftId(nextUnmatched?.id || null);
    } else {
      sfx.playBuzzer();
      setSimulationMsg("Try matching with a different helper job!");
      speakText("Try matching with a different job!");
    }
  };

  return (
    <div className="space-y-6">
      {simulationMsg && (
        <div className="rounded-2xl p-4 border-2 bg-teal-500/15 border-teal-400/50 text-teal-800 dark:text-teal-200 font-black text-sm flex items-center gap-3">
          <Sparkles size={18} className="text-[#2EC4B6] shrink-0" />
          <span>{simulationMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Devices / Tools */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#2EC4B6] m-0">
            1. {activity.matcherConfig?.promptLabel || "Tap a Device or Helper"}
          </h3>
          {pairs.map((p) => {
            const isDone = Boolean(matchedIds[p.id]);
            const isSel = selectedLeftId === p.id;
            return (
              <button
                key={p.id}
                disabled={isDone}
                onClick={() => {
                  sfx.playTap();
                  setSelectedLeftId(p.id);
                  speakText(p.leftLabel);
                }}
                className={`w-full rounded-2xl p-4 border-3 text-left flex items-center justify-between transition-all cursor-pointer ${
                  isDone
                    ? "bg-emerald-500/15 border-emerald-500/40 opacity-80"
                    : isSel
                    ? "bg-[#2EC4B6]/20 border-[#2EC4B6] ring-3 ring-[#2EC4B6]/30 scale-[1.01]"
                    : isDark
                    ? "bg-slate-900 border-slate-700 hover:border-slate-600"
                    : "bg-white border-slate-200 hover:border-teal-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.leftEmoji}</span>
                  <span className="font-black text-sm sm:text-base">{p.leftLabel}</span>
                </div>
                {isDone && <Check size={18} className="text-emerald-500 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Right Column: Uses / Jobs */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 m-0">
            2. {activity.matcherConfig?.targetLabel || "Tap What It Does!"}
          </h3>
          {rightOptions.map((p) => {
            const isDone = Boolean(matchedIds[p.id]);
            return (
              <button
                key={p.id}
                disabled={isDone}
                onClick={() => handleSelectRight(p.id)}
                className={`w-full rounded-2xl p-4 border-3 text-left flex items-center justify-between transition-all cursor-pointer ${
                  isDone
                    ? "bg-emerald-500/15 border-emerald-500/40 opacity-80"
                    : isDark
                    ? "bg-slate-900 border-slate-700 hover:border-amber-400"
                    : "bg-white border-slate-200 hover:border-amber-400 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.rightEmoji}</span>
                  <span className="font-bold text-xs sm:text-sm">{p.rightLabel}</span>
                </div>
                {isDone && <Check size={18} className="text-emerald-500 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {allMatched && (
        <div className="rounded-3xl p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-center shadow-xl">
          <div className="text-4xl mb-2">🌟</div>
          <h3 className="text-2xl font-black m-0">All Devices Matched & Simulated!</h3>
          <p className="text-sm font-bold opacity-95 mt-1 mb-4">
            {activity.successMessage}
          </p>
          <button
            onClick={() => {
              sfx.playTap();
              setMatchedIds({});
              setSelectedLeftId(pairs[0]?.id || null);
              setSimulationMsg(null);
            }}
            className="px-5 py-2.5 rounded-2xl bg-white text-emerald-900 font-black text-sm shadow-md cursor-pointer border-0 inline-flex items-center gap-2"
          >
            <RotateCcw size={15} />
            <span>Play Simulation Again</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ENGINE 3: SEQUENCE BUILDER ENGINE (STORY & INSTRUCTION ORDERING)
// ============================================================================
const SequenceBuilderEngine: React.FC<{
  activity: SandboxActivity;
  isDark: boolean;
  onComplete: () => void;
  speakText: (t: string) => void;
}> = ({ activity, isDark, onComplete, speakText }) => {
  const goalSteps = activity.sequenceConfig?.steps || [];

  // Start in a deterministic scrambled order so the child arranges them
  const [currentOrder, setCurrentOrder] = useState(() => {
    if (goalSteps.length <= 1) return goalSteps;
    return [goalSteps[2], goalSteps[0], goalSteps[3], goalSteps[1]].filter(Boolean);
  });
  const [checkedCorrect, setCheckedCorrect] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const moveItem = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= currentOrder.length) return;
    sfx.playTap();
    const copy = [...currentOrder];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setCurrentOrder(copy);
    setCheckedCorrect(false);
    setFeedback(null);
  };

  const handleCheckOrder = () => {
    const isEveryStepInPlace = currentOrder.every(
      (step, idx) => step.order === idx + 1
    );
    if (isEveryStepInPlace) {
      setCheckedCorrect(true);
      setFeedback(activity.successMessage);
      onComplete();
    } else {
      sfx.playBuzzer();
      setFeedback(
        "Some steps are still out of order! Use the Up and Down arrows to swap them, then check again."
      );
      speakText("Almost there! Check which step comes first, next, and last.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {currentOrder.map((step, idx) => {
          const isInRightSpot = checkedCorrect && step.order === idx + 1;
          return (
            <div
              key={step.id}
              className={`rounded-3xl p-4 sm:p-5 border-3 flex items-center justify-between gap-3 transition-all ${
                isInRightSpot
                  ? "bg-emerald-500/15 border-emerald-500"
                  : isDark
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-teal-200 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#2EC4B6] text-white font-black text-sm flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <span className="text-3xl shrink-0">{step.emoji}</span>
                <div className="min-w-0">
                  <div className="font-black text-sm sm:text-base">{step.label}</div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {step.detail}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0 || checkedCorrect}
                  onClick={() => moveItem(idx, -1)}
                  aria-label={`Move ${step.label} up`}
                  className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-35 cursor-pointer border-0"
                >
                  <ArrowUp size={18} />
                </button>
                <button
                  type="button"
                  disabled={idx === currentOrder.length - 1 || checkedCorrect}
                  onClick={() => moveItem(idx, 1)}
                  aria-label={`Move ${step.label} down`}
                  className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-35 cursor-pointer border-0"
                >
                  <ArrowDown size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`rounded-2xl p-4 border-2 font-black text-sm ${
            checkedCorrect
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
              : "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
          }`}
        >
          {feedback}
        </div>
      )}

      {!checkedCorrect && (
        <button
          type="button"
          onClick={handleCheckOrder}
          className="w-full py-4 rounded-2xl bg-[#2EC4B6] hover:bg-[#25a99d] text-white font-black text-base shadow-lg border-b-4 border-teal-700 cursor-pointer"
        >
          ✓ Check My Sequence Order
        </button>
      )}
    </div>
  );
};

// ============================================================================
// ENGINE 4: PATTERN BUILDER ENGINE
// ============================================================================
const PatternBuilderEngine: React.FC<{
  activity: SandboxActivity;
  isDark: boolean;
  onComplete: () => void;
  speakText: (t: string) => void;
}> = ({ activity, isDark, onComplete, speakText }) => {
  const rounds = activity.patternConfig?.rounds || [];
  const [roundIdx, setRoundIdx] = useState(0);
  const [completedAll, setCompletedAll] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentRound = rounds[roundIdx];

  const handlePickOption = (isCorrect: boolean) => {
    if (!currentRound) return;
    if (isCorrect) {
      sfx.playCoin();
      setFeedback(`Spot on! ${currentRound.explanation}`);
      speakText(`Correct! ${currentRound.explanation}`);
      if (roundIdx + 1 < rounds.length) {
        setTimeout(() => {
          setRoundIdx((r) => r + 1);
          setFeedback(null);
        }, 1100);
      } else {
        setCompletedAll(true);
        onComplete();
      }
    } else {
      sfx.playBuzzer();
      setFeedback("Look closely at the repeating rhythm and try another piece!");
      speakText("Look closely at the pattern and try again!");
    }
  };

  if (completedAll) {
    return (
      <div className="rounded-3xl p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-center shadow-xl">
        <div className="text-4xl mb-2">🧩</div>
        <h3 className="text-2xl font-black m-0">Pattern Detective Master!</h3>
        <p className="text-sm font-bold opacity-95 mt-1 mb-4">
          {activity.successMessage}
        </p>
        <button
          onClick={() => {
            setRoundIdx(0);
            setCompletedAll(false);
            setFeedback(null);
          }}
          className="px-5 py-2.5 rounded-2xl bg-white text-emerald-900 font-black text-sm shadow-md cursor-pointer border-0 inline-flex items-center gap-2"
        >
          <RotateCcw size={15} />
          <span>Play Patterns Again</span>
        </button>
      </div>
    );
  }

  if (!currentRound) return null;

  return (
    <div
      className={`rounded-3xl p-6 border-3 ${
        isDark ? "bg-slate-900 border-slate-700" : "bg-white border-teal-200 shadow-lg"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-black uppercase tracking-wider text-[#2EC4B6]">
          Pattern Puzzle {roundIdx + 1} of {rounds.length}
        </span>
        <span className="text-xs font-bold text-slate-400">
          {currentRound.prompt}
        </span>
      </div>

      {/* Sequence Display */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap py-6 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-6">
        {currentRound.sequence.map((item, i) => (
          <div
            key={i}
            className="px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-300 dark:border-slate-700 flex flex-col items-center justify-center shadow-sm min-w-[64px]"
          >
            <span className="text-3xl">{item.emoji}</span>
            <span className="text-[10px] font-bold mt-1">{item.label}</span>
          </div>
        ))}
        <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-3 border-dashed border-amber-500 flex items-center justify-center text-2xl font-black text-amber-500">
          ?
        </div>
      </div>

      {/* Choices */}
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
        {currentRound.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handlePickOption(opt.isCorrect)}
            className={`py-4 px-2 rounded-2xl border-3 transition-transform hover:scale-105 active:scale-95 cursor-pointer flex flex-col items-center gap-1 ${
              isDark
                ? "bg-slate-800 border-slate-700 hover:border-[#2EC4B6]"
                : "bg-teal-50/50 border-teal-200 hover:border-[#2EC4B6]"
            }`}
          >
            <span className="text-3xl">{opt.emoji}</span>
            <span className="text-xs font-black">{opt.label}</span>
          </button>
        ))}
      </div>

      {feedback && (
        <div className="mt-5 text-center font-black text-sm text-teal-600 dark:text-teal-300">
          {feedback}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ENGINE 5: DIGITAL DRAWING & SHAPE STUDIO (HTML5 CANVAS)
// ============================================================================
const DigitalCanvasEngine: React.FC<{
  activity: SandboxActivity;
  isDark: boolean;
  onComplete: () => void;
  speakText: (t: string) => void;
}> = ({ activity, isDark, onComplete, speakText }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paletteList = activity.canvasConfig?.palette || [
    { name: "Coral Red", hex: "#EF4444" },
    { name: "Sunshine Gold", hex: "#F59E0B" },
    { name: "Emerald Green", hex: "#10B981" },
    { name: "Ocean Blue", hex: "#3B82F6" },
    { name: "Royal Purple", hex: "#8B5CF6" },
    { name: "Berry Pink", hex: "#EC4899" }
  ];
  const stampsList = activity.canvasConfig?.stamps || [
    { id: "star", label: "Star", emoji: "⭐" },
    { id: "heart", label: "Heart", emoji: "❤️" },
    { id: "sun", label: "Sun", emoji: "🌞" },
    { id: "bot", label: "Robot", emoji: "🤖" }
  ];

  const [color, setColor] = useState(paletteList[0]?.hex || "#EF4444");
  const [brushSize, setBrushSize] = useState(8);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [savedArtwork, setSavedArtwork] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoords(e);

    if (selectedStamp) {
      sfx.playTap();
      ctx.font = "38px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(selectedStamp, x, y);
      setStrokeCount((c) => c + 1);
      return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectedStamp) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setStrokeCount((c) => c + 1);
    }
  };

  const handleClear = () => {
    sfx.playTap();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setStrokeCount(0);
    setSavedArtwork(false);
  };

  const handleCompleteArtwork = () => {
    if (strokeCount < 2) {
      speakText("Draw a few lines or stamp some fun shapes on your canvas first!");
      return;
    }
    setSavedArtwork(true);
    onComplete();
  };

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 border-3 ${
        isDark ? "bg-slate-900 border-slate-700" : "bg-white border-amber-300 shadow-lg"
      } space-y-4`}
    >
      {/* Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Colour Palette */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Palette size={14} /> Colours:
          </span>
          {paletteList.map((p) => (
            <button
              key={p.hex}
              type="button"
              onClick={() => {
                sfx.playTap();
                setSelectedStamp(null);
                setColor(p.hex);
              }}
              aria-label={`Select color ${p.name}`}
              title={p.name}
              className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform ${
                color === p.hex && !selectedStamp ? "scale-125 ring-2 ring-amber-400" : ""
              }`}
              style={{ background: p.hex, borderColor: "#fff" }}
            />
          ))}
        </div>

        {/* Brush Sizes */}
        <div className="flex items-center gap-2">
          {[5, 10, 18].map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => {
                setSelectedStamp(null);
                setBrushSize(sz);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-black border cursor-pointer ${
                brushSize === sz && !selectedStamp
                  ? "bg-amber-500 text-slate-950 border-amber-500"
                  : isDark
                  ? "bg-slate-800 text-slate-300 border-slate-700"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {sz === 5 ? "Thin" : sz === 10 ? "Medium" : "Thick"}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1 rounded-xl text-xs font-black bg-rose-500/15 text-rose-500 border border-rose-500/30 cursor-pointer inline-flex items-center gap-1"
          >
            <Eraser size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Shape Stamps Row */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          Stamp Shapes (Tap Stamp then Tap Canvas):
        </span>
        {stampsList.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => {
              sfx.playTap();
              setSelectedStamp(selectedStamp === st.emoji ? null : st.emoji);
            }}
            title={st.label}
            className={`px-3 py-1.5 rounded-xl text-base flex items-center gap-1.5 border cursor-pointer transition-transform ${
              selectedStamp === st.emoji
                ? "bg-amber-400 text-slate-950 border-amber-500 scale-105 font-black"
                : isDark
                ? "bg-slate-800 border-slate-700 text-slate-200"
                : "bg-amber-50 border-amber-200 text-slate-800"
            }`}
          >
            <span>{st.emoji}</span>
            <span className="text-xs font-bold">{st.label}</span>
          </button>
        ))}
      </div>

      {/* Drawing Canvas */}
      <div className="rounded-2xl overflow-hidden border-4 border-amber-400/60 shadow-inner bg-white">
        <canvas
          ref={canvasRef}
          width={760}
          height={380}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-[280px] sm:h-[360px] touch-none cursor-crosshair block"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {strokeCount === 0
            ? "Draw with your finger or mouse, or tap a shape stamp above!"
            : `Great creativity! You've added ${strokeCount} creative touches.`}
        </span>

        <button
          type="button"
          onClick={handleCompleteArtwork}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer border-0"
        >
          {savedArtwork ? "✓ Artwork Completed! Save Again" : "✨ Finish My Artwork"}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// ENGINE 6: SOUND & RHYTHM EXPLORER ENGINE (WEB AUDIO SYNTH)
// ============================================================================
const SoundPadEngine: React.FC<{
  activity: SandboxActivity;
  isDark: boolean;
  onComplete: () => void;
  speakText: (t: string) => void;
}> = ({ activity, isDark, onComplete }) => {
  const pads = activity.soundConfig?.pads || [
    { id: "do", label: "Sunny Bell (Do)", emoji: "🔔", freq: 261.63, wave: "triangle" as const, color: "#EF4444" },
    { id: "re", label: "Jungle Drum (Re)", emoji: "🥁", freq: 293.66, wave: "triangle" as const, color: "#F59E0B" },
    { id: "mi", label: "Ocean Flute (Mi)", emoji: "🪈", freq: 329.63, wave: "sine" as const, color: "#10B981" },
    { id: "sol", label: "Starimba (Sol)", emoji: "✨", freq: 392.0, wave: "triangle" as const, color: "#06B6D4" },
    { id: "la", label: "Cloud Harp (La)", emoji: "🎵", freq: 440.0, wave: "sine" as const, color: "#8B5CF6" },
    { id: "do2", label: "Rocket Chime (High Do)", emoji: "🚀", freq: 523.25, wave: "triangle" as const, color: "#EC4899" }
  ];
  const targetBeats = activity.soundConfig?.targetBeatsCount || 4;

  const [melody, setMelody] = useState<typeof pads>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTone = (freq: number, wave: "sine" | "triangle" = "triangle") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  const handleTapPad = (pad: (typeof pads)[0]) => {
    playTone(pad.freq, pad.wave);
    if (melody.length < 8) {
      setMelody((prev) => [...prev, pad]);
    }
  };

  const handlePlayMelody = () => {
    if (melody.length === 0 || isPlaying) return;
    setIsPlaying(true);
    melody.forEach((note, idx) => {
      setTimeout(() => {
        playTone(note.freq, note.wave);
        if (idx === melody.length - 1) {
          setIsPlaying(false);
          if (melody.length >= targetBeats) {
            onComplete();
          }
        }
      }, idx * 420);
    });
  };

  return (
    <div
      className={`rounded-3xl p-6 border-3 ${
        isDark ? "bg-slate-900 border-slate-700" : "bg-white border-amber-300 shadow-lg"
      } space-y-6`}
    >
      {/* Sound Pads Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {pads.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleTapPad(p)}
            className="rounded-3xl p-5 border-3 text-white font-black flex flex-col items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            style={{ background: p.color, borderColor: "rgba(255,255,255,0.4)" }}
          >
            <span className="text-4xl">{p.emoji}</span>
            <span className="text-xs sm:text-sm text-center">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Melody Track */}
      <div className="rounded-2xl p-4 bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-[#2EC4B6] flex items-center gap-1.5">
            <Music size={14} /> Your Melody Sequence ({melody.length} / {targetBeats}+ Notes)
          </span>
          <button
            type="button"
            onClick={() => setMelody([])}
            className="text-xs font-black text-rose-500 bg-transparent border-0 cursor-pointer"
          >
            Clear Notes
          </button>
        </div>

        <div className="flex items-center gap-2.5 min-h-[56px] flex-wrap">
          {melody.length === 0 ? (
            <span className="text-xs font-bold text-slate-400">
              Tap at least {targetBeats} colourful sound pads above to build your song!
            </span>
          ) : (
            melody.map((m, i) => (
              <div
                key={i}
                className="px-3.5 py-2 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-sm"
                style={{ background: m.color }}
              >
                <span>{m.emoji}</span>
                <span>Note {i + 1}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={melody.length < targetBeats || isPlaying}
        onClick={handlePlayMelody}
        className="w-full py-4 rounded-2xl bg-[#2EC4B6] disabled:opacity-45 text-white font-black text-base shadow-lg cursor-pointer border-0"
      >
        {isPlaying
          ? "🎵 Playing Your Melody..."
          : melody.length < targetBeats
          ? `Add ${targetBeats - melody.length} More Note${targetBeats - melody.length === 1 ? "" : "s"} to Play & Complete`
          : "▶ Play My Melody & Complete Activity!"}
      </button>
    </div>
  );
};

// ============================================================================
// ENGINE 7: SCENARIO SIMULATOR ENGINE (SAFE CHOICES & ADAPTABILITY)
// ============================================================================
const ScenarioSimulatorEngine: React.FC<{
  activity: SandboxActivity;
  isDark: boolean;
  onComplete: () => void;
  speakText: (t: string) => void;
}> = ({ activity, isDark, onComplete, speakText }) => {
  const scenarios = activity.scenarioConfig?.scenarios || [];
  const [idx, setIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [finishedAll, setFinishedAll] = useState(false);

  const current = scenarios[idx];

  const handleSelectChoice = (choiceIdx: number) => {
    if (!current) return;
    setSelectedChoice(choiceIdx);
    const choice = current.choices[choiceIdx];
    if (choice.isSafeOrWise) {
      sfx.playCoin();
      speakText(choice.consequence);
    } else {
      sfx.playBuzzer();
      speakText(choice.consequence);
    }
  };

  const handleNextScenario = () => {
    if (idx + 1 < scenarios.length) {
      setIdx((i) => i + 1);
      setSelectedChoice(null);
    } else {
      setFinishedAll(true);
      onComplete();
    }
  };

  if (finishedAll) {
    return (
      <div className="rounded-3xl p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-center shadow-xl">
        <div className="text-4xl mb-2">🏅</div>
        <h3 className="text-2xl font-black m-0">Mission Scenarios Completed!</h3>
        <p className="text-sm font-bold opacity-95 mt-1 mb-4">
          {activity.successMessage}
        </p>
        <button
          onClick={() => {
            setIdx(0);
            setSelectedChoice(null);
            setFinishedAll(false);
          }}
          className="px-5 py-2.5 rounded-2xl bg-white text-emerald-900 font-black text-sm shadow-md cursor-pointer border-0 inline-flex items-center gap-2"
        >
          <RotateCcw size={15} />
          <span>Practise Scenarios Again</span>
        </button>
      </div>
    );
  }

  if (!current) return null;
  const chosen = selectedChoice !== null ? current.choices[selectedChoice] : null;

  return (
    <div
      className={`rounded-3xl p-6 border-3 ${
        isDark ? "bg-slate-900 border-slate-700" : "bg-white border-sky-200 shadow-lg"
      } space-y-5`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-[#2EC4B6]">
          Situation {idx + 1} of {scenarios.length}
        </span>
      </div>

      <div className="p-5 rounded-2xl bg-teal-500/10 border-2 border-teal-400/30 flex items-center gap-4">
        <span className="text-4xl shrink-0">{current.emoji}</span>
        <p className="text-base sm:text-lg font-black m-0">{current.situation}</p>
      </div>

      <div className="space-y-3">
        {current.choices.map((c, cIdx) => {
          const isSelected = selectedChoice === cIdx;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelectChoice(cIdx)}
              className={`w-full rounded-2xl p-4 border-3 text-left font-bold text-sm sm:text-base transition-all cursor-pointer flex items-center gap-3 ${
                isSelected
                  ? c.isSafeOrWise
                    ? "bg-emerald-500/20 border-emerald-500"
                    : "bg-amber-500/20 border-amber-500"
                  : isDark
                  ? "bg-slate-800 border-slate-700 hover:border-teal-400"
                  : "bg-slate-50 border-slate-200 hover:border-teal-400"
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span>{c.text}</span>
            </button>
          );
        })}
      </div>

      {chosen && (
        <div
          className={`rounded-2xl p-4 border-2 font-black text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            chosen.isSafeOrWise
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
              : "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
          }`}
        >
          <span>{chosen.consequence}</span>
          {chosen.isSafeOrWise && (
            <button
              type="button"
              onClick={handleNextScenario}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-black text-xs shrink-0 cursor-pointer border-0"
            >
              {idx + 1 < scenarios.length ? "Next Situation →" : "Finish Mission ✓"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PracticeSandbox;
