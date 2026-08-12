'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F, S } from '@/utils/config';
import { SettingsScreen } from '@/components/Settings';

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

export default function SettingsPage() {
  const router = useRouter();
  const {
    lang,
    theme,
    parent,
    setParent,
    logout,
    setTheme,
    setLang,
    dbConnected,
    isSyncing,
  } = useApp();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!parent) {
      const sess = S.getSess();
      if (!sess?.email) {
        router.push('/auth/login');
      }
      return;
    }
  }, [parent, router]);

  if (!parent) {
    return <LoadingScreen />;
  }

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLanguageChange = (l: Language) => {
    setLang(l);
  };

  const handleParentRefresh = (p: Parent) => {
    setParent(p);
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
      <SettingsScreen
        parent={parent}
        lang={lang}
        theme={theme}
        onBack={handleBack}
        onParentRefresh={handleParentRefresh}
        onLanguageChange={handleLanguageChange}
        onToggleTheme={handleToggleTheme}
      />
    </div>
  );
}
