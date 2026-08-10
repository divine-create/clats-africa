/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Sparkles, User, Monitor, ChevronRight, CheckCircle2 } from "lucide-react";
import { CLATSLogo } from "./CLATSLogo";

interface OnboardingProps {
  onSelectRole: (role: "parent" | "child") => void;
  lang: string;
  initialStep?: number;
  theme?: "light" | "dark";
}

interface MascotImageProps {
  character: "kobe" | "chibi";
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
}

export const MascotImage: React.FC<MascotImageProps> = ({ character, className = "", style = {}, height = 140 }) => {
  const initialUrl = character === "kobe" 
    ? "/assets/input_file_0.png"
    : "/assets/input_file_1.png";

  const [imgSrc, setImgSrc] = useState<string>(initialUrl);
  const [retryStage, setRetryStage] = useState(0);

  const handleImgError = () => {
    if (retryStage === 0) {
      setImgSrc(character === "kobe" ? "/input_file_0.png" : "/input_file_1.png");
      setRetryStage(1);
    } else if (retryStage === 1) {
      setImgSrc(character === "kobe" ? "./assets/input_file_0.png" : "./assets/input_file_1.png");
      setRetryStage(2);
    } else {
      setImgSrc("");
    }
  };

  if (!imgSrc) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-900 rounded-full border border-slate-700 font-bold"
        style={{ width: height, height: height, fontSize: typeof height === 'number' ? (height as number) * 0.45 : '2rem', ...style }}
      >
        {character === "kobe" ? "👦🏾" : "👧🏾"}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={character === "kobe" ? "Kobe Mascot" : "Chibi Mascot"}
      onError={handleImgError}
      referrerPolicy="no-referrer"
      style={{
        height: height,
        alignSelf: "center",
        objectFit: "contain",
        display: "block",
        ...style
      }}
      className={className}
    />
  );
};

