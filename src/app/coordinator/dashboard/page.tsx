'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { F } from '@/utils/config';

const B2BCoordinatorDashboard = lazy(() =>
  import('@/components/B2BCoordinatorDashboard').then(m => ({ default: m.B2BCoordinatorDashboard })) as Promise<{ default: React.ComponentType<any> }>
);

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
        background: '#0F172A'
      }}
    >
      Loading Coordinator Telemetry…
    </div>
  );
}

export default function CoordinatorDashboardPage() {
  const router = useRouter();
  const {
    lang,
    setLang,
    theme,
    setTheme,
    parent,
    setParent,
    logout,
    dbConnected,
    isSyncing,
  } = useApp();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check if there is a session stored in localStorage to prevent premature redirect
    const sessStr = typeof window !== 'undefined' ? localStorage.getItem('clats_sess_v1') : null;
    let hasSession = false;
    let isB2BSession = false;

    if (sessStr) {
      try {
        const sess = JSON.parse(sessStr);
        if (sess?.email) {
          hasSession = true;
          isB2BSession = !!sess.isB2B;
        }
      } catch (e) {}
    }

    if (!parent && !hasSession) {
      router.push('/coordinator/login');
      return;
    }

    if (parent && !parent.isB2B) {
      router.push('/dashboard');
      return;
    }

    if (parent && parent.isB2B) {
      setMounted(true);
    }
  }, [parent, router]);

  const handleLogout = () => {
    logout('/coordinator/login');
  };

  if (!mounted || !parent) {
    return <LoadingScreen />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0F172A' : '#F8FAFC',
        color: isDark ? '#F8FAFC' : '#1E293B',
        fontFamily: F.body,
      }}
    >
      <Suspense fallback={<LoadingScreen />}>
        <B2BCoordinatorDashboard
          parent={parent}
          lang={lang}
          theme={theme}
          dbConnected={dbConnected}
          isSyncing={isSyncing}
          onLogout={handleLogout}
          onEnterChildMode={() => {}}
          onNavigate={() => {}}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onLanguageChange={setLang}
          onRefreshParent={setParent}
        />
      </Suspense>
    </div>
  );
}
