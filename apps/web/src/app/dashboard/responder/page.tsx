'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiRequest } from '../../../lib/api';
import { useIncidentSocket } from '../../../hooks/useIncidentSocket';
import { EvidenceFile, IncidentDetail, IncidentSummary } from '@atlasguard/shared';
import { StatusBadge, SeverityBadge } from '../../../components/StatusBadge';
import { RiskExplanationPanel } from '../../../components/RiskExplanationPanel';
import { EvidenceUpload } from '../../../components/EvidenceUpload';

export default function ResponderDashboard() {
  const { user, loading } = useAuth(['RESPONDER', 'ADMIN']);

  const [assignments, setAssignments] = useState<IncidentSummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [evidenceMap, setEvidenceMap] = useState<Record<string, EvidenceFile[]>>({});

  const loadAssignments = useCallback(async () => {
    try {
      const data = await apiRequest<IncidentSummary[]>('/responder/assignments', 'GET');
      setAssignments(data);
      const evidenceEntries = await Promise.all(
        data.map(async (a) => {
          const files = await apiRequest<EvidenceFile[]>(`/incidents/${a.id}/evidence`, 'GET').catch(() => []);
          return [a.id, files] as const;
        }),
      );
      setEvidenceMap(Object.fromEntries(evidenceEntries));
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) loadAssignments();
  }, [loading, user, loadAssignments]);

  const upsertAssignment = (updated: IncidentDetail) => {
    const summary: IncidentSummary = {
      id: updated.id,
      type: updated.type,
      status: updated.status,
      severity: updated.severity,
      latitude: updated.latitude,
      longitude: updated.longitude,
      riskScore: updated.riskScore,
      touristName: updated.touristName,
      safetyId: updated.safetyId,
      destinationName: updated.destinationName,
      assignedResponderName: updated.assignedResponderName,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    setAssignments((prev) => {
      if (summary.status === 'RESOLVED' || summary.status === 'CANCELLED') {
        return prev.filter((i) => i.id !== summary.id);
      }
      const exists = prev.find((i) => i.id === summary.id);
      if (exists) return prev.map((i) => (i.id === summary.id ? summary : i));
      return [summary, ...prev];
    });
  };

  useIncidentSocket({
    onAssigned: () => loadAssignments(),
    onUpdated: upsertAssignment,
  });

  const transition = async (id: string, endpoint: string) => {
    setActionLoading(id);
    setFeedback(null);
    try {
      const updated = await apiRequest<IncidentDetail>(`/responder/incidents/${id}/${endpoint}`, 'POST');
      upsertAssignment(updated);
      setFeedback({ type: 'success', message: `Status updated to ${updated.status}` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user) return null;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem' }}>
          {feedback.message}
        </div>
      )}

      {loadingData ? (
        <div className="glass metric-card shimmer" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No active emergency cases currently assigned to your unit.</p>
        </div>
      ) : (
        assignments.map((assignment) => (
          <div key={assignment.id} className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-admin" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>ACTIVE RESCUE</span>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff' }}>{assignment.type} — {assignment.touristName}</h2>
              </div>
              <StatusBadge status={assignment.status} />
            </div>

            <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Traveler Context</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <div>Name: <strong>{assignment.touristName}</strong></div>
                  <div>Location: <strong>{assignment.destinationName || `${assignment.latitude}, ${assignment.longitude}`}</strong></div>
                  <div>Safety ID: <strong>{assignment.safetyId || 'N/A'}</strong></div>
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Incident Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Severity:</span>
                    <SeverityBadge severity={assignment.severity} />
                  </div>
                  <RiskExplanationPanel
                    riskScore={assignment.riskScore}
                    severity={assignment.severity}
                    compact
                  />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '1rem' }}>Operational Workflow Tracker</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => transition(assignment.id, 'dispatched')}
                  disabled={assignment.status !== 'ASSIGNED' || actionLoading === assignment.id}
                  className="btn btn-primary"
                  style={{ flex: 1, minWidth: '150px' }}
                >
                  Mark Dispatched
                </button>
                <button
                  onClick={() => transition(assignment.id, 'reached')}
                  disabled={assignment.status !== 'DISPATCHED' || actionLoading === assignment.id}
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '150px' }}
                >
                  Mark Reached
                </button>
                <button
                  onClick={() => transition(assignment.id, 'resolved')}
                  disabled={assignment.status !== 'REACHED' || actionLoading === assignment.id}
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '150px' }}
                >
                  Resolve Case
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <EvidenceUpload
                incidentId={assignment.id}
                evidence={evidenceMap[assignment.id] ?? []}
                onUploaded={(file) => {
                  setEvidenceMap((prev) => ({
                    ...prev,
                    [assignment.id]: [file, ...(prev[assignment.id] ?? [])],
                  }));
                }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}