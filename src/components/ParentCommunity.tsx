/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Language } from "../types";
import { C, F } from "../utils/config";
import { Card, Heading, Txt, FieldInput, Btn, Chip, Label } from "./Primitives";
import { sfx } from "../utils/audio";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Calendar,
  BookOpen,
  Trophy,
  Sparkles,
  CheckCircle2,
  Bell,
  Activity,
  ShieldCheck,
  Check
} from "lucide-react";


// Community illustration — served from /public/assets/images/
const parentCommunityIllust = "/assets/images/parent_community_illust_1780495016921.png";


interface ParentCommunityProps {
  onBack: () => void;
  lang: Language;
  theme?: "light" | "dark";
}

export const ParentCommunity: React.FC<ParentCommunityProps> = ({ onBack, lang, theme }) => {
  const isDark = theme !== "light";
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [numberOfChildren, setNumberOfChildren] = useState("1");
  const [ageGroups, setAgeGroups] = useState("");
  const [isFoundingFamily, setIsFoundingFamily] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check if parents have already registered for the waitlist
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clats_community_waitlist_registered");
      if (saved) {
        setIsAdded(true);
      }
    } catch (e) {
      console.error("Local storage lookup failed", e);
    }
  }, []);

  const handleNotifyMe = async () => {
    setErrorMessage("");
    if (!parentName.trim()) {
      setErrorMessage("Please enter your name so we know how to address you!");
      sfx.playBuzzer();
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter an email address so we can reach you!");
      sfx.playBuzzer();
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setErrorMessage("Please enter a valid email address!");
      sfx.playBuzzer();
      return;
    }

    if (!locationStr.trim()) {
      setErrorMessage("Please specify your location (City / State / Country)!");
      sfx.playBuzzer();
      return;
    }

    setIsSubmitting(true);
    sfx.playTap();

    try {
      const waitlistObj = {
        parent_name: parentName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        location: locationStr.trim(),
        number_of_children: parseInt(numberOfChildren, 10) || 1,
        age_groups: ageGroups.trim() || "4-12 years",
        founding_family: isFoundingFamily,
        founding_family_status: isFoundingFamily ? "Founding Family" : "Standard Waitlist"
      };

      const response = await fetch("/api/supabase/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waitlistObj)
      });
      const data = await response.json();

      localStorage.setItem("clats_community_waitlist_registered", "true");
      localStorage.setItem("clats_community_waitlist_email", email.trim());
      setIsAdded(true);
      sfx.playCoin();
    } catch (err) {
      console.error("Could not register waitlist database connection:", err);
      // Fallback to local storage persistence
      localStorage.setItem("clats_community_waitlist_registered", "true");
      localStorage.setItem("clats_community_waitlist_email", email.trim());
      setIsAdded(true);
      sfx.playCoin();
    } finally {
      setIsSubmitting(false);
    }
  };

  const communityFeatures = [
    {
      id: "share",
      text: "Share experiences with other parents in secure safe rooms."
    },
    {
      id: "discuss",
      text: "Discuss children's technology education, coding setups, and frameworks."
    },
    {
      id: "safety",
      text: "Get actionable digital parenting and online cyber safety tips."
    },
    {
      id: "webinars",
      text: "Attend interactive webinars and training workshops led by mentors."
    },
    {
      id: "connect",
      text: "Connect with other tech-conscious CLATS families across Africa."
    }
  ];

  const previewCards = [
    {
      title: "Parent Discussions",
      desc: "Connect with like-minded parents, share gadget tips, and trade home screen-time formulas in a safe moderated circular group.",
      icon: <Users size={28} style={{ color: "#2EC4B6" }} />,
      badge: "Coming Soon"
    },
    {
      title: "Expert Sessions",
      desc: "Reserve direct access to upcoming masterclasses and workshops hosted by child behavioral specialists and digital curriculum guides.",
      icon: <Calendar size={28} style={{ color: "#B8A0FF" }} />,
      badge: "Coming Soon"
    },
    {
      title: "Learning Resources",
      desc: "Unlock rich handbooks, distraction blockers guides, device filter configuration sheets, and practical offline tech worksheets.",
      icon: <BookOpen size={28} style={{ color: "#FFD166" }} />,
      badge: "Coming Soon"
    },
    {
      title: "Community Challenges",
      desc: "Team up in screen-free exploration quests, collaborative family digital creation awards, and parent-child tracking benchmarks.",
      icon: <Trophy size={28} style={{ color: "#F43F5E" }} />,
      badge: "Coming Soon"
    }
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "linear-gradient(135deg, #0A0A0B 0%, #111114 100%)" : "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)",
        color: isDark ? "#FFFFFF" : "#0F172A",
        fontFamily: F.body,
        paddingBottom: 80,
        position: "relative",
        boxSizing: "border-box",
        transition: "all 0.3s ease"
      }}
    >
      {/* HEADER BAR */}
      <div
        style={{
          background: isDark ? "rgba(10, 10, 11, 0.7)" : "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(16px)",
          borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(15, 23, 42, 0.05)",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(15, 23, 42, 0.1)",
            borderRadius: 12,
            padding: "8px 16px",
            color: isDark ? "#FFFFFF" : "#0F172A",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: F.mono,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(15, 23, 42, 0.08)";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(15, 23, 42, 0.05)";
            e.currentTarget.style.transform = "";
          }}
        >
          <ArrowLeft size={16} />
          <span>BACK TO DASHBOARD</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Chip color="#2EC4B6" bg="rgba(46, 196, 182, 0.12)">
            VIP EARLY PREVIEW
          </Chip>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        
        {/* TOP INTRO LEVEL */}
        <div style={{ textAlign: "center", marginBottom: 44, maxWidth: 680, margin: "0 auto 48px" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 12, alignItems: "center" }}>
            <span style={{ fontSize: 32, animation: "bounce 2s infinite" }}>👥</span>
            <Chip color="#B8A0FF" bg="rgba(167, 139, 250, 0.15)">
              UNDER DEVELOPMENT
            </Chip>
          </div>
          <Heading size={36} color={isDark ? "#FFFFFF" : "#0F172A"} style={{ fontWeight: 900, marginBottom: 12 }}>
            Parent Community
          </Heading>
          <Txt size={17} color={isDark ? "#94A3B8" : "#475569"} style={{ display: "block", lineHeight: 1.6 }}>
            A safe space for parents to learn, share, and grow together. Connect directly with education enthusiasts across CLATS families.
          </Txt>
        </div>

        {/* TWO-COLUMN GRIDS: HERO CARD + DECO CONTENT */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32, alignItems: "stretch", marginBottom: 48 }} className="grid lg:grid-cols-12">
          
          {/* COLUMN 1: THE RICH HERO CARD (8 cols) */}
          <div style={{ textDecoration: "none" }} className="lg:col-span-7">
            <Card
              style={{
                background: isDark ? "linear-gradient(135deg, #131B2E 0%, #151433 100%)" : "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                border: isDark ? "2px solid rgba(184, 160, 255, 0.25)" : "2px solid rgba(59, 130, 246, 0.2)",
                padding: 32,
                borderRadius: 28,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: isDark ? "0 20px 45px rgba(0,0,0,0.4)" : "0 10px 25px rgba(59, 130, 246, 0.05)",
                transition: "all 0.3s ease"
              }}
            >
              <div>
                {/* Image Illustration */}
                <div
                  style={{
                    position: "relative",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: isDark ? "3px solid rgba(255, 255, 255, 0.08)" : "3px solid rgba(59, 130, 246, 0.1)",
                    marginBottom: 28,
                    background: isDark ? "#0F172A" : "#FFFFFF",
                    boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.3)" : "0 8px 20px rgba(59, 130, 246, 0.06)",
                    transition: "all 0.3s ease"
                  }}
                >
                  <img
                    src={parentCommunityIllust}
                    alt="Parents discussing learning and technology"
                    referrerPolicy="no-referrer"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      maxHeight: 340,
                      objectFit: "cover",
                      objectPosition: "center"
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      background: "rgba(10, 10, 11, 0.85)",
                      backdropFilter: "blur(12px)",
                      border: "1.5px solid rgba(255,255,255,0.15)",
                      padding: "6px 12px",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Activity size={14} className="text-[#2EC4B6] animate-pulse" />
                    <span style={{ fontSize: 11.5, fontFamily: F.mono, color: "#2EC4B6", fontWeight: 800 }}>
                      IN ACTIVE PIPELINE
                    </span>
                  </div>
                </div>

                <Heading size={24} color={isDark ? "#FFFFFF" : "#0F172A"} style={{ fontWeight: 900, marginBottom: 12 }}>
                  Community Features Coming Soon
                </Heading>
                
                <Txt size={15} color={isDark ? "#CBD5E1" : "#334155"} style={{ display: "block", marginBottom: 20, lineHeight: 1.6 }}>
                  We are building a secure community where parents can look forward to exploring custom modules with other families:
                </Txt>

                {/* Features Bullets */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
                  {communityFeatures.map((item, index) => (
                    <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div
                        style={{
                          background: "rgba(46, 196, 182, 0.15)",
                          border: "1.5px solid rgba(46, 196, 182, 0.3)",
                          borderRadius: "50%",
                          width: 22,
                          height: 22,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 2,
                          flexShrink: 0
                        }}
                      >
                        <Check size={12} style={{ color: "#2EC4B6" }} strokeWidth={3} />
                      </div>
                      <Txt size={14.5} color={isDark ? "#E2E8F0" : "#1E293B"} style={{ lineHeight: 1.4, fontWeight: 600 }}>
                        {item.text}
                      </Txt>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: isDark ? "1px dashed rgba(255, 255, 255, 0.1)" : "1px dashed rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <div style={{ background: "rgba(34, 211, 238, 0.08)", border: "1.5px solid rgba(22, 163, 74, 0.3)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", flexShrink: 0, justifyContent: "center" }}>
                  <ShieldCheck size={18} style={{ color: "#10B981" }} />
                </div>
                <Txt size={11.5} color={isDark ? "#94A3B8" : "#475569"} style={{ fontFamily: F.mono, fontWeight: 700 }}>
                  SECURE & EXCLUSIVELY FOR REGISTERED CLATS FAMILIES
                </Txt>
              </div>
            </Card>
          </div>

          {/* COLUMN 2: THE EXCITED WAITLIST BOX (4 cols) */}
          <div style={{ textDecoration: "none" }} className="lg:col-span-5">
            <Card
              style={{
                background: isDark ? "linear-gradient(135deg, #111114 0%, #1B182E 100%)" : "linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%)",
                border: isDark ? "2px solid rgba(245, 158, 11, 0.2)" : "2px solid rgba(245, 158, 11, 0.3)",
                padding: 32,
                borderRadius: 28,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                alignItems: "stretch",
                boxShadow: isDark ? "0 20px 45px rgba(0,0,0,0.4)" : "0 10px 25px rgba(245, 158, 11, 0.06)",
                transition: "all 0.3s ease"
              }}
            >
              {/* Dynamic state: Waitlist Registration Form */}
              {!isAdded ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div
                    style={{
                      background: "rgba(245, 158, 11, 0.12)",
                      border: "2px solid rgba(245, 158, 11, 0.3)",
                      borderRadius: "50%",
                      width: 72,
                      height: 72,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                      color: "#FBBF24"
                    }}
                  >
                    <Bell size={36} className="animate-bounce" />
                  </div>

                  <Heading size={24} color={isDark ? "#FFFFFF" : "#0F172A"} style={{ fontWeight: 900, marginBottom: 4 }}>
                    Be the First to Join
                  </Heading>

                  <Txt size={15} color={isDark ? "#94A3B8" : "#475569"} style={{ display: "block", marginBottom: 12, lineHeight: 1.6 }}>
                    Get notified when the Parent Community launches. Join our growing group of early engineering-focused families.
                  </Txt>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left", width: "100%" }}>
                    <FieldInput
                      label="PARENT NAME"
                      placeholder="e.g. Chisom Okafor"
                      value={parentName}
                      onChange={(val) => {
                        setParentName(val);
                        setErrorMessage("");
                      }}
                    />

                    <FieldInput
                      label="YOUR EMAIL ADDRESS"
                      placeholder="e.g. parent@example.com"
                      value={email}
                      onChange={(val) => {
                        setEmail(val);
                        setErrorMessage("");
                      }}
                    />

                    <FieldInput
                      label="PHONE NUMBER (ACTIVE WHATSAPP / CONTACT)"
                      placeholder="e.g. +234 803 123 4567"
                      value={phone}
                      onChange={(val) => {
                        setPhone(val);
                        setErrorMessage("");
                      }}
                    />

                    <FieldInput
                      label="LOCATION (CITY / STATE / COUNTRY)"
                      placeholder="e.g. Ikeja, Lagos, Nigeria"
                      value={locationStr}
                      onChange={(val) => {
                        setLocationStr(val);
                        setErrorMessage("");
                      }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 800, fontFamily: F.mono, marginBottom: 6, color: isDark ? "#94A3B8" : "#475569" }}>
                          NUMBER OF CHILDREN
                        </label>
                        <select
                          value={numberOfChildren}
                          onChange={(e) => setNumberOfChildren(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
                            border: isDark ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #CBD5E1",
                            color: isDark ? "#FFFFFF" : "#0F172A",
                            fontSize: 13,
                            fontFamily: F.mono,
                            boxSizing: "border-box"
                          }}
                        >
                          <option value="1">1 Child</option>
                          <option value="2">2 Children</option>
                          <option value="3">3 Children</option>
                          <option value="4">4+ Children</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 800, fontFamily: F.mono, marginBottom: 6, color: isDark ? "#94A3B8" : "#475569" }}>
                          AGE GROUPS (E.G. 4-6, 7-9)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 5, 8 years"
                          value={ageGroups}
                          onChange={(e) => setAgeGroups(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
                            border: isDark ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #CBD5E1",
                            color: isDark ? "#FFFFFF" : "#0F172A",
                            fontSize: 13,
                            fontFamily: F.body,
                            boxSizing: "border-box"
                          }}
                        />
                      </div>
                    </div>

                    <div 
                      onClick={() => setIsFoundingFamily(!isFoundingFamily)}
                      style={{ 
                        marginTop: 4,
                        padding: "12px 14px", 
                        borderRadius: 12, 
                        background: isFoundingFamily ? "rgba(245, 158, 11, 0.08)" : "transparent",
                        border: isFoundingFamily ? "1.5px solid rgba(245, 158, 11, 0.25)" : (isDark ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid #E2E8F0"),
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "all 0.2s"
                      }}
                    >
                      <input 
                        type="checkbox"
                        checked={isFoundingFamily}
                        onChange={() => {}} // handled by parent div click
                        style={{ accentColor: "#F59E0B", cursor: "pointer" }}
                      />
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: isFoundingFamily ? "#F59E0B" : (isDark ? "#E2E8F0" : "#1E293B") }}>
                          Request Founding Family Status (VIP)
                        </div>
                        <div style={{ fontSize: 10, color: isDark ? "#94A3B8" : "#64748B", marginTop: 1 }}>
                          Unlocks premium onboarding milestones, free beta-tests & custom reports
                        </div>
                      </div>
                    </div>

                    {errorMessage && (
                      <div
                        style={{
                          background: "rgba(244, 63, 94, 0.12)",
                          border: "1.5px solid rgba(244, 63, 94, 0.25)",
                          padding: "8px 12px",
                          borderRadius: 10,
                          fontSize: 12.5,
                          color: "#F43F5E",
                          fontWeight: 700,
                          fontFamily: F.mono
                        }}
                      >
                        ⚠️ {errorMessage}
                      </div>
                    )}

                    <Btn
                      variant="yellow"
                      full
                      size="lg"
                      onClick={handleNotifyMe}
                      disabled={isSubmitting}
                      style={{
                        marginTop: 8,
                        boxShadow: "0 10px 25px rgba(250, 204, 21, 0.4)",
                        fontFamily: F.display,
                        fontSize: 15,
                        letterSpacing: 0.5,
                        borderRadius: 14,
                        padding: "14px 20px"
                      }}
                    >
                      {isSubmitting ? "REGISTERING PREFERENCES..." : "Notify Me"}
                    </Btn>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    padding: "32px 0"
                  }}
                  className="animate-[fadeIn_0.5s_ease-out]"
                >
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "3px solid #10B981",
                      borderRadius: "50%",
                      width: 80,
                      height: 80,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      position: "relative"
                    }}
                  >
                    <CheckCircle2 size={44} style={{ color: "#10B981" }} />
                    <div
                      style={{
                        position: "absolute",
                        inset: -6,
                        borderRadius: "50%",
                        border: "2px solid rgba(16,185,129,0.3)",
                        animation: "pulse 2s infinite"
                      }}
                    />
                  </div>

                  <Heading size={26} color="#10B981" style={{ fontWeight: 950, marginBottom: 4 }}>
                    You're On The List!
                  </Heading>

                  <Txt size={15} color="#CBD5E1" style={{ display: "block", marginBottom: 12, lineHeight: 1.6 }}>
                    Outstanding! We have logged your interest in our local ledger. We will dispatch a notification as soon as early access slots open!
                  </Txt>

                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1.5px dashed rgba(16, 185, 129, 0.25)",
                      borderRadius: 14,
                      padding: "12px 16px"
                    }}
                  >
                    <Txt size={12} color="#10B981" style={{ fontFamily: F.mono, fontWeight: 800 }}>
                      ✓ LOCAL INTEREST SECURELY REGISTERED
                    </Txt>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* FEATURE PREVIEW CARDS ROW DISPLAY */}
        <div style={{ marginTop: 64, marginBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <Sparkles size={22} style={{ color: "#FFD166" }} />
            <Label style={{ letterSpacing: 1.2, color: isDark ? "#FFFFFF" : "#0F172A" }}>Sneak Peek: Feature Preview</Label>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20
            }}
          >
            {previewCards.map((pCard, index) => (
              <Card
                key={pCard.title}
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #E2E8F0",
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 220,
                  borderRadius: 20,
                  boxShadow: isDark ? "none" : "0 4px 12px rgba(15, 23, 42, 0.03)",
                  transition: "transform 0.25s ease, border-color 0.25s ease, background 0.3s ease"
                }}
                className={isDark ? "hover:scale-[1.02] hover:border-white/10" : "hover:scale-[1.02] hover:border-slate-300"}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div
                      style={{
                        background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                        borderRadius: 12,
                        width: 48,
                        height: 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {pCard.icon}
                    </div>

                    <Chip color="#B8A0FF" bg="rgba(167, 139, 250, 0.12)">
                      {pCard.badge}
                    </Chip>
                  </div>

                  <Heading size={18} color={isDark ? "#FFFFFF" : "#0F172A"} style={{ fontWeight: 800, marginBottom: 8 }}>
                    {pCard.title}
                  </Heading>

                  <Txt size={13} color={isDark ? "#94A3B8" : "#475569"} style={{ display: "block", lineHeight: 1.5 }}>
                    {pCard.desc}
                  </Txt>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* FOOTER BOUNDARY */}
        <div
          style={{
            marginTop: 80,
            borderTop: isDark ? "1px dashed rgba(255, 255, 255, 0.1)" : "1px dashed rgba(15, 23, 42, 0.1)",
            paddingTop: 36,
            textAlign: "center"
          }}
        >
          <div style={{ display: "inline-flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
            <p style={{ margin: 0, fontSize: 16, fontFamily: F.display, fontWeight: 920, color: "#2EC4B6", letterSpacing: 0.5, textTransform: "uppercase" }}>
              🚀 Together we're building tomorrow's tech minds today.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ParentCommunity;
