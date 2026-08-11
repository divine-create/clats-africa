'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F, S } from '@/utils/config';
import { SplashScreen } from '@/components/SplashScreen';
import { CLATSLogo } from '@/components/CLATSLogo';

export default function HomePage() {
  const router = useRouter();
  const { lang, theme } = useApp();
  const isDark = theme === 'dark';

  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);

  // Only run routing logic AFTER the splash is dismissed
  const handleSplashDone = () => {
    setShowSplash(false);
    const sess = S.getSess();
    if (sess) {
      router.push('/dashboard');
      return;
    }
    const onboarded = localStorage.getItem('clats_onboarded');
    if (onboarded !== 'true') {
      router.push('/onboarding');
      return;
    }
    setReady(true);
  };

  if (showSplash) {
    return <SplashScreen onDismiss={handleSplashDone} />;
  }

  if (!ready) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#0F172A' : '#F8FAFC', color: '#22d3ee', fontFamily: F.body }}>
        Loading CLATS…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0F172A' : '#F8FAFC',
        color: isDark ? '#F8FAFC' : '#1E293B',
        fontFamily: F.body,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          left: '-120px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '-60px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          padding: '48px 32px',
          maxWidth: '480px',
          width: '100%',
        }}
      >
        {/* Logo */}
        <CLATSLogo height={96} />

        {/* App name */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: F.display ?? F.body,
              fontSize: '2.5rem',
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            CLATS
          </h1>
          <p
            style={{
              marginTop: '8px',
              fontSize: '1.05rem',
              color: isDark ? 'rgba(248,250,252,0.7)' : 'rgba(30,41,59,0.65)',
              letterSpacing: '0.02em',
              fontWeight: 500,
            }}
          >
            Building Tomorrow's Tech Minds Today!
          </p>
        </div>
        {/* Divider */}
        <div
          style={{
            width: '60px',
            height: '3px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #22d3ee, #6366f1)',
          }}
        />

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)',
              color: '#fff',
              fontSize: '1.05rem',
              fontWeight: 700,
              fontFamily: F.body,
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(34,211,238,0.30)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(34,211,238,0.40)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(34,211,238,0.30)';
            }}
          >
            🔐 Parent Login
          </button>

          <button
            onClick={() => router.push('/child/login')}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '14px',
              border: `2px solid ${isDark ? 'rgba(34,211,238,0.35)' : 'rgba(34,211,238,0.5)'}`,
              background: isDark ? 'rgba(34,211,238,0.07)' : 'rgba(34,211,238,0.06)',
              color: '#22d3ee',
              fontSize: '1.05rem',
              fontWeight: 700,
              fontFamily: F.body,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(34,211,238,0.14)' : 'rgba(34,211,238,0.12)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(34,211,238,0.15)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(34,211,238,0.07)' : 'rgba(34,211,238,0.06)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            🧒 Child Access
          </button>
        </div>

        {/* Footer */}
        <p
          style={{
            fontSize: '0.78rem',
            color: isDark ? 'rgba(248,250,252,0.3)' : 'rgba(30,41,59,0.35)',
            marginTop: '8px',
          }}
        >
          v1.0 · CLATS Learning Platform
        </p>
      </div>
    </div>
  );
}
