import {
  INCIDENT_STATUS_LABELS,
  INCIDENT_STATUS_ORDER,
  IncidentDetail,
  IncidentStatus,
} from '@atlasguard/shared';

function statusIndex(status: IncidentStatus): number {
  if (status === 'CANCELLED') return -1;
  return INCIDENT_STATUS_ORDER.indexOf(status);
}

export function IncidentStepper({ incident }: { incident: IncidentDetail }) {
  if (incident.status === 'CANCELLED') {
    return (
      <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
        <strong>SOS Cancelled</strong> — This incident was cancelled before help was dispatched.
      </div>
    );
  }

  const currentIdx = statusIndex(incident.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {INCIDENT_STATUS_ORDER.map((step, idx) => {
        const isComplete = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div
            key={step}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: isCurrent
                ? 'rgba(6,182,212,0.12)'
                : isComplete
                ? 'rgba(16,185,129,0.08)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${
                isCurrent
                  ? 'rgba(6,182,212,0.35)'
                  : isComplete
                  ? 'rgba(16,185,129,0.2)'
                  : 'var(--border-color)'
              }`,
            }}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              {isComplete ? (isCurrent && step !== 'RESOLVED' ? '●' : '✓') : '○'}
            </span>
            <div>
              <strong style={{ display: 'block', color: isComplete ? '#fff' : 'var(--text-secondary)' }}>
                {step.replace('_', ' ')}
              </strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {INCIDENT_STATUS_LABELS[step]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}