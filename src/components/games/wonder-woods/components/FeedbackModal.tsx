import React, { useEffect } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { Star, Award, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { sfx, companionVoice } from "../../../../utils/audio";

interface FeedbackModalProps {
  levelTitle: string;
  subrule: string;
  xpAward: number;
  starsEarned?: number;
  isGrandFinale?: boolean;
  isReplay?: boolean;
  companion?: "kobe" | "chibi";
  lang?: string;
  onNext: () => void;
  onReplay?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  levelTitle,
  subrule,
  xpAward,
  starsEarned = 3,
  isGrandFinale = false,
  isReplay = false,
  companion = "kobe",
  lang = "en",
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

    if (companionVoice.isNarrationEnabled("early explorers")) {
      const msg = isGrandFinale
        ? `Meadow Archway Restored! You earned ${starsEarned} stars and unlocked the Pattern Meadow Master badge! Butterfly Grove is now unlocked on your World Map!`
        : `Mission Complete! You earned ${starsEarned} stars on ${levelTitle} and mastered ${subrule}!`;
      const timer = setTimeout(() => {
        companionVoice.speakTTS(msg, companion, "early explorers", lang);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isGrandFinale, levelTitle, subrule, starsEarned, companion, lang]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(251,191,36,0.3)] text-white relative"
      >
        {/* Animated Trophy / Stars */}
        <div className="flex justify-center items-center gap-2 mb-3">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: s * 0.12 }}
            >
              <Star
                size={s === 2 ? 40 : 32}
                className={
                  s <= starsEarned
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                    : "fill-slate-800 text-slate-700"
                }
              />
            </motion.div>
          ))}
        </div>

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

        {/* Grand Finale Badge Callout */}
        {isGrandFinale && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="my-3 p-3 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 border-2 border-amber-400/60 rounded-2xl flex flex-col items-center gap-1 shadow-lg"
          >
            <div className="flex items-center gap-1.5 text-amber-300 font-black text-xs uppercase tracking-wider">
              <Award size={18} />
              <span>Badge Unlocked: Pattern Meadow Master</span>
            </div>
            <p className="text-[11px] text-teal-200 font-bold">
              🦋 Butterfly Grove is now UNLOCKED on your World Map!
            </p>
          </motion.div>
        )}

        {/* Summary Card */}
        <div className="my-4 p-4 bg-slate-800/80 border border-slate-700 rounded-2xl flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>Cognitive Skill Learned:</span>
            <span className="font-black text-emerald-400">Pattern Recognition</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>XP Reward:</span>
            <span className="font-black text-amber-400">
              {isReplay ? `+0 XP (Already Claimed)` : `+${xpAward} XP`}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Woodland Harmony:</span>
            <span className="font-black text-teal-300">
              {isReplay ? `⭐ Rating Updated` : `+1 Forest Spark`}
            </span>
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
            <span>{isGrandFinale ? "VIEW WORLD MAP 🌟" : "CONTINUE TO NEXT MISSION"}</span>
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
