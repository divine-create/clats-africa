'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F } from '@/utils/config';
import { ParentAuthScreen } from '@/components/ParentAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { lang, theme, setParent } = useApp();
  const isDark = theme === 'dark';

  const handleAuth = (p: any) => {
    setParent(p);
    router.push('/dashboard');
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleSwitchMode = (mode: string) => {
    if (mode === 'login') {
      router.push('/auth/login');
    }
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
      <ParentAuthScreen
        mode="register"
        onAuth={handleAuth}
        onBack={handleBack}
        lang={lang}
        theme={theme}
      />
    </div>
  );
}
