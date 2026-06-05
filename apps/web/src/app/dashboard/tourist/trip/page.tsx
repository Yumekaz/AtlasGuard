// apps/web/src/app/dashboard/tourist/trip/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { apiRequest } from '../../../../lib/api';
import { Trip } from '@atlasguard/shared';
import Link from 'next/link';

export default function TouristTripPage() {
  const { user, loading: authLoading } = useAuth(['TOURIST', 'ADMIN']);
  
  const [destinationName, setDestinationName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noProfile, setNoProfile] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    fetchTripDetails();
  }, [authLoading, user]);

  const fetchTripDetails = async () => {
    setError(null);
    try {
      const trip = await apiRequest<Trip>('/trips/active', 'GET');
      setActiveTrip(trip);
    } catch (err: any) {
      if (err.message.includes('complete your safety profile')) {
        setNoProfile(true);
      } else {
        // A 404 is normal if no trip is scheduled
        setActiveTrip(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const trip = await apiRequest<Trip>('/trips', 'POST', {
        destinationName,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      setActiveTrip(trip);
      setDestinationName('');
      setStartDate('');
      setEndDate('');
    } catch (err: any) {
      setError(err.message || 'Failed to schedule trip. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="glass metric-card shimmer" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-secondary)' }}>Loading Trip Schedule...</h3>
      </div>
    );
  }

  if (noProfile) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
        <div className="glass alert alert-warning" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '0.5rem' }}>Profile Completion Required</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              You must complete your emergency safety profile (including your phone number and emergency contacts) before configuring an active trip.
            </p>
          </div>
          <Link href="/dashboard/tourist/profile" className="btn btn-primary" style={{ width: 'auto' }}>
            Complete Safety Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      {/* If Active Trip exists, show details card */}
      {activeTrip ? (
        <div className="glass metric-card" style={{ padding: '2.5rem', border: '1px solid rgba(6,182,212,0.3)', boxShadow: '0 8px 30px var(--primary-glow)' }}>
          <span className="badge badge-role" style={{ marginBottom: '0.5rem' }}>ACTIVE SAFETY SESSION</span>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '1.5rem', color: '#ffffff', fontFamily: 'var(--font-family-title)' }}>
            {activeTrip.destinationName}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.05rem', margin: '2rem 0', padding: '1.5rem', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Temporary Safety ID:</span>
              <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '1.2rem' }}>
                {activeTrip.safetyId}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Arrival Date:</span>
              <span>{new Date(activeTrip.startDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Departure Date:</span>
              <span>{new Date(activeTrip.endDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <Link href="/dashboard/tourist" className="btn btn-primary" style={{ flex: 1 }}>
              Go to Safety Console
            </Link>
            <button 
              onClick={() => {
                // Instantly trigger transition of existing trip to complete to let them test form
                apiRequest(`/trips`, 'POST', {
                  destinationName: activeTrip.destinationName,
                  startDate: new Date().toISOString(),
                  endDate: new Date().toISOString()
                }).then(() => fetchTripDetails());
              }}
              className="btn btn-secondary" 
              style={{ flex: 1 }}
            >
              Force New Trip Setup
            </button>
          </div>
        </div>
      ) : (
        /* If No Active Trip exists, show creation form */
        <div className="glass metric-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Schedule Active Trip
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Registering a trip generates a temporary Safety ID that authorities use to trace geofence boundaries and coordinate responder teams.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              <strong>Error: </strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="destination">Destination Name</label>
              <input
                id="destination"
                type="text"
                className="form-input"
                placeholder="e.g. Gangtok, Sikkim"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                required
              />
            </div>

            <div className="grid-cols-2" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="startDate">Arrival Date</label>
                <input
                  id="startDate"
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="endDate">Departure Date</label>
                <input
                  id="endDate"
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '1rem' }}>
              {submitting ? 'Generating Safety ID...' : 'Register Trip & Safety ID'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
