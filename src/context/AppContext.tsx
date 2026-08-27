"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Global CLATS App Context
 * Shares session, theme, language, parent and child state across all pages.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, Parent, Child } from "@/types";
import { S, syncToSupabase, getSupabaseStatus, pullParentFromSupabase, pullCurriculumFromSupabase, logSystemEvent } from "@/utils/config";
import { companionVoice } from "@/utils/audio";

interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  parent: Parent | null;
  setParent: (p: Parent | null) => void;
  activeChild: Child | null;
  setActiveChild: (c: Child | null) => void;
  dbConnected: boolean;
  isSyncing: boolean;
  logout: (redirectTo?: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [parent, setParentState] = useState<Parent | null>(null);
  const [activeChild, setActiveChildState] = useState<Child | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("clats_active_child");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });
  const [dbConnected, setDbConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Global button click sound handler
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__CLATS_SOUND_ENABLED__ = soundEnabled;
    }
    
    const handleGlobalClick = (e: MouseEvent) => {
      if (!soundEnabled) return;
      
      const target = e.target as HTMLElement;
      // Play sound if clicked on a button, a link, or anything with role="button"
      const isClickable = target.closest('button') || target.closest('a') || target.closest('[role="button"]');
      
      if (isClickable) {
        import("@/utils/audio").then(({ sfx }) => {
          sfx.playTap();
        });
      }
    };
    
    document.addEventListener("click", handleGlobalClick, true);
    return () => document.removeEventListener("click", handleGlobalClick, true);
  }, [soundEnabled]);

  // Restore persisted session on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = localStorage.getItem("clats_theme") as "light" | "dark" | null;
    if (savedTheme) setThemeState(savedTheme);

    const savedLang = S.getLang() as Language;
    if (savedLang) setLangState(savedLang);

    // Restore parent session from Supabase if a session exists
    const sess = S.getSess();
    if (sess?.email && !parent) {
      if (sess.isB2B) {
        setParentState({
          id: sess.email || "b2b_session",
          email: sess.email,
          name: "Sponsor Parent",
          children: [],
          isB2B: true
        });
      } else {
        pullParentFromSupabase(sess.email)
          .then((p) => {
            if (p) {
              setParentState(p);
            }
          })
          .catch((e) => {
            console.warn("Failed to restore session from Supabase:", e);
            if (String(e).includes("ACCOUNT_DELETED")) {
              S.clearSess();
            }
          });
      }
    }
  }, []);

  // Check Supabase + load curriculum when parent changes
  useEffect(() => {
    const checkDb = async () => {
      try {
        const status = await getSupabaseStatus();
        setDbConnected(status.enabled);
        if (status.enabled) {
          await pullCurriculumFromSupabase();
          await companionVoice.loadConfigsFromServer();
        }
      } catch {
        setDbConnected(false);
      }
    };
    checkDb();
  }, [parent]);

  // Auto-sync parent to Supabase
  useEffect(() => {
    if (!parent?.email || parent.isB2B) return;
    const run = async () => {
      setIsSyncing(true);
      try {
        const res = await syncToSupabase(parent);
        if (res?.synced) setDbConnected(true);
        else if (res?.code === "ACCOUNT_DELETED") {
          logout();
          alert("Your account was deleted from the cloud database.");
        }
      } catch (e) {
        console.warn("Sync error:", e);
      } finally {
        setIsSyncing(false);
      }
    };
    const t = setTimeout(run, 1200);
    return () => clearTimeout(t);
  }, [parent]);

  const setLang = (l: Language) => {
    setLangState(l);
    S.setLang(l);
  };

  const setTheme = (t: "light" | "dark") => {
    setThemeState(t);
    if (typeof window !== "undefined") localStorage.setItem("clats_theme", t);
  };

  const setParent = (p: Parent | null) => {
    setParentState(p);
    if (p) S.setSess({ type: "parent", email: p.email });
    else S.clearSess();
  };

  const setActiveChild = (c: Child | null) => {
    setActiveChildState(c);
    if (c) {
      if (typeof window !== "undefined") localStorage.setItem("clats_active_child", JSON.stringify(c));
    } else {
      if (typeof window !== "undefined") localStorage.removeItem("clats_active_child");
    }
  };

  const logout = (redirectTo: string = "/") => {
    S.clearSess();
    if (typeof window !== "undefined") localStorage.removeItem("clats_active_child");
    setParentState(null);
    setActiveChildState(null);
    if (typeof window !== "undefined") window.location.href = redirectTo;
  };

  return (
    <AppContext.Provider value={{ lang, setLang, theme, setTheme, parent, setParent, activeChild, setActiveChild, dbConnected, isSyncing, logout, soundEnabled, setSoundEnabled }}>
      {children}
    </AppContext.Provider>
  );
}
