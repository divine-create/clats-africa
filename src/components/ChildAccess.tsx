/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Eye, EyeOff, Sparkles, HelpCircle } from "lucide-react";
import { Child, Language } from "../types";
import { C, F, T, S } from "../utils/config";
import { MascotImage } from "./Onboarding";
import { sfx } from "../utils/audio";

interface ChildLoginScreenProps {
  onLoginSuccess: (child: Child) => void;
  onNavigateParentRegister: () => void;
  onBack: () => void;
  lang: Language;
  theme?: "light" | "dark";
}

export const ChildLoginScreen: React.FC<ChildLoginScreenProps> = ({
  onLoginSuccess,
  onNavigateParentRegister,
  onBack,
  lang,
  theme
}) => {
  const [loginMode, setLoginMode] = useState<"home" | "school">("home");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [parentWithGoogleChildren, setParentWithGoogleChildren] = useState<Child[] | null>(null);

  // School / B2B login state
  const [schoolCode, setSchoolCode] = useState(() => {
    if (typeof window !== "undefined") {
      // Try to pre-fill from the license key stored when coordinator redeemed code
      const licenseKey = localStorage.getItem("cl_b2b_license_code") || "";
      return licenseKey;
    }
    return "";
  });
  const [studentId, setStudentId] = useState("");
  const [studentPin, setStudentPin] = useState("");
  const [schoolLoading, setSchoolLoading] = useState(false);

  React.useEffect(() => {
    const handleMsg = (event: MessageEvent) => {
      if (event.data?.type === "GOOGLE_OAUTH_SUCCESS" && event.data?.parent) {
        const payloadParent = event.data.parent;
        
        // Connect and sync locally
        const parents = JSON.parse(localStorage.getItem("clats_parents_v1") || "{}");
        const parentKey = payloadParent.email.toLowerCase().trim();
        
        const existingNode = parents[parentKey];
        if (existingNode && (!payloadParent.children || payloadParent.children.length === 0)) {
          payloadParent.children = existingNode.children || [];
        }

        parents[parentKey] = payloadParent;
        localStorage.setItem("clats_parents_v1", JSON.stringify(parents));

        const kids = payloadParent.children || [];
        if (kids.length === 0) {
          setErrorMsg("Verified Google account login successfully, but no student profiles were found. Please ask your parent to create an account first!");
        } else if (kids.length === 1) {
          sfx.playCoin();
          onLoginSuccess(kids[0]);
        } else {
          sfx.playCoin();
          setParentWithGoogleChildren(kids);
        }
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [onLoginSuccess]);

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    
    try {
      const clientId = "459034420613-7u4dnk910e1vsvk6db247b4s9e3dbl50.apps.googleusercontent.com";
      const redirectUri = `${window.location.origin}/auth/callback`;
      
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=email%20profile` +
        `&prompt=select_account`;

      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(googleAuthUrl, "CLATS Google OAuth", `width=${width},height=${height},left=${left},top=${top}`);
    } catch (e) {
      setErrorMsg("Error initiating Google sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim()) {
      setErrorMsg("Please enter your Username or Parent's Gmail.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your PIN or password.");
      return;
    }

    setLoading(true);

    setLoading(true);

    try {
      const res = await fetch("/api/supabase/child/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        if (data.type === "child" && data.child) {
          sfx.playCoin();
          onLoginSuccess(data.child);
        } else if (data.type === "parent_with_children" && data.children) {
          sfx.playCoin();
          setParentWithGoogleChildren(data.children);
        } else {
          sfx.playBuzzer();
          setErrorMsg("Login successful but no profile returned.");
        }
      } else {
        sfx.playBuzzer();
        setErrorMsg(data.msg || "Incorrect credentials / PIN. Please try again or ask your parent!");
      }
    } catch (err: any) {
      sfx.playBuzzer();
      setErrorMsg("Failed to connect to the authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  const handleSchoolLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolCode.trim()) { setErrorMsg("Please enter your school code."); return; }
    if (!studentId.trim() || studentId.length !== 4) { setErrorMsg("Student ID must be 4 digits."); return; }
    if (!studentPin.trim() || studentPin.length !== 4) { setErrorMsg("PIN must be 4 digits."); return; }

    setSchoolLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/supabase/b2b/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode: schoolCode.trim().toUpperCase(), studentId: studentId.trim(), pin: studentPin.trim() })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        sfx.playCoin();
        // Map DB student format to Child type
        const child: Child = {
          id: data.student.id,
          name: data.student.name,
          username: data.student.studentId || data.student.id,
          ageGroup: data.student.ageGroup || "young innovators",
          avatar: data.student.avatar || "👦🏾",
          pin: studentPin,
          interests: data.student.interests || [],
          completedLessons: data.student.completedLessons || {},
          completed: data.student.completed || {},
          createdAt: data.student.createdAt || Date.now(),
          streak: data.student.streak || 0,
          best_streak: data.student.best_streak || 0,
          last_active_at: data.student.last_active_at || null,
          badges: data.student.badges || [],
          xp: data.student.xp || 0,
          stars: data.student.stars || {},
          quizResults: data.student.quizResults || {},
          companion: data.student.companion || "kobe",
          isB2B: true,
          orgId: data.student.orgId,
        };
        onLoginSuccess(child);
      } else {
        sfx.playBuzzer();
        setErrorMsg(data.msg || "Invalid credentials. Check your School Code, Student ID and PIN.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to school login server.");
    } finally {
      setSchoolLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark 
          ? "linear-gradient(150deg, #0F172A 0%, #020617 80%)" 
          : "linear-gradient(165deg, #ECFDF5 0%, #F0FDFA 40%, #E0F2FE 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        position: "relative",
        transition: "all 0.3s ease"
      }}
    >
      {/* Back Button */}
      <div style={{ position: "absolute", top: 20, left: 20 }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            color: isDark ? "#94A3B8" : "#475569",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: F.display,
            display: "flex",
            alignItems: "center",
            gap: 6,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            transition: "all 0.15s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#19C6C6";
            e.currentTarget.style.transform = "translateX(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isDark ? "#94A3B8" : "#475569";
            e.currentTarget.style.transform = "none";
          }}
        >
          ← {T[lang].back}
        </button>
      </div>

      {/* Main card */}
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: isDark ? "#1E293B" : "#FFFFFF",
          borderRadius: 24,
          border: isDark ? "1.5px solid rgba(255, 255, 255, 0.08)" : "2px solid #19C6C6",
          boxShadow: isDark ? "0 12px 48px rgba(0,0,0,0.5)" : "0 16px 48px rgba(25, 198, 198, 0.12)",
          padding: "32px 28px",
          textAlign: "center",
          boxSizing: "border-box",
          position: "relative",
          zIndex: 10,
          transition: "all 0.3s ease"
        }}
      >
        {/* Support characters header illustration */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 20,
            marginBottom: 20,
            marginTop: 4
          }}
        >
          <div
            style={{
              background: isDark ? "rgba(34, 211, 238, 0.08)" : "rgba(34, 211, 238, 0.12)",
              padding: 8,
              borderRadius: 20,
              border: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(34, 211, 238, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 90,
              height: 90
            }}
          >
            <MascotImage character="kobe" height={80} />
          </div>
          <div
            style={{
              background: isDark ? "rgba(167, 139, 250, 0.08)" : "rgba(167, 139, 250, 0.12)",
              padding: 8,
              borderRadius: 20,
              border: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(167, 139, 250, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 90,
              height: 90
            }}
          >
            <MascotImage character="chibi" height={76} />
          </div>
        </div>

        {parentWithGoogleChildren ? (
          <div style={{ padding: "10px 0" }}>
            <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 900, color: isDark ? "#FFFFFF" : "#0F172A", marginBottom: 6 }}>
              Select Student Profile
            </h3>
            <p style={{ fontFamily: F.body, fontSize: 13, color: isDark ? "#94A3B8" : "#64748B", marginBottom: 24 }}>
              Choose your account to resume your learning quests & levels:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "20px 0" }}>
              {parentWithGoogleChildren.map((child: Child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => {
                    sfx.playCoin();
                    onLoginSuccess(child);
                  }}
                  style={{
                    background: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                    border: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"}`,
                    borderRadius: 20,
                    padding: "20px 12px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    transition: "all 0.15s ease",
                    boxSizing: "border-box"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#19C6C6";
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(25, 198, 198, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <ClatsAvatar avatarData={child.avatar} size={48} className="rounded-full shadow-sm" style={{ border: `2px solid ${isDark ? "#334155" : "#E2E8F0"}` }} />
                  <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 900, color: isDark ? "#FFF" : "#1E293B" }}>
                    {child.name}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: F.mono, textTransform: "uppercase", color: "#19C6C6", fontWeight: 700 }}>
                    ✨ {child.xp} XP
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setParentWithGoogleChildren(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#19C6C6",
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                marginTop: 10,
                textDecoration: "underline"
              }}
            >
              ← Back to login details
            </button>
          </div>
        ) : (
          <>
            {/* Heading */}
            <h2
              style={{
                fontFamily: F.display,
                fontSize: 28,
                fontWeight: 900,
                color: isDark ? "#FFFFFF" : "#0F172A",
                letterSpacing: "-0.02em",
                marginBottom: 6,
                marginTop: 0
              }}
            >
              Welcome Explorer!
            </h2>

            {/* Subheading */}
            <p
              style={{
                fontFamily: F.body,
                fontSize: 14,
                fontWeight: 500,
                color: isDark ? "#94A3B8" : "#475569",
                lineHeight: 1.5,
                margin: "0 auto 20px",
                maxWidth: 320
              }}
            >
              Log in to continue your learning journey.
            </p>

            {/* ── MODE SWITCHER TABS ── */}
            <div style={{ display: "flex", background: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9", borderRadius: 14, padding: 4, marginBottom: 24, gap: 4 }}>
              {([["home", "🏠 Home Login"], ["school", "🏫 School Login"]] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setLoginMode(mode); setErrorMsg(""); }}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: 10,
                    border: "none",
                    fontFamily: F.display,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: loginMode === mode ? (isDark ? "#7A6FF0" : "#7A6FF0") : "transparent",
                    color: loginMode === mode ? "#FFFFFF" : (isDark ? "#94A3B8" : "#64748B"),
                    boxShadow: loginMode === mode ? "0 4px 12px rgba(122,111,240,0.3)" : "none",
                  }}
                >{label}</button>
              ))}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, textAlign: "left", display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontFamily: F.body, fontSize: 13, color: "#EF4444", fontWeight: 600 }}>{errorMsg}</span>
              </div>
            )}

            {/* ── SCHOOL LOGIN FORM ── */}
            {loginMode === "school" && (
              <form onSubmit={handleSchoolLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: isDark ? "#94A3B8" : "#475569", letterSpacing: 1.5, textTransform: "uppercase" }}>
                    School Code
                  </label>
                  <input
                    type="text"
                    value={schoolCode}
                    onChange={e => setSchoolCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CLATS-LAGOS-2026"
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `2px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"}`,
                      background: isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                      color: isDark ? "#FFF" : "#1E293B",
                      fontFamily: F.mono,
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box" as const,
                    }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: isDark ? "#94A3B8" : "#475569", letterSpacing: 1.5, textTransform: "uppercase" }}>
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value.replace(/\D/g,"").slice(0,4))}
                      placeholder="0042"
                      maxLength={4}
                      inputMode="numeric"
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: `2px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"}`,
                        background: isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                        color: "#19C6C6",
                        fontFamily: F.mono,
                        fontSize: 22,
                        fontWeight: 900,
                        letterSpacing: "0.2em",
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box" as const,
                        textAlign: "center",
                      }}
                    />
                  </div>
                  <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: isDark ? "#94A3B8" : "#475569", letterSpacing: 1.5, textTransform: "uppercase" }}>
                      PIN
                    </label>
                    <input
                      type="password"
                      value={studentPin}
                      onChange={e => setStudentPin(e.target.value.replace(/\D/g,"").slice(0,4))}
                      placeholder="····"
                      maxLength={4}
                      inputMode="numeric"
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: `2px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"}`,
                        background: isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                        color: isDark ? "#FFF" : "#1E293B",
                        fontFamily: F.mono,
                        fontSize: 22,
                        fontWeight: 900,
                        letterSpacing: "0.3em",
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box" as const,
                        textAlign: "center",
                      }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={schoolLoading}
                  style={{
                    padding: "14px",
                    borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #7A6FF0 0%, #19C6C6 100%)",
                    color: "#FFF",
                    fontFamily: F.display,
                    fontSize: 15,
                    fontWeight: 900,
                    cursor: schoolLoading ? "not-allowed" : "pointer",
                    opacity: schoolLoading ? 0.7 : 1,
                    letterSpacing: "-0.01em",
                    boxShadow: "0 6px 20px rgba(122,111,240,0.35)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {schoolLoading ? "Logging in..." : "🎓 Enter Classroom"}
                </button>
                <p style={{ fontFamily: F.body, fontSize: 11, color: isDark ? "#64748B" : "#94A3B8", textAlign: "center", margin: 0 }}>
                  Your School Code and Student ID are on your CLATS Learner Card.
                </p>
              </form>
            )}

            {/* ── HOME LOGIN FORM (conditional) ── */}
            {loginMode === "home" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Username Field */}
              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontFamily: F.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    color: isDark ? C.stone : "#475569",
                    letterSpacing: 1.5,
                    textTransform: "uppercase"
                  }}
                >
                  Child Username or Parent's Gmail
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter unique username or parent's email"
                  autoFocus
                  style={{
                    width: "100%",
                    background: isDark ? "rgba(0,0,0,0.35)" : "#F8FAFC",
                    border: "2px solid " + (isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"),
                    borderRadius: 14,
                    padding: "14px 16px",
                    fontFamily: F.body,
                    fontSize: 15,
                    color: isDark ? "#FFFFFF" : "#1E293B",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.15s ease"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#19C6C6";
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(25, 198, 198, 0.25)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Password (PIN) Field */}
              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontFamily: F.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    color: isDark ? C.stone : "#475569",
                    letterSpacing: 1.5,
                    textTransform: "uppercase"
                  }}
                >
                  PIN Code or Parent Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your PIN or password"
                    style={{
                      width: "100%",
                      background: isDark ? "rgba(0,0,0,0.35)" : "#F8FAFC",
                      border: "2px solid " + (isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"),
                      borderRadius: 14,
                      padding: "14px 44px 14px 16px",
                      fontFamily: F.body,
                      fontSize: 15,
                      color: isDark ? "#FFFFFF" : "#1E293B",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.15s ease"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#19C6C6";
                      e.currentTarget.style.boxShadow = "0 0 12px rgba(25, 198, 198, 0.25)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: isDark ? C.stone : "#64748B",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 4,
                      transition: "color 0.15s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#19C6C6")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? C.stone : "#64748B")}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Verification Error */}
              {errorMsg && (
                <div
                  style={{
                    background: "rgba(244, 63, 94, 0.08)",
                    border: `1px solid ${C.red}`,
                    borderRadius: 12,
                    padding: "10px 14px",
                    textAlign: "left",
                    fontFamily: F.body,
                    fontSize: 13,
                    color: C.red,
                    fontWeight: 600,
                    lineHeight: 1.4
                  }}
                >
                  ⚠ {errorMsg}
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "#19C6C6",
                  color: "#0A0A0B",
                  border: "none",
                  borderRadius: 14,
                  padding: "14px 20px",
                  fontFamily: F.display,
                  fontSize: 16,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 20px rgba(25, 198, 198, 0.25)",
                  transition: "all 0.15s ease",
                  marginTop: 4
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 6px 24px rgba(25, 198, 198, 0.35)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(25, 198, 198, 0.25)";
                }}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", margin: "8px 0", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#64748B" : "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8 }}>or</span>
                <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0" }} />
              </div>

              {/* google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: "100%",
                  background: isDark ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                  border: `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"}`,
                  borderRadius: "14px",
                  padding: "12px 16px",
                  color: isDark ? "#F8FAFC" : "#1E293B",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.15s ease",
                  boxSizing: "border-box"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.08)" : "#F8FAFC";
                  e.currentTarget.style.borderColor = "#19C6C6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "#FFFFFF";
                  e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign In with Parent's Google</span>
              </button>
            </form>
            )}
          </>
        )}

        {/* Secondary parent registration prompt link */}
        <div style={{ marginTop: 20 }}>
          <button
            type="button"
            onClick={() => {
              sfx.playTap();
              onNavigateParentRegister();
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#19C6C6",
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.15s",
              textDecoration: "underline"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0891b2")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#19C6C6")}
          >
            My Parent Needs to Enroll Me
          </button>
        </div>

        {/* Separator Line */}
        <hr
          style={{
            border: "none",
            height: "1px",
            background: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0",
            margin: "24px 0 20px"
          }}
        />

        {/* Help Text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: isDark ? "rgba(255,255,255,0.02)" : "#F1F5F9",
            borderRadius: 16,
            padding: "12px 14px",
            border: isDark ? "1px solid rgba(255,255,255,0.03)" : "1px solid #E2E8F0"
          }}
        >
          <HelpCircle size={18} style={{ color: isDark ? C.stone : "#64748B", flexShrink: 0 }} />
          <p
            style={{
              fontFamily: F.body,
              fontSize: 12.5,
              fontWeight: 500,
              color: isDark ? C.stone : "#475569",
              lineHeight: 1.4,
              margin: 0,
              textAlign: "left"
            }}
          >
            <span style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontWeight: 700 }}>
              Don't have a learning account yet?
            </span>{" "}
            Ask your parent or guardian to create one for you.
          </p>
        </div>
      </div>
    </div>
  );
};
