'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F } from '@/utils/config';
import { ChildLoginScreen } from '@/components/ChildAccess';

function LoadingScreen() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#22d3ee',
        fontSize: '1.1rem',
        fontWeight: 600,
      }}
    >
      Loading CLATS…
    </div>
  );
}

export default function ChildLoginPage() {
  const router = useRouter();
  const {
    lang,
    theme,
    setActiveChild,
  } = useApp();
  const isDark = theme === 'dark';

  const handleNoParent = () => {
    router.push('/auth/login');
  };

  const handlePinSuccess = (child: any) => {
    setActiveChild(child);
    router.push('/child/app');
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0F172A' : '#F8FAFC',
        color: isDark ? '#F8FAFC' : '#1E293B',
        fontFamily: F.body,
      }}
    >
      <ChildLoginScreen
        onLoginSuccess={handlePinSuccess}
        onNavigateParentRegister={handleNoParent}
        onBack={handleBack}
        lang={lang}
        theme={theme}
      />
    </div>
  );
}