export const Onboarding: React.FC<OnboardingProps> = ({ onSelectRole, lang, initialStep = 1, theme }) => {
  const [step, setStep] = useState(initialStep);
  const [selectedQuizIndex, setSelectedQuizIndex] = useState<number | null>(null);
  const isDark = theme === "dark";

  const [particles, setParticles] = useState<{
    id: number;
    x: string;
    y: string;
    color: string;
    delay: string;
    size: number;
    type: "circle" | "square";
  }[]>([]);

  useEffect(() => {
    setParticles([]);
    setSelectedQuizIndex(null);
  }, [step]);

  const handleQuizSelection = (index: number) => {
    setSelectedQuizIndex(index);
    const isCorrect = index === 0;

    // Generate custom premium confetti particles bursting from the center of the quiz component
    const tempParticles = [];
    const particleCount = 38;
    const colors = isCorrect
      ? ["#10B981", "#34D399", "#2EC4B6", "#059669", "#6EE7B7", "#0ea5e9"] // Vibrant greens, teals & sky
      : ["#EF4444", "#F87171", "#DC2626", "#FCA5A5", "#F43F5E", "#ea580c"]; // Vibrant reds, roses & orange

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * 360;
      const distance = 40 + Math.random() * 110;
      const size = 5 + Math.random() * 8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const delay = Math.random() * 0.12;

      tempParticles.push({
        id: Math.random() + i,
        x: `${Math.cos((angle * Math.PI) / 180) * distance}px`,
        y: `${Math.sin((angle * Math.PI) / 180) * distance}px`,
        color,
        delay: `${delay}s`,
        size,
        type: Math.random() > 0.5 ? "circle" : "square" as any
      });
    }

    setParticles([]);
    setTimeout(() => {
      setParticles(tempParticles);
    }, 10);
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const skipOnboarding = () => {
    setStep(4);
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0F172A] text-slate-100" : "bg-[#F8FAFC] text-slate-800"} flex flex-col items-center justify-between p-6 md:p-8 selection:bg-cyan-500/30 transition-colors duration-300`}>
      
      {/* Dynamic Keyframe Injection for animations */}
      <style>{`
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes shine {
          0% { background-position: -200% 0%; }
          100% { background-position: 200% 0%; }
        }
        @keyframes confetti-burst {
          0% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--tx), var(--ty), 0) scale(0) rotate(var(--rot));
            opacity: 0;
          }
        }
        .animate-float {
          animation: subtle-float 4s ease-in-out infinite;
        }
        .card-glow-kobe {
          box-shadow: 0 4px 20px -2px rgba(25, 198, 198, 0.15);
        }
        .card-glow-chibi {
          box-shadow: 0 4px 20px -2px rgba(122, 111, 240, 0.15);
        }
      `}</style>

      {/* Top Header */}
      <div className="w-full max-w-md flex justify-between items-center py-2">
        <CLATSLogo height={32} />
        {step < 4 && (
          <button
            onClick={skipOnboarding}
            className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400 hover:text-slate-200 bg-slate-800 border-slate-700" : "text-slate-500 hover:text-slate-800 bg-white border-slate-200"} transition-all duration-200 px-3 py-1.5 border rounded-full shadow-sm cursor-pointer`}
          >
            Skip
          </button>
        )}
      </div>

      {/* Main Container Column */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-center py-6">
        
        {/* STEP 1: WELCOME SCREEN (KOBE & CHIBI TOGETHER) */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center space-y-6 animate-[fadeIn_0.4s_ease-out]">
            
            {/* Elegant Side-by-Side Character Display Cards */}
            <div className="flex items-center justify-center space-x-5 py-4 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-violet-500/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Kobe Frame Card */}
              <div className={`animate-float relative ${isDark ? "bg-gradient-to-b from-cyan-950/40 to-slate-800 border-slate-800 shadow-none" : "bg-gradient-to-b from-[#E0FDFD] to-white border-white shadow-xl"} p-3 pb-2 rounded-2xl border-4 card-glow-kobe w-[140px] transform hover:rotate-[-2deg] transition-all duration-300`}>
                <div className={`flex items-center justify-center h-[145px] overflow-hidden rounded-xl ${isDark ? "bg-cyan-950/30" : "bg-[#F0FFFF]"}`}>
                  <MascotImage character="kobe" height={135} className="mt-2" />
                </div>
                <div className="text-center mt-2">
                  <span className={`font-bold text-xs ${isDark ? "text-cyan-300 bg-cyan-950/80" : "text-cyan-900 bg-cyan-400/20"} px-2.5 py-0.5 rounded-full`}>
                    Kobe
                  </span>
                </div>
              </div>

              {/* Chibi Frame Card */}
              <div className={`animate-float relative ${isDark ? "bg-gradient-to-b from-violet-950/40 to-slate-800 border-slate-800 shadow-none" : "bg-gradient-to-b from-[#F3F0FF] to-white border-white shadow-xl"} p-3 pb-2 rounded-2xl border-4 card-glow-chibi w-[140px] transform hover:rotate-[2deg] transition-all duration-300`} style={{ animationDelay: "0.4s" }}>
                <div className={`flex items-center justify-center h-[145px] overflow-hidden rounded-xl ${isDark ? "bg-violet-950/30" : "bg-[#FAF5FF]"}`}>
                  <MascotImage character="chibi" height={130} className="mt-3" />
                </div>
                <div className="text-center mt-2">
                  <span className={`font-bold text-xs ${isDark ? "text-violet-300 bg-violet-950/80" : "text-violet-900 bg-violet-400/20"} px-2.5 py-0.5 rounded-full`}>
                    Chibi
                  </span>
                </div>
              </div>

            </div>

            {/* Typography */}
            <div className="space-y-3 px-4">
              <h2 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"} leading-tight`}>
                Welcome to <span className="text-[#19C6C6]">CLATS</span>
              </h2>
              <p className={`text-sm md:text-base ${isDark ? "text-slate-300" : "text-slate-600"} leading-relaxed max-w-xs mx-auto`}>
                Learn AI, technology, creativity, and future-ready skills through fun lessons, games, and challenges.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: LEARN THROUGH PLAY (KOBE IN LEARNING MODULE MOCKUP) */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center space-y-6 animate-[fadeIn_0.4s_ease-out]">
            
            {/* Simulated Interactive Tech Lesson Layout with Kobe */}
            <div className="flex flex-col items-center h-48 w-full py-2 relative">
              <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className={`flex items-center space-x-3 w-full border ${isDark ? "bg-[#1E293B] border-slate-850" : "bg-white border-slate-200"} rounded-2xl p-4 shadow-lg max-w-sm relative`}>
                
                {/* Character Thumbnail */}
                <div className={`flex-none ${isDark ? "bg-gradient-to-b from-cyan-950/40 to-slate-800 border-slate-700" : "bg-gradient-to-b from-[#E0FDFD] to-white border-cyan-100"} p-1 rounded-xl border shadow-sm transform rotate-[-3deg] w-20`}>
                  <div className={`rounded-lg overflow-hidden h-[75px] flex items-center justify-center ${isDark ? "bg-cyan-950/20" : "bg-[#F0FFFF]"}`}>
                    <MascotImage character="kobe" height={68} className="mt-1" />
                  </div>
                </div>

                {/* Simulated Quiz Frame */}
                <div className="flex-1 text-left space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest">Kobe's AI Intro</span>
                    <Sparkles size={10} className="text-yellow-500 fill-current" />
                  </div>
                  <p className={`text-[11px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"} leading-tight`}>
                    Which device processes AI commands?
                  </p>
                  
                  {/* Miniature Choice Badges */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button 
                      onClick={() => handleQuizSelection(0)}
                      className={`text-[9.5px] font-extrabold py-1.5 px-2 rounded-lg text-center border transition-all cursor-pointer ${
                        selectedQuizIndex === 0 
                          ? "bg-emerald-500 border-emerald-500 text-white scale-102 shadow-md shadow-emerald-500/20" 
                          : (isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                      }`}
                    >
                      💻 Computer
                    </button>
                    <button 
                      onClick={() => handleQuizSelection(1)}
                      className={`text-[9.5px] font-extrabold py-1.5 px-2 rounded-lg text-center border transition-all cursor-pointer ${
                        selectedQuizIndex === 1 
                          ? "bg-rose-500 border-rose-500 text-white scale-102 shadow-md shadow-rose-500/20" 
                          : (isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                      }`}
                    >
                      🧱 Brick
                    </button>
                  </div>
                </div>

                {/* Simulated Custom CSS Particles Confetti Burst */}
                {particles.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center z-50">
                    {particles.map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "absolute",
                          width: `${p.size}px`,
                          height: `${p.size}px`,
                          borderRadius: p.type === "circle" ? "50%" : "2px",
                          backgroundColor: p.color,
                          animation: `confetti-burst 0.9s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
                          animationDelay: p.delay,
                          transformOrigin: "center",
                          "--tx": p.x,
                          "--ty": p.y,
                          "--rot": `${Math.random() * 360}deg`
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}

              </div>
            </div>

            <div className="space-y-3 px-4">
              <h2 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"} leading-tight`}>
                Learn Through Play
              </h2>
              <p className={`text-sm md:text-base ${isDark ? "text-slate-300" : "text-slate-600"} leading-relaxed max-w-xs mx-auto`}>
                Short interactive lessons, quizzes, games, and rewards designed for every age group.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: PARENTS STAY INVOLVED (KOBE & CHIBI CELEBRATING PROGRESS) */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center space-y-6 animate-[fadeIn_0.4s_ease-out]">
            
            {/* Celebration Card Frame with Both Mascots */}
            <div className="flex items-center justify-center space-x-3 py-4 w-full relative">
              <div className="absolute inset-0 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className={`relative border ${isDark ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200"} rounded-2xl p-4 shadow-lg max-w-sm w-full flex items-center space-x-4`}>
                
                {/* Celebratory Mascots Frame Side-by-Side */}
                <div className={`flex items-center space-x-1.5 flex-none border ${isDark ? "bg-slate-900 border-[#1c2230]" : "bg-slate-50 border-slate-100"} p-2 rounded-xl`}>
                  {/* Kobe sticker */}
                  <div className={`bg-gradient-to-b ${isDark ? "from-cyan-950/60 to-slate-800 border-cyan-950" : "from-[#E0FDFD] to-white border-cyan-100"} p-1 rounded-lg border shadow-sm w-12 flex items-center justify-center h-14 overflow-hidden`}>
                    <MascotImage character="kobe" height={44} className="mt-0.5" />
                  </div>
                  {/* Chibi sticker */}
                  <div className={`bg-gradient-to-b ${isDark ? "from-violet-950/60 to-slate-800 border-violet-950" : "from-[#F3F0FF] to-white border-violet-100"} p-1 rounded-lg border shadow-sm w-12 flex items-center justify-center h-14 overflow-hidden`}>
                    <MascotImage character="chibi" height={40} className="mt-0.5" />
                  </div>
                </div>

                {/* Progress / Milestone Mockup */}
                <div className="flex-1 text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-[#7A6FF0] tracking-wider uppercase">Level Completed!</span>
                    <Sparkles size={11} className="text-[#19C6C6] fill-id transform scale-110" />
                  </div>
                  
                  {/* Custom progress bar */}
                  <div className={`w-full ${isDark ? "bg-slate-800" : "bg-slate-100"} h-2 rounded-full overflow-hidden`}>
                    <div className="w-[100%] h-full bg-gradient-to-r from-cyan-400 to-[#7A6FF0] rounded-full" />
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle2 size={11} className="text-[#19C6C6]" />
                    <span className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>Activity Report Generated</span>
                  </div>
                </div>

              </div>
            </div>

            <div className="space-y-3 px-4">
              <h2 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"} leading-tight`}>
                Parents Stay Involved
              </h2>
              <p className={`text-sm md:text-base ${isDark ? "text-slate-300" : "text-slate-600"} leading-relaxed max-w-xs mx-auto`}>
                Track learning progress, monitor achievements, and support your child's technology journey.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: FINAL ROLE TRANSITION SCREEN */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center space-y-6 animate-[fadeIn_0.4s_ease-out] px-4">
            <div className="space-y-2.5">
              <h2 className={`text-3xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                Who will be using CLATS?
              </h2>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"} max-w-xs mx-auto`}>
                Select your portal to proceed to your tailored technology dashboard.
              </p>
            </div>

            {/* Custom Selective Cards with supporting elements */}
            <div className="grid grid-cols-1 gap-4 w-full">
              
              {/* Card 1: Parent / Guardian */}
              <button
                onClick={() => onSelectRole("parent")}
                className={`group relative ${isDark ? "bg-[#1E293B] hover:bg-slate-800 border-slate-800 hover:border-violet-500 text-slate-200 shadow-none" : "bg-white hover:bg-slate-50 border border-slate-200 hover:border-violet-400 text-slate-800 shadow-lg hover:shadow-violet-900/5"} p-5 rounded-2xl text-left transition-all duration-300 flex items-center space-x-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400/50`}
              >
                {/* Supportive visual badge of Chibi inside */}
                <div className={`w-12 h-12 rounded-xl ${isDark ? "bg-violet-950/50 border-violet-900/45" : "bg-violet-400/10 border-violet-500/10 bg-gradient-to-b from-[#F3F0FF]/10 to-transparent"} flex items-center justify-center text-violet-500 group-hover:scale-115 transition-all overflow-hidden border p-0.5`}>
                  <MascotImage character="chibi" height={36} className="mt-0.5" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className={`font-bold text-base ${isDark ? "text-slate-200 group-hover:text-violet-400" : "text-slate-800 group-hover:text-violet-600"} transition-colors flex items-center gap-1.5`}>
                    Parent / Guardian
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Enroll and manage children.
                  </p>
                </div>
              </button>

              {/* Card 2: Child Learner */}
              <button
                onClick={() => onSelectRole("child")}
                className={`group relative ${isDark ? "bg-[#1E293B] hover:bg-slate-800 border-slate-800 hover:border-cyan-500 text-slate-200 shadow-none" : "bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-400 text-slate-800 shadow-lg hover:shadow-cyan-900/5"} p-5 rounded-2xl text-left transition-all duration-300 flex items-center space-x-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50`}
              >
                {/* Supportive visual badge of Kobe holding his tablet waving inside */}
                <div className={`w-12 h-12 rounded-xl ${isDark ? "bg-cyan-950/50 border-cyan-900/45" : "bg-cyan-400/10 border-cyan-500/10 bg-gradient-to-b from-[#E0FDFD]/10 to-transparent"} flex items-center justify-center text-[#19C6C6] group-hover:scale-115 transition-all overflow-hidden border p-0.5`}>
                  <MascotImage character="kobe" height={38} className="mt-1" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className={`font-bold text-base ${isDark ? "text-slate-200 group-hover:text-cyan-400" : "text-slate-800 group-hover:text-cyan-600"} transition-colors flex items-center gap-1.5`}>
                    Child Learner
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Continue your learning journey.
                  </p>
                </div>
              </button>

            </div>
          </div>
        )}

      </div>

      {/* Bottom Actions Section */}
      <div className="w-full max-w-md py-4 flex flex-col items-center">
        {step < 4 ? (
          <div className="w-full flex flex-col items-center gap-5">
            {/* Interactive Progress Indicators */}
            <div className="flex space-x-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  onClick={() => setStep(s)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    step === s ? "w-8 bg-[#19C6C6]" : `w-2.5 ${isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-200 hover:bg-slate-300"}`
                  }`}
                />
              ))}
            </div>

            {/* Back & Next Navigation Buttons */}
            <div className="w-full flex items-center justify-between gap-3 px-1">
              {step > 1 ? (
                <button
                  onClick={prevStep}
                  className={`flex items-center gap-1.5 text-sm font-bold border hover:scale-102 transition-all duration-200 py-3 px-5 rounded-xl active:scale-95 shadow-sm cursor-pointer ${isDark ? "text-slate-300 border-slate-705 bg-slate-800 hover:bg-slate-750" : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              ) : (
                <div className="w-20" /> 
              )}

              {step === 3 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-1.5 text-sm font-bold bg-[#7A6FF0] hover:bg-[#665AD1] text-white py-3 px-6 rounded-xl transition-all shadow-md shadow-violet-100 active:scale-95"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-1.5 text-sm font-bold bg-[#19C6C6] hover:bg-[#15abab] text-slate-900 py-3 px-6 rounded-xl transition-all shadow-md shadow-cyan-100 active:scale-95"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <span className={`text-[10px] uppercase tracking-wider font-mono ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              CLATS · Building Tomorrow's Tech Minds Today
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

export default Onboarding;
