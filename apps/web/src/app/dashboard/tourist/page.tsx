// apps/web/src/app/dashboard/tourist/page.tsx
'use client';

import { useAuth } from '../../../hooks/useAuth';

export default function TouristDashboard() {
  const { user, loading } = useAuth(['TOURIST', 'ADMIN']);

  if (loading || !user) {
    return null; // Page layout handles loading shell
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Active Alerts Banner */}
      <div className="alert alert-warning" role="alert">
        <div>
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Geofence Alert (Simulated)</strong>
          You are currently near a landside-prone route (Restricted Area 3). Please exercise caution and avoid traveling late.
        </div>
      </div>

      {/* Safety Actions Section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '3rem 0', gap: '1.5rem' }}>
        <button className="btn btn-sos">
          <span>TRIGGER</span>
          <span style={{ fontSize: '2rem' }}>SOS</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.05em' }}>ONE-TAP RESCUE</span>
        </button>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '380px' }}>
          Tapping the button above will create a live emergency case visible to local police and active rescue responders.
        </p>
      </div>

      {/* Profile & Trip Context cards */}
      <div className="grid-cols-2">
        <div className="glass metric-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Active Trip Safety Card
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Destination:</span>{' '}
              <strong style={{ color: '#ffffff' }}>Gangtok, Sikkim</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Generated Safety ID:</span>{' '}
              <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--primary)' }}>
                AG-990-SIK
              </code>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Duration:</span>{' '}
              <span>June 5, 2026 - June 12, 2026</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Status:</span>{' '}
              <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>Active Session</span>
            </div>
          </div>
        </div>

        <div className="glass metric-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Emergency Contact & Medical Profiles
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Primary Contact:</span>{' '}
              <strong>Jane Doe (+1 555-908-1123)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Medical Conditions:</span>{' '}
              <span style={{ color: 'var(--accent-orange)' }}>Asthma (Requires inhaler)</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Mobility Needs:</span>{' '}
              <span>None reported</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Primary Language:</span>{' '}
              <span>English (US)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
