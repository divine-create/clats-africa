'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { F } from '@/utils/config';

const B2BCoordinatorDashboard = lazy(() =>
  import('@/components/B2BCoordinatorDashboard').then(m => ({ default: m.B2BCoordinatorDashboard ?? m.default }))
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
    if (!parent) {
      router.push('/coordinator/login');
      return;
    }
    if (!parent.isB2B) {
      router.push('/dashboard');
      return;
    }
    setMounted(true);
  }, [parent, router]);

  const handleLogout = () => {
    logout();
    router.push('/coordinator/login');
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
