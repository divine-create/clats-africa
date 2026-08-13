/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Child, Module, Lesson, Language, AgeGroup } from "../types";
import { C } from "../utils/config";
import { CURRICULUM } from "../data/curriculum";
import { Card, Txt, Heading, Chip } from "./Primitives";
import { sfx } from "../utils/audio";
import {
  ChevronLeft,
  ArrowRight,
  Bot,
  Sparkles,
  Award,
  Lock,
  Compass,
  CheckCircle,
  Bell,
  Check,
  BookOpen,
  Mail,
  Users,
  Compass as CompassIcon,
  HelpCircle
} from "lucide-react";

interface ModulesOverviewProps {
  child: Child;
  onSelectModule: (m: Module) => void;
  lang: Language;
  onBack: () => void;
  slotLimit?: number;
  theme?: "light" | "dark";
  selectedAcademyId?: string;
  onShowPaywall?: () => void;
}

interface SyllabusModule {
  id: string;
  title: string;
  desc: string;
  icon: string;
  comingSoon?: boolean;
  lessons: Lesson[];
  statusLabel?: string;
  badge: { name: string; icon: string };
  backendModuleId?: string;
}

export const ModulesOverview: React.FC<ModulesOverviewProps> = ({
  child,
  onSelectModule,
  lang,
  onBack,
  theme = "dark",
  selectedAcademyId = "academy-1",
  onShowPaywall
}) => {
  const isDark = theme === "dark";
  const ageGroup: AgeGroup = child.ageGroup || "early explorers";

  // State to hold the actively selected Academy tab
  const [activeAcadId, setActiveAcadId] = useState<string>(selectedAcademyId);

  // Sync state if initial prop changes
  useEffect(() => {
    if (selectedAcademyId) {
      setActiveAcadId(selectedAcademyId);
    }
  }, [selectedAcademyId]);

  // State to hold the selected module for the desktop/tablet preview pane
  const [activeSelId, setActiveSelId] = useState<string>("");
  const [notifyEmail, setNotifyEmail] = useState<string>("");
  const [isNotifiedMap, setIsNotifiedMap] = useState<Record<string, boolean>>({});
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);

  // Sticky bottom CTA: show when the in-panel Start Journey button is out of view
  const [showStickyBar, setShowStickyBar] = useState(false);
  const journeyBtnRef = useRef<HTMLButtonElement>(null);

  // IntersectionObserver — watch the in-panel button; when it leaves viewport show sticky bar
  useEffect(() => {
    const btn = journeyBtnRef.current;
    if (!btn) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the in-panel button is NOT visible → show sticky bar
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    observer.observe(btn);
    return () => observer.disconnect();
  }, [activeSelId]); // re-run when selection changes so observer attaches to new ref

  // Load Academy details dynamically based on active academy selection and age group
  const getAcademyData = () => {
    const dbCourse = CURRICULUM[ageGroup];
    const acadIndex = activeAcadId.replace("academy-", "a"); // e.g. "a1"
    const prefix = `${ageGroup === "early explorers" ? "t" : ageGroup === "young innovators" ? "j" : "p"}-${acadIndex}`;

    // Filter modules that belong to this academy/pathway.
    const matchedModules = dbCourse?.modules.filter(m => {
      // If it has a database pathwayId, it MUST match the activeAcadId
      if (m.pathwayId) {
        return m.pathwayId === activeAcadId;
      }
      
      // Fallback for hardcoded fallback curriculum:
      // Direct prefix match
      if (m.id.startsWith(prefix)) return true;
      
      // Support old historic modules as part of Academy 1
      if (activeAcadId === "academy-1" || activeAcadId === "lp-ai") {
        if (ageGroup === "early explorers" && ["t-m1", "t-m2", "t-m3"].includes(m.id)) return true;
        if (ageGroup === "young innovators" && ["j-m1", "j-m2", "j-m3", "j-m4"].includes(m.id)) return true;
        if (ageGroup === "future builders" && ["p-m1", "p-m2", "p-m3", "p-m4"].includes(m.id)) return true;
      }
      return false;
    }) || [];

    // Map curriculum modules to local UI SyllabusModule structure
    const mappedModules: SyllabusModule[] = matchedModules.map((m, idx) => {
      // Modules with active lessons are unlocked. No age-group or academy hardcoding anymore.
      const isComingSoonValue = !m.lessons || m.lessons.length === 0;

      return {
        id: m.id,
        title: m.name.en,
        desc: m.goal.en,
        icon: m.badge?.icon || "💡",
        comingSoon: isComingSoonValue,
        lessons: m.lessons,
        statusLabel: isComingSoonValue ? "🌟 COMING SOON" : "⚡ ACTIVE",
        badge: {
          name: m.badge?.name || "Topic Master",
          icon: m.badge?.icon || "🏆"
        },
        backendModuleId: m.id
      };
    });

    let titleText = "AI & Emerging Technologies";
    let subTitleText = ageGroup === "young innovators" ? "Flagship Academy (Phase 1 Launch)" : "Phase 1 Preview";
    let academyDesc = "Our premium hands-on cognitive track for curious minds.";
    let academyStatus = mappedModules.some(m => !m.comingSoon) ? "🚀 Active" : "🌟 Coming Soon";

    // Try to find matching pathway in dynamic DB data
    const dynamicPathway = dbCourse?.pathways?.find(p => p.id === activeAcadId);
    if (dynamicPathway) {
      titleText = dynamicPathway.title;
      subTitleText = "Learning Pathway";
      academyDesc = dynamicPathway.description;
    } else {
      // Dynamic fallback based on ID
      const num = activeAcadId.split("-")[1] || "X";
      titleText = `Pathway ${num} (Coming Soon)`;
      subTitleText = "Curriculum in Development";
      academyDesc = "New curriculum modules are actively being built for this pathway.";
    }

    return {
      title: titleText,
      subtitle: subTitleText,
      status: academyStatus,
      desc: academyDesc,
      modules: mappedModules
    };
  };

  const academy = getAcademyData();

  // Reset active module selection to the first module of the academy when academy changes
  useEffect(() => {
    const freshAcad = getAcademyData();
    if (freshAcad.modules.length > 0) {
      const firstActive = freshAcad.modules.find((m) => !m.comingSoon);
      setActiveSelId(firstActive ? firstActive.id : freshAcad.modules[0].id);
    } else {
      setActiveSelId("");
    }
  }, [activeAcadId]);

  const selectedModule = academy.modules.find((m) => m.id === activeSelId) || academy.modules[0];

  // Resolve dynamic progress for active modules from curriculum core
  const dbCourse = CURRICULUM[ageGroup];
  const getModuleProgress = (backendId?: string) => {
    if (!backendId) return 0;
    const targetMod = dbCourse?.modules.find((m) => m.id === backendId);
    if (!targetMod || targetMod.lessons.length === 0) return 0;
    const completed = targetMod.lessons.filter((l) => child.completed?.[l.id]).length;
    return Math.round((completed / targetMod.lessons.length) * 100);
  };

  const currentTrackProgress = getModuleProgress(selectedModule?.backendModuleId);

  // Notify Me Subscription Handler
  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;

    sfx.playCoin();
    setIsNotifiedMap((prev) => ({ ...prev, [selectedModule.id]: true }));
    setNotificationSuccess(`🔔 Success! Parents will be mailed at ${notifyEmail} once "${selectedModule.title}" is deployed.`);
    setNotifyEmail("");
    setTimeout(() => {
      setNotificationSuccess(null);
    }, 4500);
  };

  // Launch Active Module Lesson Journey Map
  const handleLaunchJourney = (item: SyllabusModule) => {
    sfx.playTap();
    // Resolve matching live curriculum module
    const matchedBackend = dbCourse?.modules.find((m) => m.id === item.backendModuleId);
    if (matchedBackend) {
      const formattedModule: Module = {
        ...matchedBackend,
        name: { en: item.title, ig: item.title, yo: item.title, fr: item.title, ha: item.title },
        comingSoon: item.comingSoon
      };
      onSelectModule(formattedModule);
    } else {
      // Fallback generator
      const fallbackModule: Module = {
        id: item.id,
        name: { en: item.title, ig: item.title, yo: item.title, fr: item.title, ha: item.title },
        goal: { en: item.desc, ig: item.desc, yo: item.desc, fr: item.desc, ha: item.desc },
        badge: { name: item.badge.name, icon: item.badge.icon },
        lessons: [],
        comingSoon: item.comingSoon
      };
      onSelectModule(fallbackModule);
    }
  };

  return (
    <div
      id="modules-academy-center"
      className={`w-full min-h-screen pb-28 pt-4 transition-colors duration-300 ${
        isDark ? "bg-[#090e17] text-white" : "bg-gradient-to-b from-[#edfaff] to-[#fffef2] text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP FLOATING NAVIGATION RAIL */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <button
            onClick={onBack}
            className={`flex items-center gap-3 border-2 px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer ${
              isDark
                ? "bg-slate-900 border-[#2EC4B6]/30 hover:bg-slate-850 text-[#2EC4B6]"
                : "bg-white border-[#2EC4B6]/20 hover:bg-slate-50 text-[#2EC4B6]"
            }`}
          >
            <span style={{ fontSize: 28 }}>🏠</span>
            <span>Home</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <Txt size={12} className="text-slate-500 font-extrabold font-mono uppercase tracking-widest">
              XP: {child.xp || 0}
            </Txt>
          </div>
        </div>

        {/* PREMIUM ACADEMY SELECTOR TABS */}
        <div className="mb-8">
          <Txt size={11} className={`font-black uppercase tracking-widest font-mono block mb-3.5 ${isDark ? "text-[#2EC4B6]" : "text-[#208a80]"}`}>
            🎓 LEARNING PATHWAY ACADEMIES
          </Txt>
          
          <div className={`grid ${ageGroup === "future builders" ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-4"} gap-3`}>
            {(ageGroup === "future builders" ? [
              { id: "academy-1", label: "Artificial Intelligence", icon: "🤖", sub: "Emerging Tech", color: "from-teal-500 to-emerald-500", bgLight: "bg-emerald-50 text-emerald-800 border-[#2EC4B6]/20", bgDark: "bg-emerald-950/40 text-emerald-300 border-[#2EC4B6]/30", activeBg: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white" },
              { id: "academy-2", label: "Digital Citizenship & Cybersecurity", icon: "🔒", sub: "Digital Safety", color: "from-amber-500 to-orange-500", bgLight: "bg-amber-50 text-amber-800 border-amber-200", bgDark: "bg-amber-950/40 text-amber-300 border-amber-900/40", activeBg: "bg-gradient-to-r from-amber-500 to-orange-500 text-white" },
              { id: "academy-3", label: "Design & Creation", icon: "🎨", sub: "UI/UX & Graphics", color: "from-pink-500 to-rose-500", bgLight: "bg-rose-50 text-rose-800 border-rose-200", bgDark: "bg-rose-950/40 text-rose-300 border-rose-900/40", activeBg: "bg-gradient-to-r from-pink-500 to-rose-500 text-white" },
              { id: "academy-4", label: "Careers & Leadership", icon: "🚀", sub: "Innovation", color: "from-purple-500 to-indigo-500", bgLight: "bg-purple-50 text-purple-800 border-purple-200", bgDark: "bg-purple-950/40 text-purple-300 border-purple-900/40", activeBg: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white" },
              { id: "academy-5", label: "Adaptability & Lifelong", icon: "🌱", sub: "Future Skills", color: "from-emerald-550 to-teal-550", bgLight: "bg-teal-50 text-teal-800 border-teal-200", bgDark: "bg-teal-950/40 text-teal-300 border-teal-900/40", activeBg: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white" }
            ] : [
              { id: "academy-1", label: "Artificial Intelligence", icon: "🤖", sub: "Emerging Tech", color: "from-teal-500 to-emerald-500", bgLight: "bg-emerald-50 text-emerald-800 border-[#2EC4B6]/20", bgDark: "bg-emerald-950/40 text-emerald-300 border-[#2EC4B6]/30", activeBg: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white" },
              { id: "academy-2", label: "Digital Citizenship & Cybersecurity", icon: "🔒", sub: "Digital Safety", color: "from-amber-500 to-orange-500", bgLight: "bg-amber-50 text-amber-800 border-amber-200", bgDark: "bg-amber-950/40 text-amber-300 border-amber-900/40", activeBg: "bg-gradient-to-r from-amber-500 to-orange-500 text-white" },
              { id: "academy-3", label: "Design & Creation", icon: "🎨", sub: "UI/UX & Graphics", color: "from-pink-500 to-rose-500", bgLight: "bg-rose-50 text-rose-800 border-rose-200", bgDark: "bg-rose-950/40 text-rose-300 border-rose-900/40", activeBg: "bg-gradient-to-r from-pink-500 to-rose-500 text-white" },
              { id: "academy-4", label: "Adaptability & Lifelong", icon: "🌱", sub: "Future Skills", color: "from-emerald-555 to-teal-555", bgLight: "bg-teal-50 text-teal-800 border-teal-200", bgDark: "bg-teal-950/40 text-teal-300 border-teal-900/40", activeBg: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white" }
            ]).map((tab) => {
              const isActive = activeAcadId === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => {
                    sfx.playTap();
                    setActiveAcadId(tab.id);
                  }}
                  className={`relative p-3.5 rounded-2xl border-2 transition-all duration-300 text-left flex items-start gap-2.5 cursor-pointer shadow-sm select-none ${
                    isActive
                      ? `${tab.activeBg} border-white/10 scale-[1.02] font-black shadow-md shadow-slate-900/20`
                      : isDark
                      ? "bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-white"
                      : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                  style={{ cursor: "pointer" }}
                >
                  <span className="text-2xl mt-0.5">{tab.icon}</span>
                  <div>
                    <span className="block font-black text-xs leading-snug">{tab.label}</span>
                    <span className={`block text-[9px] uppercase font-mono mt-1 font-bold tracking-wider ${isActive ? "text-white/80" : "text-slate-450"}`}>
                      {tab.sub}
                    </span>
                  </div>
                  {isActive && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ACADEMY BRAND JUMBOTRON HEADER */}
        <div className={`relative overflow-hidden border-3 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm ${
          isDark
            ? "bg-gradient-to-br from-teal-950/15 via-[#B8A0FF]/10 to-[#1e1c3a] border-[#2EC4B6]/20"
            : "bg-gradient-to-br from-[#2EC4B6]/10 via-[#B8A0FF]/15 to-[#FFD166]/15 border-emerald-100"
        }`}>
          {/* Decorative shapes to amplify top edtech feel */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#2EC4B6]/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-[#B8A0FF]/15 rounded-full blur-[18px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-gradient-to-r from-[#2EC4B6] to-[#B8A0FF] text-white font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm font-mono">
                  {academy.status}
                </span>
                {ageGroup === "early explorers" && (
                  <span className={`border font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isDark ? "bg-amber-950/40 text-amber-300 border-amber-900" : "bg-amber-100 text-amber-800 border-amber-200"}`}>
                    Early Explorers
                  </span>
                )}
                {ageGroup === "young innovators" && (
                  <span className={`border font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isDark ? "bg-cyan-950/40 text-[#2EC4B6] border-[#2EC4B6]/30" : "bg-[#2EC4B6]/20 text-[#0f5454] border-[#2EC4B6]/30"}`}>
                    Young Innovators
                  </span>
                )}
                {ageGroup === "future builders" && (
                  <span className={`border font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isDark ? "bg-purple-950/40 text-[#B8A0FF] border-[#B8A0FF]/30" : "bg-[#B8A0FF]/25 text-[#4e2b8c] border-[#B8A0FF]/30"}`}>
                    Future Builders
                  </span>
                )}
              </div>

              <Heading size={32} className={`font-black tracking-tight ${isDark ? "text-white" : "text-[#0E1B29]"}`} style={{ fontWeight: 900 }}>
                {academy.title}
              </Heading>
              
              <Txt size={16} className={`font-bold block leading-relaxed mt-1.5 max-w-2xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                "{academy.subtitle}"
              </Txt>

              <p className="text-xs text-slate-400 font-mono font-bold uppercase mt-2 border-t border-slate-200/50 pt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                {academy.desc}
              </p>
            </div>

            {/* Custom Mascot Cheers */}
            <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-inner max-w-sm self-stretch flex-shrink-0 border-2 ${
              isDark ? "bg-black border-[#2EC4B6]/30" : "bg-white/90 border-[#2EC4B6]/20"
            }`}>
              <span className="text-3xl select-none">🥥</span>
              <div>
                <Txt size={11} className="text-[#2EC4B6] font-extrabold block uppercase tracking-wide font-mono leading-none mb-1">
                  Mascot Advice
                </Txt>
                <Txt size={12.5} className={`font-medium block leading-snug ${isDark ? "text-slate-303 text-slate-350" : "text-slate-650 text-slate-600"}`}>
                  Choose your tech course block on the left, and view your interactive milestones on the right! Let's go!
                </Txt>
              </div>
            </div>
          </div>
        </div>

        {/* RESPONSIVE SEGMENT SYSTEM (Split on Desktop, stacked on Mobile/Tablet) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: MODULES SELECTOR PANEL (8 span on tablet, 7 span on desktop) */}
          <div className="col-span-1 md:col-span-6 lg:col-span-7 flex flex-col gap-4">
            
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🌴</span>
              <Heading size={18} className={`font-black uppercase tracking-wider ${isDark ? "text-[#2EC4B6]" : "text-slate-900"}`} style={{ fontWeight: 800 }}>
                Academic Course Tracks
              </Heading>
            </div>

            <div id="tour-module-cards" className="grid grid-cols-1 gap-4">
              {academy.modules.map((item, index) => {
                const isActiveSel = item.id === activeSelId;
                const isTiny = ageGroup === "early explorers";
                const isLocked = !child.is_premium && index >= 1;

                // Resolve badge outline
                const isComingSoon = item.comingSoon;
                const progressVal = getModuleProgress(item.backendModuleId);

                // For ages 6-12 current track highlight
                const isFirstActiveJunior = ageGroup === "young innovators" && index === 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sfx.playTap();
                      setActiveSelId(item.id);
                    }}
                    className={`border-3 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-200 relative overflow-hidden ${
                      isComingSoon
                        ? isActiveSel
                          ? isDark ? "bg-black border-slate-700 text-slate-300" : "bg-slate-50 border-slate-350 shadow-sm"
                          : isDark ? "bg-black/95 border-slate-800 text-slate-450 hover:bg-zinc-950 cursor-pointer" : "bg-white border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500"
                        : isActiveSel
                        ? isDark ? "bg-[#2EC4B6]/20 border-[#2EC4B6] shadow-md scale-[1.01] text-white" : "bg-[#2EC4B6]/5 border-[#2EC4B6] shadow-md scale-[1.01]"
                        : isDark ? "bg-black border-slate-800 hover:border-[#2EC4B6]/50 shadow-sm cursor-pointer text-white" : "bg-white border-slate-200 hover:border-[#2EC4B6]/50 shadow-sm cursor-pointer"
                    }`}
                  >
                    {/* Tiny visual ribbon for Active highlights */}
                    {!isComingSoon && isActiveSel && (
                      <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-[#2EC4B6]"></div>
                    )}

                    <div className="flex items-center gap-3.5 flex-1 pl-1">
                      {/* Chunky emoji node bubble */}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-sm border-2 ${
                        isComingSoon
                          ? isDark ? "bg-zinc-900 border-slate-700" : "bg-slate-100 border-slate-200"
                          : isDark ? "bg-[#2EC4B6]/30 border-[#2EC4B6]" : "bg-[#2EC4B6]/10 border-[#2EC4B6]/30 group-hover:scale-105"
                      }`}>
                        <span>{item.icon}</span>
                      </div>

                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[9px] font-extrabold uppercase font-mono text-slate-400">
                            Module {index + 1}
                          </span>
                          
                          {isComingSoon ? (
                            <span className={`font-bold text-[8.5px] uppercase px-2 py-0.5 rounded-full ${isDark ? "bg-slate-800 border border-slate-705 text-slate-400" : "bg-slate-100 border border-slate-300 text-slate-500"}`}>
                              🌟 Coming Soon
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[8.5px] uppercase px-2 py-0.5 rounded-full">
                              🚀 Rolling Out
                            </span>
                          )}

                          {isFirstActiveJunior && (
                            <span className="bg-[#FFD166]/30 text-amber-950 font-black text-[8.5px] uppercase px-2 py-0.5 rounded-full border border-[#FFD166]">
                              Current Learning Track
                            </span>
                          )}
                        </div>

                        <Heading size={18} className={`font-extrabold mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800 }}>
                          {item.title}
                        </Heading>
                        
                        <Txt size={12.5} className={`font-medium block line-clamp-1 ${isDark ? "text-slate-200" : "text-slate-500"}`}>
                          {item.desc}
                        </Txt>
                      </div>
                    </div>

                    {/* Progress indicator percentage or Lock indicator on extreme right */}
                    <div className="flex-shrink-0 text-right">
                      {isLocked ? (
                        <div className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${isDark ? "bg-slate-800 text-rose-400 border border-slate-700" : "bg-rose-50 border border-rose-200 text-rose-500"} flex items-center gap-1`}>
                          <span>🔒</span> LOCKED
                        </div>
                      ) : isComingSoon ? (
                        <div className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${isDark ? "bg-slate-800 text-slate-500 border border-slate-700" : "bg-slate-50 border border-slate-200 text-slate-400"}`}>
                          SOON
                        </div>
                      ) : (
                        <div>
                          <div className="text-[10px] text-[#2EC4B6] font-black font-mono">
                            {progressVal}% DONE
                          </div>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-[#2EC4B6]" style={{ width: `${progressVal}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LEADER TRIVIA FOOTER BAR */}
            <div className={`p-4 rounded-2xl mt-4 flex items-center gap-3 border ${
              isDark ? "bg-[#B8A0FF]/12 border-[#B8A0FF]/30 text-slate-200" : "bg-[#B8A0FF]/10 border-[#B8A0FF]/25 text-[#4e2b8c]"
            }`}>
              <span className="text-2xl">🎓</span>
              <div>
                <Txt size={12} className={`font-extrabold font-mono block uppercase mb-0.5 ${isDark ? "text-purple-300" : "text-slate-500"}`}>
                  CLATS GROW-WITH-LEARNER GUARANTEE
                </Txt>
                <Txt size={13} className={`font-medium block ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Each course segment scales text metrics, voice overlays, and conceptual difficulty with your age group automatically.
                </Txt>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: MODULES DETAIL / ACTION PREVIEW PANEL (4 span on tablet, 5 span on desktop) */}
          <div className="col-span-1 md:col-span-6 lg:col-span-5 md:sticky md:top-24">
            
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎯</span>
              <Heading size={18} className={`font-black uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800 }}>
                Module Preview
              </Heading>
            </div>

            {selectedModule ? (
              <Card
                id="module-action-panel"
                className={`rounded-3xl p-6 shadow-md relative overflow-hidden border-3 transition-all duration-300 ${
                  isDark ? "bg-black border-[#2EC4B6]/30 text-white" : "bg-white border-[#2EC4B6]/25 text-slate-900"
                }`}
              >
                {/* Turquoise horizontal theme bar */}
                <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-[#2EC4B6] via-[#B8A0FF] to-[#FFD166]"></div>

                {/* Module status pill badge inside preview */}
                <div className="flex justify-between items-center gap-4 mb-4 mt-1">
                  <span className={`font-extrabold text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${isDark ? "bg-slate-800 border-slate-700 text-slate-350" : "bg-slate-50 border-slate-150 text-slate-500"}`}>
                    Syllabus Panel
                  </span>

                  {selectedModule.comingSoon ? (
                    <span className="bg-amber-100/80 text-amber-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                      <span>🌟 Coming Soon</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>🚀 Active Track</span>
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-[#2EC4B6]/10 border border-[#2EC4B6]/30 text-[#0f5454] p-3 text-3xl rounded-2xl shadow-sm">
                    {selectedModule.icon}
                  </div>
                  <div>
                    <Txt size={11} className="text-[#2EC4B6] font-bold uppercase block tracking-wider font-mono">
                      PREVIEW TITLE
                    </Txt>
                    <Heading size={22} className={`font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 900 }}>
                      {selectedModule.title}
                    </Heading>
                  </div>
                </div>

                <Txt size={14} className={`block leading-relaxed font-semibold mb-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {selectedModule.desc}
                </Txt>

                {/* Dynamic Screen rendering depending on active vs coming soon status */}
                {selectedModule.comingSoon ? (
                  <div className={`border rounded-2xl p-5 mb-2 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/80 border-slate-200"}`}>
                    {academy.title === "AI & Emerging Technologies" ? (
                      <>
                        <div className="text-center mb-4">
                          <span className="text-4xl">🌟</span>
                          <Heading size={18} className={`font-extrabold mt-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800 }}>
                            Notify Me
                          </Heading>
                          <Txt size={13} className={`font-medium block leading-normal mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            New lessons are being prepared for our founding learners. Subscribe below so parent triggers secure email updates!
                          </Txt>
                        </div>

                        {notificationSuccess ? (
                          <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold leading-normal mb-1">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{notificationSuccess}</span>
                          </div>
                        ) : (
                          <form onSubmit={handleNotifySubmit} className="flex flex-col gap-2">
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="email"
                                required
                                placeholder="Enter parent email address"
                                value={notifyEmail}
                                onChange={(e) => setNotifyEmail(e.target.value)}
                                className={`w-full border-2 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6] ${
                                  isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                                }`}
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full bg-[#FFD166] hover:bg-[#e6bb5c] text-[#332200] font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 shadow cursor-pointer border-b-4 border-amber-600 active:translate-y-0.5 active:border-b-0"
                            >
                              🔔 Subscribe parent update
                            </button>
                          </form>
                        )}
                      </>
                    ) : (
                      <div className="text-center mb-4">
                        <span className="text-4xl">🌟</span>
                        <Heading size={18} className={`font-extrabold mt-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 850 }}>
                          This academy is currently being prepared.
                        </Heading>
                        <Txt size={13} className={`font-medium block leading-normal mt-2.5 mb-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Join our Founding Families community to get early access when it launches.
                        </Txt>
                        <a
                          href="https://clats-website.vercel.app/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block w-full text-center bg-[#FFD166] hover:bg-[#e6bb5c] text-[#332200] font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 shadow cursor-pointer border-b-4 border-amber-600 active:translate-y-0.5 active:border-b-0"
                          style={{ textDecoration: "none" }}
                        >
                          Join Today!
                        </a>
                      </div>
                    )}

                    {/* Pre-launch Preview trigger CTA */}
                    <button
                      onClick={() => handleLaunchJourney(selectedModule)}
                      type="button"
                      className={`w-full font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 shadow border-b-4 mt-3 flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:translate-y-0.5 active:border-b-2 ${
                        isDark 
                          ? "bg-slate-800 border-slate-950 text-[#2EC4B6]"
                          : "bg-slate-100 border-slate-300 text-[#208a80]"
                      }`}
                      style={{ cursor: "pointer", fontWeight: 900 }}
                    >
                      <span>🔍 Preview Module Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Coming soon syllabus agenda preview footer */}
                    <div className={`mt-5 border-t pt-3 ${isDark ? "border-slate-850" : "border-slate-200"}`}>
                      <Txt size={11} className="text-slate-400 font-black uppercase block tracking-wider font-mono mb-2" style={{ fontSize: 9 }}>
                        🔭 UPCOMING CURRICULUM PREVIEW
                      </Txt>
                      <div className="flex flex-col gap-1.5">
                        {selectedModule.lessons.map((lessn, idx) => (
                          <div key={idx} className={`flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            <span className="text-[11px] font-black text-slate-400 font-mono w-4">L{idx+1}</span>
                            <Txt size={12.5} className="font-semibold line-clamp-1">{lessn.title[lang] || lessn.title.en}</Txt>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* ACTIVE MODULE CASE */}
                    {/* Map containing lessons outline */}
                    <div className={`border rounded-2xl p-4 mb-6 ${isDark ? "bg-slate-950/60 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                      <div className={`flex items-center justify-between gap-4 mb-3 border-b pb-1.5 ${isDark ? "border-slate-850" : "border-slate-200/60"}`}>
                        <Txt size={11} className="text-slate-400 font-black uppercase font-mono block tracking-wider" style={{ fontSize: 9 }}>
                          📖 INTRALIVES SYLLABUS CHECKLIST
                        </Txt>
                        <Chip color="#2EC4B6" bg="rgba(46, 196, 182, 0.1)" style={{ fontSize: 9, fontWeight: 800, fontFamily: 'monospace' }}>
                          {selectedModule.lessons.length} Episodes included
                        </Chip>
                      </div>

                      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                        {selectedModule.lessons.map((lessonObj, idx) => {
                          // Extract correct dynamic ID and completion keys directly from lesson object now
                          const lessonTitle = typeof lessonObj.title === 'string' ? lessonObj.title : lessonObj.title.en;
                          const lessonCompletedKey = lessonObj.id;
                          const isCompleted = !!child.completed?.[lessonCompletedKey];
                          const starsCount = child.stars?.[lessonCompletedKey] || (isCompleted ? 3 : 0);

                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between gap-3 p-2 rounded-xl border ${
                                isCompleted
                                  ? isDark ? "bg-emerald-950/20 border-emerald-900 text-slate-200" : "bg-emerald-50/50 border-emerald-150 text-slate-800"
                                  : isDark ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-white border-slate-150 text-slate-600"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 pr-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-[10px] ${
                                  isCompleted ? "bg-emerald-500 text-white" : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                                }`}>
                                  {isCompleted ? "✓" : idx + 1}
                                </div>
                                <Txt size={13} className="font-semibold line-clamp-1">
                                  {lessonTitle}
                                </Txt>
                              </div>

                              {isCompleted ? (
                                <div className="flex items-center gap-0.5 text-amber-500 text-xs font-black">
                                  <span>⭐</span>
                                  <span>{starsCount}</span>
                                </div>
                              ) : (
                                <Txt size={11} className="text-slate-400 font-bold font-mono">
                                  ⏱ 4m
                                </Txt>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Badge previews */}
                    <div className={`border rounded-2xl p-4 mb-6 flex items-center gap-3 ${isDark ? "bg-slate-900/40 border-slate-850" : "bg-[#B8A0FF]/10 border-[#B8A0FF]/20"}`}>
                      <div className={`text-4xl p-2 rounded-xl border select-none ${isDark ? "bg-slate-950 border-slate-805" : "bg-white border-[#B8A0FF]/30"}`}>
                        {selectedModule.badge.icon}
                      </div>
                      <div>
                        <Txt size={10} className={`${isDark ? "text-purple-300" : "text-[#4e2b8c]"} font-black uppercase tracking-wider block font-mono`} style={{ fontSize: 9 }}>
                          🔐 EARNABLE PATHWAY BADGE
                        </Txt>
                        <Txt size={13.5} className={`font-extrabold block ${isDark ? "text-white" : "text-slate-800"}`}>
                          {selectedModule.badge.name}
                        </Txt>
                        <Txt size={12} className={`font-medium block ${isDark ? "text-slate-400" : "text-slate-505"}`}>
                          Claims permanently upon complete graduation of this track!
                        </Txt>
                      </div>
                    </div>

                    {/* Launch button */}
                    {(() => {
                      const selectedIndex = academy.modules.findIndex(m => m.id === selectedModule.id);
                      const isSelectedLocked = !child.is_premium && selectedIndex >= 1;

                      if (isSelectedLocked) {
                        return (
                          <div className="w-full bg-rose-500/10 border-2 border-rose-500 text-rose-600 font-black py-4 px-6 rounded-2xl flex flex-col items-center justify-center gap-1">
                            <span className="text-xl">🔒 Premium Content</span>
                            <span className="text-xs font-bold text-center">Ask your parents to unlock this module from their dashboard!</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          ref={journeyBtnRef}
                          onClick={() => handleLaunchJourney(selectedModule)}
                          className="w-full bg-[#2EC4B6] hover:bg-[#28ad9f] text-white font-black py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 border-b-6 border-[#1f8a80] active:translate-y-1 active:border-b-2"
                          style={{ cursor: "pointer", fontWeight: 900, fontSize: 16 }}
                        >
                          <span>🚀 Start Lesson Journey</span>
                          <ArrowRight className="w-5 h-5 text-white" />
                        </button>
                      );
                    })()}
                  </div>
                )}

              </Card>
            ) : (
              <div className={`border-2 border-dashed rounded-3xl p-10 text-center ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-white/60 border-slate-350"}`}>
                <CompassIcon className="w-12 h-12 text-slate-450 mx-auto mb-2 animate-spin-slow" />
                <Txt size={14} className={`font-bold block leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Click any module on the left track list to explore its interactive curriculums, check lesson topics, and unlock pathways!
                </Txt>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ── STICKY BOTTOM CTA BAR ──
          Shown only on mobile when the in-panel Start Journey button has scrolled out of view.
          Uses IntersectionObserver to detect button visibility — zero cost on desktop.
      */}
      {selectedModule && !selectedModule.comingSoon && showStickyBar && (() => {
        const selectedIndex = (academy?.modules ?? []).findIndex(m => m.id === selectedModule.id);
        const isLocked = !child.is_premium && selectedIndex >= 1;
        return (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              padding: '12px 16px',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
              background: isDark
                ? 'linear-gradient(to top, rgba(15,23,42,0.98) 80%, transparent)'
                : 'linear-gradient(to top, rgba(248,250,252,0.98) 80%, transparent)',
              backdropFilter: 'blur(10px)',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              // Only render on mobile — hide on md+ breakpoints via class
            }}
            className="md:hidden"
          >
            {/* Mini module context row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
              <span style={{ fontSize: 20 }}>{selectedModule.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#2EC4B6',
                  fontFamily: 'monospace'
                }}>Selected Track</p>
                <p style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: isDark ? '#F8FAFC' : '#1E293B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{selectedModule.title}</p>
              </div>
            </div>

            {/* Action button */}
            {isLocked ? (
              <button
                onClick={() => {
                  if (onShowPaywall) {
                    sfx.playTap();
                    onShowPaywall();
                  }
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: 16,
                  borderRadius: 18,
                  padding: '15px 20px',
                  border: 'none',
                  borderBottom: '4px solid #b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(217, 119, 6, 0.35)',
                  letterSpacing: '0.01em'
                }}
              >
                <span>⭐ Unlock Premium Track</span>
              </button>
            ) : (
              <button
                onClick={() => handleLaunchJourney(selectedModule)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #2EC4B6, #20a89c)',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: 16,
                  borderRadius: 18,
                  padding: '15px 20px',
                  border: 'none',
                  borderBottom: '4px solid #1f8a80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(46,196,182,0.35)',
                  letterSpacing: '0.01em'
                }}
              >
                <span>🚀 Start Lesson Journey</span>
                <ArrowRight style={{ width: 20, height: 20 }} />
              </button>
            )}
          </div>
        );
      })()}

    </div>
  );
};

export default ModulesOverview;
