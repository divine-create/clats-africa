/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, X, Sparkles, BookOpen, Clock, Users, MessageSquareCode } from "lucide-react";
import { MascotImage } from "./Onboarding";
import { companionVoice } from "../utils/audio";

// Theme Palette overrides
const C = {
  turquoise: "#2EC4B6",
  purple: "#B8A0FF",
  yellow: "#FFD166",
  snow: "#F8FAFC",
  charcoal: "#0F172A",
  slateMuted: "#64748B",
};

export interface TourStep {
  targetSelector: string;
  title: string;
  message: string;
  character: "kobe" | "chibi";
  role: "parent" | "child";
  tabToSet?: string | any; // For child tab switching
}

// ----------------------------------------------------
// THE TOUR DEFINITIONS
// ----------------------------------------------------
const PARENT_STEPS: TourStep[] = [
  {
    targetSelector: "#tour-parent-header",
    title: "Dashboard Command Center Setup",
    message: "Welcome to your CLATS Parent Dashboard.\n\nThis is your command center for tracking your child's future-tech learning journey, progress, achievements, and learning insights.",
    character: "kobe",
    role: "parent",
  },
  {
    targetSelector: "#tour-child-profiles",
    title: "Manage Child Profiles",
    message: "You can create and manage multiple child profiles from a single parent account. Each child receives personalized lessons, progress tracking, rewards, and recommendations.",
    character: "kobe",
    role: "parent",
  },
  {
    targetSelector: "#tour-current-path",
    title: "Personalized Learning Pathways",
    message: "This section shows your child's current age group, active pathway, and learning progress. CLATS grows with your child through age-appropriate learning experiences.",
    character: "kobe",
    role: "parent",
  },
  {
    targetSelector: "#tour-learning-progress",
    title: "Track Real-time Progress",
    message: "Track lesson completion, learning time, quiz performance, XP earned, and learning streaks.",
    character: "kobe",
    role: "parent",
  },
  {
    targetSelector: "#tour-pathway-progress",
    title: "Tailored Future-Tech Pathways",
    message: "Your child progresses through structured pathways including: Artificial Intelligence, Digital Literacy, Cybersecurity, etc.\n\nNew pathways unlock as CLATS expands.",
    character: "kobe",
    role: "parent",
  },
  {
    targetSelector: "#tour-recent-activity",
    title: "Learning Timeline",
    message: "See lessons completed, badges earned, quiz scores, and other learning milestones.",
    character: "kobe",
    role: "parent",
  },
  {
    targetSelector: "#tour-parent-insights",
    title: "Personalized Insights Engine",
    message: "CLATS generates personalized learning insights to help you support your child's development. Examples: Best learning times, Strongest skill areas, Areas needing support, Recommended next steps.",
    character: "kobe",
    role: "parent",
  },
  {
    targetSelector: "#tour-community-hub",
    title: "CLATS Parent Community",
    message: "Connect with other parents, participate in discussions, and help shape the future of CLATS.",
    character: "kobe",
    role: "parent",
  },
  {
    targetSelector: "#tour-feedback-button",
    title: "Direct Feedback Forum",
    message: "As an early CLATS family, your feedback helps us improve the platform for children across Africa.",
    character: "kobe",
    role: "parent",
  },
  {
    targetSelector: "#tour-settings-button",
    title: "Control Panel & Adjustments",
    message: "Settings allow you to manage accounts, adjust screen time, change language, replay tutorials, and manage notifications.",
    character: "kobe",
    role: "parent",
  },
];

