'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { apiRequest } from '../../../../lib/api';
import { ResponderSummary } from '@atlasguard/shared';

export default function OperatorRespondersPage() {
  const { user, loading } = useAuth(['OPERATOR', 'ADMIN']);
  const [responders, setResponders] = useState<ResponderSummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      apiRequest<ResponderSummary[]>('/ops/responders', 'GET')
        .then(setResponders)
        .finally(() => setLoadingData(false));
    }
  }, [loading, user]);

  if (loading || !user) return null;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="glass metric-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Responders Control Panel</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Live roster of field response units available for incident assignment.
        </p>
      </div>

      {loadingData ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading responders...</p>
      ) : responders.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No responders registered in the system.</p>
      ) : (
        <div className="grid-cols-2">
          {responders.map((r) => (
            <div key={r.id} className="glass metric-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '1.1rem' }}>{r.name}</strong>
                <span className={`badge ${r.availabilityStatus === 'AVAILABLE' ? 'badge-responder' : 'badge-role'}`}>
                  {r.availabilityStatus}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div>Unit: <strong style={{ color: 'var(--text-primary)' }}>{r.unitName}</strong></div>
                <div>Phone: {r.phone}</div>
                <div>Active Assignments: <strong style={{ color: r.activeAssignments > 0 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>{r.activeAssignments}</strong></div>
                {r.lastLatitude && r.lastLongitude && (
                  <div>Last Position: {r.lastLatitude.toFixed(4)}, {r.lastLongitude.toFixed(4)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}