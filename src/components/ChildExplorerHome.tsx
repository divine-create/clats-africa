/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CLATS Explorers (Ages 6–10) Playful Discovery Home Screen
 * Replaces dry curriculum dashboards with an immersive, child-friendly Wonder World Hub.
 *
 * Implements the CLATS Learning Progression:
 * WATCH → QUIZ → PRACTICE → PLAY → CREATE
 */

import React, { useState, useEffect } from "react";
import { Child, Language, Module, Lesson } from "../types";
import { CURRICULUM } from "../data/curriculum";
import { KobeAvatar } from "./KobeAvatar";
import { sfx, companionVoice } from "../utils/audio";
import { computeEffectiveStreak } from "../utils/streak";
import { evaluateChildBadges } from "../utils/badges";
import { fmt } from "../utils/config";
import {
  Sparkles,
  Flame,
  Clock,
  ArrowRight,
  Shield,
  Play,
  CheckCircle,
  Award,
  Gamepad2,
  Palette,
  Compass,
  Star,
  RefreshCw,
  Lock,
  ChevronRight
} from "lucide-react";

interface ChildExplorerHomeProps {
  child: Child;
  slotUsed: number;
  slotLimit: number;
  onSelectLesson: (mod: Module, les: Lesson) => void;
  onEnterWorld: (academyId?: string) => void;
  onPlayGame: (gameId?: string) => void;
  onOpenChat: () => void;
  onOpenRewards: () => void;
  lang: Language;
  theme?: "light" | "dark";
}

