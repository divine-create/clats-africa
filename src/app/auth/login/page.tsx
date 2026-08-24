'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F } from '@/utils/config';
import { ParentAuthScreen } from '@/components/ParentAuth';

export default function LoginPage() {
  const router = useRouter();
  const { lang, theme, setParent } = useApp();
  const isDark = theme === 'dark';

  const handleAuth = (p: any) => {
    setParent(p);
    if (p.isB2B) {
      router.push('/coordinator/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleSwitchMode = (mode: string) => {
    if (mode === 'register') {
      router.push('/auth/register');
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
        mode="login"
        onAuth={handleAuth}
        onBack={handleBack}
        lang={lang}
        theme={theme}
      />
    </div>
  );
}
