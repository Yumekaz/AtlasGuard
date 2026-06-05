// apps/web/src/app/dashboard/responder/history/page.tsx
'use client';
import { useAuth } from '../../../../hooks/useAuth';

export default function ResponderHistoryPage() {
  const { user, loading } = useAuth(['RESPONDER', 'ADMIN']);
  if (loading || !user) return null;

  return (
    <div className="glass metric-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Rescue Report Logs</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Historic safety response files, operator reviews, and archive status records.</p>
    </div>
  );
}
