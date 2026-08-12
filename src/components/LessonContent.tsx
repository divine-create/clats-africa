/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Child, Lesson, Language, QuizQuestion } from "../types";
import { C, F, AGE_META } from "../utils/config";
import { Heading, Txt, Chip } from "./Primitives";
import { KobeAvatar } from "./KobeAvatar";
import { sfx, companionVoice } from "../utils/audio";
// Using native iframe instead of react-player for better compatibility

interface LessonContentProps {
  child: Child;
  lesson: Lesson | null;
  onLessonComplete: (
    lessonId: string,
    starsEarned: number,
    xpEarned: number,
    quizResult?: {
      score: number;
      correctCount: number;
      totalQuestions: number;
      status: "Passed" | "Needs Review";
    }
  ) => void;
  lang: Language;
  onClose: () => void;
  onNextLesson?: () => void;
}

export const LessonContent: React.FC<LessonContentProps> = ({
  child,
  lesson,
  onLessonComplete,
  lang,
  onClose,
  onNextLesson
}) => {
  const isAges6To12 = child.ageGroup === "young innovators";
  const isEarlyExplorers = child.ageGroup === "early explorers";
  const isFutureBuilders = child.ageGroup === "future builders";
  const companion = child.companion || "kobe";
  const compLabel = companion === "chibi" ? "Chibi" : "Kobe";

  // Check which lesson number/type we are running

  
  // ALL MVP lessons of designated pathways are active and playable!
  const isPlayable = true;

  // Active steps in the lesson progression
  const [learningStep, setLearningStep] = useState<"video" | "quiz" | "reward">("video");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [watchedFraction, setWatchedFraction] = useState(0);

  // Story Slideshow state for Ages 2-5 or lessons with story elements
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Inclusive Accessibility States
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [voiceAssistActive, setVoiceAssistActive] = useState(isEarlyExplorers); // Auto-on for early explorers
  const [micActive, setMicActive] = useState(false);
  const [colorMode, setColorMode] = useState<"normal" | "accessible" | "night">("normal");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "extra">("normal");
  const [dyslexicMode, setDyslexicMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Mini-Activity states
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [toolFeedback, setToolFeedback] = useState<string>("");
  const [trainedDatabase, setTrainedDatabase] = useState<string[]>([]);
  const [trainFeedback, setTrainFeedback] = useState<string>("");

  // Quiz States
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string>("");
  const [quizIsAnswered, setQuizIsAnswered] = useState(false);
  const [correctAnswersList, setCorrectAnswersList] = useState<boolean[]>([]);

  // Real Web Speech API TTS speaker
  const speakText = (text: string) => {
    companionVoice.speak(text, child.companion || "kobe", child.ageGroup);
  };

  // Turn off speech on closing or step change
  useEffect(() => {
    return () => {
      companionVoice.stop();
    };
  }, [learningStep, currentSlideIndex, currentQuizIndex]);

  // Accessibility Style Resolvers
  const getFontSizeMultiplier = () => {
    if (fontSize === "large") return 1.25;
    if (fontSize === "extra") return 1.5;
    return 1.0;
  };

  const getFontFamily = () => {
    if (dyslexicMode) return '"Comic Sans MS", "OpenDyslexic", "Chalkboard SE", sans-serif';
    return F.body;
  };

  const getAccessibleBackground = () => {
    if (colorMode === "night") return "#0f172a"; // Night deep shade
    if (colorMode === "accessible") return "#ffffff"; // Static solid white
    return "#F0FDFA"; // Minty turquoise pastel wash for child workspace
  };

  const getTextColor = () => {
    if (colorMode === "night") return "#f8fafc";
    return "#111111";
  };

  const getCardBackground = () => {
    if (colorMode === "night") return "#1e293b";
    return "#ffffff";
  };

  const getBorderColor = () => {
    if (colorMode === "night") return "#334155";
    if (colorMode === "accessible") return "#111111";
    return "#e2e8f0";
  };

  // Dynamic video resolver based on kids-safe educational videos for maximum coverage and variety
  const getDynamicVideoData = (): { embedId: string; title: string; duration: string } | null => {
    if (!lesson) return null;
    const lid = lesson.id;
    const titleEn = lesson.title.en;
    const titleLower = titleEn.toLowerCase();

    // 1. Use Database Video URL if provided
    if (lesson.video_url) {
      // Extract YouTube ID from full link or assume it's already an ID
      let embedId = lesson.video_url;
      const watchMatch = lesson.video_url.match(/[?&]v=([^&]+)/);
      const shortMatch = lesson.video_url.match(/youtu\.be\/([^?]+)/);
      const embedMatch = lesson.video_url.match(/youtube\.com\/embed\/([^?]+)/);
      
      if (watchMatch && watchMatch[1]) {
        embedId = watchMatch[1];
      } else if (shortMatch && shortMatch[1]) {
        embedId = shortMatch[1];
      } else if (embedMatch && embedMatch[1]) {
        embedId = embedMatch[1];
      }

      return {
        embedId,
        title: titleEn,
        duration: lesson.duration || "5 min"
      };
    }

    // 2. Fallback to smart keyword matching
    if (lid.endsWith("-l1") || titleLower.includes("what is technology")) {
      return {
        embedId: "Fno0L_XsdWM",
        title: "What is Technology? | Kid-friendly Guide",
        duration: "3 min"
      };
    }
    if (lid.endsWith("-l2") || titleLower.includes("what is ai") || titleLower.includes("history of ai") || titleLower.includes("meet kobe")) {
      return {
        embedId: "mJeNghnyt9Y",
        title: "What is Artificial Intelligence (AI) for Kids?",
        duration: "4 min"
      };
    }
    if (titleLower.includes("security") || titleLower.includes("cyber") || titleLower.includes("safe") || titleLower.includes("password")) {
      return {
        embedId: "z-Et8VdfpD0",
        title: "Cybersecurity Tips: Staying Safe Online",
        duration: "5 min"
      };
    }
    if (titleLower.includes("code") || titleLower.includes("program") || titleLower.includes("comput") || titleLower.includes("system")) {
      return {
        embedId: "7T8qPFrWbLw",
        title: "Coding and Programming Concepts Explained",
        duration: "4 min"
      };
    }
    if (titleLower.includes("blockchain") || titleLower.includes("crypto") || titleLower.includes("ledger") || titleLower.includes("web3")) {
      return {
        embedId: "pAOfkdf-nQY",
        title: "What is Blockchain & Web3? Easy Explanation",
        duration: "5 min"
      };
    }
    if (titleLower.includes("design") || titleLower.includes("creative") || titleLower.includes("draw") || titleLower.includes("art") || titleLower.includes("sound")) {
      return {
        embedId: "Y0nO_qA_7y0",
        title: "Designing Smart Solutions and Computational Thinking",
        duration: "4 min"
      };
    }
    
    // Fallback rotation pool
    const educationalVideos = [
      { embedId: "Fno0L_XsdWM", title: `${titleEn} (Introduction)`, duration: "3 min" },
      { embedId: "mJeNghnyt9Y", title: `${titleEn} (How It Works)`, duration: "4 min" },
      { embedId: "z-Et8VdfpD0", title: `${titleEn} (Best Practices)`, duration: "5 min" },
      { embedId: "7T8qPFrWbLw", title: `${titleEn} (Action Workshop)`, duration: "4 min" },
      { embedId: "pAOfkdf-nQY", title: `${titleEn} (Future Impact)`, duration: "5 min" }
    ];
    
    let sum = 0;
    for (let i = 0; i < lid.length; i++) {
      sum += lid.charCodeAt(i);
    }
    const index = sum % educationalVideos.length;
    return educationalVideos[index];
  };

  const currentVideoData = getDynamicVideoData();

  // Resolve curriculum story text by language, with fallback
  const getLessonStoryText = (): string => {
    if (!lesson) return "";
    const storyObj = lesson.story;
    if (storyObj) {
      return storyObj[lang] || storyObj.en || "";
    }
    return "Technology is all around us! From pencils and wheels, to advanced devices like computers and tablets, technology is anything humans design to make life easier and solve daily problems!";
  };

  // Break the lesson story into interactive pages/slides
  const rawStoryText = getLessonStoryText();
  const storySlides = rawStoryText.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);

  // Greet/Narrate slide text on entrance
  useEffect(() => {
    if (learningStep === "video" && voiceAssistActive && storySlides.length > 0) {
      const activeSlideText = storySlides[currentSlideIndex] || "";
      const speakTimer = setTimeout(() => {
        speakText(activeSlideText);
      }, 700);
      return () => clearTimeout(speakTimer);
    }
  }, [learningStep, currentQuizIndex, voiceAssistActive, lesson]);

  // Interactive Mini-Activity items mapped dynamically from syllabus database
  const activePuzzle = lesson?.puzzle || (() => {
    const titleLower = lesson?.title.en.toLowerCase() || "";
    if (titleLower.includes("password") || titleLower.includes("safety") || titleLower.includes("browsing")) {
      return {
        text: {
          en: "Tap only the SAFEST password combinations to help Kobe secure his vault!",
          ig: "Tachị naanị okwuntughe kachasị nchebe iji chebe vault kobe!",
          yo: "Ìfọwọ́bà àwọn ọ̀rọ̀-ìpamọ́ tó dára jù láti tilekùn kobe!"
        },
        items: {
          en: ["Kobe123 (Weak) ❌", "Ch1b1_Star@2026 (Strong) 🌟", "password (Weak) ❌", "994_Secure#Key (Strong) 🌟"],
          correct: [false, true, false, true]
        }
      };
    }
    if (titleLower.includes("design") || titleLower.includes("creat") || titleLower.includes("wireframe")) {
      return {
        text: {
          en: "Spot the layout cards that belong in our UI wireframe sketch!",
          ig: "Chọpụta ihe ndị a na-etinye na wireframe nka!",
          yo: "Mọ àwọn ohun èlò kọmputa tó yẹ kó wà nínú wireframe nka!"
        },
        items: {
          en: ["Purple Button Card 🖱️", "Physical Motor Car Battery ❌", "Profile Avatar Circle 🖼️", "Iron Cooking Stove ❌"],
          correct: [true, false, true, false]
        }
      };
    }
    if (titleLower.includes("career") || titleLower.includes("leader") || titleLower.includes("startup")) {
      return {
        text: {
          en: "Help Kobe choose the right foundations for a tech startup!",
          ig: "Nyere Kobe aka ịhọrọ ntọala maka startup ọhụrụ!",
          yo: "Ran Kobe lọ́wọ́ láti dálẹ̀ startup rẹ̀ dídára!"
        },
        items: {
          en: ["Solving real community problems 💡", "Waiting for money without building ❌", "Creating a simple useful prototype 🧪", "Arguing with study partners ❌"],
          correct: [true, false, true, false]
        }
      };
    }
    // Default fallback
    return {
      text: {
        en: "Spot the technology tools used around us! Try to click all four.",
        ig: "Chọpụta ngwa teknụzụ dị n'akụkụ anyị!",
        yo: "Mọ àwọn ohun èlò ìmọ̀-ẹ̀rọ tí wà lọ́wọ́ wa!"
      },
      items: {
        en: ["Smartphone 📱", "Yellow Pencil ✏️", "Wooden stick ❌", "Electric bicycle 🚲"],
        correct: [true, true, false, true]
      }
    };
  })();

  // Multi-choice dynamic syllabus quiz resolver
  const activeQuiz: { q: string; opts: string[]; ans: number; expl: string }[] = (lesson?.quiz && lesson.quiz.length > 0)
    ? lesson.quiz.map((qObj) => ({
        q: qObj.q[lang] || qObj.q.en || "",
        opts: qObj.opts[lang] || qObj.opts.en || [],
        ans: qObj.ans,
        expl: "Excellent thinking! You understand the key concepts of this digital lesson."
      }))
    : [
        {
          q: "What was the most important thing you learned in this lesson?",
          opts: ["How technology can help us", "How to play games all day", "Nothing useful"],
          ans: 0,
          expl: "Correct! The goal is to understand how these concepts help improve our world."
        }
      ];

  // Micro-activity verification triggering
  const handleVerifyActivity = () => {
    sfx.playCoin();
    setToolFeedback("🌟 Great work! You've successfully completed the activity challenge.");
  };

  const handleSelectPuzzleItem = (index: number) => {
    const isCorrect = activePuzzle.items.correct[index];
    const itemName = activePuzzle.items.en[index];
    if (isCorrect) {
      sfx.playCoin();
      if (!selectedTools.includes(itemName)) {
        setSelectedTools((prev) => [...prev, itemName]);
      }
      setToolFeedback(`🌟 Perfect! "${itemName}" is a correct choice! ${compLabel} is celebrating with some stars.`);
      speakText(`Perfect! ${itemName} is correct!`);
    } else {
      sfx.playBuzzer();
      setToolFeedback(`❌ Keep training your brain! "${itemName}" isn't correct for this puzzle challenge. Let's try another card.`);
      speakText(`Nice try! Think about that again.`);
    }
  };

  // Keyboard Navigation accessibility keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "ArrowRight" && learningStep === "video" && currentSlideIndex < storySlides.length - 1) {
        setCurrentSlideIndex((prev) => prev + 1);
      }
      if (e.key === "ArrowLeft" && learningStep === "video" && currentSlideIndex > 0) {
        setCurrentSlideIndex((prev) => prev - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [learningStep, currentSlideIndex, storySlides.length]);

  // Voice recognition microphone simulator
  const toggleMic = () => {
    sfx.playTap();
    setMicActive(true);
    speakText("Hearing you speak...");
    setTimeout(() => {
      setMicActive(false);
      sfx.playCoin();
      const detectedEn = "Tablet computer!";
      setToolFeedback(`🎙️ Companion heard you say: "${detectedEn}". Great pronunciations! let's proceed to the mini activity.`);
      speakText("Wonderful pronunciation! I heard you say " + detectedEn);
    }, 2200);
  };

  // Select Quiz Option trigger
  const handleSelectQuizOption = (optIndex: number) => {
    if (quizIsAnswered) return;
    sfx.playTap();
    setQuizSelectedOption(optIndex);
    setQuizIsAnswered(true);

    const isCorrect = optIndex === activeQuiz[currentQuizIndex].ans;
    const freshCorrectList = [...correctAnswersList];
    freshCorrectList[currentQuizIndex] = isCorrect;
    setCorrectAnswersList(freshCorrectList);

    if (isCorrect) {
      sfx.playCoin();
      setQuizFeedback(activeQuiz[currentQuizIndex].expl);
      speakText("Wonderful answer! That is correct!");
    } else {
      sfx.playBuzzer();
      setQuizFeedback(`Look closer: The correct answer was option ${String.fromCharCode(65 + activeQuiz[currentQuizIndex].ans)}. Keep your head high, let's learn as we go!`);
      speakText("Nice try! The correct choice is option " + String.fromCharCode(65 + activeQuiz[currentQuizIndex].ans));
    }
  };

  const handleNextQuiz = () => {
    sfx.playTap();
    if (currentQuizIndex < activeQuiz.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
      setQuizSelectedOption(null);
      setQuizFeedback("");
      setQuizIsAnswered(false);
    } else {
      // Complete lesson quest!
      const totalQ = activeQuiz.length;
      const countCorrect = correctAnswersList.filter(Boolean).length;
      const score = Math.round((countCorrect / totalQ) * 100);
      const isPassed = score >= 50;

      onLessonComplete(
        lesson?.id || "lesson-u",
        isPassed ? (score === 100 ? 3 : score >= 80 ? 2 : 1) : 0,
        isPassed ? (score === 100 ? 50 : 35) : 10,
        {
          score,
          correctCount: countCorrect,
          totalQuestions: totalQ,
          status: isPassed ? "Passed" : "Needs Review"
        }
      );
      setLearningStep("reward");
    }
  };

  const activeProgressProgress =
    learningStep === "video" ? 33 : learningStep === "quiz" ? 66 : 100;

  return (
    <div
      id="active-lesson-viewport"
      style={{
        minHeight: "100vh",
        background: getAccessibleBackground(),
        color: getTextColor(),
        paddingBottom: 100,
        fontFamily: getFontFamily(),
        transition: reducedMotion ? "none" : "all 0.3s ease"
      }}
    >
      {/* HEADER CONTROLS BAR */}
      <div
        style={{
          background: colorMode === "night" ? "#1e293b" : "rgba(255, 255, 255, 0.95)",
          borderBottom: `2.5px solid ${getBorderColor()}`,
          padding: "16px 20px",
          position: "sticky",
          top: 0,
          zIndex: 90,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: colorMode === "night" ? "#334155" : "#ffffff",
            border: `2px solid ${getBorderColor()}`,
            borderRadius: 14,
            padding: "8px 16px",
            color: getTextColor(),
            fontSize: 14,
            fontWeight: 850,
            cursor: "pointer",
            fontFamily: F.mono,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
          className="hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>←</span> MAP
        </button>

        <div style={{ textAlign: "center", flex: 1, padding: "0 10px" }}>
          <Txt size={11.5} color={colorMode === "night" ? "#cbd5e1" : "#64748b"} style={{ display: "block", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: F.mono }}>
            {child.ageGroup.toUpperCase()} TRACK
          </Txt>
          <Heading size={21 * getFontSizeMultiplier()} color={colorMode === "night" ? "#ffffff" : "#0d9488"}>
            {lesson?.title[lang] || lesson?.title.en}
          </Heading>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <Txt size={17} weight={950} color="#d97706">
            {child.xp || 0} XP
          </Txt>
        </div>
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "20px 16px" }}>
        
        {/* PROGRESS STEPPER HEADER */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 24,
            background: getCardBackground(),
            border: `2px solid ${getBorderColor()}`,
            borderRadius: 24,
            padding: "10px 12px"
          }}
        >
          {[
            { id: "video", label: isEarlyExplorers ? "Story" : "Lesson", icon: "📖" },
            { id: "quiz", label: "Quiz", icon: "🧩" },
            { id: "reward", label: "Stars", icon: "🏆" }
          ].map((st) => {
            const isCompleted =
              (st.id === "video" && learningStep !== "video") ||
              (st.id === "quiz" && learningStep === "reward");
            const isActive = learningStep === st.id;
            return (
              <div
                key={st.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  opacity: isActive || isCompleted ? 1 : 0.45
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: isCompleted ? "#2EC4B6" : isActive ? "#0d9488" : "rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#ffffff"
                  }}
                >
                  {isCompleted ? "✓" : st.icon}
                </div>
                <span style={{ fontSize: 13, fontFamily: F.mono, marginTop: 4, fontWeight: isActive ? 900 : 500, color: getTextColor() }}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* -------------------------------------------------------------
            STAGE A: LESSON STORY SCREEN / MULTIPLE CONTENT TYPES
           ------------------------------------------------------------- */}
        {learningStep === "video" && (
          <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
            
            {/* LEFT SIDE: Media Player (Video or Story) */}
            <div className="flex flex-col gap-4 w-full lg:w-[68%] flex-shrink-0" style={{ maxWidth: 1200 }}>
            {/* If video player is available */}
            {currentVideoData ? (
              <>
                <div
                style={{
                  background: "#000000",
                  border: `3px solid ${C.teal}`,
                  borderRadius: 24,
                  overflow: "hidden",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                  aspectRatio: "16/9",
                  width: "100%",
                  maxHeight: "75vh",
                  position: "relative"
                }}
              >
                {!isVideoPlaying ? (
                  <div 
                    onClick={() => setIsVideoPlaying(true)}
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      position: "absolute",
                      backgroundImage: `url(https://img.youtube.com/vi/${currentVideoData.embedId}/hqdefault.jpg)`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {/* Dark overlay for better button contrast */}
                    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" }}></div>
                    
                    {/* Beautiful Play Button (Dynamic Theme) */}
                    <div style={{ 
                      width: 70, height: 70, 
                      backgroundColor: child.ageGroup === "early explorers" ? "#f59e0b" : "#8b5cf6", 
                      borderRadius: "50%", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      position: "relative",
                      boxShadow: "0 8px 16px rgba(0,0,0,0.4)",
                      transition: "transform 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <div style={{
                        width: 0, height: 0,
                        borderTop: "12px solid transparent",
                        borderBottom: "12px solid transparent",
                        borderLeft: "20px solid white",
                        marginLeft: 6
                      }}></div>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={`https://www.youtube.com/embed/${currentVideoData.embedId}?autoplay=1&rel=0&modestbranding=1&cc_load_policy=0&iv_load_policy=3`}
                    width="100%"
                    height="100%"
                    style={{ position: "absolute", top: 0, left: 0, border: "none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => {
                      // Automatically unlock the quiz after the video loads so they aren't blocked
                      setTimeout(() => setWatchedFraction(1), 3000);
                    }}
                  />
                )}
              </div>
                <div style={{ background: "#ffffff", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Txt size={16} weight={900} color="#0f172a">{currentVideoData.title}</Txt>
                    <Txt size={13} color="#64748b" style={{ display: "block" }}>⏱️ {currentVideoData.duration} Video Lecture</Txt>
                  </div>
                  <Chip color={C.teal} bg="rgba(46,196,182,0.1)">HD CC</Chip>
                </div>
              </>
            ) : (
              // Story-first Interactive Card Slideshow (Required for Ages 2-5, and as dynamic text renderer)
              <div
                className="playful-card"
                style={{
                  background: getCardBackground(),
                  border: `3px solid ${getBorderColor()}`,
                  borderBottom: `8px solid ${getBorderColor()}`,
                  borderRadius: 32,
                  padding: "30px 24px",
                  textAlign: "center"
                }}
              >
                {/* Visual slide card mascot helper */}
                <div style={{ fontSize: 72, display: "block", marginBottom: 16 }}>
                  {"🧠"}
                </div>

                <div style={{ display: "flex", justifySelf: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
                  <Chip color="#c084fc" bg="rgba(192, 132, 252, 0.1)">
                    SLIDE {currentSlideIndex + 1} OF {storySlides.length || 1}
                  </Chip>
                </div>

                <Txt
                  size={19.5 * getFontSizeMultiplier()}
                  weight={850}
                  color={getTextColor()}
                  style={{ display: "block", lineHeight: 1.6, minHeight: 110, padding: "0 10px" }}
                >
                  "{storySlides[currentSlideIndex] || rawStoryText}"
                </Txt>

                {/* Speech read narration triggers */}
                <div style={{ display: "flex", justifySelf: "center", justifyContent: "center", gap: 12, margin: "20px 0" }}>
                  <button
                    onClick={() => {
                      sfx.playTap();
                      speakText(storySlides[currentSlideIndex] || rawStoryText);
                    }}
                    style={{
                      background: "#e0f2fe",
                      border: "2px solid #0284c7",
                      borderRadius: 16,
                      padding: "10px 18px",
                      cursor: "pointer",
                      fontSize: 14.5,
                      fontWeight: 900,
                      color: "#0369a1",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                    className="hover:scale-105"
                  >
                    <span>🔊 Narration Voice</span>
                  </button>

                  <button
                    onClick={() => {
                      sfx.playTap();
                      setVoiceAssistActive(!voiceAssistActive);
                    }}
                    style={{
                      background: voiceAssistActive ? "#dcfce7" : "#f1f5f9",
                      border: `2px solid ${voiceAssistActive ? "#16a34a" : "#cbd5e1"}`,
                      borderRadius: 16,
                      padding: "10px 18px",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 850,
                      color: voiceAssistActive ? "#15803d" : "#475569"
                    }}
                  >
                    🔊 Read Auto: {voiceAssistActive ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Slideshow paginators */}
                {storySlides.length > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, padding: "0 10px" }}>
                    <button
                      onClick={() => {
                        sfx.playTap();
                        setCurrentSlideIndex((p) => Math.max(0, p - 1));
                      }}
                      disabled={currentSlideIndex === 0}
                      style={{
                        background: currentSlideIndex === 0 ? "#e2e8f0" : "#ffffff",
                        border: "2px solid " + (currentSlideIndex === 0 ? "#cbd5e1" : getBorderColor()),
                        color: currentSlideIndex === 0 ? "#94a3b8" : "#000000",
                        borderRadius: 14,
                        padding: "8px 18px",
                        fontSize: 14,
                        fontWeight: 900,
                        cursor: currentSlideIndex === 0 ? "not-allowed" : "pointer"
                      }}
                    >
                      ← PREVIOUS
                    </button>

                    <button
                      onClick={() => {
                        sfx.playTap();
                        setCurrentSlideIndex((p) => Math.min(storySlides.length - 1, p + 1));
                      }}
                      disabled={currentSlideIndex === storySlides.length - 1}
                      style={{
                        background: currentSlideIndex === storySlides.length - 1 ? "#e2e8f0" : "#2EC4B6",
                        border: "2px solid " + (currentSlideIndex === storySlides.length - 1 ? "#cbd5e1" : "#26a397"),
                        color: currentSlideIndex === storySlides.length - 1 ? "#94a3b8" : "#ffffff",
                        borderRadius: 14,
                        padding: "8px 18px",
                        fontSize: 14,
                        fontWeight: 900,
                        cursor: currentSlideIndex === storySlides.length - 1 ? "not-allowed" : "pointer"
                      }}
                    >
                      NEXT SLIDE →
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>

            {/* RIGHT SIDE: Sidebar Context & Actions */}
            <div className="flex flex-col gap-4 w-full lg:w-[32%] sticky" style={{ top: "24px" }}>
            {/* KOBE AND CHIBI COMPANION ROW EXPLANATION */}
            <div
              style={{
                background: getCardBackground(),
                border: `2px solid ${getBorderColor()}`,
                borderBottom: `6px solid ${getBorderColor()}`,
                borderRadius: 24,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <KobeAvatar character={companion} ageGroup={child.ageGroup} size={64} expression="happy" />
              </div>
              <div style={{ textAlign: "left" }}>
                <Txt size={11.5} weight={950} color="#0d9488" style={{ textTransform: "uppercase", display: "block", fontFamily: F.mono, marginBottom: 4 }}>
                  💬 {compLabel} Explanation:
                </Txt>
                <Txt size={14.5 * getFontSizeMultiplier()} color={getTextColor()} style={{ fontStyle: "italic", lineHeight: 1.45, fontWeight: 700 }}>
                  "{child.name}, technology helps us solve problems! Let's explore how we use tools and data to build smart things."
                </Txt>
              </div>
            </div>

            {/* ACTION CONTINUE BUTTON */}
            <button
              onClick={() => {
                sfx.playTap();
                setLearningStep("quiz");
              }}
              disabled={watchedFraction < 0.8 && !!currentVideoData}
              style={{
                width: "100%",
                background: watchedFraction < 0.8 && currentVideoData ? "#cbd5e1" : `linear-gradient(135deg, #2EC4B6, #208a80)`,
                color: "#ffffff",
                border: "none",
                borderRadius: 20,
                padding: "16px 24px",
                fontSize: 18,
                fontWeight: 950,
                cursor: watchedFraction < 0.8 && currentVideoData ? "not-allowed" : "pointer",
                boxShadow: watchedFraction < 0.8 && currentVideoData ? "none" : "0 8px 24px rgba(46,196,182,0.2)"
              }}
            >
              {watchedFraction < 0.8 && currentVideoData
                ? `WATCH THE VIDEO FIRST (${Math.floor(watchedFraction * 100)}%) ⏳`
                : "TAKE LESSON QUIZ 🧩"
              }
            </button>
            </div>
          </div>
        )}



        {/* -------------------------------------------------------------
            STAGE C: STUDENT QUIZ QUESTIONS
           ------------------------------------------------------------- */}
        {learningStep === "quiz" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            <div
              style={{
                background: getCardBackground(),
                border: `2px solid ${getBorderColor()}`,
                borderBottom: `6px solid ${getBorderColor()}`,
                borderRadius: 26,
                padding: "26px 20px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <Chip color="#d97706" bg="rgba(217, 119, 6, 0.1)">QUIZ QUEST</Chip>
                <Txt size={14} weight={900} color={getTextColor()} style={{ fontFamily: F.mono }}>
                  QUESTION {currentQuizIndex + 1} OF {activeQuiz.length}
                </Txt>
              </div>

              {/* Progress Steppers */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {activeQuiz.map((_, qIdx) => (
                  <div
                    key={qIdx}
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      background: qIdx < currentQuizIndex
                        ? "#2EC4B6"
                        : qIdx === currentQuizIndex
                        ? "#d97706"
                        : "#e2e8f0"
                    }}
                  />
                ))}
              </div>

              <Heading size={21 * getFontSizeMultiplier()} color={getTextColor()} style={{ lineHeight: 1.4, marginBottom: 24, textAlign: "left" }}>
                {activeQuiz[currentQuizIndex].q}
              </Heading>

              {/* Multiple Choice Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activeQuiz[currentQuizIndex].opts.map((option, oIdx) => {
                  const isChecked = quizSelectedOption === oIdx;
                  const isCorrect = oIdx === activeQuiz[currentQuizIndex].ans;

                  let optBg = "#f8fafc";
                  let optBorder = "#cbd5e1";

                  if (quizIsAnswered) {
                    if (isCorrect) {
                      optBg = "#ecfdf5";
                      optBorder = "#10b981";
                    } else if (isChecked) {
                      optBg = "#fef2f2";
                      optBorder = "#ef4444";
                    }
                  } else {
                    if (isChecked) {
                      optBg = "#e0f2fe";
                      optBorder = "#0284c7";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectQuizOption(oIdx)}
                      disabled={quizIsAnswered}
                      style={{
                        background: optBg,
                        border: `2px solid ${optBorder}`,
                        borderRadius: 18,
                        padding: "16px 18px",
                        textAlign: "left",
                        cursor: quizIsAnswered ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: isChecked ? (isCorrect ? "#10b981" : "#ef4444") : "#e2e8f0",
                          color: isChecked ? "#ffffff" : "#1e293b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900
                        }}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <Txt size={16 * getFontSizeMultiplier()} weight={800} color="#0f172a">{option}</Txt>
                    </button>
                  );
                })}
              </div>

              {quizIsAnswered && (
                <div
                  style={{
                    marginTop: 20,
                    background: "#ecfdf5",
                    border: "1.5px solid #10b981",
                    borderRadius: 16,
                    padding: "14px 18px",
                    textAlign: "left"
                  }}
                >
                  <Txt size={11.5} weight={950} color="#065f46" style={{ textTransform: "uppercase", display: "block", fontFamily: F.mono, marginBottom: 2 }}>
                    🤖 Grading Feedback:
                  </Txt>
                  <Txt size={14.5 * getFontSizeMultiplier()} color="#065f46" style={{ fontWeight: 700 }}>
                    {quizFeedback}
                  </Txt>
                </div>
              )}
            </div>

            {/* ACTION CONTINUE BUTTON */}
            {quizIsAnswered && (
              <button
                onClick={handleNextQuiz}
                style={{
                  width: "100%",
                  background: `linear-gradient(135deg, #10b981, #059669)`,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 20,
                  padding: "16px 24px",
                  fontSize: 18,
                  fontWeight: 950,
                  cursor: "pointer",
                  boxShadow: "0 8px 14px rgba(16,185,129,0.25)"
                }}
              >
                {currentQuizIndex < activeQuiz.length - 1 ? "CONTINUE TO NEXT QUESTION →" : "CLAIM REWARDS & FINISH 🎉"}
              </button>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            STAGE D: COMPLETED QUESTS REWARDS CELEBRATION
           ------------------------------------------------------------- */}
        {learningStep === "reward" && (() => {
          const countCorrect = correctAnswersList.filter(Boolean).length;
          const pctScore = Math.round((countCorrect / activeQuiz.length) * 100);
          
          // Rule: +10 XP for normal lessons, +20 XP for module challenges
          const isModuleChallenge = lesson?.title?.en?.toLowerCase().includes("challenge");
          const xpGained = isModuleChallenge ? 20 : 10;
          
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "center" }}>
              <div
                className="playful-card"
                style={{
                  background: "#f0fdfa",
                  borderColor: "#2EC4B6",
                  borderBottom: `8px solid #208a80`,
                  borderRadius: 32,
                  padding: "40px 24px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <KobeAvatar size={100} character={companion} ageGroup={child.ageGroup} expression={"celebrating"} />
                </div>

                <div style={{ display: "flex", justifySelf: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                  <Chip color={"#c084fc"} bg={"rgba(192, 132, 252, 0.15)"}>
                    {isModuleChallenge ? "🏆 MODULE COMPLETE!" : "🌟 LESSON COMPLETE!"}
                  </Chip>
                </div>

                <Heading size={32} color="#0f172a" style={{ marginBottom: 12 }}>
                  You earned +{xpGained} XP
                </Heading>

                <Txt size={16.5} color="#334155" style={{ display: "block", marginBottom: 24, lineHeight: 1.5, fontWeight: 700 }}>
                  Great job! You checked your knowledge and earned XP. You can now advance to the next step in your learning journey!
                </Txt>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                  <div style={{ background: "#ffffff", border: "2px solid #cbd5e1", borderRadius: 18, padding: "12px" }}>
                    <Txt size={11} color="#64748b" style={{ display: "block", fontFamily: F.mono, textTransform: "uppercase" }}>XP Earned</Txt>
                    <Txt size={22} weight={950} color="#10b981">+{xpGained} XP</Txt>
                  </div>

                  <div style={{ background: "#ffffff", border: "2px solid #cbd5e1", borderRadius: 18, padding: "12px" }}>
                    <Txt size={11} color="#64748b" style={{ display: "block", fontFamily: F.mono, textTransform: "uppercase" }}>Quiz Score</Txt>
                    <Txt size={22} weight={950} color="#0284c7">{pctScore}%</Txt>
                  </div>
                </div>

                {true && (
                  <div
                    style={{
                      background: "#ffffff",
                      border: "2.5px solid #2EC4B6",
                      borderRadius: 22,
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left"
                    }}
                  >
                    <span style={{ fontSize: 44 }}>🏅</span>
                    <div>
                      <Txt size={11.5} weight={900} color="#0d9488" style={{ textTransform: "uppercase", display: "block" }}>
                        OFFICIAL SHIELD SECURED:
                      </Txt>
                      <Txt size={16} weight={950} color="#0f172a">
                        {lesson?.title.en || "Topic Badge"}
                      </Txt>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {onNextLesson && (
                  <button
                    onClick={() => {
                      sfx.playTap();
                      onNextLesson();
                      setLearningStep("video");
                      setCurrentSlideIndex(0);
                      setSelectedTools([]);
                      setToolFeedback("");
                      setCurrentQuizIndex(0);
                      setQuizSelectedOption(null);
                      setQuizFeedback("");
                      setQuizIsAnswered(false);
                    }}
                    style={{
                      width: "100%",
                      background: `linear-gradient(135deg, #FFD166, #e6bb5c)`,
                      color: "#1e293b",
                      border: "none",
                      borderRadius: 20,
                      padding: "16px 24px",
                      fontSize: 18,
                      fontWeight: 950,
                      cursor: "pointer"
                    }}
                  >
                    CONTINUE TO NEXT LESSON →
                  </button>
                )}
                
                <button
                  onClick={() => {
                    sfx.playTap();
                    setLearningStep("quiz");
                    setCurrentQuizIndex(0);
                    setQuizSelectedOption(null);
                    setQuizFeedback("");
                    setQuizIsAnswered(false);
                    setCorrectAnswersList([]);
                  }}
                  style={{
                    width: "100%",
                    background: `transparent`,
                    color: "#0f172a",
                    border: "2px solid #cbd5e1",
                    borderRadius: 20,
                    padding: "16px 24px",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: "pointer",
                    marginTop: 8,
                    marginBottom: 8
                  }}
                >
                  RETRY QUIZ 🔄
                </button>

                <button
                  onClick={onClose}
                  style={{
                    width: "100%",
                    background: "#ffffff",
                    color: "#334155",
                    border: "3px solid #cbd5e1",
                    borderRadius: 20,
                    padding: "14px 24px",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Return to Lesson Map
                </button>
              </div>
            </div>
          );
        })()}



      </div>
    </div>
  );
};
