/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { Child, Parent, Language, Module, Lesson } from "../types";
import { useLearningTimeTracker } from "../utils/timeTracker";
import {
  C,
  F,
  T,
  getCurrentSlot,
  todayKey
} from "../utils/config";
import { Card, Heading, Txt, Chip, Btn } from "./Primitives";
import { KobeAvatar } from "./KobeAvatar";
import { companionVoice, sfx } from "../utils/audio";
import { ChildWelcomeScreen } from "./ChildWelcome";
import { ChildExplorerHome } from "./ChildExplorerHome";
import { SagaMap } from "./SagaMap";
import { ChildProgressScreen } from "./ChildProgress";
import { LessonContent } from "./LessonContent";
import { ChildGames } from "./ChildGames";
import { ChildRewards } from "./ChildRewards";
import { ChildChat } from "./ChildChat";
import { CURRICULUM } from "../data/curriculum";
import { PaywallModal } from "./PaywallModal";
import { computeEffectiveStreak, recordDailyActivityStreak } from "../utils/streak";
import { evaluateChildBadges, UNIFIED_BADGE_MAP } from "../utils/badges";

interface ChildAppProps {
  child: Child;
  parent: Parent | null;
  onExit: () => void;
  lang: Language;
  onUpdateChild: (updated: Child) => void;
  theme: "light" | "dark";
  onToggleTheme?: () => void;
}

type TabType = "home" | "map" | "progress" | "chat" | "lesson" | "games" | "rewards";

const AGE_META_RESOLVE = (ag: string) => {
  if (ag === "early explorers") return { color: C.amber, soft: C.yellowSoft };
  if (ag === "future builders") return { color: C.lavender, soft: C.lavSoft };
  return { color: C.teal, soft: C.tealGhost };
};

const S_RESOLVE = () => {
  try {
    return JSON.parse(localStorage.getItem("clats_settings_v1") || "{}");
  } catch {
    return {};
  }
};

interface DraggableFloatingProps {
  initialBottom?: number;
  initialRight?: number;
  zIndex?: number;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}

const DraggableFloating: React.FC<DraggableFloatingProps> = ({
  initialBottom,
  initialRight,
  children,
  onClick,
  title,
  zIndex = 999
}) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = React.useRef<{
    startX: number;
    startY: number;
    elemX: number;
    elemY: number;
    hasMoved: boolean;
  }>({ startX: 0, startY: 0, elemX: 0, elemY: 0, hasMoved: false });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const elem = e.currentTarget;
    const rect = elem.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemX: rect.left,
      elemY: rect.top,
      hasMoved: false
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      if (Math.hypot(dx, dy) > 5) {
        dragRef.current.hasMoved = true;
        setIsDragging(true);
      }

      if (dragRef.current.hasMoved) {
        const maxX = window.innerWidth - rect.width - 8;
        const maxY = window.innerHeight - rect.height - 8;
        const newX = Math.max(8, Math.min(maxX, dragRef.current.elemX + dx));
        const newY = Math.max(8, Math.min(maxY, dragRef.current.elemY + dy));
        setPos({ x: newX, y: newY });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        if (!dragRef.current.hasMoved && onClick) {
          onClick();
        }
      }}
      title={title}
      style={{
        position: "fixed",
        left: pos ? pos.x : undefined,
        top: pos ? pos.y : undefined,
        bottom: pos ? undefined : initialBottom,
        right: pos ? undefined : initialRight,
        zIndex,
        touchAction: "none",
        userSelect: "none",
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging ? "none" : "transform 0.15s ease"
      }}
    >
      {children}
    </div>
  );
};

