import React, { useEffect } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { Star, Award, ArrowRight, RotateCcw } from "lucide-react";
import { sfx } from "../../../../utils/audio";

interface FeedbackModalProps {
  levelTitle: string;
  subrule: string;
  xpAward: number;
  isGrandFinale?: boolean;
  onNext: () => void;
  onReplay?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  levelTitle,
  subrule,
  xpAward,
  isGrandFinale = false,
  onNext,
  onReplay
}) => {
  useEffect(() => {
    sfx.play("reward");
    confetti({
      particleCount: isGrandFinale ? 150 : 80,
      spread: isGrandFinale ? 100 : 70,
      origin: { y: 0.6 }
    });
  }, [isGrandFinale]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(251,191,36,0.3)] text-white relative"
      >
        {/* Animated Trophy / Star Badge */}
        <motion.div
          animate={isGrandFinale ? { rotate: [0, -10, 10, -10, 0] } : { scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 rounded-full flex items-center justify-center text-4xl font-black mx-auto mb-4 shadow-xl border-4 border-white"
        >
          {isGrandFinale ? "🏆" : "⭐"}
        </motion.div>

        {/* Title */}
        <h3 
          className="text-2xl sm:text-3xl font-black text-amber-300"
          style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
        >
          {isGrandFinale ? "MEADOW ARCHWAY RESTORED!" : "MISSION COMPLETE!"}
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1">
          {levelTitle} · <span className="text-emerald-300">{subrule}</span>
        </p>

        {/* Summary Card */}
        <div className="my-5 p-4 bg-slate-800/80 border border-slate-700 rounded-2xl flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>Cognitive Skill Learned:</span>
            <span className="font-black text-emerald-400">Pattern Recognition</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>XP Reward:</span>
            <span className="font-black text-amber-400">+{xpAward} XP</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Woodland Harmony:</span>
            <span className="font-black text-teal-300">+1 Forest Spark</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onNext}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 hover:from-emerald-300 hover:to-amber-200 text-slate-950 font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition active:scale-95"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
          >
            <span>{isGrandFinale ? "RETURN TO WORLD MAP 🌟" : "CONTINUE TO NEXT MISSION"}</span>
            <ArrowRight size={18} />
          </button>

          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-bold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Replay This Level</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
