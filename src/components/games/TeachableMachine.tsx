'use client';

import React, { useState } from 'react';
import { ArrowRight, Brain, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

// --- TRAINING DATA ---
interface DataItem {
  emoji: string;
  label: string;
  correctBucket: number; // index into BUCKETS
}

const BUCKETS = [
  { name: "Animals", emoji: "🐾", color: "#10B981", bg: "#ECFDF5", bgDark: "rgba(16,185,129,0.15)" },
  { name: "Technology", emoji: "💻", color: "#6366F1", bg: "#EEF2FF", bgDark: "rgba(99,102,241,0.15)" },
  { name: "Nature", emoji: "🌿", color: "#F59E0B", bg: "#FFFBEB", bgDark: "rgba(245,158,11,0.15)" },
];

const TRAINING_ITEMS: DataItem[] = [
  { emoji: "🐕", label: "Dog", correctBucket: 0 },
  { emoji: "💡", label: "Smart Bulb", correctBucket: 1 },
  { emoji: "🌺", label: "Flower", correctBucket: 2 },
  { emoji: "🐱", label: "Cat", correctBucket: 0 },
  { emoji: "🤖", label: "Robot", correctBucket: 1 },
  { emoji: "🌊", label: "Ocean Wave", correctBucket: 2 },
  { emoji: "🦁", label: "Lion", correctBucket: 0 },
  { emoji: "📱", label: "Smartphone", correctBucket: 1 },
  { emoji: "🌲", label: "Pine Tree", correctBucket: 2 },
  { emoji: "🐸", label: "Frog", correctBucket: 0 },
];

const TEST_ITEMS: DataItem[] = [
  { emoji: "🐘", label: "Elephant", correctBucket: 0 },
  { emoji: "⌚", label: "Smartwatch", correctBucket: 1 },
  { emoji: "🌵", label: "Cactus", correctBucket: 2 },
  { emoji: "🐬", label: "Dolphin", correctBucket: 0 },
  { emoji: "🖥️", label: "Computer", correctBucket: 1 },
];

type Phase = "intro" | "training" | "thinking" | "testing" | "results";

export const TeachableMachine = ({ onBack }: { onBack: () => void }) => {
  const { isDark, activeChild } = useApp();
  const companionName = activeChild?.companion === "kobe" ? "Kobe" : "Chibi";

  const [phase, setPhase] = useState<Phase>("intro");
  const [trainingIndex, setTrainingIndex] = useState(0);
  const [trainingChoices, setTrainingChoices] = useState<number[]>([]);
  const [testIndex, setTestIndex] = useState(0);
  const [testResults, setTestResults] = useState<{ item: DataItem; aiGuess: number; correct: boolean }[]>([]);
  const [showTestFeedback, setShowTestFeedback] = useState(false);

  // Count how many items the child correctly placed in each bucket during training
  const getBucketAccuracy = () => {
    const bucketCorrect = [0, 0, 0];
    const bucketTotal = [0, 0, 0];
    trainingChoices.forEach((choice, i) => {
      const correct = TRAINING_ITEMS[i].correctBucket;
      bucketTotal[correct]++;
      if (choice === correct) bucketCorrect[correct]++;
    });
    return BUCKETS.map((_, i) => bucketTotal[i] > 0 ? bucketCorrect[i] / bucketTotal[i] : 0);
  };

  // AI "guesses" based on training quality — if child trained poorly, AI makes mistakes
  const getAiGuess = (item: DataItem): number => {
    const accuracy = getBucketAccuracy();
    const correctBucket = item.correctBucket;
    
    // If the child trained this category well (>= 66% correct), AI gets it right
    if (accuracy[correctBucket] >= 0.66) {
      return correctBucket;
    }
    // If poorly trained, AI picks a wrong bucket
    const wrongBuckets = [0, 1, 2].filter(b => b !== correctBucket);
    return wrongBuckets[Math.floor(Math.random() * wrongBuckets.length)];
  };

  // TRAINING: child sorts an item
  const handleTrainChoice = (bucketIndex: number) => {
    const newChoices = [...trainingChoices, bucketIndex];
    setTrainingChoices(newChoices);

    if (trainingIndex < TRAINING_ITEMS.length - 1) {
      setTrainingIndex(i => i + 1);
    } else {
      // Done training — show "AI thinking" animation
      setPhase("thinking");
      setTimeout(() => setPhase("testing"), 2500);
    }
  };

  // TESTING: AI classifies and we show result
  const runNextTest = () => {
    setShowTestFeedback(false);
    const item = TEST_ITEMS[testIndex];
    const aiGuess = getAiGuess(item);
    const correct = aiGuess === item.correctBucket;

    setTestResults(prev => [...prev, { item, aiGuess, correct }]);
    setShowTestFeedback(true);

    setTimeout(() => {
      setShowTestFeedback(false);
      if (testIndex < TEST_ITEMS.length - 1) {
        setTestIndex(i => i + 1);
      } else {
        setPhase("results");
      }
    }, 2200);
  };

  // Start testing on mount of test phase
  React.useEffect(() => {
    if (phase === "testing" && testResults.length === 0) {
      runNextTest();
    }
  }, [phase]);

  // After each test feedback dismisses, run next
  React.useEffect(() => {
    if (phase === "testing" && !showTestFeedback && testResults.length > 0 && testIndex <= TEST_ITEMS.length - 1 && testResults.length <= testIndex) {
      const timer = setTimeout(runNextTest, 600);
      return () => clearTimeout(timer);
    }
  }, [showTestFeedback, testIndex, testResults.length, phase]);

  const trainingCorrectCount = trainingChoices.filter((c, i) => c === TRAINING_ITEMS[i].correctBucket).length;
  const trainingAccuracy = Math.round((trainingCorrectCount / TRAINING_ITEMS.length) * 100);
  const aiCorrectCount = testResults.filter(r => r.correct).length;
  const aiAccuracy = testResults.length > 0 ? Math.round((aiCorrectCount / testResults.length) * 100) : 0;

  // ── INTRO SCREEN ─────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className={`w-full max-w-4xl mx-auto h-[80vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30">
            <Brain size={48} className="text-white" />
          </div>
          <h2 className={`text-3xl md:text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Teachable Machine
          </h2>
          <p className={`text-base mb-2 font-semibold max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            YOU are the AI trainer! Sort items into the correct categories to teach the AI. Then watch it try to classify new items on its own.
          </p>
          <p className={`text-sm mb-8 font-bold max-w-md ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
            ⚠️ Be careful — if you teach it wrong, it will learn wrong!
          </p>

          <div className="flex gap-3 mb-8">
            {BUCKETS.map((b, i) => (
              <div key={i} className={`px-4 py-3 rounded-xl border font-bold text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                {b.emoji} {b.name}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setPhase("training")}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-base shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Start Training <ArrowRight size={20} />
            </button>
            <button
              onClick={onBack}
              className={`px-6 py-4 rounded-2xl font-black text-base transition-transform hover:scale-105 active:scale-95 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── TRAINING PHASE ───────────────────────────────────────────────────
  if (phase === "training") {
    const item = TRAINING_ITEMS[trainingIndex];
    const progress = ((trainingIndex) / TRAINING_ITEMS.length) * 100;

    return (
      <div className={`w-full max-w-4xl mx-auto h-[80vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        
        {/* Header */}
        <div className={`p-4 md:p-6 border-b flex items-center justify-between ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
              <Brain className="text-indigo-500" />
              Training Phase
            </h2>
            <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sort each item into the correct bucket to teach the AI</p>
          </div>
          <div className="text-right">
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sorted</div>
            <div className="text-xl font-black text-indigo-500">{trainingIndex}/{TRAINING_ITEMS.length}</div>
          </div>
        </div>

        {/* Progress */}
        <div className={`px-6 py-2 ${isDark ? 'bg-slate-950/30' : 'bg-white/50'}`}>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Item to classify */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className={`w-full max-w-sm p-8 rounded-3xl border-2 text-center mb-8 ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'} shadow-xl`}>
            <div className="text-7xl mb-4">{item.emoji}</div>
            <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.label}</div>
            <div className={`text-sm font-semibold mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Which category does this belong to?
            </div>
          </div>

          {/* Buckets */}
          <div className="flex gap-4 w-full max-w-lg">
            {BUCKETS.map((bucket, i) => (
              <button
                key={i}
                onClick={() => handleTrainChoice(i)}
                style={{ borderColor: bucket.color }}
                className={`flex-1 py-5 rounded-2xl border-2 font-black text-sm shadow-lg flex flex-col items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95`}
              >
                <span className="text-3xl">{bucket.emoji}</span>
                <span style={{ color: bucket.color }}>{bucket.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── AI THINKING ANIMATION ────────────────────────────────────────────
  if (phase === "thinking") {
    return (
      <div className={`w-full max-w-4xl mx-auto h-[80vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/40 animate-pulse">
            <Brain size={56} className="text-white" />
          </div>
          <h2 className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            AI is Learning...
          </h2>
          <p className={`text-base font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Processing {TRAINING_ITEMS.length} training examples you gave it...
          </p>
          <div className="mt-6 flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── TESTING PHASE ────────────────────────────────────────────────────
  if (phase === "testing") {
    const currentTestItem = TEST_ITEMS[testIndex];
    const latestResult = testResults[testResults.length - 1];

    return (
      <div className={`w-full max-w-4xl mx-auto h-[80vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        
        {/* Header */}
        <div className={`p-4 md:p-6 border-b flex items-center justify-between ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
              <Zap className="text-amber-500" />
              Testing Phase
            </h2>
            <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Watch your AI classify new items it's never seen before!</p>
          </div>
          <div className="text-right">
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Test</div>
            <div className="text-xl font-black text-amber-500">{Math.min(testResults.length, TEST_ITEMS.length)}/{TEST_ITEMS.length}</div>
          </div>
        </div>

        {/* Test content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {showTestFeedback && latestResult ? (
            <div className={`max-w-sm w-full p-8 rounded-3xl border-4 text-center shadow-2xl ${latestResult.correct ? 'bg-emerald-500 border-emerald-400 text-white' : (isDark ? 'bg-slate-950 border-red-500' : 'bg-white border-red-500')}`}>
              <div className="text-6xl mb-4">{latestResult.item.emoji}</div>
              <div className="flex justify-center mb-3">
                {latestResult.correct ? (
                  <CheckCircle2 size={40} className="text-white" />
                ) : (
                  <XCircle size={40} className="text-red-500" />
                )}
              </div>
              <h3 className={`text-2xl font-black mb-2 ${latestResult.correct ? 'text-white' : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                {latestResult.correct ? "AI Got It Right!" : "AI Got It Wrong!"}
              </h3>
              <p className={`text-sm font-bold ${latestResult.correct ? 'text-emerald-100' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                AI guessed: {BUCKETS[latestResult.aiGuess].emoji} {BUCKETS[latestResult.aiGuess].name}
                {!latestResult.correct && ` (Should be: ${BUCKETS[latestResult.item.correctBucket].emoji} ${BUCKETS[latestResult.item.correctBucket].name})`}
              </p>
            </div>
          ) : (
            <div className={`w-full max-w-sm p-8 rounded-3xl border-2 text-center ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'} shadow-xl animate-pulse`}>
              <div className="text-6xl mb-4">{currentTestItem?.emoji}</div>
              <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentTestItem?.label}</div>
              <div className={`text-sm font-semibold mt-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                AI is thinking...
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS SCREEN ───────────────────────────────────────────────────
  return (
    <div className={`w-full max-w-4xl mx-auto h-[80vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl">
          <Brain size={48} className="text-white" />
        </div>

        <h2 className={`text-3xl md:text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Training Report
        </h2>
        <p className={`text-base mb-8 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Here's how well you trained your AI:
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`text-3xl font-black ${trainingAccuracy >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{trainingAccuracy}%</div>
            <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Your Sorting</div>
          </div>
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`text-3xl font-black ${aiAccuracy >= 80 ? 'text-emerald-500' : aiAccuracy >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{aiAccuracy}%</div>
            <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>AI Accuracy</div>
          </div>
        </div>

        {/* Test Results */}
        <div className="w-full max-w-sm space-y-2 mb-8">
          {testResults.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${r.correct ? (isDark ? 'bg-emerald-950/50 text-emerald-300' : 'bg-emerald-50 text-emerald-700') : (isDark ? 'bg-red-950/50 text-red-300' : 'bg-red-50 text-red-700')}`}>
              <span className="text-xl">{r.item.emoji}</span>
              <span className="flex-1 text-left">{r.item.label}</span>
              <span>{r.correct ? '✅' : '❌'} {BUCKETS[r.aiGuess].emoji}</span>
            </div>
          ))}
        </div>

        {/* Companion Message */}
        <div className={`p-4 rounded-xl mb-8 max-w-sm w-full ${aiAccuracy >= 80 ? (isDark ? 'bg-emerald-950/50 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200') : (isDark ? 'bg-amber-950/50 border border-amber-800' : 'bg-amber-50 border border-amber-200')}`}>
          <p className={`text-sm font-bold ${aiAccuracy >= 80 ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : (isDark ? 'text-amber-300' : 'text-amber-700')}`}>
            {aiAccuracy >= 80
              ? `🧠 ${companionName} says: "Amazing training! Your AI learned perfectly because you gave it correct examples. This is exactly how real AI like ChatGPT is trained!"`
              : aiAccuracy >= 40
              ? `🤔 ${companionName} says: "The AI made some mistakes because it learned from YOUR mistakes. In real life, if we give AI bad data, it makes bad decisions too!"`
              : `📚 ${companionName} says: "The AI got confused because the training data wasn't accurate. This teaches us the most important rule of AI: Garbage In = Garbage Out!"`
            }
          </p>
        </div>

        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => {
              setPhase("intro");
              setTrainingIndex(0);
              setTrainingChoices([]);
              setTestIndex(0);
              setTestResults([]);
              setShowTestFeedback(false);
            }}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-base shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Train Again
          </button>
          <button
            onClick={onBack}
            className={`flex-1 py-4 rounded-2xl font-black text-base transition-transform hover:scale-105 active:scale-95 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
          >
            Exit Game
          </button>
        </div>
      </div>
    </div>
  );
};
