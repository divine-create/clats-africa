/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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
import { companionVoice } from "../utils/audio";
import { ChildWelcomeScreen } from "./ChildWelcome";
import { SagaMap } from "./SagaMap";
import { ChildProgressScreen } from "./ChildProgress";
import { LessonContent } from "./LessonContent";
import { ChildGames } from "./ChildGames";
import { ChildRewards } from "./ChildRewards";
import { CURRICULUM } from "../data/curriculum";
import { PaywallModal } from "./PaywallModal";

interface ChildAppProps {
  child: Child;
  parent: Parent | null;
  onExit: () => void;
  lang: Language;
  onUpdateChild: (updated: Child) => void;
  theme: "light" | "dark";
  onToggleTheme?: () => void;
}

type TabType = "home" | "map" | "progress" | "chat" | "games" | "rewards";

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
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [selModule, setSelModule] = useState<Module | null>(null);
  const [selLesson, setSelLesson] = useState<Lesson | null>(null);
  const [showHandoff, setShowHandoff] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string>("academy-1");
  const [celebrationQueue, setCelebrationQueue] = useState<any[]>([]);

  // Load narration preference
  const isEarly = child.ageGroup === "early explorers";
  const [narrationOn, setNarrationOn] = useState(() => companionVoice.isNarrationEnabled(child.ageGroup));

  // Auto-Start on Login for Early Explorers
  useEffect(() => {
    if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem("hasAutoStarted_" + child.id)) {
      sessionStorage.setItem("hasAutoStarted_" + child.id, "true");
      if (child.ageGroup === "early explorers") {
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
  }, [child]);

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

  // Check limits and tick slotUsed in local state reactively
  useEffect(() => {
    checkTimingLimits();
    const timer = setInterval(() => {
      checkTimingLimits();
      if (!blocked) {
        setSlotUsed((p) => p + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [child?.id, parent?.email, blocked]);

  // Warning trigger checks
  useEffect(() => {
    if (slotLimit > 0) {
      const remain = slotLimit - slotUsed;
      if (remain === 300) {
        setToastMessage(T[lang].fiveMinsLeft);
        setTimeout(() => setToastMessage(null), 8000);
      }
      if (remain <= 0) {
        setBlocked(true);
      }
    }
  }, [slotUsed, slotLimit, lang]);

  const checkTimingLimits = () => {

    if (parent) {
      const parentS = S_RESOLVE();
      const parentEmail = parent.email;
      const settings = parentS[parentEmail.toLowerCase()];
      if (settings && settings.limitsEnabled) {
        setLimitsEnabled(true);
        const curS = getCurrentSlot();
        setSlot(curS);
        if (curS) {
          const limitSecs = settings.slots[curS] || 0;
          setSlotLimit(limitSecs);

          if (slotUsed >= limitSecs && limitSecs > 0) {
            setBlocked(true);
          } else {
            setBlocked(false);
          }
        } else {
          setSlotLimit(0);
          setSlotUsed(0);
          setBlocked(false);
        }
      } else {
        setLimitsEnabled(false);
        setSlotLimit(0);
        setSlotUsed(0);
        setBlocked(false);
      }
    } else {
      // Offline fallback: 40 mins
      setLimitsEnabled(true);
      setSlotLimit(40 * 60);
    }
  };

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

    const actualXpEarned = (isPass && !alreadyCompleted) ? xpEarned : 0;
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

    // Calculate streak locally first so we can award streak badges
    let finalStreak = child.streak_count || 0;
    let finalLastActive = child.last_active_at || "";

    if (isPass) {
      const todayStr = new Date().toISOString().split("T")[0];
      if (!child.last_active_at) {
        finalStreak = 1;
        finalLastActive = todayStr;
      } else {
        const lastActiveStr = child.last_active_at.split("T")[0];
        if (lastActiveStr === todayStr) {
          finalLastActive = todayStr;
        } else {
          const d1 = new Date(lastActiveStr);
          const d2 = new Date(todayStr);
          d1.setUTCHours(0, 0, 0, 0);
          d2.setUTCHours(0, 0, 0, 0);
          const daysDiff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            finalStreak = (child.streak_count || 0) + 1;
            finalLastActive = todayStr;
          } else if (daysDiff > 1) {
            finalStreak = 1;
            finalLastActive = todayStr;
          } else {
            finalLastActive = todayStr;
          }
        }
      }
    }

    const currentBadges = child.badges || [];
    const badgesToUnlock: string[] = [];
    
    const tryUnlock = (badgeId: string) => {
      if (!currentBadges.includes(badgeId) && !badgesToUnlock.includes(badgeId)) {
        badgesToUnlock.push(badgeId);
      }
    };

    if (currentCompletedCount >= 1) tryUnlock("bdg-ai-newbie");
    if (freshXP >= 250) tryUnlock("bdg-cyber-shield");
    if (freshXP >= 500) tryUnlock("bdg-prompt-pro");
    if (freshXP >= 1000) tryUnlock("badge_bronze_scholar");
    
    if (quizResult && quizResult.score === 100 && !priorQuizResults[lessonId]) {
      tryUnlock("badge_flawless_victory");
    }
    if (finalStreak >= 3) {
      tryUnlock("badge_3_day_spark");
    }

    if (parent && parent.email) {
      try {
        const transRes = await fetch("/api/supabase/progress/transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            child_id: child.id,
            lesson_id: lessonId,
            quiz_score: quizResult ? quizResult.score : null,
            xp_earned: actualXpEarned,
            completed: isPass,
            total_questions: quizResult ? quizResult.totalQuestions : null,
            stars_earned: (isPass && starsEarned > currentStars) ? starsEarned : currentStars,
            badges_unlocked_ids: badgesToUnlock
          })
        });
        if (transRes.ok) {
          const resData = await transRes.json();
          console.log("[SYNC] Synced progress atomically via transaction:", resData);

          // Trigger database notification for parent dashboard
          try {
            if (isPass) {
              await fetch("/api/supabase/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  parent_id: parent.id,
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
            }
          } catch (e) {
            console.warn("[SYNC] Failed to push notification:", e);
          }

          if (resData.streak_count !== undefined) {
            finalStreak = resData.streak_count;
          }
          if (resData.last_active_at !== undefined) {
            finalLastActive = resData.last_active_at;
          }
        }
      } catch (e) {
        console.warn("[SYNC] Fallback to client-side caching due to transient database error:", e);
      }
    }

    // Trigger celebration
    if (badgesToUnlock.length > 0) {
      setCelebrationQueue(prev => [...prev, ...badgesToUnlock]);
    }

    // Combine existing badges with newly unlocked ones
    const newBadgesList = [...(child.badges || []), ...badgesToUnlock];

    // Persist changes
    const updated = {
      ...child,
      completed: freshCompleted,
      stars: freshStars,
      xp: freshXP,
      quizResults: freshQuizResults,
      streak_count: finalStreak,
      best_streak: Math.max(finalStreak, child.best_streak || 0),
      last_active_at: finalLastActive,
      badges: newBadgesList
    };

    onUpdateChild(updated);
  };

  const handleAddGamesXP = async (amount: number) => {
    const freshXP = (child.xp || 0) + amount;
    
    const newlyUnlocked: string[] = [];
    if (freshXP >= 250 && !currentBadges.includes("bdg-cyber-shield")) newlyUnlocked.push("bdg-cyber-shield");
    if (freshXP >= 500 && !currentBadges.includes("bdg-prompt-pro")) newlyUnlocked.push("bdg-prompt-pro");
    if (freshXP >= 1000 && !currentBadges.includes("badge_bronze_scholar")) newlyUnlocked.push("badge_bronze_scholar");

    if (newlyUnlocked.length > 0) {
      setCelebrationQueue(prev => [...prev, ...newlyUnlocked]);
    }

    const newBadgesList = [...currentBadges, ...newlyUnlocked];

    // Sync to database
    if (parent) {
      try {
        await fetch("/api/supabase/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            child_id: child.id,
            parent_id: parent.id,
            xp_earned: amount,
            stars_earned: 0,
            badges_unlocked_ids: newlyUnlocked
          })
        });
      } catch (e) {
        console.warn("[SYNC] Failed to sync game XP:", e);
      }
    }

    const updated = {
      ...child,
      xp: freshXP,
      badges: newBadgesList
    };
    onUpdateChild(updated);
  };





  const BADGE_MAP: Record<string, { title: string, icon: string }> = {
    "bdg-ai-newbie": { title: "AI Newbie", icon: "🌱" },
    "bdg-cyber-shield": { title: "Cyber Shield", icon: "🛡️" },
    "bdg-prompt-pro": { title: "Prompt Pro", icon: "💬" },
    "badge_bronze_scholar": { title: "Bronze Scholar", icon: "🏆" },
    "badge_flawless_victory": { title: "Flawless Victory", icon: "🎯" },
    "badge_3_day_spark": { title: "3-Day Spark", icon: "🔥" },
  };

  return (
    <div className="tropical-bg" style={{ minHeight: "100vh", paddingBottom: 88, position: "relative", overflowX: "hidden" }}>
      {/* 🌴 Bright Tropical Adventure Backdrop Ornaments */}
      {!isEarly && (
        <button
          id="voice-narration-toggle"
          onClick={handleToggleNarration}
          style={{
            position: "fixed",
            bottom: 110,
            right: 24,
            top: "auto",
            left: "auto",
            background: isDark ? "#1e293b" : "#ffffff",
            border: isDark ? "2px solid #334155" : "2px solid #cbd5e1",
            borderRadius: "50px",
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            zIndex: 999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "all 0.2s"
          }}
          title="Toggle companion voice reader"
        >
          <span style={{ fontSize: 20 }}>{narrationOn ? "🔊" : "🔇"}</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: isDark ? "#cbd5e1" : "#1e293b" }}>
            READER: {narrationOn ? "ON" : "OFF"}
          </span>
        </button>
      )}
      <div
        onClick={onToggleTheme}
        title="Toggle Theme style"
        style={{
          position: "fixed",
          bottom: 160,
          right: 24,
          top: "auto",
          left: "auto",
          fontSize: 48,
          cursor: onToggleTheme ? "pointer" : "default",
          zIndex: 999,
          userSelect: "none",
          transition: "transform 0.2s",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
        }}
        onMouseEnter={(e) => { if (onToggleTheme) e.currentTarget.style.transform = "scale(1.15) rotate(15deg)"; }}
        onMouseLeave={(e) => { if (onToggleTheme) e.currentTarget.style.transform = ""; }}
      >
        {isDark ? "🌙" : "☀️"}
      </div>
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
                  setActiveTab("chat");
                  return;
                }
              }
            }
            // If all completed, restart the first one
            if (course.modules[0] && course.modules[0].lessons[0]) {
              setSelModule(course.modules[0]);
              setSelLesson(course.modules[0].lessons[0]);
              setActiveTab("chat");
            }
          }}
          lang={lang}
          theme={theme}
        />
      )}

      {/* The Saga Map */}
      {activeTab === "map" && (
        <SagaMap
          child={child}
          lang={lang}
          theme={theme}
          onSelectLesson={(l) => {
            setSelLesson(l);
            setActiveTab("chat");
          }}
          onShowPaywall={() => setShowHandoff(true)}
        />
      )}

      {/* Active Lesson Quiz & Chat Portal */}
      {activeTab === "chat" && (() => {
        const isLastLesson = selModule && selLesson && selModule.lessons.findIndex((l) => l.id === selLesson.id) === selModule.lessons.length - 1;
        const course = CURRICULUM[child.ageGroup || "early explorers"];
        let nextModule = null;
        let nextModIdx = -1;
        if (selModule && course && course.modules) {
          const modIdx = course.modules.findIndex(m => m.id === selModule.id);
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
            onClose={() => {
              setSelLesson(null);
              setActiveTab("map");
            }}
            onNextLesson={!isLastLesson ? () => {
              if (selModule && selLesson) {
                const idx = selModule.lessons.findIndex((l) => l.id === selLesson.id);
                if (idx !== -1 && idx + 1 < selModule.lessons.length) {
                  setSelLesson(selModule.lessons[idx + 1]);
                }
              }
            } : undefined}
            isLastLessonInModule={isLastLesson}
            isNextModuleLocked={isNextModuleLocked}
            onShowPaywall={() => setShowHandoff(true)}
            nextModuleTitle={nextModule?.title?.en}
            onNextModule={nextModule ? () => {
              setSelModule(nextModule);
              setActiveTab("map"); // take them to the next module's path map!
            } : () => {
              // End of the entire curriculum!
              setActiveTab("rewards");
            }}
          />
        );
      })()}

      {/* Analytics Student Profile */}
      {activeTab === "progress" && (
        <ChildProgressScreen
          child={child}
          onBack={() => setActiveTab("home")}
          lang={lang}
          parentEmail={parent ? parent.email : "guest"}
          onUpdateChild={onUpdateChild}
          theme={theme}
          onTabChange={setActiveTab}
        />
      )}

      {/* Games Arcade Screen */}
      {activeTab === "games" && (
        <ChildGames
          child={child}
          lang={lang}
          onAddXP={handleAddGamesXP}
        />
      )}

      {/* Rewards Milestones Screen */}
      {activeTab === "rewards" && (
        <ChildRewards
          child={child}
          lang={lang}
          onStartLearning={() => setActiveTab("home")}
          theme={theme}
          onUpdateChild={onUpdateChild}
        />
      )}

      {/* Primary child navigation dock (Always present unless inside Active Lesson screen for focus) */}
      {activeTab !== "chat" && (
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
          {[
            { id: "home" as const, label: "Learn", icon: "🗺️" },
            { id: "games" as const, label: "Games", icon: "🎮" },
            { id: "rewards" as const, label: "Rewards", icon: "🏆" },
            { id: "progress" as const, label: "Profile", icon: "📊" }
          ].map(({ id, label, icon }) => {
            const isSel = activeTab === id || 
              (id === "home" && activeTab === "map");
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
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
                setActiveTab("lessons");
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
              Great job! You earned a new reward.
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
