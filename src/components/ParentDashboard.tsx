/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Parent, Child, Language } from "../types";
import { downloadProgressReportImage } from "../utils/pdfGenerator";
import {
  C,
  F,
  AGE_LABEL,
  AGE_AGES,
  AGE_META,
  fmt,
  pullParentFromSupabase
} from "../utils/config";
import { CURRICULUM } from "../data/curriculum";
import { KobeAvatar } from "./KobeAvatar";
import { calculateStudyAnalytics } from "../utils/timeTracker";
import { supabase } from "../utils/supabaseClient";
import { CLATSLogo } from "./CLATSLogo";
import {
  Sun,
  Moon,
  Bell,
  Globe,
  Award,
  BookOpen,
  Sparkles,
  Clock,
  TrendingUp,
  Compass,
  MessageSquare,
  Share2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  LogOut,
  HelpCircle,
  PlusCircle,
  Settings,
  Users,
  Activity,
  Calendar,
  Layers,
  Flame,
  CheckSquare,
  ArrowRight,
  ChevronLeft,
  Tv,
  Star,
  Check,
  Lock,
  Compass as CompassIcon,
  HelpCircle as HelpIcon,
  ShieldAlert,
  Download,
  Flame as FlameIcon,
  Smartphone,
  BookOpen as BookIcon,
  Award as MedalIcon,
  FileText,
  UserPlus,
  Play,
  RefreshCw,
  Crown
} from "lucide-react";
import { PaywallModal } from "./PaywallModal";

