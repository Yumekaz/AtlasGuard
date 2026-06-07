import { RiskScoreExplanation } from '@atlasguard/shared';
import { SeverityBadge } from './StatusBadge';

export function getRiskScoreColor(score: number): string {
  if (score <= 30) return 'var(--accent-green)';
  if (score <= 55) return 'var(--accent-orange)';
  if (score <= 80) return '#f97316';
  return 'var(--accent-red)';
}

export function getRiskScoreBackground(score: number): string {
  if (score <= 30) return 'rgba(16, 185, 129, 0.12)';
  if (score <= 55) return 'rgba(245, 158, 11, 0.12)';
  if (score <= 80) return 'rgba(249, 115, 22, 0.15)';
  return 'rgba(239, 68, 68, 0.15)';
}

function parseExplanation(raw?: string): RiskScoreExplanation | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RiskScoreExplanation;
  } catch {
    return null;
  }
}

interface RiskExplanationPanelProps {
  riskScore: number;
  severity: RiskScoreExplanation['severity'];
  riskExplanation?: string;
  compact?: boolean;
}

export function RiskExplanationPanel({
  riskScore,
  severity,
  riskExplanation,
  compact = false,
}: RiskExplanationPanelProps) {
  const explanation = parseExplanation(riskExplanation);
  const reasons = explanation?.reasons ?? [];
  const color = getRiskScoreColor(riskScore);
  const background = getRiskScoreBackground(riskScore);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '0.75rem' : '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div
          style={{
            background,
            color,
            padding: compact ? '0.35rem 0.75rem' : '0.5rem 1rem',
            borderRadius: '6px',
            fontWeight: 700,
            fontFamily: 'monospace',
            fontSize: compact ? '0.9rem' : '1.1rem',
          }}
        >
          {riskScore}/100
        </div>
        <SeverityBadge severity={severity} />
        {!compact && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Computed at SOS trigger from geofence, profile, and responder proximity
          </span>
        )}
      </div>

      {reasons.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: compact ? '0.85rem' : '0.95rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Risk Factors
          </h4>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              fontSize: compact ? '0.85rem' : '0.9rem',
              color: 'var(--text-primary)',
            }}
          >
            {reasons.map((reason, index) => (
              <li key={`${reason}-${index}`}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}