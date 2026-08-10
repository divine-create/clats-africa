"use client";

import React, { useState, useEffect } from "react";
import { Check, X, ChevronRight, Zap, GraduationCap, Users, Shield, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { CLATSLogo } from "@/components/CLATSLogo"; // Adjust if logo is elsewhere

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [monthlyPrice, setMonthlyPrice] = useState({ price: 5000, currency: "NGN" });
  const [yearlyPrice, setYearlyPrice] = useState({ price: 50000, currency: "NGN" });
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch("/api/supabase/pricing")
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.plans) {
          data.plans.forEach((plan: any) => {
            if (plan.plan_name === "Monthly Premium") {
              setMonthlyPrice({ price: plan.price, currency: plan.currency });
            } else if (plan.plan_name === "Yearly Premium") {
              setYearlyPrice({ price: plan.price, currency: plan.currency });
            }
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(amount);
  };

  const currentPremiumPrice = billingCycle === "monthly" ? monthlyPrice : yearlyPrice;

  const faqs = [
    {
      q: "Can I use one account for multiple kids?",
      a: "Our Premium plan is priced per child to ensure a deeply personalized learning experience. You can manage multiple subscriptions for all your children from a single Parent Dashboard!"
    },
    {
      q: "Do I need a laptop, or does it work on mobile?",
      a: "CLATS is fully responsive! While a laptop or tablet offers the best screen real estate for our digital skills and coding modules, children can easily read lessons, take quizzes, and chat with the AI tutor directly from any smartphone."
    },
    {
      q: "How does the B2B School plan work?",
      a: "For schools, we provide a bulk license model. The school administrator gets a master dashboard to monitor all students across different classes, while students get individual access codes to log in."
    },
    {
      q: "Is it easy to cancel my subscription?",
      a: "Absolutely. You can manage or cancel your subscription at any time directly from the Parent Dashboard settings. No hidden fees or tricky cancellation processes."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#2EC4B6]/30">
      
      {/* NAVBAR */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2EC4B6] to-teal-500 flex items-center justify-center text-white font-bold text-xl">C</div>
            <span className="font-black text-xl tracking-tight">CLATS</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/auth/login" className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Log In</Link>
            <Link href="/auth/register" className="px-5 py-2.5 rounded-full text-sm font-bold bg-[#2EC4B6] text-white hover:bg-[#25A79B] transition-colors shadow-lg shadow-teal-500/20">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-24 pb-16 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-[#2EC4B6]/10 text-[#2EC4B6] font-bold text-xs uppercase tracking-widest">
          Transparent Pricing
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-6 text-slate-900">
          Invest in Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2EC4B6] to-blue-500">Child's Future</span> Today.
        </h1>
        <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          Give them the tools to master essential Digital Skills, Coding, Robotics, and AI. Start for free to see the magic, and upgrade when they're hooked.
        </p>

        {/* BILLING TOGGLE */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-bold ${billingCycle === "monthly" ? "text-slate-900" : "text-slate-400"}`}>Monthly</span>
          <div 
            onClick={() => setBillingCycle(b => b === "monthly" ? "yearly" : "monthly")}
            className="w-16 h-8 rounded-full bg-slate-200 p-1 cursor-pointer relative transition-colors hover:bg-slate-300"
          >
            <div className={`w-6 h-6 rounded-full bg-[#2EC4B6] shadow-sm transform transition-transform duration-300 ${billingCycle === "yearly" ? "translate-x-8" : ""}`} />
          </div>
          <span className={`text-sm font-bold flex items-center gap-2 ${billingCycle === "yearly" ? "text-slate-900" : "text-slate-400"}`}>
            Yearly
            <span className="bg-amber-100 text-amber-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Save 20%</span>
          </span>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="max-w-7xl mx-auto px-6 pb-24 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* FREE TIER */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-2">Basic Explorer</h3>
            <p className="text-sm text-slate-500 mb-6">Perfect for skeptical parents wanting to test the waters.</p>
            <div className="mb-8">
              <span className="text-4xl font-black">Free</span>
              <span className="text-slate-400 font-medium"> / forever</span>
            </div>
            <Link href="/auth/register" className="w-full block text-center py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:border-slate-300 hover:bg-slate-50 transition-all mb-8">
              Create Free Account
            </Link>
            <div className="space-y-4 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">What's included</div>
              {["1 Child Profile", "First 2 Modules Free", "Basic AI Chat", "Community Access"].map((feat, i) => (
                <div key={i} className="flex gap-3 text-sm font-semibold text-slate-600">
                  <Check size={18} className="text-slate-300 shrink-0" /> {feat}
                </div>
              ))}
            </div>
          </div>

          {/* PREMIUM TIER */}
          <div className="bg-slate-900 rounded-3xl p-8 border-2 border-[#2EC4B6] shadow-2xl shadow-teal-500/20 flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
              <span className="bg-[#2EC4B6] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                Most Popular
              </span>
            </div>
            <h3 className="text-xl font-black text-white mb-2">Premium Scholar</h3>
            <p className="text-sm text-slate-400 mb-6">For invested parents ready to accelerate learning.</p>
            <div className="mb-8 h-12">
              {loading ? (
                <div className="w-6 h-6 border-2 border-[#2EC4B6] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-4xl font-black text-white">{formatPrice(currentPremiumPrice.price, currentPremiumPrice.currency)}</span>
                  <span className="text-slate-400 font-medium"> / child / {billingCycle === "monthly" ? "mo" : "yr"}</span>
                </>
              )}
            </div>
            <Link href="/auth/register" className="w-full block text-center py-3.5 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-teal-400 text-white font-black hover:to-teal-500 shadow-lg shadow-teal-500/25 transition-all mb-8">
              Start 7-Day Free Trial
            </Link>
            <div className="space-y-4 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-500 mb-4">Everything in Basic, plus</div>
              {[
                "1 Dedicated Child Profile", 
                "Unlimited Curriculum Access", 
                "Advanced AI Tutor (Kobe)", 
                "Downloadable Progress Reports",
                "Premium Avatar Customization"
              ].map((feat, i) => (
                <div key={i} className="flex gap-3 text-sm font-semibold text-slate-200">
                  <Check size={18} className="text-[#2EC4B6] shrink-0" /> {feat}
                </div>
              ))}
            </div>
          </div>

          {/* B2B TIER */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-2">Schools & NGOs</h3>
            <p className="text-sm text-slate-500 mb-6">Bulk licenses and management for large classrooms.</p>
            <div className="mb-8">
              <span className="text-4xl font-black">Custom</span>
            </div>
            <Link href="/coordinator/register" className="w-full block text-center py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all mb-8">
              Contact Sales
            </Link>
            <div className="space-y-4 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Built for scale</div>
              {["50+ Student Licenses", "Master Analytics Dashboard", "Bulk Onboarding Tools", "Teacher Training Resources", "Dedicated Support Manager"].map((feat, i) => (
                <div key={i} className="flex gap-3 text-sm font-semibold text-slate-600">
                  <Check size={18} className="text-blue-500 shrink-0" /> {feat}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* FEATURE COMPARISON */}
      <section className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4">Compare Features</h2>
            <p className="text-slate-500">See exactly what you get with CLATS Premium.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="py-4 px-4 font-bold text-slate-400 uppercase text-xs tracking-wider w-1/2">Feature</th>
                  <th className="py-4 px-4 font-black text-slate-800 w-1/4 text-center">Basic</th>
                  <th className="py-4 px-4 font-black text-[#2EC4B6] w-1/4 text-center">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {[
                  { name: "Child Profiles", basic: "1", premium: "1 (Per License)" },
                  { name: "Curriculum Modules", basic: "First 2 Only", premium: "Unlimited" },
                  { name: "AI Tutor (Kobe)", basic: "Basic", premium: "Advanced" },
                  { name: "Parent Community Hub", basic: true, premium: true },
                  { name: "Printable PDF Reports", basic: false, premium: true },
                  { name: "Premium Avatar Items", basic: false, premium: true },
                  { name: "Priority Support", basic: false, premium: true },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-5 px-4 text-slate-700">{row.name}</td>
                    <td className="py-5 px-4 text-center text-slate-500">
                      {typeof row.basic === 'boolean' ? (row.basic ? <Check size={18} className="mx-auto text-slate-400" /> : <Minus size={18} className="mx-auto text-slate-300" />) : row.basic}
                    </td>
                    <td className="py-5 px-4 text-center font-bold text-[#2EC4B6]">
                      {typeof row.premium === 'boolean' ? (row.premium ? <Check size={18} className="mx-auto text-[#2EC4B6]" /> : <Minus size={18} className="mx-auto text-slate-300" />) : row.premium}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-slate-50 py-24 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500">Everything you need to know about the product and billing.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${openFaq === idx ? "border-[#2EC4B6] shadow-md" : "border-slate-200 hover:border-slate-300"}`}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between font-bold text-left text-slate-800"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <Minus size={18} className="text-[#2EC4B6] shrink-0" /> : <Plus size={18} className="text-slate-400 shrink-0" />}
                </button>
                <div 
                  className={`px-6 text-slate-500 text-sm leading-relaxed transition-all duration-300 ease-in-out ${openFaq === idx ? "pb-6 max-h-40 opacity-100" : "max-h-0 opacity-0 pb-0"}`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 text-center text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white opacity-80">
            <div className="w-6 h-6 rounded bg-[#2EC4B6] flex items-center justify-center font-bold text-[10px]">C</div>
            <span className="font-black tracking-widest">CLATS</span>
          </div>
          <p>© {new Date().getFullYear()} CLATS Africa. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
