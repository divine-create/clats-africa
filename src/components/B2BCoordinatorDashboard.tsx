import React, { useState, useEffect } from "react";
import { Parent, Language } from "../types";
import { F } from "../utils/config";
import { LogOut, Users, FileText, BarChart2, Plus, Shield, X, Copy, Check } from "lucide-react";

interface Props {
  parent: Parent;
  lang: Language;
  theme: "light" | "dark";
  dbConnected: boolean;
  isSyncing: boolean;
  onLogout: () => void;
  onEnterChildMode: (child: any) => void;
  onNavigate: (screen: any) => void;
  onToggleTheme: () => void;
  onLanguageChange: (lang: Language) => void;
  onRefreshParent?: (p: Parent) => void;
}

export const B2BCoordinatorDashboard: React.FC<Props> = ({
  parent,
  theme,
  onLogout,
  onToggleTheme,
}) => {
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "reports">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [b2bOrg, setB2bOrg] = useState<any>(null);
  const [b2bStudents, setB2bStudents] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Add Student Modal
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAgeGroup, setNewAgeGroup] = useState("young innovators");
  const [newPin, setNewPin] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [addError, setAddError] = useState("");
  const [newlyAdded, setNewlyAdded] = useState<any>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const handleBulkCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkUploading(true);
    setAddError("");
    
    try {
      const text = await file.text();
      const rows = text.split("\n").map(r => r.trim()).filter(r => r.length > 0);
      const startIndex = rows[0].toLowerCase().includes("name") ? 1 : 0;
      
      const studentsToAdd = rows.slice(startIndex).map(row => {
        const parts = row.split(",").map(c => c.trim());
        const name = parts[0];
        const rawAgeGroup = parts[1] || "";
        const pin = parts[2] || "";
        let age_group = "young innovators";
        if (rawAgeGroup.toLowerCase().includes("early")) age_group = "early explorers";
        else if (rawAgeGroup.toLowerCase().includes("future")) age_group = "future builders";
        return { name, age_group, pin };
      }).filter(s => s.name.length > 0);

      if (studentsToAdd.length === 0) {
        alert("No students found in CSV. Format should be: Name, AgeGroup (optional), PIN (optional)");
        setIsBulkUploading(false);
        return;
      }

      if (studentsToAdd.length > 5) {
         if (!confirm(`You are about to add ${studentsToAdd.length} students. Proceed?`)) {
           setIsBulkUploading(false);
           return;
         }
      }

      const orgId = localStorage.getItem("cl_b2b_org_id") || "mock";
      
      const res = await fetch("/api/supabase/b2b/bulk-enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          parent_email: parent.email,
          students: studentsToAdd
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        alert(`Successfully enrolled ${data.count} students!`);
        await fetchStats();
      } else {
        alert(data.msg || "Failed to bulk enroll students.");
      }
    } catch (err: any) {
      alert("Error parsing or uploading CSV: " + err.message);
    } finally {
      setIsBulkUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Edit Student Modal
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editAgeGroup, setEditAgeGroup] = useState("");
  const [updatingStudent, setUpdatingStudent] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchStats = async () => {
    const orgId = localStorage.getItem("cl_b2b_org_id");
    if (!orgId) {
      const isDemo = typeof window !== "undefined" && (window.location.search.includes("demo=true") || window.location.hostname === "localhost");
      if (isDemo) {
        setB2bOrg({ 
          id: "mock", 
          name: "Demo School District (Local Preview)", 
          region: "Test Region", 
          b2b_license_keys: [{ code: "DEMO-LICENSE-KEY", max_uses: 100, current_uses: 4 }] 
        });
        setB2bStudents([
          { id: "1", student_id: "0001", name: "Alice K.", xp: 450, lessonsDone: 12, status: "Excelling" },
          { id: "2", student_id: "0002", name: "Brian M.", xp: 320, lessonsDone: 8, status: "Active" },
          { id: "3", student_id: "0003", name: "Chidi O.", xp: 120, lessonsDone: 3, status: "Needs Support" },
          { id: "4", student_id: "0004", name: "Fatima S.", xp: 600, lessonsDone: 15, status: "Excelling" },
        ]);
        setLoading(false);
        return;
      }
      setError("No active B2B session found. Please log in as a coordinator.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/supabase/b2b/coordinator-stats?org_id=${orgId}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setB2bOrg(data.org);
        setB2bStudents(data.students || []);
      } else {
        setError(data.msg || "Failed to load telemetry stats.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to telemetry server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleDeleteStudent = async (childId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to unenroll and completely delete student: ${studentName}?`)) {
      return;
    }
    const orgId = localStorage.getItem("cl_b2b_org_id");
    if (!orgId) {
      setB2bStudents(prev => prev.filter(s => s.id !== childId));
      return;
    }
    try {
      const res = await fetch("/api/supabase/b2b/manage-student", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId })
      });
      if (res.ok) {
        await fetchStats();
      } else {
        alert("Failed to unenroll student from server.");
      }
    } catch (e) {
      alert("Network error while unenrolling student.");
    }
  };

  const handleOpenEdit = (student: any) => {
    setEditingStudentId(student.id);
    setEditName(student.name);
    setEditPin(student.pin || "");

    setEditAgeGroup(student.age_group || "young");
    setEditError("");
    setShowEditStudent(true);
  };

  const handleUpdateStudent = async () => {
    if (!editName.trim()) { setEditError("Name is required."); return; }
    if (editPin && (editPin.length !== 4 || !/^\d{4}$/.test(editPin))) { setEditError("PIN must be exactly 4 digits."); return; }

    setUpdatingStudent(true);
    setEditError("");

    const orgId = localStorage.getItem("cl_b2b_org_id");
    if (!orgId) {
      setB2bStudents(prev => prev.map(s => {
        if (s.id === editingStudentId) {
          return { ...s, name: editName.trim(), pin: editPin, age_group: editAgeGroup };
        }
        return s;
      }));
      setShowEditStudent(false);
      setUpdatingStudent(false);
      return;
    }

    try {
      const res = await fetch("/api/supabase/b2b/manage-student", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: editingStudentId,
          name: editName.trim(),
          pin: editPin || undefined,
          ageGroup: editAgeGroup
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setShowEditStudent(false);
        await fetchStats();
      } else {
        setEditError(data.msg || "Failed to update student profile.");
      }
    } catch (err: any) {
      setEditError(err.message || "Network error.");
    } finally {
      setUpdatingStudent(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newName.trim()) { setAddError("Student name is required."); return; }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setAddError("PIN must be exactly 4 digits."); return; }

    setAddingStudent(true);
    setAddError("");

    const orgId = localStorage.getItem("cl_b2b_org_id");
    const schoolCode = b2bOrg?.b2b_license_keys?.[0]?.code || "No Active Code";

    try {
      const res = await fetch("/api/supabase/b2b/enroll-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId || "mock",
          name: newName.trim(),
          age_group: newAgeGroup,
          pin: newPin,
          parent_email: parent.email,
          // student_id is intentionally omitted — the server auto-generates a unique random ID
        })
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        const assignedId = data.student?.student_id || "????";
        const enrolled = { ...data.student, student_id: assignedId, schoolCode };
        setNewlyAdded(enrolled);
        setNewName(""); setNewPin(""); setNewAgeGroup("young innovators");
        await fetchStats();
      } else {
        // Mock mode: add locally if DB not available
        if (!orgId) {
          const mockId = String(Math.floor(1000 + Math.random() * 9000));
          const mock = { id: Date.now().toString(), student_id: mockId, name: newName.trim(), xp: 0, lessonsDone: 0, status: "Active", schoolCode };
          setB2bStudents(prev => [...prev, mock]);
          setNewlyAdded({ ...mock, pin: newPin });
          setNewName(""); setNewPin(""); setNewAgeGroup("young innovators");
        } else {
          setAddError(data.msg || "Failed to enroll student.");
        }
      }
    } catch (err: any) {
      setAddError(err.message || "Network error.");
    } finally {
      setAddingStudent(false);
    }
  };

  const copyCode = (code: string) => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = ["Student ID", "Full Name", "XP Earned", "Lessons Completed", "Status"];
    const rows = b2bStudents.map((s, i) => [
      s.student_id || `000${i+1}`.slice(-4),
      s.name,
      s.xp || 0,
      s.lessonsDone || 0,
      s.status || "Active"
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CLATS_Impact_Report_${b2bOrg?.name || "School"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print/save the PDF report!");
      return;
    }
    const orgName = b2bOrg?.name || "CLATS School District";
    const region = b2bOrg?.region || "Global Partner";
    const totalStudents = b2bStudents.length;
    const avgXp = Math.round(b2bStudents.reduce((a, b) => a + b.xp, 0) / (totalStudents || 1));
    const totalLessons = b2bStudents.reduce((a, b) => a + b.lessonsDone, 0);

    const rowsHtml = b2bStudents.map((s, i) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-family: monospace; font-weight: bold;">${s.student_id || `000${i+1}`.slice(-4)}</td>
        <td style="padding: 10px; font-weight: bold;">${s.name}</td>
        <td style="padding: 10px; text-align: right; color: #0891b2; font-family: monospace; font-weight: bold;">${s.xp} XP</td>
        <td style="padding: 10px; text-align: center;">${s.lessonsDone}</td>
        <td style="padding: 10px; text-align: center;"><span style="background: #ecfdf5; color: #047857; padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold;">${s.status}</span></td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>CLATS - School Impact Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #7A6FF0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; margin: 0; color: #0f172a; }
            .subtitle { font-size: 12px; margin: 5px 0 0; color: #64748b; font-weight: bold; }
            .meta { text-align: right; font-size: 12px; color: #64748b; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; background: #f8fafc; }
            .stat-label { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .stat-value { font-size: 24px; font-weight: bold; color: #7A6FF0; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background: #f1f5f9; padding: 12px 10px; text-align: left; font-weight: bold; color: #475569; border-bottom: 2px solid #cbd5e1; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">🎓 CLATS Education Roster & Impact Report</div>
              <div class="subtitle">School: ${orgName} · Region: ${region}</div>
            </div>
            <div class="meta">
              <div>Date: ${new Date().toLocaleDateString()}</div>
              <div>Coordinator: ${parent.email}</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Enrolled</div>
              <div class="stat-value">${totalStudents} Students</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Average Progress</div>
              <div class="stat-value">${avgXp} XP</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Lessons Completed</div>
              <div class="stat-value" style="color: #10b981;">${totalLessons} Units</div>
            </div>
          </div>

          <h3>Enrolled Student Roster Telemetry</h3>
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th style="text-align: right;">XP Earned</th>
                <th style="text-align: center;">Lessons</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="background: #7A6FF0; color: white; border: none; padding: 12px 30px; font-weight: bold; border-radius: 8px; cursor: pointer;">
              Print Report / Save as PDF
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.setTimeout(() => { printWindow.print(); }, 500);
  };

  const handlePrintCards = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print/save the cards!");
      return;
    }

    const schoolCode = b2bOrg?.b2b_license_keys?.[0]?.code || "No Active Code";
    
    const cardsHtml = b2bStudents.map(s => `
      <div style="border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; width: 300px; text-align: center; font-family: sans-serif; position: relative; overflow: hidden; page-break-inside: avoid;">
        <div style="font-weight: 900; font-size: 20px; color: #0f172a; margin-bottom: 4px;">CLATS Academy</div>
        <div style="font-size: 14px; color: #64748b; font-weight: bold; margin-bottom: 16px;">Student Login Card</div>
        
        <div style="background: #f1f5f9; padding: 12px; border-radius: 12px; margin-bottom: 12px;">
          <div style="font-size: 18px; font-weight: 800; color: #1e293b;">${s.name}</div>
        </div>
        
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <div style="flex: 1; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px;">
            <div style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">School Code</div>
            <div style="font-size: 14px; font-weight: 900; color: #7A6FF0; font-family: monospace;">${schoolCode}</div>
          </div>
          <div style="flex: 1; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px;">
            <div style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Student ID</div>
            <div style="font-size: 16px; font-weight: 900; color: #19C6C6; font-family: monospace;">${s.student_id || '----'}</div>
          </div>
        </div>
        
        <div style="border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background: #fff;">
          <div style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">PIN</div>
          <div style="font-size: 24px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${s.pin || '----'}</div>
        </div>
      </div>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>CLATS - Student Login Cards</title>
          <style>
            body { padding: 40px; margin: 0; }
            .grid { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
            @media print {
              body { padding: 0; }
              .grid { gap: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${cardsHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.setTimeout(() => { printWindow.print(); }, 500);
  };

  // ── Loading / Error screens ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0F172A] text-[#19C6C6]" : "bg-slate-50 text-[#19C6C6]"}`} style={{ fontFamily: F.body }}>
        <div className="text-center space-y-3">
          <svg className="animate-spin h-8 w-8 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle className="opacity-25" cx="12" cy="12" r="10" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="font-bold">Syncing Classroom Telemetry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? "bg-[#0F172A] text-slate-200" : "bg-slate-50 text-slate-800"}`} style={{ fontFamily: F.body }}>
        <div className={`max-w-md w-full p-6 rounded-2xl border text-center space-y-4 shadow-xl ${isDark ? "bg-[#1E293B] border-red-500/20" : "bg-white border-red-200"}`}>
          <span className="text-5xl block">⚠️</span>
          <h2 className="text-lg font-black text-rose-500">Telemetry Connection Alert</h2>
          <p className="text-xs text-slate-400">{error}</p>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-left text-[11px] font-mono space-y-2">
            <p className="font-bold">💡 Run these in Supabase SQL Editor:</p>
            <code className="block bg-slate-950 p-2 rounded text-[10px] select-all">ALTER TABLE clats_parents ADD COLUMN IF NOT EXISTS b2b_org_id uuid;</code>
            <code className="block bg-slate-950 p-2 rounded text-[10px] select-all">ALTER TABLE clats_children ADD COLUMN IF NOT EXISTS org_id uuid;</code>
            <code className="block bg-slate-950 p-2 rounded text-[10px] select-all">ALTER TABLE clats_children ADD COLUMN IF NOT EXISTS student_id TEXT;</code>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setError(""); fetchStats(); }} className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition cursor-pointer">Retry</button>
            <button onClick={onLogout} className="flex-1 py-2.5 bg-rose-500/10 text-rose-500 font-bold rounded-xl text-xs hover:bg-rose-500/20 transition cursor-pointer">Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  const schoolCode = b2bOrg?.b2b_license_keys?.[0]?.code || "";

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0F172A] text-slate-200" : "bg-slate-50 text-slate-800"}`} style={{ fontFamily: F.body }}>
      {/* HEADER */}
      <header className={`px-6 py-4 flex items-center justify-between border-b sticky top-0 z-10 ${isDark ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7A6FF0] to-[#19C6C6] flex items-center justify-center text-white font-black shadow-lg text-xs">B2B</div>
          <div>
            <h1 className="text-xl font-extrabold m-0 leading-tight">Coordinator Portal</h1>
            <p className={`text-xs m-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {b2bOrg?.name || "Loading..."}
              {b2bOrg?.region ? ` · ${b2bOrg.region}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition text-lg">{isDark ? "☀️" : "🌙"}</button>
          <button onClick={onLogout} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold transition text-sm">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* ── LAYOUT ─────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Sidebar */}
        <div className={`col-span-1 rounded-2xl border p-4 space-y-2 h-fit ${isDark ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Coordinator</p>
            <p className="font-bold text-sm truncate">{parent.email}</p>
          </div>
          {[
            { key: "overview", icon: <BarChart2 size={16}/>, label: "Overview", color: "bg-[#7A6FF0] shadow-violet-500/20" },
            { key: "students", icon: <Users size={16}/>, label: "Enrolled Students", color: "bg-[#19C6C6] shadow-cyan-500/20" },
            { key: "reports",  icon: <FileText size={16}/>, label: "Impact Reports", color: "bg-emerald-500 shadow-emerald-500/20" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition text-sm ${activeTab === tab.key ? `${tab.color} text-white shadow-md` : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="col-span-1 md:col-span-3 space-y-6">

          {/* ── OVERVIEW ─────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">Institutional Overview</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Enrolled", value: b2bStudents.length, color: "text-[#7A6FF0]" },
                  { label: "Avg. Class XP", value: Math.round(b2bStudents.reduce((a,b)=>a+b.xp,0)/(b2bStudents.length||1)), color: "text-[#19C6C6]" },
                  { label: "Excelling", value: b2bStudents.filter(s => s.status === "Excelling").length, color: "text-emerald-500" },
                  { label: "Needs Support", value: b2bStudents.filter(s => s.status === "Needs Support").length, color: "text-rose-500" },
                ].map((s, i) => (
                  <div key={i} className={`p-5 rounded-2xl border ${isDark ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200"}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{s.label}</span>
                    <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* School Code card */}
              <div className={`p-6 rounded-2xl border ${isDark ? "bg-violet-950/20 border-violet-900/30" : "bg-violet-50 border-violet-100"}`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#7A6FF0] rounded-xl text-white flex-none"><Shield size={20}/></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#7A6FF0] mb-1">Organization Access Codes</h3>
                    <p className={`text-sm mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Share these codes with students so they can scope their login to your school.
                    </p>
                    {b2bOrg?.b2b_license_keys?.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {b2bOrg.b2b_license_keys.map((k: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-[#7A6FF0]/10 border border-[#7A6FF0]/25 rounded-xl px-3 py-2 font-mono">
                            <span className="font-bold text-[#7A6FF0] text-sm tracking-wider">🔑 {k.code}</span>
                            <span className="text-[10px] text-slate-400 font-sans border-l border-slate-500/20 pl-2">{k.current_uses}/{k.max_uses} seats</span>
                            <button onClick={() => copyCode(k.code)} className="ml-1 text-slate-400 hover:text-[#7A6FF0] transition">
                              {copiedCode === k.code ? <Check size={13} className="text-emerald-500"/> : <Copy size={13}/>}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <code className="bg-[#7A6FF0]/10 text-[#7A6FF0] px-3 py-1.5 rounded-lg font-mono font-bold border border-[#7A6FF0]/30 text-xs">
                        NO ACTIVE CODE — Ask admin to generate a key
                      </code>
                    )}
                  </div>
                </div>
              </div>

              {/* ── CLASSROOM ANALYTICS & LIVE FEED ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Classroom Analytics */}
                <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200"}`}>
                  <h3 className="font-bold text-base mb-4 flex items-center gap-2">📊 Curriculum Progress Breakdown</h3>
                  <div className="space-y-4">
                    {[
                      { name: "🤖 AI Foundations", completed: Math.round(b2bStudents.reduce((a, b) => a + Math.min(100, (b.lessonsDone || 0) * 10), 0) / (b2bStudents.length || 1)), color: "bg-[#7A6FF0]" },
                      { name: "🔒 Digital Citizenship & Cyber Safety", completed: Math.round(b2bStudents.reduce((a, b) => a + Math.min(100, Math.max(0, (b.lessonsDone || 0) - 10) * 15), 0) / (b2bStudents.length || 1)), color: "bg-cyan-500" },
                      { name: "🎨 Design & Creative Arts", completed: 0, color: "bg-emerald-500" },
                      { name: "🚀 Innovation & Careers", completed: 0, color: "bg-amber-500" }
                    ].map((mod, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="opacity-85">{mod.name}</span>
                          <span className="text-[#19C6C6]">{mod.completed}%</span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                          <div className={`h-2 rounded-full ${mod.color}`} style={{ width: `${mod.completed}%`, transition: "width 0.8s ease-out" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Live Activity Feed */}
                <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200"} flex flex-col`}>
                  <h3 className="font-bold text-base mb-3 flex items-center gap-2">⏱️ Real-time Classroom Feed</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ maxHeight: 200 }}>
                    {b2bStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8">Waiting for student achievements...</p>
                    ) : (
                      b2bStudents.flatMap((s) => {
                        const events = [];
                        if (s.xp > 0) {
                          events.push({
                            student: s.name,
                            text: `completed AI Foundations Unit Assessment!`,
                            time: "3 mins ago",
                            badge: "🎓"
                          });
                        }
                        if (s.lessonsDone > 0) {
                          events.push({
                            student: s.name,
                            text: `finished the "Fix the City!" AI Grid Game.`,
                            time: "10 mins ago",
                            badge: "🏙️"
                          });
                        }
                        if (s.xp > 100) {
                          events.push({
                            student: s.name,
                            text: `unlocked the AI Cadet Badge!`,
                            time: "1 hr ago",
                            badge: "🏅"
                          });
                        }
                        return events;
                      })
                      .slice(0, 5)
                      .map((ev, idx) => (
                        <div key={idx} className={`p-2.5 rounded-xl border flex items-center gap-3 text-xs ${isDark ? "bg-slate-900/60 border-slate-800 hover:bg-slate-900" : "bg-slate-50 border-slate-150 hover:bg-slate-100"} transition`}>
                          <span style={{ fontSize: 16 }}>{ev.badge}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0 }}><strong>{ev.student}</strong> {ev.text}</p>
                          </div>
                          <span style={{ fontSize: 9, opacity: 0.6 }}>{ev.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Student Login Instructions */}
              <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className="font-bold text-base mb-3 flex items-center gap-2">🎓 How Students Log In</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { step: "1", label: "Go to", value: "/child/login", hint: "On any device or school tablet" },
                    { step: "2", label: "Enter School Code", value: schoolCode || "CLATS-XXXXX", hint: "Pre-filled on shared devices" },
                    { step: "3", label: "Enter Student ID + PIN", value: "e.g. 0042 · 1234", hint: "From their CLATS learner card" },
                  ].map((s, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <span className="w-6 h-6 rounded-full bg-[#7A6FF0] text-white text-xs font-black flex items-center justify-center mb-2">{s.step}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                      <p className="font-mono font-bold text-sm mt-0.5">{s.value}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{s.hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STUDENTS ─────────────────────────────────────────── */}
          {activeTab === "students" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black flex items-center justify-between">
                Student Roster
                <div className="flex gap-2">
                  <input type="file" id="csv-upload" accept=".csv" className="hidden" onChange={handleBulkCSVUpload} />
                  <button
                    onClick={() => document.getElementById("csv-upload")?.click()}
                    disabled={isBulkUploading}
                    className="text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 px-4 py-2 rounded-xl transition shadow-md font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isBulkUploading ? "Uploading..." : "Bulk Import CSV"}
                  </button>
                  <button
                    onClick={() => { setShowAddStudent(true); setNewlyAdded(null); setAddError(""); }}
                    className="text-sm bg-[#19C6C6] hover:bg-[#15abab] text-slate-900 px-4 py-2 rounded-xl transition shadow-md font-bold flex items-center gap-1.5"
                  >
                    <Plus size={16}/> Enroll Student
                  </button>
                </div>
              </h2>

              <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200"}`}>
                <table className="w-full text-left text-sm">
                  <thead className={isDark ? "bg-slate-800/50" : "bg-slate-50"}>
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Student ID</th>
                      <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Name</th>
                      <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right">XP</th>
                      <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-center">Lessons</th>
                      <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-center">Status</th>
                      <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b2bStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                          No students enrolled yet. Click <strong>Enroll Student</strong> to add your first learner!
                        </td>
                      </tr>
                    ) : b2bStudents.map((s, i) => (
                      <tr key={i} className={`border-t ${isDark ? "border-slate-800 hover:bg-slate-800/30" : "border-slate-100 hover:bg-slate-50"} transition`}>
                        <td className="px-4 py-4">
                          <code className="text-xs font-mono font-bold bg-[#7A6FF0]/10 text-[#7A6FF0] px-2 py-1 rounded-lg border border-[#7A6FF0]/20">
                            {s.student_id || `000${i+1}`.slice(-4)}
                          </code>
                        </td>
                        <td className="px-4 py-4 font-bold">{s.name}</td>
                        <td className="px-4 py-4 font-mono text-right text-[#19C6C6] font-bold">{s.xp}</td>
                        <td className="px-4 py-4 text-center">{s.lessonsDone}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            s.status === "Excelling" ? "bg-emerald-500/15 text-emerald-500" :
                            s.status === "Needs Support" ? "bg-rose-500/15 text-rose-500" :
                            "bg-slate-500/15 text-slate-500"
                          }`}>{s.status}</span>
                        </td>
                        <td className="px-4 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="text-xs font-bold text-[#19C6C6] hover:underline cursor-pointer"
                          >
                            Edit / PIN
                          </button>
                          <span className="text-slate-400">|</span>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                          >
                            Unenroll
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REPORTS ─────────────────────────────────────────── */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">Institutional Impact Reports</h2>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Download standardized telemetry reports to submit to your Ministry of Education or CSR corporate sponsor.
              </p>
              <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center">
                    <FileText size={24}/>
                  </div>
                  <div>
                    <h3 className="font-bold">Term 1 Impact Report (2026)</h3>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Aggregated data for {b2bStudents.length} students · {b2bOrg?.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportPDF} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md shadow-emerald-500/20 text-xs">
                    Export PDF / Print
                  </button>
                  <button onClick={handleExportCSV} className="bg-[#19C6C6] hover:bg-[#15abab] text-slate-900 font-bold py-2.5 px-6 rounded-xl transition shadow-md shadow-cyan-500/20 text-xs">
                    Export CSV
                  </button>
                  <button onClick={handlePrintCards} className="bg-[#7A6FF0] hover:bg-[#665ad1] text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md shadow-violet-500/20 text-xs whitespace-nowrap">
                    🖨️ Print Login Cards
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── ADD STUDENT MODAL ──────────────────────────────────────────────── */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-5 ${isDark ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-200"}`}>

            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold">Enroll New Student</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  A unique 4-digit Student ID will be auto-assigned.
                </p>
              </div>
              <button onClick={() => { setShowAddStudent(false); setNewlyAdded(null); }} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                <X size={18}/>
              </button>
            </div>

            {/* Success — show the credentials card */}
            {newlyAdded ? (
              <div className="space-y-4">
                <div className={`p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 text-center space-y-3`}>
                  <h4 className="font-black text-lg">{newlyAdded.name}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl ${isDark ? "bg-slate-900" : "bg-white"} border ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">School Code</p>
                      <code className="font-mono font-black text-[#7A6FF0] text-sm">{schoolCode || "CLATS-DEMO"}</code>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? "bg-slate-900" : "bg-white"} border ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Student ID</p>
                      <code className="font-mono font-black text-[#19C6C6] text-xl">{newlyAdded.student_id}</code>
                    </div>
                    <div className={`col-span-2 p-3 rounded-xl ${isDark ? "bg-slate-900" : "bg-white"} border ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">PIN</p>
                      <code className="font-mono font-black text-2xl tracking-[0.5em]">{newPin || "****"}</code>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-500 font-bold">✅ Student enrolled! Print or share these credentials.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setNewlyAdded(null); }} className="flex-1 py-3 bg-[#19C6C6] hover:bg-[#15abab] text-slate-900 font-bold rounded-2xl text-sm transition">
                    + Enroll Another
                  </button>
                  <button onClick={() => { setShowAddStudent(false); setNewlyAdded(null); }} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 font-bold rounded-2xl text-sm transition">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* ── Enroll Form ── */
              <div className="space-y-4">
                {addError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">{addError}</div>
                )}

                {/* Auto-assigned ID preview */}
                <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"} flex items-center justify-between`}>
                  <span className="text-xs font-bold text-slate-400">Auto-assigned Student ID</span>
                  <code className="font-mono font-black text-[#19C6C6] text-lg tracking-widest">
                    {String((Math.max(0, ...b2bStudents.map(s => parseInt(s.student_id || "0", 10)).filter(n => !isNaN(n)))) + 1).padStart(4, "0")}
                  </code>
                </div>


                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Student Full Name</label>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Brian Mensah"
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-sm font-bold transition ${isDark ? "bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]" : "bg-slate-50 border-slate-200 focus:border-[#7A6FF0]"}`}
                  />
                </div>

                {/* Age group */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Age Group</label>
                  <select
                    value={newAgeGroup}
                    onChange={e => setNewAgeGroup(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-sm font-bold transition ${isDark ? "bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]" : "bg-slate-50 border-slate-200 focus:border-[#7A6FF0]"}`}
                  >
                     <option value="early explorers">Early Explorers (Ages 5–8)</option>
                     <option value="young innovators">Young Innovators (Ages 9–12)</option>
                     <option value="future builders">Future Builders (Ages 13+)</option>
                  </select>
                </div>

                {/* PIN */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Set 4-Digit PIN</label>
                    <button 
                      type="button"
                      onClick={() => setNewPin(Math.floor(1000 + Math.random() * 9000).toString())}
                      className="text-[10px] font-bold text-[#7A6FF0] hover:text-[#5c50e6] transition flex items-center gap-1"
                    >
                      🎲 Auto-Generate
                    </button>
                  </div>
                  <input
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0,4))}
                    placeholder="e.g. 1234"
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-sm font-mono font-bold tracking-[0.5em] transition ${isDark ? "bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]" : "bg-slate-50 border-slate-200 focus:border-[#7A6FF0]"}`}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">The student will use this PIN every time they log in. Make it memorable!</p>
                </div>

                <button
                  onClick={handleAddStudent}
                  disabled={addingStudent}
                  className="w-full py-3.5 bg-[#7A6FF0] hover:bg-[#665ad1] disabled:opacity-50 text-white font-extrabold rounded-2xl transition shadow-lg shadow-violet-500/20 text-sm cursor-pointer"
                >
                  {addingStudent ? "Enrolling..." : "Enroll Student 🎓"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT STUDENT MODAL ────────────────────────────────────────────── */}
      {showEditStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-5 ${isDark ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-200"}`}>

            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold">Edit Student Profile</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Modify student details or reset their login PIN.
                </p>
              </div>
              <button onClick={() => setShowEditStudent(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                <X size={18}/>
              </button>
            </div>

            <div className="space-y-4">
              {editError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">{editError}</div>
              )}


              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Student Full Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Brian Mensah"
                  className={`w-full px-4 py-3 rounded-xl border outline-none text-sm font-bold transition ${isDark ? "bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]" : "bg-slate-50 border-slate-200 focus:border-[#7A6FF0]"}`}
                />
              </div>

              {/* Age group */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Age Group</label>
                <select
                  value={editAgeGroup}
                  onChange={e => setEditAgeGroup(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none text-sm font-bold transition ${isDark ? "bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]" : "bg-slate-50 border-slate-200 focus:border-[#7A6FF0]"}`}
                >
                   <option value="early explorers">Early Explorers (Ages 5–8)</option>
                   <option value="young innovators">Young Innovators (Ages 9–12)</option>
                   <option value="future builders">Future Builders (Ages 13+)</option>
                 </select>
              </div>

              {/* PIN reset */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Reset 4-Digit PIN (Optional)</label>
                <input
                  value={editPin}
                  onChange={e => setEditPin(e.target.value.replace(/\D/g, "").slice(0,4))}
                  placeholder="Leave blank to keep current PIN"
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  className={`w-full px-4 py-3 rounded-xl border outline-none text-sm font-mono font-bold tracking-[0.5em] transition ${isDark ? "bg-slate-900 border-slate-700 text-white focus:border-[#7A6FF0]" : "bg-slate-50 border-slate-200 focus:border-[#7A6FF0]"}`}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  onClick={handleUpdateStudent}
                  disabled={updatingStudent}
                  className="flex-1 py-3 bg-[#7A6FF0] hover:bg-[#665ad1] disabled:opacity-50 text-white font-extrabold rounded-2xl transition shadow-lg shadow-violet-500/20 text-sm cursor-pointer"
                >
                  {updatingStudent ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setShowEditStudent(false)}
                  className="py-3 px-5 bg-slate-200 dark:bg-slate-700 font-bold rounded-2xl text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
