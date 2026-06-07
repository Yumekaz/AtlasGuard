'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import { apiRequest } from '../../../../../lib/api';
import { useIncidentSocket } from '../../../../../hooks/useIncidentSocket';
import { EvidenceFile, IncidentDetail } from '@atlasguard/shared';
import { IncidentStepper } from '../../../../../components/IncidentStepper';
import { StatusBadge, SeverityBadge } from '../../../../../components/StatusBadge';
import { AuditTimeline } from '../../../../../components/AuditTimeline';
import { EvidenceUpload } from '../../../../../components/EvidenceUpload';
import { RiskExplanationPanel } from '../../../../../components/RiskExplanationPanel';
import Link from 'next/link';

export default function TouristIncidentPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;
  const { user, loading: authLoading } = useAuth(['TOURIST', 'ADMIN']);

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);

  const loadIncident = useCallback(async () => {
    try {
      const [data, evidenceList] = await Promise.all([
        apiRequest<IncidentDetail>(`/incidents/${incidentId}/status`, 'GET'),
        apiRequest<EvidenceFile[]>(`/incidents/${incidentId}/evidence`, 'GET'),
      ]);
      setIncident(data);
      setEvidence(evidenceList);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    if (!authLoading && user) loadIncident();
  }, [authLoading, user, loadIncident]);

  useIncidentSocket({
    incidentId,
    onUpdated: (updated) => {
      if (updated.id === incidentId) setIncident(updated);
    },
  });

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const data = await apiRequest<IncidentDetail>(`/incidents/${incidentId}/cancel`, 'POST');
      setIncident(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="glass metric-card shimmer" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-secondary)' }}>Loading incident status...</h3>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="glass alert alert-danger">
        <strong>Error:</strong> {error || 'Incident not found'}
        <div style={{ marginTop: '1rem' }}>
          <Link href="/dashboard/tourist" className="btn btn-secondary" style={{ width: 'auto' }}>
            Back to Safety Console
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <div className="glass metric-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-admin" style={{ marginBottom: '0.5rem' }}>LIVE TRACKING</span>
            <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>SOS Incident</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Safety ID: <code style={{ color: 'var(--primary)' }}>{incident.safetyId || 'N/A'}</code>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <StatusBadge status={incident.status} />
            <SeverityBadge severity={incident.severity} />
          </div>
        </div>

        <IncidentStepper incident={incident} />

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            Your Risk Assessment
          </h3>
          <RiskExplanationPanel
            riskScore={incident.riskScore}
            severity={incident.severity}
            riskExplanation={incident.riskExplanation}
            compact
          />
        </div>

        {incident.assignedResponderName && (
          <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
            <strong>Assigned Responder:</strong> {incident.assignedResponderName}
            {incident.assignedResponderUnit && ` (${incident.assignedResponderUnit})`}
          </div>
        )}

        {incident.status === 'CREATED' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="btn btn-secondary"
            style={{ marginTop: '1.5rem', width: '100%' }}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Accidental SOS'}
          </button>
        )}

        {incident.status === 'RESOLVED' && (
          <div className="alert alert-success" style={{ marginTop: '1.5rem' }}>
            <strong>You are safe.</strong> This incident has been resolved by the response team.
          </div>
        )}
      </div>

      <div className="glass metric-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <AuditTimeline incidentId={incidentId} events={incident.events} />
      </div>

      <div className="glass metric-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <EvidenceUpload
          incidentId={incidentId}
          evidence={evidence}
          onUploaded={(file) => {
            setEvidence((prev) => [file, ...prev]);
            loadIncident();
          }}
        />
      </div>

      <Link href="/dashboard/tourist" className="btn btn-secondary" style={{ width: 'auto' }}>
        Back to Safety Console
      </Link>
    </div>
  );
}