import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { MeadowLevelConfig, RegionId, WonderWoodsProgress } from "./types";
import { MEADOW_LEVELS } from "./data/meadowLevels";
import { IntroScreen } from "./components/IntroScreen";
import { WorldMap } from "./components/WorldMap";
import { MissionBoard } from "./components/MissionBoard";
import { MissionPreview } from "./components/MissionPreview";
import { ChallengeWorkspace } from "./components/ChallengeWorkspace";
import { FeedbackModal } from "./components/FeedbackModal";
import { sfx, gameMusic, companionVoice } from "../../../utils/audio";

export interface WonderWoodsEngineProps {
  onExit?: () => void;
  onRewardXP?: (xp: number) => void;
  companion?: "kobe" | "chibi";
  lang?: string;
  childId?: string;
}

export const WonderWoodsEngine: React.FC<WonderWoodsEngineProps> = ({
  onExit,
  onRewardXP,
  companion = "kobe",
  lang = "en",
  childId = "default"
}) => {
  // Screen Router State
  const [currentScreen, setCurrentScreen] = useState<
    "intro" | "world_map" | "mission_board" | "preview" | "gameplay"
  >("intro");

  // Selected state
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>("meadow");
  const [activeLevel, setActiveLevel] = useState<MeadowLevelConfig>(MEADOW_LEVELS[0]);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [lastEarnedStars, setLastEarnedStars] = useState<number>(3);
  const [isCurrentLevelReplay, setIsCurrentLevelReplay] = useState<boolean>(false);

  // Audio controls state (Background Song & Companion Voice Read-Aloud)
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => gameMusic.isMusicEnabled());
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => companionVoice.isNarrationEnabled("early explorers"));

  // Switch subtle background song to match current screen and level phase
  useEffect(() => {
    if (!musicEnabled) {
      gameMusic.stop(false);
      return;
    }
    if (currentScreen === "preview" || currentScreen === "gameplay") {
      const levelTheme = gameMusic.getThemeForMeadowLevel(activeLevel.id);
      gameMusic.startTheme(levelTheme);
    } else {
      gameMusic.startTheme("wonder_woods_hub");
    }
  }, [currentScreen, activeLevel.id, musicEnabled]);

  // Stop music and speech cleanly when exiting Wonder Woods
  useEffect(() => {
    return () => {
      gameMusic.stop();
      companionVoice.stop();
    };
  }, []);

  // Per-child persistence
  const storageKey = `clats_wonder_woods_progress_${childId}`;

  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.unlockedLevel || 1;
      }
    } catch {}
    return 1;
  });

  const [completedLevels, setCompletedLevels] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.completedLevels || [];
      }
    } catch {}
    return [];
  });

  const [starsPerLevel, setStarsPerLevel] = useState<Record<number, number>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.starsPerLevel || {};
      }
    } catch {}
    return {};
  });

  const [totalSparks, setTotalSparks] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.totalSparks || 0;
      }
    } catch {}
    return 0;
  });

  const [isGroveUnlocked, setIsGroveUnlocked] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Boolean(parsed.isGroveUnlocked || parsed.completedLevels?.includes(10));
      }
    } catch {}
    return false;
  });

  const [badgeEarned, setBadgeEarned] = useState<string | undefined>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.badgeEarned;
      }
    } catch {}
    return undefined;
  });

  const saveProgress = (
    newUnlocked: number,
    newCompleted: number[],
    newStars: Record<number, number>,
    newSparks: number,
    newGroveUnlocked: boolean,
    newBadge?: string
  ) => {
    setUnlockedLevel(newUnlocked);
    setCompletedLevels(newCompleted);
    setStarsPerLevel(newStars);
    setTotalSparks(newSparks);
    setIsGroveUnlocked(newGroveUnlocked);
    if (newBadge) setBadgeEarned(newBadge);

    const progressPayload: WonderWoodsProgress = {
      unlockedLevel: newUnlocked,
      completedLevels: newCompleted,
      starsPerLevel: newStars,
      totalSparks: newSparks,
      isGroveUnlocked: newGroveUnlocked,
      badgeEarned: newBadge || badgeEarned,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(progressPayload));
    } catch (e) {
      console.warn("Could not save Wonder Woods progress to localStorage:", e);
    }

    // Background cloud sync to Supabase if endpoint exists
    try {
      fetch("/api/supabase/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          type: "wonder_woods_progress",
          payload: progressPayload
        })
      }).catch(() => {});
    } catch {}
  };

  // Level Completion Handler with Star Payout
  const handleLevelCompleted = (stars: number = 3) => {
    setLastEarnedStars(stars);

    const isAlreadyCompleted = completedLevels.includes(activeLevel.id);
    setIsCurrentLevelReplay(isAlreadyCompleted);
    const updatedCompleted = isAlreadyCompleted 
      ? completedLevels 
      : [...completedLevels, activeLevel.id];

    const nextLevelToUnlock = Math.max(unlockedLevel, activeLevel.id + 1);
    const updatedStars = {
      ...starsPerLevel,
      [activeLevel.id]: Math.max(starsPerLevel[activeLevel.id] || 0, stars)
    };
    const updatedSparks = isAlreadyCompleted ? totalSparks : totalSparks + 1;
    const shouldUnlockGrove = isGroveUnlocked || activeLevel.id === 10;
    const earnedBadge = activeLevel.id === 10 ? "bdg-pattern-meadow-master" : badgeEarned;

    saveProgress(
      nextLevelToUnlock,
      updatedCompleted,
      updatedStars,
      updatedSparks,
      shouldUnlockGrove,
      earnedBadge
    );

    // Reward XP ONLY on first completion to prevent duplicate XP farming
    if (!isAlreadyCompleted) {
      onRewardXP?.(activeLevel.xpAward);
    }

    // Open celebration modal
    setShowFeedbackModal(true);
  };

  const handleNextFromFeedback = () => {
    setShowFeedbackModal(false);
    const nextLevelId = activeLevel.id + 1;
    const nextLevelConfig = MEADOW_LEVELS.find(l => l.id === nextLevelId);

    if (nextLevelConfig && nextLevelConfig.id <= 10) {
      setActiveLevel(nextLevelConfig);
      setCurrentScreen("preview");
    } else {
      // Reached end of Meadow! Return to World Map so child can admire unlocked Grove
      setCurrentScreen("world_map");
    }
  };

  const handleToggleMusic = () => {
    sfx.playTap();
    const next = gameMusic.toggleMusic();
    setMusicEnabled(next);
  };

  const handleToggleVoice = () => {
    sfx.playTap();
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    companionVoice.setNarrationEnabled("early explorers", next);
    if (!next) {
      companionVoice.stop();
    } else {
      companionVoice.speakTTS("Companion voice narration is on!", companion, "early explorers", lang);
    }
  };

  return (
    <div className="w-full h-full min-h-[620px] max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative bg-[#090E17] border-4 border-slate-800 flex flex-col">
      {/* Persistent Subtle Music & Voice Control Strip */}
      <div className="w-full bg-slate-950/90 border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-[11px] z-30">
        <div className="flex items-center gap-2 text-slate-400 font-bold truncate">
          <Music size={13} className={musicEnabled ? "text-emerald-400 animate-pulse" : "text-slate-600"} />
          <span className="truncate">
            {musicEnabled ? `Song: ${gameMusic.getActiveTrackName()}` : "Music Muted"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleMusic}
            className={`px-2.5 py-1 rounded-full font-black flex items-center gap-1 transition border ${
              musicEnabled
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="Toggle background woodland music"
          >
            <Music size={12} />
            <span>{musicEnabled ? "Music: ON" : "Music: OFF"}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleVoice}
            className={`px-2.5 py-1 rounded-full font-black flex items-center gap-1 transition border ${
              voiceEnabled
                ? "bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="Toggle automatic companion voice reading"
          >
            {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            <span>{voiceEnabled ? "Auto-Read: ON" : "Auto-Read: OFF"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* 1. INTRO SCREEN */}
        {currentScreen === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex-1"
          >
            <IntroScreen
              companion={companion}
              unlockedLevel={unlockedLevel}
              totalStars={completedLevels.length}
              onStart={() => setCurrentScreen("world_map")}
              onExit={onExit}
            />
          </motion.div>
        )}

        {/* 2. WORLD MAP */}
        {currentScreen === "world_map" && (
          <motion.div
            key="world_map"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex-1"
          >
            <WorldMap
              starsCollected={completedLevels.length}
              unlockedLevel={unlockedLevel}
              isGroveUnlocked={isGroveUnlocked}
              onSelectRegion={(regId) => {
                setSelectedRegionId(regId);
                setCurrentScreen("mission_board");
              }}
              onBackToIntro={() => setCurrentScreen("intro")}
              onExit={onExit}
            />
          </motion.div>
        )}

        {/* 3. PATTERN MEADOW MISSION BOARD */}
        {currentScreen === "mission_board" && (
          <motion.div
            key="mission_board"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex-1"
          >
            <MissionBoard
              unlockedLevel={unlockedLevel}
              completedLevels={completedLevels}
              starsPerLevel={starsPerLevel}
              onSelectLevel={(lvl) => {
                setActiveLevel(lvl);
                setCurrentScreen("preview");
              }}
              onBackToMap={() => setCurrentScreen("world_map")}
            />
          </motion.div>
        )}

        {/* 4. ANIMATED MISSION PREVIEW */}
        {currentScreen === "preview" && (
          <motion.div
            key={`preview_${activeLevel.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex-1"
          >
            <MissionPreview
              preview={activeLevel.preview}
              levelNumber={activeLevel.id}
              levelTitle={activeLevel.title}
              companion={companion}
              lang={lang}
              onPlay={() => setCurrentScreen("gameplay")}
              onSkip={() => setCurrentScreen("gameplay")}
            />
          </motion.div>
        )}

        {/* 5. GAMEPLAY WORKSPACE */}
        {currentScreen === "gameplay" && (
          <motion.div
            key={`gameplay_${activeLevel.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex-1"
          >
            <ChallengeWorkspace
              level={activeLevel}
              companion={companion}
              lang={lang}
              onBackToBoard={() => setCurrentScreen("mission_board")}
              onReplayPreview={() => setCurrentScreen("preview")}
              onCompleteLevel={handleLevelCompleted}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEEDBACK & REWARD CELEBRATION MODAL */}
      {showFeedbackModal && (
        <FeedbackModal
          levelTitle={activeLevel.title}
          subrule={activeLevel.subrule}
          xpAward={activeLevel.xpAward}
          starsEarned={lastEarnedStars}
          isGrandFinale={activeLevel.id === 10}
          isReplay={isCurrentLevelReplay}
          companion={companion}
          lang={lang}
          onNext={handleNextFromFeedback}
          onReplay={() => {
            setShowFeedbackModal(false);
            setCurrentScreen("gameplay");
          }}
        />
      )}
    </div>
  );
};

