import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MeadowLevelConfig, RegionId } from "./types";
import { MEADOW_LEVELS } from "./data/meadowLevels";
import { IntroScreen } from "./components/IntroScreen";
import { WorldMap } from "./components/WorldMap";
import { MissionBoard } from "./components/MissionBoard";
import { MissionPreview } from "./components/MissionPreview";
import { ChallengeWorkspace } from "./components/ChallengeWorkspace";
import { FeedbackModal } from "./components/FeedbackModal";
import { sfx } from "../../../utils/audio";

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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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

  const saveProgress = (newUnlocked: number, newCompleted: number[]) => {
    setUnlockedLevel(newUnlocked);
    setCompletedLevels(newCompleted);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          unlockedLevel: newUnlocked,
          completedLevels: newCompleted,
          updatedAt: new Date().toISOString()
        })
      );
    } catch (e) {
      console.warn("Could not save Wonder Woods progress to localStorage:", e);
    }
  };

  // Level Completion Handler
  const handleLevelCompleted = () => {
    const isAlreadyCompleted = completedLevels.includes(activeLevel.id);
    const updatedCompleted = isAlreadyCompleted 
      ? completedLevels 
      : [...completedLevels, activeLevel.id];

    const nextLevelToUnlock = Math.max(unlockedLevel, activeLevel.id + 1);
    saveProgress(nextLevelToUnlock, updatedCompleted);

    // Reward XP
    onRewardXP?.(activeLevel.xpAward);

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
      // Reached end of Meadow! Return to Mission Board
      setCurrentScreen("mission_board");
    }
  };

  return (
    <div className="w-full h-full min-h-[620px] max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative bg-[#090E17] border-4 border-slate-800 flex flex-col">
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
              onSelectRegion={(regId) => {
                setSelectedRegionId(regId);
                setCurrentScreen("mission_board");
              }}
              onBackToIntro={() => setCurrentScreen("intro")}
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
          isGrandFinale={activeLevel.id === 10}
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
