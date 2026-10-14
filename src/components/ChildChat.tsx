/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Square, Sparkles, Globe, Play, Pause, Sun, Moon, Radio, MessageSquare, RotateCcw } from "lucide-react";
import { Child, Lesson, Language } from "../types";
import { C, F, T, AGE_META, getAgeLabel, getAgeRange } from "../utils/config";
import { Txt, Heading, Label, Chip, Btn } from "./Primitives";
import { KobeAvatar } from "./KobeAvatar";
import { sfx, companionVoice } from "../utils/audio";
import { useApp } from "../context/AppContext";

interface ChildChatProps {
  child: Child;
  lesson?: Lesson | null;
  onLessonComplete?: (lessonId: string, starsEarned: number, xpEarned: number) => void;
  lang: Language;
  onClose: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isVoice?: boolean;
  audioUrl?: string;
  voiceDuration?: number;
  provider?: string;
  lang?: Language;
}

export const ChildChat: React.FC<ChildChatProps> = ({
  child,
  lesson,
  onLessonComplete,
  lang,
  onClose,
  theme: themeProp,
  onToggleTheme
}) => {
  const meta = AGE_META[child.ageGroup] || { color: C.teal, soft: C.tealGhost, kobeStyle: "" };
  const borderCol = meta.color;
  const compName = child.companion === "chibi" ? "Chibi" : "Kobe";

  // Global Context & Local Theme Resolution
  const { theme: ctxTheme, setTheme: setCtxTheme } = (() => {
    try {
      return useApp();
    } catch {
      return { theme: "light" as "light" | "dark", setTheme: () => {} };
    }
  })();

  const [localTheme, setLocalTheme] = useState<"light" | "dark">(() => {
    if (themeProp) return themeProp;
    if (ctxTheme) return ctxTheme;
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("clats_theme") as "light" | "dark";
      if (saved) return saved;
    }
    return "light";
  });

  useEffect(() => {
    if (themeProp) {
      setLocalTheme(themeProp);
    } else if (ctxTheme) {
      setLocalTheme(ctxTheme);
    }
  }, [themeProp, ctxTheme]);

  const isDark = localTheme === "dark";

  const handleToggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setLocalTheme(nextTheme);
    if (onToggleTheme) {
      onToggleTheme();
    } else if (setCtxTheme) {
      setCtxTheme(nextTheme);
    }
    sfx.playTap();
  };

  // Dynamic Light & Dark Mode Color Tokens
  const t = {
    pageBg: isDark ? "#0f172a" : "#f8fafc",
    cardBg: isDark ? "#1e293b" : "#ffffff",
    cardBorder: isDark ? "#334155" : "#e2e8f0",
    inputBg: isDark ? "#0f172a" : "#ffffff",
    inputBorder: isDark ? "#334155" : "#cbd5e1",
    tabBg: isDark ? "#1e293b" : "#ffffff",
    tabBorder: isDark ? "#334155" : "#e2e8f0",
    tabInactive: isDark ? "#94a3b8" : "#64748b",
    footerBg: isDark ? "#1e293b" : "#ffffff",
    footerBorder: isDark ? "#334155" : "#e2e8f0",
    textPrimary: isDark ? "#f8fafc" : "#0f172a",
    textSecondary: isDark ? "#cbd5e1" : "#475569",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    assistantBubbleBg: isDark ? "#1e293b" : "#ffffff",
    assistantBubbleBorder: isDark ? "#334155" : "#e2e8f0",
    assistantText: isDark ? "#f1f5f9" : "#1e293b",
    langBarBg: isDark ? "#1e293b" : "#ffffff",
    langBarBorder: isDark ? "#334155" : "#e2e8f0",
    langInactiveBg: isDark ? "#0f172a" : "#f1f5f9",
    langInactiveBorder: isDark ? "#334155" : "#cbd5e1",
    langInactiveText: isDark ? "#cbd5e1" : "#475569",
    optDefaultBg: isDark ? "#0f172a" : "#f8fafc",
    optDefaultBorder: isDark ? "#334155" : "#e2e8f0",
    optDefaultText: isDark ? "#e2e8f0" : "#334155",
    optBadgeDefaultBg: isDark ? "#334155" : "#e2e8f0",
    optBadgeDefaultText: isDark ? "#94a3b8" : "#64748b",
    cardShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.04)",
    bubbleShadow: isDark ? "0 2px 8px rgba(0,0,0,0.25)" : "0 1px 4px rgba(0,0,0,0.04)"
  };

  const [typedMessage, setTypedMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatViewMode, setChatViewMode] = useState<"stream" | "walkie">("stream");
  
  // Multilingual & Voice State (N-ATLAS Sovereign Integration)
  const [chatLang, setChatLang] = useState<Language>(lang);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up media streams and active audio on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    };
  }, []);

  // Sovereign YarnGPT Text to Speech playback (Authentic Nigerian Voice Engine) with instant fallback
  const speakMessage = async (msgId: string, text: string, targetLang: Language) => {
    // If already speaking this message, toggle off
    if (speakingMsgId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      companionVoice.stop();
      setSpeakingMsgId(null);
      setIsSynthesizing(false);
      return;
    }

    // Stop any existing playback
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    companionVoice.stop();

    setSpeakingMsgId(msgId);
    setIsSynthesizing(true);

    try {
      const res = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language: targetLang,
          character: child.companion || "kobe"
        })
      });

      if (res.ok) {
        const data = await res.json();
        const audioSrc = data.audioBase64 || data.audioUrl;

        if (audioSrc) {
          const audio = new Audio(audioSrc);
          activeAudioRef.current = audio;

          audio.onended = () => {
            setSpeakingMsgId(null);
            setIsSynthesizing(false);
            activeAudioRef.current = null;
          };
          audio.onerror = () => {
            console.warn("Failed to play YarnGPT audio buffer, falling back to speech synthesis.");
            activeAudioRef.current = null;
            companionVoice.playBrowserSpeech(text, (child.companion as any) || "kobe", targetLang);
            setIsSynthesizing(false);
          };

          await audio.play();
          setIsSynthesizing(false);
          return;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn("YarnGPT voice synthesis returned an error:", errData);
      }
    } catch (e) {
      console.warn("YarnGPT voice synthesis error:", e);
    }

    // Zero-latency fallback speech synthesis so Kobe/Chibi is never silent
    setIsSynthesizing(false);
    companionVoice.playBrowserSpeech(text, (child.companion as any) || "kobe", targetLang);
    const speechTimeout = Math.min(Math.max(text.length * 75, 2000), 12000);
    setTimeout(() => {
      setSpeakingMsgId((curr) => (curr === msgId ? null : curr));
    }, speechTimeout);
  };

  // Start Voice Recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Microphone access is not supported in this browser.");
        return;
      }

      sfx.playTap();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Please allow microphone access to talk to Kobe!");
    }
  };

  // Stop Recording & Send Voice Note
  const stopRecording = (cancel = false) => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    const duration = recordingSeconds;
    setIsRecording(false);
    setRecordingSeconds(0);

    recorder.onstop = async () => {
      // Stop all audio tracks
      recorder.stream.getTracks().forEach((track) => track.stop());

      if (cancel || audioChunksRef.current.length === 0) {
        sfx.play("pop");
        return;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const localAudioUrl = URL.createObjectURL(audioBlob);

      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string)?.split(",")[1];
        if (base64Data) {
          await send(undefined, base64Data, localAudioUrl, duration);
        }
      };
    };

    recorder.stop();
  };

  // Restart chat on tab or lesson updates
  useEffect(() => {
    const welcomePhrases: Record<Language, string> = {
      en: lesson 
        ? `Hello! I am ${compName}, your tech assistant. Ask me anything about our lesson today: "${lesson.title[chatLang] || lesson.title.en}"!`
        : `Hello! I am ${compName}. Tap the microphone or type to ask me anything in English, Yorùbá, Hausa, or Igbo!`,
      yo: lesson
        ? `Bawo ni! Emi ni ${compName}. Beere ohunkohun nipa eko wa loni: "${lesson.title[chatLang] || lesson.title.en}"!`
        : `Bawo ni! Emi ni ${compName}. Te bọtini gbohungbohun lati ba mi soro ni Ede Yoruba!`,
      ha: lesson
        ? `Sannu! Ni ne ${compName}. Tambaye ni komai game da darasinmu a yau: "${lesson.title[chatLang] || lesson.title.en}"!`
        : `Sannu! Ni ne ${compName}. Danna makirufo domin yin magana da ni a harshen Hausa!`,
      ig: lesson
        ? `Ndị kedu! Abụ m ${compName}. Jụọ m ihe ọ bụla gbasara ihe mmụta anyị taa: "${lesson.title[chatLang] || lesson.title.en}"!`
        : `Ndị kedu! Abụ m ${compName}. Pịa maikrofon ka anyị kparịta ụka n'asụsụ Igbo!`
    };

    setMessages([{ 
      id: "intro", 
      role: "assistant", 
      content: welcomePhrases[chatLang] || welcomePhrases.en,
      provider: "N-ATLAS Multilingual Engine",
      lang: chatLang
    }]);
  }, [lesson, chatLang]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isTyping, isRecording]);

  const send = async (
    textOverride?: string, 
    audioBase64?: string, 
    audioUrl?: string, 
    voiceDuration?: number
  ) => {
    const text = textOverride ?? typedMessage.trim();
    if ((!text && !audioBase64) || isTyping) return;
    
    if (!audioBase64) {
      setTypedMessage("");
    }

    const uMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: "user", 
      content: audioBase64 ? `🎙️ Voice Note (${voiceDuration || 1}s)` : text,
      isVoice: Boolean(audioBase64),
      audioUrl: audioUrl,
      voiceDuration: voiceDuration,
      lang: chatLang
    };

    setMessages((prev) => [...prev, uMsg]);
    setIsTyping(true);

    // Build the system instructions matching their exact group!
    const contextPrompt = lesson
      ? `, based on the active lesson: "${lesson.title.en} - ${lesson.story?.en || ""}"`
      : "";

    const sysPrompt = [
      `You are ${compName}, an interactive advanced companion robot helping kids learn technology inside CLATS.`,
      `The child's track is "${AGE_LABEL_STR(child.ageGroup)}" for age levels ${AGE_AGES_STR(child.ageGroup)}.`,
      `Ensure you adjust your tone to their age traits. Your character traits for this track:`,
      `[CHARACTER DETAILS]: ${meta.kobeStyle}`,
      `Keep your chat responses informative, warm, and concise (max 2-3 short paragraphs).`,
      `The child's selected language is "${chatLang}". Respond strictly in this language.`,
      contextPrompt
    ].join("\n");

    try {
      const apiResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text || undefined,
          audioBase64: audioBase64 || undefined,
          language: chatLang,
          systemPrompt: sysPrompt,
          history: messages.slice(-8) // Limit depth
        })
      });

      if (!apiResponse.ok) {
        throw new Error("Local endpoint failure");
      }

      const raw = await apiResponse.json();
      const replyMsgId = "kobe-" + Date.now().toString();

      setMessages((prev) => [
        ...prev,
        { 
          id: replyMsgId, 
          role: "assistant", 
          content: raw.text,
          provider: raw.provider || "N-ATLAS 8B (NCAIR Sovereign Model)",
          lang: chatLang
        }
      ]);

      // If user sent a voice question or in Walkie-Talkie mode, automatically speak back
      if (audioBase64 || chatViewMode === "walkie") {
        speakMessage(replyMsgId, raw.text, chatLang);
      }
    } catch (e) {
      console.error(e);
      const replyMsgId = "kobe-" + Date.now().toString();
      const sovereignReply = chatLang === "yo"
        ? "Ẹ n lẹ́ o! Èmi ni Kobe lórí N-ATLAS. Mo wà pẹ̀lú rẹ láti kọ́ ìmọ̀ kọ̀mpútà àti koodu. Ẹ jẹ́ kí a tẹ̀síwájú!"
        : chatLang === "ha"
        ? "Sannu! Ni ne Kobe a kan N-ATLAS. Ina tare da kai domin koyan kwamfuta da fasaha. Bari mu ci gaba!"
        : chatLang === "ig"
        ? "Ndewo! Abụ m Kobe na N-ATLAS. Anọ m ebe a iji nyere gị aka ịmụta kọmputa na koodu. Ka anyị gaa n'ihu!"
        : "Hello superstar! I am Kobe, your N-ATLAS learning companion. I'm right here with you to explore coding and technology!";

      setMessages((prev) => [
        ...prev,
        {
          id: replyMsgId,
          role: "assistant",
          content: sovereignReply,
          provider: "N-ATLAS 8B (NCAIR Sovereign Model)",
          lang: chatLang
        }
      ]);

      if (audioBase64 || chatViewMode === "walkie") {
        speakMessage(replyMsgId, sovereignReply, chatLang);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const AGE_LABEL_STR = (ag: string) => getAgeLabel(ag);
  const AGE_AGES_STR = (ag: string) => getAgeRange(ag);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.pageBg,
        color: t.textPrimary,
        display: "flex",
        flexDirection: "column",
        transition: "background-color 0.25s ease, color 0.25s ease"
      }}
    >
      {/* Header Panel */}
      <div
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${borderCol}CC, #0f172a)`
            : `linear-gradient(135deg, ${borderCol}, ${borderCol}CC)`,
          padding: "16px 18px 22px",
          borderRadius: "0 0 24px 24px",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.35)" : "0 4px 16px rgba(0,0,0,0.06)",
          position: "relative",
          transition: "all 0.25s ease"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={onClose}
            style={{
              background: isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.22)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 10,
              padding: "7px 14px",
              color: "#ffffff",
              fontFamily: F.body,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            ← Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Seamless Light/Dark Mode Switcher */}
            <button
              onClick={handleToggleTheme}
              style={{
                background: isDark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.25)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 20,
                padding: "6px 12px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.2s ease",
                backdropFilter: "blur(6px)"
              }}
              title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
            >
              {isDark ? (
                <>
                  <Moon size={14} color="#FACC15" />
                  <span>Night</span>
                </>
              ) : (
                <>
                  <Sun size={14} color="#FACC15" />
                  <span>Day</span>
                </>
              )}
            </button>

            {/* Mode Switcher: Stream vs Live Walkie-Talkie */}
            <button
              onClick={() => {
                sfx.playTap();
                setChatViewMode((prev) => (prev === "stream" ? "walkie" : "stream"));
              }}
              style={{
                background: isDark ? "rgba(16,185,129,0.28)" : "rgba(255,255,255,0.28)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 20,
                padding: "6px 13px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.2s ease",
                backdropFilter: "blur(6px)"
              }}
              title="Switch between Voice Walkie-Talkie and Chat Stream"
            >
              {chatViewMode === "stream" ? (
                <>
                  <Radio size={14} color="#34d399" />
                  <span>Walkie-Talkie</span>
                </>
              ) : (
                <>
                  <MessageSquare size={14} color="#38bdf8" />
                  <span>Chat Stream</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <KobeAvatar size={42} ageGroup={child.ageGroup} character={child.companion || "kobe"} />
          <div>
            <Heading size={19} color="#ffffff">
              {compName} AI Learning Companion
            </Heading>
            <Txt size={12.5} color="rgba(255,255,255,0.9)">
              {lesson 
                ? `Ready to discuss: "${lesson.title[chatLang] || lesson.title.en}"`
                : "Ask me anything in English, Yorùbá, Hausa, or Igbo!"}
            </Txt>
          </div>
        </div>
      </div>

      {/* Walkie-Talkie Mode or Chat Stream Mode */}
      {chatViewMode === "walkie" ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 110px",
            textAlign: "center",
            maxWidth: 520,
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
            overflowY: "auto"
          }}
        >
          {/* Sovereign Voice Language Selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: t.langBarBg,
              padding: "8px 16px",
              borderRadius: 24,
              border: `1.5px solid ${t.langBarBorder}`,
              boxShadow: t.cardShadow,
              flexWrap: "wrap",
              justifyContent: "center"
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: t.textSecondary }}>Voice:</span>
            {[
              { code: "en", label: "English 🇬🇧" },
              { code: "yo", label: "Yorùbá 🇳🇬" },
              { code: "ha", label: "Hausa 🇳🇬" },
              { code: "ig", label: "Igbo 🇳🇬" }
            ].map((opt) => (
              <button
                key={opt.code}
                onClick={() => {
                  sfx.playTap();
                  setChatLang(opt.code as Language);
                }}
                style={{
                  padding: "4px 12px",
                  borderRadius: 16,
                  border: chatLang === opt.code ? `2px solid ${borderCol}` : `1px solid ${t.langInactiveBorder}`,
                  background: chatLang === opt.code ? borderCol + "25" : t.langInactiveBg,
                  color: chatLang === opt.code ? borderCol : t.langInactiveText,
                  fontWeight: chatLang === opt.code ? 800 : 600,
                  fontSize: 11.5,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Hero Companion Mascot with Multi-Ring Aura */}
          <div style={{ position: "relative", marginTop: 24, marginBottom: 12 }}>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: isRecording
                  ? "radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)"
                  : speakingMsgId
                  ? "radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)"
                  : isTyping
                  ? "radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)"
                  : `radial-gradient(circle, ${borderCol}25 0%, transparent 70%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: isRecording || speakingMsgId ? "pulse 1.5s infinite" : "none",
                transition: "all 0.3s ease"
              }}
            >
              <KobeAvatar
                size={96}
                character={child.companion || "kobe"}
                ageGroup={child.ageGroup}
                expression={speakingMsgId ? "celebrating" : isTyping ? "thinking" : "happy"}
              />
            </div>
          </div>

          {/* Animated Frequency Waves */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, height: 26, marginBottom: 12 }}>
            {[12, 22, 28, 16, 26, 14, 24].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 5,
                  height: speakingMsgId || isRecording ? `${h}px` : "6px",
                  borderRadius: 3,
                  background: isRecording ? "#ef4444" : speakingMsgId ? "#10b981" : isDark ? "#475569" : "#cbd5e1",
                  transition: "height 0.2s ease, background-color 0.2s ease"
                }}
              />
            ))}
          </div>

          {/* Status Badge */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "inline-block",
                padding: "6px 18px",
                borderRadius: 20,
                background: isRecording
                  ? "#fee2e2"
                  : speakingMsgId
                  ? "#ecfdf5"
                  : isTyping
                  ? "#fef3c7"
                  : isDark ? "#1e293b" : "#f1f5f9",
                color: isRecording
                  ? "#b91c1c"
                  : speakingMsgId
                  ? "#065f46"
                  : isTyping
                  ? "#92400e"
                  : t.textSecondary,
                fontSize: 13,
                fontWeight: 800,
                border: `1.5px solid ${
                  isRecording ? "#ef4444" : speakingMsgId ? "#10b981" : isTyping ? "#f59e0b" : t.cardBorder
                }`
              }}
            >
              {isRecording
                ? `🔴 Listening (${recordingSeconds}s)... Speak now in ${chatLang.toUpperCase()}!`
                : isTyping
                ? `🟡 Kobe is thinking with N-ATLAS...`
                : speakingMsgId
                ? `🟢 Kobe is speaking in ${chatLang.toUpperCase()} (YarnGPT)`
                : `🎙️ Press & Hold (or Tap) to Talk with ${compName}`}
            </div>
          </div>

          {/* Latest Dialogue Transcript Card */}
          <div
            style={{
              width: "100%",
              background: t.cardBg,
              border: `1.5px solid ${t.cardBorder}`,
              borderRadius: 22,
              padding: "16px 18px",
              marginBottom: 20,
              boxShadow: t.cardShadow,
              textAlign: "left",
              minHeight: 85
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: borderCol, textTransform: "uppercase", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>💬 Latest Exchange</span>
              {messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
                <button
                  onClick={() => {
                    const lastMsg = messages[messages.length - 1];
                    speakMessage(lastMsg.id, lastMsg.content, chatLang);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: borderCol,
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <RotateCcw size={12} /> Replay Voice
                </button>
              )}
            </div>
            <div style={{ fontSize: 13.5, color: t.textPrimary, lineHeight: 1.5, fontWeight: 600 }}>
              {messages.length > 0
                ? messages[messages.length - 1].content
                : `Tap the Walkie-Talkie button below to ask ${compName} anything!`}
            </div>
          </div>

          {/* Quick Action Chips in Walkie-Talkie Mode */}
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              maxWidth: "100%",
              paddingBottom: 4,
              marginBottom: 10,
              whiteSpace: "nowrap"
            }}
          >
            {(lesson ? [
              { label: "📖 Explain lesson", prompt: `Explain the key concepts of our lesson: "${lesson.title[chatLang] || lesson.title.en}" simply in ${chatLang}!` },
              { label: "🍲 Jollof analogy!", prompt: "Explain this lesson's concept using a fun Nigerian analogy (like cooking jollof rice or puff-puff)!" },
              { label: "🎯 Quiz challenge!", prompt: `Ask me 1 fun question to test my understanding of "${lesson.title.en}"!` }
            ] : [
              { label: "🤖 How AI thinks", prompt: "How do computers and AI actually think? Explain simply!" },
              { label: "🍲 Jollof algorithm!", prompt: "Explain what an algorithm is with a Nigerian food analogy!" },
              { label: "🔐 Online Safety", prompt: "What is the #1 most important rule for staying safe on the internet?" },
              { label: "🎯 Tech Quiz!", prompt: "Give me a quick 1-question technology quiz!" }
            ]).map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sfx.playTap();
                  send(chip.prompt);
                }}
                disabled={isTyping}
                style={{
                  padding: "5px 12px",
                  borderRadius: 16,
                  border: `1.5px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                  background: isDark ? "#0f172a" : "#f1f5f9",
                  color: t.textPrimary,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: isTyping ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s ease"
                }}
                className="hover:scale-105 active:scale-95"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Big Tactile Walkie-Talkie Button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <button
              onMouseDown={startRecording}
              onMouseUp={() => stopRecording(false)}
              onTouchStart={startRecording}
              onTouchEnd={() => stopRecording(false)}
              onClick={() => {
                if (isRecording) {
                  stopRecording(false);
                } else if (!isTyping) {
                  startRecording();
                }
              }}
              disabled={isTyping}
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: isRecording
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : `linear-gradient(135deg, #10b981, #059669)`,
                border: `4px solid ${isRecording ? "#fca5a5" : "#6ee7b7"}`,
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: isTyping ? "not-allowed" : "pointer",
                boxShadow: isRecording
                  ? "0 0 28px rgba(239,68,68,0.6)"
                  : "0 8px 28px rgba(16,185,129,0.45)",
                transform: isRecording ? "scale(1.08)" : "scale(1)",
                transition: "all 0.15s ease"
              }}
              className="hover:scale-105 active:scale-95"
            >
              <Mic size={36} />
            </button>
            <div style={{ fontSize: 12, fontWeight: 800, color: t.textMuted }}>
              {isRecording ? "Release to Send Voice Note" : "Hold or Tap to Talk"}
            </div>
          </div>
        </div>
      ) : (
        /* Chat Content Stream */
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 220px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Connected Lesson Indicator */}
            {lesson && (
              <div
                style={{
                  background: isDark ? "rgba(46,196,182,0.15)" : "#f0fdfa",
                  border: `1.5px solid ${borderCol}`,
                  borderRadius: 16,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📚</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: borderCol, textTransform: "uppercase" }}>
                      Connected Lesson Focus
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.textPrimary }}>
                      {lesson.title[chatLang] || lesson.title.en}
                    </div>
                  </div>
                </div>
                <Chip color={borderCol} bg={borderCol + "22"}>Active Focus</Chip>
              </div>
            )}

            {/* 1. N-ATLAS Multilingual Sovereign Selector Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
                background: t.langBarBg,
                padding: "10px 14px",
                borderRadius: 16,
                border: `1.5px solid ${t.langBarBorder}`,
                boxShadow: t.cardShadow,
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.textSecondary }}>🌍 Language:</span>
                {(
                  [
                    { code: "en", label: "English 🇬🇧" },
                    { code: "yo", label: "Yorùbá 🇳🇬" },
                    { code: "ha", label: "Hausa 🇳🇬" },
                    { code: "ig", label: "Igbo 🇳🇬" }
                  ] as const
                ).map((langOpt) => {
                  const isActive = chatLang === langOpt.code;
                  return (
                    <button
                      key={langOpt.code}
                      onClick={() => {
                        sfx.playTap();
                        setChatLang(langOpt.code as Language);
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        border: isActive ? `2px solid ${borderCol}` : `1px solid ${t.langInactiveBorder}`,
                        background: isActive ? borderCol + "22" : t.langInactiveBg,
                        color: isActive ? borderCol : t.langInactiveText,
                        fontWeight: isActive ? 800 : 600,
                        fontSize: 11.5,
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      {langOpt.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={13} color="#10B981" />
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "#10B981", letterSpacing: 0.5, textTransform: "uppercase" }}>
                  N-ATLAS Sovereign AI
                </span>
              </div>
            </div>

            {/* 2. Messages List */}
            <div
              ref={listRef}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxHeight: 380,
                overflowY: "auto",
                paddingRight: 4
              }}
            >
              {messages.map((m) => {
                const isKobe = m.role === "assistant";
                const isSpeakingThis = speakingMsgId === m.id;

                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: isKobe ? "flex-start" : "flex-end",
                      gap: 8,
                      alignItems: "flex-start"
                    }}
                  >
                    {isKobe && <KobeAvatar size={34} ageGroup={child.ageGroup} character={child.companion || "kobe"} />}
                    <div
                      style={{
                        background: isKobe ? t.assistantBubbleBg : borderCol,
                        color: isKobe ? t.assistantText : "#ffffff",
                        border: isKobe ? `1.5px solid ${t.assistantBubbleBorder}` : "none",
                        borderRadius: isKobe ? "0 16px 16px 16px" : "16px 16px 0 16px",
                        padding: "12px 15px",
                        maxWidth: "80%",
                        boxShadow: t.bubbleShadow,
                        transition: "all 0.2s ease"
                      }}
                    >
                      {isKobe && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 12 }}>
                          <Label color={borderCol} style={{ fontSize: 10.5, fontWeight: 800 }}>
                            {compName} • {m.provider || "N-ATLAS"}
                          </Label>
                          <button
                            onClick={() => speakMessage(m.id, m.content, m.lang || chatLang)}
                            style={{
                              background: isSpeakingThis ? borderCol : (isDark ? "rgba(34,211,238,0.18)" : "rgba(34,211,238,0.1)"),
                              color: isSpeakingThis ? "#ffffff" : (isDark ? "#38bdf8" : borderCol),
                              border: isSpeakingThis ? "none" : `1px solid ${borderCol}40`,
                              borderRadius: 14,
                              padding: "3px 9px",
                              fontSize: 10.5,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                            title="Listen to response in YarnGPT voice"
                          >
                            <Volume2 size={12} />
                            {isSpeakingThis ? (isSynthesizing ? "Connecting..." : "Playing...") : "Listen"}
                          </button>
                        </div>
                      )}

                      {/* If user sent voice note */}
                      {m.isVoice && m.audioUrl && (
                        <div style={{ marginBottom: 6 }}>
                          <audio 
                            src={m.audioUrl} 
                            controls 
                            style={{ 
                              height: 32, 
                              width: 220, 
                              filter: isDark ? "invert(88%) hue-rotate(180deg)" : "contrast(90%)" 
                            }} 
                          />
                        </div>
                      )}

                      <Txt size={13.5} color={isKobe ? t.assistantText : "#ffffff"} style={{ lineHeight: 1.6, display: "block" }}>
                        {m.content}
                      </Txt>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <KobeAvatar size={34} ageGroup={child.ageGroup} character={child.companion || "kobe"} pulse />
                  <div
                    style={{
                      background: t.cardBg,
                      border: `1.5px solid ${t.cardBorder}`,
                      borderRadius: "0 14px 14px 14px",
                      padding: "10px 14px",
                      boxShadow: t.bubbleShadow
                    }}
                  >
                    <Txt size={12} color={t.textSecondary}>
                      {compName} is processing on N-ATLAS...
                    </Txt>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Input & Voice Recording Footer Bar */}
            <div
              style={{
                position: "fixed",
                bottom: 74,
                left: 0,
                right: 0,
                background: t.footerBg,
                padding: "8px 16px 12px",
                borderTop: `1.5px solid ${t.footerBorder}`,
                boxShadow: isDark ? "0 -4px 20px rgba(0,0,0,0.35)" : "0 -4px 16px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                zIndex: 50,
                transition: "all 0.2s ease"
              }}
            >
              {/* Interactive Quick Action Prompt Chips */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 2,
                  whiteSpace: "nowrap"
                }}
              >
                {(lesson ? [
                  { label: "📖 Explain lesson", prompt: `Explain the key concepts of our lesson: "${lesson.title[chatLang] || lesson.title.en}" simply in ${chatLang}!` },
                  { label: "🍲 Jollof analogy!", prompt: "Explain this lesson's concept using a fun Nigerian analogy (like cooking jollof rice or puff-puff)!" },
                  { label: "🎯 Quiz challenge!", prompt: `Ask me 1 fun question to test my understanding of "${lesson.title.en}"!` },
                  { label: "❓ Why it matters", prompt: "Why is learning this technology important for an African child's future?" }
                ] : [
                  { label: "🤖 How AI thinks", prompt: "How do computers and AI actually think? Explain simply!" },
                  { label: "🍲 Jollof algorithm!", prompt: "Explain what an algorithm is with a Nigerian food analogy!" },
                  { label: "🔐 Online Safety", prompt: "What is the #1 most important rule for staying safe on the internet?" },
                  { label: "🎯 Tech Quiz!", prompt: "Give me a quick 1-question technology quiz!" }
                ]).map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sfx.playTap();
                      send(chip.prompt);
                    }}
                    disabled={isTyping}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 16,
                      border: `1.5px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                      background: isDark ? "#0f172a" : "#f1f5f9",
                      color: t.textPrimary,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: isTyping ? "not-allowed" : "pointer",
                      flexShrink: 0,
                      transition: "all 0.15s ease"
                    }}
                    className="hover:scale-105 active:scale-95"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Input Row */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {isRecording ? (
                /* LIVE RECORDING STATE */
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: isDark ? "rgba(239,68,68,0.22)" : "#FEE2E2",
                    border: "1.5px solid #EF4444",
                    borderRadius: 14,
                    padding: "8px 14px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#EF4444",
                        animation: "pulse 1s infinite"
                      }}
                    />
                    <Txt size={13} weight={800} color={isDark ? "#fca5a5" : "#B91C1C"}>
                      Recording ({recordingSeconds}s)... Speak now in {chatLang.toUpperCase()}
                    </Txt>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => stopRecording(true)}
                      style={{
                        background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
                        border: "none",
                        borderRadius: 10,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: isDark ? "#fca5a5" : "#7F1D1D",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => stopRecording(false)}
                      style={{
                        background: "#10B981",
                        border: "none",
                        borderRadius: 10,
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      Send Voice ▶
                    </button>
                  </div>
                </div>
              ) : (
                /* DEFAULT TEXT + VOICE BUTTON STATE */
                <>
                  <button
                    onClick={startRecording}
                    disabled={isTyping}
                    style={{
                      background: isDark ? "rgba(16,185,129,0.2)" : "#10B98115",
                      border: "1.5px solid #10B981",
                      borderRadius: 12,
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isTyping ? "not-allowed" : "pointer",
                      color: "#10B981",
                      flexShrink: 0,
                      transition: "all 0.15s"
                    }}
                    title="Tap to speak in English, Yoruba, Hausa or Igbo"
                  >
                    <Mic size={20} />
                  </button>

                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={
                      chatLang === "yo"
                        ? "Te ibi lati te ibeere re tabi tẹ maiki..."
                        : chatLang === "ha"
                        ? "Rubuta tambayarka ko danna makirufo..."
                        : chatLang === "ig"
                        ? "Dee ajụjụ gị ebe a ma ọ bụ pịa maikrofon..."
                        : T[lang].askKobe + " or tap mic to speak..."
                    }
                    style={{
                      flex: 1,
                      background: t.inputBg,
                      border: `1.5px solid ${t.inputBorder}`,
                      color: t.textPrimary,
                      borderRadius: 12,
                      padding: "10px 14px",
                      fontSize: 13.5,
                      outline: "none",
                      fontFamily: F.body,
                      transition: "all 0.2s ease"
                    }}
                  />

                  <Btn variant="yellow" size="sm" onClick={() => send()} disabled={isTyping || !typedMessage.trim()}>
                    Ask
                  </Btn>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChildChat;
