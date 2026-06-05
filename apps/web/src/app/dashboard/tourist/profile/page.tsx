// apps/web/src/app/dashboard/tourist/profile/page.tsx
'use client';
import { useAuth } from '../../../../hooks/useAuth';

export default function TouristProfilePage() {
  const { user, loading } = useAuth(['TOURIST', 'ADMIN']);
  if (loading || !user) return null;

  return (
    <div className="glass metric-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Emergency Profile</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Configure emergency contact numbers, medical alerts, and language preferences here.</p>
    </div>
  );
}
