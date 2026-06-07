'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiRequest } from '../../../lib/api';
import {
  AuditEventFeedItem,
  DashboardSummary,
  RiskZone,
  SimulateDemoResponse,
  User,
} from '@atlasguard/shared';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading } = useAuth(['ADMIN']);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [zones, setZones] = useState<RiskZone[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditFeed, setAuditFeed] = useState<AuditEventFeedItem[]>([]);
  const [demoResult, setDemoResult] = useState<SimulateDemoResponse | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      const [summaryData, zonesData, usersData, auditData] = await Promise.all([
        apiRequest<DashboardSummary>('/ops/dashboard/summary', 'GET'),
        apiRequest<RiskZone[]>('/admin/risk-zones', 'GET'),
        apiRequest<User[]>('/admin/users', 'GET'),
        apiRequest<AuditEventFeedItem[]>('/admin/audit', 'GET'),
      ]);
      setSummary(summaryData);
      setZones(zonesData);
      setUsers(usersData);
      setAuditFeed(auditData.slice(0, 5));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) loadMetrics();
  }, [loading, user, loadMetrics]);

  const handlePrepareDemo = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      const result = await apiRequest<SimulateDemoResponse>('/admin/simulate-demo', 'POST');
      setDemoResult(result);
      await loadMetrics();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid-cols-4">
        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Incidents</span>
            <span style={{ color: 'var(--accent-orange)' }}>●</span>
          </div>
          <div className="metric-value">{summary?.totalActive ?? '—'}</div>
          <div className="metric-desc">{summary?.criticalCount ?? 0} critical</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Risk Polygons</span>
            <span style={{ color: 'var(--accent-orange)' }}>●</span>
          </div>
          <div className="metric-value">{zones.filter((z) => z.active).length}</div>
          <div className="metric-desc">Geofence sectors active</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Avg Response</span>
            <span style={{ color: 'var(--primary)' }}>⏱</span>
          </div>
          <div className="metric-value" style={{ fontSize: '1.3rem' }}>
            {summary?.averageResponseTimeMinutes != null
              ? `${summary.averageResponseTimeMinutes}m`
              : '—'}
          </div>
          <div className="metric-desc">Operator acknowledge time</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">User Accounts</span>
            <span>👥</span>
          </div>
          <div className="metric-value">{users.length}</div>
          <div className="metric-desc">Resolved today: {summary?.resolvedToday ?? 0}</div>
        </div>
      </div>

      <div className="glass metric-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>Demo Scenario Control</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              One-click demo: seeds accounts, clears open incidents, sets medical/mobility profile, auto-triggers MEDICAL SOS at Remote North, and acknowledges for analytics.
            </p>
          </div>
          <button
            onClick={handlePrepareDemo}
            disabled={demoLoading}
            className="btn btn-primary"
            style={{ width: 'auto', minWidth: '220px' }}
          >
            {demoLoading ? 'Preparing...' : 'Prepare Demo Scenario'}
          </button>
        </div>

        {demoResult && (
          <div className="alert alert-success" style={{ marginTop: '1rem' }}>
            <strong>{demoResult.message}</strong>
            <ol style={{ margin: '0.75rem 0 0', paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
              {demoResult.playbook.steps.map((step) => (
                <li key={step} style={{ marginBottom: '0.35rem' }}>{step}</li>
              ))}
            </ol>
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              High-risk coords: {demoResult.playbook.highRiskLocation.lat}, {demoResult.playbook.highRiskLocation.lng}
            </p>
            {demoResult.playbook.autoTriggered && demoResult.playbook.demoIncidentId && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                <strong>Auto-created incident:</strong>{' '}
                <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                  {demoResult.playbook.demoIncidentId}
                </code>
                {demoResult.playbook.expectedRiskScore != null && (
                  <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                    — risk {demoResult.playbook.expectedRiskScore}/100 ({demoResult.playbook.expectedSeverity})
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid-cols-2">
        <div className="glass metric-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Risk Geofence Configurations
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            {zones.slice(0, 6).map((zone) => (
              <li key={zone.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                <span>{zone.name}</span>
                <span className="badge badge-admin" style={{ fontSize: '0.65rem' }}>{zone.riskLevel}</span>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/admin/zones" className="btn btn-primary" style={{ marginTop: '1.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem', width: 'auto', display: 'inline-block' }}>
            Manage Zones
          </Link>
        </div>

        <div className="glass metric-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Security Audit Trail Logs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {auditFeed.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No audit events yet.</p>
            ) : (
              auditFeed.map((log) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                  <div>
                    <strong style={{ color: '#ffffff' }}>{log.eventType}</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {log.touristName} — {log.actorName}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}