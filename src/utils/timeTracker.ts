/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CLATS Screen Monitoring & Learning Session Telemetry Engine.
 * Tracks active foreground time within CLATS (pausing on tab hidden, window blur,
 * or 60 seconds of inactivity) and records sessions to Supabase (`learning_sessions`).
 * Strictly transparent and proportionate: measures only in-app CLATS activity.
 */

import { useEffect, useRef, useState } from "react";
import { toLocalDateStr } from "./streak";

export interface SupabaseSession {
  session_id: string;
  child_id: string;
  lesson_id?: string | null;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  device_type?: string;
  timezone?: string;
  created_at?: string;
}

export interface DailyUsageItem {
  dateStr: string;
  dayLabel: string;
  date?: string;
  label?: string;
  totalSecs: number;
  learningSecs: number;
  otherSecs: number;
  totalMins: number;
  learningMins: number;
  otherMins: number;
}

export interface RecentSessionLogItem {
  sessionId: string;
  id?: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  durationMins: number;
  category: "learning" | "other";
  activityLabel: string;
  lessonOrItemId: string | null;
  deviceType: string;
}

/**
 * Classifies a `learning_sessions` row into core Learning Time (Lessons, Quizzes, Practice Sandbox)
 * vs. Other Platform Activity (Games World, AI Tutor Chat, Hub Navigation) based on `lesson_id`.
 */
export function classifySessionRow(sess: SupabaseSession): {
  category: "learning" | "other";
  activityLabel: string;
  lessonOrItemId: string | null;
} {
  const raw = (sess.lesson_id || "").trim();
  if (!raw) {
    return {
      category: "learning",
      activityLabel: "CLATS Learning Portal",
      lessonOrItemId: null
    };
  }

  if (raw.startsWith("lesson:")) {
    const id = raw.slice("lesson:".length) || null;
    return {
      category: "learning",
      activityLabel: id ? `Interactive Lesson (${id.toUpperCase()})` : "Interactive Lesson & Quiz",
      lessonOrItemId: id
    };
  }

  if (raw.startsWith("sandbox:")) {
    const id = raw.slice("sandbox:".length) || null;
    return {
      category: "learning",
      activityLabel: id ? `Wonder Lab (${id})` : "Wonder Lab Activity",
      lessonOrItemId: id
    };
  }

  if (raw.startsWith("games:")) {
    const id = raw.slice("games:".length) || null;
    return {
      category: "other",
      activityLabel: id ? `Games World (${id})` : "Educational Games World",
      lessonOrItemId: id
    };
  }

  if (raw.startsWith("chat:")) {
    return {
      category: "other",
      activityLabel: "AI Companion Chat",
      lessonOrItemId: null
    };
  }

  if (raw.startsWith("map:")) {
    return {
      category: "learning",
      activityLabel: "Adventure Learning Map",
      lessonOrItemId: null
    };
  }

  if (raw.startsWith("home:") || raw.startsWith("rewards:") || raw.startsWith("progress:")) {
    return {
      category: "other",
      activityLabel: raw.startsWith("rewards:")
        ? "Rewards & Badges"
        : raw.startsWith("progress:")
        ? "Explorer Profile"
        : "Explorer Hub",
      lessonOrItemId: null
    };
  }

  // Legacy lesson_id values (e.g. "t-a1m1l1") are direct lesson IDs
  return {
    category: "learning",
    activityLabel: `Lesson (${raw})`,
    lessonOrItemId: raw
  };
}

