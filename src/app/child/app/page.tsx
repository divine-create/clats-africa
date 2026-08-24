'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F } from '@/utils/config';

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
    setTheme,
    logout,
  } = useApp();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('home');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!parent) {
      // Not logged in or no parent wrapper
      router.push('/child/login');
      return;
    }
    if (!activeChild) {
      // Logged in but no child selected
      if (parent.isB2B) {
        router.push('/child/login');
      } else {
        router.push('/dashboard');
      }
      return;
    }
    setMounted(true);
  }, [parent, activeChild, router]);

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
    if (parent?.isB2B) {
      logout('/child/login');
    } else {
      router.push('/dashboard');
    }
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
      <Suspense fallback={<LoadingScreen />}>
        <ChildApp
          child={activeChild}
          parent={parent}
          lang={lang}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onUpdateChild={handleChildUpdate}
          onExit={handleExit}
        />
      </Suspense>
    </div>
  );
}
