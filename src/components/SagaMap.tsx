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
  theme?: "light" | "dark";
}

const BIOME_COLORS = [
  { bgLight: "#7DF9FF", bgDark: "#0052CC", node: "#00F0FF", accent: "#007BFF" }, // Neon Cyan
  { bgLight: "#B2FF59", bgDark: "#1B5E20", node: "#39FF14", accent: "#00E676" }, // Lime Green
  { bgLight: "#EA80FC", bgDark: "#4A148C", node: "#D500F9", accent: "#AA00FF" }, // Hot Violet
  { bgLight: "#FF8A80", bgDark: "#880E4F", node: "#FF1744", accent: "#D50000" }, // Candy Red
  { bgLight: "#FFFF8D", bgDark: "#FF6F00", node: "#FFEA00", accent: "#FFAB00" }, // Electric Yellow
];

export const SagaMap: React.FC<SagaMapProps> = ({
  child,
  lang,
  onSelectLesson,
  onShowPaywall,
  theme = "dark"
}) => {
  const ageGroup: AgeGroup = child.ageGroup || "early explorers";
  const course = CURRICULUM[ageGroup];
  const modules = course?.modules || [];

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
      className="w-full min-h-screen pb-32 transition-colors duration-500"
      style={{
        background: isDark 
          ? "linear-gradient(180deg, #0f172a 0%, #020617 100%)" 
          : "linear-gradient(180deg, #f0fdfa 0%, #e0f2fe 100%)"
      }}
    >
      {/* Map Header */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl border-b p-4 flex items-center justify-between shadow-sm ${
        isDark ? "bg-[#0B1120]/80 border-slate-800" : "bg-white/80 border-slate-200"
      }`}>
        <div>
          <h2 className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontFamily: F.display }}>Learning Map</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Your Adventure</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
        }`}>
          <Star size={14} className="text-amber-400" />
          <span className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}>{child.xp || 0} XP</span>
        </div>
      </div>

      {/* The Biomes */}
      <div className="flex flex-col relative">
        {modules.map((mod, modIndex) => {
          const biome = BIOME_COLORS[modIndex % BIOME_COLORS.length];
          const isPremiumModule = modIndex > 0;
          const isLockedByPaywall = isPremiumModule && !child.is_premium;

          return (
            <div 
              key={mod.id} 
              className="relative py-24 px-4 flex flex-col items-center"
              style={{ 
                background: isDark 
                  ? `linear-gradient(to bottom, transparent, ${biome.bgDark}80, transparent)` 
                  : `linear-gradient(to bottom, transparent, ${biome.bgLight}90, transparent)` 
              }}
            >
              {/* Module Header Overlay */}
              <div className={`absolute top-6 left-1/2 -translate-x-1/2 backdrop-blur-md border px-6 py-2 rounded-2xl text-center shadow-lg z-10 w-[90%] max-w-sm ${
                isDark ? "bg-black/50 border-white/10" : "bg-white/60 border-slate-300"
              }`}>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-0.5 ${isDark ? "text-white/70" : "text-slate-500"}`}>
                  Section {modIndex + 1}
                </span>
                <h3 className={`text-lg font-black leading-tight ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontFamily: F.display }}>
                  {mod.title?.[lang] || mod.title?.en}
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
                        <div className="absolute -top-14 animate-[bounce_2s_ease-in-out_infinite] z-20">
                           <KobeAvatar size={55} character={child.companion || "kobe"} ageGroup={ageGroup} />
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
                          ${isCompleted ? "bg-white border-white scale-95" : ""}
                          ${isActive ? "scale-110 ring-8 ring-[#2EC4B6]/30 animate-pulse border-white bg-gradient-to-br from-[#2EC4B6] to-[#20877d]" : ""}
                          ${totallyLocked ? (isDark ? "bg-slate-800 border-slate-700 opacity-60" : "bg-slate-200 border-slate-300 opacity-60") : ""}
                        `}
                        style={{
                          boxShadow: isActive ? `0 0 40px #2EC4B6` : isCompleted ? `0 0 20px ${biome.node}80` : 'none'
                        }}
                      >
                        {isCompleted && (isBossNode ? <Star size={40} className="text-[#2EC4B6] fill-[#2EC4B6]" /> : <Check size={32} className="text-black" />)}
                        {isActive && <Play size={isBossNode ? 40 : 32} className="text-white ml-1" />}
                        {totallyLocked && <Lock size={isBossNode ? 36 : 28} className={isDark ? "text-slate-500" : "text-slate-400"} />}

                        {/* Node Label */}
                        <div className={`absolute top-1/2 -translate-y-1/2 transition-opacity whitespace-nowrap px-3 py-1.5 rounded-lg pointer-events-none z-30 shadow-sm border
                          ${isDark ? "bg-[#1e293b]/90 text-white border-slate-700" : "bg-white/90 text-slate-800 border-slate-200"}
                          ${(lesIndex % 4 === 0) ? "left-full ml-4" : (lesIndex % 4 === 2) ? "right-full mr-4" : "left-full ml-4"}
                        `}>
                          <span className="font-black text-sm block">
                            {les.title?.[lang] || les.title?.en}
                          </span>
                          <div className={`text-[9px] font-bold mt-0.5 max-w-[150px] whitespace-normal ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {les.desc?.[lang] || les.desc?.en}
                          </div>
                        </div>
                      </button>

                      <div className="mt-3 text-center w-24">
                        <span className={`text-xs font-black drop-shadow-md leading-tight block ${isDark ? "text-white/90" : "text-slate-800"}`}>
                          Lesson {lesIndex + 1}
                        </span>
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