export function calculateStudyAnalytics(sessions: SupabaseSession[]) {
  const now = new Date();
  const todayStr = toLocalDateStr(now)!;

  let todaySecs = 0;
  let weeklySecs = 0;
  let totalSecs = 0;

  let learningSecsToday = 0;
  let learningSecsWeek = 0;
  let learningSecsTotal = 0;

  let otherSecsToday = 0;
  let otherSecsWeek = 0;
  let otherSecsTotal = 0;

  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);

  // Prepare 7-day rolling map (oldest -> today)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyMap = new Map<string, DailyUsageItem>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dStr = toLocalDateStr(d)!;
    dailyMap.set(dStr, {
      dateStr: dStr,
      dayLabel: i === 0 ? "Today" : dayNames[d.getDay()],
      date: dStr,
      label: i === 0 ? "Today" : dayNames[d.getDay()],
      totalSecs: 0,
      learningSecs: 0,
      otherSecs: 0,
      totalMins: 0,
      learningMins: 0,
      otherMins: 0
    });
  }

  const recentLogs: RecentSessionLogItem[] = [];

  // Deduplicate by session_id in case both local cache and server returned the same session
  const seenIds = new Set<string>();

  sessions.forEach((sess) => {
    if (!sess) return;
    if (sess.session_id && seenIds.has(sess.session_id)) return;
    if (sess.session_id) seenIds.add(sess.session_id);

    const duration = Math.max(0, Number(sess.duration_seconds || 0));
    if (duration <= 0) return;

    totalSecs += duration;
    const classified = classifySessionRow(sess);

    if (classified.category === "learning") {
      learningSecsTotal += duration;
    } else {
      otherSecsTotal += duration;
    }

    try {
      const sessDate = new Date(sess.started_at);
      const sessDateStr = toLocalDateStr(sessDate);

      if (sessDateStr === todayStr) {
        todaySecs += duration;
        if (classified.category === "learning") learningSecsToday += duration;
        else otherSecsToday += duration;
      }

      if (!isNaN(sessDate.getTime()) && sessDate >= sevenDaysAgo) {
        weeklySecs += duration;
        if (classified.category === "learning") learningSecsWeek += duration;
        else otherSecsWeek += duration;
      }

      if (sessDateStr && dailyMap.has(sessDateStr)) {
        const entry = dailyMap.get(sessDateStr)!;
        entry.totalSecs += duration;
        if (classified.category === "learning") entry.learningSecs += duration;
        else entry.otherSecs += duration;
      }

      recentLogs.push({
        sessionId: sess.session_id || `sess-${sess.started_at}`,
        id: sess.session_id || `sess-${sess.started_at}`,
        startedAt: sess.started_at,
        endedAt: sess.ended_at || sess.started_at,
        durationSeconds: duration,
        durationMins: Math.max(1, Math.round(duration / 60)),
        category: classified.category,
        activityLabel: classified.activityLabel,
        lessonOrItemId: classified.lessonOrItemId,
        deviceType: sess.device_type || "Desktop"
      });
    } catch (e) {
      console.warn("Error parsing session date in analytics calculation:", e);
    }
  });

  // Finalize minute rounding on dailyBreakdown
  const dailyBreakdown: DailyUsageItem[] = Array.from(dailyMap.values()).map((item) => ({
    ...item,
    totalMins: item.totalSecs > 0 ? Math.ceil(item.totalSecs / 60) : 0,
    learningMins: item.learningSecs > 0 ? Math.ceil(item.learningSecs / 60) : 0,
    otherMins: item.otherSecs > 0 ? Math.ceil(item.otherSecs / 60) : 0
  }));

  recentLogs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return {
    todayMins: todaySecs > 0 ? Math.ceil(todaySecs / 60) : 0,
    weeklyMins: weeklySecs > 0 ? Math.ceil(weeklySecs / 60) : 0,
    totalMins: totalSecs > 0 ? Math.ceil(totalSecs / 60) : 0,
    todaySecs,
    weeklySecs,
    totalSecs,
    learningMinsToday: learningSecsToday > 0 ? Math.ceil(learningSecsToday / 60) : 0,
    learningMinsWeek: learningSecsWeek > 0 ? Math.ceil(learningSecsWeek / 60) : 0,
    learningMinsTotal: learningSecsTotal > 0 ? Math.ceil(learningSecsTotal / 60) : 0,
    otherMinsToday: otherSecsToday > 0 ? Math.ceil(otherSecsToday / 60) : 0,
    otherMinsWeek: otherSecsWeek > 0 ? Math.ceil(otherSecsWeek / 60) : 0,
    otherMinsTotal: otherSecsTotal > 0 ? Math.ceil(otherSecsTotal / 60) : 0,
    dailyBreakdown,
    recentLogs: recentLogs.slice(0, 20),
    sessionCount: seenIds.size
  };
}

interface SessionData {
  childId: string;
  lessonId?: string;
  activityType: string; // "lesson" | "sandbox" | "games" | "chat" | "map" | "home" etc.
}

