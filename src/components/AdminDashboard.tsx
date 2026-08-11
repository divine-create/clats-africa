import React, { useState, useEffect } from "react";
import {
  Users, BookOpen, Video, FileText, Gamepad2, Award, ListOrdered,
  MessageSquare, BarChart3, Bell, Globe, Settings, Plus, Edit2,
  Trash2, Download, Check, X, AlertTriangle, ChevronRight, Eye,
  Lock, ArrowLeft, Play, Volume2, Sparkles, CreditCard, Building,
  Flag, Search, CheckCircle, HelpCircle, TrendingUp, RotateCcw,
  BadgeAlert, Save, ChevronDown, CheckSquare, Shield, Upload, FileDown, Layers, Calendar,
  Clock, Key
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

import { companionVoice } from "../utils/audio";
import { S, pullCurriculumFromSupabase } from "../utils/config";

// Types
type AdminRole = 
  | "Super Admin" 
  | "Content Manager" 
  | "Community Moderator" 
  | "School Administrator"
  | "Government Partner Viewer"
  | "Curriculum Specialist" 
  | "Support Staff";

type TabType =
  | "overview"
  | "analytics"
  | "users"
  | "curriculum"
  | "games"
  | "rewards"
  | "companion"
  | "community"
  | "library"
  | "schools"
  | "government"
  | "reports"
  | "settings"
  | "releases";

type AgeGroupType = "early" | "young" | "future"; // 2-5, 6-12, 13-18

interface AdminDashboardProps {
  initialTab?: string;
  onBackToPortal: () => void;
  lang: string;
  theme?: "light" | "dark";
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab = "overview", onBackToPortal, lang, theme = "light" }) => {
  // Theme & Authentication
  const [adminTheme, setAdminTheme] = useState<"light" | "dark" | "system">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("clats_admin_theme") as "light" | "dark" | "system") || (theme === "dark" ? "dark" : "light");
    }
    return theme === "dark" ? "dark" : "light";
  });
  
  const [systemIsDark, setSystemIsDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemIsDark(media.matches);
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const isDark = adminTheme === "system" ? systemIsDark : adminTheme === "dark";

  useEffect(() => {
    localStorage.setItem("clats_admin_theme", adminTheme);
  }, [adminTheme]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clats_admin_authenticated") === "true";
    }
    return false;
  });

  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clats_admin_remember") === "true";
    }
    return false;
  });

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [currentRole, setCurrentRole] = useState<AdminRole>("Super Admin");
  const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType || "overview");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab as TabType);
    }
  }, [initialTab]);

  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseRealUrl, setSupabaseRealUrl] = useState("Not configured");
  const [dbFeedback, setDbFeedback] = useState<any[]>([]);
  const [healthReport, setHealthReport] = useState<any>(null);
  const [healthChecking, setHealthChecking] = useState(false);

  const [liveStudyTimeSecs, setLiveStudyTimeSecs] = useState<number>(0);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await fetch("/api/supabase/sessions");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.sessions) {
            const total = data.sessions.reduce((acc: number, cur: any) => acc + Number(cur.duration_seconds || 0), 0);
            setLiveStudyTimeSecs(total);
          }
        }
      } catch (e) {
        console.warn("AdminDashboard error fetching study duration from Supabase:", e);
      }
    };
    fetchTime();
    const timer = setInterval(fetchTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Robust live sync loader from Supabase Tables
  const loadLiveDatabaseFields = async () => {
    try {
      const statusRes = await fetch("/api/supabase/status");
      if (statusRes.ok) {
        const status = await statusRes.json();
        setSupabaseConnected(status.enabled);
        setSupabaseRealUrl(status.url || "Not configured");

        if (status.enabled) {
          // 1. Fetch support tickets
          const ticketsRes = await fetch("/api/supabase/tickets");
          if (ticketsRes.ok) {
            const ticketData = await ticketsRes.json();
            if (ticketData.ok && ticketData.tickets) {
              setSupportTickets(ticketData.tickets);
            }
          }

          // 2. Fetch parent & kids
          const usersRes = await fetch("/api/supabase/users");
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            if (usersData.ok) {
              if (usersData.parents && usersData.parents.length > 0) {
                const mappedParents = usersData.parents.map((p: any, idx: number) => ({
                  id: p.email,
                  name: p.name,
                  email: p.email,
                  phone: p.phone || `+234 803 41${idx}-920${idx}`,
                  location: p.location || "Lagos, Nigeria",
                  kids: (usersData.children || [])
                    .filter((c: any) => c.parent_email.toLowerCase() === p.email.toLowerCase())
                    .map((c: any) => c.name),
                  plan: "Premium Cloud Member"
                }));
                setParentRecords(mappedParents);
              }

              if (usersData.children && usersData.children.length > 0) {
                const mappedKids = usersData.children.map((c: any) => {
                  const completedCount = c.completed_lessons ? Object.keys(c.completed_lessons).length : 0;
                  return {
                    id: c.id,
                    name: c.name,
                    ageGroup: (c.age_group === "tiny" || c.age_group === "early explorers") 
                      ? "early" 
                      : (c.age_group === "junior" || c.age_group === "young innovators") 
                      ? "young" 
                      : "future",
                    xp: c.xp || 0,
                    badges: c.interests || ["Onboard Explorer"],
                    status: "Active",
                    parentId: c.parent_email,
                    progress: `${completedCount * 10}%`,
                    lessonsDone: completedCount,
                    is_premium: c.is_premium || false
                  };
                });
                setLearners(mappedKids);
              }
            }
          }

          // 3. Fetch custom parent feedback
          const feedbackRes = await fetch("/api/supabase/feedback/list");
          if (feedbackRes.ok) {
            const feedData = await feedbackRes.json();
            if (feedData.ok && feedData.feedback) {
              setDbFeedback(feedData.feedback);
            }
          }

          // 4. Fetch live curriculum tables
          const liveCurr = await pullCurriculumFromSupabase();
          if (liveCurr) {
            setCurriculumData(liveCurr);
          }

          // 5. Fetch content releases from Supabase
          try {
            const releasesRes = await fetch("/api/supabase/content_releases");
            if (releasesRes.ok) {
              const relData = await releasesRes.json();
              if (relData.ok && relData.data && relData.data.length > 0) {
                setContentReleases(relData.data);
              }
            }
          } catch (err) {
            console.warn("Could not retrieve content releases from Supabase:", err);
          }

          // 6. Fetch B2B Organizations
          try {
            const orgsRes = await fetch("/api/supabase/b2b/organizations");
            if (orgsRes.ok) {
              const orgsData = await orgsRes.json();
              if (orgsData.ok && orgsData.data) {
                const schools = orgsData.data.filter((o: any) => o.type === "School");
                const sponsors = orgsData.data.filter((o: any) => o.type !== "School");
                setSchoolsList(schools.map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  region: s.region,
                  email: "", // Not strictly stored in DB yet, can be added later
                  seats: s.total_seats,
                  status: s.status
                })));
                setRegionsServed(sponsors.map((s: any) => ({
                  id: s.id,
                  sponsorName: s.name,
                  sponsorType: s.type,
                  region: s.region,
                  seats: s.total_seats,
                  status: s.status
                })));
              }
            }
          } catch (err) {
            console.warn("Could not retrieve B2B organizations:", err);
          }
        }
      }
    } catch (e) {
      console.warn("Could not retrieve Supabase status / tables in Admin:", e);
    }
  };

  useEffect(() => {
    loadLiveDatabaseFields();
  }, []);

  const handleTicketAction = async (ticketId: string, nextStatus: string, replyMsg?: string) => {
    const currentTicket = supportTickets.find(t => t.id === ticketId);
    if (!currentTicket) return;

    let updatedReplies = [...(currentTicket.replies || [])];
    if (replyMsg && replyMsg.trim()) {
      updatedReplies.push({
        author: `Operator (${currentRole})`,
        message: replyMsg.trim(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
      });
    }

    const updatedTickets = supportTickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: nextStatus,
          replies: updatedReplies
        };
      }
      return t;
    });

    setSupportTickets(updatedTickets);

    if (supabaseConnected) {
      try {
        const res = await fetch("/api/supabase/tickets/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: ticketId,
            status: nextStatus,
            replies: updatedReplies
          })
        });
        if (res.ok) {
          showToast(`Synchronized ticket ${ticketId} status '${nextStatus}' to Cloud database.`);
        }
      } catch (e) {
        console.warn("Could not save ticket modification to Supabase backend: ", e);
      }
    }
  };

  // Dynamic Role & Permission mapping
  const [rolesPermissions, setRolesPermissions] = useState<Record<AdminRole, { description: string; visibleTabs: TabType[]; customActions: string[] }>>({
    "Super Admin": {
      description: "Full Platform Control & Super Admin / CTO privileges. No restrictions.",
      visibleTabs: ["overview", "analytics", "users", "curriculum", "games", "rewards", "companion", "community", "library", "schools", "government", "reports", "settings", "releases"],
      customActions: ["Create Roles", "Edit Roles", "Delete Roles", "Assign Permissions", "View Revenue", "Manage Subscriptions", "Export All Data"]
    },
    "Content Manager": {
      description: "Manage educational modules, pathways, quizzes, games, and rewards.",
      visibleTabs: ["overview", "curriculum", "games", "rewards", "companion", "library", "releases"],
      customActions: ["Create lessons", "Edit lessons", "Delete lessons", "Upload videos", "Create modules", "Manage pathways", "Create quizzes", "Manage Kobe content", "Manage Chibi content", "Upload worksheets", "Manage games", "Manage rewards"]
    },
    "Community Moderator": {
      description: "Approve parent threads, moderate alerts, workshops and engagement.",
      visibleTabs: ["overview", "community", "reports"],
      customActions: ["Approve posts", "Remove posts", "Flag content", "Manage parent discussions", "Manage announcements", "Moderate comments", "Manage workshops", "Review feedback"]
    },
    "School Administrator": {
      description: "Manage academic licenses, teachers, student rosters, and metrics across regional partner schools.",
      visibleTabs: ["overview", "schools", "reports"],
      customActions: ["Create school accounts", "Manage teachers", "Unify classrooms", "Bulk import students", "Track school performance", "Generate school reports", "Monitor classroom analytics", "Manage school licenses"]
    },
    "Government Partner Viewer": {
      description: "Analyze West African SDG and regional completion dossier files.",
      visibleTabs: ["overview", "government", "reports"],
      customActions: ["View regional metrics", "View state-level analytics", "View completion statistics", "View SDG metrics", "Download reports", "Generate impact reports", "Export PDFs", "View CSR performance"]
    },
    "Curriculum Specialist": {
      description: "Review curriculum pathways, recommend assessments, and suggest learning coordinates.",
      visibleTabs: ["curriculum", "library", "companion", "releases"],
      customActions: ["Review lessons", "Suggest edits", "Create learning objectives", "Manage assessments"]
    },
    "Support Staff": {
      description: "Handle parent queries, assist with credentials, and reset learner profiles.",
      visibleTabs: ["overview", "users"],
      customActions: ["Reset passwords", "Handle tickets", "Assist parents", "View user profiles"]
    }
  });



  // Dedicated support tickets for Support Staff workspace profile
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState("");

  useEffect(() => {
    const allowed = rolesPermissions[currentRole]?.visibleTabs || ["overview"];
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0] || "overview");
    }
  }, [currentRole, rolesPermissions]);

  // Forgot Password flow controls
  const [forgotStep, setForgotStep] = useState<"login" | "email" | "sent" | "reset" | "confirmed">("login");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("");
  const [recoveryConfirmNewPassword, setRecoveryConfirmNewPassword] = useState("");

  // Logout layout modals
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Selected Age Group Filter for Curriculum, Users, Games, Rewards, Content Library
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroupType>("young");

  // Real Datastores mapped from live parents database S
  const [learners, setLearners] = useState<any[]>([]);
  const [parentRecords, setParentRecords] = useState<any[]>([]);

  // Fetch real parents and children from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/supabase/users");
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            // Map parents
            const pList = (data.parents || []).map((par: any) => ({
              id: par.email,
              name: par.name || par.email.split("@")[0],
              email: par.email,
              phone: par.phone || "+234 803 111 2222",
              location: par.location || "Lagos, Nigeria",
              kids: (data.children || []).filter((c: any) => c.parent_email === par.email).map((c: any) => c.name),
              plan: par.plan || "Premium Cloud Member"
            }));
            setParentRecords(pList);

            // Map children (learners)
            const lList = (data.children || []).map((c: any) => {
              // Assume completed is stored as JSON or object
              const completedCount = c.completed && typeof c.completed === "object" ? Object.keys(c.completed).length : 0;
              return {
                id: c.id,
                name: c.name,
                ageGroup: (c.ageGroup === "tiny" || c.ageGroup === "early explorers" || c.ageGroup === "early") 
                  ? "early" 
                  : (c.ageGroup === "junior" || c.ageGroup === "young innovators" || c.ageGroup === "young") 
                  ? "young" 
                  : "future",
                xp: c.xp || 0,
                badges: c.interests || ["Onboard Explorer"],
                status: "Active",
                parentId: c.parent_email,
                progress: `${completedCount * 10}%`,
                lessonsDone: completedCount,
                rawChild: c // Keep raw for quiz results logic
              };
            });
            setLearners(lList);
          }
        }
      } catch (err) {
        console.warn("Could not fetch users from Supabase Admin:", err);
      }
    };
    fetchUsers();
  }, []);

  const [contentReleases, setContentReleases] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("cl_content_releases");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Curriculum State Separated cleanly or filtered
  const [curriculumData, setCurriculumData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("cl_curriculumData");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not parse cl_curriculumData:", e);
    }
    return {
      early: { pathways: [], modules: [], lessons: [], stories: [], quizzes: [] },
      young: { pathways: [], modules: [], lessons: [], projects: [], quizzes: [] },
      future: { pathways: [], modules: [], lessons: [], projects: [], quizzes: [] }
    };
  });

  const [games, setGames] = useState<any>({
    early: [],
    young: [],
    future: []
  });

  const [rewardsList, setRewardsList] = useState<any>({
    early: [],
    young: [],
    future: []
  });

  // State handles for create/edit operations
  const [selectedPathwayId, setSelectedPathwayId] = useState<string | null>(null);
  const [newPathwayName, setNewPathwayName] = useState("");
  const [newPathwayDesc, setNewPathwayDesc] = useState("");

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDescription, setNewLessonDescription] = useState("");
  const [newLessonXP, setNewLessonXP] = useState(120);
  const [newLessonType, setNewLessonType] = useState("Video Lesson");

  // State handles for Editing/Publishing/Quizzes
  const [editingPathwayId, setEditingPathwayId] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptionA, setQuizOptionA] = useState("");
  const [quizOptionB, setQuizOptionB] = useState("");
  const [quizOptionC, setQuizOptionC] = useState("");
  const [quizOptionD, setQuizOptionD] = useState("");
  const [quizCorrectAnswer, setQuizCorrectAnswer] = useState("A");
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [newLessonDuration, setNewLessonDuration] = useState("5");
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState("");

  // Kobe & Chibi Companion Manager State
  const [selectedCompanion, setSelectedCompanion] = useState<"kobe" | "chibi">("kobe");
  const [ttsEngine, setTtsEngine] = useState("Google Cloud Neural Voices (High Parity)");
  const [pitchValue, setPitchValue] = useState(1.10);
  const [rateValue, setRateValue] = useState(0.95);
  const [voiceVoice, setVoiceVoice] = useState("Male W.A. Dialect (Kobe)");

  const [voiceConfigs, setVoiceConfigs] = useState(() => ({ ...companionVoice.configs }));

  // Synchronize local config sliders/inputs on companion switch or loading
  useEffect(() => {
    const activeConf = voiceConfigs[selectedCompanion];
    if (activeConf) {
      setPitchValue(activeConf.speech_pitch);
      setRateValue(activeConf.speech_rate);
    }
  }, [selectedCompanion, voiceConfigs]);

  // Save config directly to database as requested
  const saveVoiceConfigSetting = async (comp: "kobe" | "chibi", updates: any) => {
    const ok = await companionVoice.saveConfig(comp, updates);
    if (ok) {
      setVoiceConfigs({ ...companionVoice.configs });
      showToast(`Successfully saved ${comp} specs to Supabase relational DB!`);
    } else {
      setVoiceConfigs({ ...companionVoice.configs });
      showToast(`Saved locally! Enable Supabase connection in your Settings to sync.`);
    }
  };

  const handleUploadFileAdmin = async (e: React.ChangeEvent<HTMLInputElement>, comp: "kobe" | "chibi") => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast(`Reading ${file.name}...`);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = (event.target?.result as string).split(",")[1];
      showToast(`Uploading ${file.name} to Supabase storage...`);

      try {
        const res = await fetch("/api/supabase/storage/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: comp === "kobe" ? "Kobe_Greeting_Intro_Nigeria.mp3" : "Chibi_Bedtime_Story_Axe_Senegal.mp3",
            base64Data,
            contentType: file.type
          })
        });

        const data = await res.json();
        if (data.ok) {
          showToast(`Successfully uploaded ${comp} audio to bucket!`);
          // Save url directly inside companion_config table on Supabase!
          await saveVoiceConfigSetting(comp, { voice_url: data.url });
        } else {
          showToast(`Upload failed: ${data.msg || "Server error"}`);
        }
      } catch (err: any) {
        showToast("Network upload error.");
        console.error("Upload failed", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const [compActivity, setCompActivity] = useState<any[]>([]);

  // Content Library state
  const [libSearch, setLibSearch] = useState("");
  const [libCategory, setLibCategory] = useState("All");
  const [centralLibrary, setCentralLibrary] = useState<any[]>([]);

  // B2B Schools State
  const [licenseQuery, setLicenseQuery] = useState("");
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolRegion, setNewSchoolRegion] = useState("");
  const [newSchoolEmail, setNewSchoolEmail] = useState("");
  const [newSchoolSeats, setNewSchoolSeats] = useState(120);

  // B2G CSR State
  const [regionsServed, setRegionsServed] = useState<any[]>([]);
  const [newSponsorName, setNewSponsorName] = useState("");
  const [newSponsorType, setNewSponsorType] = useState("Corporate CSR");
  const [newSponsorRegion, setNewSponsorRegion] = useState("");
  const [newSponsorSeats, setNewSponsorSeats] = useState(500);

  // Community State
  const [postsList, setPostsList] = useState<any[]>([]);
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);
  const [newEvent, setNewEvent] = useState({ tag: "Discussions", tag_color: "text-slate-400", title: "", description: "", link_url: "", event_datetime: "" });

  // Settings State Handles
  const [stripeSecret, setStripeSecret] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [youtubeApiKey, setYoutubeApiKey] = useState("");

  // Dynamic governance configuration states
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleTabs, setNewRoleTabs] = useState<TabType[]>(["overview"]);
  const [selectedRoleToEdit, setSelectedRoleToEdit] = useState<AdminRole>("Content Manager");
  
  // New Admin creation states
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>("Support Staff");

  // Payment Gateways Settings
  const [paystackKey, setPaystackKey] = useState("");
  const [paystackSecret, setPaystackSecret] = useState("");
  const [paystackActive, setPaystackActive] = useState(false);

  const [flutterwaveKey, setFlutterwaveKey] = useState("");
  const [flutterwaveSecret, setFlutterwaveSecret] = useState("");
  const [flutterwaveActive, setFlutterwaveActive] = useState(false);

  // Pricing Settings
  const [monthlyPrice, setMonthlyPrice] = useState("5000");
  const [yearlyPrice, setYearlyPrice] = useState("50000");
  const [currency, setCurrency] = useState("NGN");

  const fetchGatewaysAndPricing = async () => {
    try {
      const res = await fetch("/api/supabase/payment_gateways");
      const data = await res.json();
      if (data.ok && data.gateways) {
        data.gateways.forEach((gw: any) => {
          if (gw.gateway_name === "paystack") {
            setPaystackKey(gw.public_key || "");
            setPaystackSecret(gw.secret_key || "");
            setPaystackActive(gw.is_active || false);
          } else if (gw.gateway_name === "flutterwave") {
            setFlutterwaveKey(gw.public_key || "");
            setFlutterwaveSecret(gw.secret_key || "");
            setFlutterwaveActive(gw.is_active || false);
          }
        });
      }
      
      const priceRes = await fetch("/api/supabase/pricing");
      const priceData = await priceRes.json();
      if (priceData.ok && priceData.plans) {
        priceData.plans.forEach((plan: any) => {
          if (plan.plan_name === "Monthly Premium") {
            setMonthlyPrice(plan.price.toString());
            setCurrency(plan.currency);
          } else if (plan.plan_name === "Yearly Premium") {
            setYearlyPrice(plan.price.toString());
            setCurrency(plan.currency);
          }
        });
      }
    } catch (e) {}
  };

  // Fetch community events
  const fetchCommunityEvents = async () => {
    if (!supabaseConnected) return;
    setIsFetchingEvents(true);
    try {
      const res = await fetch("/api/supabase/community");
      const data = await res.json();
      if (data.ok) {
        setCommunityEvents(data.events);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingEvents(false);
    }
  };

  useEffect(() => {
    if (activeTab === "community") {
      fetchCommunityEvents();
    } else if (activeTab === "settings" && currentRole === "Super Admin") {
      fetchGatewaysAndPricing();
    }
  }, [activeTab, supabaseConnected, currentRole]);

  const handleAddCommunityEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.tag) return showToast("Title and tag are required");
    try {
      const res = await fetch("/api/supabase/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent)
      });
      const data = await res.json();
      if (data.ok) {
        showToast("Community event added!");
        setNewEvent({ tag: "Discussions", tag_color: "text-slate-400", title: "", description: "", link_url: "", event_datetime: "" });
        fetchCommunityEvents();
      } else {
        showToast("Error adding event: " + data.msg);
      }
    } catch (e: any) {
      showToast("Error adding event: " + e.message);
    }
  };

  const handleDeleteCommunityEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch(`/api/supabase/community?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        showToast("Event deleted!");
        fetchCommunityEvents();
      }
    } catch (e: any) {
      showToast("Error deleting event");
    }
  };

  const handleToggleEventStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/supabase/community", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });
      const data = await res.json();
      if (data.ok) {
        showToast("Event status updated!");
        fetchCommunityEvents();
      }
    } catch (e: any) {
      showToast("Error updating status");
    }
  };

  // Save changes automatically
  const handleSaveAllToLocalStorage = (customReleases?: any[]) => {
    localStorage.setItem("cl_learners", JSON.stringify(learners));
    localStorage.setItem("cl_parentRecords", JSON.stringify(parentRecords));
    localStorage.setItem("cl_curriculumData", JSON.stringify(curriculumData));
    localStorage.setItem("cl_games", JSON.stringify(games));
    localStorage.setItem("cl_rewardsList", JSON.stringify(rewardsList));
    localStorage.setItem("cl_schoolsList", JSON.stringify(schoolsList));
    localStorage.setItem("cl_regionsServed", JSON.stringify(regionsServed));
    localStorage.setItem("cl_content_releases", JSON.stringify(customReleases || contentReleases));
    showToast("Decrypted administrative datastore synced securely.");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };



  // Quick Action Utilities (Database authoritative, no local-only fallback)
  const handleAddPathway = async () => {
    if (!newPathwayName) {
      showToast("Pathway name is required!");
      return;
    }
    const pathwayId = editingPathwayId || "pw" + Date.now();
    try {
      const res = await fetch("/api/supabase/learning_pathways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pathwayId,
          title: newPathwayName,
          description: newPathwayDesc || "Custom structured development pathway.",
          age_group: selectedAgeGroup,
          status: "active"
        })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(editingPathwayId ? "Pathway updated successfully!" : `Pathway '${newPathwayName}' provisioned.`);
        setNewPathwayName("");
        setNewPathwayDesc("");
        setEditingPathwayId(null);
        // Refresh live cache and state immediately
        const fresh = await pullCurriculumFromSupabase();
        if (fresh) setCurriculumData(fresh);
      } else {
        showToast(`Sync failure: ${data.error || "Could not write to Supabase"}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleEditPathwayStart = (p: any) => {
    setEditingPathwayId(p.id);
    setNewPathwayName(p.name);
    setNewPathwayDesc(p.desc);
    showToast(`Focused pathway '${p.name}' for edits.`);
  };

  const handleDeletePathway = async (id: string) => {
    if (!confirm("Are you sure you want to delete this track? This will delete all connected curriculum components.")) return;
    try {
      const res = await fetch(`/api/supabase/learning_pathways/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.ok) {
        showToast("Pathway track removed from active matrix.");
        if (selectedPathwayId === id) setSelectedPathwayId(null);
        const fresh = await pullCurriculumFromSupabase();
        if (fresh) setCurriculumData(fresh);
      } else {
        showToast(`Deletion failed: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Error deleting pathway: ${err.message}`);
    }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle) {
      showToast("Module title is required!");
      return;
    }
    if (!selectedPathwayId) {
      showToast("Please choose or focus an active parent pathway first!");
      return;
    }
    const moduleId = editingModuleId || "mod" + Date.now();
    const orderNum = (curriculumData[selectedAgeGroup]?.modules?.length || 0) + 1;
    try {
      const res = await fetch("/api/supabase/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: moduleId,
          pathway_id: selectedPathwayId,
          title: newModuleTitle,
          description: "Admin structured module category.",
          age_group: selectedAgeGroup,
          order_number: orderNum
        })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(editingModuleId ? "Module updated!" : `Module '${newModuleTitle}' cataloged.`);
        setNewModuleTitle("");
        setEditingModuleId(null);
        const fresh = await pullCurriculumFromSupabase();
        if (fresh) setCurriculumData(fresh);
      } else {
        showToast(`Module sync failure: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleEditModuleStart = (m: any) => {
    setEditingModuleId(m.id);
    setNewModuleTitle(m.title || m.name?.en || m.name);
    showToast(`Focused module '${m.title || m.name?.en || m.name}' for edits.`);
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm("Delete this module and all its contents?")) return;
    try {
      const res = await fetch(`/api/supabase/modules/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        showToast("Module wiped safely from curriculum database.");
        if (selectedModuleId === id) setSelectedModuleId(null);
        const fresh = await pullCurriculumFromSupabase();
        if (fresh) setCurriculumData(fresh);
      } else {
        showToast(`Deletion failed: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Error deleting module: ${err.message}`);
    }
  };

  const handleAddLesson = async () => {
    if (!newLessonTitle) {
      showToast("Lesson title is required!");
      return;
    }
    if (!selectedModuleId) {
      showToast("Please focus an active module category before appending lessons.");
      return;
    }
    const lessonId = editingLessonId || "les" + Date.now();
    const est = parseInt(newLessonDuration) || 5;

    try {
      const res = await fetch("/api/supabase/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lessonId,
          module_id: selectedModuleId,
          title: newLessonTitle, 
          description: newLessonDescription || `Custom ${newLessonType} curated for system intelligence.`,
          video_url: newLessonVideoUrl || "",
          lesson_order: (curriculumData[selectedAgeGroup]?.lessons?.length || 0) + 1,
          estimated_duration: est,
          status: "published"
        })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(editingLessonId ? "Lesson updated!" : `Lesson '${newLessonTitle}' published core!`);
        setNewLessonTitle("");
        setNewLessonDescription("");
        setNewLessonVideoUrl("");
        setNewLessonDuration("5");
        setEditingLessonId(null);
        const fresh = await pullCurriculumFromSupabase();
        if (fresh) setCurriculumData(fresh);
      } else {
        showToast(`Sync failure: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleEditLessonStart = (les: any) => {
    setEditingLessonId(les.id);
    setNewLessonTitle(les.title?.en || les.title);
    setNewLessonDescription(les.description?.en || les.description || "");
    
    // Explicitly focus the parent module so saving works without manual clicks
    if (les.moduleId || les.module_id) {
      setSelectedModuleId(les.moduleId || les.module_id);
    }
    
    // Parse the lesson type from description if possible, or support fallback
    let typeFound = "Video Lesson";
    if (les.type) {
      typeFound = les.type;
    } else if (les.description) {
      if (les.description.includes("Story Lesson")) {
        typeFound = "Story Lesson";
      } else if (les.description.includes("Interactive Laboratory") || les.description.includes("Interactive Lab")) {
        typeFound = "Interactive Laboratory";
      }
    }
    setNewLessonType(typeFound);

    setNewLessonVideoUrl(les.youtubeUrl || les.video_url || "");
    const durRaw = String(les.progressTime || les.duration || "5").replace(/\D/g, "");
    setNewLessonDuration(durRaw || "5");
    showToast(`Focused lesson '${les.title?.en || les.title}' for edits.`);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Delete this lesson? This will clear its quiz questions.")) return;
    try {
      const res = await fetch(`/api/supabase/lessons/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        showToast("Lesson cleared from record matrix successfully.");
        if (selectedLessonId === id) setSelectedLessonId(null);
        const fresh = await pullCurriculumFromSupabase();
        if (fresh) setCurriculumData(fresh);
      } else {
        showToast(`Deletion failed: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Error deleting lesson: ${err.message}`);
    }
  };

  const handleTogglePublishLesson = async (les: any) => {
    const nextStatus = les.published ? "draft" : "published";
    try {
      const res = await fetch("/api/supabase/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: les.id,
          module_id: les.moduleId,
          title: les.title?.en || les.title,
          description: les.story?.en || "Custom curated content stream.",
          video_url: les.youtubeUrl || "",
          lesson_order: 1,
          estimated_duration: 5,
          status: nextStatus
        })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`Lesson ${nextStatus === "published" ? "Published live!" : "Moved to Drafts"}`);
        const fresh = await pullCurriculumFromSupabase();
        if (fresh) setCurriculumData(fresh);
      } else {
        showToast(`Status change failed: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Quiz Questions CRUD Handlers
  const handleSaveQuizQuestion = async () => {
    if (!quizQuestion || !quizOptionA || !quizOptionB) {
      showToast("Question and at least Option A & B are required!");
      return;
    }
    const lessonFocusId = selectedLessonId || editingLessonId;
    if (!lessonFocusId) {
      showToast("Please focus or select a Lesson to attach the quiz question!");
      return;
    }
    const quizId = editingQuizId || "qz" + Date.now();
    try {
      const res = await fetch("/api/supabase/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quizId,
          lesson_id: lessonFocusId,
          question: quizQuestion,
          option_a: quizOptionA,
          option_b: quizOptionB,
          option_c: quizOptionC || "None",
          option_d: quizOptionD || "None",
          correct_answer: quizCorrectAnswer
        })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(editingQuizId ? "Quiz question updated!" : "Quiz question appended successfully!");
        setQuizQuestion("");
        setQuizOptionA("");
        setQuizOptionB("");
        setQuizOptionC("");
        setQuizOptionD("");
        setQuizCorrectAnswer("A");
        setEditingQuizId(null);
        const fresh = await pullCurriculumFromSupabase();
        if (fresh) setCurriculumData(fresh);
      } else {
        showToast(`Quiz sync error: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleEditQuizStart = (qObj: any) => {
    setEditingQuizId(qObj.id);
    setQuizQuestion(qObj.question);
    setQuizOptionA(qObj.options?.[0] || "");
    setQuizOptionB(qObj.options?.[1] || "");
    setQuizOptionC(qObj.options?.[2] || "");
    setQuizOptionD(qObj.options?.[3] || "");
    setQuizCorrectAnswer(qObj.correct || "A");
    showToast("Focused quiz question for edits.");
  };

  const handleDeleteQuizQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz question?")) return;
    try {
      const res = await fetch(`/api/supabase/quizzes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        showToast("Quiz question cleared safely.");
        const fresh = await pullCurriculumFromSupabase();
        if (fresh) setCurriculumData(fresh);
      } else {
        showToast(`Deletion failed: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Error deleting quiz: ${err.message}`);
    }
  };

  const handlePlayVoicePreview = (phrase: string) => {
    // Detect which character is being previewed. Default to selectedCompanion.
    const char = phrase.toLowerCase().includes("kobe") ? "kobe" : (phrase.toLowerCase().includes("chibi") ? "chibi" : selectedCompanion);
    companionVoice.speak(phrase, char, "young innovators", false);
    const mode = companionVoice.configs[char].voice_mode;
    showToast(`Narrating vocal using ${mode}: "${phrase}"`);
  };

  // Color mappings based on dynamic theme configuration with white baseline requested
  const textPrimary = isDark ? "text-white" : "text-[#111827]";
  const textSecondary = isDark ? "text-[#D1D5DB]" : "text-[#6B7280]";
  const bgMain = isDark ? "bg-[#0B0F14]" : "bg-[#FFFFFF]";
  const bgCard = isDark 
    ? "bg-[#111827] border-[#1F2937] text-white shadow-xs" 
    : "bg-[#FFFFFF] border border-[#E5E7EB] text-[#111827] shadow-xs hover:border-slate-300 transition-colors duration-150";

  const bgCardYellow = bgCard;
  const bgCardPurple = bgCard;
  const borderCol = isDark ? "border-[#1F2937]" : "border-[#E5E7EB]";

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!adminEmail.trim()) {
      setAuthError("Email address field cannot be empty.");
      return;
    }
    if (!adminPassword.trim()) {
      setAuthError("Password field cannot be empty.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      setAuthError("Invalid email address. Please check your spelling.");
      return;
    }

    try {
      const res = await fetch("/api/supabase/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      const data = await res.json();
      if (data.ok) {
        setIsAuthenticated(true);
        setCurrentRole(data.admin?.role || "Super Admin");
        localStorage.setItem("clats_admin_authenticated", "true");
        if (rememberMe) {
          localStorage.setItem("clats_admin_remember", "true");
          localStorage.setItem("clats_admin_email", adminEmail);
        } else {
          localStorage.removeItem("clats_admin_remember");
          localStorage.removeItem("clats_admin_email");
        }
        showToast("Tunnel Authorized: Enterprise OS session online.");
      } else {
        setAuthError(data.msg || "Invalid credentials. Please verify your email and password.");
      }
    } catch (err) {
      setAuthError("Network error. Could not connect to backend.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col md:flex-row font-sans text-slate-100 select-none overflow-hidden">
        {/* LEFT CODE PANEL: Elegant Branding with Subtle SaaS Illustration */}
        <div className="w-full md:w-[45%] bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#1E293B] p-12 text-white hidden md:flex flex-col justify-between relative overflow-hidden border-r border-slate-800 min-h-screen">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#2EC4B6]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-[#B8A0FF]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Core App Icon Branding */}
          <div className="flex items-center gap-3 relative z-10">
            <span className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#2EC4B6] to-[#B8A0FF] text-white font-black flex items-center justify-center text-xl shadow-lg shadow-[#2EC4B6]/20">
              C
            </span>
            <div>
              <span className="text-xl font-black text-white tracking-tight">C<span className="text-[#2EC4B6]">LATS</span></span>
              <span className="text-[9px] bg-[#B8A0FF]/25 text-[#B8A0FF] font-mono px-2 py-0.5 rounded-md block uppercase tracking-widest font-black mt-0.5">
                Administrative System
              </span>
            </div>
          </div>

          {/* Primary Core Messages */}
          <div className="space-y-6 relative z-10 my-auto">
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white max-w-md">
              Manage the Future of Learning
            </h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
              Access the CLATS Administrative Console to manage learners, curriculum, schools, analytics, and platform operations.
            </p>

            {/* Custom high-fidelity SaaS metrics widget */}
            <div className="bg-[#1E293B]/80 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden max-w-md mt-10 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#2EC4B6] font-bold">LIVE METRIC OVERVIEW</span>
                <span className="h-2 w-2 rounded-full bg-[#2EC4B6] animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0F172A]/70 p-3.5 rounded-2xl border border-slate-800/40">
                  <span className="text-[9px] text-[#2EC4B6] uppercase tracking-wide font-extrabold block">ENROLLED LEARNERS</span>
                  <div className="text-xl font-black text-white mt-1">{learners.length} Students</div>
                  <span className="text-[9px] text-emerald-400 font-mono">Synced from database</span>
                </div>
                <div className="bg-[#0F172A]/70 p-3.5 rounded-2xl border border-slate-800/40">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wide font-black block">CURRICULUM NODES</span>
                  <div className="text-xl font-black text-white mt-1">
                    {(curriculumData.early?.modules?.length || 0) +
                     (curriculumData.young?.modules?.length || 0) +
                     (curriculumData.future?.modules?.length || 0)} modules
                  </div>
                  <span className="text-[9px] text-[#B8A0FF] font-mono">Tracked live</span>
                </div>

                <div className="col-span-2 bg-[#0F172A]/70 p-3.5 rounded-2xl border border-slate-800/40 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-[#2EC4B6] uppercase tracking-wide font-extrabold block">REAL-TIME PLATFORM STUDY TIME</span>
                    <div className="text-xl font-black text-white mt-1 font-mono tracking-wider">
                      {Math.floor(liveStudyTimeSecs / 3600)}h {Math.floor((liveStudyTimeSecs % 3600) / 60)}m {liveStudyTimeSecs % 60}s
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9.5px] text-[#B8A0FF] font-black uppercase font-mono block">ACTIVE</span>
                    <span className="text-[9.5px] text-slate-400 font-mono">Ticking live...</span>
                  </div>
                </div>
              </div>

              {/* Learning progress simulation metrics */}
              <div className="space-y-2 pt-1 font-mono">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>🤖 Machine Intelligence Loggers</span>
                  <span className="text-emerald-400 font-extrabold">Active</span>
                </div>
                <div className="w-full bg-[#0F172A] h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#2EC4B6] to-[#B8A0FF] h-full rounded-full" style={{ width: "95%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono relative z-10">
            ENVIRONMENT STATUS: <span className="text-emerald-400">SECURE SHELL v4.22</span>
          </div>
        </div>

        {/* RIGHT HAND CONTENT: Clean admin authentication interfaces */}
        <div className="w-full md:w-[55%] bg-[#0F172A] flex items-center justify-center p-6 min-h-screen relative font-sans">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2EC4B6]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-full max-w-md bg-[#1E293B] border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative space-y-6">
            
            {/* BACK BUTTON */}
            <button
              onClick={onBackToPortal}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-[#2EC4B6] transition-all absolute top-6 left-6"
            >
              <ArrowLeft size={14} /> Back to Portal
            </button>

            {/* HEADER METRICS */}
            <div className="text-center md:text-left pt-4">
              <h2 className="text-2xl font-black tracking-tight text-white mb-1.5 pt-4">
                {forgotStep === "login" && "Administrator Sign In"}
                {forgotStep === "email" && "Reset Security Account"}
                {forgotStep === "sent" && "Transmission Dispatched"}
                {forgotStep === "reset" && "Set Security Code"}
                {forgotStep === "confirmed" && "Update Confirmed"}
              </h2>
              <p className="text-xs text-slate-400 leading-normal">
                {forgotStep === "login" && "Authenticating with enterprise-grade authorization."}
                {forgotStep === "email" && "Step 1: Specify your registered administrator email address to send a secure recovery hash."}
                {forgotStep === "sent" && "Step 2: A temporary reset verification link has been sent to your inbox."}
                {forgotStep === "reset" && "Step 3: Provide a new secure access pattern or password to restore the console."}
                {forgotStep === "confirmed" && "Restoration complete. Proceed back to main secure administrative gate."}
              </p>
            </div>

            {/* FLOW ROUTER */}
            {forgotStep === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Email Address
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 focus:border-[#2EC4B6] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-[#2EC4B6]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">
                      Password
                    </label>
                  </div>
                  <input
                    type="password"
                    placeholder=""
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 focus:border-[#2EC4B6] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-[#2EC4B6]"
                  />
                </div>

                {/* REMEMBER ME CHECKBOX */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#2EC4B6] rounded border-slate-800 bg-[#0F172A]"
                    />
                    <span>Remember Me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep("email");
                      setRecoveryEmail(adminEmail || "");
                    }}
                    className="text-xs text-[#2EC4B6] hover:text-teal-400 font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>

                {authError && (
                  <p className="text-xs text-red-400 bg-red-950/25 border border-red-900/50 px-3.5 py-2 rounded-xl flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" /> {authError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#2EC4B6] hover:bg-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md shadow-[#2EC4B6]/10"
                >
                  Sign In
                </button>
              </form>
            )}

            {forgotStep === "email" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Enter Email Address
                  </label>
                  <input
                    type="email"
                    placeholder=""
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 focus:border-[#2EC4B6] rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>
                
                <button
                  onClick={() => {
                    if (!recoveryEmail.trim() || !recoveryEmail.includes("@")) {
                      alert("Please provide a valid email format.");
                      return;
                    }
                    setForgotStep("sent");
                    showToast("Recovery dispatch completed.");
                  }}
                  className="w-full bg-[#2EC4B6] hover:bg-teal-500 text-slate-950 font-black text-xs uppercase py-3 rounded-xl transition-all"
                >
                  Send Reset Link
                </button>

                <button
                  onClick={() => setForgotStep("login")}
                  className="w-full py-2.5 text-center text-xs text-slate-400 hover:text-white"
                >
                  Back to Sign In
                </button>
              </div>
            )}

            {forgotStep === "sent" && (
              <div className="space-y-5 text-center">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs leading-relaxed">
                  Password reset link sent to <strong>{recoveryEmail}</strong>! Please verify authorization.
                </div>

                <button
                  onClick={() => {
                    setRecoveryNewPassword("");
                    setRecoveryConfirmNewPassword("");
                    setForgotStep("reset");
                  }}
                  className="w-full bg-[#B8A0FF] hover:bg-purple-400 text-slate-950 font-black text-xs uppercase py-3 rounded-xl transition-all"
                >
                  Proceed to Reset Password (Demo)
                </button>

                <button
                  onClick={() => setForgotStep("login")}
                  className="text-xs text-slate-400 hover:text-white block mx-auto pt-2"
                >
                  Cancel and Sign In
                </button>
              </div>
            )}

            {forgotStep === "reset" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={recoveryNewPassword}
                    onChange={(e) => setRecoveryNewPassword(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 focus:border-[#2EC4B6] rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={recoveryConfirmNewPassword}
                    onChange={(e) => setRecoveryConfirmNewPassword(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 focus:border-[#2EC4B6] rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!recoveryNewPassword.trim()) {
                      alert("Password cannot be blank.");
                      return;
                    }
                    if (recoveryNewPassword !== recoveryConfirmNewPassword) {
                      alert("Passwords do not match. Please verify.");
                      return;
                    }
                    setAdminPassword(recoveryNewPassword);
                    setForgotStep("confirmed");
                    showToast("Password updated successfully.");
                  }}
                  className="w-full bg-[#FFD166] hover:bg-amber-400 text-slate-950 font-black text-xs uppercase py-3 rounded-xl transition-all"
                >
                  Confirm Reset
                </button>
              </div>
            )}

            {forgotStep === "confirmed" && (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs">
                  Your password has been reset successfully. Please proceed to Sign In.
                </div>

                <button
                  onClick={() => setForgotStep("login")}
                  className="w-full bg-[#2EC4B6] hover:bg-teal-500 text-slate-950 font-black text-xs uppercase py-3 rounded-xl transition-all"
                >
                  Sign In with New Password
                </button>
              </div>
            )}

            {/* Note alert */}
            <div className="border-t border-slate-800 pt-5 text-center">
              <span className="text-[10px] text-slate-500 font-medium">
                Authorized CLATS administrators only. Session monitored.
              </span>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgMain} flex flex-col lg:flex-row font-sans transition-colors duration-200 ${isDark ? "dark" : ""}`}>
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] bg-[#1A1A1A] text-[#2EC4B6] border border-[#2EC4B6]/30 px-4 py-3 rounded-xl shadow-2xl text-xs font-mono font-bold flex items-center gap-2">
          <Sparkles size={14} className="animate-spin text-[#FFD166]" />
          <span>{toast}</span>
        </div>
      )}

      {/* ADMIN LEVEL SIDEBAR */}
      <aside className={`w-full lg:w-[280px] border-r flex flex-col flex-shrink-0 transition-colors duration-200 ${
        isDark
          ? "bg-[#111827] text-slate-300 border-slate-800"
          : "bg-white text-[#1A1A1A] border-slate-200 shadow-sm"
      }`}>
        {/* LOGO AREA */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? "border-[#1F2937]" : "border-[#E5E7EB]"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-[#14B8A6] text-white font-black flex items-center justify-center text-xl shadow-sm">
              C
            </span>
            <div>
              <h2 className={`text-xs font-black tracking-widest uppercase m-0 leading-none ${
                isDark ? "text-white" : "text-[#111827]"
              }`}>
                CLATS ADMIN
              </h2>
              <span className="text-[9px] text-[#14B8A6] font-mono uppercase font-bold tracking-wider">
                Enterprise Hub OS
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`text-[10px] font-bold py-1 px-2 border rounded-lg transition-all ${
              isDark
                ? "text-slate-400 border-[#1F2937] hover:text-white hover:bg-slate-800"
                : "text-slate-600 border-[#E5E7EB] hover:bg-slate-50 hover:text-[#111827]"
            }`}
          >
            Exit
          </button>
        </div>

        {/* ADMIN USER IDENTIFICATION CARD */}
        <div className={`p-4 border-b flex items-center gap-3 transition-colors duration-200 ${
          isDark ? "border-[#1F2937]" : "border-[#E5E7EB]"
        }`}>
          <div className="h-9 w-9 rounded-full bg-[#14B8A6]/10 border border-[#14B8A6]/30 flex items-center justify-center font-black text-[#14B8A6] text-sm flex-shrink-0">
            OA
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-xs font-black truncate m-0 ${isDark ? "text-white" : "text-[#111827]"}`}>
              Onyiobazi Aquah
            </h4>
            <span className="text-[9px] text-[#14B8A6] font-mono block leading-tight font-bold">
              Super Admin / CTO
            </span>
          </div>
        </div>

        {/* CURRENT ROLE SWITCHER (SIMULATED RBAC) */}
        <div className={`p-4 border-b transition-colors duration-200 ${
          isDark ? "bg-[#0B0F14]/40 border-[#1F2937]" : "bg-slate-50/50 border-[#E5E7EB]"
        }`}>
          <div className="flex justify-between items-center mb-1.5">
            <label className={`block text-[8px] font-bold uppercase tracking-widest ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}>
              Simulated Authority Role
            </label>
          </div>
          <select
            value={currentRole}
            onChange={(e) => {
              const selectedValue = e.target.value as AdminRole;
              setCurrentRole(selectedValue);
              showToast(`Adapted capabilities for: ${selectedValue}`);
            }}
            className={`w-full text-[10px] font-mono font-bold rounded-lg px-2.5 py-1.5 focus:outline-none border ${
              isDark
                ? "bg-[#111827] border-[#1F2937] text-slate-300"
                : "bg-white border-[#E5E7EB] text-[#111827] shadow-3xs"
            }`}
          >
            <option value="Super Admin">
              👑 Super Admin (Full Access)
            </option>
            <option value="Content Manager">🎓 Content Manager</option>
            <option value="Community Moderator">💬 Community Mod</option>
            <option value="School Administrator">🏫 School Admin</option>
            <option value="Government Partner Viewer">🏛️ Gov Partner</option>
            <option value="Curriculum Specialist">💡 Curriculum Specialist</option>
            <option value="Support Staff">🛠️ Support Staff</option>
          </select>
        </div>

        {/* SIDEBAR NAVIGATION LIST */}
        <nav className="p-3.5 space-y-1.5 overflow-y-auto flex-1">
          {[
            { id: "overview", label: "Dashboard", icon: BarChart3 },
            { id: "curriculum", label: "Curriculum Builder", icon: ListOrdered },
            { id: "library", label: "Content Library", icon: Layers },
            { id: "releases", label: "Content Release Manager", icon: Calendar },
            { id: "users", label: "Users & Parents", icon: Users },
            { id: "analytics", label: "Analytics Center", icon: TrendingUp },
            { id: "games", label: "Games Manager", icon: Gamepad2 },
            { id: "rewards", label: "Rewards & Badges", icon: Award },
            { id: "companion", label: "Companion System", icon: Sparkles },
            { id: "community", label: "Community Mod", icon: MessageSquare },
            { id: "schools", label: "B2B Schools", icon: Building },
            { id: "government", label: "B2G Government & CSR", icon: Globe },
            { id: "reports", label: "Reports Center", icon: FileDown },
            { id: "settings", label: "Platform Settings", icon: Settings }
          ].filter((item) => {
            const allowed = rolesPermissions[currentRole]?.visibleTabs || ["overview"];
            return allowed.includes(item.id as TabType);
          }).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <Link
                key={item.id}
                href={`/admin/${item.id}`}
                className={`w-full flex items-center justify-between px-3 py-2.2 text-xs font-bold rounded-xl transition-all ${
                  active
                    ? "bg-[#14B8A6]/10 text-[#14B8A6]"
                    : isDark
                      ? "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-black"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={14} className={active ? "text-[#14B8A6]" : "text-slate-400"} />
                  <span>{item.label}</span>
                </span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6]" />}
              </Link>
            );
          })}
        </nav>

        {/* REGIONAL STATS BADGE */}
        <div className={`p-4 border-t text-[10px] font-mono ${
          isDark ? "border-[#1F2937] text-slate-500" : "border-[#E5E7EB] text-slate-400 bg-slate-50/50"
        }`}>
          <div className="flex justify-between font-black">
            <span>CLATS OS</span>
            <span className="text-[#14B8A6]">ACTIVE SECURE</span>
          </div>
          <span className="block mt-1 text-[8px] uppercase tracking-wider text-slate-400">West African Orchestration</span>
        </div>
      </aside>

      {/* CORE WORK DISPLAY ENGINE */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* TOP BAR BRAND CRUMB */}
        <header className={`px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200 ${
          isDark
            ? "bg-[#111827] border-[#1F2937] text-white"
            : "bg-white border-[#E5E7EB] text-[#111827] shadow-3xs"
        }`}>
          <div>
            <span className="text-[9px] font-mono font-extrabold text-[#14B8A6] uppercase tracking-widest block">
              CLATS CONTROL SUITE
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <h1 className="text-lg font-black tracking-tight capitalize m-0">
                {activeTab === "overview" ? "Executive Command Center" : `${activeTab} Management`}
              </h1>
              <span className="text-[10px] bg-[#14B8A6]/15 text-[#14B8A6] px-2 py-0.5 rounded-md font-bold font-mono">
                {currentRole}
              </span>
              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-mono border select-none ${
                supabaseConnected 
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-black" 
                  : "bg-amber-500/10 border-amber-500/25 text-amber-400 font-black"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${supabaseConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span>{supabaseConnected ? "SUPABASE ACTIVE" : "LOCAL WORKSPACE"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* LIGHT / DARK / SYSTEM TOGGLER */}
            <div className={`hidden md:flex items-center gap-0.5 p-1 rounded-xl border ${
              isDark ? "bg-[#0B0F14] border-[#1F2937]" : "bg-slate-100 border-[#E5E7EB]"
            }`}>
              {[
                { id: "light", label: "Light" },
                { id: "dark", label: "Dark" },
                { id: "system", label: "System" }
              ].map((t) => {
                const active = adminTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setAdminTheme(t.id as "light" | "dark" | "system");
                      showToast(`Theme updated to ${t.label} mode.`);
                    }}
                    className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${
                      active
                        ? (isDark ? "bg-slate-800 text-white" : "bg-white text-[#111827] shadow-xs")
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* SYNC LOCALSTORAGE DISPATCH */}
            <button
              onClick={() => handleSaveAllToLocalStorage()}
              className="bg-[#14B8A6] hover:bg-[#0d9488] text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs transition-with-transform flex items-center gap-1.5"
            >
              <Save size={13} />
              <span className="hidden sm:inline">Sync DB Changes</span>
            </button>

            {/* ADMIN PROFILE MENU TRIGGER */}
            <div className="relative">
              <button
                id="admin-profile-menu-button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className={`p-1.5 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  isDark ? "bg-[#111827] border-[#1F2937] text-white hover:bg-slate-800" : "bg-slate-50 border-[#E5E7EB] text-[#111827] hover:bg-slate-100"
                }`}
              >
                {/* Profile Avatar */}
                <div className="h-7 w-7 rounded-lg bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 flex items-center justify-center font-black text-xs">
                  O
                </div>
                <div className="hidden lg:block">
                  <h4 className="text-[11px] font-black m-0 leading-tight">Onyiobazi Aquah</h4>
                  <span className="text-[9px] font-mono text-[#14B8A6] font-bold block">{currentRole}</span>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* DROP-DOWN DIALOG POPUP */}
              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                  <div className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl z-50 p-2.5 animate-in fade-in slide-in-from-top-1 duration-150 ${
                    isDark ? "bg-[#111827] border-[#1F2937] text-white" : "bg-white border-[#E5E7EB] text-[#111827]"
                  }`}>
                    {/* Header info */}
                    <div className="border-b border-slate-700/10 pb-2 mb-2 px-2">
                      <p className="text-xs font-black">Onyiobazi Aquah</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{currentRole}</p>
                    </div>

                    {/* Standard List parameters */}
                    <div className="space-y-0.5">
                      {[
                        { label: "Profile", icon: Users, action: () => showToast("Admin Profile: onyiobazi.aquah@clats.io") },
                        { label: "Settings", icon: Settings, action: () => { setActiveTab("settings"); setShowProfileDropdown(false); } },
                        { label: "Notifications", icon: Bell, action: () => showToast("Metric anomaly alerts: None") },
                        { label: "Security", icon: Shield, action: () => { setActiveTab("settings"); showToast("Strict RBAC encryption settings active."); setShowProfileDropdown(false); } }
                      ].map((item, id) => (
                        <button
                          key={id}
                          onClick={() => {
                            item.action();
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                            isDark ? "hover:bg-slate-800 text-slate-200 hover:text-white" : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                          }`}
                        >
                          <item.icon size={14} className="text-slate-400 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      ))}

                      {/* In-Dropdown Theme Switches helpful in responsive layout */}
                      <div className="border-t border-slate-705/10 my-1 pt-1 block md:hidden">
                        <span className="text-[8px] font-mono font-bold uppercase text-slate-400 px-3">Quick Theme</span>
                        <div className="flex gap-1 p-1">
                          {["light", "dark", "system"].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => {
                                setAdminTheme(mode as any);
                                showToast(`Theme shifted to ${mode}`);
                              }}
                              className={`flex-1 text-[9px] capitalize p-1 rounded font-bold ${
                                adminTheme === mode ? (isDark ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-900") : "text-slate-400"
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* LOGOUT BUTTON ACTION */}
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black text-rose-500 hover:bg-rose-500/10 text-left transition-all mt-1"
                      >
                        <Lock size={14} className="shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* AGE GROUP GLOBAL SWITCHER RAIL (MANDATORY APPLIED FOR FILTERABLE TABS) */}
        {["users", "curriculum", "games", "rewards", "library"].includes(activeTab) && (
          <div className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-[#F9FAFB] border-slate-150"
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                ACTIVE FOCUS GROUP:
              </span>
              <div className="flex bg-slate-200 dark:bg-slate-950 p-1 rounded-xl">
                {[
                  { id: "early", label: "🐣 Early Explorers (Ages 2-5)", color: "text-emerald-500" },
                  { id: "young", label: "🤖 Young Innovators (Ages 6-12)", color: "text-[#2EC4B6]" },
                  { id: "future", label: "🚀 Future Builders (Ages 13-18)", color: "text-[#B8A0FF]" }
                ].map((g) => {
                  const active = selectedAgeGroup === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        setSelectedAgeGroup(g.id as AgeGroupType);
                        showToast(`Catalog re-sorted for ${g.label}`);
                      }}
                      className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                        active
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-805"
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono italic">
              Pathway tracks, quizzes, and companions automatically align.
            </div>
          </div>
        )}

        {/* MAIN CONTAINER PANEL */}
        <div className="p-6 md:p-8 space-y-8 flex-1">

          {/* TAB 1: EXECUTIVE COMMAND CENTER */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* BRAND MASTER BANNER OR SUPPORT STAFF CORNER PROFILE */}
              {currentRole === "Support Staff" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  {/* Operator Avatar and Profile block */}
                  <div className={`p-6 rounded-3xl ${bgCard} space-y-4`}>
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 bg-[#B8A0FF]/15 text-[#B8A0FF] font-black text-xl rounded-2xl flex items-center justify-center">
                        🛠️
                      </div>
                      <div>
                        <span className="text-[9px] font-mono bg-[#B8A0FF]/15 text-[#B8A0FF] px-2 py-0.5 rounded font-black uppercase">
                          SUPPORT OPERATOR
                        </span>
                        <h3 className={`text-base font-black mt-1 m-0 ${textPrimary}`}>
                          Amadi Diallo
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Tier 2 Viewer Platform Agent
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-700/10 space-y-3">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase font-mono block">Operator Charter & Scope</span>
                        <p className={`text-xs ${textSecondary} leading-relaxed m-0 mt-1`}>
                          Authority level delegated to reset learner profile credentials, override parent passwords dynamically, and handle West African regional support tickets.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2.5 bg-slate-500/5 rounded-xl text-center border border-slate-400/10">
                          <span className="block text-[#2EC4B6] font-black font-mono text-sm">98.4%</span>
                          <span className="text-[8px] font-mono text-slate-400 uppercase">SLA Score</span>
                        </div>
                        <div className="p-2.5 bg-slate-500/5 rounded-xl text-center border border-slate-400/10">
                          <span className="block text-[#B8A0FF] font-black font-mono text-sm">3 min</span>
                          <span className="text-[8px] font-mono text-slate-400 uppercase">Avg Response</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Support Tickets queue card */}
                  <div className={`p-6 rounded-3xl ${bgCardYellow} col-span-2 space-y-4`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className={`text-xs font-mono font-bold uppercase tracking-wider text-amber-500 m-0`}>
                          📥 Active Parents Support Tickets Desk
                        </h4>
                        <p className="text-[10px] text-slate-400 m-0">
                          Review parent messages, adjust credentials, and resolve tickets in real-time.
                        </p>
                      </div>
                      <span className="text-[9px] bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded font-mono uppercase">
                        {supportTickets.filter(t => t.status !== "Closed").length} Urgent
                      </span>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {supportTickets.map((ticket) => (
                        <div 
                          key={ticket.id} 
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            selectedTicketId === ticket.id 
                              ? "bg-[#2EC4B6]/5 border-[#2EC4B6]" 
                              : "bg-slate-400/5 border-slate-400/10 hover:border-slate-400/30"
                          }`}
                          onClick={() => {
                            setSelectedTicketId(selectedTicketId === ticket.id ? null : ticket.id);
                            setTicketReplyText("");
                          }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className={`text-[11px] font-extrabold ${textPrimary} inline-block`}>
                                {ticket.subject}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono block">
                                From: {ticket.parent} · {ticket.date}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${
                                ticket.priority === "High" ? "bg-rose-500/10 text-rose-500" : ticket.priority === "Medium" ? "bg-amber-500/10 text-amber-500" : "bg-teal-500/10 text-[#2EC4B6]"
                              }`}>
                                {ticket.priority}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-black uppercase ${
                                ticket.status === "Open" ? "bg-emerald-500/15 text-emerald-500" : ticket.status === "Pending" ? "bg-amber-500/15 text-amber-500" : "bg-slate-500/15 text-slate-400"
                              }`}>
                                {ticket.status}
                              </span>
                            </div>
                          </div>

                          {selectedTicketId === ticket.id && (
                            <div className="mt-3 pt-3 border-t border-slate-700/10 space-y-3" onClick={(e) => e.stopPropagation()}>
                              <p className={`text-xs ${textSecondary} leading-relaxed`}>
                                "{ticket.body}"
                              </p>
                              <div className="space-y-2">
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                                  Operator Quick Reply Action
                                </span>
                                <textarea
                                  value={ticketReplyText}
                                  onChange={(e) => setTicketReplyText(e.target.value)}
                                  placeholder="Type response back to parent..."
                                  rows={2}
                                  className={`w-full border rounded-xl p-2.5 text-xs outline-none focus:border-[#2EC4B6] ${
                                    isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                                  }`}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      if (!ticketReplyText.trim()) {
                                        showToast("Please type a reply message first.");
                                        return;
                                      }
                                      handleTicketAction(ticket.id, "Pending", ticketReplyText);
                                      setTicketReplyText("");
                                    }}
                                    className="bg-[#2EC4B6] hover:bg-[#25a195] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                  >
                                    Send Reply
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleTicketAction(ticket.id, "Closed");
                                      setSelectedTicketId(null);
                                    }}
                                    className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-extrabold text-[#1A1A1A] dark:text-slate-200"
                                  >
                                    Mark Solved & Close
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* BRAND MASTER BANNER */}
              <div className={`p-6 rounded-3xl relative overflow-hidden ${bgCard}`}>
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <h2 className={`text-xl font-black m-0 tracking-tight ${textPrimary}`}>
                      CLATS Administration Center
                    </h2>
                    <p className="text-[11px] font-mono font-semibold text-[#14B8A6] uppercase tracking-widest mt-0.5">
                      Africa-First AI Education OS
                    </p>
                    
                    {/* Live metadata badges */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-250/50 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Last Sync:</span>
                        <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                          <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${supabaseConnected ? "bg-emerald-500" : "bg-[#F59E0B]"}`} />
                          {supabaseConnected ? "Connected to Supabase" : "Connected (Local Storage/Cache)"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-250/50 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Live Status:</span>
                        <span className="flex items-center gap-1 font-bold text-emerald-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Healthy
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-250/50 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Environment:</span>
                        <span className="font-bold text-[#14B8A6]">
                          Production
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveAllToLocalStorage()}
                      className="bg-[#2EC4B6] hover:bg-[#25a195] text-white text-xs font-extrabold px-3 py-2 rounded-xl transition-all"
                    >
                      Backup Active Schema
                    </button>
                    <button
                      onClick={async () => {
                        setHealthChecking(true);
                        showToast("🔍 Running live database table checks...");
                        try {
                          const res = await fetch("/api/supabase/health-check");
                          const data = await res.json();
                          setHealthReport(data);
                          if (data.ok) {
                            showToast("💚 All 12 tables verified successfully!");
                          } else {
                            showToast("⚠️ Missing tables or connection offline.");
                          }
                        } catch (err: any) {
                          console.error(err);
                          showToast("❌ Connection verification failed.");
                        } finally {
                          setHealthChecking(false);
                        }
                      }}
                      disabled={healthChecking}
                      className="bg-slate-900 hover:bg-slate-950 text-white dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-950 dark:border-slate-700 shadow flex items-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {healthChecking ? "⏳ Checking..." : "🔍 Run Health Check"}
                    </button>
                  </div>
                </div>
              </div>

              {/* HEALTH REPORT DISPLAY PANEL */}
              {healthReport && (
                <div className={`p-5 rounded-2xl border transition-all text-left ${
                  healthReport.ok 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-slate-800 dark:text-slate-200" 
                    : "bg-red-500/10 border-red-500/20 text-slate-800 dark:text-slate-200"
                }`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h3 className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 m-0 ${
                        healthReport.ok ? "text-emerald-500" : "text-rose-500"
                      }`}>
                        {healthReport.ok ? "💚 Cloud DB Validation Passed" : "⚠️ Cloud DB Attention Required"}
                      </h3>
                      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 m-0 max-w-3xl">
                        {healthReport.msg}
                      </p>
                    </div>
                    <button
                      onClick={() => setHealthReport(null)}
                      className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-[10px] font-extrabold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      Dismiss ✕
                    </button>
                  </div>

                  {healthReport.results && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
                      {Object.entries(healthReport.results).map(([tbl, status]: any) => (
                        <div 
                          key={tbl} 
                          className={`p-3 rounded-xl border flex flex-col justify-between ${
                            status.status === "OK" 
                              ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-550/20 dark:border-emerald-800/40" 
                              : "bg-rose-500/5 dark:bg-rose-500/10 border-rose-550/20 dark:border-rose-800/40"
                          }`}
                        >
                          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 truncate">
                            {tbl}
                          </span>
                          <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <span className={`text-[9px] font-mono font-extrabold tracking-wider px-1.5 py-0.5 rounded uppercase ${
                              status.status === "OK" 
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400" 
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-450"
                            }`}>
                              {status.status}
                            </span>
                            {status.error && (
                              <span 
                                className="text-[10px] cursor-help text-red-500 hover:text-rose-550"
                                title={status.error}
                              >
                                ❓
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* KPI DASHBOARD OVERVIEW GRID */}
              {(() => {
                const totalAppModules = 
                  (curriculumData.early?.modules?.length || 0) +
                  (curriculumData.young?.modules?.length || 0) +
                  (curriculumData.future?.modules?.length || 0);

                const allQuizResults: number[] = [];
                try {
                  learners.forEach((l: any) => {
                    const c = l.rawChild;
                    if (c && c.quizResults) {
                      Object.values(c.quizResults).forEach((qr: any) => {
                        if (typeof qr.score === "number") {
                          allQuizResults.push(qr.score);
                        }
                      });
                    }
                  });
                } catch (e) {
                  console.warn("Error collecting admin quiz success rates: ", e);
                }
                const realQuizAvg = allQuizResults.length > 0 
                  ? `${Math.round(allQuizResults.reduce((acc, s) => acc + s, 0) / allQuizResults.length)}%`
                  : "85%";

                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                      { 
                        label: "Total Families", 
                        value: `${parentRecords.length} Families`, 
                        sub: "Active accounts", 
                        c: textPrimary 
                      },
                      { 
                        label: "Total Learners", 
                        value: `${learners.length} Learners`, 
                        sub: "Registered children", 
                        c: textPrimary 
                      },
                      { 
                        label: "Lessons Completed", 
                        value: `${learners.reduce((acc, l) => acc + (l.lessonsDone || 0), 0)} lessons`, 
                        sub: "Total progress", 
                        c: textPrimary 
                      },
                      { 
                        label: "Learning Hours", 
                        value: `${(liveStudyTimeSecs / 3600).toFixed(2)} Hrs`, 
                        sub: "Overall platform time", 
                        c: textPrimary 
                      },
                      { 
                        label: "Average Engagement", 
                        value: learners.length > 0 
                          ? `${(liveStudyTimeSecs / 60 / learners.length).toFixed(1)} mins/learner`
                          : "0.0 mins/learner", 
                        sub: "Active session avg", 
                        c: textPrimary 
                      }
                    ].map((k, i) => (
                      <div key={i} className={`p-4 rounded-xl border transition-all hover:border-[#14B8A6] ${bgCard}`}>
                        <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider leading-none">
                          {k.label}
                        </span>
                        <div className={`text-sm sm:text-base md:text-lg font-black mt-2 mb-1 tracking-tight leading-snug ${k.c} break-words whitespace-normal`}>
                          {k.value}
                        </div>
                        <span className="text-[9px] text-[#14B8A6] font-bold font-mono">
                          {k.sub}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* GROWTH TRENDS + ACTIVITY FEED BENTO GRAPH */}
              {(() => {
                // Days starting from 18 June 2026
                const start = new Date("2026-06-18T00:00:00Z");
                const end = new Date(); // Current day
                
                // Ensure we show at least 5 days starting from June 18
                if (end.getTime() < start.getTime() + 4 * 24 * 60 * 60 * 1000) {
                  end.setTime(start.getTime() + 4 * 24 * 60 * 60 * 1000);
                }

                const daysList: Date[] = [];
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                  daysList.push(new Date(d));
                }

                // Stagger dates on fallback lists so graph nodes display dynamic growth curves
                const parentsWithDates = parentRecords.map((p, idx) => {
                  let str = p.created_at;
                  if (!str) {
                    const baseDate = new Date("2026-06-18T08:00:00Z");
                    baseDate.setHours(baseDate.getHours() + idx * 8);
                    str = baseDate.toISOString();
                  }
                  return { ...p, created_at: str };
                });

                const learnersWithDates = learners.map((l, idx) => {
                  let str = l.created_at;
                  if (!str) {
                    const baseDate = new Date("2026-06-18T10:00:00Z");
                    baseDate.setHours(baseDate.getHours() + idx * 12);
                    str = baseDate.toISOString();
                  }
                  return { ...l, created_at: str };
                });

                const chartData = daysList.map((day) => {
                  const dayLimit = day.getTime() + 24 * 60 * 60 * 1000 - 1; // End of this calendar day
                  
                  // COUNT cumulative parents created before or on this day
                  const parentCount = parentsWithDates.filter(p => {
                    const t = new Date(p.created_at).getTime();
                    return !isNaN(t) && t <= dayLimit;
                  }).length;

                  // COUNT cumulative children created before or on this day
                  const childCount = learnersWithDates.filter(l => {
                    const t = new Date(l.created_at).getTime();
                    return !isNaN(t) && t <= dayLimit;
                  }).length;

                  const formatDateLabel = (dateObj: Date) => {
                    return dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short" });
                  };

                  return {
                    label: formatDateLabel(day),
                    parents: parentCount,
                    learners: childCount,
                    total: parentCount + childCount
                  };
                });

                // Compute coordinates for SVG
                const width = 500;
                const height = 120;
                const maxVal = Math.max(...chartData.map(d => d.total), 6);
                
                // Map to coordinate arrays
                const points = chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1 || 1)) * width;
                  const y = height - (d.total / maxVal) * (height - 20) - 10;
                  return { x, y, data: d };
                });

                const learnerPoints = chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1 || 1)) * width;
                  const y = height - (d.learners / maxVal) * (height - 20) - 10;
                  return { x, y, val: d.learners };
                });

                const parentPoints = chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1 || 1)) * width;
                  const y = height - (d.parents / maxVal) * (height - 20) - 10;
                  return { x, y, val: d.parents };
                });

                // Generate path helper
                const drawLine = (pts: {x: number, y: number}[]) => {
                  if (pts.length === 0) return "";
                  return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
                };

                const drawArea = (pts: {x: number, y: number}[]) => {
                  if (pts.length === 0) return "";
                  return `M ${pts[0].x} ${height} ` + pts.map(p => `L ${p.x} ${p.y}`).join(" ") + ` L ${pts[pts.length - 1].x} ${height} Z`;
                };

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT GRAPH CARD */}
                    <div className={`p-5 rounded-2xl border ${bgCard} col-span-2 space-y-4 text-left`}>
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <h3 className={`text-xs font-mono font-bold uppercase tracking-wider text-slate-500 m-0`}>
                            📈 Platform Growth Trend
                          </h3>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Live registrations and learner growth
                          </span>
                        </div>
                        
                        {/* Custom visual legend */}
                        <div className="flex items-center gap-3 text-[10px] font-mono">
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-[#14B8A6]" />
                            <span className="text-slate-400">Learners ({learners.length})</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                            <span className="text-slate-400">Parents ({parentRecords.length})</span>
                          </span>
                        </div>
                      </div>

                      {/* Line graph background */}
                      <div className="h-[220px] w-full rounded-xl relative flex flex-col justify-end p-2 mt-4 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="learnerGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="parentGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis 
                              dataKey="label" 
                              tick={{ fontSize: 10, fill: '#94A3B8' }} 
                              tickLine={false}
                              axisLine={false}
                              minTickGap={20}
                            />
                            <YAxis 
                              tick={{ fontSize: 10, fill: '#94A3B8' }} 
                              tickLine={false}
                              axisLine={false}
                              allowDecimals={false}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1E293B' : '#E2E8F0'} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                                borderColor: isDark ? '#1E293B' : '#E2E8F0',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: isDark ? '#F8FAFC' : '#0F172A'
                              }}
                            />
                            <Area type="monotone" dataKey="parents" name="Parents" stroke="#F59E0B" fillOpacity={1} fill="url(#parentGrad)" strokeWidth={2} />
                            <Area type="monotone" dataKey="learners" name="Learners" stroke="#14B8A6" fillOpacity={1} fill="url(#learnerGrad)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* RIGHT SCHEDULE CARD */}
                    <div className={`p-5 rounded-2xl border ${bgCard} space-y-4 text-left`}>
                      <div className="flex justify-between items-center">
                        <h3 className={`text-xs font-mono font-bold uppercase tracking-wider text-slate-500 m-0`}>
                          📅 Scheduled Lesson Releases
                        </h3>
                        <span className="text-[9px] bg-teal-500/10 text-teal-500 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                          Live
                        </span>
                      </div>
                      
                      <div className="space-y-3 text-xs max-h-48 overflow-y-auto pr-1">
                        {contentReleases.length === 0 ? (
                          <div className="p-4 border border-dashed rounded-xl text-center text-slate-400 font-mono text-[10px]">
                            No upcoming releases defined.
                          </div>
                        ) : (
                          contentReleases.map((rel) => {
                            const isPast = new Date(rel.release_date).getTime() <= new Date().getTime();
                            const isPublished = rel.status === "Published" || (isPast && rel.status === "Scheduled");
                            
                            return (
                              <div key={rel.id} className="p-3 bg-slate-500/5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-1.5">
                                <div className="flex justify-between items-start gap-1">
                                  <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                                    rel.academy_id === "early"
                                      ? "bg-[#2EC4B6]/15 text-[#2EC4B6]"
                                      : rel.academy_id === "young"
                                      ? "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  }`}>
                                    {rel.academy_id || "young"} Academy
                                  </span>
                                  <span className={`text-[8px] font-mono font-black px-1 rounded uppercase ${
                                    isPublished 
                                      ? "bg-emerald-500/10 text-emerald-500" 
                                      : "bg-amber-500/10 text-amber-500"
                                  }`}>
                                    {isPublished ? "Released" : "Scheduled"}
                                  </span>
                                </div>
                                
                                <p className={`font-bold m-0 mt-0.5 text-[11px] leading-tight ${textPrimary}`}>
                                  {rel.title}
                                </p>
                                
                                <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                                  Release Date: {new Date(rel.release_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: ANALYTICS CENTER */}
          {activeTab === "analytics" && (() => {
            const totalLessonsDone = learners.reduce((acc, curr) => acc + (curr.lessonsDone || 0), 0);
            const studyHours = Math.floor(liveStudyTimeSecs / 3600);
            const studyMinutes = Math.floor((liveStudyTimeSecs % 3600) / 60);
            const formattedStudyTime = studyHours > 0 ? `${studyHours}h ${studyMinutes}m` : `${studyMinutes}m`;
            
            const totalCurriculum = ['early', 'young', 'future'].reduce((acc, age) => {
              const g = curriculumData[age as keyof typeof curriculumData];
              if (!g) return acc;
              return acc + (g.pathways?.length || 0) + (g.modules?.length || 0) + (g.lessons?.length || 0) + (g.quizzes?.length || 0);
            }, 0);

            const subs = parentRecords.reduce((acc: Record<string, number>, curr) => {
              acc[curr.plan] = (acc[curr.plan] || 0) + 1;
              return acc;
            }, {});

            const activeUsers = learners.filter(l => l.status === "Active").length;
            const suspendedUsers = learners.length - activeUsers;

            return (
            <div className="space-y-6">
              {/* TOP KPI GRID */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { title: "Learner Profiles", value: learners.length.toString(), color: "text-[#2EC4B6]" },
                  { title: "Guardian Accounts", value: parentRecords.length.toString(), color: "text-[#B8A0FF]" },
                  { title: "Global Lessons Done", value: totalLessonsDone.toString(), color: "text-[#FFD166]" },
                  { title: "Avg. Learner Wallet", value: `${Math.round(learners.reduce((acc, curr) => acc + curr.xp, 0) / (learners.length || 1))} XP`, color: "text-[#2EC4B6]" },
                  { title: "Live Study Time", value: formattedStudyTime, color: "text-[#B8A0FF]" },
                  { title: "Curriculum Assets", value: totalCurriculum.toString(), color: "text-rose-400" }
                ].map((an, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${bgCard} flex flex-col justify-center items-center text-center shadow-xs`}>
                    <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-widest block mb-1">
                      {an.title}
                    </span>
                    <div className={`text-2xl font-black ${an.color}`}>
                      {an.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* BAR CHARTS ENGAGEMENTS REPRESENTATION */}
              <div className={`p-6 rounded-2xl ${bgCardYellow} space-y-6 shadow-xs`}>
                <div>
                  <h3 className={`text-xs font-mono font-bold uppercase tracking-widest text-[#B8A0FF] m-0`}>
                    Age Group Progression Distribution & Learning Share
                  </h3>
                  <p className={`text-[10px] uppercase font-bold text-slate-400 m-0 mt-1`}>
                    Ratio of active learner profiles distributed across the distinct age structures
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "🐣 Early Explorers (Ages 2–5)", count: learners.filter(l => l.ageGroup === 'early').length, color: "bg-emerald-500" },
                    { label: "🤖 Young Innovators (Ages 6–12)", count: learners.filter(l => l.ageGroup === 'young').length, color: "bg-[#2EC4B6]" },
                    { label: "🚀 Future Builders (Ages 13–18)", count: learners.filter(l => l.ageGroup === 'future').length, color: "bg-[#B8A0FF]" }
                  ].map((group, ui) => {
                    const pct = learners.length ? Math.round((group.count / learners.length) * 100) : 0;
                    return (
                    <div key={ui}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`font-bold ${textPrimary}`}>{group.label}</span>
                        <span className="font-mono text-[10px] text-slate-500">{group.count} profiles ({pct}%)</span>
                      </div>
                      <div className={`w-full h-3.5 rounded-full overflow-hidden ${isDark ? "bg-slate-950" : "bg-slate-200"}`}>
                        <div className={`${group.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              {/* LOWER ANALYTICS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Subscription Tiers */}
                <div className={`p-6 rounded-2xl border ${bgCard} shadow-xs`}>
                  <h3 className={`text-xs font-mono font-bold uppercase tracking-widest text-emerald-500 mb-4`}>
                    Guardian Subscription Tiers
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(subs).length > 0 ? Object.entries(subs).map(([plan, count], idx) => {
                      const pct = Math.round(((count as number) / parentRecords.length) * 100);
                      return (
                        <div key={idx}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className={`font-bold ${textPrimary}`}>{plan}</span>
                            <span className="font-mono text-[10px] text-slate-500">{String(count)} ({pct}%)</span>
                          </div>
                          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    }) : (
                      <p className={`text-xs ${textSecondary}`}>No subscription data available.</p>
                    )}
                  </div>
                </div>

                {/* System Health */}
                <div className={`p-6 rounded-2xl border ${bgCard} shadow-xs`}>
                  <h3 className={`text-xs font-mono font-bold uppercase tracking-widest text-rose-400 mb-4`}>
                    System Health & Moderation
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                       <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Open Tickets</span>
                       <span className="text-xl font-black text-slate-700 dark:text-slate-200">{supportTickets.length}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                       <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Feedback Left</span>
                       <span className="text-xl font-black text-slate-700 dark:text-slate-200">{dbFeedback.length}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? "bg-emerald-950/20 border-emerald-900/30" : "bg-emerald-50 border-emerald-200"}`}>
                       <span className="block text-[9px] uppercase font-bold text-emerald-600 mb-1">Active Accounts</span>
                       <span className="text-xl font-black text-emerald-500">{activeUsers}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? "bg-rose-950/20 border-rose-900/30" : "bg-rose-50 border-rose-200"}`}>
                       <span className="block text-[9px] uppercase font-bold text-rose-600 mb-1">Suspended</span>
                       <span className="text-xl font-black text-rose-500">{suspendedUsers}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );})()}

          {/* TAB 3: USERS & PARENTS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* FILTERED CHILDREN LIST BY FOCUS AGE GROUP */}
              <div className={`p-6 rounded-3xl border ${bgCard} space-y-4`}>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className={`text-sm font-black m-0 ${textPrimary}`}>
                      Active Children Portfolios: {selectedAgeGroup === "early" ? "Ages 2-5" : selectedAgeGroup === "young" ? "Ages 6-12" : "Ages 13-18"}
                    </h3>
                    <p className={`text-xs m-0 mt-0.5 ${textSecondary}`}>
                      Click child record to adjust XP balances, add milestone credentials, or override statuses.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const name = prompt("Enter new child name:");
                      if (name) {
                        const newC = {
                          id: "c" + Date.now(),
                          name,
                          ageGroup: selectedAgeGroup,
                          xp: 100,
                          badges: ["Onboard Scout"],
                          status: "Active",
                          parentId: "p1",
                          progress: "10%",
                          lessonsDone: 0
                        };
                        setLearners([...learners, newC]);
                        showToast(`Registered '${name}' to portal database successfully.`);
                      }
                    }}
                    className="bg-[#2EC4B6] hover:bg-[#25a195] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                  >
                    <Plus size={12} /> Register Learner Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {learners
                    .filter(c => c.ageGroup === selectedAgeGroup)
                    .map((ch) => (
                      <div
                        key={ch.id}
                        className={`p-4 rounded-2xl border transition-all hover:border-[#2EC4B6] relative ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`font-black text-sm ${textPrimary}`}>
                            {ch.name} 
                            {ch.is_premium && <span className="ml-2 text-xs bg-amber-400/20 text-amber-500 px-2 py-0.5 rounded-full" title="Premium Access">👑 PRO</span>}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider font-extrabold block uppercase ${
                            ch.status === "Active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-rose-500"
                          }`}>
                            {ch.status}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">🏆 Accumulated Wallet:</span>
                            <span className="font-bold text-[#FFD166]">{ch.xp} XP</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">📈 Lesson Completion:</span>
                            <span className="font-bold">{ch.progress} ({ch.lessonsDone} Lessons)</span>
                          </div>
                        </div>

                        {/* Fast Adjust controllers inside bento card */}
                        <div className={`mt-4 pt-3 border-t flex justify-between gap-1 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                          <button
                            onClick={() => {
                              setLearners(learners.map(l => l.id === ch.id ? { ...l, xp: l.xp + 50 } : l));
                              showToast(`Granted +50 XP to ${ch.name}`);
                            }}
                            className="text-[9px] bg-[#2EC4B6]/10 text-[#2EC4B6] font-bold px-2 py-1 rounded"
                          >
                            +50 XP
                          </button>
                          <button
                            onClick={() => {
                              const badge = prompt("Award unique custom badge label:");
                              if (badge) {
                                setLearners(learners.map(l => l.id === ch.id ? { ...l, badges: [...l.badges, badge] } : l));
                                showToast(`Awarded ${badge} badge!`);
                              }
                            }}
                            className="text-[9px] bg-[#B8A0FF]/15 text-[#B8A0FF] font-bold px-2 py-1 rounded"
                          >
                            Award Badge
                          </button>
                          {!ch.is_premium && (
                            <button
                              onClick={async () => {
                                if (confirm(`Upgrade ${ch.name} to Premium?`)) {
                                  try {
                                    const res = await fetch("/api/supabase/child/upgrade", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ child_id: ch.id })
                                    });
                                    if (res.ok) {
                                      setLearners(learners.map(l => l.id === ch.id ? { ...l, is_premium: true } : l));
                                      showToast(`Upgraded ${ch.name} to Premium!`);
                                    } else {
                                      showToast("Failed to upgrade child.");
                                    }
                                  } catch (e) {
                                    showToast("Error upgrading child.");
                                  }
                                }
                              }}
                              className="text-[9px] bg-amber-400/20 text-amber-500 font-bold px-2 py-1 rounded"
                            >
                              👑 Upgrade
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const next = ch.status === "Active" ? "Suspended" : "Active";
                              setLearners(learners.map(l => l.id === ch.id ? { ...l, status: next } : l));
                              showToast(`Account set to ${next}`);
                            }}
                            className={`text-[9px] font-medium px-2 py-1 rounded ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-500"}`}
                          >
                            Ban/Unban
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* PARENTAL PROFILES MANAGEMENT ENGINE */}
              <div className={`p-6 rounded-3xl border ${bgCard} space-y-4`}>
                <h3 className={`text-sm font-black m-0 ${textPrimary}`}>
                  🛡️ Parent / Guardian Subscriptions & Feedback Registry
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b text-slate-500 font-bold uppercase tracking-wider text-[9px] ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                        <th className="py-2.5">Guardian Name</th>
                        <th className="py-2.5">Contact Email</th>
                        <th className="py-2.5">Regional Location</th>
                        <th className="py-2.5">Linked Children</th>
                        <th className="py-2.5">Subscription Tier</th>
                        <th className="py-2.5 text-right">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
                      {parentRecords.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-500/5 transition-colors">
                          <td className={`py-3 font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>{p.name}</td>
                          <td className="py-3 font-mono">{p.email}</td>
                          <td className="py-3">{p.location}</td>
                          <td className="py-3">
                            <span className="bg-[#B8A0FF]/10 text-[#B8A0FF] font-bold px-2 py-0.5 rounded-full text-[9px]">
                              {p.kids.join(", ")}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="bg-[#2EC4B6]/10 text-[#2EC4B6] font-mono font-bold px-2 py-0.5 rounded">
                              {p.plan}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                const newPlan = prompt("Set custom plan (Premium, Elite, Founding Family):", p.plan);
                                if (newPlan) {
                                  setParentRecords(parentRecords.map(pr => pr.id === p.id ? { ...pr, plan: newPlan } : pr));
                                  showToast("Access subscription updated successfully.");
                                }
                              }}
                              className={`text-[9px] border px-2 py-1 rounded text-[#2EC4B6] font-bold ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}
                            >
                              Edit Subscription
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CURRICULUM MANAGEMENT COGNITIVE PATHWAYS */}
          {activeTab === "curriculum" && (
            <div className="space-y-6">
              {/* BRAND ADVISORY INSIGHT */}
              <div className="p-4 bg-[#2EC4B6]/10 border border-[#2EC4B6]/25 rounded-2xl text-xs flex items-center gap-3">
                <Shield size={16} className="text-[#2EC4B6] shrink-0" />
                <p className="m-0 leading-relaxed text-[#2EC4B6] font-bold">
                  Curriculum Modification Desk (authoritative database mode). Actions triggered here update Supabase learning tracks for <strong>{selectedAgeGroup === "early" ? "Early Explorers (2-5)" : selectedAgeGroup === "young" ? "Young Innovators (6-12)" : "Future Builders (13-18)"}</strong> instantly.
                </p>
              </div>

              {/* CURRICULUM BENTO COLUMN (PATHWAYS & MODULES) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* COLUMN 1: PATHWAYS PANEL */}
                <div className={`p-6 rounded-3xl border ${bgCard} lg:col-span-4 space-y-4`}>
                  <div className="flex justify-between items-center">
                    <h3 className={`text-xs font-mono font-bold uppercase tracking-wider text-slate-500 m-0`}>
                      Pathways
                    </h3>
                    <span className="text-[9px] font-mono text-[#2EC4B6] font-bold">
                      {curriculumData[selectedAgeGroup]?.pathways?.length || 0} tracks
                    </span>
                  </div>

                  <div className="space-y-3">
                    {curriculumData[selectedAgeGroup]?.pathways?.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPathwayId(p.id)}
                        className={`p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                          selectedPathwayId === p.id
                            ? "border-[#2EC4B6] bg-[#2EC4B6]/5"
                            : isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <h4 className={`font-black m-0 tracking-tight text-sm ${textPrimary}`}>{p.name}</h4>
                        <p className={`m-0 text-[10px] mt-1 text-slate-400 leading-tight`}>{p.desc}</p>
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPathwayStart(p);
                            }}
                            className="text-[9px] text-[#2EC4B6] hover:underline font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePathway(p.id);
                            }}
                            className="text-[9px] text-red-400 uppercase font-black hover:underline"
                          >
                            Delete Track
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CREATE / EDIT PATHWAY INLINE */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-500">
                        {editingPathwayId ? "Edit Pathway Track:" : "Create New Pathway Track:"}
                      </span>
                      {editingPathwayId && (
                        <button
                          onClick={() => {
                            setEditingPathwayId(null);
                            setNewPathwayName("");
                            setNewPathwayDesc("");
                          }}
                          className="text-slate-400 text-[10px] underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 🎨 Prompt Creativity"
                      value={newPathwayName}
                      onChange={(e) => setNewPathwayName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-xs outline-none focus:border-[#2EC4B6] border ${
                        isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                      }`}
                    />
                    <textarea
                      rows={2}
                      placeholder="Enter pathway scope..."
                      value={newPathwayDesc}
                      onChange={(e) => setNewPathwayDesc(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-xs outline-none focus:border-[#2EC4B6] border ${
                        isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                      }`}
                    />
                    <button
                      onClick={handleAddPathway}
                      className="w-full bg-[#2EC4B6] text-white py-1.5 rounded-lg text-xs font-bold hover:opacity-90"
                    >
                      {editingPathwayId ? "💾 Save Changes" : "Provision Pathway"}
                    </button>
                  </div>
                </div>

                {/* COLUMN 2: MODULES & LESSONS */}
                <div className={`p-6 rounded-3xl border ${bgCard} lg:col-span-8 space-y-6`}>
                  {/* MODULES LIST UNDER CHOSEN PATHWAY */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className={`text-xs font-mono font-bold uppercase tracking-wider text-slate-500 m-0`}>
                        Modules & Sub-Units
                      </h3>
                      <span className="text-[9px] font-mono text-[#B8A0FF] font-bold">
                        {selectedPathwayId ? "Filtering active pathway" : "All pathways list"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {curriculumData[selectedAgeGroup]?.modules
                        ?.filter((m: any) => !selectedPathwayId || m.pathwayId === selectedPathwayId)
                        .map((mod: any) => (
                          <div
                            key={mod.id}
                            onClick={() => setSelectedModuleId(mod.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                              selectedModuleId === mod.id ? "border-[#B8A0FF] bg-[#B8A0FF]/5" : "border-slate-200 border-slate-100 dark:border-slate-800"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[8px] bg-slate-200 dark:bg-slate-800 px-1 rounded uppercase font-bold font-mono tracking-widest text-[#B8A0FF]">
                                MODULE {mod.order || 1}
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditModuleStart(mod);
                                  }}
                                  className="text-[9px] text-[#B8A0FF] hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteModule(mod.id);
                                  }}
                                  className="text-[9px] text-red-400 hover:underline font-mono"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                            <h4 className={`text-xs font-black tracking-tight my-1 ${textPrimary}`}>{mod.title || mod.name?.en || mod.name}</h4>

                            {/* Lessons count in modules */}
                            <span className="text-[10px] text-slate-400 block mt-1">
                              📑 {curriculumData[selectedAgeGroup]?.lessons?.filter((l: any) => l.moduleId === mod.id).length || 0} Lessons Published & Drafts
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Inline Module Creator / Editor */}
                    <div className="p-3 bg-slate-500/5 rounded-xl border border-dashed border-slate-700/30 flex items-center gap-2 text-xs">
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Sub-module title..."
                          value={newModuleTitle}
                          onChange={(e) => setNewModuleTitle(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-950 border rounded p-1 text-slate-800 dark:text-white dark:border-slate-800 text-xs"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={handleAddModule}
                          className="bg-[#B8A0FF] text-slate-950 font-bold px-3 py-1 rounded hover:opacity-90 text-xs"
                        >
                          {editingModuleId ? "Save Module" : "Compile Module"}
                        </button>
                        {editingModuleId && (
                          <button
                            onClick={() => {
                              setEditingModuleId(null);
                              setNewModuleTitle("");
                            }}
                            className="text-slate-400 text-xs px-2"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LESSONS LIST UNDER SELECTED MODULE */}
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                      <h3 className={`text-xs font-mono font-bold uppercase tracking-wider text-slate-500 m-0`}>
                        Lessons, Story Slides & Quizzes
                      </h3>
                      <span className="text-[9px] font-mono text-[#FFD166] font-bold">
                        {selectedModuleId ? "Focusing current module" : "Select a module to view lessons"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {curriculumData[selectedAgeGroup]?.lessons
                        ?.filter((l: any) => !selectedModuleId || l.moduleId === selectedModuleId)
                        .map((les: any) => {
                          const isSelectedLesson = selectedLessonId === les.id;
                          return (
                            <div
                              key={les.id}
                              onClick={() => setSelectedLessonId(les.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between text-xs gap-3 ${
                                isSelectedLesson 
                                  ? "border-[#FFD166] bg-[#FFD166]/10" 
                                  : "bg-slate-500/5 hover:bg-slate-500/10 border-slate-200 dark:border-slate-800"
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="text-xl">📺</span>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`m-0 font-bold ${textPrimary}`}>{les.title?.en || les.title}</p>
                                    <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                      les.published ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"
                                    }`}>
                                      {les.published ? "Published" : "Draft"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 block mt-1">
                                    {les.type} · Duration: {les.progressTime || les.duration} · Reward: {les.xp || 120} XP
                                    {les.youtubeUrl && <span className="text-blue-400 font-mono text-[9px] block">🔗 YouTube: {les.youtubeUrl}</span>}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 self-end md:self-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePublishLesson(les);
                                  }}
                                  className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold px-2 py-1 rounded"
                                >
                                  {les.published ? "Unpublish" : "Publish"}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditLessonStart(les);
                                  }}
                                  className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLesson(les.id);
                                  }}
                                  className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded font-bold"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Lesson Add/Edit Engine Panel */}
                    {!editingLessonId ? (
                      <div className={`p-4 rounded-xl border text-xs space-y-3 shadow-xs ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-white border-[#E5E7EB]"}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-[#14B8A6] uppercase tracking-wider text-[9px] font-mono">
                            📺 Append Quick Lesson to Portal:
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 block font-mono font-bold uppercase tracking-wider">Lesson Title</label>
                            <input
                              type="text"
                              placeholder="e.g. Intro to Neural Patterns"
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              className={`w-full border rounded-xl p-2 outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6] ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#E5E7EB] text-slate-800"}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 block font-mono font-bold uppercase tracking-wider">Lesson Description</label>
                            <textarea
                              placeholder="e.g. In this lesson, we will..."
                              value={newLessonDescription}
                              onChange={(e) => setNewLessonDescription(e.target.value)}
                              rows={1}
                              className={`w-full border rounded-xl p-2 outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6] ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#E5E7EB] text-slate-800"}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 block font-mono font-bold uppercase tracking-wider">Lesson Type</label>
                            <select
                              value={newLessonType}
                              onChange={(e) => setNewLessonType(e.target.value)}
                              className={`w-full border rounded-xl p-2 outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6] ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#E5E7EB] text-slate-800"}`}
                            >
                              <option value="Video Lesson">Video Lesson</option>
                              <option value="Story Lesson">Story Lesson</option>
                              <option value="Interactive Laboratory">Interactive Lab</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 block font-mono font-bold uppercase tracking-wider">Estimated Duration (minutes)</label>
                            <input
                              type="number"
                              placeholder="e.g. 5"
                              value={newLessonDuration}
                              onChange={(e) => setNewLessonDuration(e.target.value)}
                              className={`w-full border rounded-xl p-2 outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6] ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#E5E7EB] text-slate-800"}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 block font-mono font-bold uppercase tracking-wider">YouTube Video ID (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. mJeNghnyt9Y"
                              value={newLessonVideoUrl}
                              onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                              className={`w-full border rounded-xl p-2 outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6] ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#E5E7EB] text-slate-800"}`}
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleAddLesson}
                          className="w-full bg-[#14B8A6] text-white py-2 rounded-xl font-extrabold uppercase tracking-widest text-[10px] font-mono hover:opacity-90 active:scale-[0.99] transition-all"
                        >
                          🚀 Publish Lesson
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-[#14B8A6] rounded-2xl text-xs flex justify-between items-center shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="animate-spin text-[#14B8A6]">⭐</span>
                          <span>Currently editing lesson in Right-side Slide-over Drawer.</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingLessonId(null);
                            setNewLessonTitle("");
                            setNewLessonDescription("");
                            setNewLessonVideoUrl("");
                            setNewLessonDuration("5");
                          }}
                          className="text-xs underline font-bold uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* INTERACTIVE QUIZ QUESTION MATRIX BUILDER */}
                  <div className="pt-6 border-t border-slate-200 border-slate-100 border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className={`text-xs font-mono font-bold uppercase tracking-wider text-slate-500 m-0`}>
                          📝 Knowledge Challenger Quiz Questions
                        </h3>
                        <p className="text-[10px] text-slate-400 m-0 mt-1">
                          {selectedLessonId 
                            ? `Attaching to focused lesson: ${
                                curriculumData[selectedAgeGroup]?.lessons?.find((l: any) => l.id === selectedLessonId)?.title?.en || "Curriculum Focus"
                              }`
                            : "Select a lesson above to build challenge quizzes!"}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-500">
                        {selectedLessonId ? "Ready to configure" : "Selection Locked"}
                      </span>
                    </div>

                    {selectedLessonId && (
                      <div className="space-y-4">
                        {/* List of quizzes attached to this lesson */}
                        <div className="space-y-2">
                          {curriculumData[selectedAgeGroup]?.lessons
                            ?.find((l: any) => l.id === selectedLessonId)
                            ?.quiz?.map((qObj: any, idx: number) => (
                              <div
                                key={qObj.id || idx}
                                className="p-3.5 bg-slate-500/5 border dark:border-slate-800 rounded-xl space-y-2 text-xs"
                              >
                                <div className="flex justify-between items-start">
                                  <p className={`m-0 font-bold ${textPrimary}`}>{idx + 1}. {qObj.q?.en || qObj.q}</p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditQuizStart(qObj)}
                                      className="text-[10px] text-[#2EC4B6] hover:underline"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteQuizQuestion(qObj.id)}
                                      className="text-[10px] text-red-400 hover:underline"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pl-4">
                                  {qObj.opts?.en?.map((opt: string, oIdx: number) => (
                                    <div
                                      key={oIdx}
                                      className={`${
                                        qObj.ans === oIdx ? "text-emerald-500 font-extrabold" : ""
                                      }`}
                                    >
                                      {String.fromCharCode(65 + oIdx)}. {opt} {qObj.ans === oIdx ? "✔" : ""}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>

                        {/* Save Quiz Form */}
                        <div className="bg-slate-100 dark:bg-slate-950/40 p-4 rounded-xl space-y-3">
                          <span className="font-bold text-[10px] text-slate-400 block uppercase tracking-wider">
                            {editingQuizId ? "✏️ Edit Quiz Question:" : "➕ Add Knowledge Challenge Question:"}
                          </span>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={quizQuestion}
                              onChange={(e) => setQuizQuestion(e.target.value)}
                              placeholder="e.g. What does API stand for?"
                              className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1.5 text-slate-800 dark:text-white"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={quizOptionA}
                                onChange={(e) => setQuizOptionA(e.target.value)}
                                placeholder="Option A (Required)"
                                className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1.5 text-slate-800 dark:text-white"
                              />
                              <input
                                type="text"
                                value={quizOptionB}
                                onChange={(e) => setQuizOptionB(e.target.value)}
                                placeholder="Option B (Required)"
                                className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1.5 text-slate-800 dark:text-white"
                              />
                              <input
                                type="text"
                                value={quizOptionC}
                                onChange={(e) => setQuizOptionC(e.target.value)}
                                placeholder="Option C (Optional)"
                                className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1.5 text-slate-800 dark:text-white"
                              />
                              <input
                                type="text"
                                value={quizOptionD}
                                onChange={(e) => setQuizOptionD(e.target.value)}
                                placeholder="Option D (Optional)"
                                className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1.5 text-slate-800 dark:text-white"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-500">Correct Answer:</span>
                              <select
                                value={quizCorrectAnswer}
                                onChange={(e) => setQuizCorrectAnswer(e.target.value)}
                                className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1 text-slate-800 dark:text-white text-xs"
                              >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveQuizQuestion}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold py-1.5 rounded-lg text-xs"
                              >
                                {editingQuizId ? "💾 Save Question" : "➕ Append Question"}
                              </button>
                              {editingQuizId && (
                                <button
                                  onClick={() => {
                                    setEditingQuizId(null);
                                    setQuizQuestion("");
                                    setQuizOptionA("");
                                    setQuizOptionB("");
                                    setQuizOptionC("");
                                    setQuizOptionD("");
                                    setQuizCorrectAnswer("A");
                                  }}
                                  className="text-slate-400 underline text-xs px-2"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GAMES MANAGEMENT */}
          {activeTab === "games" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-base font-black m-0 ${textPrimary}`}>
                    🎮 Immersive Interaction Minigames for {selectedAgeGroup === "early" ? "Early Explorers" : selectedAgeGroup === "young" ? "Young Innovators" : "Future Builders"}
                  </h3>
                  <p className={`text-xs m-0 mt-0.5 ${textSecondary}`}>
                    Add new games or map custom XP rewards instantly.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const name = prompt("Game Title:");
                    const desc = prompt("Game scope statement:");
                    if (name) {
                      const newG = {
                        id: "g" + Date.now(),
                        name,
                        desc: desc || "Interactive computational sandbox puzzle.",
                        reward: "Elite Trophy",
                        xp: 200,
                        active: true
                      };
                      setGames({
                        ...games,
                        [selectedAgeGroup]: [...(games[selectedAgeGroup] || []), newG]
                      });
                      showToast(`Successfully published ${name} simulation game.`);
                    }
                  }}
                  className="bg-[#2EC4B6] hover:bg-teal-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                >
                  Configure New Game
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games[selectedAgeGroup]?.map((gm: any) => (
                  <div key={gm.id} className={`p-5 rounded-2xl border ${bgCard} space-y-3`}>
                    <div className="flex justify-between items-center">
                      <span className="text-3xl">🎮</span>
                      <span className="bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
                        Active In Iframe
                      </span>
                    </div>

                    <div>
                      <h4 className={`m-0 font-extrabold text-sm tracking-tight ${textPrimary}`}>
                        {gm.name}
                      </h4>
                      <p className={`text-xs ${textSecondary} m-0 mt-1`}>
                        {gm.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono flex justify-between">
                      <span className="text-slate-500">🏆 Win Reward: {gm.reward}</span>
                      <span className="text-[#FFD166] font-bold">💡 {gm.xp} XP</span>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={() => {
                          const list = games[selectedAgeGroup].filter((g: any) => g.id !== gm.id);
                          setGames({
                            ...games,
                            [selectedAgeGroup]: list
                          });
                          showToast("Game asset offline successfully.");
                        }}
                        className="text-[10px] text-red-400 font-bold uppercase tracking-wider hover:underline"
                      >
                        Hide Game
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: REWARDS, XP LEVELS & CERTIFICATES */}
          {activeTab === "rewards" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-base font-black m-0 ${textPrimary}`}>
                    🏆 Gamified Rewards, Stickers & Certification Templates
                  </h3>
                  <p className={`text-xs m-0 mt-0.5 ${textSecondary}`}>
                    Unlock triggers & compliance settings for the {selectedAgeGroup === "early" ? "Ages 2-5" : selectedAgeGroup === "young" ? "Ages 6-12" : "Ages 13-18"} pool.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const name = prompt("Reward Name:");
                    if (name) {
                      const newRw = {
                        id: "r" + Date.now(),
                        name,
                        type: "Milestone Trophy",
                        unlock: "Complete all introductory blocks",
                        icon: "🏅"
                      };
                      setRewardsList({
                        ...rewardsList,
                        [selectedAgeGroup]: [...(rewardsList[selectedAgeGroup] || []), newRw]
                      });
                      showToast(`Cached '${name}' to portal rewards list.`);
                    }
                  }}
                  className="bg-[#2EC4B6] text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                >
                  Create Custom Reward
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Rewards Roster */}
                <div className={`p-5 rounded-3xl border ${bgCard} space-y-4`}>
                  <h4 className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase m-0">
                    Active Milestones & Achievements list
                  </h4>

                  <div className="space-y-3">
                    {rewardsList[selectedAgeGroup]?.map((rw: any) => (
                      <div key={rw.id} className="p-3 bg-slate-500/5 rounded-xl border dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{rw.icon || "🎖️"}</span>
                          <div>
                            <p className={`font-bold m-0 ${textPrimary}`}>{rw.name}</p>
                            <span className="text-[10px] text-slate-400">{rw.type}</span>
                          </div>
                        </div>

                        <span className="text-[9px] bg-[#B8A0FF]/15 text-[#B8A0FF] font-mono px-2 py-0.5 rounded font-black uppercase">
                          {rw.unlock}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Certificate Display Template */}
                <div className={`p-5 rounded-3xl border ${bgCard} space-y-4`}>
                  <h4 className="text-xs font-mono font-bold tracking-widest text-[#2EC4B6] uppercase m-0">
                    Merit Credential Frame Blueprint Explorer
                  </h4>
                  <p className={`text-xs ${textSecondary} leading-relaxed`}>
                    CLATS automatically awards West Africa cryptographic merit hashes upon finishing paths. Admin can review templates below.
                  </p>

                  <div className={`p-5 rounded-2xl border border-dashed border-[#14B8A6]/50 space-y-3 font-sans relative ${
                    isDark ? "bg-[#1F2937] dark:bg-slate-950 text-white" : "bg-[#FAFBFB] text-[#111827]"
                  }`}>
                    <span className="text-[8px] tracking-wider font-bold text-slate-400 font-mono uppercase block">
                      OFFICIAL CLATS ACADEMIC ENVELOPE
                    </span>
                    <h5 className={`m-0 text-base font-serif font-black tracking-wide ${isDark ? "text-[#FFD166]" : "text-[#14B8A6]"}`}>
                      {selectedAgeGroup === "early" ? "Primary Explorer Play Certificate" : selectedAgeGroup === "young" ? "Young Innovator in Computing Merit" : "Sovereign Engineering Capstone Certificate"}
                    </h5>
                    <p className={`italic text-[10px] m-0 ${isDark ? "text-slate-300" : "text-[#6B7280]"}`}>
                      "Awarded for high diligence in mastering weights networks and cybersecurity rules."
                    </p>
                    <div className={`flex justify-between border-t pt-2 text-[8px] font-mono ${isDark ? "border-slate-700/50 text-slate-400" : "border-[#E5E7EB] text-[#6B7280]"}`}>
                      <span>KEY: SECURE_ID_SHA256</span>
                      <span>DIRECTORS: CLATS AFRICA CO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: KOBE & CHIBI COMPANION SYSTEM (Dedicated management) */}
          {activeTab === "companion" && (
            <div className="space-y-6">
              {/* BRAND APPEARANCE PRESERVATION WARNING MANDATORY */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-2xl text-xs flex items-center gap-3">
                <AlertTriangle size={18} className="shrink-0" />
                <div>
                  <h4 className="font-bold m-0 uppercase tracking-wider text-[10px]">CHARACTER INTEGRITY DIRECTIVE ACTIVE</h4>
                  <p className="m-0 leading-normal mt-0.5 font-bold text-[11px]">
                    Admins must preserve Kobe and Chibi's physical assets strictly as authorized. Do not modify, redesign, change clothing or hairstyles, or generate realistic/3D variants. Use designated official voice lines for text-to-speech.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Avatar showcase cards */}
                <div className={`p-6 rounded-3xl border ${bgCard} lg:col-span-4 space-y-5 text-center`}>
                  <h3 className={`text-xs font-mono font-bold uppercase tracking-wider text-slate-500 m-0`}>
                    Visual Companion Status
                  </h3>

                  <div className="flex justify-center gap-4 py-4">
                    {/* Kobe card */}
                    <div
                      onClick={() => {
                        setSelectedCompanion("kobe");
                        showToast("Kobe focused.");
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer w-full text-center relative ${
                        selectedCompanion === "kobe" ? "border-[#2EC4B6] bg-[#2EC4B6]/5" : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <span className="text-4xl block mb-2">👦🏽</span>
                      <span className={`text-sm font-extrabold block ${textPrimary}`}>Kobe</span>
                      <span className="text-[9px] text-slate-400 font-mono font-bold block mt-0.5">Boy · Age 10</span>
                      
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80">
                        <span className="text-[8px] text-slate-400 block font-mono uppercase">Voice Source</span>
                        <span className="text-[10px] font-black text-[#2EC4B6] block">
                          {voiceConfigs.kobe.voice_mode === "Uploaded Voice" ? "Uploaded MP3" : "Browser TTS"}
                        </span>
                      </div>
                    </div>

                    {/* Chibi card */}
                    <div
                      onClick={() => {
                        setSelectedCompanion("chibi");
                        showToast("Chibi focused.");
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer w-full text-center relative ${
                        selectedCompanion === "chibi" ? "border-[#B8A0FF] bg-[#B8A0FF]/5" : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <span className="text-4xl block mb-2">👧🏽</span>
                      <span className={`text-sm font-extrabold block ${textPrimary}`}>Chibi</span>
                      <span className="text-[9px] text-slate-400 font-mono font-bold block mt-0.5">Girl · Age 5</span>

                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80">
                        <span className="text-[8px] text-slate-400 block font-mono uppercase">Voice Source</span>
                        <span className="text-[10px] font-black text-[#B8A0FF] block">
                          {voiceConfigs.chibi.voice_mode === "Uploaded Voice" ? "Uploaded MP3" : "Browser TTS"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-left p-3.5 bg-slate-500/5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-500 block">
                      Companion Specs
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gender Voice Profile:</span>
                      <span className="font-bold">{selectedCompanion === "kobe" ? "West African Male" : "West African Female"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Accompany Role:</span>
                      <span className="font-bold">{selectedCompanion === "kobe" ? "Lead Study Guide" : "Early Warm Reader"}</span>
                    </div>
                  </div>
                </div>

                {/* TTS configuration controls */}
                <div className={`p-6 rounded-3xl border ${bgCard} lg:col-span-8 space-y-6`}>
                  <div>
                    <h3 className={`text-sm font-black m-0 ${textPrimary}`}>
                      🎙️ Regional Speech Synthesis & Voiceover Narration Setup
                    </h3>
                    <p className={`text-xs m-0 mt-0.5 ${textSecondary}`}>
                      Adjust playback properties and test prompt-to-vocal streams for early readers. Writes directly to Supabase.
                    </p>
                  </div>

                  {/* VOICE MODE SELECTOR */}
                  <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-left">
                    <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider font-mono">
                      Voice Mode (Single Source of Truth)
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="voiceModeOption"
                          value="Browser TTS"
                          checked={voiceConfigs[selectedCompanion].voice_mode === "Browser TTS"}
                          onChange={() => saveVoiceConfigSetting(selectedCompanion, { voice_mode: "Browser TTS" })}
                          className="text-[#2EC4B6] focus:ring-[#2EC4B6]"
                        />
                        <span>Browser TTS (Text-to-Speech)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="voiceModeOption"
                          value="Uploaded Voice"
                          checked={voiceConfigs[selectedCompanion].voice_mode === "Uploaded Voice"}
                          onChange={() => saveVoiceConfigSetting(selectedCompanion, { voice_mode: "Uploaded Voice" })}
                          className="text-[#2EC4B6] focus:ring-[#2EC4B6]"
                        />
                        <span>Uploaded MP3 Voice</span>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 m-0 font-mono">
                      Current setting will govern speech outputs live in lesson modules for children.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-left">
                    <div className="space-y-1.5">
                      <span className="block text-slate-400 font-bold uppercase text-[10px]">Active Voice Synthesizer System:</span>
                      <select
                        value={ttsEngine}
                        onChange={(e) => setTtsEngine(e.target.value)}
                        className={`w-full border rounded p-1.5 outline-none ${isDark ? "bg-slate-950 text-white border-slate-800" : "bg-slate-100 text-slate-800 border-slate-200"}`}
                      >
                        <option value="Google Cloud Neural Voices (High Parity)">Google Cloud Neural (High Parity)</option>
                        <option value="AWS West Africa Child Voiceover Map">AWS West Africa Child Mapper</option>
                        <option value="Local HTML5 Fallback Synthesis">Local HTML5 Fallback</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-slate-400 font-bold uppercase text-[10px]">Active Vocals Language Dialect:</span>
                      <select
                        value={voiceVoice}
                        onChange={(e) => setVoiceVoice(e.target.value)}
                        className={`w-full border rounded p-1.5 outline-none ${isDark ? "bg-slate-950 text-white border-slate-800" : "bg-slate-100 text-slate-800 border-slate-200"}`}
                      >
                        <option value="Male W.A. Dialect (Kobe)">Male English W.A. Accent (Kobe)</option>
                        <option value="Female W.A. Accent (Chibi)">Female English W.A. Accent (Chibi)</option>
                        <option value="Yoruba Dialect Synthesis (Beta)">Yoruba Dialect (Future)</option>
                        <option value="Twi Language Map (Beta)">Twi Speech Map (Future)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-slate-400 font-bold uppercase text-[10px]">Playback Tone Pitch: {pitchValue.toFixed(2)}</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.05"
                        value={pitchValue}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setPitchValue(val);
                        }}
                        onMouseUp={() => saveVoiceConfigSetting(selectedCompanion, { speech_pitch: pitchValue })}
                        onTouchEnd={() => saveVoiceConfigSetting(selectedCompanion, { speech_pitch: pitchValue })}
                        className="w-full cursor-pointer accent-[#2EC4B6]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-slate-400 font-bold uppercase text-[10px]">Narration Rhythm Rate: {rateValue.toFixed(2)}</span>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={rateValue}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setRateValue(val);
                        }}
                        onMouseUp={() => saveVoiceConfigSetting(selectedCompanion, { speech_rate: rateValue })}
                        onTouchEnd={() => saveVoiceConfigSetting(selectedCompanion, { speech_rate: rateValue })}
                        className="w-full cursor-pointer accent-[#2EC4B6]"
                      />
                    </div>
                  </div>

                  {/* EXPLICIT VOICE TESTING REGISTRY */}
                  <div className="p-4 bg-[#2EC4B6]/5 rounded-2xl border border-[#2EC4B6]/20 text-left space-y-3">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-[#2EC4B6] block">
                      Targeted Character Speech Tests
                    </span>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          companionVoice.playUploadedVoice(selectedCompanion);
                          showToast(`Testing uploaded ${selectedCompanion} MP3 voicefile.`);
                        }}
                        disabled={!voiceConfigs[selectedCompanion].voice_url}
                        className="bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 disabled:bg-slate-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Volume2 size={13} />
                        <span>Play Uploaded Voice ({selectedCompanion})</span>
                      </button>

                      <button
                        onClick={() => {
                          companionVoice.playSynthesizedVoice(
                            selectedCompanion === "kobe"
                              ? "Hello! I am Kobe. Welcome to your computing class."
                              : "Great job study guide pal! Let's do some reading exercises.",
                            selectedCompanion,
                            "young innovators"
                          );
                          showToast(`Testing browser TTS voice synthesis for ${selectedCompanion}.`);
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Volume2 size={13} />
                        <span>Play Synthesized Voice ({selectedCompanion})</span>
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW PHRASE BUTTON REGISTRY */}
                  <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-[#2EC4B6] block">
                      Live Speech Preview Controls (Respecting Active voice_mode)
                    </span>
                    <div className="flex flex-wrap gap-2 text-left">
                      <button
                        onClick={() => handlePlayVoicePreview("Hello study pal! I am Kobe. Welcome to your computer lesson today!")}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-all"
                      >
                        <Volume2 size={13} />
                        <span>Kobe: Lesson Greeting</span>
                      </button>

                      <button
                        onClick={() => handlePlayVoicePreview("Great job! You earned some awesome shiny stars today. Tap next parent guidelines block!")}
                        className="bg-[#2EC4B6]/10 hover:bg-[#2EC4B6]/20 text-[#2EC4B6] px-3 py-1.5 rounded-lg text-xs font-bold border border-[#2EC4B6]/20 flex items-center gap-1.5 transition-all"
                      >
                        <Volume2 size={13} />
                        <span>Chibi: Stars Celebration</span>
                      </button>

                      <button
                        onClick={() => handlePlayVoicePreview("Wait! Remember a secure secret code word should have beautiful numbers inside.")}
                        className="bg-[#B8A0FF]/10 hover:bg-[#B8A0FF]/25 text-[#B8A0FF] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Volume2 size={13} />
                        <span>Chibi: Password Rules Hint</span>
                      </button>
                    </div>
                  </div>

                  {/* SUPABASE COMPANION-VOICES BUCKET STORAGE ENGINE */}
                  <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center text-left">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-[#B8A0FF] block">
                          Supabase Bucket Store: companion-voices
                        </span>
                        <p className="text-[11px] text-slate-400 m-0">Upload real MP3 audio files to overwrite default companion voices.</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#2EC4B6]/15 text-[#2EC4B6]">
                        CONNECTED
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Kobe Sound Uploader */}
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-500/5 hover:bg-slate-500/10 transition-all text-left">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs font-bold ${textPrimary}`}>Upload Kobe Default Voice</span>
                          <span className="text-[9px] text-slate-400 font-mono">Kobe_Greeting_Intro_Nigeria.mp3</span>
                        </div>
                        <input
                          id="kobe-voice-input"
                          type="file"
                          accept="audio/mpeg,audio/mp3"
                          onChange={(e) => handleUploadFileAdmin(e, "kobe")}
                          className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer w-full"
                        />
                      </div>

                      {/* Chibi Sound Uploader */}
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-500/5 hover:bg-slate-500/10 transition-all text-left">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs font-bold ${textPrimary}`}>Upload Chibi Default Voice</span>
                          <span className="text-[9px] text-slate-400 font-mono">Chibi_Bedtime_Story_Axe_Senegal.mp3</span>
                        </div>
                        <input
                          id="chibi-voice-input"
                          type="file"
                          accept="audio/mpeg,audio/mp3"
                          onChange={(e) => handleUploadFileAdmin(e, "chibi")}
                          className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer w-full"
                        />
                      </div>
                    </div>

                    {/* Currently configured audio targets & test voice button beside each url */}
                    <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-3 text-left">
                      <div className="flex justify-between items-center gap-2">
                        <div className="overflow-hidden">
                          <span className="block font-bold">Active Kobe Voice Target URL:</span>
                          <span className="text-[#2EC4B6] block truncate max-w-[450px]" title={voiceConfigs.kobe.voice_url}>
                            {voiceConfigs.kobe.voice_url || "No URL configured"}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            companionVoice.playUploadedVoice("kobe");
                            showToast("Testing Kobe uploaded voice url.");
                          }}
                          disabled={!voiceConfigs.kobe.voice_url}
                          className="px-2.5 py-1 text-[10px] font-sans font-bold bg-[#2EC4B6] text-white disabled:bg-slate-300 rounded hover:bg-[#2EC4B6]/90 transition-all whitespace-nowrap shrink-0"
                        >
                          Test Voice
                        </button>
                      </div>

                      <div className="flex justify-between items-center gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                        <div className="overflow-hidden">
                          <span className="block font-bold">Active Chibi Voice Target URL:</span>
                          <span className="text-[#B8A0FF] block truncate max-w-[450px]" title={voiceConfigs.chibi.voice_url}>
                            {voiceConfigs.chibi.voice_url || "No URL configured"}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            companionVoice.playUploadedVoice("chibi");
                            showToast("Testing Chibi uploaded voice url.");
                          }}
                          disabled={!voiceConfigs.chibi.voice_url}
                          className="px-2.5 py-1 text-[10px] font-sans font-bold bg-[#B8A0FF] text-white disabled:bg-slate-300 rounded hover:bg-[#B8A0FF]/95 transition-all whitespace-nowrap shrink-0"
                        >
                          Test Voice
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: COMMUNITY HUB MODERATION */}
          {activeTab === "community" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-base font-black m-0 ${textPrimary}`}>
                    💬 Family Community Moderation Dashboard
                  </h3>
                  <p className={`text-xs m-0 mt-0.5 ${textSecondary}`}>
                    Reject/approve forum posts and announcements reported by automatic AI scanner monitors.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const post = prompt("Simulated global parent news announcement:");
                    if (post) {
                      setPostsList([
                        { id: "p" + Date.now(), author: "CLATS Regional Admin", snippet: post, reports: 0, status: "Approved" },
                        ...postsList
                      ]);
                      showToast("Published announcement.");
                    }
                  }}
                  className="bg-[#2EC4B6] text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                >
                  Send Announcements
                </button>
              </div>

              <div className="space-y-3.5">
                {postsList.map((post) => (
                  <div key={post.id} className={`p-4 rounded-2xl border ${bgCard} flex items-center justify-between text-xs`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${textPrimary}`}>{post.author}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase font-bold ${
                          post.reports > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          {post.reports > 0 ? `⚠️ Flagged (${post.reports} reports)` : "CLEAN"}
                        </span>
                      </div>
                      <p className="m-0 italic text-slate-500">" {post.snippet} "</p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setPostsList(postsList.map(p => p.id === post.id ? { ...p, reports: 0, status: "Approved" } : p));
                          showToast("Post verified content safe.");
                        }}
                        className="bg-emerald-500/10 text-emerald-500 text-[9px] font-bold px-2 py-1 rounded"
                      >
                        Keep / Approve
                      </button>
                      <button
                        onClick={() => {
                          setPostsList(postsList.filter(p => p.id !== post.id));
                          showToast("Purged malicious entry successfully.");
                        }}
                        className="bg-rose-500/10 text-rose-500 text-[9px] font-bold px-2 py-1 rounded"
                      >
                        Purge / Hide
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <hr className={`my-8 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`} />
              
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className={`text-base font-black m-0 ${textPrimary}`}>
                    📅 Event & Resource Manager
                  </h3>
                  <p className={`text-xs m-0 mt-0.5 ${textSecondary}`}>
                    Manage the cards shown in the Parent Dashboard Community Hub.
                  </p>
                </div>
              </div>

              {/* Add Event Form */}
              <form onSubmit={handleAddCommunityEvent} className={`p-4 rounded-xl border ${bgCard} grid grid-cols-1 md:grid-cols-2 gap-4 mb-6`}>
                <div className="col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Tag</label>
                  <input required value={newEvent.tag} onChange={e => setNewEvent({...newEvent, tag: e.target.value})} className={`w-full p-2 text-xs rounded border ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"}`} placeholder="e.g. Discussions" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Title</label>
                  <input required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className={`w-full p-2 text-xs rounded border ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"}`} placeholder="e.g. Parent Safety Rules" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Description</label>
                  <textarea required rows={3} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className={`w-full p-2 text-xs rounded border ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"}`} placeholder="Detailed description text" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Date & Time</label>
                  <input type="datetime-local" required value={newEvent.event_datetime} onChange={e => setNewEvent({...newEvent, event_datetime: e.target.value})} className={`w-full p-2 text-xs rounded border ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"}`} />
                </div>
                <div className="col-span-1 md:col-span-2 flex justify-end">
                  <button type="submit" className="bg-[#B8A0FF] text-[#111111] px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90">
                    + Publish Event
                  </button>
                </div>
              </form>

              {/* Events List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isFetchingEvents && <p className="text-xs text-slate-500 col-span-3">Loading events...</p>}
                {!isFetchingEvents && communityEvents.length === 0 && <p className="text-xs text-slate-500 col-span-3">No active events found.</p>}
                {communityEvents.map(evt => (
                  <div key={evt.id} className={`p-4 rounded-xl border ${evt.is_active ? bgCard : (isDark ? "bg-slate-900/50 border-slate-800/50" : "bg-slate-100 border-slate-200")} relative`}>
                    <span className={`text-[10px] font-bold uppercase ${evt.tag_color || "text-slate-400"}`}>{evt.tag}</span>
                    <h4 className={`text-sm font-bold mt-1 ${!evt.is_active && "opacity-50"}`}>{evt.title}</h4>
                    <p className={`text-xs mt-1 mb-3 ${!evt.is_active ? "text-slate-600" : "text-slate-500"}`}>{evt.description}</p>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-200/50 pt-2 mb-2">
                      <span>{evt.event_datetime ? new Date(evt.event_datetime).toLocaleString() : "No Date"}</span>
                      <span className="font-bold text-[#2EC4B6]">{evt.rsvp_count || 0} RSVPs</span>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleToggleEventStatus(evt.id, evt.is_active)} className={`text-[10px] px-2 py-1 rounded font-bold ${evt.is_active ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                        {evt.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => handleDeleteCommunityEvent(evt.id)} className="text-[10px] px-2 py-1 rounded font-bold bg-slate-500/10 text-slate-500">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: CONTENT LIBRARY (CENTRALIZED) */}
          {activeTab === "library" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className={`text-base font-black m-0 ${textPrimary}`}>
                    📦 Operational Media and Voice Asset Library Workspace
                  </h3>
                  <p className={`text-xs m-0 mt-0.5 ${textSecondary}`}>
                    Central repository storing West African voice clips, videos, PDFs and sheets.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={libSearch}
                    onChange={(e) => setLibSearch(e.target.value)}
                    className={`border rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-[#2EC4B6] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  />
                  <select
                    value={libCategory}
                    onChange={(e) => setLibCategory(e.target.value)}
                    className={`p-1.5 border text-xs rounded-xl ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  >
                    <option value="All">All types</option>
                    <option value="Audio Narration">Audios</option>
                    <option value="Video Asset">Videos</option>
                    <option value="Document Workspace">Documents</option>
                  </select>
                </div>
              </div>

              {/* RENDER MEDIA GRID FILTERING BY SELECTED AGE GROUP */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {centralLibrary
                  .filter(f => f.ageGroup === selectedAgeGroup)
                  .filter(f => libCategory === "All" || f.type === libCategory)
                  .filter(f => f.name.toLowerCase().includes(libSearch.toLowerCase()))
                  .map((file, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border ${bgCard} space-y-2`}>
                      <div className="flex justify-between items-start">
                        <span className="text-2xl">
                          {file.type.includes("Audio") ? "🎵" : file.type.includes("Video") ? "🎞️" : "📄"}
                        </span>
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-955 px-1.5 py-0.5 rounded font-mono font-bold uppercase text-slate-500">
                          {file.size}
                        </span>
                      </div>

                      <div>
                        <h4 className={`m-0 text-xs font-black truncate ${textPrimary}`} title={file.name}>
                          {file.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block mt-1">
                          {file.type}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-200/5 flex justify-end gap-1.5">
                        <button
                          onClick={() => showToast(`Playing media clip preview: ${file.name}`)}
                          className="text-[9px] bg-[#2EC4B6]/15 hover:bg-[#2EC4B6]/25 text-[#2EC4B6] font-bold px-2 py-1 rounded"
                        >
                          Preview File
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}



          {/* TAB 11: B2B SCHOOLS PARTNERS */}
          {activeTab === "schools" && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-base font-black m-0 ${textPrimary}`}>
                  🏫 B2B Educational Institutional Licenses & Coordinator Keys
                </h3>
                <p className={`text-xs m-0 mt-0.5 ${textSecondary}`}>
                  Track partner primary/secondary classrooms, authorize teacher coordinator accounts, and generate academy roster tokens.
                </p>
              </div>

              {/* SEARCH & FILTERS OR PIPELINE REGISTRATION SUMMARY */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* PIPELINE OVERVIEW STATS */}
                <div className={`p-4 rounded-2xl border ${bgCard} flex items-center gap-4`}>
                  <div className="text-3xl">🏫</div>
                  <div>
                    <h4 className={`text-xs font-black m-0 ${textPrimary}`}>Total Schools Registered</h4>
                    <p className="text-xl font-bold font-mono text-[#2EC4B6] mt-1">{schoolsList.length}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Active academic rosters</span>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${bgCard} flex items-center gap-4`}>
                  <div className="text-3xl">🔑</div>
                  <div>
                    <h4 className={`text-xs font-black m-0 ${textPrimary}`}>Allocated Licenses</h4>
                    <p className="text-xl font-bold font-mono text-[#B8A0FF] mt-1">
                      {schoolsList.reduce((acc, s) => acc + (parseInt(s.seats) || 0), 0)} Seats
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Assigned to school channels</span>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${bgCard} flex items-center gap-4`}>
                  <div className="text-3xl">🌐</div>
                  <div>
                    <h4 className={`text-xs font-black m-0 ${textPrimary}`}>Pipeline Status</h4>
                    <p className="text-xs font-bold font-mono text-amber-500 mt-1">Enrollment Pipeline Open</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Contact clats-b2b@clats.edu</span>
                  </div>
                </div>

              </div>

              {/* MAIN BODY: EMPTY / COMING SOON STATS WITH MANUAL PIPELINE MANAGER */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LIST OF ENROLLED SCHOOLS */}
                <div className="lg:col-span-2 space-y-4">
                  {schoolsList.length === 0 ? (
                    <div className={`p-8 rounded-2xl border ${bgCard} text-center space-y-4`}>
                      <span className="text-5xl block animate-bounce">🏫</span>
                      <h4 className={`text-sm font-black m-0 ${textPrimary}`}>
                        Coming Soon - No Partner School Enrolled on Platform Yet
                      </h4>
                      <p className={`text-xs max-w-md mx-auto leading-relaxed ${textSecondary}`}>
                        There are currently no active primary or secondary boarding schools enrolled. CLATS is planning broad partnerships with school zones to enable centralized advisor control. Register a potential school partner in the sidebar tool to preview the cockpit roster.
                      </p>
                      <div className="inline-block px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-mono font-bold">
                        STATUS: INSTITUTIONAL ENROLLMENT PIPELINE LAUNCHING Q3
                      </div>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-2xl border ${bgCard} space-y-3`}>
                      <h4 className={`text-xs font-black uppercase tracking-wider ${textPrimary}`}>
                        Registered Educational Partners
                      </h4>
                      <div className="overflow-x-auto font-mono">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-slate-200/5 text-slate-400 text-[11px]">
                              <th className="pb-2 font-black">Institution Name</th>
                              <th className="pb-2 font-black">Region/State</th>
                              <th className="pb-2 font-black">Advisor Email</th>
                              <th className="pb-2 font-black text-right">Licenses</th>
                              <th className="pb-2 font-black text-center">Active Keys</th>
                              <th className="pb-2 font-black text-center">Status</th>
                              <th className="pb-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {schoolsList.map((school, i) => (
                              <tr key={i} className="border-b border-slate-200/5 text-[11px] hover:bg-slate-100/5 transition">
                                <td className={`py-3 font-bold ${textPrimary}`}>{school.name}</td>
                                <td className={`py-3 ${textSecondary}`}>{school.region}</td>
                                <td className={`py-3 ${textSecondary}`}>{school.email}</td>
                                <td className="py-3 text-right font-bold text-[#B8A0FF]">{school.seats} seats</td>
                                <td className="py-3 text-center">
                                  {school.b2b_license_keys && school.b2b_license_keys.length > 0 ? (
                                    <div className="flex flex-col gap-1 items-center">
                                      {school.b2b_license_keys.map((k: any, kid: number) => (
                                        <span 
                                          key={kid}
                                          onClick={() => {
                                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                              navigator.clipboard.writeText(k.code);
                                              showToast(`Copied key: ${k.code}`);
                                            } else {
                                              showToast(`Key: ${k.code} (Copy blocked)`);
                                            }
                                          }}
                                          className="cursor-pointer bg-[#7A6FF0]/15 hover:bg-[#7A6FF0]/25 text-[#7A6FF0] font-mono font-bold px-2 py-0.5 rounded text-[10px] transition"
                                          title="Click to copy key"
                                        >
                                          {k.code} ({k.current_uses}/{k.max_uses})
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-slate-500 italic">No keys generated</span>
                                  )}
                                </td>
                                <td className="py-3 text-center">
                                  <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-extrabold px-2 py-0.5 rounded text-[9px]">
                                    Synced ⚡
                                  </span>
                                </td>
                                <td className="py-3 text-center flex items-center justify-center gap-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch("/api/supabase/b2b/licenses", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({
                                            org_id: school.id,
                                            max_uses: school.seats
                                          })
                                        });
                                        const data = await res.json();
                                        if (res.ok && data.license) {
                                          if (navigator.clipboard && navigator.clipboard.writeText) {
                                            navigator.clipboard.writeText(data.license.code);
                                            showToast(`Generated & copied code: ${data.license.code}`);
                                          } else {
                                            showToast(`Generated code: ${data.license.code}`);
                                          }
                                          loadLiveDatabaseFields(); // refresh lists to show the new key
                                        } else {
                                          showToast("Failed to generate code.");
                                        }
                                      } catch (err: any) {
                                        showToast(`Error: ${err.message || err}`);
                                        console.error("Fetch key error:", err);
                                      }
                                    }}
                                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 p-1 rounded transition flex items-center gap-1 px-2"
                                    title="Generate License Key"
                                  >
                                    <Key size={13} /> <span className="text-[9px] font-bold">KEY</span>
                                  </button>

                                  <button
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to revoke ${school.name}?`)) {
                                        try {
                                          const res = await fetch(`/api/supabase/b2b/organizations/${school.id}`, { method: "DELETE" });
                                          if (res.ok) {
                                            showToast(`Removed partner school license: ${school.name}`);
                                            loadLiveDatabaseFields();
                                          } else {
                                            showToast("Failed to remove school on server.");
                                          }
                                        } catch (err) {
                                          showToast("Error connecting to server.");
                                        }
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-500 p-1 rounded transition"
                                    title="Revoke License"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* ADD A SCHOOL FORM */}
                <div className={`p-5 rounded-2xl border ${bgCard} space-y-4 h-fit`}>
                  <div className="border-b border-slate-200/5 pb-2">
                    <h4 className={`text-xs font-black uppercase tracking-wider ${textPrimary}`}>
                      🏫 Pipeline Registration Tool
                    </h4>
                    <p className={`text-[10px] m-0 mt-0.5 ${textSecondary}`}>
                      Add a prospective school board or regional educational channel during B2B negotiation.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className={`block font-bold mb-1 ${textPrimary}`}>School/Institution Name</label>
                      <input
                        type="text"
                        value={newSchoolName}
                        onChange={(e) => setNewSchoolName(e.target.value)}
                        placeholder="e.g., Alausa Model Academy"
                        className={`w-full border rounded-xl px-2.5 py-1.5 outline-none focus:border-[#2EC4B6] transition ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 ${textPrimary}`}>Region / Geography</label>
                      <input
                        type="text"
                        value={newSchoolRegion}
                        onChange={(e) => setNewSchoolRegion(e.target.value)}
                        placeholder="e.g., Lagos State, Nigeria"
                        className={`w-full border rounded-xl px-2.5 py-1.5 outline-none focus:border-[#2EC4B6] transition ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 ${textPrimary}`}>Coordinator/Primary Advisor Email</label>
                      <input
                        type="email"
                        value={newSchoolEmail}
                        onChange={(e) => setNewSchoolEmail(e.target.value)}
                        placeholder="e.g., info@alausamodel.edu"
                        className={`w-full border rounded-xl px-2.5 py-1.5 outline-none focus:border-[#2EC4B6] transition ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 ${textPrimary}`}>Assigned Seats (License Volume)</label>
                      <input
                        type="number"
                        value={newSchoolSeats}
                        onChange={(e) => setNewSchoolSeats(parseInt(e.target.value) || 0)}
                        placeholder="120"
                        className={`w-full border rounded-xl px-2.5 py-1.5 outline-none focus:border-[#2EC4B6] transition ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                      />
                    </div>

                    <button
                      onClick={async () => {
                        if (!newSchoolName.trim() || !newSchoolRegion.trim() || !newSchoolEmail.trim()) {
                          showToast("Error: Complete all prospective school registration inputs.");
                          return;
                        }
                        
                        try {
                          const res = await fetch("/api/supabase/b2b/organizations", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: newSchoolName.trim(),
                              type: "School",
                              region: newSchoolRegion.trim(),
                              total_seats: newSchoolSeats,
                              status: "Active",
                              email: newSchoolEmail.trim()
                            })
                          });
                          
                          if (res.ok) {
                            showToast(`Successfully registered pipeline B2B Partner: ${newSchoolName}`);
                            setNewSchoolName("");
                            setNewSchoolRegion("");
                            setNewSchoolEmail("");
                            setNewSchoolSeats(120);
                            loadLiveDatabaseFields(); // refresh lists
                          } else {
                            showToast("Failed to register school on server.");
                          }
                        } catch (err: any) {
                          showToast(`Error: ${err.message || err}`);
                          console.error("Register school error:", err);
                        }
                      }}
                      className="w-full py-2 bg-[#2EC4B6] hover:bg-[#20A396] text-white font-extrabold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <span>Register Partner Institution 🏫</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}


          {/* TAB 11b: B2G GOVERNMENT & CSR GRANT WORKSPACE */}
          {activeTab === "government" && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-base font-black m-0 ${textPrimary}`}>
                  🏛️ B2G Government CSR / SDG Grant Monitor Workspace
                </h3>
                <p className={`text-xs m-0 mt-0.5 ${textSecondary}`}>
                  Track regional block subsidies, corporate CSR adoptions, corporate sponsorships, and UNESCO SDG index mappings.
                </p>
              </div>

              {/* REGIONAL COVERAGE MAP OR SUMMARY BANNER */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* METRICS CARDS */}
                <div className={`p-4 rounded-2xl border ${bgCard} flex items-center gap-4`}>
                  <div className="text-3xl">🏛️</div>
                  <div>
                    <h4 className={`text-xs font-black m-0 ${textPrimary}`}>Government Adoptions</h4>
                    <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{regionsServed.length} Sponsors</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">SDG Goal 4 targets served</span>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${bgCard} flex items-center gap-4`}>
                  <div className="text-3xl">🌍</div>
                  <div>
                    <h4 className={`text-xs font-black m-0 ${textPrimary}`}>Sponsored Rural Licenses</h4>
                    <p className="text-xl font-bold font-mono text-[#B8A0FF] mt-1">
                      {regionsServed.reduce((acc, r) => acc + (parseInt(r.seats) || 0), 0).toLocaleString()} Seats
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">100% financed by sponsorships</span>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${bgCard} flex items-center gap-4`}>
                  <div className="text-3xl">🌟</div>
                  <div>
                    <h4 className={`text-xs font-black m-0 ${textPrimary}`}>UNESCO SDG Index</h4>
                    <p className="text-sm font-bold font-mono text-amber-500 mt-1">Goal 4 Quality Education Map</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">West Africa offline literacy</span>
                  </div>
                </div>

              </div>

              {/* MAIN CONTENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* SPONSOR LISTS */}
                <div className="lg:col-span-2 space-y-4">
                  {regionsServed.length === 0 ? (
                    <div className={`p-8 rounded-2xl border ${bgCard} text-center space-y-4`}>
                      <span className="text-5xl block animate-bounce">🏛️</span>
                      <h4 className={`text-sm font-black m-0 ${textPrimary}`}>
                        Coming Soon - No Government Body or CSR Program has Adopted the Platform yet
                      </h4>
                      <p className={`text-xs max-w-md mx-auto leading-relaxed ${textSecondary}`}>
                        There are currently no active B2G and CSR block sponsorships registered. The CLATS B2G monitor tracks grant frameworks from ministries of education or corporations looking to sponsor free access for children in remote or underserved offline rural coordinates. Use the sidebar sponsorship tool to record interest.
                      </p>
                      <div className="inline-block px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                        UNESCO SDG ACCORD MAPPINGS ENGAGEMENT PREPARED
                      </div>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-2xl border ${bgCard} space-y-3`}>
                      <h4 className={`text-xs font-black uppercase tracking-wider ${textPrimary}`}>
                        Enrolled Government & CSR Affiliations
                      </h4>
                      <div className="overflow-x-auto font-mono">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-slate-200/5 text-slate-400">
                              <th className="pb-2 font-black">Affiliation Agency/Sponsor</th>
                              <th className="pb-2 font-black">Sponsorship Type</th>
                              <th className="pb-2 font-black">Region / State Beneficiary</th>
                              <th className="pb-2 font-black text-right">Sponsored Seats</th>
                              <th className="pb-2 font-black text-center">Status</th>
                              <th className="pb-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {regionsServed.map((sponsor, i) => (
                              <tr key={i} className="border-b border-slate-200/5 text-[11px] hover:bg-slate-100/5 transition">
                                <td className={`py-3 font-bold ${textPrimary}`}>{sponsor.sponsorName}</td>
                                <td className={`py-3 text-slate-400`}>
                                  <span className="bg-[#B8A0FF]/15 text-[#B8A0FF] font-semibold px-2 py-0.5 rounded text-[9px]">
                                    {sponsor.sponsorType}
                                  </span>
                                </td>
                                <td className={`py-3 ${textSecondary}`}>{sponsor.region}</td>
                                <td className="py-3 text-right font-bold text-[#2EC4B6]">{sponsor.seats.toLocaleString()} seats</td>
                                <td className="py-3 text-center">
                                  <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-extrabold px-2 py-0.5 rounded text-[9px]">
                                    Active Sponsor 🌍
                                  </span>
                                </td>
                                <td className="py-3 text-center">
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to revoke sponsorship for ${sponsor.sponsorName}?`)) {
                                        try {
                                          const res = await fetch(`/api/supabase/b2b/organizations/${sponsor.id}`, { method: "DELETE" });
                                          if (res.ok) {
                                            showToast(`Revoked sponsorship records: ${sponsor.sponsorName}`);
                                            loadLiveDatabaseFields();
                                          } else {
                                            showToast("Failed to revoke sponsor on server.");
                                          }
                                        } catch (err) {
                                          showToast("Error connecting to server.");
                                        }
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-500 p-1 rounded transition"
                                    title="Delete/Revoke records"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* ADD SPONSORSHIP FORM */}
                <div className={`p-5 rounded-2xl border ${bgCard} space-y-4 h-fit`}>
                  <div className="border-b border-slate-200/5 pb-2">
                    <h4 className={`text-xs font-black uppercase tracking-wider ${textPrimary}`}>
                      🏛️ Record Sponsor / Grant Proposal
                    </h4>
                    <p className={`text-[10px] m-0 mt-0.5 ${textSecondary}`}>
                      Track corporate CSR commitments and regional grants to establish targeted offline deployments.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className={`block font-bold mb-1 ${textPrimary}`}>Agency or Sponsor Name</label>
                      <input
                        type="text"
                        value={newSponsorName}
                        onChange={(e) => setNewSponsorName(e.target.value)}
                        placeholder="e.g., Lagos Ministry of Wealth Creation"
                        className={`w-full border rounded-xl px-2.5 py-1.5 outline-none focus:border-[#2EC4B6] transition ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 ${textPrimary}`}>Sponsorship Program Type</label>
                      <select
                        value={newSponsorType}
                        onChange={(e) => setNewSponsorType(e.target.value)}
                        className={`w-full border rounded-xl px-2.5 py-1.5 outline-none focus:border-[#2EC4B6] transition ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                      >
                        <option value="Corporate CSR">Corporate CSR sponsorship</option>
                        <option value="SDG Block Grant">SDG Block Grant funding</option>
                        <option value="Public School Budget">Public State Education Board</option>
                        <option value="NGO Sponsorship">NGO ministerial endowment</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 ${textPrimary}`}>Target Beneficiary State/Region</label>
                      <input
                        type="text"
                        value={newSponsorRegion}
                        onChange={(e) => setNewSponsorRegion(e.target.value)}
                        placeholder="e.g., Niger Delta Rural Hubs"
                        className={`w-full border rounded-xl px-2.5 py-1.5 outline-none focus:border-[#2EC4B6] transition ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 ${textPrimary}`}>Sponsored Licenses Volume (Seats)</label>
                      <input
                        type="number"
                        value={newSponsorSeats}
                        onChange={(e) => setNewSponsorSeats(parseInt(e.target.value) || 0)}
                        placeholder="1000"
                        className={`w-full border rounded-xl px-2.5 py-1.5 outline-none focus:border-[#2EC4B6] transition ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                      />
                    </div>

                    <button
                      onClick={async () => {
                        if (!newSponsorName.trim() || !newSponsorRegion.trim()) {
                          showToast("Error: Provide agency name and target beneficiary region.");
                          return;
                        }
                        
                        try {
                          const res = await fetch("/api/supabase/b2b/organizations", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: newSponsorName.trim(),
                              type: newSponsorType,
                              region: newSponsorRegion.trim(),
                              total_seats: newSponsorSeats,
                              status: "Active"
                            })
                          });
                          
                          if (res.ok) {
                            showToast(`Recorded dynamic CSR / B2G Sponsor: ${newSponsorName}`);
                            setNewSponsorName("");
                            setNewSponsorRegion("");
                            setNewSponsorSeats(500);
                            loadLiveDatabaseFields(); // refresh lists
                          } else {
                            showToast("Failed to register sponsor on server.");
                          }
                        } catch (err: any) {
                          showToast(`Error: ${err.message || err}`);
                          console.error("Register sponsor error:", err);
                        }
                      }}
                      className="w-full py-2 bg-[#2EC4B6] hover:bg-[#20A396] text-white font-extrabold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <span>Record Rural Grant 🏛️</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}



          {/* TAB 12: REPORTS GENERATION HUB */}
          {activeTab === "reports" && (
            <div className={`p-6 rounded-3xl border ${bgCard} space-y-6`}>
              <div>
                <h3 className={`text-base font-black m-0 ${textPrimary}`}>
                  📊 Centralized Administrative Reports Compilation Engine
                </h3>
                <p className={`text-xs m-0 mt-0.5 ${textSecondary}`}>
                  Produce and digest cryptographic files and excel matrices for auditing panels.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-center font-mono">
                {[
                  { name: "SDG 4.2 Impact dossier", format: "PDF Bundle", desc: "For NGO ministerial partners.", allowedRoles: ["Super Admin", "Government Partner Viewer"] },
                  { name: "Parental Engagement Feed", format: "Excel Ledger", desc: "Compiles complete response lists.", allowedRoles: ["Super Admin", "Community Moderator", "Support Staff"] },
                  { name: "Pupils Learning Scorecards", format: "CSV Matrix", desc: "Grade arrays and earned XP metrics.", allowedRoles: ["Super Admin", "School Administrator", "Government Partner Viewer"] },
                  { name: "B2B Schools Revenue Ledger", format: "JSON Schema", desc: "Syncs subscription codes keys.", allowedRoles: ["Super Admin"] }
                ].filter(r => r.allowedRoles.includes(currentRole)).map((rep, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-2xl block">📄</span>
                      <h4 className={`text-xs font-black mt-2 m-0 ${textPrimary}`}>{rep.name}</h4>
                      <p className="text-[10px] text-slate-550 m-0 mt-1">{rep.desc}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-705/10">
                      <button
                        onClick={() => showToast(`Successfully exported ${rep.name} package.`)}
                        className="w-full bg-[#2EC4B6]/15 hover:bg-[#2EC4B6]/25 text-[#2EC4B6] text-[10px] py-1.5 rounded font-black uppercase flex items-center justify-center gap-1"
                      >
                        <Download size={11} />
                        <span>Export {rep.format}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 13: SYSTEM SETTINGS WITH EXPANSE INTEGRATIONS */}
          {activeTab === "settings" && currentRole !== "Super Admin" && (
            <div className={`p-12 text-center rounded-3xl ${bgCard} space-y-4`}>
              <span className="text-4xl block">🔒</span>
              <h3 className="text-base font-black text-rose-500 m-0">Access Restricted: Super Admin Level Required</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Only a Super Admin or CTO is authorised to adjust Platform Settings, manage security credentials, view subscription payment secret keys, or configure system roles.
              </p>
            </div>
          )}

          {/* TAB 13: SYSTEM SETTINGS FOR SUPER ADMIN */}
          {activeTab === "settings" && currentRole === "Super Admin" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
                {/* Integration Credentials Key Store */}
                <div className={`p-6 rounded-3xl border ${bgCard} space-y-4`}>
                  <h3 className={`text-sm font-bold m-0 ${textPrimary}`}>
                    ⚙️ Third-Party API Integrations Credentials (Key Store)
                  </h3>
                  <p className={`text-xs ${textSecondary}`}>
                    Bind operational environment credentials or edit live server parameters securely.
                  </p>

                  <div className="space-y-3.5">
                    <div>
                      <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-1">
                        YouTube Creator V3 Playback API Key
                      </span>
                      <input
                        type="text"
                        value={youtubeApiKey}
                        onChange={(e) => setYoutubeApiKey(e.target.value)}
                        className={`w-full border rounded p-2 outline-none focus:border-[#2EC4B6] font-mono text-[10px] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`}
                      />
                    </div>

                    <div>
                      <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-1">
                        Supabase Client Key Token Secret
                      </span>
                      <input
                        type="text"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        className={`w-full border rounded p-2 outline-none focus:border-[#2EC4B6] font-mono text-[10px] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 mt-4">
                        <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-0">
                          Paystack Integration
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Active?</label>
                          <input type="checkbox" checked={paystackActive} onChange={e => setPaystackActive(e.target.checked)} className="cursor-pointer" />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Paystack Public Key"
                        value={paystackKey}
                        onChange={(e) => setPaystackKey(e.target.value)}
                        className={`w-full border rounded p-2 mb-2 outline-none focus:border-[#2EC4B6] font-mono text-[10px] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`}
                      />
                      <input
                        type="password"
                        placeholder="Paystack Secret Key"
                        value={paystackSecret}
                        onChange={(e) => setPaystackSecret(e.target.value)}
                        className={`w-full border rounded p-2 outline-none focus:border-[#2EC4B6] font-mono text-[10px] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 mt-4">
                        <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-0">
                          Flutterwave Integration
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Active?</label>
                          <input type="checkbox" checked={flutterwaveActive} onChange={e => setFlutterwaveActive(e.target.checked)} className="cursor-pointer" />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Flutterwave Public Key"
                        value={flutterwaveKey}
                        onChange={(e) => setFlutterwaveKey(e.target.value)}
                        className={`w-full border rounded p-2 mb-2 outline-none focus:border-[#2EC4B6] font-mono text-[10px] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`}
                      />
                      <input
                        type="password"
                        placeholder="Flutterwave Secret Key"
                        value={flutterwaveSecret}
                        onChange={(e) => setFlutterwaveSecret(e.target.value)}
                        className={`w-full border rounded p-2 outline-none focus:border-[#2EC4B6] font-mono text-[10px] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={async () => {
                        try {
                          await fetch("/api/supabase/payment_gateways", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ gateway_name: "paystack", public_key: paystackKey, secret_key: paystackSecret, is_active: paystackActive })
                          });
                          await fetch("/api/supabase/payment_gateways", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ gateway_name: "flutterwave", public_key: flutterwaveKey, secret_key: flutterwaveSecret, is_active: flutterwaveActive })
                          });
                          showToast("Payment Gateway Credentials Updated Live!");
                        } catch (e) {
                          showToast("Error updating gateways");
                        }
                      }}
                      className="bg-[#2EC4B6] text-white px-3.5 py-2 rounded-xl text-xs font-bold"
                    >
                      Update Key Store Credentials
                    </button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-300 dark:border-slate-800 space-y-3">
                    <h4 className={`text-xs font-bold uppercase tracking-wider font-mono m-0 flex items-center gap-1.5 ${textPrimary}`}>
                      💰 Global Pricing Configuration
                    </h4>
                    <p className={`text-[10px] mb-3 ${textSecondary}`}>
                      Set the prices parents will pay to unlock premium pathways.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-1">Currency</span>
                        <select 
                          value={currency} 
                          onChange={e => setCurrency(e.target.value)}
                          className={`w-full border rounded p-2 outline-none focus:border-[#2EC4B6] font-mono text-[10px] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`}
                        >
                          <option value="NGN">NGN (Naira)</option>
                          <option value="GHS">GHS (Cedis)</option>
                          <option value="KES">KES (Shilling)</option>
                          <option value="ZAR">ZAR (Rand)</option>
                          <option value="USD">USD (Dollars)</option>
                        </select>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-1">Monthly Price</span>
                        <input
                          type="number"
                          value={monthlyPrice}
                          onChange={(e) => setMonthlyPrice(e.target.value)}
                          className={`w-full border rounded p-2 outline-none focus:border-[#2EC4B6] font-mono text-[10px] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`}
                        />
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-1">Yearly Price</span>
                        <input
                          type="number"
                          value={yearlyPrice}
                          onChange={(e) => setYearlyPrice(e.target.value)}
                          className={`w-full border rounded p-2 outline-none focus:border-[#2EC4B6] font-mono text-[10px] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <button
                        onClick={async () => {
                          try {
                            await fetch("/api/supabase/pricing", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ plan_name: "Monthly Premium", price: Number(monthlyPrice), currency })
                            });
                            await fetch("/api/supabase/pricing", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ plan_name: "Yearly Premium", price: Number(yearlyPrice), currency })
                            });
                            showToast("Global Pricing Updated successfully!");
                          } catch (e) {
                            showToast("Error updating pricing");
                          }
                        }}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                      >
                        Update Pricing Plans
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider font-mono m-0 flex items-center gap-1.5">
                      👤 Add New Admin User
                    </h4>
                    <div>
                      <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-1">
                        Email Address
                      </span>
                      <input
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className={`w-full border rounded p-2 outline-none focus:border-[#2EC4B6] font-mono text-[10px] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`}
                        placeholder="admin@clats.com"
                      />
                    </div>
                    <div>
                      <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-1">
                        Password
                      </span>
                      <input
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className={`w-full border rounded p-2 outline-none focus:border-[#2EC4B6] font-mono text-[10px] ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-1">
                        Admin Role
                      </span>
                      <select
                        value={newAdminRole}
                        onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                        className="w-full bg-slate-100 dark:bg-slate-950 border dark:border-slate-800 rounded p-1.8 text-slate-800 dark:text-white outline-none focus:border-[#2EC4B6] font-mono text-[10px]"
                      >
                        {Object.keys(rolesPermissions).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={async () => {
                        if (!newAdminEmail || !newAdminPassword) {
                          showToast("Email and password are required.");
                          return;
                        }
                        try {
                          const res = await fetch("/api/supabase/admin/create", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword, role: newAdminRole })
                          });
                          const data = await res.json();
                          if (data.ok) {
                            showToast("New admin successfully added to database.");
                            setNewAdminEmail("");
                            setNewAdminPassword("");
                          } else {
                            showToast(data.msg || "Error adding admin.");
                          }
                        } catch (err) {
                          showToast("Network error while adding admin.");
                        }
                      }}
                      className="bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold w-full mt-2"
                    >
                      Create Administrator
                    </button>
                  </div>

                  {/* SUPABASE SQL INSTANT SETUP GUIDE SECTION */}
                  <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider font-mono m-0 flex items-center gap-1.5">
                        📂 Database Schema Config
                      </h4>
                    </div>
                    <p className="text-[11px] leading-relaxed m-0 text-slate-500">
                      CLATS supports dual-mode cloud database integration. Set <strong>SUPABASE_URL</strong> and <strong>SUPABASE_SERVICE_ROLE_KEY</strong> in your <code>.env</code> file. Click below to copy the complete Postgres tables schema, then paste it in your Supabase SQL Editor:
                    </p>
                    <div>
                      <button
                        onClick={() => {
                          const sql = `-- CLATS Supabase Relational Database Schema Build Script

-- 1. Create parents table
CREATE TABLE IF NOT EXISTS clats_parents (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at BIGINT DEFAULT extract(epoch from now()) * 1000
);

-- 2. Create clats_children table
CREATE TABLE IF NOT EXISTS clats_children (
  id TEXT PRIMARY KEY,
  parent_email TEXT REFERENCES clats_parents(email) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group TEXT NOT NULL,
  avatar TEXT DEFAULT '👦🏾',
  pin TEXT NOT NULL,
  interests JSONB DEFAULT '[]'::jsonb,
  completed_lessons JSONB DEFAULT '{}'::jsonb,
  xp INTEGER DEFAULT 0,
  stars JSONB DEFAULT '{}'::jsonb,
  quiz_results JSONB DEFAULT '{}'::jsonb,
  companion TEXT DEFAULT 'kobe',
  created_at BIGINT DEFAULT extract(epoch from now()) * 1000
);

-- 3. Create learning_pathways table
CREATE TABLE IF NOT EXISTS learning_pathways (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  age_group TEXT, -- early, young, future
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  pathway_id TEXT REFERENCES learning_pathways(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  age_group TEXT,
  order_number INTEGER DEFAULT 1
);

-- 5. Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  lesson_order INTEGER DEFAULT 1,
  estimated_duration TEXT DEFAULT '5 mins',
  status TEXT DEFAULT 'published'
);

-- 6. Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL -- 'A', 'B', 'C', 'D'
);

-- 7. Create child_progress table
CREATE TABLE IF NOT EXISTS child_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id TEXT REFERENCES clats_children(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT true,
  quiz_score INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Create rewards_badges table
CREATE TABLE IF NOT EXISTS rewards_badges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  badge_image TEXT,
  xp_required INTEGER DEFAULT 0
);

-- 9. Create child_rewards table
CREATE TABLE IF NOT EXISTS child_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id TEXT REFERENCES clats_children(id) ON DELETE CASCADE,
  reward_id TEXT REFERENCES rewards_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. Create games table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  age_group TEXT,
  game_type TEXT,
  xp_reward INTEGER DEFAULT 50,
  status TEXT DEFAULT 'active'
);

-- 11. Create companion_content table
CREATE TABLE IF NOT EXISTS companion_content (
  id TEXT PRIMARY KEY,
  companion TEXT DEFAULT 'kobe', -- kobe, chibi
  message_type TEXT NOT NULL, -- prompt, greeting, motivation, introduction
  text_content TEXT NOT NULL,
  audio_url TEXT,
  age_group TEXT
);

-- 12. Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  location TEXT,
  number_of_children INTEGER DEFAULT 1,
  age_groups TEXT,
  founding_family BOOLEAN DEFAULT true,
  founding_family_status TEXT DEFAULT 'Founding Family',
  child_age TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 13. Create support tickets table
CREATE TABLE IF NOT EXISTS clats_support_tickets (
  id TEXT PRIMARY KEY,
  parent_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'Open',
  date TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  body TEXT NOT NULL,
  replies JSONB DEFAULT '[]'::jsonb
);

-- 14. Create feedback table
CREATE TABLE IF NOT EXISTS clats_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Seed Initial Datasets for Pathways, Modules, Lessons, Quizzes, Badges, Companion, Games
INSERT INTO learning_pathways (id, title, description, age_group, status) VALUES
('lp-ai', 'Computational AI & Robotics', 'Neurons, networks, prompt engineering, and deep visual models.', 'young', 'active'),
('lp-dl', 'Digital Literacy & Essentials', 'Master search tools, browser mechanisms, and healthy setups.', 'early', 'active'),
('lp-cs', 'Cybersecurity Safe Haven', 'Create fireproof passwords, block phishing, and browse under shields.', 'future', 'active'),
('lp-bc', 'Blockchain Foundations', 'Distributed consensus, ledgers, wallets, and smart protocol basics.', 'future', 'active'),
('lp-ds', 'Creative UX & Product Design', 'UI wireframing, color mechanics, and responsive visual architecture.', 'young', 'active'),
('lp-do', 'Cloud DevOps Basics', 'Servers, containers, network routers, and deployment loops.', 'future', 'active'),
('lp-cr', 'Career Readiness & Innovation', 'Agile scrum mechanics, collaborative mock sprints, and portfolio building.', 'future', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO modules (id, pathway_id, title, description, age_group, order_number) VALUES
('mod-aif', 'lp-ai', 'AI Foundations', 'Core mechanics of how computers gather knowledge.', 'young', 1),
('mod-aid', 'lp-ai', 'AI Discovery', 'Exploring neural networks through gamified logic.', 'early', 1),
('mod-aib', 'lp-ai', 'AI Builders', 'Hands-on prompts and interactive model training.', 'future', 1),
('mod-dfs', 'lp-dl', 'Digital Freedom & Security', 'Protecting and optimizing daily workspace setups.', 'early', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, module_id, title, description, video_url, lesson_order, estimated_duration, status) VALUES
('les-aif-1', 'mod-aif', 'What is Machine Learning?', 'Discover how computers can read signs and recognize objects.', 'https://www.youtube.com/embed/mJeNghnyt9Y', 1, '5 mins', 'published'),
('les-aif-2', 'mod-aif', 'The Power of Neurons', 'How connections in computers mimic our brain.', 'https://www.youtube.com/embed/Fno0L_XsdWM', 2, '4 mins', 'published'),
('les-aid-1', 'mod-aid', 'Meet Chibi the Code Bear', 'Interactive path guide with Kobe & Chibi.', '', 1, '3 mins', 'published'),
('les-aib-1', 'mod-aib', 'Prompt Crafting 101', 'Write queries that generate beautiful imagery and smart texts.', 'https://www.youtube.com/embed/zjoS6-0G3F4', 1, '6 mins', 'published')
ON CONFLICT (id) DO NOTHING;

INSERT INTO quizzes (id, lesson_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES
('qz-aif1-1', 'les-aif-1', 'What does AI stand for?', 'Automated Internet', 'Artificial Intelligence', 'Active Integration', 'Alternative Instruction', 'B'),
('qz-aif1-2', 'les-aif-1', 'How does a machine learn?', 'By studying books at night', 'Through inputs of vast, marked datasets', 'By copying other human keyboards directly', 'By downloading itself repeatedly', 'B'),
('qz-aif2-1', 'les-aif-2', 'Computer neurons are modeled after:', 'The human nervous system', 'Wires from solar chargers', 'Radio grid wave towers', 'Fibers inside solid-state drives', 'A')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rewards_badges (id, title, description, badge_image, xp_required) VALUES
('bdg-ai-newbie', 'AI Cadet', 'Awarded for completing your initial machine learning video quiz.', '🎓', 100),
('bdg-cyber-shield', 'Cyber Sentinel', 'Acquired after passing all Cyber security test sequences.', '🛡️', 250),
('bdg-prompt-pro', 'Prompt Constructor', 'Acquired by writing precise generator directives.', '✨', 500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO games (id, title, description, age_group, game_type, xp_reward, status) VALUES
('gam-robot-drag', 'RoboBuilder Grid Match', 'Drag robot blocks to match identical instruction tokens!', 'early', 'Drag-and-Drop Puzzle', 150, 'active'),
('gam-prompt-test', 'Prompt Simulator Arena', 'Craft perfect triggers to solve kobe queries.', 'young', 'Interaction Puzzle', 200, 'active'),
('gam-cyber-safe', 'CyberShield Core Intruder', 'Decline phishing mail prompts to seal the core gateway.', 'future', 'Speed Reflex Trivia', 250, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO companion_content (id, companion, message_type, text_content, audio_url, age_group) VALUES
('cmp-kb-gr', 'kobe', 'greeting', 'Welcome back, explorer! Ready to supercharge your tech gears?', '', 'young'),
('cmp-ch-gr', 'chibi', 'greeting', 'Hi there! Let''s explore code together today! 🧸', '', 'early'),
('cmp-kb-mv', 'kobe', 'motivation', 'Awesome job! You are becoming a tech master already!', '', 'young')
ON CONFLICT (id) DO NOTHING;

-- 17. Create clats_admins table
CREATE TABLE IF NOT EXISTS clats_admins (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Super Admin',
  created_at BIGINT DEFAULT extract(epoch from now()) * 1000
);

INSERT INTO clats_admins (email, password, role) 
VALUES ('ikpeukana964@gmail.com', '12345', 'Super Admin')
ON CONFLICT (email) DO NOTHING;
`;
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(sql);
                            showToast("Supabase SQL Schema Script copied to clipboard!");
                          } else {
                            showToast("Clipboard blocked. Copy the SQL manually from the console.");
                            console.log(sql);
                          }
                        }}
                        className="bg-slate-900 border border-slate-850 text-white hover:bg-slate-800 px-3.5 py-2 rounded-xl text-[10.5px] font-mono tracking-tight font-black uppercase inline-flex items-center gap-1.5 shadow"
                      >
                        📋 Copy Supabase SQL schemas script
                      </button>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC RBAC MATRIX EDITOR CARD */}
                <div className={`p-6 rounded-3xl border ${bgCard} space-y-4`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`text-sm font-bold m-0 ${textPrimary}`}>
                        🔒 Enterprise Role ACCESS CONTROL & Permissions Engine
                      </h3>
                      <p className={`text-xs ${textSecondary} mt-1`}>
                        Dynamic RBAC Configurator: Modifying selections below immediately transforms sidebar navigation and views.
                      </p>
                    </div>
                    <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-500 font-mono text-[9px] rounded-lg font-black uppercase">
                      Live State Map
                    </span>
                  </div>

                  {/* Select role to configure */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1.5 font-mono">
                        Choose Security Role to Mutate:
                      </label>
                      <select
                        value={selectedRoleToEdit}
                        onChange={(e) => setSelectedRoleToEdit(e.target.value as AdminRole)}
                        className={`w-full border rounded-xl p-2.5 font-bold font-mono text-xs focus:outline-none ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        {Object.keys(rolesPermissions).map((rKey) => (
                          <option key={rKey} value={rKey}>{rKey}</option>
                        ))}
                      </select>
                    </div>

                    {/* Role Details */}
                    <div className="p-4 bg-slate-500/5 rounded-2xl border dark:border-slate-800 space-y-3">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block uppercase">Role description:</span>
                        <input
                          type="text"
                          value={rolesPermissions[selectedRoleToEdit]?.description || ""}
                          onChange={(e) => {
                            setRolesPermissions({
                              ...rolesPermissions,
                              [selectedRoleToEdit]: {
                                ...rolesPermissions[selectedRoleToEdit],
                                description: e.target.value
                              }
                            });
                          }}
                          className="w-full bg-transparent border-b border-dashed border-slate-700 font-semibold focus:outline-none focus:border-[#2EC4B6] text-xs py-1 text-slate-800 dark:text-white"
                        />
                      </div>

                      {/* Tick off allowable tabs representing route RBAC */}
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block uppercase mb-2">Visible Sections/Tabs Access Code:</span>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          {[
                            { id: "overview", label: "Dashboard" },
                            { id: "analytics", label: "Analytics Center" },
                            { id: "users", label: "Users & Parents" },
                            { id: "curriculum", label: "Curriculum Builder" },
                            { id: "games", label: "Games Manager" },
                            { id: "rewards", label: "Rewards & Badges" },
                            { id: "companion", label: "Companion System" },
                            { id: "community", label: "Community Mod" },
                            { id: "library", label: "Content Library" },
                            { id: "reports", label: "Reports Center" },
                            { id: "settings", label: "Platform Settings" }
                          ].map((t) => {
                            const isAllowed = rolesPermissions[selectedRoleToEdit]?.visibleTabs?.includes(t.id as TabType) || false;
                            // Super admin cannot untick overview or settings to avoid locking out the admin
                            const disabled = selectedRoleToEdit === "Super Admin" && (t.id === "settings" || t.id === "overview");
                            return (
                              <label key={t.id} className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isAllowed}
                                  disabled={disabled}
                                  onChange={(e) => {
                                    const currentTabs = [...(rolesPermissions[selectedRoleToEdit]?.visibleTabs || [])];
                                    let newTabs: TabType[];
                                    if (e.target.checked) {
                                      newTabs = [...currentTabs, t.id as TabType];
                                    } else {
                                      newTabs = currentTabs.filter(id => id !== t.id);
                                    }
                                    setRolesPermissions({
                                      ...rolesPermissions,
                                      [selectedRoleToEdit]: {
                                        ...rolesPermissions[selectedRoleToEdit],
                                        visibleTabs: newTabs
                                      }
                                    });
                                    showToast(`Dynamic permission updated for ${selectedRoleToEdit}.`);
                                  }}
                                  className="rounded border-slate-705 text-[#2EC4B6] focus:ring-[#2EC4B6]"
                                />
                                <span>{t.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Display Custom allowable actions */}
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block uppercase mb-1 font-bold">Core Action Clearances:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {rolesPermissions[selectedRoleToEdit]?.customActions?.map((action, i) => (
                            <span key={i} className="text-[9px] bg-[#2EC4B6]/10 text-[#2EC4B6] font-mono px-2 py-0.5 rounded font-semibold">
                              ✓ {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* REACTION SYSTEM: CREATE BRAND NEW ADMINISTRATIVE ROLE */}
              <div className={`p-6 rounded-3xl border ${bgCard} space-y-4 text-xs`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🛡️</span>
                  <div>
                    <h3 className={`text-sm font-bold m-0 ${textPrimary}`}>
                      Create Adaptive Authority Role
                    </h3>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>
                      Super Admin privilege to register secondary administration structures. This dynamic role is compiled and binds into the system selection instantly.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3.5">
                    <div>
                      <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-1">
                        Unique Authority Title / Role Name
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. AI Prompt Evaluator, Security Auditor"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-xs outline-none focus:border-[#2EC4B6] ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-1">
                        Operational Charter Purpose
                      </span>
                      <textarea
                        rows={3}
                        placeholder="Define scope guidelines for this sub-admin role..."
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-xs outline-none focus:border-[#2EC4B6] ${
                          isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="block text-slate-500 uppercase tracking-wider text-[9px] font-mono font-bold mb-1.5">
                        Target Allowed Workspace Modules (Check all)
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        {[
                          { id: "overview", label: "Dashboard" },
                          { id: "analytics", label: "Analytics Center" },
                          { id: "users", label: "Users & Parents" },
                          { id: "curriculum", label: "Curriculum Builder" },
                          { id: "games", label: "Games Manager" },
                          { id: "rewards", label: "Rewards & Badges" },
                          { id: "companion", label: "Companion System" },
                          { id: "community", label: "Community Mod" },
                          { id: "library", label: "Content Library" },
                          { id: "schools", label: "B2B Schools" },
                          { id: "government", label: "B2G Gov & CSR" },
                          { id: "reports", label: "Reports Center" }
                        ].map((t) => {
                          const isChecked = newRoleTabs.includes(t.id as TabType);
                          return (
                            <label key={t.id} className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewRoleTabs([...newRoleTabs, t.id as TabType]);
                                  } else {
                                    setNewRoleTabs(newRoleTabs.filter(id => id !== t.id));
                                  }
                                }}
                                className="rounded border-slate-705 text-[#2EC4B6] focus:ring-[#2EC4B6]"
                              />
                              <span>{t.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          if (!newRoleName.trim() || !newRoleDesc.trim()) {
                            showToast("Error: Role name and Charter description are required.");
                            return;
                          }
                          // Build new dynamic role key type
                          const formattedKey = newRoleName.trim();
                          
                          // Add to current roles permissions state
                          const updated = {
                            ...rolesPermissions,
                            [formattedKey]: {
                              description: newRoleDesc.trim(),
                              visibleTabs: [...newRoleTabs],
                              customActions: ["Generic Access", "Review Metrics"]
                            }
                          };
                          setRolesPermissions(updated as any);
                          showToast(`Successfully bootstrapped Dynamic Role: ${formattedKey}`);
                          setNewRoleName("");
                          setNewRoleDesc("");
                          setNewRoleTabs(["overview"]);
                        }}
                        className="w-full bg-[#2EC4B6] hover:bg-[#25a195] text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                      >
                        Bootstrap Dynamic Operational Role
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Right Side Slide-over Drawer for Lesson Edits */}
      <AnimatePresence>
        {editingLessonId && (
          <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingLessonId(null);
                setNewLessonTitle("");
                setNewLessonDescription("");
                setNewLessonVideoUrl("");
                setNewLessonDuration("5");
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />
            {/* Sliding Drawer Container */}
            <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                className={`w-screen max-w-md ${
                  isDark ? "bg-[#111827] text-white border-l border-[#1F2937]" : "bg-white text-[#111827] border-l border-[#E5E7EB]"
                } shadow-2xl flex flex-col h-full`}
              >
                {/* Drawer Header */}
                <div className={`px-6 py-5 border-b flex justify-between items-center ${isDark ? "border-[#1F2937]" : "border-[#E5E7EB]"}`}>
                  <div>
                    <span className="text-[10px] font-mono text-[#14B8A6] font-bold uppercase tracking-wider block">
                      CURRICULUM BUILDER MASTER
                    </span>
                    <h3 className="text-sm font-black m-0 mt-0.5 tracking-tight">
                      ✏️ Edit Configured Lesson
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setEditingLessonId(null);
                      setNewLessonTitle("");
                      setNewLessonDescription("");
                      setNewLessonVideoUrl("");
                      setNewLessonDuration("5");
                    }}
                    className={`p-1.5 rounded-xl border transition-all ${
                      isDark ? "border-[#1F2937] hover:bg-slate-800 text-slate-400 hover:text-white" : "border-[#E5E7EB] hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Drawer Main Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Lesson Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Intro to Neural Patterns"
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      className={`w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6] transition-all font-semibold ${
                        isDark ? "bg-[#0B0F14] border-[#1F2937] text-white" : "bg-white border-[#E5E7EB] text-[#111827]"
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Lesson Description
                    </label>
                    <textarea
                      placeholder="e.g. In this lesson, we will cover..."
                      value={newLessonDescription}
                      onChange={(e) => setNewLessonDescription(e.target.value)}
                      rows={2}
                      className={`w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6] transition-all font-semibold ${
                        isDark ? "bg-[#0B0F14] border-[#1F2937] text-white" : "bg-white border-[#E5E7EB] text-[#111827]"
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Lesson Type
                    </label>
                    <select
                      value={newLessonType}
                      onChange={(e) => setNewLessonType(e.target.value)}
                      className={`w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6] transition-all font-semibold ${
                        isDark ? "bg-[#0B0F14] border-[#1F2937] text-white" : "bg-white border-[#E5E7EB] text-[#111827]"
                      }`}
                    >
                      <option value="Video Lesson">Video Lesson</option>
                      <option value="Story Lesson">Story Lesson</option>
                      <option value="Interactive Laboratory">Interactive Lab</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Estimated Duration (minutes)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={newLessonDuration}
                      onChange={(e) => setNewLessonDuration(e.target.value)}
                      className={`w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6] transition-all font-semibold ${
                        isDark ? "bg-[#0B0F14] border-[#1F2937] text-white" : "bg-white border-[#E5E7EB] text-[#111827]"
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      YouTube Video ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. mJeNghnyt9Y"
                      value={newLessonVideoUrl}
                      onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                      className={`w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6] transition-all font-mono font-semibold ${
                        isDark ? "bg-[#0B0F14] border-[#1F2937] text-white" : "bg-white border-[#E5E7EB] text-[#111827]"
                      }`}
                    />
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${isDark ? "border-[#1F2937]" : "border-[#E5E7EB]"}`}>
                  <button
                    onClick={() => {
                      setEditingLessonId(null);
                      setNewLessonTitle("");
                      setNewLessonDescription("");
                      setNewLessonVideoUrl("");
                      setNewLessonDuration("5");
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      isDark ? "bg-slate-800 hover:bg-slate-750 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLesson}
                    className="bg-[#14B8A6] hover:brightness-110 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all duration-150 flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    <Save size={13} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowLogoutConfirm(false)}
          />
          {/* Modal Container */}
          <div className={`relative w-full max-w-md ${isDark ? "bg-[#1E293B] border border-slate-800 text-white" : "bg-white border border-slate-200 text-[#1A1A1A]"} rounded-3xl p-6 shadow-2xl space-y-4 z-10 transition-all`}>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                <AlertTriangle size={24} />
              </span>
              <div>
                <h3 className="text-lg font-black tracking-tight leading-none">Sign Out?</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-normal">
                  Are you sure you want to end your current admin session?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-4 border-slate-700/10">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-750" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  localStorage.removeItem("clats_admin_authenticated");
                  setShowLogoutConfirm(false);
                  showToast("Session disconnected.");
                  onBackToPortal();
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

