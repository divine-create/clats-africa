import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Sparkles, MapPin, ArrowLeft, ChevronRight, Info } from "lucide-react";
import { RegionData, RegionId } from "../types";
import { WONDER_WOODS_REGIONS } from "../data/regions";
import { sfx } from "../../../../utils/audio";

interface WorldMapProps {
  onSelectRegion: (regionId: RegionId) => void;
  starsCollected: number;
  unlockedLevel: number;
  onBackToIntro: () => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  onSelectRegion,
  starsCollected,
  unlockedLevel,
  onBackToIntro
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);

  const handleRegionClick = (region: RegionData) => {
    if (region.isLocked) {
      sfx.play("error");
      setHoveredRegion(region);
    } else {
      sfx.play("pop");
      onSelectRegion(region.id);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-[#091124] via-[#0E1B38] to-[#0A1326] text-white rounded-3xl overflow-hidden relative min-h-[560px]">
      {/* Background cartography and starlight grid */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Map Header */}
      <div className="w-full flex justify-between items-center z-20 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-md">
        <button
          type="button"
          onClick={onBackToIntro}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>Intro</span>
        </button>

        <div className="text-center">
          <h2 
            className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
          >
            Wonder Woods World Map
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            6 Enchanted Pattern Realms
          </p>
        </div>

        <div className="bg-slate-800/90 border border-amber-400/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
          <Sparkles size={14} className="text-amber-400" />
          <span className="text-xs font-black text-amber-300">{starsCollected} / 10 ⭐</span>
        </div>
      </div>

      {/* Map Interactive Canvas */}
      <div className="relative flex-1 my-3 min-h-[380px] w-full">
        {/* SVG Decorative Winding Trail linking the 6 regions */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          <path
            d="M 18% 28% Q 32% 12%, 48% 18% T 78% 32% Q 85% 55%, 72% 68% T 48% 48% T 28% 72%"
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            strokeDasharray="8 8"
            className="animate-pulse"
          />
        </svg>

        {/* Region Nodes */}
        {WONDER_WOODS_REGIONS.map((region) => {
          const isPlayable = !region.isLocked;
          const isSelected = hoveredRegion?.id === region.id;

          return (
            <motion.div
              key={region.id}
              className="absolute z-20"
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                transform: "translate(-50%, -50%)"
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setHoveredRegion(region)}
            >
              <button
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`relative flex flex-col items-center group focus:outline-none ${
                  isPlayable ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                aria-label={`${region.name} - ${isPlayable ? "Playable" : "Locked"}`}
              >
                {/* Active beacon ripple for playable meadow */}
                {isPlayable && (
                  <div 
                    className="absolute -inset-2.5 rounded-full animate-ping opacity-30" 
                    style={{ backgroundColor: region.color }} 
                  />
                )}

                {/* Node Orb */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center text-2xl sm:text-3xl shadow-xl transition-all relative border-4 ${
                    isPlayable 
                      ? "border-white bg-slate-900 shadow-emerald-500/30" 
                      : "border-slate-700 bg-slate-900/90 opacity-70 grayscale-[30%]"
                  }`}
                  style={{
                    boxShadow: isPlayable ? `0 0 25px ${region.color}80` : "none"
                  }}
                >
                  <span className="drop-shadow">{region.icon}</span>

                  {/* Lock Indicator */}
                  {!isPlayable && (
                    <div className="absolute -bottom-1 -right-1 bg-slate-800 text-amber-400 border border-slate-600 rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                      <Lock size={11} />
                    </div>
                  )}

                  {/* Playable Star Count Badge */}
                  {isPlayable && (
                    <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full px-1.5 py-0.5 border border-white shadow">
                      PLAY
                    </div>
                  )}
                </div>

                {/* Node Tag */}
                <span 
                  className={`mt-2 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md border ${
                    isPlayable 
                      ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/50" 
                      : "bg-slate-900/90 text-slate-400 border-slate-700"
                  }`}
                >
                  {region.name}
                </span>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Dynamic Region Inspection Drawer / Tooltip */}
      <div className="z-20 w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md">
        {hoveredRegion ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-slate-800 rounded-2xl border border-slate-700">
                {hoveredRegion.icon}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white" style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}>
                    {hoveredRegion.name}
                  </h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    !hoveredRegion.isLocked 
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" 
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}>
                    {!hoveredRegion.isLocked ? "OPEN REGION" : "LOCKED"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {hoveredRegion.tagline} · <span className="text-slate-400">{hoveredRegion.unlockRequirement}</span>
                </p>
              </div>
            </div>

            {!hoveredRegion.isLocked && (
              <button
                type="button"
                onClick={() => onSelectRegion(hoveredRegion.id)}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <span>ENTER MEADOW MISSIONS</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium justify-center py-1">
            <Info size={16} className="text-teal-400" />
            <span>Tap <strong>Pattern Meadow</strong> to begin your 10-level challenge board!</span>
          </div>
        )}
      </div>
    </div>
  );
};
