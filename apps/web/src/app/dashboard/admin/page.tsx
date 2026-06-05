// apps/web/src/app/dashboard/admin/page.tsx
'use client';

import { useAuth } from '../../../hooks/useAuth';

export default function AdminDashboard() {
  const { user, loading } = useAuth(['ADMIN']);

  if (loading || !user) {
    return null;
  }

  // Mock System Audit Log lines
  const auditLogs = [
    { id: 'log-1', action: 'DATABASE_SEED', actor: 'SYSTEM', status: 'SUCCESS', time: 'June 5, 2026 09:30 AM' },
    { id: 'log-2', action: 'ADMIN_LOGIN', actor: 'admin@demo.com', status: 'SUCCESS', time: 'June 5, 2026 09:32 AM' },
    { id: 'log-3', action: 'ZONE_CREATE', actor: 'admin@demo.com', status: 'SUCCESS', time: 'June 5, 2026 09:35 AM' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* DB and System status indicators */}
      <div className="grid-cols-4">
        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">DB Engine</span>
            <span className="badge badge-role" style={{ fontSize: '0.6rem' }}>SQLite</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--primary)' }}>ONLINE</div>
          <div className="metric-desc">dev.db (Healthy)</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Risk Polygons</span>
            <span style={{ color: 'var(--accent-orange)' }}>●</span>
          </div>
          <div className="metric-value">6</div>
          <div className="metric-desc">Geofence sectors active</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Audit Ledger</span>
            <span style={{ color: 'var(--accent-green)' }}>🔒</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-green)' }}>SECURE</div>
          <div className="metric-desc">Hash-chains verified</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">User Accounts</span>
            <span style={{ color: '#ffffff' }}>👥</span>
          </div>
          <div className="metric-value">12</div>
          <div className="metric-desc">Across 4 system roles</div>
        </div>
      </div>

      <div className="grid-cols-2">
        {/* Risk Zones control panel */}
        <div className="glass metric-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Risk Geofence Configurations
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
              <span>Sector A - Landslide Valley</span>
              <span className="badge badge-admin" style={{ fontSize: '0.65rem' }}>CRITICAL</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
              <span>Sector B - Coastal Rip Currents</span>
              <span className="badge badge-operator" style={{ fontSize: '0.65rem' }}>HIGH</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
              <span>Sector C - High footfall Market</span>
              <span className="badge badge-role" style={{ fontSize: '0.65rem' }}>MEDIUM</span>
            </li>
          </ul>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            + Create New Sector Polygon
          </button>
        </div>

        {/* Audit Log Panel */}
        <div className="glass metric-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Security Audit Trail Logs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                <div>
                  <strong style={{ color: '#ffffff' }}>{log.action}</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>By {log.actor}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-responder" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>{log.status}</span>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
