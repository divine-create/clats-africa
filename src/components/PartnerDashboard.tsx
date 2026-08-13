import React, { useState } from "react";
import { Link, Check, LogOut, Download, Copy, Share2, CreditCard, Users, TrendingUp, DollarSign, Settings, Image, MessageCircle } from "lucide-react";
import { CLATSLogo } from "./CLATSLogo";

interface PartnerDashboardProps {
  partner: any;
  onLogout: () => void;
  onUpdate?: (updatedPartner: any) => void;
  theme?: "light" | "dark";
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ partner, onLogout, onUpdate, theme = "dark" }) => {
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  const [editName, setEditName] = useState(partner.name || "");
  const [editEmail, setEditEmail] = useState(partner.email || "");
  const [editBank, setEditBank] = useState(partner.bank_details?.bank_name || "");
  const [editAccount, setEditAccount] = useState(partner.bank_details?.account_number || "");

  const referralLink = `https://app.clats.africa/register?partner=${partner.partner_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/supabase/partner/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: partner.id,
          name: editName,
          email: editEmail,
          bank_details: { bank_name: editBank, account_number: editAccount }
        }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.ok) {
        throw new Error(data.msg || "Failed to save settings");
      }
      
      if (onUpdate) {
        onUpdate(data.partner);
        alert("Settings saved successfully to database!");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const bgCard = isDark ? "bg-[#111827] border-slate-800" : "bg-white border-[#EAEAEA]";
  const bgMain = isDark ? "bg-[#0B0F14]" : "bg-slate-50";

  return (
    <div className={`min-h-screen ${bgMain} font-sans`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b ${isDark ? "bg-[#0B0F14]/90 border-slate-800" : "bg-white/90 border-slate-200"} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <CLATSLogo height={32} />
          <span className={`font-black text-lg ml-2 ${textPrimary}`}>Partner Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
            {partner.type.toUpperCase()}
          </div>
          <button onClick={onLogout} className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar */}
        <aside className={`w-full lg:w-64 flex-shrink-0 flex flex-col gap-2 p-4 rounded-2xl border ${bgCard}`}>
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
            <TrendingUp size={18} />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("payouts")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "payouts" 
                ? (isDark ? "bg-[#B8A0FF]/20 text-[#B8A0FF]" : "bg-purple-50 text-purple-700") 
                : (isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50")
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard size={18} />
              Payouts
            </div>
          </button>
          <button 
            onClick={() => setActiveTab("network")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "network" 
                ? (isDark ? "bg-amber-400/20 text-amber-500" : "bg-amber-50 text-amber-700") 
                : (isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50")
            }`}
          >
            <div className="flex items-center gap-3">
              <Users size={18} />
              Network
            </div>
          </button>
          <button 
            onClick={() => setActiveTab("assets")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "assets" 
                ? (isDark ? "bg-pink-500/20 text-pink-500" : "bg-pink-50 text-pink-600") 
                : (isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50")
            }`}
          >
            <div className="flex items-center gap-3">
              <Image size={18} />
              Marketing Kit
            </div>
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "settings" 
                ? (isDark ? "bg-slate-700/50 text-white" : "bg-slate-200/50 text-slate-800") 
                : (isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50")
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings size={18} />
              Settings
            </div>
          </button>
        </aside>

        {/* Content */}
        <div className="flex-1 w-full min-w-0">
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className={`text-2xl font-black m-0 ${textPrimary}`}>Welcome back, {partner.name}</h1>
                  <p className={`text-sm mt-1 ${textSecondary}`}>Your custom commission rate is {partner.commission_rate * 100}%</p>
                </div>
              </div>

              {/* Share Code */}
              <div className={`p-6 rounded-2xl border ${bgCard} flex flex-col md:flex-row items-center gap-6`}>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">Your Affiliate Link</h3>
                  <div className={`px-4 py-3 rounded-xl border font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap ${isDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-300 text-slate-600"}`}>
                    {referralLink}
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#2EC4B6] hover:bg-teal-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className={`p-6 rounded-2xl border ${bgCard} relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500" />
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Available Balance</span>
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><DollarSign size={18} /></div>
                  </div>
                  <div className={`text-3xl font-black ${textPrimary}`}>₦{(partner.available_balance || 0).toLocaleString()}</div>
                </div>

                <div className={`p-6 rounded-2xl border ${bgCard} relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 h-1 w-full bg-[#B8A0FF]" />
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Earnings</span>
                    <div className="p-2 bg-[#B8A0FF]/10 rounded-lg text-[#B8A0FF]"><TrendingUp size={18} /></div>
                  </div>
                  <div className={`text-3xl font-black ${textPrimary}`}>₦{(partner.total_earnings || 0).toLocaleString()}</div>
                </div>

                <div className={`p-6 rounded-2xl border ${bgCard} relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 h-1 w-full bg-amber-500" />
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Conversions</span>
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Users size={18} /></div>
                  </div>
                  <div className={`text-3xl font-black ${textPrimary}`}>{partner.total_conversions || 0}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payouts" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className={`text-xl font-black m-0 ${textPrimary}`}>Payouts & Bank Info</h2>
              
              <div className={`p-6 rounded-2xl border ${bgCard}`}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className={`text-sm font-bold ${textPrimary}`}>Withdraw Funds</h3>
                    <p className={`text-xs ${textSecondary}`}>Transfer your available balance to your bank</p>
                  </div>
                  <button className="bg-[#B8A0FF] hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow">
                    Request Payout
                  </button>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <span className="block text-xs font-bold text-slate-400 mb-1">Active Bank Account</span>
                  <div className={`font-mono text-sm font-semibold ${textPrimary}`}>
                    {partner.bank_details?.account_number || "0000000000"} — {partner.bank_details?.bank_name || "GTBank"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "network" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className={`text-xl font-black m-0 ${textPrimary}`}>Your Network</h2>
              <div className={`p-6 rounded-2xl border ${bgCard}`}>
                <p className={`text-sm ${textSecondary} mb-4`}>Recent signups using your code:</p>
                <div className="space-y-3">
                  {!partner.referrals || partner.referrals.length === 0 ? (
                    <div className={`text-center py-8 text-sm font-bold ${textSecondary}`}>
                      No signups yet. Share your link to get started!
                    </div>
                  ) : (
                    partner.referrals.map((ref: any, i: number) => (
                      <div key={i} className={`flex justify-between items-center p-4 rounded-xl border ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#2EC4B6]/20 flex items-center justify-center text-[#2EC4B6] font-bold text-xs">
                            {ref.name ? ref.name.charAt(0).toUpperCase() : "P"}
                          </div>
                          <div>
                            <div className={`text-sm font-bold ${textPrimary}`}>{ref.name || "Anonymous Parent"}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{ref.date || "Recently"}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-500">+₦{ref.commission_earned || 0}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-black">{ref.status || "Cleared"}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className={`text-xl font-black m-0 ${textPrimary}`}>Account Settings</h2>
              <div className={`p-6 rounded-2xl border ${bgCard} space-y-6`}>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${textSecondary}`}>Full Name / Organization</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full max-w-md px-4 py-3 rounded-xl border outline-none focus:border-[#2EC4B6] transition-colors ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${textSecondary}`}>Email Address</label>
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className={`w-full max-w-md px-4 py-3 rounded-xl border outline-none focus:border-[#2EC4B6] transition-colors ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                
                <hr className={`border-t ${isDark ? "border-slate-800" : "border-slate-200"}`} />
                
                <h3 className={`text-sm font-bold ${textPrimary}`}>Bank Details</h3>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${textSecondary}`}>Bank Name</label>
                  <input 
                    type="text" 
                    value={editBank}
                    onChange={(e) => setEditBank(e.target.value)}
                    placeholder="e.g. GTBank"
                    className={`w-full max-w-md px-4 py-3 rounded-xl border outline-none focus:border-[#2EC4B6] transition-colors ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${textSecondary}`}>Account Number</label>
                  <input 
                    type="text" 
                    value={editAccount}
                    onChange={(e) => setEditAccount(e.target.value)}
                    placeholder="0000000000"
                    className={`w-full max-w-md px-4 py-3 rounded-xl border outline-none focus:border-[#2EC4B6] transition-colors ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <button 
                  onClick={handleSaveSettings}
                  className="bg-[#2EC4B6] hover:bg-teal-600 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-teal-500/20"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "assets" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className={`text-xl font-black m-0 ${textPrimary}`}>Marketing Kit</h2>
                  <p className={`text-sm mt-1 ${textSecondary}`}>Everything you need to promote CLATS and earn commissions.</p>
                </div>
              </div>

              {/* WhatsApp Templates */}
              <div className={`p-6 rounded-2xl border ${bgCard} space-y-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle size={18} className="text-emerald-500" />
                  <h3 className={`text-sm font-bold ${textPrimary}`}>WhatsApp Broadcast Templates</h3>
                </div>
                <div className={`p-4 rounded-xl border relative ${isDark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <p className={`text-sm whitespace-pre-wrap ${textSecondary}`}>
                    Hey parents! 👋{"\n"}
                    I just discovered CLATS Future Tech Academy, an amazing AI-powered coding and robotics platform for kids.{"\n\n"}
                    If you want to prepare your child for the future, sign up using my special link below:{"\n"}
                    <span className="text-[#2EC4B6] font-bold">{referralLink}</span>
                  </p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`Hey parents! 👋\nI just discovered CLATS Future Tech Academy, an amazing AI-powered coding and robotics platform for kids.\n\nIf you want to prepare your child for the future, sign up using my special link below:\n${referralLink}`);
                      alert("Template copied!");
                    }}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-[#2EC4B6]/10 text-[#2EC4B6] hover:bg-[#2EC4B6] hover:text-white transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* Social Media Banners */}
              <div className={`p-6 rounded-2xl border ${bgCard}`}>
                <div className="flex items-center gap-2 mb-6">
                  <Image size={18} className="text-pink-500" />
                  <h3 className={`text-sm font-bold ${textPrimary}`}>Social Media Banners & Flyers</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Banner 1 */}
                  <div className={`rounded-xl border overflow-hidden ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                    <div className="aspect-video bg-gradient-to-br from-[#2EC4B6] to-teal-700 flex flex-col items-center justify-center p-6 text-center text-white relative">
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                      <h4 className="text-xl font-black mb-2 relative z-10">Future-Proof Your Child</h4>
                      <p className="text-xs font-semibold relative z-10 opacity-90">Join CLATS Academy Today!</p>
                    </div>
                    <div className={`p-4 flex justify-between items-center ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
                      <span className={`text-xs font-bold ${textPrimary}`}>Instagram Post (1:1)</span>
                      <button className="flex items-center gap-2 text-xs font-bold bg-[#B8A0FF] hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                        <Download size={14} /> Download
                      </button>
                    </div>
                  </div>

                  {/* Flyer with QR */}
                  <div className={`rounded-xl border overflow-hidden ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                    <div className="aspect-video bg-gradient-to-br from-slate-800 to-black flex items-center justify-between p-6 text-white relative">
                      <div>
                        <h4 className="text-lg font-black mb-1">Learn to Code!</h4>
                        <p className="text-[10px] text-slate-400">Scan to register</p>
                      </div>
                      <div className="h-20 w-20 bg-white rounded-lg p-1 flex items-center justify-center">
                        {/* Placeholder for QR Code */}
                        <div className="w-full h-full border-4 border-dashed border-slate-300 flex items-center justify-center">
                          <span className="text-[8px] font-black text-slate-400">QR CODE</span>
                        </div>
                      </div>
                    </div>
                    <div className={`p-4 flex justify-between items-center ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
                      <span className={`text-xs font-bold ${textPrimary}`}>Printable Flyer (A4)</span>
                      <button className="flex items-center gap-2 text-xs font-bold bg-[#B8A0FF] hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                        <Download size={14} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
};
