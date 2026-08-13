"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function PartnerLogin() {
  const router = useRouter();
  const { theme } = useApp();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const emailInput = (e.target as HTMLFormElement).querySelector('input[type="email"]') as HTMLInputElement;
      const passInput = (e.target as HTMLFormElement).querySelector('input[type="password"]') as HTMLInputElement;
      
      const res = await fetch("/api/supabase/partner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.value, password: passInput.value }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.ok) {
        throw new Error(data.msg || "Login failed");
      }
      
      localStorage.setItem("clats_partner_session", JSON.stringify(data.partner));
      router.push("/partner/dashboard");
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
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
              className={`w-full px-4 py-3 rounded-xl border outline-none focus:border-[#2EC4B6] transition-colors ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
            />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Password</label>
            <input 
              type="password"
              required 
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

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">OR</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <button 
          onClick={handleLogin}
          disabled={loading}
          className={`w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors border ${isDark ? "bg-slate-900 border-slate-700 text-white hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Sign in with Google
        </button>

        <p className="text-center text-xs mt-6 text-slate-500">
          Want to become an affiliate? <button onClick={() => router.push('/partner/register')} className="text-[#2EC4B6] font-bold hover:underline">Sign up</button>
        </p>
      </div>
    </div>
  );
}
