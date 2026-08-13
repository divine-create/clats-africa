"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Shield, Zap } from "lucide-react";

interface PaywallModalProps {
  parentEmail: string;
  childId: string;
  childName: string;
  onClose: () => void;
  onSuccess: () => void;
  isDark?: boolean;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ parentEmail, childId, childName, onClose, onSuccess, isDark = false }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [bachsKey, setBachsKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {

    // Fetch config
    Promise.all([
      fetch("/api/supabase/pricing").then(res => res.json()),
      fetch("/api/supabase/payment_gateways").then(res => res.json())
    ]).then(([priceData, gwData]) => {
      if (priceData.ok) setPlans(priceData.plans);
      if (gwData.ok) {
        const ps = gwData.gateways.find((g: any) => g.gateway_name === "bachs");
        if (ps && ps.is_active) {
          setBachsKey(ps.public_key);
        }
      }
      setLoading(false);
    });
  }, []);

  const handleCheckout = async (plan: any) => {
    if (!bachsKey) {
      alert("Payment gateway is currently not configured or inactive.");
      return;
    }

    setProcessing(true);
    
    try {
      const res = await fetch("/api/bachs/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parentEmail,
          amount: plan.price,
          currency: plan.currency,
          planName: plan.name,
          childId
        })
      });
      
      const data = await res.json();
      if (data.ok && data.checkoutUrl) {
        // Redirect to Bachs.io secure checkout
        window.location.href = data.checkoutUrl;
      } else {
        alert("Failed to initiate checkout: " + (data.error || "Unknown error"));
        setProcessing(false);
      }
    } catch (e) {
      alert("Payment initiation error. Please try again.");
      setProcessing(false);
    }
  };

  const monthlyPlan = plans.find(p => p.interval === "monthly");
  const yearlyPlan = plans.find(p => p.interval === "yearly");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
      <div className={`relative w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row ${isDark ? "bg-[#0F172A]" : "bg-white"}`}>
        
        {/* Left Side: Benefits */}
        <div className={`p-8 md:w-5/12 flex flex-col justify-center ${isDark ? "bg-slate-900 text-white" : "bg-[#2EC4B6]/10 text-slate-900"}`}>
          <div className="mb-6">
            <Shield size={40} className="text-[#2EC4B6] mb-4" />
            <h2 className="text-2xl font-black leading-tight">Unlock {childName}'s Full Potential</h2>
            <p className={`text-sm mt-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Get unlimited access to the entire CLATS Curriculum, AI companions, and advanced analytics for {childName}.
            </p>
          </div>
          <ul className="space-y-4 text-sm font-semibold">
            <li className="flex gap-3 items-center"><Check size={18} className="text-[#2EC4B6]" /> 100+ Digital Skills Modules</li>
            <li className="flex gap-3 items-center"><Check size={18} className="text-[#2EC4B6]" /> Advanced AI Tutor Access</li>
            <li className="flex gap-3 items-center"><Check size={18} className="text-[#2EC4B6]" /> Downloadable Progress Reports</li>
            <li className="flex gap-3 items-center"><Check size={18} className="text-[#2EC4B6]" /> Premium Avatar Customization</li>
          </ul>
        </div>

        {/* Right Side: Pricing Cards */}
        <div className="p-8 md:w-7/12 relative">
          <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
            <X size={20} />
          </button>
          
          <div className="mb-6 text-center">
            <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Select a Plan</h3>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>Cancel anytime. Secure checkout via Bachs.io (Accepts NGN & USD).</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#2EC4B6] border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="space-y-4">
              {/* Monthly Plan */}
              {monthlyPlan && (
                <div 
                  onClick={() => handleCheckout(monthlyPlan)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] flex justify-between items-center ${isDark ? "border-slate-700 bg-slate-800/50 hover:border-[#2EC4B6]" : "border-slate-200 bg-white hover:border-[#2EC4B6]"}`}
                >
                  <div>
                    <h4 className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Monthly Premium</h4>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Billed every month</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#2EC4B6]">{monthlyPlan.currency} {monthlyPlan.price.toLocaleString()}</span>
                    <span className={`text-[10px] block ${isDark ? "text-slate-500" : "text-slate-400"}`}>/mo</span>
                  </div>
                </div>
              )}

              {/* Yearly Plan (Highlight) */}
              {yearlyPlan && (
                <div 
                  onClick={() => handleCheckout(yearlyPlan)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] flex justify-between items-center relative overflow-hidden ${isDark ? "border-[#2EC4B6] bg-slate-800" : "border-[#2EC4B6] bg-[#2EC4B6]/5"}`}
                >
                  <div className="absolute top-0 right-0 bg-[#2EC4B6] text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                    Best Value - Save 20%
                  </div>
                  <div>
                    <h4 className={`font-bold mt-2 ${isDark ? "text-white" : "text-slate-800"}`}>Yearly Premium</h4>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Billed once a year</p>
                  </div>
                  <div className="text-right mt-2">
                    <span className="text-xl font-black text-[#2EC4B6]">{yearlyPlan.currency} {yearlyPlan.price.toLocaleString()}</span>
                    <span className={`text-[10px] block ${isDark ? "text-slate-500" : "text-slate-400"}`}>/yr</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {processing && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-r-3xl z-10">
              <div className="w-10 h-10 border-4 border-[#2EC4B6] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-slate-700 dark:text-slate-200">Initializing Secure Checkout...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
