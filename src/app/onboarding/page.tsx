'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { C, F } from '@/utils/config';
import { Onboarding } from '@/components/Onboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const { lang, theme } = useApp();
  const isDark = theme === 'dark';

  const handleSelectRole = (role: string) => {
    localStorage.setItem('clats_onboarded', 'true');
    if (role === 'parent') {
      router.push('/auth/register');
    } else {
      router.push('/child/login');
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
      <Onboarding
        onSelectRole={handleSelectRole}
        lang={lang}
        theme={theme}
      />
    </div>
  );
}
