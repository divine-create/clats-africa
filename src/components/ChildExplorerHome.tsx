/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CLATS Explorers: Adventure-Style Explorer's Hub (Ages 6–10)
 *
 * Purpose: A welcoming, playful Home experience giving children two clear hero choices:
 *  1. Learn something new (Lessons, video arena, quizzes, practice, create, saga map)
 *  2. Play, solve and discover (Dedicated purposeful games world)
 *
 * Plus one small, authentic progress element: "Continue your adventure".
 */

import React, { useEffect, useCallback } from "react";
import { Child, Language, Module, Lesson } from "../types";
import { CURRICULUM } from "../data/curriculum";
import { KobeAvatar } from "./KobeAvatar";
import { sfx, companionVoice } from "../utils/audio";
import { computeEffectiveStreak } from "../utils/streak";
import {
  BookOpen,
  Gamepad2,
  ArrowRight,
  Compass,
  Sparkles,
  Flame,
  Play
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
  onSelectLesson,
  onEnterWorld,
  onPlayGame,
  lang,
  theme = "dark"
}) => {
  const isDark = theme === "dark";

  // Safely extract existing display name
  const rawName = child?.name ? String(child.name).trim() : "";
  const displayName = rawName.length > 0 ? rawName : null;

  const companionCharacter = child.companion === "chibi" ? "chibi" : "kobe";
  const companionName = companionCharacter === "chibi" ? "Chibi" : "Kobe";

  // Friendly companion voice greeting on entry
  useEffect(() => {
    const greetingHeading = displayName
      ? `Ready for an adventure, ${displayName}?`
      : "Ready for an adventure?";
    const spokenText = `${greetingHeading} What would you like to explore today?`;

    const timer = setTimeout(() => {
      companionVoice.speak(spokenText, companionCharacter, child.ageGroup);
    }, 700);

    return () => clearTimeout(timer);
  }, [child.id, companionCharacter, child.ageGroup, displayName]);

  // Find active lesson (first uncompleted lesson in sequence)
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

  // Meaningful streak calculation from existing engine
  const { streak: computedStreak } = computeEffectiveStreak(child);

  // Navigation handlers with SFX
  const handleLearnClick = useCallback(() => {
    sfx.playTap();
    onEnterWorld("academy-1");
  }, [onEnterWorld]);

  const handleGamesClick = useCallback(() => {
    sfx.playCoin();
    onPlayGame();
  }, [onPlayGame]);

  const handleResumeActiveLesson = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      sfx.playTap();
      if (activeModule && activeLesson) {
        onSelectLesson(activeModule, activeLesson);
      } else {
        onEnterWorld("academy-1");
      }
    },
    [activeModule, activeLesson, onSelectLesson, onEnterWorld]
  );

  // Accessible keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 pb-28 relative z-10 animate-fade-in">
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .clats-motion-card,
          .clats-motion-pulse,
          .clats-motion-float {
            animation: none !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* ============================================================ */}
      {/* SECTION A: FRIENDLY GREETING                                  */}
      {/* ============================================================ */}
      <header className="mb-8 md:mb-10">
        <div
          className={`rounded-3xl p-6 md:p-8 border-3 shadow-xl backdrop-blur-xl transition-all duration-300 ${
            isDark
              ? "bg-slate-900/90 border-slate-700/80 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
              : "bg-white/95 border-emerald-200/90 shadow-[0_12px_32px_rgba(46,196,182,0.15)]"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
            {/* Kobe / Chibi Character Avatar */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#2EC4B6] to-[#FFD166] rounded-full blur-md opacity-50 clats-motion-pulse animate-pulse pointer-events-none" />
              <div className="relative bg-gradient-to-br from-emerald-100 via-teal-100 to-amber-100 dark:from-slate-800 dark:to-slate-700 p-2.5 rounded-full border-4 border-[#2EC4B6] shadow-lg">
                <KobeAvatar
                  size={84}
                  ageGroup="early explorers"
                  character={companionCharacter}
                  expression="happy"
                  pulse
                />
              </div>
            </div>

            {/* Greeting Text Content */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2EC4B6]/15 text-[#0F766E] dark:text-[#2EC4B6] font-black text-xs uppercase tracking-wider mb-2">
                <Sparkles size={13} className="text-[#2EC4B6]" />
                <span>Explorer&apos;s Hub</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white m-0 leading-tight">
                {displayName ? `Ready for an adventure, ${displayName}?` : "Ready for an adventure?"}
              </h1>

              <p className="text-base sm:text-lg font-bold text-slate-600 dark:text-slate-300 mt-1.5 mb-0">
                What would you like to explore today?
              </p>
            </div>

            {/* Subtle Companion Badge (if streak available) */}
            {computedStreak > 0 && (
              <div className="hidden lg:flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40 text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wide">
                  <Flame size={16} className="text-orange-500 animate-bounce" />
                  <span>Streak</span>
                </div>
                <span className="text-lg font-black text-orange-950 dark:text-amber-200 mt-0.5">
                  {computedStreak} {computedStreak === 1 ? "Day" : "Days"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* SECTION B & C: THE TWO MAIN HERO CHOICES                     */}
      {/* ============================================================ */}
      <main className="mb-8 md:mb-10">
        <h2 className="sr-only">Main Choices</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          
          {/* ------------------------------------------------------------ */}
          {/* CARD 1: LEARN SOMETHING NEW                                   */}
          {/* ------------------------------------------------------------ */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleLearnClick}
            onKeyDown={(e) => handleKeyDown(e, handleLearnClick)}
            aria-label="Learn something new: Watch fun lessons, answer curious questions and discover new ideas"
            className={`clats-motion-card group relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 md:p-8 cursor-pointer select-none overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2EC4B6] focus-visible:ring-offset-2 ${
              isDark
                ? "bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#0F766E] text-white border-4 border-emerald-400/30 hover:border-emerald-300 shadow-[0_16px_36px_rgba(6,78,59,0.45)] hover:shadow-[0_20px_48px_rgba(46,196,182,0.4)]"
                : "bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0] text-slate-900 border-4 border-emerald-300/80 hover:border-emerald-400 shadow-[0_16px_36px_rgba(16,185,129,0.18)] hover:shadow-[0_20px_48px_rgba(16,185,129,0.3)]"
            } transform hover:-translate-y-1 active:translate-y-0`}
          >
            {/* Background Glow */}
            <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div>
              {/* Category pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/20 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs font-black uppercase tracking-wider mb-4 border border-emerald-500/30">
                <BookOpen size={14} className="text-emerald-600 dark:text-emerald-300" />
                <span>Learning Pathway</span>
              </div>

              {/* Card Title */}
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug m-0 text-slate-900 dark:text-white">
                Learn something new
              </h3>

              {/* Supporting Copy */}
              <p className="text-sm sm:text-base font-semibold leading-relaxed mt-2.5 mb-6 text-slate-700 dark:text-emerald-100/90 max-w-md">
                Watch fun lessons, answer curious questions and discover new ideas.
              </p>
            </div>

            {/* Illustrated Scene: Discovery Trail, Open Book & Sparkles */}
            <div className="my-3 py-2 flex items-center justify-center relative">
              <div className="w-full max-w-[280px] h-[150px] relative flex items-center justify-center">
                <svg
                  viewBox="0 0 280 150"
                  className="w-full h-full drop-shadow-md select-none pointer-events-none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Soft Background Hill */}
                  <path
                    d="M 10 140 Q 90 85 180 110 T 270 140 Z"
                    fill={isDark ? "#047857" : "#6EE7B7"}
                    opacity="0.6"
                  />
                  {/* Winding Discovery Trail */}
                  <path
                    d="M 40 145 C 90 120 120 125 150 95 C 170 75 190 60 210 50"
                    stroke="#FFD166"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="4 8"
                    opacity="0.8"
                  />
                  {/* Island Peak & Palm Silhouette */}
                  <path
                    d="M 210 50 L 235 90 L 185 90 Z"
                    fill={isDark ? "#064E3B" : "#10B981"}
                  />
                  {/* Open Storybook */}
                  <g transform="translate(75, 45)">
                    {/* Book Left Page */}
                    <path
                      d="M 10 20 C 35 15 55 20 65 30 L 65 75 C 55 65 35 60 10 65 Z"
                      fill="#FFFFFF"
                      stroke="#2EC4B6"
                      strokeWidth="3"
                    />
                    {/* Book Right Page */}
                    <path
                      d="M 120 20 C 95 15 75 20 65 30 L 65 75 C 75 65 95 60 120 65 Z"
                      fill="#F8FAFC"
                      stroke="#2EC4B6"
                      strokeWidth="3"
                    />
                    {/* Page Lines (Left) */}
                    <line x1="22" y1="35" x2="55" y2="35" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="22" y1="46" x2="52" y2="46" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="22" y1="57" x2="48" y2="57" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Page Lines (Right) */}
                    <line x1="75" y1="35" x2="108" y2="35" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="78" y1="46" x2="108" y2="46" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="82" y1="57" x2="108" y2="57" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Golden Book Ribbon */}
                    <path d="M 65 30 L 65 82 L 69 77 L 73 82 L 73 30 Z" fill="#F59E0B" />
                  </g>
                  {/* Floating Discovery Sparkles */}
                  <g transform="translate(195, 25)">
                    <circle cx="0" cy="0" r="4" fill="#FFD166" className="animate-ping" opacity="0.8" />
                    <polygon points="0,-9 3,-3 9,0 3,3 0,9 -3,3 -9,0 -3,-3" fill="#FFD166" />
                  </g>
                  <g transform="translate(50, 30)">
                    <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill="#2EC4B6" />
                  </g>
                  <g transform="translate(240, 80)">
                    <polygon points="0,-6 2,-2 6,0 2,2 0,6 -2,2 -6,0 -2,-2" fill="#38BDF8" />
                  </g>
                  {/* Curiosity Lightbulb / Compass Icon Silhouette */}
                  <circle cx="230" cy="40" r="14" fill="#FFD166" opacity="0.9" />
                  <path d="M 230 32 L 230 48 M 222 40 L 238 40" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Large Touch-Friendly Primary CTA Button */}
            <div className="mt-4 pt-4 border-t border-emerald-500/20 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
                Explore The Trail
              </span>
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#2EC4B6] hover:bg-[#25a99d] text-white font-black text-sm sm:text-base shadow-lg border-b-4 border-teal-700 group-hover:scale-105 active:scale-95 transition-transform">
                <span>Start Learning</span>
                <ArrowRight size={18} className="stroke-[3] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* CARD 2: PLAY, SOLVE AND DISCOVER                             */}
          {/* ------------------------------------------------------------ */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleGamesClick}
            onKeyDown={(e) => handleKeyDown(e, handleGamesClick)}
            aria-label="Play, solve and discover: Enter game worlds, solve puzzles and show what you can do"
            className={`clats-motion-card group relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 md:p-8 cursor-pointer select-none overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 ${
              isDark
                ? "bg-gradient-to-br from-[#312E81] via-[#4338CA] to-[#6D28D9] text-white border-4 border-purple-400/30 hover:border-purple-300 shadow-[0_16px_36px_rgba(49,46,129,0.45)] hover:shadow-[0_20px_48px_rgba(139,92,246,0.4)]"
                : "bg-gradient-to-br from-[#F5F3FF] via-[#EDE9FE] to-[#DDD6FE] text-slate-900 border-4 border-purple-300/80 hover:border-purple-400 shadow-[0_16px_36px_rgba(139,92,246,0.18)] hover:shadow-[0_20px_48px_rgba(139,92,246,0.3)]"
            } transform hover:-translate-y-1 active:translate-y-0`}
          >
            {/* Background Glow */}
            <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-purple-400/20 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div>
              {/* Category pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-700/20 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 text-xs font-black uppercase tracking-wider mb-4 border border-purple-500/30">
                <Gamepad2 size={14} className="text-purple-600 dark:text-purple-300" />
                <span>Games World</span>
              </div>

              {/* Card Title */}
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug m-0 text-slate-900 dark:text-white">
                Play, solve and discover
              </h3>

              {/* Supporting Copy */}
              <p className="text-sm sm:text-base font-semibold leading-relaxed mt-2.5 mb-6 text-slate-700 dark:text-purple-100/90 max-w-md">
                Enter game worlds, solve puzzles and show what you can do.
              </p>
            </div>

            {/* Illustrated Scene: Glowing Adventure Portal & Floating Puzzle Blocks */}
            <div className="my-3 py-2 flex items-center justify-center relative">
              <div className="w-full max-w-[280px] h-[150px] relative flex items-center justify-center">
                <svg
                  viewBox="0 0 280 150"
                  className="w-full h-full drop-shadow-md select-none pointer-events-none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Concentric Portal Glowing Rings */}
                  <ellipse cx="140" cy="75" rx="90" ry="55" fill="none" stroke="#8B5CF6" strokeWidth="2" opacity="0.4" strokeDasharray="6 6" />
                  <ellipse cx="140" cy="75" rx="70" ry="42" fill="none" stroke="#38BDF8" strokeWidth="3" opacity="0.7" />
                  <ellipse cx="140" cy="75" rx="50" ry="30" fill={isDark ? "#4C1D95" : "#C4B5FD"} opacity="0.6" />
                  <ellipse cx="140" cy="75" rx="30" ry="18" fill="#38BDF8" opacity="0.8" />

                  {/* Portal Energy Rays */}
                  <line x1="140" y1="35" x2="140" y2="15" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="140" y1="115" x2="140" y2="135" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="85" y1="75" x2="65" y2="75" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="195" y1="75" x2="215" y2="75" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Floating Puzzle Block 1 (Left Isometric Cube) */}
                  <g transform="translate(45, 50)">
                    {/* Top face */}
                    <polygon points="18,0 36,9 18,18 0,9" fill="#F43F5E" />
                    {/* Left face */}
                    <polygon points="0,9 18,18 18,36 0,27" fill="#BE123C" />
                    {/* Right face */}
                    <polygon points="18,18 36,9 36,27 18,36" fill="#E11D48" />
                    {/* Puzzle dot */}
                    <circle cx="18" cy="9" r="3" fill="#FECDD3" />
                  </g>

                  {/* Floating Puzzle Block 2 (Right Isometric Cube) */}
                  <g transform="translate(200, 60)">
                    {/* Top face */}
                    <polygon points="16,0 32,8 16,16 0,8" fill="#F59E0B" />
                    {/* Left face */}
                    <polygon points="0,8 16,16 16,32 0,24" fill="#B45309" />
                    {/* Right face */}
                    <polygon points="16,16 32,8 32,24 16,32" fill="#D97706" />
                    {/* Star in puzzle block */}
                    <circle cx="16" cy="8" r="2.5" fill="#FEF3C7" />
                  </g>

                  {/* Floating Game Gem / Crystal in Portal Center */}
                  <polygon
                    points="140,58 152,75 140,92 128,75"
                    fill="#FFD166"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="clats-motion-float"
                  />

                  {/* Game Controller D-pad silhouette */}
                  <g transform="translate(130, 71)">
                    <path d="M 5 0 L 15 0 L 15 5 L 20 5 L 20 15 L 15 15 L 15 20 L 5 20 L 5 15 L 0 15 L 0 5 L 5 5 Z" fill="#FFFFFF" opacity="0.9" />
                  </g>

                  {/* Floating Neon Sparkles */}
                  <g transform="translate(60, 25)">
                    <circle cx="0" cy="0" r="3.5" fill="#38BDF8" className="animate-ping" opacity="0.8" />
                    <polygon points="0,-8 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2" fill="#38BDF8" />
                  </g>
                  <g transform="translate(225, 30)">
                    <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill="#EC4899" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Large Touch-Friendly Primary CTA Button */}
            <div className="mt-4 pt-4 border-t border-purple-500/20 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-purple-800 dark:text-purple-200">
                Enter Games World
              </span>
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black text-sm sm:text-base shadow-lg border-b-4 border-indigo-900 group-hover:scale-105 active:scale-95 transition-transform">
                <span>Play Games</span>
                <Play size={18} className="fill-white group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ============================================================ */}
      {/* SECTION D: OPTIONAL SUPPORTING INFORMATION                   */}
      {/* "Continue your adventure" (Authentic small progress element) */}
      {/* ============================================================ */}
      {activeLesson && (
        <section
          aria-label="Continue your adventure"
          onClick={handleResumeActiveLesson}
          className={`rounded-3xl p-5 md:p-6 border-3 shadow-lg transition-all duration-300 cursor-pointer ${
            isDark
              ? "bg-slate-900/80 border-slate-700/80 hover:border-teal-500/60"
              : "bg-white/95 border-teal-200/90 hover:border-teal-400/80 shadow-[0_8px_24px_rgba(46,196,182,0.12)]"
          } transform hover:-translate-y-0.5 active:translate-y-0`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Left: Compass / Trail icon and details */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2EC4B6] to-[#0ea5e9] text-white flex items-center justify-center text-xl shadow-md shrink-0">
                <Compass size={24} className="stroke-[2.5]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#2EC4B6]">
                    ⭐ Continue your adventure
                  </span>
                  {isAllCompleted && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-black uppercase">
                      All Completed!
                    </span>
                  )}
                </div>

                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate m-0 mt-0.5">
                  {activeLesson.title[lang] || activeLesson.title.en}
                </h4>

                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate m-0 mt-0.5">
                  {activeModule?.name[lang] || activeModule?.name.en || "AI & Emerging Technologies"}
                </p>
              </div>
            </div>

            {/* Right: Resume button */}
            <div className="shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResumeActiveLesson}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#FFD166] hover:bg-amber-400 text-slate-900 font-black text-sm shadow-md border-b-3 border-amber-600 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <span>{isAllCompleted ? "Replay Quest" : "Resume"}</span>
                <ArrowRight size={16} className="stroke-[3]" />
              </button>
            </div>

          </div>
        </section>
      )}

    </div>
  );
};

export default ChildExplorerHome;
