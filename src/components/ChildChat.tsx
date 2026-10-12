/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Square, Sparkles, Globe, Play, Pause, Sun, Moon } from "lucide-react";
import { Child, Lesson, Language } from "../types";
import { C, F, T, AGE_META } from "../utils/config";
import { Txt, Heading, Label, Chip, Btn } from "./Primitives";
import { KobeAvatar } from "./KobeAvatar";
import { sfx } from "../utils/audio";
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

  // Sovereign YarnGPT Text to Speech playback (Authentic Nigerian Voice Engine)
  const speakMessage = async (msgId: string, text: string, targetLang: Language) => {
    // If already speaking this message, toggle off
    if (speakingMsgId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      setSpeakingMsgId(null);
      setIsSynthesizing(false);
      return;
    }

    // Stop any existing playback
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

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
            console.warn("Failed to play YarnGPT audio buffer.");
            setSpeakingMsgId(null);
            setIsSynthesizing(false);
            activeAudioRef.current = null;
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

    setSpeakingMsgId(null);
    setIsSynthesizing(false);
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
          provider: raw.provider || "N-ATLAS Sovereign AI",
          lang: chatLang
        }
      ]);

      // If user sent a voice question, automatically speak back the first sentence
      if (audioBase64) {
        speakMessage(replyMsgId, raw.text, chatLang);
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-kobe",
          role: "assistant",
          content: chatLang === "yo" 
            ? "Ẹ jọwọ, asopọ mi dabi ẹni pe o fẹlẹ. Ẹ gbiyanju lẹẹkansi!" 
            : chatLang === "ha"
            ? "Don Allah, an samu matsala wajen sadarwa. Da fatan za a sake gwadawa!"
            : chatLang === "ig"
            ? "Biko, enwere nsogbu njikọ. Biko nwaa ọzọ!"
            : "Oh! My neural connection flickered. Try asking me again, or make sure your internet is connected!"
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const AGE_LABEL_STR = (ag: string) => (ag === "early explorers" ? "Early Explorers" : ag === "young innovators" ? "Young Innovators" : "Future Builders");
  const AGE_AGES_STR = (ag: string) => (ag === "early explorers" ? "6-10" : ag === "young innovators" ? "11-13" : "14-18");

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

            <Chip color="#ffffff" bg={isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.2)"}>
              Voice AI Tutor
            </Chip>
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

      {/* Chat Content Stream */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 120px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                bottom: 0,
                left: 0,
                right: 0,
                background: t.footerBg,
                padding: "12px 16px 22px",
                borderTop: `1.5px solid ${t.footerBorder}`,
                boxShadow: isDark ? "0 -4px 20px rgba(0,0,0,0.35)" : "0 -4px 16px rgba(0,0,0,0.04)",
                display: "flex",
                gap: 10,
                alignItems: "center",
                zIndex: 10,
                transition: "all 0.2s ease"
              }}
            >
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
  );
};
export default ChildChat;
