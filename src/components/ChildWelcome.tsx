/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Child, Language } from "../types";
import { C, T, fmt } from "../utils/config";
import { CURRICULUM } from "../data/curriculum";
import { Card, Heading, Txt, Chip, XPBar } from "./Primitives";
import { KobeAvatar } from "./KobeAvatar";
import { sfx, companionVoice } from "../utils/audio";
import {
  Sparkles,
  Flame,
  Clock,
  ArrowRight,
  Bot,
  Globe,
  Shield,
  Coins,
  Palette,
  Terminal,
  Briefcase,
  Bell,
  Check,
  Compass
} from "lucide-react";

interface ChildWelcomeScreenProps {
  child: Child;
  slotUsed: number;
  slotLimit: number;
  onEnterAIPathway: (academyId?: string) => void;
  lang: Language;
  theme?: "light" | "dark";
}

export const ChildWelcomeScreen: React.FC<ChildWelcomeScreenProps> = ({
  child,
  slotUsed,
  slotLimit,
  onEnterAIPathway,
  lang,
  theme = "dark"
}) => {
  const isDark = theme === "dark";
  const remain = Math.max(0, slotLimit - slotUsed);
  const limitOn = slotLimit > 0;

  // Calculate dynamic streak based on completed lessons
  const solvedCount = Object.keys(child.completed || {}).length;
  const computedStreak = child.streak_count || 0;

  // Let's compute active pathway progress for Artificial Intelligence
  const aiCourse = CURRICULUM[child.ageGroup];
  const totalLessons = aiCourse ? aiCourse.modules.flatMap((m) => m.lessons).length : 0;
  const completedLessons = aiCourse
    ? aiCourse.modules.flatMap((m) => m.lessons).filter((l) => child.completed?.[l.id]).length
    : 0;
  const aiProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Maintain subscriptions state for coming soon pathways
  const [notifiedPathways, setNotifiedPathways] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    const companionName = child.companion === "chibi" ? "Chibi" : "Kobe";
    const welcomeText = `Hello ${child.name}! I am your companion, ${companionName}. Which high tech adventure do you want to learn today?`;
    const timer = setTimeout(() => {
      companionVoice.speak(welcomeText, child.companion || "kobe", child.ageGroup);
    }, 850);
    return () => clearTimeout(timer);
  }, [child.id, child.companion, child.ageGroup]);

  const handleNotifyMe = (pathwayName: string) => {
    sfx.playCoin();
    setNotifiedPathways((prev) => {
      const updated = { ...prev, [pathwayName]: !prev[pathwayName] };
      const isSubscribed = updated[pathwayName];
      if (isSubscribed) {
        setSuccessToast(`Got it! We will notify you when ${pathwayName} launches!`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
      return updated;
    });
  };

  const comingSoonData = [
    {
      id: "lit",
      title: "Digital Literacy",
      icon: <Globe className="w-6 h-6 text-indigo-500" />,
      desc: "Master key typing, internet safety, search engines, and respectful email chatting.",
      emoji: "🌐"
    },
    {
      id: "cyber",
      title: "Cybersecurity",
      icon: <Shield className="w-6 h-6 text-red-500" />,
      desc: "Lock passwords, identify scams, prevent hacks, and guard personal files online.",
      emoji: "🔒"
    },
    {
      id: "web3",
      title: "Blockchain & Web3",
      icon: <Coins className="w-6 h-6 text-amber-500" />,
      desc: "Learn blockchain ledger grids, cryptographic security keys, and virtual tokens.",
      emoji: "⛓"
    },
    {
      id: "creativity",
      title: "Design & Creativity",
      icon: <Palette className="w-6 h-6 text-pink-500" />,
      desc: "Build sleek UI/UX sitemaps, paint digital illustrations, and animate smart models.",
      emoji: "🎨"
    },
    {
      id: "devops",
      title: "DevOps & Systems",
      icon: <Terminal className="w-6 h-6 text-slate-500" />,
      desc: "Uncover back-end command prompts, servers, cloud modules, and pipeline tools.",
      emoji: "⚙"
    },
    {
      id: "career",
      title: "Career Readiness",
      icon: <Briefcase className="w-6 h-6 text-emerald-500" />,
      desc: "Pitch Nigerian startup concepts, draft professional cases, and align with global remote work.",
      emoji: "🚀"
    }
  ];

  // Dynamically compute preview academies list based on active/inactive states
  const previewAcademies = [];
  if (child.ageGroup !== "young innovators") {
    previewAcademies.push({
      id: "academy-1",
      title: "Academy 1: AI & Emerging Technologies",
      desc: "Learn how artificial intelligence works, how technology evolved, how machines learn, and how future technologies are shaping tomorrow.",
      icon: <Sparkles className="w-6 h-6 text-amber-500" />,
      emoji: "💡",
      badgeColor: "text-amber-305 bg-amber-950/30"
    });
  }

  previewAcademies.push(
    {
      id: "academy-2",
      title: "Academy 2: Digital Citizenship & Cybersecurity",
      desc: "Build digital confidence, internet safety awareness, responsible technology habits, and cybersecurity skills.",
      icon: <Shield className="w-6 h-6 text-red-500" />,
      emoji: "🔒",
      badgeColor: "text-red-300 bg-red-950/30"
    },
    {
      id: "academy-3",
      title: "Academy 3: Design & Creation",
      desc: "Develop creativity, storytelling, design thinking, digital creation, and product design skills.",
      icon: <Palette className="w-6 h-6 text-pink-500" />,
      emoji: "🎨",
      badgeColor: "text-pink-300 bg-pink-950/30"
    }
  );

  if (child.ageGroup === "future builders") {
    previewAcademies.push(
      {
        id: "academy-4",
        title: "Academy 4: Innovation & Career Readiness",
        desc: "Learn leadership, entrepreneurship, communication, teamwork, and future career skills.",
        icon: <Briefcase className="w-6 h-6 text-purple-500" />,
        emoji: "🚀",
        badgeColor: "text-purple-300 bg-purple-950/30"
      },
      {
        id: "academy-5",
        title: "Academy 5: Adaptability & Lifelong Learning",
        desc: "Develop the mindset and human skills needed to thrive regardless of how technology changes. This academy prepares learners for technologies that do not yet exist.",
        icon: <Compass className="w-6 h-6 text-teal-500" />,
        emoji: "🌱",
        badgeColor: "text-teal-300 bg-teal-950/30"
      }
    );
  } else {
    previewAcademies.push(
      {
        id: "academy-4",
        title: "Academy 4: Adaptability & Lifelong Learning",
        desc: "Develop the mindset and human skills needed to thrive regardless of how technology changes. This academy prepares learners for technologies that do not yet exist.",
        icon: <Compass className="w-6 h-6 text-teal-500" />,
        emoji: "🌱",
        badgeColor: "text-teal-300 bg-teal-950/30"
      }
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 pb-24 relative z-10">
      
      {/* Toast Feedback for subscription */}
      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700/80 text-white rounded-2xl px-5 py-3 shadow-2xl z-50 flex items-center gap-3 animate-bounce">
          <span className="text-xl">🔔</span>
          <Txt size={13.5} weight={700} color="#FFFFFF">
            {successToast}
          </Txt>
        </div>
      )}

      {/* 🌴 PREMIUM HUD SECTION */}
      <Card
        id="child-hud-header"
        className="bg-white/92 backdrop-blur-xl border-3 border-slate-200/80 rounded-3xl p-5 mb-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6"
      >
        {/* Left Side: Avatar & Greeting */}
        <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-left">
          <div className="relative group">
            <span className="absolute inset-0 bg-yellow-400 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300"></span>
            <div className="relative bg-amber-50 p-2.5 rounded-full border-3 border-amber-400">
              <KobeAvatar
                size={70}
                ageGroup={child.ageGroup}
                pulse
                expression="happy"
                character={child.companion || "kobe"}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 font-extrabold text-xs px-2 py-0.5 rounded-full border border-white">
              {child.avatar}
            </div>
          </div>
          <div>
            <Heading size={24} className="text-slate-900 font-black tracking-tight" style={{ fontWeight: 900 }}>
              {T[lang].hello}, {child.name}!
            </Heading>
            <Txt size={14} className="text-slate-600 font-medium block">
              Which high-tech pathway shall we explore today? 🌴
            </Txt>
          </div>
        </div>

        {/* Right Side: Achievements Grid (XP, Streak, Screen Time) */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto flex-1 md:flex-initial max-w-md">
          {/* XP Dashboard */}
          <div id="tour-xp-system" className="bg-amber-50/60 border-2 border-amber-300 p-3 rounded-2xl text-center flex flex-col justify-center items-center">
            <Sparkles className="w-5 h-5 text-amber-500 mb-1" />
            <Txt size={11} className="text-amber-800 font-bold uppercase tracking-wider block" style={{ fontSize: 10 }}>
              XP POINTS
            </Txt>
            <Txt size={16} className="text-amber-970 font-black" style={{ fontWeight: 900 }}>
              {child.xp || 0}
            </Txt>
          </div>

          {/* Daily Streak */}
          <div className="bg-orange-50/60 border-2 border-orange-300 p-3 rounded-2xl text-center flex flex-col justify-center items-center">
            <Flame className="w-5 h-5 text-orange-500 mb-1 animate-pulse" />
            <Txt size={11} className="text-orange-850 font-bold uppercase tracking-wider block" style={{ fontSize: 10 }}>
              STREAK
            </Txt>
            <Txt size={16} className="text-orange-950 font-black" style={{ fontWeight: 900 }}>
              {computedStreak} Days
            </Txt>
          </div>

          {/* Screen Time Allowance */}
          <div className={`p-3 rounded-2xl text-center flex flex-col justify-center items-center border-2 ${limitOn ? "bg-sky-50/60 border-sky-300" : "bg-emerald-50/60 border-emerald-300"}`}>
            <Clock className={`w-5 h-5 mb-1 ${limitOn ? "text-sky-500" : "text-emerald-500"}`} />
            <Txt size={11} className={`font-bold uppercase tracking-wider block ${limitOn ? "text-sky-850" : "text-emerald-850"}`} style={{ fontSize: 10 }}>
              TIME LEFT
            </Txt>
            <Txt size={15} className={`font-black ${limitOn ? "text-sky-950" : "text-emerald-950"}`} style={{ fontWeight: 950, fontSize: 13, lineHeight: "1.2rem" }}>
              {limitOn ? fmt(remain) : "Unlimited"}
            </Txt>
          </div>
        </div>
      </Card>

      {/* CURRICULUM ARCHITECTURE HEADER */}
      <div className="mb-8 text-center md:text-left">
        <Chip color="#0284c7" bg="rgba(2, 132, 199, 0.1)" style={{ fontWeight: 800, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
          🎯 CLATS CURRICULUM ARCHITECTURE
        </Chip>
        <Heading size={32} className="text-theme-sensitive font-black tracking-tight" style={{ fontWeight: 900 }}>
          Future-Tech Learning Academies
        </Heading>
        <Txt size={15} className="text-theme-sensitive-muted font-semibold block mt-1">
          Immersive, age-adaptive technical domains built to grow with learners from ages 2 to 18.
        </Txt>
      </div>

      {/* ACTIVE TRACK SECTION */}
      {child.ageGroup === "young innovators" && (
        <div className="mb-12">
          <Txt size={14} className="text-theme-sensitive font-extrabold block mb-4 tracking-wide uppercase flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            🚀 ACTIVE & ROLLING OUT
          </Txt>

          <Card
            id="tour-learning-path"
            className={`border-4 border-amber-400 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${
              isDark ? "bg-gradient-to-br from-amber-950/40 to-orange-950/30 text-white" : "bg-gradient-to-br from-amber-50/90 to-orange-50/80 text-slate-900"
            }`}
          >
            {/* Subtle tropical backdrop ornament inside card */}
            <div className="absolute right-0 bottom-0 text-[100px] opacity-10 pointer-events-none select-none">
              🌴
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              {/* Pathway Info */}
              <div className="flex items-start sm:items-center gap-5">
                <div className="bg-amber-400 p-5 rounded-2xl flex items-center justify-center shadow-md shadow-amber-400/20 text-slate-900">
                  <Sparkles className="w-10 h-10 text-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                      🚀 Active Track
                    </span>
                    <span className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${isDark ? "bg-amber-950 text-amber-300 border border-amber-900" : "bg-amber-100 text-amber-800 border border-amber-300"}`}>
                      Ages 6–12 Track
                    </span>
                  </div>
                  <Heading size={24} className={`font-black mb-1 ${isDark ? "text-amber-305 text-amber-200" : "text-slate-900"}`} style={{ fontWeight: 900 }}>
                    Academy 1: AI & Emerging Technologies
                  </Heading>
                  <Txt size={15} className={`font-medium block max-w-xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    Learn how artificial intelligence works, how technology evolved, how machines learn, and how future technologies are shaping tomorrow.
                  </Txt>
                </div>
              </div>

              {/* Pathway Progress & CTA */}
              <div className="flex flex-col items-stretch sm:items-end gap-3 min-w-[200px]">
                <div className="text-right">
                  <Txt size={12} className={`font-extrabold tracking-wider block uppercase mb-1 ${isDark ? "text-amber-300" : "text-amber-800"}`} style={{ fontSize: 10 }}>
                    ACADEMY PROGRESS: {aiProgress}%
                  </Txt>
                  <XPBar xp={aiProgress} color="#ffb800" />
                </div>

                <button
                  onClick={() => {
                    sfx.playTap();
                    onEnterAIPathway("academy-1");
                  }}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-900 font-black py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 border-b-6 border-amber-600 active:translate-y-1 active:border-b-2"
                  style={{ cursor: "pointer", fontWeight: 900, fontSize: 15 }}
                >
                  <span>Enter Academy</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 🌟 THE COMING SOON ACADEMIES */}
      <div>
        <Txt size={14} className="text-theme-sensitive font-extrabold block mb-4 tracking-wide uppercase">
          🌟 COMING SOON - PREVIEW AVAILABLE
        </Txt>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {previewAcademies.map((item) => {
            return (
              <Card
                key={item.id}
                className="rounded-3xl p-6 flex flex-col justify-between gap-5 opacity-[0.96] hover:opacity-100 hover:-translate-y-1 transition-all duration-200 group border-[#2EC4B6]/20 hover:border-[#2EC4B6]/55 border-2 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className={`p-3 rounded-2xl transition duration-200 ${isDark ? "bg-slate-900 text-[#2EC4B6]" : "bg-slate-50 text-slate-700 group-hover:bg-emerald-50"}`}>
                      {item.icon}
                    </div>
                    <span className={`font-mono text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isDark ? "bg-slate-900 border border-slate-800 text-slate-400" : "bg-slate-50 border border-slate-200 text-slate-500"}`}>
                      🌟 PREVIEW CURRICULUM
                    </span>
                  </div>
                  <Heading size={18} className={`font-black mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`} style={{ fontWeight: 800 }}>
                    {item.emoji} {item.title}
                  </Heading>
                  <Txt size={13.5} className={`font-medium block leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {item.desc}
                  </Txt>
                </div>

                <button
                  onClick={() => {
                    sfx.playTap();
                    onEnterAIPathway(item.id);
                  }}
                  className={`w-full py-3 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer bg-slate-900 text-[#2EC4B6] border-2 border-[#2EC4B6]/30 hover:border-[#2EC4B6] shadow-sm hover:shadow-md active:translate-y-0.5`}
                  style={{ cursor: "pointer" }}
                >
                  <Compass className="w-4 h-4 text-[#2EC4B6]" />
                  <span>Preview Academy & Modules</span>
                </button>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ChildWelcomeScreen;
