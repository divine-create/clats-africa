import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, RotateCcw, Eye, Sparkles, Check, HelpCircle } from "lucide-react";
import { MeadowLevelConfig, PatternItem, SequenceSlotData } from "../types";
import { TactileTile } from "./TactileTile";
import { CompanionGuidance } from "./CompanionGuidance";
import { sfx } from "../../../../utils/audio";

interface ChallengeWorkspaceProps {
  level: MeadowLevelConfig;
  companion: "kobe" | "chibi";
  lang?: string;
  onBackToBoard: () => void;
  onReplayPreview: () => void;
  onCompleteLevel: () => void;
}

export const ChallengeWorkspace: React.FC<ChallengeWorkspaceProps> = ({
  level,
  companion,
  lang = "en",
  onBackToBoard,
  onReplayPreview,
  onCompleteLevel
}) => {
  // Sequence Fill State
  const [sequenceSlots, setSequenceSlots] = useState<SequenceSlotData[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<PatternItem | null>(null);

  // Category Sort State
  const [unsortedItems, setUnsortedItems] = useState<PatternItem[]>([]);
  const [binCounts, setBinCounts] = useState<Record<string, number>>({});

  // Level 10 Archway Creation State
  const [createdSlots, setCreatedSlots] = useState<(PatternItem | null)[]>([]);
  const [selectedRuleType, setSelectedRuleType] = useState<"AB" | "AAB" | "ABC">("AB");

  // Interaction feedback states
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorSlotIndex, setErrorSlotIndex] = useState<number | null>(null);

  // Initialize challenge states based on mode
  useEffect(() => {
    setIsSuccess(false);
    setErrorSlotIndex(null);

    if (level.mode === "sequence_fill" && level.sequence) {
      setSequenceSlots(level.sequence.slots.map(s => ({
        ...s,
        filledItem: s.prefilledItem || null
      })));
    } else if (level.mode === "category_sort" && level.classification) {
      setUnsortedItems([...level.classification.items]);
      setBinCounts({});
    } else if (level.mode === "rule_builder" && level.creation) {
      setCreatedSlots(Array(level.creation.targetLength).fill(null));
      setSelectedRuleType("AB");
    }
  }, [level]);

  // Handle Sequence Placement (Click or Drop)
  const handlePlaceItemInSlot = (item: PatternItem, slotIndex: number) => {
    if (isSuccess) return;
    const slot = sequenceSlots[slotIndex];
    if (!slot || !slot.isMissing) return;

    if (item.id === slot.expectedItem.id) {
      // Correct!
      sfx.play("success");
      setSequenceSlots(prev => prev.map((s, idx) => idx === slotIndex ? { ...s, filledItem: item } : s));
      setIsSuccess(true);
      setTimeout(() => onCompleteLevel(), 2400);
    } else {
      // Incorrect nudge
      sfx.play("error");
      setErrorSlotIndex(slotIndex);
      setTimeout(() => setErrorSlotIndex(null), 800);
    }
  };

  // Handle Category Sort
  const handleSortItemIntoBin = (item: PatternItem, binId: string) => {
    if (isSuccess || !level.classification) return;
    const bin = level.classification.bins.find(b => b.id === binId);
    if (!bin) return;

    const isMatch = bin.acceptedCategories.includes(item.category || "");
    if (isMatch) {
      sfx.play("pop");
      setUnsortedItems(prev => prev.filter(i => i.id !== item.id));
      setBinCounts(prev => ({ ...prev, [binId]: (prev[binId] || 0) + 1 }));

      // Check if all items sorted
      if (unsortedItems.length <= 1) {
        setIsSuccess(true);
        sfx.play("success");
        setTimeout(() => onCompleteLevel(), 2400);
      }
    } else {
      sfx.play("error");
    }
  };

  // Handle Level 10 Archway Creation
  const handlePlaceCreationItem = (item: PatternItem) => {
    if (isSuccess || !level.creation) return;
    const nextEmptyIndex = createdSlots.findIndex(s => s === null);
    if (nextEmptyIndex === -1) return;

    sfx.play("pop");
    const updated = [...createdSlots];
    updated[nextEmptyIndex] = item;
    setCreatedSlots(updated);

    // If completely filled, verify rule consistency
    if (nextEmptyIndex === createdSlots.length - 1) {
      const isConsistent = verifyPatternConsistency(updated as PatternItem[], selectedRuleType);
      if (isConsistent) {
        setIsSuccess(true);
        sfx.play("success");
        setTimeout(() => onCompleteLevel(), 2500);
      } else {
        sfx.play("error");
        setTimeout(() => {
          setCreatedSlots(Array(level.creation!.targetLength).fill(null));
        }, 1200);
      }
    }
  };

  const verifyPatternConsistency = (items: PatternItem[], rule: "AB" | "AAB" | "ABC") => {
    if (items.length < 4) return false;
    if (rule === "AB") {
      return items[0].id === items[2].id && items[1].id === items[3].id && items[0].id !== items[1].id;
    }
    if (rule === "AAB") {
      return items[0].id === items[1].id && items[0].id !== items[2].id && items[3].id === items[4].id;
    }
    if (rule === "ABC") {
      return items[0].id === items[3].id && items[1].id === items[4].id && items[2].id === items[5]?.id;
    }
    return true;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-4 sm:p-6 bg-gradient-to-b from-[#091522] via-[#0E2232] to-[#07131D] text-white rounded-3xl overflow-hidden relative min-h-[560px]">
      {/* Background Soft Glow */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full flex justify-between items-center z-20">
        <button
          type="button"
          onClick={onBackToBoard}
          className="p-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition shadow-md"
          title="Back to Mission Trail"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3 py-0.5 rounded-full text-emerald-300 text-xs font-black">
            <span>Level {level.id} · {level.phase}</span>
          </div>
          <h3 
            className="text-base sm:text-lg font-black text-white mt-1 drop-shadow"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
          >
            {level.title}
          </h3>
        </div>

        <button
          type="button"
          onClick={onReplayPreview}
          className="p-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-400/40 rounded-full transition text-xs font-black flex items-center gap-1 shadow-md"
          title="Replay Demonstration"
        >
          <Eye size={15} />
          <span className="hidden sm:inline">Preview</span>
        </button>
      </div>

      {/* Companion Guidance Prompt */}
      <CompanionGuidance 
        companion={companion} 
        speechText={level.companionVoicePrompt} 
        lang={lang} 
        className="z-20 my-2"
      />

      {/* Main Interactive Stage */}
      <div className="my-auto flex flex-col items-center w-full max-w-2xl z-20 px-2">
        {/* MODE 1: SEQUENCE FILL */}
        {level.mode === "sequence_fill" && level.sequence && (
          <div className="w-full flex flex-col items-center gap-6">
            {/* Sequence Slots Bar */}
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 p-5 bg-slate-900/80 border-2 border-slate-700 rounded-3xl shadow-2xl backdrop-blur-md">
              {sequenceSlots.map((slot, idx) => {
                const isError = errorSlotIndex === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (slot.isMissing && selectedChoice) {
                        handlePlaceItemInSlot(selectedChoice, idx);
                      }
                    }}
                    onDragOver={(e) => slot.isMissing && e.preventDefault()}
                    onDrop={(e) => {
                      const itemId = e.dataTransfer.getData("patternItemId");
                      const choice = level.sequence?.choices.find(c => c.id === itemId);
                      if (choice) handlePlaceItemInSlot(choice, idx);
                    }}
                    className={`relative rounded-3xl flex items-center justify-center transition-all ${
                      slot.isMissing && !slot.filledItem
                        ? `w-20 h-20 sm:w-22 sm:h-22 border-3 border-dashed ${
                            isError 
                              ? "border-rose-500 bg-rose-500/20 animate-shake" 
                              : "border-amber-400 bg-amber-400/10 animate-pulse cursor-pointer hover:bg-amber-400/20"
                          }`
                        : ""
                    }`}
                  >
                    {slot.filledItem ? (
                      <TactileTile 
                        item={slot.filledItem} 
                        size="md" 
                        state={slot.isMissing ? "correct" : "idle"}
                        disabled
                      />
                    ) : (
                      <span className="text-2xl font-black text-amber-400/60 select-none">
                        ?
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Choices Palette Bank */}
            <div className="w-full flex flex-col items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Tap or drag a choice to place:
              </span>
              <div className="flex justify-center gap-4">
                {level.sequence.choices.map((choice) => (
                  <TactileTile
                    key={choice.id}
                    item={choice}
                    size="md"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("patternItemId", choice.id)}
                    onClick={() => {
                      const missingIndex = sequenceSlots.findIndex(s => s.isMissing && !s.filledItem);
                      if (missingIndex !== -1) {
                        handlePlaceItemInSlot(choice, missingIndex);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: CATEGORY SORT */}
        {level.mode === "category_sort" && level.classification && (
          <div className="w-full flex flex-col items-center gap-6">
            {/* Sorting Bins */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {level.classification.bins.map((bin) => (
                <div
                  key={bin.id}
                  onClick={() => {
                    if (unsortedItems.length > 0) {
                      handleSortItemIntoBin(unsortedItems[0], bin.id);
                    }
                  }}
                  className="bg-slate-900/90 border-2 rounded-3xl p-4 flex flex-col items-center text-center shadow-xl cursor-pointer hover:scale-[1.02] transition"
                  style={{ borderColor: bin.color }}
                >
                  <span className="text-3xl mb-1">{bin.icon}</span>
                  <h4 className="text-sm font-black text-white" style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}>
                    {bin.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold mt-1">
                    {bin.ruleDescription}
                  </span>
                  <div className="mt-3 px-3 py-1 rounded-full text-xs font-black bg-black/40 text-amber-300">
                    {binCounts[bin.id] || 0} Sorted
                  </div>
                </div>
              ))}
            </div>

            {/* Unsorted Items Queue */}
            <div className="w-full flex flex-col items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Tap a basket to sort this item ({unsortedItems.length} remaining):
              </span>
              <div className="flex justify-center gap-3 min-h-[90px]">
                {unsortedItems.slice(0, 3).map((item, idx) => (
                  <TactileTile
                    key={item.id}
                    item={item}
                    size={idx === 0 ? "md" : "sm"}
                    state={idx === 0 ? "selected" : "idle"}
                    disabled={idx !== 0}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: RULE BUILDER (LEVEL 10 ARCHWAY) */}
        {level.mode === "rule_builder" && level.creation && (
          <div className="w-full flex flex-col items-center gap-5">
            {/* Rule Selector */}
            <div className="flex gap-2">
              {level.creation.allowedRules.map((rule) => (
                <button
                  key={rule}
                  type="button"
                  onClick={() => {
                    sfx.playTap();
                    setSelectedRuleType(rule);
                    setCreatedSlots(Array(level.creation!.targetLength).fill(null));
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-black transition ${
                    selectedRuleType === rule
                      ? "bg-amber-400 text-slate-950 shadow-md"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {rule} Pattern Rule
                </button>
              ))}
            </div>

            {/* The Archway Frame (6 slots) */}
            <div className="flex flex-wrap justify-center gap-2.5 p-4 bg-slate-900/90 border-2 border-emerald-400/60 rounded-3xl shadow-2xl">
              {createdSlots.map((slotItem, idx) => (
                <div
                  key={idx}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-dashed border-slate-600 flex items-center justify-center bg-black/30"
                >
                  {slotItem ? (
                    <TactileTile item={slotItem} size="sm" disabled />
                  ) : (
                    <span className="text-xs font-bold text-slate-600">#{idx + 1}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Supply Palette */}
            <div className="w-full flex flex-col items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Tap stones from your palette to complete the archway:
              </span>
              <div className="flex justify-center gap-3">
                {level.creation.palette.map((item) => (
                  <TactileTile
                    key={item.id}
                    item={item}
                    size="sm"
                    onClick={() => handlePlaceCreationItem(item)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Celebration Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-sm text-center shadow-2xl">
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                className="w-16 h-16 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-3 shadow-lg"
              >
                ⭐
              </motion.div>
              <h3 
                className="text-2xl font-black text-amber-300"
                style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
              >
                Pattern Solved!
              </h3>
              <p className="text-xs text-slate-300 font-bold mt-1">
                You mastered the <strong>{level.subrule}</strong>!
              </p>
              <div className="mt-4 px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-xl text-xs font-black text-amber-300">
                +{level.xpAward} XP Earned · Forest Spark Collected!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
