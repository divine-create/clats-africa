import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, ArrowLeft, Check, Sparkles, Map, Trees } from "lucide-react";
import confetti from "canvas-confetti";
import { sfx } from "../../utils/audio";
import { F } from "../../utils/config";

// --- Game Data ---
type LevelId = "meadow" | "grove" | "trail" | "river" | "observatory" | "engine";

interface LevelData {
  id: LevelId;
  name: string;
  icon: string;
  color: string;
  locked: boolean;
  x: number; // percentage position on map
  y: number;
}

const LEVELS: LevelData[] = [
  { id: "meadow", name: "Pattern Meadow", icon: "🌱", color: "#10B981", locked: false, x: 20, y: 30 },
  { id: "grove", name: "Butterfly Grove", icon: "🦋", color: "#3B82F6", locked: true, x: 50, y: 15 },
  { id: "trail", name: "Animal Trail", icon: "🐾", color: "#F59E0B", locked: true, x: 75, y: 40 },
  { id: "river", name: "River of Repeats", icon: "🌊", color: "#06B6D4", locked: true, x: 60, y: 70 },
  { id: "observatory", name: "Night Observatory", icon: "🔭", color: "#8B5CF6", locked: true, x: 30, y: 80 },
  { id: "engine", name: "Pattern Engine", icon: "⚙️", color: "#EF4444", locked: true, x: 50, y: 50 },
];

// --- Level 1: Meadow Logic ---
type ShapeId = "red-circle" | "blue-square" | "green-triangle";

interface SequenceSlot {
  id: number;
  expected: ShapeId;
  filledWith: ShapeId | null;
  isMissing: boolean;
}

