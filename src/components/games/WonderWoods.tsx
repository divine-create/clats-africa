import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, ArrowLeft, Check, Sparkles, Map, Trees, Volume2, 
  RotateCcw, Award, Lock, Play, ChevronRight, RefreshCw
} from "lucide-react";
import confetti from "canvas-confetti";
import { sfx, companionVoice } from "../../utils/audio";
import { F, C } from "../../utils/config";

// --- Game Data Types ---
export type LevelId = "meadow" | "grove" | "trail" | "river" | "observatory" | "engine";

export interface LevelData {
  id: LevelId;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  requiredSparks: number;
  x: number; // percentage position on map
  y: number;
}

export const LEVELS: LevelData[] = [
  { id: "meadow", name: "Pattern Meadow", subtitle: "AB Alternating Shapes", icon: "🌱", color: "#10B981", requiredSparks: 0, x: 18, y: 32 },
  { id: "grove", name: "Butterfly Grove", subtitle: "ABC Color Dance", icon: "🦋", color: "#3B82F6", requiredSparks: 1, x: 42, y: 18 },
  { id: "trail", name: "Animal Trail", subtitle: "1-2-3-4 Growing Patterns", icon: "🐾", color: "#F59E0B", requiredSparks: 2, x: 74, y: 32 },
  { id: "river", name: "River of Repeats", subtitle: "AAB Stepping Stones", icon: "🌊", color: "#06B6D4", requiredSparks: 3, x: 68, y: 68 },
  { id: "observatory", name: "Night Observatory", subtitle: "Celestial Star Rules", icon: "🔭", color: "#8B5CF6", requiredSparks: 4, x: 26, y: 72 },
  { id: "engine", name: "Pattern Engine", subtitle: "Grand AI Core Synthesis", icon: "⚙️", color: "#EF4444", requiredSparks: 5, x: 48, y: 48 },
];

export interface WonderWoodsProps {
  onExit?: () => void;
  onRewardXP?: (xp: number) => void;
  companion?: "kobe" | "chibi";
  lang?: string;
  childId?: string;
}

// ==========================================
// LEVEL 1: PATTERN MEADOW (AB SHAPES)
// ==========================================
type ShapeId = "red-circle" | "blue-square" | "green-triangle";

interface MeadowSlot {
  id: number;
  expected: ShapeId;
  filledWith: ShapeId | null;
  isMissing: boolean;
}

