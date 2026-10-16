import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { KobeAvatar } from "../../../KobeAvatar";
import { companionVoice } from "../../../../utils/audio";

interface CompanionGuidanceProps {
  companion: "kobe" | "chibi";
  speechText: string;
  fullNarrationText?: string;
  autoSpeak?: boolean;
  lang?: string;
  className?: string;
}

export const CompanionGuidance: React.FC<CompanionGuidanceProps> = ({
  companion,
  speechText,
  fullNarrationText,
  autoSpeak = true,
  lang = "en",
  className = ""
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textToRead = fullNarrationText || speechText;

  const triggerSpeech = (text: string, force: boolean = false) => {
    if (!force && !companionVoice.isNarrationEnabled("early explorers")) {
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(true);
    companionVoice.speakTTS(text, companion, "early explorers", lang);
    const estimatedSecs = Math.max(2.5, Math.ceil(text.split(" ").length / 2.4));
    timerRef.current = setTimeout(() => setIsPlaying(false), estimatedSecs * 1000);
  };

  // Automatically speak when speechText or fullNarrationText updates
  useEffect(() => {
    if (!autoSpeak) return;
    const startTimer = setTimeout(() => {
      triggerSpeech(textToRead, false);
    }, 220);

    return () => {
      clearTimeout(startTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [textToRead, companion, lang, autoSpeak]);

  const handleSpeak = () => {
    if (isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      companionVoice.stop();
      setIsPlaying(false);
    } else {
      triggerSpeech(textToRead, true);
    }
  };

  const companionName = companion === "chibi" ? "Chibi" : "Kobe";

  return (
    <div className={`flex items-center gap-3 sm:gap-4 max-w-xl mx-auto w-full px-2 ${className}`}>
      {/* Companion Avatar */}
      <div className="flex-shrink-0 cursor-pointer" onClick={handleSpeak} title={`Listen to ${companionName} read everything`}>
        <KobeAvatar 
          size={52} 
          character={companion} 
          ageGroup="early explorers" 
          pulse={isPlaying}
          expression={isPlaying ? "celebrating" : "happy"}
        />
      </div>

      {/* Tactile Speech Bubble */}
      <div className="relative flex-1 bg-slate-900/90 border-2 border-emerald-400/60 rounded-3xl p-3 sm:p-4 shadow-xl flex items-center justify-between gap-3 backdrop-blur-md">
        {/* Left pointing arrow */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-emerald-400/60 pointer-events-none" />

        <p 
          className="text-xs sm:text-sm text-slate-100 font-bold leading-relaxed select-none"
          style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
        >
          {speechText}
        </p>

        {/* Listen Button */}
        <button
          type="button"
          onClick={handleSpeak}
          className={`flex-shrink-0 p-2 sm:px-3 sm:py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-black transition-all shadow-md active:scale-95 ${
            isPlaying 
              ? "bg-amber-400 text-slate-950 animate-pulse ring-2 ring-amber-300" 
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
          }`}
          title="Read out quest, sequence items, and options"
        >
          {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span className="hidden sm:inline">{isPlaying ? "Stop" : "Read All"}</span>
        </button>
      </div>
    </div>
  );
};

