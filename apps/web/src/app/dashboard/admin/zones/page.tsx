'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { apiRequest } from '../../../../lib/api';
import AtlasMap from '../../../../components/AtlasMap';
import { RiskLevel, RiskZone } from '@atlasguard/shared';

const RISK_BADGE: Record<RiskLevel, string> = {
  LOW: 'badge-responder',
  MEDIUM: 'badge-role',
  HIGH: 'badge-operator',
  CRITICAL: 'badge-admin',
};

export default function AdminZonesPage() {
  const { user, loading: authLoading } = useAuth(['ADMIN']);
  const [zones, setZones] = useState<RiskZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    apiRequest<RiskZone[]>('/admin/risk-zones', 'GET')
      .then(setZones)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="glass metric-card shimmer" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading risk zones...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Risk Zones</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Seeded geofence polygons for Gangtok demo — read-only preview. Zones are loaded from GeoJSON at seed time.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="glass" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <AtlasMap
          zones={zones}
          layers={{ zones: true, incidents: false, responders: false, tourist: false }}
          height="400px"
        />
      </div>

      <div className="glass metric-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Zone Registry ({zones.length})</h3>
        {zones.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>
            No zones found. Run database seed to load Gangtok demo zones.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Risk Level</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ color: '#fff' }}>{zone.name}</strong>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${RISK_BADGE[zone.riskLevel]}`} style={{ fontSize: '0.7rem' }}>
                        {zone.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {zone.description}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${zone.active ? 'badge-responder' : 'badge-role'}`} style={{ fontSize: '0.7rem' }}>
                        {zone.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}