const MeadowLevel = ({ 
  onComplete, 
  onBack,
  companion,
  lang 
}: { 
  onComplete: () => void; 
  onBack: () => void;
  companion: "kobe" | "chibi";
  lang: string;
}) => {
  const [sequence, setSequence] = useState<MeadowSlot[]>([]);
  const [options, setOptions] = useState<ShapeId[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const voiceHint = "Welcome to Pattern Meadow! Tap or drag the missing shape to complete the red circle and blue square pattern across the bridge!";

  useEffect(() => {
    setSequence([
      { id: 1, expected: "red-circle", filledWith: "red-circle", isMissing: false },
      { id: 2, expected: "blue-square", filledWith: "blue-square", isMissing: false },
      { id: 3, expected: "red-circle", filledWith: "red-circle", isMissing: false },
      { id: 4, expected: "blue-square", filledWith: null, isMissing: true },
    ]);
    setOptions(["green-triangle", "blue-square", "red-circle"]);
    sfx.play("pop");
  }, []);

  const handleSpeakHint = () => {
    companionVoice.speakTTS(voiceHint, companion, "early explorers", lang);
  };

  const fillSlot = (shape: ShapeId) => {
    if (isSuccess) return;
    const missingSlot = sequence.find(s => s.isMissing && !s.filledWith);
    if (!missingSlot) return;

    if (shape === missingSlot.expected) {
      setSequence(prev => prev.map(s => s.id === missingSlot.id ? { ...s, filledWith: shape } : s));
      setIsSuccess(true);
      sfx.play("success");
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      companionVoice.speakTTS("Spot on! Red Circle, Blue Square! The bridge is fixed!", companion, "early explorers", lang);
      setTimeout(() => onComplete(), 2400);
    } else {
      sfx.play("error");
      setSequence(prev => prev.map(s => s.id === missingSlot.id ? { ...s, filledWith: shape } : s));
      setTimeout(() => {
        setSequence(prev => prev.map(s => s.id === missingSlot.id ? { ...s, filledWith: null } : s));
      }, 700);
    }
  };

  const getShapeStyle = (id: ShapeId | null) => {
    if (!id) return {};
    if (id === "red-circle") return { backgroundColor: "#EF4444", borderRadius: "50%", width: 56, height: 56 };
    if (id === "blue-square") return { backgroundColor: "#3B82F6", borderRadius: "12px", width: 56, height: 56 };
    if (id === "green-triangle") return { 
      width: 0, height: 0, 
      borderLeft: "30px solid transparent", 
      borderRight: "30px solid transparent", 
      borderBottom: "54px solid #10B981" 
    };
    return {};
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-6 relative bg-gradient-to-b from-emerald-100 via-teal-50 to-emerald-200 rounded-3xl overflow-hidden min-h-[560px]">
      {/* Top Header */}
      <div className="w-full flex justify-between items-center z-10">
        <button onClick={onBack} className="p-3 bg-white/70 hover:bg-white rounded-full text-slate-700 shadow-md transition">
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-emerald-900 drop-shadow-sm" style={{ fontFamily: F.display }}>
            🌱 Level 1: Pattern Meadow
          </h2>
          <span className="text-xs font-bold text-emerald-700 bg-white/80 px-3 py-1 rounded-full shadow-sm">
            Alternating Pattern (AB · AB)
          </span>
        </div>
        <button 
          onClick={handleSpeakHint} 
          className="p-3 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-full shadow-md transition flex items-center gap-1 font-bold text-xs"
          title="Listen to hint"
        >
          <Volume2 size={18} />
          <span className="hidden sm:inline">Listen</span>
        </button>
      </div>

      {/* Voice Bubble */}
      <div className="bg-white/90 border-2 border-emerald-400 rounded-2xl p-3 px-5 shadow-sm max-w-lg text-center mt-2 flex items-center gap-3">
        <span className="text-2xl">{companion === "chibi" ? "🐥" : "🦁"}</span>
        <p className="text-xs sm:text-sm text-slate-800 font-semibold">
          Fix the stone bridge! Red Circle ➔ Blue Square ➔ Red Circle ➔ <strong>What is next?</strong>
        </p>
      </div>

      {/* Bridge Slots */}
      <div className="my-auto flex flex-col items-center">
        <div className="flex gap-3 sm:gap-4 p-5 bg-white/40 backdrop-blur-md rounded-3xl border-4 border-white/60 shadow-lg">
          {sequence.map((slot) => (
            <div 
              key={slot.id}
              onClick={() => {
                if (slot.isMissing && slot.filledWith && !isSuccess) {
                  sfx.play("pop");
                  setSequence(p => p.map(x => x.id === slot.id ? { ...x, filledWith: null } : x));
                }
              }}
              onDragOver={(e) => slot.isMissing && !isSuccess && e.preventDefault()}
              onDrop={(e) => {
                const shape = e.dataTransfer.getData("shapeId") as ShapeId;
                if (shape) fillSlot(shape);
              }}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center transition-all ${
                slot.isMissing && !slot.filledWith 
                  ? "bg-white/50 border-4 border-dashed border-emerald-400 animate-pulse cursor-pointer" 
                  : "bg-white/90 shadow-md"
              }`}
            >
              {slot.filledWith ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={getShapeStyle(slot.filledWith)} />
              ) : (
                <span className="text-2xl font-black text-emerald-600/40">?</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Shape Options Bank */}
      <div className="w-full flex flex-col items-center gap-2 z-10">
        <span className="text-emerald-900 text-xs font-black uppercase tracking-wider">
          Tap or drag a shape to place:
        </span>
        <div className="flex gap-4 sm:gap-6">
          {options.map((opt, i) => (
            <motion.div 
              key={i}
              draggable={!isSuccess}
              onDragStart={(e: any) => {
                e.dataTransfer.setData("shapeId", opt);
                sfx.play("pop");
              }}
              onClick={() => fillSlot(opt)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              className="w-18 h-18 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center cursor-pointer border-b-4 border-slate-300 hover:border-emerald-500 transition"
            >
              <div style={getShapeStyle(opt)} className="pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-30 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl border-4 border-emerald-400">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                ⭐
              </div>
              <h3 className="text-2xl font-black text-slate-800" style={{ fontFamily: F.display }}>Bridge Restored!</h3>
              <p className="text-xs text-slate-600 font-bold mt-1">You earned your 1st Forest Spark!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// LEVEL 2: BUTTERFLY GROVE (ABC COLOR PATTERNS)
// ==========================================
type ButterflyColor = "orange" | "blue" | "pink";

interface GroveSlot {
  id: number;
  expected: ButterflyColor;
  filledWith: ButterflyColor | null;
  isMissing: boolean;
}

const GroveLevel = ({ 
  onComplete, 
  onBack, 
  companion, 
  lang 
}: { 
  onComplete: () => void; 
  onBack: () => void;
  companion: "kobe" | "chibi";
  lang: string;
}) => {
  const [sequence, setSequence] = useState<GroveSlot[]>([]);
  const [options, setOptions] = useState<ButterflyColor[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const voiceHint = "Welcome to Butterfly Grove! The butterflies dance in a 3-part ABC pattern: Orange, Blue, Pink. What comes after Orange in the second dance?";

  useEffect(() => {
    setSequence([
      { id: 1, expected: "orange", filledWith: "orange", isMissing: false },
      { id: 2, expected: "blue", filledWith: "blue", isMissing: false },
      { id: 3, expected: "pink", filledWith: "pink", isMissing: false },
      { id: 4, expected: "orange", filledWith: "orange", isMissing: false },
      { id: 5, expected: "blue", filledWith: null, isMissing: true },
      { id: 6, expected: "pink", filledWith: "pink", isMissing: false },
    ]);
    setOptions(["pink", "blue", "orange"]);
    sfx.play("pop");
  }, []);

  const handleSpeakHint = () => {
    companionVoice.speakTTS(voiceHint, companion, "early explorers", lang);
  };

  const fillSlot = (color: ButterflyColor) => {
    if (isSuccess) return;
    const missingSlot = sequence.find(s => s.isMissing && !s.filledWith);
    if (!missingSlot) return;

    if (color === missingSlot.expected) {
      setSequence(prev => prev.map(s => s.id === missingSlot.id ? { ...s, filledWith: color } : s));
      setIsSuccess(true);
      sfx.play("success");
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      companionVoice.speakTTS("Hooray! The Sapphire Blue butterfly completes the dance!", companion, "early explorers", lang);
      setTimeout(() => onComplete(), 2400);
    } else {
      sfx.play("error");
      setSequence(prev => prev.map(s => s.id === missingSlot.id ? { ...s, filledWith: color } : s));
      setTimeout(() => {
        setSequence(prev => prev.map(s => s.id === missingSlot.id ? { ...s, filledWith: null } : s));
      }, 700);
    }
  };

  const getButterflyVisual = (color: ButterflyColor | null) => {
    if (color === "orange") return { emoji: "🦋", bg: "bg-amber-100 border-amber-400 text-amber-600", name: "Orange Monarch" };
    if (color === "blue") return { emoji: "🦋", bg: "bg-blue-100 border-blue-400 text-blue-600", name: "Sapphire Blue" };
    if (color === "pink") return { emoji: "🌸", bg: "bg-pink-100 border-pink-400 text-pink-500", name: "Pink Blossom" };
    return { emoji: "?", bg: "bg-white/50 border-dashed border-blue-300 text-slate-400", name: "Missing" };
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-6 relative bg-gradient-to-b from-sky-100 via-indigo-50 to-blue-200 rounded-3xl overflow-hidden min-h-[560px]">
      <div className="w-full flex justify-between items-center z-10">
        <button onClick={onBack} className="p-3 bg-white/70 hover:bg-white rounded-full text-slate-700 shadow-md transition">
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-blue-900 drop-shadow-sm" style={{ fontFamily: F.display }}>
            🦋 Level 2: Butterfly Grove
          </h2>
          <span className="text-xs font-bold text-blue-700 bg-white/80 px-3 py-1 rounded-full shadow-sm">
            Trio Repeating Pattern (ABC · ABC)
          </span>
        </div>
        <button 
          onClick={handleSpeakHint} 
          className="p-3 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-full shadow-md transition flex items-center gap-1 font-bold text-xs"
        >
          <Volume2 size={18} />
          <span className="hidden sm:inline">Listen</span>
        </button>
      </div>

      <div className="bg-white/90 border-2 border-blue-400 rounded-2xl p-3 px-5 shadow-sm max-w-lg text-center mt-2 flex items-center gap-3">
        <span className="text-2xl">🦋</span>
        <p className="text-xs sm:text-sm text-slate-800 font-semibold">
          Orange ➔ Blue ➔ Pink, then Orange ➔ <strong>?</strong> ➔ Pink! Which butterfly dances next?
        </p>
      </div>

      {/* Sequence Row */}
      <div className="my-auto flex flex-col items-center w-full px-2">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-4 bg-white/40 backdrop-blur-md rounded-3xl border-4 border-white/60 shadow-lg">
          {sequence.map((slot) => {
            const visual = getButterflyVisual(slot.filledWith);
            return (
              <div 
                key={slot.id}
                onClick={() => {
                  if (slot.isMissing && slot.filledWith && !isSuccess) {
                    sfx.play("pop");
                    setSequence(p => p.map(x => x.id === slot.id ? { ...x, filledWith: null } : x));
                  }
                }}
                className={`w-14 h-16 sm:w-20 sm:h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${visual.bg} ${
                  slot.isMissing && !slot.filledWith ? "animate-pulse border-4 cursor-pointer" : "shadow-md"
                }`}
              >
                <span className="text-2xl sm:text-3xl">{visual.emoji}</span>
                <span className="text-[10px] font-bold mt-1 text-slate-700 hidden sm:block">
                  {slot.filledWith ? visual.name.split(" ")[0] : "?"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <div className="w-full flex flex-col items-center gap-2 z-10">
        <span className="text-blue-900 text-xs font-black uppercase tracking-wider">
          Choose the next dancing friend:
        </span>
        <div className="flex gap-4">
          {options.map((opt, i) => {
            const visual = getButterflyVisual(opt);
            return (
              <motion.button 
                key={i}
                onClick={() => fillSlot(opt)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 shadow-lg flex flex-col items-center justify-center cursor-pointer transition ${visual.bg} bg-white`}
              >
                <span className="text-3xl sm:text-4xl">{visual.emoji}</span>
                <span className="text-[11px] font-bold text-slate-800 mt-1">{visual.name.split(" ")[0]}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Success */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-30 bg-blue-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl border-4 border-blue-400">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                🦋
              </div>
              <h3 className="text-2xl font-black text-slate-800" style={{ fontFamily: F.display }}>Grove Harmony Restored!</h3>
              <p className="text-xs text-slate-600 font-bold mt-1">You unlocked your 2nd Spark!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// LEVEL 3: ANIMAL TRAIL (GROWING NUMERICAL PATTERN)
// ==========================================
interface TrailSlot {
  id: number;
  count: number;
  isMissing: boolean;
  filledWith: number | null;
}

const TrailLevel = ({ 
  onComplete, 
  onBack, 
  companion, 
  lang 
}: { 
  onComplete: () => void; 
  onBack: () => void;
  companion: "kobe" | "chibi";
  lang: string;
}) => {
  const [sequence, setSequence] = useState<TrailSlot[]>([]);
  const [options, setOptions] = useState<number[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const voiceHint = "Welcome to Animal Trail! Look closely at the golden acorns left on the trail: 1 acorn, 2 acorns, then what? Count the growing pattern!";

  useEffect(() => {
    setSequence([
      { id: 1, count: 1, isMissing: false, filledWith: 1 },
      { id: 2, count: 2, isMissing: false, filledWith: 2 },
      { id: 3, count: 3, isMissing: true, filledWith: null },
      { id: 4, count: 4, isMissing: false, filledWith: 4 },
    ]);
    setOptions([5, 3, 2]);
    sfx.play("pop");
  }, []);

  const handleSpeakHint = () => {
    companionVoice.speakTTS(voiceHint, companion, "early explorers", lang);
  };

  const fillSlot = (count: number) => {
    if (isSuccess) return;
    const missing = sequence.find(s => s.isMissing && !s.filledWith);
    if (!missing) return;

    if (count === missing.count) {
      setSequence(prev => prev.map(s => s.id === missing.id ? { ...s, filledWith: count } : s));
      setIsSuccess(true);
      sfx.play("success");
      confetti({ particleCount: 85, spread: 65, origin: { y: 0.6 } });
      companionVoice.speakTTS("Brilliant counting! 1, 2, 3, 4! In AI, recognizing numbers that grow is how robots predict the future!", companion, "early explorers", lang);
      setTimeout(() => onComplete(), 2500);
    } else {
      sfx.play("error");
      setSequence(prev => prev.map(s => s.id === missing.id ? { ...s, filledWith: count } : s));
      setTimeout(() => {
        setSequence(prev => prev.map(s => s.id === missing.id ? { ...s, filledWith: null } : s));
      }, 700);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-6 relative bg-gradient-to-b from-amber-100 via-orange-50 to-amber-200 rounded-3xl overflow-hidden min-h-[560px]">
      <div className="w-full flex justify-between items-center z-10">
        <button onClick={onBack} className="p-3 bg-white/70 hover:bg-white rounded-full text-slate-700 shadow-md transition">
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-amber-900 drop-shadow-sm" style={{ fontFamily: F.display }}>
            🐾 Level 3: Animal Trail
          </h2>
          <span className="text-xs font-bold text-amber-800 bg-white/80 px-3 py-1 rounded-full shadow-sm">
            Growing Count Pattern (+1 Progression)
          </span>
        </div>
        <button 
          onClick={handleSpeakHint} 
          className="p-3 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-full shadow-md transition flex items-center gap-1 font-bold text-xs"
        >
          <Volume2 size={18} />
          <span className="hidden sm:inline">Listen</span>
        </button>
      </div>

      <div className="bg-white/90 border-2 border-amber-400 rounded-2xl p-3 px-5 shadow-sm max-w-lg text-center mt-2 flex items-center gap-3">
        <span className="text-2xl">🐿️</span>
        <p className="text-xs sm:text-sm text-slate-800 font-semibold">
          Count the acorns: 1 Acorn ➔ 2 Acorns ➔ <strong>?</strong> ➔ 4 Acorns! What fits the blank?
        </p>
      </div>

      {/* Acorn Progression */}
      <div className="my-auto flex flex-col items-center">
        <div className="flex gap-3 sm:gap-4 p-5 bg-white/40 backdrop-blur-md rounded-3xl border-4 border-white/60 shadow-lg">
          {sequence.map((slot) => (
            <div 
              key={slot.id}
              onClick={() => {
                if (slot.isMissing && slot.filledWith && !isSuccess) {
                  sfx.play("pop");
                  setSequence(p => p.map(x => x.id === slot.id ? { ...x, filledWith: null } : x));
                }
              }}
              className={`w-20 h-24 sm:w-26 sm:h-32 rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all ${
                slot.isMissing && !slot.filledWith 
                  ? "bg-amber-100 border-4 border-dashed border-amber-500 animate-pulse cursor-pointer" 
                  : "bg-white/90 border-amber-300 shadow-md"
              }`}
            >
              {slot.filledWith ? (
                <div className="flex flex-col items-center">
                  <div className="flex flex-wrap justify-center gap-1 max-w-[70px]">
                    {Array.from({ length: slot.filledWith }).map((_, idx) => (
                      <span key={idx} className="text-xl sm:text-2xl">🌰</span>
                    ))}
                  </div>
                  <span className="text-xs font-black text-amber-900 mt-2">{slot.filledWith} Acorns</span>
                </div>
              ) : (
                <span className="text-3xl font-black text-amber-500/50">?</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="w-full flex flex-col items-center gap-2 z-10">
        <span className="text-amber-900 text-xs font-black uppercase tracking-wider">
          Tap the matching basket:
        </span>
        <div className="flex gap-4 sm:gap-6">
          {options.map((opt, i) => (
            <motion.button 
              key={i}
              onClick={() => fillSlot(opt)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              className="bg-white px-5 py-3 rounded-2xl shadow-lg border-b-4 border-amber-300 hover:border-amber-500 flex flex-col items-center gap-1 transition"
            >
              <div className="flex gap-1">
                {Array.from({ length: opt }).map((_, idx) => (
                  <span key={idx} className="text-xl">🌰</span>
                ))}
              </div>
              <span className="text-xs font-black text-slate-800">{opt} Acorns</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Success */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-30 bg-amber-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl border-4 border-amber-400">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                🐾
              </div>
              <h3 className="text-2xl font-black text-slate-800" style={{ fontFamily: F.display }}>Animal Trail Conquered!</h3>
              <p className="text-xs text-slate-600 font-bold mt-1">3 Sparks collected! Halfway to the Engine!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// LEVEL 4: RIVER OF REPEATS (AAB RHYTHMIC PATTERNS)
// ==========================================
type RiverItem = "frog" | "lily" | "fish";

interface RiverSlot {
  id: number;
  expected: RiverItem;
  filledWith: RiverItem | null;
  isMissing: boolean;
}

const RiverLevel = ({ 
  onComplete, 
  onBack, 
  companion, 
  lang 
}: { 
  onComplete: () => void; 
  onBack: () => void;
  companion: "kobe" | "chibi";
  lang: string;
}) => {
  const [sequence, setSequence] = useState<RiverSlot[]>([]);
  const [options, setOptions] = useState<RiverItem[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const voiceHint = "Welcome to River of Repeats! Cross the stepping stones by listening to the rhythm: Frog, Frog, Lily Pad! Can you complete the second pair of frogs?";

  useEffect(() => {
    setSequence([
      { id: 1, expected: "frog", filledWith: "frog", isMissing: false },
      { id: 2, expected: "frog", filledWith: "frog", isMissing: false },
      { id: 3, expected: "lily", filledWith: "lily", isMissing: false },
      { id: 4, expected: "frog", filledWith: "frog", isMissing: false },
      { id: 5, expected: "frog", filledWith: null, isMissing: true },
      { id: 6, expected: "lily", filledWith: "lily", isMissing: false },
    ]);
    setOptions(["lily", "frog", "fish"]);
    sfx.play("pop");
  }, []);

  const handleSpeakHint = () => {
    companionVoice.speakTTS(voiceHint, companion, "early explorers", lang);
  };

  const fillSlot = (item: RiverItem) => {
    if (isSuccess) return;
    const missing = sequence.find(s => s.isMissing && !s.filledWith);
    if (!missing) return;

    if (item === missing.expected) {
      setSequence(prev => prev.map(s => s.id === missing.id ? { ...s, filledWith: item } : s));
      setIsSuccess(true);
      sfx.play("success");
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      companionVoice.speakTTS("Ribbit! You paired the frogs together! Frog, Frog, Lily Pad!", companion, "early explorers", lang);
      setTimeout(() => onComplete(), 2400);
    } else {
      sfx.play("error");
      setSequence(prev => prev.map(s => s.id === missing.id ? { ...s, filledWith: item } : s));
      setTimeout(() => {
        setSequence(prev => prev.map(s => s.id === missing.id ? { ...s, filledWith: null } : s));
      }, 700);
    }
  };

  const getVisual = (item: RiverItem | null) => {
    if (item === "frog") return { icon: "🐸", name: "Frog Ribbit" };
    if (item === "lily") return { icon: "🪷", name: "Water Lily" };
    if (item === "fish") return { icon: "🐟", name: "River Fish" };
    return { icon: "?", name: "Missing" };
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-6 relative bg-gradient-to-b from-cyan-100 via-teal-50 to-blue-200 rounded-3xl overflow-hidden min-h-[560px]">
      <div className="w-full flex justify-between items-center z-10">
        <button onClick={onBack} className="p-3 bg-white/70 hover:bg-white rounded-full text-slate-700 shadow-md transition">
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-cyan-950 drop-shadow-sm" style={{ fontFamily: F.display }}>
            🌊 Level 4: River of Repeats
          </h2>
          <span className="text-xs font-bold text-cyan-800 bg-white/80 px-3 py-1 rounded-full shadow-sm">
            Rhythmic Loop Pattern (AAB · AAB)
          </span>
        </div>
        <button 
          onClick={handleSpeakHint} 
          className="p-3 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-full shadow-md transition flex items-center gap-1 font-bold text-xs"
        >
          <Volume2 size={18} />
          <span className="hidden sm:inline">Listen</span>
        </button>
      </div>

      <div className="bg-white/90 border-2 border-cyan-400 rounded-2xl p-3 px-5 shadow-sm max-w-lg text-center mt-2 flex items-center gap-3">
        <span className="text-2xl">🐸</span>
        <p className="text-xs sm:text-sm text-slate-800 font-semibold">
          Frog ➔ Frog ➔ Lily Pad! Then Frog ➔ <strong>?</strong> ➔ Lily Pad! Hop across the river!
        </p>
      </div>

      {/* Stepping Stones */}
      <div className="my-auto flex flex-col items-center w-full px-2">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-4 bg-cyan-900/10 backdrop-blur-md rounded-3xl border-4 border-cyan-300/40 shadow-lg">
          {sequence.map((slot) => {
            const vis = getVisual(slot.filledWith);
            return (
              <div 
                key={slot.id}
                onClick={() => {
                  if (slot.isMissing && slot.filledWith && !isSuccess) {
                    sfx.play("pop");
                    setSequence(p => p.map(x => x.id === slot.id ? { ...x, filledWith: null } : x));
                  }
                }}
                className={`w-14 h-16 sm:w-20 sm:h-24 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
                  slot.isMissing && !slot.filledWith 
                    ? "bg-cyan-200/50 border-4 border-dashed border-cyan-500 animate-pulse cursor-pointer" 
                    : "bg-white shadow-md border-cyan-200"
                }`}
              >
                <span className="text-2xl sm:text-3xl">{vis.icon}</span>
                <span className="text-[10px] font-bold text-slate-600 mt-1 hidden sm:block">
                  {slot.filledWith ? vis.name.split(" ")[0] : "?"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <div className="w-full flex flex-col items-center gap-2 z-10">
        <span className="text-cyan-950 text-xs font-black uppercase tracking-wider">
          Tap the matching stone to step:
        </span>
        <div className="flex gap-4">
          {options.map((opt, i) => {
            const vis = getVisual(opt);
            return (
              <motion.button 
                key={i}
                onClick={() => fillSlot(opt)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl shadow-lg border-b-4 border-cyan-300 hover:border-cyan-500 flex flex-col items-center justify-center gap-1 transition"
              >
                <span className="text-3xl sm:text-4xl">{vis.icon}</span>
                <span className="text-xs font-black text-slate-800">{vis.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Success */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-30 bg-cyan-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl border-4 border-cyan-400">
              <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                🌊
              </div>
              <h3 className="text-2xl font-black text-slate-800" style={{ fontFamily: F.display }}>River Crossed!</h3>
              <p className="text-xs text-slate-600 font-bold mt-1">4 Sparks earned! Only 1 more spark to wake the Engine!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// LEVEL 5: NIGHT OBSERVATORY (CELESTIAL RULES)
// ==========================================
type CelestialItem = "star" | "planet" | "moon";

interface ObservatorySlot {
  id: number;
  expected: CelestialItem;
  filledWith: CelestialItem | null;
  isMissing: boolean;
}

const ObservatoryLevel = ({ 
  onComplete, 
  onBack, 
  companion, 
  lang 
}: { 
  onComplete: () => void; 
  onBack: () => void;
  companion: "kobe" | "chibi";
  lang: string;
}) => {
  const [sequence, setSequence] = useState<ObservatorySlot[]>([]);
  const [options, setOptions] = useState<CelestialItem[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const voiceHint = "Welcome to Night Observatory! The ancient stars align in a special constellation rule: Star, Planet, Moon! What finishes the night sky?";

  useEffect(() => {
    setSequence([
      { id: 1, expected: "star", filledWith: "star", isMissing: false },
      { id: 2, expected: "planet", filledWith: "planet", isMissing: false },
      { id: 3, expected: "moon", filledWith: "moon", isMissing: false },
      { id: 4, expected: "star", filledWith: "star", isMissing: false },
      { id: 5, expected: "planet", filledWith: "planet", isMissing: false },
      { id: 6, expected: "moon", filledWith: null, isMissing: true },
    ]);
    setOptions(["moon", "star", "planet"]);
    sfx.play("pop");
  }, []);

  const handleSpeakHint = () => {
    companionVoice.speakTTS(voiceHint, companion, "early explorers", lang);
  };

  const fillSlot = (item: CelestialItem) => {
    if (isSuccess) return;
    const missing = sequence.find(s => s.isMissing && !s.filledWith);
    if (!missing) return;

    if (item === missing.expected) {
      setSequence(prev => prev.map(s => s.id === missing.id ? { ...s, filledWith: item } : s));
      setIsSuccess(true);
      sfx.play("success");
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      companionVoice.speakTTS("Incredible stargazing! The Silver Moon completes the cosmic constellation! All 5 sparks collected!", companion, "early explorers", lang);
      setTimeout(() => onComplete(), 2500);
    } else {
      sfx.play("error");
      setSequence(prev => prev.map(s => s.id === missing.id ? { ...s, filledWith: item } : s));
      setTimeout(() => {
        setSequence(prev => prev.map(s => s.id === missing.id ? { ...s, filledWith: null } : s));
      }, 700);
    }
  };

  const getVisual = (item: CelestialItem | null) => {
    if (item === "star") return { icon: "⭐", name: "Gold Star" };
    if (item === "planet") return { icon: "🪐", name: "Saturn Planet" };
    if (item === "moon") return { icon: "🌙", name: "Silver Moon" };
    return { icon: "?", name: "Missing" };
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-6 relative bg-gradient-to-b from-slate-950 via-indigo-950 to-purple-950 rounded-3xl overflow-hidden min-h-[560px] text-white">
      {/* Background Starfield */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-400 via-transparent to-transparent pointer-events-none" />

      <div className="w-full flex justify-between items-center z-10">
        <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white shadow-md transition">
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-purple-200 drop-shadow-sm" style={{ fontFamily: F.display }}>
            🔭 Level 5: Night Observatory
          </h2>
          <span className="text-xs font-bold text-purple-300 bg-purple-900/60 px-3 py-1 rounded-full border border-purple-500/40">
            Celestial Constellation Rules
          </span>
        </div>
        <button 
          onClick={handleSpeakHint} 
          className="p-3 bg-purple-500 hover:bg-purple-400 text-white rounded-full shadow-md transition flex items-center gap-1 font-bold text-xs"
        >
          <Volume2 size={18} />
          <span className="hidden sm:inline">Listen</span>
        </button>
      </div>

      <div className="bg-slate-900/80 border-2 border-purple-500/50 rounded-2xl p-3 px-5 shadow-sm max-w-lg text-center mt-2 flex items-center gap-3">
        <span className="text-2xl">✨</span>
        <p className="text-xs sm:text-sm text-purple-200 font-semibold">
          Star ➔ Planet ➔ Moon! Then Star ➔ Planet ➔ <strong>?</strong>. Complete the constellation!
        </p>
      </div>

      {/* Constellation Sequence */}
      <div className="my-auto flex flex-col items-center w-full px-2 z-10">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-4 bg-indigo-900/30 backdrop-blur-md rounded-3xl border-4 border-indigo-500/30 shadow-2xl">
          {sequence.map((slot) => {
            const vis = getVisual(slot.filledWith);
            return (
              <div 
                key={slot.id}
                onClick={() => {
                  if (slot.isMissing && slot.filledWith && !isSuccess) {
                    sfx.play("pop");
                    setSequence(p => p.map(x => x.id === slot.id ? { ...x, filledWith: null } : x));
                  }
                }}
                className={`w-14 h-16 sm:w-20 sm:h-24 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
                  slot.isMissing && !slot.filledWith 
                    ? "bg-purple-500/20 border-4 border-dashed border-purple-400 animate-pulse cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                    : "bg-slate-800/80 shadow-md border-purple-400/40"
                }`}
              >
                <span className="text-2xl sm:text-3xl">{vis.icon}</span>
                <span className="text-[10px] font-bold text-purple-200 mt-1 hidden sm:block">
                  {slot.filledWith ? vis.name.split(" ")[0] : "?"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <div className="w-full flex flex-col items-center gap-2 z-10">
        <span className="text-purple-300 text-xs font-black uppercase tracking-wider">
          Tap the missing celestial body:
        </span>
        <div className="flex gap-4">
          {options.map((opt, i) => {
            const vis = getVisual(opt);
            return (
              <motion.button 
                key={i}
                onClick={() => fillSlot(opt)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-900/90 rounded-2xl shadow-lg border-2 border-purple-500/60 hover:border-purple-300 flex flex-col items-center justify-center gap-1 transition"
              >
                <span className="text-3xl sm:text-4xl">{vis.icon}</span>
                <span className="text-xs font-bold text-purple-200">{vis.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Success */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-30 bg-purple-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 rounded-3xl p-8 max-w-sm text-center shadow-2xl border-4 border-purple-500">
              <div className="w-16 h-16 bg-purple-500/20 text-purple-300 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                🔭
              </div>
              <h3 className="text-2xl font-black text-white" style={{ fontFamily: F.display }}>Constellation Aligned!</h3>
              <p className="text-xs text-purple-300 font-bold mt-1">ALL 5 SPARKS EARNED! The Pattern Engine is now UNLOCKED!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// LEVEL 6: THE PATTERN ENGINE (GRAND FINAL BOSS)
// ==========================================
interface EngineConduit {
  id: number;
  label: string;
  pattern: string[];
  expected: string;
  options: string[];
  filledWith: string | null;
}

const EngineLevel = ({ 
  onComplete, 
  onBack, 
  companion, 
  lang 
}: { 
  onComplete: () => void; 
  onBack: () => void;
  companion: "kobe" | "chibi";
  lang: string;
}) => {
  const [conduits, setConduits] = useState<EngineConduit[]>([
    {
      id: 1,
      label: "Conduit 1: Color Core",
      pattern: ["🔴", "🟡", "🔴", "?"],
      expected: "🟡",
      options: ["🟢", "🟡", "🟣"],
      filledWith: null,
    },
    {
      id: 2,
      label: "Conduit 2: Shape Rotor",
      pattern: ["⚙️", "💎", "⚙️", "?"],
      expected: "💎",
      options: ["⚙️", "💎", "🪵"],
      filledWith: null,
    },
    {
      id: 3,
      label: "Conduit 3: Energy Frequency",
      pattern: ["⚡", "⚡", "🌟", "⚡", "?"],
      expected: "⚡",
      options: ["⚡", "🌟", "💧"],
      filledWith: null,
    },
  ]);

  const [activeConduitIndex, setActiveConduitIndex] = useState(0);
  const [isVictory, setIsVictory] = useState(false);

  const voiceHint = "You made it to the ancient Pattern Engine! Power up all 3 conduits by solving their pattern rules to wake up the Wonder Woods AI Brain!";

  const handleSpeakHint = () => {
    companionVoice.speakTTS(voiceHint, companion, "early explorers", lang);
  };

  const handleSelectOption = (opt: string) => {
    if (isVictory) return;
    const current = conduits[activeConduitIndex];
    if (opt === current.expected) {
      sfx.play("pop");
      const updated = conduits.map((c, idx) => idx === activeConduitIndex ? { ...c, filledWith: opt } : c);
      setConduits(updated);

      if (activeConduitIndex < conduits.length - 1) {
        setActiveConduitIndex(i => i + 1);
      } else {
        // Grand Victory!
        setIsVictory(true);
        sfx.play("reward");
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        setTimeout(() => {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.3 } });
        }, 600);
        companionVoice.speakTTS("VICTORY! The magical Pattern Engine is fully online! You are a certified Young AI Pioneer!", companion, "early explorers", lang);
      }
    } else {
      sfx.play("error");
    }
  };

  const current = conduits[activeConduitIndex];

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-6 relative bg-gradient-to-b from-slate-900 via-rose-950 to-slate-950 rounded-3xl overflow-hidden min-h-[560px] text-white">
      <div className="w-full flex justify-between items-center z-10">
        <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white shadow-md transition">
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-rose-300 drop-shadow-sm" style={{ fontFamily: F.display }}>
            ⚙️ Level 6: The Pattern Engine
          </h2>
          <span className="text-xs font-bold text-rose-300 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-500/40">
            Grand AI Core Synthesis
          </span>
        </div>
        <button 
          onClick={handleSpeakHint} 
          className="p-3 bg-rose-500 hover:bg-rose-400 text-white rounded-full shadow-md transition flex items-center gap-1 font-bold text-xs"
        >
          <Volume2 size={18} />
          <span className="hidden sm:inline">Listen</span>
        </button>
      </div>

      {/* Engine Status Header */}
      <div className="flex gap-2 sm:gap-4 my-2">
        {conduits.map((c, idx) => (
          <div 
            key={c.id} 
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              c.filledWith 
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300" 
                : idx === activeConduitIndex 
                  ? "bg-rose-500/30 border-rose-400 text-rose-200 animate-pulse" 
                  : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
          >
            <span>{c.filledWith ? "✓" : `${idx + 1}`}</span>
            <span className="hidden sm:inline">{c.label.split(":")[0]}</span>
          </div>
        ))}
      </div>

      {/* Active Conduit Visual Area */}
      {!isVictory && (
        <div className="my-auto flex flex-col items-center w-full max-w-lg z-10">
          <div className="bg-slate-950/80 border-2 border-rose-500/40 rounded-3xl p-6 w-full text-center shadow-2xl">
            <h4 className="text-rose-200 font-black text-sm uppercase tracking-wider mb-4">
              {current.label}
            </h4>
            
            <div className="flex justify-center items-center gap-3 sm:gap-4 mb-6">
              {current.pattern.map((symbol, idx) => (
                <div 
                  key={idx}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl border-2 ${
                    symbol === "?" 
                      ? "bg-rose-500/20 border-dashed border-rose-400 animate-bounce" 
                      : "bg-slate-800 border-slate-600 shadow-inner"
                  }`}
                >
                  {symbol}
                </div>
              ))}
            </div>

            <p className="text-xs text-rose-300 font-semibold mb-4">
              Select the energy rune that completes this conduit rule:
            </p>

            <div className="flex justify-center gap-4">
              {current.options.map((opt, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleSelectOption(opt)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-900 to-slate-800 border-2 border-rose-400/60 rounded-2xl text-3xl sm:text-4xl flex items-center justify-center shadow-lg hover:border-rose-300 transition"
                >
                  {opt}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grand Victory Screen */}
      <AnimatePresence>
        {isVictory && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            className="my-auto z-30 bg-slate-950/95 border-4 border-amber-400 rounded-3xl p-8 max-w-md text-center shadow-[0_0_50px_rgba(251,191,36,0.3)]"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-rose-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 shadow-xl"
            >
              ⚙️
            </motion.div>

            <h3 className="text-3xl font-black text-amber-300 mb-2" style={{ fontFamily: F.display }}>
              PATTERN ENGINE ONLINE!
            </h3>
            
            <p className="text-sm text-slate-200 font-semibold mb-6">
              You synthesized all 6 pattern rules and restored power to the Wonder Woods! The AI brain has officially been awakened!
            </p>

            <div className="bg-amber-400/10 border border-amber-400/40 rounded-2xl p-4 mb-6">
              <span className="text-amber-400 font-black text-xl">🏆 +200 XP REWARD</span>
              <p className="text-xs text-amber-200 mt-1">Master of Patterns Badge Unlocked!</p>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
              style={{ fontFamily: F.display }}
            >
              CLAIM YOUR REWARDS 🌟
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// MAIN WONDER WOODS COMPONENT
// ==========================================
export default function WonderWoods({ 
  onExit, 
  onRewardXP, 
  companion = "kobe", 
  lang = "en",
  childId = "default"
}: WonderWoodsProps) {
  const [activeScreen, setActiveScreen] = useState<"map" | "level">("map");
  const [currentLevel, setCurrentLevel] = useState<LevelId | null>(null);

  // Sparks stored in localStorage so young learners don't lose progress
  const [sparks, setSparks] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`clats_wonder_woods_sparks_${childId}`);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const saveSparks = (newSparks: number) => {
    setSparks(newSparks);
    try {
      localStorage.setItem(`clats_wonder_woods_sparks_${childId}`, String(newSparks));
    } catch {}
  };

  const handleCompleteCurrentLevel = () => {
    sfx.play("reward");
    const nextSparks = Math.min(6, sparks + 1);
    saveSparks(nextSparks);

    if (currentLevel === "engine") {
      onRewardXP?.(200);
      try {
        localStorage.setItem(`clats_wonder_woods_completed_${childId}`, "true");
      } catch {}
    }

    setActiveScreen("map");
    setCurrentLevel(null);
  };

  const handleResetQuest = () => {
    sfx.play("pop");
    saveSparks(0);
    setActiveScreen("map");
    setCurrentLevel(null);
  };

  return (
    <div className="w-full h-full min-h-[620px] max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative bg-[#090E17] border-4 border-slate-800 flex flex-col">
      {/* Top HUD Bar */}
      <div className="w-full p-4 flex justify-between items-center z-40 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-xl shadow-md">
            🌳
          </div>
          <div>
            <h1 className="text-white font-black text-sm tracking-wide" style={{ fontFamily: F.display }}>
              Pattern Quest
            </h1>
            <p className="text-emerald-400 text-[10px] uppercase font-black">
              The Wonder Woods (Ages 6–10)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sparks Counter */}
          <div className="bg-slate-800/90 px-3.5 py-1.5 rounded-full border border-slate-700 flex items-center gap-2">
            <Sparkles className="text-amber-400" size={16} />
            <span className="text-white text-xs font-black">{sparks} / 6 Sparks</span>
          </div>

          {/* Reset progress button */}
          {sparks > 0 && activeScreen === "map" && (
            <button
              onClick={handleResetQuest}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
              title="Reset Quest Progress"
            >
              <RefreshCw size={16} />
            </button>
          )}

          {/* Exit Game */}
          {onExit && (
            <button 
              onClick={onExit} 
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3.5 py-1.5 rounded-full transition font-bold text-xs"
            >
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Screen Views */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {/* MAP SCREEN */}
          {activeScreen === "map" && (
            <motion.div 
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full min-h-[550px] relative bg-slate-950 flex flex-col justify-between p-6 overflow-hidden"
            >
              {/* Whimsical Background Art */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/40 via-slate-950 to-indigo-950/40" />

              {/* Map Title Header */}
              <div className="relative z-10 text-center mt-2">
                <span className="text-amber-400 text-xs font-black uppercase tracking-widest bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">
                  🌟 Enchanted Map
                </span>
                <h3 className="text-2xl font-black text-white mt-1.5" style={{ fontFamily: F.display }}>
                  Select a Wonder Woods Zone
                </h3>
                <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto mt-1">
                  Collect all 5 sparks from the forest zones to unlock and restore the ancient Pattern Engine!
                </p>
              </div>

              {/* Interactive Nodes Container */}
              <div className="relative flex-1 min-h-[380px] my-4">
                {LEVELS.map((level, idx) => {
                  const isUnlocked = sparks >= level.requiredSparks;
                  const isCompleted = sparks > level.requiredSparks;

                  return (
                    <motion.div
                      key={level.id}
                      className="absolute z-20 cursor-pointer"
                      style={{ 
                        left: `${level.x}%`, 
                        top: `${level.y}%`, 
                        transform: "translate(-50%, -50%)" 
                      }}
                      whileHover={isUnlocked ? { scale: 1.12 } : {}}
                      whileTap={isUnlocked ? { scale: 0.95 } : {}}
                      onClick={() => {
                        if (isUnlocked) {
                          sfx.play("pop");
                          setCurrentLevel(level.id);
                          setActiveScreen("level");
                        } else {
                          sfx.play("error");
                        }
                      }}
                    >
                      <div className={`relative flex flex-col items-center group ${isUnlocked ? "cursor-pointer" : "cursor-not-allowed opacity-50 grayscale"}`}>
                        {/* Glow halo for current next level */}
                        {sparks === level.requiredSparks && (
                          <div 
                            className="absolute -inset-2 rounded-full animate-ping opacity-30" 
                            style={{ backgroundColor: level.color }}
                          />
                        )}

                        <div 
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-2xl border-4 transition-all relative"
                          style={{ 
                            backgroundColor: isUnlocked ? level.color : "#1e293b", 
                            borderColor: isCompleted ? "#FBBF24" : isUnlocked ? "white" : "#475569",
                            boxShadow: isUnlocked ? `0 0 25px ${level.color}80` : "none"
                          }}
                        >
                          {isUnlocked ? level.icon : <Lock size={20} className="text-slate-400" />}

                          {isCompleted && (
                            <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-white">
                              ✓
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex flex-col items-center">
                          <span className="bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border border-slate-700 shadow-md">
                            {level.name}
                          </span>
                          {!isUnlocked && (
                            <span className="text-[9px] text-amber-400 font-bold mt-0.5">
                              Needs {level.requiredSparks} ⭐
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Map Footer Helper */}
              <div className="relative z-10 flex justify-between items-center bg-slate-900/80 border border-slate-800 rounded-2xl p-3 px-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{companion === "chibi" ? "🐥" : "🦁"}</span>
                  <span className="text-slate-300 font-semibold">
                    {sparks === 0 && "Start at Pattern Meadow to gather your first spark!"}
                    {sparks > 0 && sparks < 5 && `Great job! You have ${sparks} sparks! Keep advancing towards the Engine!`}
                    {sparks === 5 && "All 5 sparks collected! The Pattern Engine is ready to activate!"}
                    {sparks >= 6 && "Master of Patterns! You conquered Wonder Woods!"}
                  </span>
                </div>
                <span className="text-amber-400 font-black">
                  {Math.round((sparks / 6) * 100)}% Complete
                </span>
              </div>
            </motion.div>
          )}

          {/* LEVEL SCREENS */}
          {activeScreen === "level" && (
            <motion.div 
              key={currentLevel}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full min-h-[550px]"
            >
              {currentLevel === "meadow" && (
                <MeadowLevel 
                  onComplete={handleCompleteCurrentLevel} 
                  onBack={() => setActiveScreen("map")} 
                  companion={companion} 
                  lang={lang} 
                />
              )}
              {currentLevel === "grove" && (
                <GroveLevel 
                  onComplete={handleCompleteCurrentLevel} 
                  onBack={() => setActiveScreen("map")} 
                  companion={companion} 
                  lang={lang} 
                />
              )}
              {currentLevel === "trail" && (
                <TrailLevel 
                  onComplete={handleCompleteCurrentLevel} 
                  onBack={() => setActiveScreen("map")} 
                  companion={companion} 
                  lang={lang} 
                />
              )}
              {currentLevel === "river" && (
                <RiverLevel 
                  onComplete={handleCompleteCurrentLevel} 
                  onBack={() => setActiveScreen("map")} 
                  companion={companion} 
                  lang={lang} 
                />
              )}
              {currentLevel === "observatory" && (
                <ObservatoryLevel 
                  onComplete={handleCompleteCurrentLevel} 
                  onBack={() => setActiveScreen("map")} 
                  companion={companion} 
                  lang={lang} 
                />
              )}
              {currentLevel === "engine" && (
                <EngineLevel 
                  onComplete={handleCompleteCurrentLevel} 
                  onBack={() => setActiveScreen("map")} 
                  companion={companion} 
                  lang={lang} 
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
