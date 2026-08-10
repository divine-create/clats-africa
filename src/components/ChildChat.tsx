/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
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

  // Quiz state
  const [chosenAnswer, setChosenAnswer] = useState<string | null>(null);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  // Restart chat on tab or lesson updates
  useEffect(() => {
    const freshIntro = lesson
      ? `Hello! I am ${compName}, your tech assistant. Ask me anything about our lesson today: "${
          lesson.title[lang] || lesson.title.en
        }"!`
      : `Hello! I am ${compName}. You can ask me any question about Artificial Intelligence, Coding, Cyber Safety, or Design!`;

    setMessages([{ id: "intro", role: "assistant", content: freshIntro }]);
    
    // Reset Quiz
    setChosenAnswer(null);
    setRevealAnswer(false);
    setAttempts(0);
    setQuizDone(false);
  }, [lesson, lang]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const send = async () => {
    if (!typedMessage.trim() || isTyping) return;
    const text = typedMessage.trim();
    setTypedMessage("");

    const uMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text };
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
      `Keep your chat responses informative but highly concise (max 2-3 short paragraphs).`,
      `The child's language code is "${lang}". If requested, explain translations.`,
      contextPrompt
    ].join("\n");

    try {
      const apiResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          systemPrompt: sysPrompt,
          history: messages.slice(-10) // Limit depth
        })
      });

      if (!apiResponse.ok) {
        throw new Error("Local endpoint failure");
      }

      const raw = await apiResponse.json();
      setMessages((prev) => [
        ...prev,
        { id: "kobe-" + Date.now().toString(), role: "assistant", content: raw.text }
      ]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-kobe",
          role: "assistant",
          content: "Oh! My neural connection flickered. Try asking me again, or make sure your internet is connected!"
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
  const AGE_AGES_STR = (ag: string) => (ag === "early explorers" ? "2-5" : ag === "young innovators" ? "6-12" : "13-18");

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
            <div
              ref={listRef}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxHeight: 400,
                overflowY: "auto",
                paddingRight: 4
              }}
            >
              {messages.map((m) => {
                const isKobe = m.role === "assistant";
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
                        maxWidth: "75%",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                      }}
                    >
                      {isKobe && (
                        <Label color={borderCol} style={{ marginBottom: 2 }}>
                          {compName} Assistant
                        </Label>
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
                      {compName} is thinking...
                    </Txt>
                  </div>
                </div>
              )}
            </div>

            {/* Input keyboard bar footer */}
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
                zIndex: 10
              }}
            >
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={T[lang].askKobe + "..."}
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
              <Btn variant="yellow" size="sm" onClick={send} disabled={isTyping || !typedMessage.trim()}>
                Ask
              </Btn>
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
