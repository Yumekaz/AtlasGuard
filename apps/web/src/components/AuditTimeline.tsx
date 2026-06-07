'use client';

import { useState } from 'react';
import { apiRequest } from '../lib/api';
import {
  AuditIntegrityResult,
  INCIDENT_EVENT_LABELS,
  IncidentEvent,
} from '@atlasguard/shared';

interface AuditTimelineProps {
  incidentId: string;
  events: IncidentEvent[];
  showVerifyButton?: boolean;
}

export function AuditTimeline({ incidentId, events, showVerifyButton = true }: AuditTimelineProps) {
  const [integrity, setIntegrity] = useState<AuditIntegrityResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await apiRequest<AuditIntegrityResult>(
        `/incidents/${incidentId}/audit/verify`,
        'GET',
      );
      setIntegrity(result);
    } finally {
      setVerifying(false);
    }
  };

  const verified = integrity?.verified;
  const badgeClass = verified === undefined
    ? 'badge-role'
    : verified
      ? 'badge-responder'
      : 'badge-admin';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Audit Timeline</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {integrity && (
            <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem' }}>
              {integrity.verified ? 'Integrity: Verified' : 'Integrity: Broken'}
            </span>
          )}
          {showVerifyButton && (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="btn btn-secondary"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              {verifying ? 'Verifying...' : 'Verify Integrity'}
            </button>
          )}
        </div>
      </div>

      {integrity && !integrity.verified && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
          {integrity.message}
        </div>
      )}

      {events.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No audit events yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {events.map((event, idx) => (
            <div
              key={event.id}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.75rem 0',
                borderBottom: idx < events.length - 1 ? '1px solid var(--border-color)' : undefined,
              }}
            >
              <div style={{ minWidth: '72px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
                  {INCIDENT_EVENT_LABELS[event.eventType] ?? event.eventType}
                </strong>
                {event.actorName && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    — {event.actorName}
                  </span>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                  hash: {event.currentHash.slice(0, 12)}…
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}