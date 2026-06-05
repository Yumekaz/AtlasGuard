// apps/web/src/app/dashboard/operator/page.tsx
'use client';

import { useAuth } from '../../../hooks/useAuth';

export default function OperatorDashboard() {
  const { user, loading } = useAuth(['OPERATOR', 'ADMIN']);

  if (loading || !user) {
    return null;
  }

  // Mock Active Incidents
  const activeIncidents = [
    {
      id: 'inc-1',
      tourist: 'Alice Smith',
      location: 'Viewpoint Ridge (Zone 3)',
      type: 'SOS',
      severity: 'CRITICAL',
      status: 'CREATED',
      time: '2 mins ago',
      riskScore: 82,
    },
    {
      id: 'inc-2',
      tourist: 'Bob Jones',
      location: 'Riverside Walkway (Zone 1)',
      type: 'MEDICAL',
      severity: 'HIGH',
      status: 'ACKNOWLEDGED',
      time: '15 mins ago',
      riskScore: 68,
    },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Metric Cards Banner */}
      <div className="grid-cols-4">
        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Active SOS Cases</span>
            <span style={{ color: 'var(--accent-red)', fontSize: '1.25rem' }}>●</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-red)' }}>2</div>
          <div className="metric-desc">Triage queue active</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Responders Online</span>
            <span style={{ color: 'var(--accent-green)', fontSize: '1.25rem' }}>●</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-green)' }}>5</div>
          <div className="metric-desc">3 Available, 2 Busy</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Geofence Breaches</span>
            <span style={{ color: 'var(--accent-orange)', fontSize: '1.25rem' }}>●</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-orange)' }}>1</div>
          <div className="metric-desc">Active warnings issued</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Avg Latency</span>
            <span style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>⏱</span>
          </div>
          <div className="metric-value">1.8m</div>
          <div className="metric-desc">Acknowledgement speed</div>
        </div>
      </div>

      {/* Incident Dispatch Center Panel */}
      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Active Operations Queue</span>
          <span className="badge badge-role" style={{ fontSize: '0.75rem' }}>Live Feed</span>
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', paddingBottom: '0.75rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Case / Tourist</th>
                <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                <th style={{ padding: '0.75rem 1rem' }}>Risk Score</th>
                <th style={{ padding: '0.75rem 1rem' }}>Severity</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Created</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeIncidents.map((incident) => (
                <tr key={incident.id} style={{ borderBottom: '1px solid var(--border-color)', height: '60px' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <strong style={{ display: 'block', color: '#ffffff' }}>{incident.type}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{incident.tourist}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{incident.location}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <code style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      {incident.riskScore}/100
                    </code>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${incident.severity === 'CRITICAL' ? 'badge-admin' : 'badge-operator'}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="badge badge-role" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                      {incident.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{incident.time}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: 'auto' }}>
                        Triage & Dispatch
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
