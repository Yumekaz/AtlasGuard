'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { apiRequest } from '../../../../lib/api';
import { AuditTimeline } from '../../../../components/AuditTimeline';
import {
  AuditIncidentSummary,
  AuditIntegrityResult,
  IncidentDetail,
} from '@atlasguard/shared';

export default function OperatorAuditPage() {
  const { user, loading: authLoading } = useAuth(['OPERATOR', 'ADMIN']);
  const [incidents, setIncidents] = useState<AuditIncidentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [integrity, setIntegrity] = useState<AuditIntegrityResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    apiRequest<AuditIncidentSummary[]>('/ops/audit/incidents', 'GET')
      .then((data) => {
        setIncidents(data);
        if (data[0]) setSelectedId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  useEffect(() => {
    if (!selectedId) return;
    setDetail(null);
    setIntegrity(null);
    Promise.all([
      apiRequest<IncidentDetail>(`/ops/incidents/${selectedId}`, 'GET'),
      apiRequest<AuditIntegrityResult>(`/ops/audit/incidents/${selectedId}/verify`, 'GET'),
    ]).then(([inc, verify]) => {
      setDetail(inc);
      setIntegrity(verify);
    });
  }, [selectedId]);

  if (authLoading || loading) {
    return (
      <div className="glass metric-card shimmer" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading audit ledger...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Safety Audit Ledger</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Append-only hash-chained ledger. Recalculate hashes to verify timeline integrity.
        </p>
      </div>

      <div className="grid-cols-2" style={{ gap: '1.25rem' }}>
        <div className="glass metric-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Incidents with Events</h3>
          {incidents.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No audit events yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => setSelectedId(inc.id)}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    borderColor: selectedId === inc.id ? 'var(--primary)' : undefined,
                  }}
                >
                  <strong>{inc.type}</strong> — {inc.touristName}
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {inc.eventCount} events · {inc.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="glass metric-card" style={{ padding: '1.25rem' }}>
          {detail ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
                  {detail.type} — {detail.touristName}
                </h3>
                {integrity && (
                  <span className={`badge ${integrity.verified ? 'badge-responder' : 'badge-admin'}`} style={{ fontSize: '0.7rem' }}>
                    {integrity.message}
                  </span>
                )}
              </div>
              <AuditTimeline
                incidentId={detail.id}
                events={detail.events}
                showVerifyButton={false}
              />
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Select an incident to view its audit chain.</p>
          )}
        </div>
      </div>
    </div>
  );
}