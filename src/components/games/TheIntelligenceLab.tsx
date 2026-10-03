import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Network, Database, Cpu, Activity, AlertTriangle, CheckCircle, XCircle, ArrowLeft, Terminal, LayoutDashboard, BarChart3, Fingerprint } from "lucide-react";
import { sfx } from "../../utils/audio";
import { F } from "../../utils/config";

// --- Types ---
type MissionState = "hub" | "data-inspection" | "training" | "evaluation" | "bias-investigation" | "retraining" | "success";

interface DatasetRow {
  id: number;
  city: string;
  rainfall: number; // mm
  drainage: "Good" | "Poor";
  waterLevel: "Low" | "Medium" | "High";
  flood: boolean;
  isNew?: boolean;
}

// --- Mission: FloodWatch Logic ---
const FloodWatchMission = ({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) => {
  const [missionState, setMissionState] = useState<MissionState>("data-inspection");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [modelAccuracy, setModelAccuracy] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [dataset, setDataset] = useState<DatasetRow[]>([
    { id: 1, city: "Delta Sector", rainfall: 120, drainage: "Poor", waterLevel: "High", flood: true },
    { id: 2, city: "Highlands", rainfall: 40, drainage: "Good", waterLevel: "Low", flood: false },
    { id: 3, city: "River Basin", rainfall: 100, drainage: "Poor", waterLevel: "Medium", flood: true },
    { id: 4, city: "Metro Core", rainfall: 50, drainage: "Good", waterLevel: "Medium", flood: false },
  ]);

  const testLocation = { city: "Outpost 9", rainfall: 90, drainage: "Poor", waterLevel: "Medium" };
  const biasLocation = { city: "Desert Flats", rainfall: 10, drainage: "Poor", waterLevel: "Low" };

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  useEffect(() => {
    if (missionState === "data-inspection") addLog("MISSION START: FloodWatch initialized. Awaiting feature selection.");
  }, [missionState]);

  const toggleFeature = (feature: string) => {
    sfx.play("pop");
    setSelectedFeatures(prev => 
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const handleTrain = () => {
    if (selectedFeatures.length === 0) {
      sfx.play("error");
      addLog("ERROR: No features selected for training.");
      return;
    }
    sfx.playTap();
    setMissionState(missionState === "bias-investigation" ? "retraining" : "training");
    setTrainingProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setTrainingProgress(progress);
      if (progress % 30 === 0) sfx.play("pop");
      
      if (progress >= 100) {
        clearInterval(interval);
        sfx.play("success");
        if (missionState === "bias-investigation") {
          addLog("RETRAINING COMPLETE: Bias mitigated.");
          setMissionState("success");
          setTimeout(() => onComplete(), 4000);
        } else {
          addLog("TRAINING COMPLETE: Model compiled. Proceed to evaluation.");
          setMissionState("evaluation");
          // If they didn't select Rainfall, the model will be inaccurate
          setModelAccuracy(selectedFeatures.includes("rainfall") && selectedFeatures.includes("drainage") ? 92 : 45);
        }
      }
    }, 200);
  };

  const addBiasDataAndRetrain = () => {
    sfx.playTap();
    setDataset(prev => [...prev, { id: 5, city: biasLocation.city, rainfall: biasLocation.rainfall, drainage: biasLocation.drainage, waterLevel: biasLocation.waterLevel, flood: false, isNew: true }]);
    addLog("DATA ADDED: Desert Flats appended to training set to correct Overfitting on 'Drainage: Poor'.");
    setMissionState("bias-investigation"); // Ready to retrain
  };

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#0a0a0a] text-slate-300 font-mono relative overflow-hidden">
      {/* Background matrix effect */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)" }} />
      
      <div className="flex justify-between items-center mb-6 z-10 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded transition"><ArrowLeft size={20} /></button>
          <h2 className="text-xl font-bold text-emerald-500 flex items-center gap-2"><Network size={20}/> CLATS INTELLIGENCE NETWORK</h2>
        </div>
        <div className="bg-slate-900 px-4 py-1 text-xs border border-slate-800 flex items-center gap-2">
          <Activity size={14} className="text-blue-500 animate-pulse"/> OP: FLOOD_WATCH
        </div>
      </div>

      <div className="flex gap-6 h-full z-10 overflow-hidden">
        
        {/* LEFT PANEL: Workspace */}
        <div className="flex-[2] flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
          
          {/* STEP 1: Data Inspection */}
          <div className={`bg-[#111] border ${missionState === "data-inspection" ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-slate-800'} rounded-lg p-5 transition-all`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-emerald-400 font-bold flex items-center gap-2"><Database size={16}/> 1. DATA_HUB // FEATURE SELECTION</h3>
              {missionState === "data-inspection" && <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-1 rounded">ACTIVE</span>}
            </div>
            
            <p className="text-sm text-slate-400 mb-4">Inspect the historical telemetry. Select the critical FEATURES (columns) that cause a Flood to occur, then compile the model.</p>
            
            <div className="overflow-x-auto border border-slate-800 rounded mb-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-normal">Location</th>
                    <th className="p-3 border-l border-slate-800 cursor-pointer hover:bg-slate-800" onClick={() => missionState === "data-inspection" && toggleFeature('rainfall')}>
                      <div className="flex items-center justify-between">
                        Rainfall (mm)
                        <div className={`w-4 h-4 rounded-sm border ${selectedFeatures.includes('rainfall') ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'} flex items-center justify-center`}>
                          {selectedFeatures.includes('rainfall') && <CheckCircle size={12} className="text-slate-900"/>}
                        </div>
                      </div>
                    </th>
                    <th className="p-3 border-l border-slate-800 cursor-pointer hover:bg-slate-800" onClick={() => missionState === "data-inspection" && toggleFeature('drainage')}>
                      <div className="flex items-center justify-between">
                        Drainage
                        <div className={`w-4 h-4 rounded-sm border ${selectedFeatures.includes('drainage') ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'} flex items-center justify-center`}>
                          {selectedFeatures.includes('drainage') && <CheckCircle size={12} className="text-slate-900"/>}
                        </div>
                      </div>
                    </th>
                    <th className="p-3 border-l border-slate-800 cursor-pointer hover:bg-slate-800" onClick={() => missionState === "data-inspection" && toggleFeature('waterLevel')}>
                      <div className="flex items-center justify-between">
                        Water Level
                        <div className={`w-4 h-4 rounded-sm border ${selectedFeatures.includes('waterLevel') ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'} flex items-center justify-center`}>
                          {selectedFeatures.includes('waterLevel') && <CheckCircle size={12} className="text-slate-900"/>}
                        </div>
                      </div>
                    </th>
                    <th className="p-3 border-l border-slate-800 text-emerald-500">TARGET: Flood?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {dataset.map(row => (
                    <tr key={row.id} className={row.isNew ? "bg-blue-950/20" : ""}>
                      <td className="p-3 text-slate-500">{row.city} {row.isNew && <span className="text-blue-400 text-xs ml-2">NEW</span>}</td>
                      <td className={`p-3 border-l border-slate-800 ${selectedFeatures.includes('rainfall') ? 'text-emerald-100 bg-emerald-950/10' : ''}`}>{row.rainfall}</td>
                      <td className={`p-3 border-l border-slate-800 ${selectedFeatures.includes('drainage') ? 'text-emerald-100 bg-emerald-950/10' : ''}`}>{row.drainage}</td>
                      <td className={`p-3 border-l border-slate-800 ${selectedFeatures.includes('waterLevel') ? 'text-emerald-100 bg-emerald-950/10' : ''}`}>{row.waterLevel}</td>
                      <td className="p-3 border-l border-slate-800 font-bold">{row.flood ? <span className="text-red-400">YES</span> : <span className="text-slate-500">NO</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {missionState === "data-inspection" && (
              <button 
                onClick={handleTrain}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-3 rounded transition"
              >
                COMPILE & TRAIN MODEL
              </button>
            )}
          </div>

          {/* STEP 2: Training & Evaluation */}
          {(missionState === "training" || missionState === "evaluation" || missionState === "bias-investigation" || missionState === "retraining" || missionState === "success") && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-[#111] border ${missionState === "evaluation" || missionState === "bias-investigation" ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-slate-800'} rounded-lg p-5 transition-all`}
            >
              <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2"><Cpu size={16}/> 2. MODEL_LAB // EVALUATION</h3>
              
              {(missionState === "training" || missionState === "retraining") ? (
                <div className="py-8">
                  <div className="flex justify-between text-xs mb-2 text-slate-400">
                    <span>Training neural network... Epoch {Math.floor(trainingProgress / 10)}/10</span>
                    <span>{trainingProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded overflow-hidden">
                    <motion.div className="h-full bg-emerald-500" style={{ width: `${trainingProgress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Accuracy Stats */}
                  <div className="flex items-center gap-6 p-4 bg-slate-900 border border-slate-800 rounded">
                    <div className="text-center pr-6 border-r border-slate-800">
                      <div className="text-xs text-slate-500 mb-1">ACCURACY</div>
                      <div className={`text-3xl font-black ${modelAccuracy && modelAccuracy > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{modelAccuracy}%</div>
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="text-slate-400">Model successfully compiled using <span className="text-white">{selectedFeatures.length}</span> features.</p>
                      {modelAccuracy && modelAccuracy < 80 && (
                        <p className="text-amber-400 mt-1"><AlertTriangle size={14} className="inline mr-1"/> Warning: Missing critical features (Rainfall/Drainage). Model accuracy is low.</p>
                      )}
                    </div>
                  </div>

                  {/* Prediction Test */}
                  {modelAccuracy && modelAccuracy > 80 && (
                    <div className="border border-slate-800 rounded p-4">
                      <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">Test Scenario: {testLocation.city}</h4>
                      <div className="grid grid-cols-4 gap-2 text-sm mb-4">
                        <div className="bg-slate-900 p-2 rounded">Rain: {testLocation.rainfall}mm</div>
                        <div className="bg-slate-900 p-2 rounded">Drainage: {testLocation.drainage}</div>
                        <div className="bg-slate-900 p-2 rounded">Water: {testLocation.waterLevel}</div>
                        <div className="bg-emerald-950/50 border border-emerald-900 p-2 rounded text-emerald-400 font-bold text-center">Pred: FLOOD YES</div>
                      </div>
                      <p className="text-emerald-400 text-sm flex items-center gap-2"><CheckCircle size={16}/> Correct Prediction. City evacuated successfully.</p>
                    </div>
                  )}

                  {/* Bias Trigger */}
                  {modelAccuracy && modelAccuracy > 80 && missionState === "evaluation" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                      <div className="border border-red-900/50 bg-red-950/20 rounded p-4 mt-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                        <h4 className="text-xs font-bold text-red-400 mb-3 uppercase flex items-center gap-2"><AlertTriangle size={14}/> Bias Detection: False Positive</h4>
                        
                        <p className="text-sm text-slate-300 mb-3">
                          Model predicted <span className="text-red-400 font-bold">FLOOD YES</span> for <strong>{biasLocation.city}</strong>. 
                          Actual result: <span className="text-emerald-400 font-bold">NO FLOOD</span>.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-sm mb-4 opacity-70">
                          <div className="bg-slate-900 p-2 rounded text-amber-500 border border-amber-900">Rain: {biasLocation.rainfall}mm</div>
                          <div className="bg-slate-900 p-2 rounded border border-amber-900">Drainage: {biasLocation.drainage}</div>
                          <div className="bg-slate-900 p-2 rounded">Water: {biasLocation.waterLevel}</div>
                        </div>

                        <p className="text-sm text-slate-400 mb-4">
                          <strong>Analysis:</strong> The model overfitted to "Drainage: Poor". It assumed *all* poor drainage causes floods, because it had never seen a dry city with poor drainage in the training data!
                        </p>

                        <button 
                          onClick={addBiasDataAndRetrain}
                          className="bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded text-sm transition"
                        >
                          ADD DESERT FLATS TO TRAINING DATA
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {missionState === "bias-investigation" && (
                     <button 
                      onClick={handleTrain}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    >
                      RETRAIN NEURAL NETWORK
                    </button>
                  )}
                  
                  {missionState === "success" && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 bg-emerald-950/30 border border-emerald-500/50 rounded">
                      <Fingerprint size={48} className="text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-emerald-400 mb-2">MISSION ACCOMPLISHED</h3>
                      <p className="text-sm text-emerald-200/70">You successfully selected features, trained a predictive model, and mitigated data bias.</p>
                    </motion.div>
                  )}

                </div>
              )}
            </motion.div>
          )}

        </div>

        {/* RIGHT PANEL: Terminal Logs */}
        <div className="flex-1 bg-[#050505] border border-slate-800 rounded-lg flex flex-col">
          <div className="bg-slate-900 p-2 px-4 border-b border-slate-800 flex items-center gap-2">
            <Terminal size={14} className="text-slate-500"/>
            <span className="text-xs text-slate-500 font-bold">SYS_LOGS</span>
          </div>
          <div className="p-4 flex flex-col gap-2 overflow-y-auto text-xs text-slate-400 font-mono flex-1">
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes("ERROR") ? "text-red-400" : log.includes("COMPLETE") ? "text-emerald-400" : log.includes("DATA ADDED") ? "text-blue-400" : ""}`}>
                {log}
              </div>
            ))}
            {missionState === "training" || missionState === "retraining" ? (
              <div className="animate-pulse text-emerald-500">_PROCESSING_TENSORS...</div>
            ) : (
              <div className="animate-pulse">_</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Game Component ---
export default function TheIntelligenceLab({ onExit }: { onExit?: () => void }) {
  const [activeScreen, setActiveScreen] = useState<"hub" | "mission">("hub");

  return (
    <div className="w-full h-full min-h-[650px] max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl relative bg-[#09090b] border border-slate-800">
      
      <AnimatePresence mode="wait">
        {activeScreen === "hub" && (
          <motion.div 
            key="hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full min-h-[650px] p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-3" style={{ fontFamily: F.display }}><Network className="text-emerald-500"/> CLATS Intelligence Lab</h1>
                <p className="text-slate-400 font-mono mt-2">Welcome back, Data Engineer.</p>
              </div>
              {onExit && (
                <button onClick={onExit} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded transition font-mono text-sm">
                  Exit Session
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              
              {/* Active Mission */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => { sfx.playTap(); setActiveScreen("mission"); }}
                className="bg-emerald-950/20 border border-emerald-900/50 hover:border-emerald-500 p-8 rounded-xl cursor-pointer transition flex flex-col group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="bg-emerald-900/40 text-emerald-400 text-xs font-bold px-3 py-1 rounded inline-flex w-max mb-4 uppercase tracking-wider">Active Mission</div>
                <h2 className="text-2xl font-bold text-white mb-2 font-mono">OP: FLOOD_WATCH</h2>
                <p className="text-slate-400 text-sm mb-6 flex-1">Analyze environmental telemetry to train a predictive model identifying flood risks. Investigate and mitigate data bias.</p>
                <div className="flex items-center text-emerald-500 font-mono text-sm gap-2 font-bold group-hover:translate-x-2 transition-transform">
                  INITIALIZE KERNEL <ArrowLeft className="rotate-180" size={16}/>
                </div>
              </motion.div>

              {/* Locked Modules */}
              <div className="bg-[#111] border border-slate-800 p-8 rounded-xl flex flex-col opacity-50 grayscale cursor-not-allowed">
                <div className="bg-slate-800 text-slate-400 text-xs font-bold px-3 py-1 rounded inline-flex w-max mb-4 uppercase tracking-wider">Locked</div>
                <h2 className="text-2xl font-bold text-slate-300 mb-2 font-mono">OP: CROP_SHIELD</h2>
                <p className="text-slate-500 text-sm mb-6 flex-1">Utilize computer vision to classify drone imagery of agricultural sectors. Detect blight outbreaks.</p>
                <div className="flex items-center text-slate-500 font-mono text-sm gap-2 font-bold">
                  REQUIRES RANK 2
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {activeScreen === "mission" && (
          <motion.div key="mission" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full min-h-[650px]">
            <FloodWatchMission 
              onBack={() => setActiveScreen("hub")} 
              onComplete={() => { sfx.play("reward"); setActiveScreen("hub"); }} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
