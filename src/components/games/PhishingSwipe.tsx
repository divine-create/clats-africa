'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight, MousePointerClick } from 'lucide-react';
import { useApp } from '@/context/AppContext';

// --- SCENARIOS ---
const SCENARIOS = [
  {
    id: 1,
    type: "email",
    sender: "Netflix Support <support@netfIix-security.com>",
    subject: "Your account is suspended!",
    body: "Dear customer, your payment failed. Please click here immediately to update your credit card or you will lose access forever.",
    isPhishing: true,
    explanation: "Look closely at the sender email! It spells Netflix with a capital 'I' instead of an 'l' (netfIix). Also, real companies don't usually threaten you to act 'immediately'."
  },
  {
    id: 2,
    type: "message",
    sender: "Mom 👩",
    subject: "Text Message",
    body: "Hey sweetie, I'm at the grocery store. Do you want the chocolate or vanilla ice cream tonight?",
    isPhishing: false,
    explanation: "This is a normal, safe message from someone you know. No weird links, no threats!"
  },
  {
    id: 3,
    type: "email",
    sender: "Roblox Free Robux <admin@roblox-free-rewards.xyz>",
    subject: "You won 10,000 Robux!",
    body: "Congratulations! You have been selected to win 10,000 free Robux. Just reply to this email with your username and password to claim your prize.",
    isPhishing: true,
    explanation: "Never give out your password! Official companies will NEVER ask for your password to give you a prize."
  },
  {
    id: 4,
    type: "email",
    sender: "School Principal <principal@yourschool.edu>",
    subject: "Reminder: Science Fair Tomorrow",
    body: "Students, please remember to bring your science projects to the gym by 8:00 AM tomorrow morning.",
    isPhishing: false,
    explanation: "This is a safe announcement. It comes from a real '.edu' school address and doesn't ask you to click any weird links or give personal information."
  },
  {
    id: 5,
    type: "message",
    sender: "Unknown Number (555-0192)",
    subject: "Text Message",
    body: "Your Apple package is delayed. Track it here: http://bit.ly/track-apple-package-99",
    isPhishing: true,
    explanation: "You should never click strange short links (like bit.ly) from numbers you don't know. It could be a trick to steal your information!"
  }
];