const CHILD_STEPS_TINY: TourStep[] = [
  {
    targetSelector: "#child-hud-header",
    title: "Meet Kobe! 👋",
    message: "Hi, friend! Welcome to CLATS. I'm Kobe.",
    character: "kobe",
    role: "child",
    tabToSet: "home",
  },
  {
    targetSelector: "#child-hud-header",
    title: "Meet Chibi! 🌸",
    message: "And I'm Chibi! We'll learn together and have lots of fun.",
    character: "chibi",
    role: "child",
    tabToSet: "home",
  },
  {
    targetSelector: "#tour-learning-path",
    title: "Your Learning Path 🗺️",
    message: "Every lesson is part of a learning adventure.",
    character: "chibi",
    role: "child",
    tabToSet: "home",
  },
  {
    targetSelector: "#tour-module-cards",
    title: "Explore & Discover 💡",
    message: "Listen to stories, explore technology, and discover new ideas.",
    character: "chibi",
    role: "child",
    tabToSet: "modules",
  },
  {
    targetSelector: "#tour-module-cards",
    title: "Tap & Play 🎮",
    message: "Tap, drag, match, and play while learning.",
    character: "chibi",
    role: "child",
    tabToSet: "modules",
  },
  {
    targetSelector: "#tour-badges",
    title: "Your Stickers & Stars 🌟",
    message: "Earn stars, stickers, and special achievements.",
    character: "chibi",
    role: "child",
    tabToSet: "rewards",
  }
];

const CHILD_STEPS_JUNIOR: TourStep[] = [
  {
    targetSelector: "#child-hud-header",
    title: "Welcome to CLATS! 🌟",
    message: "Welcome to CLATS! Ready to explore the future?",
    character: "kobe",
    role: "child",
    tabToSet: "home",
  },
  {
    targetSelector: "#tour-learning-path",
    title: "Young Innovators Pathways 🗺️",
    message: "You'll learn through exciting pathways like: 🤖 AI, 🌐 Digital Literacy, 🔒 Cybersecurity, and ⛓ Blockchain Discovery.",
    character: "chibi",
    role: "child",
    tabToSet: "home",
  },
  {
    targetSelector: "#tour-module-cards",
    title: "Your Learning Map 🗺️",
    message: "Lessons are organized into modules and learning journeys. Complete lessons to unlock new challenges.",
    character: "chibi",
    role: "child",
    tabToSet: "modules",
  },
  {
    targetSelector: "#tour-module-cards",
    title: "Active Learning Module 🤖",
    message: "Start with Artificial Intelligence. New modules unlock as you progress.",
    character: "kobe",
    role: "child",
    tabToSet: "modules",
  },
  {
    targetSelector: "#tour-module-cards",
    title: "Interactive Study 🧠",
    message: "Watch videos, learn concepts, complete activities, and answer quizzes.",
    character: "chibi",
    role: "child",
    tabToSet: "modules",
  },
  {
    targetSelector: "#child-hud-header",
    title: "AI Companions 🤖",
    message: "Need help? Tap Kobe or Chibi anytime. They can explain lessons, read instructions, celebrate achievements, and guide your learning.",
    character: "kobe",
    role: "child",
    tabToSet: "home",
  },
  {
    targetSelector: "#tour-xp-system",
    title: "Earn XP Points 💎",
    message: "Earn XP by completing lessons, quizzes, challenges, and projects.",
    character: "chibi",
    role: "child",
    tabToSet: "home",
  },
  {
    targetSelector: "#tour-badges",
    title: "Unlock Achievements 🏆",
    message: "Collect badges and achievements as you learn.",
    character: "chibi",
    role: "child",
    tabToSet: "rewards",
  },
  {
    targetSelector: "#tour-games",
    title: "Island Arcade Games 🎮",
    message: "Learning games help you practice skills and earn extra rewards.",
    character: "kobe",
    role: "child",
    tabToSet: "games",
  }
];

const CHILD_STEPS_PIONEER: TourStep[] = [
  {
    targetSelector: "#child-hud-header",
    title: "Welcome Builders! 🚀",
    message: "Welcome to CLATS Future Builders. This space is designed to help you build future-ready technology skills.",
    character: "kobe",
    role: "child",
    tabToSet: "home",
  },
  {
    targetSelector: "#tour-learning-path",
    title: "Future Builders Pathways 🎓",
    message: "You'll progress through pathways including: Artificial Intelligence, Cybersecurity, Blockchain & Web3, Design Thinking, DevOps, and Career Readiness.",
    character: "chibi",
    role: "child",
    tabToSet: "home",
  },
  {
    targetSelector: "#tour-module-cards",
    title: "Modular Tech Map 🗺️",
    message: "Modules become increasingly advanced as your skills grow.",
    character: "chibi",
    role: "child",
    tabToSet: "modules",
  },
  {
    targetSelector: "#tour-module-cards",
    title: "Professional Projects 💻",
    message: "Apply your knowledge through real-world projects and portfolio-building experiences.",
    character: "kobe",
    role: "child",
    tabToSet: "modules",
  },
  {
    targetSelector: "#tour-xp-system",
    title: "Continuous Progress Tracking 📊",
    message: "Track your achievements, certificates, XP, and pathway completion.",
    character: "chibi",
    role: "child",
    tabToSet: "home",
  },
  {
    targetSelector: "#child-hud-header",
    title: "Intelligent Guidance 💡",
    message: "Kobe and Chibi can assist with explanations, reminders, and learning support whenever needed.",
    character: "kobe",
    role: "child",
    tabToSet: "home",
  }
];

