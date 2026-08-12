'use client';

import { useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F, S } from '@/utils/config';

const ParentCommunity = lazy(() =>
  import('@/components/ParentCommunity').then(m => ({ default: m.ParentCommunity ?? m.default }))
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

export default function CommunityPage() {
  const router = useRouter();
  const {
    lang,
    theme,
    parent,
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
        <ParentCommunity
          lang={lang}
          theme={theme}
          onBack={handleBack}
        />
      </Suspense>
    </div>
  );
}