export const ChildExplorerHome: React.FC<ChildExplorerHomeProps> = ({
  child,
  slotUsed,
  slotLimit,
  onSelectLesson,
  onEnterWorld,
  onPlayGame,
  onOpenChat,
  onOpenRewards,
  lang,
  theme = "dark"
}) => {
  const isDark = theme === "dark";
  const limitOn = slotLimit > 0;
  const remain = Math.max(0, slotLimit - slotUsed);

  // Dynamic calculations from centralized engines
  const { streak: computedStreak } = computeEffectiveStreak(child);
  const badges = evaluateChildBadges(child);
  const earnedBadgesCount = badges.filter((b) => b.unlocked).length;

  const companionName = child.companion === "chibi" ? "Chibi" : "Kobe";

  // Friendly audio greeting on entry
  useEffect(() => {
    const greeting = `Welcome back to Wonder World, ${child.name}! I am ${companionName}. Which high-tech quest shall we conquer today?`;
    const timer = setTimeout(() => {
      companionVoice.speak(greeting, child.companion || "kobe", child.ageGroup);
    }, 700);
    return () => clearTimeout(timer);
  }, [child.id, child.companion, child.name, child.ageGroup, companionName]);

  // Find the active quest (first uncompleted lesson in progression)
  const course = CURRICULUM["early explorers"] || CURRICULUM[child.ageGroup];
  const modules = course?.modules || [];

  let activeModule: Module | null = null;
  let activeLesson: Lesson | null = null;
  let isAllCompleted = false;

  for (const mod of modules) {
    for (const les of mod.lessons || []) {
      if (!child.completed?.[les.id]) {
        activeModule = mod;
        activeLesson = les;
        break;
      }
    }
    if (activeLesson) break;
  }

  if (!activeLesson && modules.length > 0 && modules[0]?.lessons?.[0]) {
    activeModule = modules[0];
    activeLesson = modules[0].lessons[0];
    isAllCompleted = true;
  }

  // Handle start/resume quest
  const handleLaunchQuest = () => {
    sfx.playTap();
    if (activeModule && activeLesson) {
      onSelectLesson(activeModule, activeLesson);
    } else {
      onEnterWorld("academy-1");
    }
  };

  // Progression step pills
  const progressionSteps = [
    { label: "1. Watch", icon: "🎬", desc: "Animated Story & Video" },
    { label: "2. Quiz", icon: "🎯", desc: "3-Question Check" },
    { label: "3. Practice", icon: "🧩", desc: "Hands-on Exercise" },
    { label: "4. Play", icon: "🎮", desc: "Mini Challenge" },
    { label: "5. Create", icon: "🎨", desc: "Make Something!" }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 pb-28 relative z-10 animate-fade-in">
      
      {/* 🌴 PLAYFUL WONDER WORLD HUD */}
      <div
        className={`rounded-3xl p-5 md:p-6 mb-8 border-3 shadow-xl backdrop-blur-xl transition-all duration-300 ${
          isDark
            ? "bg-slate-900/90 border-slate-700/80 shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
            : "bg-white/95 border-amber-200/90 shadow-[0_12px_30px_rgba(251,191,36,0.15)]"
        }`}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Left: Companion Greeting with Speech Bubble */}
          <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-left">
            <div className="relative group shrink-0">
              <span className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-40 animate-pulse"></span>
              <div className="relative bg-gradient-to-br from-amber-100 to-yellow-200 p-2 rounded-full border-4 border-amber-400 shadow-md">
                <KobeAvatar
                  size={74}
                  ageGroup="early explorers"
                  pulse
                  expression="happy"
                  character={child.companion || "kobe"}
                />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2EC4B6]/15 text-[#2EC4B6] font-black text-xs uppercase tracking-wider mb-1.5">
                <span>🌴</span> Wonder World Explorer
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white m-0">
                Hi, Captain {child.name}! 👋
              </h1>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-300 mt-1 max-w-md">
                {companionName} is ready! Choose a world portal or continue your active learning quest below.
              </p>
            </div>
          </div>

          {/* Right: Child Stats Cards (XP, Streak, Time, Badges) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
            {/* XP Counter */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-900/30 border-2 border-amber-300/80 dark:border-amber-600/50 text-center flex flex-col justify-center items-center shadow-sm">
              <div className="flex items-center gap-1 text-amber-500 mb-0.5">
                <Sparkles size={16} className="animate-spin-slow" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  XP Sparks
                </span>
              </div>
              <span className="text-lg font-black text-amber-900 dark:text-amber-200 leading-tight">
                {child.xp || 0}
              </span>
            </div>

            {/* Streak Counter */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/40 dark:to-amber-900/30 border-2 border-orange-300/80 dark:border-orange-600/50 text-center flex flex-col justify-center items-center shadow-sm">
              <div className="flex items-center gap-1 text-orange-500 mb-0.5">
                <Flame size={16} className="animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 dark:text-orange-300">
                  Streak
                </span>
              </div>
              <span className="text-lg font-black text-orange-950 dark:text-orange-200 leading-tight">
                {computedStreak} {computedStreak === 1 ? "Day" : "Days"}
              </span>
            </div>

            {/* Badges Earned */}
            <button
              onClick={() => {
                sfx.playTap();
                onOpenRewards();
              }}
              className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950/40 dark:to-indigo-900/30 border-2 border-purple-300/80 dark:border-purple-600/50 text-center flex flex-col justify-center items-center shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-1 text-purple-500 mb-0.5">
                <Award size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300">
                  Badges
                </span>
              </div>
              <span className="text-lg font-black text-purple-950 dark:text-purple-200 leading-tight">
                {earnedBadgesCount} / 8
              </span>
            </button>

            {/* Time Left */}
            <div className={`p-3 rounded-2xl border-2 text-center flex flex-col justify-center items-center shadow-sm ${
              limitOn
                ? "bg-sky-50 dark:bg-sky-950/40 border-sky-300/80 dark:border-sky-600/50"
                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-600/50"
            }`}>
              <div className={`flex items-center gap-1 mb-0.5 ${limitOn ? "text-sky-500" : "text-emerald-500"}`}>
                <Clock size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Time Left
                </span>
              </div>
              <span className="text-sm font-black leading-tight">
                {limitOn ? fmt(remain) : "Unlimited"}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 🚀 HERO SECTION: TODAY'S ACTIVE QUEST (WATCH → QUIZ → PRACTICE → PLAY → CREATE) */}
      <div className="mb-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#2EC4B6] p-6 md:p-8 text-white shadow-2xl border-4 border-white/20">
          
          {/* Background decorative circles */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-black/10 blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-yellow-300 text-xs font-black uppercase tracking-wider mb-3">
                <span className="animate-ping inline-block w-2 h-2 rounded-full bg-yellow-300"></span>
                ⭐ Today&apos;s Active Adventure
              </div>

              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-snug drop-shadow-sm m-0">
                {activeLesson ? (activeLesson.title[lang] || activeLesson.title.en) : "Curriculum Completed!"}
              </h2>
              
              <p className="text-white/90 text-sm font-medium mt-1.5 max-w-xl">
                {activeModule ? (activeModule.name[lang] || activeModule.name.en) : "AI & Emerging Technologies"}
                {" • "}
                {isAllCompleted
                  ? "Incredible job! You mastered every lesson. Ready to replay or play challenge games?"
                  : "Follow the 5-step learning progression: Watch, Quiz, Practice, Play & Create!"}
              </p>

              {/* 5-Step Learning Loop Visual Track */}
              <div className="mt-5 grid grid-cols-5 gap-2 max-w-lg">
                {progressionSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white/15 backdrop-blur-sm text-center border border-white/20 flex flex-col items-center justify-center transition-transform hover:scale-105"
                  >
                    <span className="text-lg md:text-xl block">{step.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1 block">
                      {step.label.split(". ")[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch CTA Button */}
            <div className="shrink-0 w-full lg:w-auto flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLaunchQuest}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FFD166] hover:bg-amber-400 text-slate-900 font-black text-base md:text-lg shadow-xl border-b-4 border-amber-600 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>{isAllCompleted ? "Replay Quests" : "Start Today's Quest"}</span>
                <ArrowRight size={22} className="stroke-[3]" />
              </button>

              <button
                onClick={() => {
                  sfx.playTap();
                  onEnterWorld("academy-1");
                }}
                className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-sm md:text-base border-2 border-white/30 backdrop-blur-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Full Map</span>
                <Compass size={18} />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 🗺️ THE 4 DISCOVERY WORLD PORTALS */}
      <div className="mb-12">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#2EC4B6]">
              <span>🌍</span> Exploration Hub
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white m-0">
              The Four Discovery Worlds
            </h3>
          </div>
          <button
            onClick={() => {
              sfx.playTap();
              onEnterWorld();
            }}
            className="text-xs font-black text-[#2EC4B6] hover:underline flex items-center gap-1"
          >
            <span>Open Saga Map</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* World 1: Wonder Woods & AI Island */}
          <div
            onClick={() => {
              sfx.playTap();
              onEnterWorld("academy-1");
            }}
            className={`p-6 rounded-3xl border-3 transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden group shadow-md ${
              isDark
                ? "bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/40"
                : "bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border-emerald-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-lg shrink-0 group-hover:rotate-6 transition-transform">
                🤖
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
                🌟 Active World
              </span>
            </div>

            <h4 className="text-lg font-black text-slate-800 dark:text-white mt-4 mb-1">
              Wonder Woods & AI Island
            </h4>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Meet smart robot friends, discover how machines learn, spot patterns, and automate tasks.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-emerald-500/20 text-xs font-black text-emerald-600 dark:text-emerald-400">
              <span>3 Modules • 15 Story Quests</span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Enter World <ArrowRight size={14} />
              </span>
            </div>
          </div>

          {/* World 2: Cyber Shield Citadel */}
          <div
            onClick={() => {
              sfx.playTap();
              onPlayGame("phishing-swipe");
            }}
            className={`p-6 rounded-3xl border-3 transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden group shadow-md ${
              isDark
                ? "bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-500/40"
                : "bg-gradient-to-br from-amber-50/80 to-orange-50/40 border-amber-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-3xl shadow-lg shrink-0 group-hover:rotate-6 transition-transform">
                🛡️
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
                🎮 Safety Arena
              </span>
            </div>

            <h4 className="text-lg font-black text-slate-800 dark:text-white mt-4 mb-1">
              Cyber Shield Citadel
            </h4>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Defend against tricky phishers, lock your secret passwords, and master digital kindness.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-amber-500/20 text-xs font-black text-amber-600 dark:text-amber-400">
              <span>Phishing Swipe • Cyber Defense</span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Play Defense <ArrowRight size={14} />
              </span>
            </div>
          </div>

          {/* World 3: Creative Spark Studio */}
          <div
            onClick={() => {
              sfx.playTap();
              onPlayGame("teachable-machine");
            }}
            className={`p-6 rounded-3xl border-3 transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden group shadow-md ${
              isDark
                ? "bg-gradient-to-br from-purple-950/40 to-slate-900 border-purple-500/40"
                : "bg-gradient-to-br from-purple-50/80 to-indigo-50/40 border-purple-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500 text-white flex items-center justify-center text-3xl shadow-lg shrink-0 group-hover:rotate-6 transition-transform">
                🎨
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-black uppercase tracking-wider">
                🌈 Studio Lab
              </span>
            </div>

            <h4 className="text-lg font-black text-slate-800 dark:text-white mt-4 mb-1">
              Creative Spark Studio
            </h4>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Draw digital art, construct futuristic cities, compose soundscapes, and train Kobe with examples.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-purple-500/20 text-xs font-black text-purple-600 dark:text-purple-400">
              <span>Teachable Machine • City Builder</span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Create & Train <ArrowRight size={14} />
              </span>
            </div>
          </div>

          {/* World 4: Curious Explorer Trails */}
          <div
            onClick={() => {
              sfx.playTap();
              onPlayGame("wonder-woods");
            }}
            className={`p-6 rounded-3xl border-3 transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden group shadow-md ${
              isDark
                ? "bg-gradient-to-br from-blue-950/40 to-slate-900 border-blue-500/40"
                : "bg-gradient-to-br from-blue-50/80 to-sky-50/40 border-blue-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-3xl shadow-lg shrink-0 group-hover:rotate-6 transition-transform">
                🦋
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-black uppercase tracking-wider">
                🧩 10 Meadow Levels
              </span>
            </div>

            <h4 className="text-lg font-black text-slate-800 dark:text-white mt-4 mb-1">
              Pattern Quest & Logic Trails
            </h4>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Spot firefly lights, complete stone stepping patterns, sort by size and solve detective puzzles.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-blue-500/20 text-xs font-black text-blue-600 dark:text-blue-400">
              <span>Pattern Quest: Meadow 1–10</span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Play Pattern Quest <ArrowRight size={14} />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 🎮 QUICK-PLAY GAME PODS */}
      <div className="mb-12">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#B8A0FF]">
              <span>🕹️</span> Learning Through Play
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white m-0">
              Featured Purposeful Games
            </h3>
          </div>
          <button
            onClick={() => {
              sfx.playTap();
              onPlayGame();
            }}
            className="text-xs font-black text-[#B8A0FF] hover:underline flex items-center gap-1"
          >
            <span>All Games ({modules.length > 0 ? "7 Games" : "Arcade"})</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          {/* Game 1: Pattern Quest */}
          <button
            onClick={() => {
              sfx.playCoin();
              onPlayGame("wonder-woods");
            }}
            className={`p-4 rounded-2xl border-2 text-center transition-all hover:scale-105 active:scale-95 shadow-md flex flex-col items-center justify-between cursor-pointer ${
              isDark ? "bg-slate-900 border-blue-500/40 hover:border-blue-400" : "bg-white border-blue-200 hover:border-blue-400"
            }`}
          >
            <div className="text-4xl mb-2">🦋</div>
            <h5 className="text-xs font-black text-slate-800 dark:text-white mb-1">
              Pattern Quest
            </h5>
            <span className="text-[10px] font-bold text-blue-500 uppercase">
              10 Levels Ready
            </span>
          </button>

          {/* Game 2: Teachable Machine */}
          <button
            onClick={() => {
              sfx.playCoin();
              onPlayGame("teachable-machine");
            }}
            className={`p-4 rounded-2xl border-2 text-center transition-all hover:scale-105 active:scale-95 shadow-md flex flex-col items-center justify-between cursor-pointer ${
              isDark ? "bg-slate-900 border-indigo-500/40 hover:border-indigo-400" : "bg-white border-indigo-200 hover:border-indigo-400"
            }`}
          >
            <div className="text-4xl mb-2">🧠</div>
            <h5 className="text-xs font-black text-slate-800 dark:text-white mb-1">
              Teachable Machine
            </h5>
            <span className="text-[10px] font-bold text-indigo-500 uppercase">
              Train Kobe
            </span>
          </button>

          {/* Game 3: Smart City Builder */}
          <button
            onClick={() => {
              sfx.playCoin();
              onPlayGame("smart-city-builder");
            }}
            className={`p-4 rounded-2xl border-2 text-center transition-all hover:scale-105 active:scale-95 shadow-md flex flex-col items-center justify-between cursor-pointer ${
              isDark ? "bg-slate-900 border-teal-500/40 hover:border-teal-400" : "bg-white border-teal-200 hover:border-teal-400"
            }`}
          >
            <div className="text-4xl mb-2">🏙️</div>
            <h5 className="text-xs font-black text-slate-800 dark:text-white mb-1">
              Smart City Builder
            </h5>
            <span className="text-[10px] font-bold text-teal-500 uppercase">
              Clean Energy Grid
            </span>
          </button>

          {/* Game 4: Phishing Swipe */}
          <button
            onClick={() => {
              sfx.playCoin();
              onPlayGame("phishing-swipe");
            }}
            className={`p-4 rounded-2xl border-2 text-center transition-all hover:scale-105 active:scale-95 shadow-md flex flex-col items-center justify-between cursor-pointer ${
              isDark ? "bg-slate-900 border-amber-500/40 hover:border-amber-400" : "bg-white border-amber-200 hover:border-amber-400"
            }`}
          >
            <div className="text-4xl mb-2">🛡️</div>
            <h5 className="text-xs font-black text-slate-800 dark:text-white mb-1">
              Phishing Swipe
            </h5>
            <span className="text-[10px] font-bold text-amber-500 uppercase">
              Spot the Trap
            </span>
          </button>

        </div>
      </div>

      {/* 🌟 WHAT CAN I DO NOW? (CAPABILITY & REAL CAPABILITY SHOWCASE) */}
      <div
        className={`rounded-3xl p-6 border-3 shadow-lg ${
          isDark
            ? "bg-slate-900/80 border-slate-700/80"
            : "bg-gradient-to-br from-amber-50/50 to-teal-50/50 border-teal-100"
        }`}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
              <span>💡</span> Capability Showcase
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white m-0">
              What Can Captain {child.name} Do?
            </h3>
          </div>
          <button
            onClick={() => {
              sfx.playTap();
              onOpenChat();
            }}
            className="px-4 py-2 rounded-xl bg-[#2EC4B6] hover:bg-teal-500 text-white font-black text-xs transition-transform active:scale-95 shadow"
          >
            Chat with {companionName} 💬
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-2xl block mb-1">🔍</span>
            <strong className="text-xs font-black block text-slate-800 dark:text-slate-100 mb-0.5">
              Spot Patterns
            </strong>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight block">
              I can identify repeating colours, shapes, and sequence rules in Wonder Woods.
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-2xl block mb-1">🤖</span>
            <strong className="text-xs font-black block text-slate-800 dark:text-slate-100 mb-0.5">
              Understand AI
            </strong>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight block">
              I understand that machines learn from training data, vision, and commands.
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-2xl block mb-1">🛡️</span>
            <strong className="text-xs font-black block text-slate-800 dark:text-slate-100 mb-0.5">
              Protect Privacy
            </strong>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight block">
              I know how to keep personal passwords private and ask parents before sharing.
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-2xl block mb-1">💡</span>
            <strong className="text-xs font-black block text-slate-800 dark:text-slate-100 mb-0.5">
              Adapt & Try Again
            </strong>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight block">
              When an answer is not quite right, I use hints and test another solution!
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};