export const ChildApp: React.FC<ChildAppProps> = ({
  child,
  parent,
  onExit,
  lang,
  onUpdateChild,
  theme,
  onToggleTheme
}) => {
  const meta = AGE_META_RESOLVE(child.ageGroup);
  const isDark = theme === "dark";

  // States
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      const validTabs: TabType[] = ["home", "map", "progress", "chat", "lesson", "games", "rewards"];
      if (validTabs.includes(hash as TabType)) {
        return hash as TabType;
      }
    }
    return "home";
  });
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selModule, setSelModule] = useState<Module | null>(null);
  const [selLesson, setSelLesson] = useState<Lesson | null>(null);
  const [showHandoff, setShowHandoff] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string>("academy-1");
  const [celebrationQueue, setCelebrationQueue] = useState<any[]>([]);

  // Navigation with URL Hash & Browser History integration
  const navigateToTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      try {
        window.history.pushState({ tab }, "", `#${tab}`);
      } catch {}
    }
  }, []);

  // Listen for browser back / forward navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.history.state || !window.history.state.tab) {
      const initialTab = window.location.hash ? window.location.hash.replace("#", "") : "home";
      window.history.replaceState({ tab: initialTab }, "", window.location.hash || `#${initialTab}`);
    }

    const handlePopState = (e: PopStateEvent) => {
      const validTabs: TabType[] = ["home", "map", "progress", "chat", "lesson", "games", "rewards"];
      if (e.state && validTabs.includes(e.state.tab)) {
        setActiveTab(e.state.tab);
      } else {
        const hash = window.location.hash.replace("#", "");
        if (validTabs.includes(hash as TabType)) {
          setActiveTab(hash as TabType);
        } else {
          setActiveTab("home");
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load narration preference
  const isYoungExplorer = child.ageGroup === "early explorers" || child.ageGroup === "young explorers";
  const [narrationOn, setNarrationOn] = useState(() => companionVoice.isNarrationEnabled(child.ageGroup));

  // Auto-Start on Login for Young Explorers
  useEffect(() => {
    if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem("hasAutoStarted_" + child.id)) {
      sessionStorage.setItem("hasAutoStarted_" + child.id, "true");
      if (isYoungExplorer) {
        const course = CURRICULUM["early explorers"];
        if (course && course.modules) {
          for (const mod of course.modules) {
            for (const les of mod.lessons) {
              if (!child.completed?.[les.id]) {
                setSelModule(mod);
                setSelLesson(les);
                setActiveTab("chat");
                return;
              }
            }
          }
          if (course.modules[0] && course.modules[0].lessons[0]) {
            setSelModule(course.modules[0]);
            setSelLesson(course.modules[0].lessons[0]);
            setActiveTab("chat");
          }
        }
      }
    }
  }, [child, isYoungExplorer]);

  // Stop current voice playback whenever changing screens
  useEffect(() => {
    companionVoice.stop();
  }, [activeTab]);

  const handleToggleNarration = () => {
    const nextVal = !narrationOn;
    companionVoice.setNarrationEnabled(child.ageGroup, nextVal);
    setNarrationOn(nextVal);
    if (nextVal) {
      companionVoice.speak("Voice narration activated!", child.companion || "kobe", child.ageGroup, false);
    } else {
      companionVoice.stop();
    }
  };

  // Screen time tracking
  const [slot, setSlot] = useState<"morning" | "afternoon" | "evening" | null>(getCurrentSlot());
  const [limitsEnabled, setLimitsEnabled] = useState(false);
  const [slotLimit, setSlotLimit] = useState(0); // in seconds
  const [slotUsed, setSlotUsed] = useState(0); // in seconds
  const [blocked, setBlocked] = useState(false);

  // HUD Warnings
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-record child's portal study session directly to Supabase
  useLearningTimeTracker({
    childId: child.id,
    activityType: "portal"
  });

  // Calculate slot time from Supabase
  const computeSlotTimeFromSupabase = (sessions: any[], currentSlot: "morning" | "afternoon" | "evening"): number => {
    const todayStr = new Date().toISOString().split("T")[0];
    let seconds = 0;
    sessions.forEach(s => {
      try {
        const sessDate = new Date(s.started_at);
        const sDateStr = sessDate.toISOString().split("T")[0];
        if (sDateStr === todayStr) {
          const h = sessDate.getHours();
          const sSlot = h >= 5 && h < 12 ? "morning" : h >= 12 && h < 18 ? "afternoon" : "evening";
          if (sSlot === currentSlot) {
            seconds += Number(s.duration_seconds || 0);
          }
        }
      } catch (e) {
        console.warn("computeSlotTimeFromSupabase parse error:", e);
      }
    });
    return seconds;
  };

  // Fetch initial study minutes/seconds spent for current slot today from Supabase
  useEffect(() => {
    if (!child?.id) return;
    const curS = getCurrentSlot();
    if (!curS) return;

    fetch(`/api/supabase/sessions/child/${child.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.sessions) {
          const initialUsed = computeSlotTimeFromSupabase(data.sessions, curS);
          setSlotUsed(initialUsed);
        }
      })
      .catch(err => {
        console.error("Error fetching child app sessions on load:", err);
      });
  }, [child?.id]);

  const checkTimingLimits = React.useCallback(() => {
    if (parent) {
      const parentS = S_RESOLVE();
      const parentEmail = parent.email;
      const settings = parentS[parentEmail?.toLowerCase()];
      if (settings && settings.limitsEnabled) {
        setLimitsEnabled(prev => !prev ? true : prev);
        const curS = getCurrentSlot();
        setSlot(prev => prev !== curS ? curS : prev);
        if (curS) {
          const limitSecs = settings.slots[curS] || 0;
          setSlotLimit(prev => prev !== limitSecs ? limitSecs : prev);
          setBlocked(prev => {
            const isBlocked = limitSecs > 0 && slotUsed >= limitSecs;
            return prev !== isBlocked ? isBlocked : prev;
          });
        } else {
          setSlotLimit(prev => prev !== 0 ? 0 : prev);
          setBlocked(prev => prev ? false : prev);
        }
      } else {
        setLimitsEnabled(prev => prev ? false : prev);
        setSlotLimit(prev => prev !== 0 ? 0 : prev);
        setBlocked(prev => prev ? false : prev);
      }
    } else {
      // Offline fallback: 40 mins
      setLimitsEnabled(prev => !prev ? true : prev);
      setSlotLimit(prev => prev !== 40 * 60 ? 40 * 60 : prev);
    }
  }, [parent, slotUsed]);

  // Initial check on mount or parent update
  useEffect(() => {
    checkTimingLimits();
  }, [checkTimingLimits]);

  // Only tick when screen time limits are configured, avoiding high-frequency lag when unlimited
  useEffect(() => {
    if (!limitsEnabled || slotLimit <= 0 || blocked) return;

    const timer = setInterval(() => {
      setSlotUsed(p => {
        const next = p + 1;
        if (slotLimit > 0 && next >= slotLimit) {
          setBlocked(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [limitsEnabled, slotLimit, blocked]);

  // Warning trigger checks
  useEffect(() => {
    if (slotLimit > 0) {
      const remain = slotLimit - slotUsed;
      if (remain === 300) {
        setToastMessage(T[lang]?.fiveMinsLeft || "5 minutes left!");
        setTimeout(() => setToastMessage(null), 8000);
      }
      if (remain <= 0) {
        setBlocked(true);
      }
    }
  }, [slotUsed, slotLimit, lang]);

  // Ensure child.streak and child.streak_count stay synchronized and reflect active/expired status
  useEffect(() => {
    const status = computeEffectiveStreak(child);
    const currentCount = child.streak_count ?? child.streak ?? 0;
    const currentBest = child.best_streak ?? 0;
    if (status.streak !== currentCount || status.bestStreak !== currentBest || child.streak !== status.streak || child.streak_count !== status.streak) {
      onUpdateChild({
        ...child,
        streak: status.streak,
        streak_count: status.streak,
        best_streak: status.bestStreak
      });
    }
  }, [child.id]);

  const handleLessonComplete = async (
    lessonId: string,
    starsEarned: number,
    xpEarned: number,
    quizResult?: {
      score: number;
      correctCount: number;
      totalQuestions: number;
      status: "Passed" | "Needs Review";
    }
  ) => {
    const isPass = !quizResult || quizResult.status === "Passed";

    const alreadyCompleted = child.completed && child.completed[lessonId];

    const freshCompleted = isPass
      ? { ...child.completed, [lessonId]: true }
      : { ...child.completed };

    const currentStars = (child.stars && child.stars[lessonId]) || 0;
    const freshStars = (isPass && starsEarned > currentStars)
      ? { ...child.stars, [lessonId]: starsEarned }
      : { ...child.stars };

    const actualXpEarned = (isPass && !alreadyCompleted) ? xpEarned : (isPass ? Math.min(xpEarned, 15) : xpEarned);
    const freshXP = (child.xp || 0) + actualXpEarned;

    const priorQuizResults = child.quizResults || {};
    const freshQuizResults = quizResult
      ? {
          ...priorQuizResults,
          [lessonId]: {
            score: quizResult.score,
            correctCount: quizResult.correctCount,
            totalQuestions: quizResult.totalQuestions,
            status: quizResult.status,
            completedAt: new Date().toISOString()
          }
        }
      : priorQuizResults;

    const currentCompletedCount = Object.keys(freshCompleted).length;

    // Record daily learning activity and compute updated streak
    const streakUpdate = recordDailyActivityStreak({
      ...child,
      completed: freshCompleted,
      quizResults: freshQuizResults
    });
    const finalStreak = streakUpdate.streak_count;
    const finalBestStreak = streakUpdate.best_streak;
    const finalLastActive = streakUpdate.last_active_at;

    const previouslyUnlockedIds = new Set(
      evaluateChildBadges(child)
        .filter((b) => b.unlocked)
        .map((b) => b.id)
    );
    const currentBadges = child.badges || [];

    const candidateChild: Child = {
      ...child,
      completed: freshCompleted,
      stars: freshStars,
      xp: freshXP,
      quizResults: freshQuizResults,
      streak: finalStreak,
      streak_count: finalStreak,
      best_streak: finalBestStreak,
      last_active_at: finalLastActive,
      badges: currentBadges
    };

    const evaluatedAfter = evaluateChildBadges(candidateChild);
    const badgesToUnlock = evaluatedAfter
      .filter((b) => b.unlocked && !previouslyUnlockedIds.has(b.id) && !currentBadges.includes(b.id))
      .map((b) => b.id);

    if (parent && parent.email && isPass) {
      try {
        await fetch("/api/supabase/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parent_email: parent.email,
            child_id: child.id,
            type: quizResult ? "quiz_completed" : "lesson_completed",
            title: quizResult ? "Quiz Result 🎯" : "Lesson Completed! 🎉",
            message: quizResult
              ? `${child.name} scored ${quizResult.score}% on their latest quiz!`
              : `${child.name} successfully finished a lesson.`,
            icon: quizResult && quizResult.score >= 80 ? "⭐" : (quizResult ? "💡" : "🏅"),
            badge_color: quizResult ? "bg-amber-50 text-amber-600" : "bg-teal-50 text-teal-600"
          })
        });
      } catch (e) {
        console.warn("[SYNC] Failed to push notification:", e);
      }
    }

    // Trigger celebration
    if (badgesToUnlock.length > 0) {
      setCelebrationQueue(prev => [...prev, ...badgesToUnlock]);
    }

    // Combine existing badges with newly unlocked ones
    const newBadgesList = Array.from(new Set([...currentBadges, ...badgesToUnlock]));

    // Persist changes (onUpdateChild automatically syncs to /api/supabase/sync or /api/supabase/b2b/manage-student)
    const updated: Child = {
      ...candidateChild,
      badges: newBadgesList
    };

    onUpdateChild(updated);
  };

  const handleAddGamesXP = async (amount: number) => {
    const freshXP = (child.xp || 0) + amount;
    const streakUpdate = recordDailyActivityStreak(child);

    const previouslyUnlockedIds = new Set(
      evaluateChildBadges(child)
        .filter((b) => b.unlocked)
        .map((b) => b.id)
    );
    const currentBadges = child.badges || [];

    const candidateChild: Child = {
      ...child,
      xp: freshXP,
      streak: streakUpdate.streak_count,
      streak_count: streakUpdate.streak_count,
      best_streak: streakUpdate.best_streak,
      last_active_at: streakUpdate.last_active_at,
      badges: currentBadges
    };

    const newlyUnlocked = evaluateChildBadges(candidateChild)
      .filter((b) => b.unlocked && !previouslyUnlockedIds.has(b.id) && !currentBadges.includes(b.id))
      .map((b) => b.id);

    if (newlyUnlocked.length > 0) {
      setCelebrationQueue(prev => [...prev, ...newlyUnlocked]);
    }

    const newBadgesList = Array.from(new Set([...currentBadges, ...newlyUnlocked]));

    const updated: Child = {
      ...candidateChild,
      badges: newBadgesList
    };
    onUpdateChild(updated);
  };

  const BADGE_MAP = UNIFIED_BADGE_MAP;

  return (
    <div className="tropical-bg" style={{ minHeight: "100vh", paddingBottom: 88, position: "relative", overflowX: "hidden" }}>
      {/* 🌴 Draggable Companion Voice Reader & Theme Toggles */}
      <DraggableFloating
        initialBottom={95}
        initialRight={20}
        onClick={handleToggleNarration}
        title="Drag anywhere or tap to toggle companion voice reader"
      >
        <div
          id="voice-narration-toggle"
          style={{
            background: isDark ? "#1e293b" : "#ffffff",
            border: isDark ? "2px solid #334155" : "2px solid #cbd5e1",
            borderRadius: "50px",
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
            pointerEvents: "none"
          }}
        >
          <span style={{ fontSize: 18 }}>{narrationOn ? "🔊" : "🔇"}</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: isDark ? "#cbd5e1" : "#1e293b" }}>
            READER: {narrationOn ? "ON" : "OFF"}
          </span>
        </div>
      </DraggableFloating>

      {onToggleTheme && (
        <DraggableFloating
          initialBottom={145}
          initialRight={20}
          onClick={onToggleTheme}
          title="Drag anywhere or tap to toggle Day/Night theme"
        >
          <div
            style={{
              fontSize: 28,
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: isDark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.9)",
              border: isDark ? "2px solid #334155" : "2px solid #cbd5e1",
              boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              backdropFilter: "blur(4px)"
            }}
          >
            {isDark ? "🌙" : "☀️"}
          </div>
        </DraggableFloating>
      )}
      <div className="cloud-slow" style={{ position: "absolute", top: 22, left: "10%", fontSize: 44, pointerEvents: "none", opacity: 0.5, zIndex: 0 }}>☁️</div>
      <div className="cloud-fast" style={{ position: "absolute", top: 110, right: "15%", fontSize: 48, pointerEvents: "none", opacity: 0.4, zIndex: 0 }}>☁️</div>
      <div className="cloud-slow" style={{ position: "absolute", top: "35%", left: "5%", fontSize: 32, pointerEvents: "none", opacity: 0.45, zIndex: 0 }}>☁️</div>
      <div className="cloud-fast" style={{ position: "absolute", top: "65%", right: "8%", fontSize: 40, pointerEvents: "none", opacity: 0.35, zIndex: 0 }}>☁️</div>
      <div className="tree-sway" style={{ position: "absolute", bottom: 84, left: -24, fontSize: 64, pointerEvents: "none", zIndex: 1 }}>🌴</div>
      <div className="tree-sway" style={{ position: "absolute", bottom: 120, right: -20, fontSize: 72, pointerEvents: "none", zIndex: 1 }}>🌴</div>
      <div className="ship-wobble" style={{ position: "absolute", bottom: "30%", left: "12%", fontSize: 36, pointerEvents: "none", opacity: 0.7, zIndex: 0 }}>⛵</div>
      <div style={{ position: "absolute", bottom: "45%", right: "4%", fontSize: 22, pointerEvents: "none", opacity: 0.3, zIndex: 0 }}>🐚</div>
      <div style={{ position: "absolute", top: "50%", left: "4%", fontSize: 28, pointerEvents: "none", opacity: 0.15, zIndex: 0 }}>🦁</div>
      <div style={{ position: "absolute", bottom: "15%", right: "12%", fontSize: 26, pointerEvents: "none", opacity: 0.2, zIndex: 0 }}>🦒</div>

      {/* Floating notifications / toasts */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: C.charcoal,
            color: C.white,
            borderRadius: 24,
            padding: "10px 20px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: 10,
            whiteSpace: "nowrap"
          }}
        >
          <span style={{ fontSize: 16 }}>⏳</span>
          <Txt size={12.5} weight={700} color={C.white}>
            {toastMessage}
          </Txt>
        </div>
      )}

      {/* Screen Time Blocked Overlay */}
      {blocked && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 20 }}>⏱️</div>
          <Heading size={28} className="font-black mb-2 text-center" style={{ color: isDark ? "#fff" : "#111" }}>
            Time is up!
          </Heading>
          <Txt size={16} className="font-bold text-center mb-8" color={isDark ? "#94a3b8" : "#64748b"}>
            You've reached your learning time limit for this session. Take a break and come back later!
          </Txt>
          <button
            onClick={onExit}
            style={{
              background: "#2EC4B6",
              color: "white",
              padding: "16px 32px",
              borderRadius: 16,
              fontWeight: 900,
              fontSize: 16,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(46, 196, 182, 0.3)"
            }}
          >
            Exit Portal
          </button>
        </div>
      )}

      {/* Screen 1: Course Selection / Child Hub */}
      {activeTab === "home" && (
        isYoungExplorer ? (
          <ChildExplorerHome
            child={child}
            slotUsed={slotUsed}
            slotLimit={slotLimit}
            onSelectLesson={(mod, les) => {
              setSelModule(mod);
              setSelLesson(les);
              navigateToTab("lesson");
            }}
            onEnterWorld={(acadId) => {
              setSelectedAcademyId(acadId || "academy-1");
              navigateToTab("map");
            }}
            onPlayGame={(gameId) => {
              setSelectedGameId(gameId || null);
              navigateToTab("games");
            }}
            onOpenChat={() => navigateToTab("chat")}
            onOpenRewards={() => navigateToTab("rewards")}
            lang={lang}
            theme={theme}
          />
        ) : (
          <ChildWelcomeScreen
            child={child}
            slotUsed={slotUsed}
            slotLimit={slotLimit}
            onEnterAIPathway={(acadId) => {
              setSelectedAcademyId(acadId || "academy-1");
              setActiveTab("map");
            }}
            onResume={() => {
              const course = CURRICULUM[child.ageGroup || "early explorers"];
              if (!course || !course.modules) return;
          
              for (const mod of course.modules) {
                for (const les of mod.lessons) {
                  if (!child.completed?.[les.id]) {
                    setSelModule(mod);
                    setSelLesson(les);
                    setActiveTab("lesson");
                    return;
                  }
                }
              }
              // If all completed, restart the first one
              if (course.modules[0] && course.modules[0].lessons[0]) {
                setSelModule(course.modules[0]);
                setSelLesson(course.modules[0].lessons[0]);
                setActiveTab("lesson");
              }
            }}
            lang={lang}
            theme={theme}
          />
        )
      )}

      {/* The Saga Map */}
      {activeTab === "map" && (
        <SagaMap
          child={child}
          lang={lang}
          theme={theme}
          onBack={() => navigateToTab("home")}
          onSelectLesson={(l) => {
            const course = CURRICULUM[child.ageGroup || "early explorers"];
            const mod = course?.modules?.find((m) => m.lessons.some((les) => les.id === l.id));
            if (mod) setSelModule(mod);
            setSelLesson(l);
            navigateToTab("lesson");
          }}
          onShowPaywall={() => setShowHandoff(true)}
        />
      )}

      {/* Kobe Multilingual Voice AI Tutor */}
      {activeTab === "chat" && (
        <ChildChat
          child={child}
          lesson={selLesson}
          onLessonComplete={handleLessonComplete}
          lang={lang}
          onClose={() => navigateToTab("home")}
          theme={theme}
          onToggleTheme={onToggleTheme}
          narrationOn={narrationOn}
          onToggleNarration={handleToggleNarration}
        />
      )}

      {/* Active Lesson Interactive Learning Video & Quiz Portal */}
      {activeTab === "lesson" && (() => {
        const course = CURRICULUM[child.ageGroup || "early explorers"];
        const resolvedModule =
          selModule ||
          course?.modules?.find((m) => m.lessons.some((les) => les.id === selLesson?.id)) ||
          course?.modules?.[0] ||
          null;
        const lessonIdx =
          resolvedModule && selLesson
            ? resolvedModule.lessons.findIndex((l) => l.id === selLesson.id)
            : -1;
        const isLastLesson = Boolean(
          resolvedModule &&
          selLesson &&
          lessonIdx !== -1 &&
          lessonIdx === resolvedModule.lessons.length - 1
        );

        let nextModule: any = null;
        let nextModIdx = -1;
        if (resolvedModule && course && course.modules) {
          const modIdx = course.modules.findIndex((m) => m.id === resolvedModule.id);
          if (modIdx !== -1 && modIdx + 1 < course.modules.length) {
            nextModule = course.modules[modIdx + 1];
            nextModIdx = modIdx + 1;
          }
        }
        const isNextModuleLocked = !child.is_premium && nextModIdx >= 1;

        return (
          <LessonContent
            child={child}
            lesson={selLesson}
            onLessonComplete={handleLessonComplete}
            lang={lang}
            theme={theme}
            onClose={() => {
              setSelLesson(null);
              navigateToTab("map");
            }}
            onNextLesson={!isLastLesson ? () => {
              if (resolvedModule && selLesson) {
                 const idx = resolvedModule.lessons.findIndex((l) => l.id === selLesson.id);
                 if (idx !== -1 && idx + 1 < resolvedModule.lessons.length) {
                   setSelModule(resolvedModule);
                   setSelLesson(resolvedModule.lessons[idx + 1]);
                   return;
                 }
               }
               setSelLesson(null);
               navigateToTab("map");
             } : undefined}
            isLastLessonInModule={isLastLesson}
            isNextModuleLocked={isNextModuleLocked}
            onShowPaywall={() => setShowHandoff(true)}
            nextModuleTitle={nextModule?.title?.en}
            onNextModule={nextModule ? () => {
              setSelModule(nextModule);
              if (nextModule.lessons && nextModule.lessons.length > 0) {
                setSelLesson(nextModule.lessons[0]);
              } else {
                navigateToTab("map");
              }
            } : () => {
              // End of the entire curriculum!
              navigateToTab("rewards");
            }}
          />
        );
      })()}

      {/* Analytics Student Profile */}
      {activeTab === "progress" && (
        <ChildProgressScreen
          child={child}
          onBack={() => navigateToTab("home")}
          lang={lang}
          parentEmail={parent ? parent.email : "guest"}
          onUpdateChild={onUpdateChild}
          theme={theme}
          onTabChange={navigateToTab}
        />
      )}

      {/* Games Arcade Screen */}
      {activeTab === "games" && (
        <ChildGames
          child={child}
          lang={lang}
          theme={theme}
          onAddXP={handleAddGamesXP}
          onBack={() => {
            setSelectedGameId(null);
            navigateToTab("home");
          }}
          initialGameId={selectedGameId}
        />
      )}

      {/* Rewards Milestones Screen */}
      {activeTab === "rewards" && (
        <ChildRewards
          child={child}
          lang={lang}
          onStartLearning={() => navigateToTab("home")}
          theme={theme}
          onUpdateChild={onUpdateChild}
        />
      )}

      {/* Primary child navigation dock (Always present unless inside Active Lesson screen for focus) */}
      {activeTab !== "lesson" && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "10px 18px 22px",
            background: isDark ? "#0f172a" : "#ffffff",
            borderTop: isDark ? "3px solid #1e293b" : "3px solid #cbd5e1",
            display: "flex",
            justifyContent: "space-around",
            zIndex: 100
          }}
        >
          {(isYoungExplorer
            ? [
                { id: "home" as const, label: "Home", icon: "🏠" },
                { id: "chat" as const, label: "AI Tutor", icon: "🤖" },
                { id: "rewards" as const, label: "Rewards", icon: "🏆" },
                { id: "progress" as const, label: "Profile", icon: "📊" }
              ]
            : [
                { id: "home" as const, label: "Learn", icon: "🗺️" },
                { id: "chat" as const, label: "AI Tutor", icon: "🤖" },
                { id: "games" as const, label: "Games", icon: "🎮" },
                { id: "rewards" as const, label: "Rewards", icon: "🏆" },
                { id: "progress" as const, label: "Profile", icon: "📊" }
              ]
          ).map(({ id, label, icon }) => {
            const isSel = activeTab === id || 
              (id === "home" && activeTab === "map");
            return (
              <button
                key={id}
                onClick={() => {
                  sfx.playTap();
                  navigateToTab(id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <span style={{ fontSize: 24, transition: "transform 0.15s ease", transform: isSel ? "scale(1.15)" : "none", opacity: isSel ? 1 : 0.45 }}>{icon}</span>
                <Txt size={11} weight={800} color={isSel ? "#0284c7" : "#64748b"}>
                  {label}
                </Txt>
              </button>
            );
          })}

          <button
            onClick={onExit}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4
            }}
          >
            <span style={{ fontSize: 24, opacity: 0.45 }}>🚪</span>
            <Txt size={11} weight={800} color="#64748b">
              Exit
            </Txt>
          </button>
        </div>
      )}

      {/* PARENTAL HANDOFF OVERLAY */}
      {showHandoff && !showPaywall && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md text-center">
          <div className="max-w-sm w-full bg-white rounded-3xl p-8 border-[6px] border-[#2EC4B6] shadow-2xl relative">
            <button 
              onClick={() => setShowHandoff(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 font-bold"
            >
              ✕
            </button>
            <div className="flex justify-center mb-6">
              <KobeAvatar size={100} character={child.companion || "kobe"} ageGroup={child.ageGroup} expression="celebrating" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Whoa! You're moving fast! 🚀</h2>
            <p className="text-sm font-bold text-slate-500 mb-8">
              You've reached the <strong className="text-amber-500">Premium Zone</strong>! Go get your parent so they can unlock the rest of your learning adventure!
            </p>
            <button
              onClick={() => {
                setShowHandoff(false);
                setShowPaywall(true);
              }}
              className="w-full bg-[#2EC4B6] text-white font-black text-lg py-4 rounded-2xl border-b-4 border-teal-700 active:border-b-0 active:translate-y-1 transition-all"
            >
              I am a Parent (Unlock)
            </button>
          </div>
        </div>
      )}

      {/* DIRECT PAYWALL */}
      {showPaywall && (
        <PaywallModal
          parentEmail={parent?.email || ""}
          childId={child.id}
          childName={child.name}
          isDark={isDark}
          onClose={() => setShowPaywall(false)}
          onSuccess={() => {
            // Unlocked successfully! Update local state
            onUpdateChild({ ...child, is_premium: true });
            setShowPaywall(false);
            // Wait for UI to update, then just resume the next module
            setTimeout(() => {
              const course = CURRICULUM[child.ageGroup || "early explorers"];
              let nxtMod = null;
              if (selModule && course && course.modules) {
                const modIdx = course.modules.findIndex(m => m.id === selModule.id);
                if (modIdx !== -1 && modIdx + 1 < course.modules.length) {
                  nxtMod = course.modules[modIdx + 1];
                }
              }
              if (nxtMod) {
                setSelModule(nxtMod);
                setActiveTab("map");
              }
            }, 500);
          }}
        />
      )}

      {/* BADGE CELEBRATION OVERLAY */}
      {celebrationQueue.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md text-center">
          <div className="max-w-sm w-full bg-white rounded-3xl p-8 shadow-2xl relative flex flex-col items-center border-[6px] border-[#2EC4B6]">
            {/* Simple CSS Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
               <div className="absolute top-4 left-1/4 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
               <div className="absolute top-10 right-1/4 w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
               <div className="absolute top-2 left-1/2 w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100"></div>
            </div>

            <span className="text-[72px] mb-4 animate-bounce">
              {BADGE_MAP[celebrationQueue[0]]?.icon || "🏅"}
            </span>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Badge Unlocked!</h2>
            <p className="text-2xl font-black mt-2 text-[#2EC4B6]">
              {BADGE_MAP[celebrationQueue[0]]?.title || "Mystery Badge"}
            </p>
            <p className="text-sm text-slate-500 mt-2 font-bold mb-8">
              {BADGE_MAP[celebrationQueue[0]]?.desc || "Great job! You earned a new reward."}
            </p>
            
            <button
              onClick={() => {
                setCelebrationQueue(prev => prev.slice(1));
              }}
              className="w-full bg-[#2EC4B6] text-white font-black text-xl py-4 rounded-2xl border-b-[6px] border-teal-700 active:border-b-0 active:translate-y-[6px] transition-all"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChildApp;
