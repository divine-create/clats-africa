import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Play, Sparkles, Compass, MapPin, ArrowRight, Volume2 } from "lucide-react";
import { MascotImage } from "../../../Onboarding";
import { sfx, companionVoice } from "../../../../utils/audio";
import type { PatternQuestRankInfo } from "../data/ranks";

interface IntroScreenProps {
  companion: "kobe" | "chibi";
  unlockedLevel: number;
  totalStars: number;
  totalSparks?: number;
  rank?: PatternQuestRankInfo;
  onStart: () => void;
  onOpenAchievements?: () => void;
  onExit?: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  companion,
  unlockedLevel,
  totalStars,
  totalSparks = 0,
  rank,
  onStart,
  onOpenAchievements,
  onExit
}) => {
  const hasProgress = unlockedLevel > 1 || totalStars > 0 || totalSparks > 0;
  const companionName = companion === "chibi" ? "Chibi" : "Kobe";

  const introSpeech = hasProgress
    ? `Welcome back to Pattern Quest: Wonder Woods! I am ${companionName}. You are a ${rank ? rank.name : "Pattern Explorer"} with ${totalStars} stars and ${totalSparks} Pattern Sparks! Meadow Level ${unlockedLevel} is ready. Tap Continue Adventure to play!`
    : `Welcome to Pattern Quest: Wonder Woods! I am ${companionName}, your woodland guide. Embark on an enchanted woodland journey! Discover secret repeating rhythms, earn Pattern Sparks, and master the ancient Pattern Engine! Tap Start Adventure to begin!`;

  useEffect(() => {
    if (companionVoice.isNarrationEnabled("early explorers")) {
      const timer = setTimeout(() => {
        companionVoice.speakTTS(introSpeech, companion, "early explorers", "en");
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [companion, hasProgress, totalStars, totalSparks, unlockedLevel, rank]);

  const handleStart = () => {
    sfx.play("pop");
    onStart();
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-6 sm:p-8 bg-gradient-to-b from-[#091024] via-[#0C1A3A] to-[#081226] text-white rounded-3xl overflow-hidden relative min-h-[550px]">
      {/* Background starlight & foliage textures */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3.5 py-1.5 rounded-full shadow-sm">
          <Sparkles size={16} className="text-amber-400" />
          <span className="text-xs font-black tracking-wide text-amber-200">
            Ages 6–10 · Flagship Adventure
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAchievements && (
            <button
              type="button"
              onClick={onOpenAchievements}
              className="text-xs font-black text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 px-3 py-1.5 rounded-full transition flex items-center gap-1.5"
              title="View Pattern Quest Achievements"
            >
              <span>🏆</span>
              <span>Achievements</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => companionVoice.speakTTS(introSpeech, companion, "early explorers", "en")}
            className="text-xs font-black text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 px-3 py-1.5 rounded-full transition flex items-center gap-1"
            title="Listen to Intro"
          >
            <Volume2 size={14} />
            <span>Listen</span>
          </button>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="text-xs font-bold text-slate-400 hover:text-rose-300 bg-slate-800/60 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 px-3 py-1.5 rounded-full transition"
            >
              Back to Arcade
            </button>
          )}
        </div>
      </div>

      {/* Hero Presentation */}
      <div className="my-auto flex flex-col items-center max-w-xl text-center z-10">
        {/* Companion Mascot Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative mb-4 cursor-pointer"
          onClick={() => companionVoice.speakTTS(introSpeech, companion, "early explorers", "en")}
          title={`Tap to hear ${companionName}`}
        >
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-300 p-1 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden p-2">
              <MascotImage character={companion} height={100} />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black border-2 border-white shadow-md">
            🔊 Guide {companionName}
          </div>
        </motion.div>

        {/* Title */}
        <h1 
          className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-amber-200 to-emerald-300 drop-shadow-sm leading-tight"
          style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
        >
          Pattern Quest: Wonder Woods
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 font-medium mt-2 max-w-md mx-auto leading-relaxed">
          Embark on an enchanted woodland journey! Discover secret repeating rhythms, classify creatures, and master the ancient Pattern Engine!
        </p>

        {/* Progress pill if existing */}
        {hasProgress && (
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-slate-800/90 border border-emerald-500/50 rounded-2xl px-4 py-2 shadow-inner text-xs">
            {rank && (
              <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-black flex items-center gap-1 ${rank.badgeBg}`}>
                <span>{rank.icon}</span>
                <span>{rank.name}</span>
              </span>
            )}
            <span className="text-amber-400 font-black">⭐ {totalStars} Stars</span>
            <span className="text-slate-500">|</span>
            <span className="text-teal-300 font-black">✨ {totalSparks} Pattern Sparks</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-300 font-black">Next: Level {unlockedLevel}</span>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="w-full max-w-sm flex flex-col gap-2.5 z-10">
        <motion.button
          type="button"
          onClick={handleStart}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="w-full py-4 bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 hover:from-emerald-300 hover:to-amber-200 text-slate-950 font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
          style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
        >
          <Play size={22} className="fill-slate-950" />
          <span>{hasProgress ? `CONTINUE ADVENTURE` : `START ADVENTURE`}</span>
          <ArrowRight size={20} />
        </motion.button>
      </div>
    </div>
  );
};
