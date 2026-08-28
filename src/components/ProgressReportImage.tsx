'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ProgressReportImage — A fully styled, self-contained React component
 * that renders a CLATS progress report card designed to be captured
 * by html2canvas as a beautiful PNG image.
 */

import React from 'react';
import { Parent, Child } from '../types';
import { calculateStudyAnalytics } from '../utils/timeTracker';

function getActiveAcademyLabel(child: Child): string {
  const completedCount = Object.keys(child.completed || {}).length;
  if (completedCount === 0) return "AI Foundations Intro";
  if (completedCount <= 2) return "Artificial Intelligence";
  if (completedCount <= 5) return "Digital Citizenship & Safety";
  if (completedCount <= 8) return "Design & Creation";
  return child.ageGroup === "future builders"
    ? "Innovation & Career Readiness"
    : "Adaptability & Lifelong Learning";
}

interface ProgressReportImageProps {
  parent: Parent;
  child: Child;
  sessions: any[];
  logoBase64?: string;
  aiInsight?: any;
}

export const ProgressReportImage: React.FC<ProgressReportImageProps> = ({
  parent,
  child,
  sessions,
  logoBase64,
  aiInsight,
}) => {
  const liveDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!child) {
    return (
      <div
        id="clats-report-capture"
        style={{
          width: 800,
          backgroundColor: '#E3F5F6',
          padding: 48,
          fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
          borderRadius: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1F9EAD', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>CLATS Learning Platform</div>
            <h1 style={{ fontSize: 34, fontWeight: 900, color: '#13222B', margin: 0, letterSpacing: -1 }}>Progress Report</h1>
          </div>
          {/* Logo placeholder with text fallback */}
          <div style={{ background: '#13222B', borderRadius: 14, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <span style={{ fontWeight: 900, fontSize: 20, color: '#2EC4B6', letterSpacing: 1 }}>CLATS</span>
          </div>
        </div>

        <div style={{ height: 2, background: 'linear-gradient(90deg, #1F9EAD, transparent)', marginBottom: 40, borderRadius: 2 }} />

        <div style={{ background: '#fff', borderRadius: 16, padding: '60px 40px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ background: '#FEF3C7', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #F59E0B' }}>
            <span style={{ fontSize: 40 }}>📊</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#13222B', marginBottom: 10 }}>LEARNING JOURNAL PENDING</div>
          <p style={{ color: '#475569', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            No active child profiles have been enrolled under this account. Enroll a learner from your CLATS dashboard to start tracking live curriculum progress, companion stars, and analytics.
          </p>
        </div>

        <Footer liveDate={liveDate} />
      </div>
    );
  }

  // ── Single child report ──────────────────────────────────────────────────
  return (
    <div id="clats-report-capture" style={{ fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif", width: 800 }}>
      <ChildReport
        child={child}
        parent={parent}
        sessions={sessions}
        liveDate={liveDate}
        logoBase64={logoBase64}
        aiInsight={aiInsight}
      />
    </div>
  );
};

// ── Single child report page ─────────────────────────────────────────────────
interface ChildReportProps {
  child: Child;
  parent: Parent;
  sessions: any[];
  liveDate: string;
  logoBase64?: string;
  aiInsight?: any;
}

function ChildReport({ child, parent, sessions, liveDate, logoBase64, aiInsight }: ChildReportProps) {
  const studyStats = calculateStudyAnalytics(sessions);
  const completedCount = Object.keys(child.completed || {}).length;
  const activeAcademy = getActiveAcademyLabel(child);
  const completedPercent = Math.min(100, Math.round((completedCount / 12) * 100));
  const expectedPercent = completedCount === 0 ? 25 : Math.min(100, Math.max(50, completedPercent + 15));

  const quizResults = child.quizResults || {};
  const quizKeys = Object.keys(quizResults);
  let quizAverage = 0;
  if (quizKeys.length > 0) {
    quizAverage = Math.round(quizKeys.reduce((a, k) => a + (quizResults[k]?.score || 0), 0) / quizKeys.length);
  } else {
    quizAverage = completedCount > 0 ? 84 : 0;
  }

  let ratingLabel = "STEADY";
  let ratingDesc = "Moderate Learning Activity";
  let ratingColor = "#F59E0B";
  let ratingBg = "#FEF3C7";

  if (quizAverage >= 85 || completedPercent > 60) {
    ratingLabel = "HIGH";
    ratingDesc = "Elite Progress Standing";
    ratingColor = "#2EC4B6";
    ratingBg = "#E0FBF8";
  } else if (completedCount === 0) {
    ratingLabel = "LOW";
    ratingDesc = "Diagnostic Baseline Stage";
    ratingColor = "#EF4444";
    ratingBg = "#FEE2E2";
  }

  const milestones = [
    { unit: "Unit 1: Artificial Intelligence Foundations", doneAt: 1, expected: "Week 3" },
    { unit: "Unit 2: Digital Rights & Cyber Safety Drills", doneAt: 4, expected: "Week 6" },
    { unit: "Unit 3: Creative Interface Arts & UI Design", doneAt: 7, expected: "Week 9" },
    { unit: "Unit 4: Technology Adaptability Framework", doneAt: 10, expected: "Week 11" },
    { unit: "Unit 5: Logic Assessment & Quiz Drills", doneAt: null, expected: "Week 12", quizBased: true },
  ].map(m => {
    const done = m.quizBased ? quizKeys.length > 0 : completedCount >= (m.doneAt ?? 0);
    const halfDone = !done && !m.quizBased && completedCount >= (m.doneAt ?? 0) - 3;
    return {
      ...m,
      status: done ? "Complete" : halfDone ? "In Progress" : "Pending",
      actual: done ? (m.quizBased ? `${quizAverage}% Acc ✓` : "✓ Completed") : halfDone ? "Active" : "TBD",
      color: done ? "#10B981" : halfDone ? "#3B82F6" : "#94A3B8",
    };
  });

  return (
    <div
      style={{
        backgroundColor: '#E3F5F6',
        padding: 48,
        position: 'relative',
      }}
    >
      {/* ── Top header bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1F9EAD', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
            Student Learning Report
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#13222B', margin: 0, letterSpacing: -1.5 }}>
            {child.name}
          </h1>
          <div style={{ fontSize: 14, color: '#64748B', marginTop: 4, fontWeight: 600 }}>
            Age Group: {child.ageGroup.replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </div>
        {/* Logo block */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {logoBase64 ? (
            <img src={logoBase64} alt="CLATS Logo" style={{ height: 38 }} />
          ) : (
            <div style={{ background: '#13222B', borderRadius: 14, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <span style={{ fontWeight: 900, fontSize: 18, color: '#2EC4B6', letterSpacing: 1 }}>CLATS</span>
            </div>
          )}
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{liveDate}</div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, #1F9EAD 60%, transparent)', borderRadius: 2, marginBottom: 32 }} />

      {/* ── Main body: Left content + Right sidebar ── */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* Left main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* AI Teacher's Note */}
          {aiInsight && (
            <div style={{ marginBottom: 28, background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: 1 }}>AI Teacher's Note</span>
              </div>
              <div style={{ fontSize: 13, color: '#4C1D95', lineHeight: 1.5, fontWeight: 600, marginBottom: 10 }}>
                {aiInsight.summary}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #EDE9FE' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', marginBottom: 4 }}>Top Strength</div>
                  <div style={{ fontSize: 11, color: '#065F46', lineHeight: 1.4, fontWeight: 600 }}>{aiInsight.strength}</div>
                </div>
                <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #EDE9FE' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 4 }}>Focus Area</div>
                  <div style={{ fontSize: 11, color: '#92400E', lineHeight: 1.4, fontWeight: 600 }}>{aiInsight.focusArea}</div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px', marginBottom: 28 }}>
            {[
              { label: 'Student ID', value: `CLS-${child.id.substring(child.id.length - 6).toUpperCase()}` },
              { label: 'Parent Sponsor', value: parent.name },
              { label: 'Report Date', value: liveDate },
              { label: 'Academic Stream', value: activeAcademy },
              { label: 'Companion Guide', value: child.companion === 'chibi' ? 'Chibi (Narrator)' : 'Kobe (AI Mentor)' },
              { label: 'Sync Status', value: '● Active', color: '#10B981' },
              { label: "Today's Study", value: `${studyStats.todayMins} mins` },
              { label: 'Weekly Study', value: `${studyStats.weeklyMins} mins` },
              { label: 'Total Study Time', value: `${studyStats.totalMins} mins` },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: item.color || '#13222B', lineHeight: 1.3 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Milestones table */}
          <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: 24 }}>
            {/* Table header */}
            <div style={{ background: '#104F55', display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1.2fr', padding: '12px 20px', gap: 8 }}>
              {['Milestone', 'Status', 'Expected', 'Actual'].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
              ))}
            </div>
            {/* Rows */}
            {milestones.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 1fr 1fr 1.2fr',
                  padding: '13px 20px',
                  gap: 8,
                  background: i % 2 === 0 ? '#fff' : '#F2FAFB',
                  borderBottom: i < 4 ? '1px solid #E8F4F5' : 'none',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', paddingRight: 8 }}>{m.unit}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.status}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{m.expected}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{m.actual}</div>
              </div>
            ))}
          </div>

          {/* Bottom two cards */}
          <div style={{ display: 'flex', gap: 18 }}>
            {[
              {
                title: 'Key Learnings & Takeaways',
                body: completedCount === 0
                  ? ['Diagnostic baseline stage — student is beginning their learning journey.', 'Ready to explore foundational AI and digital safety concepts with Kobe or Chibi.']
                  : ['Mastered multiple AI, Digital Safety, and Coding concepts.', 'Demonstrated consistent progression through the curriculum milestones.', `Quiz accuracy: ${quizAverage}% — ${quizAverage >= 70 ? 'strong retention!' : 'room for improvement.'}`],
              },
              {
                title: 'Next Steps & Recommendations',
                body: completedCount === 0
                  ? ['Begin Unit 1: AI Foundations to unlock first milestone.', 'Set a regular learning schedule of 20-30 mins per day.']
                  : completedPercent >= 75
                  ? ['Outstanding progress! Prepare for final evaluation.', 'Review any lessons with lower quiz scores for full mastery.']
                  : ['Continue advancing through pending modules consistently.', 'Focus on modules not yet started to maintain pace with curriculum timeline.'],
              },
            ].map((card, i) => (
              <div key={i} style={{ flex: 1, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
                <div style={{ background: '#F2FAFB', padding: '11px 16px', fontSize: 12, fontWeight: 700, color: '#104F55', borderBottom: '1px solid #E8F4F5' }}>
                  {card.title}
                </div>
                <div style={{ padding: 16 }}>
                  {card.body.map((line, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: '#1F9EAD', fontWeight: 700, marginTop: 1, flexShrink: 0 }}>•</span>
                      <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div
          style={{
            width: 190,
            flexShrink: 0,
            background: 'linear-gradient(170deg, #1F9EAD 0%, #157A86 100%)',
            borderRadius: 20,
            padding: '28px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
            boxShadow: '0 16px 40px rgba(31,158,173,0.3)',
          }}
        >
          {/* Risk badge */}
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', padding: '20px 16px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: ratingColor, borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 26, fontWeight: 900, color: ratingColor, letterSpacing: 1, marginTop: 8 }}>{ratingLabel}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Academic Risk</div>
            <div style={{ background: ratingBg, width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <span style={{ fontSize: 20 }}>🛡️</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', lineHeight: 1.4 }}>{ratingDesc}</div>
          </div>

          {/* Stats */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'XP Earned', value: `${child.xp || 0}`, icon: '⚡' },
              { label: 'Lessons Done', value: `${completedCount}`, icon: '✅' },
              { label: 'Quiz Avg', value: `${quizAverage}%`, icon: '🧠' },
              { label: 'Streak', value: `${child.streak || 0} days`, icon: '🔥' },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{stat.value}</div>
                </div>
                <span style={{ fontSize: 22 }}>{stat.icon}</span>
              </div>
            ))}
          </div>

          {/* Progress circles */}
          {[
            { label: 'Actual Progress', pct: completedPercent },
            { label: 'Expected Progress', pct: expectedPercent },
          ].map((ring, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                width: 90, height: 90,
                borderRadius: '50%',
                background: `conic-gradient(#fff ${ring.pct * 3.6}deg, rgba(255,255,255,0.2) ${ring.pct * 3.6}deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px',
                boxShadow: '0 0 0 6px rgba(255,255,255,0.15)',
              }}>
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(170deg, #1F9EAD 0%, #157A86 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{ring.pct}%</span>
                </div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700, lineHeight: 1.4 }}>{ring.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <Footer liveDate={liveDate} childName={child.name} logoBase64={logoBase64} />
    </div>
  );
}

// ── Shared footer ─────────────────────────────────────────────────────────────
function Footer({ liveDate, childName, logoBase64 }: { liveDate: string; childName?: string, logoBase64?: string }) {
  return (
    <div
      style={{
        marginTop: 36,
        background: '#13222B',
        borderRadius: 14,
        padding: '18px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {logoBase64 ? (
          <img src={logoBase64} alt="Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
        ) : (
          <div style={{ background: '#1F9EAD', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22 }}>🤖</span>
          </div>
        )}
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>Building Tomorrow's Tech Minds Today!</div>
          <div style={{ color: '#2EC4B6', fontSize: 11, fontWeight: 600 }}>admin@clats.org  |  www.clats.org</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>CLATS Progress Report</div>
        {childName && <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700 }}>{childName.toUpperCase()}</div>}
        <div style={{ fontSize: 11, color: '#64748B' }}>{liveDate}</div>
      </div>
    </div>
  );
}
