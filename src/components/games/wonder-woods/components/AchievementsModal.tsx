import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Award, Star, Sparkles, CheckCircle2, Lock, Trophy } from "lucide-react";
import { evaluatePatternQuestAchievements, getMeadowMilestoneStatus } from "../data/achievements";
import { sfx } from "../../../../utils/audio";

interface AchievementsModalProps {
  completedLevels: number[];
  starsPerLevel?: Record<number, number>;
  totalSparks?: number;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  completedLevels,
  starsPerLevel = {},
  totalSparks = 0,
  onClose
}) => {
  const milestone = getMeadowMilestoneStatus(completedLevels, starsPerLevel, totalSparks);
  const achievements = evaluatePatternQuestAchievements(completedLevels, starsPerLevel, totalSparks);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleClose = () => {
    sfx.play("pop");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border-4 border-amber-400/80 rounded-3xl p-5 sm:p-7 max-w-2xl w-full text-white shadow-[0_0_50px_rgba(251,191,36,0.25)] flex flex-col max-h-[90vh] overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl shadow-md">
                🏆
              </div>
              <div>
                <h3
                  className="text-lg sm:text-xl font-black text-amber-300"
                  style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
                >
                  Pattern Quest Achievements
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">
                  {unlockedCount} of {achievements.length} Badges Unlocked · {milestone.rank.name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Close Achievements"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {/* Grand Meadow Milestone Card */}
            <div
              className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                milestone.isCompleted
                  ? "bg-gradient-to-r from-emerald-950/70 via-teal-950/60 to-amber-950/60 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  : "bg-slate-950/60 border-slate-800"
              }`}
            >
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-2 shadow-lg ${
                    milestone.isCompleted
                      ? "bg-emerald-500/20 border-emerald-400 animate-bounce"
                      : "bg-slate-800 border-slate-700 grayscale"
                  }`}
                >
                  {milestone.badgeIcon}
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                      {milestone.badgeName}
                    </span>
                    {milestone.isCompleted && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                        CONQUERED ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {milestone.isCompleted
                      ? "Meadow Archway Restored! Wonder Woods gateway is unlocked on your World Map."
                      : `Solve all 10 Meadow missions to restore the ancient archway and unlock Wonder Woods (${milestone.completedMissionsCount}/10 completed).`}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-700 text-xs font-black">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span>{milestone.totalStars} / 30 ⭐</span>
              </div>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((ach) => {
                const percent = Math.round((ach.progressCurrent / ach.progressTarget) * 100);

                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[115px] ${
                      ach.unlocked
                        ? "bg-slate-800/80 border-amber-400/50 shadow-md"
                        : "bg-slate-950/40 border-slate-800/80 opacity-75"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                          ach.unlocked
                            ? "bg-amber-400/20 border-amber-400 shadow-sm"
                            : "bg-slate-800 border-slate-700 grayscale"
                        }`}
                      >
                        {ach.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs sm:text-sm font-black text-white truncate">
                            {ach.name}
                          </h4>
                          {ach.unlocked ? (
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Lock size={12} className="text-slate-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-tight">
                          {ach.desc}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Status */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>{ach.requirementText}</span>
                      <span className={ach.unlocked ? "text-emerald-400 font-black" : "text-slate-400"}>
                        {ach.unlocked ? "Unlocked ✓" : `${ach.progressCurrent}/${ach.progressTarget}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-bold text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5 text-teal-300">
              <Sparkles size={14} />
              <span>{totalSparks} Pattern Sparks Collected</span>
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition text-xs font-black"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
