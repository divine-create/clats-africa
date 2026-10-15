import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, RotateCcw, Eye, Sparkles, Check, HelpCircle, Star, Search, Unlock, ShieldAlert } from "lucide-react";
import { MeadowLevelConfig, PatternItem, SequenceSlotData, RuleSelectionOption } from "../types";
import { TactileTile } from "./TactileTile";
import { CompanionGuidance } from "./CompanionGuidance";
import { sfx } from "../../../../utils/audio";

interface ChallengeWorkspaceProps {
  level: MeadowLevelConfig;
  companion: "kobe" | "chibi";
  lang?: string;
  onBackToBoard: () => void;
  onReplayPreview: () => void;
  onCompleteLevel: (stars: number) => void;
}

export const ChallengeWorkspace: React.FC<ChallengeWorkspaceProps> = ({
  level,
  companion,
  lang = "en",
  onBackToBoard,
  onReplayPreview,
  onCompleteLevel
}) => {
  // Mistakes and Progressive Guidance
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [companionSpeech, setCompanionSpeech] = useState<string>(level.companionVoicePrompt);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>(level.successExplanation);

  // Mode 1: Sequence Fill State
  const [sequenceSlots, setSequenceSlots] = useState<SequenceSlotData[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [errorSlotIndex, setErrorSlotIndex] = useState<number | null>(null);

  // Mode 2: Category Sort State
  const [unsortedItems, setUnsortedItems] = useState<PatternItem[]>([]);
  const [binCounts, setBinCounts] = useState<Record<string, number>>({});

  // Mode 3: Rule Selection State (Level 8)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [ruleFeedback, setRuleFeedback] = useState<{ id: string; isCorrect: boolean; message: string } | null>(null);

  // Mode 4: Odd One Out State (Level 9)
  const [oddOneStep, setOddOneStep] = useState<"find_intruder" | "choose_replacement">("find_intruder");
  const [identifiedIntruderIndex, setIdentifiedIntruderIndex] = useState<number | null>(null);
  const [repairedItems, setRepairedItems] = useState<PatternItem[]>([]);

  // Mode 5 & 6: Trial Hybrid / Rule Builder (Level 10)
  const [trialStep, setTrialStep] = useState<"gate_lock" | "archway_create">("gate_lock");
  const [gateSlots, setGateSlots] = useState<SequenceSlotData[]>([]);
  const [createdSlots, setCreatedSlots] = useState<(PatternItem | null)[]>([]);
  const [selectedRuleType, setSelectedRuleType] = useState<"AB" | "AAB" | "ABC">("AB");
  const [archwayError, setArchwayError] = useState<boolean>(false);

  // Reset and initialize per level
  useEffect(() => {
    setMistakesCount(0);
    setCompanionSpeech(level.companionVoicePrompt);
    setIsSuccess(false);
    setSuccessMessage(level.successExplanation);
    setErrorSlotIndex(null);

    // Initialize mode-specific states
    if (level.mode === "sequence_fill" && level.sequence) {
      setSequenceSlots(level.sequence.slots.map(s => ({
        ...s,
        filledItem: s.prefilledItem || null
      })));
      // Find first missing slot as default target
      const firstMissing = level.sequence.slots.findIndex(s => s.isMissing);
      setSelectedSlotIndex(firstMissing !== -1 ? firstMissing : null);
    } else if (level.mode === "category_sort" && level.classification) {
      setUnsortedItems([...level.classification.items]);
      setBinCounts({});
    } else if (level.mode === "rule_selection") {
      setSelectedRuleId(null);
      setRuleFeedback(null);
    } else if (level.mode === "odd_one_out" && level.oddOneOut) {
      setOddOneStep("find_intruder");
      setIdentifiedIntruderIndex(null);
      setRepairedItems([...level.oddOneOut.items]);
    } else if (level.mode === "trial_hybrid" && level.trialHybrid) {
      setTrialStep("gate_lock");
      setGateSlots(level.trialHybrid.step1Slots.map(s => ({
        ...s,
        filledItem: s.prefilledItem || null
      })));
      setCreatedSlots(Array(level.trialHybrid.step2TargetLength).fill(null));
      setSelectedRuleType("AB");
      setArchwayError(false);
    } else if (level.mode === "rule_builder" && level.creation) {
      setCreatedSlots(Array(level.creation.targetLength).fill(null));
      setSelectedRuleType("AB");
      setArchwayError(false);
    }
  }, [level]);

  // Handle mistake tracking and progressive hints
  const registerMistake = (fallbackHint?: string) => {
    const nextMistakes = mistakesCount + 1;
    setMistakesCount(nextMistakes);
    sfx.play("error");

    if (nextMistakes === 1) {
      setCompanionSpeech(level.hintLevel1 || fallbackHint || "Look closely at the repeating pieces.");
    } else {
      setCompanionSpeech(level.hintLevel2 || fallbackHint || "Remember the secret rhythm we discovered!");
    }
  };

  // Provide manual hint on demand
  const handleRequestHint = () => {
    sfx.playTap();
    if (companionSpeech === level.hintLevel1) {
      setCompanionSpeech(level.hintLevel2 || level.hintLevel1);
    } else {
      setCompanionSpeech(level.hintLevel1 || level.companionVoicePrompt);
    }
  };

  // Calculate earned stars
  const calculateStars = (): number => {
    if (mistakesCount === 0) return 3;
    if (mistakesCount === 1) return 2;
    return 1;
  };

  const triggerCompletion = (customSuccessMsg?: string) => {
    const stars = calculateStars();
    if (customSuccessMsg) setSuccessMessage(customSuccessMsg);
    setIsSuccess(true);
    sfx.play("success");
    setTimeout(() => {
      onCompleteLevel(stars);
    }, 2400);
  };

  // -------------------------------------------------------------
  // MODE 1: SEQUENCE FILL
  // -------------------------------------------------------------
  const handlePlaceItemInSlot = (choice: PatternItem, targetSlotIndex: number) => {
    if (isSuccess) return;
    const slot = sequenceSlots[targetSlotIndex];
    if (!slot || !slot.isMissing) return;

    if (choice.id === slot.expectedItem.id) {
      sfx.play("pop");
      const updated = sequenceSlots.map((s, idx) => 
        idx === targetSlotIndex ? { ...s, filledItem: choice } : s
      );
      setSequenceSlots(updated);

      // Check if all missing slots are filled
      const stillMissing = updated.some(s => s.isMissing && !s.filledItem);
      if (!stillMissing) {
        triggerCompletion();
      } else {
        // Move target to next missing slot
        const nextMissing = updated.findIndex(s => s.isMissing && !s.filledItem);
        setSelectedSlotIndex(nextMissing !== -1 ? nextMissing : null);
      }
    } else {
      setErrorSlotIndex(targetSlotIndex);
      registerMistake();
      setTimeout(() => setErrorSlotIndex(null), 800);
    }
  };

  // -------------------------------------------------------------
  // MODE 2: CATEGORY SORT
  // -------------------------------------------------------------
  const handleSortItemIntoBin = (item: PatternItem, binId: string) => {
    if (isSuccess || !level.classification) return;
    const bin = level.classification.bins.find(b => b.id === binId);
    if (!bin) return;

    const isMatch = bin.acceptedCategories.includes(item.category || "");
    if (isMatch) {
      sfx.play("pop");
      const remaining = unsortedItems.filter(i => i.id !== item.id);
      setUnsortedItems(remaining);
      setBinCounts(prev => ({ ...prev, [binId]: (prev[binId] || 0) + 1 }));

      if (remaining.length === 0) {
        triggerCompletion();
      }
    } else {
      registerMistake("Check which basket matches this item's features!");
    }
  };

  // -------------------------------------------------------------
  // MODE 3: RULE SELECTION (Level 8)
  // -------------------------------------------------------------
  const handleSelectRule = (option: RuleSelectionOption) => {
    if (isSuccess) return;
    setSelectedRuleId(option.id);
    setRuleFeedback({
      id: option.id,
      isCorrect: option.isCorrect,
      message: option.explanation
    });

    if (option.isCorrect) {
      setCompanionSpeech(option.explanation);
      triggerCompletion(option.explanation);
    } else {
      setCompanionSpeech(option.explanation);
      registerMistake(option.explanation);
    }
  };

  // -------------------------------------------------------------
  // MODE 4: ODD ONE OUT (Level 9)
  // -------------------------------------------------------------
  const handleTapOddItem = (item: PatternItem, index: number) => {
    if (isSuccess || !level.oddOneOut) return;

    if (oddOneStep === "find_intruder") {
      if (index === level.oddOneOut.intruderIndex) {
        // Correct intruder spotted!
        sfx.play("pop");
        setIdentifiedIntruderIndex(index);
        setOddOneStep("choose_replacement");
        setCompanionSpeech("You caught the sneaky intruder! Now choose which woodland item belongs in this spot.");
      } else {
        // Tapped a correct pattern item by mistake
        registerMistake("That item fits our flower-leaf rhythm! Look for the one that breaks the pattern.");
      }
    }
  };

  const handleSelectOddReplacement = (choice: PatternItem) => {
    if (isSuccess || !level.oddOneOut) return;

    if (choice.id === level.oddOneOut.correctReplacement.id) {
      sfx.play("pop");
      const updated = [...repairedItems];
      if (identifiedIntruderIndex !== null) {
        updated[identifiedIntruderIndex] = choice;
      }
      setRepairedItems(updated);
      triggerCompletion(level.successExplanation);
    } else {
      registerMistake("Look at the flower before and after this slot. Which item matches the rhythm?");
    }
  };

  // -------------------------------------------------------------
  // MODE 5: TRIAL HYBRID (Level 10)
  // -------------------------------------------------------------
  const handlePlaceGateRune = (choice: PatternItem, slotIndex: number) => {
    if (!level.trialHybrid) return;
    const slot = gateSlots[slotIndex];
    if (!slot || !slot.isMissing) return;

    if (choice.id === slot.expectedItem.id) {
      sfx.play("pop");
      sfx.play("success");
      setGateSlots(prev => prev.map((s, idx) => idx === slotIndex ? { ...s, filledItem: choice } : s));
      setCompanionSpeech("The gate lock clicks open! Now awaken the archway by crafting your own repeating sequence!");
      setTimeout(() => {
        setTrialStep("archway_create");
      }, 1000);
    } else {
      registerMistake("Observe the gate lock sequence carefully. Amber Sun, Emerald Leaf...");
    }
  };

  const handleAddArchwayRune = (item: PatternItem) => {
    if (isSuccess) return;
    const nextEmptyIndex = createdSlots.findIndex(s => s === null);
    if (nextEmptyIndex === -1) return;

    sfx.play("pop");
    const updated = [...createdSlots];
    updated[nextEmptyIndex] = item;
    setCreatedSlots(updated);

    // If all 6 slots are filled, validate pattern rule
    if (nextEmptyIndex === createdSlots.length - 1) {
      validateArchwayPattern(updated as PatternItem[]);
    }
  };

  const handleRemoveArchwayRune = (index: number) => {
    if (isSuccess || !createdSlots[index]) return;
    sfx.playTap();
    const updated = [...createdSlots];
    updated[index] = null;
    setCreatedSlots(updated);
  };

  const handleClearArchway = () => {
    sfx.playTap();
    setCreatedSlots(Array(createdSlots.length).fill(null));
    setArchwayError(false);
  };

  const validateArchwayPattern = (items: PatternItem[]) => {
    if (items.length < 6) return;

    // Verify consistency based on selected rule or any valid repeating periodicity
    let isValid = false;

    // Check AB repetition: A-B-A-B-A-B
    const isAB = (
      items[0].id === items[2].id &&
      items[2].id === items[4].id &&
      items[1].id === items[3].id &&
      items[3].id === items[5].id &&
      items[0].id !== items[1].id
    );

    // Check AAB repetition: A-A-B-A-A-B
    const isAAB = (
      items[0].id === items[1].id &&
      items[1].id === items[3].id &&
      items[3].id === items[4].id &&
      items[2].id === items[5].id &&
      items[0].id !== items[2].id
    );

    // Check ABC repetition: A-B-C-A-B-C
    const isABC = (
      items[0].id === items[3].id &&
      items[1].id === items[4].id &&
      items[2].id === items[5].id &&
      items[0].id !== items[1].id &&
      items[1].id !== items[2].id
    );

    if (selectedRuleType === "AB" && isAB) isValid = true;
    else if (selectedRuleType === "AAB" && isAAB) isValid = true;
    else if (selectedRuleType === "ABC" && isABC) isValid = true;
    else if (isAB || isAAB || isABC) {
      // Child built a valid repeating pattern of another supported type!
      isValid = true;
    }

    if (isValid) {
      triggerCompletion(level.successExplanation);
    } else {
      setArchwayError(true);
      registerMistake(`Make sure your stones follow the ${selectedRuleType} repeating pattern rhythm!`);
      setTimeout(() => setArchwayError(false), 1200);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-4 sm:p-6 bg-gradient-to-b from-[#091522] via-[#0E2232] to-[#07131D] text-white rounded-3xl overflow-hidden relative min-h-[560px]">
      {/* Background Soft Glow */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full flex justify-between items-center z-20 bg-slate-900/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/60 shadow-sm">
        <button
          type="button"
          onClick={onBackToBoard}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold shadow-md"
          title="Back to Mission Trail"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Trail</span>
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 px-3 py-0.5 rounded-full text-emerald-300 text-xs font-black">
            <span>Level {level.id} · {level.phase}</span>
          </div>
          <h3 
            className="text-sm sm:text-base font-black text-white mt-0.5 drop-shadow"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
          >
            {level.title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Need a hint button */}
          <button
            type="button"
            onClick={handleRequestHint}
            className="p-1.5 sm:px-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-400/40 rounded-xl transition text-xs font-bold flex items-center gap-1 shadow-md"
            title="Get a gentle hint"
          >
            <HelpCircle size={15} />
            <span className="hidden sm:inline">Hint</span>
          </button>

          {/* Replay Demonstration */}
          <button
            type="button"
            onClick={onReplayPreview}
            className="p-1.5 sm:px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 rounded-xl transition text-xs font-bold flex items-center gap-1 shadow-md"
            title="Replay Demonstration"
          >
            <Eye size={15} />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </div>

      {/* Companion Guidance Prompt */}
      <CompanionGuidance 
        companion={companion} 
        speechText={companionSpeech} 
        lang={lang} 
        className="z-20 my-2"
      />

      {/* Main Interactive Stage */}
      <div className="my-auto flex flex-col items-center w-full max-w-2xl z-20 px-2">

        {/* ------------------------------------------------------------- */}
        {/* MODE 1: SEQUENCE FILL (Levels 1 to 7)                         */}
        {/* ------------------------------------------------------------- */}
        {level.mode === "sequence_fill" && level.sequence && (
          <div className="w-full flex flex-col items-center gap-5">
            {/* Sequence Slots Bar */}
            <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-3.5 p-4 sm:p-5 bg-slate-900/85 border-2 border-slate-700 rounded-3xl shadow-2xl backdrop-blur-md">
              {sequenceSlots.map((slot, idx) => {
                const isError = errorSlotIndex === idx;
                const isTarget = selectedSlotIndex === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (slot.isMissing && !slot.filledItem) {
                        sfx.playTap();
                        setSelectedSlotIndex(idx);
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
                        ? `w-18 h-18 sm:w-20 sm:h-20 border-3 border-dashed ${
                            isError 
                              ? "border-rose-500 bg-rose-500/20 animate-shake" 
                              : isTarget
                              ? "border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.5)] cursor-pointer"
                              : "border-amber-400/60 bg-amber-400/10 cursor-pointer hover:bg-amber-400/20"
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
                      <span className="text-2xl font-black text-amber-300/70 select-none">
                        ?
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Choices Palette Bank */}
            <div className="w-full flex flex-col items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                Tap a tile to place in the empty space:
              </span>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {level.sequence.choices.map((choice) => (
                  <TactileTile
                    key={choice.id}
                    item={choice}
                    size="md"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("patternItemId", choice.id)}
                    onClick={() => {
                      const targetIdx = selectedSlotIndex ?? sequenceSlots.findIndex(s => s.isMissing && !s.filledItem);
                      if (targetIdx !== -1) {
                        handlePlaceItemInSlot(choice, targetIdx);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 2: CATEGORY SORT (Classification tasks)                  */}
        {/* ------------------------------------------------------------- */}
        {level.mode === "category_sort" && level.classification && (
          <div className="w-full flex flex-col items-center gap-5">
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
                  <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {bin.ruleDescription}
                  </span>
                  <div className="mt-2.5 px-3 py-1 rounded-full text-xs font-black bg-black/40 text-amber-300">
                    {binCounts[bin.id] || 0} Sorted
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full flex flex-col items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Tap a basket to sort this item ({unsortedItems.length} remaining):
              </span>
              <div className="flex justify-center gap-3 min-h-[85px]">
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

        {/* ------------------------------------------------------------- */}
        {/* MODE 3: RULE SELECTION (Level 8 - Detective Board)            */}
        {/* ------------------------------------------------------------- */}
        {level.mode === "rule_selection" && level.ruleSelection && (
          <div className="w-full flex flex-col items-center gap-5">
            {/* Visual Detective Sequence */}
            <div className="w-full bg-slate-900/90 border-2 border-amber-400/40 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col items-center backdrop-blur-md">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
                <Search size={15} />
                <span>Detective Pattern Trail</span>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-3.5">
                {level.ruleSelection.visualSequence.map((item, idx) => (
                  <div key={idx} className="relative flex flex-col items-center">
                    <TactileTile item={item} size="sm" disabled />
                    <span className="text-[9px] font-bold text-slate-400 mt-0.5">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rule Cards Options */}
            <div className="w-full flex flex-col gap-2.5">
              <span className="text-xs font-black uppercase text-slate-300 tracking-wider text-center">
                Choose the rule that correctly explains this sequence:
              </span>
              {level.ruleSelection.options.map((option) => {
                const isSelected = selectedRuleId === option.id;
                const feedback = isSelected ? ruleFeedback : null;

                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectRule(option)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between gap-3 shadow-lg focus:outline-none ${
                      isSelected && feedback?.isCorrect
                        ? "bg-emerald-950/80 border-emerald-400 text-emerald-100 shadow-emerald-500/20"
                        : isSelected && !feedback?.isCorrect
                        ? "bg-rose-950/80 border-rose-400 text-rose-100 shadow-rose-500/20 animate-shake"
                        : "bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 border ${
                        isSelected && feedback?.isCorrect
                          ? "bg-emerald-500 text-slate-950 border-white"
                          : isSelected && !feedback?.isCorrect
                          ? "bg-rose-500 text-white border-white"
                          : "bg-slate-800 text-slate-300 border-slate-600"
                      }`}>
                        {isSelected && feedback?.isCorrect ? "✓" : isSelected && !feedback?.isCorrect ? "✕" : "•"}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold">{option.text}</p>
                        {isSelected && feedback && (
                          <p className={`text-[11px] mt-1 font-semibold ${
                            feedback.isCorrect ? "text-emerald-300" : "text-rose-300"
                          }`}>
                            {feedback.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 4: ODD ONE OUT (Level 9 - Anomaly Detection)             */}
        {/* ------------------------------------------------------------- */}
        {level.mode === "odd_one_out" && level.oddOneOut && (
          <div className="w-full flex flex-col items-center gap-5">
            {/* The Trail with Intruder */}
            <div className="w-full bg-slate-900/90 border-2 border-slate-700 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col items-center backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-3 text-amber-300">
                <ShieldAlert size={15} />
                <span>
                  {oddOneStep === "find_intruder" 
                    ? "Tap the sneaky object that breaks the pattern:" 
                    : "Intruder caught! Choose the correct replacement below:"}
                </span>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-3.5">
                {repairedItems.map((item, idx) => {
                  const isIntruderSlot = idx === level.oddOneOut?.intruderIndex;
                  const isCaught = isIntruderSlot && oddOneStep === "choose_replacement";

                  return (
                    <div key={idx} className="relative flex flex-col items-center">
                      <TactileTile 
                        item={item} 
                        size="md" 
                        state={isCaught ? "selected" : "idle"}
                        onClick={() => handleTapOddItem(item, idx)}
                      />
                      {isCaught && (
                        <div className="absolute -top-2 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full border border-white shadow">
                          INTRUDER
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2 Replacement Bank */}
            {oddOneStep === "choose_replacement" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center gap-2"
              >
                <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                  Tap the correct replacement tile to fix the trail:
                </span>
                <div className="flex justify-center gap-4">
                  {level.oddOneOut.replacementChoices.map((choice) => (
                    <TactileTile
                      key={choice.id}
                      item={choice}
                      size="md"
                      onClick={() => handleSelectOddReplacement(choice)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 5: TRIAL HYBRID (Level 10 - Gate Lock + Archway)         */}
        {/* ------------------------------------------------------------- */}
        {level.mode === "trial_hybrid" && level.trialHybrid && (
          <div className="w-full flex flex-col items-center gap-5">
            {/* STEP 1: GATE LOCK */}
            {trialStep === "gate_lock" && (
              <div className="w-full flex flex-col items-center gap-5">
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-black rounded-full border border-amber-400/30">
                    <Unlock size={14} />
                    <span>Trial Step 1: Solve the Ancient Gate Lock</span>
                  </span>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-3 p-4 bg-slate-900/90 border-2 border-amber-400/50 rounded-3xl shadow-2xl">
                  {gateSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-3xl flex items-center justify-center ${
                        slot.isMissing && !slot.filledItem
                          ? "w-18 h-18 sm:w-20 sm:h-20 border-3 border-dashed border-amber-400 bg-amber-400/10 animate-pulse"
                          : ""
                      }`}
                    >
                      {slot.filledItem ? (
                        <TactileTile item={slot.filledItem} size="md" disabled />
                      ) : (
                        <span className="text-2xl font-black text-amber-300/70">?</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="w-full flex flex-col items-center gap-2">
                  <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                    Tap the missing rune to unlock the gate:
                  </span>
                  <div className="flex justify-center gap-3">
                    {level.trialHybrid.step1Choices.map((choice) => (
                      <TactileTile
                        key={choice.id}
                        item={choice}
                        size="md"
                        onClick={() => {
                          const missingIdx = gateSlots.findIndex(s => s.isMissing);
                          if (missingIdx !== -1) handlePlaceGateRune(choice, missingIdx);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ARCHWAY CREATOR */}
            {trialStep === "archway_create" && (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {(["AB", "AAB", "ABC"] as const).map((rule) => (
                    <button
                      key={rule}
                      type="button"
                      onClick={() => {
                        sfx.playTap();
                        setSelectedRuleType(rule);
                        handleClearArchway();
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-black transition ${
                        selectedRuleType === rule
                          ? "bg-amber-400 text-slate-950 shadow-md"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {rule} Pattern
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearArchway}
                    className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full text-xs font-bold transition"
                  >
                    Clear
                  </button>
                </div>

                {/* The Archway Frame (6 sockets) */}
                <div className={`flex flex-wrap justify-center gap-2.5 p-4 bg-slate-900/90 border-2 rounded-3xl shadow-2xl transition ${
                  archwayError ? "border-rose-500 animate-shake" : "border-emerald-400/60"
                }`}>
                  {createdSlots.map((slotItem, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleRemoveArchwayRune(idx)}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-dashed border-slate-600 flex items-center justify-center bg-black/40 cursor-pointer hover:border-slate-400 transition"
                      title={slotItem ? "Tap to remove" : `Socket #${idx + 1}`}
                    >
                      {slotItem ? (
                        <TactileTile item={slotItem} size="sm" disabled />
                      ) : (
                        <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Rune Palette */}
                <div className="w-full flex flex-col items-center gap-1.5">
                  <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                    Tap runes to build your {selectedRuleType} archway:
                  </span>
                  <div className="flex justify-center gap-3">
                    {level.trialHybrid.step2Palette.map((item) => (
                      <TactileTile
                        key={item.id}
                        item={item}
                        size="sm"
                        onClick={() => handleAddArchwayRune(item)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
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
              {/* Star Rating Display */}
              <div className="flex justify-center items-center gap-1.5 mb-3">
                {[1, 2, 3].map((starNum) => {
                  const earned = starNum <= calculateStars();
                  return (
                    <motion.div
                      key={starNum}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: starNum * 0.15 }}
                    >
                      <Star 
                        size={28} 
                        className={earned ? "fill-amber-400 text-amber-400" : "fill-slate-800 text-slate-700"} 
                      />
                    </motion.div>
                  );
                })}
              </div>

              <h3 
                className="text-2xl font-black text-amber-300"
                style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
              >
                Pattern Solved!
              </h3>
              <p className="text-xs text-slate-300 font-bold mt-1">
                {successMessage}
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
