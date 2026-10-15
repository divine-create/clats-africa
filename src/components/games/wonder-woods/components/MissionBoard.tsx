import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Star, Lock, Sparkles, CheckCircle2, Play, Flame } from "lucide-react";
import { MEADOW_LEVELS } from "../data/meadowLevels";
import { MeadowLevelConfig } from "../types";
import { sfx } from "../../../../utils/audio";

interface MissionBoardProps {
  unlockedLevel: number;
  completedLevels: number[];
  onSelectLevel: (level: MeadowLevelConfig) => void;
  onBackToMap: () => void;
}

export const MissionBoard: React.FC<MissionBoardProps> = ({
  unlockedLevel,
  completedLevels,
  onSelectLevel,
  onBackToMap
}) => {
  const handleLevelClick = (level: MeadowLevelConfig) => {
    const isUnlocked = level.id <= unlockedLevel;
    if (isUnlocked) {
      sfx.play("pop");
      onSelectLevel(level);
    } else {
      sfx.play("error");
    }
  };

  const progressPercent = Math.round((completedLevels.length / MEADOW_LEVELS.length) * 100);

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-[#06141F] via-[#0A2328] to-[#06171B] text-white rounded-3xl overflow-hidden relative min-h-[560px]">
      {/* Background soft meadow textures */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      {/* Header Bar */}
      <div className="w-full flex justify-between items-center z-10 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-emerald-500/30 shadow-md">
        <button
          type="button"
          onClick={onBackToMap}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>World Map</span>
        </button>

        <div className="text-center">
          <h2 
            className="text-base sm:text-lg font-black text-emerald-300"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
          >
            Pattern Meadow · Mission Trail
          </h2>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            Levels 1 to 10
          </p>
        </div>

        <div className="bg-emerald-950/80 border border-emerald-400/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black text-emerald-300 shadow-sm">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          <span>{completedLevels.length} / 10 ⭐</span>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="w-full max-w-md mx-auto my-2 z-10 px-2">
        <div className="flex justify-between items-center text-[11px] font-bold text-slate-300 mb-1">
          <span>Meadow Mastery</span>
          <span className="text-emerald-400">{progressPercent}% Complete</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Mission Nodes Trail Grid */}
      <div className="my-auto grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 max-w-3xl w-full mx-auto p-2 z-10 overflow-y-auto max-h-[360px]">
        {MEADOW_LEVELS.map((level) => {
          const isCompleted = completedLevels.includes(level.id);
          const isNext = level.id === unlockedLevel && !isCompleted;
          const isUnlocked = level.id <= unlockedLevel;

          return (
            <motion.div
              key={level.id}
              whileHover={isUnlocked ? { scale: 1.05, y: -2 } : {}}
              whileTap={isUnlocked ? { scale: 0.95 } : {}}
              className="relative"
            >
              <button
                type="button"
                onClick={() => handleLevelClick(level)}
                disabled={!isUnlocked}
                className={`w-full p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all border-2 shadow-lg min-h-[110px] relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  isCompleted
                    ? "bg-emerald-950/60 border-emerald-400 text-emerald-100"
                    : isNext
                    ? "bg-slate-900 border-amber-400 text-amber-100 shadow-amber-400/20"
                    : isUnlocked
                    ? "bg-slate-900/90 border-slate-700 text-slate-200"
                    : "bg-slate-950/80 border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                }`}
              >
                {/* Active next level pulsing beacon */}
                {isNext && (
                  <div className="absolute inset-0 bg-amber-400/10 animate-pulse pointer-events-none" />
                )}

                {/* Top Badge: Level ID & Status */}
                <div className="w-full flex justify-between items-center mb-1">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-black/40">
                    #{level.id}
                  </span>
                  
                  {isCompleted && (
                    <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-950" />
                  )}
                  {isNext && (
                    <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full uppercase">
                      PLAY
                    </span>
                  )}
                  {!isUnlocked && (
                    <Lock size={14} className="text-slate-500" />
                  )}
                </div>

                {/* Level Title */}
                <h4 
                  className="text-xs sm:text-sm font-black line-clamp-1 mt-1"
                  style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
                >
                  {level.title}
                </h4>

                {/* Subrule / Phase Label */}
                <span className="text-[10px] font-bold text-slate-400 mt-1 line-clamp-1">
                  {level.phase} · {level.subrule.split(" ")[0]}
                </span>

                {/* Reward XP indicator */}
                <div className="mt-2 text-[10px] font-black text-amber-400 flex items-center gap-1">
                  <span>+{level.xpAward} XP</span>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Helper */}
      <div className="w-full text-center z-10 py-1">
        <p className="text-xs text-slate-400 font-medium">
          Select an available mission node to watch the animated preview and begin!
        </p>
      </div>
    </div>
  );
};