// ----------------------------------------------------
// MAIN WELCOME MODAL PROMPT PANEL
// ----------------------------------------------------
interface WelcomeModalProps {
  onStartTour: () => void;
  onSkip: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStartTour, onSkip }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-4 border-slate-100 overflow-hidden"
      >
        {/* Visual Header Grid with Kobe and Chibi */}
        <div className="relative bg-gradient-to-br from-[#2EC4B6]/10 to-[#B8A0FF]/10 p-8 flex justify-center gap-10 border-b border-slate-100">
          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md hover:bg-slate-50 transition-colors cursor-pointer p-2 rounded-full border border-slate-200" onClick={onSkip}>
            <X size={16} className="text-slate-500" />
          </div>
          
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <MascotImage character="kobe" height={90} />
            <span className="text-xs font-black tracking-wider text-slate-800 mt-2 bg-[#ffb800]/20 px-2 py-0.5 rounded-full">KOBE</span>
          </motion.div>
          
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
            className="flex flex-col items-center text-center mt-3"
          >
            <div className="w-12 h-12 bg-white/70 rounded-full flex items-center justify-center border border-slate-200/80 shadow-inner">
              <Sparkles size={20} className="text-[#2EC4B6]" />
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut", delay: 0.5 }}
            className="flex flex-col items-center"
          >
            <MascotImage character="chibi" height={94} />
            <span className="text-xs font-black tracking-wider text-[#B8A0FF] mt-1 bg-[#B8A0FF]/25 px-2 py-0.5 rounded-full">CHIBI</span>
          </motion.div>
        </div>

        {/* Content Details */}
        <div className="p-8 text-center bg-white">
          <h2 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight mb-3">
            Welcome to CLATS! ✨
          </h2>
          <p className="font-sans font-medium text-slate-600 text-sm leading-relaxed max-w-sm mx-auto mb-8">
            Let's take a quick tour of your learning journey.
          </p>

          {/* Prompt Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onSkip}
              className="py-3 px-6 rounded-2xl text-sm font-extrabold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              Skip For Now
            </button>
            <button
              onClick={onStartTour}
              className="py-3 px-8 rounded-2xl text-sm font-extrabold bg-[#2EC4B6] hover:bg-[#23a599] text-white transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              Start Tour 🚀
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ----------------------------------------------------
// THE SPOTLIGHT DYNAMIC TUTORIAL HIGHLIGHT OVERLAY
// ----------------------------------------------------
interface TutorialTourProps {
  role: "parent" | "child";
  childAgeGroup?: "early explorers" | "young innovators" | "future builders";
  onComplete: () => void;
  onSkip: () => void;
  onSetChildTab?: (tab: string) => void;
}

export const TutorialTour: React.FC<TutorialTourProps> = ({ role, childAgeGroup = "young innovators", onComplete, onSkip, onSetChildTab }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const getChildSteps = (): TourStep[] => {
    if (childAgeGroup === "early explorers") return CHILD_STEPS_TINY;
    if (childAgeGroup === "future builders") return CHILD_STEPS_PIONEER;
    return CHILD_STEPS_JUNIOR;
  };

  const steps = role === "parent" ? PARENT_STEPS : getChildSteps();
  const currentStep = steps[stepIndex];

  const [rect, setRect] = useState<DOMRect | null>(null);
  const elementRef = useRef<Element | null>(null);

  // Speak tutorial steps automatically as they change!
  useEffect(() => {
    if (role === "child" && currentStep?.message) {
      companionVoice.speak(currentStep.message, currentStep.character || "kobe", childAgeGroup);
    }
    return () => {
      companionVoice.stop();
    };
  }, [stepIndex, role, childAgeGroup, currentStep]);

  // Programmatically trigger child active tabs if configured for high interactive coverage!
  useEffect(() => {
    if (role === "child" && currentStep?.tabToSet && onSetChildTab) {
      onSetChildTab(currentStep.tabToSet);
    }
  }, [stepIndex, role, currentStep, onSetChildTab]);

  // Track active target bounding box with high performance
  useEffect(() => {
    const updatePosition = () => {
      if (!currentStep) return;
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        elementRef.current = el;
        const bounding = el.getBoundingClientRect();
        setRect(bounding);
      } else {
        setRect(null);
      }
    };

    updatePosition();
    // Re-check frequently to support slow animations, toggling drawers, etc.
    const interval = setInterval(updatePosition, 350);
    
    // Throttle scroll events to prevent scroll jank
    let lastScroll = 0;
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScroll > 50) {
        lastScroll = now;
        requestAnimationFrame(updatePosition);
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [stepIndex, currentStep?.targetSelector]);

  // Handle auto-scroll only once when the step changes
  useEffect(() => {
    if (!currentStep) return;
    
    // Give DOM a tiny moment to render the new step before scrolling
    const timeoutId = setTimeout(() => {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        const bounding = el.getBoundingClientRect();
        const isOffscreen = 
          bounding.top < 0 || 
          bounding.bottom > window.innerHeight || 
          bounding.left < 0 || 
          bounding.right > window.innerWidth;
          
        if (isOffscreen) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [stepIndex, currentStep?.targetSelector]);

  const handleNext = () => {
    if (stepIndex + 1 < steps.length) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const isLast = stepIndex === steps.length - 1;

  // Render congrats panel if completed to standard
  const [showCongrats, setShowCongrats] = useState(false);

  const getCongratsMsg = () => {
    if (role === "parent") {
      return "You're all set! Let's help your child become a future technology creator.";
    }
    if (childAgeGroup === "early explorers") {
      return "Let's begin our adventure!";
    }
    if (childAgeGroup === "future builders") {
      return "Your future-tech journey starts now.";
    }
    return "You're ready to become a future innovator!";
  };

  const finishTour = () => {
    // Stop speaking if any is left!
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}

    // Save to LocalStorage appropriately
    if (role === "parent") {
      localStorage.setItem("hasCompletedParentTutorial", "true");
    } else {
      localStorage.setItem("hasCompletedChildTutorial", "true");
    }
    localStorage.setItem("hasCompletedTutorial", "true");
    onComplete();
  };

  const handleNextOrCongrats = () => {
    if (isLast) {
      setShowCongrats(true);
    } else {
      handleNext();
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] pointer-events-none">
      
      {/* 1. MASKED INTERACTIVE CUTOUT BACKDROP */}
      {rect && !showCongrats && (
        <div className="absolute inset-0 pointer-events-auto">
          <style>{`
            .tour-highlight-glow {
              box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.65), 0 0 20px 8px rgba(46, 196, 182, 0.6), inset 0 0 12px 2px rgba(46, 196, 182, 0.35);
              border: 3px solid #2EC4B6;
            }
          `}</style>
          <div
            className="absolute rounded-2xl tour-highlight-glow"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
            }}
          />
        </div>
      )}

      {/* Backup backdrop if target selector doesn't exist */}
      {!rect && !showCongrats && (
        <div className="absolute inset-0 bg-slate-900/60 transition-all duration-300 pointer-events-auto" />
      )}

      {/* CONGRATS PANEL OVERLAY */}
      <AnimatePresence>
        {showCongrats && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center border-4 border-[#ffb800]/20"
            >
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                >
                  <MascotImage character={currentStep?.character || "kobe"} height={120} />
                </motion.div>
              </div>

              <h3 className="font-sans font-black text-2xl text-slate-900 mb-2">
                {role === "parent" ? "🎉 Congratulations!" : "🎉 Amazing!"}
              </h3>
              <p className="font-sans text-sm font-medium text-slate-600 leading-relaxed mb-6">
                {getCongratsMsg()}
              </p>

              <button
                onClick={finishTour}
                className="w-full py-3 px-6 rounded-2xl text-sm font-extrabold text-white bg-[#2EC4B6] hover:bg-[#23a599] shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {role === "parent" ? "Go To Dashboard" : "Start Learning"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOAT GUIDE CHARACTER SPEED CARD */}
      {!showCongrats && currentStep && (
        <div className="absolute inset-x-4 bottom-24 md:bottom-28 lg:bottom-12 flex justify-center pointer-events-none">
          <style>{`
            @keyframes tourBounce {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            .tour-bounce {
              animation: tourBounce 4s ease-in-out infinite;
            }
          `}</style>
          
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-5 p-r-16 md:flex gap-5 tour-bounce pointer-events-auto"
          >
            {/* Mascot Icon speaking */}
            <div className="flex justify-center md:justify-start items-center md:items-start flex-shrink-0 mb-3 md:mb-0">
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
                <MascotImage character={currentStep.character} height={76} />
              </div>
            </div>

            {/* Speaking Bubble Content details */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black uppercase tracking-wider text-[#2EC4B6]">
                    {currentStep.character === "kobe" ? "Kobe Guide" : "Chibi Companion"}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Step {stepIndex + 1} of {steps.length}
                  </span>
                </div>
                <h4 className="font-sans font-bold text-base text-slate-900 mb-1">
                  {currentStep.title}
                </h4>
                <p className="font-sans font-medium text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                  {currentStep.message}
                </p>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden my-3">
                <div 
                  className="bg-[#2EC4B6] h-full transition-all duration-300"
                  style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>

              {/* Navigation Options */}
              <div className="flex justify-between items-center gap-3">
                <button
                  onClick={onSkip}
                  className="text-xs font-extrabold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Skip Tour
                </button>
                
                <div className="flex gap-2">
                  {stepIndex > 0 && (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-600 transition-colors active:scale-95 cursor-pointer"
                    >
                      <ArrowLeft size={13} />
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNextOrCongrats}
                    className="flex items-center gap-1.5 py-1.5 px-4 rounded-lg bg-[#2EC4B6] hover:bg-[#23a599] text-xs font-extrabold text-white transition-colors shadow-sm active:scale-95 cursor-pointer"
                  >
                    {isLast ? "Done" : "Next"}
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// SMART FEATURE DISCOVERY CONTEXTUAL MODALS (Shown Once)
// ----------------------------------------------------
interface ContextualTipProps {
  feature: "community" | "games";
  onClose: () => void;
}

export const ContextualTip: React.FC<ContextualTipProps> = ({ feature, onClose }) => {
  const isComm = feature === "community";
  const character = isComm ? "kobe" : "chibi";
  const title = isComm ? "Parents Community" : "Islands Arcade";
  const message = isComm
    ? "This is the active community zone! Here, you can meet other tech-families, exchange tips on raising AI-builders, and register for platform development events."
    : "Welcome to the Arcade Islands! Practice what you learned in lessons, earn bonus levels, and unlock premium badges without looking away!";

  useEffect(() => {
    // Write state in localStorage so it only shows once!
    const shown = localStorage.getItem("shownFeatureTips") || "{}";
    const parsed = JSON.parse(shown);
    parsed[feature] = true;
    localStorage.setItem("shownFeatureTips", JSON.stringify(parsed));
  }, [feature]);

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      className="bg-white rounded-2xl border-2 border-dashed shadow-lg p-5 flex gap-4 max-w-sm pointer-events-auto"
      style={{
        borderColor: isComm ? C.purple + "40" : C.turquoise + "40"
      }}
    >
      <div className="flex-shrink-0 bg-slate-50 rounded-xl p-1.5 flex items-center justify-center">
        <MascotImage character={character} height={56} />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#2EC4B6]">
              {character === "kobe" ? "Kobe Smart Tip" : "Chibi Smart Tip"}
            </span>
            <button onClick={onClose} className="p-0.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
              <X size={12} className="text-slate-400" />
            </button>
          </div>
          <h5 className="font-sans font-bold text-sm text-slate-900 mb-1">
            {title}
          </h5>
          <p className="font-sans text-xs font-semibold leading-relaxed text-slate-500">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
