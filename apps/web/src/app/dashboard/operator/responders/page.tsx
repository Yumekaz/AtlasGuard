// apps/web/src/app/dashboard/operator/responders/page.tsx
'use client';
import { useAuth } from '../../../../hooks/useAuth';

export default function OperatorRespondersPage() {
  const { user, loading } = useAuth(['OPERATOR', 'ADMIN']);
  if (loading || !user) return null;

  return (
    <div className="glass metric-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Responders Control Panel</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Track live positions, signal strength, and unit assignments of online emergency rescue teams.</p>
    </div>
  );
}
