// apps/web/src/app/dashboard/tourist/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { apiRequest } from '../../../lib/api';
import { TouristProfile, Trip, IncidentDetail, IncidentSummary } from '@atlasguard/shared';
import Link from 'next/link';

export default function TouristDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(['TOURIST', 'ADMIN']);

  const [profile, setProfile] = useState<TouristProfile | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [sosStatus, setSosStatus] = useState<'IDLE' | 'PENDING' | 'TRIGGERED'>('IDLE');
  const [activeIncident, setActiveIncident] = useState<IncidentDetail | null>(null);
  const [sosError, setSosError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    loadSafetyContext();
  }, [authLoading, user]);

  const loadSafetyContext = async () => {
    try {
      // 1. Fetch profile
      const profileData = await apiRequest<TouristProfile>('/tourist/profile', 'GET');
      setProfile(profileData);

      // 2. Fetch active trip
      const tripData = await apiRequest<Trip>('/trips/active', 'GET');
      setActiveTrip(tripData);

      const incidents = await apiRequest<IncidentSummary[]>('/incidents/my', 'GET');
      const open = incidents.find((i) => !['RESOLVED', 'CANCELLED'].includes(i.status));
      if (open) {
        const detail = await apiRequest<IncidentDetail>(`/incidents/${open.id}/status`, 'GET');
        setActiveIncident(detail);
        setSosStatus('TRIGGERED');
      }
    } catch (err: any) {
      // Keep state values as null depending on request failures
    } finally {
      setLoading(false);
    }
  };

  const handleSos = async () => {
    setSosError(null);
    setSosStatus('PENDING');
    try {
      const incident = await apiRequest<IncidentDetail>('/incidents/sos', 'POST', {
        latitude: 27.3314,
        longitude: 88.6138,
      });
      setActiveIncident(incident);
      setSosStatus('TRIGGERED');
      router.push(`/dashboard/tourist/incident/${incident.id}`);
    } catch (err: any) {
      setSosStatus('IDLE');
      setSosError(err.message || 'Failed to trigger SOS');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="glass metric-card shimmer" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-secondary)' }}>Loading Safety Dashboard...</h3>
      </div>
    );
  }

  // State 1: No Profile Completed
  if (!profile) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', animation: 'fadeIn 0.5s ease-out' }}>
        <div className="glass metric-card" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '3.5rem' }}>📋</span>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '0.5rem' }}>Complete Your Safety Profile</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              AtlasGuard requires your basic contact number and emergency reference details to authorize safety monitoring and geofence tracking.
            </p>
          </div>
          <Link href="/dashboard/tourist/profile" className="btn btn-primary" style={{ width: 'auto' }}>
            Setup Profile Now
          </Link>
        </div>
      </div>
    );
  }

  // State 2: Profile complete but no Active Trip
  if (!activeTrip) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
        <div className="glass alert alert-info" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.8rem' }}>ℹ️</span>
          <p style={{ fontSize: '0.95rem' }}>
            Profile complete! Now, schedule an active trip session to generate a <strong>Safety ID</strong> and enable live geofencing alerts.
          </p>
        </div>

        <div className="glass metric-card" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '3rem' }}>🗺️</span>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '0.5rem' }}>No Active Trips Scheduled</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Configure your trip destination and dates to set up geofence notifications.
            </p>
          </div>
          <Link href="/dashboard/tourist/trip" className="btn btn-primary" style={{ width: 'auto' }}>
            Schedule Active Trip
          </Link>
        </div>

        {/* Display completed profile for reference */}
        <div className="glass metric-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Verified Emergency Contact card
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.8rem' }}>MY PHONE</span>
              <strong>{profile.phone}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.8rem' }}>EMERGENCY CONTACT</span>
              <strong>{profile.emergencyContactName || 'Not configured'} ({profile.emergencyContactPhone || 'N/A'})</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Fully set up (Display Active Trip + SOS trigger)
  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🗺️</span>
        <div>
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Live Geofence Monitoring</strong>
          Use the Safety Map to simulate your location and receive real-time zone alerts for {activeTrip.destinationName}.
          <Link href="/dashboard/tourist/map" className="btn btn-primary" style={{ width: 'auto', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            Open Safety Map
          </Link>
        </div>
      </div>

      {/* SOS Button Center */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2.5rem 0', gap: '1.5rem' }}>
        {sosStatus === 'IDLE' && (
          <button onClick={handleSos} className="btn btn-sos">
            <span>TRIGGER</span>
            <span style={{ fontSize: '2rem' }}>SOS</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.05em' }}>ONE-TAP RESCUE</span>
          </button>
        )}

        {sosStatus === 'PENDING' && (
          <button className="btn btn-sos shimmer" style={{ animation: 'none', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 8px 30px var(--accent-orange-glow)' }} disabled>
            <span>DISPATCHING</span>
            <span style={{ fontSize: '1.5rem' }}>PANIC</span>
            <span style={{ fontSize: '0.75rem' }}>ESTABLISHING...</span>
          </button>
        )}

        {sosStatus === 'TRIGGERED' && activeIncident && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-sos" style={{ animation: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 30px var(--accent-green-glow)' }}>
              <span>ACTIVE</span>
              <span style={{ fontSize: '2rem' }}>SOS</span>
              <span style={{ fontSize: '0.75rem' }}>ALERT SENT</span>
            </button>
            <div className="alert alert-success" style={{ margin: 0, padding: '0.75rem 1.25rem' }}>
              <strong>SOS Broadcast Active!</strong> Status: {activeIncident.status}. Track your incident live.
            </div>
            <Link
              href={`/dashboard/tourist/incident/${activeIncident.id}`}
              className="btn btn-primary"
              style={{ width: 'auto' }}
            >
              View Live Incident Status
            </Link>
          </div>
        )}

        {sosError && (
          <div className="alert alert-danger" style={{ maxWidth: '380px' }}>
            <strong>Error:</strong> {sosError}
          </div>
        )}

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '380px' }}>
          Tapping the button above will broadcast your Safety ID and location coordinates directly to local command centers.
        </p>
      </div>

      {/* Safety Session details and Emergency context side-by-side */}
      <div className="grid-cols-2">
        <div className="glass metric-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Active Safety Session
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Destination:</span>{' '}
              <strong style={{ color: '#ffffff' }}>{activeTrip.destinationName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Safety ID:</span>{' '}
              <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 600 }}>
                {activeTrip.safetyId}
              </code>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Session Duration:</span>{' '}
              <span>{new Date(activeTrip.startDate).toLocaleDateString()} - {new Date(activeTrip.endDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Active Monitoring:</span>{' '}
              <span className="badge badge-responder" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>Live Geofence</span>
            </div>
          </div>
        </div>

        <div className="glass metric-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Emergency Contact & Medical Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>My Phone:</span>{' '}
              <strong>{profile.phone}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Emergency Contact:</span>{' '}
              <strong>{profile.emergencyContactName || 'None'} ({profile.emergencyContactPhone || 'N/A'})</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Medical Warnings:</span>{' '}
              <span style={{ color: profile.medicalNotes ? 'var(--accent-orange)' : 'var(--text-primary)' }}>
                {profile.medicalNotes || 'No conditions reported'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Mobility Constraints:</span>{' '}
              <span>{profile.mobilityNeeds || 'None'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
