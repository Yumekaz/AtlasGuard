// apps/web/src/app/dashboard/responder/page.tsx
'use client';

import { useAuth } from '../../../hooks/useAuth';

export default function ResponderDashboard() {
  const { user, loading } = useAuth(['RESPONDER', 'ADMIN']);

  if (loading || !user) {
    return null;
  }

  // Mock Active Assignments
  const activeAssignments = [
    {
      id: 'case-109',
      tourist: 'Alice Smith',
      location: 'Viewpoint Ridge (Zone 3)',
      nature: 'SOS Panic Signal',
      medicalNote: 'Asthma - Requires inhaler',
      assignedTime: '10:43 AM',
      status: 'ASSIGNED',
    },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {activeAssignments.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No active emergency cases currently assigned to your unit.</p>
        </div>
      ) : (
        activeAssignments.map((assignment) => (
          <div key={assignment.id} className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
            {/* Header section of case */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-admin" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>ACTIVE RESCUE</span>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff' }}>Case ID: {assignment.id}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Assigned at:</span>
                <strong style={{ display: 'block', color: 'var(--primary)' }}>{assignment.assignedTime}</strong>
              </div>
            </div>

            {/* Case particulars */}
            <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Traveler Context</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <div>Name: <strong>{assignment.tourist}</strong></div>
                  <div>Reported Location: <strong>{assignment.location}</strong></div>
                  <div>Report Type: <strong style={{ color: 'var(--accent-red)' }}>{assignment.nature}</strong></div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Safety Flags</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <div>Medical Details: <strong style={{ color: 'var(--accent-orange)' }}>{assignment.medicalNote}</strong></div>
                  <div>Backup Unit: <strong>Police Patrol 2 (Dispatched)</strong></div>
                </div>
              </div>
            </div>

            {/* Workflow Control Interface */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '1rem' }}>Operational Workflow Tracker</h3>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ flex: 1, minWidth: '150px' }}>
                  Mark Dispatched
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, minWidth: '150px' }} disabled>
                  Mark Reached
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, minWidth: '150px' }} disabled>
                  Resolve Case
                </button>
              </div>

              <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                * Changing state will instantly trigger system-wide WebSocket notifications to operators and audit logs.
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
