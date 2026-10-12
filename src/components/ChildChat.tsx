/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Square, Sparkles, Globe, Play, Pause } from "lucide-react";
import { Child, Lesson, Language } from "../types";
import { C, F, T, AGE_META, XP_PER_LESSON, XP_PER_CORRECT } from "../utils/config";
import { Card, Txt, Heading, Label, Chip, Btn } from "./Primitives";
import { KobeAvatar } from "./KobeAvatar";
import { sfx } from "../utils/audio";

interface ChildChatProps {
  child: Child;
  lesson: Lesson | null;
  onLessonComplete: (lessonId: string, starsEarned: number, xpEarned: number) => void;
  lang: Language;
  onClose: () => void;
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
  onClose
}) => {
  const meta = AGE_META[child.ageGroup] || { color: C.teal, soft: C.tealGhost, kobeStyle: "" };
  const borderCol = meta.color;
  const compName = child.companion === "chibi" ? "Chibi" : "Kobe";

  const [activeTab, setActiveTab] = useState<"lesson" | "chat">("lesson");
  const [typedMessage, setTypedMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Multilingual & Voice State (N-ATLAS Sovereign Integration)
  const [chatLang, setChatLang] = useState<Language>(lang);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Quiz state
  const [chosenAnswer, setChosenAnswer] = useState<string | null>(null);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up media streams, active audio, and speech on unmount
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
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const fallbackBrowserSpeech = (text: string, targetLang: Language) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeakingMsgId(null);
      return;
    }
    const cleanText = text.replace(/[*#_`~>\[\]]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langLocales: Record<Language, string> = {
      en: "en-NG",
      yo: "yo-NG",
      ha: "ha-NG",
      ig: "ig-NG"
    };
    utterance.lang = langLocales[targetLang] || "en-US";
    utterance.pitch = 1.1; // Friendly child companion pitch
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Multi-Tier Studio Text to Speech playback (YarnGPT / ElevenLabs / Azure / Browser)
  const speakMessage = async (msgId: string, text: string, targetLang: Language) => {
    // If already speaking this message, toggle off
    if (speakingMsgId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMsgId(null);
      return;
    }

    // Stop any existing playback
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setSpeakingMsgId(msgId);

    try {
      // 1. Try server-side sovereign TTS (YarnGPT / ElevenLabs / Azure)
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

        if (audioSrc && !data.fallbackToBrowser) {
          const audio = new Audio(audioSrc);
          activeAudioRef.current = audio;

          audio.onended = () => {
            setSpeakingMsgId(null);
            activeAudioRef.current = null;
          };
          audio.onerror = () => {
            fallbackBrowserSpeech(text, targetLang);
          };

          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn("Cloud TTS failed, using browser speech engine:", e);
    }

    // 2. High-tuned Browser Speech Synthesis Fallback
    fallbackBrowserSpeech(text, targetLang);
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
    
    // Reset Quiz
    setChosenAnswer(null);
    setRevealAnswer(false);
    setAttempts(0);
    setQuizDone(false);
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

  const handleAnswerSelect = (optVal: string) => {
    if (quizDone) return;
    setChosenAnswer(optVal);
    setRevealAnswer(true);
    setAttempts((prev) => prev + 1);

    const quiz = lesson?.quiz && lesson.quiz.length > 0 ? lesson.quiz[0] : null;
    if (quiz) {
      const optionsArray = quiz.opts[lang] || quiz.opts.en || [];
      const correctText = optionsArray[quiz.ans];
      if (optVal === correctText) {
        sfx.playCoin();
        setQuizDone(true);
        // stars calculation: 3 if 1st try, 2 if 2nd, 1 rest
        const earnedStars = Math.max(1, 3 - attempts);
        const earnedXP = XP_PER_LESSON + (attempts === 0 ? XP_PER_CORRECT : 0);
        onLessonComplete(lesson.id, earnedStars, earnedXP);
      } else {
        sfx.playBuzzer();
      }
    }
  };

  const AGE_LABEL_STR = (ag: string) => (ag === "early explorers" ? "Early Explorers" : ag === "young innovators" ? "Young Innovators" : "Future Builders");
  const AGE_AGES_STR = (ag: string) => (ag === "early explorers" ? "6-10" : ag === "young innovators" ? "11-13" : "14-18");

  const quiz = lesson?.quiz && lesson.quiz.length > 0 ? lesson.quiz[0] : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.snow,
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Header Panel */}
      <div
        style={{
          background: `linear-gradient(135deg, ${borderCol}, ${borderCol}CC)`,
          padding: "18px 18px 24px",
          borderRadius: "0 0 22px 22px",
          position: "relative"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              color: C.white,
              fontFamily: F.body,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            ← Close
          </button>
          <Chip color={C.white} bg="rgba(255,255,255,0.15)">
            Lesson View
          </Chip>
        </div>

        {lesson && (
          <div style={{ marginTop: 14 }}>
            <Txt size={11} color="rgba(255,255,255,0.7)" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              Active Module Lesson · {lesson.code}
            </Txt>
            <Heading size={18} color={C.white} style={{ marginTop: 2 }}>
              {lesson.title[lang] || lesson.title.en}
            </Heading>
          </div>
        )}
      </div>

      {/* Tabs list (Study Lesson vs Chat Kobe) */}
      <div style={{ display: "flex", borderBottom: "1.5px solid " + C.mist, background: C.white }}>
        <button
          onClick={() => setActiveTab("lesson")}
          style={{
            flex: 1,
            padding: "14px 0",
            border: "none",
            borderBottom: "3px solid " + (activeTab === "lesson" ? borderCol : "transparent"),
            color: activeTab === "lesson" ? borderCol : C.stone,
            fontFamily: F.body,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: "pointer",
            background: "transparent",
            transition: "all 0.15s"
          }}
        >
          📖 Core Lesson & Quiz
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          style={{
            flex: 1,
            padding: "14px 0",
            border: "none",
            borderBottom: "3px solid " + (activeTab === "chat" ? borderCol : "transparent"),
            color: activeTab === "chat" ? borderCol : C.stone,
            fontFamily: F.body,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: "pointer",
            background: "transparent",
            transition: "all 0.15s"
          }}
        >
          🤖 Chat with Kobe
        </button>
      </div>

      {/* Content Stream */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 120px" }}>
        {activeTab === "lesson" && lesson && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <Label style={{ marginBottom: 6 }}>Lesson Overview</Label>
              <Txt size={14} color={C.charcoal} style={{ lineHeight: 1.7, display: "block" }}>
                {lesson.story ? (lesson.story[lang] || lesson.story.en) : ""}
              </Txt>
            </Card>

            {quiz && (() => {
              const optionsArray = quiz.opts[lang] || quiz.opts.en || [];
              const correctText = optionsArray[quiz.ans];
              return (
                <Card style={{ border: "1px solid " + C.mist }}>
                  <Label color={borderCol} style={{ marginBottom: 8 }}>
                    Lesson Quiz Challenge
                  </Label>
                  <Txt size={14} weight={700} style={{ display: "block", marginBottom: 14 }}>
                    {quiz.q[lang] || quiz.q.en}
                  </Txt>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {optionsArray.map((optText, optIdx) => {
                      const isSelected = chosenAnswer === optText;
                      const isCorrect = optIdx === quiz.ans;
                      
                      let bg = C.snow;
                      let border = "1px solid " + C.mist;
                      let fontW = 500;

                      if (revealAnswer && isSelected) {
                        if (isCorrect) {
                          bg = C.green + "0D";
                          border = "2px solid " + C.green;
                        } else {
                          bg = C.red + "0D";
                          border = "2px solid " + C.red;
                        }
                        fontW = 700;
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleAnswerSelect(optText)}
                          disabled={quizDone}
                          style={{
                            background: bg,
                            border: border,
                            borderRadius: 11,
                            padding: "12px 14px",
                            textAlign: "left",
                            cursor: quizDone ? "default" : "pointer",
                            transition: "all 0.15s",
                            width: "100%"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                background: isSelected ? borderCol : C.mist,
                                color: isSelected ? C.white : C.slate,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700
                              }}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            <Txt size={13.5} weight={fontW} color={C.slate} style={{ flex: 1 }}>
                              {optText}
                            </Txt>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {revealAnswer && (
                    <div
                      style={{
                        marginTop: 18,
                        padding: "12px 14px",
                        background: chosenAnswer === correctText ? C.green + "0D" : C.red + "0D",
                        borderRadius: 10,
                        border: "1px solid " + (chosenAnswer === correctText ? C.green : C.red) + "25"
                      }}
                    >
                      <Txt size={13} weight={700} color={chosenAnswer === correctText ? C.green : C.red}>
                        {chosenAnswer === correctText ? T[lang].correct : T[lang].incorrect}
                      </Txt>
                      <br />
                      <Txt size={12} color={C.slate} style={{ display: "block", marginTop: 4, lineHeight: 1.6 }}>
                        {chosenAnswer === correctText
                          ? `Wonderful! You correctly solved this logic! You earned high rating points. Tap the tab above to chat with me if you want to explore more.`
                          : `💡 Hint: Re-read the lesson storyboard above to find the correct answer!`}
                      </Txt>
                    </div>
                  )}
                </Card>
              );
            })()}
          </div>
        )}

        {activeTab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* 1. N-ATLAS Multilingual Sovereign Selector Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
                background: C.white,
                padding: "8px 12px",
                borderRadius: 14,
                border: "1px solid " + C.mist,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.slate }}>🌍 Language:</span>
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
                        padding: "4px 10px",
                        borderRadius: 20,
                        border: isActive ? `2px solid ${borderCol}` : "1px solid " + C.mist,
                        background: isActive ? borderCol + "15" : C.snow,
                        color: isActive ? borderCol : C.slate,
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
                <Sparkles size={12} color="#10B981" />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#10B981", letterSpacing: 0.4, textTransform: "uppercase" }}>
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
                        background: isKobe ? C.white : borderCol,
                        color: isKobe ? C.charcoal : C.white,
                        border: isKobe ? "1px solid " + C.mist : "none",
                        borderRadius: isKobe ? "0 14px 14px 14px" : "14px 14px 0 14px",
                        padding: "10px 14px",
                        maxWidth: "80%",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                      }}
                    >
                      {isKobe && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 12 }}>
                          <Label color={borderCol} style={{ fontSize: 10.5, fontWeight: 800 }}>
                            {compName} • {m.provider || "N-ATLAS"}
                          </Label>
                          <button
                            onClick={() => speakMessage(m.id, m.content, m.lang || chatLang)}
                            style={{
                              background: isSpeakingThis ? borderCol : borderCol + "15",
                              color: isSpeakingThis ? C.white : borderCol,
                              border: "none",
                              borderRadius: 14,
                              padding: "3px 8px",
                              fontSize: 10.5,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                            title="Listen to response"
                          >
                            <Volume2 size={12} />
                            {isSpeakingThis ? "Playing..." : "Listen"}
                          </button>
                        </div>
                      )}

                      {/* If user sent voice note */}
                      {m.isVoice && m.audioUrl && (
                        <div style={{ marginBottom: 6 }}>
                          <audio 
                            src={m.audioUrl} 
                            controls 
                            style={{ height: 32, width: 220, filter: "contrast(85%)" }} 
                          />
                        </div>
                      )}

                      <Txt size={13} style={{ lineHeight: 1.6, display: "block" }}>
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
                      background: C.white,
                      border: "1px solid " + C.mist,
                      borderRadius: "0 14px 14px 14px",
                      padding: "8px 12px"
                    }}
                  >
                    <Txt size={12} color={C.stone}>
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
                background: C.white,
                padding: "12px 14px 22px",
                borderTop: "1.5px solid " + C.mist,
                display: "flex",
                gap: 8,
                alignItems: "center",
                zIndex: 10
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
                    background: "#FEE2E2",
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
                    <Txt size={13} weight={800} color="#B91C1C">
                      Recording ({recordingSeconds}s)... Speak now in {chatLang.toUpperCase()}
                    </Txt>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => stopRecording(true)}
                      style={{
                        background: "rgba(0,0,0,0.06)",
                        border: "none",
                        borderRadius: 10,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#7F1D1D",
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
                        color: C.white,
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
                      background: "#10B98115",
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
                      background: C.snow,
                      border: "1px solid " + C.mist,
                      borderRadius: 12,
                      padding: "10px 14px",
                      fontSize: 13.5,
                      outline: "none",
                      fontFamily: F.body
                    }}
                  />

                  <Btn variant="yellow" size="sm" onClick={() => send()} disabled={isTyping || !typedMessage.trim()}>
                    Ask
                  </Btn>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {activeTab === "lesson" && quizDone && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(6px)",
            padding: "14px 16px 22px",
            borderTop: "1px solid " + C.mist,
            display: "flex",
            justifyContent: "center",
            zIndex: 10
          }}
        >
          <Btn variant="yellow" size="lg" style={{ minWidth: 200 }} onClick={() => {
            sfx.playLevelUp();
            onClose();
          }}>
            Finish & Continue
          </Btn>
        </div>
      )}
    </div>
  );
};
export default ChildChat;
