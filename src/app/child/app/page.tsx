'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F } from '@/utils/config';
import { TutorialTour } from '@/components/TourOverlay';

const ChildApp = lazy(() =>
  import('@/components/ChildApp').then(m => ({ default: m.ChildApp ?? m.default }))
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

export default function ChildAppPage() {
  const router = useRouter();
  const {
    lang,
    theme,
    parent,
    setParent,
    activeChild,
    setActiveChild,
    dbConnected,
    isSyncing,
  } = useApp();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('home');
  const [showChildTour, setShowChildTour] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!activeChild) {
      router.push('/child/login');
      return;
    }
    setMounted(true);
    // Show tour for child first session ONLY if not completed in DB
    const tourKey = `clats_child_tour_${activeChild.id ?? activeChild.name}`;
    if (!localStorage.getItem(tourKey) && activeChild.child_tutorial_completed !== true) {
      setShowChildTour(true);
      localStorage.setItem(tourKey, 'true');
    }
  }, [activeChild, router]);

  const handleChildUpdate = (updatedChild: any) => {
    if (!parent) return;
    const updatedChildren = (parent.children ?? []).map((c: any) =>
      (c.id ?? c.name) === (updatedChild.id ?? updatedChild.name) ? updatedChild : c
    );
    const updatedParent = { ...parent, children: updatedChildren };
    setParent(updatedParent);
    setActiveChild(updatedChild);

    // Persist child state (XP, rewards, etc) back to Supabase
    if (parent.email) {
      try {
        fetch("/api/supabase/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentEmail: parent.email,
            children: [updatedChild]
          })
        });
      } catch (e) {
        console.error("Failed to sync child update to Supabase:", e);
      }
    }
  };

  const handleExit = () => {
    setActiveChild(null);
    router.push('/dashboard');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  if (!mounted || !activeChild) {
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
      {showChildTour && (
        <TutorialTour
          role="child"
          childAgeGroup={activeChild.ageGroup || "young innovators"}
          onComplete={() => {
            setShowChildTour(false);
            const tourKey = `clats_child_tour_${activeChild.id ?? activeChild.name}`;
            localStorage.setItem(tourKey, 'true');
            handleChildUpdate({ ...activeChild, child_tutorial_completed: true });
          }}
          onSkip={() => {
            setShowChildTour(false);
            const tourKey = `clats_child_tour_${activeChild.id ?? activeChild.name}`;
            localStorage.setItem(tourKey, 'true');
            handleChildUpdate({ ...activeChild, child_tutorial_completed: true });
          }}
          onSetChildTab={handleTabChange}
        />
      )}

      <Suspense fallback={<LoadingScreen />}>
        <ChildApp
          child={activeChild}
          parent={parent}
          lang={lang}
          theme={theme}
          onUpdateChild={handleChildUpdate}
          onExit={handleExit}
        />
      </Suspense>
    </div>
  );
}
