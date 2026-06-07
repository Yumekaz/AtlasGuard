import { IncidentSeverity, IncidentStatus } from '@atlasguard/shared';

const STATUS_CLASS: Record<IncidentStatus, string> = {
  CREATED: 'badge-admin',
  ACKNOWLEDGED: 'badge-operator',
  ASSIGNED: 'badge-role',
  DISPATCHED: 'badge-responder',
  REACHED: 'badge-operator',
  RESOLVED: 'badge-responder',
  CANCELLED: 'badge-role',
};

const SEVERITY_CLASS: Record<IncidentSeverity, string> = {
  LOW: 'badge-role',
  MEDIUM: 'badge-operator',
  HIGH: 'badge-admin',
  CRITICAL: 'badge-admin',
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span className={`badge ${STATUS_CLASS[status]}`} style={{ fontSize: '0.75rem' }}>
      {status}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  return (
    <span className={`badge ${SEVERITY_CLASS[severity]}`} style={{ fontSize: '0.75rem' }}>
      {severity}
    </span>
  );
}