import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Database, Cpu, AlertTriangle, ShieldCheck, ArrowLeft, Terminal, Zap } from "lucide-react";
import { sfx } from "../../utils/audio";
import { F } from "../../utils/config";

// --- Game Data ---
type ChamberId = "data-dock" | "anomaly-zone" | "ai-training";

interface ChamberData {
  id: ChamberId;
  name: string;
  icon: React.ReactNode;
  locked: boolean;
  desc: string;
}

const CHAMBERS: ChamberData[] = [
  { id: "data-dock", name: "Data Dock", icon: <Database size={32} />, locked: false, desc: "Analyze raw datasets and deduce classification rules." },
  { id: "anomaly-zone", name: "Anomaly Zone", icon: <AlertTriangle size={32} />, locked: true, desc: "Monitor smart city feeds and isolate irregular patterns." },
  { id: "ai-training", name: "AI Training Chamber", icon: <Cpu size={32} />, locked: true, desc: "Provide high-quality examples to train the core neural net." },
];

// --- Level 1: Data Dock Logic ---
const DataDockLevel = ({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const dataset = [
    { id: 1, shape: "Circle", color: "Blue", size: "Small", category: "A" },
    { id: 2, shape: "Circle", color: "Blue", size: "Large", category: "A" },
    { id: 3, shape: "Square", color: "Red", size: "Small", category: "B" },
    { id: 4, shape: "Triangle", color: "Red", size: "Large", category: "B" },
  ];

  const targetObject = { shape: "Square", color: "Blue", size: "Large" };

  const handleClassify = (cat: string) => {
    // The underlying rule is: Blue = A, Red = B
    if (cat === "A") {
      sfx.play("success");
      setIsSuccess(true);
      setTimeout(() => onComplete(), 3000);
    } else {
      sfx.play("error");
      setIsError(true);
      setTimeout(() => setIsError(false), 1000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-8 relative bg-[#090E17] text-cyan-50">
      <button onClick={onBack} className="absolute top-6 left-6 p-2 text-cyan-400 hover:text-cyan-300 transition">
        <ArrowLeft size={24} />
      </button>

      <div className="flex items-center gap-4 mb-8 ml-12">
        <Database size={40} className="text-cyan-500" />
        <div>
          <h2 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500" style={{ fontFamily: F.display }}>DATA DOCK // CLASSIFICATION</h2>
          <p className="text-cyan-700 font-mono text-sm uppercase">Objective: Deduce the hidden rule to classify the incoming packet.</p>
        </div>
      </div>

      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-10 top-1/3 left-1/2 -translate-x-1/2 bg-[#0A192F] border border-cyan-500 p-8 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col items-center text-center"
          >
            <ShieldCheck size={50} className="text-emerald-400 mb-4" />
            <h3 className="text-2xl font-black text-emerald-400 mb-2 font-mono">CLASSIFICATION ACCEPTED</h3>
            <p className="text-cyan-200">Rule deduced: Color dictates category.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-8 h-full">
        {/* Dataset Table */}
        <div className="flex-1 bg-[#0F172A] border border-slate-800 rounded-xl p-6 flex flex-col">
          <h3 className="text-cyan-500 font-mono text-sm mb-4 flex items-center gap-2"><Terminal size={16}/> HISTORICAL_DATASET.CSV</h3>
          <table className="w-full text-left font-mono text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="pb-2">Shape</th>
                <th className="pb-2">Color</th>
                <th className="pb-2">Size</th>
                <th className="pb-2 text-right">Category</th>
              </tr>
            </thead>
            <tbody>
              {dataset.map((row) => (
                <tr key={row.id} className="border-b border-slate-800/50">
                  <td className="py-3">{row.shape}</td>
                  <td className={`py-3 ${row.color === "Blue" ? "text-blue-400" : "text-red-400"}`}>{row.color}</td>
                  <td className="py-3">{row.size}</td>
                  <td className="py-3 text-right font-bold text-white">{row.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Incoming Packet */}
        <div className="flex-1 bg-[#0F172A] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.05)_50%)] bg-[length:100%_4px] pointer-events-none" />
          
          <h3 className="text-purple-400 font-mono text-sm mb-8 absolute top-6 left-6 flex items-center gap-2"><Activity size={16}/> INCOMING_PACKET</h3>
          
          <motion.div 
            animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={`w-full max-w-sm bg-[#1E293B] border ${isError ? 'border-red-500' : 'border-purple-500/50'} rounded-lg p-6 shadow-2xl mb-8`}
          >
            <div className="grid grid-cols-3 gap-4 mb-6 font-mono text-center">
              <div>
                <div className="text-slate-500 text-xs mb-1">SHAPE</div>
                <div className="text-white">{targetObject.shape}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">COLOR</div>
                <div className="text-blue-400">{targetObject.color}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">SIZE</div>
                <div className="text-white">{targetObject.size}</div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button 
                disabled={isSuccess}
                onClick={() => handleClassify("A")}
                className="flex-1 bg-[#0A192F] hover:bg-[#064E3B] border border-cyan-700 hover:border-emerald-500 text-cyan-100 py-3 rounded font-mono font-bold transition-all"
              >
                ASSIGN TO [A]
              </button>
              <button 
                disabled={isSuccess}
                onClick={() => handleClassify("B")}
                className="flex-1 bg-[#0A192F] hover:bg-[#4C1D95] border border-cyan-700 hover:border-purple-500 text-cyan-100 py-3 rounded font-mono font-bold transition-all"
              >
                ASSIGN TO [B]
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};


// --- Level 2: Anomaly Zone Logic ---
const AnomalyZoneLevel = ({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) => {
  const [anomalyTriggered, setAnomalyTriggered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Trigger anomaly after 4 seconds
    const timer = setTimeout(() => {
      setAnomalyTriggered(true);
      sfx.play("error"); // Alert sound
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleIsolate = (sensor: string) => {
    if (!anomalyTriggered) return;
    if (sensor === "water") {
      sfx.play("success");
      setIsSuccess(true);
      setTimeout(() => onComplete(), 3000);
    } else {
      sfx.play("error");
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-8 relative bg-[#090E17] text-cyan-50">
      <button onClick={onBack} className="absolute top-6 left-6 p-2 text-cyan-400 hover:text-cyan-300 transition z-50">
        <ArrowLeft size={24} />
      </button>

      <div className="flex items-center gap-4 mb-8 ml-12">
        <AlertTriangle size={40} className="text-amber-500" />
        <div>
          <h2 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500" style={{ fontFamily: F.display }}>ANOMALY ZONE // CITY MONITOR</h2>
          <p className="text-amber-700 font-mono text-sm uppercase">Objective: Monitor telemetry. Isolate any deviations from standard patterns.</p>
        </div>
      </div>

      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-50 top-1/3 left-1/2 -translate-x-1/2 bg-[#0A192F] border border-emerald-500 p-8 rounded-xl shadow-[0_0_40px_rgba(16,185,129,0.3)] flex flex-col items-center text-center"
          >
            <ShieldCheck size={50} className="text-emerald-400 mb-4" />
            <h3 className="text-2xl font-black text-emerald-400 mb-2 font-mono">ANOMALY ISOLATED</h3>
            <p className="text-emerald-200">Water pressure spike detected and contained.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-6 h-full">
        {/* Sensor 1: Traffic */}
        <div onClick={() => handleIsolate("traffic")} className="bg-[#0F172A] border border-slate-700 hover:border-cyan-500 rounded-xl p-6 flex flex-col cursor-pointer transition-all">
          <h3 className="text-cyan-500 font-mono text-sm mb-4 flex justify-between">
            <span>TRAFFIC_DENSITY</span>
            <span className="text-emerald-500">NOMINAL</span>
          </h3>
          <div className="flex-1 flex items-center justify-center gap-2">
            {[1,2,3,4,5].map(i => (
              <motion.div 
                key={i}
                animate={{ height: ["20%", "60%", "20%"] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-8 bg-cyan-900 rounded-t-sm"
              />
            ))}
          </div>
        </div>

        {/* Sensor 2: Power */}
        <div onClick={() => handleIsolate("power")} className="bg-[#0F172A] border border-slate-700 hover:border-cyan-500 rounded-xl p-6 flex flex-col cursor-pointer transition-all">
          <h3 className="text-cyan-500 font-mono text-sm mb-4 flex justify-between">
            <span>POWER_GRID</span>
            <span className="text-emerald-500">NOMINAL</span>
          </h3>
          <div className="flex-1 flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-4 border-dashed border-cyan-700 rounded-full flex items-center justify-center"
            >
              <Zap className="text-cyan-500" />
            </motion.div>
          </div>
        </div>

        {/* Sensor 3: Water (The Anomaly) */}
        <div onClick={() => handleIsolate("water")} className={`bg-[#0F172A] border ${anomalyTriggered && !isSuccess ? 'border-red-500 bg-red-950/20' : 'border-slate-700'} hover:border-cyan-500 rounded-xl p-6 flex flex-col cursor-pointer transition-all relative overflow-hidden`}>
          {anomalyTriggered && !isSuccess && (
            <motion.div 
              animate={{ opacity: [0, 0.2, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="absolute inset-0 bg-red-500 pointer-events-none"
            />
          )}
          <h3 className={`${anomalyTriggered && !isSuccess ? 'text-red-500' : 'text-cyan-500'} font-mono text-sm mb-4 flex justify-between`}>
            <span>WATER_PRESSURE</span>
            {anomalyTriggered && !isSuccess ? (
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="text-red-500 font-bold">CRITICAL SPIKE</motion.span>
            ) : (
              <span className="text-emerald-500">NOMINAL</span>
            )}
          </h3>
          <div className="flex-1 flex items-end justify-center gap-1">
            {[...Array(20)].map((_, i) => (
              <motion.div 
                key={i}
                animate={anomalyTriggered && !isSuccess ? { height: `${80 + Math.random() * 20}%`, backgroundColor: "#EF4444" } : { height: "30%", backgroundColor: "#0E7490" }}
                transition={anomalyTriggered && !isSuccess ? { duration: 0.1, repeat: Infinity } : { duration: 0 }}
                className="w-3 rounded-t-sm"
              />
            ))}
          </div>
        </div>

        {/* Sensor 4: Temp */}
        <div onClick={() => handleIsolate("temp")} className="bg-[#0F172A] border border-slate-700 hover:border-cyan-500 rounded-xl p-6 flex flex-col cursor-pointer transition-all">
          <h3 className="text-cyan-500 font-mono text-sm mb-4 flex justify-between">
            <span>CORE_TEMP</span>
            <span className="text-emerald-500">NOMINAL</span>
          </h3>
          <div className="flex-1 flex items-center justify-center font-mono text-5xl text-cyan-800">
            22.4°C
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Game Component ---
export default function TheSignalLab({ onExit }: { onExit?: () => void }) {
  const [activeScreen, setActiveScreen] = useState<"map" | "level">("map");
  const [currentChamber, setCurrentChamber] = useState<ChamberId | null>(null);
  const [rankXP, setRankXP] = useState(0);

  const handleCompleteChamber = () => {
    sfx.play("reward");
    setRankXP(xp => xp + 250);
    setActiveScreen("map");
    setCurrentChamber(null);
  };

  const getRank = () => {
    if (rankXP >= 500) return "Senior Analyst ⭐️⭐️";
    if (rankXP >= 250) return "Analyst ⭐️";
    return "Junior Analyst";
  };

  return (
    <div className="w-full h-full min-h-[600px] max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl relative bg-[#0B1120] border border-cyan-900/50">
      
      {/* HUD Header */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none border-b border-cyan-900/30 bg-[#0B1120]/80 backdrop-blur-md">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="w-10 h-10 bg-cyan-900/50 border border-cyan-500 flex items-center justify-center text-cyan-400">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-cyan-50 font-bold text-sm tracking-widest font-mono uppercase">The Signal Lab</h1>
            <p className="text-cyan-500 text-[10px] font-mono">SYS.VER_2.4.1 // ONLINE</p>
          </div>
        </div>

        <div className="flex gap-4 pointer-events-auto items-center">
          <div className="text-right font-mono hidden md:block">
            <div className="text-cyan-400 text-xs uppercase">Current Rank</div>
            <div className="text-cyan-50 text-sm font-bold">{getRank()}</div>
          </div>
          <div className="bg-[#0F172A] border border-cyan-800 px-4 py-2 flex items-center gap-3">
            <div className="text-cyan-500 font-mono text-xs">XP</div>
            <div className="text-cyan-50 font-mono font-bold">{rankXP}</div>
          </div>
          {onExit && (
            <button onClick={onExit} className="bg-red-950/40 hover:bg-red-900/60 border border-red-900 text-red-400 px-4 py-2 transition font-mono text-sm uppercase">
              Disconnect
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
            className="w-full h-full min-h-[600px] relative bg-[#090E17] pt-24 px-8 pb-8"
          >
            {/* Background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="max-w-4xl mx-auto h-full flex flex-col">
              <h2 className="text-cyan-500 font-mono text-sm mb-6 flex items-center gap-2"><Terminal size={16}/> SELECT_ACTIVE_TERMINAL</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                {CHAMBERS.map((chamber) => {
                  const isPlayable = !chamber.locked || (rankXP >= 250 && chamber.id === "anomaly-zone");
                  return (
                    <motion.div
                      key={chamber.id}
                      whileHover={isPlayable ? { scale: 1.02, y: -5 } : {}}
                      whileTap={isPlayable ? { scale: 0.98 } : {}}
                      className={`relative flex flex-col border ${isPlayable ? 'border-cyan-800 bg-[#0F172A] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer' : 'border-slate-800 bg-[#0B1120] opacity-60 cursor-not-allowed'} p-6 transition-all h-full`}
                      onClick={() => {
                        if (isPlayable) {
                          sfx.play("pop");
                          setCurrentChamber(chamber.id);
                          setActiveScreen("level");
                        }
                      }}
                    >
                      <div className={`w-12 h-12 mb-6 flex items-center justify-center ${isPlayable ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-600 bg-slate-900'}`}>
                        {chamber.icon}
                      </div>
                      <h3 className={`text-xl font-black mb-2 ${isPlayable ? 'text-cyan-50' : 'text-slate-500'}`} style={{ fontFamily: F.display }}>
                        {chamber.name}
                      </h3>
                      <p className={`text-sm font-mono leading-relaxed flex-1 ${isPlayable ? 'text-cyan-600/80' : 'text-slate-600'}`}>
                        {chamber.desc}
                      </p>

                      <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center font-mono text-xs uppercase">
                        <span className={isPlayable ? 'text-emerald-500' : 'text-red-500'}>
                          {isPlayable ? 'ONLINE' : 'LOCKED'}
                        </span>
                        {!isPlayable && chamber.id === "anomaly-zone" && (
                          <span className="text-slate-500">Requires Rank 1</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeScreen === "level" && currentChamber === "data-dock" && (
          <motion.div key="dd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full min-h-[600px] pt-20">
            <DataDockLevel onBack={() => setActiveScreen("map")} onComplete={handleCompleteChamber} />
          </motion.div>
        )}

        {activeScreen === "level" && currentChamber === "anomaly-zone" && (
          <motion.div key="az" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full min-h-[600px] pt-20">
            <AnomalyZoneLevel onBack={() => setActiveScreen("map")} onComplete={handleCompleteChamber} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
