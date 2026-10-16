/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KobeLessonSidekick.tsx — In-Lesson Interactive Voice & Chat Companion
 * Embeds Kobe/Chibi directly inside active lessons to provide:
 * 1. Floating one-tap voice sidekick that pauses media and answers questions
 * 2. Cultural Nigerian language explanations (Yorùbá, Hausa, Igbo, English)
 * 3. Sovereign N-ATLAS pedagogical reasoning + YarnGPT neural speech
 */

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Sparkles, X, Play, Pause, MessageCircle, Send, HelpCircle } from "lucide-react";
import { Child, Lesson, Language, QuizQuestion } from "../types";
import { C, F, AGE_META } from "../utils/config";
import { KobeAvatar } from "./KobeAvatar";
import { sfx, companionVoice } from "../utils/audio";
import { useApp } from "../context/AppContext";

export type SovereignLang = Language;

interface KobeLessonSidekickProps {
  child: Child;
  lesson: Lesson | null;
  lang: Language | SovereignLang;
  theme?: "light" | "dark";
  onPauseMedia?: () => void;
  onResumeMedia?: () => void;
  currentQuizQuestion?: any;
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
  triggerHintPrompt?: string | null;
}

interface SidekickMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  isVoice?: boolean;
}

export const KobeLessonSidekick: React.FC<KobeLessonSidekickProps> = ({
  child,
  lesson,
  lang,
  theme: themeProp,
  onPauseMedia,
  onResumeMedia,
  currentQuizQuestion,
  isOpenExternal,
  onCloseExternal,
  triggerHintPrompt
}) => {
  const compName = child.companion === "chibi" ? "Chibi" : "Kobe";
  const meta = AGE_META[child.ageGroup] || { color: "#2EC4B6" };
  const borderCol = meta.color || "#2EC4B6";

  const { theme: ctxTheme } = (() => {
    try {
      return useApp();
    } catch {
      return { theme: "light" as "light" | "dark" };
    }
  })();

  const isDark = (themeProp || ctxTheme) === "dark";

  // Sidekick drawer state
  const [isOpen, setIsOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<SovereignLang>((lang as any) || "en");
  const [messages, setMessages] = useState<SidekickMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Voice recording & playback state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync external open triggers (e.g. from Quiz Hint button)
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      if (isOpenExternal && !isOpen) {
        handleOpen();
      } else if (!isOpenExternal && isOpen) {
        handleClose();
      }
    }
  }, [isOpenExternal]);

  // Handle external hint prompt injection
  useEffect(() => {
    if (triggerHintPrompt && isOpen) {
      sendMessage(triggerHintPrompt);
    }
  }, [triggerHintPrompt, isOpen]);

  // Initialize companion welcome message for this lesson
  useEffect(() => {
    if (!lesson) return;
    const lessonTitle = lesson.title[activeLang] || lesson.title.en;
    
    const welcomes: Record<SovereignLang, string> = {
      en: `Hi ${child.name}! I am ${compName}. Got any questions about "${lessonTitle}"? Tap mic or ask me anything!`,
      yo: `Bawo ni ${child.name}! Emi ni ${compName}. Ṣe o ni ibeere kankan nipa "${lessonTitle}"? Beere lọwọ mi!`,
      ha: `Sannu ${child.name}! Ni ne ${compName}. Kuna da wata tambaya game da "${lessonTitle}"? Tambaye ni komai!`,
      ig: `Kedu ${child.name}! Abụ m ${compName}. Ị nwere ajụjụ ọ bụla gbasara "${lessonTitle}"? Jụọ m ihe ọ bụla!`,
      fr: `Salut ${child.name} ! Je suis ${compName}. Des questions sur "${lessonTitle}" ? Appuie sur le micro ou pose-moi des questions !`
    };

    setMessages([
      {
        id: "sidekick-intro",
        role: "assistant",
        content: welcomes[activeLang] || welcomes.en
      }
    ]);
  }, [lesson?.id, activeLang]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isRecording]);

  const handleOpen = () => {
    sfx.playTap();
    setIsOpen(true);
    try {
      if (onPauseMedia) onPauseMedia();
    } catch (err) {
      console.warn("Media pause ignored:", err);
    }
  };

  const handleClose = () => {
    sfx.playTap();
    setIsOpen(false);
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
      } catch {}
      setIsPlayingAudio(false);
    }
    try {
      companionVoice.stop();
    } catch {}
    if (onCloseExternal) onCloseExternal();
    try {
      if (onResumeMedia) onResumeMedia();
    } catch (err) {
      console.warn("Media resume ignored:", err);
    }
  };

  // Play audio via YarnGPT with Web Speech companionVoice fallback
  const playYarnVoice = async (text: string, targetLang: Language) => {
    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }

      setIsPlayingAudio(true);
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
        const url = data.audioBase64 || data.audioUrl;
        if (url && typeof url === "string") {
          const audio = new Audio(url);
          audioPlayerRef.current = audio;
          audio.onended = () => setIsPlayingAudio(false);
          audio.onerror = () => {
            setIsPlayingAudio(false);
            companionVoice.speakTTS(text, child.companion || "kobe", child.ageGroup, targetLang);
          };
          await audio.play();
          return;
        }
      }
      setIsPlayingAudio(false);
      companionVoice.speakTTS(text, child.companion || "kobe", child.ageGroup, targetLang);
    } catch {
      setIsPlayingAudio(false);
      companionVoice.speakTTS(text, child.companion || "kobe", child.ageGroup, targetLang);
    }
  };

  // Send message to /api/chat (N-ATLAS)
  const sendMessage = async (userText: string, audioBase64?: string) => {
    if ((!userText && !audioBase64) || isLoading) return;
    setInputText("");

    const userMsg: SidekickMessage = {
      id: "u-" + Date.now(),
      role: "user",
      content: audioBase64 ? "🎙️ Voice Question" : userText,
      isVoice: Boolean(audioBase64)
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const lessonContext = lesson
      ? `Active lesson: "${lesson.title.en} - ${lesson.story?.en || ""}".`
      : "";

    const qText = currentQuizQuestion
      ? (typeof currentQuizQuestion.q === "string" ? currentQuizQuestion.q : currentQuizQuestion.q?.en || "")
      : "";
    const qOpts = currentQuizQuestion
      ? (Array.isArray(currentQuizQuestion.opts) ? currentQuizQuestion.opts.join(", ") : currentQuizQuestion.opts?.en?.join(", ") || "")
      : "";
    const quizContext = currentQuizQuestion
      ? `The child is currently answering this quiz question: "${qText}". Options: ${qOpts}.`
      : "";

    const systemPrompt = [
      `You are ${compName}, a loving, highly encouraging Nigerian AI learning tutor in CLATS.`,
      `The child is studying technology inside an active lesson.`,
      lessonContext,
      quizContext,
      `Provide a warm, concise (2-3 short sentences), culturally relatable explanation in ${activeLang}.`,
      `If giving a quiz hint, use Socratic guidance without directly spoiling the answer.`,
      `Use simple Nigerian analogies (like comparing algorithms to cooking jollof rice or games of Ayo).`
    ].filter(Boolean).join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText || undefined,
          audioBase64: audioBase64 || undefined,
          language: activeLang,
          systemPrompt,
          history: messages.slice(-4)
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantText = data.text || "I am right here with you!";
        
        setMessages((prev) => [
          ...prev,
          {
            id: "a-" + Date.now(),
            role: "assistant",
            content: assistantText
          }
        ]);

        // Auto-speak response in sovereign Nigerian voice
        playYarnVoice(assistantText, activeLang);
      }
    } catch (e) {
      console.error("Sidekick chat error:", e);
      const fallback = activeLang === "yo"
        ? "Ẹ ku iṣẹ́! Èmi ni Kobe lórí N-ATLAS. Mo gbọ́ ibeere rẹ dáadáa, jẹ́ kí a tẹ̀síwájú nínú ẹ̀kọ́ wa!"
        : activeLang === "ha"
        ? "Sannu! Ni ne Kobe a kan N-ATLAS. Na ji tambayarka, bari mu ci gaba da karatunmu!"
        : activeLang === "ig"
        ? "Ndewo! Abụ m Kobe na N-ATLAS. Anụrụ m ajụjụ gị, ka anyị gaa n'ihu n'ọmụmụ ihe anyị!"
        : "Hello superstar! I am Kobe, your N-ATLAS learning companion. Let's keep exploring technology and coding!";

      setMessages((prev) => [
        ...prev,
        {
          id: "a-" + Date.now(),
          role: "assistant",
          content: fallback
        }
      ]);
      playYarnVoice(fallback, activeLang);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      sfx.playTap();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Sidekick mic error:", err);
    }
  };

  const stopRecording = (cancel = false) => {
    if (!mediaRecorderRef.current || !isRecording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const recorder = mediaRecorderRef.current;
    setIsRecording(false);
    setRecordingSeconds(0);

    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((t) => t.stop());
      if (cancel || audioChunksRef.current.length === 0) return;

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Data = (reader.result as string)?.split(",")[1];
        if (base64Data) {
          sendMessage("", base64Data);
        }
      };
    };

    recorder.stop();
  };

  // Theme tokens
  const bgCard = isDark ? "#1e293b" : "#ffffff";
  const bgPage = isDark ? "#0f172a" : "#f8fafc";
  const textCol = isDark ? "#f8fafc" : "#0f172a";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const borderColTone = isDark ? "#334155" : "#e2e8f0";

  return (
    <>
      {/* 1. FLOATING COMPANION BUTTON (Fixed bottom-right corner) */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          aria-label={`Ask ${compName}`}
          style={{
            position: "fixed",
            bottom: 84,
            right: 20,
            zIndex: 95,
            background: isDark ? "#1e293b" : "#ffffff",
            border: `2.5px solid ${borderCol}`,
            borderRadius: 30,
            padding: "8px 16px 8px 10px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: isDark
              ? "0 8px 24px rgba(0,0,0,0.45), 0 0 16px rgba(46,196,182,0.3)"
              : "0 8px 24px rgba(46,196,182,0.25), 0 2px 8px rgba(0,0,0,0.08)",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}
          className="hover:scale-105 active:scale-95"
        >
          <div style={{ position: "relative" }}>
            <KobeAvatar size={38} character={child.companion || "kobe"} ageGroup={child.ageGroup} />
            <span
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#10b981",
                border: "2px solid #ffffff",
                boxShadow: "0 0 6px #10b981"
              }}
            />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: borderCol, display: "flex", alignItems: "center", gap: 4 }}>
              <span>Ask {compName}</span>
              <Sparkles size={12} color="#10b981" />
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: textMuted }}>
              Voice & Chat Sidekick
            </div>
          </div>
        </button>
      )}

      {/* 2. IN-LESSON SIDEKICK DRAWER / MODAL */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end"
          }}
          onClick={handleClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              maxHeight: "85vh",
              background: bgCard,
              borderRadius: "28px 28px 0 0",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              border: `2px solid ${borderColTone}`,
              borderBottom: "none",
              overflow: "hidden",
              animation: "slideUp 0.25s ease-out"
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                background: isDark
                  ? `linear-gradient(135deg, ${borderCol}33, #1e293b)`
                  : `linear-gradient(135deg, ${borderCol}18, #ffffff)`,
                borderBottom: `1.5px solid ${borderColTone}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <KobeAvatar size={42} character={child.companion || "kobe"} ageGroup={child.ageGroup} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: textCol, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{compName} Lesson Sidekick</span>
                    {isPlayingAudio && (
                      <span style={{ fontSize: 11, color: "#10b981", fontWeight: 800 }}>🔊 Speaking...</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: textMuted, fontWeight: 700 }}>
                    {lesson ? `"${lesson.title[activeLang] || lesson.title.en}"` : "Active Learning Helper"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={handleClose}
                  style={{
                    background: isDark ? "#334155" : "#e2e8f0",
                    border: "none",
                    borderRadius: 20,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    color: textCol,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <Play size={12} fill="currentColor" /> Resume
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    background: "none",
                    border: "none",
                    color: textMuted,
                    cursor: "pointer",
                    padding: 4
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Language Bar */}
            <div
              style={{
                padding: "8px 16px",
                background: bgPage,
                borderBottom: `1px solid ${borderColTone}`,
                display: "flex",
                alignItems: "center",
                gap: 6,
                overflowX: "auto"
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: textMuted, flexShrink: 0 }}>🌍 Language:</span>
              {[
                { code: "en", label: "English" },
                { code: "yo", label: "Yorùbá" },
                { code: "ha", label: "Hausa" },
                { code: "ig", label: "Igbo" }
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    sfx.playTap();
                    setActiveLang(l.code as Language);
                  }}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 14,
                    border: activeLang === l.code ? `1.5px solid ${borderCol}` : `1px solid ${borderColTone}`,
                    background: activeLang === l.code ? borderCol + "22" : "transparent",
                    color: activeLang === l.code ? borderCol : textMuted,
                    fontSize: 11,
                    fontWeight: activeLang === l.code ? 800 : 600,
                    cursor: "pointer"
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Quick Context Prompt Chips */}
            <div
              style={{
                padding: "10px 16px 6px",
                display: "flex",
                gap: 6,
                overflowX: "auto",
                whiteSpace: "nowrap"
              }}
            >
              {[
                {
                  label: activeLang === "yo" ? "🗣️ Ṣalaye ni Yorùbá" : activeLang === "ha" ? "🗣️ Yi bayani a Hausa" : activeLang === "ig" ? "🗣️ Kọwaa n'Igbo" : "🗣️ Explain Simply",
                  prompt: `Can you explain the main idea of "${lesson?.title?.en || "this lesson"}" in simple ${activeLang} terms?`
                },
                {
                  label: "🍲 Nigerian Food Analogy",
                  prompt: `Explain this concept using a fun Nigerian analogy (like cooking jollof rice or puff-puff)!`
                },
                {
                  label: "❓ Why does this matter?",
                  prompt: `Why is learning "${lesson?.title?.en || "this topic"}" important for children?`
                }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sfx.playTap();
                    sendMessage(chip.prompt);
                  }}
                  disabled={isLoading}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 16,
                    border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                    background: isDark ? "#0f172a" : "#f1f5f9",
                    color: textCol,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                  className="hover:scale-105 active:scale-95"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat Messages Viewport */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minHeight: 180,
                maxHeight: 280
              }}
            >
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isUser ? "flex-end" : "flex-start"
                    }}
                  >
                    <div
                      style={{
                        background: isUser ? borderCol : isDark ? "#0f172a" : "#f8fafc",
                        color: isUser ? "#ffffff" : textCol,
                        border: isUser ? "none" : `1.5px solid ${borderColTone}`,
                        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        padding: "10px 14px",
                        fontSize: 13,
                        lineHeight: 1.45,
                        fontWeight: 600
                      }}
                    >
                      {m.content}
                    </div>

                    {!isUser && (
                      <button
                        onClick={() => playYarnVoice(m.content, activeLang)}
                        style={{
                          marginTop: 4,
                          background: "none",
                          border: "none",
                          color: borderCol,
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <Volume2 size={12} /> Replay Voice
                      </button>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div style={{ alignSelf: "flex-start", padding: "8px 14px", color: textMuted, fontSize: 12, fontWeight: 700 }}>
                  ✨ {compName} is thinking with N-ATLAS...
                </div>
              )}
            </div>

            {/* Input Bar & Voice Recorder */}
            <div
              style={{
                padding: "12px 16px 18px",
                background: bgPage,
                borderTop: `1.5px solid ${borderColTone}`,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              {isRecording ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#fef2f2",
                    border: "1.5px solid #ef4444",
                    borderRadius: 16,
                    padding: "8px 14px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#b91c1c", fontWeight: 800, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
                    Listening... {recordingSeconds}s
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => stopRecording(true)}
                      style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => stopRecording(false)}
                      style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                    >
                      Send Voice ▶
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={startRecording}
                    disabled={isLoading}
                    title="Tap to speak"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      background: isDark ? "#0f172a" : "#ffffff",
                      border: `1.5px solid ${borderCol}`,
                      color: borderCol,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0
                    }}
                  >
                    <Mic size={18} />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(inputText)}
                    placeholder={`Ask ${compName} about this lesson...`}
                    style={{
                      flex: 1,
                      background: isDark ? "#0f172a" : "#ffffff",
                      border: `1.5px solid ${borderColTone}`,
                      borderRadius: 14,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: textCol,
                      outline: "none"
                    }}
                  />

                  <button
                    onClick={() => sendMessage(inputText)}
                    disabled={isLoading || !inputText.trim()}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      background: borderCol,
                      color: "#ffffff",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isLoading || !inputText.trim() ? "not-allowed" : "pointer",
                      flexShrink: 0
                    }}
                  >
                    <Send size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KobeLessonSidekick;