interface ParentDashboardProps {
  parent: Parent;
  dbConnected?: boolean;
  isSyncing?: boolean;
  onEnterChildMode: (c: Child) => void;
  onNavigate: (screen: "addChild" | "settings" | "community") => void;
  onLogout: () => void;
  lang: Language;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLanguageChange: (lang: Language) => void;
  onRefreshParent?: (fresh: Parent) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  parent,
  dbConnected,
  isSyncing,
  onEnterChildMode,
  onNavigate,
  onLogout,
  lang,
  theme,
  onToggleTheme,
  onLanguageChange,
  onRefreshParent
}) => {
  const children = parent.children || [];
  const [selChild, setSelChild] = useState<Child | null>(children[0] || null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activePathwayTab, setActivePathwayTab] = useState<string>("ai");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [manualSyncing, setManualSyncing] = useState(false);
  const [childSessions, setChildSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [rsvpedEvents, setRsvpedEvents] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showPaywall, setShowPaywall] = useState<Child | null>(null);
  const [revealedLoginId, setRevealedLoginId] = useState<string | null>(null);

  // AI Insights State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInsight, setAiInsight] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("clats_rsvped_events");
      if (saved) setRsvpedEvents(JSON.parse(saved));
    }
  }, []);

  // Select the fresh reference from children array to stay perfectly synced with local storage/DB pulls
  const child = selChild ? (children.find((c) => c.id === selChild.id) || children[0] || null) : (children[0] || null);

  useEffect(() => {
    fetch("/api/supabase/community", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setCommunityEvents(data.events.filter((e: any) => e.is_active));
        }
      })
      .catch(err => console.error("Error fetching community events:", err));

    // Fetch Notifications & Initialize Real-Time Sync
    if (parent?.id) {
      fetch(`/api/supabase/notifications?parent_id=${parent.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.data) {
            setNotifications(data.data);
            setUnreadCount(data.data.filter((n: any) => !n.is_read).length);
          }
        })
        .catch(err => console.error("Error fetching notifications:", err));

      // Listen for real-time notification updates from Supabase
      const channel = supabase
        .channel('realtime-notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `parent_id=eq.${parent.id}` },
          (payload) => {
            const newNotif = payload.new;
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            // Trigger in-app toast for real-time engagement
            setToastMsg(`New Notification: ${newNotif.title}`);
            setTimeout(() => setToastMsg(null), 4000);
            
            // Subtle sound alert if possible
            try {
              const audio = new Audio('/sfx/achievement.mp3');
              audio.volume = 0.4;
              audio.play().catch(() => {});
            } catch (e) {}
          }
        )
        .subscribe();

      // Cleanup listener on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [parent?.id]);

  useEffect(() => {
    if (!child?.id) {
      setChildSessions([]);
      return;
    }
    let active = true;
    setLoadingSessions(true);

    const fetchSessions = () => {
      fetch(`/api/supabase/sessions/child/${child.id}`)
        .then(res => res.json())
        .then(data => {
          if (active && data.ok) {
            setChildSessions(data.sessions || []);
          }
        })
        .catch(err => console.error("Error fetching sessions in parent dashboard:", err))
        .finally(() => {
          if (active) setLoadingSessions(false);
        });
    };

    // Initial fetch with slight delay
    const timer = setTimeout(fetchSessions, 800);

    // Auto-sync sessions every 15 seconds
    const interval = setInterval(fetchSessions, 15000);

    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [child?.id, manualSyncing]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const generateAiInsight = async () => {
    if (!child) return;
    setLoadingAi(true);
    setShowAiModal(true);
    setAiInsight(null);
    try {
      const res = await fetch("/api/ai/generate-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: child.id }),
      });
      const data = await res.json();
      if (data.insight) {
        setAiInsight(data.insight);
        if (data.cached) {
          showToast("Using today's report. AI analysis can only be generated once a day.");
        }
      } else {
        showToast(data.error || "Failed to generate AI insight");
        setShowAiModal(false);
      }
    } catch (e) {
      showToast("Network error generating AI insight");
      setShowAiModal(false);
    }
    setLoadingAi(false);
  };

  const [activeTab, setActiveTab] = useState<"overview" | "refer">("overview");
  const [copiedCode, setCopiedCode] = useState(false);

  const referralCode = parent?.id ? parent.id.substring(0, 8).toUpperCase() : "CLATS26";
  const referralLink = `https://app.clats.africa/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast("Referral link copied!");
  };

  const friendsInvited = (parent as any)?.referrals_count || 0;
  const freeMonths = (parent as any)?.free_months_earned || 0;

  const handleRSVP = async (id: string) => {
    if (rsvpedEvents.includes(id)) return;
    setRsvpedEvents(prev => {
      const next = [...prev, id];
      localStorage.setItem("clats_rsvped_events", JSON.stringify(next));
      return next;
    });
    showToast("RSVP Confirmed! See you there!");
    try {
      await fetch("/api/supabase/community", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, rsvp_increment: true })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const isDark = theme === "dark";
  const feedbackFormUrl = "https://forms.gle/yk1NRLgPnHFxweKM7";

  React.useEffect(() => {
    if (!dbConnected || !parent?.email || !onRefreshParent) return;

    const fetchLatestData = () => {
      pullParentFromSupabase(parent.email).then((freshParent) => {
        if (freshParent) {
          onRefreshParent(freshParent);
        }
      }).catch(err => {
        console.log("Auto-sync update skipped or offline.");
      });
    };

    // Fetch immediately on mount
    fetchLatestData();

    // Then auto-sync every 15 seconds
    const interval = setInterval(fetchLatestData, 15000);

    return () => clearInterval(interval);
  }, [parent?.email, dbConnected]);

  const handleManualSync = async () => {
    if (!dbConnected) {
      showToast("Cannot sync: Database connection unavailable.");
      return;
    }
    if (!parent?.email) return;

    setManualSyncing(true);
    try {
      const freshParent = await pullParentFromSupabase(parent.email);
      if (freshParent) {
        if (onRefreshParent) {
          onRefreshParent(freshParent);
        }
        showToast("Success! Fully synchronized with child's latest learning portal.");
      } else {
        showToast("Unable to reach cloud portal. Please retry in a moment.");
      }
    } catch (e) {
      console.error(e);
      showToast("Synchronization failed. Check internet connection.");
    } finally {
      setManualSyncing(false);
    }
  };

  // Real total seconds to calculate screen time
  const studyStats = calculateStudyAnalytics(childSessions);
  const computedMinsToday = studyStats.todayMins;
  const weeklyMins = studyStats.weeklyMins;
  const totalMins = studyStats.totalMins;

  // Dynamic curriculum calculations based on selected child and their ageGroup
  const course = child ? CURRICULUM[child.ageGroup] : null;
  const totalModules = course ? course.modules.length : 0;
  const totalLessons = course ? course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) : 0;
  const completedLessonIds = child ? Object.keys(child.completed || {}) : [];
  const completedCount = completedLessonIds.length;
  
  const firstUncompletedLesson = course?.modules
    .flatMap(m => (m.lessons || []).map(l => ({ ...l, moduleName: m.name.en })))
    .find(l => !completedLessonIds.includes(l.id));
  const currentModuleTitle = firstUncompletedLesson
    ? firstUncompletedLesson.moduleName
    : (course?.modules[0]?.name.en || "AI Foundations");
  const currentLessonTitle = firstUncompletedLesson
    ? firstUncompletedLesson.title.en
    : (completedCount > 0 ? "Curriculum Completed!" : "None Started");
  const courseProgressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const childXp = child ? child.xp || 0 : 0;
  const streakDays = child ? child.streak_count || 0 : 0;

  const quizResultsList = child?.quizResults ? Object.values(child.quizResults) as Array<{ score: number }> : [];
  const quizAverage = quizResultsList.length > 0
    ? Math.round(quizResultsList.reduce((acc, q) => acc + (q.score || 0), 0) / quizResultsList.length)
    : 0;

  const totalQuizzes = course ? course.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.quiz && l.quiz.length > 0).length, 0) : 0;
  const quizAttempts = quizResultsList.length;

  const completedLessonsList: Array<{ title: string; timeText: string; type: string; extra?: string }> = [];
  if (child && course) {
    course.modules.forEach((m) => {
      m.lessons.forEach((l) => {
        if (completedLessonIds.includes(l.id)) {
          completedLessonsList.push({
            title: l.title[lang] || l.title["en"],
            timeText: "Completed lesson",
            type: l.type === "story" ? "Story Lesson" : l.type === "puzzle" ? "Interactive Puzzle" : "Capstone Project",
            extra: child.stars && child.stars[l.id] ? `⭐ ${child.stars[l.id]} Stars` : ""
          });
        }
      });
    });
  }

  const activeLessons = course ? course.modules.flatMap((m) => m.lessons) : [];

  const roadmapNodes = activeLessons.slice(0, 5).map((les, idx) => {
    const isCompleted = completedLessonIds.includes(les.id);
    const prevCompleted = idx === 0 || completedLessonIds.includes(activeLessons[idx - 1]?.id);
    const isActive = !isCompleted && prevCompleted;
    const isLocked = !isCompleted && !isActive;

    return {
      id: les.id,
      title: les.title[lang] || les.title["en"],
      isCompleted,
      isActive,
      isLocked,
      type: les.type
    };
  });

  const skills = child ? [
    { name: "AI Understanding", value: completedCount === 0 ? 0 : Math.min(100, Math.round(30 + completedCount * 12)), color: "#2EC4B6" },
    { name: "Problem Solving", value: completedCount === 0 ? 0 : Math.min(100, Math.round(25 + completedCount * 11)), color: "#B8A0FF" },
    { name: "Digital Confidence", value: completedCount === 0 ? 0 : Math.min(100, Math.round(40 + completedCount * 10)), color: "#FFD166" },
    { name: "Creativity", value: completedCount === 0 ? 0 : Math.min(100, Math.round(35 + completedCount * 12)), color: "#2EC4B6" },
    { name: "Tech Awareness", value: completedCount === 0 ? 0 : Math.min(100, Math.round(20 + completedCount * 14)), color: "#B8A0FF" },
    { name: "Responsible Tech Use", value: completedCount === 0 ? 0 : Math.min(100, Math.round(50 + completedCount * 9)), color: "#FFD166" },
  ] : [];

  const achievements: Array<{ name: string; emoji: string; desc: string }> = [];
  if (child) {
    if (completedCount >= 1) {
      achievements.push({ name: "AI Explorer", emoji: "🤖", desc: "First lesson completed" });
    }
    if (completedCount >= 3) {
      achievements.push({ name: "Primary Innovator", emoji: "💡", desc: "Completed 3 lessons" });
    }
    if (childXp >= 100) {
      achievements.push({ name: "XP Champion", emoji: "🏆", desc: "Earned 100+ total XP" });
    }
    const hasQuizPass = quizResultsList.some((q) => q.score >= 80);
    if (hasQuizPass) {
      achievements.push({ name: "Quiz Champion", emoji: "🎯", desc: "Scored 80%+ on any quiz" });
    }
    if (streakDays >= 5) {
      achievements.push({ name: "5 Day Streak", emoji: "🔥", desc: "Active 5 day streak" });
    }
  }

  // State flags for conditional UI layout
  const isState1 = children.length === 0;
  const isState2 = children.length > 0 && completedCount === 0;
  const isState3 = children.length > 0 && completedCount > 0;

  // Language mapping fallback dictionary
  const dict: Record<Language, Record<string, string>> = {
    en: {
      heroTitle: `Welcome Back, ${parent.name || "Parent"} 👋`,
      heroDesc: "Track your child's journey from technology consumer to future creator.",
      badgeText: "🚀 CLATS Early Access Family",
      feedbackBtn: "Share Feedback",
      learningRoadmap: "Learning Roadmap",
      roadmapDesc: "See where your child currently sits within the CLATS Future-Tech Curriculum.",
      focusTitle: "Current Learning Focus",
      pathwayName: "🤖 Artificial Intelligence Pathway",
      currentModule: "AI Discovery",
      currentLesson: "History of Technology",
      nextLesson: "History of Artificial Intelligence",
      progressText: "Lesson 1 of 10",
      moduleProgress: "Module Progress",
      statusBadge: "🟡 Curriculum In Development",
      journeyTitle: "Artificial Intelligence Journey",
      skillsGrowth: "Future-Tech Skills Growth",
      recentActivity: "Recent Learning Activity",
      insightsTitle: "CLATS Learning Insights",
      updatesTitle: "Platform Development Updates",
      achievementsTitle: "Child Achievements",
      screentimeTitle: "Screen Time Analytics",
      actionCenterTitle: "Parent Action Center",
      multiFamilyTitle: "Multi-Child Family Analytics",
      compareBtn: "Compare Child Progress",
      communityTitle: "Upcoming Parent Academy Sessions",
      logoutText: "Logout",
      adjustLimit: "Adjust controls"
    },
    yo: {
      heroTitle: `Kaabo Padà, ${parent.name || "Kolo"} 👋`,
      heroDesc: "Tọpinpin irin-ajo ọmọ rẹ lati jẹ olumulo imọ-ẹrọ si olupilẹṣẹ ọjọ iwaju.",
      badgeText: "🚀 CLATS Ẹgbẹ Wiwọle Ni Tete",
      feedbackBtn: "Fi Esi Ranṣẹ",
      learningRoadmap: "Oju-ọna Ẹkọ wa",
      roadmapDesc: "Wo ibi ti ọmọ rẹ wa ninu Eto Ẹkọ Imọ-ẹrọ CLATS ti Ọjọ Iwaju.",
      focusTitle: "Ojúfẹ́ Ẹ̀kọ́ Lọ́wọ́lọ́wọ́",
      pathwayName: "🤖 Imọ-jinlẹ Oríkĕ (AI) Ọna Ẹkọ",
      currentModule: "Awari Imọ Oríkĕ (AI)",
      currentLesson: "Itan-akọọlẹ ti Imọ-ẹrọ",
      nextLesson: "Itan Oríkĕ Imọ-jinlẹ ti (AI)",
      progressText: "Ẹkọ 1 ninu 10",
      moduleProgress: "Ilọsiwaju Module",
      statusBadge: "🟡 Program Ẹkọ Ninu Idagbasoke",
      journeyTitle: "Irin-ajo Imọ Oríkĕ (AI)",
      skillsGrowth: "Idagbasoke Imọ-ẹrọ Ọjọ Iwaju",
      recentActivity: "Iṣẹ Ẹkọ Tuntun",
      insightsTitle: "Awọn Imọye Ẹkọ CLATS",
      updatesTitle: "Awọn Imudojuiwọn Platform",
      achievementsTitle: "Awọn Aṣeyọri Ọmọ",
      screentimeTitle: "Tuntun Akoko Iboju",
      actionCenterTitle: "Gbongan Awọn Iṣẹ Obi",
      multiFamilyTitle: "Itupalẹ Ọmọ lọpọlọpọ",
      compareBtn: "Fi Ilọsiwaju Ọmọ Wé Ọmọ",
      communityTitle: "Awọn Apejọ Obi ti n bọ",
      logoutText: "Jade Kuro",
      adjustLimit: "Ṣatunṣe akoko"
    },
    ig: {
      heroTitle: `Nnọọ Nne na Nna, ${parent.name || "Nna"} 👋`,
      heroDesc: "Tuo ụzọ mmụta nwa gị site na onye na-eji teknụzụ gaa na onye nrụpụta ọhụrụ.",
      badgeText: "🚀 CLATS Ezinụlọ Nweta Mbụ",
      feedbackBtn: "Ziga Atụmatụ",
      learningRoadmap: "Map Ụzọ Mmụta",
      roadmapDesc: "Hụ ebe nwa gị nọ ugbu a n'ime mmụta teknụzụ CLATS.",
      focusTitle: "Ihe weere Onodu Omumu Ugbu a",
      pathwayName: "🤖 Ụzọ Nkà rụrụ Ọrụ (AI)",
      currentModule: "Ọmụmụ AI Discovery",
      currentLesson: "Akụkọ Ihe Mere Eme nke Teknụzụ",
      nextLesson: "Akụkọ Nkà rụrụ Ọrụ (AI)",
      progressText: "Ihe omumu 1 n'ime 10",
      moduleProgress: "Ọganihu Usoro Omumu",
      statusBadge: "🟡 Usoro Mmụta Na-etolite Etolite",
      journeyTitle: "Njem Nkà rụrụ Ọrụ (AI)",
      skillsGrowth: "Ntolite Nkà Teknụzụ Ọdịnihu",
      recentActivity: "Ihe Omume Mmụta Ọhụrụ",
      insightsTitle: "Atụmatụ Mmụta CLATS",
      updatesTitle: "Mmelite Mmụta Platform",
      achievementsTitle: "Ihe Nrite Ụmụaka",
      screentimeTitle: "Nnyonye anya Oge Nlele Ihuenyo",
      actionCenterTitle: "Ebe Ihe Omume Ndị Nne na Nna",
      multiFamilyTitle: "Nyocha Ezinụlọ nwere Ọtụtụ Ụmụ",
      compareBtn: "Tụlee Ọganihu Ha",
      communityTitle: "Nzukọ Ndị Nne na Nna Na-abịa",
      logoutText: "Pụọ",
      adjustLimit: "Mezie njikwa"
    },
    fr: {
      heroTitle: `Bon retour, ${parent.name || "Parent"} 👋`,
      heroDesc: "Suivez le parcours de votre enfant, de consommateur de technologie à futur créateur.",
      badgeText: "🚀 Famille CLATS Accès Anticipé",
      feedbackBtn: "Partager vos commentaires",
      learningRoadmap: "Feuille de route d'apprentissage",
      roadmapDesc: "Découvrez où en est votre enfant dans le programme CLATS Future-Tech.",
      focusTitle: "Focus d'apprentissage actuel",
      pathwayName: "🤖 Parcours d'Intelligence Artificielle",
      currentModule: "Découverte de l'IA",
      currentLesson: "Histoire de la Technologie",
      nextLesson: "Histoire de l'Intelligence Artificielle",
      progressText: "Leçon 1 sur 10",
      moduleProgress: "Progression du module",
      statusBadge: "🟡 Programme en cours de développement",
      journeyTitle: "Parcours d'Intelligence Artificielle",
      skillsGrowth: "Croissance des compétences Future-Tech",
      recentActivity: "Activité d'apprentissage récente",
      insightsTitle: "Aperçus d'apprentissage CLATS",
      updatesTitle: "Mises à jour du développement",
      achievementsTitle: "Réalisations de l'enfant",
      screentimeTitle: "Analyses du temps d'écran",
      actionCenterTitle: "Centre d'action des parents",
      multiFamilyTitle: "Analyses multi-enfants",
      compareBtn: "Comparer les progrès de l'enfant",
      communityTitle: "Prochaines sessions de l'Académie des Parents",
      logoutText: "Se déconnecter",
      adjustLimit: "Ajuster les contrôles"
    },
    ha: {
      heroTitle: `Barka da Dawowa, ${parent.name || "Parent"} 👋`,
      heroDesc: "Bibiyi tafiyar yaranku daga mabukaci na fasaha zuwa mahalicci na gaba.",
      badgeText: "🚀 CLATS Iyali na Farko",
      feedbackBtn: "Raba Tunaninku",
      learningRoadmap: "Taswirar Koyo",
      roadmapDesc: "Duba inda yaranku suke a cikin Tsarin Karatun CLATS na Gaba.",
      focusTitle: "Hankalin Koyon Yanzu",
      pathwayName: "🤖 Hanyar Kayan Aikin Artificial Intelligence",
      currentModule: "Gano AI",
      currentLesson: "Tarihin Fasaha",
      nextLesson: "Tarihin Artificial Intelligence",
      progressText: "Darasi 1 na 10",
      moduleProgress: "Ci gaban Module",
      statusBadge: "🟡 Tsarin Karatu Yana Haɓakawa",
      journeyTitle: "Tafiyar Artificial Intelligence",
      skillsGrowth: "Haɓaka Kwarewar Fasaha",
      recentActivity: "Ayyukan Koyon Kwanan nan",
      insightsTitle: "Hasken Koyon CLATS",
      updatesTitle: "Sabunta Tsarin Haɓakawa",
      achievementsTitle: "Nasarar Yara",
      screentimeTitle: "Nazarin Lokacin allo",
      actionCenterTitle: "Cibiyar Ayyukan Iyaye",
      multiFamilyTitle: "Nazarin Iyali Mai Yawa Yara",
      compareBtn: "Kwatanta Ci Gaban Yara",
      communityTitle: "Zaman Kwalejin Iyaye na Gaba",
      logoutText: "Fita",
      adjustLimit: "Daidaita iko"
    }
  };

  const t = dict[lang] || dict.en;

  // Modern children profiles switcher data adaptor
  const handleSwitchChild = (c: Child) => {
    setSelChild(c);
  };

  // Dynamic notifications structure based on child's data
  // Now falling back to DB notifications or a default empty state
  const notificationsList = notifications.length > 0 ? notifications : [{
    id: 0,
    title: "No Notifications",
    message: "You're all caught up! Child activity will appear here.",
    time: "Now",
    icon: "👍"
  }];

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDark ? "bg-[#0F172A] text-white" : "bg-[#FFFFFF] text-[#111111]"}`}>
      

      {/* STICKY MAIN HEADER NAV PANEL */}
      <header id="tour-parent-header" className={`sticky top-0 z-40 transition-colors duration-200 border-b px-6 py-4 ${
        isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-[#EAEAEA]"
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo Brand Frame */}
          <div className="flex items-center gap-3.5">
            <div>
              <CLATSLogo height="1.8em" />
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider block mt-1">INTELLIGENCE CENTER</span>
            </div>
          </div>



          {/* Quick Header Widget Controls (Notifications and Switcher Indicator) */}
          <div className="flex items-center gap-4">
            
            {/* Notification Drawer Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-3 rounded-2xl border transition-all ${
                  isDark ? "bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#FF4C4C] text-[10.5px] font-bold text-white shadow-sm border-2 border-white dark:border-slate-800 z-10">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className={`absolute right-0 mt-3.5 w-80 rounded-2xl border p-4 shadow-2xl z-50 transition-all ${
                  isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-base font-black uppercase tracking-wider text-slate-500">Notifications</h4>
                    <div className="flex gap-3">
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => {
                            fetch('/api/supabase/notifications', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ parent_id: parent?.id, mark_all: true })
                            }).then(() => {
                              setUnreadCount(0);
                              setNotifications(notifications.map(n => ({ ...n, is_read: true })));
                            });
                          }}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600"
                        >
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="text-base font-bold text-[#2EC4B6] hover:underline">Close</button>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {notificationsList.map((notif: any) => (
                      <div 
                        key={notif.id} 
                        className={`p-3 rounded-xl border flex gap-2.5 ${notif.is_read ? (isDark ? "bg-slate-900 border-slate-800 opacity-70" : "bg-slate-50 border-slate-200 opacity-70") : (isDark ? "bg-slate-950 border-[#2EC4B6]/30" : "bg-teal-50/30 border-teal-100")}`}
                        onClick={() => {
                          if (!notif.is_read && notif.id !== 0) {
                            fetch('/api/supabase/notifications', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ notification_id: notif.id })
                            }).then(() => {
                              setUnreadCount(Math.max(0, unreadCount - 1));
                              setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                            });
                          }
                        }}
                      >
                        <span className="text-lg">{notif.icon}</span>
                        <div>
                          <p className="text-base font-black m-0 leading-tight flex items-center gap-2">
                            {notif.title}
                            {!notif.is_read && notif.id !== 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#FF4C4C]"></span>}
                          </p>
                          <p className="text-sm text-slate-500 mt-1 leading-snug">{notif.message || notif.desc}</p>
                          <span className="text-xs text-slate-400 font-mono block mt-1">
                            {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : notif.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Child Shortcut Avatar */}
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#B8A0FF] to-[#2EC4B6] flex items-center justify-center text-white font-extrabold text-lg shadow shadow-purple-500/20">
              {(parent.name || "P")[0].toUpperCase()}
            </div>
            
          </div>

        </div>
      </header>

      {/* MAIN BODY LAYOUT */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className={`w-full lg:w-64 flex-shrink-0 flex flex-col gap-2 p-4 rounded-2xl border ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-[#EAEAEA]"}`}>
          <div className="mb-2 px-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dashboard</span>
          </div>
          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "overview" 
                ? (isDark ? "bg-[#2EC4B6]/20 text-[#2EC4B6]" : "bg-teal-50 text-teal-700") 
                : (isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50")
            }`}
          >
            <Activity size={18} />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("refer")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "refer" 
                ? (isDark ? "bg-[#B8A0FF]/20 text-[#B8A0FF]" : "bg-purple-50 text-purple-700") 
                : (isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50")
            }`}
          >
            <div className="flex items-center gap-3">
              <Share2 size={18} />
              Refer & Earn
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
              Rewards
            </span>
          </button>
        </aside>

        {/* CONTENT AREA */}
        <div className="flex-1 space-y-12 w-full min-w-0">
          {activeTab === "overview" ? (
            <>
        {/* HERO GREETING SECTION */}
        <section className={`p-8 rounded-2xl border transition-all duration-300 ${
          isDark 
            ? "bg-[#111827] border-slate-800 text-white" 
            : "bg-[#FFFFFF] border-[#EAEAEA] shadow-sm text-[#111111]"
        }`}>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight m-0">
                Welcome Back, {parent.name || "Family"}
              </h2>
              <p className={`text-sm max-w-2xl m-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {t.heroDesc}
              </p>
            </div>
            <a
              id="tour-feedback-button"
              href={feedbackFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-lg bg-[#2EC4B6] hover:bg-teal-600 text-white font-bold text-xs tracking-wide uppercase transition-colors self-start md:self-auto flex items-center gap-1.5"
            >
              <span>{t.feedbackBtn}</span>
              <ArrowRight size={13} />
            </a>
          </div>
        </section>


        {/* CHILD PROFILES SECTION */}
        <section id="tour-child-profiles" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold tracking-tight m-0">Child Pathway Trackers</h3>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Select a child to inspect active learning parameters.</p>
            </div>
            <button
              onClick={() => onNavigate("addChild")}
              className={`text-xs font-semibold py-2 px-4 rounded-lg border flex items-center gap-2 transition-all ${
                isDark ? "bg-[#111827] border-slate-800 hover:bg-slate-800" : "bg-white border-[#EAEAEA] shadow-sm hover:bg-slate-50"
              }`}
            >
              <PlusCircle size={15} className="text-[#2EC4B6]" />
              <span>Enroll Child Profile</span>
            </button>
          </div>

          {/* Children List Grid */}
          {children.length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center space-y-4 ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-[#EAEAEA]"}`}>
              <h4 className="text-base font-bold">No Child Profile Added Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Start your family's future-tech learning journey by creating your first child profile.</p>
              <button onClick={() => onNavigate("addChild")} className="px-5 py-2 rounded-lg bg-[#2EC4B6] text-white font-bold text-xs uppercase hover:bg-teal-600 transition-colors">
                Add Child Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((c) => {
                const isSelected = child?.id === c.id;
                const cXp = c.xp || 0;
                const cComp = Object.keys(c.completed || {}).length;
                const cStreak = c.streak_count || 0;
                const cCourse = CURRICULUM[c.ageGroup];
                const cTotalL = cCourse ? cCourse.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) : 10;
                const cPct = cTotalL > 0 ? Math.round((cComp / cTotalL) * 100) : 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelChild(c)}
                    className={`p-6 rounded-2xl border cursor-pointer relative overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? isDark
                          ? "bg-[#111827] border-[#2EC4B6] shadow-sm text-white"
                          : "bg-white border-2 border-[#2EC4B6] shadow-sm text-[#111111]"
                        : isDark
                          ? "bg-[#111827]/40 border-slate-800 hover:border-slate-700 text-slate-300"
                          : "bg-white border-[#EAEAEA] shadow-sm hover:border-slate-300 text-slate-800"
                    }`}
                  >
                    
                    {/* Selected Indicator Pill */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-[#2EC4B6] text-white px-3 py-1 rounded-bl-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Check size={9} strokeWidth={3} /> Active Track
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {/* Initials Avatar sphere */}
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isSelected ? "bg-[#2EC4B6]/15 text-[#2EC4B6] border border-[#2EC4B6]" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-[#EAEAEA] dark:border-slate-700"
                      }`}>
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-base font-bold tracking-tight m-0">{c.name}</h4>
                        <span className="text-[10px] font-semibold text-slate-500 font-bold block uppercase">
                          {AGE_LABEL[c.ageGroup]}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats list inside profile box */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Current Path:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{AGE_LABEL[c.ageGroup] || "AI Foundations"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Progress:</span>
                        <span className="font-bold text-[#2EC4B6]">{cPct}%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Streak:</span>
                        <span className="font-bold text-[#2EC4B6]">{cStreak} Days</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">XP Earned:</span>
                        <span className="font-bold text-[#2EC4B6]">{cXp} XP</span>
                      </div>
                    </div>

                    {/* Login Details -- lets a parent look up what this child needs to type
                        to sign in from another device, since it's only ever shown once
                        (at enrollment) otherwise. */}
                    <div
                      className={`mt-3 pt-3 border-t text-xs ${isDark ? "border-slate-800" : "border-slate-100"}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setRevealedLoginId(revealedLoginId === c.id ? null : c.id)}
                        className="w-full flex justify-between items-center text-slate-400 hover:text-[#2EC4B6] font-semibold transition-colors"
                      >
                        <span>🔑 Login Details</span>
                        <span className="text-[10px]">{revealedLoginId === c.id ? "Hide ▲" : "Show ▼"}</span>
                      </button>
                      {revealedLoginId === c.id && (
                        <div className="mt-2 space-y-1.5 font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-sans">Username</span>
                            <span className="font-bold tracking-wide">{c.username || c.name.toLowerCase().replace(/\s+/g, "_")}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-sans">PIN</span>
                            <span className="font-bold tracking-widest">{c.pin}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Action CTA */}
                    <div className="mt-5 space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEnterChildMode(c);
                        }}
                        className="w-full py-2 px-4 rounded-lg text-xs font-bold tracking-wider uppercase text-center transition-all bg-[#2EC4B6]/10 text-[#2EC4B6] border border-[#2EC4B6]/20 hover:bg-[#2EC4B6] hover:text-white flex items-center justify-center gap-1.5"
                      >
                        <span>Enter Child Portal</span>
                        <ArrowRight size={12} />
                      </button>

                      {!c.is_premium ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPaywall(c);
                          }}
                          className="w-full bg-gradient-to-r from-[#2EC4B6] to-teal-400 hover:to-teal-500 text-white rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-teal-500/20 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Crown size={12} /> Upgrade {c.name}
                        </button>
                      ) : (
                        <div className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 opacity-90 cursor-default">
                          <Crown size={12} /> Premium Active
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>


        {/* MAIN DOCK: CURRICULUM ROADMAP SECTION */}
        {child && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT 5 COLS: CURRICULUM OVERVIEW SECTION */}
            <div id="tour-current-path" className="lg:col-span-12 xl:col-span-5 space-y-6">
              <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="space-y-1 mb-6">
                  <span className="h-6 w-6 rounded bg-[#B8A0FF]/15 text-[#B8A0FF] text-xs font-black flex items-center justify-center font-mono">MAP</span>
                  <h3 className="text-xl font-extrabold tracking-tight m-0">{t.learningRoadmap}</h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t.roadmapDesc}</p>
                </div>

                {/* VISUAL ROADMAP LISTING */}
                <div id="tour-pathway-progress" className="space-y-4 relative before:absolute before:top-4 before:bottom-4 before:left-7 before:w-1 before:bg-slate-400/20">
                  {(() => {
                    const activeModuleIndex = course?.modules.findIndex(mod => mod.lessons.length > 0 && !mod.lessons.every(l => completedLessonIds.includes(l.id)));
                    const finalActiveModuleIndex = activeModuleIndex === undefined || activeModuleIndex === -1 ? -1 : activeModuleIndex;
                    return course?.modules.map((mod, idx) => {
                      const hasLessons = mod.lessons.length > 0;
                      const isCompleted = hasLessons && mod.lessons.every(l => completedLessonIds.includes(l.id));
                      const isActive = idx === finalActiveModuleIndex;
                      const moduleName = mod.name[lang as keyof typeof mod.name] || mod.name.en;

                    if (isActive) {
                      return (
                        <div key={mod.id} className={`relative p-4.5 rounded-xl border flex items-center gap-4 transition-all ${
                          isDark ? "bg-[#2EC4B6]/10 border-[#2EC4B6]/30 text-white" : "bg-teal-50/70 border-[#2EC4B6]/40 text-slate-950"
                        }`}>
                          <div className="h-14 w-14 rounded-full bg-[#2EC4B6] text-white flex items-center justify-center font-black text-2xl z-10 shadow-md shadow-teal-500/20">
                            {mod.badge.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-black tracking-tight leading-tight m-0">{moduleName}</h4>
                            <p className="text-base text-teal-600 mt-1.5 font-bold m-0 font-mono">Active Focus</p>
                          </div>
                          <span className="px-2.5 py-1 bg-[#2EC4B6]/20 text-[#2EC4B6] rounded text-xs font-black uppercase font-mono hidden sm:inline-block">Current Module</span>
                        </div>
                      );
                    } else if (isCompleted) {
                      return (
                        <div key={mod.id} className={`relative p-4 rounded-xl border flex items-center gap-4 ${
                          isDark ? "bg-[#B8A0FF]/10 border-[#B8A0FF]/30 text-white" : "bg-purple-50/70 border-[#B8A0FF]/40 text-slate-900"
                        }`}>
                          <div className="h-14 w-14 rounded-full bg-[#B8A0FF] text-white flex items-center justify-center font-black text-xl z-10 shadow-md">
                            ✅
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold leading-tight m-0 opacity-80 line-through decoration-2 decoration-[#B8A0FF]">{moduleName}</h4>
                            <p className="text-sm text-[#B8A0FF] mt-1.5 font-bold m-0 font-mono">Completed</p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={mod.id} className={`relative p-4 rounded-xl border flex items-center gap-4 ${
                          isDark ? "bg-slate-950/40 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-200/60 text-slate-600"
                        }`}>
                          <div className="h-14 w-14 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center font-black text-2xl z-10 opacity-50">
                            {mod.badge.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold leading-tight m-0 opacity-60">{moduleName}</h4>
                            <p className="text-sm text-[#FFD166] mt-1.5 font-bold m-0 font-mono">Coming Soon</p>
                          </div>
                        </div>
                      );
                    }
                  })
                  })()}
                </div>
              </div>

              {/* OUTCOME REPORT: AI PATHWAY PROGRESS CARD */}
              <div id="tour-learning-progress" className={`p-6 rounded-2xl border shadow-sm ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <h4 className="text-sm font-extrabold uppercase mt-0 mb-4 tracking-wider text-slate-400 font-mono">{t.journeyTitle}</h4>
                
                {(() => {
                  const courseProgressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                  const completedMods = course ? course.modules.filter(m => m.lessons.some(l => completedLessonIds.includes(l.id))).length : 0;
                  const totalProj = course ? course.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.type === 'project').length, 0) : 0;
                  const completedProj = course ? course.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.type === 'project' && completedLessonIds.includes(l.id)).length, 0) : 0;

                  return (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Custom built Progress radial circle */}
                      <div className="relative h-28 w-28 flex items-center justify-center flex-shrink-0">
                        <svg className="h-full w-full transform -rotate-90 z-10" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke={isDark ? "rgba(255,255,255,0.05)" : "#E2E8F0"} strokeWidth="8" fill="transparent" />
                          <circle cx="50" cy="50" r="40" stroke="#B8A0FF" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * courseProgressPct) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-[#B8A0FF]">{courseProgressPct}%</span>
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 font-mono">Completion</span>
                        </div>
                      </div>

                      {/* Quantitative indicators list */}
                      <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                        <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Modules</span>
                          <strong className="text-base text-white dark:text-slate-100 font-extrabold">{completedMods} <span className="text-xs text-slate-400">/ {totalModules}</span></strong>
                        </div>
                        <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Lessons</span>
                          <strong className="text-base text-[#2EC4B6] font-extrabold">{completedCount} <span className="text-xs text-slate-400">/ {totalLessons}</span></strong>
                        </div>
                        <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Quizzes</span>
                          <strong className="text-base text-[#FFD166] font-extrabold">{quizAttempts} <span className="text-xs text-slate-400">/ {totalQuizzes}</span></strong>
                        </div>
                        <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Projects</span>
                          <strong className="text-base text-[#B8A0FF] font-extrabold">{completedProj} <span className="text-xs text-slate-400">/ {totalProj || 1}</span></strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>

            {/* RIGHT 7 COLS: CURRENT COGNITIVE TIMELINE MAP CONTAINER */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* CURRENT PATHWAY INFORMATION: LEARNING JOURNEY CARD */}
              <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-[#EAEAEA]"}`}>
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0 font-mono">Learning Journey Card</h4>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Track</span>
                      <strong className={`text-sm font-bold block mt-1 ${isDark ? "text-white" : "text-[#111111]"}`}>
                        {course?.title.en || "Artificial Intelligence"}
                      </strong>
                    </div>

                    <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Current Module</span>
                      <strong className={`text-sm font-bold block mt-1 ${isDark ? "text-white" : "text-[#111111]"}`}>
                        {currentModuleTitle}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Current Lesson</span>
                      <strong className={`text-sm font-bold block mt-1 ${isDark ? "text-white" : "text-[#111111]"}`}>
                        {currentLessonTitle}
                      </strong>
                    </div>

                    <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Progress</span>
                      <strong className="text-sm font-bold block mt-1 text-[#2EC4B6]">{courseProgressPct}%</strong>
                    </div>
                  </div>

                  {/* Modern progress bar with Turquoise fill */}
                  <div className="space-y-2 pt-2">
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#2EC4B6] transition-all duration-500" style={{ width: `${courseProgressPct}%` }} />
                    </div>
                  </div>

                </div>
              </div>

              {/* DUOLINGO MAP PATHWAY: LESSON MAP PROGRESS */}
              <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-extrabold uppercase tracking-wide tracking-wider m-0 font-mono text-[#B8A0FF]">AI DISCOVERY ROADMAP</h3>
                  </div>
                  <Compass size={30} className="text-[#B8A0FF]" />
                </div>

                {/* VISUAL CANDY-CRUSH / DUOLINGO STYLE PATHWAY NODES */}
                <div className="flex flex-col items-center justify-center space-y-10 relative py-4">
                  
                  {/* Flow curve connection line */}
                  <div className="absolute top-8 bottom-8 left-1/2 w-1.5 bg-gradient-to-b from-[#2EC4B6] via-[#B8A0FF] to-slate-400/20 transform -translate-x-1/2 z-0" />

                  {roadmapNodes.length === 0 ? (
                    <div className="text-center p-6 text-slate-400 font-mono text-xs">
                      No roadmap lessons discovered.
                    </div>
                  ) : (
                    roadmapNodes.map((node, idx) => {
                      const offsetClass = ["translate-x-3", "-translate-x-5", "translate-x-6", "-translate-x-4", "translate-x-2"][idx % 5];
                      
                      if (node.isCompleted) {
                        return (
                          <div key={node.id} className={`flex flex-col items-center relative z-10 transform ${offsetClass} transition-transform hover:scale-110`}>
                            <div className="h-20 w-20 rounded-full bg-green-500 border-4 border-white/15 dark:border-slate-900 text-white flex items-center justify-center text-3xl shadow-lg shadow-green-500/20 font-bold">
                              ✓
                            </div>
                            <div className={`mt-2 px-3 py-1.5 rounded-xl text-xs font-extrabold border bg-green-500/10 border-green-500/30 text-green-500 text-center shadow-sm`}>
                              {node.title}
                            </div>
                          </div>
                        );
                      } else if (node.isActive) {
                        return (
                          <div key={node.id} className={`flex flex-col items-center relative z-10 transform ${offsetClass} transition-transform hover:scale-110`}>
                            <div className="h-22 w-22 rounded-full bg-[#2EC4B6] border-4 border-white/15 dark:border-slate-900 text-black flex items-center justify-center text-4xl shadow-xl shadow-teal-500/30 font-bold animate-bounce">
                              🟢
                            </div>
                            <div className="absolute -top-3 px-2.5 py-1 bg-[#B8A0FF] text-slate-950 font-black text-[9px] rounded uppercase font-mono tracking-widest leading-none">
                              Active
                            </div>
                            <div className={`mt-2 px-3 py-1.5 rounded-xl text-xs font-extrabold border bg-[#2EC4B6]/15 border-[#2EC4B6]/50 text-[#2EC4B6] text-center shadow-sm`}>
                              {node.title}
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={node.id} className={`flex flex-col items-center relative z-10 transform ${offsetClass} transition-transform hover:scale-115`}>
                            <div className="h-19 w-19 rounded-full bg-slate-400/20 border-4 border-slate-700/10 text-slate-400 flex items-center justify-center text-3xl">
                              <Lock size={22} />
                            </div>
                            <div className={`mt-2 px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-400 text-center`}>
                              🔒 {node.title}
                            </div>
                          </div>
                        );
                      }
                    })
                  )}

                  {/* Horizontal node grids to pack the other lessons */}
                  {activeLessons.length > 5 && (
                    <div className="w-full border-t border-dashed border-slate-400/10 pt-6 mt-4">
                      <p className="text-center text-xs uppercase font-mono tracking-wider text-slate-400 font-bold mb-4">Remaining Module Roadmap</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeLessons.slice(5).map((les) => {
                          const isCompleted = completedLessonIds.includes(les.id);
                          const title = les.title[lang] || les.title["en"];
                          return (
                            <div key={les.id} className={`p-3 rounded-lg border text-center text-xs font-bold ${
                              isCompleted
                                ? "bg-green-500/10 border-green-500/20 text-green-500"
                                : isDark ? "bg-slate-950/40 border-slate-850/60 text-slate-500" : "bg-slate-50 border-slate-200/50 text-slate-400"
                            }`}>
                              {isCompleted ? `✓ ${title}` : `🔒 ${title}`}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>

          </section>
        )}


        {/* ACADEMIC SKILL DEVELOPMENT DASHBOARD */}
        {!isState1 && (
          <section className="space-y-4">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight m-0">{t.skillsGrowth}</h3>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Bento-grid academic assessment across future cognitive milestones.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {skills.map((skill, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all hover:scale-103 ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold uppercase font-mono text-[10px] tracking-wider" style={{ color: skill.color }}>
                      {skill.name}
                    </span>
                    <span className="h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center" style={{ backgroundColor: `${skill.color}1A`, color: skill.color }}>
                      {skill.value}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-black m-0 animate-fade-in">
                      {skill.value === 0 
                        ? "Beginner" 
                        : skill.value >= 75 
                          ? "Exceptional" 
                          : skill.value >= 50 
                            ? "Advanced" 
                            : "Capable"}
                    </p>
                    <div className="h-2 w-full bg-slate-400/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${skill.value}%`, backgroundColor: skill.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* RECENT HISTORIC LEARNING TIMELINE */}
        {!isState1 && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            
            {/* LEFT COLUMN: ACTIVITY CARDS */}
            <div id="tour-recent-activity" className={`p-6 rounded-2xl border shadow-sm ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-extrabold uppercase tracking-wider m-0 font-mono text-[#2EC4B6]">{t.recentActivity}</h3>
                <Activity size={20} className="text-[#2EC4B6]" />
              </div>

              {completedLessonsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
                  <div className="text-4xl text-slate-400">🫙</div>
                  <p className="text-xs text-slate-500 max-w-sm m-0 leading-relaxed font-mono">
                    No Recent Activity. Live study sessions, companion interactions, and quiz logs will show up here as they occur.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:top-2 before:bottom-2 before:left-3.5 before:w-0.5 before:bg-slate-400/20">
                  {completedLessonsList.map((evt, idx) => (
                    <div key={idx} className="relative pl-8 space-y-1.5 transition-all">
                      <span className="absolute left-1.5 top-1.5 h-4.5 w-4.5 rounded-full bg-[#2EC4B6]/30 border-4 border-[#2EC4B6] z-10" />
                      <span className="text-[10px] uppercase font-mono text-[#2EC4B6] block font-extrabold">★ Complete</span>
                      <h4 className="text-sm font-extrabold m-0 leading-tight text-slate-800 dark:text-white">{evt.title}</h4>
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono mt-1">
                        <span className="px-2 py-0.5 bg-green-500/15 text-green-500 rounded font-bold">{evt.type}</span>
                        {evt.extra && <span className="px-2 py-0.5 bg-amber-500/15 text-amber-500 rounded font-bold">{evt.extra}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: LEARNING RECOMMENDATIONS & INSIGHTS */}
            <div id="tour-parent-insights" className={`p-6 rounded-2xl border shadow-sm ${
              isDark 
                ? "bg-[#111827] border-slate-800" 
                : "bg-white border-[#EAEAEA]"
            }`}>
              {isState2 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
                  <div className="text-5xl">🚀</div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white m-0">Ready to Start Learning</h4>
                  <p className="text-xs text-slate-500 max-w-md m-0 leading-relaxed">
                    Login to the Child Portal as <strong>{child?.name}</strong> to explore future-tech lessons. Once lessons are completed, academic insights and learning reports will populate here.
                  </p>
                  <button
                    onClick={() => child && onEnterChildMode(child)}
                    className="px-5 py-2.5 rounded-xl bg-[#2EC4B6] hover:bg-teal-600 text-white font-bold text-xs uppercase transition-colors tracking-wider"
                  >
                    Launch Child Portal
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[#2EC4B6]/10 rounded-lg text-[#2EC4B6]">
                      <Activity size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold uppercase m-0 font-mono text-[#2EC4B6] tracking-wider">AI Learning Insights</h3>
                      <p className={`text-[10px] font-mono m-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Dynamic Coaching Analytics</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border-l-4 border-[#2EC4B6] ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <p className={`text-xs m-0 leading-relaxed ${isDark ? "text-white" : "text-black"}`}>
                        <strong className="text-[#2EC4B6] font-bold">{child?.name}</strong> has successfully completed <strong className="text-[#2EC4B6] font-bold">{completedCount}</strong> future-tech learning milestones.
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl border-l-4 border-[#B8A0FF] ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <p className={`text-xs m-0 leading-relaxed ${isDark ? "text-white" : "text-black"}`}>
                        Enrolled in the <strong>{child ? (AGE_LABEL[child.ageGroup] || "CLATS") : "CLATS"}</strong> Track, carrying <strong className="text-[#B8A0FF] font-bold">{childXp} XP</strong> with an active study streak of <strong className="text-[#B8A0FF] font-bold">{streakDays} days</strong>.
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl border-l-4 border-[#FFD166] ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <p className={`text-xs m-0 leading-relaxed ${isDark ? "text-white" : "text-black"}`}>
                        Quiz success rate stands at <strong className="text-amber-500 font-bold">{quizAttempts === 0 ? "0%" : `${quizAverage}%`}</strong> across <strong className="text-amber-500 font-bold">{quizAttempts}</strong> submitted assessments.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

          </section>
        )}


        {/* ACHIEVEMENTS GRID CARDS */}
        {!isState1 && (
          <section className="grid grid-cols-1 gap-8 animate-fade-in">
            {/* MODERN ACHIEVEMENTS GRID CARDS */}
            <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className="text-base font-extrabold uppercase tracking-wider mt-0 mb-4 font-mono text-[#B8A0FF]">{t.achievementsTitle}</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {achievements.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-500 font-mono">
                    No achievements unlocked yet. Complete lessons in the Child Portal to earn future-tech badges!
                  </div>
                ) : (
                  achievements.map((badge, idx) => (
                    <div key={idx} className={`p-3.5 rounded-xl border text-center space-y-2 hover:scale-105 transition-all ${
                      isDark ? "bg-slate-950/60 border-slate-850" : "bg-slate-50 border-slate-200/50"
                    }`}>
                      <span className="text-3xl block">{badge.emoji}</span>
                      <strong className="text-[10px] font-black uppercase tracking-tight block text-slate-800 dark:text-slate-200">{badge.name}</strong>
                      <span className="text-[9px] text-slate-400 block leading-tight">{badge.desc}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </section>
        )}


        {/* SCREEN TIME & PERFORMANCE KPI CARDS */}
        {!isState1 && (
          <section className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-[#2EC4B6]" />
              <h3 className="text-base font-bold uppercase m-0 font-mono tracking-wider text-[#2EC4B6]">Analytics Summary</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              
              {/* KPI CARD 1: LEARNING TIME */}
              <div className={`p-6 rounded-2xl border relative overflow-hidden transition-all duration-300 ${isDark ? "bg-[#111827] border-slate-800" : "bg-[#F9FAFB] border-[#EAEAEA] shadow-sm hover:shadow-md"}`}>
                <div className="absolute top-0 left-0 h-1 w-full bg-[#2EC4B6]" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Learning Time</span>
                    <strong className={`text-2xl font-black block mt-1 ${isDark ? "text-white" : "text-[#111111]"}`}>{computedMinsToday} mins Today</strong>
                    <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-mono">
                      <span>Week: <strong className="text-[#2EC4B6]">{weeklyMins}m</strong></span>
                      <span>Total: <strong className="text-[#2EC4B6]">{totalMins}m</strong></span>
                    </div>
                  </div>
                  <div className="p-2 bg-[#2EC4B6]/10 rounded-lg text-[#2EC4B6]">
                    <Clock size={16} />
                  </div>
                </div>
              </div>

              {/* KPI CARD 2: LESSONS COMPLETED */}
              <div className={`p-6 rounded-2xl border relative overflow-hidden transition-all duration-300 ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-[#EAEAEA] shadow-sm hover:shadow-md"}`}>
                <div className="absolute top-0 left-0 h-1 w-full bg-[#2EC4B6]" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Lessons Completed</span>
                    <strong className={`text-2xl font-black block mt-2 ${isDark ? "text-white" : "text-[#111111]"}`}>
                      {completedCount} / {totalLessons}
                    </strong>
                  </div>
                  <div className="p-2 bg-[#2EC4B6]/10 rounded-lg text-[#2EC4B6]">
                    <BookOpen size={16} />
                  </div>
                </div>
              </div>

              {/* KPI CARD 3: QUIZ AVERAGE */}
              <div className={`p-6 rounded-2xl border relative overflow-hidden transition-all duration-300 ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-[#EAEAEA] shadow-sm hover:shadow-md"}`}>
                <div className="absolute top-0 left-0 h-1 w-full bg-[#2EC4B6]" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Quiz Average</span>
                    <strong className={`text-2xl font-black block mt-2 ${isDark ? "text-white" : "text-[#111111]"}`}>
                      {quizAttempts === 0 ? "0%" : `${quizAverage}%`}
                    </strong>
                  </div>
                  <div className="p-2 bg-[#2EC4B6]/10 rounded-lg text-[#2EC4B6]">
                    <Award size={16} />
                  </div>
                </div>
              </div>

              {/* KPI CARD 4: CURRENT STREAK */}
              <div className={`p-6 rounded-2xl border relative overflow-hidden transition-all duration-300 ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-[#EAEAEA] shadow-sm hover:shadow-md"}`}>
                <div className="absolute top-0 left-0 h-1 w-full bg-[#2EC4B6]" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Current Streak</span>
                    <strong className={`text-2xl font-black block mt-2 ${isDark ? "text-white" : "text-[#111111]"}`}>{streakDays} Days</strong>
                  </div>
                  <div className="p-2 bg-[#2EC4B6]/10 rounded-lg text-[#2EC4B6]">
                    <Flame size={16} />
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}


        {/* PARENT ACTION CENTER & MULTI-CHILD STATS */}
        <section className={`grid grid-cols-1 ${!isState1 && children.length > 1 ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-8 animate-fade-in`}>
          
          {/* COLUMN 1: PARENT ACTION CENTER */}
          <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <h3 className="text-lg font-extrabold uppercase mt-0 mb-4 tracking-wider font-mono text-[#B8A0FF]">{t.actionCenterTitle}</h3>
            
            <div className="space-y-4">
              <a
                href={feedbackFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-xl border flex items-center justify-between text-base font-semibold hover:translate-x-1.5 transition-all text-left ${
                  isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700" : "bg-slate-50 border-slate-150 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">📩 Submit Feedback Form</span>
                <ChevronRight size={18} className="text-slate-400" />
              </a>

              <button
                onClick={() => onNavigate("community")}
                className={`w-full p-4 rounded-xl border flex items-center justify-between text-base font-semibold hover:translate-x-1.5 transition-all text-left ${
                  isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700" : "bg-slate-50 border-slate-150 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">👥 Join Parent Tech Community</span>
                <ChevronRight size={18} className="text-slate-400" />
              </button>

              <button
                onClick={generateAiInsight}
                className={`w-full p-4 rounded-xl border flex items-center justify-between text-base font-semibold hover:translate-x-1.5 transition-all text-left ${
                  isDark 
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:border-indigo-500/50" 
                    : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>✨</span> Generate AI Progress Analysis
                </span>
                <ChevronRight size={18} className="text-indigo-400" />
              </button>

              <button
                onClick={async () => {
                  if (!child) {
                    showToast("Please select a child first.");
                    return;
                  }
                  showToast(`Generating Smart Report for ${child.name}...`);

                  // Fetch AI Insight
                  let fetchedInsight = null;
                  try {
                    const res = await fetch("/api/ai/generate-insight", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ childId: child.id }),
                    });
                    const data = await res.json();
                    if (data.insight) {
                      fetchedInsight = data.insight;
                      if (data.cached) {
                        showToast("Using today's report. AI analysis can only be generated once a day.");
                      }
                    }
                  } catch (e) {}

                  // Get the freshest child data from Supabase if available
                  let freshChild = child;
                  if (parent?.email) {
                    try {
                      const fresh = await pullParentFromSupabase(parent.email);
                      if (fresh) {
                        freshChild = fresh.children?.find((c: any) => c.id === child.id) || child;
                      }
                    } catch {}
                  }
                  downloadProgressReportImage(parent, freshChild, fetchedInsight);
                }}
                className={`w-full p-4 rounded-xl border flex items-center justify-between text-base font-semibold hover:translate-x-1.5 transition-all text-left ${
                  isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700" : "bg-slate-50 border-slate-150 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">🖼️ Download {child?.name ? `${child.name}'s` : ""} AI Smart Report</span>
                <ChevronRight size={18} className="text-slate-400" />
              </button>

              <a
                href="mailto:support@clats.org?subject=Book Parent-Teacher Tech Workshop"
                className={`w-full p-4 rounded-xl border flex items-center justify-between text-base font-semibold hover:translate-x-1.5 transition-all text-left ${
                  isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700" : "bg-slate-50 border-slate-150 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">🎓 Book Parent-Teacher Tech Workshop</span>
                <ChevronRight size={18} className="text-slate-400" />
              </a>

              <button
                id="tour-settings-button"
                onClick={() => onNavigate("settings")}
                className={`w-full p-4 rounded-xl border flex items-center justify-between text-base font-semibold hover:translate-x-1.5 transition-all text-left ${
                  isDark ? "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700" : "bg-slate-50 border-slate-150 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">⚙ Manage Child Guards & Settings</span>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            </div>
          </div>


        </section>


        {/* COMMUNITY CORNER */}
        <section id="tour-community-hub" className={`p-6 rounded-2xl border shadow-sm ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-[#EAEAEA]"}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold uppercase m-0 tracking-wider font-mono text-[#2EC4B6]">Parent Community Hub</h3>
            <Users size={18} className="text-[#2EC4B6]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {communityEvents.length === 0 ? (
              <div className="col-span-3 text-center p-6 border border-dashed rounded-xl border-slate-300 text-slate-500 text-sm">
                No active community events or resources right now. Check back later!
              </div>
            ) : (
              communityEvents.map(card => (
                <div 
                  key={card.id} 
                  onClick={() => setSelectedEvent(card)}
                  className={`p-5 rounded-xl border flex flex-col justify-between cursor-pointer transition-colors hover:border-[#2EC4B6]/40 ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}
                >
                  <div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider block ${card.tag_color || "text-slate-400"}`}>{card.tag}</span>
                    <h4 className="text-sm font-bold mt-2 leading-snug">{card.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{card.description}</p>
                  </div>
                  {card.event_datetime && (
                    <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800 flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <Calendar size={12} />
                        <span>{new Date(card.event_datetime).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRSVP(card.id); }}
                          disabled={rsvpedEvents.includes(card.id)}
                          className={`flex-1 py-1.5 rounded text-[10px] font-bold tracking-wide uppercase transition-colors ${
                            rsvpedEvents.includes(card.id) 
                              ? "bg-slate-100 text-slate-400 dark:bg-slate-800" 
                              : "bg-[#2EC4B6]/10 text-[#2EC4B6] hover:bg-[#2EC4B6]/20"
                          }`}
                        >
                          {rsvpedEvents.includes(card.id) ? "RSVP'd" : "RSVP Now"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const start = new Date(card.event_datetime);
                            const end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour
                            const formatGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
                            const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(card.title)}&details=${encodeURIComponent(card.description)}&dates=${formatGCal(start)}/${formatGCal(end)}`;
                            window.open(url, '_blank');
                          }}
                          className="px-3 py-1.5 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                          title="Add to Google Calendar"
                        >
                          <Calendar size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate("community")}
            className="mt-6 w-full py-2.5 rounded-lg bg-[#2EC4B6]/10 hover:bg-[#2EC4B6] hover:text-white border border-[#2EC4B6]/20 transition-all text-[#2EC4B6] font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2"
          >
            <span>Open Parent Community Hub</span>
            <ArrowRight size={13} />
          </button>
        </section>


        {/* SETTINGS UTILITIES FOOTER BAR */}
        <section className={`pt-8 border-t transition-colors duration-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 ${
          isDark ? "border-slate-850" : "border-slate-200"
        }`}>
          
          {/* A. Language switcher */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-[#2EC4B6]" />
              <h4 className="text-sm font-black uppercase tracking-wider m-0 font-mono">Language</h4>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { code: "en" as const, label: "EN" }
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => onLanguageChange(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border transition-all ${
                    lang === l.code
                      ? "bg-[#2EC4B6]/15 border-[#2EC4B6] text-[#2EC4B6] font-extrabold"
                      : isDark
                        ? "bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-200"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  English
                </button>
              ))}
            </div>
          </div>

          {/* B. Presentation theme mode */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sun size={18} className="text-[#B8A0FF]" />
              <h4 className="text-sm font-black uppercase tracking-wider m-0 font-mono">Theme Presentation</h4>
            </div>
            <button
              onClick={onToggleTheme}
              className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-850" 
                  : "bg-white border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50"
              }`}
            >
              {isDark ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-[#B8A0FF]" />}
              <span>{isDark ? "Light Presentation" : "Dark Presentation"}</span>
            </button>
          </div>

          {/* C. Guard limits */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#FFD166]" />
              <h4 className="text-sm font-black uppercase tracking-wider m-0 font-mono">Study Time Limit</h4>
            </div>
            <p className="text-xs text-slate-500 m-0">Daily Limit: <strong>60 Minutes</strong></p>
            <button onClick={() => onNavigate("settings")} className="text-xs font-black text-[#2EC4B6] hover:underline flex items-center gap-1">
              <span>{t.adjustLimit}</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {/* D. Session Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-[#2EC4B6]" />
              <h4 className="text-sm font-black uppercase tracking-wider m-0 font-mono">Session controls</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onNavigate("settings")}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  isDark ? "bg-slate-950/30 border-slate-800 text-slate-300" : "bg-white border-slate-250 text-slate-800 shadow-sm hover:bg-slate-50"
                }`}
              >
                Settings
              </button>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl border border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>

        </section>
            </>
          ) : (
            <>
              {/* REFER & EARN TAB */}
              <section className={`p-12 rounded-2xl border ${isDark ? "bg-[#111827] border-slate-800 text-white" : "bg-[#FFFFFF] border-[#EAEAEA] text-[#111111]"}`}>
                <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto">
                 <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 relative">
                   <Share2 size={40} />
                   <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg px-2 py-1 text-[10px] font-black text-white uppercase shadow-sm">
                     Soon
                   </div>
                 </div>
                 
                 <div className="space-y-3">
                   <h2 className="text-3xl font-extrabold tracking-tight m-0">Give a Month, Get a Month!</h2>
                   <p className={`text-sm md:text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                     We are putting the finishing touches on our new Referral Program. Soon, you'll be able to invite friends, give them their first month free, and earn unlimited free Premium months for your own family!
                   </p>
                 </div>

                 <div className={`mt-8 px-6 py-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"} flex items-center gap-4`}>
                    <Clock size={24} className="text-amber-500" />
                    <div className="text-left">
                      <div className="text-sm font-bold">Coming Soon</div>
                      <div className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Check back in a few weeks to start earning rewards!</div>
                    </div>
                 </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* FOOTER POLICIES COGNITIVE FRAME */}
      <footer className={`py-8 mt-12 text-center text-[10px] font-mono border-t ${
        isDark ? "bg-slate-950 border-slate-900 text-slate-600" : "bg-slate-100 border-slate-200 text-slate-500"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center gap-4">
          <span>© 2026 CLATS Future Tech Academy. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="/help" className="hover:underline">Help Center</a>
            <a href="/privacy" className="hover:underline">Privacy Policy</a>
            <a href="/terms" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white font-mono text-xs px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/50 flex items-center gap-3 animate-fade-in">
          <span className="text-teal-400 font-extrabold">🔔</span>
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* EVENT MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}></div>
          <div className={`relative w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isDark ? "bg-slate-900 border border-slate-800" : "bg-white"}`}>
            
            {/* Modal Header */}
            <div className={`px-6 py-5 border-b flex justify-between items-start ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div>
                <span className={`text-xs font-black uppercase tracking-widest ${selectedEvent.tag_color || "text-[#2EC4B6]"}`}>
                  {selectedEvent.tag}
                </span>
                <h2 className={`text-2xl font-black mt-2 leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  {selectedEvent.title}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className={`p-2 rounded-full transition-colors ${isDark ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedEvent.event_datetime && (
                <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${isDark ? "bg-slate-950/50" : "bg-slate-50"}`}>
                  <div className={`p-3 rounded-lg ${isDark ? "bg-[#2EC4B6]/20 text-[#2EC4B6]" : "bg-[#2EC4B6]/10 text-[#2EC4B6]"}`}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date & Time</div>
                    <div className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                      {new Date(selectedEvent.event_datetime).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}

              <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {selectedEvent.description}
              </div>
            </div>

            {/* Modal Footer / Actions */}
            <div className={`p-6 border-t flex flex-col sm:flex-row gap-3 ${isDark ? "border-slate-800 bg-slate-950/30" : "border-slate-100 bg-slate-50"}`}>
              <button
                onClick={() => {
                  handleRSVP(selectedEvent.id);
                  if (rsvpedEvents.includes(selectedEvent.id)) setSelectedEvent(null);
                }}
                disabled={rsvpedEvents.includes(selectedEvent.id)}
                className={`flex-1 py-3.5 rounded-xl font-bold tracking-wide uppercase transition-all ${
                  rsvpedEvents.includes(selectedEvent.id) 
                    ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" 
                    : "bg-[#2EC4B6] text-white hover:bg-[#25A79B] shadow-lg shadow-[#2EC4B6]/20"
                }`}
              >
                {rsvpedEvents.includes(selectedEvent.id) ? "You're Going!" : "RSVP For Event"}
              </button>

              {selectedEvent.event_datetime && (
                <button
                  onClick={() => {
                    const start = new Date(selectedEvent.event_datetime);
                    const end = new Date(start.getTime() + 60 * 60 * 1000);
                    const formatGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
                    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedEvent.title)}&details=${encodeURIComponent(selectedEvent.description)}&dates=${formatGCal(start)}/${formatGCal(end)}`;
                    window.open(url, '_blank');
                  }}
                  className={`px-5 py-3.5 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${
                    isDark ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                  }`}
                >
                  <Calendar size={18} />
                  <span>Add to Calendar</span>
                </button>
              )}
            </div>
            
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !loadingAi && setShowAiModal(false)} />
          <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isDark ? "bg-[#111827] border border-slate-800" : "bg-white"}`}>
            
            <div className={`p-6 border-b flex items-center justify-between ${isDark ? "border-slate-800 bg-indigo-500/10" : "border-indigo-100 bg-indigo-50"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner ${isDark ? "bg-indigo-900/50" : "bg-white"}`}>✨</div>
                <div>
                  <h3 className={`font-black text-lg m-0 ${isDark ? "text-indigo-300" : "text-indigo-700"}`}>AI Progress Analysis</h3>
                  <p className={`text-xs font-semibold m-0 ${isDark ? "text-indigo-400/60" : "text-indigo-500/70"}`}>Powered by Meta Llama 3</p>
                </div>
              </div>
              {!loadingAi && (
                <button onClick={() => setShowAiModal(false)} className={`p-2 rounded-full transition-colors ${isDark ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}>
                  ✕
                </button>
              )}
            </div>

            <div className="p-6">
              {loadingAi ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">🤖</div>
                  </div>
                  <p className={`text-sm font-semibold animate-pulse ${isDark ? "text-slate-400" : "text-slate-500"}`}>Analyzing {child?.name}'s progress data...</p>
                </div>
              ) : aiInsight ? (
                <div className="space-y-6">
                  <div className={`p-4 rounded-xl ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Weekly Summary</h4>
                    <p className={`text-sm leading-relaxed ${isDark ? "text-slate-200" : "text-slate-700"}`}>{aiInsight.summary}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"}`}>
                      <h4 className="text-xs uppercase tracking-wider font-bold text-green-500 mb-2">Top Strength 🌟</h4>
                      <p className={`text-sm leading-relaxed ${isDark ? "text-green-200" : "text-green-800"}`}>{aiInsight.strength}</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                      <h4 className="text-xs uppercase tracking-wider font-bold text-amber-500 mb-2">Focus Area 🎯</h4>
                      <p className={`text-sm leading-relaxed ${isDark ? "text-amber-200" : "text-amber-800"}`}>{aiInsight.focusArea}</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"}`}>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-indigo-500 mb-2">Action For Parents 💬</h4>
                    <p className={`text-sm leading-relaxed font-semibold ${isDark ? "text-indigo-200" : "text-indigo-900"}`}>"{aiInsight.parentAction}"</p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-red-500">Failed to load insight.</div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {showPaywall && (
        <PaywallModal
          parentEmail={parent.email}
          childId={showPaywall.id}
          childName={showPaywall.name}
          isDark={isDark}
          onClose={() => setShowPaywall(null)}
          onSuccess={() => {
            const upgradedChild = showPaywall.name;
            setShowPaywall(null);
            showToast(`Payment Successful! ${upgradedChild} is now a Premium Member 👑`);
            if (onRefreshParent) {
              const updatedChildren = parent.children?.map(c => 
                c.id === showPaywall.id ? { ...c, is_premium: true } : c
              );
              onRefreshParent({ ...parent, children: updatedChildren });
            }
          }}
        />
      )}

    </div>
  );
};

export default ParentDashboard;