const MeadowLevel = ({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) => {
  const [sequence, setSequence] = useState<SequenceSlot[]>([]);
  const [options, setOptions] = useState<ShapeId[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // ABAB Pattern: Red Circle, Blue Square, Red Circle, [Blue Square]
    setSequence([
      { id: 1, expected: "red-circle", filledWith: "red-circle", isMissing: false },
      { id: 2, expected: "blue-square", filledWith: "blue-square", isMissing: false },
      { id: 3, expected: "red-circle", filledWith: "red-circle", isMissing: false },
      { id: 4, expected: "blue-square", filledWith: null, isMissing: true },
    ]);
    setOptions(["green-triangle", "blue-square", "red-circle"]);
    sfx.play("pop");
  }, []);

  const handleDrop = (e: React.DragEvent, targetSlotId: number) => {
    e.preventDefault();
    const draggedShapeId = e.dataTransfer.getData("shapeId") as ShapeId;
    
    setSequence((prev) => {
      const newSeq = prev.map(s => {
        if (s.id === targetSlotId && s.isMissing) {
          return { ...s, filledWith: draggedShapeId };
        }
        return s;
      });

      // Check win condition
      const allFilled = newSeq.every(s => !s.isMissing || s.filledWith !== null);
      const allCorrect = newSeq.every(s => s.expected === (s.isMissing ? s.filledWith : s.expected));
      
      if (allFilled) {
        if (allCorrect) {
          setIsSuccess(true);
          sfx.play("success");
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          setTimeout(() => onComplete(), 3000);
        } else {
          // Reset wrong
          sfx.play("error");
          setTimeout(() => {
            setSequence(p => p.map(x => x.id === targetSlotId ? { ...x, filledWith: null } : x));
          }, 800);
        }
      } else {
        sfx.play("pop");
      }
      return newSeq;
    });
  };

  const getShapeStyle = (id: ShapeId | null) => {
    if (!id) return {};
    if (id === "red-circle") return { backgroundColor: "#EF4444", borderRadius: "50%", width: 60, height: 60 };
    if (id === "blue-square") return { backgroundColor: "#3B82F6", borderRadius: "12px", width: 60, height: 60 };
    if (id === "green-triangle") return { 
      width: 0, height: 0, 
      borderLeft: "35px solid transparent", 
      borderRight: "35px solid transparent", 
      borderBottom: "60px solid #10B981" 
    };
    return {};
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative bg-gradient-to-b from-green-100 to-green-300 rounded-3xl overflow-hidden">
      <button onClick={onBack} className="absolute top-4 left-4 p-3 bg-white/50 hover:bg-white/80 rounded-full text-slate-700 transition">
        <ArrowLeft size={24} />
      </button>

      <div className="absolute top-10 flex flex-col items-center">
        <h2 className="text-3xl font-black text-green-800 drop-shadow-sm" style={{ fontFamily: F.display }}>Pattern Meadow</h2>
        <p className="text-green-700 font-bold bg-white/50 px-4 py-1 rounded-full mt-2">Fix the broken bridge to cross!</p>
      </div>

      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-10 top-1/3 bg-white p-6 rounded-3xl shadow-xl flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check size={40} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Bridge Repaired!</h3>
            <p className="text-slate-500 font-bold">You found the pattern rule!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Bridge (Sequence) */}
      <div className="flex gap-4 mb-20 p-8 bg-white/30 backdrop-blur-sm rounded-3xl border-4 border-white/40 shadow-lg mt-20">
        {sequence.map((slot) => (
          <div 
            key={slot.id}
            onDragOver={(e) => {
              if (slot.isMissing && !isSuccess) e.preventDefault();
            }}
            onDrop={(e) => handleDrop(e, slot.id)}
            className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all ${
              slot.isMissing && !slot.filledWith ? "bg-white/40 border-4 border-dashed border-white animate-pulse" : "bg-white/80"
            }`}
          >
            {slot.filledWith && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                style={getShapeStyle(slot.filledWith)}
              />
            )}
            {slot.isMissing && !slot.filledWith && (
              <span className="text-3xl opacity-30">?</span>
            )}
          </div>
        ))}
      </div>

      {/* Options Bank */}
      <div className="flex gap-6 mt-10">
        {options.map((opt, i) => (
          <motion.div 
            key={i}
            draggable={!isSuccess}
            onDragStart={(e: any) => {
              e.dataTransfer.setData("shapeId", opt);
              sfx.play("pop");
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-24 h-24 bg-white rounded-2xl shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing border-b-4 border-slate-200"
          >
            <div style={getShapeStyle(opt)} className="pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Main Game Component ---
export default function WonderWoods({ onExit }: { onExit?: () => void }) {
  const [activeScreen, setActiveScreen] = useState<"map" | "level">("map");
  const [currentLevel, setCurrentLevel] = useState<LevelId | null>(null);
  const [sparks, setSparks] = useState(0);

  const handleCompleteLevel = () => {
    sfx.play("reward");
    setSparks(s => s + 1);
    setActiveScreen("map");
    setCurrentLevel(null);
  };

  return (
    <div className="w-full h-full min-h-[600px] max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative bg-[#0B1120] border-4 border-slate-800">
      
      {/* HUD Header */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-xl">🦉</div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: F.display }}>Wonder Woods</h1>
            <p className="text-indigo-200 text-[10px] uppercase font-black">Pattern Quest</p>
          </div>
        </div>

        <div className="flex gap-3 pointer-events-auto">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
            <Sparkles className="text-amber-400" size={18} />
            <span className="text-white font-black">{sparks} / 5 Sparks</span>
          </div>
          {onExit && (
            <button onClick={onExit} className="bg-red-500/20 hover:bg-red-500/40 text-red-100 px-4 py-2 rounded-full transition font-bold text-sm">
              Exit Game
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeScreen === "map" && (
          <motion.div 
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full min-h-[600px] relative bg-slate-900"
          >
            {/* Fake Map Background */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/50 to-emerald-900/50" />

            {/* Map Nodes */}
            {LEVELS.map((level) => {
              const isPlayable = !level.locked || (sparks > 0 && level.id === "grove");
              return (
                <motion.div
                  key={level.id}
                  className="absolute"
                  style={{ left: `${level.x}%`, top: `${level.y}%`, transform: 'translate(-50%, -50%)' }}
                  whileHover={isPlayable ? { scale: 1.1 } : {}}
                  whileTap={isPlayable ? { scale: 0.95 } : {}}
                >
                  <button 
                    onClick={() => {
                      if (isPlayable) {
                        sfx.play("pop");
                        setCurrentLevel(level.id);
                        setActiveScreen("level");
                      }
                    }}
                    className={`relative group flex flex-col items-center ${isPlayable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 grayscale'}`}
                  >
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-xl border-4 transition-all"
                      style={{ 
                        backgroundColor: level.color, 
                        borderColor: isPlayable ? 'white' : '#475569',
                        boxShadow: isPlayable ? `0 0 20px ${level.color}` : 'none'
                      }}
                    >
                      {level.icon}
                    </div>
                    <span className="mt-3 bg-slate-800/80 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap border border-slate-700">
                      {level.name}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {activeScreen === "level" && currentLevel === "meadow" && (
          <motion.div 
            key="level"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full h-full min-h-[600px]"
          >
            <MeadowLevel 
              onBack={() => setActiveScreen("map")} 
              onComplete={handleCompleteLevel} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
