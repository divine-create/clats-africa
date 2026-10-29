/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Child, Lesson, Language, QuizQuestion } from "../types";
import { C, F, AGE_META } from "../utils/config";
import { Heading, Txt, Chip } from "./Primitives";
import { KobeAvatar } from "./KobeAvatar";
import { sfx, companionVoice, gameMusic } from "../utils/audio";
import { recordLearningEvent, recordSkillEvidence } from "../utils/learningEvidence";
import confetti from "canvas-confetti";
import { Play, Pause, Settings, Gauge, Maximize, Minimize, HelpCircle, Sparkles, Mic, Volume2, Music } from "lucide-react";
import { KobeLessonSidekick } from "./KobeLessonSidekick";

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
  isLastLessonInModule?: boolean;
  onNextModule?: () => void;
  nextModuleTitle?: string;
  isNextModuleLocked?: boolean;
  onShowPaywall?: () => void;
  theme?: "light" | "dark";
}

export const LessonContent: React.FC<LessonContentProps> = ({
  child,
  lesson,
  onLessonComplete,
  lang,
  onClose,
  onNextLesson,
  isLastLessonInModule,
  onNextModule,
  nextModuleTitle,
  isNextModuleLocked,
  onShowPaywall,
  theme
}) => {
  const isDark = theme === "dark" || (typeof document !== "undefined" && (document.documentElement.classList.contains("dark") || document.body.classList.contains("dark-theme") || localStorage.getItem("clats_theme") === "dark"));
  const isAges6To12 = child.ageGroup === "young innovators";
  const isEarlyExplorers = child.ageGroup === "early explorers" || child.ageGroup === "young explorers";
  const isFutureBuilders = child.ageGroup === "future builders";
  const companion = child.companion || "kobe";
  const compLabel = companion === "chibi" ? "Chibi" : "Kobe";

  // Check which lesson number/type we are running

  
  const isPlayable = true;
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);

  const handleFullScreen = () => {
    if (videoContainerRef.current) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
        (videoContainerRef.current as any).webkitRequestFullscreen();
      } else if ((videoContainerRef.current as any).msRequestFullscreen) {
        (videoContainerRef.current as any).msRequestFullscreen();
      }
    }
  };

  const handleExitFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  };

  // Active steps in the lesson progression
  const [learningStep, setLearningStep] = useState<"video" | "practice" | "quiz" | "reward">("video");
  const [earnedXpState, setEarnedXpState] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false); // Default false, will wait for user interaction to avoid autoplay block
  const [watchedFraction, setWatchedFraction] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [showConceptPreview, setShowConceptPreview] = useState(false);
  const [conceptPreviewAcknowledged, setConceptPreviewAcknowledged] = useState(false);

  // Kobe In-Lesson Voice Sidekick & Socratic Hint State
  const [sidekickOpen, setSidekickOpen] = useState(false);
  const [sidekickHintPrompt, setSidekickHintPrompt] = useState<string | null>(null);
  const [reflectionDone, setReflectionDone] = useState(false);
  const [reflectionBonusAwarded, setReflectionBonusAwarded] = useState(false);
  const [reflectionResponse, setReflectionResponse] = useState<string | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!document.fullscreenElement || 
        !!(document as any).webkitFullscreenElement || 
        !!(document as any).msFullscreenElement
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Story Slideshow state for Ages 6-10 or lessons with story elements
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Inclusive Accessibility States
  const subtitlesOn = true;
  const [voiceAssistActive, setVoiceAssistActive] = useState(() => companionVoice.isNarrationEnabled(child.ageGroup));
  const [micActive, setMicActive] = useState(false);
  const [colorMode] = useState<"night" | "normal" | "accessible">(isDark ? "night" : "normal");
  const [fontSize] = useState<"normal" | "large" | "extra">("normal");
  const dyslexicMode = false;
  const reducedMotion = false;

  // Mini-Activity states
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [toolFeedback, setToolFeedback] = useState<string>("");
  const [lastWrongIndex, setLastWrongIndex] = useState<number | null>(null);
  const practiceCompletionLoggedRef = useRef(false);
  const [trainedDatabase, setTrainedDatabase] = useState<string[]>([]);
  const [trainFeedback, setTrainFeedback] = useState<string>("");

  // Quiz States
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string>("");
  const [quizIsAnswered, setQuizIsAnswered] = useState(false);
  const [correctAnswersList, setCorrectAnswersList] = useState<boolean[]>([]);

  // Video Duration Capture
  const [videoDurationStr, setVideoDurationStr] = useState<string>("");

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

  const playSFX = (type: "correct" | "wrong" | "complete" | "click") => {
    sfx[type].play().catch(e => console.log("Audio play blocked", e));
  };

  // --- YOUTUBE NATIVE IFRAME API ---
  useEffect(() => {
    if (learningStep !== "video" || !currentVideoData) {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
      setIsVideoPlaying(false);
      return;
    }

    const loadYoutubeAPI = () => {
      if (!(window as any).YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else if (document.head) {
          document.head.appendChild(tag);
        }
      }
    };

    const initPlayer = () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
      const containerId = `youtube-player-${currentVideoData.embedId}`;
      if (!document.getElementById(containerId)) return;

      try {
        ytPlayerRef.current = new (window as any).YT.Player(containerId, {
          height: '100%',
          width: '100%',
          videoId: currentVideoData.embedId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            disablekb: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0,
            cc_load_policy: 0
          },
          events: {
            'onReady': (event: any) => {
              try {
                event.target?.unloadModule?.("captions");
                event.target?.unloadModule?.("cc");
              } catch (e) {}
            },
            'onStateChange': (event: any) => {
              try {
                event.target?.unloadModule?.("captions");
                event.target?.unloadModule?.("cc");
              } catch (e) {}
              if (event.data === (window as any).YT?.PlayerState?.PLAYING) {
                setIsVideoPlaying(true);
              } else if (event.data === (window as any).YT?.PlayerState?.PAUSED) {
                setIsVideoPlaying(false);
              } else if (event.data === (window as any).YT?.PlayerState?.ENDED) {
                setWatchedFraction(1);
              }
            },
            'onError': (event: any) => {
              console.warn("YouTube player error, falling back to Concept Preview:", event?.data);
              setVideoUnavailable(true);
            }
          }
        });
      } catch (e) {
        console.warn("Failed to initialize YouTube player:", e);
        ytPlayerRef.current = null;
        setVideoUnavailable(true);
      }
    };

    (window as any).onYouTubeIframeAPIReady = initPlayer;

    if (!(window as any).YT) {
      loadYoutubeAPI();
    } else if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    }

    // Fallback timer: if player fails to initialize within 5 seconds, allow concept preview
    const timeoutId = setTimeout(() => {
      if (!ytPlayerRef.current && !(window as any).YT) {
        setVideoUnavailable(true);
      }
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, [learningStep, currentVideoData?.embedId, subtitlesOn]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVideoPlaying && ytPlayerRef.current) {
      interval = setInterval(() => {
        try {
          const player = ytPlayerRef.current;
          const iframe = player?.getIframe?.();
          if (player && iframe && iframe.src && typeof player.getDuration === "function") {
            const duration = player.getDuration();
            const currentTime = player.getCurrentTime();
            if (duration > 0) {
              const fraction = currentTime / duration;
              if (fraction >= 0.8) {
                setWatchedFraction(1);
              } else {
                setWatchedFraction(fraction);
              }
              const minutes = Math.floor(duration / 60);
              const seconds = Math.floor(duration % 60);
              setVideoDurationStr(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            }
          }
        } catch (e) {}
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVideoPlaying]);

  const togglePlay = () => {
    try {
      const player = ytPlayerRef.current;
      const iframe = player?.getIframe?.();
      if (player && iframe && iframe.src) {
        if (isVideoPlaying) {
          player.pauseVideo?.();
          setIsVideoPlaying(false);
        } else {
          player.playVideo?.();
          setIsVideoPlaying(true);
        }
      }
    } catch {}
  };

  const changeSpeed = (rate: number) => {
    try {
      const player = ytPlayerRef.current;
      const iframe = player?.getIframe?.();
      if (player && iframe && iframe.src && typeof player.setPlaybackRate === "function") {
        player.setPlaybackRate(rate);
        setPlaybackRate(rate);
      }
    } catch {}
  };
  // ---------------------------------

  const isCurrentModuleLocked = !isPlayable;

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
  }, [learningStep, currentSlideIndex, voiceAssistActive, lesson]);

  // Interactive Mini-Activity items mapped dynamically from syllabus database or validated contextual fallbacks
  const activePuzzle = lesson?.puzzle || (() => {
    const titleLower = lesson?.title?.en?.toLowerCase() || "";

    // 1. Module 1 (Technology Around Me) & technology-oriented lessons
    if (titleLower.includes("technology") || titleLower.includes("smart things")) {
      return {
        text: {
          en: "Spot the helper technology tools used around us!",
          ig: "Chọpụta ngwa teknụzụ dị n'akụkụ anyị!",
          yo: "Mọ àwọn ohun èlò ìmọ̀-ẹ̀rọ tí wà lọ́wọ́ wa!"
        },
        items: {
          en: ["Smartphone 📱", "Yellow Pencil ✏️", "Wooden stick ❌", "Electric bicycle 🚲"],
          correct: [true, true, false, true]
        }
      };
    }

    // 2. Specific password security lessons (young innovators / future builders)
    if (titleLower.includes("password")) {
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

    // 3. Specific UI wireframe lessons
    if (titleLower.includes("wireframe")) {
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

    // 4. Specific startup venture lessons
    if (titleLower.includes("startup")) {
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

    // No valid practice puzzle for this lesson — follow standard Video -> Quiz -> Reward flow
    return null;
  })();

  // Verify that active puzzle contains valid items for Young Explorers practice
  const hasValidPractice = Boolean(
    activePuzzle &&
    activePuzzle.items &&
    Array.isArray(activePuzzle.items.en) &&
    activePuzzle.items.en.length > 0 &&
    Array.isArray(activePuzzle.items.correct) &&
    activePuzzle.items.correct.some(Boolean)
  );

  const totalCorrectPuzzleItems = (hasValidPractice && activePuzzle)
    ? activePuzzle.items.correct.filter(Boolean).length
    : 0;

  const isPuzzleCompleted = hasValidPractice &&
    !!activePuzzle &&
    totalCorrectPuzzleItems > 0 &&
    activePuzzle.items.correct.every((isCorr, idx) => !isCorr || selectedTools.includes(activePuzzle.items.en[idx]));

  // Auto-read practice instructions when entering practice step
  useEffect(() => {
    if (learningStep === "practice") {
      gameMusic.startTheme("wonder_woods_hub");
      if (voiceAssistActive && hasValidPractice && activePuzzle) {
        const timer = setTimeout(() => {
          speakText(activePuzzle.text[lang] || activePuzzle.text.en);
        }, 450);
        return () => clearTimeout(timer);
      }
    }
  }, [learningStep, voiceAssistActive, lang, hasValidPractice, activePuzzle]);

  // Safety fallback: if on practice step without valid practice puzzle data, transition cleanly to quiz without blank screen
  useEffect(() => {
    if (learningStep === "practice" && !hasValidPractice) {
      setLearningStep("quiz");
    }
  }, [learningStep, hasValidPractice]);

  // Reset lesson state cleanly when active lesson changes
  useEffect(() => {
    setLearningStep("video");
    setCurrentSlideIndex(0);
    setSelectedTools([]);
    setToolFeedback("");
    setLastWrongIndex(null);
    setCurrentQuizIndex(0);
    setQuizSelectedOption(null);
    setQuizFeedback("");
    setQuizIsAnswered(false);
    setCorrectAnswersList([]);
    setWatchedFraction(0);
    setIsVideoPlaying(false);
    setVideoUnavailable(false);
    setShowConceptPreview(false);
    setConceptPreviewAcknowledged(false);
    practiceCompletionLoggedRef.current = false;
  }, [lesson?.id]);

  // Multi-choice dynamic syllabus quiz resolver
  const activeQuiz: { q: string; opts: string[]; ans: number; expl: string }[] = (lesson?.quiz && lesson.quiz.length > 0)
    ? lesson.quiz.map((qObj) => {
        const qText = qObj.q[lang] || qObj.q.en || "";
        const optsArr = qObj.opts[lang] || qObj.opts.en || [];
        const correctOpt = optsArr[qObj.ans] || "";
        const rawExpl = (qObj as any).expl
          ? (typeof (qObj as any).expl === "string" ? (qObj as any).expl : (qObj as any).expl[lang] || (qObj as any).expl.en)
          : `Because "${correctOpt}" is the key concept that answers "${qText}" in our lesson on ${lesson?.title?.[lang] || lesson?.title?.en || "technology"}!`;
        return {
          q: qText,
          opts: optsArr,
          ans: qObj.ans,
          expl: rawExpl
        };
      })
    : [
        {
          q: "What was the most important thing you learned in this lesson?",
          opts: ["How technology can help us", "How to play games all day", "Nothing useful"],
          ans: 0,
          expl: "Because technology is designed to help us solve real problems and improve our world!"
        }
      ];

  const buildQuizQuestionNarration = (qIdx: number): string => {
    const currentQ = activeQuiz[qIdx];
    if (!currentQ) return "";
    const optsNarration = currentQ.opts
      .map((opt, idx) => `Option ${String.fromCharCode(65 + idx)}: ${opt}`)
      .join(". ");
    return `Question ${qIdx + 1} of ${activeQuiz.length}: ${currentQ.q} Your options are: ${optsNarration}.`;
  };

  // Auto-read quiz question & options when entering quiz or advancing to next question, and play subtle quiz music
  useEffect(() => {
    if (learningStep === "quiz") {
      gameMusic.startTheme("quiz_quest");
      if (voiceAssistActive) {
        const timer = setTimeout(() => {
          speakText(buildQuizQuestionNarration(currentQuizIndex));
        }, 450);
        return () => clearTimeout(timer);
      }
    } else if (learningStep !== "practice") {
      gameMusic.stop();
    }
  }, [learningStep, currentQuizIndex, voiceAssistActive]);

  useEffect(() => {
    return () => {
      gameMusic.stop();
    };
  }, []);

  // Micro-activity verification triggering
  const handleVerifyActivity = () => {
    sfx.playCoin();
    setToolFeedback("🌟 Great work! You've successfully completed the activity challenge.");
  };

  const handleSelectPuzzleItem = (index: number) => {
    if (!hasValidPractice || !activePuzzle || isPuzzleCompleted) return;
    const itemName = activePuzzle.items.en[index];
    if (selectedTools.includes(itemName)) return;

    const isCorrect = activePuzzle.items.correct[index];
    if (isCorrect) {
      sfx.playCoin();
      setLastWrongIndex(null);
      const updatedSelected = [...selectedTools, itemName];
      setSelectedTools(updatedSelected);

      const allDone = totalCorrectPuzzleItems > 0 &&
        activePuzzle.items.correct.every((isCorr, idx) => !isCorr || updatedSelected.includes(activePuzzle.items.en[idx]));

      if (allDone) {
        sfx.playCheer();
        setToolFeedback(`🎉 Outstanding, ${child.name}! You found all the correct cards! Tap below to move to the Quiz.`);
        speakText(`Outstanding! You found all the correct cards! Tap below to move to the quiz.`);

        if (!practiceCompletionLoggedRef.current) {
          practiceCompletionLoggedRef.current = true;
          recordLearningEvent({
            childId: child.id,
            sourceType: 'practice',
            sourceId: lesson?.id || 'lesson-u',
            eventType: 'activity_completed',
            skillId: 'curriculum.practice.activity',
            success: true,
            metadata: {
              puzzleTitle: activePuzzle.text?.en || 'Practice Challenge',
              selectedItemsCount: updatedSelected.length
            }
          });
        }
      } else {
        setToolFeedback(`🌟 Perfect! "${itemName}" is a correct choice! Keep going, find the remaining cards.`);
        speakText(`Perfect! ${itemName} is correct!`);
      }
    } else {
      sfx.playBuzzer();
      setLastWrongIndex(index);
      setToolFeedback(`❌ Keep training your brain! "${itemName}" isn't correct for this challenge. Let's try another card.`);
      speakText(`Nice try! ${itemName} is not correct for this challenge. Think about that again.`);
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

  // Select Quiz Option trigger (reads out right/wrong + why!)
  const handleSelectQuizOption = (optIndex: number) => {
    if (quizIsAnswered) return;
    sfx.playTap();
    setQuizSelectedOption(optIndex);
    setQuizIsAnswered(true);

    const currentQ = activeQuiz[currentQuizIndex];
    const isCorrect = optIndex === currentQ.ans;
    const freshCorrectList = [...correctAnswersList];
    freshCorrectList[currentQuizIndex] = isCorrect;
    setCorrectAnswersList(freshCorrectList);

    const chosenLetter = String.fromCharCode(65 + optIndex);
    const chosenText = currentQ.opts[optIndex] || "";
    const correctLetter = String.fromCharCode(65 + currentQ.ans);
    const correctText = currentQ.opts[currentQ.ans] || "";

    recordLearningEvent({
      childId: child.id,
      sourceType: 'quiz',
      sourceId: lesson?.id || 'lesson-u',
      eventType: 'solution_validated',
      skillId: 'curriculum.quiz.mastery',
      success: isCorrect,
      metadata: {
        challengeId: `q_${currentQuizIndex + 1}`,
        isCorrect,
        chosenLetter,
        chosenText,
        correctLetter,
        correctText
      }
    });

    if (isCorrect) {
      sfx.playCoin();
      const feedbackMsg = `Correct! Option ${chosenLetter} ("${chosenText}") is right! Why? ${currentQ.expl}`;
      setQuizFeedback(feedbackMsg);
      speakText(`You chose Option ${chosenLetter}, ${chosenText}. That is right! ${currentQ.expl}`);
    } else {
      sfx.playBuzzer();
      const feedbackMsg = `Not quite! You chose Option ${chosenLetter} ("${chosenText}"), but the correct answer is Option ${correctLetter}: "${correctText}". Why? ${currentQ.expl}`;
      setQuizFeedback(feedbackMsg);
      speakText(`You chose Option ${chosenLetter}, ${chosenText}. That is not quite right. The correct answer is Option ${correctLetter}, ${correctText}. ${currentQ.expl}`);
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

      const xpToAward = isPassed ? (score === 100 ? 50 : 35) : 10;
      setEarnedXpState(xpToAward);

      const lessonTitle = typeof lesson?.title === "string" ? lesson.title : (lesson?.title ? (lesson.title as any)[lang] || (lesson.title as any).en || "Lesson" : "Lesson");

      recordSkillEvidence({
        childId: child.id,
        skillId: 'curriculum.quiz.mastery',
        sourceType: 'quiz',
        sourceId: lesson?.id || 'lesson-u',
        demonstrated: score >= 60,
        evidenceLevel: score >= 90 ? 'mastered' : (score >= 60 ? 'demonstrated' : 'completed_with_support'),
        attemptCount: 1,
        hintsUsed: 0,
        notes: `${lessonTitle} Quiz completed: ${score}% score (${countCorrect}/${totalQ} correct). Status: ${isPassed ? 'Passed' : 'Needs Review'}.`
      });

      recordLearningEvent({
        childId: child.id,
        sourceType: 'quiz',
        sourceId: lesson?.id || 'lesson-u',
        eventType: 'activity_completed',
        skillId: 'curriculum.quiz.mastery',
        success: isPassed,
        metadata: {
          score,
          correctCount: countCorrect,
          totalQuestions: totalQ,
          isPassed
        }
      });

      onLessonComplete(
        lesson?.id || "lesson-u",
        isPassed ? (score === 100 ? 3 : score >= 80 ? 2 : 1) : 0,
        xpToAward,
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

  const activeProgressProgress = hasValidPractice
    ? (learningStep === "video" ? 25 : learningStep === "practice" ? 50 : learningStep === "quiz" ? 75 : 100)
    : (learningStep === "video" ? 33 : learningStep === "quiz" ? 66 : 100);

  const buildExcitedStarsSpeech = (xpAmount: number, scorePct: number): string => {
    const nextActionText = isLastLessonInModule
      ? (isEarlyExplorers ? "You can choose to retake the quiz, or move on to the next pathway!" : "You can choose to retake the quiz, or move on to the next module!")
      : (isEarlyExplorers ? "You can choose to retake the quiz, or move to the next level!" : "You can choose to retake the quiz, or move to the next lesson!");
    return `Woohoo! Hurray, ${child.name}! I am so excited for you! You completed the quiz with a score of ${scorePct} percent, and you just got ${xpAmount} X P! ${nextActionText}`;
  };

  const triggerPartyStreamersAndCheer = (xpAmount: number, scorePct: number) => {
    // 1. Play celebratory cheer & party horn sound
    sfx.playCheer();

    // 2. Fire party streamers & confetti bursts across the screen
    const streamerColors = ["#2EC4B6", "#FFD166", "#FF6B6B", "#c084fc", "#10b981", "#38bdf8", "#f97316"];
    try {
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.25 },
        colors: streamerColors,
        scalar: 1.15,
        drift: 0.4
      });
    } catch {}

    const duration = isLastLessonInModule ? 3200 : 2200;
    const end = Date.now() + duration;
    let rafId: number;

    const frame = () => {
      try {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 58,
          origin: { x: 0, y: 0.55 },
          colors: streamerColors,
          scalar: 1.1
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 58,
          origin: { x: 1, y: 0.55 },
          colors: streamerColors,
          scalar: 1.1
        });
      } catch {}

      if (Date.now() < end) {
        rafId = requestAnimationFrame(frame);
      }
    };
    rafId = requestAnimationFrame(frame);

    // 3. Companion excitedly announces the XP earned and choices (Retake Quiz or Next Lesson)
    const speechTimer = setTimeout(() => {
      companionVoice.speakExcited(
        buildExcitedStarsSpeech(xpAmount, scorePct),
        companion,
        child.ageGroup,
        lang
      );
    }, 350);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(speechTimer);
    };
  };

  useEffect(() => {
    if (learningStep === "reward") {
      const countCorrect = correctAnswersList.filter(Boolean).length;
      const pctScore = Math.round((countCorrect / activeQuiz.length) * 100);
      const xpAmount = earnedXpState > 0 ? earnedXpState : (pctScore >= 50 ? (pctScore === 100 ? 50 : 35) : 10);
      return triggerPartyStreamersAndCheer(xpAmount, pctScore);
    }
  }, [learningStep]);

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
            borderRadius: 16,
            padding: "8px 16px",
            color: getTextColor(),
            fontSize: 16,
            fontWeight: 900,
            cursor: "pointer",
            fontFamily: F.mono,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
          className="hover:scale-[1.02] active:scale-[0.98]"
        >
          <span style={{ fontSize: 26 }}>🗺️</span> MAP
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

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px", width: "100%" }}>
        
        {/* PROGRESS STEPPER HEADER */}
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            marginBottom: 24,
            background: getCardBackground(),
            border: `2px solid ${getBorderColor()}`,
            borderRadius: 24,
            padding: "12px 14px"
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: hasValidPractice ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr",
              gap: 8,
              marginBottom: 10
            }}
          >
            {[
              { id: "video", label: isEarlyExplorers ? "Watch" : "Lesson", icon: "📺" },
              ...(hasValidPractice ? [{ id: "practice", label: isEarlyExplorers ? "Practice" : "Activity", icon: "🎯" }] : []),
              { id: "quiz", label: "Quiz", icon: "🧩" },
              { id: "reward", label: "Stars", icon: "🏆" }
            ].map((st) => {
              const isCompleted =
                (st.id === "video" && learningStep !== "video") ||
                (st.id === "practice" && (learningStep === "quiz" || learningStep === "reward")) ||
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

          {/* Stepper Linear Progress Bar (25% -> 50% -> 75% -> 100% when practice exists) */}
          <div style={{ height: 6, width: "100%", background: colorMode === "night" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${activeProgressProgress}%`,
                background: "linear-gradient(90deg, #2EC4B6, #0d9488)",
                borderRadius: 99,
                transition: "width 0.4s ease"
              }}
            />
          </div>
        </div>

        {/* -------------------------------------------------------------
            STAGE A: LESSON STORY SCREEN / MULTIPLE CONTENT TYPES
           ------------------------------------------------------------- */}
        {learningStep === "video" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* If video player is available */}
            {currentVideoData && !videoUnavailable && !showConceptPreview ? (
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
                  <div 
                    key={currentVideoData.embedId}
                    ref={videoContainerRef}
                    className="relative w-full h-full group bg-black"
                    onMouseEnter={() => setShowControls(true)}
                    onMouseLeave={() => setShowControls(false)}
                  >
                    {/* YT Iframe Container */}
                    <div id={`youtube-player-${currentVideoData.embedId}`} style={{ width: "100%", height: "100%" }}></div>
                    
                    {/* Custom Controls Overlay */}
                    <div className={`absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 flex flex-col justify-end gap-2 pointer-events-none ${showControls || !isVideoPlaying ? "opacity-100" : "opacity-0"}`}>
                      
                      {/* Progress Bar (Visual Only for MVP) */}
                      <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#2EC4B6]" 
                          style={{ width: `${watchedFraction * 100}%` }}
                        ></div>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-between text-white mt-1 pointer-events-auto">
                        <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 bg-black/50 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                          <Gauge size={16} className="text-[#2EC4B6]" />
                          <span className="text-xs font-bold font-mono min-w-[40px]">{playbackRate}x</span>
                          <input
                            type="range"
                            min="0.25"
                            max="2"
                            step="0.25"
                            value={playbackRate}
                            onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                            className="w-24 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#2EC4B6]"
                          />
                        </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <button 
                            onClick={isFullscreen ? handleExitFullScreen : handleFullScreen}
                            className="hover:text-[#2EC4B6] transition-colors"
                            title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
                          >
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
                <div style={{ background: colorMode === "night" ? "#1e293b" : "#ffffff", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Txt size={16} weight={900} color={colorMode === "night" ? "#f8fafc" : "#0f172a"}>{currentVideoData.title}</Txt>
                    <Txt size={13} color={colorMode === "night" ? "#94a3b8" : "#64748b"} style={{ display: "block" }}>⏱️ {videoDurationStr || currentVideoData.duration} Video Lecture</Txt>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      onClick={() => {
                        sfx.playTap();
                        setShowConceptPreview(true);
                      }}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Switch to Concept Preview slides if video is unavailable or slow"
                    >
                      📖 Concept Preview
                    </button>
                    <button
                      onClick={isFullscreen ? handleExitFullScreen : handleFullScreen}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
                    >
                      {isFullscreen ? <Minimize size={14} /> : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                        </svg>
                      )}
                      {isFullscreen ? "EXIT FULL SCREEN" : "FULL SCREEN"}
                    </button>
                    <Chip color={C.teal} bg="rgba(46,196,182,0.1)">HD</Chip>
                  </div>
                </div>
                {/* Customization Tip */}
                <div className="bg-[#FFFBEB] text-[#D97706] px-4 py-2.5 text-[11px] font-bold font-mono tracking-wide flex items-center justify-center gap-2 border-t border-[#FDE68A]">
                  💡 TIP: SPEAKING TOO FAST? USE THE SLIDER AT THE BOTTOM LEFT OF THE VIDEO TO SLOW IT DOWN! 🐌
                </div>
              </>
            ) : (
              // Story-first Interactive Card Slideshow (Fallback for unavailable/offline video and concept previews)
              <div
                className="playful-card"
                style={{
                  background: getCardBackground(),
                  border: `3px solid ${getBorderColor()}`,
                  borderBottom: `8px solid ${getBorderColor()}`,
                  borderRadius: 32,
                  padding: "26px 20px",
                  textAlign: "center"
                }}
              >
                {/* Honest Status Banner */}
                <div
                  style={{
                    background: colorMode === "night" ? "rgba(245, 158, 11, 0.15)" : "#fffbeb",
                    border: "2px dashed #f59e0b",
                    borderRadius: 18,
                    padding: "12px 16px",
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    textAlign: "left",
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>🎬</span>
                    <div>
                      <Txt size={11.5} weight={950} color="#b45309" style={{ textTransform: "uppercase", display: "block", fontFamily: F.mono }}>
                        {videoUnavailable ? "Offline / In Development Mode" : "Concept Preview Mode"}
                      </Txt>
                      <Txt size={13} color={getTextColor()} style={{ fontWeight: 700 }}>
                        {videoUnavailable
                          ? "Video lecture is currently in development or offline. Review the concept slides below to continue your quest!"
                          : "Explore the concept slides and story with your companion!"}
                      </Txt>
                    </div>
                  </div>
                  {!videoUnavailable && currentVideoData && (
                    <button
                      onClick={() => {
                        sfx.playTap();
                        setShowConceptPreview(false);
                      }}
                      style={{
                        background: "#0d9488",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 12,
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      ▶️ Return to Video
                    </button>
                  )}
                </div>

                {/* Visual slide card mascot helper */}
                <div style={{ fontSize: 64, display: "block", marginBottom: 12 }}>
                  {"🧠"}
                </div>

                <div style={{ display: "flex", justifySelf: "center", justifyContent: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                  <Chip color="#c084fc" bg="rgba(192, 132, 252, 0.1)">
                    SLIDE {currentSlideIndex + 1} OF {storySlides.length || 1}
                  </Chip>
                  {conceptPreviewAcknowledged && (
                    <Chip color="#16a34a" bg="rgba(22, 163, 74, 0.1)">
                      ✓ Concept Reviewed
                    </Chip>
                  )}
                </div>

                <Txt
                  size={19.5 * getFontSizeMultiplier()}
                  weight={850}
                  color={getTextColor()}
                  style={{ display: "block", lineHeight: 1.6, minHeight: 90, padding: "0 10px" }}
                >
                  "{storySlides[currentSlideIndex] || rawStoryText}"
                </Txt>

                {/* Speech read narration triggers */}
                <div style={{ display: "flex", justifySelf: "center", justifyContent: "center", gap: 12, margin: "16px 0", flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      sfx.playTap();
                      speakText(storySlides[currentSlideIndex] || rawStoryText);
                    }}
                    style={{
                      background: "#e0f2fe",
                      border: "2px solid #0284c7",
                      borderRadius: 16,
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 900,
                      color: "#0369a1",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                    className="hover:scale-105"
                  >
                    <span>🔊 Read Slide</span>
                  </button>

                  <button
                    onClick={() => {
                      sfx.playTap();
                      const next = !voiceAssistActive;
                      setVoiceAssistActive(next);
                      companionVoice.setNarrationEnabled(child.ageGroup, next);
                      if (!next) {
                        companionVoice.stop();
                      } else if (storySlides[currentSlideIndex]) {
                        speakText(storySlides[currentSlideIndex]);
                      }
                    }}
                    style={{
                      background: voiceAssistActive 
                        ? (colorMode === "night" ? "rgba(22, 163, 74, 0.25)" : "#dcfce7") 
                        : (colorMode === "night" ? "#334155" : "#f1f5f9"),
                      border: `2px solid ${voiceAssistActive ? "#16a34a" : (colorMode === "night" ? "#475569" : "#cbd5e1")}`,
                      borderRadius: 16,
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontSize: 13.5,
                      fontWeight: 850,
                      color: voiceAssistActive ? (colorMode === "night" ? "#86efac" : "#15803d") : (colorMode === "night" ? "#94a3b8" : "#475569")
                    }}
                  >
                    🔊 Read Auto: {voiceAssistActive ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Slideshow paginators */}
                {storySlides.length > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "0 10px" }}>
                    <button
                      onClick={() => {
                        sfx.playTap();
                        setCurrentSlideIndex((p) => Math.max(0, p - 1));
                      }}
                      disabled={currentSlideIndex === 0}
                      style={{
                        background: currentSlideIndex === 0 
                          ? (colorMode === "night" ? "#334155" : "#e2e8f0") 
                          : (colorMode === "night" ? "#1e293b" : "#ffffff"),
                        border: "2px solid " + (currentSlideIndex === 0 ? (colorMode === "night" ? "#475569" : "#cbd5e1") : getBorderColor()),
                        color: currentSlideIndex === 0 ? "#94a3b8" : (colorMode === "night" ? "#f8fafc" : "#000000"),
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
                        const nextIdx = Math.min(storySlides.length - 1, currentSlideIndex + 1);
                        setCurrentSlideIndex(nextIdx);
                        if (nextIdx === storySlides.length - 1) {
                          setWatchedFraction(1);
                          setConceptPreviewAcknowledged(true);
                        }
                      }}
                      disabled={currentSlideIndex === storySlides.length - 1}
                      style={{
                        background: currentSlideIndex === storySlides.length - 1 
                          ? (colorMode === "night" ? "#334155" : "#e2e8f0") 
                          : "#2EC4B6",
                        border: "2px solid " + (currentSlideIndex === storySlides.length - 1 ? (colorMode === "night" ? "#475569" : "#cbd5e1") : "#26a397"),
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

                {/* Concept acknowledgement button */}
                <div style={{ marginTop: 18 }}>
                  <button
                    onClick={() => {
                      sfx.playCoin();
                      setWatchedFraction(1);
                      setConceptPreviewAcknowledged(true);
                    }}
                    style={{
                      background: conceptPreviewAcknowledged
                        ? (colorMode === "night" ? "#166534" : "#dcfce7")
                        : "linear-gradient(135deg, #f59e0b, #d97706)",
                      border: conceptPreviewAcknowledged ? "2px solid #22c55e" : "none",
                      color: conceptPreviewAcknowledged ? (colorMode === "night" ? "#86efac" : "#15803d") : "#ffffff",
                      borderRadius: 16,
                      padding: "10px 22px",
                      fontSize: 14.5,
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: conceptPreviewAcknowledged ? "none" : "0 4px 14px rgba(245, 158, 11, 0.3)"
                    }}
                    className="hover:scale-105 active:scale-95 transition-all"
                  >
                    <span>{conceptPreviewAcknowledged ? "✓ Concept Preview Complete" : "💡 I Understand This Concept!"}</span>
                  </button>
                </div>
              </div>
            )}

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
                  "{lesson.companion_explanation || `${child.name}, technology helps us solve problems! Let's explore how we use tools and data.`}"
                </Txt>
              </div>
            </div>

            {/* ACTION CONTINUE BUTTON */}
            <button
              onClick={() => {
                sfx.playTap();
                if (hasValidPractice) {
                  setLearningStep("practice");
                } else {
                  setLearningStep("quiz");
                }
              }}
              disabled={
                !videoUnavailable &&
                !showConceptPreview &&
                !conceptPreviewAcknowledged &&
                !!currentVideoData &&
                watchedFraction < 0.8
              }
              style={{
                width: "100%",
                background:
                  !videoUnavailable &&
                  !showConceptPreview &&
                  !conceptPreviewAcknowledged &&
                  currentVideoData &&
                  watchedFraction < 0.8
                    ? "#cbd5e1"
                    : `linear-gradient(135deg, #2EC4B6, #208a80)`,
                color: "#ffffff",
                border: "none",
                borderRadius: 20,
                padding: "16px 24px",
                fontSize: 18,
                fontWeight: 950,
                cursor:
                  !videoUnavailable &&
                  !showConceptPreview &&
                  !conceptPreviewAcknowledged &&
                  currentVideoData &&
                  watchedFraction < 0.8
                    ? "not-allowed"
                    : "pointer",
                boxShadow:
                  !videoUnavailable &&
                  !showConceptPreview &&
                  !conceptPreviewAcknowledged &&
                  currentVideoData &&
                  watchedFraction < 0.8
                    ? "none"
                    : "0 8px 24px rgba(46,196,182,0.2)"
              }}
            >
              {!videoUnavailable && !showConceptPreview && !conceptPreviewAcknowledged && currentVideoData && watchedFraction < 0.8
                ? `WATCH THE VIDEO FIRST (${Math.floor(watchedFraction * 100)}%) ⏳`
                : hasValidPractice
                ? (isEarlyExplorers ? "START PRACTICE ACTIVITY 🎯" : "CONTINUE TO PRACTICE 🎯")
                : "TAKE LESSON QUIZ 🧩"
              }
            </button>
          </div>
        )}

        {/* -------------------------------------------------------------
            STAGE B: HANDS-ON PRACTICE ACTIVITY
           ------------------------------------------------------------- */}
        {learningStep === "practice" && hasValidPractice && activePuzzle && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            {/* INSTRUCTION CARD */}
            <div
              style={{
                background: getCardBackground(),
                border: `2px solid ${getBorderColor()}`,
                borderBottom: `6px solid ${getBorderColor()}`,
                borderRadius: 24,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 24 }}>🎯</span>
                  <Txt size={12} weight={950} color="#0d9488" style={{ textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 1 }}>
                    {isEarlyExplorers ? "Practice Challenge" : "Hands-On Practice"}
                  </Txt>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => speakText(activePuzzle.text[lang] || activePuzzle.text.en)}
                    title="Read instructions aloud"
                    style={{
                      background: isDark ? "#334155" : "#e2e8f0",
                      border: "none",
                      borderRadius: 12,
                      padding: "6px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 800,
                      color: getTextColor()
                    }}
                  >
                    <Volume2 size={16} />
                    <span>Listen</span>
                  </button>

                  <Chip bg={isPuzzleCompleted ? "rgba(16,185,129,0.15)" : isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"} color={isPuzzleCompleted ? "#10b981" : getTextColor()}>
                    {isPuzzleCompleted ? "✓ Solved!" : `Found ${selectedTools.length}/${totalCorrectPuzzleItems}`}
                  </Chip>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flexShrink: 0, marginTop: 4 }}>
                  <KobeAvatar character={companion} ageGroup={child.ageGroup} size={54} expression={isPuzzleCompleted ? "celebrating" : "thinking"} />
                </div>
                <div style={{ flex: 1 }}>
                  <Heading size={18 * getFontSizeMultiplier()} style={{ fontFamily: F.display, fontWeight: 900, color: getTextColor(), lineHeight: 1.35 }}>
                    {activePuzzle.text[lang] || activePuzzle.text.en}
                  </Heading>
                  <Txt size={13} color={isDark ? "#94a3b8" : "#64748b"} style={{ display: "block", marginTop: 4, fontWeight: 600 }}>
                    Tap each card you think belongs to this challenge!
                  </Txt>
                </div>
              </div>
            </div>

            {/* INTERACTIVE CARDS GRID */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 14
              }}
            >
              {activePuzzle.items.en.map((itemName, idx) => {
                const isSelected = selectedTools.includes(itemName);
                const isCorrect = activePuzzle.items.correct[idx];
                const isWrongAttempt = lastWrongIndex === idx;

                return (
                  <button
                    key={`${itemName}-${idx}`}
                    onClick={() => handleSelectPuzzleItem(idx)}
                    disabled={isPuzzleCompleted || isSelected}
                    style={{
                      background: isSelected
                        ? (isDark ? "rgba(16,185,129,0.18)" : "#ecfdf5")
                        : isWrongAttempt
                        ? (isDark ? "rgba(244,63,94,0.18)" : "#fff1f2")
                        : getCardBackground(),
                      border: isSelected
                        ? "3px solid #10b981"
                        : isWrongAttempt
                        ? "3px solid #f43f5e"
                        : `2px solid ${getBorderColor()}`,
                      borderBottom: isSelected
                        ? "6px solid #059669"
                        : isWrongAttempt
                        ? "6px solid #e11d48"
                        : `6px solid ${getBorderColor()}`,
                      borderRadius: 22,
                      padding: "20px 18px",
                      textAlign: "center",
                      cursor: (isPuzzleCompleted || isSelected) ? "default" : "pointer",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: isSelected ? "0 8px 20px rgba(16,185,129,0.25)" : "0 4px 12px rgba(0,0,0,0.04)"
                    }}
                    className={isPuzzleCompleted || isSelected ? "" : "hover:scale-[1.02] active:scale-[0.97]"}
                  >
                    <div style={{ fontSize: 32 }}>
                      {isSelected ? "⭐" : isWrongAttempt ? "🤔" : "🔍"}
                    </div>

                    <Txt size={16 * getFontSizeMultiplier()} weight={900} color={getTextColor()}>
                      {itemName}
                    </Txt>

                    {isSelected && (
                      <span style={{ fontSize: 11, fontWeight: 900, color: "#10b981", background: "rgba(16,185,129,0.15)", padding: "2px 8px", borderRadius: 8 }}>
                        ✓ Correct Choice!
                      </span>
                    )}

                    {isWrongAttempt && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#f43f5e", background: "rgba(244,63,94,0.15)", padding: "2px 8px", borderRadius: 8 }}>
                        Try another one!
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* FEEDBACK & HINT MESSAGE */}
            {toolFeedback && (
              <div
                style={{
                  background: toolFeedback.includes("🌟") || toolFeedback.includes("🎉")
                    ? (isDark ? "rgba(16,185,129,0.12)" : "#ecfdf5")
                    : (isDark ? "rgba(245,158,11,0.12)" : "#fffbeb"),
                  border: `2px solid ${toolFeedback.includes("🌟") || toolFeedback.includes("🎉") ? "#10b981" : "#f59e0b"}`,
                  borderRadius: 20,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}
              >
                <span style={{ fontSize: 24 }}>
                  {toolFeedback.includes("🌟") || toolFeedback.includes("🎉") ? "🎉" : "💡"}
                </span>
                <Txt size={14 * getFontSizeMultiplier()} weight={800} color={getTextColor()} style={{ flex: 1 }}>
                  {toolFeedback}
                </Txt>
              </div>
            )}

            {/* ACTION CONTINUE TO QUIZ BUTTON */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              <button
                onClick={() => {
                  sfx.playTap();
                  setLearningStep("quiz");
                }}
                disabled={!isPuzzleCompleted}
                style={{
                  width: "100%",
                  background: !isPuzzleCompleted
                    ? (isDark ? "#334155" : "#cbd5e1")
                    : `linear-gradient(135deg, #10B981, #059669)`,
                  color: !isPuzzleCompleted ? (isDark ? "#94a3b8" : "#64748b") : "#ffffff",
                  border: "none",
                  borderRadius: 20,
                  padding: "16px 24px",
                  fontSize: 18,
                  fontWeight: 950,
                  cursor: !isPuzzleCompleted ? "not-allowed" : "pointer",
                  boxShadow: !isPuzzleCompleted ? "none" : "0 8px 24px rgba(16,185,129,0.3)"
                }}
                className={isPuzzleCompleted ? "hover:scale-[1.01] active:scale-[0.98]" : ""}
              >
                {!isPuzzleCompleted
                  ? `FIND ALL CORRECT CARDS (${selectedTools.length}/${totalCorrectPuzzleItems}) 🎯`
                  : "CONTINUE TO LESSON QUIZ 🧩 →"
                }
              </button>

              {selectedTools.length > 0 && !isPuzzleCompleted && (
                <button
                  onClick={() => {
                    sfx.playTap();
                    setSelectedTools([]);
                    setToolFeedback("");
                    setLastWrongIndex(null);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: isDark ? "#94a3b8" : "#64748b",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                    alignSelf: "center",
                    padding: "4px 8px"
                  }}
                >
                  Clear selections & try again 🔄
                </button>
              )}
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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <Heading size={21 * getFontSizeMultiplier()} color={getTextColor()} style={{ lineHeight: 1.4, textAlign: "left", flex: 1, margin: 0 }}>
                  {activeQuiz[currentQuizIndex].q}
                </Heading>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      sfx.playTap();
                      companionVoice.speakTTS(buildQuizQuestionNarration(currentQuizIndex), companion, child.ageGroup, lang);
                    }}
                    style={{
                      background: colorMode === "night" ? "rgba(46,196,182,0.2)" : "#e0f2fe",
                      border: "1.5px solid #0284c7",
                      borderRadius: 16,
                      padding: "7px 12px",
                      color: colorMode === "night" ? "#5eead4" : "#0369a1",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                    className="hover:scale-105 active:scale-95"
                    title="Read question and all options aloud"
                  >
                    <Volume2 size={14} />
                    <span>Read Question & Options</span>
                  </button>

                  <button
                    onClick={() => {
                      sfx.playTap();
                      const currentQ = activeQuiz[currentQuizIndex];
                      const optsText = Array.isArray(currentQ.opts)
                        ? currentQ.opts.join(", ")
                        : (currentQ.opts as any)?.en?.join?.(", ") || "";
                      setSidekickHintPrompt(
                        `I am answering this quiz question in "${lesson?.title?.en || "our lesson"}": "${currentQ.q}". The choices are: ${optsText}. Can you give me a gentle, encouraging Socratic hint without spoiling the answer?`
                      );
                      setSidekickOpen(true);
                    }}
                    style={{
                      background: colorMode === "night" ? "rgba(245,158,11,0.22)" : "#fef3c7",
                      border: "1.5px solid #f59e0b",
                      borderRadius: 16,
                      padding: "7px 12px",
                      color: "#b45309",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0
                    }}
                    className="hover:scale-105 active:scale-95"
                    title="Ask Kobe for a helpful hint"
                  >
                    <HelpCircle size={14} color="#f59e0b" />
                    <span>Ask Kobe for a Hint</span>
                  </button>
                </div>
              </div>

              {/* Multiple Choice Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activeQuiz[currentQuizIndex].opts.map((option, oIdx) => {
                  const isChecked = quizSelectedOption === oIdx;
                  const isCorrect = oIdx === activeQuiz[currentQuizIndex].ans;

                  let optBg = colorMode === "night" ? "#1e293b" : "#f8fafc";
                  let optBorder = colorMode === "night" ? "#334155" : "#cbd5e1";

                  if (quizIsAnswered) {
                    if (isCorrect) {
                      optBg = colorMode === "night" ? "#064e3b" : "#ecfdf5";
                      optBorder = "#10b981";
                    } else if (isChecked) {
                      optBg = colorMode === "night" ? "#7f1d1d" : "#fef2f2";
                      optBorder = "#ef4444";
                    }
                  } else {
                    if (isChecked) {
                      optBg = colorMode === "night" ? "#0369a1" : "#e0f2fe";
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
                          background: isChecked ? (isCorrect ? "#10b981" : "#ef4444") : (colorMode === "night" ? "#334155" : "#e2e8f0"),
                          color: isChecked ? "#ffffff" : (colorMode === "night" ? "#f8fafc" : "#1e293b"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900
                        }}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <Txt size={16 * getFontSizeMultiplier()} weight={800} color={isChecked && colorMode === "night" ? "#ffffff" : (colorMode === "night" ? "#f8fafc" : "#0f172a")}>{option}</Txt>
                    </button>
                  );
                })}
              </div>

              {quizIsAnswered && (
                <div
                  style={{
                    marginTop: 20,
                    background: colorMode === "night" ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5",
                    border: "1.5px solid #10b981",
                    borderRadius: 16,
                    padding: "14px 18px",
                    textAlign: "left"
                  }}
                >
                  <Txt size={11.5} weight={950} color={colorMode === "night" ? "#6ee7b7" : "#065f46"} style={{ textTransform: "uppercase", display: "block", fontFamily: F.mono, marginBottom: 2 }}>
                    🤖 Grading Feedback:
                  </Txt>
                  <Txt size={14.5 * getFontSizeMultiplier()} color={colorMode === "night" ? "#a7f3d0" : "#065f46"} style={{ fontWeight: 700 }}>
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
            STAGE D: COMPLETED QUESTS REWARDS CELEBRATION (STARS SCREEN)
           ------------------------------------------------------------- */}
        {learningStep === "reward" && (() => {
          const countCorrect = correctAnswersList.filter(Boolean).length;
          const pctScore = Math.round((countCorrect / activeQuiz.length) * 100);
          
          const isModuleChallenge = lesson?.title?.en?.toLowerCase().includes("challenge");
          const xpGained = earnedXpState > 0 ? earnedXpState : (pctScore >= 50 ? (pctScore === 100 ? 50 : 35) : 10);

          const handleRetakeQuiz = () => {
            companionVoice.stop();
            sfx.playTap();
            setLearningStep("quiz");
            setCurrentQuizIndex(0);
            setQuizSelectedOption(null);
            setQuizFeedback("");
            setQuizIsAnswered(false);
            setCorrectAnswersList([]);
          };

          const handleMoveToNextLesson = () => {
            companionVoice.stop();
            if (isLastLessonInModule) {
              sfx.playLevelUp();
              if (isNextModuleLocked) {
                if (onShowPaywall) onShowPaywall();
              } else if (onNextModule) {
                onNextModule();
              } else {
                onClose();
              }
            } else if (onNextLesson) {
              sfx.playTap();
              onNextLesson();
              setLearningStep("video");
              setCurrentSlideIndex(0);
              setSelectedTools([]);
              setToolFeedback("");
              setLastWrongIndex(null);
              setCurrentQuizIndex(0);
              setQuizSelectedOption(null);
              setQuizFeedback("");
              setQuizIsAnswered(false);
              setCorrectAnswersList([]);
            } else {
              sfx.playTap();
              onClose();
            }
          };

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "center" }}>
              <style>{`
                @keyframes streamerWave {
                  0%, 100% { transform: translateY(0px) rotate(-4deg) scaleY(1); }
                  50% { transform: translateY(8px) rotate(5deg) scaleY(1.06); }
                }
                @keyframes streamerDrop {
                  0% { transform: translateY(-18px) rotate(0deg); opacity: 0.95; }
                  50% { transform: translateY(6px) rotate(8deg); opacity: 1; }
                  100% { transform: translateY(-18px) rotate(-6deg); opacity: 0.95; }
                }
                @keyframes partyPopBounce {
                  0%, 100% { transform: scale(1) rotate(-6deg); }
                  50% { transform: scale(1.16) rotate(8deg); }
                }
              `}</style>

              <div
                className="playful-card"
                style={{
                  background: colorMode === "night" ? "#0f172a" : "#f0fdfa",
                  borderColor: "#2EC4B6",
                  borderBottom: `8px solid #208a80`,
                  borderRadius: 32,
                  padding: "44px 24px 36px",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* FESTIVE PARTY STREAMERS & RIBBONS OVERLAY */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 96,
                    pointerEvents: "none",
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "flex-start",
                    overflow: "hidden",
                    zIndex: 1
                  }}
                >
                  {[
                    { color: "#FF6B6B", height: 74, delay: "0s" },
                    { color: "#FFD166", height: 88, delay: "0.2s" },
                    { color: "#2EC4B6", height: 68, delay: "0.4s" },
                    { color: "#c084fc", height: 84, delay: "0.15s" },
                    { color: "#38bdf8", height: 72, delay: "0.35s" },
                    { color: "#10b981", height: 86, delay: "0.1s" },
                    { color: "#f97316", height: 76, delay: "0.3s" },
                    { color: "#ec4899", height: 90, delay: "0.25s" },
                    { color: "#FFD166", height: 70, delay: "0.45s" },
                    { color: "#2EC4B6", height: 82, delay: "0.05s" }
                  ].map((s, idx) => (
                    <svg
                      key={idx}
                      width="24"
                      height={s.height}
                      viewBox="0 0 24 90"
                      style={{
                        animation: `streamerWave 2.2s ease-in-out ${s.delay} infinite`,
                        transformOrigin: "top center",
                        filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.12))"
                      }}
                    >
                      <path
                        d="M12 0 Q 22 18, 8 36 T 16 72 T 10 90"
                        fill="none"
                        stroke={s.color}
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    </svg>
                  ))}
                </div>

                {/* Party Popper Corner Badges */}
                <div
                  style={{
                     display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "relative",
                    zIndex: 2,
                    marginBottom: 8
                  }}
                >
                  <span style={{ fontSize: 32, display: "inline-block", animation: "partyPopBounce 1.6s ease-in-out infinite" }}>
                    🎉🎊
                  </span>
                  <button
                    onClick={() => triggerPartyStreamersAndCheer(xpGained, pctScore)}
                    style={{
                      background: colorMode === "night" ? "#1e293b" : "#ffffff",
                      border: "2px solid #f59e0b",
                      borderRadius: 20,
                      padding: "6px 14px",
                      fontSize: 12,
                      fontWeight: 900,
                      color: "#d97706",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 4px 10px rgba(245, 158, 11, 0.2)"
                    }}
                    className="hover:scale-105 active:scale-95"
                    title="Replay cheer sound, party streamers, and excited companion voice"
                  >
                    <span>🥳</span>
                    <span>Replay Cheer & Streamers</span>
                  </button>
                  <span style={{ fontSize: 32, display: "inline-block", animation: "partyPopBounce 1.6s ease-in-out 0.3s infinite" }}>
                    🎊🎉
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, position: "relative", zIndex: 2 }}>
                  <KobeAvatar size={104} character={companion} ageGroup={child.ageGroup} expression={"celebrating"} pulse />
                </div>

                <div style={{ display: "flex", justifySelf: "center", justifyContent: "center", gap: 8, marginBottom: 8, position: "relative", zIndex: 2 }}>
                  <Chip color={"#c084fc"} bg={"rgba(192, 132, 252, 0.15)"}>
                    {(isModuleChallenge || isLastLessonInModule) && isEarlyExplorers
                      ? "🏆 PATHWAY PASS EARNED!"
                      : isModuleChallenge 
                      ? "🏆 MODULE COMPLETE!" 
                      : (isEarlyExplorers ? "🌟 LEVEL QUIZ COMPLETE!" : "🌟 LESSON QUIZ COMPLETE!")}
                  </Chip>
                </div>

                <Heading size={32} color={colorMode === "night" ? "#f8fafc" : "#0f172a"} style={{ marginBottom: 12, position: "relative", zIndex: 2 }}>
                  🎉 You Earned +{xpGained} XP! 🎉
                </Heading>

                {/* EXCITED COMPANION VOICE ANNOUNCEMENT SPEECH BUBBLE */}
                <div
                  style={{
                    background: colorMode === "night"
                      ? "linear-gradient(135deg, rgba(46,196,182,0.22), rgba(251,191,36,0.14))"
                      : "linear-gradient(135deg, #ffffff, #fefce8)",
                    border: "2.5px solid #2EC4B6",
                    borderRadius: 24,
                    padding: "18px 20px",
                    marginBottom: 22,
                    textAlign: "left",
                    boxShadow: "0 8px 22px rgba(46, 196, 182, 0.15)",
                    position: "relative",
                    zIndex: 2
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <Txt size={12.5} weight={950} color="#0d9488" style={{ textTransform: "uppercase", fontFamily: F.mono }}>
                      🥳 {compLabel} is Cheering for You!
                    </Txt>
                    <button
                      onClick={() => {
                        sfx.playCheer();
                        companionVoice.speakExcited(
                          buildExcitedStarsSpeech(xpGained, pctScore),
                          companion,
                          child.ageGroup,
                          lang
                        );
                      }}
                      style={{
                        background: "#e0f2fe",
                        border: "1.5px solid #0284c7",
                        borderRadius: 14,
                        padding: "4px 10px",
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: "#0369a1",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5
                      }}
                    >
                      <Volume2 size={13} /> Hear {compLabel}
                    </button>
                  </div>
                  <Txt size={16} color={colorMode === "night" ? "#f8fafc" : "#0f172a"} style={{ display: "block", lineHeight: 1.5, fontWeight: 800 }}>
                    "{buildExcitedStarsSpeech(xpGained, pctScore)}"
                  </Txt>
                </div>

                {/* QUICK CHOICE BUTTONS RIGHT UNDER COMPANION ANNOUNCEMENT */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: 12,
                    marginBottom: 24,
                    position: "relative",
                    zIndex: 2
                  }}
                >
                  <button
                    onClick={handleRetakeQuiz}
                    style={{
                      background: colorMode === "night" ? "#1e293b" : "#ffffff",
                      color: colorMode === "night" ? "#f8fafc" : "#0f172a",
                      border: "2.5px solid #f59e0b",
                      borderRadius: 20,
                      padding: "16px 20px",
                      fontSize: 16,
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: "0 5px 0 #d97706"
                    }}
                    className="hover:scale-[1.02] active:scale-[0.98]"
                  >
                    🔄 Retake Quiz
                  </button>

                  <button
                    onClick={handleMoveToNextLesson}
                    style={{
                      background: `linear-gradient(135deg, #2EC4B6, #14b8a6)`,
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 20,
                      padding: "16px 20px",
                      fontSize: 16,
                      fontWeight: 950,
                      cursor: "pointer",
                      boxShadow: "0 5px 0 #0f766e"
                    }}
                    className="hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLastLessonInModule
                      ? (isNextModuleLocked 
                          ? (isEarlyExplorers ? "⭐ Unlock Next Pathway" : "⭐ Unlock Next Module") 
                          : (isEarlyExplorers ? "🚀 Move to Next Pathway →" : "🚀 Move to Next Module →"))
                      : (isEarlyExplorers ? "🚀 Move to Next Level →" : "🚀 Move to Next Lesson →")}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                  <div style={{ background: colorMode === "night" ? "#1e293b" : "#ffffff", border: colorMode === "night" ? "2px solid #334155" : "2px solid #cbd5e1", borderRadius: 18, padding: "12px" }}>
                    <Txt size={11} color={colorMode === "night" ? "#94a3b8" : "#64748b"} style={{ display: "block", fontFamily: F.mono, textTransform: "uppercase" }}>XP Earned from Quiz</Txt>
                    <Txt size={22} weight={950} color="#10b981">+{xpGained} XP</Txt>
                  </div>

                  <div style={{ background: colorMode === "night" ? "#1e293b" : "#ffffff", border: colorMode === "night" ? "2px solid #334155" : "2px solid #cbd5e1", borderRadius: 18, padding: "12px" }}>
                    <Txt size={11} color={colorMode === "night" ? "#94a3b8" : "#64748b"} style={{ display: "block", fontFamily: F.mono, textTransform: "uppercase" }}>Quiz Score</Txt>
                    <Txt size={22} weight={950} color="#0284c7">{pctScore}%</Txt>
                  </div>
                </div>

                {isLastLessonInModule && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, #c084fc, #9333ea)",
                      border: "4px solid #fdf4ff",
                      boxShadow: "0 8px 24px rgba(147, 51, 234, 0.3)",
                      borderRadius: 22,
                      padding: "24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      textAlign: "left",
                      color: "white",
                      marginBottom: 24,
                      animation: "bounce 2s infinite"
                    }}
                  >
                    <span style={{ fontSize: 54 }}>🎓</span>
                    <div>
                      <Txt size={14} weight={900} color="#fdf4ff" style={{ textTransform: "uppercase", display: "block", letterSpacing: 1 }}>
                        {isEarlyExplorers ? "PATHWAY PASS EARNED! 🎓" : "MODULE COMPLETED!"}
                      </Txt>
                      <Txt size={20} weight={950} color="#ffffff">
                        {isEarlyExplorers 
                          ? "You've mastered all levels in this adventure pathway!" 
                          : "You've mastered this entire section!"}
                      </Txt>
                    </div>
                  </div>
                )}

                {true && (
                  <div
                    style={{
                      background: colorMode === "night" ? "#1e293b" : "#ffffff",
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
                      <Txt size={16} weight={950} color={colorMode === "night" ? "#f8fafc" : "#0f172a"}>
                        {lesson?.title.en || "Topic Badge"}
                      </Txt>
                    </div>
                  </div>
                )}

                {/* 60-Second Post-Lesson Voice Reflection Debrief with Kobe */}
                <div
                  style={{
                    background: reflectionDone
                      ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(46,196,182,0.1))"
                      : "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06))",
                    border: `2px solid ${reflectionDone ? "#10b981" : "#f59e0b"}`,
                    borderRadius: 22,
                    padding: "18px 20px",
                    textAlign: "left",
                    marginTop: 16
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <KobeAvatar size={40} character={companion} ageGroup={child.ageGroup} expression={reflectionDone ? "celebrating" : "happy"} />
                      <div>
                        <Txt size={12} weight={900} color={reflectionDone ? "#059669" : "#d97706"} style={{ textTransform: "uppercase", display: "block" }}>
                          🎙️ {compLabel}'s 60-Second Reflection
                        </Txt>
                        <Txt size={14.5} weight={800} color={colorMode === "night" ? "#f8fafc" : "#0f172a"}>
                          {reflectionDone ? "Superstar Reflection Recorded!" : "What was the coolest thing you learned today?"}
                        </Txt>
                      </div>
                    </div>
                    {reflectionBonusAwarded && (
                      <Chip color="#10b981" bg="#ecfdf5">+10 BONUS XP</Chip>
                    )}
                  </div>

                  {!reflectionDone ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                      <Txt size={12.5} color={colorMode === "night" ? "#cbd5e1" : "#475569"}>
                        Tap a reflection below to share with {compLabel} and claim bonus XP:
                      </Txt>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {[
                          "🤖 Computers follow clear step-by-step instructions!",
                          "💡 The real-world jollof rice analogy made sense!",
                          "🛡️ How to protect my password and stay safe online!",
                          "✨ I can't wait to build my own games and AI!"
                        ].map((refChoice, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              sfx.playCheer();
                              confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
                              setReflectionDone(true);
                              setReflectionResponse(refChoice);
                              setReflectionBonusAwarded(true);
                              setEarnedXpState((prev) => prev + 10);
                              companionVoice.speakExcited(`Wonderful reflection, ${child.name}! You just earned 10 bonus X P! You are a true technology champion!`, companion, child.ageGroup, lang);
                            }}
                            style={{
                              background: colorMode === "night" ? "#1e293b" : "#ffffff",
                              border: colorMode === "night" ? "1.5px solid #334155" : "1.5px solid #cbd5e1",
                              borderRadius: 14,
                              padding: "8px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              color: colorMode === "night" ? "#f8fafc" : "#1e293b",
                              cursor: "pointer",
                              textAlign: "left"
                            }}
                            className="hover:scale-105 active:scale-95"
                          >
                            {refChoice}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, background: "#ecfdf5", border: "1px solid #10b981", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                      <Sparkles size={16} color="#059669" />
                      <Txt size={13} weight={700} color="#065f46">
                        "{reflectionResponse}" — Great reflection, {child.name}! +10 Bonus XP awarded.
                      </Txt>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  onClick={handleMoveToNextLesson}
                  style={{
                    width: "100%",
                    background: isLastLessonInModule && isNextModuleLocked
                      ? `linear-gradient(135deg, #fbbf24, #d97706)`
                      : `linear-gradient(135deg, #FFD166, #e6bb5c)`,
                    color: isLastLessonInModule && isNextModuleLocked ? "#ffffff" : "#1e293b",
                    border: "none",
                    borderRadius: 20,
                    padding: "18px 24px",
                    fontSize: 18,
                    fontWeight: 950,
                    cursor: "pointer",
                    boxShadow: "0 6px 0 #d97706"
                  }}
                >
                  {isLastLessonInModule
                    ? (isNextModuleLocked 
                        ? (isEarlyExplorers ? "⭐ UNLOCK NEXT PATHWAY" : "⭐ UNLOCK NEXT MODULE") 
                        : (isEarlyExplorers ? "START NEXT PATHWAY 🚀" : "START NEXT MODULE 🚀"))
                    : (isEarlyExplorers ? "MOVE TO NEXT LEVEL →" : "MOVE TO NEXT LESSON →")}
                  {isLastLessonInModule && nextModuleTitle && (
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, opacity: 0.9 }}>
                      {isEarlyExplorers ? nextModuleTitle.replace(/^Module\s*\d+:\s*/i, "Pathway: ") : nextModuleTitle}{isNextModuleLocked ? " (Premium Zone)" : ""}
                    </div>
                  )}
                </button>
                
                <button
                  onClick={handleRetakeQuiz}
                  style={{
                    width: "100%",
                    background: `transparent`,
                    color: colorMode === "night" ? "#f8fafc" : "#0f172a",
                    border: `2px solid ${colorMode === "night" ? "#475569" : "#cbd5e1"}`,
                    borderRadius: 20,
                    padding: "16px 24px",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: "pointer",
                    marginTop: 4,
                    marginBottom: 4
                  }}
                >
                  RETAKE QUIZ 🔄
                </button>

                <button
                  onClick={() => {
                    companionVoice.stop();
                    onClose();
                  }}
                  style={{
                    width: "100%",
                    background: colorMode === "night" ? "#1e293b" : "#ffffff",
                    color: colorMode === "night" ? "#e2e8f0" : "#334155",
                    border: `3px solid ${colorMode === "night" ? "#334155" : "#cbd5e1"}`,
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

      {/* KOBE IN-LESSON FLOATING COMPANION & VOICE SIDEKICK */}
      <KobeLessonSidekick
        child={child}
        lesson={lesson}
        lang={lang}
        theme={colorMode === "night" ? "dark" : "light"}
        onPauseMedia={() => {
          companionVoice.stop();
          if (learningStep === "video") {
            setIsVideoPlaying(false);
            try {
              const player = ytPlayerRef.current;
              const iframe = player?.getIframe?.();
              if (player && iframe && iframe.src && typeof player.pauseVideo === "function") {
                player.pauseVideo();
              }
            } catch {}
          }
        }}
        onResumeMedia={() => {
          if (learningStep === "video") {
            try {
              const player = ytPlayerRef.current;
              const iframe = player?.getIframe?.();
              if (player && iframe && iframe.src && typeof player.playVideo === "function") {
                player.playVideo();
                setIsVideoPlaying(true);
              }
            } catch {}
          }
        }}
        currentQuizQuestion={learningStep === "quiz" ? activeQuiz[currentQuizIndex] : null}
        isOpenExternal={sidekickOpen}
        onCloseExternal={() => {
          setSidekickOpen(false);
          setSidekickHintPrompt(null);
        }}
        triggerHintPrompt={sidekickHintPrompt}
      />
    </div>
  );
};
