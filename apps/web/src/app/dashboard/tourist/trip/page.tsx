// apps/web/src/app/dashboard/tourist/trip/page.tsx
'use client';
import { useAuth } from '../../../../hooks/useAuth';

export default function TouristTripPage() {
  const { user, loading } = useAuth(['TOURIST', 'ADMIN']);
  if (loading || !user) return null;

  return (
    <div className="glass metric-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Active Trip Management</h2>
      <p style={{ color: 'var(--text-secondary)' }}>No other trip schedules configured. Your current trip is to Gangtok, Sikkim.</p>
    </div>
  );
}
