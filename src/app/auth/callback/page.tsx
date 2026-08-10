'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function NativeGoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Verifying with Google...');
  const verifyAttempted = useRef(false);

  useEffect(() => {
    // Only run on the client
    if (typeof window === 'undefined') return;
    
    // Prevent double-firing in strict mode
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('Google Authentication failed or was cancelled.');
      setTimeout(() => window.close(), 3000);
      return;
    }

    if (!code) {
      setStatus('No authentication code found.');
      return;
    }

    const verifyGoogleCode = async () => {
        try {
            const res = await fetch('/api/auth/google/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    redirectUri: `${window.location.origin}/auth/callback`
                })
            });
            const data = await res.json();
            
            if (data.ok && data.parent) {
                setStatus('Success! Redirecting...');
                if (window.opener) {
                    window.opener.postMessage({ type: "GOOGLE_OAUTH_SUCCESS", parent: data.parent }, "*");
                    setTimeout(() => window.close(), 500);
                } else {
                    localStorage.setItem("clats_sess_v1", JSON.stringify({ type: "parent", email: data.parent.email }));
                    router.push('/dashboard');
                }
            } else {
                setStatus(data.msg || 'Failed to authenticate.');
            }
        } catch (e: any) {
            setStatus('Network error during verification: ' + e.message);
        }
    };

    verifyGoogleCode();

  }, [router, searchParams]);

  return (
      <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontFamily: 'sans-serif',
          background: '#0F172A',
          color: '#22d3ee'
      }}>
          <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 20 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ animation: 'spin 2s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
              </div>
              <p style={{ fontWeight: 600 }}>{status}</p>
          </div>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
      </div>
  );
}

export default function NativeGoogleCallback() {
  return (
    <Suspense fallback={
      <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontFamily: 'sans-serif',
          background: '#0F172A',
          color: '#22d3ee',
          fontWeight: 600
      }}>
        Loading Google Authentication...
      </div>
    }>
      <NativeGoogleCallbackContent />
    </Suspense>
  );
}
