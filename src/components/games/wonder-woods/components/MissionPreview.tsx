import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, FastForward, Sparkles, Eye, Lightbulb } from "lucide-react";
import { MissionPreviewConfig, PatternItem } from "../types";
import { TactileTile } from "./TactileTile";
import { sfx } from "../../../../utils/audio";

interface MissionPreviewProps {
  preview: MissionPreviewConfig;
  levelNumber: number;
  levelTitle: string;
  onPlay: () => void;
  onSkip?: () => void;
}

export const MissionPreview: React.FC<MissionPreviewProps> = ({
  preview,
  levelNumber,
  levelTitle,
  onPlay,
  onSkip
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isCompletedCycle, setIsCompletedCycle] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check user prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Timed animation sequence with cleanup
  useEffect(() => {
    if (reducedMotion) {
      setStepIndex(preview.demonstrationItems.length);
      setIsCompletedCycle(true);
      return;
    }

    setStepIndex(0);
    setIsCompletedCycle(false);

    const totalSteps = preview.demonstrationItems.length;
    const intervalTime = 750; // ms per item step

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        const next = prev + 1;
        if (next >= totalSteps) {
          clearInterval(interval);
          setIsCompletedCycle(true);
          sfx.play("pop");
          return totalSteps;
        }
        sfx.playTap();
        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [preview, reducedMotion]);

  const handleReplay = () => {
    sfx.play("pop");
    setStepIndex(0);
    setIsCompletedCycle(false);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-4 sm:p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl overflow-hidden relative min-h-[520px]">
      {/* Background magical firefly glows */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Header */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 rounded-full text-emerald-300 text-xs font-black">
          <Eye size={14} />
          <span>Mission Demo · Level {levelNumber}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Replay action */}
          <button
            type="button"
            onClick={handleReplay}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition text-xs font-bold flex items-center gap-1 shadow-md"
            title="Replay Demonstration"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">Replay</span>
          </button>

          {/* Skip action */}
          <button
            type="button"
            onClick={onSkip || onPlay}
            className="p-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-full transition text-xs font-black flex items-center gap-1 border border-amber-400/30"
            title="Skip directly to game"
          >
            <span>Skip</span>
            <FastForward size={14} />
          </button>
        </div>
      </div>

      {/* Demonstration Stage */}
      <div className="my-auto flex flex-col items-center max-w-2xl w-full z-10 px-2">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <span className="text-amber-400 text-xs font-black uppercase tracking-widest bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">
            💡 Watch Kobe's Secret Rule
          </span>
          <h3 
            className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-amber-200 to-emerald-300 mt-2"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
          >
            {preview.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg mx-auto font-medium">
            {preview.explanation}
          </p>
        </motion.div>

        {/* Dynamic Animation Sequence Visualizer */}
        <div className="w-full bg-slate-900/80 border-2 border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center backdrop-blur-md relative overflow-hidden">
          
          {/* Animated items track */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 my-3">
            {preview.demonstrationItems.map((item, idx) => {
              const isRevealed = stepIndex > idx;
              const isHighlight = preview.highlightIndex === idx && isCompletedCycle;

              return (
                <div key={idx} className="relative flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3, y: 20 }}
                    animate={isRevealed ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0.15, scale: 0.8, y: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="relative"
                  >
                    <TactileTile 
                      item={item} 
                      size="md" 
                      disabled 
                      state={isHighlight ? "selected" : "idle"}
                    />

                    {/* Glowing beacon for highlight target */}
                    {isHighlight && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute -top-3 -right-3 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-white"
                      >
                        MATCH!
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Step order indicator */}
                  <span className="text-[10px] font-black text-slate-500 mt-1.5">
                    #{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rule observation prompt */}
          <div className="mt-4 flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-4 py-2 rounded-2xl text-xs text-emerald-200 font-bold">
            <Lightbulb size={16} className="text-amber-400 flex-shrink-0" />
            <span>
              {isCompletedCycle 
                ? "See how the pattern repeats? Now it's your turn to play!" 
                : "Watch closely as each piece joins the pattern..."}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="w-full flex justify-center z-10 pt-2 pb-1">
        <motion.button
          type="button"
          onClick={onPlay}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-base rounded-2xl shadow-xl flex items-center gap-3 transition"
          style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
        >
          <Play size={20} className="fill-slate-950" />
          <span>LET'S PLAY LEVEL {levelNumber} 🚀</span>
        </motion.button>
      </div>
    </div>
  );
};
