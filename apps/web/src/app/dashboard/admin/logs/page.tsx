'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { apiRequest } from '../../../../lib/api';
import { AuditEventFeedItem, INCIDENT_EVENT_LABELS, NotificationRecord } from '@atlasguard/shared';

export default function AdminLogsPage() {
  const { user, loading: authLoading } = useAuth(['ADMIN']);
  const [auditFeed, setAuditFeed] = useState<AuditEventFeedItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.all([
      apiRequest<AuditEventFeedItem[]>('/admin/audit', 'GET'),
      apiRequest<NotificationRecord[]>('/ops/notifications', 'GET'),
    ])
      .then(([audit, notifs]) => {
        setAuditFeed(audit);
        setNotifications(notifs);
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="glass metric-card shimmer" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading system logs...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>System Logs</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Cross-incident audit feed and mock notification delivery records.
        </p>
      </div>

      <div className="glass metric-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Audit Event Feed</h3>
        {auditFeed.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No audit events recorded.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.5rem' }}>Time</th>
                  <th style={{ padding: '0.5rem' }}>Event</th>
                  <th style={{ padding: '0.5rem' }}>Actor</th>
                  <th style={{ padding: '0.5rem' }}>Incident</th>
                  <th style={{ padding: '0.5rem' }}>Hash</th>
                </tr>
              </thead>
              <tbody>
                {auditFeed.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{INCIDENT_EVENT_LABELS[e.eventType]}</td>
                    <td style={{ padding: '0.5rem' }}>{e.actorName}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {e.incidentType} — {e.touristName}
                    </td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {e.currentHash.slice(0, 10)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass metric-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Notification Delivery Log</h3>
        {notifications.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No notifications queued yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.5rem' }}>Time</th>
                  <th style={{ padding: '0.5rem' }}>User</th>
                  <th style={{ padding: '0.5rem' }}>Channel</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {notifications.slice(0, 50).map((n) => (
                  <tr key={n.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{n.userName ?? n.userId.slice(0, 8)}</td>
                    <td style={{ padding: '0.5rem' }}>{n.channel}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span className={`badge ${n.status === 'MOCKED' || n.status === 'SENT' ? 'badge-responder' : n.status === 'FAILED' ? 'badge-admin' : 'badge-role'}`} style={{ fontSize: '0.65rem' }}>
                        {n.status}
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