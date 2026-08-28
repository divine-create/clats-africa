/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Child, Language } from "../types";
import { C, F } from "../utils/config";
import { sfx, companionVoice } from "../utils/audio";
import { useLearningTimeTracker } from "../utils/timeTracker";
import { Heading, Txt, Chip } from "./Primitives";
import { MascotImage } from "./Onboarding";
import { SmartCityBuilder } from "./games/SmartCityBuilder";
import { PhishingSwipe } from "./games/PhishingSwipe";
import { TeachableMachine } from "./games/TeachableMachine";

interface ChildGamesProps {
  child: Child;
  lang: Language;
  onAddXP: (amount: number) => void;
}

interface Game {
  id: string;
  name: string;
  desc: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  xpAward: number;
  status: "Available" | "Coming Soon";
  supportsModule: string;
  supportsLesson: string;
  icon: string;
}

export const ChildGames: React.FC<ChildGamesProps> = ({ child, lang, onAddXP }) => {
  // Live dynamic theme detection (with click toggle fallback)
  const [isDark, setIsDark] = useState(() => {
    return document.body.classList.contains("dark-theme") || localStorage.getItem("clats_theme") === "dark";
  });

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.body.classList.contains("dark-theme") || localStorage.getItem("clats_theme") === "dark");
    };
    window.addEventListener("click", checkTheme);
    return () => window.removeEventListener("click", checkTheme);
  }, []);

  const companionName = child.companion === "chibi" ? "Chibi" : "Kobe";

  useEffect(() => {
    const gameWelcome = `Welcome to the games arena, friend! I am ${companionName}. Let's play some pattern training games to rack up smart points!`;
    const timer = setTimeout(() => {
      companionVoice.speak(gameWelcome, child.companion || "kobe", child.ageGroup);
    }, 850);
    return () => {
      clearTimeout(timer);
      companionVoice.stop();
    };
  }, [child.companion, child.ageGroup, companionName]);

  const [activeAcademy, setActiveAcademy] = useState<"ai" | "cyber" | "design" | "career">("ai");
  const [activeGameModal, setActiveGameModal] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Gameplay specific states
  const [gameStep, setGameStep] = useState<number>(0);
  const [gameScore, setGameScore] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameFeedback, setGameFeedback] = useState<string | null>(null);
  const [isGameCompleted, setIsGameCompleted] = useState<boolean>(false);
  const [showXPClaimModal, setShowXPClaimModal] = useState<{ xp: number; title: string } | null>(null);

  // Track completed games locally per child
  const [completedGames, setCompletedGames] = useState<string[]>(() => {
    try {
      const keys = ["teachable-machine", "smart-city-builder", "phishing-swipe"];
      return keys.filter(k => localStorage.getItem(`clats_game_completed_${child.id}_${k}`) === "true");
    } catch {
      return [];
    }
  });

  // Keep a dynamic streak value for gamification
  const [streak, setStreak] = useState(() => {
    const completedCount = Object.keys(child.completed || {}).length;
    if (completedCount === 0) return 0;
    const val = localStorage.getItem(`clats_streak_${child.id}`);
    if (val) return parseInt(val, 10);
    return completedCount + 2;
  });

  // Mark academy listing with supported game content
  const academiesList = [
    { id: "ai" as const, label: "AI & Emerging Technologies", icon: "🤖" },
    { id: "cyber" as const, label: "Digital Citizenship & Cybersecurity", icon: "🔒" },
    { id: "design" as const, label: "Design & Creation", icon: "🎨" },
    { id: "career" as const, label: child.ageGroup === "future builders" ? "Innovation & Career Readiness" : "Adaptability & Lifelong Learning", icon: child.ageGroup === "future builders" ? "🚀" : "🌱" }
  ];

  // Academies games lists
  const aiGames: Game[] = [
    {
      id: "teachable-machine",
      name: "Teachable Machine",
      desc: "YOU are the AI trainer! Sort items to teach the AI, then watch it learn.",
      difficulty: "Intermediate",
      xpAward: 100,
      status: "Available",
      supportsModule: "🤖 AI Foundations",
      supportsLesson: "How AI Learns",
      icon: "🧠"
    },
    {
      id: "smart-city-builder",
      name: "Smart City Builder",
      desc: "Place AI sensors and EV buses to optimize your digital metropolis!",
      difficulty: "Intermediate",
      xpAward: 150,
      status: "Available",
      supportsModule: "🤖 AI Foundations",
      supportsLesson: "AI Around Us",
      icon: "🏙️"
    }
  ];

  const cyberGames: Game[] = [
    {
      id: "phishing-swipe",
      name: "Phishing Swipe",
      desc: "Spot the scams! Swipe left on viruses, right on safe messages.",
      difficulty: "Intermediate",
      xpAward: 100,
      status: "Available",
      supportsModule: "🔒 Digital Safety",
      supportsLesson: "Phishing & Scams",
      icon: "🎣"
    },
    {
      id: "password-builder",
      name: "Password Builder",
      desc: "Create super-strong, hacker-safe passwords using ninja shields.",
      difficulty: "Beginner",
      xpAward: 50,
      status: "Coming Soon",
      supportsModule: "🔒 Digital Safety",
      supportsLesson: "Password Basics",
      icon: "🔒"
    }
  ];

  const designGames: Game[] = [
    {
      id: "story-creator",
      name: "Story Creator",
      desc: "Design your own digital tech story using interactive pictures.",
      difficulty: "Beginner",
      xpAward: 50,
      status: "Coming Soon",
      supportsModule: "🎨 Digital Arts",
      supportsLesson: "Creative Writing",
      icon: "🎨"
    }
  ];

  const careerGames: Game[] = [
    {
      id: "future-career",
      name: "Future Career Quest",
      desc: "Explore what tech jobs look like in the exciting future.",
      difficulty: "Intermediate",
      xpAward: 75,
      status: "Coming Soon",
      supportsModule: "🚀 Tech Careers",
      supportsLesson: "Future Jobs",
      icon: "🚀"
    }
  ];

  const getActiveArray = () => {
    if (activeAcademy === "ai") return aiGames;
    if (activeAcademy === "cyber") return cyberGames;
    if (activeAcademy === "design") return designGames;
    return careerGames;
  };

  const getCompletedProgressPercentage = (gameId: string) => {
    return completedGames.includes(gameId) ? 100 : 0;
  };

  // Pre-configured Badge requirements
  const badgesList = [
    { id: "ai-trainer", name: "AI Trainer", icon: "🧠", desc: "Unlock from Teachable Machine", unlocked: completedGames.includes("teachable-machine"), color: "#6366F1" },
    { id: "urban-innovator", name: "Urban Innovator", icon: "🏙️", desc: "Unlock from Smart City Builder", unlocked: completedGames.includes("smart-city-builder"), color: "#26c6da" },
    { id: "cyber-guardian", name: "Cyber Guardian", icon: "🛡️", desc: "Unlock from Phishing Swipe", unlocked: completedGames.includes("phishing-swipe"), color: "#F59E0B" },
  ];

  const badgesEarnedCount = badgesList.filter(b => b.unlocked).length;

  // Interactivity Handlers
  const handlePlayGame = (gameId: string) => {
    sfx.playTap();
    setActiveGameModal(gameId);
    setGameStep(0);
    setGameScore(0);
    setSelectedAnswer(null);
    setGameFeedback(null);
    setIsGameCompleted(false);
  };

  const handleNotifyMe = (gameName: string) => {
    sfx.playCoin();
    setNotificationMessage(`🔔 Awesome! We subscribed Captain ${child.name || "Explorer"}! We will alert you whenever "${gameName}" is fully coded!`);
  };

  // Playable interactive Game Logic Data

  // 1. PATTERN DETECTIVE QUESTS
  const patternQuests = [
    {
      instructions: "Kobe wants you to complete the sequence color pattern: 🔴 🔵 🔴 🔵 🔴 ...",
      options: ["🔴 Red Bead", "🔵 Blue Bead", "🟢 Green Bead"],
      correctIndex: 1,
      explanation: "Wow! Red and blue alternate perfectly! 1, 2, 1, 2..."
    },
    {
      instructions: "Complete the shape grid pattern: 🔼 🟨 🔼 🟨 🔼 ...",
      options: ["🟨 Square Block", "🔼 Triangle Peak", "🟢 Round Circle"],
      correctIndex: 0,
      explanation: "Excellent! The square block comes directly after the triangle."
    },
    {
      instructions: "Find what completes the pattern: ABC, DEF, GHI, ...",
      options: ["WXY", "MNO", "JKL"],
      correctIndex: 2,
      explanation: "Fantastic! JKL completes the alphabetical groupings!"
    }
  ];

  // 2. AI SORTING QUESTS
  const sortingQuests = [
    {
      item: "🍎 Apple",
      instructions: "What category does this delicious snack belong to?",
      options: ["🍉 Natural Fruit", "🥬 Fresh Vegetable", "💻 Device Gadget"],
      correctIndex: 0,
      explanation: "Correct! Apples are sweet natural fruits!"
    },
    {
      item: "🥦 Broccoli",
      instructions: "What category does this green tree-like food belong to?",
      options: ["🍉 Natural Fruit", "🥬 Fresh Vegetable", "💻 Device Gadget"],
      correctIndex: 1,
      explanation: "Super! Broccoli is a healthy green vegetable!"
    },
    {
      item: "🐱 Cute Kitten",
      instructions: "Where does this fluffy purring pet go?",
      options: ["🐾 Living Animal", "🥬 Fresh Vegetable", "💻 Device Gadget"],
      correctIndex: 0,
      explanation: "Perfect! Kitties are lovely living animals!"
    },
    {
      item: "💻 Laptop Screen",
      instructions: "What category is this keyboard computer?",
      options: ["🍉 Natural Fruit", "🐾 Living Animal", "💻 Device Gadget"],
      correctIndex: 2,
      explanation: "Incredible! Computers are helpful tech device gadgets!"
    }
  ];

  // 3. SMART MACHINE MATCH QUESTS
  const matchingQuests = [
    {
      tool: "🧹 Robotic Vacuum Cleaner",
      instructions: "What helpful chore does this robotic machine perform?",
      options: [
        "Cleans the family living room floors automatically!",
        "Drives parents to work without a wheel.",
        "Synthesizes beautiful pop music automatically."
      ],
      correctIndex: 0,
      explanation: "Spot-on! Vacuums use sensors to clean dirt automatically."
    },
    {
      tool: "🗺️ Map Navigation App",
      instructions: "How does this intelligent software help drivers?",
      options: [
        "Brews delicious warm cocoa in mugs.",
        "Calculates the fastest lanes and routes to the sea.",
        "Mows garden lawns using laser cutters."
      ],
      correctIndex: 1,
      explanation: "Brilliant! Maps find traffic pathways so we arrive on time!"
    },
    {
      tool: "🧠 Smart Voice Assistant",
      instructions: "How does this virtual speak robot help our home?",
      options: [
        "Sweeps leaves off real trees.",
        "Listens to queries to play songs and forecast weather.",
        "Flies into the solar clouds like spaceships."
      ],
      correctIndex: 2,
      explanation: "A+! It reads voice soundwaves to answer questions!"
    }
  ];

  // 4. TRAIN THE ROBOT QUESTS
  const trainingQuests = [
    {
      animal: "🐕 Smart doggy barking happily at the door",
      instructions: "State of study: Awake or Sleeping?",
      options: ["☀️ Active Sensing Mode", "🌙 Resting Sleep State"],
      correctIndex: 0,
      explanation: "Wonderful! Active barking animals are definitely awake and sensing."
    },
    {
      animal: "😴 Tiny kitten curled in its basket, breathing slowly",
      instructions: "State of study: Awake or Sleeping?",
      options: ["☀️ Active Sensing Mode", "🌙 Resting Sleep State"],
      correctIndex: 1,
      explanation: "Gold medal! Low speed and closed eyes represent safe sleeping inputs."
    },
    {
      animal: "Wave sensory sensor: Human waves flag in front of robot",
      instructions: "Robot response: Active Sensing or Sleep State?",
      options: ["☀️ Active Sensing Mode", "🌙 Resting Sleep State"],
      correctIndex: 0,
      explanation: "Super! The robot detects motion and wakes into Active sensing."
    }
  ];

  const handleQuestSelect = (questIndex: number, choiceIndex: number, currentQuests: any[]) => {
    setSelectedAnswer(choiceIndex);
    const quest = currentQuests[questIndex];
    if (choiceIndex === quest.correctIndex) {
      sfx.playCoin();
      setGameScore(prev => prev + 1);
      setGameFeedback(`🎉 Correct! ${quest.explanation}`);
    } else {
      sfx.playBuzzer();
      setGameFeedback(`💡 Keep practicing! The correct answer is: ${quest.options[quest.correctIndex]}`);
    }
  };

  const handleNextQuest = (currentQuests: any[], gameId: string, xlAward: number) => {
    setSelectedAnswer(null);
    setGameFeedback(null);
    if (gameStep + 1 < currentQuests.length) {
      setGameStep(prev => prev + 1);
    } else {
      // Completed! Save states & show claim screen
      sfx.playLevelUp();
      const updated = [...completedGames];
      if (!updated.includes(gameId)) {
        updated.push(gameId);
        setCompletedGames(updated);
        try {
          localStorage.setItem(`clats_game_completed_${child.id}_${gameId}`, "true");
        } catch (e) {
          console.error(e);
        }
      }
      setIsGameCompleted(true);
      setShowXPClaimModal({
        xp: xlAward,
        title: gameId === "pattern-detective" ? "Pattern Detective" : gameId === "ai-sorting" ? "AI Sorting Challenge" : gameId === "smart-machine" ? "Smart Machine Match" : "Train the Robot"
      });
    }
  };

  const finishQuestXPClaim = (award: number) => {
    sfx.playCoin();
    onAddXP(award);
    setActiveGameModal(null);
    setIsGameCompleted(false);
    setShowXPClaimModal(null);
  };

  return (
    <div
      style={{
        padding: "24px 20px 100px",
        background: isDark ? "#0f172a" : "#f8fafc",
        minHeight: "100vh",
        transition: "background-color 0.3s ease",
        fontFamily: F.body,
        color: isDark ? "#f1f5f9" : "#1e293b"
      }}
    >
      {/* 1. BRANDED HERO PAGE HEADER */}
      <div 
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginBottom: 28,
          maxWidth: 1200,
          margin: "0 auto 28px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <Heading size={32} style={{ color: isDark ? "#2EC4B6" : "#0f172a", fontFamily: F.display, fontWeight: 900 }}>
              🎮 Practice & Play
            </Heading>
            <Txt size={15} color={isDark ? "#94a3b8" : "#475569"} style={{ display: "block", marginTop: 4 }}>
              Learn, play, and earn rewards while building future-tech skills.
            </Txt>
          </div>

          {/* METRIC CARD BAR */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* ⭐ TOTAL XP */}
            <div 
              style={{
                background: isDark ? "#1e293b" : "#ffffff",
                border: isDark ? "2.5px solid #334155" : "2.5px solid #e2e8f0",
                boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                borderRadius: 16,
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 100
              }}
            >
              <span style={{ fontSize: 22 }}>⭐</span>
              <div>
                <Txt size={11} color={isDark ? "#94a3b8" : "#64748b"} style={{ display: "block", fontWeight: 800, textTransform: "uppercase", fontSize: 9, letterSpacing: 0.5 }}>
                  TOTAL XP
                </Txt>
                <Txt size={15} weight={900} color="#FFD166">
                  {child.xp || 0} XP
                </Txt>
              </div>
            </div>

            {/* 🔥 STREAK */}
            <div 
              style={{
                background: isDark ? "#1e293b" : "#ffffff",
                border: isDark ? "2.5px solid #334155" : "2.5px solid #e2e8f0",
                boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                borderRadius: 16,
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 120
              }}
            >
              <span style={{ fontSize: 22 }}>🔥</span>
              <div>
                <Txt size={11} color={isDark ? "#94a3b8" : "#64748b"} style={{ display: "block", fontWeight: 800, textTransform: "uppercase", fontSize: 9, letterSpacing: 0.5 }}>
                  STREAK
                </Txt>
                <Txt size={15} weight={950} color="#ef4444">
                  {streak} Day Streak
                </Txt>
              </div>
            </div>

            {/* 🏅 BADGES */}
            <div 
              style={{
                background: isDark ? "#1e293b" : "#ffffff",
                border: isDark ? "2.5px solid #334155" : "2.5px solid #e2e8f0",
                boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                borderRadius: 16,
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 110
              }}
            >
              <span style={{ fontSize: 22 }}>🏅</span>
              <div>
                <Txt size={11} color={isDark ? "#94a3b8" : "#64748b"} style={{ display: "block", fontWeight: 800, textTransform: "uppercase", fontSize: 9, letterSpacing: 0.5 }}>
                  BADGES
                </Txt>
                <Txt size={15} weight={900} color={isDark ? "#B8A0FF" : "#6366f1"}>
                  {badgesEarnedCount} Locked In
                </Txt>
              </div>
            </div>
          </div>
        </div>

        {/* KOBE & CHIBI SPEECH BUBBLES BAR */}
        <div 
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            background: isDark ? "rgba(46, 196, 182, 0.08)" : "rgba(46,196,182,0.04)",
            border: isDark ? "1.5px solid rgba(46,196,182,0.2)" : "1.5px solid rgba(46,196,182,0.12)",
            borderRadius: 20,
            padding: "12px 16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", background: "#ffffff22", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MascotImage character="kobe" height={32} />
            </div>
            <div style={{ position: "relative", background: isDark ? "#1e293b" : "#ffffff", border: "1.5px solid #e2e8f0", padding: "6px 12px", borderRadius: 12 }}>
              <Txt size={11.5} color={isDark ? "#cbd5e1" : "#334155"} weight={700}>
                Kobe says: <strong>"Practice makes you smarter!"</strong> 🚀
              </Txt>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
            <div style={{ position: "relative", background: isDark ? "#1e293b" : "#ffffff", border: "1.5px solid #e2e8f0", padding: "6px 12px", borderRadius: 12 }}>
              <Txt size={11.5} color={isDark ? "#cbd5e1" : "#334155"} weight={700}>
                {companionName} says: <strong>"Let's earn more XP together!"</strong> ✨
              </Txt>
            </div>
            <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", background: "#ffffff22", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MascotImage character={child.companion === "chibi" ? "chibi" : "kobe"} height={32} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. ACADEMY FILTERS TABS */}
      <div 
        style={{
          maxWidth: 1200,
          margin: "0 auto 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}
      >
        <div 
          style={{
            display: "flex",
            background: isDark ? "#1e293b" : "#f1f5f9",
            borderRadius: 20,
            padding: 6,
            overflowX: "auto",
            scrollbarWidth: "none"
          }}
        >
          {academiesList.map(academy => {
            const isActive = activeAcademy === academy.id;
            return (
              <button
                key={academy.id}
                onClick={() => {
                  sfx.playTap();
                  setActiveAcademy(academy.id);
                }}
                style={{
                  flex: "1 0 auto",
                  padding: "12px 18px",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  background: isActive 
                    ? (isDark ? "#2EC4B6" : "#ffffff") 
                    : "transparent",
                  color: isActive 
                    ? (isDark ? "#0f172a" : "#0f172a") 
                    : (isDark ? "#94a3b8" : "#475569"),
                  boxShadow: isActive && !isDark ? "0 4px 12px rgba(0,0,0,0.06)" : "none"
                }}
              >
                <span style={{ fontSize: 16 }}>{academy.icon}</span>
                <span>{academy.label.split(" & ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FEATURED CHALLENGE HERO CARD (Only on AI/MVP selection) */}
      {activeAcademy === "ai" && (
        <div 
          style={{
            maxWidth: 1200,
            margin: "0 auto 28px"
          }}
        >
          <div 
            style={{
              background: isDark 
                ? "linear-gradient(135deg, rgba(46, 196, 182, 0.15) 0%, rgba(184, 160, 255, 0.1) 100%)" 
                : "linear-gradient(135deg, rgba(254, 243, 199, 0.7) 0%, rgba(253, 230, 138, 0.4) 100%)",
              border: isDark ? "3px solid #2EC4B6" : "3px solid #FFD166",
              borderRadius: 30,
              padding: "36px 32px",
              boxShadow: "0 12px 24px -10px rgba(0,0,0,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 24,
              position: "relative",
              overflow: "hidden"
            }}
          >
            {/* Background design elements */}
            <div style={{ position: "absolute", right: "-40px", bottom: "-30px", fontSize: 140, opacity: 0.12, userSelect: "none" }}>🕹️</div>

            <div style={{ flex: "1 1 500px", zIndex: 10 }}>
              <Chip color="#B45309" bg="#FEF3C7" style={{ marginBottom: 12, fontWeight: 900, borderRadius: 12, fontSize: 11, border: "1.5px solid #F59E0B" }}>
                🔥 FEATURED LEARNING CHALLENGE
              </Chip>
              <Heading size={34} style={{ color: isDark ? "#ffffff" : "#0f172a", marginBottom: 10, fontFamily: F.display, fontWeight: 900 }}>
                🤖 Pattern Detective
              </Heading>
              <Txt size={16} color={isDark ? "#cbd5e1" : "#334155"} style={{ display: "block", marginBottom: 20 }}>
                Help Kobe teach a robot how to recognize patterns. Complete sequences to train automated intelligence brains!
              </Txt>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(251, 191, 36, 0.15)", border: "1.5px solid #FBBF24", padding: "6px 12px", borderRadius: 12 }}>
                  <span style={{ fontSize: 16 }}>⭐</span>
                  <Txt size={13.5} weight={900} color="#D97706">🏆 +100 XP REWARD</Txt>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.1)", border: "1.5px solid #10B981", padding: "6px 12px", borderRadius: 12 }}>
                  <span style={{ fontSize: 16 }}>🟢</span>
                  <Txt size={13} weight={800} color="#059669">Beginner Course</Txt>
                </div>
              </div>

              <button
                onClick={() => handlePlayGame("pattern-detective")}
                style={{
                  background: `linear-gradient(135deg, ${C.yellow}, ${C.yellowDark})`,
                  border: "none",
                  borderBottom: "5px solid #D97706",
                  color: "#1e293b",
                  padding: "16px 36px",
                  fontSize: 17,
                  fontWeight: 950,
                  borderRadius: 20,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: F.display,
                  transition: "all 0.15s active:translate-y-1 shadow-md hover:shadow-lg active:border-b-2"
                }}
                onMouseDown={(e)=> e.currentTarget.style.transform = "translateY(2px)"}
                onMouseUp={(e)=> e.currentTarget.style.transform = "none"}
              >
                PLAY NOW 🚀
              </button>
            </div>

            <div style={{ flex: "0 0 200px", display: "flex", justifyContent: "center", position: "relative", zIndex: 10 }}>
              <div style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff", padding: 20, borderRadius: "50%", border: "4px solid #FBBF24", boxShadow: "0 12px 24px rgba(0,0,0,0.05)" }}>
                <MascotImage character="kobe" height={130} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. GAME LIBRARY / LIST SECTION */}
      <div 
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Heading size={22} style={{ fontWeight: 800 }}>
            {activeAcademy === "ai" ? "📚 Available Academy Missions" : "🌟 Launch Pathways & Coming Soon"}
          </Heading>
          {activeAcademy !== "ai" && (
            <Txt size={12} weight={800} color="#FBBF24" style={{ background: "rgba(245,158,11,0.1)", border: "1.5px solid #F59E0B", padding: "4px 10px", borderRadius: 8 }}>
              COURSES ROLLING
            </Txt>
          )}
        </div>

        {/* COMING SOON BANNER */}
        {activeAcademy !== "ai" && (
          <div 
            style={{
              background: "linear-gradient(135deg, rgba(184, 160, 255, 0.15) 0%, rgba(46, 196, 182, 0.05) 100%)",
              border: "1.5px solid #B8A0FF",
              borderRadius: 20,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 10
            }}
          >
            <span style={{ fontSize: 24 }}>🌟</span>
            <Txt size={14.5} weight={800} color={isDark ? "#B8A0FF" : "#6366f1"}>
              New challenges are being developed for our founding learners. Keep studying lessons to unlock these!
            </Txt>
          </div>
        )}

        {/* RESPONSIVE GRID BOX CONTAINER */}
        <div 
          id="tour-games"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
            marginBottom: 44
          }}
        >
          {getActiveArray().map(game => {
            const isCompleted = completedGames.includes(game.id);
            const isComingSoon = game.status === "Coming Soon";
            const progressVal = getCompletedProgressPercentage(game.id);

            return (
              <div
                key={game.id}
                style={{
                  background: isDark ? "#1e293b" : "#ffffff",
                  border: isComingSoon 
                    ? (isDark ? "2.5px dashed #475569" : "2.5px dashed #cbd5e1")
                    : (isDark ? "3px solid #334155" : "3px solid #e2e8f0"),
                  borderBottom: isComingSoon 
                    ? (isDark ? "4px dashed #475569" : "4px dashed #cbd5e1")
                    : (isDark ? "6px solid #1e293b" : "6px solid #cbd5e1"),
                  borderRadius: 24,
                  padding: "20px 18px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                  opacity: isComingSoon ? 0.8 : 1
                }}
                className="game-card"
              >
                {/* Lock icon overlay for Coming Soon */}
                {isComingSoon && (
                  <div 
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      fontSize: 16,
                      background: isDark ? "rgba(0,0,0,0.3)" : "rgba(241,245,249,0.9)",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1.5px solid rgba(0,0,0,0.05)"
                    }}
                  >
                    🔒
                  </div>
                )}

                {/* Progress green badge for Completed */}
                {!isComingSoon && isCompleted && (
                  <div 
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      fontSize: 13,
                      background: "#10B981",
                      color: "#ffffff",
                      fontWeight: 900,
                      padding: "4px 10px",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    ✓ COMPLETED
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{game.icon}</div>
                  
                  {/* Game Name */}
                  <Heading size={18} style={{ fontWeight: 800, color: isDark ? "#fff" : "#1e293b", marginBottom: 6 }}>
                    {game.name}
                  </Heading>

                  {/* Description */}
                  <Txt size={13} color={isDark ? "#94a3b8" : "#64748b"} style={{ display: "block", minHeight: 40, lineHeight: 1.4, marginBottom: 14 }}>
                    {game.desc}
                  </Txt>

                  {/* Supports Academy Tag / connection */}
                  <div 
                    style={{
                      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(14,165,233,0.04)",
                      border: isDark ? "1px solid #334155" : "1.5px solid rgba(14,165,233,0.12)",
                      borderRadius: 14,
                      padding: "8px 10px",
                      marginBottom: 16
                    }}
                  >
                    <Txt size={11} color={isDark ? "#b8a0ff" : "#4f46e5"} style={{ display: "block", fontWeight: 800 }}>
                      🎯 ACADEMY ALIGNED:
                    </Txt>
                    <Txt size={11.5} weight={700} color={isDark ? "#94a3b8" : "#334155"} style={{ display: "block", marginTop: 2 }}>
                      Supports: <strong>{game.supportsModule}</strong>
                    </Txt>
                    <Txt size={11.5} color={isDark ? "#94a3b8" : "#334155"} style={{ display: "block" }}>
                      Lesson: <em>{game.supportsLesson}</em>
                    </Txt>
                  </div>
                </div>

                <div>
                  {/* METRICS -难度/奖励 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <Chip color={game.difficulty === "Beginner" ? "#10B981" : "#F59E0B"}>
                      {game.difficulty}
                    </Chip>
                    <Txt size={13} weight={900} color="#D97706">
                      ⭐ +{game.xpAward} XP
                    </Txt>
                  </div>

                  {/* DYNAMIC PROGRESS IN INDICATOR */}
                  {!isComingSoon && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <Txt size={11} weight={800} color={isDark ? "#94a3b8" : "#64748b"}>MISSION COMPLETION</Txt>
                        <Txt size={11.5} weight={900} color="#10B981">{progressVal}%</Txt>
                      </div>
                      <div style={{ width: "100%", height: 8, background: isDark ? "#334155" : "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${progressVal}%`, height: "100%", background: "#10B981", borderRadius: 4, transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                  )}

                  {/* INTERACTIVE ACTIONS KEYBUTTONS */}
                  {isComingSoon ? (
                    <button
                      onClick={() => handleNotifyMe(game.name)}
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.05)",
                        border: "1.5px solid #cbd5e1",
                        borderColor: isDark ? "#475569" : "#cbd5e1",
                        color: isDark ? "#94a3b8" : "#475569",
                        padding: "10px 14px",
                        fontSize: 12.5,
                        fontWeight: 800,
                        borderRadius: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      🔔 Notify Me
                    </button>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handlePlayGame(game.id)}
                      style={{
                        width: "100%",
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "2px solid #10B981",
                        color: "#10B981",
                        padding: "12px 14px",
                        fontSize: 13,
                        fontWeight: 900,
                        borderRadius: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      🔄 Replay Game (Earned)
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlayGame(game.id)}
                      style={{
                        width: "100%",
                        background: "#2EC4B6",
                        border: "none",
                        borderBottom: "4px solid #1f8279",
                        color: "#0a0a0a",
                        padding: "12px 14px",
                        fontSize: 13,
                        fontWeight: 900,
                        borderRadius: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      Play Game ▶
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. COLLECTED BADGES MILESTONES PREVIEWS */}
      <div 
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          background: isDark ? "#1e293b" : "#ffffff",
          border: isDark ? "3px solid #334155" : "3px solid #e2e8f0",
          borderRadius: 24,
          padding: "24px 20px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          <div>
            <Heading size={18} style={{ fontWeight: 800 }}>
              🏅 Unlocked Academy Badges Previews
            </Heading>
            <Txt size={12} color={isDark ? "#cbd5e1" : "#64748b"} style={{ display: "block" }}>
              Every active mission you finish awards a unique badge of honor to Captain {child.name || "Explorer"}!
            </Txt>
          </div>
          <Chip bg={isDark ? "rgba(184, 160, 255, 0.15)" : "rgba(99,102,241,0.1)"} color={isDark ? "#B8A0FF" : "#6366f1"} style={{ fontSize: 11, fontWeight: 900, padding: "6px 12px" }}>
            🎖️ CLATS BADGE LOCKER: {badgesEarnedCount} / 4
          </Chip>
        </div>

        <div 
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16
          }}
        >
          {badgesList.map(b => (
            <div
              key={b.id}
              style={{
                background: b.unlocked 
                  ? (isDark ? "rgba(16,185,129,0.06)" : "linear-gradient(135deg, rgba(254,243,197,0.4) 0%, rgba(251,191,36,0.1) 100%)") 
                  : (isDark ? "#0f172a" : "#f1f5f9"),
                border: b.unlocked 
                  ? `2px solid ${b.color}`
                  : (isDark ? "2px solid #334155" : "2px solid #cbd5e1"),
                borderRadius: 20,
                padding: "16px 14px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                position: "relative"
              }}
            >
              <div 
                style={{
                  fontSize: 32,
                  filter: b.unlocked ? "none" : "grayscale(100%) opacity(0.4)",
                  transform: b.unlocked ? "scale(1.15)" : "none",
                  transition: "all 0.3s ease"
                }}
              >
                {b.icon}
              </div>

              <div>
                <Heading size={14.5} style={{ color: b.unlocked ? (isDark ? "#fff" : "#78350F") : (isDark ? "#64748b" : "#94a3b8"), fontWeight: 900 }}>
                  {b.name}
                </Heading>
                <Txt size={11} color={b.unlocked ? (isDark ? "#cbd5e1" : "#92400E") : (isDark ? "#475569" : "#94a3b8")} style={{ display: "block", marginTop: 2 }}>
                  {b.desc}
                </Txt>
                {b.unlocked ? (
                  <Txt size={10} color="#10B981" weight={900} style={{ display: "block", marginTop: 4, textTransform: "uppercase" }}>
                    ⭐ ACTIVATED WIN
                  </Txt>
                ) : (
                  <Txt size={10} color={isDark ? "#cbd5e1" : "#94a3b8"} weight={800} style={{ display: "block", marginTop: 4 }}>
                    🔒 LOCKED
                  </Txt>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. GENUINE INTERACTIVE QUESTS MODAL SCREEN */}
      {activeGameModal && !isGameCompleted && (() => {
        const gameId = activeGameModal;
        if (gameId === "teachable-machine") {
          return (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(15, 23, 42, 0.8)",
                backdropFilter: "blur(4px)",
                zIndex: 10000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16
              }}
            >
              <TeachableMachine
                onBack={() => {
                  sfx.playTap();
                  setActiveGameModal(null);
                }}
              />
            </div>
          );
        }
        if (gameId === "phishing-swipe") {
          return (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(15, 23, 42, 0.8)",
                backdropFilter: "blur(4px)",
                zIndex: 10000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16
              }}
            >
              <PhishingSwipe
                onBack={() => {
                  sfx.playTap();
                  setActiveGameModal(null);
                }}
              />
            </div>
          );
        }

        if (gameId === "smart-city-builder") {
          return (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(15, 23, 42, 0.8)",
                backdropFilter: "blur(4px)",
                zIndex: 10000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16
              }}
            >
              <SmartCityBuilder
                child={child}
                isDark={isDark}
                onClose={() => {
                  sfx.playTap();
                  setActiveGameModal(null);
                }}
                onComplete={async (xp) => {
                  try {
                    const completedKeys = [...completedGames, "smart-city-builder"];
                    setCompletedGames(completedKeys);
                    localStorage.setItem(`clats_game_completed_${child.id}_smart-city-builder`, "true");

                    // Sync game completion progress to Supabase
                    const syncRes = await fetch("/api/supabase/sync", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        childId: child.id,
                        xp: child.xp + xp,
                        completedLessons: {
                          ...(child.completedLessons || {}),
                          "smart-city-builder": true
                        }
                      })
                    });

                    if (syncRes.ok) {
                      console.log("Successfully synchronized Smart City game completion to Supabase.");
                    }
                  } catch (e) {
                    console.error("Failed to sync Smart City completion:", e);
                  }

                  setIsGameCompleted(true);
                  setShowXPClaimModal({
                    xp,
                    title: "Smart City Builder"
                  });
                }}
              />
            </div>
          );
        }

        const currentQuests = 
          gameId === "pattern-detective" ? patternQuests :
          gameId === "ai-sorting" ? sortingQuests :
          gameId === "smart-machine" ? matchingQuests :
          trainingQuests;

        const currentQuest = currentQuests[gameStep];
        const progressPercentage = ((gameStep) / currentQuests.length) * 100;

        return (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.8)",
              backdropFilter: "blur(4px)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 480,
                background: isDark ? "#1e293b" : "#ffffff",
                border: "4px solid #2EC4B6",
                borderRadius: 28,
                padding: 24,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
                color: isDark ? "#fff" : "#1e293b",
                position: "relative"
              }}
            >
              {/* Modal close */}
              <button
                onClick={() => {
                  sfx.playTap();
                  setActiveGameModal(null);
                }}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: isDark ? "rgba(255,255,255,0.05)" : "#cbd5e1",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  color: isDark ? "#fff" : "#1e293b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16
                }}
              >
                ✕
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>🕹️</span>
                <div>
                  <Heading size={18} style={{ fontWeight: 900 }}>
                    {gameId === "pattern-detective" ? "Pattern Detective" : gameId === "ai-sorting" ? "AI Sorting Challenge" : gameId === "smart-machine" ? "Smart Machine Match" : "Train the Robot"}
                  </Heading>
                  <Txt size={11} color="#2EC4B6" style={{ fontWeight: 800 }}>
                    Step {gameStep + 1} of {currentQuests.length} Progress
                  </Txt>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: "100%", height: 10, background: isDark ? "#334155" : "#e2e8f0", borderRadius: 5, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ width: `${progressPercentage}%`, height: "100%", background: "#2EC4B6", borderRadius: 5, transition: "width 0.3s ease" }} />
              </div>

              {/* Interactive Area */}
              <div style={{ background: isDark ? "rgba(0,0,0,0.15)" : "#f8fafc", border: `2px solid ${isDark ? "#334155" : "#cbd5e1"}`, borderRadius: 20, padding: 18, marginBottom: 20 }}>
                {gameId === "ai-sorting" && (
                  <div style={{ fontSize: 44, textAlign: "center", marginBottom: 8 }}>{(currentQuest as any).item}</div>
                )}
                {gameId === "smart-machine" && (
                  <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>🧠 {(currentQuest as any).tool.split(" ")[0]}</div>
                )}
                {gameId === "train-robot" && (
                  <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>🐕 {(currentQuest as any).animal.split(" ")[0]}</div>
                )}

                <Txt size={14.5} weight={800} style={{ display: "block", color: isDark ? "#fff" : "#0f172a", marginBottom: 6 }}>
                  {gameId === "pattern-detective" ? (currentQuest as any).instructions : 
                   gameId === "ai-sorting" ? `Object: ${(currentQuest as any).item}` : 
                   gameId === "smart-machine" ? `Smart Tool: ${(currentQuest as any).tool}` : 
                   `Sensor Feed: ${(currentQuest as any).animal}`}
                </Txt>

                <Txt size={13} color={isDark ? "#cbd5e1" : "#475569"} style={{ display: "block" }}>
                  {currentQuest.instructions}
                </Txt>
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {currentQuest.options.map((opt: string, idx: number) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrectAnswer = idx === currentQuest.correctIndex;
                  const hasAnswered = selectedAnswer !== null;

                  let optionBorder = isDark ? "2px solid #334155" : "2px solid #cbd5e1";
                  let optionBg = isDark ? "#1e293b" : "#ffffff";
                  let optionColor = isDark ? "#cbd5e1" : "#334155";

                  if (hasAnswered) {
                    if (isCorrectAnswer) {
                      optionBorder = "2px solid #10B981";
                      optionBg = isDark ? "rgba(16,185,129,0.15)" : "#d1fae5";
                      optionColor = "#047857";
                    } else if (isSelected) {
                      optionBorder = "2px solid #ef4444";
                      optionBg = isDark ? "rgba(239,68,68,0.15)" : "#fee2e2";
                      optionColor = "#b91c1c";
                    }
                  } else {
                    optionBorder = isDark ? "2.5px solid #334155" : "2.5px solid #e2e8f0";
                    optionBorder = isDark ? "2.5px solid #334155 border-b-4" : "2.5px solid #cbd5e1 border-b-4";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasAnswered}
                      onClick={() => handleQuestSelect(gameStep, idx, currentQuests)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 16,
                        border: optionBorder,
                        background: optionBg,
                        color: optionColor,
                        fontFamily: F.body,
                        fontSize: 14,
                        fontWeight: 800,
                        textAlign: "left",
                        cursor: hasAnswered ? "not-allowed" : "pointer",
                        transition: "all 0.1s"
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Dialog */}
              {gameFeedback && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div 
                    style={{ 
                      background: isDark ? "rgba(46,196,182,0.1)" : "rgba(46,196,182,0.06)",
                      border: "1.5px solid #2EC4B6",
                      borderRadius: 16,
                      padding: "12px 14px"
                    }}
                  >
                    <Txt size={13} color={isDark ? "#cbd5e1" : "#1f8279"} style={{ display: "block" }}>
                      {gameFeedback}
                    </Txt>
                  </div>

                  <button
                    onClick={() => handleNextQuest(currentQuests, gameId, gameId === "pattern-detective" ? 50 : gameId === "ai-sorting" ? 50 : gameId === "smart-machine" ? 75 : 100)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "#2EC4B6",
                      border: "none",
                      borderBottom: "4px solid #1f8279",
                      borderRadius: 16,
                      color: "#111",
                      fontFamily: F.display,
                      fontSize: 14.5,
                      fontWeight: 950,
                      cursor: "pointer"
                    }}
                  >
                    Continue Journey →
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 7. XP GRAND COIN UNLOCKED CELEBRATION MODAL */}
      {showXPClaimModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10, 15, 30, 0.95)",
            backdropFilter: "blur(6px)",
            zIndex: 11000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24
          }}
        >
          <div
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              border: "4px solid #F59E0B",
              borderRadius: 28,
              padding: 36,
              width: "100%",
              maxWidth: 400,
              textAlign: "center",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)"
            }}
          >
            <span style={{ fontSize: 60, display: "block", marginBottom: 12 }}>🎉🌟</span>
            
            <Heading size={28} style={{ color: isDark ? "#fff" : "#1e293b", fontWeight: 900, marginBottom: 6 }}>
              Challenge Complete!
            </Heading>
            
            <div style={{ margin: "20px 0", padding: "16px", borderRadius: 20, background: "rgba(251,191,36,0.12)", border: "2px solid #FBBF24" }}>
              <Txt size={14} weight={805} style={{ display: "block", color: isDark ? "#ffd166" : "#b45309" }}>
                You earned:
              </Txt>
              <Heading size={36} color="#FBBF24" style={{ margin: "8px 0 2px", fontWeight: 950 }}>
                ⭐ {showXPClaimModal.xp} XP
              </Heading>
              <Txt size={11} weight={800} style={{ display: "block", color: isDark ? "#cbd5e1" : "#555" }}>
                Progress Saved.
              </Txt>
            </div>

            <Txt size={13.5} color={isDark ? "#b8a0ff" : "#4f46e5"} style={{ display: "block", fontWeight: 900, textTransform: "uppercase", marginBottom: 20 }}>
              🎖️ Unlocked Badge: {showXPClaimModal.title === "Pattern Detective" ? "Pattern Master 🏅" : 
                                   showXPClaimModal.title === "AI Sorting Challenge" ? "AI Explorer 🚀" : 
                                   showXPClaimModal.title === "Smart Machine Match" ? "Smart Thinker 🧠" : 
                                   "Future Builder 🤖"}
            </Txt>

            <button
              onClick={() => finishQuestXPClaim(showXPClaimModal.xp)}
              style={{
                background: `linear-gradient(135deg, ${C.yellow}, ${C.yellowDark})`,
                border: "none",
                borderBottom: "5px solid #d97706",
                borderRadius: 18,
                padding: "16px 24px",
                color: "#111114",
                fontSize: 15.5,
                fontWeight: 950,
                cursor: "pointer",
                width: "100%",
                fontFamily: F.display
              }}
            >
              Fabulous! Claim Reward 🎁
            </button>
          </div>
        </div>
      )}

      {/* Notification overlay alerts */}
      {notificationMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: 20,
            right: 20,
            zIndex: 50000,
            display: "flex",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "2px solid #2EC4B6",
              color: "#ffffff",
              padding: "14px 20px",
              borderRadius: 20,
              boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              maxWidth: 450,
              textAlign: "center"
            }}
          >
            <Txt size={13.5} weight={800}>
              {notificationMessage}
            </Txt>
            <button
              onClick={() => setNotificationMessage(null)}
              style={{
                marginLeft: 14,
                background: "#2EC4B6",
                color: "#1e293b",
                border: "none",
                padding: "4px 10px",
                borderRadius: 8,
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              Fabulous
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildGames;