export function useLearningTimeTracker(sessionData: SessionData | null) {
  const [isActive, setIsActive] = useState(false);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);

  const accumulatedSecondsRef = useRef(0);
  const flushedSecondsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const idleTimeoutRef = useRef<any>(null);
  const isPausedRef = useRef(false);

  const timezone =
    (typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions().timeZone) || "UTC";

  const flushDeltaSession = (childId: string, activityType: string, lessonId?: string) => {
    const totalAcc = accumulatedSecondsRef.current;
    const delta = totalAcc - flushedSecondsRef.current;
    if (delta < 3 || !childId) return; // Ignore sub-3-second micro-mounts

    flushedSecondsRef.current = totalAcc;
    const endedAt = Date.now();
    const startedAt = segmentStartRef.current || endedAt - delta * 1000;
    segmentStartRef.current = endedAt;

    const sessionId = `sess-${endedAt}-${Math.floor(Math.random() * 10000)}`;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
    const isMobile = !isTablet && /Mobi|Android|iPhone/i.test(ua);
    const deviceType = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

    const encodedLessonField = lessonId
      ? `${activityType}:${lessonId}`
      : `${activityType}:portal`;

    const logPayload: SupabaseSession = {
      session_id: sessionId,
      child_id: childId,
      lesson_id: encodedLessonField,
      started_at: new Date(startedAt).toISOString(),
      ended_at: new Date(endedAt).toISOString(),
      duration_seconds: delta,
      device_type: deviceType,
      timezone
    };

    fetch("/api/supabase/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logPayload),
      keepalive: true
    }).catch((err) => {
      console.warn("[TIMER] Failed to register session log on server:", err);
    });

    try {
      const statsKey = `clats_stats_${childId}`;
      const currentStats = JSON.parse(localStorage.getItem(statsKey) || "[]");
      currentStats.push(logPayload);
      localStorage.setItem(statsKey, JSON.stringify(currentStats.slice(-150)));

      const parentSess = JSON.parse(localStorage.getItem("clats_sess_v1") || "{}");
      if (parentSess.email) {
        const pEmail = parentSess.email.toLowerCase().trim();
        const timeLogs = JSON.parse(localStorage.getItem("clats_time_v1") || "{}");
        const dKey = `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`;
        if (!timeLogs[pEmail]) timeLogs[pEmail] = {};
        if (!timeLogs[pEmail][dKey]) timeLogs[pEmail][dKey] = { morning: 0, afternoon: 0, evening: 0 };

        const hours = new Date().getHours();
        const slot =
          hours >= 5 && hours < 12 ? "morning" : hours >= 12 && hours < 18 ? "afternoon" : "evening";
        timeLogs[pEmail][dKey][slot] = (timeLogs[pEmail][dKey][slot] || 0) + delta;
        localStorage.setItem("clats_time_v1", JSON.stringify(timeLogs));
      }
    } catch (e) {
      console.warn("[TIMER] Failed to cache session details locally:", e);
    }
  };

  const resetIdleTimer = () => {
    if (isPausedRef.current) {
      isPausedRef.current = false;
      setIsActive(true);
    }

    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = true;
      setIsActive(false);
    }, 60000); // Pause after 60 seconds of inactivity
  };

  useEffect(() => {
    if (!sessionData || !sessionData.childId) {
      setIsActive(false);
      return;
    }

    segmentStartRef.current = Date.now();
    setAccumulatedSeconds(0);
    accumulatedSecondsRef.current = 0;
    flushedSecondsRef.current = 0;
    setIsActive(true);
    isPausedRef.current = false;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPausedRef.current = true;
        setIsActive(false);
        flushDeltaSession(sessionData.childId, sessionData.activityType, sessionData.lessonId);
      } else {
        segmentStartRef.current = Date.now();
        isPausedRef.current = false;
        setIsActive(true);
      }
    };

    const handleBlur = () => {
      isPausedRef.current = true;
      setIsActive(false);
    };

    const handleFocus = () => {
      segmentStartRef.current = Date.now();
      isPausedRef.current = false;
      setIsActive(true);
    };

    const handleUserInteraction = () => {
      resetIdleTimer();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((event) => {
      window.addEventListener(event, handleUserInteraction, { passive: true });
    });

    resetIdleTimer();

    timerRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        setAccumulatedSeconds((prev) => {
          const next = prev + 1;
          accumulatedSecondsRef.current = next;
          // Periodic 60-second heartbeat flush so active study sessions are saved in real time
          if (next - flushedSecondsRef.current >= 60) {
            flushDeltaSession(sessionData.childId, sessionData.activityType, sessionData.lessonId);
          }
          return next;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      events.forEach((event) => {
        window.removeEventListener(event, handleUserInteraction);
      });

      flushDeltaSession(sessionData.childId, sessionData.activityType, sessionData.lessonId);
    };
  }, [sessionData?.childId, sessionData?.lessonId, sessionData?.activityType]);

  return accumulatedSeconds;
}
