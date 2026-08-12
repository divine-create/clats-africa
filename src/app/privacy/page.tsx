"use client";

import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#2EC4B6]/30">
      
      {/* NAVBAR */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2EC4B6] to-teal-500 flex items-center justify-center text-white font-bold text-xl">C</div>
            <span className="font-black text-xl tracking-tight">CLATS</span>
          </Link>
          <Link href="/pricing" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
            Pricing
          </Link>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-100 border border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <span className="p-3 bg-[#2EC4B6]/10 text-[#2EC4B6] rounded-2xl">
              <Shield size={32} />
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none text-slate-900">Privacy Policy</h1>
              <p className="text-xs text-slate-400 mt-2 font-mono">Last Updated: August 12, 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-6 leading-relaxed">
            <p>
              At CLATS (Coding & Learning for Tech Students), we prioritize the privacy and safety of children, parents, and sponsors. This Privacy Policy details how we collect, protect, process, and store personal and educational analytics data within our platform.
            </p>

            <h2 className="text-lg font-black text-slate-900 mt-8 border-b pb-2">1. Children's Data & COPPA Compliance</h2>
            <p>
              We design our applications to comply strictly with the Children's Online Privacy Protection Act (COPPA). We do not collect personally identifiable information (PII) from children. Subscriptions, email addresses, and profiles are created entirely under parental supervision. Children interact with simulated companions (Kobe and Chibi) locally, and no personal chat details are shared outside the educational context.
            </p>

            <h2 className="text-lg font-black text-slate-900 mt-8 border-b pb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Parent/Sponsor Accounts:</strong> Emails, passwords (securely hashed), and subscription details.</li>
              <li><strong>Educational Analytics:</strong> XP progress, lesson completions, quiz results, and study durations to generate progress reports.</li>
              <li><strong>Technical Metadata:</strong> System logs, timezone settings, and device parameters to ensure stable connections.</li>
            </ul>

            <h2 className="text-lg font-black text-slate-900 mt-8 border-b pb-2">3. How We Use and Share Data</h2>
            <p>
              Data collected is strictly used to measure educational impact, render dashboard analytics, and support streak reminders. 
              <strong> We never sell or share parent or child data to third-party advertisers.</strong> B2B school dashboard telemetry is strictly restricted to authenticated coordinators of that specific school district.
            </p>

            <h2 className="text-lg font-black text-slate-900 mt-8 border-b pb-2">4. Data Deletion & Rights</h2>
            <p>
              Parents have complete control over their family accounts. You can view, edit, or request complete deletion of your parent and child profiles at any time directly through the Settings panel in the Parent Dashboard, or by contacting our support team.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
