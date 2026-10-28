/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Child, Lesson, Language, AgeGroup } from "../types";
import { CURRICULUM } from "../data/curriculum";
import { T, C, F } from "../utils/config";
import { Lock, Star, Check, Play } from "lucide-react";
import { sfx } from "../utils/audio";
import { KobeAvatar } from "./KobeAvatar";

interface SagaMapProps {
  child: Child;
  lang: Language;
  onSelectLesson: (l: Lesson) => void;
  onShowPaywall: () => void;
  onBack?: () => void;
  theme?: "light" | "dark";
}

const BIOME_COLORS = [
  { bgLight: "#FEF08A", bgDark: "#854D0E", node: "#FBBF24", accent: "#F59E0B" }, // Sunny Beach (Sand)
  { bgLight: "#A5F3FC", bgDark: "#164E63", node: "#06B6D4", accent: "#0891B2" }, // Tropical Ocean (Aqua)
  { bgLight: "#BBF7D0", bgDark: "#14532D", node: "#22C55E", accent: "#16A34A" }, // Jungle Canopy (Green)
  { bgLight: "#FFEDD5", bgDark: "#7C2D12", node: "#F97316", accent: "#EA580C" }, // Island Sunset (Orange)
  { bgLight: "#C7D2FE", bgDark: "#312E81", node: "#6366F1", accent: "#4F46E5" }, // Deep Reef (Indigo)
];

