"use client";

import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

import { CLATSLogo } from "@/components/CLATSLogo";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#2EC4B6]/30">
      
      {/* NAVBAR */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CLATSLogo height={32} />
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
              <FileText size={32} />
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none text-slate-900">Terms of Service</h1>
              <p className="text-xs text-slate-400 mt-2 font-mono">Last Updated: August 12, 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-6 leading-relaxed">
            <p>
              Welcome to CLATS. These Terms of Service ("Terms") govern your use of the CLATS website, native applications, and educational services. By accessing or using our platform, you agree to comply fully with these Terms.
            </p>

            <h2 className="text-lg font-black text-slate-900 mt-8 border-b pb-2">1. Eligibility & Parent Consent</h2>
            <p>
              To use CLATS, parents, guardians, or authorized school sponsors must register the account. Children are permitted to use the platform solely under the authorization and setup of a registered adult parent or school coordinator.
            </p>

            <h2 className="text-lg font-black text-slate-900 mt-8 border-b pb-2">2. Usage Rules</h2>
            <p>
              Users are expected to utilize the educational materials (lessons, quizzes, interactive games) for personal learning purposes. Reverse engineering the AI companion mechanics, extracting proprietary database code, or scraping content is strictly prohibited.
            </p>

            <h2 className="text-lg font-black text-slate-900 mt-8 border-b pb-2">3. Subscriptions & B2B Sponsorships</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>B2C Subscriptions:</strong> Standard monthly or yearly premium accounts are billed in advance and auto-renew unless cancelled.</li>
              <li><strong>B2B License Codes:</strong> School seats allocated via access codes (e.g. CSR sponsorships) are granted free of direct cost to the student and are valid for the duration agreed upon by the sponsor.</li>
            </ul>

            <h2 className="text-lg font-black text-slate-900 mt-8 border-b pb-2">4. Disclaimers & Terminations</h2>
            <p>
              CLATS provides educational resources "as is." We reserve the right to suspend or terminate accounts that breach these Terms, participate in database manipulation, or violate our child protection standards.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
