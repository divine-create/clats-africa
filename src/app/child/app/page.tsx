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
    if (activeChild) {
      // A child is logged in -- this covers a parent picking a child from their
      // dashboard, a B2B student, and a child logging in directly with their own
      // username + PIN on a device where no parent session exists. ChildApp
      // itself accepts `parent: Parent | null`, so no parent is required here.
      setMounted(true);
      return;
    }
    if (parent && !parent.isB2B) {
      // Parent is logged in but hasn't selected a child yet.
      router.push('/dashboard');
    } else {
      // No child selected, and either no parent session or a B2B parent who
      // still needs to pick a student.
      router.push('/child/login');
    }
  }, [parent, activeChild, router]);

  const handleChildUpdate = (updatedChild: any) => {
    setActiveChild(updatedChild);

    // B2B student — sync progress directly to their own record
    if ((updatedChild as any).isB2B) {
      try {
        fetch("/api/supabase/b2b/manage-student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_progress",
            studentId: updatedChild.id,
            xp: updatedChild.xp,
            completed: updatedChild.completed,
            completed_lessons: updatedChild.completedLessons,
            stars: updatedChild.stars,
            quiz_results: updatedChild.quizResults,
            streak_count: updatedChild.streak,
            best_streak: updatedChild.best_streak,
            last_active_at: updatedChild.last_active_at,
            badges: updatedChild.badges,
          })
        });
      } catch (e) {
        console.error("Failed to sync B2B student progress:", e);
      }
      return;
    }

    // Regular parent-linked child
    if (!parent) return;
    const updatedChildren = (parent.children ?? []).map((c: any) =>
      (c.id ?? c.name) === (updatedChild.id ?? updatedChild.name) ? updatedChild : c
    );
    const updatedParent = { ...parent, children: updatedChildren };
    setParent(updatedParent);

    // Persist child state back to Supabase
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
    const wasB2B = activeChild && (activeChild as any).isB2B;
    // A directly-logged-in child (no parent session on this device) has nowhere
    // to go in the parent dashboard -- send them back to child login, same as a
    // B2B student, rather than bouncing through /dashboard to /auth/login.
    if (wasB2B || parent?.isB2B || !parent) {
      router.push('/child/login');
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
