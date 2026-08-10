/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";

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

export function calculateStudyAnalytics(sessions: SupabaseSession[]) {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  
  let todaySecs = 0;
  let weeklySecs = 0;
  let totalSecs = 0;

  // Let's compute the start of the week: last 7 days (including today)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  sessions.forEach(sess => {
    const duration = Number(sess.duration_seconds || 0);
    totalSecs += duration;

    try {
      const sessDate = new Date(sess.started_at);
      const sessDateStr = sessDate.toISOString().split("T")[0];

      if (sessDateStr === todayStr) {
        todaySecs += duration;
      }

      if (sessDate >= sevenDaysAgo) {
        weeklySecs += duration;
      }
    } catch (e) {
      console.warn("Error parsing session date in analytics calculation:", e);
    }
  });

  return {
    todayMins: Math.ceil(todaySecs / 60),
    weeklyMins: Math.ceil(weeklySecs / 60),
    totalMins: Math.ceil(totalSecs / 60),
    todaySecs,
    weeklySecs,
    totalSecs
  };
}

interface SessionData {
  childId: string;
  lessonId?: string;
  activityType: string; // "lesson" | "game" | "video" etc.
}

export function useLearningTimeTracker(sessionData: SessionData | null) {
  const [isActive, setIsActive] = useState(false);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  
  // Keep values active in refs to ensure the tab closures / unmount handlers capture accurate, current states
  const accumulatedSecondsRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const idleTimeoutRef = useRef<any>(null);
  const isPausedRef = useRef(false);

  // Device Info and Timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos";

  // Reset idle timer
  const resetIdleTimer = () => {
    if (isPausedRef.current) {
      isPausedRef.current = false;
      setIsActive(true);
      console.log("[TIMER] Resumed timing due to user activity");
    }

    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = true;
      setIsActive(false);
      console.log("[TIMER] Paused timing due to user inactivity (idle 60s)");
    }, 60000); // 60 seconds
  };

  useEffect(() => {
    if (!sessionData) {
      setIsActive(false);
      return;
    }

    startTimeRef.current = Date.now();
    setAccumulatedSeconds(0);
    accumulatedSecondsRef.current = 0;
    setIsActive(true);
    isPausedRef.current = false;

    console.log(`[TIMER] Started tracking activity: ${sessionData.activityType} for child ${sessionData.childId}`);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPausedRef.current = true;
        setIsActive(false);
        console.log("[TIMER] Paused timing due to tab hidden");
      } else {
        isPausedRef.current = false;
        setIsActive(true);
        console.log("[TIMER] Resumed timing due to tab visible");
      }
    };

    const handleBlur = () => {
      isPausedRef.current = true;
      setIsActive(false);
      console.log("[TIMER] Paused timing due to window blur (user left tab or minimized browser)");
    };

    const handleFocus = () => {
      isPausedRef.current = false;
      setIsActive(true);
      console.log("[TIMER] Resumed timing due to window focus");
    };

    const handleUserInteraction = () => {
      resetIdleTimer();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach(event => {
      window.addEventListener(event, handleUserInteraction);
    });

    resetIdleTimer();

    timerRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        setAccumulatedSeconds(prev => {
          const next = prev + 1;
          accumulatedSecondsRef.current = next;
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
      events.forEach(event => {
        window.removeEventListener(event, handleUserInteraction);
      });

      const endedAt = Date.now();
      const startedAt = startTimeRef.current || endedAt;
      const finalDuration = accumulatedSecondsRef.current;

      if (finalDuration > 0 && sessionData.childId) {
        const sessionId = `sess-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const ua = navigator.userAgent;
        const isMobile = /Mobi|Android|iPhone/i.test(ua);
        const deviceType = isMobile ? "Mobile" : "Desktop";

        const logPayload = {
          session_id: sessionId,
          child_id: sessionData.childId,
          lesson_id: sessionData.lessonId || null,
          started_at: new Date(startedAt).toISOString(),
          ended_at: new Date(endedAt).toISOString(),
          duration_seconds: finalDuration,
          device_type: deviceType,
          timezone: timezone
        };

        console.log("[TIMER] Posting final learning session:", logPayload);

        fetch("/api/supabase/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logPayload)
        }).catch(err => {
          console.warn("[TIMER] Failed to register session log on server:", err);
        });

        // Also track system log
        fetch("/api/supabase/system_logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "learning",
            event_name: "lesson_duration",
            child_id: sessionData.childId,
            details: `Learned for ${finalDuration} seconds in activity group ${sessionData.activityType}`
          })
        }).catch(() => {});

        try {
          const statsKey = `clats_stats_${sessionData.childId}`;
          const currentStats = JSON.parse(localStorage.getItem(statsKey) || "[]");
          currentStats.push(logPayload);
          localStorage.setItem(statsKey, JSON.stringify(currentStats));

          // sync parent details
          const parentSess = JSON.parse(localStorage.getItem("clats_sess_v1") || "{}");
          if (parentSess.email) {
            const pEmail = parentSess.email.toLowerCase().trim();
            const timeLogs = JSON.parse(localStorage.getItem("clats_time_v1") || "{}");
            const dKey = `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`;
            if (!timeLogs[pEmail]) timeLogs[pEmail] = {};
            if (!timeLogs[pEmail][dKey]) timeLogs[pEmail][dKey] = { morning: 0, afternoon: 0, evening: 0 };
            
            const hours = new Date().getHours();
            const slot = hours >= 5 && hours < 12 ? "morning" : hours >= 12 && hours < 18 ? "afternoon" : "evening";
            timeLogs[pEmail][dKey][slot] = (timeLogs[pEmail][dKey][slot] || 0) + finalDuration;
            localStorage.setItem("clats_time_v1", JSON.stringify(timeLogs));
          }
        } catch (e) {
          console.warn("[TIMER] Failed to cache session details locally:", e);
        }
      }
    };
  }, [sessionData?.childId, sessionData?.lessonId, sessionData?.activityType]);

  return accumulatedSeconds;
}