export const SagaMap: React.FC<SagaMapProps> = ({
  child,
  lang,
  onSelectLesson,
  onShowPaywall,
  onBack,
  theme = "dark"
}) => {
  const ageGroup: AgeGroup = child.ageGroup || "early explorers";
  const course = CURRICULUM[ageGroup];
  const modules = course?.modules || [];
  const isYoungExplorer = ageGroup === "early explorers" || ageGroup === "young explorers";

  // Calculate overall level progression across course
  const totalLevels = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const totalCompletedLevels = modules.reduce(
    (acc, m) => acc + (m.lessons?.filter((l) => Boolean(child.completed?.[l.id])).length || 0),
    0
  );

  const activeNodeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to the active lesson on mount
  useEffect(() => {
    if (activeNodeRef.current) {
      setTimeout(() => {
        activeNodeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, []);

  if (!modules.length) {
    return <div className="p-8 text-center text-white">No curriculum available for this age group yet.</div>;
  }

  // Find the first uncompleted lesson globally to mark as "Active"
  let foundActive = false;

  const isDark = theme === "dark";

  return (
    <div 
      className={`w-full min-h-screen pb-32 transition-colors duration-500 overflow-hidden relative ${isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]"}`}
    >
      <style>{`
        @keyframes drift {
          0% { transform: translateX(-100px); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateX(120vw); opacity: 0; }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes wave {
          0%, 100% { transform: translateX(0) scale(1); }
          50% { transform: translateX(-15px) scale(1.05); }
        }
      `}</style>

      {/* Moving Beach Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Clouds */}
        <div className={`absolute top-20 left-0 text-6xl opacity-30 animate-[drift_25s_linear_infinite] ${isDark ? 'grayscale brightness-50' : ''}`}>☁️</div>
        <div className={`absolute top-64 left-0 text-5xl opacity-20 animate-[drift_35s_linear_infinite_5s] ${isDark ? 'grayscale brightness-50' : ''}`}>☁️</div>
        
        {/* Sun/Moon */}
        <div className={`absolute top-32 right-12 text-7xl opacity-40 animate-[bob_10s_ease-in-out_infinite]`}>{isDark ? '🌕' : '☀️'}</div>

        {/* Beach Items (Drifting / Bobbing) */}
        <div className="absolute top-[400px] left-0 text-5xl opacity-40 animate-[drift_40s_linear_infinite_2s]">⛵</div>
        <div className="absolute top-[700px] -right-10 text-6xl opacity-30 animate-[bob_6s_ease-in-out_infinite] rotate-12">⛱️</div>
        <div className="absolute top-[1100px] -left-8 text-5xl opacity-30 animate-[wave_8s_ease-in-out_infinite] -rotate-12">🌊</div>
        <div className="absolute top-[1500px] right-4 text-4xl opacity-30 animate-[bob_7s_ease-in-out_infinite_1s] rotate-45">🐚</div>
        <div className="absolute top-[1900px] left-0 text-6xl opacity-30 animate-[drift_50s_linear_infinite_10s]">🚤</div>
      </div>
      {/* Map Header */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl border-b p-3 sm:p-4 flex items-center justify-between shadow-sm ${
        isDark ? "bg-[#0B1120]/80 border-slate-800" : "bg-white/80 border-slate-200"
      }`}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className={`p-2 rounded-xl transition-transform active:scale-95 flex-shrink-0 ${
                isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
              title="Return to Hub"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <div>
            <h2 className={`text-lg sm:text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontFamily: F.display }}>
              {isYoungExplorer ? "Adventure Map" : "Learning Map"}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
              {isYoungExplorer ? "Pathways & Levels" : "Your Adventure"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isYoungExplorer && (
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
              isDark ? "bg-slate-800/80 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
            }`}>
              <Check size={13} className="text-emerald-400" />
              <span className="text-xs font-black">
                {totalCompletedLevels} / {totalLevels} Levels
              </span>
            </div>
          )}

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
          }`}>
            <Star size={14} className="text-amber-400" />
            <span className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}>{child.xp || 0} XP</span>
          </div>
        </div>
      </div>

      {/* The Biomes */}
      <div className="flex flex-col relative">
        {modules.map((mod, modIndex) => {
          const biome = BIOME_COLORS[modIndex % BIOME_COLORS.length];
          const isPremiumModule = modIndex > 0;
          const isLockedByPaywall = isPremiumModule && !child.is_premium;

          const modLessons = mod.lessons || [];
          const modCompletedCount = modLessons.filter((l) => Boolean(child.completed?.[l.id])).length;
          const isModFullyCompleted = modLessons.length > 0 && modCompletedCount === modLessons.length;

          // Clean module title for Young Explorers (remove redundant "Module X: " prefix)
          const rawModTitle = mod.name?.[lang] || mod.name?.en || `Module ${modIndex + 1}`;
          const displayPathwayTitle = isYoungExplorer
            ? rawModTitle.replace(/^Module\s*\d+:\s*/i, "").trim()
            : rawModTitle;

          return (
            <div 
              key={mod.id} 
              className="relative py-24 px-4 flex flex-col items-center"
            >
              {/* Pathway Header Overlay */}
              <div className={`absolute top-6 left-1/2 -translate-x-1/2 backdrop-blur-md border px-6 sm:px-8 py-3 rounded-2xl text-center shadow-lg z-10 w-[92%] max-w-sm md:max-w-md ${
                isDark ? "bg-black/60 border-white/10" : "bg-white/70 border-slate-300"
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    isModFullyCompleted
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : isLockedByPaywall
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : isDark
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                      : "bg-teal-50 text-teal-700 border-teal-200"
                  }`}>
                    {isYoungExplorer ? `🧭 PATHWAY ${modIndex + 1}` : `Section ${modIndex + 1}`}
                  </span>

                  {isYoungExplorer && (
                    <span className="text-[10px] font-black text-slate-400">
                      {isModFullyCompleted
                        ? "⭐ Mastered!"
                        : isLockedByPaywall
                        ? "🔒 Premium"
                        : `${modCompletedCount}/${modLessons.length} Levels`}
                    </span>
                  )}
                </div>

                <h3 className={`text-lg sm:text-xl md:text-2xl font-black leading-tight ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontFamily: F.display }}>
                  {displayPathwayTitle}
                </h3>
              </div>

              {/* Lesson Nodes Path */}
              <div className="mt-20 w-full max-w-md flex flex-col items-center relative space-y-12">
                {/* SVG dashed path connecting nodes behind them */}
                <div className={`absolute top-0 bottom-0 w-2 border-l-4 border-dashed left-1/2 -translate-x-[2px] ${isDark ? "border-white/10" : "border-black/10"}`} />

                {mod.lessons.map((les, lesIndex) => {
                  const isCompleted = !!child.completed?.[les.id];
                  
                  // A lesson is active if it's the very first uncompleted one across the entire map
                  let isActive = false;
                  if (!isCompleted && !foundActive) {
                    isActive = true;
                    foundActive = true;
                  }

                  const isLockedByProgression = !isCompleted && !isActive;
                  const totallyLocked = isLockedByPaywall || isLockedByProgression;

                  // Zig-zag alignment (Left, Center, Right, Center)
                  const alignPattern = ["self-start ml-8", "self-center", "self-end mr-8", "self-center"];
                  const alignment = alignPattern[lesIndex % 4];

                  const isLastLesson = lesIndex === mod.lessons.length - 1;
                  const isBossNode = isLastLesson;

                  return (
                    <div key={les.id} className={`relative z-10 flex flex-col items-center ${alignment}`}>
                      
                      {isActive && (
                        <div className="absolute -top-16 flex flex-col items-center animate-[bounce_2s_ease-in-out_infinite] z-20 pointer-events-none">
                          {isYoungExplorer && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#FFD166] text-slate-900 font-black text-[10px] shadow-md border border-amber-600 mb-1 whitespace-nowrap">
                              👉 Level {lesIndex + 1} Ready!
                            </span>
                          )}
                          <KobeAvatar size={52} character={child.companion || "kobe"} ageGroup={ageGroup} />
                        </div>
                      )}

                      <button
                        ref={isActive ? activeNodeRef : null}
                        onClick={() => {
                          if (isLockedByPaywall) {
                            sfx.playBuzzer();
                            onShowPaywall();
                          } else if (totallyLocked) {
                            sfx.playBuzzer();
                          } else {
                            sfx.playTap();
                            onSelectLesson(les);
                          }
                        }}
                        className={`rounded-full flex items-center justify-center border-4 shadow-xl transition-all duration-300 relative group
                          ${isBossNode ? "w-24 h-24 border-[6px]" : "w-20 h-20"}
                          ${isCompleted ? "bg-gradient-to-br from-[#2EC4B6] to-[#20877d] border-white scale-95" : ""}
                          ${isActive ? "scale-110 ring-8 ring-[#2EC4B6]/30 animate-pulse border-white bg-gradient-to-br from-[#2EC4B6] to-[#20877d]" : ""}
                          ${totallyLocked ? (isDark ? "bg-slate-800 border-slate-700 opacity-60" : "bg-slate-200 border-slate-300 opacity-60") : ""}
                        `}
                        style={{
                          boxShadow: isActive ? `0 0 40px #2EC4B6` : isCompleted ? `0 0 20px #2EC4B6` : 'none'
                        }}
                      >
                        {isCompleted && (isBossNode ? <Star size={40} className="text-white fill-white" /> : <Check size={32} className="text-white" />)}
                        {isActive && <Play size={isBossNode ? 40 : 32} className="text-white ml-1" />}
                        {totallyLocked && <Lock size={isBossNode ? 36 : 28} className={isDark ? "text-slate-500" : "text-slate-400"} />}
                      </button>

                      {/* Node Label (Centered below) */}
                      <div className={`mt-4 px-4 py-2 rounded-xl z-30 shadow-md border text-center w-max max-w-[210px] flex flex-col items-center transition-all ${
                        isActive
                          ? (isDark ? "bg-[#1e293b] text-white border-teal-400 ring-2 ring-teal-400/40" : "bg-white text-slate-900 border-teal-400 ring-2 ring-teal-400/30")
                          : (isDark ? "bg-[#1e293b]/95 text-white border-slate-700" : "bg-white/95 text-slate-800 border-slate-200")
                      }`}>
                        <span className={`font-black text-[10px] uppercase tracking-wider mb-0.5 ${
                          isActive ? "text-teal-400 font-black" : "opacity-60"
                        }`}>
                          {isYoungExplorer 
                            ? (isBossNode ? `⭐ LEVEL ${lesIndex + 1} · FINALE` : `LEVEL ${lesIndex + 1}`) 
                            : `Lesson ${lesIndex + 1}`}
                        </span>

                        <span className="font-black text-sm sm:text-base block leading-tight">
                          {les.title?.[lang] || les.title?.en}
                        </span>

                        {isYoungExplorer && (
                          <div className="mt-1 flex items-center gap-1">
                            {isCompleted && (
                              <span className="text-[10px] font-black text-emerald-400">
                                ✓ Mastered
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] font-black text-[#2EC4B6] animate-pulse">
                                ⚡ Current Quest
                              </span>
                            )}
                            {totallyLocked && (
                              <span className="text-[10px] font-bold text-slate-400">
                                {isLockedByPaywall ? "🔒 Premium Gate" : "🔒 Complete Prior Levels"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
