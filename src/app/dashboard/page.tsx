'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F, syncToSupabase, S } from '@/utils/config';
import { TutorialTour } from '@/components/TourOverlay';

const ParentDashboard = lazy(() =>
  import('@/components/ParentDashboard').then(m => ({ default: (m as any).ParentDashboard ?? (m as any).default }))
);

const WelcomeModal = lazy(() =>
  import('@/components/TourOverlay').then(m => ({ default: (m as any).WelcomeModal ?? (m as any).default }))
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
      }}
    >
      Loading CLATS…
    </div>
  );
}



export default function DashboardPage() {
  const router = useRouter();
  const {
    lang,
    setLang,
    theme,
    setTheme,
    parent,
    setParent,
    setActiveChild,
    logout,
    dbConnected,
    isSyncing,
  } = useApp();
  const isDark = theme === 'dark';

  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!parent) {
      const sess = S.getSess();
      if (!sess?.email) {
        router.push('/auth/login');
      }
      return;
    }
    if (parent.isB2B) {
      router.push('/coordinator/dashboard');
      return;
    }
    setMounted(true);
    setMounted(true);
    // Show welcome modal for new users ONLY if not completed in DB
    const welcomed = localStorage.getItem('clats_welcomed');
    if (!welcomed && parent.tutorial_completed !== true) {
      setShowWelcome(true);
    }
  }, [parent, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleChildSelect = (child: any) => {
    setActiveChild(child);
    router.push('/child/app');
  };

  const handleNavigate = (screen: 'addChild' | 'settings' | 'community') => {
    if (screen === 'addChild') router.push('/dashboard/add-child');
    if (screen === 'settings') router.push('/dashboard/settings');
    if (screen === 'community') router.push('/dashboard/community');
  };

  const handleWelcomeStart = () => {
    setShowWelcome(false);
    setShowTour(true);
  };

  const handleWelcomeSkip = () => {
    setShowWelcome(false);
    localStorage.setItem('tutorialSkipped', 'true');
    localStorage.setItem('clats_welcomed', 'true');
    
    if (parent) {
      const updatedParent = { ...parent, tutorial_completed: true };
      setParent(updatedParent);
      syncToSupabase(updatedParent, true);
    }
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
        {showWelcome && (
          <Suspense fallback={null}>
            <WelcomeModal
              onStartTour={handleWelcomeStart}
              onSkip={handleWelcomeSkip}
            />
          </Suspense>
        )}

        {showTour && (
          <TutorialTour
            role="parent"
            onComplete={() => {
              setShowTour(false);
              localStorage.setItem('hasCompletedParentTutorial', 'true');
              localStorage.setItem('clats_welcomed', 'true');
              if (parent) {
                const updatedParent = { ...parent, tutorial_completed: true };
                setParent(updatedParent);
                syncToSupabase(updatedParent, true);
              }
            }}
            onSkip={() => {
              setShowTour(false);
              localStorage.setItem('tutorialSkipped', 'true');
              localStorage.setItem('clats_welcomed', 'true');
              if (parent) {
                const updatedParent = { ...parent, tutorial_completed: true };
                setParent(updatedParent);
                syncToSupabase(updatedParent, true);
              }
            }}
          />
        )}

        <ParentDashboard
          parent={parent}
          lang={lang}
          theme={theme}
          dbConnected={dbConnected}
          isSyncing={isSyncing}
          onLogout={handleLogout}
          onEnterChildMode={handleChildSelect}
          onNavigate={handleNavigate}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onLanguageChange={setLang}
          onRefreshParent={setParent}
        />
      </Suspense>
    </div>
  );
}
