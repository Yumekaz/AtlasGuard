// apps/web/src/app/dashboard/admin/logs/page.tsx
'use client';
import { useAuth } from '../../../../hooks/useAuth';

export default function AdminLogsPage() {
  const { user, loading } = useAuth(['ADMIN']);
  if (loading || !user) return null;

  return (
    <div className="glass metric-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>System Logs Control</h2>
      <p style={{ color: 'var(--text-secondary)' }}>View raw database activity logs, WebSocket connection status, and diagnostic reports.</p>
    </div>
  );
}