export const PhishingSwipe = ({ onBack }: { onBack: () => void }) => {
  const { isDark, activeChild } = useApp();
  
  const [deck, setDeck] = useState([...SCENARIOS].sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  
  const currentCard = deck[currentIndex];
  
  const companionName = activeChild?.companion === "kobe" ? "Kobe" : "Chibi";

  const [gameOver, setGameOver] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const handleChoice = (chosePhishing: boolean) => {
    if (!currentCard) return;
    
    const isCorrect = chosePhishing === currentCard.isPhishing;
    setLastAnswerCorrect(isCorrect);
    
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrectCount(c => c + 1);
      setStreak(s => {
        const newStreak = s + 1;
        if (newStreak > highestStreak) setHighestStreak(newStreak);
        return newStreak;
      });
      setShowFeedback(true);
      
      setTimeout(() => {
        advanceCard();
      }, 1500);
    } else {
      setStreak(0);
      setShowFeedback(true);
    }
  };

  const advanceCard = () => {
    setShowFeedback(false);
    if (currentIndex < deck.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      // All cards done — show game over
      setGameOver(true);
    }
  };

  const restartGame = () => {
    setDeck([...SCENARIOS].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setHighestStreak(0);
    setCorrectCount(0);
    setGameOver(false);
    setShowFeedback(false);
  };

  const totalCards = deck.length;
  const accuracy = totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 0;

  // GAME OVER SCREEN
  if (gameOver) {
    return (
      <div className={`w-full max-w-4xl mx-auto h-[80vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-xl shadow-orange-500/30">
            <Shield size={48} className="text-white" />
          </div>

          <h2 className={`text-3xl md:text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Mission Complete!
          </h2>
          <p className={`text-base mb-8 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            You've scanned all {totalCards} messages. Here's how you did:
          </p>

          <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-10">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="text-3xl font-black text-[#2EC4B6]">{score}</div>
              <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Score</div>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="text-3xl font-black text-amber-500">{highestStreak}🔥</div>
              <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Best Streak</div>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`text-3xl font-black ${accuracy >= 80 ? 'text-emerald-500' : accuracy >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{accuracy}%</div>
              <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Accuracy</div>
            </div>
          </div>

          <div className={`p-4 rounded-xl mb-8 max-w-sm w-full ${accuracy >= 80 ? (isDark ? 'bg-emerald-950/50 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200') : (isDark ? 'bg-amber-950/50 border border-amber-800' : 'bg-amber-50 border border-amber-200')}`}>
            <p className={`text-sm font-bold ${accuracy >= 80 ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : (isDark ? 'text-amber-300' : 'text-amber-700')}`}>
              {accuracy >= 80
                ? `🛡️ ${companionName} says: "You're a Cyber Guardian! Scammers don't stand a chance against you!"`
                : accuracy >= 50
                ? `💪 ${companionName} says: "Good effort! Keep practicing and you'll be spotting scams like a pro!"`
                : `📚 ${companionName} says: "Let's study together! Remember: never click links from strangers or give out passwords."`
              }
            </p>
          </div>

          <div className="flex gap-4 w-full max-w-sm">
            <button
              onClick={restartGame}
              className="flex-1 py-4 rounded-2xl bg-[#2EC4B6] hover:bg-teal-600 text-white font-black text-base shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Play Again
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
  }

  if (!currentCard) return null;

  return (
    <div className={`w-full max-w-4xl mx-auto h-[80vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
      
      {/* HEADER */}
      <div className={`p-4 md:p-6 border-b flex items-center justify-between ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div>
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <ShieldAlert className="text-amber-500" />
            Phishing Swipe
          </h2>
          <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Spot the scams to protect your device!</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Score</div>
            <div className="text-xl font-black text-[#2EC4B6]">{score}</div>
          </div>
          <div className="text-right hidden md:block">
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Streak🔥</div>
            <div className="text-xl font-black text-amber-500">{streak}</div>
          </div>
          <button 
            onClick={onBack}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
          >
            Exit Game
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className={`px-6 py-2 flex items-center gap-3 ${isDark ? 'bg-slate-950/30' : 'bg-white/50'}`}>
        <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{currentIndex + 1}/{totalCards}</span>
        <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div 
            className="h-full rounded-full bg-gradient-to-r from-[#2EC4B6] to-emerald-400 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          />
        </div>
      </div>

      {/* GAME AREA */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* THE CARD */}
        <div className={`w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border-2 shadow-xl transition-all duration-300 transform ${showFeedback && lastAnswerCorrect ? 'scale-95 opacity-50' : 'scale-100'} ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
          
          {/* Card Header (Email Client Look) */}
          <div className={`p-3 border-b flex items-center gap-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} rounded-t-2xl`}>
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className={`ml-2 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'} uppercase tracking-wider`}>
              New {currentCard.type}
            </span>
          </div>
          
          <div className="p-6 md:p-8 space-y-4">
            <div>
              <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>From</div>
              <div className={`font-mono text-sm md:text-base font-semibold break-all ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {currentCard.sender}
              </div>
            </div>
            
            <div>
              <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Subject</div>
              <div className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {currentCard.subject}
              </div>
            </div>
            
            <div className={`p-4 rounded-xl text-sm md:text-base leading-relaxed ${isDark ? 'bg-slate-900/50 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
              {currentCard.body}
            </div>
          </div>
        </div>

        {/* CONTROLS (Desktop & Mobile Compatible) */}
        {!showFeedback && (
          <div className="flex gap-4 mt-8 w-full max-w-md px-4">
            <button 
              onClick={() => handleChoice(true)}
              className="flex-1 py-4 md:py-5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-sm md:text-base shadow-lg shadow-red-500/30 flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 active:scale-95"
            >
              <AlertTriangle size={24} />
              IT'S A SCAM!
            </button>
            <button 
              onClick={() => handleChoice(false)}
              className="flex-1 py-4 md:py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm md:text-base shadow-lg shadow-emerald-500/30 flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 active:scale-95"
            >
              <CheckCircle2 size={24} />
              IT'S SAFE!
            </button>
          </div>
        )}
      </div>

      {/* FEEDBACK OVERLAY */}
      {showFeedback && (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md ${lastAnswerCorrect ? (isDark ? 'bg-emerald-950/80' : 'bg-emerald-50/90') : (isDark ? 'bg-red-950/90' : 'bg-red-50/95')}`}>
          
          <div className={`max-w-md w-full p-8 rounded-3xl shadow-2xl border-4 text-center ${lastAnswerCorrect ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white dark:bg-slate-900 border-red-500'}`}>
            
            <div className="flex justify-center mb-4">
              {lastAnswerCorrect ? (
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <ShieldAlert size={40} className="text-red-500" />
                </div>
              )}
            </div>
            
            <h3 className={`text-3xl font-black mb-2 ${lastAnswerCorrect ? 'text-white' : (isDark ? 'text-red-400' : 'text-red-600')}`}>
              {lastAnswerCorrect ? "Awesome Job!" : "Oops! You got hacked!"}
            </h3>
            
            <p className={`text-base font-semibold leading-relaxed mb-6 ${lastAnswerCorrect ? 'text-emerald-50' : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>
              <strong className="block mb-2">{companionName} says:</strong>
              "{currentCard.explanation}"
            </p>
            
            {!lastAnswerCorrect && (
              <button 
                onClick={advanceCard}
                className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                Try Next Scenario <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
