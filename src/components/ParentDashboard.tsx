/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
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
import { computeEffectiveStreak } from "../utils/streak";
import { evaluateChildBadges } from "../utils/badges";
import { resolveEffectiveScreenMonitoring, getApprovedSegmentByIdOrGroup, resolveChildApprovedSegment } from "../utils/childMeta";
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
  Crown,
  Search,
  Menu,
  X,
  ExternalLink,
  Shield,
  Eye,
  EyeOff,
  Copy,
  LayoutDashboard
} from "lucide-react";
import { PaywallModal } from "./PaywallModal";
import { SettingsScreen } from "./Settings";
import { ParentCommunity } from "./ParentCommunity";

export type ParentDashboardTab = "overview" | "settings" | "community" | "refer";

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
  const [activeTab, setActiveTab] = useState<ParentDashboardTab>("overview");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [manualSyncing, setManualSyncing] = useState(false);
  const [childSessions, setChildSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [rsvpedEvents, setRsvpedEvents] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showPaywall, setShowPaywall] = useState<Child | null>(null);
  const [revealedLoginId, setRevealedLoginId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

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

  // Sync selected child with updated parent children array
  const child = selChild
    ? (children.find((c) => c.id === selChild.id) || children[0] || null)
    : (children[0] || null);

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

      const channel = supabase
        .channel('realtime-notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `parent_id=eq.${parent.id}` },
          (payload) => {
            const newNotif = payload.new;
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            setToastMsg(`New Notification: ${newNotif.title}`);
            setTimeout(() => setToastMsg(null), 4000);
            
            try {
              const audio = new Audio('/sfx/achievement.mp3');
              audio.volume = 0.4;
              audio.play().catch(() => {});
            } catch (e) {}
          }
        )
        .subscribe();

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

    const timer = setTimeout(fetchSessions, 600);
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

  const referralCode = parent?.id ? parent.id.substring(0, 8).toUpperCase() : "CLATS26";
  const referralLink = `https://app.clats.africa/register?ref=${referralCode}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast("Referral link copied!");
  };

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

  useEffect(() => {
    if (!dbConnected || !parent?.email || !onRefreshParent) return;

    const fetchLatestData = () => {
      pullParentFromSupabase(parent.email).then((freshParent) => {
        if (freshParent) {
          onRefreshParent(freshParent);
        }
      }).catch(err => {
        console.log("Auto-sync update skipped or offline.", err);
      });
    };

    fetchLatestData();
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

  // Study analytics based on actual session telemetry
  const studyStats = calculateStudyAnalytics(childSessions);
  const computedMinsToday = studyStats.todayMins;
  const weeklyMins = studyStats.weeklyMins;
  const totalMins = studyStats.totalMins;

  // Dynamic curriculum calculations based on selected child and ageGroup
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
  const streakInfo = child ? computeEffectiveStreak(child) : { streak: 0, bestStreak: 0 };
  const streakDays = streakInfo.streak;
  const bestStreakDays = streakInfo.bestStreak;
  const effectiveMonitoring = child ? resolveEffectiveScreenMonitoring(child, parent.email) : null;
  const assignedSegment = child ? resolveChildApprovedSegment(child) : null;

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

  const filteredRoadmapLessons = useMemo(() => {
    if (!searchQuery.trim()) return activeLessons;
    const q = searchQuery.toLowerCase();
    return activeLessons.filter(l => {
      const title = (l.title[lang] || l.title.en || "").toLowerCase();
      const story = (l.story?.[lang] || l.story?.en || "").toLowerCase();
      return title.includes(q) || story.includes(q);
    });
  }, [activeLessons, searchQuery, lang]);

  const skills = child ? [
    { name: "AI Understanding", value: completedCount === 0 ? 0 : Math.min(100, Math.round(30 + completedCount * 12)), color: "#2EC4B6" },
    { name: "Problem Solving", value: completedCount === 0 ? 0 : Math.min(100, Math.round(25 + completedCount * 11)), color: "#7A6FF0" },
    { name: "Digital Confidence", value: completedCount === 0 ? 0 : Math.min(100, Math.round(40 + completedCount * 10)), color: "#F59E0B" },
    { name: "Creativity & Logic", value: completedCount === 0 ? 0 : Math.min(100, Math.round(35 + completedCount * 12)), color: "#2EC4B6" },
    { name: "Tech Awareness", value: completedCount === 0 ? 0 : Math.min(100, Math.round(20 + completedCount * 14)), color: "#7A6FF0" },
    { name: "Responsible Digital Use", value: completedCount === 0 ? 0 : Math.min(100, Math.round(50 + completedCount * 9)), color: "#F59E0B" },
  ] : [];

  const achievements: Array<{ name: string; emoji: string; desc: string }> = child
    ? evaluateChildBadges(child)
        .filter((b) => b.unlocked)
        .map((b) => ({
          name: b.name,
          emoji: b.emoji,
          desc: b.howToEarn
        }))
    : [];

  const isState1 = children.length === 0;
  const isState2 = children.length > 0 && completedCount === 0;

  const dict: Record<Language, Record<string, string>> = {
    en: {
      heroTitle: `Welcome Back, ${parent.name || "Parent"} 👋`,
      heroDesc: "Track your child's journey from technology consumer to future creator.",
      learningRoadmap: "Curriculum Roadmap",
      roadmapDesc: "See where your child currently sits within the CLATS Future-Tech Curriculum.",
      skillsGrowth: "Future-Tech Skills Growth",
      recentActivity: "Recent Learning Activity",
      achievementsTitle: "Earned Badges & Milestones",
      logoutText: "Logout",
      adjustLimit: "Adjust limits"
    },
    yo: {
      heroTitle: `Kaabo Padà, ${parent.name || "Kolo"} 👋`,
      heroDesc: "Tọpinpin irin-ajo ọmọ rẹ lati jẹ olumulo imọ-ẹrọ si olupilẹṣẹ ọjọ iwaju.",
      learningRoadmap: "Oju-ọna Ẹkọ wa",
      roadmapDesc: "Wo ibi ti ọmọ rẹ wa ninu Eto Ẹkọ Imọ-ẹrọ CLATS ti Ọjọ Iwaju.",
      skillsGrowth: "Idagbasoke Imọ-ẹrọ Ọjọ Iwaju",
      recentActivity: "Iṣẹ Ẹkọ Tuntun",
      achievementsTitle: "Awọn Aṣeyọri Ọmọ",
      logoutText: "Jade Kuro",
      adjustLimit: "Ṣatunṣe akoko"
    },
    ig: {
      heroTitle: `Nnọọ Nne na Nna, ${parent.name || "Nna"} 👋`,
      heroDesc: "Tuo ụzọ mmụta nwa gị site na onye na-eji teknụzụ gaa na onye nrụpụta ọhụrụ.",
      learningRoadmap: "Map Ụzọ Mmụta",
      roadmapDesc: "Hụ ebe nwa gị nọ ugbu a n'ime mmụta teknụzụ CLATS.",
      skillsGrowth: "Ntolite Nkà Teknụzụ Ọdịnihu",
      recentActivity: "Ihe Omume Mmụta Ọhụrụ",
      achievementsTitle: "Ihe Nrite Ụmụaka",
      logoutText: "Pụọ",
      adjustLimit: "Mezie njikwa"
    },
    fr: {
      heroTitle: `Bon retour, ${parent.name || "Parent"} 👋`,
      heroDesc: "Suivez le parcours de votre enfant, de consommateur de technologie à futur créateur.",
      learningRoadmap: "Feuille de route d'apprentissage",
      roadmapDesc: "Découvrez où en est votre enfant dans le programme CLATS Future-Tech.",
      skillsGrowth: "Croissance des compétences Future-Tech",
      recentActivity: "Activité d'apprentissage récente",
      achievementsTitle: "Réalisations de l'enfant",
      logoutText: "Se déconnecter",
      adjustLimit: "Ajuster les contrôles"
    },
    ha: {
      heroTitle: `Barka da Dawowa, ${parent.name || "Parent"} 👋`,
      heroDesc: "Bibiyi tafiyar yaranku daga mabukaci na fasaha zuwa mahalicci na gaba.",
      learningRoadmap: "Taswirar Koyo",
      roadmapDesc: "Duba inda yaranku suke a cikin Tsarin Karatun CLATS na Gaba.",
      skillsGrowth: "Haɓaka Kwarewar Fasaha",
      recentActivity: "Ayyukan Koyon Kwanan nan",
      achievementsTitle: "Nasarar Yara",
      logoutText: "Fita",
      adjustLimit: "Daidaita iko"
    }
  };

  const t = dict[lang] || dict.en;

  const notificationsList = notifications.length > 0 ? notifications : [{
    id: 0,
    title: "No Notifications",
    message: "You're all caught up! Child activity and updates will appear here.",
    time: "Now",
    icon: "👍"
  }];

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans ${isDark ? "bg-[#0B1120] text-slate-100" : "bg-[#F8FAFC] text-slate-900"}`}>
      
      {/* MOBILE DRAWER OVERLAY */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        
        {/* ========================================================= */}
        {/* VERTICAL SIDEBAR NAVIGATION */}
        {/* ========================================================= */}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col border-r transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${
            isDark
              ? "bg-[#0F172A] border-slate-800/80 text-slate-200"
              : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          {/* Sidebar Top: CLATS Brand Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CLATSLogo height="1.8em" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#2EC4B6] block">
                  Parent Portal
                </span>
                <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">
                  Intelligence Hub
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links Area */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            
            {/* Group 1: Main Platform Views */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block mb-2">
                Menu
              </span>
              <button
                onClick={() => {
                  setActiveTab("overview");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "overview"
                    ? "bg-[#2EC4B6] text-white shadow-sm shadow-[#2EC4B6]/25"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-800/60"
                      : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Overview</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("refer");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "refer"
                    ? "bg-[#2EC4B6] text-white shadow-sm shadow-[#2EC4B6]/25"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-800/60"
                      : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Share2 size={16} />
                  <span>Refer & Earn</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  activeTab === "refer"
                    ? "bg-white/20 text-white"
                    : "bg-amber-400/20 text-amber-500"
                }`}>
                  Rewards
                </span>
              </button>
            </div>

            {/* Group 2: Learner Portals & Controls */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block mb-2">
                Learners & Guards
              </span>
              <button
                onClick={() => {
                  onNavigate("addChild");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isDark ? "text-slate-300 hover:bg-slate-800/60" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <PlusCircle size={16} className="text-[#2EC4B6]" />
                <span>Add Child Profile</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("settings");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "settings"
                    ? "bg-[#2EC4B6] text-white shadow-sm shadow-[#2EC4B6]/25"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-800/60"
                      : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Settings size={16} className={activeTab === "settings" ? "text-white" : "text-slate-400"} />
                <span>Screen Limits & Settings</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("community");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "community"
                    ? "bg-[#2EC4B6] text-white shadow-sm shadow-[#2EC4B6]/25"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-800/60"
                      : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Users size={16} className={activeTab === "community" ? "text-white" : "text-[#7A6FF0]"} />
                <span>Parent Community Hub</span>
              </button>
            </div>

            {/* Group 3: Direct Admin Dashboard Connection */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block mb-2">
                Management
              </span>
              <a
                href="/admin"
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isDark
                    ? "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                title="Go to CLATS Central Admin Dashboard"
              >
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-[#2EC4B6]" />
                  <span>Admin Dashboard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#2EC4B6]/15 text-[#2EC4B6]">
                    Portal
                  </span>
                  <ExternalLink size={11} className="text-slate-400" />
                </div>
              </a>
            </div>

            {/* Group 4: Child Switcher List in Sidebar */}
            {children.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block mb-1">
                  Enrolled Children ({children.length})
                </span>
                <div className="space-y-1.5">
                  {children.map((c) => {
                    const isSelected = child?.id === c.id;
                    const cComp = Object.keys(c.completed || {}).length;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelChild(c);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left ${
                          isSelected
                            ? isDark
                              ? "bg-slate-800 text-white border border-[#2EC4B6]/40"
                              : "bg-teal-50/80 text-teal-900 border border-[#2EC4B6]/30"
                            : isDark
                              ? "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                              : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isSelected
                              ? "bg-[#2EC4B6] text-white"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}>
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="block truncate font-bold">{c.name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono -mt-0.5">
                              {AGE_LABEL[c.ageGroup] || "CLATS"}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#2EC4B6] shrink-0"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Footer: Parent User Info & Sync Status */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            {/* Database & Cloud Sync Badge */}
            <div className="flex items-center justify-between px-2 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${dbConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span>{dbConnected ? (isSyncing || manualSyncing ? "Syncing..." : "Cloud Connected") : "Offline Mode"}</span>
              </div>
              <button
                onClick={handleManualSync}
                disabled={manualSyncing || !dbConnected}
                className="text-slate-400 hover:text-[#2EC4B6] transition-colors p-1"
                title="Force refresh database"
              >
                <RefreshCw size={11} className={manualSyncing ? "animate-spin text-[#2EC4B6]" : ""} />
              </button>
            </div>

            {/* Parent Profile Card */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200/80"
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7A6FF0] to-[#2EC4B6] text-white flex items-center justify-center font-black text-xs shrink-0">
                  {(parent.name || "P")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold truncate">
                    {parent.name || "Family Account"}
                  </span>
                  <span className="block text-[10px] text-slate-400 truncate font-mono">
                    {parent.email || "parent@clats.africa"}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                title="Log out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN CONTENT AREA */}
        {/* ========================================================= */}
        <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
          
          {/* TOP APP HEADER */}
          <header className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
            isDark
              ? "bg-[#0B1120]/90 border-slate-800/80"
              : "bg-white/90 border-slate-200"
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              
              {/* Left: Mobile Drawer Trigger & Title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="p-2 rounded-xl border lg:hidden text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Open sidebar"
                >
                  <Menu size={18} />
                </button>
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight m-0">
                    {activeTab === "overview"
                      ? "Parent Intelligence Dashboard"
                      : activeTab === "settings"
                      ? "Screen Limits & Family Controls"
                      : activeTab === "community"
                      ? "Parent Community Hub"
                      : "Refer & Earn Rewards"}
                  </h1>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
                    {child ? `Active Learner: ${child.name} (${assignedSegment?.label || "Young Explorers"})` : "CLATS Future-Tech Platform"}
                  </span>
                </div>
              </div>

              {/* Center / Right: Child Switcher & Header Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                
                {/* Child Quick Switcher Dropdown (when multiple children) */}
                {children.length > 1 && (
                  <div className="relative">
                    <select
                      value={child?.id || ""}
                      onChange={(e) => {
                        const target = children.find(c => c.id === e.target.value);
                        if (target) setSelChild(target);
                      }}
                      className={`text-xs font-bold rounded-xl px-3 py-1.5 border appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]/40 transition-all ${
                        isDark
                          ? "bg-slate-900 border-slate-700 text-slate-200"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      {children.map(c => (
                        <option key={c.id} value={c.id}>
                          Learner: {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                )}

                {/* Direct Link to Admin Dashboard in Header */}
                <a
                  href="/admin"
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    isDark
                      ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white hover:border-[#2EC4B6]"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-[#2EC4B6]"
                  }`}
                  title="CLATS Admin Dashboard"
                >
                  <Shield size={14} className="text-[#2EC4B6]" />
                  <span>Admin</span>
                </a>

                {/* Theme Mode Toggle */}
                <button
                  onClick={onToggleTheme}
                  className={`p-2 rounded-xl border transition-all ${
                    isDark
                      ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                  aria-label="Toggle visual theme"
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-[#7A6FF0]" />}
                </button>

                {/* Notifications Bell Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 rounded-xl border transition-all ${
                      isDark
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                    aria-label="View notifications"
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-[9px] font-black text-white shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className={`absolute right-0 mt-3 w-80 rounded-2xl border p-4 shadow-2xl z-50 transition-all ${
                      isDark ? "bg-[#0F172A] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">Notifications</h4>
                        <div className="flex gap-2">
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
                              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              Mark all read
                            </button>
                          )}
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-[11px] font-bold text-[#2EC4B6] hover:underline"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                        {notificationsList.map((notif: any) => (
                          <div
                            key={notif.id}
                            className={`p-2.5 rounded-xl border flex gap-2.5 cursor-pointer ${
                              notif.is_read
                                ? (isDark ? "bg-slate-900/60 border-slate-800 opacity-60" : "bg-slate-50 border-slate-200 opacity-70")
                                : (isDark ? "bg-slate-900 border-[#2EC4B6]/30" : "bg-teal-50/40 border-teal-100")
                            }`}
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
                            <span className="text-base">{notif.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold m-0 leading-snug flex items-center justify-between">
                                <span className="truncate">{notif.title}</span>
                                {!notif.is_read && notif.id !== 0 && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                                {notif.message || notif.desc}
                              </p>
                              <span className="text-[9px] text-slate-400 font-mono block mt-1">
                                {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : notif.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Feedback Button */}
                <a
                  href={feedbackFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2EC4B6] hover:bg-teal-600 text-white font-bold text-xs transition-colors shadow-sm shadow-[#2EC4B6]/20"
                >
                  <span>Feedback</span>
                  <ExternalLink size={12} />
                </a>

              </div>
            </div>
          </header>

          {/* MAIN PAGE BODY */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            
            {activeTab === "overview" ? (
              <>
                {/* ------------------------------------------------------------- */}
                {/* SECTION 1: EXECUTIVE HERO BANNER */}
                {/* ------------------------------------------------------------- */}
                <section className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all ${
                  isDark
                    ? "bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] border-slate-800 shadow-xl"
                    : "bg-gradient-to-br from-white via-slate-50 to-white border-slate-200 shadow-sm"
                }`}>
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#2EC4B6]/15 text-[#2EC4B6]">
                        <Sparkles size={11} />
                        <span>CLATS FUTURE-TECH ACCELERATOR</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight m-0">
                        {t.heroTitle}
                      </h2>
                      <p className={`text-xs sm:text-sm m-0 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        {t.heroDesc}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={generateAiInsight}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7A6FF0] to-[#8B5CF6] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all"
                      >
                        <Sparkles size={14} />
                        <span>Generate AI Report</span>
                      </button>

                      <button
                        onClick={() => onNavigate("addChild")}
                        className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isDark
                            ? "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-sm"
                        }`}
                      >
                        <PlusCircle size={14} className="text-[#2EC4B6]" />
                        <span>Enroll Child</span>
                      </button>
                    </div>
                  </div>
                </section>

                {/* ------------------------------------------------------------- */}
                {/* SECTION 2: EXECUTIVE SUMMARY KPI CARDS (BENTO ROW 1) */}
                {/* ------------------------------------------------------------- */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  
                  {/* KPI 1: Study Time */}
                  <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                    isDark ? "bg-[#0F172A] border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Learning Time
                      </span>
                      <div className="p-2 rounded-xl bg-[#2EC4B6]/15 text-[#2EC4B6]">
                        <Clock size={16} />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#2EC4B6]">
                      {computedMinsToday}m
                      <span className="text-xs font-semibold text-slate-400 ml-1">today</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>7-Day: <strong className="text-slate-600 dark:text-slate-300">{weeklyMins}m</strong></span>
                      <span>All-Time: <strong className="text-slate-600 dark:text-slate-300">{totalMins}m</strong></span>
                    </div>
                  </div>

                  {/* KPI 2: Lessons Completed */}
                  <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                    isDark ? "bg-[#0F172A] border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Curriculum Progress
                      </span>
                      <div className="p-2 rounded-xl bg-[#7A6FF0]/15 text-[#7A6FF0]">
                        <BookOpen size={16} />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#7A6FF0]">
                      {courseProgressPct}%
                      <span className="text-xs font-semibold text-slate-400 ml-1">done</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Completed: <strong className="text-slate-600 dark:text-slate-300">{completedCount}</strong></span>
                      <span>Total: <strong className="text-slate-600 dark:text-slate-300">{totalLessons}</strong></span>
                    </div>
                  </div>

                  {/* KPI 3: Quiz Average */}
                  <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                    isDark ? "bg-[#0F172A] border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Quiz Accuracy
                      </span>
                      <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                        <Award size={16} />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-amber-500">
                      {quizAttempts === 0 ? "0%" : `${quizAverage}%`}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Assessments: <strong className="text-slate-600 dark:text-slate-300">{quizAttempts}</strong></span>
                      <span>Available: <strong className="text-slate-600 dark:text-slate-300">{totalQuizzes}</strong></span>
                    </div>
                  </div>

                  {/* KPI 4: Active Streak */}
                  <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                    isDark ? "bg-[#0F172A] border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Active Habit Streak
                      </span>
                      <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
                        <Flame size={16} />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-rose-500">
                      {streakDays} <span className="text-xs font-semibold text-slate-400">Days</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Personal Best: <strong className="text-amber-500">{bestStreakDays}d</strong></span>
                      <span>Companion: <strong className="text-[#2EC4B6] uppercase">{child?.companion || "Kobe"}</strong></span>
                    </div>
                  </div>

                </section>

                {/* ------------------------------------------------------------- */}
                {/* SECTION 3: CHILD SPOTLIGHT & QUICK PORTAL ACCESS */}
                {/* ------------------------------------------------------------- */}
                {child ? (
                  <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Active Child Hero Card (7 Cols) */}
                    <div className={`lg:col-span-7 p-6 rounded-2xl border flex flex-col justify-between ${
                      isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7A6FF0] to-[#2EC4B6] text-white flex items-center justify-center font-black text-xl shadow-md shadow-teal-500/20">
                              {child.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black tracking-tight m-0">{child.name}</h3>
                                {child.is_premium ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm flex items-center gap-1">
                                    <Crown size={10} /> Premium
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setShowPaywall(child)}
                                    className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#2EC4B6] hover:text-white transition-all flex items-center gap-1"
                                  >
                                    <Crown size={10} className="text-amber-500" /> Free Plan
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2EC4B6]/15 text-[#2EC4B6]">
                                  {assignedSegment?.label || "Young Explorers"} ({assignedSegment?.rangeLabel || "6-10"} yrs)
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  Companion: <strong className="uppercase text-slate-600 dark:text-slate-300">{child.companion || "Kobe"}</strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => onEnterChildMode(child)}
                            className="px-4 py-2 rounded-xl bg-[#2EC4B6] hover:bg-teal-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-[#2EC4B6]/25 shrink-0"
                          >
                            <span>Enter Portal</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>

                        {/* Child Login PIN & Username Revealer */}
                        <div className={`p-3.5 rounded-xl border mb-4 text-xs ${
                          isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-semibold">Child Device Login</span>
                              <span className="text-[10px] font-mono text-slate-400">(for tablet/phone access)</span>
                            </div>
                            <button
                              onClick={() => setRevealedLoginId(revealedLoginId === child.id ? null : child.id)}
                              className="text-[11px] font-bold text-[#2EC4B6] hover:underline flex items-center gap-1"
                            >
                              {revealedLoginId === child.id ? (
                                <>
                                  <EyeOff size={12} />
                                  <span>Hide Details</span>
                                </>
                              ) : (
                                <>
                                  <Eye size={12} />
                                  <span>Reveal Username & PIN</span>
                                </>
                              )}
                            </button>
                          </div>
                          {revealedLoginId === child.id && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 font-mono">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-sans">Username</span>
                                <strong className="text-sm font-bold tracking-wide">
                                  {child.username || child.name.toLowerCase().replace(/\s+/g, "_")}
                                </strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block font-sans">Secret PIN</span>
                                <strong className="text-sm font-bold tracking-widest text-[#2EC4B6]">
                                  {child.pin}
                                </strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Current Learning Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-400">Focus: {currentLessonTitle}</span>
                          <span className="text-[#2EC4B6] font-mono">{courseProgressPct}% Completed</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#2EC4B6] to-[#7A6FF0] transition-all duration-700"
                            style={{ width: `${Math.max(4, courseProgressPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* AI Pedagogical Summary Card (5 Cols) */}
                    <div className={`lg:col-span-5 p-6 rounded-2xl border flex flex-col justify-between ${
                      isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-[#7A6FF0]/15 text-[#7A6FF0]">
                              <Sparkles size={16} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-[#7A6FF0] font-mono m-0">
                              AI Learning Insights
                            </h3>
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold">
                            Meta AI
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className={`p-3 rounded-xl border-l-4 border-[#2EC4B6] ${
                            isDark ? "bg-slate-900/60" : "bg-slate-50"
                          }`}>
                            <p className="text-xs m-0 leading-relaxed">
                              <strong className="text-[#2EC4B6]">{child.name}</strong> has mastered{" "}
                              <strong>{completedCount}</strong> future-tech learning objectives across AI & digital readiness.
                            </p>
                          </div>

                          <div className={`p-3 rounded-xl border-l-4 border-[#7A6FF0] ${
                            isDark ? "bg-slate-900/60" : "bg-slate-50"
                          }`}>
                            <p className="text-xs m-0 leading-relaxed">
                              Accumulated <strong className="text-[#7A6FF0]">{childXp} XP</strong> with an active study streak of{" "}
                              <strong className="text-[#7A6FF0]">{streakDays} days</strong>.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                        <button
                          onClick={generateAiInsight}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#7A6FF0]/15 hover:bg-[#7A6FF0] text-[#7A6FF0] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <Sparkles size={13} />
                          <span>View Full AI Report</span>
                        </button>
                        
                        <button
                          onClick={async () => {
                            showToast(`Generating Smart Report for ${child.name}...`);
                            let fetchedInsight = null;
                            try {
                              const res = await fetch("/api/ai/generate-insight", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ childId: child.id }),
                              });
                              const data = await res.json();
                              if (data.insight) fetchedInsight = data.insight;
                            } catch (e) {}

                            let freshChild = child;
                            if (parent?.email) {
                              try {
                                const fresh = await pullParentFromSupabase(parent.email);
                                if (fresh) freshChild = fresh.children?.find((c: any) => c.id === child.id) || child;
                              } catch {}
                            }
                            downloadProgressReportImage(parent, freshChild, fetchedInsight);
                          }}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                            isDark
                              ? "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                          title="Download AI Progress Report Image"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>

                  </section>
                ) : (
                  <section className={`p-10 rounded-2xl border text-center space-y-4 ${
                    isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"
                  }`}>
                    <h3 className="text-base font-bold">No Child Profile Enrolled Yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Enroll your child to start tracking their future-tech curriculum, screen time, and skill mastery.
                    </p>
                    <button
                      onClick={() => onNavigate("addChild")}
                      className="px-5 py-2.5 rounded-xl bg-[#2EC4B6] text-white font-bold text-xs uppercase hover:bg-teal-600 transition-colors"
                    >
                      Enroll First Child
                    </button>
                  </section>
                )}

                {/* ------------------------------------------------------------- */}
                {/* SECTION 4: CURRICULUM ROADMAP & LEARNING PATHWAY MAP */}
                {/* ------------------------------------------------------------- */}
                {child && (
                  <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left: Module Progress List (5 Cols) */}
                    <div className={`lg:col-span-5 p-6 rounded-2xl border space-y-4 ${
                      isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-black tracking-tight m-0">{t.learningRoadmap}</h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {course?.title[lang] || course?.title.en || "Curriculum"}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#7A6FF0]/15 text-[#7A6FF0]">
                          {totalModules} Modules
                        </span>
                      </div>

                      <div className="space-y-3">
                        {course?.modules.map((mod, idx) => {
                          const hasLessons = mod.lessons.length > 0;
                          const completedInMod = mod.lessons.filter(l => completedLessonIds.includes(l.id)).length;
                          const isCompleted = hasLessons && completedInMod === mod.lessons.length;
                          const isActive = !isCompleted && (idx === 0 || course.modules[idx - 1]?.lessons.some(l => completedLessonIds.includes(l.id)));
                          const moduleName = mod.name[lang as keyof typeof mod.name] || mod.name.en;

                          return (
                            <div
                              key={mod.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isActive
                                  ? isDark
                                    ? "bg-[#2EC4B6]/10 border-[#2EC4B6]/40"
                                    : "bg-teal-50/70 border-[#2EC4B6]/40 text-slate-900"
                                  : isCompleted
                                    ? isDark
                                    : "bg-slate-50/50 border-slate-200/80"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 font-bold ${
                                  isCompleted
                                    ? "bg-[#7A6FF0] text-white"
                                    : isActive
                                      ? "bg-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/25"
                                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                }`}>
                                  {isCompleted ? "✓" : mod.badge.icon || (idx + 1)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold truncate m-0">{moduleName}</h4>
                                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                                      {completedInMod}/{mod.lessons.length}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-2 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        isCompleted ? "bg-[#7A6FF0]" : "bg-[#2EC4B6]"
                                      }`}
                                      style={{ width: `${mod.lessons.length > 0 ? (completedInMod / mod.lessons.length) * 100 : 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Interactive Lesson Trail (7 Cols) */}
                    <div className={`lg:col-span-7 p-6 rounded-2xl border space-y-4 ${
                      isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-black tracking-tight m-0">Interactive Pathway Journey</h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Milestones & Capstone Progress
                          </span>
                        </div>

                        {/* Search Filter for Lessons */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search lesson..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`text-xs rounded-xl px-3 py-1.5 pl-8 border w-44 focus:outline-none focus:ring-1 focus:ring-[#2EC4B6] transition-all ${
                              isDark
                                ? "bg-slate-900 border-slate-700 text-slate-200"
                                : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          />
                          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>

                      {/* Visual Node Trail */}
                      <div className="flex flex-col items-center justify-center space-y-6 relative py-4">
                        <div className="absolute top-6 bottom-6 left-1/2 w-1 bg-gradient-to-b from-[#2EC4B6] via-[#7A6FF0] to-slate-300 dark:to-slate-800 transform -translate-x-1/2 z-0" />

                        {roadmapNodes.map((node, idx) => {
                          const offsetClass = ["translate-x-2", "-translate-x-3", "translate-x-3", "-translate-x-2", "translate-x-1"][idx % 5];
                          return (
                            <div
                              key={node.id}
                              className={`flex flex-col items-center relative z-10 transform ${offsetClass} transition-transform hover:scale-105`}
                            >
                              {node.isCompleted ? (
                                <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-emerald-500/20 border-2 border-white dark:border-slate-900">
                                  ✓
                                </div>
                              ) : node.isActive ? (
                                <div className="h-14 w-14 rounded-full bg-[#2EC4B6] text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-[#2EC4B6]/30 border-2 border-white dark:border-slate-900 animate-pulse">
                                  🟢
                                </div>
                              ) : (
                                <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-sm border-2 border-white dark:border-slate-900">
                                  <Lock size={15} />
                                </div>
                              )}
                              <div className={`mt-2 px-2.5 py-1 rounded-lg text-[11px] font-bold border text-center shadow-sm max-w-[200px] truncate ${
                                node.isCompleted
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  : node.isActive
                                    ? "bg-[#2EC4B6]/15 border-[#2EC4B6]/40 text-[#2EC4B6]"
                                    : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                              }`}>
                                {node.title}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Filtered remaining lessons */}
                      {filteredRoadmapLessons.length > 5 && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-2">
                            Additional Lessons ({filteredRoadmapLessons.length - 5})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filteredRoadmapLessons.slice(5).map((les) => {
                              const isCompleted = completedLessonIds.includes(les.id);
                              const title = les.title[lang] || les.title.en;
                              return (
                                <div
                                  key={les.id}
                                  className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                                    isCompleted
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500"
                                  }`}
                                >
                                  <span>{isCompleted ? "✓" : "🔒"}</span>
                                  <span className="truncate">{title}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                  </section>
                )}

                {/* ------------------------------------------------------------- */}
                {/* SECTION 5: SCREEN MONITORING & HEALTHY HABITS TELEMETRY */}
                {/* ------------------------------------------------------------- */}
                {child && effectiveMonitoring && (
                  <section className={`p-6 rounded-2xl border space-y-6 ${
                    isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Tv size={18} className="text-[#2EC4B6]" />
                          <h3 className="text-base font-black tracking-tight m-0">
                            Screen Monitoring & Digital Wellness ({child.name})
                          </h3>
                        </div>
                        <p className={`text-xs mt-1 mb-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Active Guardrails:{" "}
                          <strong>
                            {effectiveMonitoring.enabled
                              ? `${effectiveMonitoring.dailyLimitMins > 0 ? `${effectiveMonitoring.dailyLimitMins}m daily cap` : "No daily cap"} · ${effectiveMonitoring.sessionLimitMins > 0 ? `${effectiveMonitoring.sessionLimitMins}m session limit` : "No session limit"}`
                              : "Limits disabled"}
                          </strong>
                          {effectiveMonitoring.schoolPolicy && " · 🏫 School Guardrails Synchronized"}
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveTab("settings")}
                        className="px-3.5 py-2 rounded-xl bg-[#2EC4B6]/15 hover:bg-[#2EC4B6] text-[#2EC4B6] hover:text-white text-xs font-bold uppercase tracking-wider transition-all border border-[#2EC4B6]/30 self-start sm:self-auto"
                      >
                        Adjust Limits
                      </button>
                    </div>

                    {/* Breakdown Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className={`p-4 rounded-xl border ${
                        isDark ? "bg-slate-900/60 border-slate-800" : "bg-teal-50/50 border-teal-100"
                      }`}>
                        <span className="text-[10px] font-mono uppercase font-bold text-[#2EC4B6] block">
                          📚 Core Learning Time
                        </span>
                        <div className="text-xl font-black mt-1">
                          {studyStats.learningMinsToday}m Today
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                          Week: <strong>{studyStats.learningMinsWeek}m</strong> · All-Time: <strong>{studyStats.learningMinsTotal}m</strong>
                        </span>
                      </div>

                      <div className={`p-4 rounded-xl border ${
                        isDark ? "bg-slate-900/60 border-slate-800" : "bg-purple-50/50 border-purple-100"
                      }`}>
                        <span className="text-[10px] font-mono uppercase font-bold text-[#7A6FF0] block">
                          🎮 Other Activities & Wonder Lab
                        </span>
                        <div className="text-xl font-black mt-1">
                          {studyStats.otherMinsToday}m Today
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                          Week: <strong>{studyStats.otherMinsWeek}m</strong> · All-Time: <strong>{studyStats.otherMinsTotal}m</strong>
                        </span>
                      </div>

                      <div className={`p-4 rounded-xl border ${
                        isDark ? "bg-slate-900/60 border-slate-800" : "bg-amber-50/50 border-amber-100"
                      }`}>
                        <span className="text-[10px] font-mono uppercase font-bold text-amber-500 block">
                          🛡️ Active Guardrail Policy
                        </span>
                        <div className="text-sm font-black mt-1.5">
                          {effectiveMonitoring.enabled ? "Active Enforcement" : "Policy Paused"}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                          {effectiveMonitoring.preferredHoursEnabled
                            ? `Permitted window: ${effectiveMonitoring.preferredStartHour}–${effectiveMonitoring.preferredEndHour}`
                            : "No curfew active"}
                        </span>
                      </div>

                    </div>

                    {/* 7-Day Chart & Session Logs */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                      
                      {/* 7-Day Usage Telemetry Bar Chart */}
                      <div className={`p-4 rounded-xl border ${
                        isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-3">
                          Daily Screen Time (Last 7 Days)
                        </span>
                        <div className="grid grid-cols-7 gap-2 items-end h-28 pt-2">
                          {studyStats.dailyBreakdown.map((d) => {
                            const maxMins = Math.max(30, effectiveMonitoring.dailyLimitMins || 30, ...studyStats.dailyBreakdown.map((x) => x.totalMins));
                            const totalHeightPct = Math.min(100, Math.round((d.totalMins / maxMins) * 100));
                            return (
                              <div key={d.date} className="flex flex-col items-center justify-end h-full gap-1">
                                <span className="text-[9px] font-mono font-bold text-slate-400">{d.totalMins}m</span>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-md h-16 flex flex-col justify-end overflow-hidden">
                                  <div
                                    style={{ height: `${Math.max(d.totalMins > 0 ? 12 : 0, totalHeightPct)}%` }}
                                    className="w-full bg-gradient-to-t from-[#2EC4B6] to-[#7A6FF0] rounded-t-md transition-all"
                                    title={`${d.label}: ${d.learningMins}m learning, ${d.otherMins}m other`}
                                  />
                                </div>
                                <span className="text-[10px] font-extrabold text-slate-500">{d.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recent Telemetry Session Logs */}
                      <div className={`p-4 rounded-xl border ${
                        isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-3">
                          Recent Learning & App Sessions
                        </span>
                        {studyStats.recentLogs.length === 0 ? (
                          <div className="text-xs text-slate-400 font-mono py-6 text-center">
                            No telemetry logs recorded yet. Telemetry appears automatically as {child.name} explores CLATS.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                            {studyStats.recentLogs.slice(0, 5).map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50 dark:border-slate-800/80 last:border-0"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                    log.category === "learning"
                                      ? "bg-teal-500/15 text-[#2EC4B6]"
                                      : "bg-purple-500/15 text-[#7A6FF0]"
                                  }`}>
                                    {log.category === "learning" ? "Learn" : "Play"}
                                  </span>
                                  <span className="font-bold truncate">{log.activityLabel}</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                                  {log.durationMins}m · {log.deviceType}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                  </section>
                )}

                {/* ------------------------------------------------------------- */}
                {/* SECTION 6: FUTURE-TECH SKILLS & ACHIEVEMENTS BENTO */}
                {/* ------------------------------------------------------------- */}
                {child && (
                  <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Skills Growth (7 Cols) */}
                    <div className={`lg:col-span-7 p-6 rounded-2xl border space-y-4 ${
                      isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-black tracking-tight m-0">{t.skillsGrowth}</h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Multi-dimensional cognitive competency metrics
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#2EC4B6] font-mono">
                          {completedCount > 0 ? "Active Progress" : "Baseline"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {skills.map((skill, idx) => (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                              isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold truncate">{skill.name}</span>
                              <span className="font-mono font-bold" style={{ color: skill.color }}>
                                {skill.value}%
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${skill.value}%`, backgroundColor: skill.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Earned Badges & Milestones (5 Cols) */}
                    <div className={`lg:col-span-5 p-6 rounded-2xl border space-y-4 ${
                      isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-black tracking-tight m-0">{t.achievementsTitle}</h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Unlocked milestone rewards
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500">
                          {achievements.length} Badges
                        </span>
                      </div>

                      {achievements.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 font-mono">
                          No achievements unlocked yet. As {child.name} completes interactive lessons, badges will appear here!
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                          {achievements.map((badge, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border text-center space-y-1.5 transition-transform hover:scale-105 ${
                                isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <span className="text-2xl block">{badge.emoji}</span>
                              <strong className="text-xs font-bold block truncate">{badge.name}</strong>
                              <span className="text-[9px] text-slate-400 block line-clamp-1">{badge.desc}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </section>
                )}

                {/* ------------------------------------------------------------- */}
                {/* SECTION 7: PARENT ACADEMY & COMMUNITY WORKSHOPS */}
                {/* ------------------------------------------------------------- */}
                <section className={`p-6 rounded-2xl border space-y-4 ${
                  isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black tracking-tight m-0">Parent Academy & Community Hub</h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Live digital parenting workshops, masterclasses, and discussions
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab("community")}
                      className="text-xs font-bold text-[#2EC4B6] hover:underline flex items-center gap-1"
                    >
                      <span>View All</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {communityEvents.length === 0 ? (
                      <div className="col-span-3 text-center p-6 border border-dashed rounded-xl border-slate-300 dark:border-slate-800 text-slate-500 text-xs">
                        No upcoming community workshops scheduled. Check back soon!
                      </div>
                    ) : (
                      communityEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:border-[#2EC4B6]/50 ${
                            isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase text-[#2EC4B6] block">
                              {event.tag || "Workshop"}
                            </span>
                            <h4 className="text-xs font-bold mt-1.5 line-clamp-2 leading-snug">{event.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{event.description}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">
                              {event.event_datetime ? new Date(event.event_datetime).toLocaleDateString() : "Online"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRSVP(event.id);
                              }}
                              disabled={rsvpedEvents.includes(event.id)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                rsvpedEvents.includes(event.id)
                                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400"
                                  : "bg-[#2EC4B6]/15 text-[#2EC4B6] hover:bg-[#2EC4B6] hover:text-white"
                              }`}
                            >
                              {rsvpedEvents.includes(event.id) ? "Going" : "RSVP"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

              </>
            ) : activeTab === "settings" ? (
              /* ========================================================= */
              /* SCREEN LIMITS & SETTINGS TAB VIEW */
              /* ========================================================= */
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-1">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isDark
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                    }`}
                  >
                    <ChevronLeft size={14} />
                    <span>Back to Overview</span>
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    ⚙️ Screen Limits & Guardian Controls
                  </span>
                </div>

                <div className={`rounded-3xl border overflow-hidden shadow-sm ${
                  isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <SettingsScreen
                    parent={parent}
                    lang={lang}
                    theme={theme}
                    onBack={() => setActiveTab("overview")}
                    onParentRefresh={onRefreshParent}
                    onLanguageChange={onLanguageChange}
                    onToggleTheme={onToggleTheme}
                  />
                </div>
              </div>
            ) : activeTab === "community" ? (
              /* ========================================================= */
              /* PARENT COMMUNITY HUB TAB VIEW */
              /* ========================================================= */
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-1">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isDark
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                    }`}
                  >
                    <ChevronLeft size={14} />
                    <span>Back to Overview</span>
                  </button>
                  <span className="text-xs font-mono font-bold text-[#7A6FF0]">
                    👥 Parent Academy & Community Hub
                  </span>
                </div>

                <div className={`rounded-3xl border overflow-hidden shadow-sm ${
                  isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <ParentCommunity
                    lang={lang}
                    theme={theme}
                    onBack={() => setActiveTab("overview")}
                  />
                </div>
              </div>
            ) : (
              /* ========================================================= */
              /* REFER & EARN TAB VIEW */
              /* ========================================================= */
              <section className={`p-8 sm:p-12 rounded-3xl border text-center space-y-6 max-w-2xl mx-auto ${
                isDark ? "bg-[#0F172A] border-slate-800 text-white" : "bg-white border-slate-200 shadow-sm"
              }`}>
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#7A6FF0] to-[#2EC4B6] text-white flex items-center justify-center mx-auto shadow-xl shadow-teal-500/20">
                  <Share2 size={36} />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-500">
                    EARN FREE LEARNING MONTHS
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight m-0">
                    Give 1 Month, Get 1 Month Free!
                  </h2>
                  <p className={`text-xs sm:text-sm max-w-lg mx-auto ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    Share the gift of future-tech literacy. Invite friends, family, or schoolmates. Every family that subscribes gives you 1 full month of CLATS Premium for free.
                  </p>
                </div>

                {/* Referral Link Box */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="text-left font-mono text-xs truncate max-w-md">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Your Referral Link</span>
                    <strong className="text-[#2EC4B6] truncate block">{referralLink}</strong>
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#2EC4B6] hover:bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#2EC4B6]/20 shrink-0"
                  >
                    <Copy size={13} />
                    <span>{copiedCode ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </section>
            )}

          </main>

          {/* PAGE FOOTER */}
          <footer className={`py-6 mt-12 border-t text-[11px] font-mono ${
            isDark ? "bg-[#0B1120] border-slate-800 text-slate-500" : "bg-white border-slate-200 text-slate-400"
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span>© 2026 CLATS Africa. Future Tech Academy for the Next Generation.</span>
              <div className="flex gap-4">
                <a href="/admin" className="text-[#2EC4B6] hover:underline font-bold">Admin Portal</a>
                <a href={feedbackFormUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Share Feedback</a>
                <a href="/privacy" className="hover:underline">Privacy</a>
                <a href="/terms" className="hover:underline">Terms</a>
              </div>
            </div>
          </footer>

        </div>
      </div>

      {/* TOAST NOTIFICATION CONTAINER */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white font-mono text-xs px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/50 flex items-center gap-3 animate-fade-in">
          <span className="text-teal-400 font-extrabold">🔔</span>
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* EVENT DETAILS & RSVP MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
            isDark ? "bg-[#0F172A] border border-slate-800 text-white" : "bg-white text-slate-900"
          }`}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#2EC4B6] block">
                  {selectedEvent.tag || "Community Event"}
                </span>
                <h3 className="text-xl font-black mt-1 leading-tight">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto">
              {selectedEvent.event_datetime && (
                <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <Calendar size={18} className="text-[#2EC4B6]" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Date & Time</span>
                    <strong className="text-xs font-mono">
                      {new Date(selectedEvent.event_datetime).toLocaleString()}
                    </strong>
                  </div>
                </div>
              )}
              <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                {selectedEvent.description}
              </p>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  handleRSVP(selectedEvent.id);
                  setSelectedEvent(null);
                }}
                disabled={rsvpedEvents.includes(selectedEvent.id)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  rsvpedEvents.includes(selectedEvent.id)
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400"
                    : "bg-[#2EC4B6] text-white hover:bg-teal-600 shadow-md shadow-[#2EC4B6]/25"
                }`}
              >
                {rsvpedEvents.includes(selectedEvent.id) ? "You're RSVP'd" : "Confirm RSVP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI INSIGHT REPORT MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loadingAi && setShowAiModal(false)} />
          <div className={`relative w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
            isDark ? "bg-[#0F172A] border border-slate-800 text-white" : "bg-white text-slate-900"
          }`}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7A6FF0]/20 text-[#7A6FF0] flex items-center justify-center text-lg">
                  ✨
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight m-0">AI Progress Assessment</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Meta AI (Llama 3.3 70B) Pediatric Learning Diagnostics
                  </span>
                </div>
              </div>
              {!loadingAi && (
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {loadingAi ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-[#7A6FF0]/20 border-t-[#7A6FF0] rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-mono animate-pulse">
                    Synthesizing {child?.name}'s lessons, quizzes, and problem-solving logs...
                  </p>
                </div>
              ) : aiInsight ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                      Executive Summary
                    </span>
                    <p className="text-xs leading-relaxed m-0">
                      {aiInsight.executiveSummary || aiInsight.summary}
                    </p>
                  </div>

                  {Array.isArray(aiInsight.demonstratedCompetencies) && aiInsight.demonstratedCompetencies.length > 0 && (
                    <div className={`p-4 rounded-xl border ${
                      isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                    }`}>
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-500 block mb-2">
                        Demonstrated Competencies
                      </span>
                      <ul className="space-y-1.5 text-xs">
                        {aiInsight.demonstratedCompetencies.map((comp: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{comp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`p-3.5 rounded-xl border ${
                      isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                    }`}>
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-500 block mb-1">
                        Top Strength 🌟
                      </span>
                      <p className="text-xs m-0 leading-relaxed">{aiInsight.strength}</p>
                    </div>

                    <div className={`p-3.5 rounded-xl border ${
                      isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
                    }`}>
                      <span className="text-[10px] font-mono uppercase font-bold text-amber-500 block mb-1">
                        Focus Area 🎯
                      </span>
                      <p className="text-xs m-0 leading-relaxed">{aiInsight.focusArea}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-rose-500 font-mono">
                  Failed to generate AI insights. Please try again.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAYWALL MODAL */}
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
