'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiRequest } from '../../../lib/api';
import { useIncidentSocket } from '../../../hooks/useIncidentSocket';
import { DashboardSummary, GeofenceAlertPayload, IncidentDetail, IncidentSummary, OpsMapData, ResponderSummary } from '@atlasguard/shared';
import { StatusBadge, SeverityBadge } from '../../../components/StatusBadge';
import { RiskExplanationPanel, getRiskScoreColor } from '../../../components/RiskExplanationPanel';
import AtlasMap, { MapLayers } from '../../../components/AtlasMap';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
}

export default function OperatorDashboard() {
  const { user, loading } = useAuth(['OPERATOR', 'ADMIN']);

  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [responders, setResponders] = useState<ResponderSummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<IncidentSummary | null>(null);
  const [selectedResponder, setSelectedResponder] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<OpsMapData | null>(null);
  const [mapLayers, setMapLayers] = useState<MapLayers>({
    zones: true,
    incidents: true,
    responders: true,
    tourist: false,
  });
  const [geofenceAlert, setGeofenceAlert] = useState<GeofenceAlertPayload | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryWarning, setSummaryWarning] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentDetail | null>(null);
  const summaryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadIncidents = useCallback(async () => {
    try {
      const data = await apiRequest<IncidentSummary[]>('/ops/incidents', 'GET');
      setIncidents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  const loadResponders = useCallback(async () => {
    try {
      const data = await apiRequest<ResponderSummary[]>('/ops/responders', 'GET');
      setResponders(data);
    } catch {
      // non-fatal
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const data = await apiRequest<DashboardSummary>('/ops/dashboard/summary', 'GET');
      setSummary(data);
      setSummaryWarning(null);
    } catch (err: any) {
      setSummaryWarning(err.message || 'Dashboard summary unavailable');
    }
  }, []);

  const scheduleSummaryRefresh = useCallback(() => {
    if (summaryDebounceRef.current) clearTimeout(summaryDebounceRef.current);
    summaryDebounceRef.current = setTimeout(() => {
      loadSummary();
    }, 500);
  }, [loadSummary]);

  const loadMapData = useCallback(async () => {
    try {
      const [data] = await Promise.all([
        apiRequest<OpsMapData>('/ops/map', 'GET'),
        loadSummary(),
      ]);
      setMapData(data);
      setIncidents(data.incidents);
      setResponders(data.responders);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  }, [loadSummary]);

  useEffect(() => {
    if (!loading && user) {
      loadMapData();
    }
  }, [loading, user, loadMapData]);

  useEffect(() => {
    return () => {
      if (summaryDebounceRef.current) clearTimeout(summaryDebounceRef.current);
    };
  }, []);

  const upsertIncident = (updated: IncidentDetail) => {
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

    setIncidents((prev) => {
      const exists = prev.find((i) => i.id === summary.id);
      if (summary.status === 'RESOLVED' || summary.status === 'CANCELLED') {
        return prev.filter((i) => i.id !== summary.id);
      }
      if (exists) {
        return prev.map((i) => (i.id === summary.id ? summary : i));
      }
      return [summary, ...prev];
    });
  };

  const handleSocketIncident = (updated: IncidentDetail) => {
    upsertIncident(updated);
    scheduleSummaryRefresh();
  };

  useIncidentSocket({
    onCreated: handleSocketIncident,
    onUpdated: handleSocketIncident,
    onGeofenceAlert: (alert) => setGeofenceAlert(alert),
  });

  const toggleLayer = (key: keyof MapLayers) => {
    setMapLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadIncidentDetail = async (id: string) => {
    try {
      const detail = await apiRequest<IncidentDetail>(`/ops/incidents/${id}`, 'GET');
      setSelectedIncident(detail);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAcknowledge = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      const updated = await apiRequest<IncidentDetail>(`/ops/incidents/${id}/acknowledge`, 'POST');
      upsertIncident(updated);
      setSelectedIncident(updated);
      loadSummary();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedResponder) return;
    setActionLoading(assignModal.id);
    setError(null);
    try {
      const updated = await apiRequest<IncidentDetail>(
        `/ops/incidents/${assignModal.id}/assign`,
        'POST',
        { responderId: selectedResponder },
      );
      upsertIncident(updated);
      setAssignModal(null);
      setSelectedResponder('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user) return null;

  const sosCount = incidents.filter((i) => i.type === 'SOS').length;
  const availableResponders = responders.filter((r) => r.availabilityStatus === 'AVAILABLE').length;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="grid-cols-4">
        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Active</span>
            <span style={{ color: 'var(--accent-orange)', fontSize: '1.25rem' }}>●</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-orange)' }}>
            {summary?.totalActive ?? incidents.length}
          </div>
          <div className="metric-desc">Open incidents</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Critical Cases</span>
            <span style={{ color: 'var(--accent-red)', fontSize: '1.25rem' }}>●</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-red)' }}>
            {summary?.criticalCount ?? incidents.filter((i) => i.severity === 'CRITICAL').length}
          </div>
          <div className="metric-desc">Severity CRITICAL</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Avg Response</span>
            <span style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>⏱</span>
          </div>
          <div className="metric-value" style={{ fontSize: '1.4rem' }}>
            {summary?.averageResponseTimeMinutes != null
              ? `${summary.averageResponseTimeMinutes}m`
              : '—'}
          </div>
          <div className="metric-desc">CREATED → ACKNOWLEDGED</div>
        </div>

        <div className="glass metric-card">
          <div className="metric-header">
            <span className="metric-title">Resolved Today</span>
            <span style={{ color: 'var(--accent-green)', fontSize: '1.25rem' }}>✓</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-green)' }}>
            {summary?.resolvedToday ?? 0}
          </div>
          <div className="metric-desc">{sosCount} SOS active · {availableResponders} responders free</div>
        </div>
      </div>

      {summary && (
        <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
          {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => (
            <div key={level} className="glass metric-card" style={{ padding: '1rem 1.25rem' }}>
              <div className="metric-header">
                <span className="metric-title">{level}</span>
                <SeverityBadge severity={level} />
              </div>
              <div className="metric-value" style={{ fontSize: '1.5rem' }}>
                {summary.activeBySeverity[level]}
              </div>
            </div>
          ))}
        </div>
      )}

      {summaryWarning && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <strong>Summary:</strong> {summaryWarning}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {geofenceAlert && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <strong>Geofence Alert</strong>
          {geofenceAlert.touristName && ` — ${geofenceAlert.touristName}`}: {geofenceAlert.message}
        </div>
      )}

      <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Operations Map</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['zones', 'incidents', 'responders'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => toggleLayer(layer)}
                className={`btn ${mapLayers[layer] ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: 'auto', fontSize: '0.75rem', padding: '0.35rem 0.7rem', textTransform: 'capitalize' }}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>
        {mapData ? (
          <AtlasMap
            zones={mapData.zones}
            incidents={incidents}
            responders={responders}
            layers={mapLayers}
            height="380px"
          />
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Loading map data...</p>
        )}
      </div>

      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Active Operations Queue</span>
          <span className="badge badge-role" style={{ fontSize: '0.75rem' }}>Live Feed</span>
        </h3>

        {loadingData ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading incidents...</p>
        ) : incidents.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No active incidents. Waiting for SOS signals...
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
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
                {incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => loadIncidentDetail(incident.id)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      height: '60px',
                      cursor: 'pointer',
                      background: selectedIncident?.id === incident.id ? 'rgba(99,102,241,0.08)' : undefined,
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ display: 'block', color: '#ffffff' }}>{incident.type}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {incident.touristName}
                        {incident.safetyId && ` · ${incident.safetyId}`}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {incident.destinationName || `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <code style={{ background: 'rgba(255,255,255,0.05)', color: getRiskScoreColor(incident.riskScore), padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                        {incident.riskScore}/100
                      </code>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusBadge status={incident.status} />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {timeAgo(incident.createdAt)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {incident.status === 'CREATED' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAcknowledge(incident.id); }}
                            disabled={actionLoading === incident.id}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: 'auto' }}
                          >
                            Acknowledge
                          </button>
                        )}
                        {incident.status === 'ACKNOWLEDGED' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setAssignModal(incident); loadResponders(); }}
                            disabled={actionLoading === incident.id}
                            className="btn btn-primary"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: 'auto' }}
                          >
                            Assign Responder
                          </button>
                        )}
                        {['ASSIGNED', 'DISPATCHED', 'REACHED'].includes(incident.status) && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {incident.assignedResponderName || 'Assigned'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedIncident && (
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
            Risk Analysis — {selectedIncident.touristName}
          </h3>
          <RiskExplanationPanel
            riskScore={selectedIncident.riskScore}
            severity={selectedIncident.severity}
            riskExplanation={selectedIncident.riskExplanation}
          />
        </div>
      )}

      {assignModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="glass metric-card" style={{ padding: '2rem', width: '100%', maxWidth: '480px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Assign Responder</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Incident: {assignModal.type} — {assignModal.touristName}
            </p>
            <div className="form-group">
              <label className="form-label">Select Responder Unit</label>
              <select
                className="form-input"
                value={selectedResponder}
                onChange={(e) => setSelectedResponder(e.target.value)}
              >
                <option value="">Choose a responder...</option>
                {responders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.unitName} ({r.availabilityStatus})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={handleAssign} disabled={!selectedResponder} className="btn btn-primary" style={{ flex: 1 }}>
                Confirm Assignment
              </button>
              <button onClick={() => { setAssignModal(null); setSelectedResponder(''); }} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}