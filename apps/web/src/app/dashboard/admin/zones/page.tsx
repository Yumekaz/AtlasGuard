// apps/web/src/app/dashboard/admin/zones/page.tsx
'use client';
import { useAuth } from '../../../../hooks/useAuth';

export default function AdminZonesPage() {
  const { user, loading } = useAuth(['ADMIN']);
  if (loading || !user) return null;

  return (
    <div className="glass metric-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Risk Zones Control</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Add, delete, or modify geofence polygons, hazard thresholds, and area risk ratings.</p>
    </div>
  );
}
