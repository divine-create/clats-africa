'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F } from '@/utils/config';
import { ChildSetupScreen } from '@/components/Settings';

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

export default function AddChildPage() {
  const router = useRouter();
  const {
    lang,
    theme,
    parent,
    setParent,
    dbConnected,
    isSyncing,
  } = useApp();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!parent) {
      router.push('/auth/login');
    }
  }, [parent, router]);

  if (!parent) {
    return <LoadingScreen />;
  }

  const handleSave = (updated: any) => {
    setParent(updated);
    router.push('/dashboard');
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
      <ChildSetupScreen
        parentEmail={parent.email}
        lang={lang}
        theme={theme}
        onDone={async (newChildName) => {
          // Re-fetch parent from database to get the new child locally
          try {
            const res = await fetch('/api/supabase/parent/get', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: parent.email })
            });
            const data = await res.json();
            if (data.ok && data.parent) {
              setParent(data.parent);
            }
          } catch (e) {}
          router.push('/dashboard');
        }}
        onBack={handleBack}
      />
    </div>
  );
}
