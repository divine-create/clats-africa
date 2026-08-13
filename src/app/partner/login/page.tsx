"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function PartnerLogin() {
  const router = useRouter();
  const { theme } = useApp();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock partner login
    setTimeout(() => {
      // In a real app, this would set the partner context
      localStorage.setItem("clats_partner_session", JSON.stringify({
        id: "partner-1",
        type: "school",
        name: "Greenwood Academy",
        partner_code: "GREEN-26",
        commission_rate: 0.2,
        total_earnings: 145000,
        available_balance: 45000
      }));
      router.push("/partner/dashboard");
    }, 1000);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? "bg-[#0B0F14]" : "bg-slate-50"}`}>
      <div className={`w-full max-w-md p-8 rounded-3xl border shadow-xl ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-[#2EC4B6] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-teal-500/20">
            P
          </div>
        </div>
        <h1 className={`text-2xl font-black text-center mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Partner Portal</h1>
        <p className={`text-center text-sm mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Manage your referrals, commissions, and payouts.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Partner Email</label>
            <input 
              type="email" 
              required
              defaultValue="admin@greenwood.edu"
              className={`w-full px-4 py-3 rounded-xl border outline-none focus:border-[#2EC4B6] transition-colors ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
            />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Password</label>
            <input 
              type="password"
              required 
              defaultValue="password123"
              className={`w-full px-4 py-3 rounded-xl border outline-none focus:border-[#2EC4B6] transition-colors ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-[#2EC4B6] hover:bg-teal-600 text-white font-black py-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center disabled:opacity-70"
          >
            {loading ? "Authenticating..." : "Login to Portal"}
          </button>
        </form>
      </div>
    </div>
  );
}
