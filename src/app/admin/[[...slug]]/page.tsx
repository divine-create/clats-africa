'use client';

import { lazy, Suspense, use, useEffect } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F } from '@/utils/config';

const AdminDashboard = lazy(() =>
  import('@/components/AdminDashboard').then(m => ({ default: m.AdminDashboard })) as Promise<{ default: React.ComponentType<any> }>
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

export default function AdminPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const router = useRouter();
  const {
    lang,
    theme,
    parent,
    dbConnected,
    isSyncing,
  } = useApp();
  const isDark = theme === 'dark';

  const resolvedParams = use(params);
  
  if (resolvedParams.slug && resolvedParams.slug.length > 1) {
    notFound();
  }
  
  const initialTab = resolvedParams.slug?.[0] || 'overview';

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
        <AdminDashboard
          initialTab={initialTab}
          lang={lang}
          theme={theme}
          onBackToPortal={handleBack}
        />
      </Suspense>
    </div>
  );
}
