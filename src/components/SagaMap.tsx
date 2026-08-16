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
  { bg: "#0F172A", node: "#3B82F6", accent: "#60A5FA" }, // Module 1: Blue/Night
  { bg: "#14532D", node: "#22C55E", accent: "#4ADE80" }, // Module 2: Green/Forest
  { bg: "#4C1D95", node: "#A855F7", accent: "#C084FC" }, // Module 3: Purple/Cosmic
  { bg: "#7F1D1D", node: "#EF4444", accent: "#F87171" }, // Module 4: Red/Volcano
  { bg: "#083344", node: "#06B6D4", accent: "#22D3EE" }, // Module 5: Cyan/Ice
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

  return (
    <div className="w-full min-h-screen bg-[#0B1120] pb-32">
      {/* Map Header */}
      <div className="sticky top-0 z-50 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white" style={{ fontFamily: F.display }}>Learning Map</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Your Adventure</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <Star size={14} className="text-amber-400" />
          <span className="text-white text-xs font-black">{child.xp || 0} XP</span>
        </div>
      </div>

      {/* The Biomes */}
      <div className="flex flex-col">
        {modules.map((mod, modIndex) => {
          const biome = BIOME_COLORS[modIndex % BIOME_COLORS.length];
          const isPremiumModule = modIndex > 0;
          const isLockedByPaywall = isPremiumModule && !child.is_premium;

          return (
            <div 
              key={mod.id} 
              className="relative py-16 px-4 flex flex-col items-center border-b-[8px] border-black/40"
              style={{ backgroundColor: biome.bg }}
            >
              {/* Module Header Overlay */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md border border-white/10 px-6 py-2 rounded-2xl text-center shadow-2xl z-10 w-[90%] max-w-sm">
                <span className="text-[10px] text-white/70 font-black uppercase tracking-widest block mb-0.5">
                  Section {modIndex + 1}
                </span>
                <h3 className="text-lg font-black text-white leading-tight" style={{ fontFamily: F.display }}>
                  {mod.title?.[lang] || mod.title?.en}
                </h3>
              </div>

              {/* Lesson Nodes Path */}
              <div className="mt-20 w-full max-w-md flex flex-col items-center relative space-y-12">
                {/* SVG dashed path connecting nodes behind them */}
                <div className="absolute top-0 bottom-0 w-2 border-l-4 border-dashed border-white/10 left-1/2 -translate-x-[2px]" />

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

                  return (
                    <div key={les.id} className={`relative z-10 flex flex-col items-center ${alignment}`}>
                      
                      {isActive && (
                        <div className="absolute -top-12 animate-bounce z-20">
                           <KobeAvatar size={45} character={child.companion || "kobe"} ageGroup={ageGroup} />
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
                        className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-xl transition-all duration-300 relative group
                          ${isCompleted ? "bg-white border-white scale-95" : ""}
                          ${isActive ? "scale-110 ring-8 ring-white/20 animate-pulse border-white bg-gradient-to-br from-white to-slate-200" : ""}
                          ${totallyLocked ? "bg-slate-800 border-slate-700 opacity-80" : ""}
                        `}
                        style={{
                          boxShadow: isActive ? `0 0 40px ${biome.node}` : isCompleted ? `0 0 20px ${biome.node}80` : 'none'
                        }}
                      >
                        {isCompleted && <Check size={32} className="text-black" />}
                        {isActive && <Play size={32} className="text-black ml-1" />}
                        {totallyLocked && <Lock size={28} className="text-slate-500" />}

                        {/* Node Label Tooltip */}
                        <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg pointer-events-none z-30
                          ${(lesIndex % 4 === 0) ? "left-full ml-4" : (lesIndex % 4 === 2) ? "right-full mr-4" : "left-full ml-4"}
                        `}>
                          {les.title?.[lang] || les.title?.en}
                          <div className="text-[9px] text-slate-400 font-normal mt-0.5 max-w-[150px] whitespace-normal">
                            {les.desc?.[lang] || les.desc?.en}
                          </div>
                        </div>
                      </button>

                      <div className="mt-3 text-center w-24">
                        <span className="text-xs font-black text-white/90 drop-shadow-md leading-tight block">
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
