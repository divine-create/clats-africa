'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Round {
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  optionA: string;
  optionB: string;
  fakeIs: "A" | "B"; // which option is AI-generated/fake
  explanation: string;
}

const ROUNDS: Round[] = [
  // EASY
  {
    category: "🌍 Science Fact",
    difficulty: "Easy",
    optionA: "The Sun is approximately 93 million miles from Earth.",
    optionB: "The Sun is approximately 12 million miles from Earth, which is why we can feel its heat so strongly.",
    fakeIs: "B",
    explanation: "The Sun is about 93 million miles away! The fake version used a much smaller number and added a false reason to sound convincing. AI often adds logical-sounding explanations to make fake facts more believable."
  },
  {
    category: "📱 Social Media Post",
    difficulty: "Easy",
    optionA: "Just finished my homework and now playing with my dog Max in the backyard! 🐕",
    optionB: "NASA just announced that students who play video games for 4 hours daily score 300% higher on math tests! Share before they delete this! 🚨",
    fakeIs: "B",
    explanation: "The NASA post is fake! Real organizations don't tell you to 'share before they delete this.' That's a classic trick to make fake content spread fast. Always check the original source!"
  },
  // MEDIUM
  {
    category: "📰 News Headline",
    difficulty: "Medium",
    optionA: "City Council Approves New Public Library Branch Opening in 2025",
    optionB: "Scientists Discover New Type of Water That Can Cure All Known Diseases, Nobel Prize Expected",
    fakeIs: "B",
    explanation: "No single substance can 'cure all known diseases.' AI-generated fake news often uses extreme words like 'all' and 'cure' to grab attention. Real science news is usually more specific and cautious."
  },
  {
    category: "💬 Chat Message",
    difficulty: "Medium",
    optionA: "Hey! I'm your friend Jake from school. Can you send me your home address so I can mail you a birthday card? Also what's your mom's phone number?",
    optionB: "Hey! Are you coming to soccer practice tomorrow? Coach said we're doing penalty kicks. Don't forget your water bottle!",
    fakeIs: "A",
    explanation: "A real friend would already know where you live! Asking for your address AND your parent's phone number in one message is a red flag. AI chatbots and scammers often ask for personal info while pretending to be someone you know."
  },
  {
    category: "🎓 Fun Fact",
    difficulty: "Medium",
    optionA: "Octopuses have three hearts and blue blood.",
    optionB: "Dolphins can hold their breath for up to 6 hours because they have a special third lung that stores extra oxygen.",
    fakeIs: "B",
    explanation: "Dolphins can only hold their breath for about 8-10 minutes, and they have two lungs like most mammals. The fake added a believable-sounding 'third lung' detail. AI is very good at inventing fake body parts and scientific reasons!"
  },
  // HARD
  {
    category: "📊 Statistic",
    difficulty: "Hard",
    optionA: "According to UNICEF, approximately 260 million children worldwide were out of school before the pandemic.",
    optionB: "According to UNICEF, approximately 45 million children worldwide were out of school before the pandemic, mainly in European countries.",
    fakeIs: "B",
    explanation: "The real number is about 260 million, and most were in developing regions, not Europe. The fake version used a real organization (UNICEF) to sound trustworthy but changed the numbers and location. Always verify statistics from the original source!"
  },
  {
    category: "🤖 AI Claim",
    difficulty: "Hard",
    optionA: "AI image generators work by learning patterns from millions of existing images and creating new combinations of those patterns.",
    optionB: "AI image generators work by scanning the internet in real-time and copying parts of existing photos, then digitally stitching them together pixel by pixel.",
    fakeIs: "B",
    explanation: "AI doesn't copy and paste from the internet! It learns abstract patterns during training (like what 'fur' or 'sky' looks like) and generates entirely new pixels. The fake version sounds technical but completely misrepresents how AI works."
  },
  {
    category: "🏫 School Email",
    difficulty: "Hard",
    optionA: "Dear Parents, Picture Day has been rescheduled to Friday, March 14th. Students may wear their school uniform or smart casual attire. - Mrs. Johnson, Principal",
    optionB: "URGENT: Your child's school account has been compromised. Click here to verify your identity and reset the password within 24 hours or the account will be permanently deleted: www.sch00l-verify-portal.net",
    fakeIs: "B",
    explanation: "Look at that URL: 'sch00l' uses zeros instead of 'o's, and '.net' is unusual for schools. Real schools don't threaten to 'permanently delete' accounts. This combines phishing tactics with deepfake-style impersonation of a trusted institution."
  },
];

