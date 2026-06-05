// apps/web/src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session) {
      const defaultDashboards = {
        TOURIST: '/dashboard/tourist',
        OPERATOR: '/dashboard/operator',
        RESPONDER: '/dashboard/responder',
        ADMIN: '/dashboard/admin',
      };
      router.push(defaultDashboards[session.role] || '/login');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0b0f19',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }}>
      <div className="glass shimmer" style={{ padding: '2rem 3rem', borderRadius: '16px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Loading AtlasGuard Portal...</h2>
        <p style={{ color: '#94a3b8' }}>Establishing secure connection...</p>
      </div>
    </div>
  );
}