export const DeepfakeDetective = ({ onBack }: { onBack: () => void }) => {
  const { isDark, activeChild } = useApp();
  const companionName = activeChild?.companion === "kobe" ? "Kobe" : "Chibi";

  const [phase, setPhase] = useState<"intro" | "playing" | "results">("intro");
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const currentRound = ROUNDS[roundIndex];
  const totalRounds = ROUNDS.length;

  const handleChoice = (choice: "A" | "B") => {
    const isCorrect = choice === currentRound.fakeIs;
    setLastCorrect(isCorrect);
    setAnswers(prev => [...prev, isCorrect]);

    if (isCorrect) {
      setScore(s => s + (currentRound.difficulty === "Easy" ? 10 : currentRound.difficulty === "Medium" ? 20 : 30));
      setStreak(s => {
        const ns = s + 1;
        if (ns > bestStreak) setBestStreak(ns);
        return ns;
      });
    } else {
      setStreak(0);
    }
    setShowFeedback(true);
  };

  const advanceRound = () => {
    setShowFeedback(false);
    if (roundIndex < totalRounds - 1) {
      setRoundIndex(i => i + 1);
    } else {
      setPhase("results");
    }
  };

  const restart = () => {
    setPhase("intro");
    setRoundIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setShowFeedback(false);
    setLastCorrect(false);
    setAnswers([]);
  };

  const accuracy = answers.length > 0 ? Math.round((answers.filter(Boolean).length / answers.length) * 100) : 0;

  // ── INTRO ────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className={`w-full max-w-4xl mx-auto h-[80vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mb-6 shadow-xl shadow-violet-500/30">
            <Eye size={48} className="text-white" />
          </div>
          <h2 className={`text-3xl md:text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Deepfake Detective
          </h2>
          <p className={`text-base mb-2 font-semibold max-w-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Two pieces of content will appear. One is REAL. One is AI-GENERATED or FAKE.
            Your mission: spot the fake before it fools you!
          </p>
          <p className={`text-sm mb-8 font-bold max-w-md ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
            ⚠️ Rounds get harder as you go. Pay close attention to details!
          </p>

          <div className="flex gap-3 mb-8 flex-wrap justify-center">
            {["Easy 🟢", "Medium 🟡", "Hard 🔴"].map((d, i) => (
              <div key={i} className={`px-4 py-2 rounded-xl border text-sm font-bold ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                {d}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setPhase("playing")}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white font-black text-base shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Start Investigation <ArrowRight size={20} />
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

  // ── RESULTS ──────────────────────────────────────────────────────────
  if (phase === "results") {
    return (
      <div className={`w-full max-w-4xl mx-auto h-[80vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mb-6 shadow-xl shadow-violet-500/30">
            <Shield size={48} className="text-white" />
          </div>

          <h2 className={`text-3xl md:text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Investigation Complete!
          </h2>
          <p className={`text-base mb-8 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            You analyzed {totalRounds} pieces of content. Here's your detective report:
          </p>

          <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="text-3xl font-black text-violet-500">{score}</div>
              <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Score</div>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="text-3xl font-black text-amber-500">{bestStreak}🔥</div>
              <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Best Streak</div>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`text-3xl font-black ${accuracy >= 75 ? 'text-emerald-500' : accuracy >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{accuracy}%</div>
              <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Accuracy</div>
            </div>
          </div>

          {/* Round-by-round results */}
          <div className="w-full max-w-sm flex gap-2 justify-center mb-8 flex-wrap">
            {answers.map((correct, i) => (
              <div key={i} className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black ${correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {correct ? '✓' : '✗'}
              </div>
            ))}
          </div>

          <div className={`p-4 rounded-xl mb-8 max-w-sm w-full ${accuracy >= 75 ? (isDark ? 'bg-emerald-950/50 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200') : (isDark ? 'bg-amber-950/50 border border-amber-800' : 'bg-amber-50 border border-amber-200')}`}>
            <p className={`text-sm font-bold ${accuracy >= 75 ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : (isDark ? 'text-amber-300' : 'text-amber-700')}`}>
              {accuracy >= 75
                ? `🕵️ ${companionName} says: "Outstanding detective work! You have sharp eyes for spotting AI fakes. Remember: always question what you see online!"`
                : accuracy >= 50
                ? `🔍 ${companionName} says: "Good effort! AI-generated content is getting harder to spot every day. The more you practice, the better you'll get at protecting yourself!"`
                : `📖 ${companionName} says: "Don't worry! Deepfakes are designed to fool people. The key lesson is: if something seems too good, too scary, or too urgent to be true — verify it first!"`
              }
            </p>
          </div>

          <div className="flex gap-4 w-full max-w-sm">
            <button onClick={restart} className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-black text-base shadow-lg transition-transform hover:scale-105 active:scale-95">
              Play Again
            </button>
            <button onClick={onBack} className={`flex-1 py-4 rounded-2xl font-black text-base transition-transform hover:scale-105 active:scale-95 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>
              Exit Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYING ──────────────────────────────────────────────────────────
  const diffColor = currentRound.difficulty === "Easy" ? "text-emerald-500" : currentRound.difficulty === "Medium" ? "text-amber-500" : "text-red-500";
  const progress = ((roundIndex) / totalRounds) * 100;

  return (
    <div className={`w-full max-w-4xl mx-auto h-[80vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
      
      {/* Header */}
      <div className={`p-4 md:p-6 border-b flex items-center justify-between ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div>
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <Eye className="text-violet-500" />
            Deepfake Detective
          </h2>
          <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {currentRound.category} · <span className={diffColor}>{currentRound.difficulty}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Score</div>
            <div className="text-xl font-black text-violet-500">{score}</div>
          </div>
          <div className="text-right hidden md:block">
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Streak🔥</div>
            <div className="text-xl font-black text-amber-500">{streak}</div>
          </div>
          <button onClick={onBack} className={`px-4 py-2 rounded-xl text-sm font-bold ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>
            Exit
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className={`px-6 py-2 flex items-center gap-3 ${isDark ? 'bg-slate-950/30' : 'bg-white/50'}`}>
        <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{roundIndex + 1}/{totalRounds}</span>
        <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
        
        {!showFeedback ? (
          <>
            <p className={`text-base font-bold mb-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              👆 Which one is <span className="text-red-500">FAKE</span>?
            </p>
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl">
              {/* Option A */}
              <button
                onClick={() => handleChoice("A")}
                className={`flex-1 p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-slate-950 border-slate-700 hover:border-violet-500' : 'bg-white border-slate-300 hover:border-violet-500'}`}
              >
                <div className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Option A</div>
                <p className={`text-sm md:text-base leading-relaxed font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {currentRound.optionA}
                </p>
              </button>

              {/* VS */}
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-black text-sm shadow-lg">
                  VS
                </div>
              </div>

              {/* Option B */}
              <button
                onClick={() => handleChoice("B")}
                className={`flex-1 p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-slate-950 border-slate-700 hover:border-violet-500' : 'bg-white border-slate-300 hover:border-violet-500'}`}
              >
                <div className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Option B</div>
                <p className={`text-sm md:text-base leading-relaxed font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {currentRound.optionB}
                </p>
              </button>
            </div>
          </>
        ) : (
          /* Feedback */
          <div className={`max-w-lg w-full p-8 rounded-3xl shadow-2xl border-4 text-center ${lastCorrect ? 'bg-emerald-500 border-emerald-400 text-white' : (isDark ? 'bg-slate-950 border-red-500' : 'bg-white border-red-500')}`}>
            <div className="flex justify-center mb-4">
              {lastCorrect ? (
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={40} className="text-red-500" />
                </div>
              )}
            </div>

            <h3 className={`text-2xl font-black mb-3 ${lastCorrect ? 'text-white' : (isDark ? 'text-red-400' : 'text-red-600')}`}>
              {lastCorrect ? "You Spotted the Fake!" : "The Fake Fooled You!"}
            </h3>

            <p className={`text-sm font-semibold leading-relaxed mb-6 ${lastCorrect ? 'text-emerald-50' : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>
              <strong className="block mb-2">🔍 {companionName} explains:</strong>
              "{currentRound.explanation}"
            </p>

            <button
              onClick={advanceRound}
              className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${lastCorrect ? 'bg-white text-emerald-600 hover:bg-emerald-50' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
              {roundIndex < totalRounds - 1 ? "Next Round" : "See Results"} <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* FEEDBACK OVERLAY BACKDROP */}
      {showFeedback && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-[-1]" />
      )}
    </div>
  );
};
